# Project Status

Last updated: 2026-06-03
Stage: early MVP, two loops live (rivalry + scenario quests)

## Product Summary

ClashLingo has two learning loops:
- **Rivalry (1v1):** two players create a rivalry, pick a topic, get an AI-generated syllabus, follow a default study window, optionally start early together, take an exam, and compare results.
- **Scenario quests (闯关, solo):** a learner walks a domain → scenario → 4-stage quest line. Each stage runs a timed "clash" answer run (or an exam) built from an AI-generated bilingual battle pack. A stage is **cleared at accuracy ≥ 80%**; clearing unlocks the next stage. Progress and reports persist per (user, scenario, target language, level).

## Stack

- Next.js 16.2.1 App Router
- React 19.2.4
- TypeScript
- Tailwind CSS 4 with custom theme tokens in `app/globals.css`
- Supabase Auth + Postgres + Realtime
- Anthropic API for syllabus and exam generation

## Visual Direction

- Playful minimalism
- Rounded shapes and oversized cards
- Primary color: `#953f4d`
- Secondary color: `#0c693d`
- Font: Plus Jakarta Sans, currently loaded via `next/font/google` in `app/layout.tsx`

## Main Routes

- `/` - public bilingual soft-launch landing page for logged-out visitors; signed-in users are redirected to `/lounge` when the local session is detected
- `/login` - auth UI plus first-time onboarding guidance and a website-language toggle for first-time visitors (`components/Login.tsx`)
- `/reset-password` - recovery screen for choosing a new password from an email link (`components/ResetPasswordPage.tsx`)
- `/how-it-works` - full product guide with the rivalry loop, page map, rhythm rules, level rules, and FAQs (`components/HowItWorksPage.tsx`)
- `/lounge` - countdown-first control surface for active rivalries, create rivalry, and join by invite code (`components/Lounge.tsx`)
- `/rivalries` - rivalry hub with rivalry selection, W/L, streak, and match history (`components/RivalryDashboard.tsx`)
- `/settings` - user profile, website language, default language level, and weekly preference settings (`components/SettingsPage.tsx`)
- `/rivalry/[id]` - deep link into the same rivalry hub component used by `/rivalries`
- `/rivalry/[id]/new-round` - create a new round
- `/round/[id]` - round lifecycle page (`components/RoundPage.tsx`)
- `/round/[id]/exam` - exam experience (`components/ExamPage.tsx`)
- `/round/[id]/results` - results review (`components/ResultsPage.tsx`)
- `/scenarios` - scenario quest map: domains, scenario cards with per-user stage progress (`components/ScenarioMapPage.tsx`)
- `/scenario/[slug]` - scenario detail / stage list (`components/ScenarioDetailPage.tsx`)
- `/scenario/[slug]/stage/[stage]` - stage briefing before a clash run (`components/StageBriefingPage.tsx`)
- `/scenario/[slug]/stage/[stage]/exam` - scenario exam landing (`components/ScenarioExamLandingPage.tsx`)
- `/battle/[sessionId]` - timed clash answer run (`components/BattlePage.tsx`)
- `/battle/[sessionId]/report` - clash/exam report with the cleared/failed outcome banner (`components/BattleReportPage.tsx`)

## Server Endpoints

- `/api/create-round`
  - validates the signed-in user on the server
  - blocks new round creation if the rivalry is inactive
  - blocks new round creation if any active round still exists
  - blocks new round creation if the rivalry already started a round in the last 24 hours
  - inserts the round and updates `rivalries.current_round_num`
- `/api/generate-syllabus`
  - validates the signed-in user with a Supabase Bearer token
  - verifies the user belongs to the round's rivalry before any Anthropic call
  - uses Anthropic to generate a syllabus from topic + target language
  - writes syllabus into `rounds.syllabus`
  - moves round status to `confirming`
