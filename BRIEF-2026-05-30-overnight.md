# BRIEF — 2026-05-30 → 2026-05-31 (Overnight)

## 1. Title & Meta

- **Title:** ClashLingo — Scenario answer-loop audit + persistence plan + safe seed-script hardening
- **Date range:** 2026-05-30 (written) → 2026-05-31 (overnight execution window)
- **Author:** Claude (handoff prepared for an unsupervised overnight agent)
- **Audience:** A fresh coding agent (e.g. Codex) with repo access, a shell, and no memory of prior chats. Read ONLY this file plus the files it points to.
- **Status:** READY TO EXECUTE. Working tree is clean at commit `ab861dd` on `main`.
- **One-line goal:** Produce two decision-ready design docs (answer-loop audit + scenario persistence plan) and land one small, lint/build-verified hardening change to the seed script — without touching the database, spending AI credits, or deploying.

### Allowed vs Forbidden (read before doing anything)

**You MAY:**
- Read any file in the repo.
- Create new Markdown docs under `docs/project/` and `LOG/`.
- Make the ONE specific code change described in Step 2C (seed-script flags) and nothing else in code.
- Run `npm run lint`, `npm run build`, and `npm run seed:battle-packs -- --dry-run` (dry-run is free and sends no network requests).
- `git add` your own new/modified files, `git commit`, and `git push origin main`.

**You MUST NOT:**
- ❌ Run the seed script for real (any invocation WITHOUT `--dry-run`). It calls the Anthropic API (costs real money) and writes to the user's Supabase. This is a **live-run gated on explicit human approval** — see §"Dry-run vs Live-run".
- ❌ Apply, write, or edit any SQL migration, or connect to Supabase. You have no dashboard access and the human applies migrations manually.
- ❌ Deploy anything. No `vercel`, no `next start` for production, no hosting changes.
- ❌ `git reset --hard`, `git checkout -- .`, `git clean`, `git rebase`, force-push, `--amend`, or edit `git config`. Only additive commits.
- ❌ Touch `.env*`, secrets, or print any key/token/URL value.
- ❌ Refactor unrelated code, rename things broadly, or "improve" files outside the explicit scope.
- ❌ Invent data, APIs, prices, table contents, or test results. If you don't know, say so and write it as an open question.

---

## 2. Current Context Summary

### Where the project is
ClashLingo is a Next.js (App Router, React 19, Tailwind 4) + Supabase + Anthropic language-learning app. Two product loops exist:
- **Rivalry loop (mature):** friend-vs-friend, syllabus → exam → results/ledger. DB-backed.
- **Scenario / battle loop (新主线, Phase 1 only):** scenario → stage → AI-generated "battle pack" → clash or exam. Newer, partially stubbed.

Phase 1 of the scenario loop shipped at commit `c33c0dd`; the scope-schema alignment + seed script shipped at `ab861dd` (current HEAD).

### What is REAL vs STUBBED in the scenario loop (critical — do not assume more is built)
- ✅ **REAL & DB-backed:** AI battle-pack generation + cache. `app/api/generate-battle-pack/route.ts` generates a bilingual pack and upserts into the `battle_packs` table (`supabase/migrations/20260529_000002_battle_packs.sql`). `lib/battle-pack.ts` owns rules, strict validation, assembly, cache key.
- ⚠️ **STUBBED — battle sessions/reports are client-only:** `lib/battle-session.ts` saves reports to `localStorage` (`clashlingo:battle-report:`). There are **no** `battle_sessions` / `battle_attempts` / `battle_reports` tables. The "AI opponent" score is **simulated client-side** in `lib/battle-scoring.ts`. There is no real multiplayer for scenario battles.
- ⚠️ **STUBBED — scenario progress is hardcoded:** `lib/scenario-progress.ts` returns `MOCK_SCENARIO_PROGRESS`. Completed/current stages are NOT persisted per user.
- ⚠️ **Pre-generation not yet run:** `scripts/seed-battle-packs.ts` exists (144 combos) but has NOT been executed; packs are generated on-demand at runtime.

### Locked decisions (do not reopen)
- Stack stays: Next.js App Router (a modified version — read `node_modules/next/dist/docs/` before writing Next code), React 19, Tailwind 4, Supabase, Anthropic. Model `claude-sonnet-4-20250514`.
- Visual direction: playful minimalism, primary `#953f4d`, secondary `#0c693d`.
- Battle-pack content is **strict bilingual** `{ en, "zh-CN" }` for interface text; learner-facing answer content is in the target language.
- `ScopeBriefing` field set is now aligned to the rivalry `Syllabus` shape (camelCase, strict bilingual): `summary / canDo / vocabularyGroups / grammar / expressions / followUpTypes / howTested`. This was just changed at `ab861dd`; treat it as settled.
- Pre-gen coverage = full-launch scenarios × open stages × **{French, English, Spanish}** × 4 levels. On-demand generation stays the fallback.
- Migrations are applied **manually** in the Supabase SQL editor. No Supabase CLI in this repo.

