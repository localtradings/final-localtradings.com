import "server-only";

import type { EmailOtpType, User } from "@supabase/supabase-js";
import { headers } from "next/headers";

import { getTrustedAppOrigin } from "@/lib/security/origin";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

const emailOtpTypes: EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
];

export function getSafeAuthNextPath(value: unknown) {
  return typeof value === "string" && value.startsWith("/app") ? value : "/app";
}

export async function resolveRequestOrigin() {
  const requestHeaders = await headers();
  const originHeader = requestHeaders.get("origin");
  if (originHeader) {
    return getTrustedAppOrigin(originHeader);
  }

  const forwardedHost = requestHeaders.get("x-forwarded-host");
  const host = forwardedHost ?? requestHeaders.get("host");
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host?.startsWith("localhost") || host?.startsWith("127.0.0.1") ? "http" : "https");

  if (host) {
    return getTrustedAppOrigin(`${protocol}://${host}`);
  }

  return getTrustedAppOrigin();
}

export function parseEmailOtpType(value: string | null): EmailOtpType | null {
  if (!value) {
    return null;
  }

  return emailOtpTypes.includes(value as EmailOtpType) ? (value as EmailOtpType) : null;
}

export function mapAuthErrorMessage(message: string) {
  if (message.includes("over_email_send_rate_limit")) {
    return "Registration email sending is rate-limited in Supabase right now. Configure custom SMTP or a send-email hook in Supabase Auth, then try again.";
  }

  if (message.includes("Email not confirmed")) {
    return "Confirm your email first, then sign in.";
  }

  if (message.includes("Invalid login credentials")) {
    return "Email or password is incorrect.";
  }

  if (message.includes("provider is not enabled")) {
    return "That sign-in provider is not enabled in Supabase Auth yet.";
  }

  return message;
}

function deriveProfileName(user: Pick<User, "email" | "user_metadata">, preferredDisplayName?: string) {
  const preferred = preferredDisplayName?.trim();
  if (preferred) {
    return preferred;
  }

  const displayName = user.user_metadata?.display_name;
  if (typeof displayName === "string" && displayName.trim().length > 0) {
    return displayName.trim();
  }

  const fullName = user.user_metadata?.full_name;
  if (typeof fullName === "string" && fullName.trim().length > 0) {
    return fullName.trim();
  }

  const genericName = user.user_metadata?.name;
  if (typeof genericName === "string" && genericName.trim().length > 0) {
    return genericName.trim();
  }

  if (typeof user.email === "string" && user.email.includes("@")) {
    return user.email.split("@")[0] || "Trader";
  }

  return "Trader";
}

export async function ensureProfileForUser(
  user: Pick<User, "id" | "email" | "user_metadata"> | null | undefined,
  preferredDisplayName?: string,
) {
  if (!user?.id) {
    return;
  }

  const serviceRole = createSupabaseServiceRoleClient();
  if (!serviceRole) {
    return;
  }

  const profileName = deriveProfileName(user, preferredDisplayName);

  await serviceRole.from("profiles").upsert({
    id: user.id,
    email: user.email ?? "",
    full_name: profileName,
    display_name: profileName,
    focus_area: "Candlesticks and risk management",
    bio: "Focused on building structured habits before risking real money.",
    updated_at: new Date().toISOString(),
  });
}
