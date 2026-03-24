import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-lg)] px-5 py-3 text-sm font-bold transition duration-200 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-[linear-gradient(135deg,var(--primary),var(--primary-dim))] text-black shadow-lg shadow-black/20 hover:-translate-y-0.5",
        secondary:
          "border border-outline/25 bg-surface-high text-foreground hover:bg-surface-highest",
        ghost: "text-foreground hover:bg-surface-high/60",
      },
      size: {
        default: "min-h-11 px-5 py-3",
        lg: "min-h-12 px-6 py-3.5 text-base",
        sm: "min-h-9 px-3.5 py-2 text-xs",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      ref={ref}
      {...props}
    />
  ),
);

Button.displayName = "Button";
