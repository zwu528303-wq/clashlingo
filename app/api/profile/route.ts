import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  throw new Error("Missing Supabase environment variables");
}

const authClient = createClient(supabaseUrl, supabaseAnonKey);
const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

function buildFallbackName(email?: string | null) {
  const candidate = email?.split("@")[0]?.trim();
  return candidate ? candidate : "Language Warrior";
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

    const payload = (await req.json()) as {
      displayName?: string;
      email?: string;
    };

    const email = payload.email?.trim() || user.email || null;
    const displayName =
      payload.displayName?.trim() ||
      (typeof user.user_metadata?.display_name === "string"
        ? user.user_metadata.display_name.trim()
        : "") ||
      buildFallbackName(email);

    const { error: upsertError } = await adminClient.from("users").upsert(
      {
        id: user.id,
        email,
        display_name: displayName,
      },
      { onConflict: "id" }
    );

    if (upsertError) {
      return NextResponse.json(
        { error: upsertError.message },
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
