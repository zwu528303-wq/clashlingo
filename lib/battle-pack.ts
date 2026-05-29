import type { LanguageLevel } from "@/lib/language-level";
import type { SupportedLanguage } from "@/lib/profile";
import { buildBattlePackCacheKey } from "@/lib/scenario-map";
import type {
  AIReactionPool,
  BattlePack,
  BattleQuestion,
  BattleRules,
  FillBlankQuestion,
  FreeResponseQuestion,
  LocalizedText,
  MultipleChoiceQuestion,
  Scenario,
  StageNumber,
} from "@/lib/scenario-types";

export const BATTLE_TEMPLATE_VERSION = "v1-ai";
export const BATTLE_INSTRUCTION_LANGUAGES = ["en", "zh-CN"] as const;

// Timers and question counts are product decisions, not AI content, so they are
// resolved deterministically per stage. battleQuestionCount === quick + free.
export const STAGE_RULES: Record<StageNumber, BattleRules> = {
  1: {
    battleQuestionCount: 8,
    quickQuestionCount: 5,
    freeResponseCount: 3,
    timers: { multipleChoiceSec: 6, fillBlankSec: 8, freeResponseSec: 15 },
  },
  2: {
    battleQuestionCount: 10,
    quickQuestionCount: 6,
    freeResponseCount: 4,
    timers: { multipleChoiceSec: 5, fillBlankSec: 7, freeResponseSec: 14 },
  },
  3: {
    battleQuestionCount: 11,
    quickQuestionCount: 6,
    freeResponseCount: 5,
    timers: { multipleChoiceSec: 5, fillBlankSec: 6, freeResponseSec: 13 },
  },
  4: {
    battleQuestionCount: 12,
    quickQuestionCount: 7,
    freeResponseCount: 5,
    timers: { multipleChoiceSec: 4, fillBlankSec: 6, freeResponseSec: 12 },
  },
};

// What the model is asked to produce. Stable ids, rules, template, and version
// are added server-side in assembleBattlePack so the model only owns content.
type RawMultipleChoice = Omit<MultipleChoiceQuestion, "id">;
type RawFillBlank = Omit<FillBlankQuestion, "id">;
type RawFreeResponse = Omit<FreeResponseQuestion, "id">;
export type RawBattleQuestion =
  | RawMultipleChoice
  | RawFillBlank
  | RawFreeResponse;

export interface BattlePackContent {
  scope: Pick<
    BattlePack["scope"],
    | "summary"
    | "canDo"
    | "vocabularyGroups"
    | "sentencePatterns"
    | "followUpTypes"
    | "howBattleWorks"
  >;
  candidateQuestions: RawBattleQuestion[];
  aiReactions: AIReactionPool;
}

function isLocalizedText(value: unknown): value is LocalizedText {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as LocalizedText).en === "string" &&
    typeof (value as LocalizedText)["zh-CN"] === "string"
  );
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isLocalizedTextArray(value: unknown): value is LocalizedText[] {
  return Array.isArray(value) && value.every(isLocalizedText);
}

function validateQuestion(question: unknown, index: number): string | null {
  if (typeof question !== "object" || question === null) {
    return `Question ${index} is not an object`;
  }

  const candidate = question as Partial<RawBattleQuestion>;
  if (!isLocalizedText(candidate.prompt)) {
    return `Question ${index} is missing a bilingual prompt`;
  }
  if (!isStringArray(candidate.skillTags) || candidate.skillTags.length === 0) {
    return `Question ${index} is missing skillTags`;
  }

  if (candidate.type === "multiple_choice") {
    const mc = candidate as Partial<RawMultipleChoice>;
    if (!Array.isArray(mc.options) || mc.options.length < 2) {
      return `Question ${index} needs at least two options`;
    }
    const optionIds = new Set<string>();
    for (const option of mc.options) {
      if (
        typeof option?.id !== "string" ||
        !isLocalizedText(option?.text)
      ) {
        return `Question ${index} has a malformed option`;
      }
      optionIds.add(option.id);
    }
    if (typeof mc.correctOption !== "string" || !optionIds.has(mc.correctOption)) {
      return `Question ${index} correctOption does not match an option id`;
    }
    return null;
  }

  if (candidate.type === "fill_blank" || candidate.type === "short_free_response") {
    const text = candidate as Partial<RawFillBlank | RawFreeResponse>;
    if (!isStringArray(text.expectedKeywords) || text.expectedKeywords.length === 0) {
      return `Question ${index} is missing expectedKeywords`;
    }
    if (!isStringArray(text.modelAnswers) || text.modelAnswers.length === 0) {
      return `Question ${index} is missing modelAnswers`;
    }
    return null;
  }

  return `Question ${index} has an unknown type`;
}

