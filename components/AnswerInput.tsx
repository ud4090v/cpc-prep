'use client';

import { useState } from 'react';

interface AnswerInputProps {
  mode: 'mc' | 'type';
  options?: string[];
  onSubmit: (answer: string) => void;
  disabled?: boolean;
}

export default function AnswerInput({ mode, options, onSubmit, disabled }: AnswerInputProps) {
  const [textAnswer, setTextAnswer] = useState('');

  if (mode === 'mc' && options) {
    return (
      <div className="mt-6 space-y-3">
        {options.map((option, i) => (
          <button
            key={i}
            onClick={() => !disabled && onSubmit(option)}
            disabled={disabled}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all
              ${disabled 
                ? 'opacity-50 cursor-not-allowed border-gray-200' 
                : 'border-gray-200 hover:border-primary hover:bg-primary/5 cursor-pointer active:scale-[0.98]'
              }`}
          >
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-sm font-bold text-gray-500 mr-3">
              {String.fromCharCode(65 + i)}
            </span>
            <span className="text-text">{option}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (textAnswer.trim() && !disabled) {
          onSubmit(textAnswer.trim());
          setTextAnswer('');
        }
      }}
      className="mt-6"
    >
      <div className="flex gap-3">
        <input
          type="text"
          value={textAnswer}
          onChange={(e) => setTextAnswer(e.target.value)}
          placeholder="Type your answer..."
          disabled={disabled}
          className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none transition-colors text-lg disabled:opacity-50"
          autoFocus
        />
        <button
          type="submit"
          disabled={disabled || !textAnswer.trim()}
          className="px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Submit
        </button>
      </div>
    </form>
  );
}
