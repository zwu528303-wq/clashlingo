import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import {
  assembleBattlePack,
  BATTLE_TEMPLATE_VERSION,
  isCurrentBattlePack,
  STAGE_RULES,
  validateBattleContent,
} from "@/lib/battle-pack";
import {
  buildBattlePackCacheKey,
  getScenarioBySlug,
  getStageDefinition,
  isScenarioStageAvailable,
  SCENARIO_TEMPLATE_LABELS,
} from "@/lib/scenario-map";
import {
  getLocalizedText,
  isStageNumber,
  type BattlePack,
} from "@/lib/scenario-types";
import { normalizeLanguageLevel } from "@/lib/language-level";
import { normalizeSupportedLanguage } from "@/lib/profile";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const LEVEL_GUIDANCE = `LEVEL GUIDANCE:
- Beginner: keep wording direct, highly scaffolded, and strictly inside the explicit scope words and patterns
- Elementary: allow small phrasing variations, but keep sentence frames practical and predictable
- Intermediate: use broader sentence patterns and a bit more transfer across vocabulary and expressions
- Advanced: use the most natural phrasing, denser grammar choices, and less obvious recall, while staying inside the scope`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const scenarioSlug = String(body?.scenarioSlug ?? "");
    const stageInput = Number(body?.stage);

    if (!scenarioSlug || !isStageNumber(stageInput)) {
      return NextResponse.json(
        { error: "Missing scenarioSlug or stage", code: "MISSING_FIELDS" },
        { status: 400 }
      );
    }

    const scenario = getScenarioBySlug(scenarioSlug);
    const stageDefinition = getStageDefinition(stageInput);
    if (!scenario || !stageDefinition) {
      return NextResponse.json(
        { error: "Unknown scenario or stage", code: "SCENARIO_NOT_FOUND" },
        { status: 404 }
      );
    }

    if (!isScenarioStageAvailable(scenario, stageInput)) {
      return NextResponse.json(
        { error: "Stage is not available yet", code: "STAGE_UNAVAILABLE" },
        { status: 409 }
      );
    }

    const stage = stageInput;
    const targetLanguage = normalizeSupportedLanguage(body?.targetLanguage);
    const level = normalizeLanguageLevel(body?.level);
    const rules = STAGE_RULES[stage];

    const cacheKey = buildBattlePackCacheKey({
      scenarioSlug: scenario.slug,
      stage,
      targetLanguage,
      level,
      templateVersion: BATTLE_TEMPLATE_VERSION,
    });

    const { data: cached } = await supabase
      .from("battle_packs")
      .select("pack")
      .eq("cache_key", cacheKey)
      .maybeSingle<{ pack: BattlePack }>();

    if (isCurrentBattlePack(cached?.pack)) {
      return NextResponse.json({ pack: cached.pack, cached: true });
    }

    const scenarioName = getLocalizedText(scenario.name, "en");
    const scenarioSummary = getLocalizedText(scenario.summary, "en");
    const templateLabel = getLocalizedText(
      SCENARIO_TEMPLATE_LABELS[scenario.template],
      "en"
    );
    const stageGoals = stageDefinition.goals
      .map((goal) => `- ${getLocalizedText(goal, "en")}`)
      .join("\n");
    const quickCount = rules.quickQuestionCount;
    const freeCount = rules.freeResponseCount;
    const totalCount = rules.battleQuestionCount;

    const prompt = `You are a battle-pack generator for ClashLingo, a competitive language-learning app. Players fight short, timed "scenario battles": they read a prompt and must answer fast and correctly in the TARGET LANGUAGE.

Generate ONE battle pack for this scenario and stage.

SCENARIO: ${scenarioName} (${templateLabel})
SCENARIO SUMMARY: ${scenarioSummary}
STAGE ${stage} — ${stageDefinition.name.toUpperCase()}: ${getLocalizedText(stageDefinition.summary, "en")}
STAGE GOALS:
${stageGoals}

TARGET LANGUAGE (what the learner produces): ${targetLanguage}
LEVEL: ${level}

${LEVEL_GUIDANCE}

QUESTION REQUIREMENTS:
- Produce EXACTLY ${totalCount} questions, already ordered as they should appear in the battle.
- Of those, EXACTLY ${freeCount} must be "short_free_response" and ${quickCount} must be quick questions.
- Quick questions should be a roughly even mix of "multiple_choice" and "fill_blank".
- Start with easier quick questions and build toward the free-response questions.
- Every question must stay inside this scenario and stage; harder stages mean faster, more natural, less scaffolded prompts.
- Each question needs 1-3 lowercase snake_case "skillTags" (e.g. "ordering", "politeness", "follow_up").

QUESTION TYPE RULES:
- multiple_choice: 2-4 options, exactly one correct. "correctOption" is the matching option "id".
- fill_blank: prompt contains a single "___" blank. "expectedKeywords" are the acceptable fill-ins; "modelAnswers" are full example answers. Both in the TARGET LANGUAGE.
- short_free_response: an open instruction. "expectedKeywords" are the must-hit words/phrases; "modelAnswers" are 1-2 strong example answers. Both in the TARGET LANGUAGE.

LOCALIZATION RULES:
- Every "prompt" and every multiple_choice option "text" must be an object with BOTH "en" and "zh-CN" (Simplified Chinese) keys. These are interface instructions, not the learner's answer.
- "expectedKeywords", "modelAnswers", scope "grammar", scope "expressions", and vocabulary "words" must all be written in the TARGET LANGUAGE (${targetLanguage}).
- "scope.summary", "scope.canDo", "scope.howTested", and vocabulary group "label" must be bilingual { "en", "zh-CN" } objects.
- "scope.followUpTypes" and question "skillTags" are short lowercase snake_case tags (English).
- "aiReactions" are short trash-talk / coaching lines shown to the player, written in English.

Return ONLY valid JSON with exactly this shape, no markdown, no backticks, no commentary:
{
  "scope": {
    "summary": { "en": "...", "zh-CN": "..." },
    "canDo": [ { "en": "...", "zh-CN": "..." } ],
    "vocabularyGroups": [
      { "id": "drinks", "label": { "en": "...", "zh-CN": "..." }, "words": ["...", "..."] }
    ],
    "grammar": ["target-language grammar pattern", "..."],
    "expressions": ["target-language set expression", "..."],
    "followUpTypes": ["size", "to_go"],
    "howTested": [ { "en": "...", "zh-CN": "..." } ]
  },
  "candidateQuestions": [
    {
      "type": "multiple_choice",
      "prompt": { "en": "...", "zh-CN": "..." },
      "options": [ { "id": "a", "text": { "en": "...", "zh-CN": "..." } } ],
      "correctOption": "a",
      "skillTags": ["ordering"]
    },
    {
      "type": "fill_blank",
      "prompt": { "en": "... ___ ...", "zh-CN": "...___..." },
      "expectedKeywords": ["target-language word"],
      "modelAnswers": ["full target-language answer"],
      "skillTags": ["ordering"]
    },
    {
      "type": "short_free_response",
      "prompt": { "en": "...", "zh-CN": "..." },
      "expectedKeywords": ["target-language word"],
      "modelAnswers": ["full target-language answer"],
      "skillTags": ["ordering"]
    }
  ],
  "aiReactions": {
    "start": ["..."],
    "during": ["..."],
    "win": ["..."],
    "lose": ["..."]
  }
}`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "No text response", code: "AI_NO_TEXT" },
        { status: 500 }
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(textBlock.text);
    } catch {
      const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return NextResponse.json(
          {
            error: "Failed to parse battle pack JSON",
            code: "PACK_PARSE_FAILED",
            raw: textBlock.text,
          },
          { status: 500 }
        );
      }
      parsed = JSON.parse(jsonMatch[0]);
    }

    const validation = validateBattleContent(parsed, rules);
    if (!validation.ok) {
      return NextResponse.json(
        {
          error: `Battle pack content invalid: ${validation.error}`,
          code: "PACK_INVALID",
        },
        { status: 500 }
      );
    }

    const pack = assembleBattlePack({
      scenario,
      stage,
      targetLanguage,
      level,
      content: validation.content,
    });

    await supabase.from("battle_packs").upsert(
      {
        cache_key: cacheKey,
        scenario_slug: scenario.slug,
        stage,
        target_language: targetLanguage,
        level,
        template_version: BATTLE_TEMPLATE_VERSION,
        pack,
      },
      { onConflict: "cache_key" }
    );

    return NextResponse.json({ pack, cached: false });
  } catch (error) {
    console.error("Battle pack generation error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: message, code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
