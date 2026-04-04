import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function BattleStateCard({
  label,
  value,
  detail,
  accentClassName,
  children,
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  accentClassName?: string;
  children?: ReactNode;
}) {
  return (
    <div className="learn-tv-panel relative overflow-hidden rounded-[0.9rem] px-4 py-4">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/[0.04]" />
      <p className="learn-tv-kicker">
        {label}
      </p>
      <div className={cn("mt-3 text-[1.65rem] font-semibold tracking-[-0.03em] text-white", accentClassName)}>
        {value}
      </div>
      {detail ? <p className="mt-2 text-sm leading-6 text-muted">{detail}</p> : null}
      {children ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}
