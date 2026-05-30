import type {
  BattleQuestion,
  BattleRules,
  FillBlankQuestion,
  FreeResponseQuestion,
  LocalizedText,
  MultipleChoiceQuestion,
} from "@/lib/scenario-types";

export interface QuestionScoreBreakdown {
  speed: number;
  accuracy: number;
  quality: number;
  total: number;
}

export interface EvaluatedQuestionResult {
  questionId: string;
  questionType: BattleQuestion["type"];
  prompt: LocalizedText;
  skillTags: string[];
  userAnswer: string;
  userScore: QuestionScoreBreakdown;
  correctAnswer: LocalizedText | null;
  wasTimeout: boolean;
  timeSpentSec: number;
  wasCorrect: boolean;
  reaction: string;
}

export interface BattleTotals {
  total: number;
  speed: number;
  accuracy: number;
  quality: number;
}

/**
 * A stage is "cleared" when the learner answers at least this share of the
 * questions correctly. Product rule: 80% accuracy. Speed and expression quality
 * still show on the report, but they do not gate stage completion (selecting the
 * right option can never earn a quality point, so gating on the 3-axis total
 * would be both harder and unfair to multiple-choice questions).
 */
export const STAGE_CLEAR_ACCURACY = 0.8;

export interface BattleOutcome {
  correctCount: number;
  questionCount: number;
  /** Correct answers / total questions, in the range 0..1. */
  accuracyRatio: number;
  /** True when `accuracyRatio` meets `STAGE_CLEAR_ACCURACY`. */
  cleared: boolean;
}

