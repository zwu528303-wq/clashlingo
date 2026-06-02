# Task Queue

Last updated: 2026-06-02

## Current Blocker

- Finish the Supabase project swap to `clashlingo_asia`.
  - Supabase connector lists `clashlingo_asia` as project ref `bwwghdhwhxuqqepgpizb` in `ap-northeast-1`.
  - Current local `.env.local` and deployed production bundle still point to `bemkskhhydlndiegcuxu.supabase.co`.
  - The `clashlingo_asia` schema exists, but connector table summaries currently report `0` public rows; confirm whether data/Auth import is complete before switching production.
  - To finish: update local and Vercel `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`, redeploy production, then rerun route/API/Auth/Realtime checks.
  - Owner input needed: the `clashlingo_asia` `SUPABASE_SERVICE_ROLE_KEY`, or owner must set it directly in Vercel.

## Recently Completed

- Completed the Vercel Asia region and API hardening closeout.
  - Vercel production deployment for commit `f78b8de` is `READY`.
  - Production API functions now run in `hkg1`.
  - Public routes return `200`, and paid/API endpoints return `401 MISSING_ACCESS_TOKEN` without a token.
  - Read-only checks against the currently deployed Supabase host pass with no orphaned public users or rivalry player refs.
- Closed the soft-launch API/auth hardening items found during launch review.
  - `/api/generate-syllabus` and `/api/generate-exam` now require a Supabase Bearer token and verify the caller belongs to the round's rivalry before any Anthropic call.
  - `RoundPage` now sends the signed-in session token when generating rivalry scopes or exams.
  - `scripts/seed-battle-packs.ts` now supports `SEED_ACCESS_TOKEN` or `SEED_EMAIL` / `SEED_PASSWORD` for live seed runs; no-token live runs stop before sending requests.
  - `tests/e2e/public-smoke.spec.ts` now checks the current landing-page copy instead of the removed `Main path: Scenario Map` text.
  - Verified: `git diff --check`, `npm run lint`, `npm run test:e2e -- tests/e2e/public-smoke.spec.ts`, seed dry-run, no-token seed guard, and local anonymous `401` checks on the paid endpoints. Local `npm run build` is currently blocked by Google Fonts / Turbopack font fetch from this network; Vercel production deployment build passed and remains the production build gate.
- Completed the first soft-launch hardening pass for the public shell.
  - `/` now renders a bilingual logged-out landing page that points first to Scenario Map and second to friend rivalries.
  - App-wide share metadata now includes a title template, Open Graph / Twitter metadata, and generated `/opengraph-image`.
  - `NEXT_PUBLIC_SITE_URL` is documented for deployed share previews.
  - `/how-it-works` now explains both scenario quests and friend rivalries, including timed clash, standard-answer self-check, stage clear at 80% accuracy, durable progress, and `Copy Practice Prompt`.
  - Public pages no longer block first render on Supabase session/profile checks; they render public content first and redirect/enhance after session detection.
  - Added root `error.tsx` and `not-found.tsx` fallbacks.
  - Public smoke now covers `/`, `/login -> /how-it-works`, and `/reset-password`. `git diff --check`, `npm run lint`, `npm run build`, and `npm run test:e2e -- tests/e2e/public-smoke.spec.ts` pass.
- Added learner-facing copy-practice-prompt actions for scenario and rivalry scopes.
  - `lib/scenario-practice-prompt.ts` converts a `BattlePack.scope` into a prompt that can be pasted into an external AI chat.
  - `lib/rivalry-practice-prompt.ts` converts a rivalry `Syllabus` into the same kind of scoped external-AI practice prompt.
  - The prompt carries scenario, stage, target language, level, can-do goals, vocabulary, grammar, expressions, follow-up directions, and testing rules.
  - `StageBriefingPage` now replaces the inert `Practice Later` chip with `Copy Practice Prompt` / `复制练习 Prompt`.
  - `/scopes` cards and `/round/[id]` scope confirmation now also expose `Copy Practice Prompt`.
  - The copied prompt tells the external AI to start practice immediately, stay inside scope, ask one item at a time, and give short correction plus a standard/natural answer.
  - `npm run lint` and `npm run build` pass.
- Owner-verified the scenario persistence smoke path in Supabase.
  - `battle_packs`, `scenario_progress`, and `scenario_battle_reports` exist in the production Supabase project.
  - A real scenario test wrote a battle-pack row, a battle report row, and a progress row.
  - The stale-cache runtime crash on `/scenario/cafe/stage/1` was fixed by moving battle-pack cache reads to `v2-scope-briefing` and rejecting stale cached pack shapes.
