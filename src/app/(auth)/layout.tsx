import type { ReactNode } from "react";

import { PublicHeader } from "@/components/layout/public-header";
import { WebGLShader } from "@/components/ui/web-gl-shader";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="theme-auth relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none fixed inset-0 z-0">
        <WebGLShader className="opacity-20" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.12),rgba(0,0,0,0.9))]" />
      </div>
      <PublicHeader />
      <main className="relative z-10">{children}</main>
    </div>
  );
}
