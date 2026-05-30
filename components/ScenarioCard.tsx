"use client";

import Link from "next/link";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { getDictionary, type WebsiteLanguage } from "@/lib/i18n";
import { DEFAULT_PROGRESS, type ScenarioProgress } from "@/lib/scenario-progress";
import { SCENARIO_TEMPLATE_LABELS } from "@/lib/scenario-map";
import {
  getLocalizedText,
  type Scenario,
  type StageNumber,
} from "@/lib/scenario-types";

const STATUS_STYLES: Record<
  Scenario["launchStatus"],
  {
    badge: string;
    card: string;
  }
> = {
  full: {
    badge: "bg-primary-container text-primary",
    card: "border-primary/10 hover:border-primary/20",
  },
  partial: {
    badge: "bg-tertiary-container text-on-tertiary-container",
    card: "border-tertiary/20 hover:border-tertiary/35",
  },
  coming_soon: {
    badge: "bg-surface-container-high text-on-surface-variant",
    card: "border-surface-container hover:border-surface-container-high",
  },
};

interface ScenarioCardProps {
  scenario: Scenario;
  websiteLanguage: WebsiteLanguage;
  progress?: ScenarioProgress;
}

function getStageVisualState(
  stage: StageNumber,
  availableStages: StageNumber[],
  completedStages: StageNumber[],
  currentStage: StageNumber | null
) {
  if (completedStages.includes(stage)) {
    return "completed";
  }

  if (currentStage === stage) {
    return "current";
  }

  if (availableStages.includes(stage)) {
    return "open";
  }

  return "locked";
}

export default function ScenarioCard({
  scenario,
  websiteLanguage,
  progress = DEFAULT_PROGRESS,
}: ScenarioCardProps) {
  const dictionary = getDictionary(websiteLanguage);
  const statusStyle = STATUS_STYLES[scenario.launchStatus];
  const templateLabel = getLocalizedText(
    SCENARIO_TEMPLATE_LABELS[scenario.template],
    websiteLanguage
  );
  const progressLabel =
    scenario.launchStatus === "coming_soon"
      ? dictionary.scenarios.progressPreviewOnly
      : progress.currentStage
        ? progress.completedStages.length > 0
          ? `${dictionary.scenarios.progressCleared(
              progress.completedStages.length,
              4
            )} · ${dictionary.scenarios.progressCurrentStage(progress.currentStage)}`
          : dictionary.scenarios.progressCurrentStage(progress.currentStage)
        : scenario.availableStages.length > 0
          ? dictionary.scenarios.progressStartAt(scenario.availableStages[0])
          : dictionary.scenarios.noOpenStages;

  const ctaLabel =
    scenario.launchStatus === "coming_soon"
      ? dictionary.scenarios.previewScenario
      : progress.currentStage
        ? dictionary.scenarios.continueScenario
        : dictionary.scenarios.startScenario;

  return (
    <Link
      href={`/scenario/${scenario.slug}`}
      className={`group rounded-[1.9rem] border bg-white/92 px-4 py-4 shadow-[0_14px_24px_rgba(48,46,43,0.05)] transition-all hover:-translate-y-0.5 hover:shadow-[0_24px_36px_rgba(149,63,77,0.12)] ${statusStyle.card}`}
      data-testid={`scenario-card-${scenario.slug}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${statusStyle.badge}`}
          >
            {dictionary.scenarios.launchStatuses[scenario.launchStatus]}
          </span>
          <span className="rounded-full bg-surface-container px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">
            {templateLabel}
          </span>
        </div>

        {scenario.launchStatus === "coming_soon" ? (
          <LockKeyhole size={16} className="mt-1 text-on-surface-variant" />
        ) : (
          <ArrowRight
            size={18}
            className="mt-1 text-on-surface-variant transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
          />
        )}
      </div>

      <div className="mt-4">
        <h3 className="text-xl font-black tracking-[-0.05em] text-on-surface">
          {getLocalizedText(scenario.name, websiteLanguage)}
        </h3>
      </div>

      <div className="mt-4">
        <div className="flex items-center gap-2">
          {([1, 2, 3, 4] as StageNumber[]).map((stage) => {
            const visualState = getStageVisualState(
              stage,
              scenario.availableStages,
              progress.completedStages,
              progress.currentStage
            );

            const classes =
              visualState === "completed"
                ? "bg-primary border-primary text-on-primary"
                : visualState === "current"
                  ? "border-primary bg-primary/12 text-primary ring-2 ring-primary/15"
                  : visualState === "open"
                    ? "border-secondary/35 bg-secondary/10 text-secondary"
                    : "border-surface-container-high bg-surface-container text-on-surface-variant";

            return (
              <div
                key={stage}
                className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-black ${classes}`}
                title={`${dictionary.scenarios.stageLabel(stage)} · ${
                  dictionary.scenarios.stageNodeLabels[visualState]
                }`}
              >
                {stage}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <p className="text-sm font-bold text-on-surface">
          {progressLabel}
        </p>
        <p className="text-xs leading-relaxed text-on-surface-variant">
          {dictionary.scenarios.launchStatusDescriptions[scenario.launchStatus]}
        </p>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
          {dictionary.scenarios.openScenario}
        </span>
        <span className="shrink-0 text-sm font-black text-primary">
          {ctaLabel}
        </span>
      </div>
    </Link>
  );
}
