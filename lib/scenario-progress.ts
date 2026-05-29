import type { Scenario, StageNumber } from "@/lib/scenario-types";

export interface ScenarioProgress {
  completedStages: StageNumber[];
  currentStage: StageNumber | null;
}

const DEFAULT_PROGRESS: ScenarioProgress = {
  completedStages: [],
  currentStage: null,
};

const MOCK_SCENARIO_PROGRESS: Record<string, ScenarioProgress> = {
  cafe: {
    completedStages: [1],
    currentStage: 2,
  },
  restaurant: {
    completedStages: [],
    currentStage: 1,
  },
  "small-talk": {
    completedStages: [1],
    currentStage: 2,
  },
  "roommate-conflict": {
    completedStages: [],
    currentStage: 1,
  },
  "classmate-small-talk": {
    completedStages: [],
    currentStage: 1,
  },
  interview: {
    completedStages: [],
    currentStage: 1,
  },
  shopping: {
    completedStages: [],
    currentStage: 1,
  },
};

export function getScenarioProgress(slug: string): ScenarioProgress {
  return MOCK_SCENARIO_PROGRESS[slug] ?? DEFAULT_PROGRESS;
}

export function countStartedScenarios(scenarios: Scenario[]) {
  return scenarios.filter((scenario) => getScenarioProgress(scenario.slug).currentStage)
    .length;
}

export function countClearedStages(scenarios: Scenario[]) {
  return scenarios.reduce(
    (total, scenario) =>
      total + getScenarioProgress(scenario.slug).completedStages.length,
    0
  );
}
