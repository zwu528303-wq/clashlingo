# ClashLingo Session Summary

Date: 2026-05-30

## What Changed This Session

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

- `npm run lint` passes.
- `npm run build` passes.
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

## Recommended Next Task

1. Review `EXAM_LOOPS_AUDIT.md` and decide whether to pursue the recommended shared answer-run layer.
2. Decide scenario progress semantics: per language/level or global, and whether exam, clash win, score threshold, or any attempt clears a stage.
3. Review `SCENARIO_PERSISTENCE_PLAN.md`; if approved, convert the draft schema into a real migration in a future session and have the human apply it manually.
4. After migration and content review, the human can run a small live seed smoke such as `npm run seed:battle-packs -- --limit 3 --only cafe`, then decide whether to run the full seed.

## Next Session Start Order

1. Read `docs/project/PROJECT_RULES.md`
2. Read `docs/project/PROJECT_STATUS.md`
3. Read `docs/project/TASK_QUEUE.md`
4. Read this file
