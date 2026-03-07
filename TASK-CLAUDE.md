# Task: Fix & Complete CPC Exam Prep App

You are taking over a partially-built Next.js app. The skeleton exists but is incomplete and broken. Your job is to make this a fully working, polished app.

## What exists (don't delete):
- `data/cards.json` — 583 flash cards (term + definition + category + system) — BUT explanations and examples are all placeholders. Fix them.
- `supabase/migrations/001_initial.sql` — DB schema is correct, keep it
- `pages/api/` — API route files exist but are incomplete
- `package.json` — dependencies listed but not installed

## Problems to fix:

### 1. Fix cards.json — synthesize real explanations
Every card in `data/cards.json` has `"explanation": "Context and importance in CPC coding."` and `"example": "Example of usage here."` — these are placeholders. 

Write a script `scripts/enrich_cards.py` that:
- Reads `data/cards.json`
- For each card, generates a real explanation and example based on the term, definition, category, and system
- For root words/prefixes/suffixes: explain what it means, where it comes from, give a real medical term example using it
- For diseases/disorders: explain what it is, key symptoms or characteristics
- For procedures: explain what the procedure involves
- For pharmacology: explain drug class and what it treats
- For bone names / anatomy: explain location and significance
- For abbreviations: spell out and explain usage context
- Output: `data/cards_enriched.json`

Run the script with python3 to produce the enriched file, then rename it to `data/cards.json`.

### 2. Upgrade dependencies
Update `package.json` to current stable versions:
- next: 14.2.0
- react / react-dom: 18.2.0
- openai: 4.28.0 (NOT v3 — v3 is deprecated)
- @supabase/supabase-js: 2.39.0
- typescript: 5.3.3
- tailwindcss: 3.4.1
- Remove `axios` — use native fetch instead

Add missing config files:
- `tsconfig.json` (Next.js 14 standard config)
- `postcss.config.js`
- `next.config.js`
- `tailwind.config.js` (update with content paths)

### 3. Rewrite the UI — make it actually work and look good

Use TypeScript (.tsx files). Use Tailwind for all styling. Mobile-first responsive.

Color scheme:
- Primary blue: #0077B6
- Success green: #2D9E4A  
- Error red: #D62828
- Background: #F8F9FA
- Text: #1A1A2E

#### `app/` directory structure (Next.js 14 App Router):
```
app/
  layout.tsx         — root layout with nav
  page.tsx           — dashboard/home
  study/page.tsx     — study mode
  quiz/page.tsx      — quiz setup + quiz
  progress/page.tsx  — stats
  api/
    evaluate/route.ts
    sessions/route.ts
    answers/route.ts
    stats/route.ts
    analyze/route.ts
    cards/route.ts
components/
  FlashCard.tsx
  AnswerInput.tsx     — handles both MC and type modes
  FeedbackPanel.tsx
  Timer.tsx
  ProgressBar.tsx
  QuizResults.tsx
lib/
  supabase.ts
  openai.ts
  cards.ts            — loads cards.json, helper functions
types/
  index.ts            — Card, Session, Answer, Stats interfaces
```

#### Dashboard (`app/page.tsx`)
- Header with app name "CPC Prep" and nav links (Study, Quiz, Progress)
- Stats cards: Total Cards, Studied Today, Overall Accuracy %, Study Streak
- Two big CTA buttons: "Study Mode" and "Take a Quiz"
- Recent sessions list (last 5)
- Loads stats from localStorage (no auth)

#### Study Mode (`app/study/page.tsx`)
- Filter bar at top: Body System dropdown, Category dropdown, Difficulty
- Answer mode toggle: "Multiple Choice" | "Type Answer"
- Flash card display: large term in center, subtle system/category badge
- Multiple Choice: 4 options (1 correct + 3 random from same category), styled buttons
- Type Answer: text input with submit button
- After answering: 
  - Green panel if correct, red if wrong
  - Show correct answer
  - Show AI-generated feedback (call /api/evaluate)
  - "Next Card" button
