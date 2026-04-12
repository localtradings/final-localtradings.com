import { z } from "zod";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import type { FeedbackInput } from "@/types/data";

const feedbackSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  topic: z.string().min(2),
  message: z.string().min(20).max(1200),
  source: z.enum(["public-help", "product-help"]),
});

export async function submitFeedback(input: FeedbackInput) {
  const parsed = feedbackSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: "Please complete all feedback fields." };
  }

  const supabase = createSupabaseServiceRoleClient();
  if (!supabase) {
    return {
      ok: false,
      message: "Feedback storage requires Supabase configuration.",
    };
  }

  const { error } = await supabase.from("feedback").insert({
    name: parsed.data.name,
    email: parsed.data.email,
    topic: parsed.data.topic,
    message: parsed.data.message,
    source: parsed.data.source,
  });

  if (error) {
    console.error("[feedback] insert_failed", error.message);
    return { ok: false, message: "Feedback could not be submitted right now." };
  }

  return { ok: true };
}
