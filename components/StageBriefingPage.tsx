"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  ArrowLeft,
  ChevronRight,
  Clock3,
  Layers3,
  ScrollText,
  Sparkles,
  Swords,
} from "lucide-react";
import { useRouter } from "next/navigation";
import AppSidebar from "@/components/AppSidebar";
import { getDictionary, resolveClientWebsiteLanguage } from "@/lib/i18n";
import { useBattlePack } from "@/lib/use-battle-pack";
import {
  getScenarioBySlug,
  getStageDefinition,
  isScenarioStageAvailable,
  SCENARIO_TEMPLATE_LABELS,
} from "@/lib/scenario-map";
import { getLocalizedText, type LocalizedText, type StageNumber } from "@/lib/scenario-types";
import {
  type EditableProfile,
  getEditableProfileFromUser,
  resolveDisplayName,
} from "@/lib/profile";
import { supabase } from "@/lib/supabase";

interface PublicUserRow {
  display_name: string | null;
}

interface StageBriefingPageProps {
  slug: string;
  stage: StageNumber;
}

const FOLLOW_UP_LABELS: Record<
  string,
  LocalizedText
> = {
  size: { en: "Size", "zh-CN": "杯型" },
  temperature: { en: "Temperature", "zh-CN": "冷热" },
  for_here_or_to_go: { en: "For here / to go", "zh-CN": "堂食 / 外带" },
  milk_choice: { en: "Milk choice", "zh-CN": "奶类选择" },
  availability: { en: "Availability", "zh-CN": "有没有这个选项" },
  customization: { en: "Customization", "zh-CN": "个性化修改" },
};

function getFollowUpLabel(value: string, websiteLanguage: "en" | "zh-CN") {
  const mapped = FOLLOW_UP_LABELS[value];
  if (mapped) {
    return mapped[websiteLanguage];
  }

  return value.replaceAll("_", " ");
}

