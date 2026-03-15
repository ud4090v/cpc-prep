import cardsData from '@/data/cards.json';
import { Card } from '@/types';

const allCards: Card[] = cardsData as Card[];

export function getAllCards(): Card[] {
  return allCards;
}

export function getFilteredCards(filters?: {
  system?: string;
  category?: string;
  difficulty?: string;
}): Card[] {
  let filtered = [...allCards];
  if (filters?.system) {
    filtered = filtered.filter(c => c.system === filters.system);
  }
  if (filters?.category) {
    filtered = filtered.filter(c => c.category === filters.category);
  }
  if (filters?.difficulty) {
    filtered = filtered.filter(c => c.difficulty === filters.difficulty);
  }
  return filtered;
}

export function getRandomCards(n: number, filters?: {
  system?: string;
  category?: string;
  difficulty?: string;
  systems?: string[];
}): Card[] {
  let pool = [...allCards];
  
  if (filters?.system) {
    pool = pool.filter(c => c.system === filters.system);
  }
  if (filters?.systems && filters.systems.length > 0) {
    pool = pool.filter(c => filters.systems!.includes(c.system));
  }
  if (filters?.category) {
    pool = pool.filter(c => c.category === filters.category);
  }
  if (filters?.difficulty) {
    pool = pool.filter(c => c.difficulty === filters.difficulty);
  }
  
  // Shuffle (Fisher-Yates)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  
  return pool.slice(0, Math.min(n, pool.length));
}

export function getMultipleChoiceOptions(card: Card, pool?: Card[]): string[] {
  const source = pool || allCards;
  
  // Get wrong answers from same category/system first, then any
  const sameCategory = source.filter(
    c => c.id !== card.id && c.category === card.category && c.system === card.system
  );
  const sameSystem = source.filter(
    c => c.id !== card.id && c.system === card.system
  );
  const others = source.filter(c => c.id !== card.id);
  
  // Pick 3 distractors, preferring same category
  const distractors: string[] = [];
  const used = new Set<string>([card.definition]);
  
  const pools = [sameCategory, sameSystem, others];
  for (const p of pools) {
    const shuffled = [...p].sort(() => Math.random() - 0.5);
    for (const c of shuffled) {
      if (distractors.length >= 3) break;
      if (!used.has(c.definition)) {
        distractors.push(c.definition);
        used.add(c.definition);
      }
    }
    if (distractors.length >= 3) break;
  }
  
  // Combine and shuffle
  const options = [card.definition, ...distractors];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  
  return options;
}

export function getSystems(): string[] {
  const systems = new Set(allCards.map(c => c.system));
  return Array.from(systems).filter(Boolean).sort();
}

export function getCategories(): string[] {
  const categories = new Set(allCards.map(c => c.category));
  return Array.from(categories).filter(Boolean).sort();
}

export function getCardById(id: string): Card | undefined {
  return allCards.find(c => c.id === id);
}
