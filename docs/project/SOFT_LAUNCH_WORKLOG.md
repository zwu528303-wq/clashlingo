# Soft Launch Worklog

Date started: 2026-05-31

This is the detailed, owner-editable work journal for the soft-launch readiness
pass. It is separate from `SESSION_SUMMARY.md`, which remains the short
baton-pass.

## 1. 2026-05-31 — Owner-Controlled Verification Guardrail

### What changed

- Created this worklog before the soft-launch pass proceeds further.
- Added the explicit rule that owner-controlled acceptance items must not be
  marked complete unless they are actually verified.
- Current owner-controlled items:
  - Supabase migrations: `20260529_000002_battle_packs.sql` and
    `20260531_000001_scenario_persistence.sql` were owner-applied and verified
    by `to_regclass(...)` table existence on 2026-05-31.
  - Battle-pack seeding: `npm run seed:battle-packs` spends Anthropic credits
    and writes to the owner's Supabase.
  - Authenticated E2E credentials: `E2E_EMAIL` and `E2E_PASSWORD`.
  - Deployment/live preview state.

### Why / what this solves

The soft-launch checklist includes items that cannot be fully verified by the
agent without owner-controlled external state. This guardrail prevents false
"done" claims. If an item depends on migrations, seed data, Anthropic credits,
deployment, or E2E credentials, the agent must preserve fallbacks and document
the exact blocker instead of pretending the item was verified.

### Files touched

- `docs/project/SOFT_LAUNCH_WORKLOG.md`
- `docs/project/TASK_QUEUE.md`
- `docs/project/SESSION_SUMMARY.md`

### New i18n keys

None.

### How to change or undo later

- Edit this entry if the owner changes which external systems the agent may
  operate.
- Once an owner-controlled item is completed, leave this guardrail in place but
  move the specific item from `OWNER ACTION REQUIRED` in
  `docs/project/SESSION_SUMMARY.md` to a verified status note.
- Do not remove this worklog unless the soft-launch workflow is retired.

### Verification result

- `git diff --check` — passed.
- `npm run lint` — passed.
- `npm run build` — passed.

### Deferred / TODO

- OWNER-REVIEW: Confirm whether deployment verification should remain fully
  owner-controlled or whether a future agent may inspect a staging URL.
- OWNER-REVIEW: Confirm whether the authenticated E2E account should be a
  dedicated test user and whether it can mutate test data.

## 2. 2026-05-31 — Stale Battle-Pack Cache Guard

### What changed

- Bumped the scenario battle-pack template version from `v1-ai` to
  `v2-scope-briefing`.
- Added a current-shape guard before returning cached battle packs.
- Applied the same guard before server-side scenario battle submission scoring.

### Why / what this solves

The owner saw a runtime error on `/scenario/cafe/stage/1`:

`Cannot read properties of undefined (reading 'map')`

Diagnosis: the cached pack `cafe-stage-1-french-beginner-v1-ai` had the old scope
shape (`sentencePatterns`, `howBattleWorks`) while the current stage briefing UI
expects `grammar`, `expressions`, and `howTested`. Returning stale cache records
let old content break new UI.

### Files touched

- `lib/battle-pack.ts`
  - `BATTLE_TEMPLATE_VERSION`
  - `isCurrentBattlePack`
- `app/api/generate-battle-pack/route.ts`
  - cached-pack return guard
- `app/api/scenario-battle/submit/route.ts`
  - cached-pack scoring guard
- `docs/project/PROJECT_STATUS.md`
- `docs/project/SESSION_SUMMARY.md`
- `docs/project/SOFT_LAUNCH_WORKLOG.md`

### New i18n keys

None.

### How to change or undo later

- To force all generated scenario packs through another schema refresh, update
  `BATTLE_TEMPLATE_VERSION` in `lib/battle-pack.ts`.
- To inspect whether a cached pack is accepted, edit `isCurrentBattlePack` in
  `lib/battle-pack.ts`.
- Do not downgrade the template version to `v1-ai` unless the UI is also made
  compatible with the old `sentencePatterns` / `howBattleWorks` shape.

### Verification result

- `npm run lint` — passed.
- `npm run build` — passed.

### Deferred / TODO

- OWNER-REVIEW: New `v2-scope-briefing` packs will be generated on demand or by a
  future owner-approved seed run. Old `v1-ai` rows can remain in the table but
  will not satisfy current cache reads.

## 3. 2026-05-31 — Owner Scenario Persistence Smoke Test

### What changed

- The owner completed the manual Supabase checks after the migrations were
  applied.
- The owner ran one real scenario test through the browser.
- The owner confirmed rows exist in:
  - `battle_packs`
  - `scenario_battle_reports`
  - `scenario_progress`

### Why / what this solves

This verifies the main scenario persistence loop once against the real Supabase
project: generated pack cache, submitted report, and durable per-scope progress.