- Defined the scenario stage-clear rule and built the scenario persistence layer.
  - Clear rule: a stage is cleared when `correctAnswers / totalQuestions ≥ 0.80` (accuracy only; speed/quality display but do not gate). `lib/battle-scoring.ts` adds `STAGE_CLEAR_ACCURACY`, `BattleOutcome`, `getBattleOutcome`; `StoredBattleReport.outcome` carries it (with backfill in `loadBattleReport`); `BattleReportPage` shows a cleared/failed banner; new i18n `battleOutcome*` keys.
  - Persistence: `supabase/migrations/20260531_000001_scenario_persistence.sql` (apply manually) adds `scenario_progress` + `scenario_battle_reports` with SELECT-self RLS (service-role writes).
  - Routes: `app/api/scenario-battle/submit` re-evaluates raw answers/timings server-side (anti-forgery), upserts the report, then `advanceProgress` + upserts progress; `app/api/scenario-progress` returns per-scope progress.
  - Wiring: `lib/scenario-progress.ts` rewritten map-based (removed `MOCK_SCENARIO_PROGRESS`, added `resolveCurrentStage` / `advanceProgress` / `fetchScenarioProgressMap`); `lib/battle-session.ts` adds `submitScenarioRun`; `BattlePage` submits with local fallback; `ScenarioCard` takes a `progress` prop; `ScenarioMapPage` fetches and passes real progress. `npm run lint` + `npm run build` pass.
- Fixed a React hydration mismatch from reading the client website language in `useState` initializers.
  - Added `lib/i18n/use-client-website-language.ts` (`useClientWebsiteLanguage()`), a `useSyncExternalStore` hook returning `DEFAULT_WEBSITE_LANGUAGE` on the server + first hydration render, then the real stored/browser language, subscribed to cross-tab `storage` events. No setState-in-effect, so it also clears the `react-hooks/set-state-in-effect` lint rule.
  - Read-only components now call the hook directly (`BattlePage`, `BattleReportPage`, `ScenarioDetailPage`, `ScenarioExamLandingPage`, `ScenarioMapPage`, `StageBriefingPage`, `HowItWorksPage`, `Lounge`, `ScopesPage`, `RivalryDashboard`, `ResetPasswordPage`, `SettingsPage`).
  - Components that mutate language from an async profile load now init at `DEFAULT_WEBSITE_LANGUAGE` and set the real value post-await (`ExamPage`, `ResultsPage`, `RoundPage`, `app/rivalry/[id]/new-round/page.tsx`).
  - `Login.tsx` derives `websiteLanguage` from the hook plus a `pickedLanguage` override; `languageTouched` is now `pickedLanguage !== null`. `npm run lint` + `npm run build` pass.
- Replaced the clash-mode simulated AI opponent with a standard-answer self-check.
  - Removed the client-side seeded AI opponent (`getAIScore` / `getAIAnswer` / RNG helpers) from `lib/battle-scoring.ts`; each result now carries `correctAnswer` (MC correct option + letter; fill/free `modelAnswers[0]`).
  - `userSpeed` is now scored against a par time (`timerLimit * 0.5`) instead of the opponent's response time; `getBattleTotals` returns a single `BattleTotals`.
  - `StoredBattleReport` dropped `opponentName` / `opponentTotals` / `winner`.
  - `BattlePage` removed the opponent badge + VS side panel (single-column self-score); `BattleReportPage` removed the VS hero/delta + opponent column and now shows a labeled "Your answer" + highlighted "Standard answer" per question.
  - i18n: removed `battleWinnerLabels`, added `battleYourAnswerLabel` + `battleStandardAnswerLabel`, relabeled `battleReactionLabel`, refreshed clash copy. `npm run lint` + `npm run build` pass.
  - Note: the opponent was already client-side simulated, so this does not reduce Anthropic API cost.
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

0. SOFT-LAUNCH CLOSEOUT.
   - Owner-controlled: any live `npm run seed:battle-packs` run spends Anthropic
     credits and writes to Supabase. Live seed requires `SEED_ACCESS_TOKEN`, or
     `SEED_EMAIL` / `SEED_PASSWORD` plus the public Supabase env.
   - Owner-controlled: provide `E2E_EMAIL` / `E2E_PASSWORD` before treating the
     authenticated Playwright suite as launch evidence.
   - Optional hardening: add per-user rate limits around paid AI endpoints after
     initial soft-launch traffic is understood.
   - Product polish: do one last visual pass on scenario briefing, battle report,
     logged-out landing, and key rivalry screens before wider invites.
   - Keep appending dated launch notes to
     `docs/project/SOFT_LAUNCH_WORKLOG.md`.

