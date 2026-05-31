# ClashLingo Session Summary

Date: 2026-05-31

## OWNER ACTION REQUIRED

These items are owner-controlled and must not be marked as verified by an agent
unless the owner has actually completed or provided access to them:

Completed by owner and verified by table existence:

1. `supabase/migrations/20260529_000002_battle_packs.sql` — verified via
   `to_regclass('public.battle_packs')`.
2. `supabase/migrations/20260531_000001_scenario_persistence.sql` — verified via
   `to_regclass('public.scenario_progress')` and
   `to_regclass('public.scenario_battle_reports')`.
3. Scenario persistence smoke test — owner completed a real scenario run and
   verified rows in `battle_packs`, `scenario_battle_reports`, and
   `scenario_progress`.

Still owner-controlled / not fully verified:

4. Run battle-pack seeding only after reviewing cost/data impact. The agent must
   not run `npm run seed:battle-packs` except dry-runs.
5. Provide `E2E_EMAIL` and `E2E_PASSWORD` before authenticated Playwright smoke
   coverage can be fully verified.
6. Provide or confirm a deployed/staging URL before any deployment or shared-link
   preview claim is marked verified.
7. Review all `OWNER-REVIEW` items in `docs/project/SOFT_LAUNCH_WORKLOG.md`.

Verification rule: if migrations, seed data, Anthropic credits, deployment, or
E2E credentials block a soft-launch acceptance item, preserve the fallback and
document the exact blocker in `SOFT_LAUNCH_WORKLOG.md` and this section instead
of claiming completion.

## What Changed This Session (2026-05-31)

### Soft-launch public shell hardening

- `/` now renders a bilingual logged-out landing page with Scenarios as the
  primary path and friend rivalries as the secondary path. Signed-in users are
  still redirected to `/lounge` when the local session resolves.
- App metadata now includes title templates, Open Graph / Twitter fields, and a
  generated `/opengraph-image`. `NEXT_PUBLIC_SITE_URL` was added to
  `.env.example`, README, and project status for deployed share previews.
- `/how-it-works` now explains both learning loops: scenario quests and friend
  rivalries. It documents timed clash, standard-answer self-check, stage clear at
  80% accuracy, durable progress, and `Copy Practice Prompt`.
- Public pages no longer block first paint on Supabase session/profile checks;
  they render public content first and enhance/redirect after session detection.
- Added root `app/error.tsx` and `app/not-found.tsx` user-facing fallbacks.
- Public smoke coverage now includes `/`, `/login -> /how-it-works`, and
  `/reset-password`.

### Battle-pack cache schema guard

The stage briefing runtime error on `/scenario/cafe/stage/1` was caused by a
stale cached battle pack: `cafe-stage-1-french-beginner-v1-ai` had legacy scope
fields (`sentencePatterns`, `howBattleWorks`) while the current UI expects
`grammar`, `expressions`, and `howTested`.

- `lib/battle-pack.ts` — bumped `BATTLE_TEMPLATE_VERSION` to
  `v2-scope-briefing` and added `isCurrentBattlePack(pack)`.
- `app/api/generate-battle-pack/route.ts` — only returns cached packs that match
  the current template version and scope shape; stale records are treated as a
  cache miss.
- `app/api/scenario-battle/submit/route.ts` — also rejects non-current cached
  packs so server-side scoring does not use stale content.
- Result: old `v1-ai` rows can remain in `battle_packs`, but new stage visits use
  a fresh `v2-scope-briefing` cache key and no longer crash on missing fields.

### Scope -> practice prompt

The new `Copy Practice Prompt` action is learner-facing, not a developer prompt
debugger. It turns the current scenario battle-pack scope or rivalry syllabus
scope into a prompt the user can paste into an external AI chat to start scoped
practice immediately.

- `lib/scenario-practice-prompt.ts` (CREATED) — builds English or Chinese
  practice prompts from `BattlePack.scope`.
