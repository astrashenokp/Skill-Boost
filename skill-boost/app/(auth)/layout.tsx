import type { Metadata } from "next";
import Link from "next/link";
import { Zap } from "lucide-react";

export const metadata: Metadata = {
  title: {
    default: "Вхід | Skill Boost",
    template: "%s | Skill Boost",
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 py-10"
      style={{ background: "#0D1B3E" }}
    >
      {/* ── Ambient glow blobs ────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full opacity-20 blur-[100px]"
        style={{ background: "radial-gradient(circle, #F97316 0%, transparent 70%)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 h-[300px] w-[300px] rounded-full opacity-10 blur-[80px]"
        style={{ background: "radial-gradient(circle, #3B82F6 0%, transparent 70%)" }}
      />

      {/* ── Logo ─────────────────────────────────────────────────────── */}
      <Link
        href="/"
        className="mb-8 flex flex-col items-center gap-2 select-none"
        aria-label="Skill Boost — головна"
      >
        {/* Icon mark */}
        <span
          className="flex h-14 w-14 items-center justify-center rounded-2xl animate-pulse-glow"
          style={{
            background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)",
            boxShadow: "0 8px 24px rgba(249,115,22,0.4)",
          }}
        >
          <Zap size={28} className="text-white" fill="white" />
        </span>

        {/* Wordmark */}
        <span className="text-2xl font-800 tracking-tight text-[#E2E8F0]">
          Skill{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #F97316, #FBBF24)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Boost
          </span>
        </span>

        <span className="text-xs text-[#8A9BB5] font-400">
          Персоналізоване навчання
        </span>
      </Link>

      {/* ── Page content (login / register form) ─────────────────────── */}
      <div className="w-full max-w-sm animate-fade-in">
        {children}
      </div>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <p className="mt-8 text-center text-[11px] text-[#8A9BB5]">
        © {new Date().getFullYear()} Skill Boost. Всі права захищено.
      </p>
    </div>
  );
}
