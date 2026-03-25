# Project Status

Last updated: 2026-03-25
Stage: clickable prototype / early MVP

## Product Summary

ClashLingo is a 1v1 language-learning app where two players create a rivalry, pick a topic, get an AI-generated syllabus, follow a default study window, optionally start early together, take an exam, and compare results.

## Stack

- Next.js 16.2.1 App Router
- React 19.2.4
- TypeScript
- Tailwind CSS 4 with custom theme tokens in `app/globals.css`
- Supabase Auth + Postgres + Realtime
- Anthropic API for syllabus and exam generation

## Visual Direction

- Playful minimalism
- Rounded shapes and oversized cards
- Primary color: `#953f4d`
- Secondary color: `#0c693d`
- Font: Plus Jakarta Sans, currently loaded via `next/font/google` in `app/layout.tsx`

## Main Routes

- `/` - checks Supabase auth, redirects to `/login` or `/lounge`
- `/login` - auth UI plus first-time onboarding guidance and a website-language toggle for first-time visitors (`components/Login.tsx`)
- `/reset-password` - recovery screen for choosing a new password from an email link (`components/ResetPasswordPage.tsx`)
- `/how-it-works` - full product guide with the rivalry loop, page map, rhythm rules, level rules, and FAQs (`components/HowItWorksPage.tsx`)
- `/lounge` - countdown-first control surface for active rivalries, create rivalry, and join by invite code (`components/Lounge.tsx`)
- `/rivalries` - rivalry hub with rivalry selection, W/L, streak, and match history (`components/RivalryDashboard.tsx`)
- `/settings` - user profile, website language, default language level, and weekly preference settings (`components/SettingsPage.tsx`)
- `/rivalry/[id]` - deep link into the same rivalry hub component used by `/rivalries`
- `/rivalry/[id]/new-round` - create a new round
- `/round/[id]` - round lifecycle page (`components/RoundPage.tsx`)
- `/round/[id]/exam` - exam experience (`components/ExamPage.tsx`)
- `/round/[id]/results` - results review (`components/ResultsPage.tsx`)

## Server Endpoints

- `/api/create-round`
  - validates the signed-in user on the server
  - blocks new round creation if the rivalry is inactive
  - blocks new round creation if any active round still exists
  - blocks new round creation if the rivalry already started a round in the last 24 hours
  - inserts the round and updates `rivalries.current_round_num`
- `/api/generate-syllabus`
  - uses Anthropic to generate a syllabus from topic + target language
  - writes syllabus into `rounds.syllabus`
  - moves round status to `confirming`
- `/api/generate-exam`
  - uses Anthropic to generate a 24-question exam + rubric from the saved syllabus
  - upserts into `exams`
  - moves round status to `exam_ready`
- `/api/profile`
  - validates the signed-in user on the server
  - syncs `users.display_name` plus public avatar identity for shared surfaces such as lounge and rivalry
- `/api/leave-rivalry`
  - validates the signed-in user on the server
  - blocks leave if the rivalry still has any non-completed round
  - marks the rivalry inactive in `rivalries.cumulative_ledger` without deleting history

## Expected Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ANTHROPIC_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Checked-in setup docs now exist in:
- [README.md](./README.md)
- [.env.example](./.env.example)
- [SUPABASE_SCHEMA.md](./SUPABASE_SCHEMA.md)

## Expected Supabase Tables

Observed from the app code:
- `users`
- `rivalries`
- `rounds`
- `exams`
- `submissions`

Observed `users` columns from direct DB check:
- `id`
- `display_name`
- `avatar_url`
- `created_at`

Important note:
- The `users` table does not currently have an `email` column.
- Shared identity sync should only rely on real columns in this table.

## Round Lifecycle

Observed status values:
- `topic_selection`
- `confirming`
- `countdown`
- `exam_ready`
- `exam_live`
- `completed`

## What Works Today

- Email/password sign-up and sign-in through Supabase
- Sign-up now asks for `Display Nickname` up front and writes it into auth metadata during account creation
- Login now supports resend-confirmation and forgot-password entry points
- The app now ships a `/reset-password` recovery page for setting a new password from the email link
- Website UI now supports `English` and `简体中文`
- Login now includes a first-visit website-language toggle before sign-in
- Settings now persists `Website Language` through auth metadata
- The first translated UI batch is now live across:
  - Login
  - Reset Password
  - Lounge
  - Rivalries
  - Scopes
  - Settings
  - How It Works
  - AppSidebar
- Lounge UI for creating a rivalry and joining by invite code
- Login and empty-lounge states now use a loop-based onboarding guide with the same wording as the full manual
- The app now ships a `/how-it-works` guide page, and the sidebar links to it directly
- Settings page now supports a four-tier default language level: `Beginner`, `Elementary`, `Intermediate`, `Advanced`
- Create/join rivalry now writes each player's default level into `player_a_difficulty` / `player_b_difficulty`
- Lounge now presents rivalries as status cards with countdown / action panels
- Lounge now keeps a weekly rhythm countdown visible on paired rivalry cards, even before a round reaches the actual study-countdown state
- Lounge, rivalries, scopes, and settings now share a sidebar navigation shell
- The product now separates `Lounge` from `Rivalries` more clearly.
  - Lounge is the operational page for countdowns and entering matches.
  - Rivalries is the history/stats hub for a selected rivalry.
