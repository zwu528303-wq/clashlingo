"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, CircleHelp, Clock3, Sparkles } from "lucide-react";
import AppSidebar from "@/components/AppSidebar";
import HowItWorksLoop from "@/components/HowItWorksLoop";
import { getDictionary, resolveClientWebsiteLanguage } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { getGuideFaqs, getProductSurfaces } from "@/lib/onboarding";
import {
  type EditableProfile,
  getEditableProfileFromUser,
  resolveDisplayName,
} from "@/lib/profile";

export default function HowItWorksPage() {
  const [profile, setProfile] = useState<EditableProfile | null>(null);
  const [fallbackWebsiteLanguage] = useState(resolveClientWebsiteLanguage());
  const [loading, setLoading] = useState(true);
  const websiteLanguage = profile?.websiteLanguage ?? fallbackWebsiteLanguage;
  const dictionary = getDictionary(websiteLanguage);
  const guideFaqs = getGuideFaqs(websiteLanguage);
  const productSurfaces = getProductSurfaces(websiteLanguage);

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const authProfile = getEditableProfileFromUser(user);
      const { data } = await supabase
        .from("users")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle<{ display_name: string | null }>();

      setProfile({
        ...authProfile,
        displayName: resolveDisplayName(
          data?.display_name,
          authProfile.displayName
        ),
      });
      setLoading(false);
    };

    init();
  }, []);

  const GuideBody = (
    <main className="space-y-8 pb-12">
      <section className="rounded-[3rem] bg-gradient-to-br from-surface-container-lowest via-white to-surface-container-low p-8 md:p-10 shadow-[0_24px_60px_rgba(149,63,77,0.08)] border border-white/80 space-y-6">
        <div className="space-y-3">
          <p className="text-[11px] font-black uppercase tracking-[0.26em] text-on-surface-variant">
            {dictionary.guide.pageEyebrow}
          </p>
          <h1 className="text-5xl md:text-6xl font-black text-on-surface tracking-[-0.07em] leading-none">
            {dictionary.guide.pageTitle}
          </h1>
          <p className="text-on-surface-variant text-xl leading-relaxed max-w-3xl">
            {dictionary.guide.pageDescription}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_20rem] gap-5">
          <div className="rounded-[2rem] bg-white/88 border border-surface-container px-6 py-5 shadow-[0_16px_30px_rgba(48,46,43,0.05)]">
            <p className="text-lg font-black text-on-surface tracking-tight">
              {dictionary.guide.shortVersionTitle}
            </p>
            <p className="mt-3 text-on-surface-variant leading-relaxed">
              {dictionary.guide.shortVersionDescription}
            </p>
          </div>

          <div className="rounded-[2rem] bg-primary-container/28 border border-primary/10 px-6 py-5 shadow-[0_16px_30px_rgba(48,46,43,0.05)]">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
              {dictionary.guide.bestFirstStepEyebrow}
            </p>
            <p className="mt-3 text-2xl font-black tracking-tight text-on-surface">
              {dictionary.guide.bestFirstStepTitle}
            </p>
            <p className="mt-2 text-sm text-on-surface-variant leading-relaxed">
              {dictionary.guide.bestFirstStepDescription}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[3rem] bg-surface-container-low p-8 md:p-10 shadow-[0_24px_60px_rgba(149,63,77,0.08)] border border-white/80 space-y-6">
        <div className="space-y-2">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
            {dictionary.guide.loopEyebrow}
          </p>
          <h2 className="text-4xl font-black tracking-[-0.06em] text-on-surface">
            {dictionary.guide.loopTitle}
          </h2>
          <p className="text-on-surface-variant leading-relaxed max-w-3xl">
            {dictionary.guide.loopDescription}
          </p>
        </div>

        <HowItWorksLoop websiteLanguage={websiteLanguage} />
      </section>

      <section className="rounded-[3rem] bg-surface-container-low p-8 md:p-10 shadow-[0_24px_60px_rgba(149,63,77,0.08)] border border-white/80 space-y-6">
        <div className="space-y-2">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
            {dictionary.guide.productMapEyebrow}
          </p>
          <h2 className="text-4xl font-black tracking-[-0.06em] text-on-surface">
            {dictionary.guide.productMapTitle}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {productSurfaces.map((surface) => (
            <div
              key={surface.title}
              className="rounded-[2rem] bg-white/88 border border-surface-container px-5 py-5 shadow-[0_16px_30px_rgba(48,46,43,0.05)]"
            >
              <p className="text-2xl font-black tracking-tight text-on-surface">
                {surface.title}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
                {surface.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-[3rem] bg-surface-container-low p-8 md:p-9 shadow-[0_24px_60px_rgba(149,63,77,0.08)] border border-white/80 space-y-5">
          <div className="w-14 h-14 rounded-[1.2rem] bg-primary-container text-primary flex items-center justify-center">
            <Clock3 size={24} />
          </div>
          <div className="space-y-2">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
              {dictionary.guide.weeklyRhythmEyebrow}
            </p>
            <h2 className="text-3xl font-black tracking-[-0.05em] text-on-surface">
              {dictionary.guide.weeklyRhythmTitle}
            </h2>
          </div>
          <p className="text-on-surface-variant leading-relaxed">
            {dictionary.guide.weeklyRhythmParagraphs[0]}
          </p>
          <p className="text-on-surface-variant leading-relaxed">
            {dictionary.guide.weeklyRhythmParagraphs[1]}
          </p>
        </div>

        <div className="rounded-[3rem] bg-surface-container-low p-8 md:p-9 shadow-[0_24px_60px_rgba(149,63,77,0.08)] border border-white/80 space-y-5">
          <div className="w-14 h-14 rounded-[1.2rem] bg-secondary-container text-secondary flex items-center justify-center">
            <Sparkles size={24} />
          </div>
          <div className="space-y-2">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
              {dictionary.guide.languageLevelEyebrow}
            </p>
            <h2 className="text-3xl font-black tracking-[-0.05em] text-on-surface">
              {dictionary.guide.languageLevelTitle}
            </h2>
          </div>
          <p className="text-on-surface-variant leading-relaxed">
            {dictionary.guide.languageLevelParagraphs[0]}
          </p>
          <p className="text-on-surface-variant leading-relaxed">
            {dictionary.guide.languageLevelParagraphs[1]}
          </p>
        </div>
      </section>

      <section className="rounded-[3rem] bg-surface-container-low p-8 md:p-10 shadow-[0_24px_60px_rgba(149,63,77,0.08)] border border-white/80 space-y-6">
        <div className="space-y-2">
          <div className="w-12 h-12 rounded-[1rem] bg-tertiary-container text-on-tertiary-container flex items-center justify-center">
            <CircleHelp size={22} />
          </div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
            {dictionary.guide.faqEyebrow}
          </p>
          <h2 className="text-4xl font-black tracking-[-0.06em] text-on-surface">
            {dictionary.guide.faqTitle}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {guideFaqs.map((item) => (
            <div
              key={item.question}
              className="rounded-[2rem] bg-white/88 border border-surface-container px-5 py-5 shadow-[0_16px_30px_rgba(48,46,43,0.05)]"
            >
              <p className="text-lg font-black tracking-tight text-on-surface">
                {item.question}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
                {item.answer}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-on-surface-variant font-medium">
          {dictionary.common.loadingGuide}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-surface px-5 py-6 md:px-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-medium"
          >
            <ArrowLeft size={18} />
            {dictionary.common.backToLogin}
          </Link>

          {GuideBody}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-[1280px] mx-auto px-5 py-5 lg:px-6 lg:py-7 grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-6 lg:gap-9">
        <AppSidebar active="guide" profile={profile} />
        {GuideBody}
      </div>
    </div>
  );
}
