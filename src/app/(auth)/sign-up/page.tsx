import type { Metadata } from "next";

import { AuthShell } from "@/components/layout/auth-shell";
import { SignUpForm } from "@/features/auth/sign-up-form";

export const metadata: Metadata = {
  title: "Sign Up",
};

export default function SignUpRoute() {
  return (
    <AuthShell
      description="Create an account to unlock signed-in Learn routes, quiz flows, and the v1 backtesting tool area."
      title="Create your account and move from preview to practice."
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="font-heading text-2xl font-extrabold tracking-tight">
            Start learning
          </h2>
          <p className="text-sm leading-7 text-muted">
            The launch scope stays simple: account access, learning content, quiz routes, and focused practice tools.
          </p>
        </div>
        <SignUpForm />
      </div>
    </AuthShell>
  );
}
