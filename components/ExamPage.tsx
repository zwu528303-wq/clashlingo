"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "../lib/supabase";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  Send,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface Question {
  id: number;
  type: "mcq" | "fitb" | "translation";
  prompt: string;
  options?: string[];
}

export default function ExamPage() {
  const router = useRouter();
  const params = useParams();
  const roundId = params.id as string;

  const [userId, setUserId] = useState<string | null>(null);
  const [round, setRound] = useState<any>(null);
  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // Exam state
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(2400); // 40 minutes
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const loadExam = useCallback(async () => {
    const { data: roundData } = await supabase
      .from("rounds")
      .select("*")
      .eq("id", roundId)
      .single();

    if (!roundData) {
      router.push("/lounge");
      return;
    }
    setRound(roundData);

    // Check for existing exam
    let { data: examData } = await supabase
      .from("exams")
      .select("*")
      .eq("round_id", roundId)
      .single();

    if (!examData) {
      // Generate mock exam (will be AI-generated in Phase 4)
      const mockQuestions = generateMockQuestions(
        roundData.topic || "General",
        roundData.target_lang || "French"
      );
      const mockRubric = generateMockRubric(mockQuestions);

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

    if (examData) {
      setExam(examData);
      setQuestions(examData.questions as Question[]);
    }
  }, [roundId, router]);

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);
      await loadExam();
      setLoading(false);
    };
    init();
  }, [router, loadExam]);

  // Timer
  useEffect(() => {
    if (loading || submitting) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, submitting]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const handleAnswer = (qId: number, answer: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: answer }));
  };

  const handleSubmit = async () => {
    if (!userId || !exam || submitting) return;
    setSubmitting(true);

    // Simple scoring
    const rubric = exam.rubric as any[];
    let totalScore = 0;
    const scores: Record<number, number> = {};

    questions.forEach((q) => {
      const myAnswer = (answers[q.id] || "").trim().toLowerCase();
      const rubricItem = rubric.find((r: any) => r.id === q.id);
      const correctAnswer = (rubricItem?.answer || "").toLowerCase();

      let score = 0;
      if (q.type === "mcq") {
        score = myAnswer === correctAnswer ? 3 : 0;
      } else if (q.type === "fitb") {
        score = myAnswer === correctAnswer ? 3 : 0;
      } else if (q.type === "translation") {
        // Simple check — partial credit if some words match
        const correctWords = correctAnswer.split(" ");
        const myWords = myAnswer.split(" ");
        const matches = correctWords.filter((w: string) =>
          myWords.includes(w)
        ).length;
        const ratio = correctWords.length > 0 ? matches / correctWords.length : 0;
        score = Math.round(ratio * 10);
      }

      scores[q.id] = score;
      totalScore += score;
    });

    // Save submission
    await supabase.from("submissions").insert({
      exam_id: exam.id,
      user_id: userId,
      answers: answers,
      scores: scores,
      total_score: totalScore,
      started_at: new Date(Date.now() - (2400 - timeLeft) * 1000).toISOString(),
      submitted_at: new Date().toISOString(),
    });

    // Check if both submitted
    const { data: allSubs } = await supabase
      .from("submissions")
      .select("id")
      .eq("exam_id", exam.id);

    if (allSubs && allSubs.length >= 2) {
      await supabase
        .from("rounds")
        .update({ status: "completed" })
        .eq("id", roundId);
    }

    router.push(`/round/${roundId}/results`);
  };

  const answeredCount = Object.keys(answers).length;
  const q = questions[currentQ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-on-surface-variant font-medium">
          Loading exam...
        </div>
      </div>
    );
  }

  if (!q) return null;

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* ===== Top Bar ===== */}
      <header className="sticky top-0 z-50 bg-surface/95 backdrop-blur-sm border-b border-surface-container px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="text-sm font-bold text-on-surface-variant">
            {answeredCount}/{questions.length} answered
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
            <Send size={14} /> Submit
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
          {/* Question header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="bg-surface-container-high text-on-surface-variant px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                {q.type === "mcq"
                  ? "Multiple Choice"
                  : q.type === "fitb"
                  ? "Fill in the Blank"
                  : "Translation"}
              </span>
              <span className="text-sm text-on-surface-variant font-medium">
                Q{q.id} of {questions.length}
              </span>
            </div>
            <button
              onClick={() =>
                setFlagged((prev) => ({ ...prev, [q.id]: !prev[q.id] }))
              }
              className={`flex items-center gap-1 text-sm font-bold transition-colors ${
                flagged[q.id]
                  ? "text-tertiary"
                  : "text-on-surface-variant hover:text-tertiary"
              }`}
            >
              <Flag size={14} className={flagged[q.id] ? "fill-current" : ""} />
              {flagged[q.id] ? "Flagged" : "Flag"}
            </button>
          </div>

          {/* Prompt */}
          <h2 className="text-xl md:text-2xl font-bold text-on-surface leading-relaxed mb-8">
            {q.prompt}
          </h2>

          {/* Answer area */}
          {q.type === "mcq" && q.options && (
            <div className="space-y-3">
              {q.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(q.id, opt)}
                  className={`w-full text-left p-5 rounded-2xl font-medium transition-all border-2 ${
                    answers[q.id] === opt
                      ? "border-primary bg-primary-container/30 text-on-surface"
                      : "border-surface-container bg-surface-container-lowest text-on-surface hover:border-primary/40"
                  }`}
                >
                  <span className="font-bold text-on-surface-variant mr-3">
                    {String.fromCharCode(65 + i)}.
                  </span>
                  {opt}
                </button>
              ))}
            </div>
          )}

          {q.type === "fitb" && (
            <input
              type="text"
              value={answers[q.id] || ""}
              onChange={(e) => handleAnswer(q.id, e.target.value)}
              placeholder="Type your answer..."
              className="w-full bg-surface-container-lowest border-2 border-surface-container text-on-surface rounded-2xl py-4 px-6 text-lg outline-none focus:border-primary transition-all"
            />
          )}

          {q.type === "translation" && (
            <textarea
              value={answers[q.id] || ""}
              onChange={(e) => handleAnswer(q.id, e.target.value)}
              placeholder="Write your translation..."
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
            <ChevronLeft size={20} /> Previous
          </button>

          <button
            onClick={() =>
              setCurrentQ(Math.min(questions.length - 1, currentQ + 1))
            }
            disabled={currentQ === questions.length - 1}
            className="flex items-center gap-2 text-on-surface-variant font-bold hover:text-primary transition-colors disabled:opacity-30"
          >
            Next <ChevronRight size={20} />
          </button>
        </div>
      </footer>

      {/* ===== Submit Confirmation Modal ===== */}
      {showConfirm && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle size={24} className="text-primary" />
              <h3 className="text-xl font-black text-on-surface">
                Submit Exam?
              </h3>
            </div>

            <p className="text-on-surface-variant mb-2">
              You&apos;ve answered{" "}
              <strong>
                {answeredCount} of {questions.length}
              </strong>{" "}
              questions.
            </p>

            {answeredCount < questions.length && (
              <p className="text-sm text-red-600 font-medium mb-6">
                ⚠️ {questions.length - answeredCount} questions are unanswered
                and will receive 0 points.
              </p>
            )}

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 bg-surface-container-low text-on-surface py-4 rounded-2xl font-bold hover:bg-surface-container transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={() => {
                  setShowConfirm(false);
                  handleSubmit();
                }}
                disabled={submitting}
                className="flex-1 bg-primary text-on-primary py-4 rounded-2xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <>
                    <Send size={18} /> Submit
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

// ========== Mock Data Generators (Phase 4 = AI replaces these) ==========

function generateMockQuestions(topic: string, lang: string): Question[] {
  const questions: Question[] = [];

  // 10 MCQ (3 pts each = 30 pts)
  const mcqItems = [
    { prompt: `What is "hello" in ${lang}?`, options: ["Bonjour", "Merci", "Au revoir", "Salut"], answer: "Bonjour" },
    { prompt: `What is "thank you" in ${lang}?`, options: ["Bonjour", "Merci", "Pardon", "S'il vous plaît"], answer: "Merci" },
    { prompt: `What is "goodbye" in ${lang}?`, options: ["Bonjour", "Bonsoir", "Au revoir", "Merci"], answer: "Au revoir" },
    { prompt: `What is "please" in ${lang}?`, options: ["Merci", "Pardon", "S'il vous plaît", "Bonjour"], answer: "S'il vous plaît" },
    { prompt: `What is "water" in ${lang}?`, options: ["Le café", "L'eau", "Le lait", "Le jus"], answer: "L'eau" },
    { prompt: `What is "coffee" in ${lang}?`, options: ["Le thé", "Le café", "Le lait", "L'eau"], answer: "Le café" },
    { prompt: `What is "bread" in ${lang}?`, options: ["Le pain", "Le gâteau", "La salade", "Le fromage"], answer: "Le pain" },
    { prompt: `How do you say "I would like" in ${lang}?`, options: ["Je suis", "J'ai", "Je voudrais", "Je peux"], answer: "Je voudrais" },
    { prompt: `What does "l'addition" mean?`, options: ["The menu", "The bill", "The table", "The waiter"], answer: "The bill" },
    { prompt: `What is "big" in ${lang}?`, options: ["Petit", "Grand", "Chaud", "Froid"], answer: "Grand" },
  ];

  mcqItems.forEach((item, i) => {
    questions.push({ id: i + 1, type: "mcq", prompt: item.prompt, options: item.options });
  });

  // 10 Fill in the blank (3 pts each = 30 pts)
  const fitbItems = [
    `Je ___ un café. (would like)`,
    `___, je voudrais un croissant. (Hello)`,
    `Un café ___ lait, s'il vous plaît. (with)`,
    `C'est ___? (how much)`,
    `L'___, s'il vous plaît. (bill)`,
    `Un ___ café. (big/large)`,
    `___ sucre. (without)`,
    `Je voudrais un ___ au chocolat. (pain)`,
    `Merci, au ___. (goodbye)`,
    `Un ___, s'il vous plaît. (tea)`,
  ];

  fitbItems.forEach((prompt, i) => {
    questions.push({ id: i + 11, type: "fitb", prompt });
  });

  // 4 Translation (10 pts each = 40 pts)
  const transItems = [
    `Translate to ${lang}: "I would like a large coffee with milk, please."`,
    `Translate to ${lang}: "How much is a croissant?"`,
    `Translate to ${lang}: "The bill, please. Thank you."`,
    `Translate to English: "Je voudrais un thé sans sucre, s'il vous plaît."`,
  ];

  transItems.forEach((prompt, i) => {
    questions.push({ id: i + 21, type: "translation", prompt });
  });

  return questions;
}

function generateMockRubric(questions: Question[]) {
  const answers: Record<string, string>[] = [
    // MCQ answers
    { id: "1", answer: "Bonjour", points: "3" },
    { id: "2", answer: "Merci", points: "3" },
    { id: "3", answer: "Au revoir", points: "3" },
    { id: "4", answer: "S'il vous plaît", points: "3" },
    { id: "5", answer: "L'eau", points: "3" },
    { id: "6", answer: "Le café", points: "3" },
    { id: "7", answer: "Le pain", points: "3" },
    { id: "8", answer: "Je voudrais", points: "3" },
    { id: "9", answer: "The bill", points: "3" },
    { id: "10", answer: "Grand", points: "3" },
    // FITB answers
    { id: "11", answer: "voudrais", points: "3" },
    { id: "12", answer: "bonjour", points: "3" },
    { id: "13", answer: "au", points: "3" },
    { id: "14", answer: "combien", points: "3" },
    { id: "15", answer: "addition", points: "3" },
    { id: "16", answer: "grand", points: "3" },
    { id: "17", answer: "sans", points: "3" },
    { id: "18", answer: "pain", points: "3" },
    { id: "19", answer: "revoir", points: "3" },
    { id: "20", answer: "thé", points: "3" },
    // Translation answers
    { id: "21", answer: "Je voudrais un grand café au lait s'il vous plaît", points: "10" },
    { id: "22", answer: "C'est combien un croissant", points: "10" },
    { id: "23", answer: "L'addition s'il vous plaît merci", points: "10" },
    { id: "24", answer: "I would like a tea without sugar please", points: "10" },
  ];

  return answers.map((a) => ({ ...a, id: parseInt(a.id) }));
}