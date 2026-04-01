import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase-server";
import { PrintButton, ShareButton } from "@/components/certificate-actions";
import { Zap, ArrowLeft, BadgeCheck, Star } from "lucide-react";

/* ─── Helpers ────────────────────────────────────────────────────────── */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Derive gender suffix from name — very simple heuristic for Ukrainian */
function genderSuffix(name: string): "в" | "ла" {
  // If name ends with 'а' or 'я' it's typically feminine
  const trimmed = name.trim();
  const last = trimmed.slice(-1).toLowerCase();
  return last === "а" || last === "я" ? "ла" : "в";
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
    .from("certificates")
    .select("courses(title), users(name)")
    .eq("id", id)
    .single();

  const courseName = (data?.courses as { title?: string } | null)?.title ?? "Курс";
  const userName = (data?.users as { name?: string } | null)?.name ?? "Студент";

  return {
    title: `Сертифікат: ${courseName} | Skill Boost`,
    description: `${userName} успішно завершив(ла) курс «${courseName}» на платформі Skill Boost.`,
    openGraph: {
      title: `🎓 ${userName} — Сертифікат Skill Boost`,
      description: `Успішно завершено курс «${courseName}»`,
      type: "website",
    },
  };
}

/* ─── Print + decoration styles injected into <head> ────────────────── */
const PRINT_STYLES = `
  @media print {
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    html, body { background: #fff !important; margin: 0; padding: 0; }
    .no-print { display: none !important; }
    .cert-page-wrapper { background: #fff !important; min-height: 100vh; padding: 0 !important; }
    .cert-card {
      width: 210mm !important;
      min-height: 148mm !important;
      margin: 0 auto !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      page-break-inside: avoid;
    }
    .cert-bg { background: #0D1B3E !important; }
  }
  @page {
    size: A4 landscape;
    margin: 0;
  }
`;

/* ─── Decorative SVG corner ornament ─────────────────────────────────── */
function CornerOrnament({
  position,
}: {
  position: "tl" | "tr" | "bl" | "br";
}) {
  const transforms: Record<string, string> = {
    tl: "rotate(0)",
    tr: "rotate(90)",
    bl: "rotate(270)",
    br: "rotate(180)",
  };

  return (
    <svg
      width="56"
      height="56"
      viewBox="0 0 56 56"
      fill="none"
      aria-hidden="true"
      className={[
        "absolute",
        position === "tl" ? "top-0 left-0" : "",
        position === "tr" ? "top-0 right-0" : "",
        position === "bl" ? "bottom-0 left-0" : "",
        position === "br" ? "bottom-0 right-0" : "",
      ].join(" ")}
      style={{ transform: transforms[position] }}
    >
      {/* L-shaped double border */}
      <path
        d="M4 52 L4 4 L52 4"
        stroke="#F97316"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M12 52 L12 12 L52 12"
        stroke="rgba(249,115,22,0.35)"
        strokeWidth="1"
        strokeLinecap="round"
      />
      {/* Corner dot */}
      <circle cx="4" cy="4" r="3.5" fill="#F97316" />
    </svg>
  );
}

/* ─── Star rating row ────────────────────────────────────────────────── */
function StarRow() {
  return (
    <div className="flex items-center gap-1" aria-label="5 зірок">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          size={12}
          className="text-[#F97316]"
          fill="#F97316"
        />
      ))}
    </div>
  );
}

