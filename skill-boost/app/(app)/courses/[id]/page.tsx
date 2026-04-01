import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase-server";
import { Progress } from "@/components/ui/progress";
import { BackButton } from "@/components/back-button";
import {
  CheckCircle2,
  Lock,
  PlayCircle,
  BookOpen,
  Clock,
  ChevronRight,
  Trophy,
  Zap,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────────────────────── */
interface Lesson {
  id: string;
  course_id: string;
  title: string;
  content: string | null;
  order: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  image_url: string | null;
  order: number;
}

interface UserProgress {
  status: "not_started" | "in_progress" | "completed";
  score: number;
  completed_at: string | null;
}

/* ─── Category badge colors ──────────────────────────────────────────── */
const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  IT:         { bg: "rgba(129,140,248,0.15)", text: "#818CF8" },
  Маркетинг:  { bg: "rgba(244,114,182,0.15)", text: "#F472B6" },
  Фінанси:    { bg: "rgba(45,212,191,0.15)",  text: "#2DD4BF" },
  Дизайн:     { bg: "rgba(250,204,21,0.15)",  text: "#FACC15" },
  Менеджмент: { bg: "rgba(96,165,250,0.15)",  text: "#60A5FA" },
};
function getCatStyle(cat: string) {
  return CATEGORY_COLORS[cat] ?? { bg: "rgba(249,115,22,0.15)", text: "#F97316" };
}

/* ─── Estimate reading time from lesson content ──────────────────────── */
function estimateDuration(content: string | null): string {
  if (!content) return "5 хв";
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.max(3, Math.round(words / 200)); // 200 wpm reading
  return `${minutes} хв`;
}

/* ─── Determine which lessons are "completed" ────────────────────────── */
/**
 * Schema has course-level progress (score = 0–100 %).
 * We infer per-lesson completion as: lessons up to floor(score/100 * total)
 * are considered done. If status = "completed" → all done.
 */
function getLessonStatuses(
  lessons: Lesson[],
  progress: UserProgress | null
): ("completed" | "in_progress" | "locked")[] {
  if (!progress || progress.status === "not_started") {
    return lessons.map((_, i) => (i === 0 ? "in_progress" : "locked"));
  }
  if (progress.status === "completed") {
    return lessons.map(() => "completed");
  }
  // in_progress: score = % completed
  const doneCnt = Math.floor((progress.score / 100) * lessons.length);
  return lessons.map((_, i) => {
    if (i < doneCnt) return "completed";
    if (i === doneCnt) return "in_progress";
    return "locked";
  });
}

/* ─── Metadata ───────────────────────────────────────────────────────── */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("courses")
    .select("title, description")
    .eq("id", id)
    .single();

  return {
    title: data?.title ? `${data.title} | Skill Boost` : "Курс | Skill Boost",
    description: data?.description ?? "Детальна сторінка курсу.",
  };
}

