'use client';

interface FeedbackPanelProps {
  isCorrect: boolean;
  confidence?: string;
  feedback: string;
  correctAnswer: string;
  explanation?: string;
  loading?: boolean;
}

export default function FeedbackPanel({
  isCorrect,
  confidence,
  feedback,
  correctAnswer,
  explanation,
  loading,
}: FeedbackPanelProps) {
  if (loading) {
    return (
      <div className="mt-6 p-5 bg-gray-50 rounded-xl border border-gray-200 animate-pulse">
        <div className="flex items-center gap-2 text-gray-400">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Evaluating your answer...
        </div>
      </div>
    );
  }

  return (
    <div
      className={`mt-6 p-5 rounded-xl border-2 ${
        isCorrect
          ? 'bg-green-50 border-success/30'
          : 'bg-red-50 border-error/30'
      }`}
    >
      {/* Result header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">{isCorrect ? '✅' : '❌'}</span>
        <span className={`text-lg font-bold ${isCorrect ? 'text-success' : 'text-error'}`}>
          {isCorrect ? 'Correct!' : 'Incorrect'}
          {confidence === 'close' && ' (Close enough!)'}
        </span>
      </div>

      {/* Correct answer */}
      {!isCorrect && (
        <div className="mb-3 p-3 bg-white/50 rounded-lg">
          <span className="text-sm font-semibold text-gray-500">Correct answer: </span>
          <span className="text-text font-medium">{correctAnswer}</span>
        </div>
      )}

      {/* AI Feedback */}
      <p className="text-text/80 leading-relaxed">{feedback}</p>

      {/* Explanation */}
      {explanation && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-sm text-gray-500 font-semibold mb-1">📚 Explanation:</p>
          <p className="text-sm text-text/70">{explanation}</p>
        </div>
      )}
    </div>
  );
}
