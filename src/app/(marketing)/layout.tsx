import type { ReactNode } from "react";

import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";

export default function MarketingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="theme-marketing min-h-screen">
      <PublicHeader />
      {children}
      <PublicFooter />
    </div>
  );
}
