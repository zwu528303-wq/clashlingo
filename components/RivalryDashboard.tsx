"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Copy,
  Flame,
  LogOut,
  Medal,
  Plus,
  Sparkles,
  Swords,
  Trophy,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import AppSidebar from "@/components/AppSidebar";
import type {
  Rivalry,
  RivalryLedger,
  RivalryLedgerRound,
  Round,
} from "@/lib/domain-types";
import {
  type EditableProfile,
  getAvatarTheme,
  getDisplayInitial,
  getEditableProfileFromUser,
  normalizeAvatarLetter,
  parsePublicAvatarValue,
  resolveDisplayName,
} from "@/lib/profile";
import { isRivalryInactive } from "@/lib/rivalry-ledger";

interface RivalPublicProfile {
  displayName: string;
  avatarLetter: string;
  avatarColor: string;
}

function buildRivalryHref(rivalryId: string) {
  return `/rivalries?rivalry=${rivalryId}`;
}

function getRivalryLevel(completedMatches: number, streak: number) {
  if (completedMatches >= 8 || streak >= 5) return "Legendary Nemesis";
  if (completedMatches >= 5 || streak >= 3) return "Fierce Nemesis";
  if (completedMatches >= 3) return "Serious Threat";
  if (completedMatches >= 1) return "Fresh Challenger";
  return "Warm-Up Duel";
}

