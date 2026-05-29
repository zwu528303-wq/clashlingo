"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { ArrowLeft, Clock3, Gauge, ScrollText } from "lucide-react";
import { useRouter } from "next/navigation";
import AppSidebar from "@/components/AppSidebar";
import { getDictionary, resolveClientWebsiteLanguage } from "@/lib/i18n";
import { useBattlePack } from "@/lib/use-battle-pack";
import { getScenarioBySlug } from "@/lib/scenario-map";
import { getLocalizedText, type StageNumber } from "@/lib/scenario-types";
import {
  type EditableProfile,
  getEditableProfileFromUser,
  resolveDisplayName,
} from "@/lib/profile";
import { supabase } from "@/lib/supabase";

interface PublicUserRow {
  display_name: string | null;
}

interface ScenarioExamLandingPageProps {
  slug: string;
  stage: StageNumber;
}

export default function ScenarioExamLandingPage({
  slug,
  stage,
}: ScenarioExamLandingPageProps) {
  const router = useRouter();
  const [examSessionId] = useState(
    () => `mock-exam-${slug}-stage-${stage}-${Date.now().toString(36)}`
  );
  const scenario = getScenarioBySlug(slug);
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

  const { pack, status: packStatus } = useBattlePack({
    scenarioSlug: scenario?.slug ?? null,
    stage,
    profile,
  });

  if (loading || !authUser || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="font-medium text-on-surface-variant">
          {dictionary.common.loading}
        </div>
      </div>
    );
  }

  if (!scenario) {
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

  if (packStatus === "error" || !pack) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface px-6">
        <div className="max-w-md text-center font-medium text-on-surface-variant">
          {dictionary.scenarios.battleGenerateError}
        </div>
      </div>
    );
  }

  const backHref = `/scenario/${scenario.slug}/stage/${stage}`;
  const startExamHref = `/battle/${examSessionId}?scenario=${scenario.slug}&stage=${stage}&mode=exam&opponent=solo`;

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8 lg:py-8">
        <AppSidebar active="scenarios" profile={profile} />

        <main className="space-y-6 pb-12" data-testid="scenario-exam-shell">
          <section className="rounded-[3rem] border border-white/80 bg-gradient-to-br from-surface-container-lowest via-white to-surface-container-low p-8 shadow-[0_24px_60px_rgba(149,63,77,0.08)] md:p-10">
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 text-sm font-bold text-on-surface-variant transition-colors hover:text-primary"
            >
              <ArrowLeft size={18} />
              {dictionary.scenarios.backToScenario}
            </Link>

            <div className="mt-6 max-w-3xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] bg-secondary-container text-secondary">
                  <ScrollText size={22} />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.26em] text-on-surface-variant">
                    {dictionary.scenarios.examLaneEyebrow}
                  </p>
                  <h1 className="text-4xl font-black tracking-[-0.06em] text-on-surface md:text-5xl">
                    {dictionary.scenarios.examLaneTitle}
                  </h1>
                </div>
              </div>

              <p className="text-base leading-relaxed text-on-surface-variant md:text-lg">
                {dictionary.scenarios.examLaneDescription}
              </p>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-[1.8rem] border border-white/80 bg-white/88 px-5 py-5 shadow-sm">
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
                    {websiteLanguage === "zh-CN"
                      ? `共 ${pack.rules.battleQuestionCount} 题`
                      : `${pack.rules.battleQuestionCount} total questions`}
                  </p>
                </div>

                <div className="rounded-[1.8rem] border border-white/80 bg-white/88 px-5 py-5 shadow-sm">
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
                  <p className="mt-1 text-sm text-on-surface-variant">
                    {dictionary.scenarios.examStructuredNote}
                  </p>
                </div>
              </div>

              <div className="rounded-[1.8rem] border border-dashed border-surface-container-high bg-white/72 px-5 py-4 text-sm leading-relaxed text-on-surface-variant">
                {dictionary.scenarios.examStartHint}
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href={startExamHref}
                  className="rounded-full bg-primary px-5 py-3 text-sm font-black text-white shadow-[0_14px_28px_rgba(149,63,77,0.22)] transition hover:-translate-y-0.5 hover:bg-primary/92"
                >
                  {dictionary.scenarios.startExamMode}
                </Link>
                <Link
                  href={backHref}
                  className="rounded-full border border-surface-container-high bg-white px-5 py-3 text-sm font-black text-on-surface transition hover:border-primary/35 hover:text-primary"
                >
                  {dictionary.scenarios.battleBackToBriefing}
                </Link>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.1fr)_18rem]">
            <section className="rounded-[2.7rem] border border-white/80 bg-surface-container-low p-7 shadow-[0_24px_60px_rgba(149,63,77,0.08)]">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
                {dictionary.scenarios.briefingSummaryTitle}
              </p>
              <p className="mt-4 text-lg leading-relaxed text-on-surface">
                {getLocalizedText(pack.scope.summary, websiteLanguage)}
              </p>
            </section>

            <section className="space-y-4 rounded-[2.4rem] border border-white/80 bg-white/90 p-6 shadow-[0_16px_30px_rgba(48,46,43,0.05)]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[1rem] bg-secondary-container text-secondary">
                  <Gauge size={18} />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
                    {dictionary.scenarios.examCurrentScoreLabel}
                  </p>
                  <p className="text-lg font-black tracking-tight text-on-surface">
                    {websiteLanguage === "zh-CN" ? "单人评分" : "Solo grading"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-[1rem] bg-tertiary-container text-on-tertiary-container">
                  <Clock3 size={18} />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
                    {dictionary.scenarios.examProgressLabel}
                  </p>
                  <p className="text-lg font-black tracking-tight text-on-surface">
                    {websiteLanguage === "zh-CN"
                      ? "答完后统一看结果"
                      : "Results unlock after the full run"}
                  </p>
                </div>
              </div>
            </section>
          </section>
        </main>
      </div>
    </div>
  );
}
