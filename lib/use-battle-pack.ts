"use client";

import { useEffect, useState } from "react";
import { fetchBattlePack } from "@/lib/battle-pack";
import type { EditableProfile } from "@/lib/profile";
import type { BattlePack, StageNumber } from "@/lib/scenario-types";

export type BattlePackStatus = "idle" | "loading" | "ready" | "error";

export interface BattlePackState {
  pack: BattlePack | null;
  status: BattlePackStatus;
}

interface FetchResult {
  key: string;
  pack: BattlePack | null;
  error: boolean;
}

export function useBattlePack(args: {
  scenarioSlug: string | null;
  stage: StageNumber | null;
  profile: EditableProfile | null;
  enabled?: boolean;
}): BattlePackState {
  const { scenarioSlug, stage, profile, enabled = true } = args;
  const targetLanguage = profile?.preferredLanguage;
  const level = profile?.defaultLanguageLevel;

  const requestKey =
    enabled && scenarioSlug && stage && targetLanguage && level
      ? `${scenarioSlug}::${stage}::${targetLanguage}::${level}`
      : null;

  const [result, setResult] = useState<FetchResult | null>(null);

  useEffect(() => {
    if (!requestKey || !scenarioSlug || !stage || !targetLanguage || !level) {
      return;
    }

    let active = true;

    fetchBattlePack({ scenarioSlug, stage, targetLanguage, level })
      .then((pack) => {
        if (active) {
          setResult({ key: requestKey, pack, error: pack === null });
        }
      })
      .catch(() => {
        if (active) {
          setResult({ key: requestKey, pack: null, error: true });
        }
      });

    return () => {
      active = false;
    };
  }, [requestKey, scenarioSlug, stage, targetLanguage, level]);

  if (!requestKey) {
    return { pack: null, status: "idle" };
  }

  if (result?.key !== requestKey) {
    return { pack: null, status: "loading" };
  }

  if (result.error || !result.pack) {
    return { pack: null, status: "error" };
  }

  return { pack: result.pack, status: "ready" };
}