export default function RivalryDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ id?: string }>();
  const searchParams = useSearchParams();

  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<EditableProfile | null>(null);
  const [rivalries, setRivalries] = useState<Rivalry[]>([]);
  const [roundsByRivalry, setRoundsByRivalry] = useState<Record<string, Round[]>>(
    {}
  );
  const [rivalNames, setRivalNames] = useState<Record<string, string>>({});
  const [rivalProfiles, setRivalProfiles] = useState<
    Record<string, RivalPublicProfile>
  >({});
  const [loading, setLoading] = useState(true);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);
  const [leaveIntentId, setLeaveIntentId] = useState<string | null>(null);
  const [leaveError, setLeaveError] = useState("");
  const [leaving, setLeaving] = useState(false);

  async function loadCurrentProfile(user: User) {
    const authProfile = getEditableProfileFromUser(user);
    const { data } = await supabase
      .from("users")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle<{ display_name: string | null }>();

    setProfile({
      ...authProfile,
      displayName: resolveDisplayName(data?.display_name, authProfile.displayName),
    });
  }

  async function loadRivalries(uid: string) {
    const { data: rivalryRows, error } = await supabase
      .from("rivalries")
      .select("*")
      .or(`player_a_id.eq.${uid},player_b_id.eq.${uid}`)
      .order("created_at", { ascending: false });

    if (error || !rivalryRows) {
      setRivalries([]);
      setRoundsByRivalry({});
      setRivalNames({});
      setRivalProfiles({});
      return;
    }

    const sortedRivalries = [...rivalryRows].sort(
      (left, right) =>
        Number(isRivalryInactive(left.cumulative_ledger)) -
        Number(isRivalryInactive(right.cumulative_ledger))
    );

    setRivalries(sortedRivalries);

    if (sortedRivalries.length === 0) {
      setRoundsByRivalry({});
      setRivalNames({});
      setRivalProfiles({});
      return;
    }

    const rivalryIds = sortedRivalries.map((rivalry) => rivalry.id);
    const rivalIdPairs = sortedRivalries
      .map((rivalry) => ({
        rivalryId: rivalry.id,
        rivalId:
          rivalry.player_a_id === uid ? rivalry.player_b_id : rivalry.player_a_id,
      }))
      .filter(
        (
          pair
        ): pair is {
          rivalryId: string;
          rivalId: string;
        } => Boolean(pair.rivalId)
      );

    const uniqueRivalIds = [...new Set(rivalIdPairs.map((pair) => pair.rivalId))];
    const rivalryNameMap: Record<string, string> = {};
    const rivalryProfileMap: Record<string, RivalPublicProfile> = {};

    if (uniqueRivalIds.length > 0) {
      const { data: profiles } = await supabase
        .from("users")
        .select("id, display_name, avatar_url")
        .in("id", uniqueRivalIds);

      const profileMap = new Map(
        (profiles ?? []).map((item) => [
          item.id,
          (() => {
            const displayName = resolveDisplayName(item.display_name, "Rival");
            return {
              displayName,
              ...parsePublicAvatarValue(item.avatar_url, displayName),
            };
          })(),
        ])
      );

      rivalIdPairs.forEach(({ rivalryId, rivalId }) => {
        const publicProfile = profileMap.get(rivalId);
        const displayName = publicProfile?.displayName ?? "Rival";

        rivalryNameMap[rivalryId] = displayName;
        rivalryProfileMap[rivalryId] = publicProfile ?? {
          displayName,
          avatarLetter: getDisplayInitial(displayName, "R"),
          avatarColor: "rose",
        };
      });
    }

    setRivalNames(rivalryNameMap);
    setRivalProfiles(rivalryProfileMap);

    const { data: roundRows } = await supabase
      .from("rounds")
      .select("*")
      .in("rivalry_id", rivalryIds)
      .order("round_number", { ascending: false });

    const nextRoundsByRivalry: Record<string, Round[]> = {};

    (roundRows ?? []).forEach((round) => {
      const current = nextRoundsByRivalry[round.rivalry_id] ?? [];
      current.push(round as Round);
      nextRoundsByRivalry[round.rivalry_id] = current;
    });

    setRoundsByRivalry(nextRoundsByRivalry);
  }

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
      await loadCurrentProfile(user);
      await loadRivalries(user.id);
      setLoading(false);
    };

    init();
  }, [router]);

  const deepLinkedRivalryId =
    typeof params.id === "string" ? params.id : undefined;
  const searchSelectedRivalryId = searchParams.get("rivalry") ?? undefined;

  const selectedRivalry = useMemo(() => {
    const candidateId =
      searchSelectedRivalryId ?? deepLinkedRivalryId ?? rivalries[0]?.id;
    if (!candidateId) return null;
    return rivalries.find((rivalry) => rivalry.id === candidateId) ?? rivalries[0] ?? null;
  }, [deepLinkedRivalryId, rivalries, searchSelectedRivalryId]);

  useEffect(() => {
    if (!selectedRivalry) return;
    if (pathname !== "/rivalries") return;
    if (searchSelectedRivalryId === selectedRivalry.id) return;
    router.replace(buildRivalryHref(selectedRivalry.id));
  }, [pathname, router, searchSelectedRivalryId, selectedRivalry]);

  const selectedRounds = selectedRivalry
    ? roundsByRivalry[selectedRivalry.id] ?? []
    : [];
  const activeRound = selectedRounds.find((round) => round.status !== "completed");
  const completedRounds = selectedRounds.filter(
    (round) => round.status === "completed"
  );

  const isPlayerA = selectedRivalry?.player_a_id === userId;
  const rivalId = isPlayerA
    ? selectedRivalry?.player_b_id
    : selectedRivalry?.player_a_id;
  const rivalName = selectedRivalry ? rivalNames[selectedRivalry.id] ?? "Rival" : "Rival";
  const selectedRivalProfile = selectedRivalry
    ? rivalProfiles[selectedRivalry.id]
    : undefined;
  const currentLanguage = selectedRivalry
    ? isPlayerA
      ? selectedRivalry.player_a_lang
      : selectedRivalry.player_b_lang || selectedRivalry.player_a_lang
    : null;
  const opponentLanguage = selectedRivalry
    ? isPlayerA
      ? selectedRivalry.player_b_lang || selectedRivalry.player_a_lang
      : selectedRivalry.player_a_lang
    : null;

  const ledger = (selectedRivalry?.cumulative_ledger ?? {}) as RivalryLedger;
  const selectedRivalryInactive = isRivalryInactive(
    selectedRivalry?.cumulative_ledger
  );
  const leftByUserId = selectedRivalry?.cumulative_ledger?.left_by ?? null;
  const leftByMe = leftByUserId === userId;
  const myWins = (userId && ledger.wins?.[userId]) || 0;
  const rivalWins = (rivalId && ledger.wins?.[rivalId]) || 0;
  const myStreak = (() => {
    if (!ledger.rounds?.length || !userId) return 0;
    let streak = 0;
    for (let index = ledger.rounds.length - 1; index >= 0; index--) {
      if (ledger.rounds[index].winner_id === userId) streak++;
      else break;
    }
    return streak;
  })();

  const getRoundResult = (roundId: string) =>
    ledger.rounds?.find((round: RivalryLedgerRound) => round.round_id === roundId);

  const handleSelectRivalry = (rivalryId: string) => {
    setLeaveIntentId(null);
    setLeaveError("");
    router.push(buildRivalryHref(rivalryId));
  };

  const handleInviteCopy = async (rivalryId: string, inviteCode: string) => {
    await navigator.clipboard.writeText(inviteCode);
    setCopiedInviteId(rivalryId);
    setTimeout(() => {
      setCopiedInviteId((current) => (current === rivalryId ? null : current));
    }, 2000);
  };

  const handleLeaveRivalry = async () => {
    if (!selectedRivalry || !userId) return;

    setLeaving(true);
    setLeaveError("");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setLeaveError("Your session expired. Please sign in again.");
      setLeaving(false);
      return;
    }

    const response = await fetch("/api/leave-rivalry", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ rivalryId: selectedRivalry.id }),
    });

    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;

    if (!response.ok) {
      setLeaveError(payload?.error || "Could not leave this rivalry.");
      setLeaving(false);
      return;
    }

    await loadRivalries(userId);
    setLeaveIntentId(null);
    setLeaving(false);
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-on-surface-variant font-medium">Loading...</div>
      </div>
    );
  }

  const profileLetter = normalizeAvatarLetter(
    profile.avatarLetter,
    profile.displayName
  );
  const profileTheme = getAvatarTheme(profile.avatarColor);
  const rivalLetter =
    selectedRivalProfile?.avatarLetter ?? getDisplayInitial(rivalName, "R");
  const rivalTheme = getAvatarTheme(selectedRivalProfile?.avatarColor);
  const rivalryProgress = Math.min(
    100,
    Math.max(10, completedRounds.length * 20)
  );
  const rivalryLevel = getRivalryLevel(completedRounds.length, myStreak);

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-[1280px] mx-auto px-5 py-5 lg:px-6 lg:py-7 grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-6 lg:gap-9">
        <AppSidebar active="rivalries" profile={profile} />

        <main className="space-y-8 pb-12">
          <div className="space-y-3">
            <p className="text-[11px] font-black uppercase tracking-[0.26em] text-on-surface-variant">
              Long Game
            </p>
            <h1 className="text-5xl md:text-6xl font-black text-on-surface tracking-[-0.07em] leading-none">
              Rivalry Hub
            </h1>
            <p className="text-on-surface-variant text-xl">
              Wins, streaks, milestones, and every showdown live here.
            </p>
          </div>

          {rivalries.length === 0 ? (
            <section className="bg-surface-container-low rounded-[2.8rem] p-10 md:p-12 text-center space-y-5 shadow-[0_24px_60px_rgba(149,63,77,0.08)]">
              <div className="w-20 h-20 rounded-[1.75rem] bg-primary-container text-primary mx-auto flex items-center justify-center shadow-inner rotate-3">
                <Swords size={36} />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-on-surface tracking-tight">
                  No rivalries yet
                </h2>
                <p className="text-on-surface-variant text-lg">
                  Head to the lounge to create or join your first rivalry.
                </p>
              </div>
              <button
                onClick={() => router.push("/lounge")}
                className="mx-auto bg-primary text-on-primary px-7 py-3.5 rounded-full font-black text-base shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Go to Lounge
              </button>
            </section>
          ) : (
            <>
                  <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {rivalries.map((rivalry) => {
                  const selected = selectedRivalry?.id === rivalry.id;
                  const rivalryIsPlayerA = rivalry.player_a_id === userId;
                  const paired = Boolean(rivalry.player_b_id);
                  const rivalryInactive = isRivalryInactive(
                    rivalry.cumulative_ledger
                  );
                  const publicProfile = rivalProfiles[rivalry.id];
                  const name = publicProfile?.displayName ?? rivalNames[rivalry.id] ?? "Rival";
                  const selectorTheme = getAvatarTheme(publicProfile?.avatarColor);
                  const rivalryRounds = roundsByRivalry[rivalry.id] ?? [];
                  const rivalryActiveRound = rivalryRounds.find(
                    (round) => round.status !== "completed"
                  );
                  const nextLabel = rivalryInactive
                    ? "Rivalry ended"
                    : rivalryActiveRound
                      ? rivalryActiveRound.status.replace(/_/g, " ")
                      : paired
                        ? `Round ${rivalry.current_round_num + 1}`
                        : "Waiting for rival";
                  const labelLanguage = rivalryIsPlayerA
                    ? rivalry.player_a_lang
                    : rivalry.player_b_lang || rivalry.player_a_lang;

                  return (
                    <button
                      key={rivalry.id}
                      onClick={() => handleSelectRivalry(rivalry.id)}
                      className={`text-left rounded-[2rem] border-2 p-5 transition-all shadow-[0_18px_38px_rgba(48,46,43,0.06)] ${
                        selected
                          ? "border-primary bg-white"
                          : "border-white/80 bg-white/75 hover:border-primary/30 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <div
                            className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center text-xl font-black shadow-sm shrink-0 ${
                              paired
                                ? selectorTheme.avatarClassName
                                : "bg-surface-container text-on-surface-variant"
                            }`}
                          >
                            {paired
                              ? publicProfile?.avatarLetter ??
                                getDisplayInitial(name, "R")
                              : "?"}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-black uppercase tracking-[0.22em] text-on-surface-variant">
                              {paired ? labelLanguage : "Invite ready"}
                            </p>
                            <h2 className="text-2xl font-black text-on-surface tracking-tight mt-2 truncate">
                              {paired ? `vs ${name}` : "Waiting for rival"}
                            </h2>
                            <p className="text-sm text-on-surface-variant mt-1">
                              {nextLabel}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`px-3.5 py-2 rounded-full text-[11px] font-black uppercase tracking-[0.18em] shrink-0 ${
                            rivalryInactive
                              ? "bg-surface-container text-on-surface-variant"
                              : selected
                              ? "bg-primary text-on-primary shadow-sm"
                              : "bg-surface-container text-on-surface-variant"
                          }`}
                        >
                          {rivalryInactive ? "Ended" : selected ? "Open" : "View"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </section>

              {selectedRivalry && (
                <>
                  <section className="relative bg-surface-container-low rounded-[3rem] p-8 md:p-12 overflow-hidden shadow-[0_26px_60px_rgba(149,63,77,0.08)]">
                    <div className="absolute -top-12 -left-12 w-72 h-72 bg-primary-container/28 rounded-full blur-3xl" />
                    <div className="absolute -bottom-12 -right-12 w-72 h-72 bg-secondary-container/24 rounded-full blur-3xl" />

                    <div className="relative grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                      <div className="flex flex-col items-center md:items-end text-center md:text-right space-y-5">
                        <div className="relative">
                          <div
                            className={`w-36 h-36 md:w-52 md:h-52 rounded-[2.35rem] flex items-center justify-center text-7xl md:text-8xl font-black shadow-2xl -rotate-3 ${profileTheme.avatarClassName}`}
                          >
                            {profileLetter}
                          </div>
                          <div
                            className={`absolute -top-4 -right-4 px-5 py-2.5 rounded-full font-black text-lg shadow-lg ${profileTheme.avatarClassName}`}
                          >
                            {myWins} Wins
                          </div>
                        </div>
                        <div>
                          <h2 className="text-5xl font-black text-primary tracking-[-0.06em]">
                            You
                          </h2>
                          <p className="text-on-surface-variant font-medium text-lg">
                            {currentLanguage} learner
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-5">
                        {selectedRivalry.player_b_id ? (
                          <>
                            <div className="relative">
                              <div
                                className={`w-36 h-36 md:w-52 md:h-52 rounded-[2.35rem] flex items-center justify-center text-7xl md:text-8xl font-black shadow-2xl rotate-3 ${rivalTheme.avatarClassName}`}
                              >
                                {rivalLetter}
                              </div>
                              <div
                                className={`absolute -top-4 -left-4 px-5 py-2.5 rounded-full font-black text-lg shadow-lg ${rivalTheme.avatarClassName}`}
                              >
                                {rivalWins} Wins
                              </div>
                            </div>
                            <div>
                              <h2 className="text-5xl font-black text-secondary tracking-[-0.06em]">
                                {rivalName}
                              </h2>
                              <p className="text-on-surface-variant font-medium text-lg">
                                {opponentLanguage} learner
                              </p>
                            </div>
                          </>
                        ) : (
                          <div className="space-y-4">
                            <div className="w-36 h-36 md:w-52 md:h-52 rounded-[2.35rem] bg-surface-container border-4 border-dashed border-surface-container-high flex items-center justify-center text-7xl font-black text-on-surface-variant shadow-lg rotate-3">
                              ?
                            </div>
                            <div>
                              <h2 className="text-4xl font-black text-on-surface-variant tracking-tight">
                                Waiting for rival
                              </h2>
                              <p className="text-on-surface-variant font-medium">
                                Share your invite code to start this duel.
                              </p>
                            </div>
                          </div>
                        )}

                        {selectedRivalry.player_b_id && (
                          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center justify-center">
                            <div className="w-24 h-24 bg-surface-container-lowest rounded-full shadow-2xl flex items-center justify-center border-[10px] border-surface-container-low">
                              <span className="text-2xl font-black italic text-on-surface-variant">
                                VS
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-10 bg-tertiary-container/45 border border-tertiary-container/40 rounded-[2rem] p-6 md:p-7 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-tertiary-container rounded-full flex items-center justify-center text-on-tertiary-container shadow-sm">
                          <Sparkles size={26} className="fill-current" />
                        </div>
                        <div>
                          <span className="text-on-surface-variant font-bold text-sm uppercase tracking-wider block mb-1">
                            Rivalry Milestone
                          </span>
                          <span className="text-xl font-black text-on-tertiary-container tracking-tight">
                            {completedRounds.length > 0
                              ? `You've played ${completedRounds.length} matches together.`
                              : "Start your first showdown to build this rivalry."}
                          </span>
                        </div>
                      </div>
                      <div className="h-3 w-full md:w-64 bg-surface-container-high rounded-full overflow-hidden shadow-inner">
                        <div
                          className="h-full bg-tertiary rounded-full"
                          style={{ width: `${rivalryProgress}%` }}
                        />
                      </div>
                    </div>
                  </section>

                  {selectedRivalryInactive && (
                    <section className="rounded-[2.2rem] border border-surface-container-high bg-white px-6 py-5 shadow-[0_16px_30px_rgba(48,46,43,0.05)]">
                      <div className="flex items-start gap-4">
                        <div className="mt-1 w-11 h-11 rounded-2xl bg-surface-container text-on-surface-variant flex items-center justify-center shrink-0">
                          <AlertTriangle size={20} />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-xl font-black text-on-surface tracking-tight">
                            Rivalry ended
                          </h3>
                          <p className="text-on-surface-variant font-medium">
                            {leftByMe
                              ? "You left this rivalry. History stays here, but this duel can no longer start new rounds."
                              : `${rivalName} left this rivalry. History stays here, but this duel can no longer start new rounds.`}
                          </p>
                        </div>
                      </div>
                    </section>
                  )}

                  {selectedRivalry.player_b_id ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between px-2">
                          <div>
                            <h3 className="text-3xl font-black tracking-[-0.05em]">
                              Match History
                            </h3>
                            <p className="text-sm text-on-surface-variant mt-1">
                              Every showdown, topic, and winner lives here.
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-on-surface-variant">
                              Completed
                            </p>
                            <p className="text-2xl font-black text-on-surface">
                              {completedRounds.length}
                            </p>
                          </div>
                        </div>

                        {completedRounds.length === 0 ? (
                          <div className="bg-white rounded-[2rem] p-12 text-center shadow-[0_18px_38px_rgba(48,46,43,0.06)]">
                            <Swords
                              size={48}
                              className="text-on-surface-variant/30 mx-auto mb-4"
                            />
                            <p className="text-on-surface-variant font-medium text-lg">
                              No completed matches yet. Your rivalry history will fill this panel.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {completedRounds.map((round, index) => {
                              const result = getRoundResult(round.id);
                              const iWon = result?.winner_id === userId;
                              const tied =
                                result !== undefined && result.winner_id === null;
                              const myScore = userId
                                ? result?.scores?.[userId]
                                : undefined;
                              const rivalScore = rivalId
                                ? result?.scores?.[rivalId]
                                : undefined;
                              const rowToneClassName = tied
                                ? "bg-tertiary-container/25"
                                : iWon
                                  ? "bg-white"
                                  : index % 2 === 0
                                    ? "bg-surface-container-low"
                                    : "bg-white";

                              return (
                                <div
                                  key={round.id}
                                  onClick={() =>
                                    router.push(`/round/${round.id}/results`)
                                  }
                                  className={`p-6 rounded-[1.85rem] flex items-center justify-between hover:scale-[1.01] transition-transform duration-200 shadow-[0_16px_30px_rgba(48,46,43,0.05)] cursor-pointer ${rowToneClassName}`}
                                >
                                  <div className="flex items-center gap-5 md:gap-6 min-w-0">
                                    <div
                                      className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center font-black text-xl shrink-0 ${
                                        iWon
                                          ? "bg-primary-container text-primary"
                                          : tied
                                            ? "bg-tertiary-container text-on-tertiary-container"
                                            : "bg-secondary-container/30 text-secondary"
                                      }`}
                                    >
                                      {(round.target_lang || currentLanguage || "FR")
                                        .slice(0, 2)
                                        .toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="font-bold text-xl md:text-2xl text-on-surface tracking-tight">
                                        Week {round.round_number} Showdown
                                      </div>
                                      <div className="text-sm text-on-surface-variant font-medium mt-1 truncate">
                                        {round.topic || "No topic selected"}
                                        {myScore !== undefined &&
                                          rivalScore !== undefined && (
                                            <span className="font-bold text-on-surface-variant">
                                              {" "}
                                              · {myScore}-{rivalScore}
                                            </span>
                                          )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0 pl-4">
                                    <div
                                      className={`font-black text-lg md:text-xl ${
                                        iWon
                                          ? "text-primary"
                                          : tied
                                            ? "text-tertiary"
                                            : "text-secondary"
                                      }`}
                                    >
                                      {tied ? "Tie" : "Winner"}
                                    </div>
                                    <div className="text-xs uppercase tracking-[0.18em] text-on-surface-variant font-black mt-1">
                                      {tied ? "Nobody" : iWon ? "You" : rivalName}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="space-y-5">
                        <div className="bg-surface-container-high rounded-[2.4rem] p-8 text-center space-y-6 flex flex-col items-center shadow-[0_18px_38px_rgba(48,46,43,0.05)]">
                          <div className="w-20 h-20 bg-primary-container rounded-[1.7rem] flex items-center justify-center shadow-inner rotate-3">
                            {selectedRivalryInactive ? (
                              <LogOut
                                size={40}
                                className="text-on-surface-variant"
                              />
                            ) : (
                              <Swords
                                size={40}
                                className="text-primary fill-primary/20"
                              />
                            )}
                          </div>

                          {selectedRivalryInactive ? (
                            <>
                              <div className="space-y-2">
                                <h4 className="text-3xl font-black tracking-[-0.05em]">
                                  Rivalry closed
                                </h4>
                                <p className="text-on-surface-variant text-sm px-4 font-medium leading-relaxed">
                                  This rivalry is now archived. You can still review the story here, but no new rounds can begin.
                                </p>
                              </div>
                              <button
                                disabled
                                className="w-full bg-surface-container text-on-surface-variant py-5 rounded-full font-black text-lg cursor-not-allowed"
                              >
                                No New Rounds
                              </button>
                            </>
                          ) : activeRound ? (
                            <>
                              <div className="space-y-2">
                                <h4 className="text-3xl font-black tracking-[-0.05em]">
                                  Round {activeRound.round_number} is live
                                </h4>
                                {activeRound.target_lang && (
                                  <p className="text-on-surface-variant text-sm font-medium">
                                    Language:{" "}
                                    <span className="text-primary font-bold">
                                      {activeRound.target_lang}
                                    </span>
                                  </p>
                                )}
                                <p className="text-on-surface-variant text-sm font-medium">
                                  Status:{" "}
                                  <span className="text-primary font-bold">
                                    {activeRound.status.replace(/_/g, " ")}
                                  </span>
                                </p>
                              </div>
                              <button
                                onClick={() =>
                                  router.push(`/round/${activeRound.id}`)
                                }
                                className="w-full bg-primary text-on-primary py-5 rounded-full font-black text-lg shadow-[0_16px_32px_rgba(149,63,77,0.22)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                              >
                                Continue Round
                                <ArrowRight size={20} />
                              </button>
                            </>
                          ) : (
                            <>
                              <div className="space-y-2">
                                <h4 className="text-3xl font-black tracking-[-0.05em]">
                                  Ready for Round {selectedRivalry.current_round_num + 1}?
                                </h4>
                                <p className="text-on-surface-variant text-sm px-4 font-medium leading-relaxed">
                                  Start a new round whenever you want the next showdown.
                                </p>
                              </div>
                              <button
                                onClick={() =>
                                  router.push(
                                    `/rivalry/${selectedRivalry.id}/new-round`
                                  )
                                }
                                className="w-full bg-primary text-on-primary py-5 rounded-full font-black text-lg shadow-[0_16px_32px_rgba(149,63,77,0.22)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                              >
                                <Plus size={22} /> Start Round
                              </button>
                            </>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white p-6 rounded-[1.7rem] text-center shadow-[0_16px_30px_rgba(48,46,43,0.05)]">
                            <div className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                              W / L
                            </div>
                            <div className="text-3xl font-black text-on-surface flex items-center justify-center gap-2">
                              <Trophy size={22} className="text-primary" />
                              <span className="text-primary">{myWins}</span>
                              <span className="text-on-surface-variant/40">–</span>
                              <span className="text-secondary">{rivalWins}</span>
                            </div>
                          </div>

                          <div className="bg-white p-6 rounded-[1.7rem] text-center shadow-[0_16px_30px_rgba(48,46,43,0.05)]">
                            <div className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                              Streak
                            </div>
                            <div className="text-3xl font-black text-secondary flex items-center justify-center gap-1">
                              {myStreak}
                              <Flame size={24} className="fill-secondary" />
                            </div>
                          </div>

                          <div className="col-span-2 bg-gradient-to-br from-secondary to-secondary-dim p-6 rounded-[1.7rem] text-white shadow-lg relative overflow-hidden">
                            <div className="absolute -right-4 -top-4 opacity-20">
                              <Medal size={100} />
                            </div>
                            <div className="relative z-10 flex items-center justify-between gap-4">
                              <div>
                                <div className="text-xs font-bold opacity-80 uppercase tracking-widest mb-1">
                                  Rivalry Level
                                </div>
                                <div className="text-2xl font-black tracking-[-0.04em]">
                                  {rivalryLevel}
                                </div>
                              </div>
                              <Medal size={38} className="fill-white/20 shrink-0" />
                            </div>
                          </div>
                        </div>

                        <div className="bg-white rounded-[2rem] p-6 shadow-[0_16px_30px_rgba(48,46,43,0.05)] space-y-4">
                          <div>
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-on-surface-variant">
                              Leave Rivalry
                            </p>
                            <h4 className="mt-2 text-2xl font-black tracking-[-0.04em] text-on-surface">
                              End this duel
                            </h4>
                            <p className="mt-2 text-sm font-medium text-on-surface-variant leading-relaxed">
                              Leaving keeps your match history, but removes this rivalry from the Lounge and blocks future rounds.
                            </p>
                          </div>

                          {leaveError && (
                            <div className="rounded-[1.4rem] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                              {leaveError}
                            </div>
                          )}

                          {selectedRivalryInactive ? (
                            <div className="rounded-[1.4rem] bg-surface-container px-4 py-3 text-sm font-medium text-on-surface-variant">
                              {leftByMe
                                ? "You already left this rivalry."
                                : `${rivalName} already left this rivalry.`}
                            </div>
                          ) : activeRound ? (
                            <div className="rounded-[1.4rem] bg-surface-container px-4 py-3 text-sm font-medium text-on-surface-variant">
                              Finish the active round before leaving this rivalry.
                            </div>
                          ) : leaveIntentId === selectedRivalry.id ? (
                            <div className="space-y-3">
                              <div className="rounded-[1.4rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
                                This rivalry will move to history. It will disappear from the Lounge and can no longer start new rounds.
                              </div>
                              <div className="flex gap-3">
                                <button
                                  onClick={() => {
                                    setLeaveIntentId(null);
                                    setLeaveError("");
                                  }}
                                  disabled={leaving}
                                  className="flex-1 rounded-full bg-surface-container px-5 py-3 font-black text-on-surface transition-all hover:bg-surface-container-high disabled:opacity-60"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={handleLeaveRivalry}
                                  disabled={leaving}
                                  className="flex-1 rounded-full bg-primary text-on-primary px-5 py-3 font-black transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-60"
                                >
                                  {leaving ? "Leaving..." : "Confirm Leave"}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setLeaveIntentId(selectedRivalry.id);
                                setLeaveError("");
                              }}
                              className="w-full rounded-full border border-primary/20 bg-primary-container/40 px-5 py-3.5 font-black text-primary transition-all hover:bg-primary-container/55"
                            >
                              Leave Rivalry
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-xl space-y-5">
                      {selectedRivalryInactive ? (
                        <div className="bg-white rounded-[2.8rem] p-12 text-center shadow-[0_22px_55px_rgba(48,46,43,0.06)]">
                          <div className="w-24 h-24 rounded-[2rem] bg-surface-container text-on-surface-variant mx-auto flex items-center justify-center shadow-inner rotate-3 mb-6">
                            <LogOut size={42} />
                          </div>
                          <p className="text-on-surface text-2xl font-black tracking-tight mb-3">
                            Rivalry ended before a rival joined
                          </p>
                          <p className="text-on-surface-variant text-lg font-medium">
                            This invite is archived now, so it no longer appears in the Lounge or accepts new rounds.
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="bg-white rounded-[2.8rem] p-12 text-center shadow-[0_22px_55px_rgba(48,46,43,0.06)]">
                            <div className="w-24 h-24 rounded-[2rem] bg-primary-container text-primary mx-auto flex items-center justify-center shadow-inner rotate-3 mb-6">
                              <Swords size={42} />
                            </div>
                            <p className="text-on-surface-variant text-lg font-medium mb-5">
                              Share your invite code with a friend to bring this rivalry to life.
                            </p>
                            <div className="bg-surface-container-low rounded-[2rem] p-6 mb-6">
                              <p className="text-4xl font-black text-primary tracking-[0.3em] font-mono">
                                {selectedRivalry.invite_code}
                              </p>
                            </div>
                            <button
                              onClick={() =>
                                handleInviteCopy(
                                  selectedRivalry.id,
                                  selectedRivalry.invite_code
                                )
                              }
                              className="flex items-center gap-2 mx-auto rounded-full bg-primary text-on-primary px-6 py-3.5 text-sm font-black shadow-[0_14px_30px_rgba(149,63,77,0.2)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                              {copiedInviteId === selectedRivalry.id ? (
                                <Check size={16} />
                              ) : (
                                <Copy size={16} />
                              )}
                              {copiedInviteId === selectedRivalry.id
                                ? "Copied!"
                                : "Copy Code"}
                            </button>
                          </div>

                          <div className="bg-white rounded-[2rem] p-6 shadow-[0_16px_30px_rgba(48,46,43,0.05)] space-y-4">
                            <div>
                              <p className="text-xs font-black uppercase tracking-[0.18em] text-on-surface-variant">
                                Leave Rivalry
                              </p>
                              <h4 className="mt-2 text-2xl font-black tracking-[-0.04em] text-on-surface">
                                Close this invite
                              </h4>
                              <p className="mt-2 text-sm font-medium text-on-surface-variant leading-relaxed">
                                If you no longer want this duel, you can archive it. The invite code will stop appearing in the Lounge.
                              </p>
                            </div>

                            {leaveError && (
                              <div className="rounded-[1.4rem] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                                {leaveError}
                              </div>
                            )}

                            {leaveIntentId === selectedRivalry.id ? (
                              <div className="space-y-3">
                                <div className="rounded-[1.4rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
                                  This rivalry will move to history and stop accepting a joining rival.
                                </div>
                                <div className="flex gap-3">
                                  <button
                                    onClick={() => {
                                      setLeaveIntentId(null);
                                      setLeaveError("");
                                    }}
                                    disabled={leaving}
                                    className="flex-1 rounded-full bg-surface-container px-5 py-3 font-black text-on-surface transition-all hover:bg-surface-container-high disabled:opacity-60"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={handleLeaveRivalry}
                                    disabled={leaving}
                                    className="flex-1 rounded-full bg-primary text-on-primary px-5 py-3 font-black transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-60"
                                  >
                                    {leaving ? "Leaving..." : "Confirm Leave"}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setLeaveIntentId(selectedRivalry.id);
                                  setLeaveError("");
                                }}
                                className="w-full rounded-full border border-primary/20 bg-primary-container/40 px-5 py-3.5 font-black text-primary transition-all hover:bg-primary-container/55"
                              >
                                Leave Rivalry
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
