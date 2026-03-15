'use client';

interface ProgressBarProps {
  current: number;
  total: number;
  correct?: number;
  label?: string;
}

export default function ProgressBar({ current, total, correct, label }: ProgressBarProps) {
  const pct = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-gray-500">{label}</span>
          <span className="text-sm font-semibold text-text">
            {current}/{total}
            {correct !== undefined && (
              <span className="text-success ml-2">({correct} correct)</span>
            )}
          </span>
        </div>
      )}
      <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
