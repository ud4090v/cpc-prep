'use client';

import { useState, useEffect, useCallback } from 'react';
import FlashCard from '@/components/FlashCard';
import AnswerInput from '@/components/AnswerInput';
import FeedbackPanel from '@/components/FeedbackPanel';
import ProgressBar from '@/components/ProgressBar';
import { Card, EvaluateResponse } from '@/types';
import { buildMcOptions, weightedShuffle } from '@/lib/quiz-utils';

export default function StudyPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [systems, setSystems] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerMode, setAnswerMode] = useState<'mc' | 'type'>('mc');
  const [options, setOptions] = useState<string[]>([]);
  const [answered, setAnswered] = useState(false);
  const [feedback, setFeedback] = useState<EvaluateResponse | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [filterSystem, setFilterSystem] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [loading, setLoading] = useState(true);

  // Load cards
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/cards');
        const data = await res.json();
        setAllCards(data.cards || []);
        
        const sys = Array.from(new Set((data.cards || []).map((c: Card) => c.system))).filter(Boolean).sort() as string[];
        const cats = Array.from(new Set((data.cards || []).map((c: Card) => c.category))).filter(Boolean).sort() as string[];
        setSystems(sys);
        setCategories(cats);
      } catch {
        setAllCards([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Filter and shuffle cards
  const refreshCards = useCallback(() => {
    let pool = [...allCards];
    if (filterSystem) pool = pool.filter(c => c.system === filterSystem);
    if (filterCategory) pool = pool.filter(c => c.category === filterCategory);
    
    // Weighted shuffle: unseen/older cards come first
    pool = weightedShuffle(pool);

    setCards(pool);
    setCurrentIndex(0);
    setAnswered(false);
    setFeedback(null);
    setCorrect(0);
    setTotal(0);
  }, [allCards, filterSystem, filterCategory]);

  useEffect(() => {
    if (allCards.length > 0) refreshCards();
  }, [allCards, filterSystem, filterCategory, refreshCards]);

  // Generate MC options for current card
  useEffect(() => {
    if (cards.length === 0 || currentIndex >= cards.length) return;
    const card = cards[currentIndex];
    
    if (answerMode === 'mc') {
      setOptions(
        card.distractors && card.distractors.length >= 3
          ? [...card.distractors.slice(0, 3), card.definition].sort(() => Math.random() - 0.5)
          : buildMcOptions(card, allCards)
      );
    }
  }, [cards, currentIndex, answerMode, allCards]);

  const currentCard = cards[currentIndex];

  async function handleAnswer(answer: string) {
    if (!currentCard || answered) return;
    setAnswered(true);
    setTotal(prev => prev + 1);
    setFeedbackLoading(true);

    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': localStorage.getItem('cpc_user_id') || '',
        },
        body: JSON.stringify({
          cardId: currentCard.id,
          userAnswer: answer,
          correctAnswer: currentCard.definition,
          term: currentCard.term,
          definition: currentCard.definition,
        }),
      });
      const data: EvaluateResponse = await res.json();
      setFeedback(data);
      if (data.isCorrect) setCorrect(prev => prev + 1);
    } catch {
      // Fallback: simple string match
      const isCorrect = answer.toLowerCase().trim() === currentCard.definition.toLowerCase().trim();
      setFeedback({
        isCorrect,
        confidence: isCorrect ? 'exact' : 'wrong',
        feedback: isCorrect ? 'Correct!' : `The correct answer is: ${currentCard.definition}`,
      });
      if (isCorrect) setCorrect(prev => prev + 1);
    } finally {
      setFeedbackLoading(false);
    }

    // Update stats in localStorage
    try {
      const stats = JSON.parse(localStorage.getItem('cpc_stats') || '{}');
      stats.studiedToday = (stats.studiedToday || 0) + 1;
      localStorage.setItem('cpc_stats', JSON.stringify(stats));
    } catch {}
  }

  function nextCard() {
    setAnswered(false);
    setFeedback(null);
    if (currentIndex + 1 < cards.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      refreshCards();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Loading cards...</p>
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-xl text-gray-500">No cards match your filters. Try different filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="bg-white rounded-xl card-shadow p-4">
        <div className="flex flex-wrap items-center gap-4">
          <select
            value={filterSystem}
            onChange={(e) => setFilterSystem(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary focus:outline-none"
          >
            <option value="">All Systems</option>
            {systems.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary focus:outline-none"
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
            ))}
          </select>

          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setAnswerMode('mc')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                answerMode === 'mc' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'
              }`}
            >
              Multiple Choice
            </button>
            <button
              onClick={() => setAnswerMode('type')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                answerMode === 'type' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'
              }`}
            >
              Type Answer
            </button>
          </div>

          <div className="ml-auto text-sm text-gray-500">
            {cards.length} cards
          </div>
        </div>
      </div>

      {/* Progress */}
      <ProgressBar
        current={currentIndex + 1}
        total={cards.length}
        correct={correct}
        label="Session Progress"
      />

      {/* Stats */}
      <div className="flex items-center justify-center gap-6 text-sm">
        <span className="text-success font-semibold">✓ {correct}</span>
        <span className="text-error font-semibold">✗ {total - correct}</span>
        <span className="text-gray-500">
          {total > 0 ? Math.round((correct / total) * 100) : 0}% accuracy
        </span>
      </div>

      {/* Card */}
      {currentCard && (
        <FlashCard card={currentCard} showAnswer={answered}>
          {!answered ? (
            <AnswerInput
              mode={answerMode}
              options={answerMode === 'mc' ? options : undefined}
              onSubmit={handleAnswer}
            />
          ) : (
            <>
              {(feedbackLoading || feedback) && (
                <FeedbackPanel
                  isCorrect={feedback?.isCorrect ?? false}
                  confidence={feedback?.confidence}
                  feedback={feedback?.feedback ?? ''}
                  correctAnswer={currentCard.definition}
                  explanation={currentCard.explanation}
                  loading={feedbackLoading}
                />
              )}
              <button
                onClick={nextCard}
                className="mt-6 w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors"
              >
                Next Card →
              </button>
            </>
          )}
        </FlashCard>
      )}
    </div>
  );
}