### Files touched

- `docs/project/PROJECT_STATUS.md`
- `docs/project/TASK_QUEUE.md`
- `docs/project/SESSION_SUMMARY.md`
- `docs/project/SOFT_LAUNCH_WORKLOG.md`

### New i18n keys

None.

### How to change or undo later

- If a new Supabase project/environment is introduced, repeat the same
  `to_regclass(...)` table checks and one real scenario run for that environment
  before marking it verified.

### Verification result

- Owner verified table existence in Supabase.
- Owner verified one real browser scenario test wrote the expected rows.

### Deferred / TODO

- OWNER-REVIEW: Confirm the map UI after re-login still shows the persisted
  completed/unlocked state for the tested scenario.

## 4. 2026-05-31 — Public Shell Soft-Launch Hardening

### What changed

- Replaced the logged-out `/` redirect/loading screen with a bilingual public
  landing page.
- The landing page presents Scenarios as the primary path and friend rivalries as
  the secondary path.
- Added app-wide metadata: title template, description, Open Graph, Twitter card,
  and generated `/opengraph-image`.
- Added `NEXT_PUBLIC_SITE_URL` to `.env.example`, README, and project status so
  deployed metadata resolves against the real public URL.
- Updated `/how-it-works` to explain both current loops:
  - scenario quest loop: domain -> scenario -> four stages
  - stage briefing scope
  - timed clash
  - standard-answer self-check
  - stage clear at 80% accuracy
  - durable progress / unlocks
  - `Copy Practice Prompt`
  - friend rivalry weekly loop
- Added root-level `app/error.tsx` and `app/not-found.tsx` fallbacks.
- Changed public session/profile checks on `/`, `/how-it-works`, and
  `/reset-password` so public content renders first instead of blocking on
  Supabase auth calls.
- Extended public Playwright smoke coverage to include the logged-out landing
  page.

### Why / what this solves

This turns the public shell from an internal app redirect into something that can
be shared for a private beta / soft launch. A new visitor can now understand the
product, see that Scenario Map is the main path, reach auth, and open the full
guide without needing owner explanation.

It also prevents public pages from appearing stuck when Supabase session/profile
checks are slow or unavailable in local/dev smoke runs.

### Files touched

- `app/page.tsx`
- `app/layout.tsx`
- `app/opengraph-image.tsx`
- `app/error.tsx`
- `app/not-found.tsx`
- `components/LandingPage.tsx`
- `components/HowItWorksPage.tsx`
- `components/Login.tsx`
- `components/ResetPasswordPage.tsx`
- `lib/i18n/types.ts`
- `lib/i18n/en.ts`
- `lib/i18n/zh-CN.ts`
- `tests/e2e/public-smoke.spec.ts`
- `.env.example`
- `README.md`
- `docs/project/PROJECT_STATUS.md`
- `docs/project/TASK_QUEUE.md`
- `docs/project/SESSION_SUMMARY.md`
- `docs/project/SOFT_LAUNCH_WORKLOG.md`

### New i18n keys

- `common.somethingWentWrongTitle`
- `common.somethingWentWrongDescription`
- `common.tryAgain`
- `common.goHome`
- `common.pageNotFoundTitle`
- `common.pageNotFoundDescription`
- `landing.*`
- `guide.pathOverview*`
- `guide.pathCards`
- `guide.scenarioQuest*`
- `guide.practicePrompt*`

English and Simplified Chinese strings were added in `lib/i18n/en.ts` and
`lib/i18n/zh-CN.ts`.

### How to change or undo later

- Landing copy/layout: edit `components/LandingPage.tsx` and `landing.*` in the
  i18n files.
- Public guide copy: edit `components/HowItWorksPage.tsx` plus `guide.*` i18n
  keys.
- Share metadata: edit `app/layout.tsx`; change the generated card in
  `app/opengraph-image.tsx`.
- Public smoke assertions: edit `tests/e2e/public-smoke.spec.ts`.
- Deployment URL: set `NEXT_PUBLIC_SITE_URL` in the hosting provider.

### Verification result

- `git diff --check` — passed.
- `npm run lint` — passed.
- `npm run build` — passed.
- `npm run test:e2e -- tests/e2e/public-smoke.spec.ts` — passed.
- Playwright screenshots were inspected at 1440px desktop and 390px mobile for
  the landing page; the initial overlap found on mobile was fixed by hiding the
  large product preview on mobile.

### Deferred / TODO

- OWNER-REVIEW: Landing-page positioning and copy are product/brand judgment
  calls; review before sending a broad invite link.
- OWNER-REVIEW: Set the real deployed URL in `NEXT_PUBLIC_SITE_URL`; fallback is
  `http://localhost:3000` for local builds only.