export function validateBattleContent(
  content: unknown,
  rules: BattleRules
): { ok: true; content: BattlePackContent } | { ok: false; error: string } {
  if (typeof content !== "object" || content === null) {
    return { ok: false, error: "Content is not an object" };
  }

  const candidate = content as Partial<BattlePackContent>;
  const scope = candidate.scope;
  if (typeof scope !== "object" || scope === null) {
    return { ok: false, error: "Missing scope" };
  }
  if (!isLocalizedText(scope.summary)) {
    return { ok: false, error: "scope.summary must be bilingual" };
  }
  if (!isLocalizedTextArray(scope.canDo) || scope.canDo.length === 0) {
    return { ok: false, error: "scope.canDo must be a non-empty bilingual list" };
  }
  if (
    !Array.isArray(scope.vocabularyGroups) ||
    scope.vocabularyGroups.length === 0 ||
    !scope.vocabularyGroups.every(
      (group) =>
        typeof group?.id === "string" &&
        isLocalizedText(group?.label) &&
        isStringArray(group?.words) &&
        group.words.length > 0
    )
  ) {
    return { ok: false, error: "scope.vocabularyGroups is malformed" };
  }
  if (!isStringArray(scope.sentencePatterns) || scope.sentencePatterns.length === 0) {
    return { ok: false, error: "scope.sentencePatterns must be non-empty" };
  }
  if (!isStringArray(scope.followUpTypes) || scope.followUpTypes.length === 0) {
    return { ok: false, error: "scope.followUpTypes must be non-empty" };
  }
  if (!isLocalizedTextArray(scope.howBattleWorks) || scope.howBattleWorks.length === 0) {
    return { ok: false, error: "scope.howBattleWorks must be a non-empty bilingual list" };
  }

  const reactions = candidate.aiReactions;
  if (
    typeof reactions !== "object" ||
    reactions === null ||
    !isStringArray(reactions.start) ||
    !isStringArray(reactions.during) ||
    !isStringArray(reactions.win) ||
    !isStringArray(reactions.lose) ||
    reactions.start.length === 0 ||
    reactions.during.length === 0 ||
    reactions.win.length === 0 ||
    reactions.lose.length === 0
  ) {
    return { ok: false, error: "aiReactions must have non-empty start/during/win/lose" };
  }

  const questions = candidate.candidateQuestions;
  if (!Array.isArray(questions) || questions.length < rules.battleQuestionCount) {
    return {
      ok: false,
      error: `candidateQuestions must include at least ${rules.battleQuestionCount} questions`,
    };
  }
  for (let index = 0; index < questions.length; index += 1) {
    const error = validateQuestion(questions[index], index);
    if (error) {
      return { ok: false, error };
    }
  }

  const battleSlice = questions.slice(0, rules.battleQuestionCount);
  const freeCount = battleSlice.filter(
    (question) =>
      (question as RawBattleQuestion).type === "short_free_response"
  ).length;
  if (freeCount < rules.freeResponseCount) {
    return {
      ok: false,
      error: `The first ${rules.battleQuestionCount} questions need at least ${rules.freeResponseCount} short_free_response items`,
    };
  }

  return { ok: true, content: candidate as BattlePackContent };
}

export function assembleBattlePack(input: {
  scenario: Scenario;
  stage: StageNumber;
  targetLanguage: SupportedLanguage;
  level: LanguageLevel;
  content: BattlePackContent;
}): BattlePack {
  const { scenario, stage, targetLanguage, level, content } = input;
  const rules = STAGE_RULES[stage];

  const candidateQuestions: BattleQuestion[] = content.candidateQuestions
    .slice(0, rules.battleQuestionCount)
    .map((question, index) => ({
      ...question,
      id: `${scenario.slug}-s${stage}-q${index + 1}`,
    })) as BattleQuestion[];

  return {
    id: buildBattlePackCacheKey({
      scenarioSlug: scenario.slug,
      stage,
      targetLanguage,
      level,
      templateVersion: BATTLE_TEMPLATE_VERSION,
    }),
    scenarioSlug: scenario.slug,
    stage,
    targetLanguage,
    level,
    template: scenario.template,
    templateVersion: BATTLE_TEMPLATE_VERSION,
    instructionLanguages: [...BATTLE_INSTRUCTION_LANGUAGES],
    scope: {
      scenarioSlug: scenario.slug,
      stage,
      targetLanguage,
      level,
      ...content.scope,
    },
    rules,
    candidateQuestions,
    aiReactions: content.aiReactions,
  };
}

export async function fetchBattlePack(params: {
  scenarioSlug: string;
  stage: StageNumber;
  targetLanguage: SupportedLanguage;
  level: LanguageLevel;
}): Promise<BattlePack | null> {
  const response = await fetch("/api/generate-battle-pack", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as { pack?: BattlePack };
  return data.pack ?? null;
}
