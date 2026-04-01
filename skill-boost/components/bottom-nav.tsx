"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Home,
  User,
  MessageCircle,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.FC<{ size?: number; strokeWidth?: number; className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/courses", label: "Навчання", icon: BookOpen },
  { href: "/dashboard", label: "Головна", icon: Home },
  { href: "/profile", label: "Профіль", icon: User },
  { href: "#chat", label: "Чати", icon: MessageCircle },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Основна навігація"
      className="fixed bottom-0 left-0 right-0 z-50 flex items-stretch justify-around"
      style={{
        background: "#0D1B3E",
        borderTop: "1px solid #1A2C5B",
        paddingBottom: "env(safe-area-inset-bottom)",
        height: "calc(56px + env(safe-area-inset-bottom))",
      }}
    >
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const isActive =
          href === "#chat"
            ? false
            : pathname === href || pathname.startsWith(href + "/");

        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            aria-current={isActive ? "page" : undefined}
            className={[
              "flex flex-1 flex-col items-center justify-center gap-[3px] pt-2",
              "transition-all duration-200 ease-out select-none",
              "hover:opacity-100",
              isActive ? "opacity-100" : "opacity-45",
            ].join(" ")}
          >
            {/* Icon wrapper — glows when active */}
            <span
              className={[
                "relative flex items-center justify-center",
                "w-8 h-8 rounded-full transition-all duration-200",
                isActive
                  ? "bg-orange-500/15 shadow-[0_0_12px_rgba(249,115,22,0.35)]"
                  : "",
              ].join(" ")}
            >
              <Icon
                size={20}
                strokeWidth={isActive ? 2.2 : 1.8}
                className={isActive ? "text-[#F97316]" : "text-[#8A9BB5]"}
              />

              {/* Active dot indicator */}
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute -bottom-[3px] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#F97316]"
                />
              )}
            </span>

            <span
              className={[
                "text-[10px] font-medium leading-none transition-colors duration-200",
                isActive ? "text-[#F97316]" : "text-[#8A9BB5]",
              ].join(" ")}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
