import { normalizeLanguageLevel } from "@/lib/language-level";
import { en } from "@/lib/i18n/en";
import { zhCN } from "@/lib/i18n/zh-CN";
import {
  DEFAULT_WEBSITE_LANGUAGE,
  WEBSITE_LANGUAGES,
  detectBrowserWebsiteLanguage,
  formatWebsiteTime,
  getStoredWebsiteLanguage,
  normalizeWebsiteLanguage,
  persistWebsiteLanguage,
  resolveClientWebsiteLanguage,
  type WebsiteLanguage,
} from "@/lib/i18n/core";
import type { TranslationDictionary } from "@/lib/i18n/types";
import type { SupportedLanguage } from "@/lib/profile";

const DICTIONARIES: Record<WebsiteLanguage, TranslationDictionary> = {
  en,
  "zh-CN": zhCN,
};

export {
  DEFAULT_WEBSITE_LANGUAGE,
  WEBSITE_LANGUAGES,
  detectBrowserWebsiteLanguage,
  formatWebsiteTime,
  getStoredWebsiteLanguage,
  normalizeWebsiteLanguage,
  persistWebsiteLanguage,
  resolveClientWebsiteLanguage,
  type TranslationDictionary,
  type WebsiteLanguage,
};

export function getDictionary(language: WebsiteLanguage) {
  return DICTIONARIES[normalizeWebsiteLanguage(language)];
}

export function getLocalizedLearningLanguageLabel(
  language: string | null | undefined,
  websiteLanguage: WebsiteLanguage
) {
  const dictionary = getDictionary(websiteLanguage);
  if (!language) {
    return dictionary.common.unassignedLanguage;
  }

  if (language in dictionary.learningLanguageLabels) {
    return dictionary.learningLanguageLabels[language as SupportedLanguage];
  }

  return language;
}

export function getLocalizedLanguageLevelLabel(
  level: string | null | undefined,
  websiteLanguage: WebsiteLanguage
) {
  const dictionary = getDictionary(websiteLanguage);
  const normalizedLevel = normalizeLanguageLevel(level);

  return dictionary.languageLevelLabels[normalizedLevel];
}

export function getLocalizedRoundStatusLabel(
  status: string,
  websiteLanguage: WebsiteLanguage
) {
  const dictionary = getDictionary(websiteLanguage);
  return dictionary.roundStatusLabels[status] ?? status.replace(/_/g, " ");
}
