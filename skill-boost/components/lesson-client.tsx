"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { createClient } from "@/lib/supabase";
import {
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Layers,
  BookOpen,
  Zap,
  ArrowLeft,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────────────── */
export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export interface AdjacentLesson {
  id: string;
  title: string;
  order: number;
}

export interface LessonClientProps {
  lessonId: string;
  courseId: string;
  title: string;
  content: string;
  flashcards: Flashcard[];
  prevLesson: AdjacentLesson | null;
  nextLesson: AdjacentLesson | null;
  totalLessons: number;
  lessonOrder: number;
}

/* ═══════════════════════════════════════════════════════════════════════
   TTS Button
   ═══════════════════════════════════════════════════════════════════════ */
function TTSButton({ text }: { text: string }) {
  const [speaking, setSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") {
        window.speechSynthesis?.cancel();
      }
    };
  }, []);

  // Sync state if synthesis ends externally
  useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth) return;

    const interval = setInterval(() => {
      if (!synth.speaking && speaking) {
        setSpeaking(false);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [speaking]);

  function handleToggle() {
    const synth = window.speechSynthesis;
    if (!synth) {
      alert("Ваш браузер не підтримує озвучення тексту.");
      return;
    }

    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }

    // Strip markdown syntax for cleaner speech
    const plainText = text
      .replace(/#{1,6}\s/g, "")
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/`(.+?)`/g, "$1")
      .replace(/\[(.+?)\]\(.+?\)/g, "$1")
      .replace(/>\s/g, "")
      .replace(/[-*]\s/g, "")
      .trim();

    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.lang = "uk-UA";
    utterance.rate = 0.92;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Try to find a Ukrainian voice
    const voices = synth.getVoices();
    const ukVoice =
      voices.find((v) => v.lang === "uk-UA") ??
      voices.find((v) => v.lang.startsWith("uk")) ??
      voices.find((v) => v.lang.startsWith("ru")); // fallback
    if (ukVoice) utterance.voice = ukVoice;

    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    utteranceRef.current = utterance;
    synth.speak(utterance);
    setSpeaking(true);
  }

  return (
    <button
      id="lesson-tts-btn"
      type="button"
      onClick={handleToggle}
      aria-label={speaking ? "Зупинити озвучення" : "Озвучити урок"}
      className={[
        "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-600 transition-all duration-200",
        speaking
          ? "bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25"
          : "bg-[#F97316]/15 text-[#F97316] border border-[#F97316]/30 hover:bg-[#F97316]/25",
        "active:scale-95",
      ].join(" ")}
    >
      {speaking ? (
        <>
          <VolumeX size={16} className="animate-pulse" />
          Зупинити
        </>
      ) : (
        <>
          <Volume2 size={16} />
          Озвучити
        </>
      )}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Flip Card
   ═══════════════════════════════════════════════════════════════════════ */
function FlipCard({
  front,
  back,
  flipped,
  onFlip,
}: {
  front: string;
  back: string;
  flipped: boolean;
  onFlip: () => void;
}) {
  return (
    <div
      className="relative w-full cursor-pointer"
      style={{ height: 200, perspective: "1000px" }}
      onClick={onFlip}
      role="button"
      aria-label={flipped ? "Показати питання" : "Показати відповідь"}
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onFlip()}
    >
      {/* Card wrapper — rotates */}
      <div
        className="relative w-full h-full transition-transform duration-500"
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Front face */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl p-6"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            background: "linear-gradient(135deg, #1A2C5B 0%, #223570 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          <span className="text-xs font-600 uppercase tracking-widest text-[#8A9BB5]">
            Питання
          </span>
          <p className="text-center text-base font-600 leading-relaxed text-[#E2E8F0]">
            {front}
          </p>
          <span className="text-[11px] text-[#8A9BB5] mt-2 flex items-center gap-1">
            <RotateCcw size={11} />
            Натисни, щоб побачити відповідь
          </span>
        </div>

        {/* Back face */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl p-6"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            background: "linear-gradient(135deg, #1C3A2A 0%, #14532D 100%)",
            border: "1px solid rgba(34,197,94,0.2)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          <span className="text-xs font-600 uppercase tracking-widest text-green-400">
            Відповідь
          </span>
          <p className="text-center text-base font-600 leading-relaxed text-[#E2E8F0]">
            {back}
          </p>
          <span className="text-[11px] text-[#8A9BB5] mt-2 flex items-center gap-1">
            <RotateCcw size={11} />
            Натисни, щоб перевернути назад
          </span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Flashcard Deck
   ═══════════════════════════════════════════════════════════════════════ */
function FlashcardDeck({ cards }: { cards: Flashcard[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<number>>(new Set());
  const [unknown, setUnknown] = useState<Set<number>>(new Set());
  const [finished, setFinished] = useState(false);

  const current = cards[currentIndex];
  const knownCount = known.size;
  const remaining = cards.length - known.size - unknown.size;

  function advance() {
    setFlipped(false);
    // Small delay so flip-back animation is visible before card changes
    setTimeout(() => {
      const nextIndex = currentIndex + 1;
      if (nextIndex >= cards.length) {
        setFinished(true);
      } else {
        setCurrentIndex(nextIndex);
      }
    }, 180);
  }

  function handleKnow() {
    setKnown((prev) => new Set([...prev, currentIndex]));
    advance();
  }

  function handleDontKnow() {
    setUnknown((prev) => new Set([...prev, currentIndex]));
    advance();
  }

  function handleRestart() {
    setCurrentIndex(0);
    setFlipped(false);
    setKnown(new Set());
    setUnknown(new Set());
    setFinished(false);
  }

  if (cards.length === 0) return null;

  /* ── Finished state ────────────────────────────────────────────── */
  if (finished) {
    const score = Math.round((knownCount / cards.length) * 100);
    return (
      <div className="flex flex-col items-center gap-5 rounded-2xl p-6 text-center animate-fade-in"
        style={{ background: "#1A2C5B", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <span className="text-5xl">{score >= 70 ? "🎉" : "💪"}</span>
        <div>
          <p className="text-lg font-800 text-[#E2E8F0]">
            {score >= 70 ? "Чудова робота!" : "Продовжуй тренуватись!"}
          </p>
          <p className="mt-1 text-sm text-[#8A9BB5]">
            Ти знаєш{" "}
            <span className="font-700 text-green-400">{knownCount}</span> з{" "}
            <span className="font-700 text-[#E2E8F0]">{cards.length}</span>{" "}
            карток
          </p>
        </div>

        {/* Score bar */}
        <div className="w-full space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-green-400">Знаю: {knownCount}</span>
            <span className="text-red-400">Не знаю: {unknown.size}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#0D1B3E]">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-700"
              style={{ width: `${score}%` }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleRestart}
          className="flex items-center gap-2 rounded-full bg-[#F97316] px-5 py-2.5 text-sm font-700 text-white transition-all hover:bg-[#EA6C10] active:scale-95"
        >
          <RotateCcw size={15} />
          Повторити картки
        </button>
      </div>
    );
  }

  /* ── Active deck ─────────────────────────────────────────────────── */
  return (
    <div className="space-y-4">
      {/* Counter + progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers size={15} className="text-[#F97316]" />
          <span className="text-sm font-600 text-[#E2E8F0]">
            {currentIndex + 1} / {cards.length} карток
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-[#8A9BB5]">
          <span className="flex items-center gap-1 text-green-400">
            <CheckCircle2 size={12} />
            {knownCount}
          </span>
          <span className="flex items-center gap-1 text-red-400">
            <XCircle size={12} />
            {unknown.size}
          </span>
        </div>
      </div>

      {/* Mini progress bar */}
      <div className="h-1 w-full overflow-hidden rounded-full bg-[#1A2C5B]">
        <div
          className="h-full rounded-full bg-[#F97316] transition-all duration-300"
          style={{
            width: `${((currentIndex) / cards.length) * 100}%`,
            background: "linear-gradient(90deg, #F97316, #FBBF24)",
          }}
        />
      </div>

      {/* Flip card */}
      <FlipCard
        front={current.front}
        back={current.back}
        flipped={flipped}
        onFlip={() => setFlipped((f) => !f)}
      />

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          id="flashcard-dont-know"
          type="button"
          onClick={handleDontKnow}
          aria-label="Не знаю цю картку"
          className={[
            "flex items-center justify-center gap-2 rounded-full py-3",
            "border border-red-500/30 bg-red-500/10 text-sm font-700 text-red-400",
            "transition-all duration-200 hover:bg-red-500/20 active:scale-95",
          ].join(" ")}
        >
          <XCircle size={16} />
          Не знаю
        </button>
        <button
          id="flashcard-know"
          type="button"
          onClick={handleKnow}
          aria-label="Знаю цю картку"
          className={[
            "flex items-center justify-center gap-2 rounded-full py-3",
            "border border-green-500/30 bg-green-500/10 text-sm font-700 text-green-400",
            "transition-all duration-200 hover:bg-green-500/20 active:scale-95",
          ].join(" ")}
        >
          <CheckCircle2 size={16} />
          Знаю
        </button>
      </div>

      {/* Remaining hint */}
      {remaining > 0 && (
        <p className="text-center text-xs text-[#8A9BB5]">
          Залишилось карток: {remaining}
        </p>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Progress Tracker (marks course as in_progress on mount)
   ═══════════════════════════════════════════════════════════════════════ */
function ProgressTracker({
  courseId,
  lessonOrder,
  totalLessons,
}: {
  courseId: string;
  lessonOrder: number;
  totalLessons: number;
}) {
  useEffect(() => {
    async function markProgress() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Calculate score based on how far into the course this lesson is
      const newScore = Math.round((lessonOrder / totalLessons) * 100);

      // Fetch existing progress
      const { data: existing } = await supabase
        .from("user_progress")
        .select("id, status, score")
        .eq("user_id", user.id)
        .eq("course_id", courseId)
        .single();

      if (existing) {
        // Only update if new score is higher (don't go backward)
        if (
          existing.status !== "completed" &&
          newScore > (existing.score ?? 0)
        ) {
          await supabase
            .from("user_progress")
            .update({ status: "in_progress", score: newScore })
            .eq("id", existing.id);
        }
      } else {
        // First time visiting any lesson in this course
        await supabase.from("user_progress").insert({
          user_id: user.id,
          course_id: courseId,
          status: "in_progress",
          score: newScore,
          completed_at: null,
        });
      }
    }

    markProgress().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, lessonOrder]);

  return null; // renders nothing
}

/* ═══════════════════════════════════════════════════════════════════════
   Markdown renderer with custom dark-theme styles
   ═══════════════════════════════════════════════════════════════════════ */
function LessonMarkdown({ content }: { content: string }) {
  return (
    <div className="prose-lesson">
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="mb-4 mt-6 text-xl font-800 text-[#E2E8F0] first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-3 mt-5 text-lg font-700 text-[#E2E8F0]">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-4 text-base font-700 text-[#CBD5E1]">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="mb-4 text-sm leading-7 text-[#CBD5E1]">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="mb-4 ml-4 space-y-1.5 text-sm text-[#CBD5E1]">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 ml-4 list-decimal space-y-1.5 text-sm text-[#CBD5E1]">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="flex gap-2 text-sm text-[#CBD5E1] before:mt-2 before:h-1.5 before:w-1.5 before:shrink-0 before:rounded-full before:bg-[#F97316]">
              <span>{children}</span>
            </li>
          ),
          strong: ({ children }) => (
            <strong className="font-700 text-[#E2E8F0]">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-[#CBD5E1]">{children}</em>
          ),
          code: ({ children, className }) => {
            const isBlock = className?.includes("language-");
            if (isBlock) {
              return (
                <code className="block overflow-x-auto rounded-xl bg-[#0D1B3E] p-4 text-xs text-[#F97316] font-mono leading-6">
                  {children}
                </code>
              );
            }
            return (
              <code className="rounded-md bg-[#0D1B3E] px-1.5 py-0.5 text-xs text-[#F97316] font-mono">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="mb-4 overflow-x-auto rounded-xl bg-[#0D1B3E] p-4 border border-[rgba(255,255,255,0.05)]">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mb-4 border-l-4 border-[#F97316] pl-4 italic text-[#8A9BB5]">
              {children}
            </blockquote>
          ),
          hr: () => (
            <hr className="my-6 border-[rgba(255,255,255,0.08)]" />
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#F97316] underline underline-offset-2 hover:opacity-80"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Main LessonClient export
   ═══════════════════════════════════════════════════════════════════════ */
export default function LessonClient({
  lessonId,
  courseId,
  title,
  content,
  flashcards,
  prevLesson,
  nextLesson,
  totalLessons,
  lessonOrder,
}: LessonClientProps) {
  return (
    <div className="min-h-dvh pb-32" style={{ background: "#0D1B3E" }}>
      {/* Side-effect: marks progress on mount */}
      <ProgressTracker
        courseId={courseId}
        lessonOrder={lessonOrder}
        totalLessons={totalLessons}
      />

      {/* ── Sticky header ──────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-30 flex items-center gap-3 px-4 pt-12 pb-4"
        style={{
          background: "linear-gradient(180deg, #0D1B3E 75%, rgba(13,27,62,0) 100%)",
        }}
      >
        <Link
          href={`/app/courses/${courseId}`}
          aria-label="Назад до курсу"
          className={[
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
            "bg-[#1A2C5B] border border-[rgba(255,255,255,0.06)] text-[#8A9BB5]",
            "transition-all hover:text-[#E2E8F0] active:scale-95",
          ].join(" ")}
        >
          <ArrowLeft size={18} />
        </Link>

        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-600 uppercase tracking-widest text-[#8A9BB5]">
            Урок {lessonOrder} з {totalLessons}
          </p>
          <h1 className="truncate text-sm font-700 text-[#E2E8F0]">{title}</h1>
        </div>

        {/* TTS button in header */}
        <TTSButton text={content} />
      </header>

      {/* ── Lesson content ─────────────────────────────────────────── */}
      <main className="px-4 space-y-8">
        {/* Markdown body */}
        <section
          aria-label="Зміст уроку"
          className="rounded-2xl p-5"
          style={{
            background: "#1A2C5B",
            border: "1px solid rgba(255,255,255,0.05)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
          }}
        >
          {content ? (
            <LessonMarkdown content={content} />
          ) : (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <BookOpen size={36} className="text-[#8A9BB5] opacity-40" />
              <p className="text-sm text-[#8A9BB5]">Вміст уроку відсутній</p>
            </div>
          )}
        </section>

        {/* ── Flashcards ──────────────────────────────────────────── */}
        {flashcards.length > 0 && (
          <section aria-labelledby="flashcards-heading">
            <div className="mb-4 flex items-center gap-2">
              <Zap size={16} className="text-[#F97316]" />
              <h2
                id="flashcards-heading"
                className="text-[15px] font-700 text-[#E2E8F0]"
              >
                Флеш-картки
              </h2>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-700"
                style={{
                  background: "rgba(249,115,22,0.15)",
                  color: "#F97316",
                }}
              >
                {flashcards.length}
              </span>
            </div>
            <FlashcardDeck cards={flashcards} />
          </section>
        )}
      </main>

      {/* ── Lesson navigation bar ───────────────────────────────────── */}
      <nav
        aria-label="Навігація між уроками"
        className="fixed bottom-[56px] left-0 right-0 z-20 flex items-center gap-3 px-4 py-3"
        style={{
          background: "linear-gradient(0deg, #0D1B3E 60%, rgba(13,27,62,0) 100%)",
          paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))",
        }}
      >
        {/* Previous lesson */}
        {prevLesson ? (
          <Link
            href={`/app/lesson/${prevLesson.id}`}
            aria-label={`Попередній урок: ${prevLesson.title}`}
            className={[
              "flex flex-1 items-center gap-2 rounded-xl px-3 py-3",
              "border border-[rgba(255,255,255,0.06)] bg-[#1A2C5B]",
              "text-xs font-600 text-[#8A9BB5] transition-all hover:text-[#E2E8F0] hover:border-[#F97316]/30",
              "active:scale-[0.97]",
            ].join(" ")}
          >
            <ChevronLeft size={16} className="shrink-0 text-[#F97316]" />
            <span className="truncate">{prevLesson.title}</span>
          </Link>
        ) : (
          <div className="flex-1" />
        )}

        {/* Next lesson */}
        {nextLesson ? (
          <Link
            href={`/app/lesson/${nextLesson.id}`}
            id="lesson-next-btn"
            aria-label={`Наступний урок: ${nextLesson.title}`}
            className={[
              "flex flex-1 items-center justify-end gap-2 rounded-xl px-3 py-3",
              "bg-[#F97316] text-white",
              "text-xs font-700 transition-all hover:bg-[#EA6C10]",
              "hover:shadow-[0_0_16px_rgba(249,115,22,0.4)] active:scale-[0.97]",
            ].join(" ")}
          >
            <span className="truncate">{nextLesson.title}</span>
            <ChevronRight size={16} className="shrink-0" />
          </Link>
        ) : (
          /* Last lesson — return to course */
          <Link
            href={`/app/courses/${courseId}`}
            id="lesson-finish-btn"
            aria-label="Завершити урок, повернутись до курсу"
            className={[
              "flex flex-1 items-center justify-end gap-2 rounded-xl px-3 py-3",
              "bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] text-white",
              "text-xs font-700 transition-all",
              "hover:shadow-[0_0_16px_rgba(124,58,237,0.4)] active:scale-[0.97]",
            ].join(" ")}
          >
            <span>Завершити урок</span>
            <CheckCircle2 size={16} className="shrink-0" />
          </Link>
        )}
      </nav>
    </div>
  );
}
