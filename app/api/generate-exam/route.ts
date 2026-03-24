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
    const { roundId } = await req.json();

    if (!roundId) {
      return NextResponse.json({ error: "Missing roundId" }, { status: 400 });
    }

    // Get round + syllabus
    const { data: round, error: roundError } = await supabase
      .from("rounds")
      .select("*")
      .eq("id", roundId)
      .single();

    if (roundError || !round) {
      return NextResponse.json({ error: "Round not found" }, { status: 404 });
    }

    if (!round.syllabus) {
      return NextResponse.json({ error: "No syllabus found" }, { status: 400 });
    }

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

    const prompt = `You are an exam generator for ClashLingo, a competitive language learning app.

Based on the following syllabus, generate a 24-question exam with scoring rubric.

SYLLABUS:
${JSON.stringify(syllabus, null, 2)}

EXAM STRUCTURE (strictly follow this):
- Questions 1-10: Multiple Choice (MCQ) — 3 points each = 30 points
- Questions 11-20: Fill in the Blank (FITB) — 3 points each = 30 points  
- Questions 21-24: Translation — 10 points each = 40 points
- Total: 100 points

RULES:
- All questions must be based ONLY on the syllabus content
- For beginner level: NEVER go beyond the syllabus scope
- MCQ: 4 options each, exactly one correct
- FITB: One blank per question, the blank should be a word from the vocabulary or a grammar structure
- Translation Q21-23: Translate from English to target language
- Translation Q24: Translate from target language to English
- Questions should test vocabulary, grammar, and expressions from the syllabus

Return a JSON object with exactly this structure:
{
  "questions": [
    {
      "id": 1,
      "type": "mcq",
      "prompt": "question text",
      "options": ["A", "B", "C", "D"]
    },
    {
      "id": 11,
      "type": "fitb",
      "prompt": "sentence with ___ blank"
    },
    {
      "id": 21,
      "type": "translation",
      "prompt": "Translate to French: ..."
    }
  ],
  "rubric": [
    {
      "id": 1,
      "answer": "correct answer text",
      "points": 3
    },
    {
      "id": 21,
      "answer": "ideal translation",
      "points": 10,
      "keywords": ["key", "words", "for", "partial", "credit"]
    }
  ]
}

For translation rubric, include a "keywords" array with important words/phrases. Partial credit will be given based on how many keywords appear in the student's answer.

IMPORTANT: Return ONLY valid JSON, no markdown, no explanation, no backticks. Ensure all 24 questions and 24 rubric items are present.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "No text response" }, { status: 500 });
    }

    let examData;
    try {
      examData = JSON.parse(textBlock.text);
    } catch {
      const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        examData = JSON.parse(jsonMatch[0]);
      } else {
        return NextResponse.json(
          { error: "Failed to parse exam JSON", raw: textBlock.text },
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
  } catch (err: any) {
    console.error("Exam generation error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}