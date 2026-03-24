"use server";

import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ActionState } from "@/types/auth";

const profileSchema = z.object({
  fullName: z.string().min(2),
  displayName: z.string().min(2),
  focusArea: z.string().min(2),
  bio: z.string().min(10).max(300),
});

export async function upsertProfile(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = profileSchema.safeParse({
    fullName: formData.get("fullName"),
    displayName: formData.get("displayName"),
    focusArea: formData.get("focusArea"),
    bio: formData.get("bio"),
  });

  if (!parsed.success) {
    return { status: "error", message: "Update all profile fields before saving." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      status: "error",
      message: "Supabase is not configured yet. Profile persistence is disabled.",
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "Sign in before updating your profile." };
  }

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    email: user.email,
    full_name: parsed.data.fullName,
    display_name: parsed.data.displayName,
    focus_area: parsed.data.focusArea,
    bio: parsed.data.bio,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  return { status: "success", message: "Profile updated." };
}
