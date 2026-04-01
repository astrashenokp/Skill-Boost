import Link from "next/link";
import Image from "next/image";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { BookOpen, ChevronRight } from "lucide-react";

export interface SkillCardProps {
  id: string;
  title: string;
  description?: string;
  category: string;
  imageUrl?: string;
  /** 0–100 */
  progress?: number;
  /** "not_started" | "in_progress" | "completed" */
  status?: "not_started" | "in_progress" | "completed";
  lessonCount?: number;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  "Програмування": { bg: "rgba(99,102,241,0.15)", text: "#818CF8" },
  "Дизайн": { bg: "rgba(236,72,153,0.15)", text: "#F472B6" },
  "Бізнес": { bg: "rgba(20,184,166,0.15)", text: "#2DD4BF" },
  "Маркетинг": { bg: "rgba(234,179,8,0.15)", text: "#FACC15" },
  "Мови": { bg: "rgba(59,130,246,0.15)", text: "#60A5FA" },
  default: { bg: "rgba(249,115,22,0.15)", text: "#F97316" },
};

function getCategoryStyle(category: string) {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.default;
}

export default function SkillCard({
  id,
  title,
  description,
  category,
  imageUrl,
  progress = 0,
  status = "not_started",
  lessonCount,
}: SkillCardProps) {
  const catStyle = getCategoryStyle(category);

  const buttonLabel =
    status === "completed"
      ? "Переглянути"
      : status === "in_progress"
        ? "Продовжити"
        : "Розпочати";

  const progressColor =
    status === "completed" ? "#22C55E" : "#F97316";

  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-[18px] transition-transform duration-200 active:scale-[0.98]"
      style={{
        background: "#1A2C5B",
        border: "1px solid rgba(255,255,255,0.05)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
      }}
    >
      {/* ── Thumbnail ────────────────────────────────────────────────── */}
      <div className="relative h-36 w-full overflow-hidden bg-[#0D1B3E]">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 480px) 100vw, 480px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          /* Placeholder gradient when no image */
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#223570] to-[#0D1B3E]">
            <BookOpen size={40} className="text-[#8A9BB5] opacity-40" />
          </div>
        )}

        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A2C5B]/80 to-transparent" />

        {/* Category badge — overlaid on image */}
        <span
          className="absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-[10px] font-700 uppercase tracking-wide"
          style={{ background: catStyle.bg, color: catStyle.text }}
        >
          {category}
        </span>

        {/* Completed checkmark */}
        {status === "completed" && (
          <span
            aria-label="Завершено"
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-green-500/20 text-green-400"
          >
            ✓
          </span>
        )}
      </div>

      {/* ── Body ─────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        {/* Title */}
        <h3 className="line-clamp-2 text-[0.9375rem] font-700 leading-snug text-[#E2E8F0]">
          {title}
        </h3>

        {/* Description */}
        {description && (
          <p className="line-clamp-2 text-[0.8125rem] leading-relaxed text-[#8A9BB5]">
            {description}
          </p>
        )}

        {/* Meta row */}
        {lessonCount !== undefined && (
          <div className="flex items-center gap-1 text-[0.75rem] text-[#8A9BB5]">
            <BookOpen size={12} strokeWidth={1.8} />
            <span>{lessonCount} уроків</span>
          </div>
        )}

        {/* Progress bar */}
        {status !== "not_started" && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[0.7rem]">
              <span className="text-[#8A9BB5]">Прогрес</span>
              <span
                className="font-600"
                style={{ color: progressColor }}
              >
                {progress}%
              </span>
            </div>
            <Progress
              value={progress}
              className="h-1.5 rounded-full bg-[#0D1B3E]"
              style={
                {
                  "--progress-foreground": progressColor,
                } as React.CSSProperties
              }
            />
          </div>
        )}

        {/* CTA */}
        <Link
          href={`/app/courses/${id}`}
          className="mt-auto"
          aria-label={`${buttonLabel} курс: ${title}`}
        >
          <Button
            className={[
              "w-full rounded-full font-600 transition-all duration-200",
              status === "completed"
                ? "bg-[#1A2C5B] text-[#E2E8F0] border border-[#223570] hover:border-[#F97316] hover:text-[#F97316]"
                : "bg-[#F97316] text-white hover:bg-[#EA6C10] hover:shadow-[0_0_20px_rgba(249,115,22,0.4)]",
            ].join(" ")}
          >
            {buttonLabel}
            <ChevronRight size={16} strokeWidth={2.5} />
          </Button>
        </Link>
      </div>
    </article>
  );
}
