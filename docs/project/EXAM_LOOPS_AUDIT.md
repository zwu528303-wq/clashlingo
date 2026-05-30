# Exam Loops Audit

Date: 2026-05-30
Status: decision-ready audit, no code changes

## Purpose

ClashLingo now has three answer-question loops:

1. the original rivalry exam loop
2. the scenario clash loop
3. the scenario exam loop

This audit maps how each loop sources questions, scores answers, stores results,
handles timing, and presents reports. Facts are sourced from current code. Where
product intent is not explicit, it is marked as an open question.

## Executive Summary

- The rivalry exam loop is the only fully DB-backed answer loop today. It stores
  exams and submissions in Supabase, updates the round/rivalry ledger, and has a
  realtime results screen.
- Both scenario loops use the new AI battle-pack cache for content, but battle
  sessions and reports are client-only. Reports are written to `localStorage`;
  scenario progress is hardcoded mock data.
- Scenario clash and scenario exam share almost all runner code in
  `components/BattlePage.tsx`; `mode=exam` mostly changes labels, report shape,
  and whether AI opponent totals are displayed.
- Scoring is split across two incompatible models: rivalry exams use a 100-point
  rubric from `exams.rubric`; scenario battles use speed/accuracy/quality points
  from `lib/battle-scoring.ts`.

## Loop 1: Rivalry Exam

### Entry And Components

- Exam route: `/round/[id]/exam`, rendered by
  `app/round/[id]/exam/page.tsx` -> `components/ExamPage.tsx`
  (`app/round/[id]/exam/page.tsx:1-5`).
- Results route: `/round/[id]/results`, rendered by
  `app/round/[id]/results/page.tsx` -> `components/ResultsPage.tsx`
  (`app/round/[id]/results/page.tsx:1-5`).

### Question Source

- The intended path is `/api/generate-exam`, which reads a round, requires
  `round.syllabus`, resolves the round level from rivalry data, asks Anthropic
  for a 24-question exam, and writes `questions`, `rubric`, and `total_points`
  into `exams` (`app/api/generate-exam/route.ts:27-86`,
  `app/api/generate-exam/route.ts:87-194`,
  `app/api/generate-exam/route.ts:229-260`).
- The generation endpoint is idempotent when an exam already exists; it skips
  Claude and sets the round to `exam_ready`
  (`app/api/generate-exam/route.ts:66-79`).
- `ExamPage` still has a client-side mock exam fallback if no exam record exists;
  it inserts generated mock questions/rubric into `exams`
  (`components/ExamPage.tsx:100-127`,
  `components/ExamPage.tsx:518-809`).

### Format And Timing

- Generated rivalry exams are fixed at 24 questions: 10 MCQ, 10 fill-in-the-blank,
  and 4 translation questions for 100 total points
  (`app/api/generate-exam/route.ts:87-101`).
- The client timer starts at 2400 seconds, i.e. 40 minutes
  (`components/ExamPage.tsx:49-54`,
  `components/ExamPage.tsx:143-156`).

### Scoring

- Scoring happens in `ExamPage` before insert into `submissions`.
- MCQ and FITB are exact-match checks worth 3 points. Translation gets keyword
  partial credit based on the rubric keywords and max points
  (`components/ExamPage.tsx:168-215`).

### Persistence And Multiplayer

- Submitted answers, per-question scores, total score, start time, and submit time
  are inserted into `submissions`
  (`components/ExamPage.tsx:217-226`).
- When at least two submissions exist for an exam, the round status becomes
  `completed` and the rivalry `cumulative_ledger` is updated with wins and round
  scores (`components/ExamPage.tsx:236-287`).
- Results load `rounds`, `exams`, and `submissions` from Supabase, subscribe to
  submission inserts, and refresh when the rival submits
  (`components/ResultsPage.tsx:171-249`,
  `components/ResultsPage.tsx:285-307`).

### Bilingual Handling

- The exam prompt requires bilingual English and Simplified Chinese question
  prompts/options, while answer/rubric content may be target-language or
  bilingual depending on question type
  (`app/api/generate-exam/route.ts:119-194`).
- The exam UI resolves website and instruction language from profile metadata
  (`components/ExamPage.tsx:60-68`).

## Loop 2: Scenario Clash

### Entry And Components

- Stage briefing creates a mock client-side session id and links to
  `/battle/[sessionId]?scenario=<slug>&stage=<stage>&opponent=ai&mode=clash`
  (`components/StageBriefingPage.tsx:63-70`,
  `components/StageBriefingPage.tsx:205-206`,
  `components/StageBriefingPage.tsx:449-459`).
- The route wrapper renders `components/BattlePage.tsx`
  (`app/battle/[sessionId]/page.tsx:1-20`).
- The report route renders `components/BattleReportPage.tsx`
  (`app/battle/[sessionId]/report/page.tsx:1-19`).

### Question Source

- `BattlePage` loads a `BattlePack` through `useBattlePack`, keyed by scenario,
  stage, profile preferred language, and profile default level
  (`components/BattlePage.tsx:69-75`,
  `components/BattlePage.tsx:121-130`,
  `lib/use-battle-pack.ts:21-59`).