/* ─── Lesson Row ─────────────────────────────────────────────────────── */
function LessonRow({
  lesson,
  index,
  status,
}: {
  lesson: Lesson;
  index: number;
  status: "completed" | "in_progress" | "locked";
}) {
  const duration = estimateDuration(lesson.content);
  const isLocked = status === "locked";

  const content = (
    <div
      className={[
        "flex items-center gap-3 rounded-xl px-4 py-3.5 transition-all duration-200",
        isLocked
          ? "opacity-50 cursor-not-allowed"
          : "hover:bg-[#223570] active:scale-[0.99] cursor-pointer",
        status === "in_progress"
          ? "border border-[#F97316]/30 bg-[#F97316]/5"
          : "border border-transparent",
      ].join(" ")}
    >
      {/* Status icon */}
      <div className="shrink-0">
        {status === "completed" ? (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/15">
            <CheckCircle2 size={18} className="text-green-400" />
          </span>
        ) : status === "in_progress" ? (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F97316]/15">
            <PlayCircle size={18} className="text-[#F97316]" />
          </span>
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1A2C5B]">
            <Lock size={15} className="text-[#8A9BB5]" />
          </span>
        )}
      </div>

      {/* Lesson number + title */}
      <div className="flex flex-1 flex-col gap-0.5 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-600 text-[#8A9BB5]">
            {String(index + 1).padStart(2, "0")}
          </span>
          {status === "in_progress" && (
            <span
              className="rounded-full px-1.5 py-0.5 text-[9px] font-700 uppercase tracking-wide"
              style={{ background: "rgba(249,115,22,0.2)", color: "#F97316" }}
            >
              Поточний
            </span>
          )}
        </div>
        <span
          className={[
            "text-[13px] font-500 leading-snug truncate",
            status === "completed"
              ? "text-[#8A9BB5] line-through decoration-[#8A9BB5]/50"
              : status === "in_progress"
              ? "text-[#E2E8F0] font-600"
              : "text-[#8A9BB5]",
          ].join(" ")}
        >
          {lesson.title}
        </span>
      </div>

      {/* Duration + chevron */}
      <div className="flex shrink-0 items-center gap-2">
        <div className="flex items-center gap-1 text-[11px] text-[#8A9BB5]">
          <Clock size={11} strokeWidth={1.8} />
          <span>{duration}</span>
        </div>
        {!isLocked && (
          <ChevronRight size={15} className="text-[#8A9BB5]" />
        )}
      </div>
    </div>
  );

  if (isLocked) {
    return <div aria-disabled="true">{content}</div>;
  }

  return (
    <Link
      href={`/app/lesson/${lesson.id}`}
      aria-label={`Урок ${index + 1}: ${lesson.title}`}
    >
      {content}
    </Link>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────── */
export default async function CoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  /* 1. Auth ───────────────────────────────────────────────────────── */
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  /* 2. Fetch course ───────────────────────────────────────────────── */
  const { data: course } = await supabase
    .from("courses")
    .select("id, title, description, category, image_url, order")
    .eq("id", id)
    .single<Course>();

  if (!course) notFound();

  /* 3. Fetch lessons ──────────────────────────────────────────────── */
  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, course_id, title, content, order")
    .eq("course_id", id)
    .order("order", { ascending: true });

  const lessonList: Lesson[] = lessons ?? [];

  /* 4. Fetch user_progress ────────────────────────────────────────── */
  const { data: progressRow } = await supabase
    .from("user_progress")
    .select("status, score, completed_at")
    .eq("user_id", user.id)
    .eq("course_id", id)
    .single<UserProgress>();

  const progress: UserProgress = progressRow ?? {
    status: "not_started",
    score: 0,
    completed_at: null,
  };

  /* 5. Derived values ─────────────────────────────────────────────── */
  const lessonStatuses = getLessonStatuses(lessonList, progress);
  const completedCount = lessonStatuses.filter((s) => s === "completed").length;
  const progressPct =
    lessonList.length > 0
      ? Math.round((completedCount / lessonList.length) * 100)
      : 0;
  const allCompleted =
    lessonList.length > 0 && completedCount === lessonList.length;

  // First incomplete lesson for CTA
  const firstIncompleteIndex = lessonStatuses.findIndex(
    (s) => s !== "completed"
  );
  const ctaLesson =
    firstIncompleteIndex === -1
      ? lessonList[lessonList.length - 1]
      : lessonList[firstIncompleteIndex];

  const ctaLabel =
    progress.status === "not_started"
      ? "Почати курс"
      : progress.status === "completed"
      ? "Переглянути знову"
      : "Продовжити навчання";

  const catStyle = getCatStyle(course.category);

  /* 6. Render ─────────────────────────────────────────────────────── */
  return (
    <div
      className="min-h-dvh pb-28"
      style={{ background: "#0D1B3E" }}
    >
      {/* ── Hero image ─────────────────────────────────────────────── */}
      <div className="relative h-52 w-full overflow-hidden bg-[#1A2C5B]">
        {course.image_url ? (
          <Image
            src={course.image_url}
            alt={course.title}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#223570] to-[#0D1B3E]">
            <BookOpen size={56} className="text-[#8A9BB5] opacity-30" />
          </div>
        )}

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D1B3E] via-[#0D1B3E]/40 to-transparent" />

        {/* Back button — top left */}
        <div className="absolute left-4 top-12">
          <BackButton />
        </div>

        {/* Category badge — top right */}
        <div className="absolute right-4 top-12">
          <span
            className="rounded-full px-3 py-1 text-[11px] font-700 uppercase tracking-wide backdrop-blur-sm"
            style={{ background: catStyle.bg, color: catStyle.text }}
          >
            {course.category}
          </span>
        </div>
      </div>

      {/* ── Course info ─────────────────────────────────────────────── */}
      <div className="px-4 -mt-2 space-y-5">
        {/* Title + meta */}
        <div className="space-y-2">
          <h1 className="text-xl font-800 leading-snug text-[#E2E8F0]">
            {course.title}
          </h1>

          <div className="flex items-center gap-4 text-xs text-[#8A9BB5]">
            <span className="flex items-center gap-1">
              <BookOpen size={12} strokeWidth={1.8} />
              {lessonList.length} уроків
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} strokeWidth={1.8} />
              ~{Math.max(10, lessonList.length * 7)} хв
            </span>
            {allCompleted && (
              <span className="flex items-center gap-1 text-green-400">
                <Trophy size={12} />
                Завершено
              </span>
            )}
          </div>

          <p className="text-sm leading-relaxed text-[#8A9BB5]">
            {course.description}
          </p>
        </div>

        {/* Progress bar */}
        {progress.status !== "not_started" && (
          <div
            className="rounded-xl p-4 space-y-2"
            style={{
              background: "#1A2C5B",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-500 text-[#8A9BB5]">Прогрес курсу</span>
              <span
                className="font-700"
                style={{ color: allCompleted ? "#22C55E" : "#F97316" }}
              >
                {completedCount} / {lessonList.length} уроків ({progressPct}%)
              </span>
            </div>
            <Progress
              value={progressPct}
              className="h-2 rounded-full bg-[#0D1B3E]"
              style={
                {
                  "--progress-foreground": allCompleted ? "#22C55E" : "#F97316",
                } as React.CSSProperties
              }
            />
            {allCompleted && progress.completed_at && (
              <p className="text-[11px] text-green-400">
                Завершено{" "}
                {new Date(progress.completed_at).toLocaleDateString("uk-UA", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
        )}

        {/* ── CTA button ───────────────────────────────────────────── */}
        {ctaLesson && (
          <Link
            href={`/app/lesson/${ctaLesson.id}`}
            id="course-cta"
            aria-label={ctaLabel}
            className={[
              "flex w-full items-center justify-center gap-2 rounded-full py-4",
              "text-[15px] font-700 text-white transition-all duration-200",
              "bg-[#F97316] hover:bg-[#EA6C10]",
              "hover:shadow-[0_0_28px_rgba(249,115,22,0.5)]",
              "active:scale-[0.97]",
            ].join(" ")}
          >
            <Zap size={18} fill="white" />
            {ctaLabel}
          </Link>
        )}

        {/* ── Lessons list ─────────────────────────────────────────── */}
        <section aria-labelledby="lessons-heading">
          <h2
            id="lessons-heading"
            className="mb-3 text-[15px] font-700 text-[#E2E8F0]"
          >
            Уроки курсу
          </h2>

          <div
            className="overflow-hidden rounded-2xl"
            style={{
              background: "#1A2C5B",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            {lessonList.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <BookOpen size={36} className="text-[#8A9BB5] opacity-30" />
                <p className="text-sm text-[#8A9BB5]">
                  Уроки поки не додані
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[rgba(255,255,255,0.04)]">
                {lessonList.map((lesson, i) => (
                  <LessonRow
                    key={lesson.id}
                    lesson={lesson}
                    index={i}
                    status={lessonStatuses[i]}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── Take quiz button ─────────────────────────────────────── */}
        <div className="pb-4">
          {allCompleted ? (
            <Link
              href={`/app/quiz/${course.id}`}
              id="course-quiz-btn"
              aria-label="Пройти тест з курсу"
              className={[
                "flex w-full items-center justify-center gap-2 rounded-full py-4",
                "text-[15px] font-700 text-white transition-all duration-200",
                "bg-gradient-to-r from-[#7C3AED] to-[#4F46E5]",
                "hover:shadow-[0_0_28px_rgba(124,58,237,0.5)]",
                "active:scale-[0.97]",
              ].join(" ")}
            >
              <Trophy size={18} />
              Пройти тест
            </Link>
          ) : (
            <div
              className="flex w-full items-center justify-center gap-2 rounded-full py-4 cursor-not-allowed"
              aria-disabled="true"
              title="Завершіть усі уроки, щоб пройти тест"
              style={{
                background: "#1A2C5B",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <Lock size={16} className="text-[#8A9BB5]" />
              <span className="text-sm font-600 text-[#8A9BB5]">
                Пройти тест
              </span>
              <span className="ml-1 rounded-full bg-[#0D1B3E] px-2 py-0.5 text-[10px] text-[#8A9BB5]">
                Завершіть усі уроки
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
