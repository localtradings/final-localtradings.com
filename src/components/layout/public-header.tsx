import Link from "next/link";

import { publicNav } from "@/lib/navigation";

import { BrandMark } from "./brand-mark";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-outline-variant/20 bg-background/85 backdrop-blur-xl">
      <div className="shell-width flex min-h-18 items-center justify-between gap-4 py-3">
        <BrandMark compact />
        <nav className="hidden items-center gap-8 md:flex">
          {publicNav.map((item) => (
            <Link
              className="text-sm font-semibold text-muted transition hover:text-foreground"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Link className="btn-secondary" href="/sign-in">
            Sign In
          </Link>
          <Link className="btn-primary" href="/sign-up">
            Sign Up
          </Link>
        </div>
        <details className="relative md:hidden">
          <summary className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-[var(--radius-lg)] border border-outline/20 bg-surface-high text-foreground">
            <span className="material-symbols-outlined">menu</span>
          </summary>
          <div className="absolute right-0 mt-3 flex min-w-56 flex-col gap-2 rounded-[var(--radius-xl)] border border-outline/20 bg-surface p-4 shadow-2xl shadow-black/30">
            {publicNav.map((item) => (
              <Link
                className="rounded-[var(--radius-lg)] px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-surface-high"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-3 grid gap-2">
              <Link className="btn-secondary" href="/sign-in">
                Sign In
              </Link>
              <Link className="btn-primary" href="/sign-up">
                Sign Up
              </Link>
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}