- Authenticated Playwright smoke remains gated on owner-provided `E2E_EMAIL` and
  `E2E_PASSWORD`.

## 5. 2026-06-01 — User-Facing Copy Leak Cleanup

### What changed

- Rewrote landing, guide, and scenario i18n strings that leaked internal
  product-design / strategy / roadmap language into user-facing copy.
  - Strategy phrasing removed: "main path / secondary path", "first click",
    "Soft launch ready means", "A learner can complete one real loop without
    handholding" (internal acceptance criteria that were showing on the public
    landing page).
  - Roadmap phrasing removed: "core battle loop", "later rollout layer", "Open
    for launch", "Briefing route lands next".
  - "loop / 循环" jargon softened to natural phrasing ("ways to practice",
    "weekly rhythm", "friend rivalries").
- Deleted the dead `battlePlaceholder*` / `examPlaceholder*` i18n keys (defined
  but never rendered by any component) from `types.ts`, `en.ts`, and `zh-CN.ts`.

### Why / what this solves

The owner found internal product-design language had leaked into the live UI
(e.g. "场景地图是主线。朋友对战…但不再抢新用户的第一点击。"). This reads as
strange/confusing to a real visitor. The cleanup keeps en and zh-CN in sync and
removes dead keys so the dictionaries stay honest.

### Files touched

- `lib/i18n/en.ts`
- `lib/i18n/zh-CN.ts`
- `lib/i18n/types.ts`

### New i18n keys

None added. Removed: `scenarios.battlePlaceholderEyebrow/Title/Description/Next/
SessionLabel`, `scenarios.examPlaceholderEyebrow/Title/Description/Next`.

### How to change or undo later

- Landing copy: `landing.*` in the i18n files.
- Guide copy: `guide.*`.
- Scenario copy: `scenarios.*`.
- Keep en.ts and zh-CN.ts edits paired; `npm run build` type-checks key parity
  against `types.ts`.

### Verification result

- `npm run lint` — passed.
- `npm run build` — passed.
- Committed as `ab3c080`, pushed to `origin/main`.

### Deferred / TODO

- Minor: `scenarios.examLaneDescription` still says Exam Mode "removes the live
  opponent pressure", but Clash Mode no longer has an AI opponent. Stale wording,
  not blocking. Reword when convenient.

## 6. 2026-06-01 — Auth Gate on the Paid Generate Endpoint

### What changed

- `app/api/generate-battle-pack/route.ts` now requires a valid Supabase Bearer
  token before doing any work — the same check used by
  `scenario-battle/submit` and `scenario-progress`. No token or an invalid token
  returns `401` before any Anthropic call.
- `lib/battle-pack.ts` `fetchBattlePack` now reads the signed-in session's
  `access_token` and sends it as `Authorization: Bearer ...`. The browser
  supabase client is imported dynamically so it stays out of any server bundle
  that also imports this module. If the user is not signed in, it returns null
  without calling the endpoint.

### Why / what this solves

`generate-battle-pack` is the only route that spends Anthropic credits (one
`claude-sonnet-4` call per cache miss). It was unauthenticated, so for a public
"build in public" launch anyone with the URL could script the uncached combos
and burn credits. The cache bounds the worst case, but the route had zero
gating. Requiring login closes the anonymous-spam vector.

Honest limitation: signup is open, so a logged-in user could still script the
(bounded) combo space. True per-user/IP rate limiting is a future hardening step,
not a launch blocker.

### Files touched

- `app/api/generate-battle-pack/route.ts`
- `lib/battle-pack.ts`

### New i18n keys

None.

### How to change or undo later

- The auth block mirrors the other two routes; edit/remove there if the policy
  changes.
- If a future flow needs anonymous generation, gate it behind a server-side
  rate limiter instead of removing auth outright.

### Verification result

- `npm run lint` — passed.
- `npm run build` — passed.
- Live check against dev server: no token → `401 MISSING_ACCESS_TOKEN`; invalid
  token → `401 UNAUTHORIZED` (rejected before any Anthropic call).
- Committed as `3d546ad`, pushed to `origin/main`.

### Deferred / TODO

- OPTIONAL HARDENING: add per-user/IP rate limiting on `generate-battle-pack`.

## 7. 2026-06-01 — Pre-Deploy Checklist (Owner-Controlled)

This is the go-live checklist. Items are owner-controlled (hosting + Supabase
dashboards); the agent cannot verify them remotely.

### Required (the site breaks without these)

1. Set hosting environment variables (e.g. Vercel → Project → Environment
   Variables):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only secret — never `NEXT_PUBLIC_*`)
   - `ANTHROPIC_API_KEY`
   - `NEXT_PUBLIC_SITE_URL` (production URL; without it OG/share previews point
     to localhost)
2. Supabase → Auth → URL Configuration: add the production domain to **Site
   URL** and **Redirect URLs**. Otherwise password-reset and email-confirmation
   links fail in production.
