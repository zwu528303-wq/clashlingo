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
