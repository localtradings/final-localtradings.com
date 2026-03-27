import type { ReactNode } from "react";

import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";
import { WebGLShader } from "@/components/ui/web-gl-shader";

export default function MarketingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="theme-marketing relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none fixed inset-0 z-0">
        <WebGLShader className="opacity-22" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.2),rgba(0,0,0,0.88))]" />
      </div>
      <PublicHeader />
      <div className="relative z-10">
        {children}
      </div>
      <PublicFooter />
    </div>
  );
}