- `/api/generate-exam`
  - validates the signed-in user with a Supabase Bearer token
  - verifies the user belongs to the round's rivalry before any Anthropic call
  - uses Anthropic to generate a 24-question exam + rubric from the saved syllabus
  - generates MCQ, fill-in-the-blank, and translation sections separately, then merges them server-side
  - validates each section and then validates that the final exam contains exactly 24 questions and 24 rubric items before writing
  - upserts into `exams`
  - returns explicit generation-shape / save-failure error codes instead of collapsing all failures into a generic internal error
  - moves round status to `exam_ready`
- `/api/profile`
  - validates the signed-in user on the server
  - syncs `users.display_name` plus public avatar identity for shared surfaces such as lounge and rivalry
- `/api/leave-rivalry`
  - validates the signed-in user on the server
  - blocks leave if the rivalry still has any non-completed round
  - marks the rivalry inactive in `rivalries.cumulative_ledger` without deleting history
- `/api/generate-battle-pack`
  - validates the signed-in user with a Supabase Bearer token before any cache read or AI work
  - uses Anthropic to generate one bilingual battle pack per (scenario, stage, target language, level)
  - caches packs in `battle_packs` keyed by `buildBattlePackCacheKey` (template version `v2-scope-briefing`); cache hit skips the AI call
  - ignores stale cached packs whose stored shape does not match the current battle-pack schema
  - generated scope content also feeds the learner-facing copy-practice-prompt action on stage briefing; rivalry syllabi use the same product pattern from their own syllabus data
- `/api/scenario-battle/submit`
  - validates the signed-in user on the server (Bearer token)
  - reads the cached pack and re-evaluates the submitted answers/timings server-side so scores cannot be forged
  - upserts the report into `scenario_battle_reports`, then `advanceProgress` + upserts `scenario_progress` (clear = accuracy ≥ 80%)
  - returns null-safe: if the pack is not cached, the client keeps its local fallback report
- `/api/scenario-progress`
  - validates the signed-in user on the server (Bearer token)
  - returns the user's `scenario_progress` rows for a (target language, level) scope

