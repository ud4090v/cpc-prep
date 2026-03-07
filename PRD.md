# PRD: CPC Exam Prep Flash Card Web App

## Overview
A responsive web app to help Dee study for the CPC (Certified Professional Coder) certification exam. Focuses on medical terminology flash cards with two study modes and AI-powered feedback.

## Target User
- **Primary:** Dee (Serge's wife) studying for CPC certification
- **Device:** Desktop, laptop, and smartphone
- **Technical level:** Non-technical — must be dead simple to use

---

## Content: Flash Card Dataset

### Source
1. `human_anatomy_study_guide.docx` — Dee's study guide (13 body systems, ~731 paragraphs)
2. Augmented with standard CPC medical terminology (prefixes, suffixes, abbreviations)

### Body Systems Covered
1. Integumentary
2. Musculoskeletal (Muscular, Skeletal, Joints)
3. Cardiovascular & Blood
4. Lymphatic
5. Respiratory
6. Digestive
7. Urinary
8. Reproductive (Male & Female)
9. Endocrine
10. Nervous
11. Ear & Eye

### Card Categories (per system)
- Root words / combining forms
- Prefixes
- Suffixes
- Combined terms (breakdown + meaning)
- Diseases & disorders
- Diagnostic procedures
- Therapeutic & surgical procedures
- Pharmacology terms
- Abbreviations
- Key anatomical terms / bone names

### Card Format (JSON)
```json
{
  "id": "integumentary-roots-001",
  "system": "Integumentary",
  "category": "root_word",
  "term": "Derm/o, Dermat/o",
  "definition": "Skin",
  "explanation": "From Greek 'derma' meaning skin. Used in terms like dermatitis (skin inflammation) and dermatology (study of skin).",
  "example": "Dermatitis — inflammation of the skin",
  "difficulty": "basic"
}
```

### Estimated Card Count
- ~500–700 cards after parsing + augmentation

---

## Core Features

### 1. Study Mode (Learning)
- Cards displayed one at a time
- User selects answer mode: **Multiple Choice** or **Type Answer**
- **Multiple Choice:** 4 options, immediate feedback on selection
- **Type Answer:** Free-text input, AI evaluates semantic correctness (not exact string match)
- After answering: show ✅/❌ + correct answer + explanation
- Navigation: Next card (random or sequential by category)
- Filter by: system, category, difficulty
- Session progress bar (cards seen vs. total)

### 2. Quiz Mode (Exam Simulation)
- Timed per-question (configurable, default: 90 seconds — mirrors CPC pacing)
- No immediate feedback during quiz
- Both answer modes supported (MC or type)
- Configurable: number of questions, systems to include, categories to include
- At end: comprehensive results screen
  - Score (% correct)
  - Time per question
  - Per-system breakdown
  - Per-category breakdown
  - Weak areas highlighted
  - Each question reviewed: your answer vs. correct + explanation
  - "Study these cards" shortcut to focus on missed items

### 3. Answer Analysis (AI)
- **Model:** GPT-4o-mini (fast, cheap, sufficient)
- **For typed answers:** Evaluate semantic correctness — accept equivalent phrasings, partial credit for close answers
- **Feedback format:** 
  - Correct: Brief confirmation + reinforcing fact
  - Partially correct: What was right, what was missing
  - Incorrect: What the right answer is + why + memory hook if possible
- **Post-quiz analysis:** GPT-4o-mini summarizes performance, identifies patterns, suggests focus areas

### 4. Progress Tracking
- Per-card stats: attempts, correct/incorrect, avg time
- Per-session stats: date, mode, score, duration, system/category breakdown
- Streak tracking (days studied)
- Weak card identification (cards missed 2+ times)
- "Weak cards" filter in Study Mode

---

## Architecture

### Stack
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend:** Next.js API routes (serverless, Vercel)
- **Database:** Supabase (PostgreSQL)
- **AI:** OpenAI API (GPT-4o-mini)
- **Auth:** None (no login required — single user app, Dee just opens the URL)
- **Deployment:** Vercel

### Supabase Schema

#### `cards` table (static dataset)
```sql
id          text PRIMARY KEY,  -- e.g. "integumentary-roots-001"
system      text,
category    text,
term        text,
definition  text,
explanation text,
example     text,
difficulty  text               -- basic | intermediate | advanced
```

#### `sessions` table
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
user_id     uuid REFERENCES auth.users,
mode        text,              -- study | quiz
started_at  timestamptz,
ended_at    timestamptz,
card_count  int,
score_pct   float,
filters     jsonb              -- { systems: [], categories: [] }
```

#### `answers` table
```sql
id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
session_id   uuid REFERENCES sessions,
card_id      text REFERENCES cards,
user_answer  text,
is_correct   boolean,
time_seconds float,
ai_feedback  text,
answered_at  timestamptz
```

#### `card_stats` table (materialized per user)
```sql
user_id       uuid REFERENCES auth.users,
card_id       text REFERENCES cards,
attempts      int DEFAULT 0,
correct       int DEFAULT 0,
last_seen     timestamptz,
avg_time_sec  float,
PRIMARY KEY (user_id, card_id)
```

### API Routes
- `POST /api/evaluate` — Send user answer + card to GPT-4o-mini, return feedback
- `POST /api/sessions` — Create/update session
- `POST /api/answers` — Record answer + stats
- `GET /api/stats` — Fetch user progress summary
- `POST /api/analyze` — Post-quiz analysis (GPT-4o-mini summary)

### Environment Variables
```
OPENAI_API_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

---

## UI/UX Requirements

### Design Principles
- **Mobile-first** responsive layout
- Clean, minimal — no clutter
- Large readable text (medical terms can be long)
- High contrast for readability
- Clear visual feedback (green/red for correct/wrong)
- No more than 2 actions visible at any time

### Key Screens
1. **Home / Dashboard** — progress summary, quick-start buttons (Study / Quiz)
2. **Study Screen** — card front, answer input (MC or type), feedback panel
3. **Quiz Setup** — configure quiz (# questions, systems, time per card)
4. **Quiz Screen** — card + timer + answer input (no feedback shown)
5. **Quiz Results** — full analysis + missed cards list
6. **Progress** — stats charts (correct rate over time, by system)

### Color Palette (suggestion)
- Primary: Medical blue (#0077B6)
- Success: Green (#2D9E4A)
- Error: Red (#D62828)
- Background: Off-white (#F8F9FA)
- Neutral: Dark gray text

---

## Data Pipeline

### Step 1: Parse & Structure Dataset
- Script to parse `human_anatomy_study_guide.docx`
- Extract per-system, per-category terms
- Augment with standard CPC terminology (prefixes, suffixes, abbreviations not in the doc)
- Output: `cards.json` (~500-700 cards)

### Step 2: Seed Supabase
- Migration script to insert all cards into `cards` table

### Step 3: Build & Deploy
- Next.js app on Vercel
- Supabase project (new, dedicated to this app)
- Auth: magic link or simple email/password

---

## Out of Scope (v1)
- Multi-user support (single user: Dee)
- Spaced repetition algorithm (FSRS/SM2) — add in v2
- Audio pronunciation
- Image-based cards (anatomy diagrams)
- Mobile app (PWA could be added easily later)

---

## Completion Criteria
- [ ] Flash card dataset parsed and seeded (~500+ cards)
- [ ] Study mode: MC + type answer working with AI feedback
- [ ] Quiz mode: timed, no feedback, full results at end
- [ ] Progress stats saved to Supabase
- [ ] Responsive — works on iPhone and desktop
- [ ] Deployed to Vercel
- [ ] Auth: Dee can log in
- [ ] Post-quiz AI analysis working

---

## Project Info
- **Repo:** `ud4090v/cpc-prep` (personal account)
- **Vercel team:** BlackRabbitDev
- **Supabase project:** new (cpc-prep)
- **Auth:** None — no login, Dee just opens the URL
- **Estimated build time:** 2-3 ralph loop sessions
