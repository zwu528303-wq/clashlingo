"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { getDictionary } from "@/lib/i18n";
import { useClientWebsiteLanguage } from "@/lib/i18n/use-client-website-language";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const websiteLanguage = useClientWebsiteLanguage();
  const dictionary = getDictionary(websiteLanguage);

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen bg-surface px-5 py-12 text-on-surface">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-3xl items-center">
        <section className="w-full rounded-[2.4rem] border border-white/80 bg-white/88 p-8 shadow-[0_24px_60px_rgba(48,46,43,0.08)] md:p-10">
          <p className="text-sm font-black uppercase text-primary">
            ClashLingo
          </p>
          <h1 className="mt-4 text-4xl font-black text-on-surface md:text-5xl">
            {dictionary.common.somethingWentWrongTitle}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-on-surface-variant">
            {dictionary.common.somethingWentWrongDescription}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => unstable_retry()}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-black text-on-primary shadow-[0_14px_30px_rgba(149,63,77,0.22)]"
            >
              <RotateCcw size={17} />
              {dictionary.common.tryAgain}
            </button>
            <Link
              href="/"
              className="inline-flex items-center rounded-full border border-primary/20 bg-white px-5 py-3 text-sm font-black text-primary"
            >
              {dictionary.common.goHome}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
