import type { ReactNode } from "react";

export function BattleEmptyState({
  title,
  detail,
  action,
}: {
  title: string;
  detail: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-[1.2rem] border border-dashed border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.008))] px-6 py-10 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#f4d24b]">
        Battle Status
      </p>
      <h2 className="mt-3 font-heading text-[1.7rem] font-extrabold tracking-[-0.03em] text-white">
        {title}
      </h2>
      <p className="mx-auto mt-3 max-w-[36rem] text-sm leading-6 text-slate-400">{detail}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