- `lib/rivalry-practice-prompt.ts` (CREATED) — builds English or Chinese
  practice prompts from rivalry `Syllabus`.
- `components/StageBriefingPage.tsx` — replaces the inert `Practice Later` chip
  with a copy button that writes the generated practice prompt to the clipboard
  and shows a copied state.
- `components/ScopesPage.tsx` — adds `Copy Practice Prompt` on current and past
  rivalry scope cards.
- `components/RoundPage.tsx` — adds `Copy Practice Prompt` on the scope
  confirmation page.
- i18n — added `copyPracticePrompt` and `practicePromptCopied`.
- The prompt includes context, target language, level when available, can-do
  goals, vocabulary, grammar, expressions, follow-up/listening directions, and
  testing rules.
- The prompt tells the external AI to ask one item at a time, stay inside scope,
  give short corrections, provide a standard/natural answer, and start question 1
  immediately.

### Stage-clear rule: accuracy ≥ 80%

Product decision (owner): a scenario stage is **cleared** when
`correctAnswers / totalQuestions ≥ 0.80`. Speed and quality axes still display
on the report but do NOT gate completion — picking a correct multiple-choice
option can never earn a quality point, so gating on the 3-axis total would
unfairly penalize MC-heavy stages.

- `lib/battle-scoring.ts` — added `export const STAGE_CLEAR_ACCURACY = 0.8`, a
  `BattleOutcome` interface (`correctCount`, `questionCount`, `accuracyRatio`,
  `cleared`), and `getBattleOutcome(results)`.
- `lib/battle-session.ts` — `StoredBattleReport` gained `outcome: BattleOutcome`;
  `evaluateBattleSession` computes it; `loadBattleReport` backfills `outcome` for
  pre-rule reports via `getBattleOutcome(parsed.results ?? [])`.
- `components/BattleReportPage.tsx` — added a cleared/failed outcome banner
  (green when cleared, amber when not) showing accuracy and the clear threshold.
- i18n — `battleOutcomeClearedTitle/FailedTitle/Accuracy/ClearedHint/FailedHint`.

### Scenario persistence layer (replaces MOCK_SCENARIO_PROGRESS)

Clearing a stage (≥80% accuracy) now durably persists and unlocks the next
stage. Scores are re-evaluated server-side so they cannot be forged.

- `supabase/migrations/20260531_000001_scenario_persistence.sql` (CREATED, apply
  manually) — two tables:
  - `scenario_progress` — UNIQUE(user_id, scenario_slug, target_language, level);
    `completed_stages smallint[]`, `current_stage`, `best_accuracy`,
    `last_session_id`, `last_cleared_at`.
  - `scenario_battle_reports` — `session_id` PK, `cleared`, `accuracy_ratio`,
    full `report jsonb`.
  - RLS: authenticated SELECT-self only; all writes go through the service role.
- `app/api/scenario-battle/submit/route.ts` (CREATED) — Bearer auth; reads the
  cached `battle_packs.pack`, re-evaluates answers/timings with the same pure
  `evaluateBattleQuestion`/`evaluateBattleSession`, upserts the report, then
  `advanceProgress` + upserts `scenario_progress`. Returns the server report.
- `app/api/scenario-progress/route.ts` (CREATED) — GET; returns the user's
  progress rows for a (targetLanguage, level) scope.
- `lib/scenario-progress.ts` (REWRITTEN) — removed `MOCK_SCENARIO_PROGRESS`;
  now map-based (`ScenarioProgressMap`). Added `resolveCurrentStage`,
  pure `advanceProgress`, and client `fetchScenarioProgressMap`.
- `lib/battle-session.ts` — added `submitScenarioRun` client helper (POSTs raw
  answers/timings; returns server report or null for graceful degradation).
- `components/BattlePage.tsx` — on completion, saves a locally-evaluated fallback
  report, then submits the run and overwrites localStorage with the server report
  before navigating to the report page.
- `components/ScenarioCard.tsx` — takes a `progress` prop (default
  `DEFAULT_PROGRESS`) instead of reading the mock.
