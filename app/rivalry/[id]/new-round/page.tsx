"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "../../../../lib/supabase";
import type { Rivalry } from "@/lib/domain-types";
import {
  formatWebsiteDateTime,
  getDictionary,
  getLocalizedLanguageLevelLabel,
  getLocalizedLearningLanguageLabel,
  resolveClientWebsiteLanguage,
} from "@/lib/i18n";
import { resolveRoundLanguageLevel } from "@/lib/language-level";
import { getEditableProfileFromUser } from "@/lib/profile";
import { getRoundCreationLockState } from "@/lib/round-creation";
import { isRivalryInactive } from "@/lib/rivalry-ledger";
import { ArrowLeft, Sparkles, Clock, Trophy, ArrowRight, Loader2 } from "lucide-react";

function mapCreateRoundError(
  code: string | undefined,
  dictionary: ReturnType<typeof getDictionary>,
  nextRoundAvailableText: string | null
) {
  switch (code) {
    case "ROUND_CREATION_COOLDOWN":
      return nextRoundAvailableText
        ? dictionary.newRound.errors.cooldownWithTime(nextRoundAvailableText)
        : dictionary.newRound.errors.cooldownNoTime;
    case "RIVALRY_INACTIVE":
      return dictionary.newRound.errors.rivalryEnded;
    case "MISSING_ACCESS_TOKEN":
    case "UNAUTHORIZED":
      return dictionary.newRound.errors.sessionExpired;
    case "ACTIVE_ROUND_EXISTS":
      return dictionary.newRound.errors.activeRoundExists;
    default:
      return dictionary.newRound.errors.createFailed;
  }
}

