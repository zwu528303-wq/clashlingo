"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { ArrowLeft, CheckCircle2, Flag, Gauge, RotateCcw, Trophy } from "lucide-react";
import { STAGE_CLEAR_ACCURACY } from "@/lib/battle-scoring";
import { useRouter, useSearchParams } from "next/navigation";
import AppSidebar from "@/components/AppSidebar";
import { getDictionary } from "@/lib/i18n";
import { useClientWebsiteLanguage } from "@/lib/i18n/use-client-website-language";
import { loadBattleReport, type StoredBattleReport } from "@/lib/battle-session";
import { getLocalizedText } from "@/lib/scenario-types";
import {
  type EditableProfile,
  getEditableProfileFromUser,
  resolveDisplayName,
} from "@/lib/profile";
import { supabase } from "@/lib/supabase";

interface PublicUserRow {
  display_name: string | null;
}

interface BattleReportPageProps {
  sessionId: string;
}

function formatSkillTag(tag: string | null, websiteLanguage: "en" | "zh-CN") {
  if (!tag) {
    return null;
  }

  const base = tag.replaceAll("_", " ");
  if (websiteLanguage === "zh-CN") {
    return `需要再练：${base}`;
  }

  return base;
}

export default function BattleReportPage({ sessionId }: BattleReportPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<EditableProfile | null>(null);
  const [report, setReport] = useState<StoredBattleReport | null>(null);
  const fallbackWebsiteLanguage = useClientWebsiteLanguage();
  const [loading, setLoading] = useState(true);
  const websiteLanguage = profile?.websiteLanguage ?? fallbackWebsiteLanguage;
  const dictionary = getDictionary(websiteLanguage);
  const requestedMode = searchParams.get("mode") === "exam" ? "exam" : "clash";
  const scenarioSlug = searchParams.get("scenario") ?? report?.scenarioSlug ?? "";
  const stage = searchParams.get("stage") ?? `${report?.stage ?? 1}`;
  const scoreLabels =
    websiteLanguage === "zh-CN"
      ? {
          speed: "速度",
          accuracy: "准确",
          quality: "表达",
        }
      : {
          speed: "Speed",
          accuracy: "Accuracy",
          quality: "Quality",
        };
  type BreakdownRow = {
    label: string;
    user: number;
  };

  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user ?? null;

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
      setReport(loadBattleReport(sessionId));
      setLoading(false);
    };

    void init();
  }, [router, sessionId]);

  const backToBriefingHref = useMemo(() => {
    if (!scenarioSlug) {
      return "/scenarios";
    }

    return `/scenario/${scenarioSlug}/stage/${stage}`;
  }, [scenarioSlug, stage]);

  if (loading || !authUser || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="font-medium text-on-surface-variant">
          {dictionary.common.loading}
        </div>
      </div>
    );
  }

  if (!report) {
    const missingTitle =
      requestedMode === "exam"
        ? dictionary.scenarios.examReportMissingTitle
        : dictionary.scenarios.battleReportMissingTitle;
    const missingDescription =
      requestedMode === "exam"
        ? dictionary.scenarios.examReportMissingDescription
        : dictionary.scenarios.battleReportMissingDescription;

    return (
      <div className="min-h-screen bg-surface">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8 lg:py-8">
          <AppSidebar active="scenarios" profile={profile} />

          <main className="space-y-6 pb-12">
            <section className="rounded-[3rem] border border-white/80 bg-gradient-to-br from-surface-container-lowest via-white to-surface-container-low p-8 shadow-[0_24px_60px_rgba(149,63,77,0.08)] md:p-10">
              <h1 className="text-4xl font-black tracking-[-0.06em] text-on-surface md:text-5xl">
                {missingTitle}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-on-surface-variant md:text-lg">
                {missingDescription}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={backToBriefingHref}
                  className="rounded-full bg-primary px-5 py-3 text-sm font-black text-white shadow-[0_14px_28px_rgba(149,63,77,0.22)] transition hover:-translate-y-0.5 hover:bg-primary/92"
                >
                  {dictionary.scenarios.battleBackToBriefing}
                </Link>
                <Link
                  href="/scenarios"
                  className="rounded-full border border-surface-container-high bg-white px-5 py-3 text-sm font-black text-on-surface transition hover:border-primary/35 hover:text-primary"
                >
                  {dictionary.scenarios.battleBackToScenarios}
                </Link>
              </div>
            </section>
          </main>
        </div>
      </div>
    );
  }

  const isExamMode = report.mode === "exam";
  const heroTitle = isExamMode
    ? dictionary.scenarios.examReportTitle
    : dictionary.scenarios.battleReportTitle;
  const heroEyebrow = isExamMode
    ? dictionary.scenarios.examReportEyebrow
    : dictionary.scenarios.battleReportEyebrow;
  const heroDescription = isExamMode
    ? dictionary.scenarios.examReportDescription
    : dictionary.scenarios.battleReportDescription;
  const weakPoint = formatSkillTag(report.weakSkill, websiteLanguage);
  const latestReaction = report.results[report.results.length - 1]?.reaction ?? null;
  const clearPercent = Math.round(STAGE_CLEAR_ACCURACY * 100);
  const accuracyPercent = Math.round(report.outcome.accuracyRatio * 100);
  const cleared = report.outcome.cleared;
  const heroCards = [
    {
      label: report.playerName,
      value: report.userTotals.total,
      className:
        "rounded-[1.9rem] border border-white/80 bg-primary-container/70 px-5 py-5 shadow-sm",
      accent: "text-primary",
    },
    {
      label: websiteLanguage === "zh-CN" ? "已完成题目" : "Questions Finished",
      value: report.results.length,
      className:
        "rounded-[1.9rem] border border-white/80 bg-white/88 px-5 py-5 shadow-sm",
      accent: "text-on-surface-variant",
    },
  ];
  const breakdownRows: BreakdownRow[] = [
    { label: dictionary.results.stats.score, user: report.userTotals.total },
    { label: scoreLabels.speed, user: report.userTotals.speed },
    { label: scoreLabels.accuracy, user: report.userTotals.accuracy },
    { label: scoreLabels.quality, user: report.userTotals.quality },
  ];

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8 lg:py-8">
        <AppSidebar active="scenarios" profile={profile} />

        <main className="space-y-6 pb-12">
          <section className="rounded-[3rem] border border-white/80 bg-gradient-to-br from-surface-container-lowest via-white to-surface-container-low p-8 shadow-[0_24px_60px_rgba(149,63,77,0.08)] md:p-10">
            <Link
              href={backToBriefingHref}
              className="inline-flex items-center gap-2 text-sm font-bold text-on-surface-variant transition-colors hover:text-primary"
            >
              <ArrowLeft size={18} />
              {dictionary.scenarios.battleBackToBriefing}
            </Link>

            <div className="mt-6 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary-container px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-primary">
                  {heroEyebrow}
                </span>
                <span className="rounded-full bg-surface-container px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
                  {dictionary.scenarios.stageLabel(report.stage)}
                </span>
              </div>

              <h1 className="text-4xl font-black tracking-[-0.06em] text-on-surface md:text-5xl">
                {heroTitle}
              </h1>
              <p className="max-w-3xl text-base leading-relaxed text-on-surface-variant md:text-lg">
                {heroDescription}
              </p>
            </div>

            <div
              className={`mt-8 flex flex-col gap-3 rounded-[1.9rem] border px-5 py-5 sm:flex-row sm:items-center sm:justify-between ${
                cleared
                  ? "border-secondary/30 bg-secondary-container/60"
                  : "border-amber-200 bg-amber-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-[1rem] ${
                    cleared
                      ? "bg-secondary/15 text-secondary"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {cleared ? <CheckCircle2 size={22} /> : <RotateCcw size={22} />}
                </div>
                <div>
                  <p
                    className={`text-lg font-black tracking-[-0.03em] ${
                      cleared ? "text-secondary" : "text-amber-900"
                    }`}
                  >
                    {cleared
                      ? dictionary.scenarios.battleOutcomeClearedTitle
                      : dictionary.scenarios.battleOutcomeFailedTitle}
                  </p>
                  <p
                    className={`mt-0.5 text-sm font-medium ${
                      cleared ? "text-secondary/80" : "text-amber-800"
                    }`}
                  >
                    {cleared
                      ? dictionary.scenarios.battleOutcomeClearedHint(clearPercent)
                      : dictionary.scenarios.battleOutcomeFailedHint(clearPercent)}
                  </p>
                </div>
              </div>
              <p
                className={`shrink-0 text-sm font-black ${
                  cleared ? "text-secondary" : "text-amber-900"
                }`}
              >
                {dictionary.scenarios.battleOutcomeAccuracy(
                  report.outcome.correctCount,
                  report.outcome.questionCount,
                  accuracyPercent
                )}
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              {heroCards.map((card) => (
                <div key={card.label} className={card.className}>
                  <p className={`text-[11px] font-black uppercase tracking-[0.22em] ${card.accent}`}>
                    {card.label}
                  </p>
                  <p className="mt-3 text-4xl font-black tracking-[-0.06em] text-on-surface">
                    {card.value}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.2fr)_22rem]">
            <div className="rounded-[2.7rem] border border-white/80 bg-surface-container-low p-7 shadow-[0_24px_60px_rgba(149,63,77,0.08)]">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-primary-container text-primary">
                  <Gauge size={20} />
                </div>
                <h2 className="text-2xl font-black tracking-[-0.04em] text-on-surface">
                  {dictionary.scenarios.battleScoreBreakdownTitle}
                </h2>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                {breakdownRows.map((row) => (
                  <div
                    key={row.label}
                    className="rounded-[1.7rem] border border-white/80 bg-white/90 p-4"
                  >
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
                      {row.label}
                    </p>
                    <div className="mt-3">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                        {report.playerName}
                      </p>
                      <p className="mt-1 text-2xl font-black tracking-[-0.04em] text-on-surface">
                        {row.user}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-[1.7rem] border border-white/80 bg-white/90 p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
                    {dictionary.scenarios.battleFastestAnswerTitle}
                  </p>
                  <p className="mt-3 text-lg font-black tracking-[-0.03em] text-on-surface">
                    {report.fastestAnswer ?? dictionary.scenarios.battleNoAnswer}
                  </p>
                </div>
                <div className="rounded-[1.7rem] border border-white/80 bg-white/90 p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
                    {dictionary.scenarios.battleBestSentenceTitle}
                  </p>
                  <p className="mt-3 text-lg font-black tracking-[-0.03em] text-on-surface">
                    {report.bestSentence ?? dictionary.scenarios.battleNoAnswer}
                  </p>
                </div>
                <div className="rounded-[1.7rem] border border-white/80 bg-white/90 p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
                    {dictionary.scenarios.battleWeakPointTitle}
                  </p>
                  <p className="mt-3 text-lg font-black tracking-[-0.03em] text-on-surface">
                    {weakPoint ?? dictionary.scenarios.battleNoAnswer}
                  </p>
                  {report.suggestedPractice ? (
                    <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                      {getLocalizedText(report.suggestedPractice, websiteLanguage)}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <section className="space-y-4 rounded-[2.4rem] border border-white/80 bg-white/90 p-6 shadow-[0_16px_30px_rgba(48,46,43,0.05)]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[1rem] bg-secondary-container text-secondary">
                  <Trophy size={18} />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
                    {dictionary.scenarios.battleCurrentPackLabel}
                  </p>
                  <p className="text-lg font-black tracking-tight text-on-surface">
                    {getLocalizedText(report.scenarioName, websiteLanguage)} · {dictionary.scenarios.stageLabel(report.stage)}
                  </p>
                </div>
              </div>

              {!isExamMode ? (
                <div className="space-y-3 rounded-[1.7rem] border border-dashed border-surface-container-high bg-surface-container-low px-4 py-4">
                  <div className="flex items-center gap-2 font-bold text-on-surface">
                    <Flag size={16} />
                    {dictionary.scenarios.battleReactionLabel}
                  </div>
                  <p className="text-sm leading-relaxed text-on-surface-variant">
                    {latestReaction}
                  </p>
                </div>
              ) : null}

              <div className="flex flex-col gap-3">
                <Link
                  href={backToBriefingHref}
                  className="rounded-full bg-primary px-5 py-3 text-center text-sm font-black text-white shadow-[0_14px_28px_rgba(149,63,77,0.22)] transition hover:-translate-y-0.5 hover:bg-primary/92"
                >
                  {isExamMode
                    ? dictionary.scenarios.examRetry
                    : dictionary.scenarios.battleRematch}
                </Link>
                <Link
                  href="/scenarios"
                  className="rounded-full border border-surface-container-high bg-white px-5 py-3 text-center text-sm font-black text-on-surface transition hover:border-primary/35 hover:text-primary"
                >
                  {dictionary.scenarios.battleBackToScenarios}
                </Link>
              </div>
            </section>
          </section>

          <section className="rounded-[2.7rem] border border-white/80 bg-surface-container-low p-7 shadow-[0_24px_60px_rgba(149,63,77,0.08)]">
            <h2 className="text-2xl font-black tracking-[-0.04em] text-on-surface">
              {dictionary.scenarios.battleQuestionReviewTitle}
            </h2>

            {report.results.length === 0 ? (
              <p className="mt-4 text-on-surface-variant">
                {dictionary.scenarios.battleQuestionReviewEmpty}
              </p>
            ) : (
              <div className="mt-5 space-y-4">
                {report.results.map((result, index) => (
                  <article
                    key={result.questionId}
                    className="rounded-[1.9rem] border border-white/80 bg-white/90 p-5"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-surface-container px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
                            {dictionary.scenarios.battleQuestionCounter(
                              index + 1,
                              report.results.length
                            )}
                          </span>
                          <span className="rounded-full bg-primary-container px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-primary">
                            {dictionary.scenarios.battleQuestionTypes[result.questionType]}
                          </span>
                        </div>
                        <p className="text-lg font-black tracking-[-0.03em] text-on-surface">
                          {getLocalizedText(result.prompt, websiteLanguage)}
                        </p>
                        <p className="text-sm leading-relaxed text-on-surface-variant">
                          <span className="font-bold text-on-surface">
                            {dictionary.scenarios.battleYourAnswerLabel}:
                          </span>{" "}
                          {result.userAnswer || dictionary.scenarios.battleNoAnswer}
                        </p>
                        <p className="rounded-[1rem] bg-secondary-container/45 px-3 py-2 text-sm leading-relaxed text-on-surface">
                          <span className="font-bold text-secondary">
                            {dictionary.scenarios.battleStandardAnswerLabel}:
                          </span>{" "}
                          {result.correctAnswer
                            ? getLocalizedText(result.correctAnswer, websiteLanguage)
                            : dictionary.scenarios.battleNoAnswer}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 md:min-w-[16rem]">
                        {[
                          { label: scoreLabels.speed, value: result.userScore.speed },
                          { label: scoreLabels.accuracy, value: result.userScore.accuracy },
                          { label: scoreLabels.quality, value: result.userScore.quality },
                          { label: dictionary.results.stats.score, value: result.userScore.total },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className="rounded-[1.3rem] border border-surface-container-high bg-surface-container-low px-3 py-3 text-center"
                          >
                            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
                              {item.label}
                            </p>
                            <p className="mt-1 text-xl font-black tracking-tight text-on-surface">
                              {item.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
