"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "../lib/supabase";
import {
  Trophy,
  Home,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Frown,
  Meh,
  Smile,
} from "lucide-react";

interface Submission {
  id: string;
  exam_id: string;
  user_id: string;
  answers: Record<number, string>;
  scores: Record<number, number>;
  total_score: number;
  feedback_difficulty: string | null;
  feedback_tags: string[] | null;
}

export default function ResultsPage() {
  const router = useRouter();
  const params = useParams();
  const roundId = params.id as string;

  const [userId, setUserId] = useState<string | null>(null);
  const [round, setRound] = useState<any>(null);
  const [rivalry, setRivalry] = useState<any>(null);
  const [exam, setExam] = useState<any>(null);
  const [mySub, setMySub] = useState<Submission | null>(null);
  const [rivalSub, setRivalSub] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);

  // Feedback
  const [difficulty, setDifficulty] = useState<string | null>(null);
  const [feedbackSaved, setFeedbackSaved] = useState(false);

  const loadResults = useCallback(async () => {
    const { data: roundData } = await supabase
      .from("rounds")
      .select("*")
      .eq("id", roundId)
      .single();
    if (!roundData) { router.push("/lounge"); return; }
    setRound(roundData);

    const { data: rivalryData } = await supabase
      .from("rivalries")
      .select("*")
      .eq("id", roundData.rivalry_id)
      .single();
    setRivalry(rivalryData);

    const { data: examData } = await supabase
      .from("exams")
      .select("*")
      .eq("round_id", roundId)
      .single();
    if (examData) setExam(examData);

    if (examData) {
      const { data: subs } = await supabase
        .from("submissions")
        .select("*")
        .eq("exam_id", examData.id);

      if (subs) {
        const my = subs.find((s) => s.user_id === userId);
        const rival = subs.find((s) => s.user_id !== userId);
        if (my) {
          setMySub(my);
          if (my.feedback_difficulty) {
            setDifficulty(my.feedback_difficulty);
            setFeedbackSaved(true);
          }
        }
        if (rival) setRivalSub(rival);
      }
    }
  }, [roundId, router, userId]);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUserId(user.id);
    };
    init();
  }, [router]);

  useEffect(() => {
    if (userId) {
      loadResults().then(() => setLoading(false));
    }
  }, [userId, loadResults]);

  const saveFeedback = async (diff: string) => {
    if (!mySub) return;
    setDifficulty(diff);
    await supabase
      .from("submissions")
      .update({ feedback_difficulty: diff })
      .eq("id", mySub.id);
    setFeedbackSaved(true);
  };

  const myScore = mySub?.total_score ?? 0;
  const rivalScore = rivalSub?.total_score ?? null;
  const iWon = rivalScore !== null && myScore > rivalScore;
  const tied = rivalScore !== null && myScore === rivalScore;
  const bothSubmitted = mySub && rivalSub;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-on-surface-variant font-medium">Loading results...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">
        {/* ===== Hero Result ===== */}
        <section className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm text-center relative overflow-hidden">
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-primary-container/30 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-secondary-container/30 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            {bothSubmitted ? (
              <>
                <div className={`inline-block px-8 py-3 rounded-full font-black text-2xl mb-8 ${
                  iWon ? "bg-primary text-on-primary" : tied ? "bg-tertiary-container text-on-tertiary-container" : "bg-secondary text-on-secondary"
                }`}>
                  {iWon ? "VICTORY! 🏆" : tied ? "IT'S A TIE!" : "DEFEAT 😤"}
                </div>

                <div className="flex items-center justify-center gap-8 md:gap-16">
                  <div className="text-center">
                    <div className={`text-6xl md:text-7xl font-black ${iWon ? "text-primary" : "text-on-surface"}`}>
                      {myScore}
                    </div>
                    <div className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mt-2">
                      You
                    </div>
                  </div>

                  <div className="text-3xl font-black italic text-on-surface-variant/20">VS</div>

                  <div className="text-center">
                    <div className={`text-6xl md:text-7xl font-black ${!iWon && !tied ? "text-secondary" : "text-on-surface opacity-50"}`}>
                      {rivalScore}
                    </div>
                    <div className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mt-2">
                      Rival
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="text-6xl md:text-7xl font-black text-primary mb-4">{myScore}</div>
                <p className="text-on-surface-variant font-medium text-lg">
                  Your exam is submitted! Waiting for your rival to finish...
                </p>
              </>
            )}
          </div>
        </section>

        {/* ===== Prize ===== */}
        {bothSubmitted && round?.prize_text && (
          <section className="bg-tertiary-container/30 border-2 border-dashed border-tertiary/30 rounded-2xl py-6 px-10 text-center">
            <p className="text-2xl md:text-3xl font-black text-on-surface">
              {iWon ? (
                <>🎉 You won! Rival owes you: <span className="underline decoration-wavy underline-offset-8 decoration-primary">{round.prize_text}</span></>
              ) : tied ? (
                <>🤝 It&apos;s a tie — no prize this round!</>
              ) : (
                <>😅 You lost! You owe: <span className="underline decoration-wavy underline-offset-8 decoration-secondary">{round.prize_text}</span></>
              )}
            </p>
          </section>
        )}

        {/* ===== Question Review ===== */}
        {mySub && exam && (
          <section className="space-y-4">
            <h2 className="text-2xl font-black text-on-surface tracking-tight">
              Question Review
            </h2>

            <div className="bg-white rounded-[2rem] shadow-sm divide-y divide-surface-container overflow-hidden">
              {(exam.questions as any[]).map((q: any) => {
                const myAnswer = mySub.answers?.[q.id] || "(no answer)";
                const score = mySub.scores?.[q.id] ?? 0;
                const rubricItem = (exam.rubric as any[]).find((r: any) => r.id === q.id);
                const correct = rubricItem?.answer || "";
                const maxPts = parseInt(rubricItem?.points || "0");
                const isCorrect = score === maxPts && maxPts > 0;

                return (
                  <div key={q.id} className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                        Q{q.id} • {q.type === "mcq" ? "Multiple Choice" : q.type === "fitb" ? "Fill in the Blank" : "Translation"}
                      </span>
                      <span className={`flex items-center gap-1 text-sm font-bold ${isCorrect ? "text-green-600" : score > 0 ? "text-tertiary" : "text-red-500"}`}>
                        {isCorrect ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                        {score}/{maxPts}
                      </span>
                    </div>

                    <p className="text-on-surface font-medium mb-3">{q.prompt}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className={`p-3 rounded-xl text-sm ${isCorrect ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                        <div className="text-xs font-bold uppercase tracking-widest mb-1 text-on-surface-variant">Your Answer</div>
                        <div className={`font-medium ${isCorrect ? "text-green-700" : "text-red-700"}`}>{myAnswer}</div>
                      </div>
                      {!isCorrect && (
                        <div className="p-3 rounded-xl text-sm bg-primary-container/20 border border-primary/20">
                          <div className="text-xs font-bold uppercase tracking-widest mb-1 text-primary">Correct Answer</div>
                          <div className="font-medium text-on-surface">{correct}</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ===== Difficulty Feedback ===== */}
        {mySub && !feedbackSaved && (
          <section className="bg-surface-container-low rounded-[2rem] p-8 text-center space-y-6">
            <h3 className="text-xl font-black text-on-surface">How was the difficulty?</h3>
            <div className="flex justify-center gap-6">
              {[
                { val: "too_easy", icon: Smile, label: "Too Easy" },
                { val: "just_right", icon: Meh, label: "Just Right" },
                { val: "too_hard", icon: Frown, label: "Too Hard" },
              ].map(({ val, icon: Icon, label }) => (
                <button
                  key={val}
                  onClick={() => saveFeedback(val)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all ${
                    difficulty === val
                      ? "bg-primary-container text-on-primary-container"
                      : "hover:bg-surface-container text-on-surface-variant"
                  }`}
                >
                  <Icon size={36} />
                  <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {feedbackSaved && (
          <div className="text-center text-on-surface-variant font-medium">
            ✅ Thanks for your feedback!
          </div>
        )}

        {/* ===== Navigation ===== */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <button
            onClick={() => router.push(`/rivalry/${round?.rivalry_id}`)}
            className="bg-primary text-on-primary px-8 py-4 rounded-full font-black text-lg shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <ArrowRight size={20} /> Back to Rivalry
          </button>
          <button
            onClick={() => router.push("/lounge")}
            className="bg-surface-container-low text-on-surface px-8 py-4 rounded-full font-bold text-lg hover:bg-surface-container transition-colors flex items-center justify-center gap-2"
          >
            <Home size={20} /> Lounge
          </button>
        </div>
      </div>
    </div>
  );
}