-- Scenario quest persistence for ClashLingo.
--
-- Until now scenario progress was a hardcoded mock and battle reports lived only
-- in the browser's localStorage. This migration makes both durable per user:
--   * scenario_progress       — which stages a user has cleared, scoped by
--                               (scenario, target language, level).
--   * scenario_battle_reports — the scored report for a single battle/exam run.
--
-- Product rule: a stage is "cleared" when the run's accuracy is at least 80%.
-- Scoring and progress advancement happen server-side (service role) so clients
-- cannot forge scores. Authenticated users may only READ their own rows.

create table if not exists public.scenario_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  scenario_slug text not null,
  target_language text not null,
  level text not null,
  completed_stages smallint[] not null default '{}'::smallint[],
  current_stage smallint,
  best_accuracy real not null default 0,
  last_session_id text,
  last_cleared_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint scenario_progress_current_stage_check
    check (current_stage is null or current_stage in (1, 2, 3, 4)),
  constraint scenario_progress_user_scope_key
    unique (user_id, scenario_slug, target_language, level)
);

create table if not exists public.scenario_battle_reports (
  session_id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  scenario_slug text not null,
  stage smallint not null,
  target_language text not null,
  level text not null,
  mode text not null,
  cleared boolean not null default false,
  accuracy_ratio real not null default 0,
  report jsonb not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint scenario_battle_reports_mode_check
    check (mode in ('clash', 'exam')),
  constraint scenario_battle_reports_stage_check
    check (stage in (1, 2, 3, 4))
);

create index if not exists scenario_progress_user_id_idx
  on public.scenario_progress (user_id);

create index if not exists scenario_progress_scope_idx
  on public.scenario_progress (user_id, target_language, level);

create index if not exists scenario_battle_reports_user_id_idx
  on public.scenario_battle_reports (user_id);

create index if not exists scenario_battle_reports_scope_idx
  on public.scenario_battle_reports (user_id, scenario_slug, target_language, level);

alter table public.scenario_progress enable row level security;
alter table public.scenario_battle_reports enable row level security;

-- Read-your-own-rows only. All writes go through the service role in the
-- scenario API routes, so no insert/update/delete policies are granted.
drop policy if exists "scenario_progress_select_self" on public.scenario_progress;
create policy "scenario_progress_select_self"
  on public.scenario_progress
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "scenario_battle_reports_select_self"
  on public.scenario_battle_reports;
create policy "scenario_battle_reports_select_self"
  on public.scenario_battle_reports
  for select
  to authenticated
  using (user_id = auth.uid());
