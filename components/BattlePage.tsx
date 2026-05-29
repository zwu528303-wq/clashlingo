"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  ArrowLeft,
  BadgeInfo,
  Clock3,
  ScrollText,
  Sparkles,
  Swords,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import AppSidebar from "@/components/AppSidebar";
import BattleQuestionCard from "@/components/BattleQuestionCard";
import {
  buildBattleQuestionOrder,
  clearBattleReport,
  evaluateBattleSession,
  saveBattleReport,
} from "@/lib/battle-session";
import {
  evaluateBattleQuestion,
  getBattleTotals,
  getQuestionTimer,
} from "@/lib/battle-scoring";
import { getDictionary, resolveClientWebsiteLanguage } from "@/lib/i18n";
import { useBattlePack } from "@/lib/use-battle-pack";
import { getScenarioBySlug } from "@/lib/scenario-map";
import { getLocalizedText, isStageNumber } from "@/lib/scenario-types";
import {
  type EditableProfile,
  getEditableProfileFromUser,
  resolveDisplayName,
} from "@/lib/profile";
import { supabase } from "@/lib/supabase";

interface PublicUserRow {
  display_name: string | null;
}

interface BattlePageProps {
  sessionId: string;
}

type BattleViewState = "ready" | "live" | "completed";

export default function BattlePage({ sessionId }: BattlePageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<EditableProfile | null>(null);
  const [fallbackWebsiteLanguage] = useState(resolveClientWebsiteLanguage());
  const [loading, setLoading] = useState(true);
  const [viewState, setViewState] = useState<BattleViewState>("ready");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [startedAtMs, setStartedAtMs] = useState<number | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [results, setResults] = useState<
    ReturnType<typeof evaluateBattleQuestion>[]
  >([]);
  const [lastReaction, setLastReaction] = useState<string | null>(null);
  const websiteLanguage = profile?.websiteLanguage ?? fallbackWebsiteLanguage;
  const dictionary = getDictionary(websiteLanguage);

  const slug = searchParams.get("scenario") ?? "";
  const stageParam = Number(searchParams.get("stage"));
  const stage = isStageNumber(stageParam) ? stageParam : null;
  const opponent = searchParams.get("opponent") ?? "ai";
  const mode = searchParams.get("mode") === "exam" ? "exam" : "clash";
  const isExamMode = mode === "exam";
  const scenario = getScenarioBySlug(slug);
  const scoreLabels =
    websiteLanguage === "zh-CN"
      ? {
          questionsReady: "题已就绪",
          speed: "速度",
          accuracy: "准确",
          quality: "表达",
        }
      : {
          questionsReady: "questions ready",
          speed: "Speed",
          accuracy: "Accuracy",
          quality: "Quality",
        };

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        setLoading(false);
        return;
      }

      setAuthUser(user);
      const authProfile = getEditableProfileFromUser(user);
      const { data } = await supabase
        .from("users")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle<PublicUserRow>();

      setProfile({
        ...authProfile,
        displayName: resolveDisplayName(data?.display_name, authProfile.displayName),
      });
      setLoading(false);
    };

    void init();
  }, [router]);

  const { pack, status: packStatus } = useBattlePack({
    scenarioSlug: scenario?.slug ?? null,
    stage,
    profile,
  });

  const questions = useMemo(
    () => (pack ? buildBattleQuestionOrder(pack) : []),
    [pack]
  );
  const currentQuestion = questions[currentIndex] ?? null;
  const totals = useMemo(() => getBattleTotals(results), [results]);

  const battleStarted = viewState === "live";
  const currentMaxTime =
    currentQuestion && pack ? getQuestionTimer(currentQuestion, pack.rules) : 0;
  const canSubmit = currentQuestion
    ? currentQuestion.type === "multiple_choice"
      ? Boolean(selectedOption)
      : textAnswer.trim().length > 0
    : false;

  const primeQuestion = useCallback(
    (questionIndex: number) => {
      const nextQuestion = questions[questionIndex];
      if (!pack || !nextQuestion) {
        return;
      }

      setCurrentIndex(questionIndex);
      setTextAnswer("");
      setSelectedOption(null);
      setStartedAtMs(Date.now());
      setTimeLeft(getQuestionTimer(nextQuestion, pack.rules));
    },
    [pack, questions]
  );

  const handleSubmit = useCallback(
    (forcedTimeout = false) => {
      if (
        !pack ||
        !scenario ||
        !profile ||
        !currentQuestion ||
        startedAtMs === null
      ) {
        return;
      }

      const rawAnswer =
        currentQuestion.type === "multiple_choice"
          ? selectedOption ?? ""
          : textAnswer;
      const maxTime = getQuestionTimer(currentQuestion, pack.rules);
      const timeSpentSec = forcedTimeout
        ? maxTime
        : Math.max(1, Math.round((Date.now() - startedAtMs) / 1000));
      const nextResult = evaluateBattleQuestion({
        question: currentQuestion,
        answer: rawAnswer,
        timeSpentSec,
        rules: pack.rules,
        sessionSeed: sessionId,
      });
      const nextResults = [...results, nextResult];

      setResults(nextResults);
      setLastReaction(nextResult.reaction);

      if (currentIndex >= questions.length - 1) {
        const report = evaluateBattleSession({
          sessionId,
          mode,
          scenarioName: scenario.name,
          playerName: profile.displayName,
          pack,
          questionResults: nextResults,
        });
        saveBattleReport(report);
        setViewState("completed");
        router.push(
          `/battle/${sessionId}/report?scenario=${scenario.slug}&stage=${stage}&mode=${mode}`
        );
        return;
      }

      primeQuestion(currentIndex + 1);
    },
    [
      currentIndex,
      currentQuestion,
      mode,
      pack,
      primeQuestion,
      profile,
      questions.length,
      results,
      router,
      scenario,
      selectedOption,
      sessionId,
      stage,
      startedAtMs,
      textAnswer,
    ]
  );

  useEffect(() => {
    if (!battleStarted || !currentQuestion) {
      return;
    }

    if (timeLeft <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      if (timeLeft <= 1) {
        handleSubmit(true);
        return;
      }

      setTimeLeft((current) => current - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [battleStarted, currentQuestion, handleSubmit, timeLeft]);

  if (loading || !authUser || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="font-medium text-on-surface-variant">
          {dictionary.common.loading}
        </div>
      </div>
    );
  }

  if (!scenario || !stage) {
    return null;
  }

  if (packStatus === "idle" || packStatus === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="font-medium text-on-surface-variant">
          {dictionary.scenarios.battleGenerating}
        </div>
      </div>
    );
  }

  if (packStatus === "error" || !pack || questions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface px-6">
        <div className="max-w-md text-center font-medium text-on-surface-variant">
          {dictionary.scenarios.battleGenerateError}
        </div>
      </div>
    );
  }

  const backHref = `/scenario/${scenario.slug}/stage/${stage}`;
  const opponentLabel =
    opponent === "friend"
      ? websiteLanguage === "zh-CN"
        ? "好友对手"
        : "Friend Opponent"
      : websiteLanguage === "zh-CN"
        ? "AI 对手"
        : "AI Opponent";
  const laneBadge = isExamMode
    ? dictionary.scenarios.modes.exam
    : dictionary.scenarios.modes.clash;
  const readyEyebrow = isExamMode
    ? dictionary.scenarios.examLaneEyebrow
    : dictionary.scenarios.battleLiveEyebrow;
  const readyTitle = isExamMode
    ? dictionary.scenarios.examLaneTitle
    : dictionary.scenarios.battleLiveTitle;
  const readyDescription = isExamMode
    ? dictionary.scenarios.examLaneDescription
    : dictionary.scenarios.battleLiveDescription;
  const startLabel = isExamMode
    ? dictionary.scenarios.startExamMode
    : dictionary.scenarios.battleStart;
  const startHint = isExamMode
    ? dictionary.scenarios.examStartHint
    : dictionary.scenarios.battleStartHint;
  const sidePrimaryLabel = isExamMode
    ? dictionary.scenarios.examCurrentScoreLabel
    : dictionary.scenarios.battleScoreLabel;

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8 lg:py-8">
        <AppSidebar active="scenarios" profile={profile} />

        <main className="space-y-6 pb-12" data-testid="battle-shell">
          <section className="rounded-[3rem] border border-white/80 bg-gradient-to-br from-surface-container-lowest via-white to-surface-container-low p-8 shadow-[0_24px_60px_rgba(149,63,77,0.08)] md:p-10">
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 text-sm font-bold text-on-surface-variant transition-colors hover:text-primary"
            >
              <ArrowLeft size={18} />
              {dictionary.scenarios.backToScenario}
            </Link>

            <div className="mt-6 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary-container px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-primary">
                  {laneBadge}
                </span>
                <span className="rounded-full bg-surface-container px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
                  {dictionary.scenarios.stageLabel(stage)}
                </span>
                {!isExamMode ? (
                  <span className="rounded-full bg-secondary-container/65 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-secondary">
                    {opponentLabel}
                  </span>
                ) : null}
              </div>

              <div className="space-y-3">
                <p className="text-[11px] font-black uppercase tracking-[0.26em] text-on-surface-variant">
                  {readyEyebrow}
                </p>
                <h1 className="text-4xl font-black tracking-[-0.06em] text-on-surface md:text-5xl">
                  {readyTitle}
                </h1>
                <p className="max-w-3xl text-base leading-relaxed text-on-surface-variant md:text-lg">
                  {readyDescription}
                </p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-[1.9rem] border border-white/80 bg-white/88 px-5 py-5 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
                  {dictionary.scenarios.battleCurrentPackLabel}
                </p>
                <p className="mt-3 text-xl font-black tracking-tight text-on-surface">
                  {getLocalizedText(scenario.name, websiteLanguage)} ·{" "}
                  {dictionary.scenarios.stageLabel(stage)}
                </p>
              </div>
              <div className="rounded-[1.9rem] border border-white/80 bg-white/88 px-5 py-5 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
                  {dictionary.scenarios.briefingQuestionMixLabel}
                </p>
                <p className="mt-3 text-xl font-black tracking-tight text-on-surface">
                  {dictionary.scenarios.briefingQuestionMixValue(
                    pack.rules.quickQuestionCount,
                    pack.rules.freeResponseCount
                  )}
                </p>
              </div>
              <div className="rounded-[1.9rem] border border-white/80 bg-white/88 px-5 py-5 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
                  {dictionary.scenarios.briefingTimerLabel}
                </p>
                <p className="mt-3 text-sm font-black tracking-tight text-on-surface">
                  {dictionary.scenarios.briefingTimerValue(
                    pack.rules.timers.multipleChoiceSec,
                    pack.rules.timers.fillBlankSec,
                    pack.rules.timers.freeResponseSec
                  )}
                </p>
              </div>
            </div>
          </section>

          {!battleStarted && viewState === "ready" ? (
            <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.2fr)_22rem]">
              <div className="rounded-[2.7rem] border border-white/80 bg-surface-container-low p-7 shadow-[0_24px_60px_rgba(149,63,77,0.08)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-primary-container text-primary">
                    {isExamMode ? <ScrollText size={20} /> : <Swords size={20} />}
                  </div>
                  <h2 className="text-2xl font-black tracking-[-0.04em] text-on-surface">
                    {startLabel}
                  </h2>
                </div>

                <p className="mt-5 max-w-2xl text-base leading-relaxed text-on-surface-variant">
                  {startHint}
                </p>

                <div className="mt-6 rounded-[1.7rem] border border-white/80 bg-white/90 p-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
                    {dictionary.scenarios.briefingSummaryTitle}
                  </p>
                  <p className="mt-3 text-base leading-relaxed text-on-surface">
                    {getLocalizedText(pack.scope.summary, websiteLanguage)}
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      clearBattleReport(sessionId);
                      setResults([]);
                      setLastReaction(null);
                      setViewState("live");
                      primeQuestion(0);
                    }}
                    className="rounded-full bg-primary px-6 py-3 text-sm font-black text-white shadow-[0_14px_28px_rgba(149,63,77,0.22)] transition hover:-translate-y-0.5 hover:bg-primary/92"
                  >
                    {startLabel}
                  </button>
                </div>
              </div>

              <section className="rounded-[2.4rem] border border-white/80 bg-white/90 p-6 shadow-[0_16px_30px_rgba(48,46,43,0.05)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[1rem] bg-secondary-container text-secondary">
                    {isExamMode ? <ScrollText size={18} /> : <BadgeInfo size={18} />}
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
                      {isExamMode
                        ? dictionary.scenarios.examCurrentScoreLabel
                        : dictionary.scenarios.battleCurrentPackLabel}
                    </p>
                    <p className="text-lg font-black tracking-tight text-on-surface">
                      {isExamMode
                        ? websiteLanguage === "zh-CN"
                          ? "单人 checkpoint"
                          : "Solo checkpoint"
                        : `${questions.length} ${scoreLabels.questionsReady}`}
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3 rounded-[1.7rem] border border-dashed border-surface-container-high bg-surface-container-low px-4 py-4">
                  <div className="flex items-center gap-2 font-bold text-on-surface">
                    {isExamMode ? <Clock3 size={16} /> : <Sparkles size={16} />}
                    {isExamMode
                      ? dictionary.scenarios.examProgressLabel
                      : dictionary.scenarios.battleReactionLabel}
                  </div>
                  <p className="text-sm leading-relaxed text-on-surface-variant">
                    {isExamMode
                      ? dictionary.scenarios.examStructuredNote
                      : pack.aiReactions.start[0]}
                  </p>
                </div>
              </section>
            </section>
          ) : null}

          {battleStarted && currentQuestion ? (
            <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.2fr)_22rem]">
              <BattleQuestionCard
                question={currentQuestion}
                websiteLanguage={websiteLanguage}
                questionNumber={currentIndex + 1}
                totalQuestions={questions.length}
                timeLeft={timeLeft}
                maxTime={currentMaxTime}
                textAnswer={textAnswer}
                selectedOption={selectedOption}
                onTextAnswerChange={setTextAnswer}
                onSelectOption={setSelectedOption}
                onSubmit={() => handleSubmit(false)}
                canSubmit={canSubmit}
              />

              <section className="space-y-4 rounded-[2.4rem] border border-white/80 bg-white/90 p-6 shadow-[0_16px_30px_rgba(48,46,43,0.05)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[1rem] bg-secondary-container text-secondary">
                    <Clock3 size={18} />
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
                      {sidePrimaryLabel}
                    </p>
                    <p className="text-lg font-black tracking-tight text-on-surface">
                      {isExamMode
                        ? `${profile.displayName} ${totals.user.total}`
                        : `${profile.displayName} ${totals.user.total} · ${opponentLabel} ${totals.ai.total}`}
                    </p>
                  </div>
                </div>

                <div className={`grid gap-3 ${isExamMode ? "grid-cols-1" : "grid-cols-2"}`}>
                  {[
                    {
                      label: dictionary.results.stats.score,
                      user: totals.user.total,
                      ai: totals.ai.total,
                    },
                    {
                      label: scoreLabels.speed,
                      user: totals.user.speed,
                      ai: totals.ai.speed,
                    },
                    {
                      label: scoreLabels.accuracy,
                      user: totals.user.accuracy,
                      ai: totals.ai.accuracy,
                    },
                    {
                      label: scoreLabels.quality,
                      user: totals.user.quality,
                      ai: totals.ai.quality,
                    },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="rounded-[1.3rem] border border-surface-container-high bg-surface-container-low px-3 py-3"
                    >
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
                        {row.label}
                      </p>
                      <p className="mt-1 text-lg font-black tracking-tight text-on-surface">
                        {isExamMode ? row.user : `${row.user} / ${row.ai}`}
                      </p>
                    </div>
                  ))}
                </div>

                {!isExamMode ? (
                  <div className="space-y-3 rounded-[1.7rem] border border-dashed border-surface-container-high bg-surface-container-low px-4 py-4">
                    <div className="flex items-center gap-2 font-bold text-on-surface">
                      <Sparkles size={16} />
                      {dictionary.scenarios.battleReactionLabel}
                    </div>
                    <p className="text-sm leading-relaxed text-on-surface-variant">
                      {lastReaction ??
                        pack.aiReactions.during[0] ??
                        dictionary.scenarios.battleStartHint}
                    </p>
                  </div>
                ) : null}

                <div className="rounded-[1.7rem] border border-white/80 bg-surface-container-low px-4 py-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
                    {dictionary.scenarios.battleCurrentPackLabel}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                    {getLocalizedText(pack.scope.summary, websiteLanguage)}
                  </p>
                </div>
              </section>
            </section>
          ) : null}

          {viewState === "completed" ? (
            <section className="rounded-[2.7rem] border border-white/80 bg-surface-container-low p-7 shadow-[0_24px_60px_rgba(149,63,77,0.08)]">
              <p className="text-lg font-black text-on-surface">
                {dictionary.common.loading}
              </p>
            </section>
          ) : null}
        </main>
      </div>
    </div>
  );
}
