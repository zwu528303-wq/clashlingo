# Task Queue

Last updated: 2026-03-24

## Recently Completed

- Fixed the exam route wiring.
  - `app/round/[id]/exam/page.tsx` now renders the real exam experience.
  - This was the old top-priority task and is no longer in the active queue.

## Highest Priority

1. Establish a clean lint baseline.
   - Remove `any` usage in API routes and round/exam/results files.
   - Fix hook issues in `components/Lounge.tsx`, `components/RivalryDashboard.tsx`, and results-related pages.
   - Clean up unused imports and variables.

2. Replace the current dev-only exam shortcut with a real flow.
   - Right now the countdown path depends on a visible `DEV: Skip to Exam Ready` button in `components/RoundPage.tsx`.
   - Decide how the app should automatically transition from study countdown to exam generation.
   - Hide dev-only controls outside development.

## Product Flow And UX

3. Add realtime results and exam sync.
   - Subscribe to `submissions` updates.
   - Auto-refresh results when the rival submits.
   - Optionally show opponent progress during the exam.

4. Add a social sharing card on the results page.
   - Main target file: `components/ResultsPage.tsx`
   - Generate a shareable card or image after each round.
   - Keep the visual style aligned with the current playful UI.

5. Create shared domain types.
   - Move `Round`, `Rivalry`, `Exam`, `Submission`, and syllabus shapes into a shared typed module.
   - Reuse those types across client components and API routes.

6. Document local setup and data model.
   - Add `.env.example`.
   - Add Supabase schema or migration notes for `users`, `rivalries`, `rounds`, `exams`, and `submissions`.
   - Replace the boilerplate `README.md`.

## Nice To Have

7. Replace `alert()`-based errors with inline UI states or toasts.

8. Add a minimal regression test strategy.
   - If full automated tests are too much right now, at least add a repeatable smoke-test checklist to the repo docs.

9. Review AI prompt robustness.
   - Validate JSON shape more strictly in both API routes.
   - Decide whether fallback parsing should stay permissive or become stricter.

## Carry-Over From Prior Planning Note

10. Social sharing card
    - Google AI Studio `Results.tsx` had a share-card direction.
    - Generate a shareable image/card after each round.
    - Main file target: `components/ResultsPage.tsx`

11. Real-time exam sync
    - Show opponent progress during exam (optional).
    - Use Supabase Realtime on the `submissions` table.

## Manual Smoke Test Checklist

1. Lounge -> create or join rivalry
2. Rivalry dashboard -> start round -> pick topic
3. Generate syllabus -> verify vocabulary and grammar display
4. Both players confirm -> countdown starts
5. Trigger exam generation -> both players ready up
6. Exam page loads with 24 questions
7. Submit answers -> results page shows review
8. Both players submit -> VS comparison and prize state update
