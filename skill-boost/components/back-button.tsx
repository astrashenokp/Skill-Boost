"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function BackButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label="Назад"
      className={[
        "flex h-9 w-9 items-center justify-center rounded-full",
        "bg-black/40 backdrop-blur-sm text-white",
        "transition-all duration-200 hover:bg-black/60 active:scale-95",
        "border border-white/10",
      ].join(" ")}
    >
      <ArrowLeft size={18} strokeWidth={2} />
    </button>
  );
}
