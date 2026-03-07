import { NextRequest, NextResponse } from 'next/server';
import { openai, isOpenAIConfigured } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const { questions, score, total, totalTime } = await request.json();

    if (!isOpenAIConfigured()) {
      const pct = Math.round((score / total) * 100);
      return NextResponse.json({
        analysis: `You scored ${score}/${total} (${pct}%). ${
          pct >= 70
            ? 'Good work! Keep reviewing the ones you missed.'
            : 'Focus on reviewing the terms you missed and try again.'
        }`,
      });
    }

    // Build a summary of performance
    const missed = questions.filter((q: { isCorrect: boolean }) => !q.isCorrect);
    const missedSummary = missed
      .slice(0, 10)
      .map((q: { term: string; correctAnswer: string; userAnswer: string }) =>
        `${q.term}: answered "${q.userAnswer}", correct was "${q.correctAnswer}"`
      )
      .join('; ');

    const systemMap: Record<string, { correct: number; total: number }> = {};
    questions.forEach((q: { term: string; isCorrect: boolean }) => {
      // Group by first word as proxy for system
      const key = q.term.split('/')[0] || 'General';
      if (!systemMap[key]) systemMap[key] = { correct: 0, total: 0 };
      systemMap[key].total++;
      if (q.isCorrect) systemMap[key].correct++;
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are analyzing CPC medical coding exam quiz results. Give a 3-4 sentence summary: what they did well, what to focus on, and encouragement. Be specific about medical terminology areas to study.`,
        },
        {
          role: 'user',
          content: `Quiz results: ${score}/${total} correct (${Math.round((score / total) * 100)}%).
Total time: ${Math.round(totalTime / 60)} minutes.
Average time per question: ${Math.round(totalTime / total)}s.
Missed questions: ${missedSummary || 'None!'}`,
        },
      ],
      temperature: 0.5,
      max_tokens: 300,
    });

    const analysis = completion.choices[0]?.message?.content || 'Analysis unavailable.';

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Analyze error:', error);
    return NextResponse.json({
      analysis: 'AI analysis unavailable. Review your missed questions above to identify areas for improvement.',
    });
  }
}
