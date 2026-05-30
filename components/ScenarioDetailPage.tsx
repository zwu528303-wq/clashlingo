"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { ArrowLeft, Layers3, MapPinned, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import AppSidebar from "@/components/AppSidebar";
import StageCard from "@/components/StageCard";
import { getDictionary } from "@/lib/i18n";
import { useClientWebsiteLanguage } from "@/lib/i18n/use-client-website-language";
import {
  SCENARIO_STAGE_DEFINITIONS,
  SCENARIO_TEMPLATE_LABELS,
  getScenarioBySlug,
  getScenarioDomainMeta,
} from "@/lib/scenario-map";
import { getLocalizedText } from "@/lib/scenario-types";
import {
  DEFAULT_PROGRESS,
  fetchScenarioProgressMap,
  getScenarioProgress,
  type ScenarioProgressMap,
} from "@/lib/scenario-progress";
import {
  type EditableProfile,
  getEditableProfileFromUser,
  resolveDisplayName,
} from "@/lib/profile";
import { supabase } from "@/lib/supabase";

interface PublicUserRow {
  display_name: string | null;
}

interface ScenarioDetailPageProps {
  slug: string;
}

export default function ScenarioDetailPage({ slug }: ScenarioDetailPageProps) {
  const router = useRouter();
  const scenario = getScenarioBySlug(slug);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<EditableProfile | null>(null);
  const [progressMap, setProgressMap] = useState<ScenarioProgressMap>({});
  const fallbackWebsiteLanguage = useClientWebsiteLanguage();
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

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        const map = await fetchScenarioProgressMap({
          accessToken: session.access_token,
          targetLanguage: authProfile.preferredLanguage,
          level: authProfile.defaultLanguageLevel,
        });
        setProgressMap(map);
      }
    };

    void init();
  }, [router]);

  if (!scenario) {
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

  const domainMeta = getScenarioDomainMeta(scenario.domain);
  const templateLabel = getLocalizedText(
    SCENARIO_TEMPLATE_LABELS[scenario.template],
    websiteLanguage
  );
  const progress = scenario
    ? getScenarioProgress(scenario.slug, progressMap)
    : DEFAULT_PROGRESS;

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8 lg:py-8">
        <AppSidebar active="scenarios" profile={profile} />

        <main className="space-y-8 pb-10" data-testid="scenario-detail-shell">
          <section className="rounded-[3rem] border border-white/80 bg-gradient-to-br from-surface-container-lowest via-white to-surface-container-low p-8 shadow-[0_24px_60px_rgba(149,63,77,0.08)] md:p-10">
            <Link
              href="/scenarios"
              className="inline-flex items-center gap-2 text-sm font-bold text-on-surface-variant transition-colors hover:text-primary"
            >
              <ArrowLeft size={18} />
              {dictionary.scenarios.backToMap}
            </Link>

            <div className="mt-6 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary-container px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-primary">
                  {dictionary.scenarios.launchStatuses[scenario.launchStatus]}
                </span>
                <span className="rounded-full bg-surface-container px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
                  {templateLabel}
                </span>
              </div>

              <div className="space-y-3">
                <h1 className="text-5xl font-black tracking-[-0.07em] text-on-surface md:text-6xl">
                  {getLocalizedText(scenario.name, websiteLanguage)}
                </h1>
                <p className="max-w-3xl text-lg leading-relaxed text-on-surface-variant md:text-xl">
                  {getLocalizedText(scenario.summary, websiteLanguage)}
                </p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-[1.9rem] border border-white/80 bg-white/86 px-5 py-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-primary-container text-primary">
                    <MapPinned size={20} />
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
                      {dictionary.scenarios.domainLabel}
                    </p>
                    <p className="text-xl font-black tracking-tight text-on-surface">
                      {domainMeta
                        ? getLocalizedText(domainMeta.name, websiteLanguage)
                        : scenario.domain}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.9rem] border border-white/80 bg-white/86 px-5 py-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-secondary-container text-secondary">
                    <Layers3 size={20} />
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
                      {dictionary.scenarios.templateLabel}
                    </p>
                    <p className="text-xl font-black tracking-tight text-on-surface">
                      {templateLabel}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.9rem] border border-white/80 bg-white/86 px-5 py-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-tertiary-container text-on-tertiary-container">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
                      {dictionary.scenarios.launchStatuses[scenario.launchStatus]}
                    </p>
                    <p className="text-sm leading-relaxed text-on-surface-variant">
                      {
                        dictionary.scenarios.launchStatusDescriptions[
                          scenario.launchStatus
                        ]
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.45fr)_24rem]">
            <div className="rounded-[3rem] border border-white/80 bg-surface-container-low p-8 shadow-[0_24px_60px_rgba(149,63,77,0.08)] md:p-10">
              <div className="space-y-2">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
                  {dictionary.scenarios.pageEyebrow}
                </p>
                <h2 className="text-4xl font-black tracking-[-0.06em] text-on-surface">
                  {dictionary.scenarios.chooseStageTitle}
                </h2>
                <p className="max-w-3xl text-sm leading-relaxed text-on-surface-variant md:text-base">
                  {dictionary.scenarios.chooseStageDescription}
                </p>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
                {SCENARIO_STAGE_DEFINITIONS.map((stage) => {
                  const available =
                    scenario.launchStatus !== "coming_soon" &&
                    scenario.availableStages.includes(stage.stage);

                  const stageState = !available
                    ? "locked"
                    : progress.completedStages.includes(stage.stage)
                      ? "completed"
                      : progress.currentStage === stage.stage
                        ? "current"
                        : "open";

                  return (
                  <StageCard
                    key={stage.stage}
                    stage={stage}
                    websiteLanguage={websiteLanguage}
                    available={available}
                    scenarioLive={scenario.launchStatus !== "coming_soon"}
                    stageState={stageState}
                    href={
                      available
                        ? `/scenario/${scenario.slug}/stage/${stage.stage}`
                        : undefined
                    }
                  />
                  );
                })}
              </div>
            </div>

            <div className="space-y-6">
              <section className="rounded-[2.4rem] border border-white/80 bg-white/88 p-6 shadow-[0_16px_30px_rgba(48,46,43,0.05)]">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
                  {dictionary.scenarios.scopeFirstTitle}
                </p>
                <h3 className="mt-3 text-2xl font-black tracking-[-0.05em] text-on-surface">
                  {dictionary.scenarios.scopeFirstTitle}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
                  {dictionary.scenarios.scopeFirstDescription}
                </p>
              </section>

              <section className="rounded-[2.4rem] border border-white/80 bg-white/88 p-6 shadow-[0_16px_30px_rgba(48,46,43,0.05)]">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
                  {dictionary.scenarios.modePreviewTitle}
                </p>
                <h3 className="mt-3 text-2xl font-black tracking-[-0.05em] text-on-surface">
                  {dictionary.scenarios.modePreviewTitle}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
                  {dictionary.scenarios.modePreviewDescription}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {(
                    ["clash", "exam", "practice"] as const
                  ).map((mode) => (
                    <span
                      key={mode}
                      className="rounded-full bg-surface-container px-3 py-1.5 text-xs font-black tracking-wide text-on-surface"
                    >
                      {dictionary.scenarios.modes[mode]}
                    </span>
                  ))}
                </div>
              </section>

              <section className="rounded-[2.4rem] border border-dashed border-surface-container-high bg-surface-container-low p-6">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
                  {dictionary.scenarios.comingSoonTitle}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
                  {dictionary.scenarios.comingSoonDescription}
                </p>
              </section>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
