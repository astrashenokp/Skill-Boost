import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase-server";
import CoursesClient, {
  type CourseWithProgress,
  type CategoryStat,
} from "@/components/courses-client";

export const metadata: Metadata = {
  title: "Навчання | Skill Boost",
  description: "Каталог курсів. Обирай напрям і починай навчання.",
};

/* ─── Direction → category mapping ──────────────────────────────────── */
/** Maps survey direction value → course category label */
const DIRECTION_TO_CATEGORY: Record<string, string> = {
  it:         "IT",
  marketing:  "Маркетинг",
  finance:    "Фінанси",
  design:     "Дизайн",
  management: "Менеджмент",
};

/* ─── Category visual config ─────────────────────────────────────────── */
const CATEGORY_CONFIG: Record<
  string,
  { label: string; emoji: string; color: string }
> = {
  IT:         { label: "IT",         emoji: "💻", color: "#818CF8" },
  Маркетинг:  { label: "Маркетинг",  emoji: "📣", color: "#F472B6" },
  Фінанси:    { label: "Фінанси",    emoji: "💰", color: "#2DD4BF" },
  Дизайн:     { label: "Дизайн",    emoji: "🎨", color: "#FACC15" },
  Менеджмент: { label: "Менеджмент", emoji: "📊", color: "#60A5FA" },
};

/* ─── Lesson count fetcher ───────────────────────────────────────────── */
async function fetchLessonCounts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  courseIds: string[]
): Promise<Record<string, number>> {
  if (courseIds.length === 0) return {};

  const { data, error } = await supabase
    .from("lessons")
    .select("course_id")
    .in("course_id", courseIds);

  if (error || !data) return {};

  return data.reduce<Record<string, number>>((acc, row) => {
    acc[row.course_id] = (acc[row.course_id] ?? 0) + 1;
    return acc;
  }, {});
}

/* ─── Page ───────────────────────────────────────────────────────────── */
export default async function CoursesPage() {
  const supabase = await createClient();

  /* 1. Auth check ─────────────────────────────────────────────────── */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  /* 2. Fetch user profile (survey_answers) ───────────────────────── */
  let profile = null;
  if (user) {
    const { data } = await supabase
      .from("users")
      .select("survey_answers")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  const surveyAnswers = profile?.survey_answers as
    | { direction?: string; goal?: string; level?: string }
    | null;

  const preferredCategory = surveyAnswers?.direction
    ? DIRECTION_TO_CATEGORY[surveyAnswers.direction] ?? null
    : null;

  /* 3. Fetch all courses ──────────────────────────────────────────── */
  const { data: rawCourses, error: coursesError } = await supabase
    .from("courses")
    .select("id, title, description, category, image_url, order")
    .order("order", { ascending: true });

  if (coursesError || !rawCourses) {
    // Return empty state — don't crash
    return (
      <CoursesClient
        courses={[]}
        categoryStats={[]}
        recommendedDirection={preferredCategory}
      />
    );
  }

  /* 4. Fetch user_progress for this user ─────────────────────────── */
  let progressRows: any[] = [];
  if (user) {
    const { data } = await supabase
      .from("user_progress")
      .select("course_id, status, score")
      .eq("user_id", user.id);
    progressRows = data ?? [];
  }

  // Build a quick lookup map: course_id → { status, score }
  const progressMap = new Map<
    string,
    { status: "not_started" | "in_progress" | "completed"; score: number }
  >(
    (progressRows ?? []).map((row) => [
      row.course_id,
      {
        status: row.status as "not_started" | "in_progress" | "completed",
        score: row.score ?? 0,
      },
    ])
  );

  /* 5. Fetch lesson counts ──────────────────────────────────────────── */
  const courseIds = rawCourses.map((c) => c.id);
  const lessonCounts = await fetchLessonCounts(supabase, courseIds);

  /* 6. Compute per-category progress stats ───────────────────────── */
  // Group courses by category
  const categoryGroups = rawCourses.reduce<Record<string, string[]>>(
    (acc, course) => {
      if (!acc[course.category]) acc[course.category] = [];
      acc[course.category].push(course.id);
      return acc;
    },
    {}
  );

  const categoryStats: CategoryStat[] = Object.entries(categoryGroups)
    .filter(([cat]) => CATEGORY_CONFIG[cat]) // only known categories
    .map(([cat, ids]) => {
      const config = CATEGORY_CONFIG[cat];
      const completed = ids.filter(
        (id) => progressMap.get(id)?.status === "completed"
      ).length;
      const pct = ids.length > 0 ? Math.round((completed / ids.length) * 100) : 0;
      return {
        category: cat,
        label: config.label,
        emoji: config.emoji,
        pct,
        color: config.color,
      };
    })
    .slice(0, 4); // show max 4 rings

  /* 7. Build CourseWithProgress array ───────────────────────────── */
  // Sort: preferred category first, then by `order`
  const sorted = [...rawCourses].sort((a, b) => {
    const aMatch = preferredCategory && a.category === preferredCategory ? 0 : 1;
    const bMatch = preferredCategory && b.category === preferredCategory ? 0 : 1;
    if (aMatch !== bMatch) return aMatch - bMatch;
    return a.order - b.order;
  });

  const courses: CourseWithProgress[] = sorted.map((course, index) => {
    const prog = progressMap.get(course.id);
    const status = prog?.status ?? "not_started";
    const score = prog?.score ?? 0;

    return {
      id: course.id,
      title: course.title,
      description: course.description,
      category: course.category,
      image_url: course.image_url,
      order: course.order,
      progress: score,
      status,
      lessonCount: lessonCounts[course.id] ?? 0,
      // Mark as recommended: matches preferred category AND is in top 3 of sorted list
      isRecommended:
        preferredCategory !== null &&
        course.category === preferredCategory &&
        index < 3,
    };
  });

  /* 8. Render ─────────────────────────────────────────────────────── */
  return (
    <CoursesClient
      courses={courses}
      categoryStats={categoryStats}
      recommendedDirection={preferredCategory}
    />
  );
}
