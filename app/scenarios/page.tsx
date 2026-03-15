'use client';

import { useState, useCallback, useRef } from 'react';
import { GeneratedScenario, ScenarioConfig, ScenarioAttempt } from '@/types';

const SYSTEMS = [
  'random',
  'The Integumentary System',
  'The Musculoskeletal System',
  'The Cardiovascular system and Blood',
  'The Respiratory System',
  'Digestive System',
  'The Urinary System',
  'The Nervous System',
  'The endocrine System',
  'The reproductive Systems male and female',
  'The Lymphatic System',
  'The Ear and Eye',
];

const DIFFICULTY = {
  easy: { label: 'Easy', desc: 'Single code, common scenarios', color: 'border-green-400 bg-green-50 text-green-800' },
  medium: { label: 'Medium', desc: 'Moderate specificity, occasional modifiers', color: 'border-yellow-400 bg-yellow-50 text-yellow-800' },
  hard: { label: 'Hard', desc: 'Multiple codes, modifiers, bundling traps', color: 'border-red-400 bg-red-50 text-red-800' },
} as const;

const DIFF_BADGE: Record<string, string> = {
  easy: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  hard: 'bg-red-100 text-red-800',
};

type Phase = 'setup' | 'loading' | 'active' | 'feedback' | 'results';

