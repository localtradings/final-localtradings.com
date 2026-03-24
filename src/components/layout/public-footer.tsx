import Link from "next/link";

import { publicFooterLinks, publicNav } from "@/lib/navigation";

import { BrandMark } from "./brand-mark";

export function PublicFooter() {
  return (
    <footer className="mt-24 border-t border-outline-variant/20 bg-surface-low/70">
      <div className="shell-width grid gap-10 py-12 md:grid-cols-[1.4fr,1fr,1fr]">
        <div className="space-y-4">
          <BrandMark />
          <p className="max-w-md text-sm leading-7 text-muted">
            localtradings.com is a learning-first trading platform. It teaches
            structure, process, and practice before real-money risk.
          </p>
        </div>
        <div className="space-y-4">
          <h3 className="font-heading text-lg font-extrabold">Explore</h3>
          <div className="grid gap-2">
            {publicNav.map((item) => (
              <Link
                className="text-sm text-muted transition hover:text-foreground"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="font-heading text-lg font-extrabold">Support</h3>
          <div className="grid gap-2">
            {publicFooterLinks.map((item) => (
              <Link
                className="text-sm text-muted transition hover:text-foreground"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <p className="text-xs leading-6 text-muted">
            Trading involves risk. localtradings.com is for education and
            practice, not financial guarantees.
          </p>
        </div>
      </div>
    </footer>
  );
}
