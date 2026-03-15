import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GeneratedScenario } from '@/types';

let openai: OpenAI | null = null;
function getOpenAI() {
  if (!openai) openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openai;
}

const normCode = (codes: string[]) =>
  codes
    .map((c) => c.trim().toUpperCase().replace(/\s/g, ''))
    .sort()
    .join(',');

export async function POST(request: NextRequest) {
  try {
    const { scenario, userCpt, userIcd10 } = (await request.json()) as {
      scenario: GeneratedScenario;
      userCpt: string[];
      userIcd10: string[];
    };

    const cptExact = normCode(userCpt) === normCode(scenario.correctCpt);
    const icd10Exact = normCode(userIcd10) === normCode(scenario.correctIcd10);

    // Short-circuit: both exact match, no AI needed
    if (cptExact && icd10Exact) {
      return NextResponse.json({
        cptCorrect: true,
        icd10Correct: true,
        cptFeedback: `✅ Correct! ${scenario.cptRationale}`,
        icd10Feedback: `✅ Correct! ${scenario.icd10Rationale}`,
      });
    }

    const prompt = `You are a CPC exam grader. Evaluate a student's medical coding attempt for the following scenario.

CLINICAL SCENARIO:
${scenario.clinicalNote}

CPT CODING:
Correct CPT code(s): ${scenario.correctCpt.join(', ')}
Student's CPT code(s): ${userCpt.join(', ') || '(none entered)'}
Why the correct CPT is right: ${scenario.cptRationale}

ICD-10 CODING:
Correct ICD-10 code(s): ${scenario.correctIcd10.join(', ')}
Student's ICD-10 code(s): ${userIcd10.join(', ') || '(none entered)'}
Why the correct ICD-10 is right: ${scenario.icd10Rationale}

Return JSON:
{
  "cptCorrect": boolean,
  "icd10Correct": boolean,
  "cptFeedback": "1-2 sentences. If correct: confirm why it's right and reinforce the concept. If wrong: explain exactly what mistake was made and what the correct code means.",
  "icd10Feedback": "1-2 sentences. Same format as cptFeedback."
}

GRADING RULES:
- CPT: Mark correct if student got the right base procedure code, even if modifier is wrong or missing. Note modifier in feedback.
- ICD-10: Mark correct if student got the right 3-character category but wrong specificity (note what specificity was needed). Mark wrong if wrong category entirely.
- Be educational in feedback, not just "wrong". Explain the concept.
- Tone: encouraging but precise — this is a learning tool.`;

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}') as {
      cptCorrect?: boolean;
      icd10Correct?: boolean;
      cptFeedback?: string;
      icd10Feedback?: string;
    };

    return NextResponse.json({
      cptCorrect: result.cptCorrect ?? cptExact,
      icd10Correct: result.icd10Correct ?? icd10Exact,
      cptFeedback:
        result.cptFeedback ||
        (cptExact
          ? `✅ ${scenario.cptRationale}`
          : `❌ Correct: ${scenario.correctCpt.join(', ')}. ${scenario.cptRationale}`),
      icd10Feedback:
        result.icd10Feedback ||
        (icd10Exact
          ? `✅ ${scenario.icd10Rationale}`
          : `❌ Correct: ${scenario.correctIcd10.join(', ')}. ${scenario.icd10Rationale}`),
    });
  } catch (err) {
    console.error('Scenario validate error:', err);
    return NextResponse.json({ error: 'Validation failed' }, { status: 500 });
  }
}
