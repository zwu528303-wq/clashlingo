"use client";

import Link from "next/link";
import { CheckCircle2, LockKeyhole, PlayCircle, Sparkles } from "lucide-react";
import { getDictionary, type WebsiteLanguage } from "@/lib/i18n";
import { getLocalizedText, type StageDefinition } from "@/lib/scenario-types";

export type StageVisualState = "completed" | "current" | "open" | "locked";

interface StageCardProps {
  stage: StageDefinition;
  websiteLanguage: WebsiteLanguage;
  available: boolean;
  scenarioLive: boolean;
  href?: string;
  /** Per-user progress state. Defaults to open/locked from `available`. */
  stageState?: StageVisualState;
}

export default function StageCard({
  stage,
  websiteLanguage,
  available,
  scenarioLive,
  href,
  stageState,
}: StageCardProps) {
  const dictionary = getDictionary(websiteLanguage);
  const stageName = dictionary.scenarios.stageNames[stage.name];
  const state: StageVisualState =
    stageState ?? (available ? "open" : "locked");

  const cardClasses = `rounded-[2rem] border px-5 py-5 shadow-[0_16px_30px_rgba(48,46,43,0.05)] ${
    state === "completed"
      ? "border-primary/25 bg-primary-container/24"
      : state === "current"
        ? "border-primary/30 bg-white/92 ring-2 ring-primary/15"
        : available
          ? "border-primary/10 bg-white/92"
          : "border-surface-container bg-white/78"
  }`;

  const badgeClasses =
    state === "completed"
      ? "bg-primary text-on-primary"
      : state === "current"
        ? "bg-primary-container text-primary"
        : available
          ? "bg-primary-container text-primary"
          : "bg-surface-container text-on-surface-variant";

  const badgeIcon =
    state === "completed" ? (
      <CheckCircle2 size={14} />
    ) : state === "current" ? (
      <PlayCircle size={14} />
    ) : available ? (
      <Sparkles size={14} />
    ) : (
      <LockKeyhole size={14} />
    );

  const badgeLabel =
    state === "completed"
      ? dictionary.scenarios.stageNodeLabels.completed
      : state === "current"
        ? dictionary.scenarios.stageNodeLabels.current
        : available
          ? dictionary.scenarios.stageReady
          : scenarioLive
            ? dictionary.scenarios.stageLocked
            : dictionary.scenarios.stageComingSoon;

  const footerHint =
    state === "completed"
      ? dictionary.scenarios.stageNodeLabels.completed
      : available
        ? dictionary.scenarios.briefingNext
        : dictionary.scenarios.launchStatusDescriptions.coming_soon;

  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
            {dictionary.scenarios.stageLabel(stage.stage)}
          </p>
          <h3 className="text-2xl font-black tracking-[-0.05em] text-on-surface">
            {stageName}
          </h3>
        </div>

        <span
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${badgeClasses}`}
        >
          {badgeIcon}
          {badgeLabel}
        </span>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-on-surface-variant">
        {getLocalizedText(stage.summary, websiteLanguage)}
      </p>

      <div className="mt-5 space-y-3">
        {stage.goals.map((goal) => (
          <div key={goal.en} className="flex items-start gap-3">
            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary/60" />
            <p className="text-sm leading-relaxed text-on-surface">
              {getLocalizedText(goal, websiteLanguage)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-[1.4rem] border border-dashed border-surface-container-high bg-surface-container-low px-4 py-3 text-sm leading-relaxed text-on-surface-variant">
        {footerHint}
      </div>
    </>
  );

  if (available && href) {
    return (
      <Link
        href={href}
        className={`${cardClasses} block transition-transform duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_20px_36px_rgba(149,63,77,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35`}
        data-testid={`stage-card-${stage.stage}`}
      >
        {content}
      </Link>
    );
  }

  return (
    <div className={cardClasses} data-testid={`stage-card-${stage.stage}`}>
      {content}
    </div>
  );
}
