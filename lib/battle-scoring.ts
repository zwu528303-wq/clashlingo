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
  aiAnswer: string | null;
  aiScore: QuestionScoreBreakdown;
  wasTimeout: boolean;
  timeSpentSec: number;
  speedWinner: "user" | "ai" | "tie";
  wasCorrect: boolean;
  reaction: string;
}

export interface BattleTotals {
  total: number;
  speed: number;
  accuracy: number;
  quality: number;
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

function hashSeed(input: string) {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function seededUnit(seed: string) {
  return (hashSeed(seed) % 1000) / 1000;
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

function getAIScore(question: BattleQuestion, seedBase: string) {
  const speedRoll = seededUnit(`${seedBase}:speed`);
  const accuracyRoll = seededUnit(`${seedBase}:accuracy`);
  const qualityRoll = seededUnit(`${seedBase}:quality`);

  const accuracy =
    accuracyRoll >= (isFreeResponseQuestion(question) ? 0.28 : 0.18) ? 1 : 0;
  const quality =
    isMultipleChoiceQuestion(question) || accuracy === 0
      ? 0
      : qualityRoll >= (isFillBlankQuestion(question) ? 0.22 : 0.38)
        ? 1
        : 0;

  return {
    speedRoll,
    score: makeTotal({
      speed: 0,
      accuracy,
      quality,
    }),
  };
}

function getAIAnswer(question: BattleQuestion, aiWasCorrect: boolean) {
  if (!aiWasCorrect) {
    return null;
  }

  if (isMultipleChoiceQuestion(question)) {
    return question.correctOption.toUpperCase();
  }

  return question.modelAnswers[0] ?? null;
}

function getBattleReaction(
  question: BattleQuestion,
  speedWinner: "user" | "ai" | "tie",
  userScore: QuestionScoreBreakdown,
  aiScore: QuestionScoreBreakdown
) {
  if (userScore.total === 0) {
    return "You froze on that one.";
  }

  if (speedWinner === "user" && userScore.total > aiScore.total) {
    if (isFreeResponseQuestion(question) && userScore.quality === 1) {
      return "Clean answer. You stole that round.";
    }

    return "Quick and sharp. You got that one.";
  }

  if (speedWinner === "ai" && aiScore.total > userScore.total) {
    return "Too slow. The rival edged ahead.";
  }

  if (userScore.accuracy === 1 && aiScore.accuracy === 1) {
    return "Both landed it. Keep pushing.";
  }

  return "That one was messy. Reset fast.";
}

export function evaluateBattleQuestion({
  question,
  answer,
  timeSpentSec,
  rules,
  sessionSeed,
}: {
  question: BattleQuestion;
  answer: string;
  timeSpentSec: number;
  rules: BattleRules;
  sessionSeed: string;
}): EvaluatedQuestionResult {
  const timerLimit = getQuestionTimer(question, rules);
  const clampedTime = clamp(timeSpentSec, 0, timerLimit);
  const userAccuracy = getUserAccuracy(question, answer);
  const userQuality = getUserQuality(question, answer);
  const aiEvaluation = getAIScore(question, `${sessionSeed}:${question.id}`);
  const aiResponseSec = Math.max(
    1,
    Math.round((0.28 + aiEvaluation.speedRoll * 0.6) * timerLimit)
  );

  const userResponded = normalizeText(answer).length > 0;
  const userSpeed =
    userResponded && userAccuracy === 1 && clampedTime <= aiResponseSec ? 1 : 0;
  const aiSpeed =
    aiEvaluation.score.accuracy === 1 &&
    (userAccuracy === 0 || aiResponseSec < clampedTime)
      ? 1
      : 0;

  const userScore = makeTotal({
    speed: userSpeed,
    accuracy: userAccuracy,
    quality: userQuality,
  });
  const aiScore = makeTotal({
    speed: aiSpeed,
    accuracy: aiEvaluation.score.accuracy,
    quality: aiEvaluation.score.quality,
  });

  const speedWinner =
    userSpeed === aiSpeed ? "tie" : userSpeed > aiSpeed ? "user" : "ai";
  const wasTimeout = !userResponded || clampedTime >= timerLimit;
  const reaction = getBattleReaction(question, speedWinner, userScore, aiScore);

  return {
    questionId: question.id,
    questionType: question.type,
    prompt: question.prompt,
    skillTags: question.skillTags,
    userAnswer: answer.trim(),
    userScore,
    aiAnswer: getAIAnswer(question, aiScore.accuracy === 1),
    aiScore,
    wasTimeout,
    timeSpentSec: clampedTime,
    speedWinner,
    wasCorrect: userAccuracy === 1,
    reaction,
  };
}

export function getBattleTotals(results: EvaluatedQuestionResult[]): {
  user: BattleTotals;
  ai: BattleTotals;
} {
  return results.reduce(
    (totals, result) => {
      totals.user.total += result.userScore.total;
      totals.user.speed += result.userScore.speed;
      totals.user.accuracy += result.userScore.accuracy;
      totals.user.quality += result.userScore.quality;

      totals.ai.total += result.aiScore.total;
      totals.ai.speed += result.aiScore.speed;
      totals.ai.accuracy += result.aiScore.accuracy;
      totals.ai.quality += result.aiScore.quality;

      return totals;
    },
    {
      user: { total: 0, speed: 0, accuracy: 0, quality: 0 },
      ai: { total: 0, speed: 0, accuracy: 0, quality: 0 },
    }
  );
}
