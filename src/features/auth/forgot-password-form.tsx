"use client";

import Link from "next/link";
import { useActionState } from "react";

import { requestPasswordReset } from "@/server/auth/actions";
import type { ActionState } from "@/types/auth";

import {
  AuthField,
  AuthFooterLink,
  AuthNotice,
  AuthPanelHeading,
  AuthPrimaryButton,
} from "./auth-form-ui";

const initialState: ActionState = {
  status: "idle",
};

type ForgotPasswordFormProps = {
  noticeMessage?: string;
  noticeTone?: "error" | "success" | "info";
};

export function ForgotPasswordForm({
  noticeMessage,
  noticeTone = "info",
}: ForgotPasswordFormProps) {
  const [state, formAction, isPending] = useActionState(
    requestPasswordReset,
    initialState,
  );

  return (
    <form action={formAction} className="mt-4">
      <AuthPanelHeading
        description="Enter your email and we'll send you a password reset link."
        title="Forgot Password"
      />

      <div className="mt-5 space-y-3.5">
        {noticeMessage ? <AuthNotice message={noticeMessage} tone={noticeTone} /> : null}
        {state.message ? (
          <AuthNotice
            message={state.message}
            tone={state.status === "error" ? "error" : "success"}
          />
        ) : null}

        <AuthField
          autoComplete="email"
          icon="mail"
          id="Email"
          name="email"
          placeholder="you@example.com"
          required
          type="email"
        />

        <AuthPrimaryButton disabled={isPending}>
          {isPending ? "Sending Reset Link..." : "Send Reset Link"}
        </AuthPrimaryButton>

        <p className="text-center text-[0.84rem] text-white/50">
          Use the reset link from your email to return here and choose a new password.
        </p>
      </div>

      <div className="mt-5 text-center">
        <Link
          className="text-[0.84rem] font-semibold text-[#17ff95] transition hover:text-[#7bffbf]"
          href="/sign-in"
        >
          Back to sign in
        </Link>
      </div>
      <AuthFooterLink href="/sign-up" label="Register" prompt="Need an account instead?" />
    </form>
  );
}
