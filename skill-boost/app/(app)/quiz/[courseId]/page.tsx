"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import {
  CheckCircle2,
  XCircle,
  ChevronRight,
  Trophy,
  RotateCcw,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  BookOpen,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────────────── */
interface QuizQuestion {
  id: string;
  course_id: string;
  question: string;
  options: string[];           // jsonb array of answer strings
  correct_index: number;       // 0-based index
  explanation?: string | null;
}

type AnswerState = "unanswered" | "correct" | "wrong";

/* ─── Option card ────────────────────────────────────────────────────── */
interface OptionCardProps {
  label: string;
  index: number;
  state: "default" | "correct" | "wrong" | "dimmed";
  onClick: () => void;
  disabled: boolean;
}

function OptionCard({ label, index, state, onClick, disabled }: OptionCardProps) {
  const letters = ["A", "B", "C", "D"];

  const styles: Record<typeof state, string> = {
    default: [
      "border-[rgba(255,255,255,0.07)] bg-[#1A2C5B]",
      "hover:border-[#F97316]/50 hover:bg-[#F97316]/5",
    ].join(" "),
    correct: "border-green-500 bg-green-500/15 shadow-[0_0_16px_rgba(34,197,94,0.25)]",
    wrong:   "border-red-500 bg-red-500/15 shadow-[0_0_16px_rgba(239,68,68,0.2)]",
    dimmed:  "border-[rgba(255,255,255,0.04)] bg-[#0D1B3E]/60 opacity-40",
  };

  const letterStyles: Record<typeof state, string> = {
    default: "bg-[#223570] text-[#8A9BB5]",
    correct: "bg-green-500 text-white",
    wrong:   "bg-red-500 text-white",
    dimmed:  "bg-[#1A2C5B] text-[#8A9BB5]",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`Варіант ${letters[index]}: ${label}`}
      className={[
        "flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left",
        "transition-all duration-200 active:scale-[0.98]",
        disabled && state === "default" ? "cursor-not-allowed" : "cursor-pointer",
        styles[state],
      ].join(" ")}
    >
      {/* Letter badge */}
      <span
        className={[
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          "text-xs font-800 transition-colors duration-200",
          letterStyles[state],
        ].join(" ")}
      >
        {letters[index]}
      </span>

      {/* Answer text */}
      <span
        className={[
          "flex-1 text-sm font-500 leading-snug transition-colors duration-200",
          state === "correct"
            ? "text-green-300 font-600"
            : state === "wrong"
            ? "text-red-300"
            : state === "dimmed"
            ? "text-[#8A9BB5]"
            : "text-[#E2E8F0]",
        ].join(" ")}
      >
        {label}
      </span>

      {/* Result icon */}
      {state === "correct" && (
        <CheckCircle2 size={18} className="shrink-0 text-green-400" />
      )}
      {state === "wrong" && (
        <XCircle size={18} className="shrink-0 text-red-400" />
      )}
    </button>
  );
}

/* ─── Progress bar ───────────────────────────────────────────────────── */
function QuizProgress({
  current,
  total,
  correctSoFar,
}: {
  current: number;
  total: number;
  correctSoFar: number;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-600 text-[#8A9BB5]">
          Питання {current} з {total}
        </span>
        <span className="font-700 text-[#F97316]">
          ✓ {correctSoFar} правильних
        </span>
      </div>
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-[#1A2C5B]">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${((current - 1) / total) * 100}%`,
            background: "linear-gradient(90deg, #F97316, #FBBF24)",
            boxShadow: "0 0 8px rgba(249,115,22,0.5)",
          }}
        />
      </div>
    </div>
  );
}

/* ─── Final / Results screen ─────────────────────────────────────────── */
interface ResultsScreenProps {
  correctCount: number;
  totalCount: number;
  courseId: string;
  onRetry: () => void;
}