export default function StageBriefingPage({
  slug,
  stage,
}: StageBriefingPageProps) {
  const router = useRouter();
  const [battleSessionId] = useState(
    () => `mock-${slug}-stage-${stage}-${Date.now().toString(36)}`
  );
  const scenario = getScenarioBySlug(slug);
  const stageDefinition = getStageDefinition(stage);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<EditableProfile | null>(null);
  const [fallbackWebsiteLanguage] = useState(resolveClientWebsiteLanguage());
  const [loading, setLoading] = useState(true);
  const websiteLanguage = profile?.websiteLanguage ?? fallbackWebsiteLanguage;
  const dictionary = getDictionary(websiteLanguage);

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

  const stageAvailable = Boolean(
    scenario &&
      scenario.launchStatus !== "coming_soon" &&
      isScenarioStageAvailable(scenario, stage)
  );
  const { pack, status: packStatus } = useBattlePack({
    scenarioSlug: scenario?.slug ?? null,
    stage,
    profile,
    enabled: stageAvailable,
  });

  if (!scenario || !stageDefinition) {
    return null;
  }

  if (loading || !authUser || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="font-medium text-on-surface-variant">
          {dictionary.common.loading}
        </div>
      </div>
    );
  }

  const templateLabel = getLocalizedText(
    SCENARIO_TEMPLATE_LABELS[scenario.template],
    websiteLanguage
  );
  const stageName = dictionary.scenarios.stageNames[stageDefinition.name];
  const targetLanguageLabel = dictionary.learningLanguageLabels[profile.preferredLanguage];
  const levelLabel = dictionary.languageLevelLabels[profile.defaultLanguageLevel];
  const totalQuestionLabel =
    websiteLanguage === "zh-CN"
      ? `共 ${pack?.rules.battleQuestionCount ?? 0} 题`
      : `${pack?.rules.battleQuestionCount ?? 0} total questions`;

  if (!stageAvailable) {
    return (
      <div className="min-h-screen bg-surface">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8 lg:py-8">
          <AppSidebar active="scenarios" profile={profile} />

          <main
            className="space-y-6 pb-12"
            data-testid="stage-briefing-shell"
          >
            <section className="rounded-[3rem] border border-white/80 bg-gradient-to-br from-surface-container-lowest via-white to-surface-container-low p-8 shadow-[0_24px_60px_rgba(149,63,77,0.08)] md:p-10">
              <Link
                href={`/scenario/${scenario.slug}`}
                className="inline-flex items-center gap-2 text-sm font-bold text-on-surface-variant transition-colors hover:text-primary"
              >
                <ArrowLeft size={18} />
                {dictionary.scenarios.backToScenario}
              </Link>

              <div className="mt-6 max-w-2xl space-y-4">
                <p className="text-[11px] font-black uppercase tracking-[0.26em] text-on-surface-variant">
                  {dictionary.scenarios.briefingEyebrow}
                </p>
                <h1 className="text-4xl font-black tracking-[-0.06em] text-on-surface md:text-5xl">
                  {dictionary.scenarios.unavailableStageTitle}
                </h1>
                <p className="text-base leading-relaxed text-on-surface-variant md:text-lg">
                  {dictionary.scenarios.unavailableStageDescription}
                </p>
              </div>
            </section>
          </main>
        </div>
      </div>
    );
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

  if (packStatus === "error" || !pack) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface px-6">
        <div className="max-w-md text-center font-medium text-on-surface-variant">
          {dictionary.scenarios.battleGenerateError}
        </div>
      </div>
    );
  }

  const clashHref = `/battle/${battleSessionId}?scenario=${scenario.slug}&stage=${stage}&opponent=ai&mode=clash`;
  const examHref = `/scenario/${scenario.slug}/stage/${stage}/exam`;

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8 lg:py-8">
        <AppSidebar active="scenarios" profile={profile} />

        <main className="space-y-6 pb-12" data-testid="stage-briefing-shell">
          <section className="rounded-[3rem] border border-white/80 bg-gradient-to-br from-surface-container-lowest via-white to-surface-container-low p-8 shadow-[0_24px_60px_rgba(149,63,77,0.08)] md:p-10">
            <Link
              href={`/scenario/${scenario.slug}`}
              className="inline-flex items-center gap-2 text-sm font-bold text-on-surface-variant transition-colors hover:text-primary"
            >
              <ArrowLeft size={18} />
              {dictionary.scenarios.backToScenario}
            </Link>

            <div className="mt-6 space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary-container px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-primary">
              {dictionary.scenarios.stageLabel(stage)}
                </span>
                <span className="rounded-full bg-surface-container px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
                  {stageName}
                </span>
                <span className="rounded-full bg-secondary-container/65 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-secondary">
                  {templateLabel}
                </span>
              </div>

              <div className="space-y-3">
                <p className="text-[11px] font-black uppercase tracking-[0.26em] text-on-surface-variant">
                  {dictionary.scenarios.briefingEyebrow}
                </p>
                <h1 className="text-4xl font-black tracking-[-0.06em] text-on-surface md:text-5xl">
                  {getLocalizedText(scenario.name, websiteLanguage)} ·{" "}
                  {stageName}
                </h1>
                <p className="max-w-3xl text-base leading-relaxed text-on-surface-variant md:text-lg">
                  {dictionary.scenarios.briefingDescription}
                </p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="rounded-[1.9rem] border border-white/80 bg-white/88 px-5 py-5 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
                  {dictionary.scenarios.briefingTargetLanguageLabel}
                </p>
                <p className="mt-3 text-2xl font-black tracking-tight text-on-surface">
                  {targetLanguageLabel}
                </p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {dictionary.scenarios.briefingTargetLanguageLabel}
                </p>
              </div>

              <div className="rounded-[1.9rem] border border-white/80 bg-white/88 px-5 py-5 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
                  {dictionary.scenarios.briefingLevelLabel}
                </p>
                <p className="mt-3 text-2xl font-black tracking-tight text-on-surface">
                  {levelLabel}
                </p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {dictionary.settings.defaultLanguageLevel}
                </p>
              </div>

              <div className="rounded-[1.9rem] border border-white/80 bg-white/88 px-5 py-5 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
                  {dictionary.scenarios.briefingQuestionMixLabel}
                </p>
                <p className="mt-3 text-base font-black tracking-tight text-on-surface">
                  {dictionary.scenarios.briefingQuestionMixValue(
                    pack.rules.quickQuestionCount,
                    pack.rules.freeResponseCount
                  )}
                </p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {totalQuestionLabel}
                </p>
              </div>

              <div className="rounded-[1.9rem] border border-white/80 bg-white/88 px-5 py-5 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
                  {dictionary.scenarios.briefingTimerLabel}
                </p>
                <p className="mt-3 text-base font-black tracking-tight text-on-surface">
                  {dictionary.scenarios.briefingTimerValue(
                    pack.rules.timers.multipleChoiceSec,
                    pack.rules.timers.fillBlankSec,
                    pack.rules.timers.freeResponseSec
                  )}
                </p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {dictionary.scenarios.briefingBattleRulesTitle}
                </p>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.35fr)_24rem]">
            <div className="space-y-6">
              <section className="rounded-[2.7rem] border border-white/80 bg-surface-container-low p-7 shadow-[0_24px_60px_rgba(149,63,77,0.08)]">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
                  {dictionary.scenarios.briefingSummaryTitle}
                </p>
                <p className="mt-4 max-w-3xl text-lg leading-relaxed text-on-surface">
                  {getLocalizedText(pack.scope.summary, websiteLanguage)}
                </p>
              </section>

              <section className="rounded-[2.7rem] border border-white/80 bg-surface-container-low p-7 shadow-[0_24px_60px_rgba(149,63,77,0.08)]">
                <h2 className="text-2xl font-black tracking-[-0.04em] text-on-surface">
                  {dictionary.scenarios.briefingCanDoTitle}
                </h2>
                <div className="mt-5 space-y-3">
                  {pack.scope.canDo.map((goal) => (
                    <div key={goal.en} className="flex items-start gap-3">
                      <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                      <p className="text-base leading-relaxed text-on-surface">
                        {getLocalizedText(goal, websiteLanguage)}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <section className="rounded-[2.4rem] border border-white/80 bg-white/90 p-6 shadow-[0_16px_30px_rgba(48,46,43,0.05)]">
                  <h2 className="text-xl font-black tracking-[-0.04em] text-on-surface">
                    {dictionary.scenarios.briefingVocabularyTitle}
                  </h2>
                  <div className="mt-5 space-y-4">
                    {pack.scope.vocabularyGroups.map((group) => (
                      <div key={group.id} className="space-y-2">
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-on-surface-variant">
                          {getLocalizedText(group.label, websiteLanguage)}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {group.words.map((word) => (
                            <span
                              key={`${group.id}-${word}`}
                              className="rounded-full bg-primary-container px-3 py-1.5 text-sm font-bold text-primary"
                            >
                              {word}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-[2.4rem] border border-white/80 bg-white/90 p-6 shadow-[0_16px_30px_rgba(48,46,43,0.05)]">
                  <h2 className="text-xl font-black tracking-[-0.04em] text-on-surface">
                    {dictionary.scenarios.briefingPatternsTitle}
                  </h2>
                  <div className="mt-5 space-y-3">
                    {pack.scope.sentencePatterns.map((pattern) => (
                      <div
                        key={pattern}
                        className="rounded-[1.4rem] border border-primary/10 bg-surface px-4 py-3 text-sm leading-relaxed text-on-surface"
                      >
                        {pattern}
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>

            <div className="space-y-6">
              <section className="rounded-[2.4rem] border border-white/80 bg-white/90 p-6 shadow-[0_16px_30px_rgba(48,46,43,0.05)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-secondary-container text-secondary">
                    <Layers3 size={20} />
                  </div>
                  <h2 className="text-xl font-black tracking-[-0.04em] text-on-surface">
                    {dictionary.scenarios.briefingFollowUpsTitle}
                  </h2>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {pack.scope.followUpTypes.map((item) => (
                    <span
                      key={item}
                      className="rounded-full bg-surface-container px-3 py-1.5 text-sm font-bold text-on-surface"
                    >
                      {getFollowUpLabel(item, websiteLanguage)}
                    </span>
                  ))}
                </div>
              </section>

              <section className="rounded-[2.4rem] border border-white/80 bg-white/90 p-6 shadow-[0_16px_30px_rgba(48,46,43,0.05)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-tertiary-container text-on-tertiary-container">
                    <Clock3 size={20} />
                  </div>
                  <h2 className="text-xl font-black tracking-[-0.04em] text-on-surface">
                    {dictionary.scenarios.briefingHowBattleWorksTitle}
                  </h2>
                </div>
                <div className="mt-5 space-y-3">
                  {pack.scope.howBattleWorks.map((rule) => (
                    <div key={rule.en} className="flex items-start gap-3">
                      <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-secondary" />
                      <p className="text-sm leading-relaxed text-on-surface">
                        {getLocalizedText(rule, websiteLanguage)}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[2.4rem] border border-primary/10 bg-primary-container/25 p-6 shadow-[0_16px_30px_rgba(48,46,43,0.05)]">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
                  {dictionary.scenarios.briefingChooseModeTitle}
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-on-surface">
                  {dictionary.scenarios.briefingChooseModeTitle}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
                  {dictionary.scenarios.briefingChooseModeDescription}
                </p>

                <div className="mt-6 flex flex-col gap-3">
                  <Link
                    href={clashHref}
                    className="inline-flex items-center justify-between rounded-full bg-primary px-5 py-3 text-sm font-black text-on-primary transition-transform duration-200 hover:-translate-y-0.5"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Swords size={16} />
                      {dictionary.scenarios.startClashMode}
                    </span>
                    <ChevronRight size={18} />
                  </Link>

                  <Link
                    href={examHref}
                    className="inline-flex items-center justify-between rounded-full border border-on-surface/10 bg-white/88 px-5 py-3 text-sm font-black text-on-surface transition-transform duration-200 hover:-translate-y-0.5"
                  >
                    <span className="inline-flex items-center gap-2">
                      <ScrollText size={16} />
                      {dictionary.scenarios.openExamMode}
                    </span>
                    <ChevronRight size={18} />
                  </Link>

                  <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-xs font-bold text-on-surface-variant">
                    <Sparkles size={14} />
                    {dictionary.scenarios.practiceLater}
                  </div>
                </div>
              </section>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
