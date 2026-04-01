"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { LogOut, Printer, Loader2 } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      id="profile-logout-btn"
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className={[
        "no-print flex items-center gap-2 rounded-full px-4 py-2",
        "border border-red-500/30 bg-red-500/10 text-sm font-600 text-red-400",
        "transition-all duration-200 hover:bg-red-500/20 active:scale-95",
        "disabled:opacity-50 disabled:cursor-not-allowed",
      ].join(" ")}
    >
      {loading ? (
        <Loader2 size={15} className="animate-spin" />
      ) : (
        <LogOut size={15} />
      )}
      Вийти
    </button>
  );
}

export function PrintResumeButton() {
  return (
    <button
      id="profile-print-resume"
      type="button"
      onClick={() => window.print()}
      className={[
        "no-print flex items-center gap-2 rounded-full px-5 py-2.5",
        "bg-[#F97316] text-sm font-700 text-white transition-all duration-200",
        "hover:bg-[#EA6C10] hover:shadow-[0_0_20px_rgba(249,115,22,0.4)]",
        "active:scale-[0.97]",
      ].join(" ")}
    >
      <Printer size={15} />
      Завантажити резюме
    </button>
  );
}