export function getBattleOutcome(
  results: EvaluatedQuestionResult[]
): BattleOutcome {
  const questionCount = results.length;
  const correctCount = results.filter((result) => result.wasCorrect).length;
  const accuracyRatio = questionCount === 0 ? 0 : correctCount / questionCount;

  return {
    correctCount,
    questionCount,
    accuracyRatio,
    cleared: questionCount > 0 && accuracyRatio >= STAGE_CLEAR_ACCURACY,
  };
}

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[.,!?;:"]/g, "")
    .replace(/\s+/g, " ");
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function makeTotal(score: Omit<QuestionScoreBreakdown, "total">): QuestionScoreBreakdown {
  return {
    ...score,
    total: score.speed + score.accuracy + score.quality,
  };
}

export function getQuestionTimer(question: BattleQuestion, rules: BattleRules) {
  switch (question.type) {
    case "multiple_choice":
      return rules.timers.multipleChoiceSec;
    case "fill_blank":
      return rules.timers.fillBlankSec;
    case "short_free_response":
      return rules.timers.freeResponseSec;
    default:
      return rules.timers.freeResponseSec;
  }
}

function isMultipleChoiceQuestion(
  question: BattleQuestion
): question is MultipleChoiceQuestion {
  return question.type === "multiple_choice";
}

function isFillBlankQuestion(question: BattleQuestion): question is FillBlankQuestion {
  return question.type === "fill_blank";
}

function isFreeResponseQuestion(
  question: BattleQuestion
): question is FreeResponseQuestion {
  return question.type === "short_free_response";
}

function getUserAccuracy(question: BattleQuestion, answer: string) {
  const normalized = normalizeText(answer);
  if (!normalized) {
    return 0;
  }

  if (isMultipleChoiceQuestion(question)) {
    return normalized === question.correctOption.toLowerCase() ? 1 : 0;
  }

  const keywordHits = question.expectedKeywords.filter((keyword) =>
    normalized.includes(normalizeText(keyword))
  ).length;

  if (keywordHits === 0) {
    return 0;
  }

  if (isFillBlankQuestion(question)) {
    return 1;
  }

  return keywordHits >= 1 ? 1 : 0;
}

function getUserQuality(question: BattleQuestion, answer: string) {
  if (isMultipleChoiceQuestion(question)) {
    return 0;
  }

  const normalized = normalizeText(answer);
  if (!normalized) {
    return 0;
  }

  const keywordHits = question.expectedKeywords.filter((keyword) =>
    normalized.includes(normalizeText(keyword))
  ).length;
  const wordCount = normalized.split(" ").filter(Boolean).length;
  const modelPatterns = question.modelAnswers.map((modelAnswer) =>
    normalizeText(modelAnswer)
  );

  if (modelPatterns.includes(normalized)) {
    return 1;
  }

  if (isFillBlankQuestion(question)) {
    return keywordHits >= 1 ? 1 : 0;
  }

  return keywordHits >= 1 && wordCount >= 3 ? 1 : 0;
}

/**
 * The standard answer surfaced for self-checking after each question.
 * - Multiple choice: the correct option, prefixed with its letter.
 * - Fill blank / free response: the first model answer (a target-language
 *   string, so both locales show the same text).
 */
function getStandardAnswer(question: BattleQuestion): LocalizedText | null {
  if (isMultipleChoiceQuestion(question)) {
    const correct = question.options.find(
      (option) => option.id.toLowerCase() === question.correctOption.toLowerCase()
    );
    if (!correct) {
      return null;
    }

    const letter = correct.id.toUpperCase();
    return {
      en: `${letter}. ${correct.text.en}`,
      "zh-CN": `${letter}. ${correct.text["zh-CN"]}`,
    };
  }

  const modelAnswer = question.modelAnswers[0];
  if (!modelAnswer) {
    return null;
  }

  return { en: modelAnswer, "zh-CN": modelAnswer };
}

function getSelfReaction(
  question: BattleQuestion,
  userScore: QuestionScoreBreakdown,
  wasTimeout: boolean
) {
  if (userScore.total === 0) {
    return wasTimeout
      ? "Time ran out on that one — check the standard answer below."
      : "Not quite. Compare with the standard answer below.";
  }

  if (userScore.accuracy === 1 && userScore.speed === 1) {
    if (isFreeResponseQuestion(question) && userScore.quality === 1) {
      return "Clean and fast. That's exactly the answer.";
    }

    return "Quick and correct. Nicely done.";
  }

  if (userScore.accuracy === 1) {
    return "Correct — try to lock it in faster next time.";
  }

  return "Close. Check the standard answer below to tighten it up.";
}

export function evaluateBattleQuestion({
  question,
  answer,
  timeSpentSec,
  rules,
}: {
  question: BattleQuestion;
  answer: string;
  timeSpentSec: number;
  rules: BattleRules;
}): EvaluatedQuestionResult {
  const timerLimit = getQuestionTimer(question, rules);
  const clampedTime = clamp(timeSpentSec, 0, timerLimit);
  const userAccuracy = getUserAccuracy(question, answer);
  const userQuality = getUserQuality(question, answer);

  // Speed is now scored against a par time (half the question's timer) instead
  // of a simulated opponent's response time.
  const parSec = Math.max(1, Math.round(timerLimit * 0.5));
  const userResponded = normalizeText(answer).length > 0;
  const userSpeed =
    userResponded && userAccuracy === 1 && clampedTime <= parSec ? 1 : 0;

  const userScore = makeTotal({
    speed: userSpeed,
    accuracy: userAccuracy,
    quality: userQuality,
  });

  const wasTimeout = !userResponded || clampedTime >= timerLimit;
  const reaction = getSelfReaction(question, userScore, wasTimeout);

  return {
    questionId: question.id,
    questionType: question.type,
    prompt: question.prompt,
    skillTags: question.skillTags,
    userAnswer: answer.trim(),
    userScore,
    correctAnswer: getStandardAnswer(question),
    wasTimeout,
    timeSpentSec: clampedTime,
    wasCorrect: userAccuracy === 1,
    reaction,
  };
}

export function getBattleTotals(results: EvaluatedQuestionResult[]): BattleTotals {
  return results.reduce<BattleTotals>(
    (totals, result) => {
      totals.total += result.userScore.total;
      totals.speed += result.userScore.speed;
      totals.accuracy += result.userScore.accuracy;
      totals.quality += result.userScore.quality;

      return totals;
    },
    { total: 0, speed: 0, accuracy: 0, quality: 0 }
  );
}
