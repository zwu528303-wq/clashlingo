"use client";

import { Clock3, Sparkles } from "lucide-react";
import type { WebsiteLanguage } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n";
import { getLocalizedText, type BattleQuestion } from "@/lib/scenario-types";

interface BattleQuestionCardProps {
  question: BattleQuestion;
  websiteLanguage: WebsiteLanguage;
  questionNumber: number;
  totalQuestions: number;
  timeLeft: number;
  maxTime: number;
  textAnswer: string;
  selectedOption: string | null;
  onTextAnswerChange: (value: string) => void;
  onSelectOption: (optionId: string) => void;
  onSubmit: () => void;
  canSubmit: boolean;
}

export default function BattleQuestionCard({
  question,
  websiteLanguage,
  questionNumber,
  totalQuestions,
  timeLeft,
  maxTime,
  textAnswer,
  selectedOption,
  onTextAnswerChange,
  onSelectOption,
  onSubmit,
  canSubmit,
}: BattleQuestionCardProps) {
  const dictionary = getDictionary(websiteLanguage);
  const progressPct = Math.max(0, Math.min(100, (timeLeft / maxTime) * 100));
  const typeLabel = dictionary.scenarios.battleQuestionTypes[question.type];

  return (
    <section className="rounded-[2.8rem] border border-white/80 bg-white/92 p-6 shadow-[0_18px_45px_rgba(149,63,77,0.08)] md:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary-container px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-primary">
              {dictionary.scenarios.battleQuestionCounter(
                questionNumber,
                totalQuestions
              )}
            </span>
            <span className="rounded-full bg-surface-container px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
              {typeLabel}
            </span>
          </div>

          <h2 className="max-w-2xl text-2xl font-black tracking-[-0.05em] text-on-surface md:text-3xl">
            {getLocalizedText(question.prompt, websiteLanguage)}
          </h2>
        </div>

        <div className="min-w-[10rem] rounded-[1.6rem] border border-white/80 bg-surface-container-low px-4 py-4">
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
            <Clock3 size={14} />
            {dictionary.scenarios.battleTimerLabel}
          </div>
          <p className="mt-2 text-3xl font-black tracking-[-0.05em] text-on-surface">
            {timeLeft}s
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-container-high">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-6">
        {question.type === "multiple_choice" ? (
          <div className="grid grid-cols-1 gap-3">
            {question.options.map((option) => {
              const active = selectedOption === option.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onSelectOption(option.id)}
                  className={`rounded-[1.7rem] border px-4 py-4 text-left transition ${
                    active
                      ? "border-primary bg-primary-container text-primary shadow-sm"
                      : "border-surface-container-high bg-surface-container-low text-on-surface hover:border-primary/35 hover:bg-white"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-sm font-black uppercase tracking-wide text-on-surface">
                      {option.id}
                    </span>
                    <span className="text-base font-semibold leading-relaxed">
                      {getLocalizedText(option.text, websiteLanguage)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {question.type === "fill_blank" ? (
              <input
                value={textAnswer}
                onChange={(event) => onTextAnswerChange(event.target.value)}
                placeholder={dictionary.scenarios.battleFillBlankPlaceholder}
                className="w-full rounded-[1.7rem] border border-surface-container-high bg-surface-container-low px-4 py-4 text-base font-semibold text-on-surface outline-none transition focus:border-primary focus:bg-white"
              />
            ) : (
              <textarea
                value={textAnswer}
                onChange={(event) => onTextAnswerChange(event.target.value)}
                placeholder={dictionary.scenarios.battleFreeResponsePlaceholder}
                rows={4}
                className="w-full resize-none rounded-[1.7rem] border border-surface-container-high bg-surface-container-low px-4 py-4 text-base font-semibold leading-relaxed text-on-surface outline-none transition focus:border-primary focus:bg-white"
              />
            )}

            <div className="rounded-[1.4rem] border border-dashed border-surface-container-high bg-surface-container-low px-4 py-3 text-sm leading-relaxed text-on-surface-variant">
              <span className="inline-flex items-center gap-2 font-bold text-on-surface">
                <Sparkles size={15} />
                {dictionary.scenarios.battleSkillLabel}
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {question.skillTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant"
                  >
                    {tag.replaceAll("_", " ")}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className="rounded-full bg-primary px-6 py-3 text-sm font-black text-white shadow-[0_14px_28px_rgba(149,63,77,0.22)] transition hover:-translate-y-0.5 hover:bg-primary/92 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
        >
          {dictionary.scenarios.battleSubmit}
        </button>
      </div>
    </section>
  );
}

