'use client';

import { Card } from '@/types';

interface FlashCardProps {
  card: Card;
  showAnswer?: boolean;
  children?: React.ReactNode;
}

export default function FlashCard({ card, showAnswer, children }: FlashCardProps) {
  return (
    <div className="bg-white rounded-2xl card-shadow-lg p-8 max-w-2xl mx-auto">
      {/* System & Category badges */}
      <div className="flex flex-wrap gap-2 mb-6">
        <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
          {card.system}
        </span>
        <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full capitalize">
          {card.category.replace(/_/g, ' ')}
        </span>
        <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs rounded-full capitalize">
          {card.difficulty}
        </span>
      </div>

      {/* Term */}
      <h2 className="text-3xl font-bold text-text text-center mb-4 leading-tight">
        {card.term}
      </h2>

      {/* Definition (shown after answer or in quiz review) */}
      {showAnswer && (
        <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <p className="text-sm font-semibold text-primary mb-1">Definition:</p>
          <p className="text-lg text-text">{card.definition}</p>
        </div>
      )}

      {/* Children slot for answer input, feedback, etc. */}
      {children}
    </div>
  );
}
