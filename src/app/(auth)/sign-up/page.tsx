import type { Metadata } from "next";

import { AuthShell } from "@/components/layout/auth-shell";
import { SignUpForm } from "@/features/auth/sign-up-form";

export const metadata: Metadata = {
  title: "Sign Up",
};

export default function SignUpRoute() {
  return (
    <AuthShell mode="sign-up">
      <SignUpForm />
    </AuthShell>
  );
}
