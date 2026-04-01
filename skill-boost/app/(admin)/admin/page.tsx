import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase-server";
import AdminClient, {
  type Course,
  type Lesson,
  type AdminStats,
} from "@/components/admin-client";

export const metadata: Metadata = {
  title: "Адмін-панель | Skill Boost",
  description: "Управління курсами, уроками та статистикою платформи.",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const supabase = await createClient();

  /* 1. Auth + role check ──────────────────────────────────────────── */
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/app/dashboard");
  }

  /* 2. Fetch courses ──────────────────────────────────────────────── */
  const { data: coursesRaw } = await supabase
    .from("courses")
    .select("id, title, description, category, image_url, order")
    .order("order", { ascending: true });

  /* 3. Fetch all lessons ──────────────────────────────────────────── */
  const { data: lessonsRaw } = await supabase
    .from("lessons")
    .select("id, course_id, title, content, order")
    .order("order", { ascending: true });

  const lessons: Lesson[] = (lessonsRaw ?? []).map((l) => ({
    id: l.id,
    course_id: l.course_id,
    title: l.title,
    content: l.content,
    order: l.order,
  }));

  // Count lessons per course
  const lessonCountByCourse = lessons.reduce<Record<string, number>>(
    (acc, l) => {
      acc[l.course_id] = (acc[l.course_id] ?? 0) + 1;
      return acc;
    },
    {}
  );

  const courses: Course[] = (coursesRaw ?? []).map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description ?? "",
    category: c.category,
    image_url: c.image_url,
    order: c.order,
    lesson_count: lessonCountByCourse[c.id] ?? 0,
  }));

  /* 4. Stats ──────────────────────────────────────────────────────── */

  // Total users
  const { count: totalUsers } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true });

  // Total completed course sessions
  const { count: totalCompleted } = await supabase
    .from("user_progress")
    .select("id", { count: "exact", head: true })
    .eq("status", "completed");

  // Top 3 courses by completion count
  const { data: progressRows } = await supabase
    .from("user_progress")
    .select("course_id")
    .eq("status", "completed");

  // Count completions per course
  const completionCount = (progressRows ?? []).reduce<Record<string, number>>(
    (acc, row) => {
      acc[row.course_id] = (acc[row.course_id] ?? 0) + 1;
      return acc;
    },
    {}
  );

  // Sort and take top 3
  const top3CourseIds = Object.entries(completionCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([id]) => id);

  const topCourses = top3CourseIds.map((id) => {
    const course = courses.find((c) => c.id === id);
    return {
      id,
      title: course?.title ?? "Невідомий курс",
      completions: completionCount[id] ?? 0,
    };
  });

  const stats: AdminStats = {
    totalUsers: totalUsers ?? 0,
    totalCompleted: totalCompleted ?? 0,
    topCourses,
  };

  /* 5. Render ─────────────────────────────────────────────────────── */
  return (
    <AdminClient
      courses={courses}
      lessons={lessons}
      stats={stats}
    />
  );
}
