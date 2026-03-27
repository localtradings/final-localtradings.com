import { productNav } from "@/lib/navigation";

import { BrandMark } from "./brand-mark";
import { NavLink } from "./nav-link";

export function ProductSidebar() {
  const primaryItems = productNav.slice(0, 4);
  const accountItems = productNav.slice(4);

  return (
    <aside className="hidden h-full border-r border-outline-variant/10 bg-[#070b10] lg:flex lg:min-h-0 lg:flex-col lg:px-3 lg:py-3">
      <div className="flex h-full min-h-0 flex-1 flex-col gap-5 rounded-[14px] border border-outline-variant/20 bg-[#0c1218] px-3 py-4 shadow-[18px_0_40px_rgba(0,0,0,0.36)]">
        <BrandMark compact className="px-2 pb-4" href="/app" />
        <nav className="grid gap-1">
          {primaryItems.map((item) => (
            <NavLink
              exact={item.href === "/app"}
              href={item.href}
              icon={item.icon}
              key={item.href}
              label={item.label}
            />
          ))}
        </nav>
        <div className="mt-2 border-t border-outline-variant/12 pt-4">
          <p className="px-3 text-[9px] font-semibold uppercase tracking-[0.22em] text-muted">
            Account
          </p>
          <nav className="mt-2.5 grid gap-1">
            {accountItems.map((item) => (
              <NavLink
                exact={item.href === "/app"}
                href={item.href}
                icon={item.icon}
                key={item.href}
                label={item.label}
              />
            ))}
          </nav>
        </div>
        <div className="mt-auto rounded-[12px] border border-outline-variant/15 bg-surface-high/40 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground">
            Need help?
          </p>
          <p className="mt-1.5 text-xs leading-5 text-muted">
            Use the help center for product questions, account help, and feedback.
          </p>
        </div>
      </div>
    </aside>
  );
}
