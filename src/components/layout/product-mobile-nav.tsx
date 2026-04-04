import { productNav } from "@/lib/navigation";

import { NavLink } from "./nav-link";

export function ProductMobileNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-outline-variant/20 bg-surface/95 px-2 py-1.5 backdrop-blur-xl lg:hidden">
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${productNav.length}, minmax(0, 1fr))` }}
      >
        {productNav.map((item) => (
          <NavLink
            exact={item.href === "/app"}
            href={item.href}
            icon={item.icon}
            key={item.href}
            label={item.label}
            mobile
          />
        ))}
      </div>
    </nav>
  );
}
