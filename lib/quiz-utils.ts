/**
 * quiz-utils.ts
 * Shared utilities for quiz/study randomization and distractor selection.
 */

import { Card } from '@/types';

// ─── Distractor Selection ────────────────────────────────────────────────────

/**
 * Score how "plausible" a distractor definition is relative to the correct one.
 * Higher = more confusable = better distractor.
 * Criteria:
 *  - Similar length bucket (short/medium/long)
 *  - Word overlap (shares at least one meaningful word)
 *  - Same system bonus
 */
function distractorScore(correct: string, candidate: string, sameSystem: boolean): number {
  const correctWords = new Set(correct.toLowerCase().split(/\W+/).filter(w => w.length > 2));
  const candidateWords = candidate.toLowerCase().split(/\W+/).filter(w => w.length > 2);

  let score = 0;

  // Length similarity
  const lenDiff = Math.abs(correct.length - candidate.length);
  if (lenDiff <= 5) score += 3;
  else if (lenDiff <= 15) score += 2;
  else if (lenDiff <= 30) score += 1;

  // Word overlap
  const overlap = candidateWords.filter(w => correctWords.has(w)).length;
  score += overlap * 2;

  // Length bucket match (short/medium/long)
  const bucket = (s: string) => s.length < 8 ? 'short' : s.length < 20 ? 'medium' : 'long';
  if (bucket(correct) === bucket(candidate)) score += 2;

  // Same system bonus
  if (sameSystem) score += 1;

  return score;
}

/**
 * Pick 3 plausible distractors for a multiple-choice question.
 * Filters out blank/trivial definitions.
 * Prefers confusable answers over obviously wrong ones.
 */
export function pickDistractors(card: Card, allCards: Card[], count = 3): string[] {
  const correctDef = card.definition.trim();

  // Filter valid candidates (non-empty, non-punctuation-only, not the correct answer)
  const candidates = allCards.filter(c =>
    c.id !== card.id &&
    c.definition &&
    c.definition.trim().length > 1 &&
    c.definition.trim() !== correctDef &&
    /[a-zA-Z]/.test(c.definition)
  );

  // Score each candidate
  const scored = candidates.map(c => ({
    definition: c.definition.trim(),
    score: distractorScore(correctDef, c.definition.trim(), c.system === card.system),
  }));

  // Deduplicate by definition
  const seen = new Set<string>([correctDef]);
  const unique = scored.filter(s => {
    if (seen.has(s.definition)) return false;
    seen.add(s.definition);
    return true;
  });

  // Sort by score descending, then add randomness within score tiers
  // Group into tiers of 3-point bands, shuffle within each tier
  const tiers = new Map<number, typeof unique>();
  for (const s of unique) {
    const tier = Math.floor(s.score / 3);
    if (!tiers.has(tier)) tiers.set(tier, []);
    tiers.get(tier)!.push(s);
  }

  // Flatten tiers (highest first), shuffle within each
  const sorted: typeof unique = [];
  const tierKeys = Array.from(tiers.keys()).sort((a, b) => b - a);
  for (const key of tierKeys) {
    const tier = tiers.get(key)!;
    // Fisher-Yates within tier
    for (let i = tier.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tier[i], tier[j]] = [tier[j], tier[i]];
    }
    sorted.push(...tier);
  }

  return sorted.slice(0, count).map(s => s.definition);
}

/**
 * Build shuffled MC options (correct + 3 distractors).
 */
export function buildMcOptions(card: Card, allCards: Card[]): string[] {
  const distractors = pickDistractors(card, allCards);
  const options = [card.definition.trim(), ...distractors];
  // Fisher-Yates shuffle
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return options;
}

// ─── Seen-Card Tracking (repeat avoidance) ──────────────────────────────────

const SEEN_KEY = 'cpc_seen_cards';
const SEEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface SeenEntry {
  ts: number; // unix ms
  count: number;
}

function loadSeen(): Record<string, SeenEntry> {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveSeen(seen: Record<string, SeenEntry>) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
  } catch {}
}

/** Prune entries older than TTL */
function pruneSeen(seen: Record<string, SeenEntry>): Record<string, SeenEntry> {
  const cutoff = Date.now() - SEEN_TTL_MS;
  const pruned: Record<string, SeenEntry> = {};
  for (const [id, entry] of Object.entries(seen)) {
    if (entry.ts >= cutoff) pruned[id] = entry;
  }
  return pruned;
}

/** Record cards as seen after a quiz session */
export function markCardsSeen(cardIds: string[]) {
  const seen = pruneSeen(loadSeen());
  const now = Date.now();
  for (const id of cardIds) {
    seen[id] = { ts: now, count: (seen[id]?.count ?? 0) + 1 };
  }
  saveSeen(seen);
}

/**
 * Weighted shuffle: unseen cards come first, recently-seen cards pushed to back.
 * Cards seen more times or more recently get a higher penalty weight.
 */
export function weightedShuffle(cards: Card[]): Card[] {
  const seen = pruneSeen(loadSeen());
  const now = Date.now();

  const weighted = cards.map(card => {
    const entry = seen[card.id];
    let penalty = 0;
    if (entry) {
      // Recency penalty: max 100, decays over 7 days
      const ageDays = (now - entry.ts) / (24 * 60 * 60 * 1000);
      const recencyPenalty = Math.max(0, 100 - ageDays * 14); // fully gone after 7 days
      // Count penalty: +20 per additional time seen (capped at 60)
      const countPenalty = Math.min(60, (entry.count - 1) * 20);
      penalty = recencyPenalty + countPenalty;
    }
    // Add random jitter so cards with same penalty still shuffle
    const jitter = Math.random() * 30;
    return { card, sortKey: penalty + jitter };
  });

  // Sort: low sortKey = front (unseen/old), high sortKey = back (recently seen)
  weighted.sort((a, b) => a.sortKey - b.sortKey);
  return weighted.map(w => w.card);
}
