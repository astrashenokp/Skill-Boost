import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase-server";
import LessonClient from "@/components/lesson-client";

/* ─── Types ──────────────────────────────────────────────────────────── */
interface LessonRow {
  id: string;
  course_id: string;
  title: string;
  content: string | null;
  order: number;
}

interface FlashcardRow {
  id: string;
  lesson_id: string;
  front: string;
  back: string;
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
    .from("lessons")
    .select("title")
    .eq("id", id)
    .single<Pick<LessonRow, "title">>();

  return {
    title: data?.title
      ? `${data.title} | Skill Boost`
      : "Урок | Skill Boost",
    description: "Читай, слухай та запам'ятовуй матеріал уроку.",
  };
}

/* ─── Page ───────────────────────────────────────────────────────────── */
export default async function LessonPage({
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

  /* 2. Fetch lesson ───────────────────────────────────────────────── */
  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, course_id, title, content, order")
    .eq("id", id)
    .single<LessonRow>();

  if (!lesson) notFound();

  /* 3. Fetch all lessons in this course (for prev/next + total count) */
  const { data: allLessons } = await supabase
    .from("lessons")
    .select("id, title, order")
    .eq("course_id", lesson.course_id)
    .order("order", { ascending: true });

  const siblings: Pick<LessonRow, "id" | "title" | "order">[] =
    allLessons ?? [];

  const currentIndex = siblings.findIndex((l) => l.id === lesson.id);
  const prevLesson = currentIndex > 0 ? siblings[currentIndex - 1] : null;
  const nextLesson =
    currentIndex < siblings.length - 1 ? siblings[currentIndex + 1] : null;

  /* 4. Fetch flashcards for this lesson ──────────────────────────── */
  const { data: flashcardRows } = await supabase
    .from("flashcards")
    .select("id, lesson_id, front, back")
    .eq("lesson_id", lesson.id);

  const flashcards: FlashcardRow[] = flashcardRows ?? [];

  /* 5. Render ─────────────────────────────────────────────────────── */
  return (
    <LessonClient
      lessonId={lesson.id}
      courseId={lesson.course_id}
      title={lesson.title}
      content={lesson.content ?? ""}
      flashcards={flashcards.map((fc) => ({
        id: fc.id,
        front: fc.front,
        back: fc.back,
      }))}
      prevLesson={
        prevLesson
          ? { id: prevLesson.id, title: prevLesson.title, order: prevLesson.order }
          : null
      }
      nextLesson={
        nextLesson
          ? { id: nextLesson.id, title: nextLesson.title, order: nextLesson.order }
          : null
      }
      totalLessons={siblings.length}
      lessonOrder={lesson.order}
    />
  );
}