## Expected Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL` (recommended for correct shared-link metadata)
- `ANTHROPIC_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Checked-in setup docs now exist in:
- [README.md](../../README.md)
- [.env.example](../../.env.example)
- [SUPABASE_SCHEMA.md](../database/SUPABASE_SCHEMA.md)

## Expected Supabase Tables

Observed from the app code:
- `users`
- `rivalries`
- `rounds`
- `exams`
- `submissions`
- `battle_packs` (AI battle-pack cache; migration `20260529_000002_battle_packs.sql`)
- `scenario_progress` (per-user, per scope stage progress; migration `20260531_000001_scenario_persistence.sql`)
- `scenario_battle_reports` (per-session clash/exam reports; same migration)

Migrations under `supabase/migrations/` are applied manually in the Supabase SQL Editor (no Supabase CLI in this repo). On 2026-05-31, the owner verified that `battle_packs`, `scenario_progress`, and `scenario_battle_reports` exist in Supabase via `to_regclass(...)`, then completed a real scenario test and confirmed the relevant `battle_packs`, `scenario_battle_reports`, and `scenario_progress` rows.

Observed `users` columns from direct DB check:
- `id`
- `display_name`
- `avatar_url`
- `created_at`

Important note:
- The `users` table does not currently have an `email` column.
- Shared identity sync should only rely on real columns in this table.

## Round Lifecycle

Observed status values:
- `topic_selection`
- `confirming`
- `countdown`
- `exam_ready`
- `exam_live`
- `completed`

## What Works Today

- Email/password sign-up and sign-in through Supabase
- Sign-up now asks for `Display Nickname` up front and writes it into auth metadata during account creation
- Login now supports resend-confirmation and forgot-password entry points
- The app now ships a `/reset-password` recovery page for setting a new password from the email link
- Website UI now supports `English` and `简体中文`
- Login now includes a first-visit website-language toggle before sign-in
- Settings now persists `Website Language` through auth metadata
- The translated website-language shell is now live across:
  - Login
  - Reset Password
  - Lounge
  - Rivalries
  - Scopes
  - Settings
  - How It Works
  - AppSidebar
- The second translated batch is now live across:
  - RoundPage
  - ExamPage
  - `app/rivalry/[id]/new-round/page.tsx`
  - page-level API system feedback for create-round, generate-syllabus, and generate-exam flows
- Lounge UI for creating a rivalry and joining by invite code
- Login and empty-lounge states now use a loop-based onboarding guide with the same wording as the full manual
- The app now ships a `/how-it-works` guide page, and the sidebar links to it directly
- Settings page now supports a four-tier default language level: `Beginner`, `Elementary`, `Intermediate`, `Advanced`
- Create/join rivalry now writes each player's default level into `player_a_difficulty` / `player_b_difficulty`
- Lounge now presents rivalries as status cards with countdown / action panels
- Lounge now keeps a weekly rhythm countdown visible on paired rivalry cards, even before a round reaches the actual study-countdown state
- Lounge, rivalries, scopes, and settings now share a sidebar navigation shell
- The product now separates `Lounge` from `Rivalries` more clearly.
  - Lounge is the operational page for countdowns and entering matches.
  - Rivalries is the history/stats hub for a selected rivalry.
- Lounge and Rivalries now have a first-pass fused visual language inspired by the approved AI Studio reference.
  - Lounge uses a more featured duel-card layout and stronger countdown/action panels.
  - Rivalries uses a more explicit VS hero, rivalry selector cards, richer history rows, and a clearer action/stats column.
- Settings page for nickname, letter avatar, avatar color, default language, default language level, and weekly match time
- Settings page now also stores `Default Language Level` in auth metadata
- Settings save now syncs public nickname + letter avatar + avatar color server-side through `/api/profile`
- Public/shared identity no longer falls back to email-style display names
- Lounge and rivalry surfaces now read shared avatar letter/color from the public identity layer instead of inventing rival avatars locally
- Weekly time in settings now acts as the default for new rivalries, while each rivalry keeps its own shared weekly countdown pulse
- Lounge countdown cards now use rivalry-shared weekly rhythm data instead of per-viewer-only timing
- Each rivalry can now start at most one new round per rolling 24 hours
- New round creation is now enforced server-side through `/api/create-round`
- Rivalry Hub and the new-round page now show when the next round becomes available if the 24-hour limit is active
- Users can now leave a rivalry from the rivalry hub when no active round exists
- Leaving a rivalry now preserves history, hides that rivalry from lounge, and blocks future rounds
- Rivalry dashboard and round list
- New round flow with topic, default study window, and optional prize/stake
- AI syllabus generation and confirmation flow
- AI syllabus and exam generation now resolve the effective level server-side from the rivalry plus the round target language
- AI syllabus and exam generation now require a Supabase Bearer token and confirm the caller belongs to the round's rivalry before any Anthropic call
- If both players study the same language at different levels, AI generation now uses the lower of the two saved levels
- Round countdown UI now supports mutual early start, and exam-ready still supports synchronized launch
- Round countdown UI now recovers if both players are already marked ready but the round is still stuck in `countdown`: it retries exam generation / `exam_live` promotion and leaves a manual retry button instead of locking both players out
- Exam generation now has a 60-second route duration, section-by-section Anthropic calls for MCQ / fill-in-the-blank / translation, explicit shape validation, and checked `exams` / `rounds` write errors
- Exam generation endpoint
- Exam route now points to `components/ExamPage.tsx`
- Results UI now includes a stronger battle-report layout in `components/ResultsPage.tsx`
- Results now includes a richer share card preview, a copy-caption action, and SVG card download
- Results is now part of the translated website-language batch
- Scopes now group current and past scope cards by target language
- Scenario stage briefing now offers `Copy Practice Prompt`, generated from the current battle-pack scope so the learner can paste it into an external AI chat and start scoped practice immediately
- Rivalry scopes now offer `Copy Practice Prompt` from `/scopes` cards and the `/round/[id]` scope-confirmation page
- The battle-pack seed script is auth-aware: live runs require `SEED_ACCESS_TOKEN` or `SEED_EMAIL` / `SEED_PASSWORD`, while `--dry-run` still sends no requests
- Logged-out `/` now renders a bilingual soft-launch landing page instead of immediately redirecting to login
- App-wide metadata now includes Open Graph / Twitter fields plus a generated `/opengraph-image`; deployed environments should set `NEXT_PUBLIC_SITE_URL`
- `/how-it-works` now explains both scenario quests and friend rivalries, including the 80% stage-clear rule, standard-answer self-check, and `Copy Practice Prompt`
- Root-level `error.tsx` and `not-found.tsx` now provide user-facing fallback screens instead of exposing a bare runtime overlay in production
- `npm run lint` currently passes
- Latest Vercel production deployment currently passes and runs API functions in `hkg1`; local `npm run build` can fail from this network when Next/Turbopack cannot fetch Google Fonts.
- The repo now includes a real README, an `.env.example`, and Supabase schema notes
- Shared domain types now live in `lib/domain-types.ts` and are reused across the main pages and AI routes
- `app/rivalry/[id]/new-round/page.tsx` now uses inline error feedback instead of `alert()`

## Current Health Check

Ran on 2026-06-03:
- `npm run lint` - passes
- `npx tsc --noEmit --pretty false` - passes
- `git diff --check` - passes
- Vercel production deployment `dpl_Aw9yim9DWADw94UHXeHsypSj3GYJ` for commit `ad7b607` is `READY`
- Post-deploy smoke: public routes `/`, `/login`, `/reset-password`, and `/how-it-works` return `200`; no-token API checks for `/api/create-round`, `/api/generate-syllabus`, `/api/generate-exam`, and `GET /api/scenario-progress` return `401 MISSING_ACCESS_TOKEN`
- Live response headers still show Vercel function execution in `hkg1`
- Deployed browser bundle still points to `bemkskhhydlndiegcuxu.supabase.co` and includes both the stuck-state retry copy (`Try Start Again` / `重新尝试开考`) and the new exam-generation error copy (`The exam generator returned incomplete output` / `考试生成器输出不完整`)
- Supabase connector lists only the Asia project `clashlingo_asia` / `bwwghdhwhxuqqepgpizb`; read-only counts there are still `0` auth users and `0` rows across the expected public tables
- Read-only checks against the currently configured Supabase host show 10 rivalries / 8 rounds. Three rivalries are blocked by active rounds: two `countdown` rounds had both exam-ready flags set but no exam row, and one round was still `confirming`. This led to the RoundPage recovery fix above.

Previous checks on 2026-06-02:
- `npm run lint` - passes
- `npm run build` - failed locally because Next/Turbopack could not fetch Plus Jakarta Sans from Google Fonts; use Vercel deployment build as the production build gate
- `npm run test:e2e -- tests/e2e/public-smoke.spec.ts` - passes (logged-out landing, login -> guide, reset-password)
- `npm run verify:supabase-migration -- --expected-host=bemkskhhydlndiegcuxu.supabase.co --require-data` - passes against the currently configured Supabase project and reports 11 auth users / 11 public users / no orphan refs
- `npm run verify:supabase-migration -- --expected-host=bwwghdhwhxuqqepgpizb.supabase.co` - fails with a host mismatch because local `.env.local` still points to `bemkskhhydlndiegcuxu.supabase.co`
- `npm run seed:battle-packs -- --dry-run --only cafe --limit 1` - passes and sends no requests
- `npm run seed:battle-packs -- --only cafe --limit 1` without seed auth - exits before any request with a clear auth requirement
- Local dev checks: `/api/generate-syllabus`, `/api/generate-exam`, `/api/generate-battle-pack`, and `/api/scenario-progress` all return `401 MISSING_ACCESS_TOKEN` with no token
- Vercel production deployment `dpl_6zDAcvMqrUYyjDdXooqAeJCQteFa` for commit `f78b8de` is `READY`
- Vercel reports the production function region as `hkg1`, and live API response headers include `hkg1`
- Public production routes `/`, `/login`, `/reset-password`, `/how-it-works`, and `/opengraph-image` return `200`
- Current local `.env.local` and deployed browser bundle point to `bemkskhhydlndiegcuxu.supabase.co`
- Supabase connector lists the Asia project as `clashlingo_asia` / `bwwghdhwhxuqqepgpizb` in `ap-northeast-1`, so production env is not yet aligned to that project
- The `clashlingo_asia` public schema exists with the expected tables, but the connector table summary reports `0` rows in those public tables; confirm whether data/Auth import is complete before switching production
- Read-only checks against the currently deployed Supabase host pass: 11 auth users, 11 public users, no missing auth refs in public users or rivalry player refs
- Auth redirect probes and Realtime handshake were verified against the currently deployed Supabase host, not yet against `clashlingo_asia`

## Known Issues And Risks

- Scenario persistence has been owner-verified once in Supabase. If a future environment does not have `20260529_000002_battle_packs.sql` and `20260531_000001_scenario_persistence.sql` applied, `submitScenarioRun` returns null and the scenario map shows local-only/default progress.
- Database migration is not publish-complete until local and Vercel env vars point to `https://bwwghdhwhxuqqepgpizb.supabase.co` with the matching anon/publishable key and `SUPABASE_SERVICE_ROLE_KEY`, production is redeployed, and the live smoke checks are rerun.
- `npm run verify:supabase-migration -- --expected-host=bwwghdhwhxuqqepgpizb.supabase.co --require-data` is now available as the local read-only acceptance check after the Asia service-role key is provided or `.env.local` is switched.
- `StageBriefingPage` and `ScenarioExamLandingPage` still mint client-side `mock-...` session ids. They work with the submit route (sessionId is just a text key) but are not yet server-created.
- Battle packs cost Anthropic credits to generate. `npm run seed:battle-packs` pre-generates them (idempotent via cache); live seed now requires a seed user's access token or seed email/password and is run by the owner, not the agent.
- Live opponent exam-progress UI is intentionally out of scope for the current MVP. Results realtime remains the main competitive sync surface for now.
- The repo now has a checked-in Supabase baseline migration under `supabase/migrations/`, but future schema changes still need follow-up migration files instead of one-off dashboard edits.
- `components/ExamPage.tsx` can create a mock exam client-side if no exam record exists. That is useful for fallback/demo purposes, but it can hide backend issues if left untracked.
- The main user-facing routes are now bilingual, but a few low-level raw server fallback strings may still appear in English if a completely unmapped backend failure surfaces.
- The authenticated Playwright smoke suite is env-gated; it only runs when `E2E_EMAIL` and `E2E_PASSWORD` are provided.

