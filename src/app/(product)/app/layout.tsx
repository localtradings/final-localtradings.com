import type { ReactNode } from "react";

import { ProductMobileNav } from "@/components/layout/product-mobile-nav";
import { ProductSidebar } from "@/components/layout/product-sidebar";
import { ProductTopbar } from "@/components/layout/product-topbar";
import { DEFAULT_BACKTEST_ACCOUNT } from "@/features/backtesting/constants";
import { hasSupabaseEnv } from "@/lib/env";
import { requireUser } from "@/server/auth/session";
import { getBacktestAccount } from "@/server/backtesting/account-queries";

export default async function ProductLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireUser();
  const backtestAccount = await getBacktestAccount(user?.id);

  return (
    <div className="theme-product min-h-screen bg-background text-foreground lg:grid lg:h-screen lg:grid-cols-[15.5rem_minmax(0,1fr)] lg:grid-rows-[3.5rem_minmax(0,1fr)] lg:overflow-hidden">
      <div className="lg:col-[1/3] lg:row-[1/2]">
        <ProductTopbar
          accountBalance={
            backtestAccount?.currentBalance ?? DEFAULT_BACKTEST_ACCOUNT.currentBalance
          }
          authEnabled={hasSupabaseEnv()}
          userLabel={user?.user_metadata.full_name ?? user?.email ?? "Guest"}
          userId={user?.id ?? null}
        />
      </div>
      <div className="lg:col-[1/2] lg:row-[2/3] lg:min-h-0">
        <ProductSidebar />
      </div>
      <main className="min-w-0 px-3 pb-24 pt-4 sm:px-4 sm:pb-24 lg:col-[2/3] lg:row-[2/3] lg:min-h-0 lg:overflow-hidden lg:px-6 lg:pb-6">
        {children}
      </main>
      <ProductMobileNav />
    </div>
  );
}
