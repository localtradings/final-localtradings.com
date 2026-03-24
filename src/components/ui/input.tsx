import * as React from "react";

import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    className={cn(
      "min-h-11 w-full rounded-[var(--radius-lg)] border border-outline/20 bg-surface-low px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary/60 focus:ring-4 focus:ring-primary/10",
      className,
    )}
    ref={ref}
    {...props}
  />
));

Input.displayName = "Input";
