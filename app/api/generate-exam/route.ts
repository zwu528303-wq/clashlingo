import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import type {
  ExamQuestion,
  ExamRubricItem,
  Rivalry,
  Round,
} from "@/lib/domain-types";
import { resolveRoundLanguageLevel } from "@/lib/language-level";

export const maxDuration = 60;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  throw new Error("Missing Supabase environment variables");
}

const authClient = createClient(supabaseUrl, supabaseAnonKey);
const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

const EXPECTED_EXAM_ITEM_COUNT = 24;
const EXAM_SECTION_MAX_TOKENS = 3500;

interface ExamSectionSpec {
  key: "mcq" | "fitb" | "translation";
  type: ExamQuestion["type"];
  title: string;
  startId: number;
  endId: number;
  points: number;
  instructions: string;
  outputNotes: string;
}

interface ExamSectionData {
  questions: ExamQuestion[];
  rubric: ExamRubricItem[];
}

interface VocabularyEntry {
  word: string;
  groupEn: string;
  groupZh: string;
}

class ExamGenerationFailure extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status = 502) {
    super(message);
    this.name = "ExamGenerationFailure";
    this.code = code;
    this.status = status;
  }
}

const EXAM_SECTIONS: ExamSectionSpec[] = [
  {
    key: "mcq",
    type: "mcq",
    title: "Multiple Choice",
    startId: 1,
    endId: 10,
    points: 3,
    instructions:
      "Create multiple-choice recall and comprehension questions. Each question must have exactly 4 options. Use stable option values such as \"a\", \"b\", \"c\", and \"d\". The rubric answer must exactly match the correct option value.",
    outputNotes:
      "Each question must include options, and each option must include value plus bilingual label.",
  },
  {
    key: "fitb",
    type: "fitb",
    title: "Fill in the Blank",
    startId: 11,
    endId: 20,
    points: 3,
    instructions:
      "Create fill-in-the-blank questions. Each prompt must contain exactly one ___ blank. The blank should test a vocabulary item, expression, or grammar structure from the syllabus.",
    outputNotes:
      "Do not include options for fill-in-the-blank questions. The rubric answer must be the exact expected fill-in text.",
  },
  {
    key: "translation",
    type: "translation",
    title: "Translation",
    startId: 21,
    endId: 24,
    points: 10,
    instructions:
      "Create translation questions. Questions 21-23 translate a shared meaning into the target language. Question 24 translates from the target language back into each interface language.",
    outputNotes:
      "For questions 21-23, rubric answer is a target-language string with target-language keywords. For question 24, rubric answer and keywords are bilingual objects with en and zh-CN.",
  },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function countFitbBlanks(text: string) {
  return text.match(/___/g)?.length ?? 0;
}

function localizedText(en: string, zh: string) {
  return { en, "zh-CN": zh };
}

function localizedList(en: string[], zh: string[]) {
  return { en, "zh-CN": zh };
}

function uniqueNonEmpty(items: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of items) {
    const trimmed = item.replace(/\s+/g, " ").trim();
    const key = trimmed.toLowerCase();
    if (!trimmed || seen.has(key)) continue;

    seen.add(key);
    result.push(trimmed);
  }

  return result;
}

function getLocalizedStrings(value: unknown, language: "en" | "zh-CN") {
  if (Array.isArray(value)) {
    return uniqueNonEmpty(value.filter((item): item is string => typeof item === "string"));
  }

  if (isRecord(value) && Array.isArray(value[language])) {
    return uniqueNonEmpty(
      value[language].filter((item): item is string => typeof item === "string")
    );
  }

  return [];
}

function normalizeFallbackPhrase(text: string) {
  return text.replace(/\.\.\./g, "").replace(/\s+/g, " ").trim();
}

