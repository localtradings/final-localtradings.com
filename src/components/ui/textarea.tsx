import * as React from "react";

import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      "min-h-32 w-full rounded-[var(--radius-lg)] border border-outline/20 bg-surface-low px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary/60 focus:ring-4 focus:ring-primary/10",
      className,
    )}
    ref={ref}
    {...props}
  />
));

Textarea.displayName = "Textarea";
