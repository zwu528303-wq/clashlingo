"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "../lib/supabase";
import type { Rivalry, Round } from "@/lib/domain-types";
import {
  getDictionary,
  getLocalizedLanguageLevelLabel,
  getLocalizedLearningLanguageLabel,
  resolveClientWebsiteLanguage,
} from "@/lib/i18n";
import { resolveRoundLanguageLevel } from "@/lib/language-level";
import { getEditableProfileFromUser } from "@/lib/profile";
import {
  getLocalizedList,
  getLocalizedVocabularyGroups,
  type InstructionLanguage,
} from "@/lib/instruction-content";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  BookOpen,
  Swords,
  Trophy,
  Loader2,
} from "lucide-react";

interface ApiErrorPayload {
  error?: string;
  code?: string;
}

function mapSyllabusErrorCode(
  code: string | undefined,
  fallback: string | undefined,
  dictionary: ReturnType<typeof getDictionary>
) {
  switch (code) {
    case "MISSING_FIELDS":
    case "ROUND_NOT_FOUND":
    case "AI_NO_TEXT":
    case "SYLLABUS_PARSE_FAILED":
    case "ROUND_UPDATE_FAILED":
    case "INTERNAL_ERROR":
      return dictionary.round.errors.generateScopeFailed;
    default:
      return fallback || dictionary.round.errors.generateScopeFailed;
  }
}