- Progress bar showing cards seen in session
- Session stats: correct/total shown in header

#### Quiz Mode (`app/quiz/page.tsx`)
Two phases:

**Phase 1 — Setup:**
- Number of questions: 10, 25, 50, custom
- Body systems: checkboxes (all selected by default)
- Answer mode: MC or Type
- Time per question: 30s, 60s, 90s, 120s
- "Start Quiz" button

**Phase 2 — Quiz:**
- One card at a time, NO feedback shown
- Countdown timer (prominent, turns red at <10s)
- Progress indicator: "Question 5 of 25"
- Answer input (MC or type based on setup)
- Auto-advance on timer expiry (mark as unanswered)
- "Skip" button

**Phase 3 — Results:**
- Score: big number "18/25 (72%)"
- Time stats: avg time per question, fastest, slowest
- Per-system breakdown: table with system name, correct/total, %
- AI analysis paragraph (call /api/analyze with full results)
- Missed cards list: each card with your answer vs correct answer + explanation
- "Study Missed Cards" button — goes to study mode filtered to those cards
- "Retake Quiz" and "New Quiz" buttons

#### Progress Page (`app/progress/page.tsx`)
- Overall stats: total attempts, overall accuracy, cards mastered (>80% correct)
- Weak cards list: cards with <50% accuracy, sorted worst first
- Session history: date, mode, score, duration
- Body system breakdown table

### 4. API Routes (rewrite in TypeScript, use OpenAI v4)

#### `app/api/evaluate/route.ts`
```typescript
// POST { cardId, userAnswer, correctAnswer, term, definition }
// Returns { isCorrect: boolean, confidence: 'exact'|'close'|'wrong', feedback: string }
// Use GPT-4o-mini with this system prompt:
// "You are evaluating answers for a CPC medical coding exam study app.
//  Be generous with partial credit — if the student understands the concept, mark correct.
//  Return JSON: { isCorrect: boolean, confidence: string, feedback: string }
//  feedback should be 1-2 sentences max: encouraging if correct, helpful if wrong."
```

#### `app/api/analyze/route.ts`
```typescript
// POST { questions: [{term, correctAnswer, userAnswer, isCorrect, timeSeconds}], score, totalTime }
// Returns { analysis: string } — 3-4 sentence summary:
// What they did well, what to focus on, encouragement
```

#### `app/api/cards/route.ts`
```typescript
// GET — return all cards from cards.json (server-side file read)
// Supports query params: ?system=Integumentary&category=root_word&difficulty=basic
```

#### `app/api/sessions/route.ts`, `app/api/answers/route.ts`, `app/api/stats/route.ts`
- Write to Supabase using service role key
- sessions: create/update session records
- answers: record each answer + update card_stats upsert
- stats: return aggregate stats for a user_id (from localStorage)

### 5. localStorage user_id
- On first visit, generate UUID v4 and store in localStorage as `cpc_user_id`
- Pass this as header `x-user-id` on all API calls
- API routes read it and use it for Supabase queries

### 6. lib/cards.ts
```typescript
// Load cards.json
// getRandomCards(n, filters?) — returns n random cards matching filters
// getMultipleChoiceOptions(card, allCards) — returns 4 options: [correct, ...3 wrong from same category]
// getWeakCards(stats) — returns cards with accuracy < 50%
```

## Install & verify
After writing all files:
1. Run `npm install` 
2. Run `npm run build` — fix any TypeScript errors until build passes
3. Create `.env.local` with placeholder values so build doesn't fail on missing env vars

## Git
Commit everything with message: "feat: complete CPC prep app v1 - full UI, enriched cards, TypeScript"
Push to origin main.

## Completion signal
When done and pushed, run:
openclaw system event --text "Done: CPC prep app complete - UI built, cards enriched, pushed to ud4090v/cpc-prep" --mode now
