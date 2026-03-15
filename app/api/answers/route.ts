import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: true, id: crypto.randomUUID() });
    }

    // Insert answer
    const { data: answer, error: ansError } = await supabaseAdmin
      .from('answers')
      .insert({
        session_id: body.session_id,
        card_id: body.card_id,
        user_answer: body.user_answer,
        is_correct: body.is_correct,
        time_seconds: body.time_seconds,
        ai_feedback: body.ai_feedback,
      })
      .select()
      .single();

    if (ansError) throw ansError;

    // Upsert card_stats
    const { data: existing } = await supabaseAdmin
      .from('card_stats')
      .select('*')
      .eq('card_id', body.card_id)
      .single();

    if (existing) {
      const newAttempts = existing.attempts + 1;
      const newCorrect = existing.correct + (body.is_correct ? 1 : 0);
      const newAvg = existing.avg_time_sec
        ? (existing.avg_time_sec * existing.attempts + body.time_seconds) / newAttempts
        : body.time_seconds;

      await supabaseAdmin
        .from('card_stats')
        .update({
          attempts: newAttempts,
          correct: newCorrect,
          last_seen: new Date().toISOString(),
          avg_time_sec: newAvg,
        })
        .eq('card_id', body.card_id);
    } else {
      await supabaseAdmin
        .from('card_stats')
        .insert({
          card_id: body.card_id,
          attempts: 1,
          correct: body.is_correct ? 1 : 0,
          last_seen: new Date().toISOString(),
          avg_time_sec: body.time_seconds,
        });
    }

    return NextResponse.json(answer);
  } catch (error) {
    console.error('Answer record error:', error);
    return NextResponse.json({ error: 'Failed to record answer' }, { status: 500 });
  }
}
