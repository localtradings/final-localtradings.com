import type { Provider } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { getTrustedAppOrigin } from "@/lib/security/origin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSafeAuthNextPath, mapAuthErrorMessage } from "@/server/auth/utils";

const supportedProviders = new Set<Provider>(["apple", "google"]);

function getSourcePath(source: string | null) {
  return source === "sign-up" ? "/sign-up" : "/sign-in";
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const appOrigin = getTrustedAppOrigin(requestUrl);
  const provider = requestUrl.searchParams.get("provider") as Provider | null;
  const nextPath = getSafeAuthNextPath(requestUrl.searchParams.get("next"));
  const sourcePath = getSourcePath(requestUrl.searchParams.get("source"));

  if (!provider || !supportedProviders.has(provider)) {
    const invalidUrl = new URL(sourcePath, appOrigin);
    invalidUrl.searchParams.set("status", "error");
    invalidUrl.searchParams.set("message", "Unsupported sign-in provider.");
    invalidUrl.searchParams.set("redirectTo", nextPath);
    return NextResponse.redirect(invalidUrl);
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    const configUrl = new URL(sourcePath, appOrigin);
    configUrl.searchParams.set("status", "error");
    configUrl.searchParams.set("message", "Supabase auth is not configured yet.");
    configUrl.searchParams.set("redirectTo", nextPath);
    return NextResponse.redirect(configUrl);
  }

  const callbackUrl = new URL("/auth/callback", appOrigin);
  callbackUrl.searchParams.set("next", nextPath);
  callbackUrl.searchParams.set("source", sourcePath.replace("/", ""));

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: callbackUrl.toString(),
    },
  });

  if (error || !data.url) {
    const errorUrl = new URL(sourcePath, appOrigin);
    errorUrl.searchParams.set("status", "error");
    errorUrl.searchParams.set("message", mapAuthErrorMessage(error?.message ?? "OAuth sign-in could not start."));
    errorUrl.searchParams.set("redirectTo", nextPath);
    return NextResponse.redirect(errorUrl);
  }

  return NextResponse.redirect(data.url);
}