- `fetchBattlePack` posts to `/api/generate-battle-pack`
  (`lib/battle-pack.ts:274-292`).
- `/api/generate-battle-pack` first checks `battle_packs` by cache key. On a miss
  it asks Anthropic for strict bilingual content, validates it, assembles a pack,
  and upserts it into `battle_packs`
  (`app/api/generate-battle-pack/route.ts:40-90`,
  `app/api/generate-battle-pack/route.ts:105-188`,
  `app/api/generate-battle-pack/route.ts:216-248`).

### Format And Timing

- Stage rules are deterministic server/client product rules:
  - Stage 1: 8 questions, timers 6/8/15 seconds.
  - Stage 2: 10 questions, timers 5/7/14 seconds.
  - Stage 3: 11 questions, timers 5/6/13 seconds.
  - Stage 4: 12 questions, timers 4/6/12 seconds.
  (`lib/battle-pack.ts:20-47`).
- The battle runner primes one question at a time and decrements `timeLeft` once
  per second; timeout auto-submits the current question
  (`components/BattlePage.tsx:143-157`,
  `components/BattlePage.tsx:229-248`).

### Scoring

- Scenario scoring is speed/accuracy/quality, not a 100-point rubric
  (`lib/battle-scoring.ts:10-38`).
- User accuracy is exact option id for multiple choice and keyword-hit based for
  fill/free response (`lib/battle-scoring.ts:101-124`).
- User quality checks exact model-answer matches or keyword/word-count heuristics
  (`lib/battle-scoring.ts:126-153`).
- The AI opponent is simulated client-side with deterministic seeded rolls, not a
  persisted opponent attempt (`lib/battle-scoring.ts:155-189`,
  `lib/battle-scoring.ts:220-282`).

### Persistence And Multiplayer

- On completion, `BattlePage` builds a report and calls `saveBattleReport`
  (`components/BattlePage.tsx:191-204`).
- Reports are stored under `clashlingo:battle-report:<sessionId>` in
  `localStorage`; there are no DB writes here
  (`lib/battle-session.ts:14-35`,
  `lib/battle-session.ts:127-161`).
- `BattleReportPage` reads the report back from `localStorage`
  (`components/BattleReportPage.tsx:71-100`,
  `components/BattleReportPage.tsx:120-162`).
- The `opponent=friend` query branch currently only affects display labels in
  `BattlePage`; the implemented entry from briefing uses `opponent=ai`
  (`components/StageBriefingPage.tsx:205-206`,
  `components/BattlePage.tsx:284-292`).

### Bilingual Handling

- Battle-pack type definitions require localized interface text and target-language
  learner content (`lib/scenario-types.ts:14-17`,
  `lib/scenario-types.ts:42-127`).
- The generation prompt requires bilingual prompt/option/scope UI text and
  target-language answers/content (`app/api/generate-battle-pack/route.ts:133-182`).

## Loop 3: Scenario Exam

### Entry And Components

- Stage briefing links to `/scenario/[slug]/stage/[stage]/exam`
  (`components/StageBriefingPage.tsx:205-206`,
  `components/StageBriefingPage.tsx:461-470`).
- The route wrapper renders `ScenarioExamLandingPage`
  (`app/scenario/[slug]/stage/[stage]/exam/page.tsx:1-23`).
- The landing page creates a mock exam session id and links into the same battle
  runner as scenario clash, with `mode=exam&opponent=solo`
  (`components/ScenarioExamLandingPage.tsx:29-36`,
  `components/ScenarioExamLandingPage.tsx:115-117`,
  `components/ScenarioExamLandingPage.tsx:191-197`).

### Question Source

- Scenario exam uses the same `useBattlePack` and `/api/generate-battle-pack`
  path as scenario clash (`components/ScenarioExamLandingPage.tsx:75-79`,
  `lib/battle-pack.ts:274-292`).

### Format And Timing

- Question counts and per-question timers come from `BattlePack.rules`, identical
  to scenario clash (`lib/battle-pack.ts:20-47`,
  `components/ScenarioExamLandingPage.tsx:152-183`).
- The actual answering UI is `BattlePage` with `mode=exam`; it still runs one
  timed question at a time (`components/BattlePage.tsx:72-75`,
  `components/BattlePage.tsx:474-489`).

### Scoring

- Scenario exam reuses `evaluateBattleQuestion` for each answer, so it still
  computes user speed/accuracy/quality and simulated AI scores internally
  (`components/BattlePage.tsx:179-185`,
  `lib/battle-scoring.ts:220-282`).
- Report assembly suppresses opponent totals and winner when `mode === "exam"`
  (`lib/battle-session.ts:41-55`,
  `lib/battle-session.ts:105-124`).

### Persistence And Multiplayer

- Scenario exam reports are also saved only in `localStorage`; the report page
  is shared with scenario clash (`components/BattlePage.tsx:191-204`,
  `lib/battle-session.ts:127-161`,
  `components/BattleReportPage.tsx:164-257`).
- There is no Supabase-backed solo exam attempt, no progress update, and no
  durable certificate/checkpoint.

### Bilingual Handling

