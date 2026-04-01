"use client";

import { useState, useMemo } from "react";
import { Search, Bookmark, SlidersHorizontal, X } from "lucide-react";
import SkillCard from "@/components/ui/skill-card";

/* ─── Types (mirrored from page.tsx) ─────────────────────────────────── */
export interface CourseWithProgress {
  id: string;
  title: string;
  description: string;
  category: string;
  image_url: string | null;
  order: number;
  progress: number;            // 0-100
  status: "not_started" | "in_progress" | "completed";
  lessonCount?: number;
  isRecommended: boolean;
}

export interface CategoryStat {
  category: string;
  label: string;
  emoji: string;
  pct: number;               // 0-100 rounded
  color: string;
}

interface CoursesClientProps {
  courses: CourseWithProgress[];
  categoryStats: CategoryStat[];
  recommendedDirection: string | null;
}

/* ─── Category chips data ─────────────────────────────────────────────── */
const CATEGORY_CHIPS = [
  { value: "all",        label: "Всі" },
  { value: "IT",         label: "IT" },
  { value: "Маркетинг",  label: "Маркетинг" },
  { value: "Фінанси",    label: "Фінанси" },
  { value: "Дизайн",     label: "Дизайн" },
  { value: "Менеджмент", label: "Менеджмент" },
];

/* ─── SVG Circular Progress Ring ─────────────────────────────────────── */
function CircleRing({
  pct,
  color,
  label,
  emoji,
  size = 76,
}: {
  pct: number;
  color: string;
  label: string;
  emoji: string;
  size?: number;
}) {
  const strokeWidth = 5;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ transform: "rotate(-90deg)" }}
          aria-hidden="true"
        >
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#1A2C5B"
            strokeWidth={strokeWidth}
          />
          {/* Progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.8s ease" }}
          />
        </svg>

        {/* Center content */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ top: 0 }}
        >
          <span className="text-base leading-none">{emoji}</span>
          <span
            className="mt-0.5 text-[11px] font-700 leading-none"
            style={{ color }}
          >
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

