import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase-server";
import SkillCard from "@/components/ui/skill-card";
import {
  BookOpen,
  Award,
  CalendarDays,
  ChevronRight,
  Zap,
  Star,
  TrendingUp,
  User,
  Flame,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Головна | Skill Boost",
  description: "Ваш персональний дашборд навчання.",
};

/* ─── Helpers ────────────────────────────────────────────────────────── */
const DIRECTION_TO_CATEGORY: Record<string, string> = {
  it:         "IT",
  marketing:  "Маркетинг",
  finance:    "Фінанси",
  design:     "Дизайн",
  management: "Менеджмент",
};

function getCurrentGreeting(): string {
  const h = new Date().getHours();
  if (h < 6)  return "Добраніч";
  if (h < 12) return "Доброго ранку";
  if (h < 18) return "Добрий день";
  return "Добрий вечір";
}

function formatFullDate(): string {
  return new Date().toLocaleDateString("uk-UA", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function daysSince(iso: string): number {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(1, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ─── Metric card ────────────────────────────────────────────────────── */
interface MetricCardProps {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  accent?: string;
  sublabel?: string;
}

function MetricCard({ icon, value, label, accent = "#F97316", sublabel }: MetricCardProps) {
  return (
    <div
      className="flex flex-1 flex-col items-center gap-1.5 rounded-2xl px-3 py-4 text-center"
      style={{
        background: "#1A2C5B",
        border: "1px solid rgba(255,255,255,0.05)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
      }}
    >
      <div
        className="flex h-9 w-9 items-center justify-center rounded-full"
        style={{ background: `${accent}18` }}
      >
        <span style={{ color: accent }}>{icon}</span>
      </div>
      <span
        className="text-2xl font-800 leading-none"
        style={{ color: accent }}
      >
        {value}
      </span>
      <span className="text-[11px] font-500 leading-snug text-[#8A9BB5]">
        {label}
      </span>
      {sublabel && (
        <span className="text-[10px] text-[#8A9BB5] opacity-60">{sublabel}</span>
      )}
    </div>
  );
}

/* ─── Section heading ────────────────────────────────────────────────── */
function SectionHead({
  title,
  href,
  linkLabel = "Всі",
}: {
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-[15px] font-700 text-[#E2E8F0]">{title}</h2>
      {href && (
        <Link
          href={href}
          className="flex items-center gap-0.5 text-xs font-600 text-[#F97316] transition-opacity hover:opacity-70"
        >
          {linkLabel}
          <ChevronRight size={13} />
        </Link>
      )}
    </div>
  );
}

/* ─── Quick link button ──────────────────────────────────────────────── */
function QuickLink({
  href,
  label,
  emoji,
  description,
  accent = false,
}: {
  href: string;
  label: string;
  emoji: string;
  description: string;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all duration-200",
        "active:scale-[0.98] hover:scale-[1.01]",
        accent
          ? "border border-[#F97316]/30 bg-[#F97316]/10 hover:bg-[#F97316]/15"
          : "border border-[rgba(255,255,255,0.06)] bg-[#1A2C5B] hover:border-[#F97316]/30",
      ].join(" ")}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl"
        style={{ background: accent ? "rgba(249,115,22,0.2)" : "#0D1B3E" }}
      >
        {emoji}
      </span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-600 ${accent ? "text-[#F97316]" : "text-[#E2E8F0]"}`}>
          {label}
        </p>
        <p className="text-xs text-[#8A9BB5]">{description}</p>
      </div>
      <ChevronRight size={16} className={accent ? "text-[#F97316]" : "text-[#8A9BB5]"} />
    </Link>
  );
}

/* ─── Empty state ────────────────────────────────────────────────────── */
function EmptyState({ emoji, text, href, cta }: {
  emoji: string;
  text: string;
  href: string;
  cta: string;
}) {
  return (
    <div
      className="flex flex-col items-center gap-3 rounded-2xl py-8 text-center"
      style={{ background: "#1A2C5B", border: "1px solid rgba(255,255,255,0.05)" }}
    >
      <span className="text-4xl">{emoji}</span>
      <p className="text-sm text-[#8A9BB5]">{text}</p>
      <Link
        href={href}
        className="flex items-center gap-1 rounded-full bg-[#F97316]/15 px-4 py-2 text-xs font-600 text-[#F97316] hover:bg-[#F97316]/25 transition-colors"
      >
        {cta} <ChevronRight size={13} />
      </Link>
    </div>
  );
}

/* ─── Dashboard Page ─────────────────────────────────────────────────── */
export default async function DashboardPage() {
  const supabase = await createClient();

  /* 1. Auth ───────────────────────────────────────────────────────── */
  const { data: { user } } = await supabase.auth.getUser();

  /* 2. Fetch profile ──────────────────────────────────────────────── */
  let profile = null;
  if (user) {
    const { data } = await supabase
      .from("users")
      .select("name, survey_answers, created_at")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  const firstName = profile?.name
    ? profile.name.trim().split(" ")[0]
    : user?.email?.split("@")[0] ?? "Гість";

  const survey = profile?.survey_answers as
    | { direction?: string; goal?: string; level?: string }
    | null;

  const preferredCategory = survey?.direction
    ? DIRECTION_TO_CATEGORY[survey.direction] ?? null
    : null;

  const daysOnPlatform = profile?.created_at
    ? daysSince(profile.created_at)
    : 1;

  /* 3. Fetch all courses ──────────────────────────────────────────── */
  const { data: allCourses } = await supabase
    .from("courses")
    .select("id, title, description, category, image_url, order")
    .order("order", { ascending: true });

  const courses = allCourses ?? [];

  /* 4. Fetch user_progress ────────────────────────────────────────── */
  let progressRows: any[] = [];
  if (user) {
    const { data } = await supabase
      .from("user_progress")
      .select("course_id, status, score")
      .eq("user_id", user.id);
    progressRows = data ?? [];
  }

  const progressMap = new Map(
    (progressRows ?? []).map((r) => [
      r.course_id,
      { status: r.status as "not_started" | "in_progress" | "completed", score: r.score ?? 0 },
    ])
  );

  /* 5. Fetch lessons count per course ─────────────────────────────── */
  const courseIds = courses.map((c) => c.id);
  let lessonCounts: Record<string, number> = {};
  if (courseIds.length > 0) {
    const { data: lessonRows } = await supabase
      .from("lessons")
      .select("course_id")
      .in("course_id", courseIds);
    lessonCounts = (lessonRows ?? []).reduce<Record<string, number>>((acc, r) => {
      acc[r.course_id] = (acc[r.course_id] ?? 0) + 1;
      return acc;
    }, {});
  }

  /* 6. Fetch certificates count ───────────────────────────────────── */
  let certs: any[] = [];
  if (user) {
    const { data } = await supabase
      .from("certificates")
      .select("id, course_id")
      .eq("user_id", user.id);
    certs = data ?? [];
  }

  const certCount = certs?.length ?? 0;
  const latestCertId = certs?.[0]?.id ?? null;

  /* 7. Derived collections ────────────────────────────────────────── */
  const completedCount = [...progressMap.values()].filter(
    (p) => p.status === "completed"
  ).length;

  // In-progress courses — last 2 most recently started (preserve order)
  const inProgressCourses = courses
    .filter((c) => progressMap.get(c.id)?.status === "in_progress")
    .slice(0, 2);

  // Not-yet-started courses from preferred direction — up to 2
  const recommendedCourses = courses
    .filter(
      (c) =>
        (!progressMap.has(c.id) || progressMap.get(c.id)?.status === "not_started") &&
        (preferredCategory ? c.category === preferredCategory : true)
    )
    .slice(0, 2);

  // If no preferred-category recs, fall back to any not-started
  const fallbackRecs =
    recommendedCourses.length === 0
      ? courses
          .filter((c) => !progressMap.has(c.id) || progressMap.get(c.id)?.status === "not_started")
          .slice(0, 2)
      : recommendedCourses;

  const greeting = getCurrentGreeting();
  const dateStr = capitalize(formatFullDate());

  /* ── Render ──────────────────────────────────────────────────────── */
  return (
    <div className="min-h-dvh pb-28" style={{ background: "#0D1B3E" }}>

      {/* ══ Hero / Greeting header ════════════════════════════════════ */}
      <header
        className="relative overflow-hidden px-4 pb-7 pt-12"
        style={{
          background: "linear-gradient(180deg, #1A2C5B 0%, rgba(13,27,62,0) 100%)",
        }}
      >
        {/* Ambient glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 right-0 h-56 w-56 rounded-full blur-[80px] opacity-15"
          style={{ background: "radial-gradient(circle, #F97316, transparent)" }}
        />

        {/* Zap icon + greeting row */}
        <div className="relative z-10 flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-xl"
                style={{ background: "linear-gradient(135deg, #F97316, #EA580C)" }}
              >
                <Zap size={16} fill="white" className="text-white" />
              </div>
              <span className="text-xs font-600 uppercase tracking-widest text-[#8A9BB5]">
                Skill Boost
              </span>
            </div>
            <h1 className="text-2xl font-800 leading-tight text-[#E2E8F0]">
              {greeting},<br />
              <span
                style={{
                  background: "linear-gradient(135deg, #F97316 0%, #FBBF24 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {firstName}!
              </span>
            </h1>
            <p className="flex items-center gap-1.5 text-xs text-[#8A9BB5]">
              <CalendarDays size={12} />
              {dateStr}
            </p>
          </div>

          {/* Streak / flame badge */}
          <div
            className="flex flex-col items-center gap-0.5 rounded-2xl px-3 py-2.5"
            style={{
              background: "rgba(249,115,22,0.12)",
              border: "1px solid rgba(249,115,22,0.25)",
            }}
          >
            <Flame size={20} className="text-[#F97316]" />
            <span className="text-base font-800 text-[#F97316]">
              {daysOnPlatform}
            </span>
            <span className="text-[9px] font-500 text-[#8A9BB5] leading-none text-center">
              днів<br />з нами
            </span>
          </div>
        </div>

        {/* Motivational pill */}
        {completedCount > 0 && (
          <div
            className="relative z-10 mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5"
            style={{
              background: "rgba(34,197,94,0.1)",
              border: "1px solid rgba(34,197,94,0.25)",
            }}
          >
            <Star size={11} className="text-green-400" fill="currentColor" />
            <span className="text-xs font-600 text-green-400">
              Ти завершив(ла) {completedCount}{" "}
              {completedCount === 1 ? "курс" : completedCount < 5 ? "курси" : "курсів"} — продовжуй!
            </span>
          </div>
        )}
      </header>

      <div className="space-y-7 px-4">

        {/* ══ Stats row ════════════════════════════════════════════════ */}
        <section aria-label="Статистика">
          <div className="flex gap-3">
            <MetricCard
              icon={<BookOpen size={16} />}
              value={completedCount}
              label="Курсів пройдено"
              accent="#22C55E"
            />
            <MetricCard
              icon={<Award size={16} />}
              value={certCount}
              label="Сертифікатів"
              accent="#F97316"
            />
            <MetricCard
              icon={<CalendarDays size={16} />}
              value={daysOnPlatform}
              label="Днів на платформі"
              accent="#818CF8"
            />
          </div>
        </section>

        {/* ══ Continue learning ════════════════════════════════════════ */}
        <section aria-labelledby="continue-heading">
          <div className="mb-3">
            <SectionHead
              title="Продовж навчання"
              href="/app/courses"
              linkLabel="Всі курси"
            />
            {inProgressCourses.length > 0 && (
              <p className="mt-0.5 text-xs text-[#8A9BB5]">
                Ти вже почав — не зупиняйся!
              </p>
            )}
          </div>

          {inProgressCourses.length > 0 ? (
            <div className="flex flex-col gap-4">
              {inProgressCourses.map((course) => {
                const prog = progressMap.get(course.id);
                return (
                  <SkillCard
                    key={course.id}
                    id={course.id}
                    title={course.title}
                    description={course.description}
                    category={course.category}
                    imageUrl={course.image_url ?? undefined}
                    progress={prog?.score ?? 0}
                    status="in_progress"
                    lessonCount={lessonCounts[course.id]}
                  />
                );
              })}
            </div>
          ) : (
            <EmptyState
              emoji="📖"
              text="Ти ще не розпочав жодного курсу"
              href="/app/courses"
              cta="Обрати перший курс"
            />
          )}
        </section>

        {/* ══ Recommended ══════════════════════════════════════════════ */}
        <section aria-labelledby="recommended-heading">
          <div className="mb-3">
            <SectionHead
              title="Рекомендовано для тебе"
              href="/app/courses"
              linkLabel="Більше"
            />
            {preferredCategory && (
              <p className="mt-0.5 text-xs text-[#8A9BB5]">
                На основі твого напряму:{" "}
                <span className="font-600 text-[#F97316]">
                  {preferredCategory}
                </span>
              </p>
            )}
          </div>

          {fallbackRecs.length > 0 ? (
            <div className="flex flex-col gap-4">
              {fallbackRecs.map((course) => (
                <SkillCard
                  key={course.id}
                  id={course.id}
                  title={course.title}
                  description={course.description}
                  category={course.category}
                  imageUrl={course.image_url ?? undefined}
                  progress={0}
                  status="not_started"
                  lessonCount={lessonCounts[course.id]}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              emoji="🌟"
              text="Ти вже розпочав усі рекомендовані курси!"
              href="/app/courses"
              cta="Знайти нові курси"
            />
          )}
        </section>

        {/* ══ Quick links ══════════════════════════════════════════════ */}
        <section aria-labelledby="quicklinks-heading">
          <h2
            id="quicklinks-heading"
            className="mb-3 text-[15px] font-700 text-[#E2E8F0]"
          >
            Швидкий доступ
          </h2>

          <div className="flex flex-col gap-3">
            <QuickLink
              href="/app/courses"
              emoji="🎓"
              label="Каталог курсів"
              description="Всі доступні курси та напрями"
              accent
            />
            <QuickLink
              href="/app/profile"
              emoji="👤"
              label={user ? "Мій профіль" : "Зареєструватися"}
              description={user ? "Прогрес, резюме та налаштування" : "Створіть акаунт для збереження прогресу"}
            />
            {latestCertId ? (
              <QuickLink
                href={`/app/certificate/${latestCertId}`}
                emoji="🏆"
                label="Мій сертифікат"
                description={`${certCount} ${certCount === 1 ? "сертифікат" : certCount < 5 ? "сертифікати" : "сертифікатів"} отримано`}
              />
            ) : (
              <QuickLink
                href="/app/courses"
                emoji="🏆"
                label="Отримати сертифікат"
                description="Завершіть курс, щоб отримати перший"
              />
            )}
          </div>
        </section>

        {/* ══ Motivational footer banner ═══════════════════════════════ */}
        <div
          className="relative overflow-hidden rounded-2xl px-5 py-5"
          style={{
            background: "linear-gradient(135deg, rgba(249,115,22,0.15) 0%, rgba(249,115,22,0.05) 100%)",
            border: "1px solid rgba(249,115,22,0.2)",
          }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full blur-[40px] opacity-20"
            style={{ background: "#F97316" }}
          />
          <div className="relative z-10 flex items-center gap-4">
            <TrendingUp size={32} className="shrink-0 text-[#F97316]" />
            <div>
              <p className="text-sm font-700 text-[#E2E8F0]">
                Кожен урок — крок до цілі 🚀
              </p>
              <p className="mt-0.5 text-xs text-[#8A9BB5]">
                Продовжуй навчатись щодня, щоб досягти успіху
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
