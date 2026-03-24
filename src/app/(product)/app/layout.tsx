import type { ReactNode } from "react";

import { ProductMobileNav } from "@/components/layout/product-mobile-nav";
import { ProductSidebar } from "@/components/layout/product-sidebar";
import { ProductTopbar } from "@/components/layout/product-topbar";
import { hasSupabaseEnv } from "@/lib/env";
import { requireUser } from "@/server/auth/session";

export default async function ProductLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="theme-product min-h-screen bg-background text-foreground">
      <ProductSidebar />
      <div className="lg:ml-72">
        <ProductTopbar
          authEnabled={hasSupabaseEnv()}
          userLabel={user?.user_metadata.full_name ?? user?.email ?? "Guest"}
        />
        <main className="px-4 pb-28 pt-6 sm:px-6 lg:px-10">{children}</main>
      </div>
      <ProductMobileNav />
    </div>
  );
}
