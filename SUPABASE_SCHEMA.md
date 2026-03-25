# Supabase Schema And Data Model

Last updated: 2026-03-24

This document reflects the live table shape and current code usage in ClashLingo.
It is not a migration file. There are still no checked-in SQL migrations in this repo.

## Overview

ClashLingo uses two identity layers:

- Supabase Auth stores the real signed-in user.
- The public `users` table stores shared display identity used across lounge, rivalry, and scopes.

Gameplay data lives in four main public tables:

- `rivalries`
- `rounds`
- `exams`
- `submissions`

## Relationship Model

- One auth user can appear in many `rivalries` through `player_a_id` or `player_b_id`.
- One `rivalry` has many `rounds`.
- One `round` has zero or one `exam`.
- One `exam` has many `submissions`.
- One submission belongs to one user and one exam.

## Auth Metadata

The app currently stores these profile preferences in Supabase Auth `user_metadata`:

- `display_name`
- `avatar_letter`
- `avatar_color`
- `preferred_language`
- `weekly_match_time`

Important note:

- Shared/public views should not read these values directly unless the current signed-in user is the viewer.
- Public identity for other users should come from the `users` table.

## Public Tables

### `users`

Observed live columns:

- `id`
- `display_name`
- `avatar_url`
- `created_at`

Current app usage:

- Stores shared display identity for lounge, rivalry, and scopes.
- `display_name` is synced server-side by [app/api/profile/route.ts](./app/api/profile/route.ts).
- `avatar_url` exists in the table but is not actively used in the current MVP UI.

Important constraint:

- The `users` table does not have an `email` column.

### `rivalries`

Observed live columns:

- `id`
- `player_a_id`
- `player_b_id`
- `invite_code`
- `player_a_lang`
- `player_b_lang`
- `player_a_difficulty`
- `player_b_difficulty`
- `current_round_num`
- `difficulty_adjustment`
- `cumulative_ledger`
- `created_at`

Current app usage:

- Tracks who is matched with whom.
- Stores invite-code join flow.
- Stores per-player learning language.
- Stores the latest round number.
- Stores long-term outcome history in `cumulative_ledger`.

Notes:

- `player_b_id` and `player_b_lang` are nullable until the rivalry is paired.
- `difficulty_adjustment` exists in the table but is not a major current UX surface.

### `rounds`

Observed live columns:

- `id`
- `rivalry_id`
- `round_number`
- `target_lang`
- `topic`
- `study_days`
- `hours_per_day`
- `prize_text`
- `syllabus`
- `status`
- `countdown_start`
- `exam_at`
- `exam_started_at`
- `player_a_confirmed`
- `player_b_confirmed`
- `player_a_exam_ready`
- `player_b_exam_ready`
- `created_at`

Current app usage:

- Drives the full round lifecycle.
- Holds the generated syllabus JSON in `syllabus`.
- Holds the topic, target language, and default study window.
- Tracks both-player confirmations and early-start readiness.
- Tracks countdown and exam timing fields.

Observed status values in code:

- `topic_selection`
- `confirming`
- `countdown`
- `exam_ready`
- `exam_live`
- `completed`

Notes:

- `/scopes` reads from `rounds.syllabus`, so scope visibility does not depend on exam creation.
- `prize_text` is optional.

### `exams`

Observed live columns:

- `id`
- `round_id`
- `questions`
- `rubric`
- `total_points`
- `created_at`

Current app usage:

- Stores the AI-generated exam payload.
- `questions` and `rubric` are JSON.
- `/api/generate-exam` treats exam creation as idempotent by checking whether a row already exists for the round.

### `submissions`

Observed live columns:

- `id`
- `exam_id`
- `user_id`
- `answers`
- `scores`
- `total_score`
- `started_at`
- `submitted_at`
- `feedback_difficulty`
- `feedback_tags`

Current app usage:

- Stores one player's completed exam answers and scoring output.
- `answers` and `scores` are JSON.
- Results compare two submissions from the same exam.
- Feedback fields exist for post-exam reactions and tuning.

## Server Routes That Mutate Data

### [app/api/profile/route.ts](./app/api/profile/route.ts)

- Validates the current user from a bearer token.
- Upserts `users.id` and `users.display_name`.
- Uses the service role key so client-side settings save does not depend on public-table write permissions.

### [app/api/generate-syllabus/route.ts](./app/api/generate-syllabus/route.ts)

- Calls Anthropic to generate syllabus JSON.
- Writes the syllabus into `rounds.syllabus`.
- Moves the round to `confirming`.

### [app/api/generate-exam/route.ts](./app/api/generate-exam/route.ts)

- Reads the round and syllabus.
- Calls Anthropic to generate exam JSON.
- Inserts or updates the `exams` row for that round.
- Moves the round to `exam_ready`.

## Practical Modeling Notes

- A user can be in at most 2 rivalries according to current product rules, but this is enforced in the app UI rather than documented here as a database constraint.
- The app currently relies on live schema state rather than checked-in migrations.
- If the schema changes, update this file, `PROJECT_STATUS.md`, and `.env.example` in the same batch.
