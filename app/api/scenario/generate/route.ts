import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { readFileSync } from 'fs';
import { join } from 'path';
import { GeneratedScenario, ScenarioAnswerMode } from '@/types';

let openai: OpenAI | null = null;
function getOpenAI() {
  if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai;
}

type CptEntry = { range: string; description: string };
type SystemCtx = {
  cpt_ranges: CptEntry[];
  icd10_categories: CptEntry[];
  common_scenarios: string[];
};
type CodingCtx = {
  systems: Record<string, SystemCtx>;
  difficulty_guidance: Record<string, string>;
};

const codingContext: CodingCtx = JSON.parse(
  readFileSync(join(process.cwd(), 'data', 'coding-context.json'), 'utf-8')
);

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function POST(request: NextRequest) {
  try {
    const { system, difficulty, answerMode } = (await request.json()) as {
      system: string;
      difficulty: 'easy' | 'medium' | 'hard';
      answerMode: ScenarioAnswerMode;
    };

    const systemKeys = Object.keys(codingContext.systems);
    const resolvedSystem =
      system === 'random'
        ? systemKeys[Math.floor(Math.random() * systemKeys.length)]
        : system;

    const ctx = codingContext.systems[resolvedSystem];
    if (!ctx) return NextResponse.json({ error: 'Unknown system' }, { status: 400 });

    const diffGuide = codingContext.difficulty_guidance[difficulty];
    const needsDistractors = answerMode === 'mc';

    const systemPrompt = `You are a CPC (Certified Professional Coder) exam question writer with 15 years of experience creating realistic medical coding scenarios for exam practice.

CRITICAL RULES:
- Every CPT and ICD-10 code you use MUST be a real, currently valid code
- Only use CPT codes from the ranges listed below — do not invent codes
- Only use ICD-10 codes from the categories listed below
- The clinical scenario must be unambiguous — one clearly correct answer
- Write the clinical note in the style of a real medical record: concise, professional, third person
- Difficulty level: ${diffGuide}

BODY SYSTEM: ${resolvedSystem}

RELEVANT CPT RANGES:
${ctx.cpt_ranges.map((r) => `${r.range}: ${r.description}`).join('\n')}

RELEVANT ICD-10 CATEGORIES:
${ctx.icd10_categories.map((r) => `${r.range}: ${r.description}`).join('\n')}

COMMON SCENARIOS FOR THIS SYSTEM: ${ctx.common_scenarios.join(', ')}`;

    const userPrompt = `Generate a ${difficulty} difficulty CPC exam scenario for the ${resolvedSystem}.

Return ONLY valid JSON with this structure:
{
  "clinicalNote": "2-4 sentence patient encounter note. Include: patient age/sex, chief complaint or reason for visit, what procedure the physician performed, and the final diagnosis.",
  "correctCpt": ["CPTCODE"],
  "correctIcd10": ["ICD10CODE"],
  "cptRationale": "1-2 sentences: what this CPT code represents and why it is correct for this scenario.",
  "icd10Rationale": "1-2 sentences: what this ICD-10 code represents and why it is correct.",
  "codingTips": "One practical sentence about common mistakes, modifiers, or specificity pitfalls for this scenario — or null."${
    needsDistractors
      ? `,
  "cptDistractors": ["CODE1", "CODE2", "CODE3"],
  "icd10Distractors": ["CODE1", "CODE2", "CODE3"]`
      : ''
  }
}

${difficulty === 'hard' ? 'For hard difficulty: include multiple CPT codes in correctCpt array if multiple separately reportable procedures were performed.' : ''}
${needsDistractors ? 'DISTRACTOR RULES: Each distractor must be a real, valid code from the same system. Make them plausible wrong answers — not obviously unrelated. A student who did not study carefully should be tempted by them.' : ''}

Return ONLY the raw JSON object. No markdown. No explanation outside the JSON.`;

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      response_format: { type: 'json_object' },
    });

    const raw = JSON.parse(completion.choices[0].message.content || '{}') as {
      clinicalNote: string;
      correctCpt: string[];
      correctIcd10: string[];
      cptRationale: string;
      icd10Rationale: string;
      codingTips?: string;
      cptDistractors?: string[];
      icd10Distractors?: string[];
    };

    const cptOptions = needsDistractors
      ? shuffle([...raw.correctCpt, ...(raw.cptDistractors || []).slice(0, 3)])
      : undefined;
    const icd10Options = needsDistractors
      ? shuffle([...raw.correctIcd10, ...(raw.icd10Distractors || []).slice(0, 3)])
      : undefined;

    const scenario: GeneratedScenario = {
      id: crypto.randomUUID(),
      system: resolvedSystem,
      difficulty,
      clinicalNote: raw.clinicalNote,
      correctCpt: raw.correctCpt,
      correctIcd10: raw.correctIcd10,
      cptOptions,
      icd10Options,
      cptRationale: raw.cptRationale,
      icd10Rationale: raw.icd10Rationale,
      codingTips: raw.codingTips || undefined,
    };

    return NextResponse.json({ scenario });
  } catch (err) {
    console.error('Scenario generate error:', err);
    return NextResponse.json({ error: 'Failed to generate scenario' }, { status: 500 });
  }
}
