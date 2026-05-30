"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import AppSidebar from "@/components/AppSidebar";
import ScenarioCard from "@/components/ScenarioCard";
import { getDictionary } from "@/lib/i18n";
import { useClientWebsiteLanguage } from "@/lib/i18n/use-client-website-language";
import {
  countClearedStages,
  countStartedScenarios,
  fetchScenarioProgressMap,
  getScenarioProgress,
  type ScenarioProgressMap,
} from "@/lib/scenario-progress";
import {
  SCENARIO_DOMAINS,
  SCENARIO_DOMAIN_ORDER,
  SCENARIOS,
  getScenariosForDomain,
} from "@/lib/scenario-map";
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

export default function ScenarioMapPage() {
  const router = useRouter();
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<EditableProfile | null>(null);
  const [progressMap, setProgressMap] = useState<ScenarioProgressMap>({});
  const fallbackWebsiteLanguage = useClientWebsiteLanguage();
  const [loading, setLoading] = useState(true);
  const [activeDomain, setActiveDomain] = useState(SCENARIO_DOMAIN_ORDER[0]);
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

  const counts = useMemo(
    () => ({
      full: SCENARIOS.filter((scenario) => scenario.launchStatus === "full").length,
      partial: SCENARIOS.filter((scenario) => scenario.launchStatus === "partial")
        .length,
      comingSoon: SCENARIOS.filter(
        (scenario) => scenario.launchStatus === "coming_soon"
      ).length,
    }),
    []
  );

  const activeDomainMeta = SCENARIO_DOMAINS.find(
    (domain) => domain.key === activeDomain
  );
  const activeScenarios = useMemo(
    () => getScenariosForDomain(activeDomain),
    [activeDomain]
  );
  const playableScenarios = activeScenarios.filter(
    (scenario) => scenario.launchStatus !== "coming_soon"
  );
  const previewScenarios = activeScenarios.filter(
    (scenario) => scenario.launchStatus === "coming_soon"
  );
  const activeDomainStarted = countStartedScenarios(activeScenarios, progressMap);
  const activeDomainCleared = countClearedStages(activeScenarios, progressMap);

  if (loading || !authUser || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="font-medium text-on-surface-variant">
          {dictionary.common.loading}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8 lg:py-8">
        <AppSidebar active="scenarios" profile={profile} />

        <main className="space-y-8 pb-10" data-testid="scenarios-shell">
          <section className="rounded-[3rem] border border-white/80 bg-gradient-to-br from-surface-container-lowest via-white to-surface-container-low p-8 shadow-[0_24px_60px_rgba(149,63,77,0.08)] md:p-10">
            <div className="space-y-4">
              <p className="text-[11px] font-black uppercase tracking-[0.26em] text-on-surface-variant">
                {dictionary.scenarios.pageEyebrow}
              </p>
              <h1 className="max-w-4xl text-4xl font-black leading-none tracking-[-0.07em] text-on-surface md:text-5xl">
                {dictionary.scenarios.pageTitle}
              </h1>
              <p className="max-w-3xl text-base leading-relaxed text-on-surface-variant md:text-lg">
                {dictionary.scenarios.pageDescription}
              </p>
            </div>

            <div className="mt-8 space-y-4">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
                {dictionary.scenarios.domainTabsLabel}
              </p>

              <div className="flex flex-wrap gap-3">
                {SCENARIO_DOMAIN_ORDER.map((domainKey) => {
                  const domainMeta = SCENARIO_DOMAINS.find(
                    (domain) => domain.key === domainKey
                  );

                  if (!domainMeta) {
                    return null;
                  }

                  const isActive = domainKey === activeDomain;

                  return (
                    <button
                      key={domainKey}
                      type="button"
                      onClick={() => setActiveDomain(domainKey)}
                      className={`rounded-full px-4 py-2.5 text-sm font-black transition-all ${
                        isActive
                          ? "bg-primary text-on-primary shadow-[0_12px_24px_rgba(149,63,77,0.28)]"
                          : "bg-white/85 text-on-surface-variant shadow-sm hover:bg-primary/10 hover:text-primary"
                      }`}
                    >
                      {getLocalizedText(domainMeta.name, websiteLanguage)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex gap-2.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="min-w-[10.5rem] flex-1 rounded-full border border-primary/10 bg-primary-container/24 px-3.5 py-3 shadow-sm">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-on-surface-variant">
                  {dictionary.scenarios.launchStatuses.full}
                </p>
                <div className="mt-1 flex items-end gap-2">
                  <p className="text-[1.55rem] font-black leading-none tracking-[-0.06em] text-on-surface">
                    {counts.full}
                  </p>
                </div>
              </div>

              <div className="min-w-[10.5rem] flex-1 rounded-full border border-tertiary/20 bg-tertiary-container/40 px-3.5 py-3 shadow-sm">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-on-surface-variant">
                  {dictionary.scenarios.launchStatuses.partial}
                </p>
                <div className="mt-1 flex items-end gap-2">
                  <p className="text-[1.55rem] font-black leading-none tracking-[-0.06em] text-on-surface">
                    {counts.partial}
                  </p>
                </div>
              </div>

              <div className="min-w-[10.5rem] flex-1 rounded-full border border-secondary/12 bg-secondary/10 px-3.5 py-3 shadow-sm">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-on-surface-variant">
                  {dictionary.scenarios.domainStartedScenarios(activeDomainStarted)}
                </p>
                <div className="mt-1 flex items-end gap-2">
                  <p className="text-[1.55rem] font-black leading-none tracking-[-0.06em] text-on-surface">
                    {activeDomainStarted}
                  </p>
                </div>
              </div>

              <div className="min-w-[10.5rem] flex-1 rounded-full border border-surface-container bg-white/88 px-3.5 py-3 shadow-sm">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-on-surface-variant">
                  {dictionary.scenarios.domainClearedStages(activeDomainCleared)}
                </p>
                <div className="mt-1 flex items-end gap-2">
                  <p className="text-[1.55rem] font-black leading-none tracking-[-0.06em] text-on-surface">
                    {activeDomainCleared}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-[1.5rem] border border-dashed border-surface-container-high bg-white/78 px-4 py-3 text-sm leading-relaxed text-on-surface-variant">
              {dictionary.scenarios.pageHint}
            </div>
          </section>

          {activeDomainMeta ? (
            <div className="space-y-6" data-testid={`scenario-domain-${activeDomain}`}>
              <section className="rounded-[3rem] border border-white/80 bg-surface-container-low p-8 shadow-[0_24px_60px_rgba(149,63,77,0.08)] md:p-10">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div className="space-y-2">
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
                      {dictionary.scenarios.domainLabel}
                    </p>
                    <h2 className="text-4xl font-black tracking-[-0.06em] text-on-surface">
                      {getLocalizedText(activeDomainMeta.name, websiteLanguage)}
                    </h2>
                  </div>
                  <p className="max-w-2xl text-sm leading-relaxed text-on-surface-variant md:text-right">
                    {getLocalizedText(activeDomainMeta.description, websiteLanguage)}
                  </p>
                </div>

                <div className="mt-6 space-y-6">
                  <section>
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <h3 className="text-lg font-black tracking-[-0.04em] text-on-surface">
                        {dictionary.scenarios.playableNowTitle}
                      </h3>
                      <span className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                        {dictionary.scenarios.statusCountLabel(playableScenarios.length)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {playableScenarios.map((scenario) => (
                        <ScenarioCard
                          key={scenario.slug}
                          scenario={scenario}
                          websiteLanguage={websiteLanguage}
                          progress={getScenarioProgress(scenario.slug, progressMap)}
                        />
                      ))}
                    </div>
                  </section>

                  {previewScenarios.length > 0 ? (
                    <section>
                      <div className="mb-4 flex items-center justify-between gap-4">
                        <h3 className="text-lg font-black tracking-[-0.04em] text-on-surface">
                          {dictionary.scenarios.previewLaneTitle}
                        </h3>
                        <span className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                          {dictionary.scenarios.statusCountLabel(previewScenarios.length)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {previewScenarios.map((scenario) => (
                          <ScenarioCard
                            key={scenario.slug}
                            scenario={scenario}
                            websiteLanguage={websiteLanguage}
                            progress={getScenarioProgress(scenario.slug, progressMap)}
                          />
                        ))}
                      </div>
                    </section>
                  ) : null}
                </div>
              </section>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
