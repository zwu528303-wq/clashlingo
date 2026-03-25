"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "../lib/supabase";
import type {
  Rivalry,
  RivalryLedger,
  RivalryLedgerRound,
  Round,
} from "@/lib/domain-types";
import {
  ArrowLeft,
  Swords,
  Flame,
  Plus,
  ArrowRight,
  Copy,
  Check,
  Settings,
} from "lucide-react";
import { resolveDisplayName } from "@/lib/profile";

interface UserProfile {
  id: string;
  display_name?: string;
}

export default function RivalryDashboard() {
  const router = useRouter();
  const params = useParams();
  const rivalryId = params.id as string;

  const [userId, setUserId] = useState<string | null>(null);
  const [rivalry, setRivalry] = useState<Rivalry | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);
  const [playerAName, setPlayerAName] = useState("Player A");
  const [playerBName, setPlayerBName] = useState("Player B");
  const [copied, setCopied] = useState(false);

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

      const { data: rivalryData, error } = await supabase
        .from("rivalries")
        .select("*")
        .eq("id", rivalryId)
        .single();

      if (error || !rivalryData) {
        router.push("/lounge");
        return;
      }

      if (
        rivalryData.player_a_id !== user.id &&
        rivalryData.player_b_id !== user.id
      ) {
        router.push("/lounge");
        return;
      }

      setRivalry(rivalryData);

      const { data: aData } = await supabase
        .from("users")
        .select("id, display_name")
        .eq("id", rivalryData.player_a_id)
        .single<UserProfile>();

      if (aData) {
        setPlayerAName(resolveDisplayName(aData.display_name, "Player A"));
      }

      if (rivalryData.player_b_id) {
        const { data: bData } = await supabase
          .from("users")
          .select("id, display_name")
          .eq("id", rivalryData.player_b_id)
          .single<UserProfile>();

        if (bData) {
          setPlayerBName(resolveDisplayName(bData.display_name, "Player B"));
        }
      }

      const { data: roundsData } = await supabase
        .from("rounds")
        .select("*")
        .eq("rivalry_id", rivalryId)
        .order("round_number", { ascending: false });

      if (roundsData) {
        setRounds(roundsData);
      }

      setLoading(false);
    };

    init();
  }, [router, rivalryId]);

  const handleCopy = async () => {
    if (!rivalry) return;
    await navigator.clipboard.writeText(rivalry.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isPlayerA = rivalry?.player_a_id === userId;
  const isPaired = !!rivalry?.player_b_id;
  const lang = isPlayerA
    ? rivalry?.player_a_lang
    : rivalry?.player_b_lang || rivalry?.player_a_lang;

  // Find current active round (not completed)
  const activeRound = rounds.find((r) => r.status !== "completed");
  const completedRounds = rounds.filter((r) => r.status === "completed");

  // Ledger stats
  const ledger = ((rivalry?.cumulative_ledger ?? {}) as RivalryLedger);
  const rivalId = isPlayerA ? rivalry?.player_b_id : rivalry?.player_a_id;
  const myWins = (userId && ledger.wins?.[userId]) || 0;
  const rivalWins = (rivalId && ledger.wins?.[rivalId]) || 0;
  const myStreak = (() => {
    if (!ledger.rounds?.length || !userId) return 0;
    let streak = 0;
    for (let i = ledger.rounds.length - 1; i >= 0; i--) {
      if (ledger.rounds[i].winner_id === userId) streak++;
      else break;
    }
    return streak;
  })();
  const getRoundResult = (roundId: string) =>
    ledger.rounds?.find((r: RivalryLedgerRound) => r.round_id === roundId);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-on-surface-variant font-medium">Loading...</div>
      </div>
    );
  }

  if (!rivalry) return null;

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-5 max-w-5xl mx-auto">
        <button
          onClick={() => router.push("/lounge")}
          className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-medium"
        >
          <ArrowLeft size={20} />
          Back to Lounge
        </button>
        <button
          onClick={() => router.push("/settings")}
          className="text-on-surface-variant hover:text-primary transition-colors"
        >
          <Settings size={20} />
        </button>
      </header>

      <div className="max-w-5xl mx-auto px-6 pb-12 space-y-10">
        {/* ========== Hero VS Card ========== */}
        <section className="relative bg-surface-container-low rounded-[2.5rem] p-8 md:p-12 overflow-hidden">
          <div className="absolute -top-12 -left-12 w-64 h-64 bg-primary-container/30 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-secondary-container/30 rounded-full blur-3xl"></div>

          <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Player A */}
            <div className="flex flex-col items-center md:items-end text-center md:text-right space-y-4">
              <div className="relative">
                <div className="w-32 h-32 md:w-44 md:h-44 rounded-[2rem] bg-primary-container flex items-center justify-center text-primary text-6xl font-black shadow-2xl -rotate-3">
                  {playerAName.charAt(0).toUpperCase()}
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-black text-primary tracking-tighter">
                  {isPlayerA ? "You" : playerAName}
                </h2>
                <p className="text-on-surface-variant font-medium">
                  {rivalry.player_a_lang} Learner
                </p>
              </div>
            </div>

            {/* Player B */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-4">
              {isPaired ? (
                <>
                  <div className="relative">
                    <div className="w-32 h-32 md:w-44 md:h-44 rounded-[2rem] bg-secondary-container flex items-center justify-center text-secondary text-6xl font-black shadow-2xl rotate-3">
                      {playerBName.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-secondary tracking-tighter">
                      {!isPlayerA ? "You" : playerBName}
                    </h2>
                    <p className="text-on-surface-variant font-medium">
                      {rivalry.player_b_lang || rivalry.player_a_lang} Learner
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center md:items-start space-y-4">
                  <div className="w-32 h-32 md:w-44 md:h-44 rounded-[2rem] bg-surface-container flex items-center justify-center text-on-surface-variant text-6xl font-black shadow-lg rotate-3 border-4 border-dashed border-surface-container-high">
                    ?
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-on-surface-variant tracking-tighter">
                      Waiting for rival...
                    </h2>
                    <button
                      onClick={handleCopy}
                      className="mt-2 flex items-center gap-2 text-primary font-bold hover:underline"
                    >
                      {copied ? (
                        <Check size={16} />
                      ) : (
                        <Copy size={16} />
                      )}
                      Code: {rivalry.invite_code}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* VS Badge (desktop) */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center justify-center">
              <div className="w-20 h-20 bg-surface-container-lowest rounded-full shadow-2xl flex items-center justify-center border-8 border-surface-container-low">
                <span className="text-xl font-black italic text-on-surface-variant">
                  VS
                </span>
              </div>
            </div>
          </div>

          {/* Language & Round Info */}
          <div className="mt-10 flex flex-wrap gap-4 justify-center">
            <div className="bg-surface-container-lowest px-6 py-3 rounded-full text-sm font-bold text-on-surface shadow-sm">
              {lang}
            </div>
            <div className="bg-surface-container-lowest px-6 py-3 rounded-full text-sm font-bold text-on-surface shadow-sm">
              Round {rivalry.current_round_num}
            </div>
            <div className="bg-surface-container-lowest px-6 py-3 rounded-full text-sm font-bold text-on-surface shadow-sm">
              {completedRounds.length} matches played
            </div>
          </div>
        </section>

        {isPaired ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* ========== Match History ========== */}
            <div className="lg:col-span-2 space-y-6">
              <h3 className="text-2xl font-black tracking-tight px-2">
                Match History
              </h3>

              {completedRounds.length === 0 ? (
                <div className="bg-surface-container-lowest rounded-[2rem] p-12 text-center">
                  <Swords
                    size={48}
                    className="text-on-surface-variant/30 mx-auto mb-4"
                  />
                  <p className="text-on-surface-variant font-medium text-lg">
                    No matches yet. Start your first round!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {completedRounds.map((round) => {
                    const result = getRoundResult(round.id);
                    const iWon = result?.winner_id === userId;
                    const tied = result !== undefined && result.winner_id === null;
                    const myScore = userId ? result?.scores?.[userId] : undefined;
                    const rivalScore = rivalId ? result?.scores?.[rivalId] : undefined;
                    return (
                      <div
                        key={round.id}
                        onClick={() => router.push(`/round/${round.id}/results`)}
                        className="bg-surface-container-lowest p-6 rounded-[1.5rem] flex items-center justify-between hover:scale-[1.02] transition-transform duration-200 shadow-sm cursor-pointer"
                      >
                        <div className="flex items-center gap-6">
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-xl ${iWon ? "bg-primary-container text-primary" : tied ? "bg-tertiary-container text-on-tertiary-container" : "bg-surface-container text-on-surface-variant"}`}>
                            {round.round_number}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="font-bold text-lg text-on-surface">
                                Round {round.round_number}
                              </div>
                              {result && (
                                <span className={`text-xs font-black px-2 py-0.5 rounded-full ${iWon ? "bg-primary-container text-on-primary-container" : tied ? "bg-tertiary-container text-on-tertiary-container" : "bg-surface-container-high text-on-surface-variant"}`}>
                                  {iWon ? "Win" : tied ? "Tie" : "Loss"}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {round.target_lang && (
                                <span className="text-xs font-bold px-2 py-0.5 bg-primary-container text-on-primary-container rounded-full">
                                  {round.target_lang}
                                </span>
                              )}
                              <span className="text-sm text-on-surface-variant font-medium">
                                {round.topic || "No topic"}
                              </span>
                              {myScore !== undefined && rivalScore !== undefined && (
                                <span className="text-sm font-bold text-on-surface-variant">
                                  · {myScore}–{rivalScore}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <ArrowRight size={20} className="text-on-surface-variant" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ========== Action Panel ========== */}
            <div className="space-y-6">
              {/* Start / Continue Round */}
              <div className="bg-surface-container-high rounded-[2rem] p-8 text-center space-y-6 flex flex-col items-center">
                <div className="w-20 h-20 bg-primary-container rounded-[1.5rem] flex items-center justify-center shadow-inner rotate-3">
                  <Swords
                    size={40}
                    className="text-primary fill-primary/20"
                  />
                </div>

                {activeRound ? (
                  <>
                    <div>
                      <h4 className="text-2xl font-black mb-2">
                        Round {activeRound.round_number}
                      </h4>
                      {activeRound.target_lang && (
                        <p className="text-on-surface-variant text-sm font-medium mb-1">
                          Language:{" "}
                          <span className="text-primary font-bold">
                            {activeRound.target_lang}
                          </span>
                        </p>
                      )}
                      <p className="text-on-surface-variant text-sm font-medium">
                        Status:{" "}
                        <span className="text-primary font-bold">
                          {activeRound.status.replace("_", " ")}
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        router.push(`/round/${activeRound.id}`)
                      }
                      className="w-full bg-primary text-on-primary py-5 rounded-full font-black text-lg shadow-xl hover:scale-105 active:scale-95 transition-all"
                    >
                      Continue Round
                    </button>
                  </>
                ) : (
                  <>
                    <div>
                      <h4 className="text-2xl font-black mb-2">
                        Ready for Round{" "}
                        {rivalry.current_round_num + 1}?
                      </h4>
                      <p className="text-on-surface-variant text-sm px-4 font-medium leading-relaxed">
                        Start a new round and challenge your rival!
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        router.push(
                          `/rivalry/${rivalry.id}/new-round`
                        )
                      }
                      className="w-full bg-primary text-on-primary py-5 rounded-full font-black text-lg shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus size={24} /> Start Round
                    </button>
                  </>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-container-lowest p-6 rounded-[1.5rem] text-center shadow-sm">
                  <div className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                    W / L
                  </div>
                  <div className="text-2xl font-black text-on-surface">
                    <span className="text-primary">{myWins}</span>
                    <span className="text-on-surface-variant/40 mx-1">–</span>
                    <span className="text-secondary">{rivalWins}</span>
                  </div>
                </div>
                <div className="bg-surface-container-lowest p-6 rounded-[1.5rem] text-center shadow-sm">
                  <div className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                    Streak
                  </div>
                  <div className="text-3xl font-black text-secondary flex items-center justify-center gap-1">
                    {myStreak} <Flame size={24} className="fill-secondary" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Unpaired state */
          <div className="bg-surface-container-lowest rounded-[2.5rem] p-12 text-center max-w-lg mx-auto">
            <p className="text-on-surface-variant text-lg font-medium mb-4">
              Share your invite code with a friend to get started.
            </p>
            <div className="bg-surface-container-low rounded-2xl p-6 mb-6">
              <p className="text-4xl font-black text-primary tracking-[0.3em] font-mono">
                {rivalry.invite_code}
              </p>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 mx-auto text-sm font-bold text-on-surface-variant hover:text-primary transition-colors"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Copied!" : "Copy Code"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