Archived prior readiness brief:
   - A. Public landing: logged-out visitors to `/` get a real bilingual
     marketing/landing page explaining both loops with sign-up / log-in CTAs.
     Signed-in users still redirect to `/lounge`.
   - B. Shareable metadata: app-wide + per-route Next metadata (title,
     description, Open Graph + Twitter card, favicon/icons) so shared links
     preview cleanly. Use the installed Next version's metadata API.
   - C. No raw failure leakage: audit error/empty/loading states across login,
     lounge, rivalries, round/exam/results, scenarios map/detail/stage, battle,
     report. Friendly bilingual copy; no unmapped raw English server strings.
   - D. Responsive pass: core surfaces usable at >=360px without overflow.
   - E. Graceful degradation verified: scenario submit/progress degrade safely
     when migrations aren't applied or a pack isn't cached (keep the local
     fallback report). Gate/label ExamPage's client mock-exam and scenario
     `mock-` session ids so they can't mislead real users; do not delete working
     fallbacks.
   - F. Smoke coverage: Playwright covers the logged-out landing + public shell;
     env-gated authenticated suite asserts sign-in -> lounge -> open scenario ->
     stage list. Keep auth suite gated on `E2E_EMAIL` / `E2E_PASSWORD`.
   - G. Green: `npm run lint` + `npm run build` pass after every increment.
   - H. Historical note: the old brief called `/how-it-works` stale; that was
     addressed in the public-shell pass. Keep it aligned if either learning loop
     changes again.
   - I. WORK LOG (detailed, owner-editable). Maintain a running, granular work
     journal at `docs/project/SOFT_LAUNCH_WORKLOG.md` so the owner can review and
     later tweak anything without re-reading every diff. Rules:
     - One dated, numbered entry PER meaningful increment (not one giant dump at
       the end). Append as you go; never silently overwrite earlier entries.
     - Each entry must include: (1) what changed in plain language; (2) WHY /
       what problem it solves; (3) exact files + key functions/components touched
       (with paths); (4) any new i18n keys added (en + zh-CN); (5) how to change
       or undo it later (where to edit the copy/threshold/layout, which knob to
       turn) — written for a non-author who wants to adjust it; (6) the lint +
       build result for that increment; (7) anything deferred or left as a TODO.
     - Flag every decision that is a judgment call (copy wording, landing-page
       structure, metadata text, responsive breakpoints) explicitly as
       "OWNER-REVIEW" so the owner knows what to sanity-check first.
     - Keep this separate from `SESSION_SUMMARY.md` (which stays the short
       baton-pass). The work log is the detailed, chronological record.
   - Hard limits for this pass: do NOT run `seed:battle-packs` or any live
     Anthropic generation in a loop; do NOT apply/run migrations or mutate the
     production Supabase (new migration FILES ok, never executed); never commit
     secrets; no deploy / no force-push / no git config changes; no net-new
     features beyond PROJECT_RULES (propose into this file instead).
   - Verification rule: if an acceptance item cannot be fully verified because
     migrations, seed data, Anthropic credits, deployment, or E2E credentials are
     owner-controlled, do not fake completion. Preserve the fallback, document
     the exact blocker in `docs/project/SOFT_LAUNCH_WORKLOG.md` and
     `docs/project/SESSION_SUMMARY.md`, and add it to `OWNER ACTION REQUIRED`.

1. Keep the lint baseline clean while touching product work.
   - `npm run lint` currently passes (incl. the new `useClientWebsiteLanguage` hook).
   - Do not allow page-level lint debt to pile up again.
   - When a screen is changed, fix that screen's lint issues in the same batch.

2. Decide whether to pursue the recommended shared answer-run layer.
   - Use `docs/project/EXAM_LOOPS_AUDIT.md`.
   - The current recommendation is to persist scenario sessions/attempts/reports first and keep the mature rivalry exam as a legacy adapter.

## Engineering Follow-Up

4. (Deferred / P1) Move scenario session ids server-side.
   - `StageBriefingPage` and `ScenarioExamLandingPage` still mint client-side `mock-...` session ids. They work with the submit route (sessionId is just a text key) but could later be server-created.

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
