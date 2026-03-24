# Project Rules

Last updated: 2026-03-24
Status: approved product rules + shipped MVP notes

## Product Intent

ClashLingo is a playful 1v1 language-learning rivalry app.
The product should feel:
- competitive but lightweight
- visually bold and friendly
- easy to resume every week
- clear enough that users always know what the next action is

## Source Of Truth

When product behavior is ambiguous:
1. `PROJECT_RULES.md` defines the intended product rules
2. `PROJECT_STATUS.md` describes the current codebase reality
3. If the code does not match these rules yet, treat that as planned work rather than a reason to change the rules silently

## Approved Product Rules

### 1. Rivalry Management

- A user can be in at most 2 rivalries at a time.
- Leaving / exiting a rivalry is not part of the current MVP scope.
- The product should focus on creating, joining, and progressing active rivalries cleanly before introducing rivalry-exit flows.

### 2. Settings And Profile

- Settings should include:
  - display nickname
  - avatar
  - learning language preferences
  - weekly matching time
- For MVP, avatar should be a letter avatar, not an uploaded image.
- Avatar rules:
  - default avatar letter comes from the display nickname initial
  - users may override the avatar letter manually
  - users may choose from a small fixed set of avatar color themes
  - custom image upload is not supported in this phase
- Nickname and avatar should be shown in the lounge and rivalry surfaces where identity matters.

### 3. Match Timing And Start Rules

- Matches operate on a weekly cadence.
- Weekly matching time is no longer a hard gate for starting a match.
- Weekly matching time is used only for countdown / reminder / anticipation UX.
- If both players click start, the match can begin immediately even if the weekly countdown has not completed.
- The product should feel like "weekly rhythm with optional early mutual start", not "locked until the clock ends".

### 4. Lounge Is The Main Match Control Surface

- Countdown should be visible in the lounge, not only inside a round page.
- Each rivalry should appear as its own card in the lounge.
- A rivalry card should be able to show:
  - rival identity
  - target language for the current round
  - round or week number
  - countdown state
  - current action state such as waiting, ready, live, or completed
- The Google AI Studio lounge card concept is an approved reference direction for this area.

### 5. Supported Languages

The allowed language list should be exactly:
- French
- Spanish
- Japanese
- Korean
- Chinese
- English

Rules:
- Remove German, Italian, Portuguese, and any other extra options from user-facing selectors.
- Keep this list consistent across create rivalry, join rivalry, settings, scope filters, and any AI prompt inputs.

### 6. Scope Rules

- A scope should appear as soon as a syllabus exists.
- Scope visibility must not depend on an exam record existing.
- If two players are learning different target languages, the scopes experience must classify or group scopes by target language.
- Scope views should make the target language obvious at a glance.
- Active scopes and past scopes should remain separate concepts.

### 7. Results And Progress Rules

- Results should support a shareable outcome card.
- Results should update when the rival submits.
- Rivalry history should preserve cumulative outcomes such as wins, losses, ties, and round scores.
- The product should show meaningful review material after the exam, including the tested scope or study material when available.

## Shipped Changes Already In Code

As of the latest reviewed state, the following product changes are already in the codebase:

- `/round/[id]/exam` now correctly renders the real exam page
- countdown now auto-triggers exam generation instead of depending on a visible dev shortcut
- exam generation endpoint is idempotent when an exam already exists
- results page includes a share action
- results page includes syllabus / study material review
- results page listens for rival submission inserts and auto-refreshes
- lounge includes a `Scopes` entry point
- lounge now uses rivalry cards as the main control surface
- settings page exists for nickname, letter avatar, avatar color, default language, and weekly match time
- settings save syncs shared nickname data through a server route
- lounge now reads profile preferences and uses the new supported language list
- lounge enforces a 2-rivalry limit in the UI
- rivalry dashboard shows cumulative rivalry stats and round outcome context
- scopes page exists
- scopes now read from `rounds.syllabus`, so they can appear before exam creation
- shared views no longer fall back to email-style public display names

## Approved But Not Yet Shipped

These rules are approved but still need implementation work:

- classify scopes by target language when players use different languages
- align weekly matching time behavior with the new "soft countdown, mutual early start allowed" rule across all relevant screens

## UX Guidance

- Favor clear, game-like labels over admin-style wording.
- Show countdowns where users naturally check status first.
- Avoid hiding important state transitions inside deep pages.
- If a rule becomes "display only" rather than "hard gating", the copy should make that explicit.

## Implementation Notes

- Product rules should be updated whenever major behavior changes are approved.
- Do not silently infer new rules from temporary UI behavior or incomplete code.
- If a future session finds code that conflicts with this file, the agent should call out the conflict instead of rewriting the rules on its own.
