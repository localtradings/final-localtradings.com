"use client";

import { useActionState, useMemo, useState } from "react";

import { signUp } from "@/server/auth/actions";
import type { ActionState } from "@/types/auth";

import {
  AuthCheckbox,
  AuthDivider,
  AuthField,
  AuthFooterLink,
  AuthNotice,
  AuthPanelHeading,
  AuthPrimaryButton,
  AuthRequirement,
  AuthSocialButtons,
  PasswordRevealButton,
} from "./auth-form-ui";

const initialState: ActionState = {
  status: "idle",
};

type SignUpFormProps = {
  noticeMessage?: string;
  noticeTone?: "error" | "success" | "info";
  redirectTo?: string;
};

export function SignUpForm({
  noticeMessage,
  noticeTone = "info",
  redirectTo = "/app",
}: SignUpFormProps) {
  const [state, formAction, isPending] = useActionState(signUp, initialState);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const passwordChecks = useMemo(
    () => ({
      length: password.length >= 8,
      number: /\d/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    }),
    [password],
  );

  return (
    <form
      action={formAction}
      className="mt-3"
      onSubmit={(event) => {
        const form = event.currentTarget;
        const termsField = form.elements.namedItem("terms");
        const termsAccepted =
          termsField instanceof HTMLInputElement ? termsField.checked : false;

        if (password !== confirmPassword) {
          event.preventDefault();
          setLocalError("Passwords must match before you can create the account.");
          return;
        }

        if (!termsAccepted) {
          event.preventDefault();
          setLocalError("Accept the Terms of Service and Privacy Policy first.");
          return;
        }

        if (!passwordChecks.length || !passwordChecks.number || !passwordChecks.special) {
          event.preventDefault();
          setLocalError("Password must meet all listed requirements before you can register.");
          return;
        }

        setLocalError(null);
      }}
    >
      <input name="redirectTo" type="hidden" value={redirectTo} />

      <AuthPanelHeading
        description="Join the arena and start competing."
        title="Create Your Account"
      />

      <div className="mt-4 space-y-3">
        {noticeMessage ? <AuthNotice message={noticeMessage} tone={noticeTone} /> : null}
        {localError ? <AuthNotice message={localError} tone="error" /> : null}
        {state.message ? (
          <AuthNotice
            message={state.message}
            tone={state.status === "error" ? "error" : "success"}
          />
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <AuthField
            autoComplete="nickname"
            icon="user"
            id="Display Name (optional)"
            name="displayName"
            placeholder="TraderX"
          />
          <AuthField
            autoComplete="email"
            icon="mail"
            id="Email"
            name="email"
            placeholder="you@example.com"
            required
            type="email"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-[0.95rem] font-medium text-white/96" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/42">
              <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                <path d="M7 10V7a5 5 0 0 1 10 0v3" stroke="currentColor" strokeWidth="1.8" />
                <rect height="11" rx="2" stroke="currentColor" strokeWidth="1.8" width="14" x="5" y="10" />
              </svg>
            </span>
            <input
              autoComplete="new-password"
              className="h-[3rem] w-full rounded-[0.95rem] border border-white/10 bg-[rgba(15,20,28,0.92)] pl-[3rem] pr-[3rem] text-[0.93rem] text-white outline-none transition placeholder:text-white/34 focus:border-[#18ff95]/48 focus:ring-4 focus:ring-[#18ff95]/10"
              id="password"
              name="password"
              onChange={(event) => {
                setPassword(event.target.value);
                setLocalError(null);
              }}
              placeholder="Enter your password"
              required
              type={showPassword ? "text" : "password"}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/56">
              <PasswordRevealButton
                onClick={() => setShowPassword((current) => !current)}
                visible={showPassword}
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[0.95rem] font-medium text-white/96" htmlFor="confirmPassword">
            Confirm Password
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/42">
              <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
                <path d="M7 10V7a5 5 0 0 1 10 0v3" stroke="currentColor" strokeWidth="1.8" />
                <rect height="11" rx="2" stroke="currentColor" strokeWidth="1.8" width="14" x="5" y="10" />
              </svg>
            </span>
            <input
              autoComplete="new-password"
              className="h-[3rem] w-full rounded-[0.95rem] border border-white/10 bg-[rgba(15,20,28,0.92)] pl-[3rem] pr-[3rem] text-[0.93rem] text-white outline-none transition placeholder:text-white/34 focus:border-[#18ff95]/48 focus:ring-4 focus:ring-[#18ff95]/10"
              id="confirmPassword"
              name="confirmPassword"
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                setLocalError(null);
              }}
              placeholder="Confirm your password"
              required
              type={showConfirmPassword ? "text" : "password"}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/56">
              <PasswordRevealButton
                onClick={() => setShowConfirmPassword((current) => !current)}
                visible={showConfirmPassword}
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-[0.88rem] font-medium text-white/82">Password must contain:</p>
          <div className="flex flex-wrap gap-x-3.5 gap-y-1.5">
            <AuthRequirement label="At least 8 characters" met={passwordChecks.length} />
            <AuthRequirement label="One number" met={passwordChecks.number} />
            <AuthRequirement label="One special character" met={passwordChecks.special} />
          </div>
        </div>

        <div className="pt-0.5">
          <AuthCheckbox
            id="terms"
            label="I agree to the"
            linkHref="/help"
            linkLabel="Terms of Service"
            name="terms"
            required
            suffix=" and Privacy Policy"
          />
        </div>

        <AuthPrimaryButton disabled={isPending}>
          {isPending ? "Creating Account..." : "Create Account"}
        </AuthPrimaryButton>
      </div>

      <AuthDivider />
      <AuthSocialButtons mode="sign-up" redirectTo={redirectTo} />
      <AuthFooterLink href="/sign-in" label="Sign in" prompt="Already have an account?" />
    </form>
  );
}
