'use client';

import { useState, useEffect } from 'react';
import { QuizQuestion } from '@/types';
import Link from 'next/link';

interface QuizResultsProps {
  questions: QuizQuestion[];
  totalTime: number;
  onRetake: () => void;
  onNewQuiz: () => void;
}

export default function QuizResults({ questions, totalTime, onRetake, onNewQuiz }: QuizResultsProps) {
  const [analysis, setAnalysis] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(true);

  const correct = questions.filter(q => q.isCorrect).length;
  const total = questions.length;
  const pct = Math.round((correct / total) * 100);
  
  const times = questions.map(q => q.timeSeconds || 0).filter(t => t > 0);
  const avgTime = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
  const fastest = times.length > 0 ? Math.min(...times) : 0;
  const slowest = times.length > 0 ? Math.max(...times) : 0;

  // System breakdown
  const systemStats: Record<string, { correct: number; total: number }> = {};
  questions.forEach(q => {
    const sys = q.card.system;
    if (!systemStats[sys]) systemStats[sys] = { correct: 0, total: 0 };
    systemStats[sys].total++;
    if (q.isCorrect) systemStats[sys].correct++;
  });

  const missed = questions.filter(q => !q.isCorrect);

  useEffect(() => {
    async function getAnalysis() {
      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questions: questions.map(q => ({
              term: q.card.term,
              correctAnswer: q.card.definition,
              userAnswer: q.userAnswer || '(no answer)',
              isCorrect: q.isCorrect,
              timeSeconds: q.timeSeconds || 0,
            })),
            score: correct,
            total,
            totalTime,
          }),
        });
        const data = await res.json();
        setAnalysis(data.analysis || 'Analysis unavailable.');
      } catch {
        setAnalysis('AI analysis unavailable — check your API configuration.');
      } finally {
        setAnalyzing(false);
      }
    }
    getAnalysis();
  }, [questions, correct, total, totalTime]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Score */}
      <div className="bg-white rounded-2xl card-shadow-lg p-8 text-center">
        <h2 className="text-6xl font-bold text-text mb-2">
          {correct}/{total}
        </h2>
        <div className={`text-3xl font-bold ${pct >= 70 ? 'text-success' : pct >= 50 ? 'text-yellow-500' : 'text-error'}`}>
          {pct}%
        </div>
        <p className="text-gray-500 mt-2">
          {pct >= 90 ? 'Outstanding! 🌟' : pct >= 70 ? 'Great job! 💪' : pct >= 50 ? 'Getting there! 📚' : 'Keep studying! 🎯'}
        </p>
      </div>

      {/* Time stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl card-shadow p-4 text-center">
          <p className="text-sm text-gray-500">Avg Time</p>
          <p className="text-2xl font-bold text-text">{avgTime}s</p>
        </div>
        <div className="bg-white rounded-xl card-shadow p-4 text-center">
          <p className="text-sm text-gray-500">Fastest</p>
          <p className="text-2xl font-bold text-success">{fastest}s</p>
        </div>
        <div className="bg-white rounded-xl card-shadow p-4 text-center">
          <p className="text-sm text-gray-500">Slowest</p>
          <p className="text-2xl font-bold text-error">{slowest}s</p>
        </div>
      </div>

      {/* AI Analysis */}
      <div className="bg-white rounded-xl card-shadow p-6">
        <h3 className="text-lg font-bold text-text mb-3 flex items-center gap-2">
          🤖 AI Analysis
        </h3>
        {analyzing ? (
          <div className="flex items-center gap-2 text-gray-400 animate-pulse">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Analyzing your performance...
          </div>
        ) : (
          <p className="text-text/80 leading-relaxed">{analysis}</p>
        )}
      </div>

      {/* System Breakdown */}
      <div className="bg-white rounded-xl card-shadow p-6">
        <h3 className="text-lg font-bold text-text mb-3">📊 System Breakdown</h3>
        <div className="space-y-2">
          {Object.entries(systemStats).map(([sys, stats]) => {
            const sysPct = Math.round((stats.correct / stats.total) * 100);
            return (
              <div key={sys} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-text">{sys}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">{stats.correct}/{stats.total}</span>
                  <span className={`text-sm font-bold min-w-[3rem] text-right ${
                    sysPct >= 70 ? 'text-success' : sysPct >= 50 ? 'text-yellow-500' : 'text-error'
                  }`}>
                    {sysPct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Missed Cards */}
      {missed.length > 0 && (
        <div className="bg-white rounded-xl card-shadow p-6">
          <h3 className="text-lg font-bold text-text mb-3">❌ Missed Cards ({missed.length})</h3>
          <div className="space-y-3">
            {missed.map((q, i) => (
              <div key={i} className="p-4 bg-red-50 rounded-lg border border-red-100">
                <p className="font-semibold text-text">{q.card.term}</p>
                <p className="text-sm text-error mt-1">
                  Your answer: {q.userAnswer || '(no answer)'}
                </p>
                <p className="text-sm text-success mt-1">
                  Correct: {q.card.definition}
                </p>
                <p className="text-xs text-gray-500 mt-1">{q.card.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-4 justify-center pt-4">
        {missed.length > 0 && (
          <Link
            href={`/study?cards=${missed.map(q => q.card.id).join(',')}`}
            className="px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors"
          >
            📚 Study Missed Cards
          </Link>
        )}
        <button
          onClick={onRetake}
          className="px-6 py-3 bg-white text-primary font-semibold rounded-xl border-2 border-primary hover:bg-primary/5 transition-colors"
        >
          🔄 Retake Quiz
        </button>
        <button
          onClick={onNewQuiz}
          className="px-6 py-3 bg-gray-100 text-text font-semibold rounded-xl hover:bg-gray-200 transition-colors"
        >
          ✨ New Quiz
        </button>
      </div>
    </div>
  );
}
