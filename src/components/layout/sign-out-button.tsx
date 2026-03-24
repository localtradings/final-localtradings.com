import { signOut } from "@/server/auth/actions";

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
        <span className="material-symbols-outlined text-base">logout</span>
        Sign Out
      </button>
    </form>
  );
}