3. Confirm both migrations are applied to the Supabase project used for the
   deploy: `20260529_000002_battle_packs.sql` and
   `20260531_000001_scenario_persistence.sql`. (Owner-verified on the current
   project; re-run if the deploy uses a different project.)

### Recommended (not blocking, affects cost / first impression)

4. Pre-seed at least one scenario so the first visitor doesn't wait on live
   generation:
   - Dry run: `npm run seed:battle-packs -- --dry-run --only cafe`
   - Live: `npm run seed:battle-packs -- --only cafe`
   - Owner runs this (spends Anthropic credits + writes to owner Supabase). The
     agent must not run it live.
5. Optional second layer: per-user/IP rate limiting on the generate endpoint.

### Already ready (no action)

- Code: lint green, paid endpoint gated, scenario loop persists end to end,
  public landing + metadata + error/not-found, bilingual copy cleaned. Local
  build can be blocked by Google Fonts fetch from this network; use Vercel
  deployment build as the production build gate.
- Code pushed to `origin/main`.

### Verification result

- Checklist authored from a live read of the codebase, routes, and env example
  on 2026-06-01. No code changed in this entry.

### Deferred / TODO

- OWNER: work through Required items 1–3 before sending the first invite link.
- OWNER: decide on Recommended item 4 (seed scope) based on cost tolerance.

## 8. 2026-06-01 — Paid Endpoint + Seed Auth Closeout

### What changed

- Added Supabase Bearer-token auth to the old rivalry AI endpoints:
  `/api/generate-syllabus` and `/api/generate-exam`.
- Both endpoints now use an anon-key Supabase client to validate the caller's
  access token, then service-role access only after auth passes.
- Both endpoints now verify that the caller belongs to the round's rivalry
  before any Anthropic call.
- `components/RoundPage.tsx` now attaches the current session token when it
  generates a rivalry scope or exam.
- `scripts/seed-battle-packs.ts` now supports authenticated live seeding via
  `SEED_ACCESS_TOKEN`, or via `SEED_EMAIL` / `SEED_PASSWORD` with the public
  Supabase env vars.
- The seed script now exits before sending a live request when no seed auth is
  available.
- `tests/e2e/public-smoke.spec.ts` now checks current landing-page copy instead
  of the deleted `Main path: Scenario Map` text.

### Why / what this solves

- The old rivalry AI routes can no longer spend Anthropic credits for anonymous
  callers who discover a valid round id.
- Live pre-seeding now matches the authenticated `/api/generate-battle-pack`
  contract instead of failing with `401`.
- Public smoke is usable again as a deploy-health signal because it tests the
  landing copy that actually exists.

### Files touched

- `app/api/generate-syllabus/route.ts`
- `app/api/generate-exam/route.ts`
- `components/RoundPage.tsx`
- `scripts/seed-battle-packs.ts`
- `tests/e2e/public-smoke.spec.ts`
- `docs/project/PROJECT_STATUS.md`
- `docs/project/TASK_QUEUE.md`
- `docs/project/SESSION_SUMMARY.md`
- `docs/project/SOFT_LAUNCH_WORKLOG.md`

### New i18n keys

None.

### How to change or verify later

- For live seed, set `SEED_ACCESS_TOKEN`, or set `SEED_EMAIL` /
  `SEED_PASSWORD` plus `NEXT_PUBLIC_SUPABASE_URL` /
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Keep using dry-run first:
  `npm run seed:battle-packs -- --dry-run --only cafe --limit 1`.
- The owner, not the agent, runs live seed because it spends Anthropic credits
  and writes to Supabase.
- If anonymous AI generation is ever desired, add rate limiting first rather
  than removing the auth gate.

### Verification result

- `npm run lint` — passed.
- `npm run build` — failed locally because Next/Turbopack could not fetch Plus
  Jakarta Sans from Google Fonts on this network; Vercel production deployment
  build passed and is the production build gate.
- `npm run test:e2e -- tests/e2e/public-smoke.spec.ts` — passed, 3 tests.
- `npm run seed:battle-packs -- --dry-run --only cafe --limit 1` — passed, no
  requests sent.
- `npm run seed:battle-packs -- --only cafe --limit 1` with no seed auth —
  exited before any request with a clear auth requirement.
- Local dev curl checks against `/api/generate-syllabus`,
  `/api/generate-exam`, and `/api/generate-battle-pack` with no token all
  returned `401 MISSING_ACCESS_TOKEN`.

### Deferred / TODO

- OWNER-REVIEW: decide whether to live-seed one scenario such as `cafe` after
  confirming seed auth env and cost tolerance.
- Optional hardening: add per-user/IP rate limiting around paid AI endpoints
  after initial soft-launch traffic is understood.

## 9. 2026-06-02 — Vercel Asia Region Production Verification

