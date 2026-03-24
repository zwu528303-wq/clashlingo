"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "../lib/supabase";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  BookOpen,
  Swords,
  Trophy,
  Loader2,
} from "lucide-react";

interface Round {
  id: string;
  rivalry_id: string;
  round_number: number;
  target_lang: string;
  topic: string | null;
  study_days: number | null;
  prize_text: string | null;
  status: string;
  player_a_confirmed: boolean;
  player_b_confirmed: boolean;
  player_a_exam_ready: boolean;
  player_b_exam_ready: boolean;
  countdown_start: string | null;
  exam_at: string | null;
  exam_started_at: string | null;
  syllabus: Record<string, unknown> | null;
  created_at: string;
}

interface Rivalry {
  id: string;
  player_a_id: string;
  player_b_id: string;
  player_a_lang: string;
}

export default function RoundPage() {
  const router = useRouter();
  const params = useParams();
  const roundId = params.id as string;

  const [userId, setUserId] = useState<string | null>(null);
  const [round, setRound] = useState<Round | null>(null);
  const [rivalry, setRivalry] = useState<Rivalry | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Countdown
  const [timeLeft, setTimeLeft] = useState("");

  const isPlayerA = rivalry?.player_a_id === userId;

  const loadRound = useCallback(async () => {
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

    const { data: rivalryData } = await supabase
      .from("rivalries")
      .select("*")
      .eq("id", roundData.rivalry_id)
      .single();

    if (rivalryData) setRivalry(rivalryData);
  }, [roundId, router]);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUserId(user.id);
      await loadRound();
      setLoading(false);
    };
    init();
  }, [router, loadRound]);

  // Realtime subscription for round updates
  useEffect(() => {
    const channel = supabase
      .channel(`round-${roundId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rounds", filter: `id=eq.${roundId}` },
        (payload) => {
          setRound(payload.new as Round);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roundId]);

  // Countdown timer
  useEffect(() => {
    if (round?.status !== "countdown" || !round.exam_at) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const exam = new Date(round.exam_at!).getTime();
      const diff = exam - now;

      if (diff <= 0) {
        setTimeLeft("00:00:00");
        loadRound(); // Refresh to check status change
        clearInterval(interval);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`);
      } else {
        setTimeLeft(`${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [round?.status, round?.exam_at, loadRound]);

  // ========== Actions ==========

  const handleConfirm = async () => {
    if (!round || !userId) return;
    setActionLoading(true);

    const field = isPlayerA ? "player_a_confirmed" : "player_b_confirmed";
    await supabase.from("rounds").update({ [field]: true }).eq("id", round.id);

    // Check if both confirmed
    const { data: updated } = await supabase
      .from("rounds")
      .select("player_a_confirmed, player_b_confirmed")
      .eq("id", round.id)
      .single();

    if (updated?.player_a_confirmed && updated?.player_b_confirmed) {
      // Both confirmed → move to countdown
      const countdownStart = new Date().toISOString();
      const examAt = new Date(
        Date.now() + (round.study_days || 7) * 24 * 60 * 60 * 1000
      ).toISOString();

      await supabase
        .from("rounds")
        .update({
          status: "countdown",
          countdown_start: countdownStart,
          exam_at: examAt,
        })
        .eq("id", round.id);
    }

    await loadRound();
    setActionLoading(false);
  };

  const myConfirmed = isPlayerA ? round?.player_a_confirmed : round?.player_b_confirmed;
  const rivalConfirmed = isPlayerA ? round?.player_b_confirmed : round?.player_a_confirmed;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-on-surface-variant font-medium">Loading...</div>
      </div>
    );
  }

  if (!round || !rivalry) return null;

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5 max-w-4xl mx-auto">
        <button
          onClick={() => router.push(`/rivalry/${rivalry.id}`)}
          className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-medium"
        >
          <ArrowLeft size={20} />
          Back
        </button>
        <div className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">
          Round {round.round_number}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 pb-12">
        {/* ========== topic_selection ========== */}
        {round.status === "topic_selection" && (
          <div className="space-y-8 text-center max-w-2xl mx-auto">
            <div>
              <h1 className="text-4xl font-black text-on-surface tracking-tighter mb-2">
                Round {round.round_number}
              </h1>
              <p className="text-on-surface-variant text-lg">
                Waiting for syllabus to be generated...
              </p>
            </div>

            <div className="bg-surface-container-lowest rounded-[2rem] p-8 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">Topic</span>
                <span className="text-on-surface font-bold text-lg">{round.topic}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">Language</span>
                <span className="text-on-surface font-bold text-lg">{round.target_lang}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">Study Days</span>
                <span className="text-on-surface font-bold text-lg">{round.study_days} days</span>
              </div>
              {round.prize_text && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">Prize</span>
                  <span className="text-on-surface font-bold text-lg italic">{round.prize_text}</span>
                </div>
              )}
            </div>

            <p className="text-on-surface-variant">
              The syllabus will be generated soon. Once ready, both players need to confirm.
            </p>

            {/* Temporary: move to confirming manually for now (AI integration later) */}
            <button
              onClick={async () => {
                // For now, create a placeholder syllabus and move to confirming
                await supabase
                  .from("rounds")
                  .update({
                    status: "confirming",
                    syllabus: {
                      topic: round.topic,
                      target_lang: round.target_lang,
                      can_do: [
                        `Discuss "${round.topic}" in ${round.target_lang}`,
                        `Understand common vocabulary related to ${round.topic}`,
                        `Form basic sentences about ${round.topic}`,
                      ],
                      vocabulary: ["(Syllabus will be AI-generated in Phase 4)"],
                      grammar: ["(Grammar points will be AI-generated in Phase 4)"],
                      expressions: ["(Expressions will be AI-generated in Phase 4)"],
                      listening: ["(Listening phrases will be AI-generated in Phase 4)"],
                    },
                  })
                  .eq("id", round.id);
                await loadRound();
              }}
              className="bg-primary text-on-primary px-8 py-4 rounded-full font-black text-lg shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              Generate Syllabus (Placeholder)
            </button>
          </div>
        )}

        {/* ========== confirming ========== */}
        {round.status === "confirming" && (
          <div className="space-y-8 max-w-2xl mx-auto">
            <div className="text-center">
              <h1 className="text-4xl font-black text-on-surface tracking-tighter mb-2">
                Review & Confirm
              </h1>
              <p className="text-on-surface-variant text-lg">
                Both players must confirm before the countdown starts.
              </p>
            </div>

            {/* Syllabus Preview */}
            {round.syllabus && (
              <div className="bg-surface-container-lowest rounded-[2rem] p-8 shadow-sm space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen size={20} className="text-primary" />
                  <h2 className="text-xl font-black text-on-surface">Exam Scope</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                      🎯 Can Do Objectives
                    </h3>
                    <ul className="space-y-2">
                      {(round.syllabus as any).can_do?.map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-3 text-on-surface">
                          <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></div>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-surface-container">
                    <p className="text-sm text-on-surface-variant font-medium">
                      📝 Full syllabus with vocabulary, grammar, expressions will be available in Phase 4 (AI integration).
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Round Info */}
            <div className="bg-surface-container-low rounded-2xl p-6 flex flex-wrap gap-6 justify-center">
              <div className="text-center">
                <div className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Topic</div>
                <div className="font-bold text-on-surface">{round.topic}</div>
              </div>
              <div className="text-center">
                <div className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Study Days</div>
                <div className="font-bold text-on-surface">{round.study_days}</div>
              </div>
              {round.prize_text && (
                <div className="text-center">
                  <div className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">Prize</div>
                  <div className="font-bold text-on-surface italic">{round.prize_text}</div>
                </div>
              )}
            </div>

            {/* Confirmation Status */}
            <div className="bg-surface-container-lowest rounded-[2rem] p-8 shadow-sm">
              <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-6 text-center">
                Confirmation Status
              </h3>
              <div className="flex justify-center gap-12">
                <div className="flex flex-col items-center gap-3">
                  {myConfirmed ? (
                    <CheckCircle2 size={48} className="text-primary" />
                  ) : (
                    <Circle size={48} className="text-on-surface-variant/30" />
                  )}
                  <span className="font-bold text-on-surface">You</span>
                  <span className="text-xs font-bold text-on-surface-variant uppercase">
                    {myConfirmed ? "Ready" : "Pending"}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-3">
                  {rivalConfirmed ? (
                    <CheckCircle2 size={48} className="text-secondary" />
                  ) : (
                    <Circle size={48} className="text-on-surface-variant/30" />
                  )}
                  <span className="font-bold text-on-surface">Rival</span>
                  <span className="text-xs font-bold text-on-surface-variant uppercase">
                    {rivalConfirmed ? "Ready" : "Pending"}
                  </span>
                </div>
              </div>
            </div>

            {/* Confirm Button */}
            {!myConfirmed ? (
              <button
                onClick={handleConfirm}
                disabled={actionLoading}
                className="w-full bg-primary text-on-primary py-5 rounded-2xl font-black text-xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {actionLoading ? (
                  <Loader2 size={24} className="animate-spin" />
                ) : (
                  <>
                    <Swords size={24} /> Ready to Clash
                  </>
                )}
              </button>
            ) : (
              <div className="text-center py-4">
                <p className="text-on-surface-variant font-bold text-lg">
                  ✅ You&apos;re confirmed! Waiting for your rival...
                </p>
              </div>
            )}
          </div>
        )}

        {/* ========== countdown ========== */}
        {round.status === "countdown" && (
          <div className="space-y-8 text-center max-w-2xl mx-auto">
            <div>
              <div className="inline-block px-6 py-2 bg-tertiary-container text-on-tertiary-container rounded-full font-bold text-xs uppercase tracking-[0.2em] mb-6">
                Study Phase
              </div>
              <h1 className="text-6xl md:text-8xl font-black text-on-surface tracking-tighter leading-none mb-4">
                <span className="text-primary">{timeLeft || "..."}</span>
              </h1>
              <p className="text-on-surface-variant text-lg">
                Study hard! The exam starts when the countdown ends.
              </p>
            </div>

            {/* Syllabus Access */}
            <div className="bg-surface-container-lowest rounded-[2rem] p-8 shadow-sm">
              <div className="flex items-center gap-2 justify-center mb-4">
                <BookOpen size={20} className="text-primary" />
                <h2 className="text-xl font-black text-on-surface">Your Study Material</h2>
              </div>
              <p className="text-on-surface-variant mb-6">
                Topic: <strong>{round.topic}</strong> • {round.target_lang}
              </p>
              <p className="text-sm text-on-surface-variant">
                Study using your preferred tools and methods. The syllabus tells you what to learn — how you learn is up to you.
              </p>
            </div>

            {/* Prize */}
            {round.prize_text && (
              <div className="bg-tertiary-container/30 border-2 border-dashed border-tertiary/30 rounded-2xl py-6 px-10 inline-flex flex-col items-center">
                <span className="text-on-surface-variant text-xs uppercase tracking-widest mb-1 font-bold">
                  <Trophy size={14} className="inline mr-1" /> Stake
                </span>
                <span className="text-xl font-bold text-on-surface italic">
                  &ldquo;{round.prize_text}&rdquo;
                </span>
              </div>
            )}
          </div>
        )}

        {/* ========== exam_ready ========== */}
        {round.status === "exam_ready" && (
          <div className="space-y-8 text-center max-w-2xl mx-auto">
            <h1 className="text-4xl font-black text-on-surface tracking-tighter">
              Exam is Ready
            </h1>
            <p className="text-on-surface-variant text-lg">
              Both players need to click Ready to start the exam at the same time.
            </p>

            <div className="flex justify-center gap-12">
              <div className="flex flex-col items-center gap-3">
                {(isPlayerA ? round.player_a_exam_ready : round.player_b_exam_ready) ? (
                  <CheckCircle2 size={64} className="text-primary" />
                ) : (
                  <Circle size={64} className="text-on-surface-variant/30" />
                )}
                <span className="font-bold">You</span>
              </div>
              <div className="flex flex-col items-center gap-3">
                {(isPlayerA ? round.player_b_exam_ready : round.player_a_exam_ready) ? (
                  <CheckCircle2 size={64} className="text-secondary" />
                ) : (
                  <Circle size={64} className="text-on-surface-variant/30" />
                )}
                <span className="font-bold">Rival</span>
              </div>
            </div>

            <button
              onClick={async () => {
                setActionLoading(true);
                const field = isPlayerA ? "player_a_exam_ready" : "player_b_exam_ready";
                await supabase.from("rounds").update({ [field]: true }).eq("id", round.id);

                const { data: updated } = await supabase
                  .from("rounds")
                  .select("player_a_exam_ready, player_b_exam_ready")
                  .eq("id", round.id)
                  .single();

                if (updated?.player_a_exam_ready && updated?.player_b_exam_ready) {
                  await supabase
                    .from("rounds")
                    .update({
                      status: "exam_live",
                      exam_started_at: new Date().toISOString(),
                    })
                    .eq("id", round.id);
                }

                await loadRound();
                setActionLoading(false);
              }}
              disabled={actionLoading || (isPlayerA ? round.player_a_exam_ready : round.player_b_exam_ready)}
              className="bg-primary text-on-primary py-5 px-12 rounded-full font-black text-xl shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              {actionLoading ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (isPlayerA ? round.player_a_exam_ready : round.player_b_exam_ready) ? (
                "Waiting for rival..."
              ) : (
                "Ready to Start"
              )}
            </button>
          </div>
        )}

        {/* ========== exam_live ========== */}
        {round.status === "exam_live" && (
          <div className="space-y-8 text-center max-w-2xl mx-auto">
            <h1 className="text-4xl font-black text-on-surface tracking-tighter">
              Exam is Live! 🔥
            </h1>
            <p className="text-on-surface-variant text-lg">
              The exam page will be built in Phase 3. For now, this is a placeholder.
            </p>
            <button
              onClick={() => router.push(`/round/${round.id}/exam`)}
              className="bg-primary text-on-primary py-5 px-12 rounded-full font-black text-xl shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              Go to Exam
            </button>
          </div>
        )}

        {/* ========== completed ========== */}
        {round.status === "completed" && (
          <div className="space-y-8 text-center max-w-2xl mx-auto">
            <h1 className="text-4xl font-black text-on-surface tracking-tighter">
              Round Complete! 🎉
            </h1>
            <button
              onClick={() => router.push(`/round/${round.id}/results`)}
              className="bg-primary text-on-primary py-5 px-12 rounded-full font-black text-xl shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              View Results
            </button>
          </div>
        )}
      </div>
    </div>
  );
}