function trimAnswerToken(token: string) {
  return token
    .replace(/^[^\p{L}\p{N}'’-]+/u, "")
    .replace(/[^\p{L}\p{N}'’-]+$/u, "")
    .trim();
}

function getCycleItem<T>(items: T[], index: number) {
  return items[index % items.length];
}

function getFitbPromptError(question: Record<string, unknown>, questionId: number) {
  const prompt = question.prompt;

  if (typeof prompt === "string") {
    return countFitbBlanks(prompt) === 1
      ? null
      : `Question ${questionId} must contain exactly one blank.`;
  }

  if (!isRecord(prompt)) {
    return `Question ${questionId} prompt is invalid.`;
  }

  for (const language of ["en", "zh-CN"]) {
    const localizedPrompt = prompt[language];
    if (typeof localizedPrompt !== "string") {
      return `Question ${questionId} prompt is missing ${language}.`;
    }

    if (countFitbBlanks(localizedPrompt) !== 1) {
      return `Question ${questionId} ${language} prompt must contain exactly one blank.`;
    }
  }

  return null;
}

function getSyllabusVocabularyEntries(
  syllabus: NonNullable<Round["syllabus"]>,
  targetLanguage: string | null
) {
  const entries: VocabularyEntry[] = [];

  if (Array.isArray(syllabus.vocabulary_groups)) {
    for (const group of syllabus.vocabulary_groups) {
      const label = group.label ?? {};
      const groupEn =
        typeof label.en === "string" ? label.en : targetLanguage || "Core vocabulary";
      const groupZh =
        typeof label["zh-CN"] === "string" ? label["zh-CN"] : "核心词汇";

      for (const word of group.words ?? []) {
        if (typeof word === "string") {
          entries.push({ word, groupEn, groupZh });
        }
      }
    }
  }

  if (isRecord(syllabus.vocabulary)) {
    for (const [groupName, words] of Object.entries(syllabus.vocabulary)) {
      if (!Array.isArray(words)) continue;

      for (const word of words) {
        if (typeof word === "string") {
          entries.push({
            word,
            groupEn: groupName,
            groupZh: groupName,
          });
        }
      }
    }
  }

  const expressionEntries = (syllabus.expressions ?? []).map((expression) => ({
    word: expression,
    groupEn: "Useful expressions",
    groupZh: "常用表达",
  }));

  const listeningEntries = (syllabus.listening ?? []).map((phrase) => ({
    word: phrase,
    groupEn: "Listening phrases",
    groupZh: "听力短句",
  }));

  const fallbackEntries = [
    targetLanguage || "target language",
    syllabus.topic || "round topic",
    "practice",
    "review",
  ].map((word) => ({
    word,
    groupEn: "Round basics",
    groupZh: "本轮基础",
  }));

  const seen = new Set<string>();
  return [...entries, ...expressionEntries, ...listeningEntries, ...fallbackEntries].filter(
    (entry) => {
      const key = entry.word.toLowerCase();
      if (!entry.word.trim() || seen.has(key)) return false;
      seen.add(key);
      return true;
    }
  );
}

function getSyllabusPhrasePool(syllabus: NonNullable<Round["syllabus"]>) {
  return uniqueNonEmpty([
    ...(syllabus.expressions ?? []),
    ...(syllabus.listening ?? []),
    ...getLocalizedStrings(syllabus.grammar, "en"),
  ])
    .map(normalizeFallbackPhrase)
    .filter(Boolean);
}

function buildFallbackOptions(
  correctAnswer: string,
  distractorPool: string[],
  questionIndex: number
) {
  const optionValues = ["a", "b", "c", "d"];
  const correctIndex = questionIndex % optionValues.length;
  const distractors = uniqueNonEmpty(
    distractorPool.filter(
      (item) => item.toLowerCase() !== correctAnswer.toLowerCase()
    )
  );
  const labels: string[] = [];

  for (const distractor of distractors) {
    if (labels.length === 3) break;
    labels.push(distractor);
  }

  for (const fallback of ["practice", "review", "dialogue", "lesson", "example"]) {
    if (labels.length === 3) break;
    if (fallback.toLowerCase() !== correctAnswer.toLowerCase()) {
      labels.push(fallback);
    }
  }

  labels.splice(correctIndex, 0, correctAnswer);

  return {
    answer: optionValues[correctIndex],
    options: labels.slice(0, 4).map((label, optionIndex) => ({
      value: optionValues[optionIndex],
      label: localizedText(label, label),
    })),
  };
}

function blankFallbackPhrase(phrase: string, index: number) {
  const cleanPhrase = normalizeFallbackPhrase(phrase) || "practice";
  const tokens = cleanPhrase.split(/\s+/);
  const token = getCycleItem(tokens, index);
  const answer = trimAnswerToken(token) || token;
  const blanked = cleanPhrase.replace(token, "___");

  return {
    answer,
    blanked: countFitbBlanks(blanked) === 1 ? blanked : `___ ${cleanPhrase}`,
  };
}

function getTranslationKeywords(answer: string) {
  const keywords = uniqueNonEmpty(
    answer
      .split(/\s+/)
      .map(trimAnswerToken)
      .filter((token) => token.length > 1)
  );

  return keywords.slice(0, 6);
}

function buildFallbackExamSections(args: {
  syllabus: NonNullable<Round["syllabus"]>;
  targetLanguage: string | null;
}) {
  const { syllabus, targetLanguage } = args;
  const topic = syllabus.topic || "this round";
  const target = targetLanguage || syllabus.target_lang || "the target language";
  const vocabularyEntries = getSyllabusVocabularyEntries(syllabus, target);
  const phrasePool = getSyllabusPhrasePool(syllabus);
  const canDoEn = getLocalizedStrings(syllabus.can_do, "en");
  const canDoZh = getLocalizedStrings(syllabus.can_do, "zh-CN");
  const fallbackPhrases =
    phrasePool.length > 0
      ? phrasePool
      : vocabularyEntries.map((entry) => entry.word);

  const mcqQuestions: ExamQuestion[] = [];
  const mcqRubric: ExamRubricItem[] = [];
  const allVocabularyWords = vocabularyEntries.map((entry) => entry.word);

  for (let index = 0; index < 10; index += 1) {
    const entry = getCycleItem(vocabularyEntries, index);
    const distractorPool = vocabularyEntries
      .filter((candidate) => candidate.groupEn !== entry.groupEn)
      .map((candidate) => candidate.word);
    const { answer, options } = buildFallbackOptions(
      entry.word,
      distractorPool.length > 0 ? distractorPool : allVocabularyWords,
      index
    );
    const id = index + 1;

    mcqQuestions.push({
      id,
      type: "mcq",
      prompt: localizedText(
        `Which item belongs to "${entry.groupEn}" in this ${target} syllabus?`,
        `哪个词或表达属于本轮「${entry.groupZh}」？`
      ),
      options,
    });
    mcqRubric.push({ id, answer, points: 3 });
  }

  const fitbQuestions: ExamQuestion[] = [];
  const fitbRubric: ExamRubricItem[] = [];

  for (let index = 0; index < 10; index += 1) {
    const sourcePhrase = getCycleItem(fallbackPhrases, index);
    const { answer, blanked } = blankFallbackPhrase(sourcePhrase, index);
    const id = index + 11;

    fitbQuestions.push({
      id,
      type: "fitb",
      prompt: localizedText(
        `Complete this syllabus phrase: ${blanked}`,
        `补全这个本轮短语：${blanked}`
      ),
    });
    fitbRubric.push({ id, answer, points: 3 });
  }

  const translationQuestions: ExamQuestion[] = [];
  const translationRubric: ExamRubricItem[] = [];

  for (let index = 0; index < 3; index += 1) {
    const answer = getCycleItem(fallbackPhrases, index);
    const id = index + 21;

    translationQuestions.push({
      id,
      type: "translation",
      prompt: localizedText(
        `Write a ${target} phrase from this round for: ${
          canDoEn[index] || topic
        }`,
        `根据本轮内容，写一个${target}短语来表达：${
          canDoZh[index] || topic
        }`
      ),
    });
    translationRubric.push({
      id,
      answer,
      points: 10,
      keywords: getTranslationKeywords(answer),
    });
  }

  const sourcePhrase = getCycleItem(fallbackPhrases, 3);
  translationQuestions.push({
    id: 24,
    type: "translation",
    prompt: localizedText(
      `Translate or explain this ${target} phrase in English: "${sourcePhrase}"`,
      `把这个${target}短语翻译或解释成中文："${sourcePhrase}"`
    ),
  });
  translationRubric.push({
    id: 24,
    answer: localizedText(
      canDoEn[3] || `${topic} phrase from the syllabus`,
      canDoZh[3] || `本轮「${topic}」中的表达`
    ),
    points: 10,
    keywords: localizedList(
      getTranslationKeywords(canDoEn[3] || topic),
      getTranslationKeywords(canDoZh[3] || topic)
    ),
  });

  return [
    { questions: mcqQuestions, rubric: mcqRubric },
    { questions: fitbQuestions, rubric: fitbRubric },
    { questions: translationQuestions, rubric: translationRubric },
  ] satisfies ExamSectionData[];
}

function getExamShapeError(value: unknown) {
  if (!isRecord(value)) return "Exam payload is not an object.";

  if (!Array.isArray(value.questions)) {
    return "Exam payload is missing questions.";
  }

  if (!Array.isArray(value.rubric)) {
    return "Exam payload is missing rubric.";
  }

  if (value.questions.length !== EXPECTED_EXAM_ITEM_COUNT) {
    return `Expected ${EXPECTED_EXAM_ITEM_COUNT} questions, got ${value.questions.length}.`;
  }

  if (value.rubric.length !== EXPECTED_EXAM_ITEM_COUNT) {
    return `Expected ${EXPECTED_EXAM_ITEM_COUNT} rubric items, got ${value.rubric.length}.`;
  }

  return null;
}

function getSectionShapeError(value: unknown, section: ExamSectionSpec) {
  if (!isRecord(value)) return "Section payload is not an object.";

  if (!Array.isArray(value.questions)) {
    return "Section payload is missing questions.";
  }

  if (!Array.isArray(value.rubric)) {
    return "Section payload is missing rubric.";
  }

  const expectedCount = section.endId - section.startId + 1;
  if (value.questions.length !== expectedCount) {
    return `Expected ${expectedCount} ${section.key} questions, got ${value.questions.length}.`;
  }

  if (value.rubric.length !== expectedCount) {
    return `Expected ${expectedCount} ${section.key} rubric items, got ${value.rubric.length}.`;
  }

  const expectedIds = Array.from(
    { length: expectedCount },
    (_, index) => section.startId + index
  );

  for (const expectedId of expectedIds) {
    const question = value.questions.find(
      (item) => isRecord(item) && item.id === expectedId
    );
    const rubric = value.rubric.find(
      (item) => isRecord(item) && item.id === expectedId
    );

    if (!isRecord(question)) {
      return `Missing question id ${expectedId}.`;
    }

    if (question.type !== section.type) {
      return `Question ${expectedId} has the wrong type.`;
    }

    if (section.key === "mcq") {
      if (!Array.isArray(question.options) || question.options.length !== 4) {
        return `Question ${expectedId} must have exactly 4 options.`;
      }

      const expectedValues = ["a", "b", "c", "d"];
      for (const [optionIndex, option] of question.options.entries()) {
        if (!isRecord(option)) {
          return `Question ${expectedId} option ${optionIndex + 1} must be an object.`;
        }

        if (option.value !== expectedValues[optionIndex]) {
          return `Question ${expectedId} option ${optionIndex + 1} has the wrong value.`;
        }

        const label = option.label;
        if (typeof label !== "string" && !isRecord(label)) {
          return `Question ${expectedId} option ${optionIndex + 1} is missing a label.`;
        }
      }
    }

    if (section.key === "fitb") {
      const promptError = getFitbPromptError(question, expectedId);
      if (promptError) {
        return promptError;
      }
    }

    if (!isRecord(rubric)) {
      return `Missing rubric id ${expectedId}.`;
    }

    if (rubric.points !== section.points) {
      return `Rubric ${expectedId} has the wrong point value.`;
    }
  }

  return null;
}

function buildSectionJsonExample(section: ExamSectionSpec) {
  const question: Record<string, unknown> = {
    id: section.startId,
    type: section.type,
    prompt: {
      en:
        section.key === "fitb"
          ? "Complete the sentence: I am ___."
          : "question text in English",
      "zh-CN":
        section.key === "fitb"
          ? "补全句子：我是 ___。"
          : "对应的简体中文题干",
    },
  };

  if (section.key === "mcq") {
    question.options = ["a", "b", "c", "d"].map((value) => ({
      value,
      label: {
        en: `option ${value}`,
        "zh-CN": `选项 ${value}`,
      },
    }));
  }

  return JSON.stringify(
    {
      questions: [question],
      rubric: [
        {
          id: section.startId,
          answer: section.key === "mcq" ? "a" : "correct answer",
          points: section.points,
        },
      ],
    },
    null,
    2
  );
}

function parseSectionJson(text: string, stopReason: string | null) {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new ExamGenerationFailure(
        stopReason === "max_tokens" ? "AI_OUTPUT_TRUNCATED" : "EXAM_PARSE_FAILED",
        stopReason === "max_tokens"
          ? "Exam section JSON was truncated by the AI output limit"
          : "Failed to parse exam section JSON"
      );
    }

    try {
      return JSON.parse(jsonMatch[0]) as unknown;
    } catch {
      throw new ExamGenerationFailure(
        stopReason === "max_tokens" ? "AI_OUTPUT_TRUNCATED" : "EXAM_PARSE_FAILED",
        stopReason === "max_tokens"
          ? "Exam section JSON was truncated by the AI output limit"
          : "Failed to parse exam section JSON"
      );
    }
  }
}

function buildExamSectionPrompt(args: {
  section: ExamSectionSpec;
  syllabus: NonNullable<Round["syllabus"]>;
  targetLanguage: string | null;
  difficultyLevel: string;
}) {
  const { section, syllabus, targetLanguage, difficultyLevel } = args;
  const expectedCount = section.endId - section.startId + 1;
  const jsonExample = buildSectionJsonExample(section);

  return `You are an exam generator for ClashLingo, a competitive language learning app.

Generate ONLY the ${section.title} section of a larger 24-question exam.

TARGET LANGUAGE:
${targetLanguage}

TARGET LEVEL:
${difficultyLevel}

SYLLABUS:
${JSON.stringify(syllabus, null, 2)}

SECTION TO GENERATE:
- Question IDs: ${section.startId}-${section.endId}
- Number of questions: ${expectedCount}
- Question type: ${section.type}
- Points per question: ${section.points}

SECTION INSTRUCTIONS:
${section.instructions}
${section.outputNotes}

GLOBAL RULES:
- All questions must be based ONLY on the syllabus content
- Difficulty must match ${difficultyLevel}
- Prompts must be bilingual: both "en" and "zh-CN"
- Questions 1-23 should have the same correct answer regardless of interface language
- Keep every item tightly scoped and concise
- Do not include questions outside IDs ${section.startId}-${section.endId}
- Do not include markdown, explanations, comments, or backticks

Return ONLY a JSON object with this shape:
${jsonExample}

IMPORTANT:
- Return exactly ${expectedCount} questions and exactly ${expectedCount} rubric items.
- Question IDs and rubric IDs must be exactly ${section.startId}-${section.endId}, in order.
- Return ONLY valid JSON.`;
}

async function generateExamSection(args: {
  section: ExamSectionSpec;
  syllabus: NonNullable<Round["syllabus"]>;
  targetLanguage: string | null;
  difficultyLevel: string;
}) {
  const { section } = args;
  const prompt = buildExamSectionPrompt(args);

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: EXAM_SECTION_MAX_TOKENS,
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new ExamGenerationFailure("AI_NO_TEXT", "No text response from AI");
    }

    const parsedSectionData = parseSectionJson(
      textBlock.text,
      message.stop_reason
    );
    const shapeError = getSectionShapeError(parsedSectionData, section);

    if (!shapeError) {
      return parsedSectionData as ExamSectionData;
    }

    console.error("Exam section shape invalid", {
      attempt,
      section: section.key,
      error: shapeError,
      stopReason: message.stop_reason,
    });
  }

  throw new ExamGenerationFailure(
    "EXAM_SHAPE_INVALID",
    `The ${section.key} exam section was incomplete.`
  );
}

