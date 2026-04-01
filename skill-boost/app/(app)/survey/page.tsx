"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { CheckCircle2, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";

/* ─── Survey data ────────────────────────────────────────────────────── */
interface Option {
  value: string;
  label: string;
  emoji: string;
  description?: string;
}

interface Step {
  key: "direction" | "goal" | "level";
  question: string;
  subtitle: string;
  options: Option[];
}

const STEPS: Step[] = [
  {
    key: "direction",
    question: "Який напрям тебе цікавить?",
    subtitle: "Ми підберемо курси саме під твій напрям",
    options: [
      { value: "it",         label: "IT",          emoji: "💻", description: "Програмування, DevOps, Data Science" },
      { value: "marketing",  label: "Маркетинг",   emoji: "📣", description: "SMM, реклама, контент-маркетинг" },
      { value: "finance",    label: "Фінанси",     emoji: "💰", description: "Бухгалтерія, інвестиції, фінтех" },
      { value: "design",     label: "Дизайн",      emoji: "🎨", description: "UI/UX, графіка, брендинг" },
      { value: "management", label: "Менеджмент",  emoji: "📊", description: "Управління командою та проєктами" },
    ],
  },
  {
    key: "goal",
    question: "Яка твоя мета?",
    subtitle: "Розкажи, чого хочеш досягти",
    options: [
      { value: "new_job",    label: "Нова робота",       emoji: "🚀", description: "Хочу знайти роботу або змінити сферу" },
      { value: "promotion",  label: "Підвищення",         emoji: "⬆️", description: "Хочу рости на поточному місці" },
      { value: "business",   label: "Власний бізнес",    emoji: "🏢", description: "Планую відкрити свою справу" },
      { value: "self_dev",   label: "Саморозвиток",      emoji: "🌱", description: "Навчаюсь для власного задоволення" },
    ],
  },
  {
    key: "level",
    question: "Який твій рівень?",
    subtitle: "Підберемо матеріали відповідної складності",
    options: [
      { value: "beginner",      label: "Початківець",   emoji: "🌟", description: "Тільки починаю, досвіду майже немає" },
      { value: "intermediate",  label: "Середній",      emoji: "⚡", description: "Маю базові знання, хочу поглибити" },
      { value: "advanced",      label: "Досвідчений",   emoji: "🔥", description: "Знаю тему добре, хочу досконалості" },
    ],
  },
];

/* ─── Selection card ─────────────────────────────────────────────────── */
interface SelectionCardProps {
  option: Option;
  selected: boolean;
  onSelect: () => void;
}

function SelectionCard({ option, selected, onSelect }: SelectionCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`Вибрати: ${option.label}`}
      className={[
        "relative flex w-full items-start gap-4 rounded-2xl px-4 py-4 text-left",
        "transition-all duration-200 select-none",
        "hover:scale-[1.01] active:scale-[0.99]",
        selected
          ? "border-2 border-[#F97316] bg-[#F97316]/10 shadow-[0_0_20px_rgba(249,115,22,0.2)]"
          : "border border-[rgba(255,255,255,0.07)] bg-[#1A2C5B] hover:border-[#F97316]/40",
      ].join(" ")}
    >
      {/* Emoji */}
      <span
        className={[
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl",
          "transition-colors duration-200",
          selected ? "bg-[#F97316]/20" : "bg-[#0D1B3E]",
        ].join(" ")}
      >
        {option.emoji}
      </span>

      {/* Text */}
      <div className="flex flex-1 flex-col gap-0.5">
        <span
          className={[
            "text-sm font-600 transition-colors duration-200",
            selected ? "text-[#F97316]" : "text-[#E2E8F0]",
          ].join(" ")}
        >
          {option.label}
        </span>
        {option.description && (
          <span className="text-xs leading-relaxed text-[#8A9BB5]">
            {option.description}
          </span>
        )}
      </div>

      {/* Check indicator */}
      <span
        className={[
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200",
          selected
            ? "border-[#F97316] bg-[#F97316]"
            : "border-[#223570]",
        ].join(" ")}
        aria-hidden="true"
      >
        {selected && <CheckCircle2 size={12} className="text-white" />}
      </span>
    </button>
  );
}

