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
- Polished round/new-round/settings copy around countdown rules.
  - `study_days` is now framed in the UI as a default study window instead of a hard lock.
  - Weekly time is described as a lounge rhythm, not a round gate.
  - Realtime opponent exam progress is explicitly out of scope for the current MVP.
- Moved `Scopes` and `Settings` into a shared sidebar shell.
  - Lounge, scopes, and settings now share the same left-side navigation and profile block.
  - The old top-row `Scopes / Settings / Log out` navigation on lounge has been folded into the sidebar.
- Replaced the remaining `alert()`-based round-creation error with inline page feedback.
  - `app/rivalry/[id]/new-round/page.tsx` now shows an embedded error banner instead of a blocking browser alert.
- Added repo setup and data-model docs.
  - `README.md` now describes the real product, routes, setup flow, and caveats.
  - `.env.example` now documents the required environment variables.
  - `SUPABASE_SCHEMA.md` now documents the current Supabase tables, relationships, and auth metadata usage.
- Centralized shared domain types.
  - `lib/domain-types.ts` now defines shared `Rivalry`, `Round`, `Exam`, `Submission`, `Syllabus`, and related exam/ledger types.
  - Lounge, rivalry, round, exam, results, scopes, new-round, and both AI routes now import those types instead of redefining them locally.
- Extended the shared sidebar shell to rivalry dashboard.
  - `components/RivalryDashboard.tsx` now loads the current profile and renders through the same `AppSidebar` used by lounge, scopes, and settings.
  - The page keeps its own content and back-to-lounge action, but no longer relies on a separate top-right settings shortcut.

## Highest Priority

1. Deepen the results sharing experience.
   - A share action exists already.
   - The next step is a richer, designed share card or generated image in `components/ResultsPage.tsx`.

2. Keep the lint baseline clean while touching product work.
   - `npm run lint` currently passes.
   - Do not allow page-level lint debt to pile up again.
   - When a screen is changed, fix that screen's lint issues in the same batch.

## Engineering Follow-Up

3. Add a minimal regression test strategy.
   - If full automated tests are too much right now, at least add a repeatable smoke-test checklist to the repo docs.

4. Review AI prompt robustness.
   - Validate JSON shape more strictly in both API routes.
   - Decide whether fallback parsing should stay permissive or become stricter.

## Manual Smoke Test Checklist

1. Lounge -> create or join rivalry
2. Rivalry dashboard -> start round -> pick topic
3. Generate syllabus -> verify vocabulary and grammar display
4. Both players confirm -> default countdown starts
5. Countdown completes or both players start early -> exam becomes ready/live
6. Both players ready up if needed -> exam page loads with 24 questions
7. Submit answers -> results page shows review
8. Both players submit -> VS comparison and share action update
