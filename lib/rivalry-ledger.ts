import type { RivalryLedger } from "@/lib/domain-types";
import { DEFAULT_WEEKLY_MATCH_TIME, normalizeWeeklyMatchTime } from "@/lib/profile";

export function getSharedWeeklyMatchTime(
  ledger: RivalryLedger | null | undefined,
  fallback = DEFAULT_WEEKLY_MATCH_TIME
) {
  const rawValue = ledger?.shared_weekly_time;
  if (typeof rawValue === "string" && /^\d{2}:\d{2}$/.test(rawValue)) {
    return rawValue;
  }

  return normalizeWeeklyMatchTime(fallback);
}

export function setSharedWeeklyMatchTime(
  ledger: RivalryLedger | null | undefined,
  weeklyTime: string
): RivalryLedger {
  return {
    ...(ledger ?? {}),
    shared_weekly_time: normalizeWeeklyMatchTime(weeklyTime),
  };
}
