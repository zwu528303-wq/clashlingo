import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

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
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const difficultyLevel = difficulty || "beginner";

    const prompt = `You are a language learning curriculum designer for ClashLingo, a competitive language learning app.

Generate an exam scope / syllabus for the following:
- Topic: "${topic}"
- Target Language: ${targetLang}
- Difficulty: ${difficultyLevel}

The syllabus is NOT a textbook. It only tells the student WHAT will be tested, not HOW to learn it. The student will study on their own using external tools.

Return a JSON object with exactly this structure:
{
  "topic": "${topic}",
  "target_lang": "${targetLang}",
  "can_do": [
    // 3-5 ability objectives in English, e.g. "Order a drink and pastry in French"
  ],
  "vocabulary": {
    // Group words by scene/category. Each group has a label and a list of words.
    // Words should be in the TARGET LANGUAGE ONLY, no translations.
    // Total 30-50 words across all groups.
    "group_label_1": ["word1", "word2", "word3"],
    "group_label_2": ["word1", "word2"]
  },
  "grammar": [
    // 5-6 grammar concepts. Format: "Chinese concept name — target language key structure"
    // e.g. "定冠词与不定冠词 (le / la / les vs un / une / des)"
  ],
  "expressions": [
    // 10 useful phrases in TARGET LANGUAGE ONLY, no translations
  ],
  "listening": [
    // 6 phrases the student might hear, in TARGET LANGUAGE ONLY
  ],
  "how_tested": [
    "Vocabulary will appear in multiple choice and fill-in questions",
    "Grammar will be tested through sentence completion",
    "Expressions may appear in translation or dialogue",
    "You may hear variations of the listening phrases"
  ]
}

For beginner difficulty:
- Use only basic, common vocabulary
- Simple sentence structures
- All content must be strictly within the topic scope — no surprises

For intermediate/advanced:
- Allow topic-adjacent vocabulary
- More complex grammar patterns
- Some challenging expressions

IMPORTANT: Return ONLY valid JSON, no markdown, no explanation, no backticks.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    // Extract text content
    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "No text response from AI" }, { status: 500 });
    }

    // Parse JSON
    let syllabus;
    try {
      syllabus = JSON.parse(textBlock.text);
    } catch {
      // Try to extract JSON from the response
      const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        syllabus = JSON.parse(jsonMatch[0]);
      } else {
        return NextResponse.json(
          { error: "Failed to parse syllabus JSON", raw: textBlock.text },
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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, syllabus });
  } catch (err: any) {
    console.error("Syllabus generation error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}