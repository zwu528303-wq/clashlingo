"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "../lib/supabase";
import type {
  Exam,
  ExamQuestion,
  ExamRubricItem,
  RivalryLedger,
  RivalryLedgerRound,
} from "@/lib/domain-types";
import { getDictionary, resolveClientWebsiteLanguage } from "@/lib/i18n";
import { getEditableProfileFromUser } from "@/lib/profile";
import {
  createLocalizedList,
  createLocalizedText,
  getLocalizedExamOptions,
  getLocalizedKeywords,
  getLocalizedRubricAnswer,
  getLocalizedText,
  type InstructionLanguage,
} from "@/lib/instruction-content";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  Send,
  Loader2,
  AlertCircle,
} from "lucide-react";

export default function ExamPage() {
  const router = useRouter();
  const params = useParams();
  const roundId = params.id as string;

  const [userId, setUserId] = useState<string | null>(null);
  const [websiteLanguage, setWebsiteLanguage] = useState(
    resolveClientWebsiteLanguage()
  );
  const [instructionLanguage, setInstructionLanguage] =
    useState<InstructionLanguage>(resolveClientWebsiteLanguage());
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [ready, setReady] = useState(false); // Only true when exam + questions are loaded

  // Exam state
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(2400); // 40 minutes
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const hasSubmitted = useRef(false);
  const dictionary = getDictionary(websiteLanguage);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUserId(user.id);
      const profile = getEditableProfileFromUser(user);
      setWebsiteLanguage(profile.websiteLanguage);
      setInstructionLanguage(profile.instructionLanguage);

      // Get round
      const { data: roundData } = await supabase
        .from("rounds")
        .select("*")
        .eq("id", roundId)
        .single();

      if (!roundData) { router.push("/lounge"); return; }

      // Check if already submitted
      const { data: existingExam } = await supabase
        .from("exams")
        .select("id")
        .eq("round_id", roundId)
        .single();

      if (existingExam) {
        const { data: existingSub } = await supabase
          .from("submissions")
          .select("id")
          .eq("exam_id", existingExam.id)
          .eq("user_id", user.id)
          .maybeSingle();

        if (existingSub) {
          // Already submitted, go to results
          router.push(`/round/${roundId}/results`);
          return;
        }
      }

      // Load exam
      let { data: examData } = await supabase
        .from("exams")
        .select("*")
        .eq("round_id", roundId)
        .single();

      if (!examData) {
        // No exam found - generate mock (fallback)
        const mockQuestions = generateMockQuestions(
          roundData.topic || "General",
          roundData.target_lang || "French"
        );
        const mockRubric = generateMockRubric();

        const { data: newExam } = await supabase
          .from("exams")
          .insert({
            round_id: roundId,
            questions: mockQuestions,
            rubric: mockRubric,
            total_points: 100,
          })
          .select()
          .single();

        examData = newExam;
      }

      if (
        examData &&
        Array.isArray(examData.questions) &&
        examData.questions.length > 0
      ) {
        const typedExamData = examData as Exam;
        setExam(typedExamData);
        setQuestions(typedExamData.questions);
        setReady(true);
      }
    };
    init();
  }, [router, roundId]);

  // Timer - only starts when ready
  useEffect(() => {
    if (!ready || submitting) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [ready, submitting]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const handleAnswer = (qId: number, answer: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: answer }));
  };

  const handleSubmit = async () => {
    if (!userId || !exam || submitting || !ready || hasSubmitted.current) return;
    hasSubmitted.current = true;
    setSubmitting(true);

    // Simple scoring
    const rubric = exam.rubric ?? [];
    let totalScore = 0;
    const scores: Record<number, number> = {};

    questions.forEach((q) => {
      const myAnswer = (answers[q.id] || "").trim().toLowerCase();
      const rubricItem = rubric.find((item) => item.id === q.id);
      const maxPoints = Number(rubricItem?.points ?? 0);
      const canonicalAnswer = String(
        typeof rubricItem?.answer === "string"
          ? rubricItem.answer
          : getLocalizedRubricAnswer(rubricItem, instructionLanguage)
      )
        .trim()
        .toLowerCase();

      let score = 0;
      if (q.type === "mcq") {
        score = myAnswer === canonicalAnswer ? 3 : 0;
      } else if (q.type === "fitb") {
        score = myAnswer === canonicalAnswer ? 3 : 0;
      } else if (q.type === "translation") {
        // Keyword-based partial credit
        const localizedKeywords = getLocalizedKeywords(
          rubricItem,
          instructionLanguage
        );
        const keywords =
          localizedKeywords.length > 0
            ? localizedKeywords
            : canonicalAnswer.split(" ");
        const myWords = myAnswer.split(/\s+/);
        const matches = keywords.filter((keyword) =>
          myWords.some((word) => word.includes(keyword.toLowerCase()))
        ).length;
        const ratio = keywords.length > 0 ? matches / keywords.length : 0;
        score = Math.round(ratio * maxPoints);
      }

      scores[q.id] = score;
      totalScore += score;
    });

    // Save submission
    const { error } = await supabase.from("submissions").insert({
      exam_id: exam.id,
      user_id: userId,
      answers: answers,
      scores: scores,
      total_score: totalScore,
      started_at: new Date(Date.now() - (2400 - timeLeft) * 1000).toISOString(),
      submitted_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Submit error:", error);
      hasSubmitted.current = false;
      setSubmitting(false);
      setSubmitError(dictionary.exam.errors.submitFailed);
      return;
    }

    // Check if both submitted
    const { data: allSubs } = await supabase
      .from("submissions")
      .select("user_id, total_score")
      .eq("exam_id", exam.id);

    if (allSubs && allSubs.length >= 2) {
      await supabase
        .from("rounds")
        .update({ status: "completed" })
        .eq("id", roundId);

      // Update cumulative ledger on the rivalry
      const { data: roundInfo } = await supabase
        .from("rounds")
        .select("rivalry_id")
        .eq("id", roundId)
        .single();

      if (roundInfo?.rivalry_id) {
        const s1 = allSubs[0];
        const s2 = allSubs[1];
        const winnerId: string | null =
          s1.total_score > s2.total_score ? s1.user_id :
          s2.total_score > s1.total_score ? s2.user_id : null;

        const { data: rivalryData } = await supabase
          .from("rivalries")
          .select("cumulative_ledger")
          .eq("id", roundInfo.rivalry_id)
          .single();

        const prev = ((rivalryData?.cumulative_ledger ?? {}) as RivalryLedger);
        const wins: Record<string, number> = { ...(prev.wins ?? {}) };
        const roundHistory: RivalryLedgerRound[] = [...(prev.rounds ?? [])];

        if (winnerId) wins[winnerId] = (wins[winnerId] ?? 0) + 1;
        const roundScores: Record<string, number> = {};
        allSubs.forEach(s => { roundScores[s.user_id] = s.total_score; });
        roundHistory.push({ round_id: roundId, winner_id: winnerId, scores: roundScores });

        await supabase
          .from("rivalries")
          .update({
            cumulative_ledger: {
              ...prev,
              wins,
              rounds: roundHistory,
            },
          })
          .eq("id", roundInfo.rivalry_id);
      }
    }

    router.push(`/round/${roundId}/results`);
  };

  // ========== RENDER ==========

  // Loading state
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={32} className="animate-spin text-primary" />
          <div className="text-on-surface-variant font-medium">
            {dictionary.exam.loading}
          </div>
        </div>
      </div>
    );
  }

  const q = questions[currentQ];
  if (!q) return null;
  const localizedQuestionPrompt = getLocalizedText(
    q.prompt,
    instructionLanguage
  );
  const localizedOptions = getLocalizedExamOptions(q, instructionLanguage);

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* ===== Top Bar ===== */}
      <header className="sticky top-0 z-50 bg-surface/95 backdrop-blur-sm border-b border-surface-container px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="text-sm font-bold text-on-surface-variant">
            {dictionary.exam.answeredCount(answeredCount, questions.length)}
          </div>

          <div
            className={`flex items-center gap-2 font-mono font-black text-lg ${
              timeLeft < 300 ? "text-red-600" : "text-on-surface"
            }`}
          >
            <Clock size={18} />
            {formatTime(timeLeft)}
          </div>

          <button
            onClick={() => setShowConfirm(true)}
            disabled={submitting}
            className="bg-primary text-on-primary px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-1 hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Send size={14} /> {dictionary.exam.submit}
          </button>
        </div>
      </header>

      {/* ===== Question Navigator ===== */}
      <div className="bg-surface-container-low px-4 py-3 overflow-x-auto">
        <div className="max-w-4xl mx-auto flex gap-2">
          {questions.map((question, i) => (
            <button
              key={question.id}
              onClick={() => setCurrentQ(i)}
              className={`w-9 h-9 rounded-lg text-xs font-bold shrink-0 transition-all ${
                i === currentQ
                  ? "bg-primary text-on-primary shadow-sm"
                  : answers[question.id]
                  ? "bg-primary-container text-on-primary-container"
                  : flagged[question.id]
                  ? "bg-tertiary-container text-on-tertiary-container"
                  : "bg-surface-container-lowest text-on-surface-variant border border-surface-container"
              }`}
            >
              {question.id}
            </button>
          ))}
        </div>
      </div>

      {/* ===== Question Content ===== */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="bg-surface-container-high text-on-surface-variant px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                {q.type === "mcq"
                  ? dictionary.exam.questionTypes.mcq
                  : q.type === "fitb"
                    ? dictionary.exam.questionTypes.fitb
                    : dictionary.exam.questionTypes.translation}
              </span>
              <span className="text-sm text-on-surface-variant font-medium">
                {dictionary.exam.questionCounter(q.id, questions.length)}
              </span>
            </div>
            <button
              onClick={() => setFlagged((prev) => ({ ...prev, [q.id]: !prev[q.id] }))}
              className={`flex items-center gap-1 text-sm font-bold transition-colors ${
                flagged[q.id] ? "text-tertiary" : "text-on-surface-variant hover:text-tertiary"
              }`}
            >
              <Flag size={14} className={flagged[q.id] ? "fill-current" : ""} />
              {flagged[q.id] ? dictionary.exam.flagged : dictionary.exam.flag}
            </button>
          </div>

          <h2 className="text-xl md:text-2xl font-bold text-on-surface leading-relaxed mb-8">
            {localizedQuestionPrompt}
          </h2>

          {q.type === "mcq" && localizedOptions.length > 0 && (
            <div className="space-y-3">
              {localizedOptions.map((option, i) => (
                <button
                  key={`${option.value}-${i}`}
                  onClick={() => handleAnswer(q.id, option.value)}
                  className={`w-full text-left p-5 rounded-2xl font-medium transition-all border-2 ${
                    answers[q.id] === option.value
                      ? "border-primary bg-primary-container/30 text-on-surface"
                      : "border-surface-container bg-surface-container-lowest text-on-surface hover:border-primary/40"
                  }`}
                >
                  <span className="font-bold text-on-surface-variant mr-3">
                    {String.fromCharCode(65 + i)}.
                  </span>
                  {option.label}
                </button>
              ))}
            </div>
          )}

          {q.type === "fitb" && (
            <input
              type="text"
              value={answers[q.id] || ""}
              onChange={(e) => handleAnswer(q.id, e.target.value)}
              placeholder={dictionary.exam.fitbPlaceholder}
              className="w-full bg-surface-container-lowest border-2 border-surface-container text-on-surface rounded-2xl py-4 px-6 text-lg outline-none focus:border-primary transition-all"
            />
          )}

          {q.type === "translation" && (
            <textarea
              value={answers[q.id] || ""}
              onChange={(e) => handleAnswer(q.id, e.target.value)}
              placeholder={dictionary.exam.translationPlaceholder}
              rows={3}
              className="w-full bg-surface-container-lowest border-2 border-surface-container text-on-surface rounded-2xl py-4 px-6 text-lg outline-none focus:border-primary transition-all resize-none"
            />
          )}
        </div>
      </main>

      {/* ===== Bottom Navigation ===== */}
      <footer className="sticky bottom-0 bg-surface/95 backdrop-blur-sm border-t border-surface-container px-6 py-4">
        <div className="max-w-3xl mx-auto flex justify-between">
          <button
            onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
            disabled={currentQ === 0}
            className="flex items-center gap-2 text-on-surface-variant font-bold hover:text-primary transition-colors disabled:opacity-30"
          >
            <ChevronLeft size={20} /> {dictionary.exam.previous}
          </button>
          <button
            onClick={() => setCurrentQ(Math.min(questions.length - 1, currentQ + 1))}
            disabled={currentQ === questions.length - 1}
            className="flex items-center gap-2 text-on-surface-variant font-bold hover:text-primary transition-colors disabled:opacity-30"
          >
            {dictionary.exam.next} <ChevronRight size={20} />
          </button>
        </div>
      </footer>

      {/* ===== Submit Confirmation Modal ===== */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowConfirm(false)}>
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle size={24} className="text-primary" />
              <h3 className="text-xl font-black text-on-surface">
                {dictionary.exam.submitConfirmTitle}
              </h3>
            </div>
            <p className="text-on-surface-variant mb-2">
              {dictionary.exam.submitProgress(answeredCount, questions.length)}
            </p>
            {answeredCount < questions.length && (
              <p className="text-sm text-red-600 font-medium mb-2">
                {"⚠️ "}
                {dictionary.exam.unansweredWarning(
                  questions.length - answeredCount
                )}
              </p>
            )}
            {submitError && (
              <p className="text-sm text-red-600 font-medium bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-2">
                {submitError}
              </p>
            )}
            <div className="flex gap-4 mt-6">
              <button onClick={() => setShowConfirm(false)} className="flex-1 bg-surface-container-low text-on-surface py-4 rounded-2xl font-bold hover:bg-surface-container transition-colors">
                {dictionary.exam.goBack}
              </button>
              <button
                onClick={() => { setShowConfirm(false); handleSubmit(); }}
                disabled={submitting}
                className="flex-1 bg-primary text-on-primary py-4 rounded-2xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    {dictionary.exam.submitting}
                  </>
                ) : (
                  <>
                    <Send size={18} /> {dictionary.exam.submitExam}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ========== Mock generators (fallback if AI exam not found) ==========
function getMockLanguageLabel(
  language: string,
  locale: InstructionLanguage
) {
  const labels: Record<string, { en: string; "zh-CN": string }> = {
    French: { en: "French", "zh-CN": "法语" },
    Spanish: { en: "Spanish", "zh-CN": "西班牙语" },
    Japanese: { en: "Japanese", "zh-CN": "日语" },
    Korean: { en: "Korean", "zh-CN": "韩语" },
    Chinese: { en: "Chinese", "zh-CN": "中文" },
    English: { en: "English", "zh-CN": "英语" },
  };

  return labels[language]?.[locale] ?? language;
}

function createOption(
  value: string,
  enLabel: string,
  zhCNLabel = enLabel
) {
  return {
    value,
    label: createLocalizedText(enLabel, zhCNLabel),
  };
}

function sameLabelOption(value: string) {
  return createOption(value, value, value);
}

function generateMockQuestions(_topic: string, lang: string): ExamQuestion[] {
  const questions: ExamQuestion[] = [];
  const englishTargetLabel = getMockLanguageLabel(lang, "en");
  const chineseTargetLabel = getMockLanguageLabel(lang, "zh-CN");
  const mcq = [
    {
      prompt: createLocalizedText(
        `What is "hello" in ${englishTargetLabel}?`,
        `以下哪个是“hello”的${chineseTargetLabel}说法？`
      ),
      options: [
        sameLabelOption("Bonjour"),
        sameLabelOption("Merci"),
        sameLabelOption("Au revoir"),
        sameLabelOption("Salut"),
      ],
    },
    {
      prompt: createLocalizedText(
        `What is "thank you" in ${englishTargetLabel}?`,
        `以下哪个是“thank you”的${chineseTargetLabel}说法？`
      ),
      options: [
        sameLabelOption("Bonjour"),
        sameLabelOption("Merci"),
        sameLabelOption("Pardon"),
        sameLabelOption("S'il vous plaît"),
      ],
    },
    {
      prompt: createLocalizedText(
        `What is "goodbye" in ${englishTargetLabel}?`,
        `以下哪个是“goodbye”的${chineseTargetLabel}说法？`
      ),
      options: [
        sameLabelOption("Bonjour"),
        sameLabelOption("Bonsoir"),
        sameLabelOption("Au revoir"),
        sameLabelOption("Merci"),
      ],
    },
    {
      prompt: createLocalizedText(
        `What is "please" in ${englishTargetLabel}?`,
        `以下哪个是“please”的${chineseTargetLabel}说法？`
      ),
      options: [
        sameLabelOption("Merci"),
        sameLabelOption("Pardon"),
        sameLabelOption("S'il vous plaît"),
        sameLabelOption("Bonjour"),
      ],
    },
    {
      prompt: createLocalizedText(
        `What is "water" in ${englishTargetLabel}?`,
        `以下哪个是“water”的${chineseTargetLabel}说法？`
      ),
      options: [
        sameLabelOption("Le café"),
        sameLabelOption("L'eau"),
        sameLabelOption("Le lait"),
        sameLabelOption("Le jus"),
      ],
    },
    {
      prompt: createLocalizedText(
        `What is "coffee" in ${englishTargetLabel}?`,
        `以下哪个是“coffee”的${chineseTargetLabel}说法？`
      ),
      options: [
        sameLabelOption("Le thé"),
        sameLabelOption("Le café"),
        sameLabelOption("Le lait"),
        sameLabelOption("L'eau"),
      ],
    },
    {
      prompt: createLocalizedText(
        `What is "bread" in ${englishTargetLabel}?`,
        `以下哪个是“bread”的${chineseTargetLabel}说法？`
      ),
      options: [
        sameLabelOption("Le pain"),
        sameLabelOption("Le gâteau"),
        sameLabelOption("La salade"),
        sameLabelOption("Le fromage"),
      ],
    },
    {
      prompt: createLocalizedText(
        `How do you say "I would like" in ${englishTargetLabel}?`,
        `“I would like”用${chineseTargetLabel}怎么说？`
      ),
      options: [
        sameLabelOption("Je suis"),
        sameLabelOption("J'ai"),
        sameLabelOption("Je voudrais"),
        sameLabelOption("Je peux"),
      ],
    },
    {
      prompt: createLocalizedText(
        `What does "l'addition" mean?`,
        `“l'addition”是什么意思？`
      ),
      options: [
        createOption("menu", "The menu", "菜单"),
        createOption("bill", "The bill", "账单"),
        createOption("table", "The table", "桌子"),
        createOption("waiter", "The waiter", "服务员"),
      ],
    },
    {
      prompt: createLocalizedText(
        `What is "big" in ${englishTargetLabel}?`,
        `以下哪个是“big”的${chineseTargetLabel}说法？`
      ),
      options: [
        sameLabelOption("Petit"),
        sameLabelOption("Grand"),
        sameLabelOption("Chaud"),
        sameLabelOption("Froid"),
      ],
    },
  ];
  mcq.forEach((item, i) => {
    questions.push({
      id: i + 1,
      type: "mcq",
      prompt: item.prompt,
      options: item.options,
    });
  });

  const fitb = [
    createLocalizedText(
      `Je ___ un café. (would like)`,
      `Je ___ un café.（would like）`
    ),
    createLocalizedText(
      `___, je voudrais un croissant. (Hello)`,
      `___, je voudrais un croissant.（Hello）`
    ),
    createLocalizedText(
      `Un café ___ lait. (with)`,
      `Un café ___ lait.（with）`
    ),
    createLocalizedText(
      `C'est ___? (how much)`,
      `C'est ___?（how much）`
    ),
    createLocalizedText(
      `L'___, s'il vous plaît. (bill)`,
      `L'___, s'il vous plaît.（bill）`
    ),
    createLocalizedText(
      `Un ___ café. (big)`,
      `Un ___ café.（big）`
    ),
    createLocalizedText(
      `___ sucre. (without)`,
      `___ sucre.（without）`
    ),
    createLocalizedText(
      `Je voudrais un ___ au chocolat. (pain)`,
      `Je voudrais un ___ au chocolat.（pain）`
    ),
    createLocalizedText(
      `Merci, au ___. (goodbye)`,
      `Merci, au ___.（goodbye）`
    ),
    createLocalizedText(
      `Un ___, s'il vous plaît. (tea)`,
      `Un ___, s'il vous plaît.（tea）`
    ),
  ];
  fitb.forEach((prompt, i) => {
    questions.push({ id: i + 11, type: "fitb", prompt });
  });

  const trans = [
    createLocalizedText(
      `Translate to ${englishTargetLabel}: "I would like a large coffee with milk, please."`,
      `翻译成${chineseTargetLabel}：“I would like a large coffee with milk, please.”`
    ),
    createLocalizedText(
      `Translate to ${englishTargetLabel}: "How much is a croissant?"`,
      `翻译成${chineseTargetLabel}：“How much is a croissant?”`
    ),
    createLocalizedText(
      `Translate to ${englishTargetLabel}: "The bill, please. Thank you."`,
      `翻译成${chineseTargetLabel}：“The bill, please. Thank you.”`
    ),
    createLocalizedText(
      `Translate to English: "Je voudrais un thé sans sucre, s'il vous plaît."`,
      `把这句翻成中文：“Je voudrais un thé sans sucre, s'il vous plaît.”`
    ),
  ];
  trans.forEach((prompt, i) => {
    questions.push({ id: i + 21, type: "translation", prompt });
  });

  return questions;
}

function generateMockRubric() {
  return [
    { id: 1, answer: "Bonjour", points: 3 },
    { id: 2, answer: "Merci", points: 3 },
    { id: 3, answer: "Au revoir", points: 3 },
    { id: 4, answer: "S'il vous plaît", points: 3 },
    { id: 5, answer: "L'eau", points: 3 },
    { id: 6, answer: "Le café", points: 3 },
    { id: 7, answer: "Le pain", points: 3 },
    { id: 8, answer: "Je voudrais", points: 3 },
    { id: 9, answer: "bill", points: 3 },
    { id: 10, answer: "Grand", points: 3 },
    { id: 11, answer: "voudrais", points: 3 },
    { id: 12, answer: "bonjour", points: 3 },
    { id: 13, answer: "au", points: 3 },
    { id: 14, answer: "combien", points: 3 },
    { id: 15, answer: "addition", points: 3 },
    { id: 16, answer: "grand", points: 3 },
    { id: 17, answer: "sans", points: 3 },
    { id: 18, answer: "pain", points: 3 },
    { id: 19, answer: "revoir", points: 3 },
    { id: 20, answer: "thé", points: 3 },
    {
      id: 21,
      answer: "Je voudrais un grand café au lait s'il vous plaît",
      points: 10,
      keywords: ["voudrais", "grand", "café", "lait", "plaît"],
    },
    {
      id: 22,
      answer: "C'est combien un croissant",
      points: 10,
      keywords: ["combien", "croissant"],
    },
    {
      id: 23,
      answer: "L'addition s'il vous plaît merci",
      points: 10,
      keywords: ["addition", "plaît", "merci"],
    },
    {
      id: 24,
      answer: createLocalizedText(
        "I would like a tea without sugar, please.",
        "我想要一杯不加糖的茶，谢谢。"
      ),
      points: 10,
      keywords: createLocalizedList(
        ["would", "like", "tea", "without", "sugar"],
        ["想要", "茶", "不加糖"]
      ),
    },
  ] satisfies ExamRubricItem[];
}
