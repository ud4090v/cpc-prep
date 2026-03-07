CREATE TABLE cards (
  id text PRIMARY KEY,
  system text NOT NULL,
  category text NOT NULL,
  term text NOT NULL,
  definition text NOT NULL,
  explanation text,
  example text,
  difficulty text DEFAULT 'basic'
);

CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  mode text NOT NULL,
  card_count int DEFAULT 0,
  score_pct float,
  filters jsonb
);

CREATE TABLE answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions(id),
  card_id text REFERENCES cards(id),
  user_answer text,
  is_correct boolean,
  time_seconds float,
  ai_feedback text,
  answered_at timestamptz DEFAULT now()
);

CREATE TABLE card_stats (
  card_id text REFERENCES cards(id),
  attempts int DEFAULT 0,
  correct int DEFAULT 0,
  last_seen timestamptz,
  avg_time_sec float,
  PRIMARY KEY (card_id)
);