/* ─── Certificate Page ───────────────────────────────────────────────── */
export default async function CertificatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Public page — use server client but do NOT redirect if not authed
  const supabase = await createClient();

  /* Fetch certificate + related data via joins */
  const { data: cert } = await supabase
    .from("certificates")
    .select(`
      id,
      issued_at,
      qr_url,
      courses ( id, title, category ),
      users   ( id, name, email )
    `)
    .eq("id", id)
    .single();

  if (!cert) notFound();

  const course = cert.courses as {
    id: string;
    title: string;
    category: string;
  } | null;

  const student = cert.users as {
    id: string;
    name: string;
    email: string;
  } | null;

  if (!course || !student) notFound();

  const issuedDate = formatDate(cert.issued_at);
  const suffix = genderSuffix(student.name);
  const certPublicUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://skill-boost.vercel.app"}/app/certificate/${id}`;

  return (
    <>
      {/* Inject print + base styles */}
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />

      <div
        className="cert-page-wrapper min-h-dvh pb-16 pt-6 px-4"
        style={{ background: "#0D1B3E" }}
      >
        {/* ── Back nav (hidden on print) ────────────────────────── */}
        <div className="no-print mb-6 flex items-center gap-3">
          <Link
            href="/app/courses"
            aria-label="До курсів"
            className={[
              "flex h-9 w-9 items-center justify-center rounded-full",
              "bg-[#1A2C5B] border border-[rgba(255,255,255,0.06)] text-[#8A9BB5]",
              "transition-all hover:text-[#E2E8F0] active:scale-95",
            ].join(" ")}
          >
            <ArrowLeft size={18} />
          </Link>
          <p className="text-sm text-[#8A9BB5]">Мої сертифікати</p>
        </div>

        {/* ══ Certificate Card ══════════════════════════════════════ */}
        <div
          className="cert-card cert-bg relative mx-auto max-w-lg overflow-hidden rounded-3xl"
          style={{
            background: "linear-gradient(145deg, #0D1B3E 0%, #1A2C5B 50%, #0D1B3E 100%)",
            border: "1.5px solid rgba(249,115,22,0.4)",
            boxShadow: "0 0 60px rgba(249,115,22,0.12), 0 24px 64px rgba(0,0,0,0.6)",
          }}
        >
          {/* Corner ornaments */}
          <CornerOrnament position="tl" />
          <CornerOrnament position="tr" />
          <CornerOrnament position="bl" />
          <CornerOrnament position="br" />

          {/* Inner border line */}
          <div
            className="absolute inset-3 rounded-2xl pointer-events-none"
            style={{ border: "1px solid rgba(249,115,22,0.12)" }}
            aria-hidden="true"
          />

          {/* Ambient glows */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-20 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full blur-[80px] opacity-20"
            style={{ background: "radial-gradient(circle, #F97316, transparent)" }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 right-0 h-48 w-48 rounded-full blur-[60px] opacity-10"
            style={{ background: "radial-gradient(circle, #3B82F6, transparent)" }}
          />

          {/* ── Card body ───────────────────────────────────────── */}
          <div className="relative z-10 flex flex-col items-center px-8 py-10 gap-5">

            {/* Logo */}
            <div className="flex flex-col items-center gap-2">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{
                  background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)",
                  boxShadow: "0 8px 24px rgba(249,115,22,0.4)",
                }}
              >
                <Zap size={28} fill="white" className="text-white" />
              </div>
              <span className="text-lg font-800 tracking-tight text-[#E2E8F0]">
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
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 w-full">
              <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(249,115,22,0.4))" }} />
              <BadgeCheck size={18} className="text-[#F97316] shrink-0" />
              <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(249,115,22,0.4), transparent)" }} />
            </div>

            {/* Certificate heading */}
            <div className="text-center space-y-1">
              <p className="text-xs font-600 uppercase tracking-[0.2em] text-[#8A9BB5]">
                Офіційний документ
              </p>
              <h1 className="text-xl font-800 text-[#E2E8F0]">
                Сертифікат про завершення
              </h1>
            </div>

            {/* Student name */}
            <div className="text-center space-y-1">
              <p className="text-xs text-[#8A9BB5]">Цей сертифікат підтверджує, що</p>
              <div
                className="rounded-xl px-6 py-3"
                style={{
                  background: "rgba(249,115,22,0.08)",
                  border: "1px solid rgba(249,115,22,0.2)",
                }}
              >
                <h2
                  className="text-3xl font-800 tracking-tight"
                  style={{
                    background: "linear-gradient(135deg, #E2E8F0 0%, #FFFFFF 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {student.name}
                </h2>
              </div>
            </div>

            {/* Completion text */}
            <div className="text-center space-y-3">
              <p className="text-sm text-[#8A9BB5]">
                успішно закінчи{suffix} курс
              </p>

              {/* Course title */}
              <div className="rounded-2xl px-5 py-3" style={{
                background: "rgba(249,115,22,0.1)",
                border: "1px solid rgba(249,115,22,0.25)",
              }}>
                <h3
                  className="text-xl font-800 leading-snug"
                  style={{
                    background: "linear-gradient(135deg, #F97316 0%, #FBBF24 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {course.title}
                </h3>
                <p className="mt-1 text-xs text-[#8A9BB5]">{course.category}</p>
              </div>

              {/* Stars */}
              <div className="flex justify-center">
                <StarRow />
              </div>
            </div>

            {/* Divider */}
            <div className="w-full h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)" }} />

            {/* Footer row — date + QR */}
            <div className="flex w-full items-end justify-between gap-4">
              {/* Date + verification */}
              <div className="space-y-2">
                <div>
                  <p className="text-[10px] font-600 uppercase tracking-widest text-[#8A9BB5]">
                    Дата видачі
                  </p>
                  <p className="text-sm font-700 text-[#E2E8F0]">{issuedDate}</p>
                </div>
                <div>
                  <p className="text-[10px] font-600 uppercase tracking-widest text-[#8A9BB5]">
                    ID сертифікату
                  </p>
                  <p
                    className="font-mono text-[10px] text-[#8A9BB5]"
                    title={id}
                  >
                    {id.slice(0, 8).toUpperCase()}…
                  </p>
                </div>
                {/* Signature line */}
                <div className="mt-3">
                  <div className="h-px w-32 bg-[rgba(255,255,255,0.2)] mb-1" />
                  <p className="text-[10px] text-[#8A9BB5]">Skill Boost Platform</p>
                </div>
              </div>

              {/* QR code */}
              {cert.qr_url && (
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className="overflow-hidden rounded-xl p-1.5"
                    style={{
                      background: "#fff",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                    }}
                  >
                    <Image
                      src={cert.qr_url}
                      alt="QR код для верифікації сертифікату"
                      width={80}
                      height={80}
                      className="block"
                      unoptimized // external URL from api.qrserver.com
                    />
                  </div>
                  <p className="text-[9px] text-[#8A9BB5] text-center">
                    Скануй для<br />верифікації
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ══ Action buttons (hidden on print) ══════════════════════ */}
        <div className="no-print mt-8 flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <PrintButton />
            <ShareButton certUrl={certPublicUrl} />
          </div>

          {/* Verification note */}
          <div
            className="flex items-center gap-2 rounded-xl px-4 py-3 text-center"
            style={{
              background: "rgba(249,115,22,0.05)",
              border: "1px solid rgba(249,115,22,0.15)",
            }}
          >
            <BadgeCheck size={15} className="shrink-0 text-[#F97316]" />
            <p className="text-xs text-[#8A9BB5]">
              Цей сертифікат можна верифікувати за QR-кодом або за посиланням
            </p>
          </div>

          {/* Back to courses */}
          <Link
            href="/app/courses"
            className="text-xs text-[#8A9BB5] transition-colors hover:text-[#F97316]"
          >
            ← Повернутись до навчання
          </Link>
        </div>
      </div>
    </>
  );
}
