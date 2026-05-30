# Task Queue

Last updated: 2026-05-30

## Recently Completed

- Added scenario answer-loop audit and persistence planning docs.
  - `docs/project/EXAM_LOOPS_AUDIT.md` maps rivalry exam, scenario clash, and scenario exam with a comparison table, overlaps/conflicts, and a recommended shared answer-run layer.
  - `docs/project/SCENARIO_PERSISTENCE_PLAN.md` documents the current mock/localStorage state and includes a DRAFT non-applied SQL schema plus migration/wiring plan.
- Hardened the battle-pack seed script for cheap future smoke runs.
  - `scripts/seed-battle-packs.ts` now supports `--limit N` and `--only <slug>` in addition to `--dry-run`.
  - Unknown or non-full scenario slugs exit non-zero with available full-launch slugs.
  - Verified dry-run plans for all 144 combos, `--limit 3`, `--only cafe`, and bad slug behavior; no live seed was run.
- Aligned `ScopeBriefing` to the rivalry Syllabus field shape.
  - `vocabularyGroups` now uses an exported `VocabularyGroup`; `sentencePatterns` split into `grammar` + `expressions`; `howBattleWorks` renamed `howTested`.
  - Propagated through `lib/battle-pack.ts`, `app/api/generate-battle-pack/route.ts`, `components/StageBriefingPage.tsx`, and i18n (`briefingGrammarTitle` / `briefingExpressionsTitle` / `briefingHowTestedTitle`).
- Added a battle-pack pre-generation seed script.
  - `scripts/seed-battle-packs.ts` + `npm run seed:battle-packs` cover full scenarios × open stages × {French, English, Spanish} × 4 levels (144 packs), idempotent via the cache, with `--dry-run`.
  - On-demand generation stays the live fallback.
- Shipped the scenario / battle (闯关) main loop and Phase 1 AI battle-pack backend (checkpoint `c33c0dd`).
  - Catalog, types, routes, components, `app/api/generate-battle-pack`, `lib/battle-pack.ts`, and the `battle_packs` cache migration.
  - Restructured `AppSidebar` for clearer hierarchy (hero scenario item, "With Friends" group, settings demoted).
- Added repository structure for smoke tests and Supabase source-of-truth.
  - Playwright is now configured for `tests/e2e/public-smoke.spec.ts` and an env-gated `tests/e2e/authenticated-smoke.spec.ts`.
  - A checked-in Supabase baseline migration now lives under `supabase/migrations/20260325_000001_baseline.sql`.
  - `supabase/README.md` now defines how future schema changes should be added.

- Finished the second website-language batch for the live round flow.
  - `RoundPage`, `ExamPage`, and `app/rivalry/[id]/new-round/page.tsx` are now localized in `English` and `简体中文`.
  - User-facing API feedback in create-round / generate-syllabus / generate-exam flows now maps through localized page copy instead of leaking raw English strings.
- Upgraded the results page into a richer battle report.
  - `components/ResultsPage.tsx` now has a stronger win/tie/loss hero, richer score comparison, and a more polished review layout.
  - Results now supports share, copy-caption, and download-card actions.
  - `ResultsPage` is now part of the bilingual website-language batch.
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
  - `docs/database/SUPABASE_SCHEMA.md` now documents the current Supabase tables, relationships, and auth metadata usage.
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
- Added a server-side one-round-per-24-hours guard for each rivalry.
  - `/api/create-round` now owns new round creation instead of client-side inserts.
  - The route blocks creation if a rivalry is inactive, if an active round still exists, or if a round was started in the last 24 hours.
  - `Rivalries` and `new-round` now show when the next round becomes available.

## Highest Priority

1. Decide scenario progress semantics before implementing persistence.
   - Open questions: per-language/per-level vs global progress; exam vs clash win vs score threshold vs any attempt for stage completion.
   - Use `docs/project/SCENARIO_PERSISTENCE_PLAN.md` as the starting point.

2. Keep the lint baseline clean while touching product work.
   - `npm run lint` currently passes.
   - Do not allow page-level lint debt to pile up again.
   - When a screen is changed, fix that screen's lint issues in the same batch.

3. Decide whether to pursue the recommended shared answer-run layer.
   - Use `docs/project/EXAM_LOOPS_AUDIT.md`.
   - The current recommendation is to persist scenario sessions/attempts/reports first and keep the mature rivalry exam as a legacy adapter.

## Engineering Follow-Up

4. Convert the scenario persistence draft into a real migration only after human review.
   - Do not apply the draft schema directly from the Markdown without review.
   - Human still applies migrations manually in Supabase SQL Editor.

5. Expand the authenticated smoke suite beyond shell navigation.
   - Add a safe non-destructive path for signed-in smoke coverage, ideally around sign-in, lounge render, and rivalry navigation.

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
