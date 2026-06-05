import { NextRequest, NextResponse } from 'next/server';
import { openai, isOpenAIConfigured } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const { cardId, userAnswer, correctAnswer, term, definition } = await request.json();

    if (!userAnswer || !correctAnswer) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Exact match check first — always authoritative
    const ua = userAnswer.toLowerCase().trim();
    const ca = correctAnswer.toLowerCase().trim();
    const exactMatch = ua === ca;

    // If exact match, return immediately — no need for AI
    if (exactMatch) {
      return NextResponse.json({
        isCorrect: true,
        confidence: 'exact',
        feedback: 'Correct! Great job.',
      });
    }

    // Only use AI for non-exact matches (fuzzy/close answers)
    if (isOpenAIConfigured()) {
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are evaluating answers for a CPT medical coding exam study app.
Be generous with partial credit — if the student understands the concept, mark correct.
Return JSON only: { "isCorrect": boolean, "confidence": "exact"|"close"|"wrong", "feedback": string }
feedback should be 1-2 sentences max: encouraging if correct, helpful if wrong.`,
            },
            {
              role: 'user',
              content: `Term: "${term}"
Correct definition: "${correctAnswer}"
Student's answer: "${userAnswer}"

Evaluate the student's answer.`,
            },
          ],
          temperature: 0.3,
          max_tokens: 200,
          response_format: { type: 'json_object' },
        });

        const content = completion.choices[0]?.message?.content || '';
        const result = JSON.parse(content);

        return NextResponse.json({
          isCorrect: result.isCorrect ?? false,
          confidence: result.confidence ?? 'wrong',
          feedback: result.feedback ?? `The correct answer is: ${correctAnswer}`,
        });
      } catch (aiError) {
        console.error('AI evaluate error:', aiError);
        // Fall through to basic wrong response
      }
    }

    // No AI available or AI failed — mark wrong
    return NextResponse.json({
      isCorrect: false,
      confidence: 'wrong',
      feedback: `Not quite. The correct answer is: ${correctAnswer}`,
    });
  } catch (error) {
    console.error('Evaluate error:', error);
    return NextResponse.json({
      isCorrect: false,
      confidence: 'wrong',
      feedback: 'Error evaluating answer. Please try again.',
    });
  }
}