## Notes For The Next Session

- Start by reading `docs/project/PROJECT_RULES.md`, then this file, then `docs/project/TASK_QUEUE.md`, then `docs/project/SESSION_SUMMARY.md`.
- Prioritize either final results polish or test strategy / AI output hardening next.
- The repo now includes Playwright smoke-test structure and a Supabase baseline migration; preserve both as the new infra foundation.
- Shared avatar sync and rivalry-shared weekly rhythm are now shipped; if a later session touches them, preserve the public-identity/public-ledger split instead of moving those values back into viewer-local rendering.
- Leave-rivalry is now shipped through `cumulative_ledger.inactive`.
  - Preserve history.
  - Keep inactive rivalries out of lounge.
  - Do not let new rounds start once a rivalry is inactive.
- Preserve the new round cadence guard.
  - It is a rolling 24-hour limit per rivalry.
  - It is enforced server-side by `/api/create-round`.
  - Frontend copy should show the next available time when possible.
- Language level is now a shipped product rule. Preserve the current split:
  - `Settings` stores the user's default level
  - `rivalries.player_a_difficulty / player_b_difficulty` store per-rivalry levels
  - AI routes resolve the effective round level server-side from `target_lang`
- If you continue the UI pass, keep pushing the current `Lounge` vs `Rivalries` split instead of blending those two responsibilities together again.
- Any follow-up lounge / rivalries edits should be visual polish only unless the product rules change again.
- Preserve the current website-language split:
  - UI language can be `English` or `简体中文`
  - it is separate from the user's learning language
  - it should not change AI syllabus or exam generation behavior
- Re-run the full round flow manually after any lounge, countdown, or scope grouping changes.
- If you change infra assumptions, update `README.md`, `.env.example`, and `docs/database/SUPABASE_SCHEMA.md` in the same batch.
