"use client";

import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import {
  ArrowRight,
  Check,
  Clock3,
  Copy,
  Lock,
  Plus,
  Swords,
  UserPlus,
  X,
} from "lucide-react";
import AppSidebar from "@/components/AppSidebar";
import type { Rivalry, Round } from "@/lib/domain-types";
import { DEFAULT_LANGUAGE_LEVEL } from "@/lib/language-level";
import { getSharedWeeklyMatchTime, setSharedWeeklyMatchTime } from "@/lib/rivalry-ledger";
import {
  DEFAULT_WEEKLY_MATCH_TIME,
  SUPPORTED_LANGUAGES,
  type EditableProfile,
  getAvatarTheme,
  type SupportedLanguage,
  getDisplayInitial,
  getEditableProfileFromUser,
  normalizeAvatarLetter,
  parsePublicAvatarValue,
  resolveDisplayName,
} from "@/lib/profile";

type ActiveRound = Pick<
  Round,
  | "id"
  | "rivalry_id"
  | "round_number"
  | "status"
  | "topic"
  | "target_lang"
  | "exam_at"
  | "player_a_confirmed"
  | "player_b_confirmed"
  | "player_a_exam_ready"
  | "player_b_exam_ready"
>;

interface RivalPublicProfile {
  displayName: string;
  avatarLetter: string;
  avatarColor: string;
}

function parseWeeklyTime(value: string) {
  const [hoursText = "19", minutesText = "00"] = value.split(":");
  const hours = Number(hoursText);
  const minutes = Number(minutesText);

  return {
    hours: Number.isFinite(hours) ? hours : 19,
    minutes: Number.isFinite(minutes) ? minutes : 0,
  };
}

function formatWeeklyTime(value: string) {
  const { hours, minutes } = parseWeeklyTime(value);
  const suffix = hours >= 12 ? "PM" : "AM";
  const normalizedHours = hours % 12 || 12;

  return `${normalizedHours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")} ${suffix}`;
}

function getNextWeeklyRhythmTarget(
  anchorIso: string,
  weeklyTime: string,
  nowMs: number
) {
  const anchor = new Date(anchorIso);
  if (Number.isNaN(anchor.getTime())) return null;

  const { hours, minutes } = parseWeeklyTime(weeklyTime);
  const firstTarget = new Date(anchor);
  firstTarget.setHours(hours, minutes, 0, 0);

  const firstTargetMs = firstTarget.getTime();
  if (firstTargetMs > nowMs) {
    return firstTarget.toISOString();
  }

  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const elapsedSinceFirstTarget = nowMs - firstTargetMs;
  const weeksToAdd = Math.floor(elapsedSinceFirstTarget / weekMs) + 1;

  return new Date(firstTargetMs + weeksToAdd * weekMs).toISOString();
}

