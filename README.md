# ClashLingo

ClashLingo is a playful 1v1 language-learning MVP built with Next.js, React, Supabase, and Anthropic.

Two players create a rivalry, pick a topic, get an AI-generated syllabus tuned to the target learner's level, study on their own, start early together if they want, take an exam, and compare results.

## Stack

- Next.js 16.2.1 App Router
- React 19.2.4
- TypeScript
- Tailwind CSS 4
- Supabase Auth + Postgres + Realtime
- Anthropic API for syllabus and exam generation

## Core Flow

1. Sign in with email/password.
2. Create or join a rivalry from `/lounge`.
3. Start a new round with a topic and default study window.
4. Generate a syllabus with `/api/generate-syllabus`.
5. Both players confirm the scope.
6. Follow the weekly countdown rhythm or start early together.
7. Generate/take the exam.
8. Compare results and review the tested scope.

## Main Routes

- `/` redirects to `/login` or `/lounge` based on auth.
- `/login` handles auth, onboarding guidance, resend confirmation, and password-reset entry.
- `/reset-password` lets a user set a new password from a recovery email.
- `/how-it-works` explains the product loop, page roles, rhythm rules, level rules, and FAQs.
- `/lounge` is the main rivalry control surface.
- `/settings` manages nickname, letter avatar, language preference, default language level, and weekly rhythm.
- `/scopes` shows current and past scopes, grouped by language.
- `/rivalry/[id]` shows rivalry history and stats.
- `/rivalry/[id]/new-round` creates a round.
- `/round/[id]` runs the round lifecycle.
- `/round/[id]/exam` is the exam experience.
- `/round/[id]/results` is the results review screen.

## Environment Variables

Copy `.env.example` to `.env.local` and fill in real values:

```bash
cp .env.example .env.local
```

Required keys:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ANTHROPIC_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Notes:

- `NEXT_PUBLIC_*` variables are intentionally exposed to the browser.
- `ANTHROPIC_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` must stay server-only.
- `.env.local` is ignored by git and should never be committed.

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` starts the local dev server.
- `npm run lint` runs ESLint.
- `npm run build` builds the production app.
- `npm run start` runs the built app.

## Data Model

Supabase is the source of truth for auth and gameplay data.

- Auth identity lives in Supabase Auth.
- Public/shared display identity is mirrored into the public `users` table.
- Gameplay data lives in `rivalries`, `rounds`, `exams`, and `submissions`.

See [SUPABASE_SCHEMA.md](./SUPABASE_SCHEMA.md) for the current schema and relationship notes.

## Repo Guide

- [PROJECT_RULES.md](./PROJECT_RULES.md): approved product behavior
- [PROJECT_STATUS.md](./PROJECT_STATUS.md): current implementation reality
- [TASK_QUEUE.md](./TASK_QUEUE.md): prioritized next work
- [ClashLingo-Session-Summary.md](./ClashLingo-Session-Summary.md): latest handoff summary

## Current Caveats

- There are no checked-in Supabase SQL migrations yet.
- `SUPABASE_SCHEMA.md` documents the live table shape used by the app today.
- Results realtime exists, but in-exam opponent progress is intentionally out of MVP scope.
- `components/ExamPage.tsx` still has a mock-exam fallback for demo resilience; that is useful, but it can hide backend issues if left unmonitored.

## Manual Smoke Test

1. Sign in.
2. Create or join a rivalry.
3. Start a round and pick a topic.
4. Generate the syllabus and confirm from both sides.
5. Check the lounge countdown behavior.
6. Start early together or wait for exam readiness.
7. Submit both exams.
8. Verify results, scope review, and share behavior.
