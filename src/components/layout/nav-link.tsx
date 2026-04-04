"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BadgeHelp,
  ClipboardCheck,
  GraduationCap,
  LayoutDashboard,
  Trophy,
  UserRound,
} from "lucide-react";

import { cn } from "@/lib/utils";

type NavLinkProps = {
  href: string;
  label: string;
  icon?: string;
  exact?: boolean;
  mobile?: boolean;
};

export function NavLink({
  href,
  label,
  icon,
  exact = false,
  mobile = false,
}: NavLinkProps) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  const iconMap: Record<string, LucideIcon> = {
    dashboard: LayoutDashboard,
    school: GraduationCap,
    quiz: ClipboardCheck,
    query_stats: BarChart3,
    battle: Trophy,
    person: UserRound,
    help: BadgeHelp,
  };
  const Icon = icon ? iconMap[icon] : null;

  return (
    <Link
      className={cn(
        "group flex items-center text-sm font-semibold transition-all duration-150",
        mobile
          ? "flex-col justify-center gap-2.5 rounded-[var(--radius-lg)] px-1.5 py-1.5 text-[10px]"
          : "min-h-[2.625rem] gap-[0.55rem] rounded-[10px] px-2.25 py-[0.45rem] text-[12.5px] tracking-[-0.01em]",
        isActive
          ? mobile
            ? "border-r-2 border-primary bg-primary/10 text-foreground shadow-lg shadow-black/15"
            : "border border-white/[0.08] bg-white/[0.04] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
          : mobile
            ? "text-muted hover:bg-surface-high/60 hover:text-foreground"
            : "border border-transparent text-muted hover:border-white/[0.05] hover:bg-white/[0.03] hover:text-foreground",
      )}
      href={href}
    >
      {Icon ? (
        mobile ? (
          <Icon className="h-[1rem] w-[1rem] shrink-0" strokeWidth={2} />
        ) : (
          <span
            className={cn(
              "inline-flex h-[1.625rem] w-[1.625rem] shrink-0 items-center justify-center rounded-[7px] border transition-colors",
              isActive
                ? "border-white/[0.08] bg-black/20 text-foreground"
                : "border-white/[0.05] bg-black/10 text-muted group-hover:text-foreground",
            )}
          >
            <Icon className="h-[0.82rem] w-[0.82rem]" strokeWidth={1.95} />
          </span>
        )
      ) : null}
      <span className={cn(mobile ? "truncate text-[9px] leading-tight" : "truncate")}>
        {label}
      </span>
    </Link>
  );
}
