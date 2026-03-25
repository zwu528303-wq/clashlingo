# Project Rules

Last updated: 2026-03-25
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
- Users can leave a rivalry through a `Leave Rivalry` action.
- Leaving a rivalry is not a hard delete.
- Leaving should preserve history:
  - rivalry record
  - rounds
  - exams
  - submissions
  - results
- Leaving should mark the rivalry inactive.
- Inactive rivalries should:
  - disappear from `Lounge`
  - stop accepting new rounds
  - remain visible in `Rivalries` as history
- Leaving is only allowed when there is no active round.
- If a round is still in `topic_selection`, `confirming`, `countdown`, `exam_ready`, or `exam_live`, the product should block leave and ask the user to finish that round first.
- The UI should use `Leave Rivalry`, not `Delete Rivalry`.

### 2. Settings And Profile

- Settings should include:
  - display nickname
  - avatar
  - website language
  - learning language preferences
  - default language level
  - weekly matching time
- For MVP, avatar should be a letter avatar, not an uploaded image.
- Avatar rules:
  - default avatar letter comes from the display nickname initial
  - users may override the avatar letter manually
  - users may choose from a small fixed set of avatar color themes
  - custom image upload is not supported in this phase
- Nickname and avatar should be shown in the lounge and rivalry surfaces where identity matters.
- Shared lounge / rivalry identity should come from the public profile layer, not from viewer-local fallbacks.

### 2B. Website Language Rules

- The product supports exactly two website UI languages in the current phase:
  - English
  - 简体中文
- Website language is a UI preference, not a learning-language preference.
- Learning-language options remain:
  - French
  - Spanish
  - Japanese
  - Korean
  - Chinese
  - English
- The login page should expose a quick website-language toggle for first-time visitors.
- Settings should include a persistent `Website Language` selector.
- The user's saved website language should override browser detection after the first manual change.
- Browser language may be used only for the initial default.
- Website language should not add locale routes in the current MVP.
- Website language should not change AI syllabus or exam generation behavior in the current MVP.
- When website language is Chinese, UI labels may show learning-language names in Chinese, but stored values should remain the existing English enums.

### 3. Match Timing And Start Rules

- Matches operate on a weekly cadence.
- Weekly matching time is no longer a hard gate for starting a match.
- Weekly matching time is used only for countdown / reminder / anticipation UX.
- Each rivalry can start at most one new round per rolling 24 hours.
- This is a hard backend limit, not a soft UI suggestion.
- Settings define the default weekly rhythm for newly created rivalries.
- Each rivalry should then keep its own shared weekly countdown pulse for both players.
- If both players click start, the match can begin immediately even if the weekly countdown has not completed.
- The product should feel like "weekly rhythm with optional early mutual start", not "locked until the clock ends".
- When the limit is hit, the UI should tell the user when the next round becomes available instead of failing silently.

### 3B. Language Level Rules

- Settings should include a `Default Language Level`.
- The allowed level list should be exactly:
  - Beginner
  - Elementary
  - Intermediate
  - Advanced
- This setting acts as the user's default level for newly created or joined rivalries.
- Rivalries should store each player's level separately in `player_a_difficulty` / `player_b_difficulty`.
- AI syllabus and exam generation should choose the level based on the round's `target_lang`.
- If both players are studying the same target language and their saved levels differ, the AI should use the lower level for that round.
- Language level should not affect matchmaking, scoring rules, or countdown eligibility in the current MVP.

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

### 4B. Rivalries Is The History And Stats Surface

- The sidebar should include a persistent `Rivalries` destination.
- `Lounge` and `Rivalries` should not be treated as the same page with different labels.
- `Lounge` is for countdowns, quick status, and entering the current match.
- `Rivalries` is for long-lived rivalry context:
  - wins / losses
  - streak
  - rivalry milestone
  - match history
  - selected rivalry detail hub
- If the user has more than one rivalry, the `Rivalries` page should let them choose which rivalry hub they are looking at.

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
- Live opponent exam-progress UI is not part of the current MVP.
- For now, realtime competition should stop at results updates instead of showing in-exam progress.

## Shipped Changes Already In Code

As of the latest reviewed state, the following product changes are already in the codebase:

- `/round/[id]/exam` now correctly renders the real exam page
- countdown now auto-triggers exam generation instead of depending on a visible dev shortcut
- exam generation endpoint is idempotent when an exam already exists
- results page includes a share action
- results page includes syllabus / study material review
- results page listens for rival submission inserts and auto-refreshes
- lounge includes a `Scopes` entry point
- sidebar now includes a persistent `Rivalries` destination
- lounge now uses rivalry cards as the main control surface
- lounge, rivalries, scopes, and settings now share a sidebar navigation shell
- paired lounge cards now show a weekly rhythm countdown even before a round reaches the actual study countdown
- each rivalry is now limited to one newly created round per rolling 24 hours, enforced server-side
- countdown rounds now allow both players to ready up and start the exam early before the timer expires
- `/rivalries` now exists as a real hub route, while `/rivalry/[id]` remains a deep link into the same hub experience
- lounge now routes rivalry-detail entry points toward the rivalry hub flow
- lounge and rivalries now share a first-pass fused visual language that follows the approved AI Studio reference direction without changing product logic
- scopes now classify current and past scope cards by target language
- settings page exists for nickname, letter avatar, avatar color, default language, and weekly match time
- settings page now includes `Website Language`
- settings page now includes `Default Language Level`
- login now includes an unsigned-user website-language toggle
- the first website-language batch is now localized across Login, Reset Password, Lounge, Rivalries, Scopes, Settings, How It Works, and the shared sidebar shell
- settings save syncs shared nickname and public avatar identity through a server route
- lounge now reads profile preferences and uses the new supported language list
- lounge enforces a 2-rivalry limit in the UI
- new rivalries now inherit the creator's default language level, and joined rivalries store the joiner's default language level
- syllabus and exam generation now choose level server-side from rivalry difficulty plus round target language
- rivalry dashboard shows cumulative rivalry stats and round outcome context
- scopes page exists
- scopes now read from `rounds.syllabus`, so they can appear before exam creation
- shared views no longer fall back to email-style public display names
- lounge and rivalry surfaces now read rival avatar letter/color from shared public identity data
- weekly rhythm is now stored per rivalry as a shared countdown pulse, seeded from the creator's default settings value
- rivalries can now be left without deleting history
- inactive rivalries are hidden from lounge, remain visible in rivalry history, and block future rounds

## Approved But Not Yet Shipped

There are no currently approved-but-unshipped product rules.

## UX Guidance

- Favor clear, game-like labels over admin-style wording.
- Show countdowns where users naturally check status first.
- Avoid hiding important state transitions inside deep pages.
- If a rule becomes "display only" rather than "hard gating", the copy should make that explicit.

## Implementation Notes

- Product rules should be updated whenever major behavior changes are approved.
- Do not silently infer new rules from temporary UI behavior or incomplete code.
- If a future session finds code that conflicts with this file, the agent should call out the conflict instead of rewriting the rules on its own.
