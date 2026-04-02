import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import type { Exam, Rivalry, Round } from "@/lib/domain-types";
import { resolveRoundLanguageLevel } from "@/lib/language-level";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { roundId } = await req.json();

    if (!roundId) {
      return NextResponse.json(
        { error: "Missing roundId", code: "MISSING_ROUND_ID" },
        { status: 400 }
      );
    }

    // Get round + syllabus
    const { data: roundData, error: roundError } = await supabase
      .from("rounds")
      .select("*")
      .eq("id", roundId)
      .single();

    if (roundError || !roundData) {
      return NextResponse.json(
        { error: "Round not found", code: "ROUND_NOT_FOUND" },
        { status: 404 }
      );
    }

    const round = roundData as Round;

    if (!round.syllabus) {
      return NextResponse.json(
        { error: "No syllabus found", code: "MISSING_SYLLABUS" },
        { status: 400 }
      );
    }

    const { data: rivalryData } = await supabase
      .from("rivalries")
      .select(
        "player_a_lang, player_b_lang, player_a_difficulty, player_b_difficulty"
      )
      .eq("id", round.rivalry_id)
      .maybeSingle<
        Pick<
          Rivalry,
          | "player_a_lang"
          | "player_b_lang"
          | "player_a_difficulty"
          | "player_b_difficulty"
        >
      >();

    // Idempotency: if exam already exists, skip Claude and just ensure status is exam_ready
    const { data: existingExam } = await supabase
      .from("exams")
      .select("id")
      .eq("round_id", roundId)
      .maybeSingle();

    if (existingExam) {
      await supabase
        .from("rounds")
        .update({ status: "exam_ready" })
        .eq("id", roundId);
      return NextResponse.json({ success: true });
    }

    const syllabus = round.syllabus;
    const difficultyLevel = resolveRoundLanguageLevel(
      rivalryData,
      round.target_lang
    );

    const prompt = `You are an exam generator for ClashLingo, a competitive language learning app.

Based on the following syllabus, generate a 24-question exam with scoring rubric.

TARGET LEVEL:
${difficultyLevel}

SYLLABUS:
${JSON.stringify(syllabus, null, 2)}

EXAM STRUCTURE (strictly follow this):
- Questions 1-10: Multiple Choice (MCQ) — 3 points each = 30 points
- Questions 11-20: Fill in the Blank (FITB) — 3 points each = 30 points
- Questions 21-24: Translation — 10 points each = 40 points
- Total: 100 points

RULES:
- All questions must be based ONLY on the syllabus content
- Difficulty must match ${difficultyLevel}
- MCQ: 4 options each, exactly one correct
- FITB: One blank per question, the blank should be a word from the vocabulary or a grammar structure
- Questions 1-23 should have the same correct answer regardless of interface language
- Translation Q21-23: translate a shared meaning into the target language
- Translation Q24: translate from the target language back into each interface language
- Questions should test vocabulary, grammar, and expressions from the syllabus

LEVEL GUIDANCE:
- Beginner: keep wording direct, highly scaffolded, and strictly inside the explicit syllabus scope
- Elementary: allow small phrasing variations, but keep sentence frames practical and predictable
- Intermediate: use broader sentence patterns and a bit more transfer across vocabulary, grammar, and expressions
- Advanced: use the most natural phrasing, denser grammar choices, and less obvious recall, while still staying inside the syllabus

Return a JSON object with exactly this structure:
{
  "questions": [
    {
      "id": 1,
      "type": "mcq",
      "prompt": {
        "en": "question text in English",
        "zh-CN": "对应的简体中文题干"
      },
      "options": [
        {
          "value": "stable canonical option value",
          "label": {
            "en": "option label in English",
            "zh-CN": "对应的简体中文选项"
          }
        }
      ]
    },
    {
      "id": 11,
      "type": "fitb",
      "prompt": {
        "en": "sentence with ___ blank",
        "zh-CN": "带有 ___ 空格的简体中文题干"
      }
    },
    {
      "id": 21,
      "type": "translation",
      "prompt": {
        "en": "Translate to French: ...",
        "zh-CN": "翻译成法语：……"
      }
    }
  ],
  "rubric": [
    {
      "id": 1,
      "answer": "correct canonical answer",
      "points": 3
    },
    {
      "id": 21,
      "answer": "ideal target-language translation",
      "points": 10,
      "keywords": ["target", "language", "keywords"]
    },
    {
      "id": 24,
      "answer": {
        "en": "ideal English translation",
        "zh-CN": "理想的简体中文翻译"
      },
      "points": 10,
      "keywords": {
        "en": ["english", "keywords"],
        "zh-CN": ["中文", "关键词"]
      }
    }
  ]
}

Localization rules:
- Every question prompt must be provided in BOTH English and Simplified Chinese
- MCQ option labels must also be provided in BOTH English and Simplified Chinese
- If an option is naturally target-language only, it is okay for both labels to be identical
- For MCQ rubric answers, store the canonical matching option "value"
- For FITB rubric answers, store the exact correct fill-in text
- For translation Q21-23, store a single target-language answer string plus target-language keywords
- For translation Q24, store bilingual answers and bilingual keywords because the learner may answer in English or Simplified Chinese

For translation rubric, include a "keywords" array or object with important words/phrases. Partial credit will be given based on how many keywords appear in the student's answer.

IMPORTANT: Return ONLY valid JSON, no markdown, no explanation, no backticks. Ensure all 24 questions and 24 rubric items are present.`;

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

    let examData: Pick<Exam, "questions" | "rubric">;
    try {
      examData = JSON.parse(textBlock.text);
    } catch {
      const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        examData = JSON.parse(jsonMatch[0]);
      } else {
        return NextResponse.json(
          {
            error: "Failed to parse exam JSON",
            code: "EXAM_PARSE_FAILED",
            raw: textBlock.text,
          },
          { status: 500 }
        );
      }
    }

    // Check for existing exam
    const { data: existing } = await supabase
      .from("exams")
      .select("id")
      .eq("round_id", roundId)
      .single();

    if (existing) {
      // Update existing
      await supabase
        .from("exams")
        .update({
          questions: examData.questions,
          rubric: examData.rubric,
          total_points: 100,
        })
        .eq("id", existing.id);
    } else {
      // Create new
      await supabase.from("exams").insert({
        round_id: roundId,
        questions: examData.questions,
        rubric: examData.rubric,
        total_points: 100,
      });
    }

    // Update round status
    await supabase
      .from("rounds")
      .update({ status: "exam_ready" })
      .eq("id", roundId);

    return NextResponse.json({ success: true, exam: examData });
  } catch (error) {
    console.error("Exam generation error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: message, code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