- `components/ScenarioMapPage.tsx` — fetches `fetchScenarioProgressMap` after
  auth and passes real progress into the stage counters and every `ScenarioCard`.

Graceful degradation: if the migration isn't applied or the pack isn't cached,
`submitScenarioRun` returns null and the client keeps its local fallback report,
so the app still works.

## What Changed Last Session (2026-05-30)

### Clash mode: removed the simulated AI opponent, added standard-answer self-check

Product decision (owner): the fake AI opponent created no real competitive pull
and blocked self-checking, so it is removed. Clash keeps the per-question timer
and the 3-axis (speed / accuracy / quality) score, but now shows the **standard
answer** after the run so the learner can self-check. Speed is no longer scored
against the opponent's response time — it is scored against a par time
(`timerLimit * 0.5`).

- `lib/battle-scoring.ts`
  - `EvaluatedQuestionResult` dropped `aiAnswer`, `aiScore`, `speedWinner`; added
    `correctAnswer: LocalizedText | null`.
  - Removed `getAIScore`, `getAIAnswer`, and the seeded RNG helpers
    (`hashSeed`, `seededUnit`).
  - Added `getStandardAnswer` (MC → correct option with its letter; fill/free →
    `modelAnswers[0]`) and `getSelfReaction` (self-feedback, no rival framing).
  - `userSpeed` now uses a par time (`Math.round(timerLimit * 0.5)`).
  - `getBattleTotals` now returns a single `BattleTotals` (no `ai` column).
- `lib/battle-session.ts` — `StoredBattleReport` dropped `opponentName`,
  `opponentTotals`, `winner`; `userTotals` is the single totals object; removed
  the winner derivation.
- `components/BattlePage.tsx` — removed the opponent badge, the opponent label,
  and the user-vs-AI side panel; the live score panel is now a single-column
  self-score. Removed the `sessionSeed` arg.
- `components/BattleReportPage.tsx` — removed the VS hero card / delta and the
  opponent breakdown column; hero now shows player score + questions finished.
  Per-question review now shows a labeled "Your answer" plus a highlighted
  "Standard answer" block for self-check.
- i18n (`types.ts` / `en.ts` / `zh-CN.ts`) — removed `battleWinnerLabels`; added
  `battleYourAnswerLabel` + `battleStandardAnswerLabel`; relabeled
  `battleReactionLabel` ("Self-check note" / "自查反馈"); refreshed clash copy
  that implied an AI opponent / score race.

Note: clash mode's AI opponent was always client-side simulated (seeded RNG), so
removing it does NOT change Anthropic API cost — only battle-pack generation
costs money.

### Hydration fix: client-only website language read

Symptom: a React hydration mismatch on `/scenario/cafe/stage/1` (server rendered
`Loading...`, client rendered `加载中...`). Root cause: ~15 components read the
stored/browser website language via `resolveClientWebsiteLanguage()` inside a
`useState` initializer, which runs during the first client render. The server has
no `window`, so it always rendered with `DEFAULT_WEBSITE_LANGUAGE` ("en"), and the
client's first render disagreed.

- Added `lib/i18n/use-client-website-language.ts` — a `useClientWebsiteLanguage()`
  hook built on `useSyncExternalStore`. It returns `DEFAULT_WEBSITE_LANGUAGE` for
  SSR + the first hydration render (server snapshot), then switches to the real
  client snapshot (`resolveClientWebsiteLanguage()`), and subscribes to `storage`
  events so cross-tab language changes propagate. No setState-in-effect, so it
  also satisfies the `react-hooks/set-state-in-effect` lint rule.
- Read-only components (language never mutated locally) now call the hook
  directly: `BattlePage`, `BattleReportPage`, `ScenarioDetailPage`,
  `ScenarioExamLandingPage`, `ScenarioMapPage`, `StageBriefingPage`,
  `HowItWorksPage`, `Lounge`, `ScopesPage`, `RivalryDashboard`,
  `ResetPasswordPage`, `SettingsPage`.