export default function NewRoundPage() {
  const router = useRouter();
  const params = useParams();
  const rivalryId = params.id as string;

  const [userId, setUserId] = useState<string | null>(null);
  const [rivalry, setRivalry] = useState<Rivalry | null>(null);
  const [websiteLanguage, setWebsiteLanguage] = useState(
    resolveClientWebsiteLanguage()
  );
  const [latestRoundCreatedAt, setLatestRoundCreatedAt] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<{
    type: "error";
    text: string;
  } | null>(null);

  // Form
  const [topic, setTopic] = useState("");
  const [studyDays, setStudyDays] = useState(7);
  const [prize, setPrize] = useState("");

  const dictionary = getDictionary(websiteLanguage);
  const topicSuggestions = dictionary.newRound.topicSuggestions;

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUserId(user.id);
      setWebsiteLanguage(getEditableProfileFromUser(user).websiteLanguage);

      const { data } = await supabase
        .from("rivalries")
        .select("*")
        .eq("id", rivalryId)
        .single();

      if (!data || !data.player_b_id || isRivalryInactive(data.cumulative_ledger)) {
        router.push(`/rivalries?rivalry=${rivalryId}`);
        return;
      }
      setRivalry(data);

      const { data: latestRound } = await supabase
        .from("rounds")
        .select("created_at")
        .eq("rivalry_id", rivalryId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle<{ created_at: string }>();

      setLatestRoundCreatedAt(latestRound?.created_at ?? null);
      setLoading(false);
    };
    init();
  }, [router, rivalryId]);

  const roundCreationLock = getRoundCreationLockState(latestRoundCreatedAt);
  const nextRoundAvailableText = roundCreationLock.nextAvailableAt
    ? formatWebsiteDateTime(roundCreationLock.nextAvailableAt, websiteLanguage)
    : null;

  const handleCreate = async () => {
    if (!userId || !rivalry || !topic.trim()) return;

    if (roundCreationLock.isLocked) {
      setMessage({
        type: "error",
        text: nextRoundAvailableText
          ? dictionary.newRound.errors.cooldownWithTime(nextRoundAvailableText)
          : dictionary.newRound.errors.cooldownNoTime,
      });
      return;
    }

    setCreating(true);
    setMessage(null);

    if (isRivalryInactive(rivalry.cumulative_ledger)) {
      setMessage({
        type: "error",
        text: dictionary.newRound.errors.rivalryEnded,
      });
      setCreating(false);
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setMessage({
        type: "error",
        text: dictionary.newRound.errors.sessionExpired,
      });
      setCreating(false);
      return;
    }

    const response = await fetch("/api/create-round", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        rivalryId,
        topic: topic.trim(),
        studyDays,
        prizeText: prize.trim() || null,
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | {
          error?: string;
          code?: string;
          nextAvailableAt?: string | null;
          latestRoundCreatedAt?: string | null;
          round?: { id: string };
        }
      | null;

    if (!response.ok || !payload?.round) {
      if (payload?.code === "ROUND_CREATION_COOLDOWN") {
        setLatestRoundCreatedAt(payload.latestRoundCreatedAt ?? latestRoundCreatedAt);
      }

      setMessage({
        type: "error",
        text: mapCreateRoundError(
          payload?.code,
          dictionary,
          payload?.code === "ROUND_CREATION_COOLDOWN" && payload.nextAvailableAt
            ? formatWebsiteDateTime(payload.nextAvailableAt, websiteLanguage)
            : nextRoundAvailableText
        ),
      });
      setCreating(false);
      return;
    }

    // Navigate to the round page
    router.push(`/round/${payload.round.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-on-surface-variant font-medium">
          {dictionary.newRound.loading}
        </div>
      </div>
    );
  }

  const nextRoundNumber = (rivalry?.current_round_num ?? 0) + 1;
  const targetLanguage = rivalry
    ? nextRoundNumber % 2 === 1
      ? rivalry.player_a_lang
      : rivalry.player_b_lang || rivalry.player_a_lang
    : null;
  const targetLevel = resolveRoundLanguageLevel(rivalry, targetLanguage);
  const localizedTargetLanguage = getLocalizedLearningLanguageLabel(
    targetLanguage,
    websiteLanguage
  );
  const localizedTargetLevel = getLocalizedLanguageLevelLabel(
    targetLevel,
    websiteLanguage
  );

  return (
    <div className="min-h-screen bg-surface">
      <header className="flex items-center px-6 py-5 max-w-3xl mx-auto">
        <button
          onClick={() => router.push(`/rivalries?rivalry=${rivalryId}`)}
          className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-medium"
        >
          <ArrowLeft size={20} />
          {dictionary.newRound.back}
        </button>
      </header>

      <div className="max-w-3xl mx-auto px-6 pb-12 space-y-10">
        <div>
          <h1 className="text-4xl font-black text-on-surface tracking-tighter mb-2">
            {dictionary.newRound.title}
          </h1>
          <p className="text-on-surface-variant text-lg">
            {dictionary.newRound.description}
          </p>
          {targetLanguage && (
            <p className="text-sm text-on-surface-variant font-medium mt-3">
              {dictionary.newRound.targetLevelDescription(
                localizedTargetLanguage,
                localizedTargetLevel
              )}
            </p>
          )}
        </div>

        {roundCreationLock.isLocked && nextRoundAvailableText && (
          <div className="rounded-[1.75rem] border border-amber-200 bg-amber-50 px-5 py-4 text-amber-900">
            <div className="font-bold">{dictionary.newRound.cooldownTitle}</div>
            <div className="mt-1 text-sm font-medium">
              {dictionary.newRound.cooldownDescription(nextRoundAvailableText)}
            </div>
          </div>
        )}

        {/* Topic Selection */}
        <section className="space-y-4">
          <label className="flex items-center gap-2 text-sm font-bold text-on-surface-variant uppercase tracking-widest">
            <Sparkles size={16} /> {dictionary.newRound.topicLabel}
          </label>

          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={dictionary.newRound.topicPlaceholder}
            className="w-full bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/40 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-primary transition-all border border-surface-container text-lg"
          />

          <div className="flex flex-wrap gap-2">
            {topicSuggestions.map((s) => (
              <button
                key={s}
                onClick={() => setTopic(s)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  topic === s
                    ? "bg-primary text-on-primary shadow-sm"
                    : "bg-surface-container-low text-on-surface hover:bg-surface-container"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </section>

        {/* Default Study Window */}
        <section className="space-y-4">
          <label className="flex items-center gap-2 text-sm font-bold text-on-surface-variant uppercase tracking-widest">
            <Clock size={16} /> {dictionary.newRound.defaultWindowLabel}
          </label>

          <div className="flex gap-3">
            {[3, 5, 7, 10, 14].map((d) => (
              <button
                key={d}
                onClick={() => setStudyDays(d)}
                className={`flex-1 py-4 rounded-2xl font-black text-lg transition-all ${
                  studyDays === d
                    ? "bg-primary text-on-primary shadow-sm"
                    : "bg-surface-container-lowest text-on-surface border border-surface-container hover:bg-surface-container-low"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
          <p className="text-sm text-on-surface-variant font-medium ml-1">
            {dictionary.newRound.defaultWindowHint(studyDays)}
          </p>
        </section>

        {/* Prize / Stake */}
        <section className="space-y-4">
          <label className="flex items-center gap-2 text-sm font-bold text-on-surface-variant uppercase tracking-widest">
            <Trophy size={16} /> {dictionary.newRound.prizeLabel}
            <span className="text-on-surface-variant/50 normal-case tracking-normal font-medium">
              {dictionary.newRound.optional}
            </span>
          </label>

          <input
            type="text"
            value={prize}
            onChange={(e) => setPrize(e.target.value)}
            placeholder={dictionary.newRound.prizePlaceholder}
            className="w-full bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/40 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-primary transition-all border border-surface-container text-lg"
          />
        </section>

        {message && (
          <div className="rounded-[1.75rem] border border-red-200 bg-red-50 px-5 py-4 text-red-700">
            <div className="font-bold">{dictionary.newRound.errorTitle}</div>
            <div className="mt-1 text-sm font-medium">{message.text}</div>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleCreate}
          disabled={creating || !topic.trim() || roundCreationLock.isLocked}
          className="w-full bg-primary text-on-primary py-5 rounded-2xl font-black text-xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {creating ? (
            <>
              <Loader2 size={24} className="animate-spin" />
              {dictionary.newRound.creatingRound}
            </>
          ) : (
            <>
              {dictionary.newRound.createRound} <ArrowRight size={24} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
