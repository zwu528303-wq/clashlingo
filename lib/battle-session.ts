import type {
  BattlePack,
  BattleQuestion,
  LocalizedText,
  StageNumber,
} from "@/lib/scenario-types";
import type { SupportedLanguage } from "@/lib/profile";
import type { LanguageLevel } from "@/lib/language-level";
import {
  getBattleOutcome,
  getBattleTotals,
  type BattleOutcome,
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
  packId: string;
  createdAt: string;
  userTotals: BattleTotals;
  outcome: BattleOutcome;
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
  const outcome = getBattleOutcome(questionResults);

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
    packId: pack.id,
    createdAt: new Date().toISOString(),
    userTotals: totals,
    outcome,
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
    const parsed = JSON.parse(raw) as StoredBattleReport;
    // Backfill the outcome for reports stored before the 80% clear rule existed.
    if (!parsed.outcome) {
      parsed.outcome = getBattleOutcome(parsed.results ?? []);
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Submit a finished run to the server for authoritative scoring + persistence.
 *
 * The server re-evaluates the answers (so scores cannot be forged), writes the
 * report and advances scenario progress when the run clears the stage, then
 * returns the persisted report. Returns null on any failure so the caller can
 * fall back to its locally-evaluated report (e.g. before the migration is
 * applied or if the battle pack is not cached yet).
 */
export async function submitScenarioRun(args: {
  accessToken: string;
  sessionId: string;
  scenarioSlug: string;
  stage: StageNumber;
  mode: "clash" | "exam";
  targetLanguage: SupportedLanguage;
  level: LanguageLevel;
  results: EvaluatedQuestionResult[];
}): Promise<StoredBattleReport | null> {
  const answers: Record<string, string> = {};
  const timings: Record<string, number> = {};
  for (const result of args.results) {
    answers[result.questionId] = result.userAnswer;
    timings[result.questionId] = result.timeSpentSec;
  }

  try {
    const response = await fetch("/api/scenario-battle/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${args.accessToken}`,
      },
      body: JSON.stringify({
        sessionId: args.sessionId,
        scenarioSlug: args.scenarioSlug,
        stage: args.stage,
        mode: args.mode,
        targetLanguage: args.targetLanguage,
        level: args.level,
        answers,
        timings,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { report?: StoredBattleReport };
    return data.report ?? null;
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
