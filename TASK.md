# Task: Build CPC Exam Prep Flash Card App

Read PRD.md in this directory — that is your full spec. Build everything described.

## Summary
Build a Next.js 14 web app for medical terminology flash cards. No auth required — single user (Dee), just opens URL and studies.

## Key deliverables:

### 1. Flash Card Dataset Script
- Write a Python script `scripts/parse_cards.py` that parses `human_anatomy_study_guide.docx`
- Extract all terms (roots, prefixes, suffixes, combined terms, diseases, diagnostics, procedures, pharmacology, abbreviations, bone names) per body system
- Add explanation and example for each card (synthesize from context in the doc)
- Augment with standard CPC medical terminology not already covered (common prefixes/suffixes used in medical coding)
- Output: `data/cards.json` — array of card objects matching the schema in PRD.md
- Target: 500+ cards

### 2. Next.js 14 App (TypeScript + Tailwind)
Full app with these pages/routes:
- `/` — Home/Dashboard: progress summary, Study and Quiz buttons
- `/study` — Study mode: flash cards with MC or type answer, instant AI feedback
- `/quiz` — Quiz setup + quiz mode: timed, no feedback, full results at end
- `/progress` — Stats overview: cards mastered, weak areas, session history

### 3. Supabase Integration
- Create `supabase/migrations/001_initial.sql` with schema from PRD.md (cards, sessions, answers, card_stats tables)
- Create `scripts/seed.ts` to seed cards from `data/cards.json` into Supabase
- Supabase client setup in `lib/supabase.ts`

### 4. API Routes
- `POST /api/evaluate` — evaluate typed answer via GPT-4o-mini, return { isCorrect, feedback, explanation }
- `POST /api/sessions` — create/update session record
- `POST /api/answers` — record answer + update card_stats
- `GET /api/stats` — return user progress summary
- `POST /api/analyze` — post-quiz GPT-4o-mini analysis

### 5. UI Requirements
- Mobile-first responsive (works great on iPhone AND desktop)
- Clean, minimal — no clutter, large readable text
- Clear green/red visual feedback
- Medical blue color scheme (#0077B6 primary)
- Study mode: show card term, answer options or text input, then feedback panel
- Quiz mode: card + countdown timer (90s default), answer input, progress indicator
- Quiz results: score, time stats, per-system breakdown, each missed card with explanation

### 6. Environment Setup
Create `.env.local.example`:
```
OPENAI_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Tech Stack
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase JS client
- OpenAI SDK (for GPT-4o-mini calls)

## Important Notes
- NO authentication — no login screens, no auth middleware
- Stats tracking uses localStorage for user_id (generate UUID on first visit, persist)
- All Supabase writes use service role key server-side (API routes), not client-side
- Keep components clean and focused — one job per component
- Use server components where possible, client components only for interactivity

## Git
- Branch: main
- Commit frequently with clear messages
- Final commit message: "feat: complete CPC prep app v1"

## Completion Signal
When completely finished and code is committed and pushed to GitHub, run:
openclaw system event --text "Done: CPC prep app built and pushed to ud4090v/cpc-prep" --mode now
