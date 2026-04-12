"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  consumeRateLimit,
  formatRetryAfterSeconds,
  getClientIpFromHeaders,
  normalizeRateLimitIdentifier,
} from "@/server/security/rate-limit";
import type { ActionState } from "@/types/auth";

import {
  ensureProfileForUser,
  getSafeAuthNextPath,
  mapAuthErrorMessage,
  resolveRequestOrigin,
} from "./utils";

const signInSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

const signUpSchema = signInSchema
  .extend({
    confirmPassword: z.string().min(8),
    displayName: z.string().trim().max(60).optional().or(z.literal("")),
    redirectTo: z.string().optional(),
    termsAccepted: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (!/\d/.test(value.password)) {
      ctx.addIssue({
        code: "custom",
        message: "Password must include at least one number.",
        path: ["password"],
      });
    }

    if (!/[^A-Za-z0-9]/.test(value.password)) {
      ctx.addIssue({
        code: "custom",
        message: "Password must include at least one special character.",
        path: ["password"],
      });
    }

    if (value.password !== value.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        message: "Passwords must match.",
        path: ["confirmPassword"],
      });
    }

    if (!value.termsAccepted) {
      ctx.addIssue({
        code: "custom",
        message: "Terms must be accepted.",
        path: ["termsAccepted"],
      });
    }
  });

const requestPasswordResetSchema = z.object({
  email: z.email(),
});

const SIGN_IN_RATE_LIMIT = {
  limit: 10,
  windowSeconds: 15 * 60,
};

const SIGN_UP_RATE_LIMIT = {
  limit: 5,
  windowSeconds: 60 * 60,
};

const PASSWORD_RESET_RATE_LIMIT = {
  limit: 5,
  windowSeconds: 60 * 60,
};

export async function signIn(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const headerStore = await headers();
  const emailInput = formData.get("email");
  const rateLimit = await consumeRateLimit({
    scope: "auth:sign-in",
    identifier: normalizeRateLimitIdentifier(
      getClientIpFromHeaders(headerStore),
      typeof emailInput === "string" ? emailInput : undefined,
    ),
    limit: SIGN_IN_RATE_LIMIT.limit,
    windowSeconds: SIGN_IN_RATE_LIMIT.windowSeconds,
  });

  if (!rateLimit.allowed) {
    return {
      status: "error",
      message: `Too many sign-in attempts. Try again in ${formatRetryAfterSeconds(rateLimit.retryAfterSeconds)}.`,
    };
  }

  const parsed = signInSchema.safeParse({
    email: emailInput,
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { status: "error", message: "Enter a valid email and password." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      status: "error",
      message: "Supabase is not configured yet. Add env values to enable sign in.",
    };
  }

  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { status: "error", message: mapAuthErrorMessage(error.message) };
  }

  const nextPath = getSafeAuthNextPath(formData.get("redirectTo"));

  revalidatePath("/app");
  redirect(nextPath);
}

export async function signUp(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const headerStore = await headers();
  const displayNameInput = formData.get("displayName") ?? formData.get("fullName");
  const emailInput = formData.get("email");
  const rateLimit = await consumeRateLimit({
    scope: "auth:sign-up",
    identifier: normalizeRateLimitIdentifier(
      getClientIpFromHeaders(headerStore),
      typeof emailInput === "string" ? emailInput : undefined,
    ),
    limit: SIGN_UP_RATE_LIMIT.limit,
    windowSeconds: SIGN_UP_RATE_LIMIT.windowSeconds,
  });

  if (!rateLimit.allowed) {
    return {
      status: "error",
      message: `Too many sign-up attempts. Try again in ${formatRetryAfterSeconds(rateLimit.retryAfterSeconds)}.`,
    };
  }

  const parsed = signUpSchema.safeParse({
    displayName: typeof displayNameInput === "string" ? displayNameInput : "",
    confirmPassword: formData.get("confirmPassword"),
    email: emailInput,
    password: formData.get("password"),
    redirectTo: formData.get("redirectTo"),
    termsAccepted: formData.get("terms") === "on",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message:
        "Use a valid email, match both passwords, accept the terms, and include a number plus special character in the password.",
    };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      status: "error",
      message: "Supabase is not configured yet. Add env values to enable sign up.",
    };
  }

  const profileName =
    parsed.data.displayName?.trim() ||
    parsed.data.email.split("@")[0] ||
    "Trader";
  const nextPath = getSafeAuthNextPath(parsed.data.redirectTo);
  const requestOrigin = await resolveRequestOrigin();
  const confirmUrl = new URL("/auth/confirm", requestOrigin);
  confirmUrl.searchParams.set("next", nextPath);

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: confirmUrl.toString(),
      data: {
        full_name: profileName,
        display_name: profileName,
      },
    },
  });

  if (error) {
    return { status: "error", message: mapAuthErrorMessage(error.message) };
  }

  if (data.user && data.session) {
    await ensureProfileForUser(data.user, profileName);
  }

  if (!data.session) {
    return {
      status: "success",
      message:
        "Account created. Check your email to confirm it. If no email arrives, your Supabase project likely needs custom SMTP or email rate-limit changes.",
    };
  }

  revalidatePath("/app");
  redirect(nextPath);
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase?.auth.signOut();
  redirect("/sign-in");
}

export async function requestPasswordReset(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const headerStore = await headers();
  const emailInput = formData.get("email");
  const rateLimit = await consumeRateLimit({
    scope: "auth:password-reset",
    identifier: normalizeRateLimitIdentifier(
      getClientIpFromHeaders(headerStore),
      typeof emailInput === "string" ? emailInput : undefined,
    ),
    limit: PASSWORD_RESET_RATE_LIMIT.limit,
    windowSeconds: PASSWORD_RESET_RATE_LIMIT.windowSeconds,
  });

  if (!rateLimit.allowed) {
    return {
      status: "error",
      message: `Too many reset requests. Try again in ${formatRetryAfterSeconds(rateLimit.retryAfterSeconds)}.`,
    };
  }

  const parsed = requestPasswordResetSchema.safeParse({
    email: emailInput,
  });

  if (!parsed.success) {
    return { status: "error", message: "Enter a valid email address." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      status: "error",
      message: "Supabase is not configured yet. Password recovery is disabled.",
    };
  }

  const requestOrigin = await resolveRequestOrigin();
  const resetUrl = new URL("/reset-password", requestOrigin);

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: resetUrl.toString(),
  });

  if (error) {
    return { status: "error", message: mapAuthErrorMessage(error.message) };
  }

  return {
    status: "success",
    message:
      "If an account exists for that email, a password reset link has been sent.",
  };
}
