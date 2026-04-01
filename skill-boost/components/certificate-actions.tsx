"use client";

import { Download, Share2, Check } from "lucide-react";
import { useState } from "react";

export function PrintButton() {
  function handlePrint() {
    window.print();
  }

  return (
    <button
      id="cert-download-btn"
      type="button"
      onClick={handlePrint}
      className={[
        "no-print flex items-center gap-2 rounded-full px-6 py-3",
        "bg-[#F97316] text-sm font-700 text-white transition-all duration-200",
        "hover:bg-[#EA6C10] hover:shadow-[0_0_24px_rgba(249,115,22,0.5)]",
        "active:scale-[0.97]",
      ].join(" ")}
    >
      <Download size={16} />
      Завантажити PDF
    </button>
  );
}

export function ShareButton({ certUrl }: { certUrl: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Мій сертифікат — Skill Boost",
          url: certUrl,
        });
        return;
      } catch {
        // fallthrough to clipboard
      }
    }
    await navigator.clipboard.writeText(certUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      id="cert-share-btn"
      type="button"
      onClick={handleShare}
      className={[
        "no-print flex items-center gap-2 rounded-full px-6 py-3",
        "border border-[rgba(255,255,255,0.1)] bg-[#1A2C5B]",
        "text-sm font-600 transition-all duration-200",
        copied ? "text-green-400" : "text-[#8A9BB5] hover:text-[#E2E8F0]",
        "hover:border-[#F97316]/40 active:scale-[0.97]",
      ].join(" ")}
    >
      {copied ? <Check size={16} /> : <Share2 size={16} />}
      {copied ? "Скопійовано!" : "Поділитись"}
    </button>
  );
}