### What changed

- Pushed the migration-ready `main` branch to GitHub.
- Vercel deployed commit `f78b8de` as production deployment
  `dpl_6zDAcvMqrUYyjDdXooqAeJCQteFa`.
- The production deployment includes `vercel.json` with `regions: ["hkg1"]`.
- Verified that the deployed browser bundle currently points to
  `bemkskhhydlndiegcuxu.supabase.co`.
- Verified that the old rivalry AI endpoints and scenario AI/progress endpoints
  reject anonymous calls before doing paid or user-scoped work.

### Why / what this solves

Production API functions were still running in `iad1` because the prior
deployed commit did not include the new Vercel region config. This closes the
Vercel function-region part of the migration.

This does not yet close the Supabase project swap. After the Supabase connector
was available, it listed the Asia project as `clashlingo_asia`
(`bwwghdhwhxuqqepgpizb`) in `ap-northeast-1`, while local `.env.local` and the
deployed browser bundle still point to `bemkskhhydlndiegcuxu.supabase.co`.

### Files touched

- `vercel.json`
- `app/api/generate-syllabus/route.ts`
- `app/api/generate-exam/route.ts`
- `components/RoundPage.tsx`
- `scripts/seed-battle-packs.ts`
- `tests/e2e/public-smoke.spec.ts`
- `docs/project/PROJECT_STATUS.md`
- `docs/project/TASK_QUEUE.md`
- `docs/project/SESSION_SUMMARY.md`
- `docs/project/SOFT_LAUNCH_WORKLOG.md`

### New i18n keys

None.

### How to change or verify later

- Vercel function region: edit `vercel.json`.
- Supabase project: update Vercel `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`, then
  redeploy.
- Auth redirects: Supabase Dashboard → Authentication → URL Configuration.
- Re-check deployed Supabase host by scanning the production JS bundle for the
  `*.supabase.co` host.
- Re-check function region by calling a live API route and reading
  `x-vercel-id`; the function region should include `hkg1`.

### Verification result

- Vercel production deployment `dpl_6zDAcvMqrUYyjDdXooqAeJCQteFa` — `READY`.
- Vercel deployment metadata — function region `hkg1`.
- Live production API headers — include `hkg1` for API execution.
- Public production routes `/`, `/login`, `/reset-password`, `/how-it-works`,
  and `/opengraph-image` — `200`.
- Live anonymous API checks:
  - `/api/generate-syllabus` — `401 MISSING_ACCESS_TOKEN`
  - `/api/generate-exam` — `401 MISSING_ACCESS_TOKEN`
  - `/api/generate-battle-pack` — `401 MISSING_ACCESS_TOKEN`
  - `/api/scenario-progress` — `401 MISSING_ACCESS_TOKEN`
- Deployed Supabase host — `bemkskhhydlndiegcuxu.supabase.co`, matching
  `.env.local` but not the connector-visible `clashlingo_asia` project.
- Supabase connector target — `clashlingo_asia`
  (`bwwghdhwhxuqqepgpizb`), region `ap-northeast-1`, status
  `ACTIVE_HEALTHY`; expected public tables exist, but compact table summaries
  currently report `0` public rows.
- Supabase table counts on the currently deployed host:
  - `users=11`
  - `rivalries=10`
  - `rounds=8`
  - `exams=5`
  - `submissions=10`
  - `battle_packs=4`
  - `scenario_progress=1`
  - `scenario_battle_reports=2`
- Auth/table integrity:
  - `auth_users=11`
  - `public_users_missing_auth=0`
  - `rivalry_player_refs_missing_auth=0`
- Supabase Auth redirect probes for production, bare-domain, and localhost `/`
  and `/reset-password` — all `ok`.
- Supabase Realtime handshake for `rounds` updates and `submissions` inserts —
  `SUBSCRIBED`.
- Local verification:
  - `git diff --check` — passed.
  - `npm run lint` — passed.
  - `npm run test:e2e -- tests/e2e/public-smoke.spec.ts` — passed, 3 tests.
  - `npm run seed:battle-packs -- --dry-run --only cafe --limit 1` — passed,
    no requests sent.
  - `npm run seed:battle-packs -- --only cafe --limit 1` with no seed auth —
    exited before any request.
  - Local anonymous API checks returned `401 MISSING_ACCESS_TOKEN`.
  - Local `npm run build` failed because this network could not fetch Google
    Fonts for `next/font`; production build passed on Vercel.

### Deferred / TODO

- Switch local and Vercel Supabase env to `clashlingo_asia`
  (`bwwghdhwhxuqqepgpizb`) after confirming data/Auth import and obtaining the
  matching `SUPABASE_SERVICE_ROLE_KEY`; redeploy and rerun production checks.
