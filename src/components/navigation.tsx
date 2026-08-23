"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigationItems = [
  { label: "Dashboard", href: "/" },
  { label: "Tasks", href: "/tasks" },
  { label: "Inventory", href: "/inventory" },
  { label: "Customers", href: "/customers" },
  { label: "Follow-ups", href: "/follow-ups" },
  { label: "Settings", href: "/settings" },
] as const;

type NavigationProps = {
  variant: "desktop" | "mobile";
};

export function Navigation({ variant }: NavigationProps) {
  const pathname = usePathname();
  const isDesktop = variant === "desktop";

  return (
    <nav
      aria-label={isDesktop ? "Primary navigation" : "Mobile navigation"}
      className={isDesktop ? "flex flex-col gap-1" : "flex min-w-max gap-1"}
    >
      {navigationItems.map((item, index) => {
        const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={
              isDesktop
                ? `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-emerald-300 ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-slate-400 hover:bg-white/[0.06] hover:text-slate-100"
                  }`
                : `rounded-lg px-3 py-2 text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                    isActive
                      ? "bg-slate-950 text-white"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  }`
            }
          >
            {isDesktop ? (
              <span
                aria-hidden="true"
                className={`flex size-7 items-center justify-center rounded-lg text-[10px] font-bold tabular-nums ${
                  isActive
                    ? "bg-emerald-300 text-slate-950"
                    : "bg-white/[0.06] text-slate-500 group-hover:text-slate-300"
                }`}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
            ) : null}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
