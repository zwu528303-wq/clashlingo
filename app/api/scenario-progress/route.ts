import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { normalizeLanguageLevel } from "@/lib/language-level";
import { normalizeSupportedLanguage } from "@/lib/profile";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  throw new Error("Missing Supabase environment variables");
}

const authClient = createClient(supabaseUrl, supabaseAnonKey);
const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

interface ProgressRow {
  scenario_slug: string;
  completed_stages: number[] | null;
  current_stage: number | null;
}

export async function GET(req: NextRequest) {
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

    const targetLanguage = normalizeSupportedLanguage(
      req.nextUrl.searchParams.get("targetLanguage")
    );
    const level = normalizeLanguageLevel(req.nextUrl.searchParams.get("level"));

    const { data, error } = await adminClient
      .from("scenario_progress")
      .select("scenario_slug, completed_stages, current_stage")
      .eq("user_id", user.id)
      .eq("target_language", targetLanguage)
      .eq("level", level)
      .returns<ProgressRow[]>();

    if (error) {
      return NextResponse.json(
        { error: error.message, code: "PROGRESS_LOOKUP_FAILED" },
        { status: 500 }
      );
    }

    return NextResponse.json({ progress: data ?? [] });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: message, code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