- OWNER-REVIEW: decide whether to live-seed one scenario such as `cafe`.
- Authenticated Playwright smoke remains gated on owner-provided
  `E2E_EMAIL` / `E2E_PASSWORD`.
- Optional hardening: add per-user/IP rate limiting around paid AI endpoints
  after initial traffic is understood.

## 10. 2026-06-02 — Supabase Migration Verification Script

### What changed

- Added a read-only local verification script:
  `scripts/verify-supabase-migration.ts`.
- Added the package command:
  `npm run verify:supabase-migration`.
- The script loads `.env.local` by default, validates the Supabase URL host and
  key project refs, counts Auth users and expected public tables, and checks for
  missing Auth references in public `users` and `rivalries`.
- The script never prints Supabase keys and never writes to Supabase.

### Why / what this solves

The Asia database switch now has a repeatable acceptance check instead of a
set of one-off shell commands. Once the `clashlingo_asia` service-role key is
provided or Vercel/local env is updated, this script can prove whether the app
is pointed at the intended project and whether data/Auth references are present.

### Files touched

- `package.json`
- `scripts/verify-supabase-migration.ts`
- `docs/project/PROJECT_STATUS.md`
- `docs/project/TASK_QUEUE.md`
- `docs/project/SESSION_SUMMARY.md`
- `docs/project/SOFT_LAUNCH_WORKLOG.md`

### New i18n keys

None.

### How to change or verify later

- To verify the currently configured Supabase project:
  `npm run verify:supabase-migration`.
- To require the Asia host:
  `npm run verify:supabase-migration -- --expected-host=bwwghdhwhxuqqepgpizb.supabase.co`.
- To require non-empty migrated Auth/public data:
  `npm run verify:supabase-migration -- --expected-host=bwwghdhwhxuqqepgpizb.supabase.co --require-data`.
- If a fresh empty launch is intentionally accepted, omit `--require-data` but
  still run the host/key/table check before redeploying.

### Verification result

- `npm run verify:supabase-migration -- --expected-host=bemkskhhydlndiegcuxu.supabase.co --require-data`
  — passed against the currently configured Supabase project and reported:
  - `auth_users=11`
  - `users=11`
  - `rivalries=10`
  - `rounds=8`
  - `exams=5`
  - `submissions=10`
  - `battle_packs=4`
  - `scenario_progress=1`
  - `scenario_battle_reports=2`
  - `public_users_missing_auth=0`
  - `rivalry_refs_missing_auth=0`
- `npm run verify:supabase-migration -- --expected-host=bwwghdhwhxuqqepgpizb.supabase.co`
  — failed with the expected host mismatch because `.env.local` still points to
  `bemkskhhydlndiegcuxu.supabase.co`.
- `npx tsc --noEmit --pretty false` — passed after adding explicit minimal
  Supabase database types for the script.
- Supabase connector SQL on `clashlingo_asia`
  (`bwwghdhwhxuqqepgpizb`) reported:
  - `auth_users=0`
  - all expected public table counts are `0`
- `npm run lint` — passed.

### Deferred / TODO

- Owner decision required: either migrate the existing 11 Auth users and public
  gameplay rows, or accept `clashlingo_asia` as a fresh empty launch database.
- Supabase's official guidance says Auth users can be migrated between Supabase
  projects, including hashed passwords, but the reliable path is a dashboard
  backup or SQL export/import with Supabase CLI / `pg_dump` / `psql`. The
  current agent context does not have the old project's Postgres connection
  password or the new project's service-role key, so this cannot be completed
  safely from the repo alone.
- Owner input required: provide the `clashlingo_asia`
  `SUPABASE_SERVICE_ROLE_KEY`, or set it directly in Vercel.
- After env is switched, rerun the verification script, redeploy production,
  scan the deployed Supabase host, and rerun public/API smoke checks.

## 11. 2026-06-03 — Rivalry Early-Start Stuck-State Recovery

### What changed

- Investigated why rivalry matches could not start during the Supabase Asia
  migration window.
- Confirmed production still points to `bemkskhhydlndiegcuxu.supabase.co`, not
  the empty Asia project `bwwghdhwhxuqqepgpizb`.
- Found two active `countdown` rounds where both players were already marked
  exam-ready, but no exam row existed and the round had not advanced to
  `exam_live`.
- Updated `RoundPage` so a round in either `countdown` or `exam_ready` with both
  ready flags set will retry exam generation / live promotion.
- Kept the button usable as a manual retry path instead of disabling it forever
  when both players are already ready.

### Why / what this solves

This fixes a real stuck state that can happen if exam generation fails or is
interrupted after both players have tapped ready. The user no longer sees a
dead-end "waiting" state when both players are already ready.

### Files touched

- `components/RoundPage.tsx`
  - `promoteExamLive`
  - both-ready recovery `useEffect`
  - countdown and exam-ready button disabled/label logic
