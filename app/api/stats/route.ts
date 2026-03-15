import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        totalAttempts: 0,
        totalCorrect: 0,
        accuracy: 0,
        cardsStudied: 0,
        sessions: [],
        weakCards: [],
      });
    }

    // Get card stats
    const { data: cardStats } = await supabaseAdmin
      .from('card_stats')
      .select('*');

    const totalAttempts = cardStats?.reduce((sum: number, cs: { attempts: number }) => sum + cs.attempts, 0) || 0;
    const totalCorrect = cardStats?.reduce((sum: number, cs: { correct: number }) => sum + cs.correct, 0) || 0;
    const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
    const cardsStudied = cardStats?.length || 0;

    // Weak cards (< 50% accuracy)
    const weakCards = cardStats
      ?.filter((cs: { attempts: number; correct: number }) => cs.attempts >= 2 && (cs.correct / cs.attempts) < 0.5)
      .sort((a: { correct: number; attempts: number }, b: { correct: number; attempts: number }) => (a.correct / a.attempts) - (b.correct / b.attempts))
      .slice(0, 20) || [];

    // Recent sessions
    const { data: sessions } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(20);

    return NextResponse.json({
      totalAttempts,
      totalCorrect,
      accuracy,
      cardsStudied,
      sessions: sessions || [],
      weakCards,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({
      totalAttempts: 0,
      totalCorrect: 0,
      accuracy: 0,
      cardsStudied: 0,
      sessions: [],
      weakCards: [],
    });
  }
}
