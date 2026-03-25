import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Rivalry, RivalryLedger } from "@/lib/domain-types";
import {
  isRivalryInactive,
  setRivalryInactive,
} from "@/lib/rivalry-ledger";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  throw new Error("Missing Supabase environment variables");
}

const authClient = createClient(supabaseUrl, supabaseAnonKey);
const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

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

    const payload = (await req.json()) as { rivalryId?: string };
    if (!payload.rivalryId) {
      return NextResponse.json(
        { error: "Missing rivalryId" },
        { status: 400 }
      );
    }

    const { data: rivalryData, error: rivalryError } = await adminClient
      .from("rivalries")
      .select("id, player_a_id, player_b_id, cumulative_ledger")
      .eq("id", payload.rivalryId)
      .maybeSingle<
        Pick<Rivalry, "id" | "player_a_id" | "player_b_id" | "cumulative_ledger">
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

    const currentLedger = (rivalryData.cumulative_ledger ?? {}) as RivalryLedger;
    if (isRivalryInactive(currentLedger)) {
      return NextResponse.json({ success: true });
    }

    const { count: activeRoundCount, error: activeRoundError } = await adminClient
      .from("rounds")
      .select("id", { count: "exact", head: true })
      .eq("rivalry_id", payload.rivalryId)
      .neq("status", "completed");

    if (activeRoundError) {
      return NextResponse.json(
        { error: activeRoundError.message },
        { status: 500 }
      );
    }

    if ((activeRoundCount ?? 0) > 0) {
      return NextResponse.json(
        { error: "Finish the active round before leaving this rivalry." },
        { status: 409 }
      );
    }

    const { error: updateError } = await adminClient
      .from("rivalries")
      .update({
        cumulative_ledger: setRivalryInactive(currentLedger, user.id),
      })
      .eq("id", payload.rivalryId);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
