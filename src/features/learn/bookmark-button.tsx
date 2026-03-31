"use client";

import { Bookmark } from "lucide-react";

import { cn } from "@/lib/utils";

type BookmarkButtonProps = {
  active: boolean;
  className?: string;
  label: string;
  onClick: () => void;
  size?: "md" | "sm";
};

export function BookmarkButton({
  active,
  className,
  label,
  onClick,
  size = "sm",
}: BookmarkButtonProps) {
  return (
    <button
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center justify-center rounded-full text-muted transition duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        active
          ? "text-[#f3c94d]"
          : "hover:text-foreground",
        size === "md" ? "h-8 w-8" : "h-7 w-7",
        className,
      )}
      onClick={onClick}
      type="button"
    >
      <Bookmark
        className={cn(
          "transition duration-200",
          active ? "fill-current scale-[1.04]" : "",
          size === "md" ? "h-[1.05rem] w-[1.05rem]" : "h-[0.95rem] w-[0.95rem]",
        )}
        strokeWidth={2}
      />
    </button>
  );
}
