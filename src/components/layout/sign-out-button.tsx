import { signOut } from "@/server/auth/actions";
import { LogOut } from "lucide-react";

type SignOutButtonProps = {
  className?: string;
};

export function SignOutButton({ className }: SignOutButtonProps) {
  return (
    <form action={signOut}>
      <button
        className={
          className ??
          "inline-flex items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-outline/20 bg-surface-high px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-surface-highest"
        }
        type="submit"
      >
        <LogOut className="h-4 w-4" strokeWidth={2} />
        <span className="hidden sm:inline">Logout</span>
      </button>
    </form>
  );
}
