"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  Languages,
  Map,
  Swords,
  Timer,
} from "lucide-react";
import {
  getDictionary,
  persistWebsiteLanguage,
  type WebsiteLanguage,
} from "@/lib/i18n";
import { useClientWebsiteLanguage } from "@/lib/i18n/use-client-website-language";
import { supabase } from "@/lib/supabase";

const pathIcons = [Compass, Swords];
const SESSION_CHECK_TIMEOUT_MS = 1200;

async function getSessionWithTimeout() {
  return Promise.race([
    supabase.auth
      .getSession()
      .then(({ data }) => data.session)
      .catch(() => null),
    new Promise<null>((resolve) => {
      window.setTimeout(() => resolve(null), SESSION_CHECK_TIMEOUT_MS);
    }),
  ]);
}

export default function LandingPage() {
  const router = useRouter();
  const detectedLanguage = useClientWebsiteLanguage();
  const [pickedLanguage, setPickedLanguage] = useState<WebsiteLanguage | null>(
    null
  );
  const websiteLanguage = pickedLanguage ?? detectedLanguage;
  const dictionary = getDictionary(websiteLanguage);

  useEffect(() => {
    const checkSession = async () => {
      const session = await getSessionWithTimeout();

      if (session?.user) {
        router.replace("/lounge");
        return;
      }
    };

    checkSession();
  }, [router]);

  const setLanguagePreference = (nextLanguage: WebsiteLanguage) => {
    setPickedLanguage(nextLanguage);
    persistWebsiteLanguage(nextLanguage);
  };

  return (
    <main className="min-h-screen bg-surface text-on-surface">
      <section className="relative min-h-[86vh] overflow-hidden border-b border-white/80 px-5 py-6 md:px-8 lg:px-10">
        <div className="absolute inset-0 bg-surface" />
        <div className="absolute inset-x-4 top-24 bottom-8 hidden opacity-90 md:block md:inset-x-auto md:right-8 md:top-24 md:w-[58%] lg:right-14">
          <div className="relative h-full min-h-[28rem]">
            <div className="absolute right-0 top-0 w-[min(100%,42rem)] rounded-[2.4rem] border border-white/90 bg-surface-container-lowest p-5 shadow-[0_28px_80px_rgba(48,46,43,0.12)]">
              <div className="flex items-center justify-between border-b border-surface-container pb-4">
                <div>
                  <p className="text-xs font-black uppercase text-primary">
                    {dictionary.landing.scenarioSignalTitle}
                  </p>
                  <p className="mt-1 text-2xl font-black">
                    {dictionary.landing.mapPreviewTitle}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-[1.1rem] bg-primary text-on-primary">
                  <Map size={22} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-5 sm:grid-cols-4">
                {[1, 2, 3, 4].map((stage) => (
                  <div
                    key={stage}
                    className={`aspect-square rounded-[1.4rem] border p-3 ${
                      stage === 1
                        ? "border-primary/30 bg-primary-container/36"
                        : "border-surface-container bg-surface-container-low"
                    }`}
                  >
                    <p className="text-xs font-black text-on-surface-variant">
                      STAGE
                    </p>
                    <p className="mt-1 text-3xl font-black">{stage}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[1.2rem] bg-surface-container-low px-4 py-3">
                  <BookOpen size={18} className="text-primary" />
                  <p className="mt-2 text-sm font-bold">
                    {dictionary.landing.mapPreviewScope}
                  </p>
                </div>
                <div className="rounded-[1.2rem] bg-surface-container-low px-4 py-3">
                  <Timer size={18} className="text-secondary" />
                  <p className="mt-2 text-sm font-bold">
                    {dictionary.landing.mapPreviewStage}
                  </p>
                </div>
                <div className="rounded-[1.2rem] bg-surface-container-low px-4 py-3">
                  <CheckCircle2 size={18} className="text-tertiary" />
                  <p className="mt-2 text-sm font-bold">
                    {dictionary.landing.mapPreviewReport}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 mx-auto flex min-h-[calc(86vh-3rem)] max-w-6xl flex-col justify-between gap-12">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-3xl font-black text-primary">ClashLingo</p>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-white/80 bg-white/86 px-3 py-2 shadow-sm">
                <Languages size={16} className="text-on-surface-variant" />
                <span className="text-xs font-bold text-on-surface-variant">
                  {dictionary.landing.languageToggleLabel}
                </span>
                {(["en", "zh-CN"] as const).map((language) => (
                  <button
                    key={language}
                    type="button"
                    onClick={() => setLanguagePreference(language)}
                    className={`rounded-full px-3 py-1 text-xs font-black transition-colors ${
                      websiteLanguage === language
                        ? "bg-primary text-on-primary"
                        : "text-on-surface-variant hover:text-primary"
                    }`}
                  >
                    {dictionary.websiteLanguageLabels[language]}
                  </button>
                ))}
              </div>
              <Link
                href="/login"
                className="rounded-full border border-white/80 bg-white/88 px-4 py-2 text-sm font-black text-on-surface-variant shadow-sm transition-colors hover:text-primary"
              >
                {dictionary.landing.secondaryCta}
              </Link>
            </div>
          </header>

          <div className="max-w-2xl py-10 md:py-16">
            <p className="text-sm font-black uppercase text-primary">
              {dictionary.landing.eyebrow}
            </p>
            <h1 className="mt-4 text-6xl font-black leading-none text-on-surface md:text-7xl lg:text-8xl">
              {dictionary.landing.title}
            </h1>
            <p className="mt-6 max-w-xl text-xl leading-relaxed text-on-surface-variant">
              {dictionary.landing.description}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-4 text-base font-black text-on-primary shadow-[0_18px_34px_rgba(149,63,77,0.22)] transition-transform hover:-translate-y-0.5"
              >
                {dictionary.landing.primaryCta}
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/88 px-6 py-4 text-base font-black text-primary shadow-sm transition-transform hover:-translate-y-0.5"
              >
                {dictionary.landing.guideCta}
              </Link>
            </div>
          </div>

          <div className="grid max-w-3xl gap-3 pb-3 md:grid-cols-2">
            <div className="rounded-[1.6rem] border border-primary/15 bg-white/86 p-4 shadow-sm">
              <p className="font-black text-primary">
                {dictionary.landing.scenarioSignalTitle}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                {dictionary.landing.scenarioSignalDescription}
              </p>
            </div>
            <div className="rounded-[1.6rem] border border-secondary/15 bg-white/86 p-4 shadow-sm">
              <p className="font-black text-secondary">
                {dictionary.landing.friendSignalTitle}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                {dictionary.landing.friendSignalDescription}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-12 md:px-8 lg:px-10">
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase text-on-surface-variant">
              {dictionary.landing.pathsEyebrow}
            </p>
            <h2 className="mt-3 text-4xl font-black text-on-surface md:text-5xl">
              {dictionary.landing.pathsTitle}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-on-surface-variant">
              {dictionary.landing.pathsDescription}
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {[
              {
                title: dictionary.landing.scenarioPathTitle,
                description: dictionary.landing.scenarioPathDescription,
              },
              {
                title: dictionary.landing.rivalryPathTitle,
                description: dictionary.landing.rivalryPathDescription,
              },
            ].map((path, index) => {
              const Icon = pathIcons[index];
              return (
                <div
                  key={path.title}
                  className="rounded-[2rem] border border-white/80 bg-white/88 p-6 shadow-[0_18px_44px_rgba(48,46,43,0.06)]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-[1.1rem] bg-surface-container-low text-primary">
                    <Icon size={22} />
                  </div>
                  <h3 className="mt-5 text-2xl font-black">{path.title}</h3>
                  <p className="mt-3 leading-relaxed text-on-surface-variant">
                    {path.description}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="rounded-[2rem] border border-white/80 bg-surface-container-low p-6 shadow-[0_18px_44px_rgba(48,46,43,0.06)]">
            <p className="text-sm font-black uppercase text-primary">
              {dictionary.landing.readinessEyebrow}
            </p>
            <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_28rem]">
              <h2 className="text-3xl font-black text-on-surface">
                {dictionary.landing.readinessTitle}
              </h2>
              <div className="space-y-3">
                {dictionary.landing.readinessItems.map((item) => (
                  <div key={item} className="flex gap-3">
                    <CheckCircle2
                      size={20}
                      className="mt-0.5 shrink-0 text-secondary"
                    />
                    <p className="font-semibold text-on-surface-variant">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