- `lib/i18n/types.ts`
- `lib/i18n/en.ts`
- `lib/i18n/zh-CN.ts`
- `docs/project/PROJECT_STATUS.md`
- `docs/project/TASK_QUEUE.md`
- `docs/project/SESSION_SUMMARY.md`
- `docs/project/SOFT_LAUNCH_WORKLOG.md`

### New i18n keys

- `round.retryStartExam`
  - en: `Try Start Again`
  - zh-CN: `重新尝试开考`

### How to change or undo later

- To change the retry button text, edit `round.retryStartExam` in
  `lib/i18n/en.ts` and `lib/i18n/zh-CN.ts`.
- To remove automatic recovery, revert the `canPromoteExam` condition in
  `components/RoundPage.tsx` so it only accepts `round.status === "exam_ready"`.
- To make failures more explicit later, add a dedicated mapped error state for
  `generate-exam` failures in `RoundPage` instead of the current generic
  `unlockExamFailed` copy.

### Verification result

- `npm run lint` — passed.
- `npx tsc --noEmit --pretty false` — passed.
- Vercel production deployment `dpl_A5i3MUbuq1rmf63bJPX1WT3y4XvL` for commit
  `60a4754` is `READY`.
- Post-deploy smoke:
  - public routes `/`, `/login`, `/reset-password`, and `/how-it-works` return
    `200`
  - no-token API checks return `401 MISSING_ACCESS_TOKEN`
  - deployed bundle still points to `bemkskhhydlndiegcuxu.supabase.co`
  - deployed bundle includes the new exam-generation error copy
- Production read-only checks:
  - live bundle still points to `bemkskhhydlndiegcuxu.supabase.co`
  - live no-token API checks return `401 MISSING_ACCESS_TOKEN`
  - Asia Supabase project counts are still `0`, so the migration remains
    incomplete
- Post-deploy check:
  - Vercel production deployment `dpl_5UuQnZ8L2TqJUocT3bdZiPpwFg3p` for commit
    `cda54da` is `READY`
  - public routes `/`, `/login`, `/reset-password`, and `/how-it-works` return
    `200`
  - the deployed bundle includes the new retry copy

### Deferred / TODO

- OWNER-REVIEW: after deploying this fix, open the stuck round(s) and confirm
  the exam either generates and moves to `exam_live`, or shows the retry error
  cleanly.
- If retry still fails, the next likely issue is the `/api/generate-exam`
  runtime path: Anthropic key/model/API response, JSON parse, or production
  function timeout/logs.

## 12. 2026-06-03 — Exam Generation Endpoint Hardening

### What changed

- Investigated the follow-up failure where the stuck round still showed
  `提前解锁考试失败了` after the retry button shipped.
- Confirmed round `6dcc2bfd-6090-4a13-b1f0-47c4c8caa5cf` is still on
  `bemkskhhydlndiegcuxu.supabase.co`, has syllabus data, has both players
  confirmed/ready, and has no matching `exams` row.
- Hardened `app/api/generate-exam/route.ts`:
  - route duration is now `60` seconds
  - AI output budget is now `8000` tokens
  - output must contain exactly 24 questions and 24 rubric items before writing
  - malformed/truncated AI output returns explicit error codes
  - `exams` insert/update and `rounds` update errors are checked
- Added more specific RoundPage error copy for incomplete exam output and exam
  save failures.

### Why / what this solves

The 24-question bilingual exam JSON is much larger than the syllabus payload.
The old `4000` token output budget could truncate the JSON, and the route did
not validate shape before writing. This makes the live early-start path more
resilient and makes any remaining failure easier to diagnose.

### Files touched

- `app/api/generate-exam/route.ts`
- `components/RoundPage.tsx`
- `lib/i18n/types.ts`
- `lib/i18n/en.ts`
- `lib/i18n/zh-CN.ts`
- `docs/project/PROJECT_STATUS.md`
- `docs/project/TASK_QUEUE.md`
- `docs/project/SESSION_SUMMARY.md`
- `docs/project/SOFT_LAUNCH_WORKLOG.md`

### New i18n keys

- `round.errors.generateExamContentFailed`
  - en: `The exam generator returned incomplete output. Please try again.`
  - zh-CN: `考试生成器输出不完整，请再试一次。`
- `round.errors.saveExamFailed`
  - en: `The exam could not be saved. Please try again.`
  - zh-CN: `考试保存失败了，请再试一次。`

### How to change or undo later

- This entry describes the initial single-call hardening. The later sectioned
  generator replaced the old `EXAM_MAX_TOKENS` approach; edit
  `EXAM_SECTION_MAX_TOKENS` and `EXAM_SECTIONS` instead.
- To change the server timeout, edit `export const maxDuration`.
- To change the expected exam size, edit `EXPECTED_EXAM_ITEM_COUNT` and the
  generation prompt in the same file.
