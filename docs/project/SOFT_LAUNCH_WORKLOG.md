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
