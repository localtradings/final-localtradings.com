export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  twelveDataApiKey: process.env.TWELVE_DATA_API_KEY ?? "",
  battleWorkerUrl: process.env.CLOUDFLARE_BATTLE_WORKER_URL ?? "",
  battleSharedSecret: process.env.CLOUDFLARE_BATTLE_SHARED_SECRET ?? "",
  cronSecret: process.env.CRON_SECRET ?? "",
};

export function hasSupabaseEnv() {
  return Boolean(
    env.supabaseUrl.trim().length > 0 && env.supabaseAnonKey.trim().length > 0,
  );
}

export function hasTwelveDataEnv() {
  return Boolean(env.twelveDataApiKey.trim().length > 0);
}

export function hasBattleWorkerEnv() {
  return Boolean(
    env.battleWorkerUrl.trim().length > 0 &&
      env.battleSharedSecret.trim().length > 0,
  );
}