export async function POST(req: NextRequest) {
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

    const { roundId } = await req.json();

    if (!roundId) {
      return NextResponse.json(
        { error: "Missing roundId", code: "MISSING_ROUND_ID" },
        { status: 400 }
      );
    }

    // Get round + syllabus
    const { data: roundData, error: roundError } = await adminClient
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

    const { data: rivalryData, error: rivalryError } = await adminClient
      .from("rivalries")
      .select(
        "player_a_id, player_b_id, player_a_lang, player_b_lang, player_a_difficulty, player_b_difficulty"
      )
      .eq("id", round.rivalry_id)
      .maybeSingle<
        Pick<
          Rivalry,
          | "player_a_id"
          | "player_b_id"
          | "player_a_lang"
          | "player_b_lang"
          | "player_a_difficulty"
          | "player_b_difficulty"
        >
      >();

    if (rivalryError || !rivalryData) {
      return NextResponse.json(
        { error: "Rivalry not found", code: "RIVALRY_NOT_FOUND" },
        { status: 404 }
      );
    }

    if (
      rivalryData.player_a_id !== user.id &&
      rivalryData.player_b_id !== user.id
    ) {
      return NextResponse.json(
        {
          error: "You are not part of this rivalry",
          code: "NOT_PART_OF_RIVALRY",
        },
        { status: 403 }
      );
    }

    // Idempotency: if exam already exists, skip Claude and just ensure status is exam_ready
    const { data: existingExam } = await adminClient
      .from("exams")
      .select("id")
      .eq("round_id", roundId)
      .maybeSingle();

    if (existingExam) {
      await adminClient
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

    let usedFallback = false;
    let examSections: ExamSectionData[];

    try {
      examSections = await Promise.all(
        EXAM_SECTIONS.map((section) =>
          generateExamSection({
            section,
            syllabus,
            targetLanguage: round.target_lang,
            difficultyLevel,
          })
        )
      );
    } catch (error) {
      console.error("Exam AI generation failed; using syllabus fallback", {
        code: error instanceof ExamGenerationFailure ? error.code : "AI_GENERATION_FAILED",
        message: error instanceof Error ? error.message : "Unknown AI generation error",
        roundId,
      });
      usedFallback = true;
      examSections = buildFallbackExamSections({
        syllabus,
        targetLanguage: round.target_lang,
      });
    }

    const examData = {
      questions: examSections
        .flatMap((section) => section.questions)
        .sort((left, right) => left.id - right.id),
      rubric: examSections
        .flatMap((section) => section.rubric)
        .sort((left, right) => left.id - right.id),
    };

    const shapeError = getExamShapeError(examData);
    if (shapeError) {
      return NextResponse.json(
        {
          error: shapeError,
          code: "EXAM_SHAPE_INVALID",
        },
        { status: 502 }
      );
    }

    // Check for existing exam
    const { data: existing } = await adminClient
      .from("exams")
      .select("id")
      .eq("round_id", roundId)
      .maybeSingle();

    if (existing) {
      // Update existing
      const { error: updateExamError } = await adminClient
        .from("exams")
        .update({
          questions: examData.questions,
          rubric: examData.rubric,
          total_points: 100,
        })
        .eq("id", existing.id);

      if (updateExamError) {
        return NextResponse.json(
          { error: updateExamError.message, code: "EXAM_UPSERT_FAILED" },
          { status: 500 }
        );
      }
    } else {
      // Create new
      const { error: insertExamError } = await adminClient.from("exams").insert({
        round_id: roundId,
        questions: examData.questions,
        rubric: examData.rubric,
        total_points: 100,
      });

      if (insertExamError) {
        return NextResponse.json(
          { error: insertExamError.message, code: "EXAM_UPSERT_FAILED" },
          { status: 500 }
        );
      }
    }

    // Update round status
    const { error: updateRoundError } = await adminClient
      .from("rounds")
      .update({ status: "exam_ready" })
      .eq("id", roundId);

    if (updateRoundError) {
      return NextResponse.json(
        { error: updateRoundError.message, code: "ROUND_UPDATE_FAILED" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, exam: examData, fallback: usedFallback });
  } catch (error) {
    if (error instanceof ExamGenerationFailure) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }

    console.error("Exam generation error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: message, code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
