export interface Card {
  id: string;
  system: string;
  category: string;
  term: string;
  definition: string;
  explanation: string;
  example: string;
  difficulty: string;
  distractors?: string[];
}

export interface Session {
  id: string;
  started_at: string;
  ended_at?: string;
  mode: 'study' | 'quiz';
  card_count: number;
  score_pct?: number;
  filters?: Record<string, string>;
}

export interface Answer {
  id?: string;
  session_id: string;
  card_id: string;
  user_answer: string;
  is_correct: boolean;
  time_seconds: number;
  ai_feedback?: string;
  answered_at?: string;
}

export interface CardStats {
  card_id: string;
  attempts: number;
  correct: number;
  last_seen: string;
  avg_time_sec: number;
}

export interface QuizConfig {
  questionCount: number;
  systems: string[];
  answerMode: 'mc' | 'type';
  timePerQuestion: number;
}

export interface QuizQuestion {
  card: Card;
  options?: string[];
  userAnswer?: string;
  isCorrect?: boolean;
  timeSeconds?: number;
}

export interface EvaluateResponse {
  isCorrect: boolean;
  confidence: 'exact' | 'close' | 'wrong';
  feedback: string;
}

export interface AnalyzeResponse {
  analysis: string;
}

export interface UserStats {
  totalAttempts: number;
  totalCorrect: number;
  accuracy: number;
  cardsStudied: number;
  studyStreak: number;
  sessionsToday: number;
  studiedToday: number;
  recentSessions: SessionRecord[];
  systemBreakdown: Record<string, { attempts: number; correct: number }>;
  weakCards: WeakCard[];
}

export interface SessionRecord {
  id: string;
  date: string;
  mode: string;
  score: number;
  total: number;
  percentage: number;
  duration: number;
}

export interface WeakCard {
  cardId: string;
  term: string;
  system: string;
  attempts: number;
  correct: number;
  accuracy: number;
}

// ── Scenario Mode ─────────────────────────────────────────────────────────────

export type ScenarioAnswerMode = 'mc' | 'type';

export interface ScenarioConfig {
  count: number;
  system: string; // body system name or 'random'
  difficulty: 'easy' | 'medium' | 'hard';
  answerMode: ScenarioAnswerMode;
}

export interface GeneratedScenario {
  id: string;
  system: string;
  difficulty: 'easy' | 'medium' | 'hard';
  clinicalNote: string;
  correctCpt: string[];
  correctIcd10: string[];
  cptOptions?: string[];    // MC mode: 4 shuffled options
  icd10Options?: string[];  // MC mode: 4 shuffled options
  cptRationale: string;
  icd10Rationale: string;
  codingTips?: string;
}

export interface ScenarioAttempt {
  scenario: GeneratedScenario;
  userCpt: string[];
  userIcd10: string[];
  cptCorrect: boolean;
  icd10Correct: boolean;
  cptFeedback: string;
  icd10Feedback: string;
  timeSeconds: number;
}

export interface ScenarioSessionResult {
  attempts: ScenarioAttempt[];
  totalTime: number;
  cptScore: number;
  icd10Score: number;
  total: number;
}
