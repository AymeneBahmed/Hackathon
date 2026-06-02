import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { scorePlacement } from "./cefr";

const Schema = z.object({
  answers: z.record(z.string(), z.number().int().min(0).max(10)),
});

export const submitPlacement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => Schema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const result = scorePlacement(data.answers);

    const { error: insErr } = await supabase.from("placement_results").insert({
      user_id: userId,
      level: result.level,
      confidence: result.confidence,
      strengths: result.strengths,
      weaknesses: result.weaknesses,
      answers: data.answers,
    });
    if (insErr) throw new Error(insErr.message);

    const { error: upErr } = await supabase
      .from("profiles")
      .update({
        level: result.level,
        strengths: result.strengths,
        weaknesses: result.weaknesses,
        placed: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
    if (upErr) throw new Error(upErr.message);

    return result;
  });
