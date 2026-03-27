import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { env, hasSupabaseEnv } from "@/lib/env";

export async function updateSession(request: NextRequest) {
  if (!hasSupabaseEnv()) {
    if (request.nextUrl.pathname.startsWith("/app")) {
      const url = request.nextUrl.clone();
      url.pathname = "/sign-in";
      url.searchParams.set("redirectTo", request.nextUrl.pathname);
      url.searchParams.set("reason", "config");
      return NextResponse.redirect(url);
    }

    return NextResponse.next({ request });
  }

  const response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && request.nextUrl.pathname.startsWith("/app")) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("redirectTo", request.nextUrl.pathname);
    url.searchParams.set("reason", "auth");
    return NextResponse.redirect(url);
  }

  return response;
}
