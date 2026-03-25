export const ROUND_CREATION_COOLDOWN_HOURS = 24;
export const ROUND_CREATION_COOLDOWN_MS =
  ROUND_CREATION_COOLDOWN_HOURS * 60 * 60 * 1000;

export interface RoundCreationLockState {
  isLocked: boolean;
  nextAvailableAt: string | null;
  remainingMs: number;
}

export function getRoundCreationLockState(
  latestRoundCreatedAt: string | null | undefined,
  now = new Date()
): RoundCreationLockState {
  if (!latestRoundCreatedAt) {
    return {
      isLocked: false,
      nextAvailableAt: null,
      remainingMs: 0,
    };
  }

  const latestCreatedAtMs = Date.parse(latestRoundCreatedAt);
  if (Number.isNaN(latestCreatedAtMs)) {
    return {
      isLocked: false,
      nextAvailableAt: null,
      remainingMs: 0,
    };
  }

  const nextAvailableAtMs = latestCreatedAtMs + ROUND_CREATION_COOLDOWN_MS;
  const remainingMs = Math.max(0, nextAvailableAtMs - now.getTime());

  return {
    isLocked: remainingMs > 0,
    nextAvailableAt: new Date(nextAvailableAtMs).toISOString(),
    remainingMs,
  };
}
