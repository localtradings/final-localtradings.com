import type { Metadata } from "next";

import { AuthShell } from "@/components/layout/auth-shell";
import { ForgotPasswordForm } from "@/features/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot Password",
};

type ForgotPasswordRouteProps = {
  searchParams: Promise<{
    message?: string;
    status?: "error" | "success" | "info";
  }>;
};

export default async function ForgotPasswordRoute({
  searchParams,
}: ForgotPasswordRouteProps) {
  const { message, status } = await searchParams;

  return (
    <AuthShell mode="sign-in">
      <ForgotPasswordForm noticeMessage={message} noticeTone={status} />
    </AuthShell>
  );
}