- Lounge and Rivalries now have a first-pass fused visual language inspired by the approved AI Studio reference.
  - Lounge uses a more featured duel-card layout and stronger countdown/action panels.
  - Rivalries uses a more explicit VS hero, rivalry selector cards, richer history rows, and a clearer action/stats column.
- Settings page for nickname, letter avatar, avatar color, default language, default language level, and weekly match time
- Settings page now also stores `Default Language Level` in auth metadata
- Settings save now syncs public nickname + letter avatar + avatar color server-side through `/api/profile`
- Public/shared identity no longer falls back to email-style display names
- Lounge and rivalry surfaces now read shared avatar letter/color from the public identity layer instead of inventing rival avatars locally
- Weekly time in settings now acts as the default for new rivalries, while each rivalry keeps its own shared weekly countdown pulse
- Lounge countdown cards now use rivalry-shared weekly rhythm data instead of per-viewer-only timing
- Each rivalry can now start at most one new round per rolling 24 hours
- New round creation is now enforced server-side through `/api/create-round`
- Rivalry Hub and the new-round page now show when the next round becomes available if the 24-hour limit is active
- Users can now leave a rivalry from the rivalry hub when no active round exists
- Leaving a rivalry now preserves history, hides that rivalry from lounge, and blocks future rounds
- Rivalry dashboard and round list
- New round flow with topic, default study window, and optional prize/stake
- AI syllabus generation and confirmation flow
- AI syllabus and exam generation now resolve the effective level server-side from the rivalry plus the round target language
- If both players study the same language at different levels, AI generation now uses the lower of the two saved levels
- Round countdown UI now supports mutual early start, and exam-ready still supports synchronized launch
- Exam generation endpoint
- Exam route now points to `components/ExamPage.tsx`
- Results UI now includes a stronger battle-report layout in `components/ResultsPage.tsx`
- Results now includes a richer share card preview, a copy-caption action, and SVG card download
- Results is now part of the translated website-language batch
- Scopes now group current and past scope cards by target language
- `npm run lint` currently passes
- Production build currently passes
- The repo now includes a real README, an `.env.example`, and Supabase schema notes
- Shared domain types now live in `lib/domain-types.ts` and are reused across the main pages and AI routes
- `app/rivalry/[id]/new-round/page.tsx` now uses inline error feedback instead of `alert()`

## Current Health Check

Ran on 2026-03-25:
- `npm run build` - passes
- `npm run lint` - passes

## Known Issues And Risks

- Live opponent exam-progress UI is intentionally out of scope for the current MVP. Results realtime remains the main competitive sync surface for now.
- There are still no checked-in Supabase SQL migrations; `SUPABASE_SCHEMA.md` documents the live shape, but it is not a migration source of truth yet.
- `components/ExamPage.tsx` can create a mock exam client-side if no exam record exists. That is useful for fallback/demo purposes, but it can hide backend issues if left untracked.
- Website language still needs a second translation pass for:
  - `RoundPage`
  - `ExamPage`
  - `app/rivalry/[id]/new-round/page.tsx`
  - some API-returned status/error strings
- `ResultsPage` is now translated and ships a richer battle-report/share surface, so the main remaining bilingual gap is the live round flow plus a few system messages.
- The 24-hour new-round limit currently shows a localized frontend hint in `Rivalries`, but `app/rivalry/[id]/new-round/page.tsx` itself is still part of the untranslated second batch.

## Notes For The Next Session

- Start by reading `PROJECT_RULES.md`, then this file, then `TASK_QUEUE.md`, then `ClashLingo-Session-Summary.md`.
- Prioritize the second website-language batch next if you want another user-facing feature, or move into test strategy / AI output hardening for cleanup.
- Shared avatar sync and rivalry-shared weekly rhythm are now shipped; if a later session touches them, preserve the public-identity/public-ledger split instead of moving those values back into viewer-local rendering.
- Leave-rivalry is now shipped through `cumulative_ledger.inactive`.
  - Preserve history.
  - Keep inactive rivalries out of lounge.
  - Do not let new rounds start once a rivalry is inactive.
- Preserve the new round cadence guard.
  - It is a rolling 24-hour limit per rivalry.
  - It is enforced server-side by `/api/create-round`.
  - Frontend copy should show the next available time when possible.
- Language level is now a shipped product rule. Preserve the current split:
  - `Settings` stores the user's default level
  - `rivalries.player_a_difficulty / player_b_difficulty` store per-rivalry levels
  - AI routes resolve the effective round level server-side from `target_lang`
- If you continue the UI pass, keep pushing the current `Lounge` vs `Rivalries` split instead of blending those two responsibilities together again.
- Any follow-up lounge / rivalries edits should be visual polish only unless the product rules change again.
- Preserve the current website-language split:
  - UI language can be `English` or `简体中文`
  - it is separate from the user's learning language
  - it should not change AI syllabus or exam generation behavior
- Re-run the full round flow manually after any lounge, countdown, or scope grouping changes.
- If you change infra assumptions, update `README.md`, `.env.example`, and `SUPABASE_SCHEMA.md` in the same batch.