export default function ScenariosPage() {
  const [phase, setPhase] = useState<Phase>('setup');
  const [config, setConfig] = useState<ScenarioConfig>({
    count: 5,
    system: 'random',
    difficulty: 'easy',
    answerMode: 'mc',
  });

  const [currentScenario, setCurrentScenario] = useState<GeneratedScenario | null>(null);
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [attempts, setAttempts] = useState<ScenarioAttempt[]>([]);

  // MC state
  const [selectedCpt, setSelectedCpt] = useState('');
  const [selectedIcd10, setSelectedIcd10] = useState('');
  // Type state
  const [typedCpt, setTypedCpt] = useState('');
  const [typedIcd10, setTypedIcd10] = useState('');

  const [feedback, setFeedback] = useState<{
    cptCorrect: boolean;
    icd10Correct: boolean;
    cptFeedback: string;
    icd10Feedback: string;
  } | null>(null);
  const [validating, setValidating] = useState(false);

  const questionStart = useRef<number>(Date.now());
  const sessionStart = useRef<number>(Date.now());

  const loadScenario = useCallback(async (cfg: ScenarioConfig) => {
    setPhase('loading');
    setSelectedCpt('');
    setSelectedIcd10('');
    setTypedCpt('');
    setTypedIcd10('');
    setFeedback(null);

    try {
      const res = await fetch('/api/scenario/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system: cfg.system, difficulty: cfg.difficulty, answerMode: cfg.answerMode }),
      });
      const data = await res.json();
      if (!data.scenario) throw new Error('No scenario returned');
      setCurrentScenario(data.scenario);
      questionStart.current = Date.now();
      setPhase('active');
    } catch {
      alert('Failed to generate scenario. Please try again.');
      setPhase('setup');
    }
  }, []);

  function startSession() {
    setAttempts([]);
    setScenarioIndex(0);
    sessionStart.current = Date.now();
    loadScenario(config);
  }

  async function handleSubmit() {
    if (!currentScenario) return;

    const userCpt =
      config.answerMode === 'mc'
        ? selectedCpt ? [selectedCpt] : []
        : typedCpt.split(',').map((s) => s.trim()).filter(Boolean);

    const userIcd10 =
      config.answerMode === 'mc'
        ? selectedIcd10 ? [selectedIcd10] : []
        : typedIcd10.split(',').map((s) => s.trim()).filter(Boolean);

    if (userCpt.length === 0 || userIcd10.length === 0) {
      alert('Please provide both a CPT code and ICD-10 code before submitting.');
      return;
    }

    setValidating(true);
    try {
      const res = await fetch('/api/scenario/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: currentScenario, userCpt, userIcd10 }),
      });
      const result = await res.json();
      setFeedback(result);

      const elapsed = Math.round((Date.now() - questionStart.current) / 1000);
      setAttempts((prev) => [
        ...prev,
        {
          scenario: currentScenario,
          userCpt,
          userIcd10,
          cptCorrect: result.cptCorrect,
          icd10Correct: result.icd10Correct,
          cptFeedback: result.cptFeedback,
          icd10Feedback: result.icd10Feedback,
          timeSeconds: elapsed,
        },
      ]);
      setPhase('feedback');
    } catch {
      alert('Validation failed. Please try again.');
    } finally {
      setValidating(false);
    }
  }

  function handleNext() {
    const nextIndex = scenarioIndex + 1;
    if (nextIndex >= config.count) {
      setPhase('results');
    } else {
      setScenarioIndex(nextIndex);
      loadScenario(config);
    }
  }

  // ── SETUP ─────────────────────────────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center py-4">
          <h1 className="text-3xl font-bold text-text mb-1">🏥 Scenario Mode</h1>
          <p className="text-gray-500">Real clinical notes — identify CPT &amp; ICD-10 codes like the actual CPC exam</p>
        </div>

        {/* Count */}
        <div className="bg-white rounded-xl card-shadow p-6">
          <h3 className="font-semibold text-text mb-3">Number of Scenarios</h3>
          <div className="flex gap-3">
            {[1, 3, 5, 10].map((n) => (
              <button
                key={n}
                onClick={() => setConfig((c) => ({ ...c, count: n }))}
                className={`px-5 py-2 rounded-lg font-medium transition-colors ${
                  config.count === n ? 'bg-primary text-white' : 'bg-gray-100 text-text hover:bg-gray-200'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Body System */}
        <div className="bg-white rounded-xl card-shadow p-6">
          <h3 className="font-semibold text-text mb-3">Body System</h3>
          <select
            value={config.system}
            onChange={(e) => setConfig((c) => ({ ...c, system: e.target.value }))}
            className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:border-primary focus:outline-none text-text"
          >
            {SYSTEMS.map((s) => (
              <option key={s} value={s}>
                {s === 'random' ? '🎲 Random System' : s}
              </option>
            ))}
          </select>
        </div>

        {/* Difficulty */}
        <div className="bg-white rounded-xl card-shadow p-6">
          <h3 className="font-semibold text-text mb-3">Difficulty</h3>
          <div className="grid grid-cols-3 gap-3">
            {(Object.keys(DIFFICULTY) as Array<keyof typeof DIFFICULTY>).map((d) => (
              <button
                key={d}
                onClick={() => setConfig((c) => ({ ...c, difficulty: d }))}
                className={`border-2 rounded-lg p-3 text-left transition-colors ${
                  config.difficulty === d
                    ? DIFFICULTY[d].color + ' border-2'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-sm">{DIFFICULTY[d].label}</div>
                <div className="text-xs mt-1 text-gray-500">{DIFFICULTY[d].desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Answer Mode */}
        <div className="bg-white rounded-xl card-shadow p-6">
          <h3 className="font-semibold text-text mb-3">Answer Mode</h3>
          <div className="flex gap-3">
            <button
              onClick={() => setConfig((c) => ({ ...c, answerMode: 'mc' }))}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                config.answerMode === 'mc' ? 'bg-primary text-white' : 'bg-gray-100 text-text hover:bg-gray-200'
              }`}
            >
              📋 Learning (MC)
            </button>
            <button
              onClick={() => setConfig((c) => ({ ...c, answerMode: 'type' }))}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                config.answerMode === 'type' ? 'bg-primary text-white' : 'bg-gray-100 text-text hover:bg-gray-200'
              }`}
            >
              ✍️ Exam Sim (Type)
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {config.answerMode === 'mc'
              ? 'Choose from 4 options for each code — best for learning'
              : 'Type the actual code numbers — closest to the real exam'}
          </p>
        </div>

        <button
          onClick={startSession}
          className="w-full py-4 bg-primary text-white text-xl font-bold rounded-xl hover:bg-primary-dark transition-colors"
        >
          Start Scenarios →
        </button>
      </div>
    );
  }

  // ── LOADING ───────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full" />
        <p className="text-gray-500 font-medium">
          Generating scenario {scenarioIndex + 1} of {config.count}...
        </p>
        <p className="text-xs text-gray-400">AI is writing a clinical encounter note</p>
      </div>
    );
  }

  // ── RESULTS ───────────────────────────────────────────────────────────────
  if (phase === 'results') {
    const cptScore = attempts.filter((a) => a.cptCorrect).length;
    const icd10Score = attempts.filter((a) => a.icd10Correct).length;
    const total = attempts.length;
    const totalTime = Math.round((Date.now() - sessionStart.current) / 1000);

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center py-4">
          <h1 className="text-3xl font-bold text-text mb-2">Session Complete! 🎉</h1>
          <div className="flex justify-center gap-8 mt-4">
            <div className="text-center">
              <p className="text-4xl font-bold text-primary">{Math.round((cptScore / total) * 100)}%</p>
              <p className="text-sm text-gray-500 mt-1">CPT ({cptScore}/{total})</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-primary">{Math.round((icd10Score / total) * 100)}%</p>
              <p className="text-sm text-gray-500 mt-1">ICD-10 ({icd10Score}/{total})</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-gray-400">{Math.floor(totalTime / 60)}:{String(totalTime % 60).padStart(2, '0')}</p>
              <p className="text-sm text-gray-500 mt-1">Total Time</p>
            </div>
          </div>
        </div>

        {/* Per-scenario breakdown */}
        <div className="bg-white rounded-xl card-shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-text">Scenario Breakdown</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {attempts.map((a, i) => (
              <div key={i} className="px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-500">#{i + 1}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DIFF_BADGE[a.scenario.difficulty]}`}>
                        {a.scenario.difficulty}
                      </span>
                      <span className="text-xs text-gray-400">{a.scenario.system}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{a.scenario.clinicalNote}</p>
                    <div className="flex gap-4 text-sm">
                      <span>
                        {a.cptCorrect ? '✅' : '❌'}{' '}
                        <span className="font-mono">CPT: {a.scenario.correctCpt.join(', ')}</span>
                        {!a.cptCorrect && (
                          <span className="text-error ml-1">(you: {a.userCpt.join(', ') || '—'})</span>
                        )}
                      </span>
                      <span>
                        {a.icd10Correct ? '✅' : '❌'}{' '}
                        <span className="font-mono">ICD-10: {a.scenario.correctIcd10.join(', ')}</span>
                        {!a.icd10Correct && (
                          <span className="text-error ml-1">(you: {a.userIcd10.join(', ') || '—'})</span>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 whitespace-nowrap">{a.timeSeconds}s</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={startSession}
            className="flex-1 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => setPhase('setup')}
            className="flex-1 py-3 bg-gray-100 text-text font-semibold rounded-xl hover:bg-gray-200 transition-colors"
          >
            New Setup
          </button>
        </div>
      </div>
    );
  }

  // ── ACTIVE / FEEDBACK ─────────────────────────────────────────────────────
  const q = currentScenario!;
  const isFeedback = phase === 'feedback';

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-500">
          Scenario {scenarioIndex + 1} of {config.count}
        </span>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${DIFF_BADGE[q.difficulty]}`}>
            {q.difficulty}
          </span>
          <span className="text-xs text-gray-400">{q.system}</span>
        </div>
      </div>

      {/* Clinical Note */}
      <div className="bg-white rounded-xl card-shadow p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-primary bg-blue-50 px-2 py-1 rounded">
            Clinical Note
          </span>
        </div>
        <p className="text-text leading-relaxed text-base">{q.clinicalNote}</p>
      </div>

      {/* Answer Input */}
      {!isFeedback && (
        <div className="bg-white rounded-xl card-shadow p-6 space-y-6">
          {config.answerMode === 'mc' ? (
            <>
              {/* CPT options */}
              <div>
                <h3 className="font-semibold text-text mb-3">CPT Code (Procedure)</h3>
                <div className="space-y-2">
                  {(q.cptOptions || []).map((opt) => (
                    <label
                      key={opt}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                        selectedCpt === opt
                          ? 'border-primary bg-blue-50'
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name="cpt"
                        value={opt}
                        checked={selectedCpt === opt}
                        onChange={() => setSelectedCpt(opt)}
                        className="text-primary"
                      />
                      <span className="font-mono font-semibold text-primary">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* ICD-10 options */}
              <div>
                <h3 className="font-semibold text-text mb-3">ICD-10 Code (Diagnosis)</h3>
                <div className="space-y-2">
                  {(q.icd10Options || []).map((opt) => (
                    <label
                      key={opt}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                        selectedIcd10 === opt
                          ? 'border-primary bg-blue-50'
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name="icd10"
                        value={opt}
                        checked={selectedIcd10 === opt}
                        onChange={() => setSelectedIcd10(opt)}
                        className="text-primary"
                      />
                      <span className="font-mono font-semibold text-primary">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block font-semibold text-text mb-2">CPT Code(s)</label>
                <input
                  type="text"
                  value={typedCpt}
                  onChange={(e) => setTypedCpt(e.target.value)}
                  placeholder="e.g. 93458"
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 font-mono text-lg focus:border-primary focus:outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">Separate multiple codes with commas</p>
              </div>
              <div>
                <label className="block font-semibold text-text mb-2">ICD-10 Code(s)</label>
                <input
                  type="text"
                  value={typedIcd10}
                  onChange={(e) => setTypedIcd10(e.target.value)}
                  placeholder="e.g. I21.09"
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 font-mono text-lg focus:border-primary focus:outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">Separate multiple codes with commas</p>
              </div>
            </>
          )}

          <button
            onClick={handleSubmit}
            disabled={
              validating ||
              (config.answerMode === 'mc' ? !selectedCpt || !selectedIcd10 : !typedCpt.trim() || !typedIcd10.trim())
            }
            className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {validating ? 'Checking...' : 'Submit Answer'}
          </button>
        </div>
      )}

      {/* Feedback */}
      {isFeedback && feedback && (
        <div className="space-y-3">
          {/* CPT feedback */}
          <div className={`rounded-xl p-5 ${feedback.cptCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{feedback.cptCorrect ? '✅' : '❌'}</span>
              <span className="font-semibold text-text">CPT Code</span>
              <span className="font-mono text-sm ml-auto">
                Correct: <strong>{q.correctCpt.join(', ')}</strong>
              </span>
            </div>
            <p className="text-sm text-gray-700">{feedback.cptFeedback}</p>
          </div>

          {/* ICD-10 feedback */}
          <div className={`rounded-xl p-5 ${feedback.icd10Correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{feedback.icd10Correct ? '✅' : '❌'}</span>
              <span className="font-semibold text-text">ICD-10 Code</span>
              <span className="font-mono text-sm ml-auto">
                Correct: <strong>{q.correctIcd10.join(', ')}</strong>
              </span>
            </div>
            <p className="text-sm text-gray-700">{feedback.icd10Feedback}</p>
          </div>

          {/* Coding tip */}
          {q.codingTips && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm text-amber-800">
                <span className="font-semibold">💡 Coding Tip: </span>
                {q.codingTips}
              </p>
            </div>
          )}

          <button
            onClick={handleNext}
            className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors"
          >
            {scenarioIndex + 1 >= config.count ? 'View Results →' : `Next Scenario →`}
          </button>
        </div>
      )}
    </div>
  );
}
