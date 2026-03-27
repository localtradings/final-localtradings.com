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
    <AuthShell mode="sign-in">
      <SignInForm redirectTo={redirectTo} />
    </AuthShell>
  );
}
