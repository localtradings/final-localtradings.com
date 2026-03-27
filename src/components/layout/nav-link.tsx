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
    person: UserRound,
    help: BadgeHelp,
  };
  const Icon = icon ? iconMap[icon] : null;

  return (
    <Link
      className={cn(
        "group flex items-center gap-2.5 text-sm font-semibold transition-all duration-200",
        mobile
          ? "flex-col justify-center rounded-[var(--radius-lg)] px-1.5 py-1.5 text-[10px]"
          : "rounded-r-[var(--radius-lg)] rounded-l-[var(--radius-md)] px-3 py-2.5",
        isActive
          ? "border-r-2 border-primary bg-primary/10 text-foreground shadow-lg shadow-black/15"
          : "text-muted hover:bg-surface-high/60 hover:text-foreground",
      )}
      href={href}
    >
      {Icon ? (
        <Icon
          className={cn(
            "shrink-0",
            mobile ? "h-[1rem] w-[1rem]" : "h-[0.95rem] w-[0.95rem]",
          )}
          strokeWidth={2}
        />
      ) : null}
      <span className={cn(mobile ? "truncate text-[9px] leading-tight" : "truncate")}>
        {label}
      </span>
    </Link>
  );
}
