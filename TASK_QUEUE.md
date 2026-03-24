# Task Queue

Last updated: 2026-03-24

## Recently Completed

- Fixed the exam route wiring.
  - `app/round/[id]/exam/page.tsx` now renders the real exam experience.
- Added the first-pass settings and profile flow.
  - `/settings` now supports nickname, letter avatar, avatar color, default language, and weekly match time.
- Fixed nickname sync for shared views.
  - `app/api/profile/route.ts` now syncs `users.display_name` server-side.
  - This matches the real `users` table shape (`id`, `display_name`, `avatar_url`, `created_at`).
- Removed email-style public identity fallback.
  - Lounge, rivalry, and scopes now avoid showing email-derived display names.
- Removed rivalry exit from current MVP rules.
  - This is no longer an active product task.
- Restored a clean lint baseline.
  - `npm run lint` now passes.
  - Current expectation: whenever a page is touched, clear that page's lint issues before moving on.
- Moved the lounge into a rivalry-card control surface.
  - Lounge now shows rivalry cards with rival identity, round context, and countdown/status panels.
  - Active rounds surface key states such as topic selection, confirmation, countdown, exam ready, and exam live.
- Added always-visible weekly rhythm countdowns to paired lounge cards.
  - Rivalry cards now keep a weekly countdown visible before a round enters the actual `countdown` state.
  - Rivalry cards now make the soft-countdown rhythm visible from the lounge.
- Shipped the behavioral side of soft-countdown.
  - During the `countdown` phase, both players can now tap ready and start the exam early.
  - `exam_ready` still works as the synchronized fallback when the timer expires first.
- Grouped `/scopes` by target language.
  - Current scopes and past scopes now classify cards under language sections.
  - The scopes review view also renders grouped vocabulary entries instead of flattening them into `[object Object]`.

## Highest Priority

1. Polish the remaining round-flow copy.
   - The behavior is now soft-countdown, but there are still some old "study days" phrases worth reviewing.
   - Make sure lounge, round, and settings language all describe countdown as a rhythm rather than a lock.

## Engineering Follow-Up

2. Keep the lint baseline clean while touching product work.
   - `npm run lint` currently passes.
   - Do not allow page-level lint debt to pile up again.
   - When a screen is changed, fix that screen's lint issues in the same batch.

## Product Flow And UX

3. Add realtime exam sync.
   - Results realtime is already in place for rival submissions.
   - The remaining gap is optional opponent progress during the exam itself.
   - Use Supabase Realtime on the `submissions` table if that UX proves worthwhile.

4. Deepen the results sharing experience.
   - A share action exists already.
   - The next step is a richer, designed share card or generated image in `components/ResultsPage.tsx`.

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

## Manual Smoke Test Checklist

1. Lounge -> create or join rivalry
2. Rivalry dashboard -> start round -> pick topic
3. Generate syllabus -> verify vocabulary and grammar display
4. Both players confirm -> countdown starts
5. Countdown completes -> exam becomes ready
6. Both players ready up -> exam page loads with 24 questions
7. Submit answers -> results page shows review
8. Both players submit -> VS comparison and share action update