/* ─── Progress bar ───────────────────────────────────────────────────── */
function StepProgress({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  const pct = ((current) / total) * 100;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-500 text-[#8A9BB5]">
          Крок {current} з {total}
        </span>
        <span className="text-xs font-700 text-[#F97316]">
          {Math.round(pct)}%
        </span>
      </div>

      {/* Track */}
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-[#1A2C5B]">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #F97316, #FBBF24)",
            boxShadow: "0 0 8px rgba(249,115,22,0.6)",
          }}
        />
      </div>

      {/* Step dots */}
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={[
              "rounded-full transition-all duration-300",
              i < current
                ? "h-2 w-5 bg-[#F97316]"
                : i === current - 1
                ? "h-2 w-5 bg-[#F97316]"
                : "h-2 w-2 bg-[#1A2C5B]",
            ].join(" ")}
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Answers type ───────────────────────────────────────────────────── */
interface Answers {
  direction: string;
  goal: string;
  level: string;
}

/* ─── Survey Page ────────────────────────────────────────────────────── */
export default function SurveyPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [currentStep, setCurrentStep] = useState(0); // 0-indexed
  const [answers, setAnswers] = useState<Partial<Answers>>({});
  const [error, setError] = useState<string | null>(null);

  const step = STEPS[currentStep];
  const totalSteps = STEPS.length;
  const selectedValue = answers[step.key];
  const isLastStep = currentStep === totalSteps - 1;

  /* ── Navigation ──────────────────────────────────────────────────── */
  function handleSelect(value: string) {
    setAnswers((prev) => ({ ...prev, [step.key]: value }));
  }

  function handleBack() {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  }

  function handleNext() {
    if (!selectedValue) return;
    if (!isLastStep) {
      setCurrentStep((s) => s + 1);
      return;
    }
    // Last step → save & redirect
    handleFinish();
  }

  /* ── Finish ──────────────────────────────────────────────────────── */
  function handleFinish() {
    setError(null);
    startTransition(async () => {
      const supabase = createClient();

      // 1. Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("Сесія закінчилась. Увійдіть знову.");
        router.push("/login");
        return;
      }

      // 2. Update survey_answers in public.users
      const { error: updateError } = await supabase
        .from("users")
        .update({
          survey_answers: {
            direction: answers.direction,
            goal: answers.goal,
            level: answers.level,
          },
        })
        .eq("id", user.id);

      if (updateError) {
        console.error("Survey update error:", updateError.message);
        // Non-blocking: still redirect even if DB write fails
      }

      // 3. Redirect to courses
      router.push("/app/courses");
    });
  }

  /* ── Skip handler ────────────────────────────────────────────────── */
  function handleSkip() {
    router.push("/app/courses");
  }

  /* ── Render ──────────────────────────────────────────────────────── */
  return (
    <div
      className="relative flex min-h-dvh flex-col overflow-hidden"
      style={{ background: "#0D1B3E" }}
    >
      {/* Ambient top glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-20 left-1/2 h-[300px] w-[300px] -translate-x-1/2 rounded-full opacity-15 blur-[80px]"
        style={{ background: "radial-gradient(circle, #F97316 0%, transparent 70%)" }}
      />

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="relative z-10 flex items-center justify-between px-5 pt-12 pb-6">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentStep === 0}
          className={[
            "flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200",
            "border border-[#1A2C5B] bg-[#1A2C5B]/60",
            currentStep === 0
              ? "opacity-30 cursor-not-allowed"
              : "hover:border-[#F97316]/50 hover:text-[#F97316] active:scale-95",
          ].join(" ")}
          aria-label="Назад"
        >
          <ChevronLeft size={18} className="text-[#E2E8F0]" />
        </button>

        <h1 className="text-[13px] font-600 tracking-wide text-[#8A9BB5]">
          ОПИТУВАННЯ
        </h1>

        <button
          type="button"
          onClick={handleSkip}
          className="text-xs font-500 text-[#8A9BB5] transition-colors hover:text-[#F97316]"
        >
          Пропустити
        </button>
      </header>

      {/* ── Body ───────────────────────────────────────────────────── */}
      <main className="relative z-10 flex flex-1 flex-col px-5 pb-10">
        {/* Progress */}
        <div className="mb-8">
          <StepProgress current={currentStep + 1} total={totalSteps} />
        </div>

        {/* Question */}
        <div className="mb-6 animate-fade-in" key={`question-${currentStep}`}>
          <h2 className="mb-1 text-2xl font-800 leading-tight text-[#E2E8F0]">
            {step.question}
          </h2>
          <p className="text-sm text-[#8A9BB5]">{step.subtitle}</p>
        </div>

        {/* Options */}
        <div
          className="flex flex-col gap-3 animate-slide-up"
          key={`options-${currentStep}`}
          role="group"
          aria-label={step.question}
        >
          {step.options.map((opt) => (
            <SelectionCard
              key={opt.value}
              option={opt}
              selected={selectedValue === opt.value}
              onSelect={() => handleSelect(opt.value)}
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <p className="mt-4 text-center text-sm text-red-400" role="alert">
            {error}
          </p>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* CTA */}
        <div className="mt-8 space-y-3">
          <button
            id="survey-next"
            type="button"
            onClick={handleNext}
            disabled={!selectedValue || isPending}
            className={[
              "flex w-full items-center justify-center gap-2 rounded-full py-4",
              "text-[15px] font-700 text-white transition-all duration-200",
              selectedValue && !isPending
                ? "bg-[#F97316] hover:bg-[#EA6C10] hover:shadow-[0_0_28px_rgba(249,115,22,0.5)] active:scale-[0.97]"
                : "bg-[#1A2C5B] cursor-not-allowed opacity-50",
            ].join(" ")}
          >
            {isPending ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Зберігаємо…
              </>
            ) : (
              <>
                {isLastStep ? "Розпочати навчання" : "Далі"}
                <ChevronRight size={18} strokeWidth={2.5} />
              </>
            )}
          </button>

          {/* Step counter hint */}
          <p className="text-center text-xs text-[#8A9BB5]">
            {!selectedValue
              ? "Оберіть один із варіантів, щоб продовжити"
              : isLastStep
              ? "Все готово! Натисни кнопку вище"
              : `Залишилось ще ${totalSteps - currentStep - 1} кроки`}
          </p>
        </div>
      </main>
    </div>
  );
}
