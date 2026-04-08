"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

import {
  AuthFooterLink,
  AuthNotice,
  AuthPanelHeading,
  AuthPrimaryButton,
  AuthRequirement,
  PasswordRevealButton,
} from "./auth-form-ui";

type ResetPasswordFormProps = {
  noticeMessage?: string;
  noticeTone?: "error" | "success" | "info";
};

export function ResetPasswordForm({
  noticeMessage,
  noticeTone = "info",
}: ResetPasswordFormProps) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  const passwordChecks = useMemo(
    () => ({
      length: password.length >= 8,
      number: /\d/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    }),
    [password],
  );

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isMounted = true;

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!isMounted) {
          return;
        }

        if (error) {
          setLocalError(error.message);
          return;
        }

        if (!data.session) {
          setLocalError("Open the password reset link from your email again.");
          return;
        }

        setSessionReady(true);
      })
      .catch((error) => {
        if (isMounted) {
          setLocalError(error instanceof Error ? error.message : "Password reset session could not be restored.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!sessionReady) {
      setLocalError("Open the password reset link from your email again.");
      return;
    }

    if (password !== confirmPassword) {
      setLocalError("Passwords must match before you can continue.");
      return;
    }

    if (!passwordChecks.length || !passwordChecks.number || !passwordChecks.special) {
      setLocalError("Password must meet all listed requirements.");
      return;
    }

    if (!supabase) {
      setLocalError("Supabase auth is not configured yet.");
      return;
    }

    setIsPending(true);
    setLocalError(null);
    setSuccessMessage(null);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setLocalError(error.message);
      setIsPending(false);
      return;
    }

    await supabase.auth.signOut();
    const success = "Password updated. Sign in with your new password.";
    setSuccessMessage(success);
    router.replace(`/sign-in?status=success&message=${encodeURIComponent(success)}`);
  }

  return (
    <form className="mt-3" onSubmit={handleSubmit}>
      <AuthPanelHeading
        description="Choose a new password for your account."
        title="Reset Password"
      />

      <div className="mt-4 space-y-3">
        {noticeMessage ? <AuthNotice message={noticeMessage} tone={noticeTone} /> : null}
        {!supabase ? (
          <AuthNotice
            message="Supabase auth is not configured yet."
            tone="error"
          />
        ) : null}
        {localError ? <AuthNotice message={localError} tone="error" /> : null}
        {successMessage ? <AuthNotice message={successMessage} tone="success" /> : null}

        <div className="space-y-1.5">
          <label className="block text-[0.95rem] font-medium text-white/96" htmlFor="password">
            New Password
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
              onChange={(event) => {
                setPassword(event.target.value);
                setLocalError(null);
              }}
              placeholder="Enter your new password"
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
            Confirm New Password
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
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                setLocalError(null);
              }}
              placeholder="Confirm your new password"
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

        <AuthPrimaryButton disabled={isPending || !sessionReady}>
          {isPending ? "Updating Password..." : "Update Password"}
        </AuthPrimaryButton>
      </div>

      <div className="mt-5 text-center">
        <Link
          className="text-[0.84rem] font-semibold text-[#17ff95] transition hover:text-[#7bffbf]"
          href="/forgot-password"
        >
          Request another reset link
        </Link>
      </div>
      <AuthFooterLink href="/sign-in" label="Sign in" prompt="Remembered it after all?" />
    </form>
  );
}
