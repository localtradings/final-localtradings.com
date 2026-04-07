"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ActionState } from "@/types/auth";

const signInSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

const signUpSchema = signInSchema.extend({
  displayName: z.string().trim().max(60).optional().or(z.literal("")),
});

export async function signIn(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { status: "error", message: "Enter a valid email and password." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      status: "error",
      message: "Supabase is not configured yet. Add env values to enable sign in.",
    };
  }

  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { status: "error", message: error.message };
  }

  const redirectTo = formData.get("redirectTo");
  const nextPath =
    typeof redirectTo === "string" && redirectTo.startsWith("/app")
      ? redirectTo
      : "/app";

  revalidatePath("/app");
  redirect(nextPath);
}

export async function signUp(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const displayNameInput = formData.get("displayName") ?? formData.get("fullName");
  const parsed = signUpSchema.safeParse({
    displayName: typeof displayNameInput === "string" ? displayNameInput : "",
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Provide a valid email and a password with at least 8 characters.",
    };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      status: "error",
      message: "Supabase is not configured yet. Add env values to enable sign up.",
    };
  }

  const profileName =
    parsed.data.displayName?.trim() ||
    parsed.data.email.split("@")[0] ||
    "Trader";

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: profileName,
        display_name: profileName,
      },
    },
  });

  if (error) {
    return { status: "error", message: error.message };
  }

  if (data.user && data.session) {
    await supabase.from("profiles").upsert({
      id: data.user.id,
      email: parsed.data.email,
      full_name: profileName,
      display_name: profileName,
      focus_area: "Candlesticks and risk management",
      bio: "Focused on building structured habits before risking real money.",
      updated_at: new Date().toISOString(),
    });
  }

  if (!data.session) {
    return {
      status: "success",
      message:
        "Account created. Check your email to confirm it, then sign in.",
    };
  }

  revalidatePath("/app");
  redirect("/app");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase?.auth.signOut();
  redirect("/sign-in");
}