- To adjust user-facing failure copy, edit the new `round.errors.*` keys in
  `lib/i18n/en.ts` and `lib/i18n/zh-CN.ts`.

### Verification result

- `git diff --check` — passed.
- `npm run lint` — passed.
- `npx tsc --noEmit --pretty false` — passed.

### Deferred / TODO

- This fix deployed and exposed the next diagnostic signal: incomplete AI
  output. See entry 13 for the sectioned-generation follow-up.

## 13. 2026-06-03 — Sectioned Rivalry Exam Generation

### What changed

- Investigated the next production symptom after endpoint hardening: the stuck
  round now showed `考试生成器输出不完整，请再试一次。`
- Updated `app/api/generate-exam/route.ts` so the 24-question rivalry exam is
  generated in three smaller Anthropic calls:
  - MCQ questions 1-10
  - fill-in-the-blank questions 11-20
  - translation questions 21-24
- Added section-level validation before merge:
  - exact id range and count
  - question type
  - rubric id and point values
  - exactly 4 options for MCQ
  - required FITB shape
- Kept the final whole-exam validation before writing to `exams` or updating
  `rounds`.

### Why / what this solves

The previous single-call generator still asked Anthropic for one large
bilingual 24-question JSON object. Production reached the route, but the model
could still return incomplete or invalid JSON. Sectioned generation reduces the
size of each response and catches malformed sections before they can affect the
round.

### Files touched

- `app/api/generate-exam/route.ts`
- `docs/project/PROJECT_STATUS.md`
- `docs/project/TASK_QUEUE.md`
- `docs/project/SESSION_SUMMARY.md`
- `docs/project/SOFT_LAUNCH_WORKLOG.md`

### New i18n keys

None.

### How to change or undo later

- To change per-section output budget, edit `EXAM_SECTION_MAX_TOKENS` in
  `app/api/generate-exam/route.ts`.
- To change exam composition, edit `EXAM_SECTIONS` in the same file and keep
  the prompt, section validator, final validator, and client scoring contract in
  sync.

### Verification result

- `git diff --check` — passed.
- `npm run lint` — passed.
- `npx tsc --noEmit --pretty false` — passed.
- Vercel production deployment `dpl_Aw9yim9DWADw94UHXeHsypSj3GYJ` for commit
  `ad7b607` is `READY`.
- Post-deploy smoke:
  - public routes `/`, `/login`, `/reset-password`, and `/how-it-works` return
    `200`
  - no-token checks for `/api/create-round`, `/api/generate-syllabus`,
    `/api/generate-exam`, and `GET /api/scenario-progress` return
    `401 MISSING_ACCESS_TOKEN`
  - function response headers still include `hkg1`
  - deployed browser bundle still points to `bemkskhhydlndiegcuxu.supabase.co`

### Deferred / TODO

- OWNER-REVIEW: refresh the affected round and click `重新尝试开考` once more.

## 14. 2026-06-03 — Syllabus Fallback For Rivalry Exam Generation

### What changed

- Rechecked round `6dcc2bfd-6090-4a13-b1f0-47c4c8caa5cf` after the user still
  saw `考试生成器输出不完整，请再试一次。`
- Confirmed both players are already confirmed and exam-ready, the round is
  still `countdown`, syllabus exists, and no exam row exists.
- Updated `app/api/generate-exam/route.ts` so Anthropic is still the preferred
  generator, but a deterministic syllabus-based fallback exam is written if
  Anthropic returns a generation-shape failure or API/runtime error.
- The fallback exam keeps the existing rivalry exam structure:
  - 10 MCQ questions
  - 10 fill-in-the-blank questions
  - 4 translation questions
  - 24 rubric items
  - 100 total points

### Why / what this solves

The live blocker is not the opponent leaving the page closed; both ready flags
are already true. The app was repeatedly blocked by AI output shape failures.
This fallback prevents the round from getting stuck when the saved syllabus is
good but the model output is not.

### Files touched

- `app/api/generate-exam/route.ts`
- `docs/project/PROJECT_STATUS.md`
- `docs/project/TASK_QUEUE.md`
- `docs/project/SESSION_SUMMARY.md`
- `docs/project/SOFT_LAUNCH_WORKLOG.md`

### New i18n keys

None.

### How to change or undo later

- To make fallback stricter or softer, edit `buildFallbackExamSections` in
  `app/api/generate-exam/route.ts`.
- To remove fallback behavior, remove the `ExamGenerationFailure` catch around
  sectioned generation and let the existing explicit AI error codes return to
  the client.

### Verification result

- `git diff --check` — passed.
- `npm run lint` — passed.
- `npx tsc --noEmit --pretty false` — passed.

### Deferred / TODO

- Deploy this fallback fix, then ask the owner to refresh the affected round
  and click `重新尝试开考` once more.
