import { NextRequest, NextResponse } from 'next/server';
import { getAllCards, getFilteredCards } from '@/lib/cards';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const system = searchParams.get('system') || undefined;
  const category = searchParams.get('category') || undefined;
  const difficulty = searchParams.get('difficulty') || undefined;

  const cards = (system || category || difficulty)
    ? getFilteredCards({ system, category, difficulty })
    : getAllCards();

  return NextResponse.json({ cards, total: cards.length });
}
