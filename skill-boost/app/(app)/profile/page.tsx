import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase-server";
import { LogoutButton, PrintResumeButton } from "@/components/profile-actions";
import {
  Award,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  MapPin,
  Zap,
  ChevronRight,
  User,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Профіль | Skill Boost",
  description: "Ваш особистий кабінет, прогрес та сертифікати.",
};

/* ─── Print + resume styles ──────────────────────────────────────────── */
const PRINT_STYLES = `
  @media print {
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    html, body { background: #fff !important; color: #111 !important; font-family: Georgia, serif; margin: 0; padding: 0; }
    .no-print { display: none !important; }
    .print-hidden { display: none !important; }
    .resume-section { display: block !important; }
    .print-page { padding: 32px 48px !important; max-width: 100% !important; background: #fff !important; }
    .resume-title { font-size: 28px; font-weight: 700; color: #0D1B3E; border-bottom: 3px solid #F97316; padding-bottom: 8px; margin-bottom: 20px; }
    .resume-subtitle { font-size: 14px; color: #666; margin-bottom: 24px; }
    .resume-section-heading { font-size: 16px; font-weight: 700; color: #0D1B3E; border-left: 4px solid #F97316; padding-left: 10px; margin: 20px 0 10px; }
    .resume-skill-item { font-size: 14px; color: #333; margin-bottom: 6px; display: flex; align-items: center; gap: 8px; }
    .resume-skill-item::before { content: "✓"; color: #F97316; font-weight: 700; }
    .resume-footer { margin-top: 40px; font-size: 11px; color: #aaa; text-align: center; border-top: 1px solid #eee; padding-top: 12px; }
  }
  @page { size: A4 portrait; margin: 0; }
`;

/* ─── Category config ────────────────────────────────────────────────── */
const CATEGORIES = [
  { key: "IT",         label: "IT",         emoji: "💻", color: "#818CF8" },
  { key: "Маркетинг",  label: "Маркетинг",  emoji: "📣", color: "#F472B6" },
  { key: "Фінанси",    label: "Фінанси",    emoji: "💰", color: "#2DD4BF" },
  { key: "Дизайн",     label: "Дизайн",     emoji: "🎨", color: "#FACC15" },
  { key: "Менеджмент", label: "Менеджмент", emoji: "📊", color: "#60A5FA" },
];

const DIRECTION_LABELS: Record<string, string> = {
  it:         "IT",
  marketing:  "Маркетинг",
  finance:    "Фінанси",
  design:     "Дизайн",
  management: "Менеджмент",
};

const GOAL_LABELS: Record<string, string> = {
  new_job:   "Нова робота",
  promotion: "Підвищення",
  business:  "Власний бізнес",
  self_dev:  "Саморозвиток",
};

/* ─── SVG Circular Ring ──────────────────────────────────────────────── */
function CircleRing({
  pct,
  color,
  label,
  emoji,
  size = 80,
}: {
  pct: number;
  color: string;
  label: string;
  emoji: string;
  size?: number;
}) {
  const sw = 6;
  const r = (size - sw * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ transform: "rotate(-90deg)" }}
          aria-hidden="true"
        >
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#0D1B3E" strokeWidth={sw} />
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke={color}
            strokeWidth={sw}
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg leading-none">{emoji}</span>
          <span className="mt-0.5 text-[11px] font-800 leading-none" style={{ color }}>
            {pct}%
          </span>
        </div>
      </div>
      <span className="max-w-[72px] text-center text-[10px] font-500 leading-snug text-[#8A9BB5]">
        {label}
      </span>
    </div>
  );
}

/* ─── Initials avatar ────────────────────────────────────────────────── */
function InitialsAvatar({ name, size = 72 }: { name: string; size?: number }) {
  const parts = name.trim().split(" ");
  const initials = parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : parts[0].slice(0, 2).toUpperCase();

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-800 text-white select-none"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.3,
        background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)",
        boxShadow: "0 8px 24px rgba(249,115,22,0.4)",
      }}
      aria-label={`Аватар: ${name}`}
    >
      {initials}
    </div>
  );
}

