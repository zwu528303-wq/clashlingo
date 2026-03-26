# Supabase Workspace

This directory is now the checked-in source of truth for ClashLingo's database shape.

## What lives here

- `migrations/`: executable SQL migrations

## Current baseline

- `migrations/20260325_000001_baseline.sql` captures the current MVP schema
- It includes:
  - public tables
  - key indexes / uniqueness constraints
  - the minimum RLS policies required by the current browser-side data access
  - Realtime publication setup for `rounds` and `submissions`

## Update workflow

When the live schema changes:

1. add a new migration file under `supabase/migrations/`
2. update [SUPABASE_SCHEMA.md](../docs/database/SUPABASE_SCHEMA.md)
3. update [README.md](../README.md) if setup steps changed
4. mention the schema change in [PROJECT_STATUS.md](../docs/project/PROJECT_STATUS.md)

## Important note

Do not rewrite the baseline migration after it has been applied to a real environment.
Add a new migration for follow-up changes instead.
