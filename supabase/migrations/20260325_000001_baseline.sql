create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Language Warrior',
  avatar_url text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.rivalries (
  id uuid primary key default gen_random_uuid(),
  player_a_id uuid not null references auth.users (id) on delete cascade,
  player_b_id uuid references auth.users (id) on delete cascade,
  invite_code text not null unique,
  player_a_lang text not null,
  player_b_lang text,
  player_a_difficulty text,
  player_b_difficulty text,
  current_round_num integer not null default 0,
  difficulty_adjustment integer,
  cumulative_ledger jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.rounds (
  id uuid primary key default gen_random_uuid(),
  rivalry_id uuid not null references public.rivalries (id) on delete cascade,
  round_number integer not null,
  target_lang text,
  topic text,
  study_days integer,
  hours_per_day integer,
  prize_text text,
  syllabus jsonb,
  status text not null default 'topic_selection',
  countdown_start timestamptz,
  exam_at timestamptz,
  exam_started_at timestamptz,
  player_a_confirmed boolean not null default false,
  player_b_confirmed boolean not null default false,
  player_a_exam_ready boolean not null default false,
  player_b_exam_ready boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint rounds_status_check
    check (
      status in (
        'topic_selection',
        'confirming',
        'countdown',
        'exam_ready',
        'exam_live',
        'completed'
      )
    ),
  constraint rounds_rivalry_round_number_key unique (rivalry_id, round_number)
);

create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null unique references public.rounds (id) on delete cascade,
  questions jsonb not null default '[]'::jsonb,
  rubric jsonb not null default '[]'::jsonb,
  total_points integer not null default 0,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  scores jsonb not null default '{}'::jsonb,
  total_score integer not null default 0,
  started_at timestamptz,
  submitted_at timestamptz,
  feedback_difficulty text,
  feedback_tags jsonb,
  constraint submissions_exam_user_key unique (exam_id, user_id)
);

create index if not exists rivalries_player_a_id_idx
  on public.rivalries (player_a_id);

create index if not exists rivalries_player_b_id_idx
  on public.rivalries (player_b_id);

create index if not exists rounds_rivalry_id_idx
  on public.rounds (rivalry_id);

create index if not exists rounds_status_idx
  on public.rounds (status);

create index if not exists exams_round_id_idx
  on public.exams (round_id);

create index if not exists submissions_exam_id_idx
  on public.submissions (exam_id);

create index if not exists submissions_user_id_idx
  on public.submissions (user_id);

create or replace function public.is_rivalry_participant(target_rivalry_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.rivalries rivalry
    where rivalry.id = target_rivalry_id
      and auth.uid() is not null
      and (rivalry.player_a_id = auth.uid() or rivalry.player_b_id = auth.uid())
  );
$$;

create or replace function public.is_round_participant(target_round_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.rounds round
    join public.rivalries rivalry on rivalry.id = round.rivalry_id
    where round.id = target_round_id
      and auth.uid() is not null
      and (rivalry.player_a_id = auth.uid() or rivalry.player_b_id = auth.uid())
  );
$$;

create or replace function public.is_exam_participant(target_exam_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.exams exam
    join public.rounds round on round.id = exam.round_id
    join public.rivalries rivalry on rivalry.id = round.rivalry_id
    where exam.id = target_exam_id
      and auth.uid() is not null
      and (rivalry.player_a_id = auth.uid() or rivalry.player_b_id = auth.uid())
  );
$$;

grant execute on function public.is_rivalry_participant(uuid) to authenticated;
grant execute on function public.is_round_participant(uuid) to authenticated;
grant execute on function public.is_exam_participant(uuid) to authenticated;

alter table public.users enable row level security;
alter table public.rivalries enable row level security;
alter table public.rounds enable row level security;
alter table public.exams enable row level security;
alter table public.submissions enable row level security;

drop policy if exists "users_select_authenticated" on public.users;
create policy "users_select_authenticated"
  on public.users
  for select
  to authenticated
  using (true);

drop policy if exists "rivalries_select_participants" on public.rivalries;
create policy "rivalries_select_participants"
  on public.rivalries
  for select
  to authenticated
  using (public.is_rivalry_participant(id));

drop policy if exists "rivalries_insert_creator" on public.rivalries;
create policy "rivalries_insert_creator"
  on public.rivalries
  for insert
  to authenticated
  with check (
    player_a_id = auth.uid()
    and player_b_id is null
  );

drop policy if exists "rivalries_update_participants" on public.rivalries;
create policy "rivalries_update_participants"
  on public.rivalries
  for update
  to authenticated
  using (public.is_rivalry_participant(id))
  with check (
    player_a_id = auth.uid() or player_b_id = auth.uid()
  );

drop policy if exists "rivalries_join_open_invite" on public.rivalries;
create policy "rivalries_join_open_invite"
  on public.rivalries
  for update
  to authenticated
  using (
    player_b_id is null
    and player_a_id <> auth.uid()
  )
  with check (
    player_a_id <> auth.uid()
    and player_b_id = auth.uid()
  );

drop policy if exists "rounds_select_participants" on public.rounds;
create policy "rounds_select_participants"
  on public.rounds
  for select
  to authenticated
  using (public.is_rivalry_participant(rivalry_id));

drop policy if exists "rounds_update_participants" on public.rounds;
create policy "rounds_update_participants"
  on public.rounds
  for update
  to authenticated
  using (public.is_rivalry_participant(rivalry_id))
  with check (public.is_rivalry_participant(rivalry_id));

drop policy if exists "exams_select_participants" on public.exams;
create policy "exams_select_participants"
  on public.exams
  for select
  to authenticated
  using (public.is_exam_participant(id));

drop policy if exists "exams_insert_participants" on public.exams;
create policy "exams_insert_participants"
  on public.exams
  for insert
  to authenticated
  with check (public.is_round_participant(round_id));

drop policy if exists "submissions_select_participants" on public.submissions;
create policy "submissions_select_participants"
  on public.submissions
  for select
  to authenticated
  using (public.is_exam_participant(exam_id));

drop policy if exists "submissions_insert_self" on public.submissions;
create policy "submissions_insert_self"
  on public.submissions
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and public.is_exam_participant(exam_id)
  );

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'rounds'
  ) then
    alter publication supabase_realtime add table public.rounds;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'submissions'
  ) then
    alter publication supabase_realtime add table public.submissions;
  end if;
end
$$;