function ResultsScreen({
  correctCount,
  totalCount,
  courseId,
  onRetry,
}: ResultsScreenProps) {
  const router = useRouter();
  const pct = Math.round((correctCount / totalCount) * 100);
  const passed = pct >= 70;

  const [certState, setCertState] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [certificateId, setCertificateId] = useState<string | null>(null);
  const [certError, setCertError] = useState<string | null>(null);

  // Auto-issue certificate if passed
  useEffect(() => {
    if (!passed) return;
    issueCertificate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function issueCertificate() {
    setCertState("loading");
    try {
      const res = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, score: pct }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to issue certificate");
      setCertificateId(data.certificateId);
      setCertState("success");
    } catch (err) {
      console.error(err);
      setCertError(err instanceof Error ? err.message : "Unknown error");
      setCertState("error");
    }
  }

  /* ── PASS screen ─────────────────────────────────────────────────── */
  if (passed) {
    return (
      <div className="flex flex-col items-center gap-6 px-4 py-8 animate-fade-in text-center">
        {/* Trophy animation */}
        <div className="relative">
          <div
            className="flex h-24 w-24 items-center justify-center rounded-full animate-pulse-glow"
            style={{ background: "linear-gradient(135deg, #F97316, #FBBF24)" }}
          >
            <Trophy size={44} className="text-white" />
          </div>
          <Sparkles
            size={20}
            className="absolute -right-1 -top-1 text-yellow-400 animate-spin"
            style={{ animationDuration: "3s" }}
          />
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl font-800 text-[#E2E8F0]">
            Вітаємо! 🎉
          </h2>
          <p className="text-base font-600 text-[#F97316]">
            Ви успішно пройшли курс!
          </p>
        </div>

        {/* Score ring */}
        <div
          className="flex flex-col items-center gap-1 rounded-2xl px-10 py-5"
          style={{
            background: "#1A2C5B",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <span className="text-5xl font-800 text-[#F97316]">{pct}%</span>
          <span className="text-sm text-[#8A9BB5]">
            {correctCount} з {totalCount} правильних відповідей
          </span>
          <div className="mt-2 h-2 w-48 overflow-hidden rounded-full bg-[#0D1B3E]">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Certificate status */}
        {certState === "loading" && (
          <div className="flex items-center gap-2 text-sm text-[#8A9BB5]">
            <Loader2 size={16} className="animate-spin text-[#F97316]" />
            Генеруємо сертифікат…
          </div>
        )}

        {certState === "error" && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <AlertCircle size={15} />
            {certError ?? "Не вдалося створити сертифікат"}
          </div>
        )}

        {certState === "success" && certificateId && (
          <div
            className="w-full space-y-3 rounded-2xl p-4"
            style={{
              background: "rgba(34,197,94,0.08)",
              border: "1px solid rgba(34,197,94,0.2)",
            }}
          >
            <div className="flex items-center gap-2 text-sm text-green-400">
              <CheckCircle2 size={16} />
              <span className="font-600">Сертифікат видано!</span>
            </div>
            <Link
              href={`/app/certificate/${certificateId}`}
              id="quiz-view-certificate"
              className={[
                "flex w-full items-center justify-center gap-2 rounded-full py-3.5",
                "text-sm font-700 text-white transition-all duration-200",
                "bg-gradient-to-r from-[#7C3AED] to-[#4F46E5]",
                "hover:shadow-[0_0_24px_rgba(124,58,237,0.4)] active:scale-[0.97]",
              ].join(" ")}
            >
              <Trophy size={16} />
              Переглянути сертифікат
            </Link>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex w-full flex-col gap-3">
          <Link
            href={`/app/courses/${courseId}`}
            className={[
              "flex w-full items-center justify-center gap-2 rounded-full py-3.5",
              "text-sm font-700 text-white transition-all duration-200 bg-[#F97316]",
              "hover:bg-[#EA6C10] hover:shadow-[0_0_24px_rgba(249,115,22,0.4)]",
              "active:scale-[0.97]",
            ].join(" ")}
          >
            <BookOpen size={16} />
            Повернутись до курсу
          </Link>

          <Link
            href="/app/courses"
            className={[
              "flex w-full items-center justify-center gap-2 rounded-full py-3",
              "text-sm font-500 text-[#8A9BB5] border border-[rgba(255,255,255,0.06)]",
              "hover:text-[#E2E8F0] hover:border-[#F97316]/30 transition-all active:scale-[0.97]",
            ].join(" ")}
          >
            Всі курси
          </Link>
        </div>
      </div>
    );
  }

  /* ── FAIL screen ─────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col items-center gap-6 px-4 py-8 animate-fade-in text-center">
      <div
        className="flex h-24 w-24 items-center justify-center rounded-full"
        style={{ background: "rgba(239,68,68,0.15)", border: "2px solid rgba(239,68,68,0.3)" }}
      >
        <XCircle size={44} className="text-red-400" />
      </div>

      <div className="space-y-1">
        <h2 className="text-2xl font-800 text-[#E2E8F0]">Майже вийшло!</h2>
        <p className="text-sm text-[#8A9BB5]">
          Для проходження потрібно 70% правильних відповідей
        </p>
      </div>

      {/* Score */}
      <div
        className="flex flex-col items-center gap-1 rounded-2xl px-10 py-5"
        style={{
          background: "#1A2C5B",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <span className="text-5xl font-800 text-red-400">{pct}%</span>
        <span className="text-sm text-[#8A9BB5]">
          {correctCount} з {totalCount} правильних
        </span>
        <div className="mt-2 h-2 w-48 overflow-hidden rounded-full bg-[#0D1B3E]">
          <div
            className="h-full rounded-full bg-red-500 transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="mt-1 text-xs text-[#8A9BB5]">
          Потрібно ще {70 - pct}% для проходження
        </span>
      </div>

      <div className="flex w-full flex-col gap-3">
        <button
          id="quiz-retry-btn"
          type="button"
          onClick={onRetry}
          className={[
            "flex w-full items-center justify-center gap-2 rounded-full py-3.5",
            "text-sm font-700 text-white bg-[#F97316] transition-all",
            "hover:bg-[#EA6C10] hover:shadow-[0_0_24px_rgba(249,115,22,0.4)]",
            "active:scale-[0.97]",
          ].join(" ")}
        >
          <RotateCcw size={16} />
          Спробуй ще раз
        </button>

        <Link
          href={`/app/courses/${courseId}`}
          className={[
            "flex w-full items-center justify-center gap-2 rounded-full py-3",
            "text-sm font-500 text-[#8A9BB5] border border-[rgba(255,255,255,0.06)]",
            "hover:text-[#E2E8F0] hover:border-[#F97316]/30 transition-all active:scale-[0.97]",
          ].join(" ")}
        >
          Повторити уроки
        </Link>
      </div>
    </div>
  );
}

/* ─── Main Quiz Page ─────────────────────────────────────────────────── */
export default function QuizPage({
  params,
}: {
  params: { courseId: string };
}) {
  const { courseId } = params;

  /* ── State ───────────────────────────────────────────────────────── */
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>("unanswered");
  const [correctAnswers, setCorrectAnswers] = useState<boolean[]>([]);
  const [finished, setFinished] = useState(false);

  /* ── Load questions ──────────────────────────────────────────────── */
  const loadQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: dbError } = await supabase
      .from("quiz_questions")
      .select("id, course_id, question, options, correct_index, explanation")
      .eq("course_id", courseId)
      .order("id"); // stable order

    if (dbError) {
      setError("Не вдалося завантажити питання. Спробуйте пізніше.");
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      setError("Питання для цього курсу ще не додані.");
      setLoading(false);
      return;
    }

    // Shuffle questions for replay variety
    const shuffled = [...data].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
    setLoading(false);
  }, [courseId]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  /* ── Derived ─────────────────────────────────────────────────────── */
  const currentQuestion = questions[currentIndex];
  const correctCount = correctAnswers.filter(Boolean).length;

  /* ── Select answer ───────────────────────────────────────────────── */
  function handleSelect(optionIndex: number) {
    if (answerState !== "unanswered") return;

    const isCorrect = optionIndex === currentQuestion.correct_index;
    setSelectedIndex(optionIndex);
    setAnswerState(isCorrect ? "correct" : "wrong");
    setCorrectAnswers((prev) => [...prev, isCorrect]);
  }

  /* ── Advance ─────────────────────────────────────────────────────── */
  function handleNext() {
    if (currentIndex + 1 >= questions.length) {
      setFinished(true);
      return;
    }
    setCurrentIndex((i) => i + 1);
    setSelectedIndex(null);
    setAnswerState("unanswered");
  }

  /* ── Retry ───────────────────────────────────────────────────────── */
  function handleRetry() {
    setCurrentIndex(0);
    setSelectedIndex(null);
    setAnswerState("unanswered");
    setCorrectAnswers([]);
    setFinished(false);
    // Re-shuffle questions
    setQuestions((q) => [...q].sort(() => Math.random() - 0.5));
  }

  /* ── Get option display state ────────────────────────────────────── */
  function getOptionState(
    idx: number
  ): "default" | "correct" | "wrong" | "dimmed" {
    if (answerState === "unanswered") return "default";
    if (idx === currentQuestion.correct_index) return "correct";
    if (idx === selectedIndex) return "wrong";
    return "dimmed";
  }

  /* ── Loading screen ──────────────────────────────────────────────── */
  if (loading) {
    return (
      <div
        className="flex min-h-dvh flex-col items-center justify-center gap-4"
        style={{ background: "#0D1B3E" }}
      >
        <Loader2 size={36} className="animate-spin text-[#F97316]" />
        <p className="text-sm text-[#8A9BB5]">Завантажуємо тест…</p>
      </div>
    );
  }

  /* ── Error screen ────────────────────────────────────────────────── */
  if (error) {
    return (
      <div
        className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center"
        style={{ background: "#0D1B3E" }}
      >
        <AlertCircle size={44} className="text-red-400" />
        <p className="text-base font-600 text-[#E2E8F0]">{error}</p>
        <Link
          href={`/app/courses/${courseId}`}
          className="flex items-center gap-2 rounded-full bg-[#1A2C5B] px-5 py-2.5 text-sm text-[#8A9BB5] hover:text-[#E2E8F0] transition-colors"
        >
          <ArrowLeft size={15} />
          До курсу
        </Link>
      </div>
    );
  }

  /* ── Results screen ──────────────────────────────────────────────── */
  if (finished) {
    return (
      <div className="min-h-dvh pb-24 pt-12" style={{ background: "#0D1B3E" }}>
        <div className="mx-auto max-w-sm">
          <ResultsScreen
            correctCount={correctCount}
            totalCount={questions.length}
            courseId={courseId}
            onRetry={handleRetry}
          />
        </div>
      </div>
    );
  }

  /* ── Quiz screen ─────────────────────────────────────────────────── */
  return (
    <div className="min-h-dvh pb-28" style={{ background: "#0D1B3E" }}>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-30 px-4 pt-12 pb-4"
        style={{
          background:
            "linear-gradient(180deg, #0D1B3E 80%, rgba(13,27,62,0) 100%)",
        }}
      >
        <div className="mb-3 flex items-center gap-3">
          <Link
            href={`/app/courses/${courseId}`}
            aria-label="Вийти з тесту"
            className={[
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
              "bg-[#1A2C5B] border border-[rgba(255,255,255,0.06)] text-[#8A9BB5]",
              "transition-all hover:text-[#E2E8F0] active:scale-95",
            ].join(" ")}
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="text-[10px] font-600 uppercase tracking-widest text-[#8A9BB5]">
              Фінальний тест
            </p>
            <h1 className="text-sm font-700 text-[#E2E8F0]">
              Перевір свої знання
            </h1>
          </div>
        </div>

        <QuizProgress
          current={currentIndex + 1}
          total={questions.length}
          correctSoFar={correctCount}
        />
      </header>

      {/* ── Question ───────────────────────────────────────────────── */}
      <main className="px-4 space-y-5">
        {/* Question card */}
        <div
          key={currentQuestion.id}
          className="rounded-2xl p-5 animate-fade-in"
          style={{
            background: "#1A2C5B",
            border: "1px solid rgba(255,255,255,0.06)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
          }}
        >
          <div className="mb-4 flex items-start gap-3">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-800 text-white"
              style={{ background: "linear-gradient(135deg, #F97316, #EA580C)" }}
            >
              {currentIndex + 1}
            </span>
            <h2 className="text-base font-700 leading-snug text-[#E2E8F0]">
              {currentQuestion.question}
            </h2>
          </div>

          {/* Options */}
          <div
            className="flex flex-col gap-3 animate-slide-up"
            role="group"
            aria-label="Варіанти відповідей"
          >
            {currentQuestion.options.map((opt, idx) => (
              <OptionCard
                key={idx}
                label={opt}
                index={idx}
                state={getOptionState(idx)}
                onClick={() => handleSelect(idx)}
                disabled={answerState !== "unanswered"}
              />
            ))}
          </div>
        </div>

        {/* ── Feedback / explanation ─────────────────────────────── */}
        {answerState !== "unanswered" && (
          <div
            className={[
              "rounded-2xl p-4 animate-fade-in",
              answerState === "correct"
                ? "border border-green-500/25 bg-green-500/8"
                : "border border-red-500/25 bg-red-500/8",
            ].join(" ")}
          >
            <div className="flex items-start gap-3">
              {answerState === "correct" ? (
                <CheckCircle2 size={20} className="shrink-0 text-green-400 mt-0.5" />
              ) : (
                <XCircle size={20} className="shrink-0 text-red-400 mt-0.5" />
              )}
              <div className="flex-1 space-y-1">
                <p
                  className={[
                    "text-sm font-700",
                    answerState === "correct" ? "text-green-300" : "text-red-300",
                  ].join(" ")}
                >
                  {answerState === "correct"
                    ? "Правильно! 🎉"
                    : "Неправильно 😔"}
                </p>
                {answerState === "wrong" && (
                  <p className="text-xs text-[#8A9BB5]">
                    Правильна відповідь:{" "}
                    <span className="font-600 text-green-400">
                      {currentQuestion.options[currentQuestion.correct_index]}
                    </span>
                  </p>
                )}
                {currentQuestion.explanation && (
                  <p className="mt-1 text-xs leading-relaxed text-[#8A9BB5]">
                    💡 {currentQuestion.explanation}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Next button ────────────────────────────────────────── */}
        {answerState !== "unanswered" && (
          <button
            id="quiz-next-btn"
            type="button"
            onClick={handleNext}
            className={[
              "flex w-full items-center justify-center gap-2 rounded-full py-4 animate-slide-up",
              "text-[15px] font-700 text-white transition-all duration-200",
              "bg-[#F97316] hover:bg-[#EA6C10]",
              "hover:shadow-[0_0_28px_rgba(249,115,22,0.5)] active:scale-[0.97]",
            ].join(" ")}
          >
            {currentIndex + 1 >= questions.length
              ? "Переглянути результати"
              : "Наступне питання"}
            <ChevronRight size={18} strokeWidth={2.5} />
          </button>
        )}

        {/* Prompt if nothing selected */}
        {answerState === "unanswered" && (
          <p className="text-center text-xs text-[#8A9BB5]">
            Оберіть один із варіантів відповіді
          </p>
        )}
      </main>
    </div>
  );
}
