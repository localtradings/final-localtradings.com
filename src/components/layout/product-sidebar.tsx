import { productNav } from "@/lib/navigation";

import { BrandMark } from "./brand-mark";
import { NavLink } from "./nav-link";
import { SignOutButton } from "./sign-out-button";

export function ProductSidebar() {
  const primaryItems = productNav.slice(0, 4);
  const accountItems = productNav.slice(4);

  return (
    <aside className="hidden h-full border-r border-outline-variant/10 bg-[linear-gradient(180deg,#080b0f_0%,#0b1015_100%)] lg:flex lg:min-h-0 lg:flex-col lg:px-3.5 lg:py-3.5">
      <div className="flex h-full min-h-0 flex-1 flex-col">
        <div className="border-b border-outline-variant/12 pb-[1.125rem]">
          <BrandMark compact className="px-1" href="/app" />
        </div>
        <nav className="grid gap-1 pt-[1.125rem]">
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
        <div className="mt-[1.125rem] border-t border-outline-variant/12 pt-[1.125rem]">
          <p className="px-2 text-[9px] font-semibold uppercase tracking-[0.24em] text-muted">
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
        <div className="mt-auto border-t border-outline-variant/12 pt-3.5">
          <div className="px-2 pb-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">
              Workspace
            </p>
            <p className="mt-1.5 text-xs leading-5 text-muted">
              Learn, quiz, and backtest from one focused rail.
            </p>
          </div>
          <SignOutButton className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] border border-outline-variant/16 bg-white/[0.02] px-3 py-2.5 text-sm font-semibold text-muted transition hover:border-outline-variant/24 hover:bg-white/[0.04] hover:text-foreground" />
        </div>
      </div>
    </aside>
  );
}
