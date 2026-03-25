export const WEBSITE_LANGUAGES = ["en", "zh-CN"] as const;

export type WebsiteLanguage = (typeof WEBSITE_LANGUAGES)[number];

export const DEFAULT_WEBSITE_LANGUAGE: WebsiteLanguage = "en";
export const WEBSITE_LANGUAGE_STORAGE_KEY = "clashlingo.website_language";

export function normalizeWebsiteLanguage(value: unknown): WebsiteLanguage {
  if (
    typeof value === "string" &&
    WEBSITE_LANGUAGES.includes(value as WebsiteLanguage)
  ) {
    return value as WebsiteLanguage;
  }

  return DEFAULT_WEBSITE_LANGUAGE;
}

export function detectBrowserWebsiteLanguage(): WebsiteLanguage {
  if (typeof window === "undefined") {
    return DEFAULT_WEBSITE_LANGUAGE;
  }

  const candidates = [
    ...(navigator.languages ?? []),
    navigator.language,
  ].filter(Boolean);

  return candidates.some((candidate) => candidate.toLowerCase().startsWith("zh"))
    ? "zh-CN"
    : "en";
}

export function getStoredWebsiteLanguage(): WebsiteLanguage | null {
  if (typeof window === "undefined") {
    return null;
  }

  const storedValue = window.localStorage.getItem(WEBSITE_LANGUAGE_STORAGE_KEY);
  if (!storedValue) {
    return null;
  }

  return normalizeWebsiteLanguage(storedValue);
}

export function persistWebsiteLanguage(language: WebsiteLanguage) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(WEBSITE_LANGUAGE_STORAGE_KEY, language);
}

export function resolveClientWebsiteLanguage(
  preferred?: unknown
): WebsiteLanguage {
  if (typeof preferred === "string") {
    return normalizeWebsiteLanguage(preferred);
  }

  return getStoredWebsiteLanguage() ?? detectBrowserWebsiteLanguage();
}

export function formatWebsiteTime(
  value: string,
  language: WebsiteLanguage
) {
  const [hourText = "19", minuteText = "00"] = value.split(":");
  const hours = Number(hourText);
  const minutes = Number(minuteText);
  const safeHours = Number.isFinite(hours) ? hours : 19;
  const safeMinutes = Number.isFinite(minutes) ? minutes : 0;

  const date = new Date(2000, 0, 1, safeHours, safeMinutes, 0, 0);
  return new Intl.DateTimeFormat(language === "zh-CN" ? "zh-CN" : "en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatWebsiteDateTime(
  value: string,
  language: WebsiteLanguage
) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(language === "zh-CN" ? "zh-CN" : "en-US", {
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
