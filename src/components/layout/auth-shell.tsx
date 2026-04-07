import Link from "next/link";
import type { ReactNode } from "react";
import { BarChart3, LogIn, UserRoundPlus } from "lucide-react";

import { cn } from "@/lib/utils";

type AuthShellMode = "sign-in" | "sign-up";

type AuthShellProps = {
  mode: AuthShellMode;
  children: ReactNode;
};

const TAB_COPY = {
  "sign-in": {
    label: "Sign In",
    href: "/sign-in",
    icon: LogIn,
  },
  "sign-up": {
    label: "Register",
    href: "/sign-up",
    icon: UserRoundPlus,
  },
} as const;

function BrandHeader() {
  return (
    <div className="flex items-center justify-center gap-3 text-white">
      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#1dff9f]/75 bg-[#06120c]/92 text-[#17ff95] shadow-[0_0_24px_rgba(11,255,148,0.18)]">
        <BarChart3 className="h-5 w-5" strokeWidth={2.3} />
      </span>
      <span className="font-heading text-[1.38rem] font-black uppercase tracking-[-0.04em] text-white sm:text-[1.62rem]">
        LOCAL<span className="text-[#15f58e]">TRADING</span>
      </span>
    </div>
  );
}

function AuthTabs({ mode }: { mode: AuthShellMode }) {
  return (
    <div className="mt-3 grid grid-cols-2 overflow-hidden rounded-[0.9rem] border border-white/10 bg-[rgba(12,17,24,0.92)]">
      {(Object.keys(TAB_COPY) as AuthShellMode[]).map((key) => {
        const item = TAB_COPY[key];
        const Icon = item.icon;
        const isActive = key === mode;

        return (
          <Link
            className={cn(
              "relative flex min-h-10 items-center justify-center gap-2 px-3 text-[0.82rem] font-extrabold uppercase tracking-[-0.02em] transition",
              isActive
                ? "bg-[linear-gradient(180deg,rgba(15,255,145,0.2),rgba(6,44,26,0.5))] text-[#14ff93]"
                : "text-white/62 hover:text-white/82",
            )}
            href={item.href}
            key={key}
          >
            {isActive ? (
              <>
                <span className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_center_top,rgba(0,255,140,0.18),transparent_60%)]" />
                <span className="pointer-events-none absolute inset-x-[18%] bottom-0 h-[3px] rounded-full bg-[#14ff93] shadow-[0_0_16px_rgba(20,255,147,0.75)]" />
              </>
            ) : null}
            <Icon className="h-4.5 w-4.5" strokeWidth={2.2} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

export function AuthShell({ mode, children }: AuthShellProps) {
  return (
    <div className="relative z-10 flex h-[100svh] items-center justify-center overflow-hidden px-3 py-3 sm:px-5 sm:py-4 lg:px-6 lg:py-4">
      <div className="relative w-full max-w-[63rem] overflow-hidden rounded-[1.6rem] border border-[#15f58e]/52 bg-[rgba(2,6,10,0.22)] shadow-[0_0_0_1px_rgba(0,255,145,0.05),0_20px_60px_rgba(0,0,0,0.48)] backdrop-blur-[2px]">
        <div className="grid lg:min-h-[36.5rem] lg:grid-cols-[0.76fr_1fr]">
          <section className="relative hidden overflow-hidden lg:flex">
            <div
              className="absolute inset-0 bg-no-repeat"
              style={{
                backgroundImage: "url('/Sign_in_register_background.png')",
                backgroundPosition: "23% center",
                backgroundSize: "cover",
              }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(1,5,8,0.22),rgba(1,5,8,0.08)_32%,rgba(1,5,8,0.48)_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_26%_36%,rgba(16,255,152,0.15),transparent_30%),radial-gradient(circle_at_42%_78%,rgba(16,255,152,0.1),transparent_18%)]" />
            <div className="relative flex h-full w-full items-start px-8 pb-8 pt-9">
              <div className="max-w-[14rem] pt-7 text-white">
                <h1 className="font-heading text-[2.95rem] font-black uppercase leading-[0.9] tracking-[-0.07em] text-white">
                  <span className="block">COMPETE.</span>
                  <span className="block">OUTTRADE.</span>
                  <span className="block text-[#15f58e]">CONQUER.</span>
                </h1>
                <div className="mt-5 flex items-start gap-3">
                  <span className="mt-1 h-9 w-[3px] rounded-full bg-[#15f58e] shadow-[0_0_14px_rgba(21,245,142,0.65)]" />
                  <p className="max-w-[10.5rem] text-[0.86rem] leading-[1.38] text-white/84">
                    Enter the arena and prove you have what it takes.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="relative border-l-0 bg-[linear-gradient(180deg,rgba(4,8,14,0.97),rgba(3,7,12,0.985))] px-4 py-4 sm:px-5 sm:py-5 lg:border-l lg:border-l-[#1dff9f]/14 lg:px-6 lg:py-4">
            <div className="mx-auto flex h-full w-full max-w-[28rem] flex-col justify-center">
              <BrandHeader />
              <AuthTabs mode={mode} />
              {children}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
