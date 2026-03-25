import {
  ArrowDown,
  ArrowDownLeft,
  ArrowDownRight,
  ArrowLeft,
  ArrowUp,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { FIRST_TIME_SETUP, WEEKLY_LOOP_STEPS } from "@/lib/onboarding";

type LoopStep = (typeof WEEKLY_LOOP_STEPS)[number];

const DESKTOP_POSITIONS = [
  "left-1/2 top-0 -translate-x-1/2",
  "right-0 top-[22%]",
  "right-6 bottom-[18%]",
  "left-1/2 bottom-0 -translate-x-1/2",
  "left-6 bottom-[18%]",
  "left-0 top-[22%]",
];

const DESKTOP_ARROWS = [
  {
    icon: ArrowDownRight,
    className: "right-[22%] top-[11%]",
  },
  {
    icon: ArrowDown,
    className: "right-[7%] top-[43%]",
  },
  {
    icon: ArrowDownLeft,
    className: "right-[22%] bottom-[11%]",
  },
  {
    icon: ArrowLeft,
    className: "left-1/2 bottom-[7%] -translate-x-1/2",
  },
  {
    icon: ArrowUp,
    className: "left-[7%] top-[43%]",
  },
  {
    icon: ArrowUpRight,
    className: "left-[22%] top-[11%]",
  },
];

const COMPACT_DESKTOP_POSITIONS = [
  "left-1/2 top-0 -translate-x-1/2",
  "right-0 top-[18%]",
  "right-2 bottom-[15%]",
  "left-1/2 bottom-0 -translate-x-1/2",
  "left-2 bottom-[15%]",
  "left-0 top-[18%]",
];

const COMPACT_DESKTOP_ARROWS = [
  {
    icon: ArrowDownRight,
    className: "right-[22%] top-[9%]",
  },
  {
    icon: ArrowDown,
    className: "right-[7%] top-[42%]",
  },
  {
    icon: ArrowDownLeft,
    className: "right-[22%] bottom-[9%]",
  },
  {
    icon: ArrowLeft,
    className: "left-1/2 bottom-[6%] -translate-x-1/2",
  },
  {
    icon: ArrowUp,
    className: "left-[7%] top-[42%]",
  },
  {
    icon: ArrowUpRight,
    className: "left-[22%] top-[9%]",
  },
];

function getStepTone(index: number) {
  if (index === 0 || index === 2 || index === 5) {
    return {
      borderClassName: "border-primary/20",
      badgeClassName: "bg-primary-container text-primary",
    };
  }

  if (index === 1 || index === 3) {
    return {
      borderClassName: "border-secondary/20",
      badgeClassName: "bg-secondary-container text-secondary",
    };
  }

  return {
    borderClassName: "border-tertiary/20",
    badgeClassName: "bg-tertiary-container text-on-tertiary-container",
  };
}

function StepCard({
  index,
  step,
  compact,
  className = "",
}: {
  index: number;
  step: LoopStep;
  compact: boolean;
  className?: string;
}) {
  const tone = getStepTone(index);

  return (
    <div
      className={`rounded-[1.8rem] border bg-white/92 px-5 py-4 shadow-[0_16px_30px_rgba(48,46,43,0.05)] ${tone.borderClassName} ${
        compact
          ? "max-w-[14.5rem] lg:max-w-[11.75rem] lg:px-4 lg:py-3.5"
          : "max-w-[16.5rem]"
      } ${className}`}
    >
      <div
        className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${tone.badgeClassName}`}
      >
        {String(index + 1).padStart(2, "0")}
      </div>
      <p
        className={`mt-3 font-black tracking-[-0.025em] leading-[1.1] text-on-surface ${
          compact ? "text-xl lg:text-lg" : "text-xl"
        }`}
      >
        {step.title}
      </p>
      <p
        className={`mt-2 leading-relaxed text-on-surface-variant ${
          compact ? "text-sm lg:text-[13px]" : "text-base"
        }`}
      >
        {step.description}
      </p>
    </div>
  );
}

export default function HowItWorksLoop({ compact = false }: { compact?: boolean }) {
  return (
    <div className="space-y-6">
      <div className="mx-auto max-w-md">
        <div className="rounded-[2rem] border border-primary/20 bg-white/90 px-5 py-5 text-center shadow-[0_18px_34px_rgba(48,46,43,0.05)]">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">
            {FIRST_TIME_SETUP.eyebrow}
          </p>
          <p className="mt-2 text-2xl font-black tracking-[-0.03em] leading-[1.08] text-on-surface">
            {FIRST_TIME_SETUP.title}
          </p>
          <p className="mt-2 text-sm text-on-surface-variant leading-[1.68]">
            {FIRST_TIME_SETUP.description}
          </p>
        </div>
        <div className="flex justify-center pt-3 text-on-surface-variant/70">
          <ArrowDown size={20} />
        </div>
      </div>

      <div className="lg:hidden space-y-3">
        <div className="rounded-[1.9rem] border border-white/80 bg-gradient-to-br from-surface-container-lowest via-white to-surface-container-low px-5 py-4 shadow-[0_20px_45px_rgba(149,63,77,0.08)]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-[1rem] bg-primary-container text-primary flex items-center justify-center">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-on-surface-variant">
                Weekly Loop
              </p>
              <p className="text-on-surface-variant text-sm leading-[1.62]">
                This same round cycle repeats inside each rivalry.
              </p>
            </div>
          </div>
        </div>

        {WEEKLY_LOOP_STEPS.map((step, index) => (
          <div key={step.key} className="space-y-2">
            <StepCard index={index} step={step} compact={compact} />
            {index < WEEKLY_LOOP_STEPS.length - 1 && (
              <div className="flex justify-center text-on-surface-variant/65">
                <ArrowDown size={18} />
              </div>
            )}
          </div>
        ))}
      </div>

      {compact ? (
        <div className="hidden lg:block">
          <div className="relative mx-auto h-[35rem] max-w-[62rem] xl:h-[36rem]">
            <div className="absolute inset-[16%] rounded-full border border-dashed border-outline-variant/60 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.6),_transparent_72%)]" />

            <div className="absolute left-1/2 top-1/2 w-[11rem] -translate-x-1/2 -translate-y-1/2 rounded-[1.8rem] border border-white/80 bg-white/88 px-5 py-4 text-center shadow-[0_20px_45px_rgba(149,63,77,0.08)]">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-[1rem] bg-primary-container text-primary">
                <Sparkles size={18} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
                Weekly Loop
              </p>
              <p className="mt-2 text-[13px] leading-[1.62] text-on-surface-variant">
                The same round cycle repeats inside each rivalry.
              </p>
            </div>

            {COMPACT_DESKTOP_ARROWS.map((arrow, index) => {
              const Icon = arrow.icon;
              return (
                <div
                  key={`compact-arrow-${index}`}
                  className={`absolute text-on-surface-variant/65 ${arrow.className}`}
                >
                  <Icon size={18} />
                </div>
              );
            })}

            {WEEKLY_LOOP_STEPS.map((step, index) => (
              <div
                key={step.key}
                className={`absolute ${COMPACT_DESKTOP_POSITIONS[index]}`}
              >
                <StepCard index={index} step={step} compact={compact} />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="hidden lg:block">
        <div
          className={`relative mx-auto ${
            compact ? "hidden" : "h-[40rem] max-w-[58rem]"
          }`}
        >
          <div className="absolute inset-[16%] rounded-full border border-dashed border-outline-variant/60 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.6),_transparent_70%)]" />

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[2rem] border border-white/80 bg-white/88 px-6 py-5 text-center shadow-[0_20px_45px_rgba(149,63,77,0.08)] max-w-[14rem]">
            <div className="mx-auto mb-3 w-12 h-12 rounded-[1.1rem] bg-primary-container text-primary flex items-center justify-center">
              <Sparkles size={20} />
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-on-surface-variant">
              Weekly Loop
            </p>
            <p className="mt-2 text-sm text-on-surface-variant leading-[1.68]">
              The same cycle keeps repeating after each round ends.
            </p>
          </div>

          {DESKTOP_ARROWS.map((arrow, index) => {
            const Icon = arrow.icon;
            return (
              <div
                key={`arrow-${index}`}
                className={`absolute text-on-surface-variant/65 ${arrow.className}`}
              >
                <Icon size={20} />
              </div>
            );
          })}

          {WEEKLY_LOOP_STEPS.map((step, index) => (
            <div
              key={step.key}
              className={`absolute ${DESKTOP_POSITIONS[index]}`}
            >
              <StepCard index={index} step={step} compact={compact} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
