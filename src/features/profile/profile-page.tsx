import Link from "next/link";
import { UserRound } from "lucide-react";

import { Card } from "@/components/ui/card";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { hasSupabaseEnv } from "@/lib/env";
import { requireUser } from "@/server/auth/session";
import { getCurrentProfile } from "@/server/profile/queries";

import { ProfileForm } from "./profile-form";

const profileLinks = [
  { href: "/app", label: "Dashboard", detail: "Review account state" },
  { href: "/app/learn", label: "Learn", detail: "Continue lessons" },
  { href: "/app/quiz", label: "Quiz", detail: "Check lesson recall" },
  { href: "/app/backtesting", label: "Backtesting", detail: "Practice execution" },
  { href: "/app/help", label: "Help", detail: "Get support" },
] as const;

export async function ProfilePage() {
  const user = await requireUser();
  const profile = user ? await getCurrentProfile(user.id) : null;
  const displayName =
    profile?.displayName?.trim() ||
    profile?.fullName?.trim() ||
    user?.user_metadata.full_name ||
    "Learning Trader";

  return (
    <div className="grid gap-5 xl:grid-cols-[0.88fr,1.12fr]">
      <Card className="p-5 sm:p-6">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
              <UserRound className="h-8 w-8" strokeWidth={1.8} />
            </div>
            <div className="min-w-0 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted">
                Profile
              </p>
              <h1 className="truncate font-heading text-2xl font-extrabold tracking-normal sm:text-3xl">
                {displayName}
              </h1>
              <p className="truncate text-sm leading-6 text-muted">
                {user?.email ?? "Configure Supabase and sign in to persist profile data."}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[var(--radius-lg)] border border-outline/15 bg-surface-low p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                Focus area
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {profile?.focusArea?.trim() || "Not set"}
              </p>
            </div>
            <div className="rounded-[var(--radius-lg)] border border-outline/15 bg-surface-low p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                Access
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {profile?.isPro ? "Pro account" : "Standard account"}
              </p>
            </div>
          </div>

          <div className="rounded-[var(--radius-lg)] border border-outline/15 bg-surface-low p-4 text-sm leading-7 text-muted">
            Profile connects the name used in Battle, dashboard account state,
            and the preferences shown across the signed-in workspace.
          </div>
          {!hasSupabaseEnv() ? (
            <div className="rounded-[var(--radius-lg)] border border-secondary/20 bg-secondary-container/40 p-4 text-sm leading-7 text-secondary">
              Supabase env values are missing, so profile persistence is currently
              in demo mode.
            </div>
          ) : null}

          <div className="grid gap-2">
            {profileLinks.map((item) => (
              <Link
                className="flex min-h-12 items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-outline/12 bg-surface-low px-4 py-3 text-sm transition hover:border-primary/25 hover:bg-surface-high"
                href={item.href}
                key={item.href}
              >
                <span className="font-semibold text-foreground">{item.label}</span>
                <span className="text-right text-xs leading-5 text-muted">{item.detail}</span>
              </Link>
            ))}
          </div>

          <div className="pt-2 lg:hidden">
            <SignOutButton className="inline-flex w-full items-center justify-center gap-2 rounded-[12px] border border-outline/20 bg-surface-high px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-surface-highest" />
          </div>
        </div>
      </Card>
      <Card className="p-5 sm:p-6">
        <h2 className="font-heading text-2xl font-extrabold tracking-normal">
          Edit profile
        </h2>
        <p className="mt-3 text-sm leading-7 text-muted">
          Keep it simple: name, display name, focus area, and a short bio.
        </p>
        <div className="mt-6">
          <ProfileForm
            initialValues={{
              fullName:
                profile?.fullName ??
                user?.user_metadata.full_name ??
                "Learning Trader",
              displayName:
                profile?.displayName ??
                user?.user_metadata.full_name ??
                "Learning Trader",
              focusArea:
                profile?.focusArea ?? "Candlesticks and risk management",
              bio:
                profile?.bio ??
                "Focused on building structured habits before risking real money.",
            }}
          />
        </div>
      </Card>
    </div>
  );
}
