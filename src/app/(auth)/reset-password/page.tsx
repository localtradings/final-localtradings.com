import type { Metadata } from "next";

import { AuthShell } from "@/components/layout/auth-shell";
import { ResetPasswordForm } from "@/features/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Reset Password",
};

type ResetPasswordRouteProps = {
  searchParams: Promise<{
    message?: string;
    status?: "error" | "success" | "info";
  }>;
};

export default async function ResetPasswordRoute({
  searchParams,
}: ResetPasswordRouteProps) {
  const { message, status } = await searchParams;

  return (
    <AuthShell mode="sign-in">
      <ResetPasswordForm noticeMessage={message} noticeTone={status} />
    </AuthShell>
  );
}
