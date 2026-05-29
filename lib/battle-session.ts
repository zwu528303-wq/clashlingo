import type {
  BattlePack,
  BattleQuestion,
  LocalizedText,
  StageNumber,
} from "@/lib/scenario-types";
import type { SupportedLanguage } from "@/lib/profile";
import {
  getBattleTotals,
  type BattleTotals,
  type EvaluatedQuestionResult,
} from "@/lib/battle-scoring";

const STORAGE_PREFIX = "clashlingo:battle-report:";

export interface StoredBattleReport {
  sessionId: string;
  mode: "clash" | "exam";
  scenarioSlug: string;
  scenarioName: LocalizedText;
  stage: StageNumber;
  targetLanguage: SupportedLanguage;
  playerName: string;
  opponentName: string | null;
  packId: string;
  createdAt: string;
  userTotals: BattleTotals;
  opponentTotals: BattleTotals | null;
  winner: "user" | "opponent" | "tie" | null;
  fastestAnswer: string | null;
  bestSentence: string | null;
  weakSkill: string | null;
  suggestedPractice: LocalizedText | null;
  results: EvaluatedQuestionResult[];
}

export function buildBattleQuestionOrder(pack: BattlePack): BattleQuestion[] {
  return pack.candidateQuestions.slice(0, pack.rules.battleQuestionCount);
}

export function evaluateBattleSession({
  sessionId,
  mode = "clash",
  scenarioName,
  playerName,
  pack,
  questionResults,
}: {
  sessionId: string;
  mode?: "clash" | "exam";
  scenarioName: LocalizedText;
  playerName: string;
  pack: BattlePack;
  questionResults: EvaluatedQuestionResult[];
}): StoredBattleReport {
  const totals = getBattleTotals(questionResults);
  const winner =
    totals.user.total === totals.ai.total
      ? totals.user.accuracy === totals.ai.accuracy
        ? totals.user.speed === totals.ai.speed
          ? totals.user.quality === totals.ai.quality
            ? "tie"
            : totals.user.quality > totals.ai.quality
              ? "user"
              : "opponent"
          : totals.user.speed > totals.ai.speed
            ? "user"
            : "opponent"
        : totals.user.accuracy > totals.ai.accuracy
          ? "user"
          : "opponent"
      : totals.user.total > totals.ai.total
        ? "user"
        : "opponent";

  const fastestAnswer =
    questionResults
      .filter((result) => result.wasCorrect && result.userAnswer)
      .sort((left, right) => left.timeSpentSec - right.timeSpentSec)[0]?.userAnswer ??
    null;

  const bestSentence =
    questionResults
      .filter(
        (result) =>
          result.questionType === "short_free_response" &&
          result.userScore.quality === 1 &&
          result.userAnswer
      )
      .sort((left, right) => right.userScore.total - left.userScore.total)[0]
      ?.userAnswer ?? null;

  const weakSkill =
    questionResults
      .filter((result) => result.userScore.accuracy === 0)
      .flatMap((result) => result.skillTags)[0] ?? null;

  const suggestedPractice = weakSkill
    ? {
        en: `Practice ${weakSkill.replaceAll("_", " ")} before the rematch.`,
        "zh-CN": `复盘一下“${weakSkill.replaceAll("_", " ")}”再来一局。`,
      }
    : null;

  return {
    sessionId,
    mode,
    scenarioSlug: pack.scenarioSlug,
    scenarioName,
    stage: pack.stage,
    targetLanguage: pack.targetLanguage,
    playerName,
    opponentName: mode === "clash" ? "AI Opponent" : null,
    packId: pack.id,
    createdAt: new Date().toISOString(),
    userTotals: totals.user,
    opponentTotals: mode === "clash" ? totals.ai : null,
    winner: mode === "clash" ? winner : null,
    fastestAnswer,
    bestSentence,
    weakSkill,
    suggestedPractice,
    results: questionResults,
  };
}

export function saveBattleReport(report: StoredBattleReport) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    `${STORAGE_PREFIX}${report.sessionId}`,
    JSON.stringify(report)
  );
}

export function loadBattleReport(sessionId: string): StoredBattleReport | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${sessionId}`);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredBattleReport;
  } catch {
    return null;
  }
}

export function clearBattleReport(sessionId: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(`${STORAGE_PREFIX}${sessionId}`);
}
