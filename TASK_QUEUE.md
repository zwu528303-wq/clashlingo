# Task Queue

Last updated: 2026-03-25

## Recently Completed

- Added website-language support for the first UI batch.
  - Website UI now supports `English` and `简体中文`.
  - Login now includes a first-visit language toggle for unsigned users.
  - Settings now stores `Website Language` in auth metadata.
  - The first translated batch covers Login, Reset Password, Lounge, Rivalries, Scopes, Settings, How It Works, and AppSidebar.
- Fixed the exam route wiring.
  - `app/round/[id]/exam/page.tsx` now renders the real exam experience.
- Added the first-pass settings and profile flow.
  - `/settings` now supports nickname, letter avatar, avatar color, default language, and weekly match time.
- Fixed nickname sync for shared views.
  - `app/api/profile/route.ts` now syncs `users.display_name` server-side.
  - This matches the real `users` table shape (`id`, `display_name`, `avatar_url`, `created_at`).
- Extended shared profile sync to public avatars.
  - `app/api/profile/route.ts` now also syncs letter-avatar identity into the public `users` row.
  - Lounge and rivalry surfaces now render rival avatar letter/color from shared profile data instead of local fallback styling.
- Added `Display Nickname` directly to sign-up.
  - New accounts now collect nickname during registration instead of waiting for settings.
  - Login now also attempts a public-profile sync after auth succeeds so shared identity comes online earlier.
- Upgraded auth onboarding and self-service support.
  - Login now includes resend-confirmation and forgot-password entry points.
  - `/reset-password` now exists for completing password recovery from email.
  - Login and empty-lounge states now use a loop-based onboarding guide instead of a generic numbered explainer.
  - `/how-it-works` now exists as the full product manual, and the sidebar links to it.
- Added `Default Language Level`.
  - Settings now supports `Beginner / Elementary / Intermediate / Advanced`.
  - Create/join rivalry now stores each player's level in the rivalry row.
  - Syllabus/exam generation now resolves level server-side from rivalry difficulty and the round target language.
  - Same-language rivalries now generate to the lower of the two saved levels.
- Added `Leave Rivalry`.
  - Rivalry Hub now supports a confirmed leave flow.
  - Leaving preserves rivalry history, removes the rivalry from lounge, and blocks future rounds.
  - The flow is blocked whenever an active round still exists.
- Removed email-style public identity fallback.
  - Lounge, rivalry, and scopes now avoid showing email-derived display names.
- Restored a clean lint baseline.
  - `npm run lint` now passes.
  - Current expectation: whenever a page is touched, clear that page's lint issues before moving on.
- Moved the lounge into a rivalry-card control surface.
  - Lounge now shows rivalry cards with rival identity, round context, and countdown/status panels.
  - Active rounds surface key states such as topic selection, confirmation, countdown, exam ready, and exam live.
- Added always-visible weekly rhythm countdowns to paired lounge cards.
  - Rivalry cards now keep a weekly countdown visible before a round enters the actual `countdown` state.
  - Rivalry cards now make the soft-countdown rhythm visible from the lounge.
- Shifted weekly rhythm from viewer-local preference to rivalry-shared data.
  - New rivalries now inherit the creator's default weekly rhythm.
  - Each rivalry now keeps its own shared countdown pulse instead of recomputing from whichever player is viewing.
  - Exam completion now preserves that shared pulse when cumulative rivalry stats are updated.
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
- Added a real `Rivalries` destination and split lounge vs hub responsibilities.
  - Sidebar now includes `Rivalries` globally.
  - `/rivalries` now exists as a real hub page with rivalry selection, W/L, streak, milestone, and match history.
  - Lounge card entry points and several round/result return links now point to the rivalry hub flow instead of treating `/rivalry/[id]` as the only entry.
- Shipped the first B-style UI fusion pass across `Lounge` and `Rivalries`.
  - `components/Lounge.tsx` now uses a more featured duel-card layout, stronger countdown panels, and a more designed `Start New Rivalry` card.
  - `components/RivalryDashboard.tsx` now uses a stronger hub-style VS hero, rivalry selector cards, richer history cards, and a clearer action/stats rail.
  - `components/AppSidebar.tsx` now matches the same visual language more closely.

## Highest Priority

1. Deepen the results sharing experience.
   - A share action exists already.
   - The next step is a richer, designed share card or generated image in `components/ResultsPage.tsx`.

2. Decide whether to finish the second website-language translation batch.
   - First-batch bilingual UI is live.
   - Remaining major pages are `Round`, `Exam`, and `Results`, plus a few API-returned system messages.

3. Keep the lint baseline clean while touching product work.
   - `npm run lint` currently passes.
   - Do not allow page-level lint debt to pile up again.
   - When a screen is changed, fix that screen's lint issues in the same batch.

4. Decide whether the new lounge / rivalries visual pass needs one more polish round.
   - The first UI fusion pass is shipped.
   - Any follow-up should stay visual-only and preserve the current lounge-vs-hub responsibility split.

## Engineering Follow-Up

5. Add a minimal regression test strategy.
   - If full automated tests are too much right now, at least add a repeatable smoke-test checklist to the repo docs.

6. Review AI prompt robustness.
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
