/**
 * Pre-generate battle packs for every full-launch scenario.
 *
 * Coverage: full scenarios × their open stages × {French, English, Spanish}
 * × all four levels. Each combo is POSTed to /api/generate-battle-pack on a
 * running server; the route checks the battle_packs cache first and only calls
 * Anthropic (and upserts) on a miss, so re-running this script is cheap and
 * idempotent.
 *
 * Run AFTER the battle_packs migration is applied and the dev server is up:
 *
 *   npm run dev                       # in one terminal
 *   npm run seed:battle-packs         # in another (real generation, costs $)
 *   npm run seed:battle-packs -- --dry-run   # just print the plan
 *
 * Env:
 *   SEED_BASE_URL   base URL of the running app (default http://localhost:3000)
 *   SEED_DELAY_MS   pause between requests, ms (default 750)
 *
 * Node 24 strips the TypeScript types natively; scenario-map.ts uses only
 * type-only imports, so it loads here without the "@/" path alias.
 */
// @ts-expect-error -- Node 24 runs this script directly and needs .ts imports.
import { SCENARIOS } from "../lib/scenario-map.ts";
// @ts-expect-error -- Node 24 runs this script directly and needs .ts imports.
import { LANGUAGE_LEVELS } from "../lib/language-level.ts";

const BASE_URL = process.env.SEED_BASE_URL ?? "http://localhost:3000";
const DELAY_MS = Number(process.env.SEED_DELAY_MS ?? 750);

// User-confirmed slimmed coverage: French / English / Spanish only.
const TARGET_LANGUAGES = ["French", "English", "Spanish"] as const;

interface CliOptions {
  dryRun: boolean;
  limit: number | null;
  onlySlug: string | null;
}

interface Job {
  scenarioSlug: string;
  scenarioName: string;
  stage: number;
  targetLanguage: string;
  level: string;
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    dryRun: false,
    limit: null,
    onlySlug: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg === "--limit") {
      const rawLimit = argv[index + 1];
      const parsedLimit = Number(rawLimit);
      if (
        !rawLimit ||
        !Number.isInteger(parsedLimit) ||
        parsedLimit < 0
      ) {
        throw new Error("--limit requires a non-negative integer");
      }
      options.limit = parsedLimit;
      index += 1;
      continue;
    }

    if (arg.startsWith("--limit=")) {
      const rawLimit = arg.slice("--limit=".length);
      const parsedLimit = Number(rawLimit);
      if (!Number.isInteger(parsedLimit) || parsedLimit < 0) {
        throw new Error("--limit requires a non-negative integer");
      }
      options.limit = parsedLimit;
      continue;
    }

    if (arg === "--only") {
      const onlySlug = argv[index + 1];
      if (!onlySlug) {
        throw new Error("--only requires a scenario slug");
      }
      options.onlySlug = onlySlug;
      index += 1;
      continue;
    }

    if (arg.startsWith("--only=")) {
      const onlySlug = arg.slice("--only=".length);
      if (!onlySlug) {
        throw new Error("--only requires a scenario slug");
      }
      options.onlySlug = onlySlug;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function getFullScenarios() {
  return SCENARIOS.filter((scenario) => scenario.launchStatus === "full");
}

function getFullScenarioSlugs() {
  return getFullScenarios().map((scenario) => scenario.slug);
}

function buildJobs(options: CliOptions): Job[] {
  const jobs: Job[] = [];
  let fullScenarios = getFullScenarios();

  if (options.onlySlug) {
    const matchingScenario = SCENARIOS.find(
      (scenario) => scenario.slug === options.onlySlug
    );

    if (!matchingScenario) {
      throw new Error(
        `Unknown scenario slug "${options.onlySlug}". Available full scenario slugs: ${getFullScenarioSlugs().join(", ")}`
      );
    }

    if (matchingScenario.launchStatus !== "full") {
      throw new Error(
        `Scenario "${options.onlySlug}" is not full-launch. Available full scenario slugs: ${getFullScenarioSlugs().join(", ")}`
      );
    }

    fullScenarios = [matchingScenario];
  }

  for (const scenario of fullScenarios) {
    for (const stage of scenario.availableStages) {
      for (const targetLanguage of TARGET_LANGUAGES) {
        for (const level of LANGUAGE_LEVELS) {
          jobs.push({
            scenarioSlug: scenario.slug,
            scenarioName: scenario.name.en,
            stage,
            targetLanguage,
            level,
          });
        }
      }
    }
  }

  return options.limit === null ? jobs : jobs.slice(0, options.limit);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runJob(
  job: Job
): Promise<"cached" | "generated" | "failed"> {
  try {
    const res = await fetch(`${BASE_URL}/api/generate-battle-pack`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scenarioSlug: job.scenarioSlug,
        stage: job.stage,
        targetLanguage: job.targetLanguage,
        level: job.level,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(
        `  ✗ ${describe(job)} -> HTTP ${res.status} ${body.slice(0, 160)}`
      );
      return "failed";
    }

    const data = (await res.json()) as { cached?: boolean };
    return data.cached ? "cached" : "generated";
  } catch (error) {
    console.error(`  ✗ ${describe(job)} -> ${(error as Error).message}`);
    return "failed";
  }
}

function describe(job: Job): string {
  return `${job.scenarioSlug} s${job.stage} ${job.targetLanguage}/${job.level}`;
}

async function main() {
  let options: CliOptions;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error((error as Error).message);
    process.exitCode = 1;
    return;
  }

  let jobs: Job[];
  try {
    jobs = buildJobs(options);
  } catch (error) {
    console.error((error as Error).message);
    process.exitCode = 1;
    return;
  }

  console.log(
    `Battle-pack seed plan: ${jobs.length} packs ` +
      `(${TARGET_LANGUAGES.length} languages × ${LANGUAGE_LEVELS.length} levels ` +
      `× full scenario-stages)`
  );
  console.log(`Target: ${BASE_URL}`);

  if (options.dryRun) {
    for (const job of jobs) {
      console.log(`  • ${describe(job)}`);
    }
    console.log("\nDry run only — no requests sent.");
    return;
  }

  let cached = 0;
  let generated = 0;
  const failures: Job[] = [];

  for (let i = 0; i < jobs.length; i += 1) {
    const job = jobs[i];
    process.stdout.write(`[${i + 1}/${jobs.length}] ${describe(job)} ... `);
    const result = await runJob(job);

    if (result === "cached") {
      cached += 1;
      console.log("cached");
    } else if (result === "generated") {
      generated += 1;
      console.log("generated");
    } else {
      failures.push(job);
    }

    if (i < jobs.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  console.log(
    `\nDone. generated=${generated} cached=${cached} failed=${failures.length}`
  );

  if (failures.length > 0) {
    console.log("Failed combos (re-run to retry — cached ones are skipped):");
    for (const job of failures) {
      console.log(`  - ${describe(job)}`);
    }
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
