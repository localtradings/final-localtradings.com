"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SymbolIcon } from "@/components/ui/symbol-icon";
import { publicNav } from "@/lib/navigation";
import { cn } from "@/lib/utils";

import { BrandMark } from "./brand-mark";

export function PublicHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 px-4 pt-3 sm:px-6">
      <div className="shell-width">
        <div className="liquid-glass-bar flex min-h-[4.75rem] items-center justify-between gap-5 rounded-[1.55rem] px-5 py-3 text-white sm:px-6">
          <div className="relative z-10">
            <BrandMark compact />
          </div>

          <nav className="relative z-10 hidden items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.03] p-1.5 md:flex">
            {publicNav.map((item) => (
              <Link
                className={cn(
                  "relative rounded-full px-4 py-2 text-[13px] font-semibold text-white transition-all duration-200",
                  pathname === item.href
                    ? "bg-white/[0.08] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                    : "text-white/88 hover:bg-white/[0.05] hover:text-white",
                )}
                href={item.href}
                key={item.href}
                style={{ color: "#ffffff" }}
              >
                {item.label}
                <span
                  className={cn(
                    "absolute inset-x-0 -bottom-0.5 mx-auto h-px w-0 bg-white/80 transition-all duration-200",
                    pathname === item.href ? "w-6" : "",
                  )}
                />
              </Link>
            ))}
          </nav>

          <div className="relative z-10 hidden items-center gap-3 md:flex">
            <Link
              className="px-2 py-2 text-[13px] font-bold text-white/92 transition hover:text-white"
              href="/sign-in"
              style={{ color: "#ffffff" }}
            >
              Sign In
            </Link>
            <Link
              className="rounded-full border border-white/[0.18] bg-white/[0.08] px-4 py-2 text-[13px] font-extrabold text-white transition hover:bg-white/[0.12]"
              href="/sign-up"
              style={{ color: "#ffffff" }}
            >
              Sign Up
            </Link>
          </div>

          <details className="relative z-10 md:hidden">
            <summary className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/[0.14] bg-white/[0.06] text-white transition hover:bg-white/[0.1]" style={{ color: "#ffffff" }}>
              <SymbolIcon name="menu" className="text-xl" />
            </summary>
            <div className="liquid-glass-bar absolute right-0 mt-3 flex min-w-60 flex-col gap-2 rounded-[1.2rem] p-4">
              {publicNav.map((item) => (
                <Link
                  className={cn(
                    "rounded-[var(--radius-lg)] px-3 py-2.5 text-sm font-semibold text-white transition",
                    pathname === item.href
                      ? "border border-white/[0.14] bg-white/[0.08] text-white"
                      : "text-white/88 hover:bg-white/[0.06] hover:text-white",
                  )}
                  href={item.href}
                  key={item.href}
                  style={{ color: "#ffffff" }}
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-3 grid gap-2">
                <Link
                  className="rounded-full border border-white/[0.14] bg-white/[0.06] px-4 py-2.5 text-center text-sm font-bold text-white transition hover:bg-white/[0.1]"
                  href="/sign-in"
                  style={{ color: "#ffffff" }}
                >
                  Sign In
                </Link>
                <Link
                  className="rounded-full border border-white/[0.18] bg-white/[0.08] px-4 py-2.5 text-center text-sm font-extrabold text-white transition hover:bg-white/[0.12]"
                  href="/sign-up"
                  style={{ color: "#ffffff" }}
                >
                  Sign Up
                </Link>
              </div>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