### Biggest current blocker
There is **no persistence layer** for scenario sessions or progress, and **three different "answer questions" loops** now coexist (rivalry exam, scenario clash, scenario exam) with overlapping but inconsistent scoring/report code. Before more scenario features are built, the team needs (a) a clear map of the three loops and a consolidation recommendation, and (b) a concrete persistence plan. **These are design/doc deliverables — not something to implement tonight.**

### Source-of-truth files (trust these)
- `docs/project/PROJECT_RULES.md` — intended product behavior.
- `docs/project/PROJECT_STATUS.md` — architecture/health/known issues.
- `docs/project/TASK_QUEUE.md` — prioritized backlog.
- `docs/project/SESSION_SUMMARY.md` — latest baton pass (read first; it's the most current).
- `README.md` — setup + product overview.
- The code itself for the scenario loop (listed in §4).

### Stale info — do NOT trust
- `docs/project/PROJECT_RULES.md` / `PROJECT_STATUS.md` / older sections of `TASK_QUEUE.md` are dated **2026-03-25** and predate the entire scenario feature. They do not describe scenarios, battle packs, or the sidebar restructure. Where they conflict with `SESSION_SUMMARY.md` (2026-05-30) or the code, the summary and code win.
- Any reference implying scenario progress or battle results are persisted server-side is wrong (they are mock/localStorage).

---

## 3. Goal (verifiable)

By morning, the repo must contain:
1. `docs/project/EXAM_LOOPS_AUDIT.md` — a complete map of the **three** answer-question loops with a comparison table and a single recommended consolidation path (with trade-offs). **No code changes.**
2. `docs/project/SCENARIO_PERSISTENCE_PLAN.md` — a step-by-step plan (incl. a *draft, non-applied* SQL schema in a fenced block) to move scenario progress + battle sessions/reports from mock/localStorage to Supabase. **No migration files, no DB calls.**
3. One small, reversible code change: `scripts/seed-battle-packs.ts` gains `--limit N` and `--only <slug>` flags (for cheap future human smoke runs), with lint + build still green.
4. A work log under `LOG/` and a morning handoff summary (see §7–8).

---

## 4. Reading List (read these first, in order)

| File / section | Why read it |
| --- | --- |
| `docs/project/SESSION_SUMMARY.md` | Most current state; what changed at `c33c0dd` and `ab861dd`. |
| This brief (all of it) | Scope, guardrails, deliverable shapes. |
| `lib/scenario-types.ts` | The data model: `Scenario`, `ScopeBriefing`, `BattlePack`, `BattleSession`, `BattleAttempt`, `BattleReport`, question types. |
| `lib/scenario-map.ts` | Catalog: which scenarios are `launchStatus: "full"` and their `availableStages` (drives seed coverage). |
| `lib/battle-pack.ts` | Real pipeline: rules, `validateBattleContent`, `assembleBattlePack`, cache key. |
| `app/api/generate-battle-pack/route.ts` | The generation prompt, cache check, error codes, upsert. |
| `lib/battle-session.ts` | Proof that sessions/reports are localStorage-only + how reports are built. |
| `lib/battle-scoring.ts` | Proof the AI opponent is simulated; scoring math for speed/accuracy/quality. |
| `lib/scenario-progress.ts` | Proof progress is hardcoded `MOCK_SCENARIO_PROGRESS`. |
| `components/BattlePage.tsx` | Scenario **clash** loop UI/flow. |
| `components/ScenarioExamLandingPage.tsx` + `app/scenario/[slug]/stage/[stage]/exam/page.tsx` | Scenario **exam** loop. |
| `components/ExamPage.tsx` + `app/round/[id]/exam/page.tsx` | The original **rivalry exam** loop (24Q/40min, rubric scoring, ledger). |
| `scripts/seed-battle-packs.ts` | The file you will modify in Step 2C; understand it before editing. |
| `supabase/README.md` + `supabase/migrations/20260529_000002_battle_packs.sql` | Migration conventions + the only scenario table that exists. Reference for the *draft* schema you'll write (do NOT create a new migration). |

---

## 5. Detailed Execution Steps

### 1. Orientation
- **Do:** Read every file in §4. Run `git status` (expect clean tree on `main` at `ab861dd`) and `git log --oneline -5`.
- **Command:** `git status && git log --oneline -5`
- **Output:** Confirm clean tree. Note HEAD sha in the log.
- **Do NOT:** Start editing or run any build yet. Do NOT `git pull`/`fetch` unless the tree is unexpectedly behind (if it is, stop and record it as a blocker — do not force anything).

### 2. Main Work

#### 2A. Write `docs/project/EXAM_LOOPS_AUDIT.md`
- **Do:** Document all THREE answer-question loops. For each loop include: entry route(s) + component file(s), how questions are sourced (AI pack vs syllabus/exam route vs mock), scoring model, where results are stored (DB vs localStorage vs none), and timing/format (e.g. rivalry exam = 24Q/40min). Then add:
  - A **comparison table** (rows = the 3 loops; columns = source of questions / scoring / persistence / multiplayer / bilingual handling / known gaps).
  - An **Overlaps & Conflicts** section (e.g. duplicated scoring logic between `lib/battle-scoring.ts` and `ExamPage.tsx`; two different "report" shapes; localStorage vs DB).
  - A **Recommendation** section: ONE recommended consolidation path, plus 1–2 alternatives, each with trade-offs. Mark anything uncertain as an open question (do not assert product intent you can't verify).
- **Source the facts from code**, citing file paths and line ranges. Do not invent behavior.
- **Output:** `docs/project/EXAM_LOOPS_AUDIT.md`.
- **Do NOT:** Change any code to "fix" the overlaps. This step is analysis only.

#### 2B. Write `docs/project/SCENARIO_PERSISTENCE_PLAN.md`
- **Do:** Describe the current mock/localStorage reality (cite `lib/scenario-progress.ts`, `lib/battle-session.ts`). Then propose a Supabase persistence design:
  - A **draft schema** for `scenario_progress` and battle session/attempt/report tables, written as a SQL code block **inside the Markdown** (clearly labelled "DRAFT — not applied"). Mirror the conventions in `supabase/migrations/20260529_000002_battle_packs.sql` (RLS enabled, service-role writes, authenticated reads, sensible indexes) and the type shapes in `lib/scenario-types.ts` (`BattleSession`, `BattleAttempt`, `BattleReport`) and `ScenarioProgress`.
  - A **migration & wiring plan**: ordered steps a future session would take (write migration file → human applies it → add API route(s) → swap `scenario-progress.ts` mock for real reads → persist reports server-side), each with the files involved.
  - **Open risks** (e.g. PvP for scenario battles vs AI-only; how this interacts with the rivalry ledger).
- **Output:** `docs/project/SCENARIO_PERSISTENCE_PLAN.md`.
- **Do NOT:** Create a real file under `supabase/migrations/`. Do NOT run SQL. The schema lives only as a fenced block in the Markdown.

**→ PUSH CHECKPOINT 1:** After 2A + 2B exist and read well, commit the two docs and push.
```
git add docs/project/EXAM_LOOPS_AUDIT.md docs/project/SCENARIO_PERSISTENCE_PLAN.md
git commit -m "docs: scenario answer-loop audit + persistence plan"
git push origin main
```

#### 2C. Harden `scripts/seed-battle-packs.ts` (the ONLY code change)
- **Do:** Add two optional CLI flags so a human can later run a cheap partial smoke instead of all 144 combos:
  - `--limit N` — cap the number of jobs to the first N.
  - `--only <slug>` — restrict to a single scenario slug (validate it against `SCENARIOS`; if unknown, print available full slugs and exit non-zero).
  - Both must compose with the existing `--dry-run`. Keep the existing default behavior (no flags = all 144) unchanged. Print the effective plan size in the existing summary line.
- **Constraints:** Minimal, self-contained edit. Match the file's existing style. Do not add dependencies. Do not change the network/POST logic or the request payload.
- **Output:** Modified `scripts/seed-battle-packs.ts`.
- **Do NOT:** Run it without `--dry-run`.

### 3. Validation
- **Commands (all must pass):**
  - `npm run lint`
  - `npm run build`
  - `npm run seed:battle-packs -- --dry-run` (expect 144 combos, no requests sent)
  - `npm run seed:battle-packs -- --dry-run --limit 3` (expect 3 combos)
  - `npm run seed:battle-packs -- --dry-run --only cafe` (expect only `cafe` combos)
  - `npm run seed:battle-packs -- --dry-run --only not-a-real-slug` (expect a clear error + non-zero exit)
- **Output:** Paste the tail of each command's output into the LOG. If `lint` or `build` fails, fix YOUR change until green; if it's failing for an unrelated pre-existing reason, record that as a blocker and do NOT try to fix unrelated code.
- **Do NOT:** Mark validation passed without actually running it. Do not fabricate output.

**→ PUSH CHECKPOINT 2:** After 2C + validation are green, commit the code change and push.
```
git add scripts/seed-battle-packs.ts
git commit -m "harden seed script: add --limit and --only flags for cheap smoke runs"
git push origin main
```

### 4. Logging
- Create `LOG/<run-date>-scenario-audit-and-hardening.md` (use the actual date you run, e.g. `LOG/2026-05-31-scenario-audit-and-hardening.md`). Fill it per §7 as you go, not at the end.

### 5. Handoff
- Append the morning summary (§8) to the bottom of the log AND print it as your final chat message.
- Update `docs/project/SESSION_SUMMARY.md` with a short "What Changed (overnight)" entry and what the human should do next. Update `docs/project/TASK_QUEUE.md` "Recently Completed" with the audit/plan/flags. (These doc updates can go in PUSH CHECKPOINT 2's commit or a final small commit + push.)

---

## 6. Acceptance Criteria

- [ ] `docs/project/EXAM_LOOPS_AUDIT.md` exists, covers all 3 loops, has a comparison table and a single recommendation with trade-offs.
- [ ] `docs/project/SCENARIO_PERSISTENCE_PLAN.md` exists, documents the mock/localStorage reality, and contains a DRAFT (non-applied) SQL schema block + a wiring plan.
- [ ] `scripts/seed-battle-packs.ts` supports `--limit N` and `--only <slug>`, composes with `--dry-run`, and unknown-slug errors clearly.
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.
- [ ] All five `--dry-run` checks in §5/3 behave as described, and **no live (non-dry-run) seed was executed**.
- [ ] `LOG/<date>-scenario-audit-and-hardening.md` exists and follows §7.
- [ ] `docs/project/SESSION_SUMMARY.md` + `TASK_QUEUE.md` updated.
- [ ] No forbidden action was taken (no DB/migration/deploy/secrets/destructive git/credit-spending).
- [ ] Changes pushed to `main` at the two checkpoints; tree clean at the end.
- [ ] The next agent/human can pick up from the log + summary with no extra context.

---

## 7. Log Requirements

Create `LOG/<date>-scenario-audit-and-hardening.md` with this structure, updated live:

```
# Overnight Log — <date> — scenario audit + seed hardening

started_at: <ISO timestamp>
stopped_at: <ISO timestamp>
agent: <model/agent name>
starting_commit: ab861dd
final_commit: <sha>

## Commands run
- <command> -> <result summary / tail of output>

## Code & doc changes
- <file> : <what changed and why>

## Key decisions
- <decision> : <reasoning, alternatives considered>

## Failures / blockers
- <what failed, exact error, what you tried, current status>

## Validation results
- npm run lint -> <pass/fail + tail>
- npm run build -> <pass/fail + tail>
- seed dry-run (all / --limit 3 / --only cafe / bad slug) -> <results>

## Open questions for the human
- <question> (also mirror into OPEN-QUESTIONS.md if it blocks future work)

## What the human should do tomorrow
- <ordered list>
```

Rules: record every command, every decision, every failure verbatim-enough to reproduce. If blocked, do NOT hack around it — write it under "Failures / blockers" and (if it blocks future work) create/append `OPEN-QUESTIONS.md` at repo root. Never fabricate results.

---

## 8. Morning Handoff Format

End with this block (in the log and as the final message):

```
## Morning Summary

DONE:
- <shipped, verified items>

PARTIAL:
- <started but not finished, with where it stands>

BLOCKED:
- <blocked items + why + what's needed to unblock>

RISKS:
- <anything that could bite: assumptions made, areas not tested>

RECOMMENDED NEXT ACTIONS (for the human, ordered):
1. <e.g. apply the draft schema after review>
2. <e.g. run `npm run seed:battle-packs -- --dry-run --limit 3 --only cafe`, eyeball, then a full live seed>
3. ...
```

---

## Dry-run vs Live-run boundary (read again before any seed command)

- **Dry-run (ALLOWED, free):** any `npm run seed:battle-packs -- --dry-run ...`. Sends zero network requests, spends nothing, writes nothing to Supabase. Use freely for validation.
- **Live-run (FORBIDDEN tonight):** `npm run seed:battle-packs` WITHOUT `--dry-run`. This calls Anthropic (real cost) for every cache miss and upserts into the user's Supabase. It also requires the `battle_packs` migration already applied and the dev server running. Only a human runs this, after reviewing the dry-run plan. If you think a live run is needed, STOP and put it under RECOMMENDED NEXT ACTIONS — do not execute it.