/* ─── Section card ───────────────────────────────────────────────────── */
function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl p-5 ${className}`}
      style={{
        background: "#1A2C5B",
        border: "1px solid rgba(255,255,255,0.05)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
      }}
    >
      {children}
    </div>
  );
}

/* ─── Profile Page ───────────────────────────────────────────────────── */
export default async function ProfilePage() {
  const supabase = await createClient();

  /* 1. Auth ───────────────────────────────────────────────────────── */
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  /* 2. Fetch profile ──────────────────────────────────────────────── */
  const { data: profile } = await supabase
    .from("users")
    .select("name, email, role, survey_answers, created_at")
    .eq("id", user.id)
    .single();

  const name: string = profile?.name ?? user.email?.split("@")[0] ?? "Студент";
  const email: string = profile?.email ?? user.email ?? "";
  const survey = profile?.survey_answers as
    | { direction?: string; goal?: string; level?: string }
    | null;

  const directionLabel = survey?.direction
    ? DIRECTION_LABELS[survey.direction] ?? survey.direction
    : null;
  const goalLabel = survey?.goal
    ? GOAL_LABELS[survey.goal] ?? survey.goal
    : null;

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("uk-UA", {
        month: "long",
        year: "numeric",
      })
    : null;

  /* 3. Fetch all courses ──────────────────────────────────────────── */
  const { data: allCourses } = await supabase
    .from("courses")
    .select("id, title, category");

  const courses = allCourses ?? [];

  /* 4. Fetch user_progress ────────────────────────────────────────── */
  const { data: progressRows } = await supabase
    .from("user_progress")
    .select("course_id, status, score")
    .eq("user_id", user.id);

  const progressMap = new Map(
    (progressRows ?? []).map((r) => [
      r.course_id,
      { status: r.status as string, score: r.score ?? 0 },
    ])
  );

  /* 5. Fetch certificates ─────────────────────────────────────────── */
  const { data: certsData } = await supabase
    .from("certificates")
    .select("id, course_id, issued_at, qr_url")
    .eq("user_id", user.id)
    .order("issued_at", { ascending: false });

  const certificates = certsData ?? [];
  const certsByCourseId = new Map(
    certificates.map((c) => [c.course_id, c])
  );

  /* 6. Compute category stats ─────────────────────────────────────── */
  const categoryStats = CATEGORIES.map((cat) => {
    const catCourses = courses.filter((c) => c.category === cat.key);
    const completedCount = catCourses.filter(
      (c) => progressMap.get(c.id)?.status === "completed"
    ).length;
    const pct = catCourses.length > 0
      ? Math.round((completedCount / catCourses.length) * 100)
      : 0;
    return { ...cat, pct, total: catCourses.length, completed: completedCount };
  });

  /* 7. Completed courses for certificates + resume ─────────────────── */
  const completedCourses = courses.filter(
    (c) => progressMap.get(c.id)?.status === "completed"
  );

  const totalCompleted = completedCourses.length;
  const inProgressCount = courses.filter(
    (c) => progressMap.get(c.id)?.status === "in_progress"
  ).length;

  /* ── Render ──────────────────────────────────────────────────────── */
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />

      <div
        className="min-h-dvh pb-28 print-page"
        style={{ background: "#0D1B3E" }}
      >
        {/* ══ SECTION 1: User header ════════════════════════════════ */}
        <header
          className="no-print relative overflow-hidden px-4 pb-6 pt-12"
          style={{
            background: "linear-gradient(180deg, #1A2C5B 0%, #0D1B3E 100%)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          {/* Ambient glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-16 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full blur-[60px] opacity-20"
            style={{ background: "radial-gradient(circle, #F97316, transparent)" }}
          />

          <div className="relative z-10 flex items-start justify-between gap-4">
            {/* Left: avatar + info */}
            <div className="flex items-center gap-4">
              <InitialsAvatar name={name} size={68} />
              <div className="min-w-0 space-y-1">
                <h1 className="text-xl font-800 leading-tight text-[#E2E8F0]">
                  {name}
                </h1>
                <p className="text-sm text-[#8A9BB5] truncate">{email}</p>
                {memberSince && (
                  <p className="flex items-center gap-1 text-[11px] text-[#8A9BB5]">
                    <User size={10} />
                    З {memberSince}
                  </p>
                )}
                {/* Direction badge */}
                {directionLabel && (
                  <span
                    className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-700 uppercase tracking-wide"
                    style={{ background: "rgba(249,115,22,0.15)", color: "#F97316" }}
                  >
                    {directionLabel}
                  </span>
                )}
              </div>
            </div>

            {/* Right: logout */}
            <LogoutButton />
          </div>

          {/* Stats row */}
          <div className="relative z-10 mt-5 grid grid-cols-3 divide-x divide-[rgba(255,255,255,0.06)]">
            {[
              { label: "Завершено", value: totalCompleted, icon: "✅" },
              { label: "В процесі",  value: inProgressCount,  icon: "⏳" },
              { label: "Сертифікатів", value: certificates.length, icon: "🏆" },
            ].map(({ label, value, icon }) => (
              <div key={label} className="flex flex-col items-center gap-0.5 px-2">
                <span className="text-lg">{icon}</span>
                <span className="text-xl font-800 text-[#E2E8F0]">{value}</span>
                <span className="text-[10px] text-[#8A9BB5]">{label}</span>
              </div>
            ))}
          </div>
        </header>

        <div className="space-y-5 px-4 pt-5">
          {/* ══ SECTION 2: Category progress rings ════════════════ */}
          <section aria-labelledby="progress-rings-heading" className="no-print">
            <h2
              id="progress-rings-heading"
              className="section-title mb-3 text-[15px] font-700 text-[#E2E8F0]"
            >
              Прогрес за напрямами
            </h2>
            <SectionCard>
              <div className="flex items-start justify-around gap-2 py-2">
                {categoryStats.map((cat) => (
                  <CircleRing
                    key={cat.key}
                    pct={cat.pct}
                    color={cat.color}
                    label={cat.label}
                    emoji={cat.emoji}
                    size={76}
                  />
                ))}
              </div>
              {/* Totals row */}
              <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-[#8A9BB5]">
                <CheckCircle2 size={12} className="text-green-400" />
                <span>
                  {totalCompleted} з {courses.length} курсів завершено
                </span>
              </div>
            </SectionCard>
          </section>

          {/* ══ SECTION 3: Certificates ═══════════════════════════ */}
          <section aria-labelledby="certs-heading" className="no-print">
            <div className="mb-3 flex items-center justify-between">
              <h2
                id="certs-heading"
                className="text-[15px] font-700 text-[#E2E8F0]"
              >
                Мої сертифікати
              </h2>
              <span className="text-xs text-[#8A9BB5]">
                {certificates.length} шт.
              </span>
            </div>

            {certificates.length > 0 ? (
              <div
                className="flex gap-4 overflow-x-auto pb-3"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {certificates.map((cert) => {
                  const course = courses.find((c) => c.id === cert.course_id);
                  const issuedDate = new Date(cert.issued_at).toLocaleDateString("uk-UA", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });
                  const catConf = CATEGORIES.find(
                    (cat) => cat.key === course?.category
                  );

                  return (
                    <div
                      key={cert.id}
                      className="shrink-0 w-56 rounded-2xl overflow-hidden transition-transform duration-200 hover:scale-[1.02]"
                      style={{
                        background: "linear-gradient(145deg, #1A2C5B, #223570)",
                        border: "1px solid rgba(249,115,22,0.25)",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                      }}
                    >
                      {/* Card header */}
                      <div
                        className="flex items-center gap-2 px-3 py-2"
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                      >
                        <Award size={14} className="text-[#F97316]" />
                        <span className="text-[10px] font-700 uppercase tracking-wide text-[#F97316]">
                          Сертифікат
                        </span>
                      </div>

                      <div className="flex gap-3 p-3">
                        {/* QR thumbnail */}
                        {cert.qr_url && (
                          <div
                            className="shrink-0 overflow-hidden rounded-lg p-1"
                            style={{ background: "#fff" }}
                          >
                            <Image
                              src={cert.qr_url}
                              alt="QR сертифікату"
                              width={52}
                              height={52}
                              unoptimized
                            />
                          </div>
                        )}

                        {/* Info */}
                        <div className="flex flex-1 flex-col justify-between min-w-0">
                          <div>
                            {catConf && (
                              <span
                                className="text-[9px] font-700 uppercase"
                                style={{ color: catConf.color }}
                              >
                                {catConf.emoji} {catConf.label}
                              </span>
                            )}
                            <p className="mt-0.5 text-xs font-600 leading-snug text-[#E2E8F0] line-clamp-2">
                              {course?.title ?? "Курс"}
                            </p>
                          </div>
                          <p className="text-[10px] text-[#8A9BB5]">{issuedDate}</p>
                        </div>
                      </div>

                      {/* View link */}
                      <Link
                        href={`/app/certificate/${cert.id}`}
                        className="flex items-center justify-between px-3 py-2.5 text-[11px] font-600 text-[#F97316] transition-colors hover:bg-[#F97316]/10"
                        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
                        aria-label={`Переглянути сертифікат: ${course?.title}`}
                      >
                        Переглянути
                        <ExternalLink size={12} />
                      </Link>
                    </div>
                  );
                })}
              </div>
            ) : (
              <SectionCard>
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <span className="text-4xl">🎓</span>
                  <p className="text-sm font-600 text-[#E2E8F0]">
                    Поки немає сертифікатів
                  </p>
                  <p className="text-xs text-[#8A9BB5]">
                    Завершіть курс та пройдіть тест, щоб отримати сертифікат
                  </p>
                  <Link
                    href="/app/courses"
                    className="mt-1 flex items-center gap-1 rounded-full bg-[#F97316]/15 px-4 py-2 text-xs font-600 text-[#F97316] hover:bg-[#F97316]/25 transition-colors"
                  >
                    До курсів <ChevronRight size={13} />
                  </Link>
                </div>
              </SectionCard>
            )}
          </section>

          {/* ══ SECTION 4: Resume ════════════════════════════════════ */}
          <section aria-labelledby="resume-heading">
            <div className="no-print mb-3 flex items-center justify-between">
              <h2
                id="resume-heading"
                className="text-[15px] font-700 text-[#E2E8F0]"
              >
                Моє резюме
              </h2>
              <PrintResumeButton />
            </div>

            <SectionCard className="space-y-5 resume-section">
              {/* Resume header */}
              <div className="flex items-start gap-4">
                {/* Print-only avatar placeholder */}
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full font-800 text-white text-xl"
                  style={{ background: "linear-gradient(135deg, #F97316, #EA580C)" }}
                  aria-hidden="true"
                >
                  {name.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="resume-title text-lg font-800 text-[#E2E8F0]">
                    {name}
                  </h3>
                  <p className="resume-subtitle text-sm text-[#8A9BB5]">
                    {directionLabel ?? "Студент"} · {goalLabel ?? "Навчання"}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {directionLabel && (
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[10px] font-700"
                        style={{ background: "rgba(249,115,22,0.15)", color: "#F97316" }}
                      >
                        {directionLabel}
                      </span>
                    )}
                    {survey?.level && (
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[10px] font-700"
                        style={{ background: "rgba(138,155,181,0.15)", color: "#8A9BB5" }}
                      >
                        {survey.level === "beginner"
                          ? "Початківець"
                          : survey.level === "intermediate"
                          ? "Середній рівень"
                          : "Досвідчений"}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div
                className="h-px w-full"
                style={{ background: "linear-gradient(90deg, #F97316, rgba(249,115,22,0.1), transparent)" }}
              />

              {/* Skills / completed courses */}
              <div>
                <h4 className="resume-section-heading mb-3 flex items-center gap-2 text-sm font-700 text-[#E2E8F0]">
                  <BookOpen size={15} className="text-[#F97316]" />
                  Навички та курси
                </h4>

                {completedCourses.length > 0 ? (
                  <ul className="space-y-2" aria-label="Пройдені курси">
                    {completedCourses.map((course) => {
                      const cert = certsByCourseId.get(course.id);
                      const catConf = CATEGORIES.find(
                        (c) => c.key === course.category
                      );
                      return (
                        <li
                          key={course.id}
                          className="resume-skill-item flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2">
                            <CheckCircle2 size={14} className="shrink-0 text-green-400" />
                            <span className="text-sm text-[#E2E8F0]">
                              {course.title}
                            </span>
                            {catConf && (
                              <span
                                className="rounded-full px-2 py-0.5 text-[9px] font-600"
                                style={{ background: `${catConf.color}20`, color: catConf.color }}
                              >
                                {catConf.emoji} {catConf.label}
                              </span>
                            )}
                          </div>
                          {cert && (
                            <Link
                              href={`/app/certificate/${cert.id}`}
                              className="no-print shrink-0 text-[10px] text-[#F97316] hover:underline"
                              aria-label={`Сертифікат: ${course.title}`}
                            >
                              <Award size={13} />
                            </Link>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-4 text-center">
                    <span className="text-3xl">📚</span>
                    <p className="text-sm text-[#8A9BB5]">
                      Завершіть перший курс, щоб він з'явився у резюме
                    </p>
                    <Link
                      href="/app/courses"
                      className="no-print mt-1 flex items-center gap-1 rounded-full bg-[#F97316]/15 px-4 py-2 text-xs font-600 text-[#F97316] hover:bg-[#F97316]/25 transition-colors"
                    >
                      Розпочати навчання <ChevronRight size={13} />
                    </Link>
                  </div>
                )}
              </div>

              {/* Contact for print */}
              <div
                className="rounded-xl p-4"
                style={{ background: "rgba(249,115,22,0.05)", border: "1px solid rgba(249,115,22,0.15)" }}
              >
                <h4 className="resume-section-heading mb-2 flex items-center gap-2 text-xs font-700 text-[#8A9BB5] uppercase tracking-wide">
                  <MapPin size={12} className="text-[#F97316]" />
                  Контакт
                </h4>
                <p className="text-sm text-[#E2E8F0]">{email}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-[#8A9BB5]">
                  <Zap size={10} className="text-[#F97316]" />
                  Skill Boost Platform
                </p>
              </div>

              {/* Print footer */}
              <p className="resume-footer text-center text-[10px] text-[#8A9BB5]">
                Сформовано на Skill Boost · {new Date().toLocaleDateString("uk-UA")} · skill-boost.vercel.app
              </p>
            </SectionCard>
          </section>

          {/* Survey section — edit link */}
          <section className="no-print">
            <SectionCard>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-700 text-[#E2E8F0]">
                    Налаштування профілю
                  </h3>
                  <p className="mt-0.5 text-xs text-[#8A9BB5]">
                    {directionLabel
                      ? `Напрям: ${directionLabel} · Мета: ${goalLabel ?? "—"}`
                      : "Опитування не пройдено"}
                  </p>
                </div>
                <Link
                  href="/app/survey"
                  className="flex items-center gap-1.5 rounded-full border border-[rgba(255,255,255,0.08)] px-3 py-1.5 text-xs font-600 text-[#8A9BB5] transition-all hover:border-[#F97316]/40 hover:text-[#F97316]"
                  aria-label="Пройти опитування знову"
                >
                  Змінити
                  <ChevronRight size={13} />
                </Link>
              </div>
            </SectionCard>
          </section>
        </div>
      </div>
    </>
  );
}
