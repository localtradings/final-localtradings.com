import { productNav } from "@/lib/navigation";

import { BrandMark } from "./brand-mark";
import { NavLink } from "./nav-link";

export function ProductSidebar() {
  return (
    <aside className="hidden border-r border-outline-variant/20 bg-surface-high/70 lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
      <div className="flex h-full flex-col gap-8 p-6">
        <BrandMark compact className="border-b border-outline-variant/20 pb-6" href="/app" />
        <nav className="grid gap-1">
          {productNav.map((item) => (
            <NavLink
              exact={item.href === "/app"}
              href={item.href}
              icon={item.icon}
              key={item.href}
              label={item.label}
            />
          ))}
        </nav>
        <div className="mt-auto rounded-[var(--radius-xl)] border border-primary/15 bg-primary/10 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            Learning-first
          </p>
          <p className="mt-3 text-sm leading-7 text-muted">
            The product shell intentionally excludes Community, Settings,
            notifications, and premium upsells from the launch navigation.
          </p>
        </div>
      </div>
    </aside>
  );
}