function formatCountdown(target: string | null, nowMs: number) {
  if (!target) return "00:00:00";
  if (nowMs === 0) return "--:--:--";

  const diff = new Date(target).getTime() - nowMs;
  if (diff <= 0) return "00:00:00";

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function getRoundStatusLabel(status: string) {
  switch (status) {
    case "topic_selection":
      return "Topic Selection";
    case "confirming":
      return "Scope Review";
    case "countdown":
      return "Study Countdown";
    case "exam_ready":
      return "Exam Ready";
    case "exam_live":
      return "Exam Live";
    default:
      return status.replace(/_/g, " ");
  }
}

export default function Lounge() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<EditableProfile | null>(null);
  const [rivalries, setRivalries] = useState<Rivalry[]>([]);
  const [rivalNames, setRivalNames] = useState<Record<string, string>>({});
  const [rivalProfiles, setRivalProfiles] = useState<
    Record<string, RivalPublicProfile>
  >({});
  const [activeRounds, setActiveRounds] = useState<Record<string, ActiveRound>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [countdownNow, setCountdownNow] = useState(0);

  // Modal states
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  // Create form
  const [myLang, setMyLang] = useState<SupportedLanguage>(SUPPORTED_LANGUAGES[0]);
  const [creating, setCreating] = useState(false);
  const [createdCode, setCreatedCode] = useState("");
  const [createError, setCreateError] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);

  // Join form
  const [joinCode, setJoinCode] = useState("");
  const [joinLang, setJoinLang] = useState<SupportedLanguage>(SUPPORTED_LANGUAGES[0]);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");

  async function loadCurrentProfile(user: User) {
    const authProfile = getEditableProfileFromUser(user);
    const { data } = await supabase
      .from("users")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle<{ display_name: string | null }>();

    const resolvedProfile: EditableProfile = {
      ...authProfile,
      displayName: resolveDisplayName(
        data?.display_name,
        authProfile.displayName
      ),
    };

    setProfile(resolvedProfile);
    setMyLang(resolvedProfile.preferredLanguage);
    setJoinLang(resolvedProfile.preferredLanguage);
    return resolvedProfile;
  }

  async function fetchRivalries(
    uid: string,
    defaultWeeklyTime = DEFAULT_WEEKLY_MATCH_TIME
  ) {
    const { data, error } = await supabase
      .from("rivalries")
      .select("*")
      .or(`player_a_id.eq.${uid},player_b_id.eq.${uid}`)
      .order("created_at", { ascending: false });

    if (!error && data) {
      const rivalryRows = data as Rivalry[];
      const rivalriesNeedingSharedTime = rivalryRows.filter((rivalry) => {
        const sharedWeeklyTime = getSharedWeeklyMatchTime(
          rivalry.cumulative_ledger,
          defaultWeeklyTime
        );

        return rivalry.cumulative_ledger?.shared_weekly_time !== sharedWeeklyTime;
      });

      if (rivalriesNeedingSharedTime.length > 0) {
        await Promise.allSettled(
          rivalriesNeedingSharedTime.map((rivalry) =>
            supabase
              .from("rivalries")
              .update({
                cumulative_ledger: setSharedWeeklyMatchTime(
                  rivalry.cumulative_ledger,
                  defaultWeeklyTime
                ),
              })
              .eq("id", rivalry.id)
          )
        );
      }

      const normalizedRivalries = rivalryRows.map((rivalry) => ({
        ...rivalry,
        cumulative_ledger: setSharedWeeklyMatchTime(
          rivalry.cumulative_ledger,
          getSharedWeeklyMatchTime(rivalry.cumulative_ledger, defaultWeeklyTime)
        ),
      }));

      setRivalries(normalizedRivalries);

      if (normalizedRivalries.length === 0) {
        setRivalNames({});
        setRivalProfiles({});
        setActiveRounds({});
        return;
      }

      const rivalryIds = normalizedRivalries.map((rivalry) => rivalry.id);
      const rivalryNameMap: Record<string, string> = {};
      const rivalryProfileMap: Record<string, RivalPublicProfile> = {};
      const rivalIdPairs = normalizedRivalries
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

      const { data: rounds } = await supabase
        .from("rounds")
        .select(
          "id, rivalry_id, round_number, status, topic, target_lang, exam_at, player_a_confirmed, player_b_confirmed, player_a_exam_ready, player_b_exam_ready"
        )
        .in("rivalry_id", rivalryIds)
        .neq("status", "completed")
        .order("round_number", { ascending: false });

      const nextActiveRounds: Record<string, ActiveRound> = {};
      (rounds ?? []).forEach((round) => {
        if (!nextActiveRounds[round.rivalry_id]) {
          nextActiveRounds[round.rivalry_id] = round as ActiveRound;
        }
      });

      setActiveRounds(nextActiveRounds);
    }
  }

  // Check auth + fetch rivalries
  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const resolvedProfile = await loadCurrentProfile(user);
      setUserId(user.id);
      await fetchRivalries(user.id, resolvedProfile.weeklyMatchTime);
      setLoading(false);
    };
    init();
  }, [router]);

  useEffect(() => {
    const shouldTick = rivalries.some((rivalry) => Boolean(rivalry.player_b_id));

    if (!shouldTick) return;

    const updateNow = () => {
      setCountdownNow(Date.now());
    };

    const timeout = window.setTimeout(() => {
      updateNow();
    }, 0);

    const interval = setInterval(() => {
      updateNow();
    }, 1000);

    return () => {
      window.clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [rivalries]);

  // Generate 6-char invite code
  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  };

  const handleCreate = async () => {
    if (!userId) return;
    if (rivalries.length >= 2) return;
    setCreating(true);

    const code = generateCode();
    const { error } = await supabase.from("rivalries").insert({
      player_a_id: userId,
      invite_code: code,
      player_a_lang: myLang,
      player_a_difficulty:
        profile?.defaultLanguageLevel || DEFAULT_LANGUAGE_LEVEL,
      cumulative_ledger: setSharedWeeklyMatchTime(
        null,
        profile?.weeklyMatchTime || DEFAULT_WEEKLY_MATCH_TIME
      ),
    });

    if (error) {
      // If code collision, retry once
      const retryCode = generateCode();
      const { error: retryError } = await supabase.from("rivalries").insert({
        player_a_id: userId,
        invite_code: retryCode,
        player_a_lang: myLang,
        player_a_difficulty:
          profile?.defaultLanguageLevel || DEFAULT_LANGUAGE_LEVEL,
        cumulative_ledger: setSharedWeeklyMatchTime(
          null,
          profile?.weeklyMatchTime || DEFAULT_WEEKLY_MATCH_TIME
        ),
      });
      if (retryError) {
        setCreateError("Failed to create rivalry. Please try again.");
        setCreating(false);
        return;
      }
      setCreatedCode(retryCode);
    } else {
      setCreatedCode(code);
    }

    setCreating(false);
    await fetchRivalries(
      userId,
      profile?.weeklyMatchTime || DEFAULT_WEEKLY_MATCH_TIME
    );
  };

  const handleJoin = async () => {
    if (!userId) return;
    if (rivalries.length >= 2) {
      setJoinError("You can only be in 2 rivalries at a time.");
      setJoining(false);
      return;
    }
    setJoining(true);
    setJoinError("");

    const trimmedCode = joinCode.trim().toUpperCase();

    // Find rivalry by code
    const { data, error } = await supabase
      .from("rivalries")
      .select("*")
      .eq("invite_code", trimmedCode)
      .single();

    if (error || !data) {
      setJoinError("Invite code not found.");
      setJoining(false);
      return;
    }

    if (data.player_a_id === userId) {
      setJoinError("You can't join your own rivalry!");
      setJoining(false);
      return;
    }

    if (data.player_b_id) {
      setJoinError("This rivalry already has two players.");
      setJoining(false);
      return;
    }

    // Join
    const { error: updateError } = await supabase
      .from("rivalries")
      .update({
        player_b_id: userId,
        player_b_lang: joinLang, // dif language for now
        player_b_difficulty:
          profile?.defaultLanguageLevel || DEFAULT_LANGUAGE_LEVEL,
      })
      .eq("id", data.id);

    if (updateError) {
      setJoinError("Failed to join: " + updateError.message);
      setJoining(false);
      return;
    }

    setJoining(false);
    setShowJoin(false);
    setJoinCode("");
    await fetchRivalries(
      userId,
      profile?.weeklyMatchTime || DEFAULT_WEEKLY_MATCH_TIME
    );
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(createdCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInviteCopy = async (rivalryId: string, inviteCode: string) => {
    await navigator.clipboard.writeText(inviteCode);
    setCopiedInviteId(rivalryId);
    setTimeout(() => setCopiedInviteId((current) => (current === rivalryId ? null : current)), 2000);
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

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-[1280px] mx-auto px-5 py-5 lg:px-6 lg:py-7 grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-6 lg:gap-9">
        <AppSidebar active="lounge" profile={profile} />

        <main className="space-y-8 pb-12">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.26em] text-on-surface-variant mb-3">
              Match Control
            </p>
            <h2 className="text-5xl md:text-6xl font-black text-on-surface tracking-[-0.07em] leading-none mb-3">
              Your Lounge
            </h2>
            <p className="text-on-surface-variant text-xl">
              Keep an eye on the countdown, then jump straight into the next clash.
            </p>
          </div>

          {rivalries.length === 0 ? (
          /* ========== Empty State ========== */
          <div className="bg-surface-container-low rounded-[3rem] p-12 text-center flex flex-col items-center justify-center min-h-[50vh] relative overflow-hidden shadow-[0_30px_60px_rgba(149,63,77,0.08)]">
            <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-primary-container/30 rounded-full blur-3xl mix-blend-multiply"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-secondary-container/30 rounded-full blur-3xl mix-blend-multiply"></div>

            <div className="relative z-10 max-w-lg mx-auto space-y-8">
              <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mx-auto shadow-xl rotate-12">
                <Swords size={64} className="text-primary" />
              </div>

              <div className="space-y-4">
                <h3 className="text-4xl font-black text-on-surface tracking-tight">
                  Learning alone is boring.
                </h3>
                <p className="text-xl text-on-surface-variant">
                  Crush your friends instead. Start a rivalry and see who learns faster.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <button
                  onClick={() => { setShowCreate(true); setCreatedCode(""); setCreateError(""); }}
                  className="bg-primary text-on-primary px-8 py-4 rounded-full font-black text-lg shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={24} /> CREATE RIVALRY
                </button>
                <button
                  onClick={() => { setShowJoin(true); setJoinError(""); setJoinCode(""); }}
                  className="bg-white text-on-surface border-2 border-surface-container px-8 py-4 rounded-full font-black text-lg shadow-sm hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <UserPlus size={24} /> JOIN WITH CODE
                </button>
              </div>
            </div>
          </div>
          ) : (
          /* ========== Rivalry Cards ========== */
          <div className="space-y-6">
            {rivalries.length >= 2 && (
              <p className="text-sm text-on-surface-variant font-medium">
                You&apos;ve reached the 2-rivalry limit.
              </p>
            )}

            <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6 items-stretch">
              {rivalries.map((r) => {
                const isPlayerA = r.player_a_id === userId;
                const isPaired = Boolean(r.player_b_id);
                const sharedWeeklyMatchTime = getSharedWeeklyMatchTime(
                  r.cumulative_ledger,
                  profile?.weeklyMatchTime || DEFAULT_WEEKLY_MATCH_TIME
                );
                const rivalProfile = rivalProfiles[r.id];
                const rivalName = rivalProfile?.displayName || rivalNames[r.id] || "Rival";
                const rivalTheme = getAvatarTheme(rivalProfile?.avatarColor);
                const activeRound = activeRounds[r.id] ?? null;
                const targetLang =
                  activeRound?.target_lang ||
                  (isPlayerA ? r.player_a_lang : r.player_b_lang || r.player_a_lang);
                const roundNumber = activeRound?.round_number ?? r.current_round_num + 1;
                const weeklyRhythmTarget = isPaired
                  ? getNextWeeklyRhythmTarget(
                      r.created_at,
                      sharedWeeklyMatchTime,
                      countdownNow
                    )
                  : null;
                const weeklyRhythmText = formatCountdown(
                  weeklyRhythmTarget,
                  countdownNow
                );
                const countdownText = formatCountdown(
                  activeRound?.exam_at ?? null,
                  countdownNow
                );
                const myConfirmed = isPlayerA
                  ? activeRound?.player_a_confirmed
                  : activeRound?.player_b_confirmed;
                const rivalConfirmed = isPlayerA
                  ? activeRound?.player_b_confirmed
                  : activeRound?.player_a_confirmed;
                const myReady = isPlayerA
                  ? activeRound?.player_a_exam_ready
                  : activeRound?.player_b_exam_ready;
                const rivalReady = isPlayerA
                  ? activeRound?.player_b_exam_ready
                  : activeRound?.player_a_exam_ready;

                let badgeLabel = isPaired ? "Ready to Duel" : "Invite Ready";
                let badgeClassName =
                  "bg-surface-container-high text-on-surface-variant";
                let panelTitle = isPaired ? "Match unlocks in" : "Invite code";
                let panelValue = isPaired
                  ? weeklyRhythmText
                  : r.invite_code;
                let panelHint = isPaired
                  ? `Shared weekly pulse lands at ${formatWeeklyTime(
                      sharedWeeklyMatchTime
                    )}. If both players want to play, start early.`
                  : "Share this code so your rival can join.";
                let actionLabel = isPaired ? "Start Round" : "Copy Code";
                let cardBorderClassName =
                  "border-surface-container/80";
                let cardGlowClassName =
                  "bg-[radial-gradient(circle_at_top_left,_rgba(255,148,162,0.42),_transparent_42%),radial-gradient(circle_at_bottom_right,_rgba(161,245,188,0.36),_transparent_40%)]";
                let panelSurfaceClassName =
                  "border-surface-container bg-white/90";
                const actionClassName =
                  "bg-primary text-on-primary shadow-[0_16px_32px_rgba(149,63,77,0.22)] hover:translate-y-[-1px]";
                let action = () =>
                  isPaired
                    ? router.push(`/rivalry/${r.id}/new-round`)
                    : handleInviteCopy(r.id, r.invite_code);

                if (!isPaired) {
                  cardBorderClassName = "border-outline-variant/60";
                  cardGlowClassName =
                    "bg-[radial-gradient(circle_at_top_left,_rgba(236,231,226,0.9),_transparent_48%)]";
                  panelSurfaceClassName =
                    "border-surface-container bg-surface-container-lowest";
                }

                if (isPaired && activeRound) {
                  badgeLabel = getRoundStatusLabel(activeRound.status);
                  badgeClassName =
                    activeRound.status === "countdown"
                      ? "bg-secondary-container text-on-secondary-container"
                      : activeRound.status === "exam_ready" ||
                          activeRound.status === "exam_live"
                        ? "bg-primary-container text-on-primary-container"
                        : "bg-surface-container-high text-on-surface-variant";
                  actionLabel = "Open Match";
                  action = () =>
                    router.push(
                      activeRound.status === "exam_live"
                        ? `/round/${activeRound.id}/exam`
                        : `/round/${activeRound.id}`
                    );

                  if (activeRound.status === "topic_selection") {
                    cardBorderClassName = "border-primary/30";
                    panelTitle = "Next step";
                    panelValue = activeRound.topic || "Pick a topic";
                    panelHint =
                      "Generate the scope to kick off this round, or sync up and start before the weekly timer if both players are ready.";
                  } else if (activeRound.status === "confirming") {
                    cardBorderClassName = "border-primary/35";
                    panelTitle = "Confirmation";
                    panelValue = myConfirmed
                      ? rivalConfirmed
                        ? "Both confirmed"
                        : "You confirmed"
                      : "Your confirmation needed";
                    panelHint = rivalConfirmed
                      ? "Your rival already locked in. Once you confirm, the study countdown begins."
                      : "Both players must confirm before the study countdown begins.";
                  } else if (activeRound.status === "countdown") {
                    cardBorderClassName = "border-secondary/40";
                    panelSurfaceClassName =
                      "border-secondary/20 bg-secondary-container/15";
                    panelTitle = "Exam unlocks in";
                    panelValue = countdownText;
                    panelHint = activeRound.topic
                      ? `${activeRound.topic} · keep studying, or both tap ready inside the round to start early.`
                      : "Keep studying, or both tap ready inside the round to start early.";
                    actionLabel = "Open Study Round";
                  } else if (activeRound.status === "exam_ready") {
                    cardBorderClassName = "border-primary/45";
                    panelSurfaceClassName =
                      "border-primary/20 bg-primary-container/12";
                    panelTitle = "Ready check";
                    panelValue = myReady
                      ? rivalReady
                        ? "Both players ready"
                        : "You are ready"
                      : "Tap ready when you are set";
                    panelHint = rivalReady
                      ? "Your rival is already ready."
                      : "The exam starts as soon as both players are ready.";
                  } else if (activeRound.status === "exam_live") {
                    cardBorderClassName = "border-primary/45";
                    panelSurfaceClassName =
                      "border-primary/20 bg-primary-container/14";
                    panelTitle = "Live now";
                    panelValue = "Exam in progress";
                    panelHint = "Jump in and submit before your rival pulls ahead.";
                    actionLabel = "Take Exam";
                  }
                }

                const showWeeklyRhythmPanel =
                  isPaired &&
                  (activeRound?.status === "topic_selection" ||
                    activeRound?.status === "confirming");
                const emphasizeCountdown =
                  (isPaired && !activeRound) || activeRound?.status === "countdown";

                return (
                  <article
                    key={r.id}
                    className={`relative min-h-[34rem] overflow-hidden rounded-[2.8rem] border-2 bg-white/85 p-7 md:p-8 shadow-[0_26px_60px_rgba(48,46,43,0.08)] ${cardBorderClassName}`}
                  >
                    <div className={`absolute inset-0 pointer-events-none ${cardGlowClassName}`} />

                    <div className="relative flex h-full flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <div
                          className={`px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-[0.22em] ${badgeClassName}`}
                        >
                          {badgeLabel}
                        </div>
                        <button
                          onClick={() => router.push(`/rivalries?rivalry=${r.id}`)}
                          className="rounded-full bg-white/85 px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-on-surface-variant shadow-sm transition-colors hover:text-primary"
                        >
                          Rivalry Hub
                        </button>
                      </div>

                      <div className="mt-8 flex flex-1 flex-col justify-between gap-8">
                        <div className="space-y-5 text-center">
                          <div className="flex items-center justify-center gap-4 md:gap-6">
                            <div className="relative">
                              <div className="absolute inset-0 rounded-full bg-primary-container/35 blur-xl" />
                              <div
                                className={`relative w-20 h-20 md:w-24 md:h-24 rounded-[1.75rem] border-[5px] border-white flex items-center justify-center text-3xl font-black shadow-[0_18px_35px_rgba(149,63,77,0.18)] ${profileTheme.avatarClassName}`}
                              >
                                {profileLetter}
                              </div>
                            </div>

                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white border-[10px] border-surface-container-low shadow-xl flex items-center justify-center">
                              <span className="text-2xl md:text-3xl font-black italic text-on-surface-variant/50">
                                VS
                              </span>
                            </div>

                            <div className="relative">
                              <div className="absolute inset-0 rounded-full bg-secondary-container/35 blur-xl" />
                              <div
                                className={`relative w-20 h-20 md:w-24 md:h-24 rounded-[1.75rem] border-[5px] border-white flex items-center justify-center text-3xl font-black shadow-[0_18px_35px_rgba(12,105,61,0.14)] ${
                                  isPaired
                                    ? rivalTheme.avatarClassName
                                    : "bg-surface-container text-on-surface-variant"
                                }`}
                              >
                                {isPaired
                                  ? rivalProfile?.avatarLetter ??
                                    getDisplayInitial(rivalName, "R")
                                  : "?"}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h3 className="text-[2.4rem] md:text-[2.7rem] font-black text-on-surface tracking-[-0.06em] leading-none">
                              {isPaired ? `vs ${rivalName}` : "Waiting for rival"}
                            </h3>
                            <p className="text-on-surface-variant text-lg font-medium">
                              {targetLang} • Round {roundNumber}
                            </p>
                          </div>
                        </div>

                        <div
                          className={`rounded-[2rem] border p-6 text-center space-y-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] ${panelSurfaceClassName}`}
                        >
                          <p className="text-xs font-black uppercase tracking-[0.22em] text-on-surface-variant flex items-center justify-center gap-2">
                            {isPaired ? <Clock3 size={14} /> : <Lock size={14} />}
                            {panelTitle}
                          </p>
                          <div
                            className={`font-black tracking-[-0.04em] ${
                              emphasizeCountdown
                                ? "text-[2.3rem] md:text-[2.7rem] text-primary"
                                : "text-2xl md:text-[2rem] text-on-surface"
                            }`}
                          >
                            {panelValue}
                          </div>
                          <p className="text-sm text-on-surface-variant leading-relaxed">
                            {panelHint}
                          </p>

                          {activeRound?.status === "confirming" && (
                            <div className="flex flex-wrap justify-center gap-2 pt-2">
                              <span
                                className={`px-3.5 py-1.5 rounded-full text-xs font-bold ${
                                  myConfirmed
                                    ? "bg-primary-container text-on-primary-container"
                                    : "bg-surface-container text-on-surface-variant"
                                }`}
                              >
                                {myConfirmed ? "You confirmed" : "You pending"}
                              </span>
                              <span
                                className={`px-3.5 py-1.5 rounded-full text-xs font-bold ${
                                  rivalConfirmed
                                    ? "bg-secondary-container text-on-secondary-container"
                                    : "bg-surface-container text-on-surface-variant"
                                }`}
                              >
                                {rivalConfirmed ? "Rival confirmed" : "Rival pending"}
                              </span>
                            </div>
                          )}

                          {activeRound?.status === "countdown" && (
                            <div className="flex flex-wrap justify-center gap-2 pt-2">
                              <span
                                className={`px-3.5 py-1.5 rounded-full text-xs font-bold ${
                                  myReady
                                    ? "bg-primary-container text-on-primary-container"
                                    : "bg-surface-container text-on-surface-variant"
                                }`}
                              >
                                {myReady ? "You ready now" : "You still studying"}
                              </span>
                              <span
                                className={`px-3.5 py-1.5 rounded-full text-xs font-bold ${
                                  rivalReady
                                    ? "bg-secondary-container text-on-secondary-container"
                                    : "bg-surface-container text-on-surface-variant"
                                }`}
                              >
                                {rivalReady ? "Rival ready now" : "Rival still studying"}
                              </span>
                            </div>
                          )}

                          {activeRound?.status === "exam_ready" && (
                            <div className="flex flex-wrap justify-center gap-2 pt-2">
                              <span
                                className={`px-3.5 py-1.5 rounded-full text-xs font-bold ${
                                  myReady
                                    ? "bg-primary-container text-on-primary-container"
                                    : "bg-surface-container text-on-surface-variant"
                                }`}
                              >
                                {myReady ? "You ready" : "You pending"}
                              </span>
                              <span
                                className={`px-3.5 py-1.5 rounded-full text-xs font-bold ${
                                  rivalReady
                                    ? "bg-secondary-container text-on-secondary-container"
                                    : "bg-surface-container text-on-surface-variant"
                                }`}
                              >
                                {rivalReady ? "Rival ready" : "Rival pending"}
                              </span>
                            </div>
                          )}

                          {showWeeklyRhythmPanel && (
                            <div className="rounded-[1.5rem] bg-surface-container-low px-4 py-4 text-center space-y-1 mt-3">
                              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
                                Weekly rhythm in
                              </p>
                              <div className="text-[1.9rem] font-black tracking-[-0.04em] text-primary">
                                {weeklyRhythmText}
                              </div>
                              <p className="text-xs text-on-surface-variant leading-relaxed">
                                Shared pulse for this rivalry lands at{" "}
                                {formatWeeklyTime(sharedWeeklyMatchTime)}. It is a guide, not a lock.
                              </p>
                            </div>
                          )}

                          <button
                            onClick={action}
                            className={`mt-2 w-full py-4 rounded-[1.6rem] font-black text-base transition-all flex items-center justify-center gap-2 ${actionClassName}`}
                          >
                            <span>{copiedInviteId === r.id ? "Code Copied" : actionLabel}</span>
                            {copiedInviteId !== r.id && <ArrowRight size={18} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}

              {rivalries.length < 2 && (
                <article className="min-h-[34rem] rounded-[2.8rem] border-2 border-dashed border-outline-variant/45 bg-white/75 p-8 flex flex-col items-center justify-center text-center shadow-[0_22px_55px_rgba(48,46,43,0.05)]">
                  <div className="w-24 h-24 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant shadow-inner mb-7">
                    <Plus size={42} />
                  </div>
                  <div className="space-y-3 max-w-sm">
                    <h3 className="text-[2.3rem] font-black text-on-surface tracking-[-0.05em] leading-none">
                      Start New Rivalry
                    </h3>
                    <p className="text-on-surface-variant text-lg leading-relaxed">
                      Challenge another friend and add a fresh duel to your lounge.
                    </p>
                  </div>
                  <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                    <button
                      onClick={() => {
                        setShowCreate(true);
                        setCreatedCode("");
                        setCreateError("");
                      }}
                      className="flex-1 bg-primary text-on-primary py-4 rounded-[1.5rem] font-black text-sm hover:scale-[1.01] active:scale-[0.99] transition-all shadow-[0_16px_28px_rgba(149,63,77,0.22)]"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => {
                        setShowJoin(true);
                        setJoinError("");
                        setJoinCode("");
                      }}
                      className="flex-1 bg-white text-on-surface border border-surface-container py-4 rounded-[1.5rem] font-black text-sm hover:scale-[1.01] active:scale-[0.99] transition-all"
                    >
                      Join with Code
                    </button>
                  </div>
                </article>
              )}
            </div>
          </div>
          )}
        </main>
      </div>

      {/* ========== Create Modal ========== */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div
            className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowCreate(false)}
              className="absolute top-6 right-6 text-on-surface-variant hover:text-on-surface"
            >
              <X size={24} />
            </button>

            {!createdCode ? (
              <>
                <h3 className="text-2xl font-black text-on-surface mb-2">Create a Rivalry</h3>
                <p className="text-on-surface-variant mb-8">Pick your language, then share the code with your rival.</p>

                <div className="mb-8">
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">
                    I want to learn
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setMyLang(lang)}
                        className={`py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                          myLang === lang
                            ? "bg-primary text-on-primary shadow-sm"
                            : "bg-surface-container-low text-on-surface hover:bg-surface-container"
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                {createError && (
                  <div className="text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    {createError}
                  </div>
                )}
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="w-full bg-primary text-on-primary py-4 rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm disabled:opacity-60"
                >
                  {creating ? "Creating..." : "Create Rivalry"}
                </button>
              </>
            ) : (
              /* Code generated */
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-primary-container rounded-full flex items-center justify-center mx-auto">
                  <Swords size={40} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-on-surface mb-2">Rivalry Created!</h3>
                  <p className="text-on-surface-variant">Share this code with your rival:</p>
                </div>

                <div className="bg-surface-container-low rounded-2xl p-6">
                  <p className="text-4xl font-black text-primary tracking-[0.3em] font-mono mb-4">
                    {createdCode}
                  </p>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 mx-auto text-sm font-bold text-on-surface-variant hover:text-primary transition-colors"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? "Copied!" : "Copy Code"}
                  </button>
                </div>

                <button
                  onClick={() => setShowCreate(false)}
                  className="w-full bg-surface-container-low text-on-surface py-4 rounded-2xl font-bold hover:bg-surface-container transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========== Join Modal ========== */}
      {showJoin && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowJoin(false)}>
          <div
            className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowJoin(false)}
              className="absolute top-6 right-6 text-on-surface-variant hover:text-on-surface"
            >
              <X size={24} />
            </button>

            <h3 className="text-2xl font-black text-on-surface mb-2">Join a Rivalry</h3>
            <p className="text-on-surface-variant mb-8">Enter the code your rival shared with you.</p>

            <div className="mb-6">
              <input
                type="text"
                maxLength={6}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="XXXXXX"
                className="w-full text-center text-3xl font-black tracking-[0.3em] font-mono bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/30 rounded-2xl py-5 outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>

            <div className="mb-6">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">
                I want to learn
              </label>
              <div className="grid grid-cols-2 gap-2">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setJoinLang(lang)}
                    className={`py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                      joinLang === lang
                        ? "bg-primary text-on-primary shadow-sm"
                        : "bg-surface-container-low text-on-surface hover:bg-surface-container"
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {joinError && (
              <div className="text-sm text-center font-medium px-4 py-3 rounded-xl bg-red-100 text-red-700 mb-6">
                {joinError}
              </div>
            )}

            <button
              onClick={handleJoin}
              disabled={joining || joinCode.length < 4}
              className="w-full bg-primary text-on-primary py-4 rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm disabled:opacity-60"
            >
              {joining ? "Joining..." : "Join Rivalry"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
