-- Cache for AI-generated scenario battle packs. One row per unique
-- (scenario, stage, target language, level, template version) combination so
-- generation cost and latency are paid once and reused across players.

create table if not exists public.battle_packs (
  id uuid primary key default gen_random_uuid(),
  cache_key text not null unique,
  scenario_slug text not null,
  stage smallint not null,
  target_language text not null,
  level text not null,
  template_version text not null,
  pack jsonb not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists battle_packs_scenario_stage_idx
  on public.battle_packs (scenario_slug, stage);

alter table public.battle_packs enable row level security;

-- Battle packs are shared, non-sensitive content. Authenticated users may read
-- them; writes happen only through the service role in /api/generate-battle-pack,
-- so no insert/update policy is granted.
drop policy if exists "battle_packs_select_authenticated" on public.battle_packs;
create policy "battle_packs_select_authenticated"
  on public.battle_packs
  for select
  to authenticated
  using (true);
