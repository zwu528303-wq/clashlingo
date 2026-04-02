import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import type { Rivalry, Round, Syllabus } from "@/lib/domain-types";
import {
  DEFAULT_LANGUAGE_LEVEL,
  normalizeLanguageLevel,
  resolveRoundLanguageLevel,
} from "@/lib/language-level";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { roundId, topic, targetLang, difficulty } = await req.json();

    if (!roundId || !topic || !targetLang) {
      return NextResponse.json(
        { error: "Missing fields", code: "MISSING_FIELDS" },
        { status: 400 }
      );
    }

    const { data: roundData, error: roundError } = await supabase
      .from("rounds")
      .select("rivalry_id, topic, target_lang")
      .eq("id", roundId)
      .single<Pick<Round, "rivalry_id" | "topic" | "target_lang">>();

    if (roundError || !roundData) {
      return NextResponse.json(
        { error: "Round not found", code: "ROUND_NOT_FOUND" },
        { status: 404 }
      );
    }

    const { data: rivalryData } = await supabase
      .from("rivalries")
      .select(
        "player_a_lang, player_b_lang, player_a_difficulty, player_b_difficulty"
      )
      .eq("id", roundData.rivalry_id)
      .maybeSingle<
        Pick<
          Rivalry,
          | "player_a_lang"
          | "player_b_lang"
          | "player_a_difficulty"
          | "player_b_difficulty"
        >
      >();

    const resolvedTopic = roundData.topic || topic;
    const resolvedTargetLang = roundData.target_lang || targetLang;
    const difficultyLevel = rivalryData
      ? resolveRoundLanguageLevel(rivalryData, resolvedTargetLang)
      : normalizeLanguageLevel(difficulty || DEFAULT_LANGUAGE_LEVEL);

    const prompt = `You are a language learning curriculum designer for ClashLingo, a competitive language learning app.

Generate an exam scope / syllabus for the following:
- Topic: "${resolvedTopic}"
- Target Language: ${resolvedTargetLang}
- Learner Level: ${difficultyLevel}

The syllabus is NOT a textbook. It only tells the student WHAT will be tested, not HOW to learn it. The student will study on their own using external tools.

Return a JSON object with exactly this structure:
{
  "topic": "${resolvedTopic}",
  "target_lang": "${resolvedTargetLang}",
  "can_do": {
    "en": [
      // 3-5 ability objectives in English, e.g. "Order a drink and pastry in French"
    ],
    "zh-CN": [
      // The same objectives in Simplified Chinese, aligned item-by-item with "en"
    ]
  },
  "vocabulary_groups": [
    {
      "id": "group_slug",
      "label": {
        "en": "group label in English",
        "zh-CN": "对应的简体中文分组名"
      },
      "words": [
        // 5-12 words in the TARGET LANGUAGE ONLY, no translations
      ]
    }
  ],
  "grammar": {
    "en": [
      // 5-6 grammar concepts in English, tied directly to the tested language structures
    ],
    "zh-CN": [
      // The same grammar concepts in Simplified Chinese, aligned item-by-item with "en"
    ]
  },
  "expressions": [
    // 10 useful phrases in TARGET LANGUAGE ONLY, no translations
  ],
  "listening": [
    // 6 phrases the student might hear, in TARGET LANGUAGE ONLY
  ],
  "how_tested": {
    "en": [
      // 3-4 short English bullets explaining how the round will be tested
    ],
    "zh-CN": [
      // The same test notes in Simplified Chinese, aligned item-by-item with "en"
    ]
  }
}

Rules for localization:
- "can_do", "grammar", "how_tested", and every vocabulary group label must be provided in BOTH English and Simplified Chinese
- The English and Chinese versions must describe the same content, in the same order
- "expressions", "listening", and the words inside "vocabulary_groups" must stay in the TARGET LANGUAGE ONLY
- Total vocabulary across all groups should be 30-50 words
- Use 4-6 vocabulary groups

Level guidance:
- Beginner:
- Use only basic, common vocabulary
- Simple sentence structures
- All content must be strictly within the topic scope — no surprises

- Elementary:
- Use practical everyday vocabulary with light variation
- Short connected phrases are fine, but keep grammar straightforward
- Stay tightly aligned to the topic with only gentle extensions

- Intermediate:
- Allow topic-adjacent vocabulary
- Include mixed sentence patterns and more flexible grammar
- Add some challenging expressions while staying within the tested scope

- Advanced:
- Use nuanced, natural phrasing and richer topic-adjacent vocabulary
- Include denser grammar patterns and more realistic listening phrasing
- Keep everything grounded in the declared topic and syllabus shape

IMPORTANT: Return ONLY valid JSON, no markdown, no explanation, no backticks.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    // Extract text content
    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "No text response from AI", code: "AI_NO_TEXT" },
        { status: 500 }
      );
    }

    // Parse JSON
    let syllabus: Syllabus;
    try {
      syllabus = JSON.parse(textBlock.text);
    } catch {
      // Try to extract JSON from the response
      const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        syllabus = JSON.parse(jsonMatch[0]);
      } else {
        return NextResponse.json(
          {
            error: "Failed to parse syllabus JSON",
            code: "SYLLABUS_PARSE_FAILED",
            raw: textBlock.text,
          },
          { status: 500 }
        );
      }
    }

    // Save to database and update status
    const { error } = await supabase
      .from("rounds")
      .update({
        syllabus: syllabus,
        status: "confirming",
      })
      .eq("id", roundId);

    if (error) {
      return NextResponse.json(
        { error: error.message, code: "ROUND_UPDATE_FAILED" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, syllabus });
  } catch (error) {
    console.error("Syllabus generation error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: message, code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
