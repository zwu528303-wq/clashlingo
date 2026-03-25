import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Rivalry, Round } from "@/lib/domain-types";
import { getRoundCreationLockState } from "@/lib/round-creation";
import { isRivalryInactive } from "@/lib/rivalry-ledger";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  throw new Error("Missing Supabase environment variables");
}

const authClient = createClient(supabaseUrl, supabaseAnonKey);
const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

interface CreateRoundPayload {
  rivalryId?: string;
  topic?: string;
  studyDays?: number;
  prizeText?: string | null;
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const accessToken = authHeader?.replace(/^Bearer\s+/i, "");

    if (!accessToken) {
      return NextResponse.json(
        { error: "Missing access token" },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser(accessToken);

    if (authError || !user) {
      return NextResponse.json(
        { error: authError?.message || "Unauthorized" },
        { status: 401 }
      );
    }

    const payload = (await req.json()) as CreateRoundPayload;
    const rivalryId = payload.rivalryId;
    const topic = payload.topic?.trim();
    const studyDays =
      typeof payload.studyDays === "number" ? payload.studyDays : null;
    const prizeText = payload.prizeText?.trim() || null;

    if (!rivalryId || !topic || !studyDays) {
      return NextResponse.json(
        { error: "Missing round creation fields" },
        { status: 400 }
      );
    }

    const { data: rivalryData, error: rivalryError } = await adminClient
      .from("rivalries")
      .select(
        "id, player_a_id, player_b_id, player_a_lang, player_b_lang, current_round_num, cumulative_ledger"
      )
      .eq("id", rivalryId)
      .maybeSingle<
        Pick<
          Rivalry,
          | "id"
          | "player_a_id"
          | "player_b_id"
          | "player_a_lang"
          | "player_b_lang"
          | "current_round_num"
          | "cumulative_ledger"
        >
      >();

    if (rivalryError || !rivalryData) {
      return NextResponse.json(
        { error: "Rivalry not found" },
        { status: 404 }
      );
    }

    if (
      rivalryData.player_a_id !== user.id &&
      rivalryData.player_b_id !== user.id
    ) {
      return NextResponse.json(
        { error: "You are not part of this rivalry" },
        { status: 403 }
      );
    }

    if (!rivalryData.player_b_id) {
      return NextResponse.json(
        { error: "This rivalry is still waiting for a rival to join." },
        { status: 409 }
      );
    }

    if (isRivalryInactive(rivalryData.cumulative_ledger)) {
      return NextResponse.json(
        { error: "This rivalry has ended and cannot start new rounds." },
        { status: 409 }
      );
    }

    const { count: activeRoundCount, error: activeRoundError } = await adminClient
      .from("rounds")
      .select("id", { count: "exact", head: true })
      .eq("rivalry_id", rivalryId)
      .neq("status", "completed");

    if (activeRoundError) {
      return NextResponse.json(
        { error: activeRoundError.message },
        { status: 500 }
      );
    }

    if ((activeRoundCount ?? 0) > 0) {
      return NextResponse.json(
        { error: "Finish the active round before starting a new one." },
        { status: 409 }
      );
    }

    const { data: latestRound, error: latestRoundError } = await adminClient
      .from("rounds")
      .select("id, created_at")
      .eq("rivalry_id", rivalryId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<Pick<Round, "id" | "created_at">>();

    if (latestRoundError) {
      return NextResponse.json(
        { error: latestRoundError.message },
        { status: 500 }
      );
    }

    const roundCreationLock = getRoundCreationLockState(latestRound?.created_at);
    if (roundCreationLock.isLocked) {
      return NextResponse.json(
        {
          error:
            "This rivalry already started a round in the last 24 hours.",
          code: "ROUND_CREATION_COOLDOWN",
          latestRoundCreatedAt: latestRound?.created_at ?? null,
          nextAvailableAt: roundCreationLock.nextAvailableAt,
        },
        { status: 409 }
      );
    }

    const newRoundNumber = rivalryData.current_round_num + 1;
    const targetLang =
      newRoundNumber % 2 === 1
        ? rivalryData.player_a_lang
        : rivalryData.player_b_lang || rivalryData.player_a_lang;

    const { data: round, error: roundError } = await adminClient
      .from("rounds")
      .insert({
        rivalry_id: rivalryId,
        round_number: newRoundNumber,
        target_lang: targetLang,
        topic,
        study_days: studyDays,
        prize_text: prizeText,
        status: "topic_selection",
      })
      .select()
      .single<Round>();

    if (roundError || !round) {
      return NextResponse.json(
        { error: roundError?.message || "Failed to create round." },
        { status: 500 }
      );
    }

    const { error: updateRivalryError } = await adminClient
      .from("rivalries")
      .update({ current_round_num: newRoundNumber })
      .eq("id", rivalryId);

    if (updateRivalryError) {
      await adminClient.from("rounds").delete().eq("id", round.id);

      return NextResponse.json(
        { error: updateRivalryError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ round });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
