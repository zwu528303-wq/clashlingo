"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, CircleHelp, Clock3, Sparkles } from "lucide-react";
import AppSidebar from "@/components/AppSidebar";
import HowItWorksLoop from "@/components/HowItWorksLoop";
import { supabase } from "@/lib/supabase";
import { GUIDE_FAQS, PRODUCT_SURFACES } from "@/lib/onboarding";
import {
  type EditableProfile,
  getEditableProfileFromUser,
  resolveDisplayName,
} from "@/lib/profile";

export default function HowItWorksPage() {
  const [profile, setProfile] = useState<EditableProfile | null>(null);
  const [loading, setLoading] = useState(true);

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
            How It Works
          </p>
          <h1 className="text-5xl md:text-6xl font-black text-on-surface tracking-[-0.07em] leading-none">
            ClashLingo, explained simply
          </h1>
          <p className="text-on-surface-variant text-xl leading-relaxed max-w-3xl">
            ClashLingo is a weekly 1v1 language duel. You and a friend study the
            same round, take the exam, compare scores, and keep the rivalry going
            over time.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_20rem] gap-5">
          <div className="rounded-[2rem] bg-white/88 border border-surface-container px-6 py-5 shadow-[0_16px_30px_rgba(48,46,43,0.05)]">
            <p className="text-lg font-black text-on-surface tracking-tight">
              The short version
            </p>
            <p className="mt-3 text-on-surface-variant leading-relaxed">
              One rivalry is one friend. Inside that rivalry, you keep repeating
              the same round loop: start the round, get the scope, confirm it,
              study or start early, take the exam, then compare results.
            </p>
          </div>

          <div className="rounded-[2rem] bg-primary-container/28 border border-primary/10 px-6 py-5 shadow-[0_16px_30px_rgba(48,46,43,0.05)]">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
              Best first step
            </p>
            <p className="mt-3 text-2xl font-black tracking-tight text-on-surface">
              Start one rivalry first.
            </p>
            <p className="mt-2 text-sm text-on-surface-variant leading-relaxed">
              Once you finish your first round, the rest of the app becomes much
              easier to understand.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[3rem] bg-surface-container-low p-8 md:p-10 shadow-[0_24px_60px_rgba(149,63,77,0.08)] border border-white/80 space-y-6">
        <div className="space-y-2">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
            The Loop
          </p>
          <h2 className="text-4xl font-black tracking-[-0.06em] text-on-surface">
            How a rivalry actually works
          </h2>
          <p className="text-on-surface-variant leading-relaxed max-w-3xl">
            Creating or joining a rivalry is just the setup. The real product is
            the weekly loop below.
          </p>
        </div>

        <HowItWorksLoop />
      </section>

      <section className="rounded-[3rem] bg-surface-container-low p-8 md:p-10 shadow-[0_24px_60px_rgba(149,63,77,0.08)] border border-white/80 space-y-6">
        <div className="space-y-2">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
            Product Map
          </p>
          <h2 className="text-4xl font-black tracking-[-0.06em] text-on-surface">
            What each page is for
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {PRODUCT_SURFACES.map((surface) => (
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
              Weekly Rhythm
            </p>
            <h2 className="text-3xl font-black tracking-[-0.05em] text-on-surface">
              The countdown is a rhythm, not a lock
            </h2>
          </div>
          <p className="text-on-surface-variant leading-relaxed">
            Your weekly time keeps the duel feeling regular. It tells both players
            when the rivalry normally comes alive.
          </p>
          <p className="text-on-surface-variant leading-relaxed">
            But if both players are ready, the match can still start early.
            ClashLingo should feel like a shared weekly rhythm, not a hard gate.
          </p>
        </div>

        <div className="rounded-[3rem] bg-surface-container-low p-8 md:p-9 shadow-[0_24px_60px_rgba(149,63,77,0.08)] border border-white/80 space-y-5">
          <div className="w-14 h-14 rounded-[1.2rem] bg-secondary-container text-secondary flex items-center justify-center">
            <Sparkles size={24} />
          </div>
          <div className="space-y-2">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
              Language Level
            </p>
            <h2 className="text-3xl font-black tracking-[-0.05em] text-on-surface">
              Level helps the AI pitch the round correctly
            </h2>
          </div>
          <p className="text-on-surface-variant leading-relaxed">
            Your default level helps ClashLingo choose the right syllabus and exam
            difficulty.
          </p>
          <p className="text-on-surface-variant leading-relaxed">
            If both players study the same language at different levels, the round
            uses the lower level so the shared scope still works for both sides.
          </p>
        </div>
      </section>

      <section className="rounded-[3rem] bg-surface-container-low p-8 md:p-10 shadow-[0_24px_60px_rgba(149,63,77,0.08)] border border-white/80 space-y-6">
        <div className="space-y-2">
          <div className="w-12 h-12 rounded-[1rem] bg-tertiary-container text-on-tertiary-container flex items-center justify-center">
            <CircleHelp size={22} />
          </div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
            FAQ
          </p>
          <h2 className="text-4xl font-black tracking-[-0.06em] text-on-surface">
            Common questions
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {GUIDE_FAQS.map((item) => (
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
          Loading guide...
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
            Back to login
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
