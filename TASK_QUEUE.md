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

## Highest Priority

1. Move the main countdown experience onto lounge rivalry cards.
   - Make each rivalry a clear status card in `components/Lounge.tsx`.
   - Show rival identity, current language, round/week, countdown, and current action state.
   - Reuse the new profile identity data from settings so the lounge feels like the main control surface.

2. Align the match-start flow with the approved soft-countdown rule.
   - Weekly match time should remain a countdown / anticipation tool only.
   - If both players are ready, they should be able to start early even before the countdown completes.
   - Copy and button states should make this rule obvious.

3. Classify scopes by target language.
   - If two players study different languages, `/scopes` should group or filter clearly by language.
   - Active and past scopes should still remain separate.

## Engineering Follow-Up

4. Establish a clean lint baseline.
   - Current lint result: 48 problems total (36 errors, 12 warnings).
   - Remove `any` usage in API routes and round/exam/results files.
   - Fix hook ordering / dependency issues in `components/Lounge.tsx`, `components/RivalryDashboard.tsx`, and `components/ScopesPage.tsx`.
   - Clean up unused imports and variables.

## Product Flow And UX

5. Add realtime exam sync.
   - Results realtime is already in place for rival submissions.
   - The remaining gap is optional opponent progress during the exam itself.
   - Use Supabase Realtime on the `submissions` table if that UX proves worthwhile.

6. Deepen the results sharing experience.
   - A share action exists already.
   - The next step is a richer, designed share card or generated image in `components/ResultsPage.tsx`.

7. Create shared domain types.
   - Move `Round`, `Rivalry`, `Exam`, `Submission`, and syllabus shapes into a shared typed module.
   - Reuse those types across client components and API routes.

8. Document local setup and data model.
   - Add `.env.example`.
   - Add Supabase schema or migration notes for `users`, `rivalries`, `rounds`, `exams`, and `submissions`.
   - Replace the boilerplate `README.md`.

## Nice To Have

9. Replace `alert()`-based errors with inline UI states or toasts.

10. Add a minimal regression test strategy.
   - If full automated tests are too much right now, at least add a repeatable smoke-test checklist to the repo docs.

11. Review AI prompt robustness.
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
