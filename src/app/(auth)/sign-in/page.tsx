import type { Metadata } from "next";

import { AuthShell } from "@/components/layout/auth-shell";
import { SignInForm } from "@/features/auth/sign-in-form";
import { hasSupabaseEnv } from "@/lib/env";
import { getSafeAuthNextPath } from "@/server/auth/utils";

export const metadata: Metadata = {
  title: "Sign In",
};

type SignInRouteProps = {
  searchParams: Promise<{
    message?: string;
    redirectTo?: string;
    reason?: string;
    status?: "error" | "success" | "info";
  }>;
};

export default async function SignInRoute({
  searchParams,
}: SignInRouteProps) {
  const { message, redirectTo, reason, status } = await searchParams;
  const safeRedirectTo = getSafeAuthNextPath(redirectTo);

  return (
    <AuthShell mode="sign-in">
      <SignInForm
        missingConfig={!hasSupabaseEnv()}
        noticeMessage={message}
        noticeTone={status}
        reason={reason}
        redirectTo={safeRedirectTo}
      />
    </AuthShell>
  );
}
