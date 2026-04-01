"use client";

import { usePathname } from "next/navigation";
import BottomNav from "@/components/bottom-nav";

/** Auth pages on which the bottom nav must NOT appear. */
const HIDDEN_PATHS = ["/login", "/register"];

/**
 * Thin client wrapper so that RootLayout (Server Component) can
 * conditionally render BottomNav without adding "use client" to the layout.
 */
export default function BottomNavWrapper() {
  const pathname = usePathname();
  const hidden = HIDDEN_PATHS.some((p) => pathname.startsWith(p));
  if (hidden) return null;
  return <BottomNav />;
}
