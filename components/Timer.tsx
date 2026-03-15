'use client';

import { useEffect, useState, useCallback } from 'react';

interface TimerProps {
  seconds: number;
  onExpire: () => void;
  running: boolean;
  onTick?: (remaining: number) => void;
}

export default function Timer({ seconds, onExpire, running, onTick }: TimerProps) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  const handleExpire = useCallback(onExpire, [onExpire]);

  useEffect(() => {
    if (!running) return;
    if (remaining <= 0) {
      handleExpire();
      return;
    }

    const timer = setInterval(() => {
      setRemaining(prev => {
        const next = prev - 1;
        onTick?.(next);
        if (next <= 0) {
          clearInterval(timer);
          handleExpire();
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [running, remaining, handleExpire, onTick]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const isLow = remaining <= 10;
  const pct = (remaining / seconds) * 100;

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ${
            isLow ? 'bg-error' : 'bg-primary'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`font-mono text-lg font-bold min-w-[4rem] text-right ${isLow ? 'text-error animate-pulse' : 'text-text'}`}>
        {mins}:{secs.toString().padStart(2, '0')}
      </span>
    </div>
  );
}