- Same as scenario clash: generated battle-pack UI text is bilingual, learner
  answer content is target-language (`app/api/generate-battle-pack/route.ts:133-182`).

## Comparison Table

| Loop | Source of questions | Scoring | Persistence | Multiplayer | Bilingual handling | Known gaps |
| --- | --- | --- | --- | --- | --- | --- |
| Rivalry exam | `/api/generate-exam` from `rounds.syllabus`; fallback mock insert if missing exam | 100-point rubric: exact MCQ/FITB, keyword translation partial credit | `exams`, `submissions`, `rounds.status`, `rivalries.cumulative_ledger` | Real async two-player comparison through Supabase submissions and results realtime | Prompts/options bilingual; target-language/bilingual rubric rules | Client mock fallback can hide generation failures; scoring duplicated from scenario engine |
| Scenario clash | `BattlePack` from `/api/generate-battle-pack`, cached in `battle_packs` | Speed/accuracy/quality plus simulated AI score | `battle_packs` only; sessions/reports in `localStorage` | AI-only in implemented path; `friend` is display-only today | Battle-pack prompt/options/scope bilingual; answer content target-language | No DB sessions/attempts/reports, no real PvP, no persisted progress |
| Scenario exam | Same `BattlePack` as scenario clash, reached through scenario exam landing | Same speed/accuracy/quality evaluator, but opponent/winner hidden in report | `battle_packs` only; sessions/reports in `localStorage` | Solo only today | Same as scenario clash | Functionally a label/report variant of clash, no durable completion/progress |

## Overlaps And Conflicts

- **Two scoring systems.** Rivalry exams score against an exam rubric inside
  `ExamPage`; scenario loops score with `lib/battle-scoring.ts`. The concepts do
  not share a result shape or point model.
- **Two report shapes.** Rivalry results use `Submission` rows plus a page-local
  share card; scenario reports use `StoredBattleReport` in `localStorage`
  (`components/ResultsPage.tsx:141-169`,
  `lib/battle-session.ts:16-35`).
- **Three entry labels, two engines.** Scenario clash and scenario exam share the
  same battle runner and content pack, while rivalry exam is a separate engine.
- **Persistence mismatch.** Rivalry exams are durable and replayable from DB data;
  scenario reports disappear if localStorage is cleared or the user changes
  devices.
- **Progress is disconnected from completion.** Scenario map progress is hardcoded
  in `MOCK_SCENARIO_PROGRESS`, not derived from scenario exam/clash completion
  (`lib/scenario-progress.ts:13-59`).
- **Friend scenario battle is not implemented.** `OpponentType` includes `friend`
  and status types include friend-oriented states, but the current route from
  briefing is AI-only and no battle session tables exist
  (`lib/scenario-types.ts:11-12`,
  `lib/scenario-types.ts:129-189`,
  `components/StageBriefingPage.tsx:205-206`).

## Recommendation

### Recommended Path: Introduce A Shared Answer-Run Layer, With Scenario BattlePack As The Canonical New Content Shape

Build a small shared persistence and evaluation boundary before adding more
features:

1. Persist scenario sessions, attempts, reports, and scenario progress in
   Supabase using the current `BattleSession`, `BattleAttempt`, and `BattleReport`
   concepts as the starting point.
2. Keep scenario clash and scenario exam on the same battle-pack runner, but make
   the mode difference explicit in persisted `mode`, report rendering, and progress
   rules.
3. Extract reusable answer-run primitives from the scenario runner first:
   question order, timers, answer capture, submit finalization, report generation.
4. Leave the rivalry exam loop DB-backed and stable for now, but treat it as a
   legacy adapter. If the product later wants one engine, adapt rivalry exams to
   emit/read an answer-run-compatible result shape rather than rewriting the old
   flow tonight.

Trade-offs:

- Pros: preserves the mature rivalry flow, makes the new main scenario loop
  durable, and avoids a risky one-shot rewrite of the oldest exam path.
- Cons: keeps two scoring models in the short term and requires explicit adapter
  code when comparing scenario and rivalry reports.
- Why this path: it targets the biggest current blocker, persistence, while
  creating a consolidation seam that can later absorb rivalry exam behavior.

### Alternative 1: Keep All Three Loops Separate

- Pros: lowest immediate engineering risk.
- Cons: locks in duplicated scoring, duplicated reports, and inconsistent data
  durability. It will make scenario PvP and cross-mode history harder.

### Alternative 2: Replace Rivalry Exam With BattlePack Immediately

- Pros: fastest route to one content/scoring engine on paper.
- Cons: high regression risk for the mature rivalry loop, ledger, results realtime,
  and 24-question product contract. It also changes product behavior before the
  team has approved how rivalry exams should map to short scenario battles.

## Open Questions

- Should scenario progress be per target language, per level, or only per scenario
  slug?
- Should scenario exam completion count as stage completion, or should only clash
  wins/thresholds unlock progress?
- Is friend-vs-friend scenario battle meant to replace the old rivalry exam, or
  become a separate mode beside it?
- Should the old 100-point rivalry rubric survive long term, or should all future
  reporting move to speed/accuracy/quality?
