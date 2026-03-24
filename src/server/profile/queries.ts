import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProfileRecord } from "@/types/data";

export async function getCurrentProfile(userId: string): Promise<ProfileRecord | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, display_name, bio, focus_area")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    email: data.email ?? "",
    fullName: data.full_name ?? "",
    displayName: data.display_name ?? "",
    bio: data.bio,
    focusArea: data.focus_area,
  };
}
