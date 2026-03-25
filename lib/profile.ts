import type { User } from "@supabase/supabase-js";
import {
  DEFAULT_WEBSITE_LANGUAGE,
  normalizeWebsiteLanguage,
  type WebsiteLanguage,
} from "@/lib/i18n";
import {
  DEFAULT_LANGUAGE_LEVEL,
  type LanguageLevel,
  normalizeLanguageLevel,
} from "@/lib/language-level";

export const SUPPORTED_LANGUAGES = [
  "French",
  "Spanish",
  "Japanese",
  "Korean",
  "Chinese",
  "English",
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export interface AvatarTheme {
  id: string;
  label: string;
  swatchClassName: string;
  avatarClassName: string;
  softClassName: string;
}

export interface PublicIdentityProfile {
  displayName: string;
  avatarLetter: string;
  avatarColor: string;
}

export const AVATAR_THEMES: AvatarTheme[] = [
  {
    id: "rose",
    label: "Rose",
    swatchClassName: "bg-primary",
    avatarClassName: "bg-primary text-on-primary",
    softClassName: "bg-primary-container text-on-primary-container",
  },
  {
    id: "mint",
    label: "Mint",
    swatchClassName: "bg-secondary",
    avatarClassName: "bg-secondary text-on-secondary",
    softClassName: "bg-secondary-container text-on-secondary-container",
  },
  {
    id: "gold",
    label: "Gold",
    swatchClassName: "bg-tertiary",
    avatarClassName: "bg-tertiary text-on-tertiary",
    softClassName: "bg-tertiary-container text-on-tertiary-container",
  },
  {
    id: "ink",
    label: "Ink",
    swatchClassName: "bg-on-surface",
    avatarClassName: "bg-on-surface text-surface",
    softClassName: "bg-surface-container-high text-on-surface",
  },
];

export const DEFAULT_WEEKLY_MATCH_TIME = "19:00";
export const DEFAULT_AVATAR_THEME_ID = AVATAR_THEMES[0].id;
export const DEFAULT_LANGUAGE: SupportedLanguage = SUPPORTED_LANGUAGES[0];
const PUBLIC_AVATAR_PREFIX = "clashlingo-avatar:";
export { DEFAULT_WEBSITE_LANGUAGE };

export interface EditableProfile {
  displayName: string;
  avatarLetter: string;
  avatarColor: string;
  preferredLanguage: SupportedLanguage;
  defaultLanguageLevel: LanguageLevel;
  weeklyMatchTime: string;
  websiteLanguage: WebsiteLanguage;
  email: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function buildFallbackName(
  fallback = "Language Warrior"
) {
  return fallback;
}

export function looksLikeEmail(value?: string | null) {
  if (typeof value !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function resolveDisplayName(
  value: unknown,
  fallback = "Language Warrior"
) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed && !looksLikeEmail(trimmed)) {
      return trimmed;
    }
  }

  return fallback;
}

export function getDisplayInitial(value?: string, fallback = "L") {
  const cleaned = value?.trim();
  if (!cleaned) return fallback;
  return cleaned.charAt(0).toUpperCase();
}

export function normalizeSupportedLanguage(value: unknown): SupportedLanguage {
  if (
    typeof value === "string" &&
    SUPPORTED_LANGUAGES.includes(value as SupportedLanguage)
  ) {
    return value as SupportedLanguage;
  }
  return DEFAULT_LANGUAGE;
}

export function normalizeAvatarThemeId(value: unknown) {
  if (
    typeof value === "string" &&
    AVATAR_THEMES.some((theme) => theme.id === value)
  ) {
    return value;
  }
  return DEFAULT_AVATAR_THEME_ID;
}

export function normalizeWeeklyMatchTime(value: unknown) {
  if (typeof value === "string" && /^\d{2}:\d{2}$/.test(value)) {
    return value;
  }
  return DEFAULT_WEEKLY_MATCH_TIME;
}

export function normalizeAvatarLetter(
  value: unknown,
  displayName: string
) {
  if (typeof value === "string" && value.trim()) {
    return value.trim().charAt(0).toUpperCase();
  }
  return getDisplayInitial(displayName, "L");
}

export function getAvatarTheme(themeId?: string) {
  return (
    AVATAR_THEMES.find((theme) => theme.id === themeId) ?? AVATAR_THEMES[0]
  );
}

export function serializePublicAvatarValue(
  avatarLetter: unknown,
  avatarColor: unknown,
  displayName: string
) {
  const normalizedLetter = normalizeAvatarLetter(avatarLetter, displayName);
  const normalizedColor = normalizeAvatarThemeId(avatarColor);

  return `${PUBLIC_AVATAR_PREFIX}${normalizedColor}:${normalizedLetter}`;
}

export function parsePublicAvatarValue(
  value: unknown,
  displayName: string
) {
  if (typeof value === "string" && value.startsWith(PUBLIC_AVATAR_PREFIX)) {
    const payload = value.slice(PUBLIC_AVATAR_PREFIX.length);
    const [themeId, letter] = payload.split(":");

    return {
      avatarLetter: normalizeAvatarLetter(letter, displayName),
      avatarColor: normalizeAvatarThemeId(themeId),
    };
  }

  return {
    avatarLetter: getDisplayInitial(displayName, "L"),
    avatarColor: DEFAULT_AVATAR_THEME_ID,
  };
}

export function getStableAvatarTheme(seed?: string | null) {
  if (!seed) return AVATAR_THEMES[0];

  const index =
    Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0) %
    AVATAR_THEMES.length;

  return AVATAR_THEMES[index];
}

export function getEditableProfileFromUser(user: User): EditableProfile {
  const metadata = isRecord(user.user_metadata) ? user.user_metadata : {};
  const email = user.email ?? "";
  const displayNameCandidate = resolveDisplayName(
    metadata.display_name,
    buildFallbackName()
  );

  return {
    displayName: displayNameCandidate,
    avatarLetter: normalizeAvatarLetter(
      metadata.avatar_letter,
      displayNameCandidate
    ),
    avatarColor: normalizeAvatarThemeId(metadata.avatar_color),
    preferredLanguage: normalizeSupportedLanguage(metadata.preferred_language),
    defaultLanguageLevel: normalizeLanguageLevel(
      metadata.default_language_level
    ),
    weeklyMatchTime: normalizeWeeklyMatchTime(metadata.weekly_match_time),
    websiteLanguage: normalizeWebsiteLanguage(metadata.website_language),
    email,
  };
}

export { DEFAULT_LANGUAGE_LEVEL };
