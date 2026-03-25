# ClashLingo Session Summary

Date: 2026-03-25

## What Changed This Session

- Added and iterated on cross-session handoff docs:
  - `CLAUDE.md`
  - `AGENTS.md`
  - `PROJECT_RULES.md`
  - `PROJECT_STATUS.md`
  - `TASK_QUEUE.md`
  - `ClashLingo-Session-Summary.md`
- Fixed `app/round/[id]/exam/page.tsx` so the exam route now renders `components/ExamPage.tsx`.
- Added a first-pass `Settings` flow for nickname, letter avatar, avatar color, default language, and weekly match time.
- Added `app/api/profile/route.ts` to sync public nickname data server-side.
- Extended public profile sync so shared lounge / rivalry surfaces can render letter-avatar identity from the `users` table.
- Updated the auth screen so sign-up collects `Display Nickname` immediately instead of waiting for settings.
- Expanded auth onboarding and self-service support.
  - Login now includes resend-confirmation and forgot-password entry points.
  - `/reset-password` now exists for completing password recovery from the recovery email.
  - Login and empty-lounge states now use a loop-based onboarding guide so first-time users understand the product loop faster.
  - `/how-it-works` now exists as a full product manual covering the rivalry loop, page roles, rhythm rules, level rules, and FAQ.
- Added website-language support for the first UI batch.
  - Website UI now supports `English` and `简体中文`.
  - Login now includes a first-visit language toggle before sign-in.
  - Settings now persists `Website Language`.
  - The first translated batch covers Login, Reset Password, Lounge, Rivalries, Scopes, Settings, How It Works, and the shared sidebar shell.
  - Learning-language values and AI syllabus/exam logic were not changed by this UI-language work.
- Added `Default Language Level` as a real product setting.
  - Settings now supports `Beginner / Elementary / Intermediate / Advanced`.
  - New and joined rivalries now persist each player's level in `player_a_difficulty` / `player_b_difficulty`.
  - AI syllabus and exam generation now resolve level server-side from rivalry data and `round.target_lang`.
  - Same-language rivalries now generate to the lower saved level.
- Fixed the `users` sync bug by matching the real table shape.
  - `users` has `id`, `display_name`, `avatar_url`, and `created_at`
  - it does not have an `email` column
- Removed email-style public identity fallback from lounge / rivalry / scopes.
- Shifted weekly rhythm from a viewer-local preference to rivalry-shared data.
  - New rivalries now inherit the creator's default weekly rhythm.
  - Rivalries now persist their own shared countdown pulse in `cumulative_ledger.shared_weekly_time`.
  - Lounge cards now use that shared pulse, and exam completion preserves it when updating rivalry outcomes.
- Added `Leave Rivalry` as a real shipped flow.
  - Rivalry Hub now supports a confirmed leave action.
  - Leaving preserves rivalry history, removes the rivalry from lounge, and blocks future rounds.
  - Leaving is blocked while any active round still exists.
- Cleaned lint issues across the active pages and supporting routes.
  - `Lounge`, `RivalryDashboard`, `Scopes`, `Settings`, `RoundPage`, `ExamPage`, `ResultsPage`
  - `app/api/generate-syllabus`, `app/api/generate-exam`, `app/rivalry/[id]/new-round/page.tsx`
  - `app/layout.tsx` now uses `next/font/google` for `Plus Jakarta Sans`
- Rebuilt the lounge as a rivalry-card control surface.
  - Rival cards now show rival identity, round number, target language, current status, and countdown / action panels
  - The lounge includes an in-grid "Start New Rivalry" card when the user is below the 2-rivalry limit
- Added weekly rhythm countdowns to paired lounge cards.
  - Even before a round hits the real `countdown` status, rivalry cards now show the weekly countdown timer from the lounge itself.
- Finished the behavioral side of soft-countdown in the round flow.
  - During the `countdown` phase, both players can now mark ready and start the exam early.
  - If the timer finishes first, the existing `exam_ready` sync flow still takes over.
- Grouped the scopes experience by target language.
  - Current scopes and past scopes now render under language sections instead of relying on a past-only filter.
  - Scope review now renders grouped vocabulary correctly.
- Polished round and settings copy to match the shipped soft-countdown behavior.
  - `study_days` is now framed in the UI as a default study window instead of a hard lock.
  - Settings now describe weekly time as a lounge rhythm rather than a round gate.
  - In-exam opponent progress was explicitly de-scoped from the current MVP docs.
- Moved `Scopes` and `Settings` into the shared sidebar shell.
  - Lounge, scopes, and settings now use the same left-side navigation and profile block.
- Replaced the last in-code `alert()` with inline page feedback.
  - `app/rivalry/[id]/new-round/page.tsx` now renders an embedded error banner when round creation fails.
- Added repo setup and data-model docs.
  - `README.md` now documents the real product instead of the create-next-app boilerplate.
  - `.env.example` now lists the required local environment variables.
  - `SUPABASE_SCHEMA.md` now documents the current Supabase tables, relationships, and auth metadata fields.
- Centralized shared domain types in `lib/domain-types.ts`.
  - Shared `Rivalry`, `Round`, `Exam`, `Submission`, `Syllabus`, and related exam/ledger types now back the main pages and AI routes.
- Extended the shared sidebar shell to rivalry dashboard.
  - `components/RivalryDashboard.tsx` now loads the current user profile and renders within the same `AppSidebar` used elsewhere.
- Added a real `Rivalries` page and split lounge vs rivalry-hub responsibilities.
  - Sidebar now includes a persistent `Rivalries` item.
  - `/rivalries` now exists as a real rivalry hub route with rivalry selection, W/L, streak, milestone, and match history.
  - Lounge rivalry cards and several back-links now route users into the rivalry hub flow.
- Shipped the first B-style UI fusion across `Lounge` and `Rivalries`.
  - `Lounge` now uses stronger featured duel cards and more designed countdown/action panels.
  - `RivalryDashboard` now uses a more explicit VS hero, richer match-history cards, and a stronger action/stats rail.
  - `AppSidebar` now visually matches the same product language more closely.

## What Was Verified

- `npm run build` passes.
- `npm run lint` passes.

## Important Findings

- Realtime is currently implemented for `rounds` updates only.
- The repo depends on `.env.local` with these keys:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `ANTHROPIC_API_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- The `users` table does not contain an `email` column, so shared identity code must not assume one exists.
- No sensitive API key values were found in tracked files, git history, client HTML, or client build output during this session.
- Supabase schema notes are now checked in, but they still describe the live database shape rather than checked-in SQL migrations.

## Recommended Next Task

1. Deepen the results sharing experience when you want the next user-facing feature.
2. Decide whether to finish the second website-language translation batch for `Round`, `Exam`, `Results`, and API-returned system messages.
3. Decide whether the new lounge / rivalries UI needs a final visual polish pass.
4. Keep lint clean incrementally as each touched page changes, instead of saving cleanup for the end.

## Next Session Start Order

1. Read `PROJECT_RULES.md`
2. Read `PROJECT_STATUS.md`
3. Read `TASK_QUEUE.md`
4. Read this file
