import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { BATTLE_TEMPLATE_VERSION } from "@/lib/battle-pack";
import {
  buildBattlePackCacheKey,
  getScenarioBySlug,
  isScenarioStageAvailable,
} from "@/lib/scenario-map";
import { isStageNumber, type BattlePack } from "@/lib/scenario-types";
import { normalizeLanguageLevel } from "@/lib/language-level";
import { normalizeSupportedLanguage, resolveDisplayName } from "@/lib/profile";
import {
  buildBattleQuestionOrder,
  evaluateBattleSession,
} from "@/lib/battle-session";
import { evaluateBattleQuestion } from "@/lib/battle-scoring";
import { advanceProgress, type ScenarioProgress } from "@/lib/scenario-progress";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  throw new Error("Missing Supabase environment variables");
}

const authClient = createClient(supabaseUrl, supabaseAnonKey);
const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

interface SubmitPayload {
  sessionId?: string;
  scenarioSlug?: string;
  stage?: number;
  mode?: string;
  targetLanguage?: string;
  level?: string;
  answers?: Record<string, string>;
  timings?: Record<string, number>;
}

interface ProgressRow {
  completed_stages: number[] | null;
  best_accuracy: number | null;
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const accessToken = authHeader?.replace(/^Bearer\s+/i, "");

    if (!accessToken) {
      return NextResponse.json(
        { error: "Missing access token", code: "MISSING_ACCESS_TOKEN" },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser(accessToken);

    if (authError || !user) {
      return NextResponse.json(
        { error: authError?.message || "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const payload = (await req.json()) as SubmitPayload;
    const sessionId = payload.sessionId?.trim();
    const scenarioSlug = String(payload.scenarioSlug ?? "");
    const stageInput = Number(payload.stage);
    const mode = payload.mode === "exam" ? "exam" : "clash";
    const answers = payload.answers ?? {};
    const timings = payload.timings ?? {};

    if (!sessionId || !scenarioSlug || !isStageNumber(stageInput)) {
      return NextResponse.json(
        { error: "Missing or invalid fields", code: "MISSING_FIELDS" },
        { status: 400 }
      );
    }

    const scenario = getScenarioBySlug(scenarioSlug);
    if (!scenario || !isScenarioStageAvailable(scenario, stageInput)) {
      return NextResponse.json(
        { error: "Unknown or unavailable stage", code: "STAGE_UNAVAILABLE" },
        { status: 404 }
      );
    }

    const stage = stageInput;
    const targetLanguage = normalizeSupportedLanguage(payload.targetLanguage);
    const level = normalizeLanguageLevel(payload.level);

    const cacheKey = buildBattlePackCacheKey({
      scenarioSlug: scenario.slug,
      stage,
      targetLanguage,
      level,
      templateVersion: BATTLE_TEMPLATE_VERSION,
    });

    const { data: cached } = await adminClient
      .from("battle_packs")
      .select("pack")
      .eq("cache_key", cacheKey)
      .maybeSingle<{ pack: BattlePack }>();

    if (!cached?.pack) {
      // The pack should already be cached (the client generated it before the
      // run). If not, the client keeps its own fallback report.
      return NextResponse.json(
        { error: "Battle pack is not cached yet", code: "PACK_NOT_CACHED" },
        { status: 409 }
      );
    }

    const pack = cached.pack;
    const questions = buildBattleQuestionOrder(pack);
    const questionResults = questions.map((question) =>
      evaluateBattleQuestion({
        question,
        answer: answers[question.id] ?? "",
        timeSpentSec: Number(timings[question.id] ?? 0),
        rules: pack.rules,
      })
    );

    const { data: publicUser } = await adminClient
      .from("users")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle<{ display_name: string | null }>();

    const playerName = resolveDisplayName(
      publicUser?.display_name,
      typeof user.user_metadata?.display_name === "string"
        ? user.user_metadata.display_name
        : undefined
    );

    const report = evaluateBattleSession({
      sessionId,
      mode,
      scenarioName: scenario.name,
      playerName,
      pack,
      questionResults,
    });

    const accuracyRatio = report.outcome.accuracyRatio;
    const cleared = report.outcome.cleared;

    const { error: reportError } = await adminClient
      .from("scenario_battle_reports")
      .upsert(
        {
          session_id: sessionId,
          user_id: user.id,
          scenario_slug: scenario.slug,
          stage,
          target_language: targetLanguage,
          level,
          mode,
          cleared,
          accuracy_ratio: accuracyRatio,
          report,
        },
        { onConflict: "session_id" }
      );

    if (reportError) {
      return NextResponse.json(
        { error: reportError.message, code: "REPORT_SAVE_FAILED" },
        { status: 500 }
      );
    }

    // Advance progress for this (user, scenario, language, level) scope.
    const { data: existing } = await adminClient
      .from("scenario_progress")
      .select("completed_stages, best_accuracy")
      .eq("user_id", user.id)
      .eq("scenario_slug", scenario.slug)
      .eq("target_language", targetLanguage)
      .eq("level", level)
      .maybeSingle<ProgressRow>();

    const priorCompleted = (existing?.completed_stages ?? []).filter(
      (value): value is 1 | 2 | 3 | 4 => isStageNumber(value)
    );
    const nextProgress: ScenarioProgress = advanceProgress(
      scenario,
      priorCompleted,
      stage,
      cleared
    );
    const bestAccuracy = Math.max(existing?.best_accuracy ?? 0, accuracyRatio);

    const { error: progressError } = await adminClient
      .from("scenario_progress")
      .upsert(
        {
          user_id: user.id,
          scenario_slug: scenario.slug,
          target_language: targetLanguage,
          level,
          completed_stages: nextProgress.completedStages,
          current_stage: nextProgress.currentStage,
          best_accuracy: bestAccuracy,
          last_session_id: sessionId,
          last_cleared_at: cleared ? new Date().toISOString() : undefined,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,scenario_slug,target_language,level" }
      );

    if (progressError) {
      return NextResponse.json(
        { error: progressError.message, code: "PROGRESS_SAVE_FAILED" },
        { status: 500 }
      );
    }

    return NextResponse.json({ report, cleared, accuracyRatio });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: message, code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
