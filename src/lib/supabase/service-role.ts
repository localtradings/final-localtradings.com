import { createClient } from "@supabase/supabase-js";

import { env, hasSupabaseEnv } from "@/lib/env";

export function createSupabaseServiceRoleClient() {
  if (!hasSupabaseEnv() || !env.supabaseServiceRoleKey) {
    return null;
  }

  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
