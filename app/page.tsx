'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SessionRecord } from '@/types';

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="bg-white rounded-xl card-shadow p-5">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="text-2xl font-bold text-text">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalCards: 583,
    studiedToday: 0,
    accuracy: 0,
    streak: 0,
  });
  const [sessions, setSessions] = useState<SessionRecord[]>([]);

  useEffect(() => {
    // Load from localStorage
    try {
      const stored = localStorage.getItem('cpc_stats');
      if (stored) {
        const parsed = JSON.parse(stored);
        setStats(prev => ({ ...prev, ...parsed }));
      }
      const storedSessions = localStorage.getItem('cpc_sessions');
      if (storedSessions) {
        setSessions(JSON.parse(storedSessions).slice(0, 5));
      }
    } catch {}
    
    // Ensure user_id
    if (!localStorage.getItem('cpc_user_id')) {
      localStorage.setItem('cpc_user_id', crypto.randomUUID());
    }
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-text mb-2">
          🏥 CPC Exam Prep
        </h1>
        <p className="text-lg text-gray-500">
          Master medical coding terminology with 583 flash cards
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Cards" value={stats.totalCards} icon="📇" />
        <StatCard label="Studied Today" value={stats.studiedToday} icon="📝" />
        <StatCard label="Accuracy" value={`${stats.accuracy}%`} icon="🎯" />
        <StatCard label="Study Streak" value={`${stats.streak} days`} icon="🔥" />
      </div>

      {/* CTA Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/study"
          className="block bg-white rounded-2xl card-shadow-lg p-8 hover:scale-[1.02] transition-transform group"
        >
          <div className="text-center">
            <span className="text-5xl mb-4 block group-hover:scale-110 transition-transform">📚</span>
            <h2 className="text-2xl font-bold text-text mb-2">Study Mode</h2>
            <p className="text-gray-500">
              Learn at your own pace with AI-powered feedback on every answer
            </p>
          </div>
        </Link>

        <Link
          href="/quiz"
          className="block bg-white rounded-2xl card-shadow-lg p-8 hover:scale-[1.02] transition-transform group"
        >
          <div className="text-center">
            <span className="text-5xl mb-4 block group-hover:scale-110 transition-transform">⏱️</span>
            <h2 className="text-2xl font-bold text-text mb-2">Quiz Mode</h2>
            <p className="text-gray-500">
              Timed quiz mode — test yourself under exam conditions
            </p>
          </div>
        </Link>

        <Link
          href="/scenarios"
          className="block bg-white rounded-2xl card-shadow-lg p-8 hover:scale-[1.02] transition-transform group"
        >
          <div className="text-center">
            <span className="text-5xl mb-4 block group-hover:scale-110 transition-transform">🏥</span>
            <h2 className="text-2xl font-bold text-text mb-2">Scenarios</h2>
            <p className="text-gray-500">
              Real clinical notes — identify CPT &amp; ICD-10 codes like the actual exam
            </p>
          </div>
        </Link>
      </div>

      {/* Recent Sessions */}
      {sessions.length > 0 && (
        <div className="bg-white rounded-xl card-shadow p-6">
          <h3 className="text-lg font-bold text-text mb-4">📊 Recent Sessions</h3>
          <div className="space-y-2">
            {sessions.map((s, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div>
                  <span className="font-medium text-text capitalize">{s.mode}</span>
                  <span className="text-sm text-gray-400 ml-2">{s.date}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">{s.score}/{s.total}</span>
                  <span className={`text-sm font-bold ${
                    s.percentage >= 70 ? 'text-success' : s.percentage >= 50 ? 'text-yellow-500' : 'text-error'
                  }`}>
                    {s.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
