"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { signIn } from "@/server/auth/actions";
import type { ActionState } from "@/types/auth";

import {
  AuthDivider,
  AuthField,
  AuthFooterLink,
  AuthNotice,
  AuthPanelHeading,
  AuthPrimaryButton,
  AuthSocialButtons,
  AuthCheckbox,
  PasswordRevealButton,
} from "./auth-form-ui";

const initialState: ActionState = {
  status: "idle",
};

type SignInFormProps = {
  missingConfig?: boolean;
  reason?: string;
  redirectTo?: string;
};

export function SignInForm({
  missingConfig = false,
  reason,
  redirectTo = "/app",
}: SignInFormProps) {
  const [state, formAction, isPending] = useActionState(signIn, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="mt-4">
      <input name="redirectTo" type="hidden" value={redirectTo} />

      <AuthPanelHeading
        description="Access your account and enter the arena."
        title="Sign in to LocalTrading"
      />

      <div className="mt-5 space-y-3.5">
        {missingConfig ? (
          <AuthNotice
            message="Supabase auth is not configured in this environment yet. Add the auth env values first."
            tone="info"
          />
        ) : null}

        {!missingConfig && reason === "auth" ? (
          <AuthNotice
            message="Sign in to continue into the workspace."
            tone="info"
          />
        ) : null}

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

        <AuthField
          autoComplete="current-password"
          icon="lock"
          id="Password"
          name="password"
          placeholder="Enter your password"
          required
          rightSlot={
            <PasswordRevealButton
              onClick={() => setShowPassword((current) => !current)}
              visible={showPassword}
            />
          }
          type={showPassword ? "text" : "password"}
        />

        <div className="flex flex-wrap items-center justify-between gap-3 text-[0.93rem]">
          <AuthCheckbox defaultChecked id="rememberMe" label="Remember me" name="rememberMe" />
          <Link className="font-medium text-[#15f58e] transition hover:text-[#7cffbf]" href="/help">
            Forgot password?
          </Link>
        </div>

        <AuthPrimaryButton disabled={isPending}>
          {isPending ? "Signing In..." : "Sign In"}
        </AuthPrimaryButton>
      </div>

      <AuthDivider />
      <AuthSocialButtons />
      <AuthFooterLink href="/sign-up" label="Sign up" prompt="Don't have an account?" />
    </form>
  );
}