/* ─── Main Client Component ───────────────────────────────────────────── */
export default function CoursesClient({
  courses,
  categoryStats,
  recommendedDirection,
}: CoursesClientProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [showSearch, setShowSearch] = useState(false);

  /* ── Filter logic ──────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return courses.filter((c) => {
      const matchCat =
        activeCategory === "all" || c.category === activeCategory;
      const matchSearch =
        !q ||
        c.title.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [courses, search, activeCategory]);

  const recommended = useMemo(
    () => (search || activeCategory !== "all"
      ? []
      : courses.filter((c) => c.isRecommended).slice(0, 3)),
    [courses, search, activeCategory]
  );

  const rest = useMemo(() => {
    if (search || activeCategory !== "all") return filtered;
    const recIds = new Set(recommended.map((c) => c.id));
    return filtered.filter((c) => !recIds.has(c.id));
  }, [filtered, recommended, search, activeCategory]);

  /* ── Render ────────────────────────────────────────────────────── */
  return (
    <div
      className="min-h-dvh pb-24"
      style={{ background: "#0D1B3E" }}
    >
      {/* ── Sticky header ────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-30 px-4 pt-12 pb-3"
        style={{
          background: "linear-gradient(180deg, #0D1B3E 80%, rgba(13,27,62,0) 100%)",
        }}
      >
        {/* Title row */}
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-800 text-[#E2E8F0]">Навчання</h1>
          <div className="flex items-center gap-2">
            <button
              id="courses-search-toggle"
              type="button"
              onClick={() => setShowSearch((s) => !s)}
              aria-label="Відкрити пошук"
              className={[
                "flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200",
                showSearch
                  ? "bg-[#F97316] text-white"
                  : "bg-[#1A2C5B] text-[#8A9BB5] hover:text-[#E2E8F0]",
              ].join(" ")}
            >
              <Search size={17} strokeWidth={2} />
            </button>
            <button
              id="courses-bookmark"
              type="button"
              aria-label="Збережені курси"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1A2C5B] text-[#8A9BB5] transition-colors hover:text-[#E2E8F0]"
            >
              <Bookmark size={17} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Search input */}
        {showSearch && (
          <div className="relative mb-3 animate-fade-in">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A9BB5]"
              aria-hidden="true"
            />
            <input
              id="courses-search-input"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Теми, категорії, ключові слова…"
              autoFocus
              className="w-full rounded-xl bg-[#1A2C5B] py-2.5 pl-9 pr-9 text-sm text-[#E2E8F0] placeholder:text-[#8A9BB5] outline-none border border-[rgba(255,255,255,0.06)] focus:border-[#F97316]/50"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Очистити пошук"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A9BB5] hover:text-[#E2E8F0]"
              >
                <X size={15} />
              </button>
            )}
          </div>
        )}

        {/* Category filter chips */}
        <div
          className="flex gap-2 overflow-x-auto pb-1 scrollbar-none"
          role="group"
          aria-label="Фільтр за категорією"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {CATEGORY_CHIPS.map((chip) => (
            <button
              key={chip.value}
              id={`filter-${chip.value}`}
              type="button"
              onClick={() => setActiveCategory(chip.value)}
              aria-pressed={activeCategory === chip.value}
              className={[
                "shrink-0 rounded-full px-4 py-1.5 text-xs font-600 transition-all duration-200",
                activeCategory === chip.value
                  ? "bg-[#F97316] text-white shadow-[0_0_12px_rgba(249,115,22,0.4)]"
                  : "bg-[#1A2C5B] text-[#8A9BB5] hover:text-[#E2E8F0] border border-[rgba(255,255,255,0.05)]",
              ].join(" ")}
            >
              {chip.label}
            </button>
          ))}

          <button
            type="button"
            aria-label="Додаткові фільтри"
            className="shrink-0 flex items-center gap-1 rounded-full border border-[rgba(255,255,255,0.05)] bg-[#1A2C5B] px-3 py-1.5 text-xs font-500 text-[#8A9BB5] hover:text-[#E2E8F0] transition-colors"
          >
            <SlidersHorizontal size={12} />
          </button>
        </div>
      </header>

      <div className="px-4 space-y-8">
        {/* ── Progress rings section ────────────────────────────── */}
        {categoryStats.length > 0 && !search && activeCategory === "all" && (
          <section aria-labelledby="progress-heading">
            <div
              className="rounded-2xl p-4"
              style={{
                background: "#1A2C5B",
                border: "1px solid rgba(255,255,255,0.05)",
                boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2
                  id="progress-heading"
                  className="text-sm font-700 text-[#E2E8F0]"
                >
                  Ваш прогрес
                </h2>
                <span className="text-[10px] text-[#8A9BB5]">
                  за категоріями
                </span>
              </div>

              <div className="flex items-start justify-around gap-2">
                {categoryStats.map((stat) => (
                  <CircleRing
                    key={stat.category}
                    pct={stat.pct}
                    color={stat.color}
                    label={stat.label}
                    emoji={stat.emoji}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Recommended section ───────────────────────────────── */}
        {recommended.length > 0 && (
          <section aria-labelledby="recommended-heading">
            <div className="flex items-center justify-between mb-3">
              <h2
                id="recommended-heading"
                className="text-[15px] font-700 text-[#E2E8F0]"
              >
                Рекомендовано для тебе
              </h2>
              {recommendedDirection && (
                <span
                  className="rounded-full px-2.5 py-0.5 text-[10px] font-600 uppercase"
                  style={{
                    background: "rgba(249,115,22,0.15)",
                    color: "#F97316",
                  }}
                >
                  {recommendedDirection}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-4">
              {recommended.map((course) => (
                <SkillCard
                  key={course.id}
                  id={course.id}
                  title={course.title}
                  description={course.description}
                  category={course.category}
                  imageUrl={course.image_url ?? undefined}
                  progress={course.progress}
                  status={course.status}
                  lessonCount={course.lessonCount}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── All content section ────────────────────────────────── */}
        <section aria-labelledby="all-courses-heading">
          <div className="flex items-center justify-between mb-3">
            <h2
              id="all-courses-heading"
              className="text-[15px] font-700 text-[#E2E8F0]"
            >
              {search
                ? `Результати пошуку (${rest.length})`
                : activeCategory !== "all"
                ? activeCategory
                : "Весь контент"}
            </h2>
            <span className="text-xs text-[#8A9BB5]">{rest.length} курсів</span>
          </div>

          {rest.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {rest.map((course) => (
                <SkillCard
                  key={course.id}
                  id={course.id}
                  title={course.title}
                  description={course.description}
                  category={course.category}
                  imageUrl={course.image_url ?? undefined}
                  progress={course.progress}
                  status={course.status}
                  lessonCount={course.lessonCount}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <span className="text-5xl">🔍</span>
              <p className="text-sm font-600 text-[#E2E8F0]">
                Нічого не знайдено
              </p>
              <p className="text-xs text-[#8A9BB5]">
                Спробуйте інший запит або оберіть іншу категорію
              </p>
              <button
                type="button"
                onClick={() => { setSearch(""); setActiveCategory("all"); }}
                className="mt-2 rounded-full bg-[#1A2C5B] px-4 py-2 text-xs font-600 text-[#F97316] border border-[#F97316]/30 hover:bg-[#F97316]/10 transition-colors"
              >
                Показати всі курси
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
