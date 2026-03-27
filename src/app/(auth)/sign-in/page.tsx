import type { Metadata } from "next";

import { AuthShell } from "@/components/layout/auth-shell";
import { SignInForm } from "@/features/auth/sign-in-form";
import { hasSupabaseEnv } from "@/lib/env";

export const metadata: Metadata = {
  title: "Sign In",
};

type SignInRouteProps = {
  searchParams: Promise<{
    redirectTo?: string;
    reason?: string;
  }>;
};

export default async function SignInRoute({
  searchParams,
}: SignInRouteProps) {
  const { redirectTo, reason } = await searchParams;

  return (
    <AuthShell mode="sign-in">
      <SignInForm
        missingConfig={!hasSupabaseEnv()}
        reason={reason}
        redirectTo={redirectTo}
      />
    </AuthShell>
  );
}
