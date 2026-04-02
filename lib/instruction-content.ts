import {
  DEFAULT_WEBSITE_LANGUAGE,
  normalizeWebsiteLanguage,
  type WebsiteLanguage,
} from "@/lib/i18n/core";
import type {
  ExamQuestion,
  ExamRubricItem,
  LocalizedText,
  LocalizedTextList,
  Syllabus,
  VocabularyGroup,
} from "@/lib/domain-types";

export const INSTRUCTION_LANGUAGES = ["en", "zh-CN"] as const;

export type InstructionLanguage = (typeof INSTRUCTION_LANGUAGES)[number];

function pickLanguage<T>(
  value: Partial<Record<WebsiteLanguage, T>> | null | undefined,
  language: InstructionLanguage
) {
  if (!value) {
    return null;
  }

  return (
    value[normalizeWebsiteLanguage(language)] ??
    value[DEFAULT_WEBSITE_LANGUAGE] ??
    value["zh-CN"] ??
    null
  );
}

export function normalizeInstructionLanguage(
  value: unknown,
  fallback: InstructionLanguage = DEFAULT_WEBSITE_LANGUAGE
): InstructionLanguage {
  const normalized = normalizeWebsiteLanguage(value);
  return normalized || fallback;
}

export function getLocalizedText(
  value: string | LocalizedText | null | undefined,
  language: InstructionLanguage
) {
  if (typeof value === "string") {
    return value;
  }

  return pickLanguage(value, language) ?? "";
}

export function getLocalizedList(
  value: string[] | LocalizedTextList | null | undefined,
  language: InstructionLanguage
) {
  if (Array.isArray(value)) {
    return value;
  }

  return pickLanguage(value, language) ?? [];
}

export function getLocalizedVocabularyGroups(
  syllabus: Syllabus | null | undefined,
  language: InstructionLanguage
) {
  const groups = syllabus?.vocabulary_groups;

  if (Array.isArray(groups) && groups.length > 0) {
    return groups.map((group, index) => ({
      id: group.id ?? `group-${index}`,
      label: getLocalizedText(group.label, language),
      words: group.words ?? [],
    }));
  }

  const legacyVocabulary = syllabus?.vocabulary;
  if (!legacyVocabulary || typeof legacyVocabulary !== "object") {
    return [];
  }

  return Object.entries(legacyVocabulary).map(([label, words], index) => ({
    id: `legacy-group-${index}`,
    label,
    words,
  }));
}

export function getLocalizedExamOptions(
  question: Pick<ExamQuestion, "options">,
  language: InstructionLanguage
) {
  if (!Array.isArray(question.options)) {
    return [];
  }

  return question.options.map((option) => {
    if (typeof option === "string") {
      return { value: option, label: option };
    }

    return {
      value: option.value,
      label: getLocalizedText(option.label, language) || option.value,
    };
  });
}

export function getLocalizedRubricAnswer(
  rubricItem: Pick<ExamRubricItem, "answer"> | null | undefined,
  language: InstructionLanguage
) {
  return getLocalizedText(rubricItem?.answer, language);
}

export function getLocalizedKeywords(
  rubricItem: Pick<ExamRubricItem, "keywords"> | null | undefined,
  language: InstructionLanguage
) {
  return getLocalizedList(rubricItem?.keywords, language);
}

export function createLocalizedText(
  en: string,
  zhCN: string
): LocalizedText {
  return {
    en,
    "zh-CN": zhCN,
  };
}

export function createLocalizedList(
  en: string[],
  zhCN: string[]
): LocalizedTextList {
  return {
    en,
    "zh-CN": zhCN,
  };
}

export function createVocabularyGroup(
  id: string,
  enLabel: string,
  zhCNLabel: string,
  words: string[]
): VocabularyGroup {
  return {
    id,
    label: createLocalizedText(enLabel, zhCNLabel),
    words,
  };
}
