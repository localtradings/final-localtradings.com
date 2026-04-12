import type { Metadata } from "next";

import { AuthShell } from "@/components/layout/auth-shell";
import { SignUpForm } from "@/features/auth/sign-up-form";
import { getSafeAuthNextPath } from "@/server/auth/utils";

export const metadata: Metadata = {
  title: "Register",
};

type SignUpRouteProps = {
  searchParams: Promise<{
    message?: string;
    redirectTo?: string;
    status?: "error" | "success" | "info";
  }>;
};

export default async function SignUpRoute({
  searchParams,
}: SignUpRouteProps) {
  const { message, redirectTo, status } = await searchParams;
  const safeRedirectTo = getSafeAuthNextPath(redirectTo);

  return (
    <AuthShell mode="sign-up">
      <SignUpForm
        noticeMessage={message}
        noticeTone={status}
        redirectTo={safeRedirectTo}
      />
    </AuthShell>
  );
}
