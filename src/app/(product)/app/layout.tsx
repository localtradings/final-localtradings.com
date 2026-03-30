import type { ReactNode } from "react";

import { ProductMobileNav } from "@/components/layout/product-mobile-nav";
import { ProductSidebar } from "@/components/layout/product-sidebar";
import { requireUser } from "@/server/auth/session";

export default async function ProductLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireUser();

  return (
    <div className="theme-product min-h-screen bg-background text-foreground lg:grid lg:h-screen lg:grid-cols-[14.75rem_1fr] lg:overflow-hidden">
      <div className="lg:min-h-0">
        <ProductSidebar />
      </div>
      <main className="min-w-0 px-2.5 pb-20 pt-3 sm:px-4 sm:pb-24 sm:pt-4 lg:min-h-0 lg:overflow-y-auto lg:overflow-x-hidden lg:px-6 lg:pb-6 lg:pt-4">
        {children}
      </main>
      <ProductMobileNav />
    </div>
  );
}
