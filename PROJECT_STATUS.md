# Project Status

Last updated: 2026-03-24
Stage: clickable prototype / early MVP

## Product Summary

ClashLingo is a 1v1 language-learning app where two players create a rivalry, pick a topic, get an AI-generated syllabus, follow a default study window, optionally start early together, take an exam, and compare results.

## Stack

- Next.js 16.2.1 App Router
- React 19.2.4
- TypeScript
- Tailwind CSS 4 with custom theme tokens in `app/globals.css`
- Supabase Auth + Postgres + Realtime
- Anthropic API for syllabus and exam generation

## Visual Direction

- Playful minimalism
- Rounded shapes and oversized cards
- Primary color: `#953f4d`
- Secondary color: `#0c693d`
- Font: Plus Jakarta Sans, currently loaded via `next/font/google` in `app/layout.tsx`

## Main Routes

- `/` - checks Supabase auth, redirects to `/login` or `/lounge`
- `/login` - auth UI (`components/Login.tsx`)
- `/lounge` - countdown-first control surface for active rivalries, create rivalry, and join by invite code (`components/Lounge.tsx`)
- `/rivalries` - rivalry hub with rivalry selection, W/L, streak, and match history (`components/RivalryDashboard.tsx`)
- `/settings` - user profile and weekly preference settings (`components/SettingsPage.tsx`)
- `/rivalry/[id]` - deep link into the same rivalry hub component used by `/rivalries`
- `/rivalry/[id]/new-round` - create a new round
- `/round/[id]` - round lifecycle page (`components/RoundPage.tsx`)
- `/round/[id]/exam` - exam experience (`components/ExamPage.tsx`)
- `/round/[id]/results` - results review (`components/ResultsPage.tsx`)

## Server Endpoints

- `/api/generate-syllabus`
  - uses Anthropic to generate a syllabus from topic + target language
  - writes syllabus into `rounds.syllabus`
  - moves round status to `confirming`
- `/api/generate-exam`
  - uses Anthropic to generate a 24-question exam + rubric from the saved syllabus
  - upserts into `exams`
  - moves round status to `exam_ready`
- `/api/profile`
  - validates the signed-in user on the server
  - syncs `users.display_name` for shared surfaces such as lounge, rivalry, and scopes

## Expected Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ANTHROPIC_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Checked-in setup docs now exist in:
- [README.md](./README.md)
- [.env.example](./.env.example)
- [SUPABASE_SCHEMA.md](./SUPABASE_SCHEMA.md)

## Expected Supabase Tables

Observed from the app code:
- `users`
- `rivalries`
- `rounds`
- `exams`
- `submissions`

Observed `users` columns from direct DB check:
- `id`
- `display_name`
- `avatar_url`
- `created_at`

Important note:
- The `users` table does not currently have an `email` column.
- Shared identity sync should only rely on real columns in this table.

## Round Lifecycle

Observed status values:
- `topic_selection`
- `confirming`
- `countdown`
- `exam_ready`
- `exam_live`
- `completed`

## What Works Today

- Email/password sign-up and sign-in through Supabase
- Lounge UI for creating a rivalry and joining by invite code
- Lounge now presents rivalries as status cards with countdown / action panels
- Lounge now keeps a weekly rhythm countdown visible on paired rivalry cards, even before a round reaches the actual study-countdown state
- Lounge, rivalries, scopes, and settings now share a sidebar navigation shell
- The product now separates `Lounge` from `Rivalries` more clearly.
  - Lounge is the operational page for countdowns and entering matches.
  - Rivalries is the history/stats hub for a selected rivalry.
- Settings page for nickname, letter avatar, avatar color, default language, and weekly match time
- Settings save now syncs public nickname server-side through `/api/profile`
- Public/shared identity no longer falls back to email-style display names
- Rivalry dashboard and round list
- New round flow with topic, default study window, and optional prize/stake
- AI syllabus generation and confirmation flow
- Round countdown UI now supports mutual early start, and exam-ready still supports synchronized launch
- Exam generation endpoint
- Exam route now points to `components/ExamPage.tsx`
- Results UI exists in `components/ResultsPage.tsx`
- Scopes now group current and past scope cards by target language
- `npm run lint` currently passes
- Production build currently passes
- The repo now includes a real README, an `.env.example`, and Supabase schema notes
- Shared domain types now live in `lib/domain-types.ts` and are reused across the main pages and AI routes
- `app/rivalry/[id]/new-round/page.tsx` now uses inline error feedback instead of `alert()`

## Current Health Check

Ran on 2026-03-24:
- `npm run build` - passes
- `npm run lint` - passes

## Known Issues And Risks

- Live opponent exam-progress UI is intentionally out of scope for the current MVP. Results realtime remains the main competitive sync surface for now.
- There are still no checked-in Supabase SQL migrations; `SUPABASE_SCHEMA.md` documents the live shape, but it is not a migration source of truth yet.
- `components/ExamPage.tsx` can create a mock exam client-side if no exam record exists. That is useful for fallback/demo purposes, but it can hide backend issues if left untracked.

## Notes For The Next Session

- Start by reading `PROJECT_RULES.md`, then this file, then `TASK_QUEUE.md`, then `ClashLingo-Session-Summary.md`.
- Prioritize results-sharing polish next if you want another user-facing feature, or move into test strategy / AI output hardening for cleanup.
- If you continue the UI pass, keep pushing the current `Lounge` vs `Rivalries` split instead of blending those two responsibilities together again.
- Re-run the full round flow manually after any lounge, countdown, or scope grouping changes.
- If you change infra assumptions, update `README.md`, `.env.example`, and `SUPABASE_SCHEMA.md` in the same batch.
