import { Card } from "@/components/ui/card";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { hasSupabaseEnv } from "@/lib/env";
import { requireUser } from "@/server/auth/session";
import { getCurrentProfile } from "@/server/profile/queries";

import { ProfileForm } from "./profile-form";

export async function ProfilePage() {
  const user = await requireUser();
  const profile = user ? await getCurrentProfile(user.id) : null;

  return (
    <div className="grid gap-8 xl:grid-cols-[0.95fr,1.05fr]">
      <Card className="p-8">
        <div className="space-y-6">
          <div className="inline-flex h-24 w-24 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
            <span className="material-symbols-outlined text-5xl">person</span>
          </div>
          <div className="space-y-2">
            <h1 className="font-heading text-3xl font-extrabold tracking-tight">
              {profile?.fullName ?? user?.user_metadata.full_name ?? "Guest profile"}
            </h1>
            <p className="text-sm leading-7 text-muted">
              {user?.email ?? "Configure Supabase and sign in to persist profile data."}
            </p>
          </div>
          <div className="rounded-[var(--radius-xl)] border border-outline/15 bg-surface-low p-5 text-sm leading-7 text-muted">
            We only keep the account details needed for v1 profile basics and
            preferences. No fake premium status, no extra social identity layer.
          </div>
          {!hasSupabaseEnv() ? (
            <div className="rounded-[var(--radius-xl)] border border-secondary/20 bg-secondary-container/40 p-5 text-sm leading-7 text-secondary">
              Supabase env values are missing, so profile persistence is currently
              in demo mode.
            </div>
          ) : null}
          <div className="pt-2 lg:hidden">
            <SignOutButton className="inline-flex w-full items-center justify-center gap-2 rounded-[12px] border border-outline/20 bg-surface-high px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-surface-highest" />
          </div>
        </div>
      </Card>
      <Card className="p-8">
        <h2 className="font-heading text-2xl font-extrabold tracking-tight">
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
