# ClashLingo Product Decisions

A running log of locked product/technical decisions. Newest first. These are the
source of truth for behavior; if older docs disagree, this file wins.

---

## 2026-05-30 — Scenario persistence decisions (unblocks `SCENARIO_PERSISTENCE_PLAN.md`)

Decided by the product owner to unblock the scenario-loop persistence work. These
answer the four open questions raised in `docs/project/EXAM_LOOPS_AUDIT.md`.

### D1 — Progress granularity: **per language + per scenario**
- Scenario progress is tracked per `(scenario_slug, target_language)` pair.
- Example: café in French and café in Spanish are independent progress tracks.
- Level is treated as question difficulty only — it does NOT create a separate
  progress track.
- **Schema impact:** `scenario_progress` keys on `(user_id, scenario_slug, target_language)`. No `level` column in the progress key.

### D2 — Stage completion / unlock: **pass either mode at a threshold**
- A stage is cleared when the user completes EITHER the clash OR the exam at or
  above an accuracy threshold (starting value: **80% accuracy** — tunable later).
- Rewards mastery, not raw attempts. Both clash and exam count.
- **Schema impact:** stage completion is derived from a session/report meeting the
  threshold; store the pass on `scenario_progress.completed_stages` and keep the
  qualifying report linked.

### D3 — Relationship to old rivalry exam: **coexist for now (rivalry = legacy adapter)**
- The mature, DB-backed rivalry exam loop stays unchanged.
- Scenario battles are the new main line, running beside rivalry — not replacing it.
- Matches the "shared answer-run layer + legacy adapter" recommendation in the audit.
- **Build impact:** do NOT touch the rivalry exam / ledger / results flow while
  building scenario persistence. No forced unification yet.

### D4 — Scoring model: **new = speed/accuracy/quality 3-axis; rivalry keeps its rubric via an adapter**
- All new scenario reporting uses the 3-axis model already in `lib/battle-scoring.ts`.
- The old 100-point rivalry rubric survives for now behind an adapter boundary;
  it is not rewritten.
- **Build impact:** scenario session/report tables store 3-axis scores. Any future
  cross-mode comparison goes through an adapter, not a shared score column.

### Still open (deferred, not blocking the first persistence slice)
- Exact accuracy threshold value for D2 (start at 80%, tune after real data).
- Whether scenario friend-vs-friend battles are real PvP or stay AI-simulated
  (current code simulates the opponent client-side). Persist single-player first.
- Long-term: whether rivalry eventually folds onto the answer-run layer (D3/D4 keep
  the seam open but defer the call).

### What these unlock
With D1–D4 locked, the DRAFT schema in `docs/project/SCENARIO_PERSISTENCE_PLAN.md`
can be turned into a real migration (scoped to single-player scenario progress +
sessions + reports), applied manually in Supabase, then wired in by replacing the
`MOCK_SCENARIO_PROGRESS` in `lib/scenario-progress.ts` and the localStorage report
store in `lib/battle-session.ts` with DB-backed reads/writes.
