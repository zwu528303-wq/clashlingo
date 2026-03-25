export const FIRST_TIME_SETUP = {
  eyebrow: "First time only",
  title: "Create / Join Rivalry",
  description:
    "You only do this when starting with a new friend. After that, the same rivalry becomes your weekly loop.",
} as const;

export const WEEKLY_LOOP_STEPS = [
  {
    key: "start_round",
    title: "Start Round",
    description: "Pick the next weekly topic and open a fresh showdown.",
  },
  {
    key: "get_scope",
    title: "Get Scope",
    description: "Generate the study scope for this round's language and level.",
  },
  {
    key: "confirm_together",
    title: "Confirm Together",
    description: "Both players lock in the scope before the countdown starts.",
  },
  {
    key: "study_or_start_early",
    title: "Study or Start Early",
    description: "Follow the weekly rhythm, or jump in sooner if both players agree.",
  },
  {
    key: "take_exam",
    title: "Take Exam",
    description: "Answer the duel and submit your score for the round.",
  },
  {
    key: "compare_results",
    title: "Compare Results",
    description: "See who won, review the scope, and roll back into the next round.",
  },
] as const;

export const PRODUCT_SURFACES = [
  {
    title: "Lounge",
    description: "Countdowns, readiness, and entering the current match.",
  },
  {
    title: "Rivalries",
    description: "Wins, streaks, milestones, and match history.",
  },
  {
    title: "Scopes",
    description: "Study material grouped by language and round.",
  },
  {
    title: "Settings",
    description: "Nickname, avatar, language defaults, level, and weekly rhythm.",
  },
] as const;

export const GUIDE_FAQS = [
  {
    question: "Do we have to wait for the countdown to finish?",
    answer:
      "No. The weekly rhythm is a guide, not a hard lock. If both players are ready, the round can start early.",
  },
  {
    question: "What is the difference between Lounge and Rivalries?",
    answer:
      "Lounge is for what is happening now: countdowns, readiness, and entering the match. Rivalries is the long-term history and stats view.",
  },
  {
    question: "When do scopes appear?",
    answer:
      "A scope appears as soon as the syllabus exists for a round. You do not need to wait for the exam to be created.",
  },
  {
    question: "What does language level actually change?",
    answer:
      "It helps ClashLingo choose the right syllabus and exam difficulty. It does not block matchmaking or change scoring rules.",
  },
  {
    question: "Why is a rivalry missing from Lounge?",
    answer:
      "Only active rivalries stay in Lounge. If a rivalry was left, it moves out of Lounge and remains in Rivalries as history.",
  },
] as const;
