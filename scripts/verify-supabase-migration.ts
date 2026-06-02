/**
 * Read-only Supabase migration verification.
 *
 * Loads .env.local by default, validates the Supabase host/key pairing, checks
 * Auth and public table counts with the service role, and reports orphaned
 * public references. It never prints keys and never writes to Supabase.
 *
 * Examples:
 *   npm run verify:supabase-migration -- --expected-host=bwwghdhwhxuqqepgpizb.supabase.co
 *   npm run verify:supabase-migration -- --expected-host=bwwghdhwhxuqqepgpizb.supabase.co --require-data
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";

type PublicTable<Row extends Record<string, unknown>> = {
  Row: Row;
  Insert: never;
  Update: never;
  Relationships: [];
};

interface MigrationDatabase {
  public: {
    Tables: {
      users: PublicTable<{ id: string }>;
      rivalries: PublicTable<{
        player_a_id: string;
        player_b_id: string | null;
      }>;
      rounds: PublicTable<Record<string, unknown>>;
      exams: PublicTable<Record<string, unknown>>;
      submissions: PublicTable<Record<string, unknown>>;
      battle_packs: PublicTable<Record<string, unknown>>;
      scenario_progress: PublicTable<Record<string, unknown>>;
      scenario_battle_reports: PublicTable<Record<string, unknown>>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

type MigrationClient = SupabaseClient<MigrationDatabase>;
type PublicTableName = keyof MigrationDatabase["public"]["Tables"] & string;

interface CliOptions {
  envFile: string | null;
  expectedHost: string | null;
  requireData: boolean;
}

interface AuthUserSummary {
  id: string;
}

interface RivalryRefs {
  player_a_id: string;
  player_b_id: string | null;
}

const DEFAULT_ENV_FILE = ".env.local";
const EXPECTED_TABLES: PublicTableName[] = [
  "users",
  "rivalries",
  "rounds",
  "exams",
  "submissions",
  "battle_packs",
  "scenario_progress",
  "scenario_battle_reports",
];

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    envFile: DEFAULT_ENV_FILE,
    expectedHost: null,
    requireData: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--require-data") {
      options.requireData = true;
      continue;
    }

    if (arg === "--no-env-file") {
      options.envFile = null;
      continue;
    }

    if (arg === "--env-file") {
      const value = argv[index + 1];
      if (!value) {
        throw new Error("--env-file requires a path");
      }
      options.envFile = value;
      index += 1;
      continue;
    }

    if (arg.startsWith("--env-file=")) {
      options.envFile = arg.slice("--env-file=".length);
      continue;
    }

    if (arg === "--expected-host") {
      const value = argv[index + 1];
      if (!value) {
        throw new Error("--expected-host requires a host");
      }
      options.expectedHost = normalizeHost(value);
      index += 1;
      continue;
    }

    if (arg.startsWith("--expected-host=")) {
      options.expectedHost = normalizeHost(arg.slice("--expected-host=".length));
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function loadEnvFile(path: string | null): void {
  if (!path || !existsSync(path)) {
    return;
  }

  const text = readFileSync(path, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) {
      continue;
    }

    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) {
      continue;
    }

    process.env[key] = stripQuotes(rawValue.trim());
  }
}

function stripQuotes(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function normalizeHost(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return trimmed;
  }

  try {
    return new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`)
      .host;
  } catch {
    return trimmed.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const [, payload] = token.split(".");
  if (!payload) {
    return null;
  }

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "="
    );
    return JSON.parse(Buffer.from(padded, "base64").toString("utf8")) as Record<
      string,
      unknown
    >;
  } catch {
    return null;
  }
}

function projectRefFromHost(host: string): string | null {
  return host.endsWith(".supabase.co") ? host.slice(0, -".supabase.co".length) : null;
}

async function countRows(
  client: MigrationClient,
  table: PublicTableName
): Promise<number> {
  const { count, error } = await client
    .from(table)
    .select("*", { count: "exact", head: true });

  if (error) {
    throw new Error(`${table}: ${error.message}`);
  }

  return count ?? 0;
}

async function listAuthUsers(
  client: MigrationClient
): Promise<AuthUserSummary[]> {
  const users: AuthUserSummary[] = [];
  const perPage = 1000;

  for (let page = 1; ; page += 1) {
    const { data, error } = await client.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw new Error(`auth.admin.listUsers: ${error.message}`);
    }

    const pageUsers = data.users.map((user) => ({ id: user.id }));
    users.push(...pageUsers);

    if (pageUsers.length < perPage) {
      break;
    }
  }

  return users;
}

async function listPublicUserIds(
  client: MigrationClient
): Promise<string[]> {
  const { data, error } = await client.from("users").select("id");
  if (error) {
    throw new Error(`users ids: ${error.message}`);
  }

  const rows = (data ?? []) as { id: string }[];
  return rows.map((row) => row.id);
}

async function listRivalryRefs(
  client: MigrationClient
): Promise<RivalryRefs[]> {
  const { data, error } = await client
    .from("rivalries")
    .select("player_a_id, player_b_id");

  if (error) {
    throw new Error(`rivalries refs: ${error.message}`);
  }

  return (data ?? []) as RivalryRefs[];
}

function assertJwtProject(
  label: string,
  key: string,
  hostRef: string | null,
  expectedRole: "anon" | "service_role" | null
): string[] {
  const warnings: string[] = [];
  const payload = decodeJwtPayload(key);

  if (!payload) {
    warnings.push(`${label} is not a legacy JWT key; project ref not decoded`);
    return warnings;
  }

  if (hostRef && payload.ref !== hostRef) {
    throw new Error(`${label} key ref does not match Supabase URL host`);
  }

  if (expectedRole && payload.role !== expectedRole) {
    throw new Error(`${label} key role is not ${expectedRole}`);
  }

  return warnings;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  loadEnvFile(options.envFile);

  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  const host = normalizeHost(supabaseUrl);
  const hostRef = projectRefFromHost(host);
  const warnings: string[] = [];

  if (options.expectedHost && host !== options.expectedHost) {
    throw new Error(
      `Supabase host mismatch: expected ${options.expectedHost}, got ${host}`
    );
  }

  warnings.push(
    ...assertJwtProject(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      anonKey,
      hostRef,
      "anon"
    )
  );
  warnings.push(
    ...assertJwtProject(
      "SUPABASE_SERVICE_ROLE_KEY",
      serviceRoleKey,
      hostRef,
      "service_role"
    )
  );

  const serviceClient = createClient<MigrationDatabase>(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  const authUsers = await listAuthUsers(serviceClient);
  const authUserIds = new Set(authUsers.map((user) => user.id));
  const tableCounts: Record<string, number> = {};

  for (const table of EXPECTED_TABLES) {
    tableCounts[table] = await countRows(serviceClient, table);
  }

  const publicUserIds = await listPublicUserIds(serviceClient);
  const publicUsersMissingAuth = publicUserIds.filter(
    (id) => !authUserIds.has(id)
  ).length;
  const rivalryRefs = await listRivalryRefs(serviceClient);
  const rivalryRefsMissingAuth = rivalryRefs.filter((ref) => {
    return (
      !authUserIds.has(ref.player_a_id) ||
      (ref.player_b_id !== null && !authUserIds.has(ref.player_b_id))
    );
  }).length;

  const allPublicRows = Object.values(tableCounts).reduce(
    (total, count) => total + count,
    0
  );
  if (options.requireData && authUsers.length === 0 && allPublicRows === 0) {
    throw new Error("No Auth users or public rows found, but --require-data was set");
  }

  if (publicUsersMissingAuth > 0 || rivalryRefsMissingAuth > 0) {
    throw new Error(
      `Missing auth references: public_users=${publicUsersMissingAuth}, rivalries=${rivalryRefsMissingAuth}`
    );
  }

  console.log(`Supabase host: ${host}`);
  console.log(`Auth users: ${authUsers.length}`);
  for (const table of EXPECTED_TABLES) {
    console.log(`${table}: ${tableCounts[table]}`);
  }
  console.log(`public_users_missing_auth: ${publicUsersMissingAuth}`);
  console.log(`rivalry_refs_missing_auth: ${rivalryRefsMissingAuth}`);

  if (authUsers.length === 0 && allPublicRows === 0) {
    warnings.push("database is empty; this is only launch-ready if a fresh start is intended");
  }

  for (const warning of warnings) {
    console.warn(`warning: ${warning}`);
  }

  console.log("Supabase migration verification passed");
}

main().catch((error) => {
  console.error(`Supabase migration verification failed: ${(error as Error).message}`);
  process.exitCode = 1;
});