- Components that mutate language from an async profile load now initialize state
  at `DEFAULT_WEBSITE_LANGUAGE` and set the real value inside their async init
  effect (post-await setState is not flagged): `ExamPage`, `ResultsPage`,
  `RoundPage`, `app/rivalry/[id]/new-round/page.tsx`.
- `components/Login.tsx` — refactored to derive `websiteLanguage` from the hook
  plus a `pickedLanguage` override state (`pickedLanguage ?? detectedLanguage`),
  removing the setState-in-effect that previously resolved the stored language.
  `languageTouched` is now derived as `pickedLanguage !== null`.

### Overnight continuation — scenario audit + seed hardening

- Added `docs/project/EXAM_LOOPS_AUDIT.md`.
  - Maps all three answer-question loops: rivalry exam, scenario clash, and scenario exam.
  - Compares question source, scoring, persistence, multiplayer, bilingual handling, and known gaps.
  - Recommends a shared answer-run layer while keeping the mature rivalry exam as a legacy adapter for now.
- Added `docs/project/SCENARIO_PERSISTENCE_PLAN.md`.
  - Documents the current mock/localStorage reality for scenario progress, sessions, and reports.
  - Includes a DRAFT, non-applied SQL schema for `scenario_progress`, `scenario_battle_sessions`, `scenario_battle_attempts`, and `scenario_battle_reports`.
  - Lays out a future migration + wiring plan without creating or applying any migration.
- Hardened `scripts/seed-battle-packs.ts`.
  - Added `--limit N` for cheap partial dry-run/live smoke plans.
  - Added `--only <slug>` for one full-launch scenario at a time.
  - Unknown or non-full scenario slugs exit non-zero with the available full-launch slugs.
  - Kept the default no-flag behavior as the full 144-combo plan.

### Scenario / battle (闯关) feature — checkpoint `c33c0dd` (committed + pushed last session)

- Added the Scenario quest line as the new main loop alongside the existing rivalry flow.
  - Catalog in `lib/scenario-map.ts` (domains, templates, stage definitions, `SCENARIOS`).
  - Types in `lib/scenario-types.ts` (`Scenario`, `ScopeBriefing`, `BattlePack`, questions, sessions, reports).
  - Routes: `/scenarios`, `/scenario/[slug]`, `/scenario/[slug]/stage/[stage]`, `/scenario/[slug]/stage/[stage]/exam`, `/battle/[sessionId]`, `/battle/[sessionId]/report`.
  - Components: `StageBriefingPage`, `BattlePage`, `ScenarioExamLandingPage`, scenario list surfaces.
- Phase 1 AI battle-pack generation backend.
  - `app/api/generate-battle-pack/route.ts` generates one bilingual battle pack per (scenario, stage, targetLanguage, level) using Anthropic `claude-sonnet-4-20250514`.
  - `lib/battle-pack.ts` owns stage rules, strict validation (`validateBattleContent`), assembly (`assembleBattlePack`), the cache key, and a client `fetchBattlePack` helper.
  - `supabase/migrations/20260529_000002_battle_packs.sql` adds the `battle_packs` cache table (service-role writes, authenticated reads). Apply manually in the Supabase SQL editor.
- Sidebar restructure for clearer hierarchy (`components/AppSidebar.tsx`).
  - Hero "场景闯关 / Scenario Quests" item promoted to the top.
  - A "和朋友对战 / With Friends" group label over the demoted lounge / rivalries / scopes links.
  - Settings moved into the bottom tools area near the guide link.
  - New i18n keys: `sidebar.friendsGroupLabel`, renamed `sidebar.items` labels.

### This session

