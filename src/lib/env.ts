const requiredSupabaseKeys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

export function hasSupabaseEnv() {
  return requiredSupabaseKeys.every((key) => {
    const value = process.env[key];
    return Boolean(value && value.trim().length > 0);
  });
}

export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  twelveDataApiKey: process.env.TWELVE_DATA_API_KEY ?? "",
};

export function hasTwelveDataEnv() {
  return Boolean(env.twelveDataApiKey.trim().length > 0);
}
