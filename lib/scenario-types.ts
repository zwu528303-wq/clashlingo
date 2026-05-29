import type { WebsiteLanguage } from "@/lib/i18n";
import type { InstructionLanguage } from "@/lib/instruction-content";
import type { LanguageLevel } from "@/lib/language-level";
import type { SupportedLanguage } from "@/lib/profile";

export type ScenarioDomain = "life" | "social" | "school" | "work";
export type ScenarioTemplate = "request" | "social" | "problem" | "task";
export type ScenarioLaunchStatus = "full" | "partial" | "coming_soon";
export type StageNumber = 1 | 2 | 3 | 4;
export type StageName = "survive" | "react" | "compete" | "dominate";
export type BattleMode = "clash" | "exam" | "practice";
export type OpponentType = "ai" | "friend";

export interface LocalizedText {
  en: string;
  "zh-CN": string;
}

export interface Scenario {
  slug: string;
  name: LocalizedText;
  domain: ScenarioDomain;
  template: ScenarioTemplate;
  summary: LocalizedText;
  launchStatus: ScenarioLaunchStatus;
  availableStages: StageNumber[];
}

export interface ScenarioDomainDefinition {
  key: ScenarioDomain;
  name: LocalizedText;
  description: LocalizedText;
}

export interface StageDefinition {
  stage: StageNumber;
  name: StageName;
  summary: LocalizedText;
  goals: LocalizedText[];
}

export interface ScopeBriefing {
  scenarioSlug: string;
  stage: StageNumber;
  targetLanguage: SupportedLanguage;
  level: LanguageLevel;
  summary: LocalizedText;
  canDo: LocalizedText[];
  vocabularyGroups: {
    id: string;
    label: LocalizedText;
    words: string[];
  }[];
  sentencePatterns: string[];
  followUpTypes: string[];
  howBattleWorks: LocalizedText[];
}

export interface BattleRules {
  battleQuestionCount: number;
  quickQuestionCount: number;
  freeResponseCount: number;
  timers: {
    multipleChoiceSec: number;
    fillBlankSec: number;
    freeResponseSec: number;
  };
}

interface BaseBattleQuestion {
  id: string;
  skillTags: string[];
}

export interface MultipleChoiceQuestion extends BaseBattleQuestion {
  type: "multiple_choice";
  prompt: LocalizedText;
  options: {
    id: string;
    text: LocalizedText;
  }[];
  correctOption: string;
}

export interface FillBlankQuestion extends BaseBattleQuestion {
  type: "fill_blank";
  prompt: LocalizedText;
  expectedKeywords: string[];
  modelAnswers: string[];
}

export interface FreeResponseQuestion extends BaseBattleQuestion {
  type: "short_free_response";
  prompt: LocalizedText;
  expectedKeywords: string[];
  modelAnswers: string[];
}

export type BattleQuestion =
  | MultipleChoiceQuestion
  | FillBlankQuestion
  | FreeResponseQuestion;

export interface AIReactionPool {
  start: string[];
  during: string[];
  win: string[];
  lose: string[];
}

export interface BattlePack {
  id: string;
  scenarioSlug: string;
  stage: StageNumber;
  targetLanguage: SupportedLanguage;
  level: LanguageLevel;
  template: ScenarioTemplate;
  templateVersion: string;
  instructionLanguages: InstructionLanguage[];
  scope: ScopeBriefing;
  rules: BattleRules;
  candidateQuestions: BattleQuestion[];
  aiReactions: AIReactionPool;
}

export type BattleSessionStatus =
  | "created"
  | "waiting_for_friend"
  | "ready"
  | "countdown"
  | "in_progress"
  | "pending_compare"
  | "completed"
  | "expired"
  | "abandoned";

export interface BattleSession {
  id: string;
  mode: BattleMode;
  opponentType: OpponentType;
  scenarioSlug: string;
  stage: StageNumber;
  battlePackId: string;
  questionOrder: string[];
  status: BattleSessionStatus;
  officialStartedAt: string | null;
  officialEndedAt: string | null;
}

export type BattleAttemptStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "expired"
  | "abandoned";

export interface BattleAttempt {
  id: string;
  sessionId: string;
  userId: string;
  startedAt: string | null;
  submittedAt: string | null;
  status: BattleAttemptStatus;
  totalScore: number;
  speedPoints: number;
  accuracyPoints: number;
  qualityPoints: number;
}

export interface BattleReport {
  sessionId: string;
  winnerUserId: string | null;
  scoreSummary: Record<
    string,
    {
      total: number;
      speed: number;
      accuracy: number;
      quality: number;
    }
  >;
  fastestAnswer: LocalizedText | null;
  bestSentence: string | null;
  weakPoint: LocalizedText | null;
  suggestedPractice: LocalizedText | null;
}

export function getLocalizedText(
  text: LocalizedText,
  websiteLanguage: WebsiteLanguage
) {
  return text[websiteLanguage] ?? text.en;
}

export function isStageNumber(value: number): value is StageNumber {
  return value === 1 || value === 2 || value === 3 || value === 4;
}
