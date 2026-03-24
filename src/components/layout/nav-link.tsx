"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

  return (
    <Link
      className={cn(
        "group flex items-center gap-3 rounded-[var(--radius-lg)] px-4 py-3 text-sm font-semibold transition-all duration-200",
        mobile ? "justify-center px-3 py-2.5 text-xs" : "",
        isActive
          ? "bg-surface-highest text-primary shadow-lg shadow-black/20"
          : "text-muted hover:bg-surface-high/60 hover:text-foreground",
      )}
      href={href}
    >
      {icon ? (
        <span className="material-symbols-outlined text-[1.1rem]">{icon}</span>
      ) : null}
      <span>{label}</span>
    </Link>
  );
}