function mapExamErrorCode(
  code: string | undefined,
  fallback: string | undefined,
  dictionary: ReturnType<typeof getDictionary>
) {
  switch (code) {
    case "MISSING_ROUND_ID":
    case "ROUND_NOT_FOUND":
    case "MISSING_SYLLABUS":
    case "AI_NO_TEXT":
    case "EXAM_PARSE_FAILED":
    case "INTERNAL_ERROR":
      return dictionary.round.errors.unlockExamFailed;
    default:
      return fallback || dictionary.round.errors.unlockExamFailed;
  }
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
  const [syllabusError, setSyllabusError] = useState("");
  const [actionError, setActionError] = useState("");
  const [websiteLanguage, setWebsiteLanguage] = useState(
    resolveClientWebsiteLanguage()
  );
  const [instructionLanguage, setInstructionLanguage] =
    useState<InstructionLanguage>(
    resolveClientWebsiteLanguage()
  );
  const examGenerationTriggered = useRef(false);
  const examLiveSyncTriggered = useRef(false);

  // Countdown
  const [timeLeft, setTimeLeft] = useState("");

  const isPlayerA = rivalry?.player_a_id === userId;
  const dictionary = getDictionary(websiteLanguage);

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
      const profile = getEditableProfileFromUser(user);
      setUserId(user.id);
      setWebsiteLanguage(profile.websiteLanguage);
      setInstructionLanguage(profile.instructionLanguage);
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
        clearInterval(interval);
        if (!examGenerationTriggered.current) {
          examGenerationTriggered.current = true;
          setActionLoading(true);
          fetch("/api/generate-exam", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roundId }),
          }).then(async (res) => {
            if (!res.ok) {
              const data = (await res.json().catch(() => null)) as
                | ApiErrorPayload
                | null;
              console.error("Exam generation failed:", data?.error);
            }
            await loadRound();
            setActionLoading(false);
          });
        }
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
  }, [round?.status, round?.exam_at, roundId, loadRound]);

  // ========== Actions ==========

  const handleConfirm = async () => {
    if (!round || !userId) return;
    setActionLoading(true);
    setActionError("");

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
  const myExamReady = isPlayerA ? round?.player_a_exam_ready : round?.player_b_exam_ready;
  const rivalExamReady = isPlayerA ? round?.player_b_exam_ready : round?.player_a_exam_ready;
  const bothExamReady = !!(
    round?.player_a_exam_ready && round?.player_b_exam_ready
  );
  const syllabus = round?.syllabus;
  const localizedCanDo = getLocalizedList(
    syllabus?.can_do,
    instructionLanguage
  );
  const localizedGrammar = getLocalizedList(
    syllabus?.grammar,
    instructionLanguage
  );
  const vocabularyGroups = getLocalizedVocabularyGroups(
    syllabus,
    instructionLanguage
  );

  const promoteExamLive = useCallback(
    async (currentStatus: Round["status"]) => {
      if (!round) return false;

      if (currentStatus === "countdown") {
        const examResponse = await fetch("/api/generate-exam", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roundId }),
        });

        if (!examResponse.ok) {
          const payload = (await examResponse.json().catch(() => null)) as
            | ApiErrorPayload
            | null;
          setActionError(
            mapExamErrorCode(payload?.code, payload?.error, dictionary)
          );
          await loadRound();
          return false;
        }
      }

      const { error: liveError } = await supabase
        .from("rounds")
        .update({
          status: "exam_live",
          exam_started_at: new Date().toISOString(),
        })
        .eq("id", round.id);

      if (liveError) {
        setActionError(dictionary.round.errors.startExamFailed);
        await loadRound();
        return false;
      }

      await loadRound();
      return true;
    },
    [dictionary, loadRound, round, roundId]
  );

  const handleExamReady = async () => {
    if (!round || !userId) return;

    setActionLoading(true);
    setActionError("");

    const field = isPlayerA ? "player_a_exam_ready" : "player_b_exam_ready";
    const { error: readyError } = await supabase
      .from("rounds")
      .update({ [field]: true })
      .eq("id", round.id);

    if (readyError) {
      setActionError(dictionary.round.errors.saveReadyFailed);
      setActionLoading(false);
      return;
    }

    const { data: updated, error: updatedError } = await supabase
      .from("rounds")
      .select("status, player_a_exam_ready, player_b_exam_ready")
      .eq("id", round.id)
      .single<{
        status: string;
        player_a_exam_ready: boolean;
        player_b_exam_ready: boolean;
      }>();

    if (updatedError || !updated) {
      setActionError(dictionary.round.errors.refreshReadyFailed);
      await loadRound();
      setActionLoading(false);
      return;
    }

    const bothReady =
      updated.player_a_exam_ready && updated.player_b_exam_ready;

    if (bothReady) {
      const activated = await promoteExamLive(
        updated.status as Round["status"]
      );
      if (!activated) {
        setActionLoading(false);
        return;
      }
    }

    await loadRound();
    setActionLoading(false);
  };

  useEffect(() => {
    if (
      !round ||
      round.status !== "exam_ready" ||
      !round.player_a_exam_ready ||
      !round.player_b_exam_ready
    ) {
      examLiveSyncTriggered.current = false;
      return;
    }

    if (examLiveSyncTriggered.current) return;
    examLiveSyncTriggered.current = true;

    void (async () => {
      setActionLoading(true);
      const activated = await promoteExamLive("exam_ready");
      if (!activated) {
        examLiveSyncTriggered.current = false;
      }
      setActionLoading(false);
    })();
  }, [promoteExamLive, round]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-on-surface-variant font-medium">
          {dictionary.common.loading}
        </div>
      </div>
    );
  }

  if (!round || !rivalry) return null;

  const roundLanguageLevel = resolveRoundLanguageLevel(
    rivalry,
    round.target_lang
  );
  const localizedTargetLanguage = getLocalizedLearningLanguageLabel(
    round.target_lang,
    websiteLanguage
  );
  const localizedRoundLevel = getLocalizedLanguageLevelLabel(
    roundLanguageLevel,
    websiteLanguage
  );
  const studyDaysValue = dictionary.round.daysValue(round.study_days || 0);

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5 max-w-4xl mx-auto">
        <button
          onClick={() => router.push(`/rivalries?rivalry=${rivalry.id}`)}
          className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-medium"
        >
          <ArrowLeft size={20} />
          {dictionary.round.back}
        </button>
        <div className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">
          {dictionary.round.roundLabel(round.round_number)}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 pb-12">
        {/* ========== topic_selection ========== */}
        {round.status === "topic_selection" && (
          <div className="space-y-8 text-center max-w-2xl mx-auto">
            <div>
              <h1 className="text-4xl font-black text-on-surface tracking-tighter mb-2">
                {dictionary.round.topicSelectionTitle(round.round_number)}
              </h1>
              <p className="text-on-surface-variant text-lg">
                {dictionary.round.topicSelectionDescription}
              </p>
            </div>

            <div className="bg-surface-container-lowest rounded-[2rem] p-8 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">
                  {dictionary.round.labels.topic}
                </span>
                <span className="text-on-surface font-bold text-lg">{round.topic}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">
                  {dictionary.round.labels.language}
                </span>
                <span className="text-on-surface font-bold text-lg">
                  {localizedTargetLanguage}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">
                  {dictionary.round.labels.defaultWindow}
                </span>
                <span className="text-on-surface font-bold text-lg">
                  {studyDaysValue}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">
                  {dictionary.round.labels.level}
                </span>
                <span className="text-on-surface font-bold text-lg">
                  {localizedRoundLevel}
                </span>
              </div>
              {round.prize_text && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">
                    {dictionary.round.labels.prize}
                  </span>
                  <span className="text-on-surface font-bold text-lg italic">{round.prize_text}</span>
                </div>
              )}
            </div>

            <p className="text-on-surface-variant">
              {dictionary.round.scopeReadyHint}
            </p>

            <button
              onClick={async () => {
                setActionLoading(true);
                const res = await fetch("/api/generate-syllabus", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    roundId: round.id,
                    topic: round.topic,
                    targetLang: round.target_lang,
                  }),
                });
                const data = (await res.json().catch(() => null)) as
                  | ApiErrorPayload
                  | null;
                if (!res.ok) {
                  setSyllabusError(
                    mapSyllabusErrorCode(data?.code, data?.error, dictionary)
                  );
                } else {
                  setSyllabusError("");
                }
                await loadRound();
                setActionLoading(false);
              }}
              disabled={actionLoading}
              className="bg-primary text-on-primary px-8 py-4 rounded-full font-black text-lg shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {actionLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />{" "}
                  {dictionary.round.generatingScope}
                </>
              ) : (
                dictionary.round.generateScope
              )}
            </button>
            {syllabusError && (
              <div className="text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-2xl px-5 py-3">
                {syllabusError}
              </div>
            )}
          </div>
        )}

        {/* ========== confirming ========== */}
        {round.status === "confirming" && (
          <div className="space-y-8 max-w-2xl mx-auto">
            <div className="text-center">
              <h1 className="text-4xl font-black text-on-surface tracking-tighter mb-2">
                {dictionary.round.reviewConfirmTitle}
              </h1>
              <p className="text-on-surface-variant text-lg">
                {dictionary.round.reviewConfirmDescription}
              </p>
            </div>

            {/* Syllabus Preview */}
            {syllabus && (
              <div className="bg-surface-container-lowest rounded-[2rem] p-8 shadow-sm space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen size={20} className="text-primary" />
                  <h2 className="text-xl font-black text-on-surface">
                    {dictionary.round.examScope}
                  </h2>
                </div>

                {/* Can Do */}
                <div>
                  <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                    {dictionary.round.canDoObjectives}
                  </h3>
                  <ul className="space-y-2">
                    {localizedCanDo.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-on-surface">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Vocabulary */}
                {vocabularyGroups.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-3">
                      {dictionary.scopes.sections.vocabulary}
                    </h3>
                    <div className="space-y-4">
                      {vocabularyGroups.map((group) => (
                        <div key={group.id}>
                          <p className="text-sm font-medium text-on-surface-variant mb-2">
                            {group.label}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {group.words.map((w, i) => (
                              <span key={i} className="px-3 py-1.5 bg-white border border-surface-container rounded-xl text-on-surface text-sm">{w}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Grammar */}
                {localizedGrammar.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                      {dictionary.scopes.sections.grammar}
                    </h3>
                    <div className="space-y-2">
                      {localizedGrammar.map((g, i) => (
                        <div key={i} className="bg-surface-container-low p-3 rounded-xl border-l-4 border-primary text-on-surface text-sm">{g}</div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expressions */}
                {syllabus.expressions && (
                  <div>
                    <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                      {dictionary.scopes.sections.expressions}
                    </h3>
                    <div className="divide-y divide-surface-container">
                      {syllabus.expressions.map((e, i) => (
                        <div key={i} className="py-2 text-on-surface text-sm">{e}</div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Listening */}
                {syllabus.listening && (
                  <div>
                    <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                      {dictionary.scopes.sections.listening}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {syllabus.listening.map((l, i) => (
                        <span key={i} className="px-3 py-1.5 bg-white border border-surface-container rounded-xl text-on-surface text-sm">{l}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Round Info */}
            <div className="bg-surface-container-low rounded-2xl p-6 flex flex-wrap gap-6 justify-center">
              <div className="text-center">
                <div className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">
                  {dictionary.round.labels.topic}
                </div>
                <div className="font-bold text-on-surface">{round.topic}</div>
              </div>
              <div className="text-center">
                <div className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">
                  {dictionary.round.labels.defaultWindow}
                </div>
                <div className="font-bold text-on-surface">{studyDaysValue}</div>
              </div>
              <div className="text-center">
                <div className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">
                  {dictionary.round.labels.level}
                </div>
                <div className="font-bold text-on-surface">{localizedRoundLevel}</div>
              </div>
              {round.prize_text && (
                <div className="text-center">
                  <div className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">
                    {dictionary.round.labels.prize}
                  </div>
                  <div className="font-bold text-on-surface italic">{round.prize_text}</div>
                </div>
              )}
            </div>

            {/* Confirmation Status */}
            <div className="bg-surface-container-lowest rounded-[2rem] p-8 shadow-sm">
              <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-6 text-center">
                {dictionary.round.confirmationStatus}
              </h3>
              <div className="flex justify-center gap-12">
                <div className="flex flex-col items-center gap-3">
                  {myConfirmed ? (
                    <CheckCircle2 size={48} className="text-primary" />
                  ) : (
                    <Circle size={48} className="text-on-surface-variant/30" />
                  )}
                  <span className="font-bold text-on-surface">
                    {dictionary.round.you}
                  </span>
                  <span className="text-xs font-bold text-on-surface-variant uppercase">
                    {myConfirmed ? dictionary.round.ready : dictionary.round.pending}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-3">
                  {rivalConfirmed ? (
                    <CheckCircle2 size={48} className="text-secondary" />
                  ) : (
                    <Circle size={48} className="text-on-surface-variant/30" />
                  )}
                  <span className="font-bold text-on-surface">
                    {dictionary.round.rival}
                  </span>
                  <span className="text-xs font-bold text-on-surface-variant uppercase">
                    {rivalConfirmed ? dictionary.round.ready : dictionary.round.pending}
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
                    <Swords size={24} /> {dictionary.round.confirmScope}
                  </>
                )}
              </button>
            ) : (
              <div className="text-center py-4">
                <p className="text-on-surface-variant font-bold text-lg">
                  {dictionary.round.lockedInWaiting}
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
                {dictionary.round.defaultStudyWindowBadge}
              </div>
              <h1 className="text-6xl md:text-8xl font-black text-on-surface tracking-tighter leading-none mb-4">
                <span className="text-primary">{timeLeft || "..."}</span>
              </h1>
              <p className="text-on-surface-variant text-lg">
                {dictionary.round.countdownDescription}
              </p>
            </div>
            {actionLoading && (
              <div className="flex items-center gap-2 text-on-surface-variant font-medium">
                <Loader2 size={20} className="animate-spin text-primary" />
                {dictionary.round.syncingExamStart}
              </div>
            )}

            {/* Syllabus Access */}
            <div className="bg-surface-container-lowest rounded-[2rem] p-8 shadow-sm">
              <div className="flex items-center gap-2 justify-center mb-4">
                <BookOpen size={20} className="text-primary" />
                <h2 className="text-xl font-black text-on-surface">
                  {dictionary.round.studyMaterialTitle}
                </h2>
              </div>
              <p className="text-on-surface-variant mb-6">
                {dictionary.round.studyMaterialDescription(
                  round.topic || dictionary.results.noTopic,
                  localizedTargetLanguage
                )}
              </p>
              <p className="text-sm text-on-surface-variant">
                {dictionary.round.studyMaterialHint}
              </p>
            </div>

            <div className="bg-surface-container-low rounded-[2rem] p-8 shadow-sm space-y-6">
              <div>
                <h2 className="text-xl font-black text-on-surface mb-2">
                  {dictionary.round.earlyStartTitle}
                </h2>
                <p className="text-on-surface-variant">
                  {dictionary.round.earlyStartDescription}
                </p>
              </div>

              <div className="flex justify-center gap-12">
                <div className="flex flex-col items-center gap-3">
                  {myExamReady ? (
                    <CheckCircle2 size={48} className="text-primary" />
                  ) : (
                    <Circle size={48} className="text-on-surface-variant/30" />
                  )}
                  <span className="font-bold text-on-surface">
                    {dictionary.round.you}
                  </span>
                  <span className="text-xs font-bold text-on-surface-variant uppercase">
                    {myExamReady
                      ? dictionary.round.readyNow
                      : dictionary.round.stillStudying}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-3">
                  {rivalExamReady ? (
                    <CheckCircle2 size={48} className="text-secondary" />
                  ) : (
                    <Circle size={48} className="text-on-surface-variant/30" />
                  )}
                  <span className="font-bold text-on-surface">
                    {dictionary.round.rival}
                  </span>
                  <span className="text-xs font-bold text-on-surface-variant uppercase">
                    {rivalExamReady
                      ? dictionary.round.readyNow
                      : dictionary.round.stillStudying}
                  </span>
                </div>
              </div>

              <button
                onClick={handleExamReady}
                disabled={actionLoading || myExamReady}
                className="w-full bg-primary text-on-primary py-5 rounded-2xl font-black text-xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {actionLoading
                  ? dictionary.round.starting
                  : myExamReady
                    ? dictionary.round.waitingForRival
                    : dictionary.round.readyToStartEarly}
              </button>
            </div>

            {actionError && (
              <div className="text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-2xl px-5 py-3">
                {actionError}
              </div>
            )}

            {/* Prize */}
            {round.prize_text && (
              <div className="bg-tertiary-container/30 border-2 border-dashed border-tertiary/30 rounded-2xl py-6 px-10 inline-flex flex-col items-center">
                <span className="text-on-surface-variant text-xs uppercase tracking-widest mb-1 font-bold">
                  <Trophy size={14} className="inline mr-1" />{" "}
                  {dictionary.round.stake}
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
              {dictionary.round.examReadyTitle}
            </h1>
            <p className="text-on-surface-variant text-lg">
              {dictionary.round.examReadyDescription}
            </p>

            <div className="flex justify-center gap-12">
              <div className="flex flex-col items-center gap-3">
                {(isPlayerA ? round.player_a_exam_ready : round.player_b_exam_ready) ? (
                  <CheckCircle2 size={64} className="text-primary" />
                ) : (
                  <Circle size={64} className="text-on-surface-variant/30" />
                )}
                <span className="font-bold">{dictionary.round.you}</span>
              </div>
              <div className="flex flex-col items-center gap-3">
                {(isPlayerA ? round.player_b_exam_ready : round.player_a_exam_ready) ? (
                  <CheckCircle2 size={64} className="text-secondary" />
                ) : (
                  <Circle size={64} className="text-on-surface-variant/30" />
                )}
                <span className="font-bold">{dictionary.round.rival}</span>
              </div>
            </div>

            <button
              onClick={handleExamReady}
              disabled={actionLoading || (myExamReady && !bothExamReady)}
              className="bg-primary text-on-primary py-5 px-12 rounded-full font-black text-xl shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              {actionLoading ? (
                <Loader2 size={24} className="animate-spin" />
              ) : bothExamReady ? (
                dictionary.round.starting
              ) : myExamReady ? (
                dictionary.round.waitingForRival
              ) : (
                dictionary.round.readyToEnterExam
              )}
            </button>

            {actionError && (
              <div className="text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-2xl px-5 py-3">
                {actionError}
              </div>
            )}
          </div>
        )}

        {/* ========== exam_live ========== */}
        {round.status === "exam_live" && (
          <div className="space-y-8 text-center max-w-2xl mx-auto">
            <h1 className="text-4xl font-black text-on-surface tracking-tighter">
              {dictionary.round.examLiveTitle}
            </h1>
            <p className="text-on-surface-variant text-lg">
              {dictionary.round.examLiveDescription}
            </p>
            <button
              onClick={() => router.push(`/round/${round.id}/exam`)}
              className="bg-primary text-on-primary py-5 px-12 rounded-full font-black text-xl shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              {dictionary.round.goToExam}
            </button>
          </div>
        )}

        {/* ========== completed ========== */}
        {round.status === "completed" && (
          <div className="space-y-8 text-center max-w-2xl mx-auto">
            <h1 className="text-4xl font-black text-on-surface tracking-tighter">
              {dictionary.round.roundCompleteTitle}
            </h1>
            <button
              onClick={() => router.push(`/round/${round.id}/results`)}
              className="bg-primary text-on-primary py-5 px-12 rounded-full font-black text-xl shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              {dictionary.round.viewResults}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
