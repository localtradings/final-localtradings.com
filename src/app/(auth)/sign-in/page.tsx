import type { Metadata } from "next";

import { AuthShell } from "@/components/layout/auth-shell";
import { SignInForm } from "@/features/auth/sign-in-form";

export const metadata: Metadata = {
  title: "Sign In",
};

type SignInRouteProps = {
  searchParams: Promise<{
    redirectTo?: string;
  }>;
};

export default async function SignInRoute({
  searchParams,
}: SignInRouteProps) {
  const { redirectTo } = await searchParams;

  return (
    <AuthShell
      description="Access your learning dashboard, quiz routes, and backtesting workspace."
      title="Sign in to continue your learning flow."
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="font-heading text-2xl font-extrabold tracking-tight">
            Welcome back
          </h2>
          <p className="text-sm leading-7 text-muted">
            Use email and password. Product routes are protected when Supabase is configured.
          </p>
        </div>
        <SignInForm redirectTo={redirectTo} />
      </div>
    </AuthShell>
  );
}
