'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import FlashCard from '@/components/FlashCard';
import AnswerInput from '@/components/AnswerInput';
import Timer from '@/components/Timer';
import ProgressBar from '@/components/ProgressBar';
import QuizResults from '@/components/QuizResults';
import { Card, QuizConfig, QuizQuestion } from '@/types';

type Phase = 'setup' | 'quiz' | 'results';

export default function QuizPage() {
  const [phase, setPhase] = useState<Phase>('setup');
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [systems, setSystems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Setup state
  const [config, setConfig] = useState<QuizConfig>({
    questionCount: 25,
    systems: [],
    answerMode: 'mc',
    timePerQuestion: 60,
  });
  const [customCount, setCustomCount] = useState('');

  // Quiz state
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [timerKey, setTimerKey] = useState(0);
  const [quizStartTime, setQuizStartTime] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const answeredRef = useRef(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/cards');
        const data = await res.json();
        const cards = data.cards || [];
        setAllCards(cards);
        const sys = Array.from(new Set(cards.map((c: Card) => c.system))).filter(Boolean).sort() as string[];
        setSystems(sys);
        setConfig(prev => ({ ...prev, systems: sys }));
      } catch {
        setAllCards([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function toggleSystem(sys: string) {
    setConfig(prev => ({
      ...prev,
      systems: prev.systems.includes(sys)
        ? prev.systems.filter(s => s !== sys)
        : [...prev.systems, sys],
    }));
  }

  function startQuiz() {
    const count = customCount ? parseInt(customCount) : config.questionCount;
    let pool = [...allCards];
    if (config.systems.length > 0 && config.systems.length < systems.length) {
      pool = pool.filter(c => config.systems.includes(c.system));
    }

    // Shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const selected = pool.slice(0, Math.min(count, pool.length));
    const qs: QuizQuestion[] = selected.map(card => {
      let options: string[] | undefined;
      if (config.answerMode === 'mc') {
        const sameSystem = allCards.filter(c => c.id !== card.id && c.system === card.system);
        const others = allCards.filter(c => c.id !== card.id);
        const distractors: string[] = [];
        const used = new Set([card.definition]);
        for (const p of [sameSystem, others]) {
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
        options = [card.definition, ...distractors];
        for (let i = options.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [options[i], options[j]] = [options[j], options[i]];
        }
      }
      return { card, options };
    });

    setQuestions(qs);
    setCurrentQ(0);
    setTimerKey(k => k + 1);
    setQuizStartTime(Date.now());
    setQuestionStartTime(Date.now());
    answeredRef.current = false;
    setPhase('quiz');
  }

  const advanceQuestion = useCallback((answer?: string) => {
    if (answeredRef.current) return;
    answeredRef.current = true;

    const elapsed = Math.round((Date.now() - questionStartTime) / 1000);
    const q = questions[currentQ];
    const isCorrect = answer
      ? answer.toLowerCase().trim() === q.card.definition.toLowerCase().trim()
      : false;

    const updated = [...questions];
    updated[currentQ] = {
      ...q,
      userAnswer: answer || '(no answer)',
      isCorrect,
      timeSeconds: elapsed,
    };
    setQuestions(updated);

    if (currentQ + 1 < questions.length) {
      setCurrentQ(prev => prev + 1);
      setTimerKey(k => k + 1);
      setQuestionStartTime(Date.now());
      answeredRef.current = false;
    } else {
      setTotalTime(Math.round((Date.now() - quizStartTime) / 1000));
      setPhase('results');

      // Save session to localStorage
      try {
        const correct = updated.filter(q => q.isCorrect).length;
        const session = {
          id: crypto.randomUUID(),
          date: new Date().toLocaleDateString(),
          mode: 'quiz',
          score: correct,
          total: updated.length,
          percentage: Math.round((correct / updated.length) * 100),
          duration: Math.round((Date.now() - quizStartTime) / 1000),
        };
        const sessions = JSON.parse(localStorage.getItem('cpc_sessions') || '[]');
        sessions.unshift(session);
        localStorage.setItem('cpc_sessions', JSON.stringify(sessions.slice(0, 50)));
        
        const stats = JSON.parse(localStorage.getItem('cpc_stats') || '{}');
        stats.studiedToday = (stats.studiedToday || 0) + updated.length;
        const totalCorrect = (stats.totalCorrect || 0) + correct;
        const totalAttempts = (stats.totalAttempts || 0) + updated.length;
        stats.totalCorrect = totalCorrect;
        stats.totalAttempts = totalAttempts;
        stats.accuracy = Math.round((totalCorrect / totalAttempts) * 100);
        localStorage.setItem('cpc_stats', JSON.stringify(stats));
      } catch {}
    }
  }, [currentQ, questions, questionStartTime, quizStartTime]);

  const handleTimerExpire = useCallback(() => {
    advanceQuestion();
  }, [advanceQuestion]);

  function handleAnswer(answer: string) {
    advanceQuestion(answer);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // SETUP PHASE
  if (phase === 'setup') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-text text-center">⏱️ Quiz Setup</h1>

        {/* Question Count */}
        <div className="bg-white rounded-xl card-shadow p-6">
          <h3 className="font-semibold text-text mb-3">Number of Questions</h3>
          <div className="flex flex-wrap gap-3">
            {[10, 25, 50].map(n => (
              <button
                key={n}
                onClick={() => { setConfig(prev => ({ ...prev, questionCount: n })); setCustomCount(''); }}
                className={`px-5 py-2 rounded-lg font-medium transition-colors ${
                  config.questionCount === n && !customCount
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-text hover:bg-gray-200'
                }`}
              >
                {n}
              </button>
            ))}
            <input
              type="number"
              placeholder="Custom"
              value={customCount}
              onChange={(e) => setCustomCount(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg w-24 text-center focus:border-primary focus:outline-none"
              min={1}
              max={allCards.length}
            />
          </div>
        </div>

        {/* Body Systems */}
        <div className="bg-white rounded-xl card-shadow p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-text">Body Systems</h3>
            <button
              onClick={() => setConfig(prev => ({
                ...prev,
                systems: prev.systems.length === systems.length ? [] : [...systems],
              }))}
              className="text-sm text-primary hover:underline"
            >
              {config.systems.length === systems.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {systems.map(sys => (
              <label key={sys} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.systems.includes(sys)}
                  onChange={() => toggleSystem(sys)}
                  className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                />
                <span className="text-sm text-text">{sys}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Answer Mode */}
        <div className="bg-white rounded-xl card-shadow p-6">
          <h3 className="font-semibold text-text mb-3">Answer Mode</h3>
          <div className="flex gap-3">
            <button
              onClick={() => setConfig(prev => ({ ...prev, answerMode: 'mc' }))}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                config.answerMode === 'mc' ? 'bg-primary text-white' : 'bg-gray-100 text-text hover:bg-gray-200'
              }`}
            >
              Multiple Choice
            </button>
            <button
              onClick={() => setConfig(prev => ({ ...prev, answerMode: 'type' }))}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                config.answerMode === 'type' ? 'bg-primary text-white' : 'bg-gray-100 text-text hover:bg-gray-200'
              }`}
            >
              Type Answer
            </button>
          </div>
        </div>

        {/* Time Per Question */}
        <div className="bg-white rounded-xl card-shadow p-6">
          <h3 className="font-semibold text-text mb-3">Time Per Question</h3>
          <div className="flex flex-wrap gap-3">
            {[30, 60, 90, 120].map(t => (
              <button
                key={t}
                onClick={() => setConfig(prev => ({ ...prev, timePerQuestion: t }))}
                className={`px-5 py-2 rounded-lg font-medium transition-colors ${
                  config.timePerQuestion === t
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-text hover:bg-gray-200'
                }`}
              >
                {t}s
              </button>
            ))}
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={startQuiz}
          disabled={config.systems.length === 0}
          className="w-full py-4 bg-primary text-white text-xl font-bold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Start Quiz →
        </button>
      </div>
    );
  }

  // QUIZ PHASE
  if (phase === 'quiz') {
    const q = questions[currentQ];
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-500">
            Question {currentQ + 1} of {questions.length}
          </span>
          <button
            onClick={() => advanceQuestion()}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Skip →
          </button>
        </div>

        {/* Timer */}
        <Timer
          key={timerKey}
          seconds={config.timePerQuestion}
          onExpire={handleTimerExpire}
          running={true}
        />

        {/* Progress */}
        <ProgressBar current={currentQ + 1} total={questions.length} />

        {/* Card */}
        <FlashCard card={q.card}>
          <AnswerInput
            mode={config.answerMode}
            options={config.answerMode === 'mc' ? q.options : undefined}
            onSubmit={handleAnswer}
          />
        </FlashCard>
      </div>
    );
  }

  // RESULTS PHASE
  return (
    <QuizResults
      questions={questions}
      totalTime={totalTime}
      onRetake={startQuiz}
      onNewQuiz={() => setPhase('setup')}
    />
  );
}
