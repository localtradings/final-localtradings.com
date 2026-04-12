import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getTrustedAppOrigin } from "@/lib/security/origin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  ensureProfileForUser,
  getSafeAuthNextPath,
  mapAuthErrorMessage,
} from "@/server/auth/utils";

function getSourcePath(source: string | null) {
  return source === "sign-up" ? "/sign-up" : "/sign-in";
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const appOrigin = getTrustedAppOrigin(requestUrl);
  const code = requestUrl.searchParams.get("code");
  const nextPath = getSafeAuthNextPath(requestUrl.searchParams.get("next"));
  const sourcePath = getSourcePath(requestUrl.searchParams.get("source"));

  if (!code) {
    const missingCodeUrl = new URL(sourcePath, appOrigin);
    missingCodeUrl.searchParams.set("status", "error");
    missingCodeUrl.searchParams.set("message", "Authentication callback is missing its auth code.");
    missingCodeUrl.searchParams.set("redirectTo", nextPath);
    return NextResponse.redirect(missingCodeUrl);
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    const configUrl = new URL(sourcePath, appOrigin);
    configUrl.searchParams.set("status", "error");
    configUrl.searchParams.set("message", "Supabase auth is not configured yet.");
    configUrl.searchParams.set("redirectTo", nextPath);
    return NextResponse.redirect(configUrl);
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const errorUrl = new URL(sourcePath, appOrigin);
    errorUrl.searchParams.set("status", "error");
    errorUrl.searchParams.set("message", mapAuthErrorMessage(error.message));
    errorUrl.searchParams.set("redirectTo", nextPath);
    return NextResponse.redirect(errorUrl);
  }

  await ensureProfileForUser(data.user ?? data.session?.user);
  revalidatePath("/app");

  return NextResponse.redirect(new URL(nextPath, appOrigin));
}