- Aligned `ScopeBriefing` to the rivalry Syllabus field shape (kept camelCase + strict bilingual `{en, "zh-CN"}`).
  - `vocabularyGroups` now uses an exported `VocabularyGroup` type.
  - Split the old `sentencePatterns: string[]` into `grammar: string[]` + `expressions: string[]`.
  - Renamed `howBattleWorks` → `howTested`.
  - Propagated through `lib/battle-pack.ts` (`BattlePackContent` pick + validation), `app/api/generate-battle-pack/route.ts` (prompt localization rules + JSON shape), `components/StageBriefingPage.tsx` (renders grammar + expressions sections, `howTested`), and i18n (`briefingGrammarTitle`, `briefingExpressionsTitle`, `briefingHowTestedTitle` in `types.ts` / `en.ts` / `zh-CN.ts`).
- Added a pre-generation seed script (`scripts/seed-battle-packs.ts`, `npm run seed:battle-packs`).
  - Covers full-launch scenarios × open stages × {French, English, Spanish} × all four levels = 144 packs.
  - POSTs each combo to a running server's `/api/generate-battle-pack`; the route's cache check makes the script idempotent (cached combos are skipped, only misses cost Anthropic calls).
  - Supports `--dry-run` (prints the plan, sends nothing), `--limit N`, `--only <slug>`, `SEED_BASE_URL`, and `SEED_DELAY_MS`.
  - On-demand generation stays the live fallback for any combo not pre-seeded.

## What Was Verified

- `npm run lint` passes (after the 80% rule + scenario persistence layer).
- `npm run build` passes — both new routes register
  (`/api/scenario-battle/submit`, `/api/scenario-progress`).
- `npm run lint` / `npm run build` also passed after the prior clash-mode
  self-check refactor and the hydration fix.
- `npm run seed:battle-packs -- --dry-run` prints all 144 planned combos and sends no requests.
- `npm run seed:battle-packs -- --dry-run --limit 3` prints 3 combos and sends no requests.
- `npm run seed:battle-packs -- --dry-run --only cafe` prints 24 `cafe` combos and sends no requests.
- `npm run seed:battle-packs -- --dry-run --only not-a-real-slug` exits non-zero with a clear available-slugs error.

## Important Findings / Notes

- The `battle_packs` migration must be applied manually before seeding (no Supabase CLI in this repo).
- The seed script was NOT run by the agent — it spends Anthropic credits and writes to the user's Supabase. The user runs it after applying the migration and starting the dev server.
- `scripts/seed-battle-packs.ts` relies on Node 24 native TypeScript stripping and imports `.ts` files directly. The imports carry `@ts-expect-error` comments so Next/TypeScript build stays green while preserving the direct Node 24 dry-run behavior.
- A benign `MODULE_TYPELESS_PACKAGE_JSON` reparse warning is expected when the seed script runs.
- No database migration was created or applied during the overnight continuation.

## Action Required From Owner

1. Apply `supabase/migrations/20260531_000001_scenario_persistence.sql` in the
   Supabase SQL Editor (no Supabase CLI in this repo). Until then, runs submit
   but progress falls back to local-only.
2. (Still required from before) Apply
   `supabase/migrations/20260529_000002_battle_packs.sql` if not yet applied —
   the submit route reads the cached pack from `battle_packs`.

## Recommended Next Task

1. After both migrations are applied, play a stage end-to-end and confirm
   `scenario_progress` / `scenario_battle_reports` rows are written and the next
   stage unlocks on the scenario map.
2. (Deferred / P1) `StageBriefingPage` and `ScenarioExamLandingPage` still mint
   client-side mock session ids; works with the submit route (sessionId is just
   a text key) but could move to server-created sessions later.
3. Review `EXAM_LOOPS_AUDIT.md` and decide whether to pursue the shared
   answer-run layer.
4. After content review, the human can run a small live seed smoke such as
   `npm run seed:battle-packs -- --limit 3 --only cafe`, then the full seed.

## Next Session Start Order

1. Read `docs/project/PROJECT_RULES.md`
2. Read `docs/project/PROJECT_STATUS.md`
3. Read `docs/project/TASK_QUEUE.md`
4. Read this file
