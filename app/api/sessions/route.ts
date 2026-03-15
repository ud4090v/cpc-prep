import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = request.headers.get('x-user-id') || 'anonymous';

    if (!isSupabaseConfigured()) {
      // Return a mock session ID when Supabase isn't configured
      return NextResponse.json({
        id: crypto.randomUUID(),
        user_id: userId,
        ...body,
        created_at: new Date().toISOString(),
      });
    }

    const { data, error } = await supabaseAdmin
      .from('sessions')
      .insert({
        mode: body.mode,
        card_count: body.card_count || 0,
        score_pct: body.score_pct,
        filters: body.filters,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error('Session create error:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ sessions: [] });
    }

    const { data, error } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return NextResponse.json({ sessions: data });
  } catch (error) {
    console.error('Session list error:', error);
    return NextResponse.json({ sessions: [] });
  }
}
