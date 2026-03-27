import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Reveal } from "@/components/ui/reveal";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="max-w-3xl space-y-3">
        {eyebrow ? (
          <Reveal>
            <p className="eyebrow">
              {eyebrow}
            </p>
          </Reveal>
        ) : null}
        <Reveal delay={0.05}>
          <h2 className="font-heading text-[2rem] font-extrabold tracking-tight sm:text-[2.4rem]">
            {title}
          </h2>
        </Reveal>
        {description ? (
          <Reveal delay={0.1}>
            <p className="max-w-2xl text-sm leading-7 text-muted sm:text-[0.98rem]">
              {description}
            </p>
          </Reveal>
        ) : null}
      </div>
      {action ? <Reveal delay={0.15}><div>{action}</div></Reveal> : null}
    </div>
  );
}
