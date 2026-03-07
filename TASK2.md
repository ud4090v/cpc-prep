# Task 2: Fix & Complete CPC Prep App

The scaffold from the first pass exists. Everything is placeholder stubs. Your job is to make it real.

## Priority 1: Build the real flash card dataset

Rewrite `scripts/parse_cards.py` completely. The current version is a stub that doesn't work.

Requirements:
- Parse `human_anatomy_study_guide.docx` using the `python-docx` library
- The doc has Heading 1 sections for each body system (13 systems)
- Each system has paragraphs with terms in format "Term: Definition" or "Term/o: Meaning"
- Extract ALL of these categories from each system:
  - Root words / combining forms (e.g. "Derm/o: Skin")
  - Prefixes (e.g. "Epi-: Upon, over")
  - Suffixes (e.g. "-itis: Inflammation")
  - Combined terms with examples (e.g. "Epidermis: Upon the skin")
  - Diseases and disorders (e.g. "Acne, eczema, psoriasis...")
  - Diagnostic procedures
  - Therapeutic and surgical procedures
  - Pharmacology terms
  - Abbreviations (e.g. "BCC: Basal Cell Carcinoma")
  - Key anatomical terms / bone names
- For each card generate:
  - id: "{system-slug}-{category-slug}-{index:03d}" e.g. "integumentary-root-001"
  - system: body system name
  - category: one of: root_word | prefix | suffix | combined_term | disease | diagnostic | procedure | pharmacology | abbreviation | anatomy
  - term: the medical term or word part
  - definition: what it means
  - explanation: 1-2 sentences of context/why it matters for CPC coding
  - example: a real usage example (from doc or synthesized)
  - difficulty: "basic" | "intermediate" | "advanced"
- Also add at least 50 standard CPC medical terminology cards not in the doc (common coding abbreviations: CPT, ICD-10, DRG, E/M, NEC, NOS, etc. and common procedural suffixes used in coding)
- Run the script: `cd /root/.openclaw/workspace/projects/cpc-prep/app && pip install python-docx -q && python scripts/parse_cards.py`
- Verify output: `data/cards.json` must be valid JSON with 400+ cards
- Print card count and breakdown by system when done

## Priority 2: Implement real Next.js pages

The pages directory has Dashboard.js, Study.js, Quiz.js as stubs. Build real implementations.

### pages/index.js (Dashboard)
- Show: total cards available, cards studied today, overall accuracy %, study streak
- Load stats from localStorage (no auth)
- Two big buttons: "Study Mode" and "Quiz Mode"  
- Filter chips: by body system (click to filter study/quiz)
- Recent session history (last 5 sessions from localStorage)
- Clean medical blue design, mobile-responsive

### pages/study.js (Study Mode)
- Load cards from `/api/cards` (reads data/cards.json)
- State: current card index, answer mode (MC/type), score, streak
- Card display: show term prominently, category badge, system badge
- Answer mode toggle: "Multiple Choice" | "Type Answer" (persisted in localStorage)
- Multiple choice: generate 4 options (1 correct + 3 random wrong answers from same category)
- Type answer: text input, submit button, evaluate via POST /api/evaluate
- After answer: show feedback panel (correct/wrong + explanation + example)
- Navigation: Next Card button, Skip button
- Filter sidebar (mobile: bottom sheet): filter by system, category
- Progress bar at top: cards seen this session / total
- Save each answer to localStorage stats

### pages/quiz.js (Quiz Mode)
- Step 1: Setup screen — choose # questions (10/25/50), systems to include, answer mode
- Step 2: Quiz screen — card + countdown timer (90s, shown as progress bar), answer input
  - No feedback shown during quiz
  - Timer auto-advances on expire (mark as wrong)
  - Question counter: "Question 8 of 25"
- Step 3: Results screen after all questions:
  - Score: X/Y correct (%)
  - Total time taken
  - Per-system breakdown table
  - Per-category breakdown  
  - List of missed questions with correct answer + explanation
  - "Study missed cards" button (saves missed card IDs to localStorage, redirects to /study with filter)
  - "Save results" button (saves to Supabase via POST /api/sessions + POST /api/answers)

### pages/progress.js (Progress)
- Load from localStorage: total sessions, avg score, cards mastered (>80% correct), weak cards (<50%)
- Charts: accuracy over time (simple bar chart using inline SVG or CSS bars — no external chart lib)
- Weak cards list: show top 10 weakest cards with "Study these" button
- System breakdown: accuracy per body system

## Priority 3: Implement real API routes

### pages/api/cards.js (NEW - add this)
```js
// GET /api/cards?system=X&category=Y&limit=N
// Reads data/cards.json, filters, returns cards
// Shuffle using Fisher-Yates
```

### pages/api/evaluate.js (NEW - add this)  
```js
// POST /api/evaluate
// Body: { cardId, userAnswer, correctAnswer, term }
// Call OpenAI gpt-4o-mini to evaluate semantic correctness
// Return: { isCorrect: bool, confidence: 'high'|'medium'|'low', feedback: string, explanation: string }
// Use OPENAI_API_KEY from process.env
// Use openai npm package (install if needed)
```

### pages/api/sessions.js — implement it:
```js
// POST: create session in Supabase, return session id
// PATCH: update session with final stats
```

### pages/api/answers.js — implement it:
```js
// POST: record answer in Supabase answers table, upsert card_stats
```

### pages/api/analyze.js — implement it:
```js
// POST { sessionId }
// Fetch all answers for session from Supabase
// Call gpt-4o-mini to generate analysis summary
// Return { analysis: string, weakAreas: string[], recommendations: string[] }
```

### pages/api/stats.js — implement it:
```js
// GET: return aggregate stats from Supabase (total sessions, avg score, per-system accuracy)
```

## Priority 4: Supabase migration
Fix `supabase/migrations/001_initial.sql` — must match this exact schema:

```sql
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
```

## Priority 5: Package.json and dependencies
Ensure package.json has all needed deps:
- next, react, react-dom
- @supabase/supabase-js
- openai
- typescript, @types/react, @types/node
- tailwindcss, postcss, autoprefixer

Run `npm install` to verify no missing packages.

## Priority 6: Environment and config files
- `.env.local.example` with all required vars
- `next.config.js` — standard config
- `tsconfig.json` — standard Next.js TS config  
- `postcss.config.js` — for Tailwind
- `tailwind.config.js` — configure content paths

## Final steps
1. Run the parser: `python scripts/parse_cards.py` — confirm 400+ cards in data/cards.json
2. Run `npm install` — confirm no errors
3. Run `npm run build` — fix any TypeScript/build errors until it passes
4. `git add -A && git commit -m "feat: complete implementation - real parser, pages, and API routes"`
5. `git push origin main`
6. Run: `openclaw system event --text "Done: CPC prep app complete - parser generated cards, all pages and APIs implemented, build passes" --mode now`
