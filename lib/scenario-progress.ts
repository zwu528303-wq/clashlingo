import type { Scenario, StageNumber } from "@/lib/scenario-types";
import { isStageNumber } from "@/lib/scenario-types";

export interface ScenarioProgress {
  completedStages: StageNumber[];
  currentStage: StageNumber | null;
}

export const DEFAULT_PROGRESS: ScenarioProgress = {
  completedStages: [],
  currentStage: null,
};

/** A user's progress across scenarios, keyed by scenario slug. */
export type ScenarioProgressMap = Record<string, ScenarioProgress>;

export function getScenarioProgress(
  slug: string,
  progressMap: ScenarioProgressMap = {}
): ScenarioProgress {
  return progressMap[slug] ?? DEFAULT_PROGRESS;
}

export function countStartedScenarios(
  scenarios: Scenario[],
  progressMap: ScenarioProgressMap = {}
) {
  return scenarios.filter(
    (scenario) => getScenarioProgress(scenario.slug, progressMap).currentStage
  ).length;
}

export function countClearedStages(
  scenarios: Scenario[],
  progressMap: ScenarioProgressMap = {}
) {
  return scenarios.reduce(
    (total, scenario) =>
      total +
      getScenarioProgress(scenario.slug, progressMap).completedStages.length,
    0
  );
}

/**
 * Given a scenario's open stages and the stages already completed, decide which
 * stage the learner should be pointed at next.
 *
 * - Prefer the lowest open stage that has not been completed yet.
 * - If every open stage is completed, point at the highest open stage so the map
 *   keeps a sensible "current" marker.
 * - Scenarios with no open stages have no current stage.
 */
export function resolveCurrentStage(
  availableStages: StageNumber[],
  completedStages: StageNumber[]
): StageNumber | null {
  const open = [...availableStages].sort((a, b) => a - b);
  if (open.length === 0) {
    return null;
  }

  const nextUncleared = open.find((stage) => !completedStages.includes(stage));
  return nextUncleared ?? open[open.length - 1];
}

/**
 * Fold a freshly cleared stage into existing progress. Pure so it can run on the
 * server (when writing progress) and be unit-tested. When `cleared` is false the
 * completed set is unchanged, but the current stage is still (re)derived so a
 * never-played scenario picks up a current marker after its first attempt.
 */
export function advanceProgress(
  scenario: Pick<Scenario, "availableStages">,
  completedStages: StageNumber[],
  attemptedStage: StageNumber,
  cleared: boolean
): ScenarioProgress {
  const nextCompleted = cleared
    ? Array.from(new Set([...completedStages, attemptedStage])).sort(
        (a, b) => a - b
      )
    : [...completedStages].sort((a, b) => a - b);

  return {
    completedStages: nextCompleted,
    currentStage: resolveCurrentStage(scenario.availableStages, nextCompleted),
  };
}

interface RawProgressRow {
  scenario_slug: string;
  completed_stages: number[] | null;
  current_stage: number | null;
}

function normalizeStageList(values: number[] | null): StageNumber[] {
  if (!values) {
    return [];
  }
  return values.filter((value): value is StageNumber => isStageNumber(value));
}

/**
 * Fetch the signed-in user's scenario progress for one (language, level) scope
 * and return it keyed by scenario slug. Returns an empty map on any failure so
 * the scenario map degrades gracefully to "nothing started yet".
 */
export async function fetchScenarioProgressMap(args: {
  accessToken: string;
  targetLanguage: string;
  level: string;
}): Promise<ScenarioProgressMap> {
  const params = new URLSearchParams({
    targetLanguage: args.targetLanguage,
    level: args.level,
  });

  try {
    const response = await fetch(`/api/scenario-progress?${params.toString()}`, {
      headers: { Authorization: `Bearer ${args.accessToken}` },
    });

    if (!response.ok) {
      return {};
    }

    const data = (await response.json()) as { progress?: RawProgressRow[] };
    const map: ScenarioProgressMap = {};
    for (const row of data.progress ?? []) {
      map[row.scenario_slug] = {
        completedStages: normalizeStageList(row.completed_stages),
        currentStage: isStageNumber(row.current_stage ?? NaN)
          ? (row.current_stage as StageNumber)
          : null,
      };
    }
    return map;
  } catch {
    return {};
  }
}
