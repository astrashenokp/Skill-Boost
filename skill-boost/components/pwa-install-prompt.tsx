"use client";

import { useState, useEffect } from "react";
import { X, Download, Smartphone } from "lucide-react";

/* ─── BeforeInstallPromptEvent (not in standard TS lib) ──────────────── */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

const DISMISSED_KEY = "pwa-install-dismissed";

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Don't show if user dismissed recently (7-day cooldown)
    const dismissedAt = localStorage.getItem(DISMISSED_KEY);
    if (dismissedAt) {
      const days = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (days < 7) return;
    }

    // Don't show if already running as PWA (standalone)
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    function handleBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Small delay so it doesn't pop up immediately on page load
      setTimeout(() => setVisible(true), 3000);
    }

    function handleAppInstalled() {
      setInstalled(true);
      setVisible(false);
      setDeferredPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    setInstalling(true);

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        setInstalled(true);
      }
    } catch (err) {
      console.warn("PWA install failed:", err);
    } finally {
      setInstalling(false);
      setDeferredPrompt(null);
      setVisible(false);
    }
  }

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setVisible(false);
  }

  if (!visible || installed) return null;

  return (
    <>
      {/* Backdrop — subtle, tap to dismiss */}
      <div
        className="fixed inset-0 z-40"
        onClick={handleDismiss}
        aria-hidden="true"
      />

      {/* Banner */}
      <div
        role="dialog"
        aria-label="Встановити додаток Skill Boost"
        aria-live="polite"
        className="fixed bottom-[70px] left-3 right-3 z-50 animate-slide-up"
        style={{
          filter: "drop-shadow(0 8px 32px rgba(0,0,0,0.5))",
        }}
      >
        <div
          className="relative overflow-hidden rounded-2xl px-4 py-4"
          style={{
            background: "linear-gradient(135deg, #1A2C5B 0%, #223570 100%)",
            border: "1px solid rgba(249,115,22,0.35)",
            boxShadow: "0 0 32px rgba(249,115,22,0.12)",
          }}
        >
          {/* Ambient glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-[32px] opacity-20"
            style={{ background: "#F97316" }}
          />

          <div className="relative z-10 flex items-center gap-3">
            {/* App icon */}
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
              style={{
                background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)",
                boxShadow: "0 4px 12px rgba(249,115,22,0.4)",
              }}
            >
              <Smartphone size={22} className="text-white" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-700 text-[#E2E8F0]">
                Встановити Skill Boost
              </p>
              <p className="mt-0.5 text-xs text-[#8A9BB5] leading-snug">
                Навчайся без браузера — швидко та зручно
              </p>
            </div>

            {/* Dismiss */}
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Закрити"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0D1B3E]/60 text-[#8A9BB5] transition-colors hover:text-[#E2E8F0]"
            >
              <X size={14} />
            </button>
          </div>

          {/* Action buttons */}
          <div className="relative z-10 mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleDismiss}
              className="flex-1 rounded-full border border-[rgba(255,255,255,0.08)] py-2 text-xs font-600 text-[#8A9BB5] transition-colors hover:text-[#E2E8F0]"
            >
              Не зараз
            </button>
            <button
              id="pwa-install-btn"
              type="button"
              onClick={handleInstall}
              disabled={installing}
              className={[
                "flex flex-[2] items-center justify-center gap-1.5 rounded-full py-2",
                "text-xs font-700 text-white transition-all duration-200",
                "bg-[#F97316] hover:bg-[#EA6C10]",
                "hover:shadow-[0_0_16px_rgba(249,115,22,0.5)]",
                "disabled:opacity-60 active:scale-95",
              ].join(" ")}
            >
              <Download size={13} />
              {installing ? "Встановлення…" : "Встановити додаток"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
