# Project Status

Last updated: 2026-03-24
Stage: clickable prototype / early MVP

## Product Summary

ClashLingo is a 1v1 language-learning app where two players create a rivalry, pick a topic, get an AI-generated syllabus, study for a few days, take an exam, and compare results.

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
- Font: Plus Jakarta Sans, currently loaded via Google Fonts in `app/layout.tsx`

## Main Routes

- `/` - checks Supabase auth, redirects to `/login` or `/lounge`
- `/login` - auth UI (`components/Login.tsx`)
- `/lounge` - rivalry list, create rivalry, join by invite code (`components/Lounge.tsx`)
- `/rivalry/[id]` - rivalry dashboard and round history (`components/RivalryDashboard.tsx`)
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

## Expected Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ANTHROPIC_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Expected Supabase Tables

Observed from the app code:
- `users`
- `rivalries`
- `rounds`
- `exams`
- `submissions`

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
- Rivalry dashboard and round list
- New round flow with topic, study days, and optional prize/stake
- AI syllabus generation and confirmation flow
- Round countdown UI and exam-ready ready-up flow
- Exam generation endpoint
- Exam route now points to `components/ExamPage.tsx`
- Results UI exists in `components/ResultsPage.tsx`
- Production build currently passes

## Current Health Check

Ran on 2026-03-24:
- `npm run build` - passes
- `npm run lint` - fails with 36 problems total (26 errors, 10 warnings)

Lint failure themes:
- `@typescript-eslint/no-explicit-any`
- React hook rule violations
- unused imports / variables
- route/component drift

## Known Issues And Risks

- Realtime currently subscribes to `rounds` updates only. There is no realtime sync for `submissions` or opponent exam progress yet.
- A visible `DEV: Skip to Exam Ready` button exists in `components/RoundPage.tsx`. It should be gated or removed before production use.
- `README.md` is still the default create-next-app boilerplate and is not the source of truth.
- There is no committed `.env.example`.
- There are no checked-in Supabase migrations or schema notes, so local setup still depends on external context.
- `app/layout.tsx` loads Google Fonts directly in `<head>`, which is already flagged by lint.
- `components/ExamPage.tsx` can create a mock exam client-side if no exam record exists. That is useful for fallback/demo purposes, but it can hide backend issues if left untracked.

## Notes For The Next Session

- Start by reading this file, then `TASK_QUEUE.md`, then `ClashLingo-Session-Summary.md`.
- Re-run the full round flow manually after the exam route fix.
- If you change infra assumptions, document the Supabase schema and add an `.env.example`.
