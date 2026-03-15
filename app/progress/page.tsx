'use client';

import { useState, useEffect } from 'react';
import { SessionRecord } from '@/types';
import Link from 'next/link';

interface Stats {
  totalAttempts: number;
  totalCorrect: number;
  accuracy: number;
  studiedToday: number;
  streak: number;
}

export default function ProgressPage() {
  const [stats, setStats] = useState<Stats>({
    totalAttempts: 0,
    totalCorrect: 0,
    accuracy: 0,
    studiedToday: 0,
    streak: 0,
  });
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [systemBreakdown, setSystemBreakdown] = useState<Record<string, { correct: number; total: number }>>({});

  useEffect(() => {
    try {
      const storedStats = localStorage.getItem('cpc_stats');
      if (storedStats) setStats(JSON.parse(storedStats));

      const storedSessions = localStorage.getItem('cpc_sessions');
      if (storedSessions) {
        const allSessions: SessionRecord[] = JSON.parse(storedSessions);
        setSessions(allSessions);

        // Build system breakdown from sessions (simplified)
        const breakdown: Record<string, { correct: number; total: number }> = {};
        // We'll compute from the quiz results stored in each session if available
        // For now, aggregate from sessions
        allSessions.forEach(s => {
          if (!breakdown['All']) breakdown['All'] = { correct: 0, total: 0 };
          breakdown['All'].correct += s.score;
          breakdown['All'].total += s.total;
        });
        setSystemBreakdown(breakdown);
      }
    } catch {}
  }, []);

  const mastered = stats.totalAttempts > 0
    ? Math.round((stats.totalCorrect / stats.totalAttempts) * 583 * (stats.accuracy / 100))
    : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-text">📊 Your Progress</h1>

      {/* Overall Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl card-shadow p-5 text-center">
          <p className="text-3xl font-bold text-primary">{stats.totalAttempts}</p>
          <p className="text-sm text-gray-500 mt-1">Total Attempts</p>
        </div>
        <div className="bg-white rounded-xl card-shadow p-5 text-center">
          <p className="text-3xl font-bold text-success">{stats.accuracy}%</p>
          <p className="text-sm text-gray-500 mt-1">Overall Accuracy</p>
        </div>
        <div className="bg-white rounded-xl card-shadow p-5 text-center">
          <p className="text-3xl font-bold text-text">{Math.min(mastered, 583)}</p>
          <p className="text-sm text-gray-500 mt-1">Cards Mastered</p>
        </div>
        <div className="bg-white rounded-xl card-shadow p-5 text-center">
          <p className="text-3xl font-bold text-text">{stats.studiedToday}</p>
          <p className="text-sm text-gray-500 mt-1">Studied Today</p>
        </div>
      </div>

      {/* Accuracy Bar */}
      <div className="bg-white rounded-xl card-shadow p-6">
        <h3 className="font-semibold text-text mb-3">Overall Accuracy</h3>
        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              stats.accuracy >= 70 ? 'bg-success' : stats.accuracy >= 50 ? 'bg-yellow-400' : 'bg-error'
            }`}
            style={{ width: `${stats.accuracy}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-sm text-gray-500">
          <span>0%</span>
          <span className="font-semibold text-text">{stats.accuracy}%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Session History */}
      <div className="bg-white rounded-xl card-shadow p-6">
        <h3 className="font-semibold text-text mb-4">📝 Session History</h3>
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-lg mb-2">No sessions yet!</p>
            <Link href="/study" className="text-primary hover:underline">Start studying →</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-gray-500 font-medium">Date</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Mode</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Score</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Accuracy</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Duration</th>
                </tr>
              </thead>
              <tbody>
                {sessions.slice(0, 20).map((s, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-3 text-text">{s.date}</td>
                    <td className="py-3 capitalize text-text">{s.mode}</td>
                    <td className="py-3 text-right text-text">{s.score}/{s.total}</td>
                    <td className="py-3 text-right">
                      <span className={`font-semibold ${
                        s.percentage >= 70 ? 'text-success' : s.percentage >= 50 ? 'text-yellow-500' : 'text-error'
                      }`}>
                        {s.percentage}%
                      </span>
                    </td>
                    <td className="py-3 text-right text-gray-500">
                      {s.duration ? `${Math.floor(s.duration / 60)}m ${s.duration % 60}s` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="bg-blue-50 rounded-xl border border-blue-100 p-6">
        <h3 className="font-semibold text-primary mb-2">💡 Study Tips</h3>
        <ul className="text-sm text-text/80 space-y-1">
          <li>• Focus on systems where your accuracy is below 70%</li>
          <li>• Use Type Answer mode to build stronger recall</li>
          <li>• Take regular quizzes to test under time pressure</li>
          <li>• Review missed cards from quiz results</li>
          <li>• Study consistently — even 15 minutes daily builds mastery</li>
        </ul>
      </div>
    </div>
  );
}
