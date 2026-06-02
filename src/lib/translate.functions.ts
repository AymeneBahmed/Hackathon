import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { aiJSON } from "./ai-gateway.server";

const Schema = z.object({
  text: z.string().trim().min(1).max(2000),
  targetLanguage: z.string().trim().min(2).max(40).default("Arabic"),
});

export const translateText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => Schema.parse(input))
  .handler(async ({ data }): Promise<{ translation: string }> => {
    const result = await aiJSON<{ translation: string }>({
      messages: [
        {
          role: "system",
          content: `You are a precise translator. Translate the user's text into ${data.targetLanguage}. Preserve meaning and tone. Reply with ONLY JSON: {"translation": "..."}`,
        },
        { role: "user", content: data.text },
      ],
      temperature: 0.2,
    });
    return { translation: result.translation };
  });
