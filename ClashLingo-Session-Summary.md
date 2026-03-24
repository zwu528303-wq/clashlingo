# ClashLingo Session Summary

Date: 2026-03-24

## What Changed This Session

- Added cross-session handoff docs in the project root:
  - `CLAUDE.md`
  - `AGENTS.md`
  - `PROJECT_STATUS.md`
  - `TASK_QUEUE.md`
  - `ClashLingo-Session-Summary.md`
- Added `PROJECT_RULES.md` as the product behavior source of truth.
- Fixed `app/round/[id]/exam/page.tsx` so the exam route now renders `components/ExamPage.tsx`.
- Added a first-pass `Settings` flow for nickname, letter avatar, avatar color, default language, and weekly match time.

## What Was Verified

- `npm run build` passes.
- `npm run lint` fails with 36 problems total (26 errors, 10 warnings).

## Important Findings

- Realtime is currently implemented for `rounds` updates only.
- The repo depends on `.env.local` with these keys:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `ANTHROPIC_API_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- `README.md` is still boilerplate and should not be treated as accurate project documentation.

## Recommended Next Task

1. Manually test the full round lifecycle now that the exam route is corrected.
2. Start reducing the lint errors while preserving behavior.
3. Replace the visible dev-only exam shortcut with a real countdown-to-exam transition.

## Next Session Start Order

1. Read `PROJECT_STATUS.md`
2. Read `TASK_QUEUE.md`
3. Read this file
