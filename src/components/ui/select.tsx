import * as React from "react";

import { cn } from "@/lib/utils";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    className={cn(
      "min-h-11 w-full rounded-[var(--radius-lg)] border border-outline/20 bg-surface-low px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/60 focus:ring-4 focus:ring-primary/10",
      className,
    )}
    ref={ref}
    {...props}
  >
    {children}
  </select>
));

Select.displayName = "Select";
