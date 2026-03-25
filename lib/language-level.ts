import type { Rivalry } from "@/lib/domain-types";

export const LANGUAGE_LEVELS = [
  "Beginner",
  "Elementary",
  "Intermediate",
  "Advanced",
] as const;

export type LanguageLevel = (typeof LANGUAGE_LEVELS)[number];

export const DEFAULT_LANGUAGE_LEVEL: LanguageLevel = LANGUAGE_LEVELS[0];

const LANGUAGE_LEVEL_RANK: Record<LanguageLevel, number> = {
  Beginner: 0,
  Elementary: 1,
  Intermediate: 2,
  Advanced: 3,
};

export function normalizeLanguageLevel(value: unknown): LanguageLevel {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    const matchedLevel = LANGUAGE_LEVELS.find(
      (level) => level.toLowerCase() === normalized
    );

    if (matchedLevel) {
      return matchedLevel;
    }
  }

  return DEFAULT_LANGUAGE_LEVEL;
}

export function getLowerLanguageLevel(
  first: unknown,
  second: unknown
): LanguageLevel {
  const firstLevel = normalizeLanguageLevel(first);
  const secondLevel = normalizeLanguageLevel(second);

  return LANGUAGE_LEVEL_RANK[firstLevel] <= LANGUAGE_LEVEL_RANK[secondLevel]
    ? firstLevel
    : secondLevel;
}

export function resolveRoundLanguageLevel(
  rivalry:
    | Pick<
        Rivalry,
        | "player_a_lang"
        | "player_b_lang"
        | "player_a_difficulty"
        | "player_b_difficulty"
      >
    | null
    | undefined,
  targetLanguage: string | null | undefined
): LanguageLevel {
  if (!rivalry) {
    return DEFAULT_LANGUAGE_LEVEL;
  }

  const playerALevel = normalizeLanguageLevel(rivalry.player_a_difficulty);
  const playerBLevel = normalizeLanguageLevel(rivalry.player_b_difficulty);

  if (!targetLanguage) {
    return getLowerLanguageLevel(playerALevel, playerBLevel);
  }

  const matchesPlayerA = rivalry.player_a_lang === targetLanguage;
  const matchesPlayerB = rivalry.player_b_lang === targetLanguage;

  if (matchesPlayerA && matchesPlayerB) {
    return getLowerLanguageLevel(playerALevel, playerBLevel);
  }

  if (matchesPlayerA) {
    return playerALevel;
  }

  if (matchesPlayerB) {
    return playerBLevel;
  }

  return getLowerLanguageLevel(playerALevel, playerBLevel);
}
