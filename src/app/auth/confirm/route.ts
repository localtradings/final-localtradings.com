import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getTrustedAppOrigin } from "@/lib/security/origin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  ensureProfileForUser,
  getSafeAuthNextPath,
  mapAuthErrorMessage,
  parseEmailOtpType,
} from "@/server/auth/utils";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const appOrigin = getTrustedAppOrigin(requestUrl);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = parseEmailOtpType(requestUrl.searchParams.get("type"));
  const nextPath =
    type === "recovery"
      ? "/reset-password"
      : getSafeAuthNextPath(requestUrl.searchParams.get("next"));
  const errorSourcePath = type === "recovery" ? "/forgot-password" : "/sign-up";

  if (!tokenHash || !type) {
    const invalidUrl = new URL("/sign-in", appOrigin);
    invalidUrl.searchParams.set("status", "error");
    invalidUrl.searchParams.set("message", "Email confirmation link is missing required auth data.");
    invalidUrl.searchParams.set("redirectTo", nextPath);
    return NextResponse.redirect(invalidUrl);
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    const configUrl = new URL("/sign-in", appOrigin);
    configUrl.searchParams.set("status", "error");
    configUrl.searchParams.set("message", "Supabase auth is not configured yet.");
    configUrl.searchParams.set("redirectTo", nextPath);
    return NextResponse.redirect(configUrl);
  }

  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });

  if (error) {
    const errorUrl = new URL(errorSourcePath, appOrigin);
    errorUrl.searchParams.set("status", "error");
    errorUrl.searchParams.set("message", mapAuthErrorMessage(error.message));
    errorUrl.searchParams.set("redirectTo", nextPath);
    return NextResponse.redirect(errorUrl);
  }

  await ensureProfileForUser(data.user ?? data.session?.user);
  revalidatePath("/app");

  if (data.session || data.user) {
    return NextResponse.redirect(new URL(nextPath, appOrigin));
  }

  const successUrl = new URL(type === "recovery" ? "/reset-password" : "/sign-in", appOrigin);
  successUrl.searchParams.set("status", "success");
  successUrl.searchParams.set(
    "message",
    type === "recovery" ? "Recovery link verified. Set your new password." : "Email confirmed. Sign in to continue.",
  );
  successUrl.searchParams.set("redirectTo", nextPath);
  return NextResponse.redirect(successUrl);
}
