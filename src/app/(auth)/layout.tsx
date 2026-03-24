import type { ReactNode } from "react";

import { PublicHeader } from "@/components/layout/public-header";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="theme-auth min-h-screen">
      <PublicHeader />
      <main>{children}</main>
    </div>
  );
}
