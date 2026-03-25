import {
  getDictionary,
  type WebsiteLanguage,
} from "@/lib/i18n";

export function getFirstTimeSetup(language: WebsiteLanguage) {
  return getDictionary(language).guide.firstTimeSetup;
}

export function getWeeklyLoopSteps(language: WebsiteLanguage) {
  return getDictionary(language).guide.weeklyLoopSteps;
}

export function getProductSurfaces(language: WebsiteLanguage) {
  return getDictionary(language).guide.productSurfaces;
}

export function getGuideFaqs(language: WebsiteLanguage) {
  return getDictionary(language).guide.faqs;
}
