import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="theme-auth relative min-h-screen overflow-hidden bg-[#02070a]">
      <div className="pointer-events-none absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-no-repeat"
          style={{
            backgroundImage: "url('/Sign_in_register_background.png')",
            backgroundPosition: "center 38%",
            backgroundSize: "min(112rem, 118vw) auto",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,15,11,0.04),rgba(3,8,11,0.36)_48%,rgba(2,4,7,0.88)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(1,4,6,0.42),rgba(1,4,6,0.72)_42%,rgba(1,4,6,0.88))]" />
      </div>
      <main className="relative z-10">{children}</main>
    </div>
  );
}
