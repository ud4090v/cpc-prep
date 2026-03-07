import { NextRequest, NextResponse } from 'next/server';
import { openai, isOpenAIConfigured } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const { cardId, userAnswer, correctAnswer, term, definition } = await request.json();

    if (!userAnswer || !correctAnswer) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Simple exact match check first
    const exactMatch = userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();

    if (!isOpenAIConfigured()) {
      // Fallback: simple matching
      return NextResponse.json({
        isCorrect: exactMatch,
        confidence: exactMatch ? 'exact' : 'wrong',
        feedback: exactMatch
          ? 'Correct! Great job.'
          : `Not quite. The correct answer is: ${correctAnswer}`,
      });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are evaluating answers for a CPC medical coding exam study app.
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
      isCorrect: result.isCorrect ?? exactMatch,
      confidence: result.confidence ?? (exactMatch ? 'exact' : 'wrong'),
      feedback: result.feedback ?? (exactMatch ? 'Correct!' : `The correct answer is: ${correctAnswer}`),
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
