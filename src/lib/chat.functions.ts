import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { aiJSON } from "./ai-gateway.server";

const Schema = z.object({
  sessionId: z.string().uuid(),
  message: z.string().trim().min(1).max(1000),
});

interface AiTurn {
  reply: string;
  correction: null | {
    original: string;
    corrected: string;
    explanation: string;
  };
  score: {
    accuracy: number;
    fluency: number;
    vocabulary: number;
    overall: number;
  };
}

export const sendChatMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => Schema.parse(input))
  .handler(
    async ({
      data,
      context,
    }): Promise<AiTurn & { userMessageId: string; assistantMessageId: string }> => {
      const { supabase, userId } = context;

      // Load session + scenario + profile + history
      const [
        { data: session, error: sErr },
        { data: profile, error: pErr },
        { data: history, error: hErr },
      ] = await Promise.all([
        supabase
          .from("sessions")
          .select("id,user_id,scenarios(*)")
          .eq("id", data.sessionId)
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("target_language,native_language,level,weaknesses")
          .eq("id", userId)
          .maybeSingle(),
        supabase
          .from("messages")
          .select("role,content")
          .eq("session_id", data.sessionId)
          .order("created_at", { ascending: true })
          .limit(40),
      ]);

      if (sErr) throw new Error(sErr.message);
      if (!session) throw new Error("Session not found");
      if (pErr) throw new Error(pErr.message);
      if (hErr) throw new Error(hErr.message);

      const scenario = (session as { scenarios: Record<string, string> }).scenarios;
      const target = profile?.target_language || "English";
      const native = profile?.native_language || "English";
      const level = profile?.level || "A2";
      const weaknesses = (profile?.weaknesses as string[] | null)?.join(", ") || "general fluency";

      const systemPrompt = `You are ${scenario.character_name}, a ${scenario.character_role}.
Scenario: ${scenario.title}. Context: ${scenario.context}. Goal: ${scenario.goal}.
Stay fully in character. Speak ${target} naturally. The learner's CEFR level is ${level}; their native language is ${native}; their weak areas are: ${weaknesses}.
Keep replies SHORT (1-3 sentences), conversational, level-appropriate. Ask follow-up questions to keep the dialog moving.

After speaking in character, analyze the LEARNER'S LAST MESSAGE for the most important mistake (grammar, vocab, or naturalness). If their message is fine, set correction to null.

Score the learner's last message 0-100 on accuracy, fluency, vocabulary; overall is the average.

Reply with ONLY valid JSON matching:
{
  "reply": "string in ${target}",
  "correction": null | { "original": "string", "corrected": "string", "explanation": "short explanation in ${native}" },
  "score": { "accuracy": number, "fluency": number, "vocabulary": number, "overall": number }
}`;

      const messages = [
        { role: "system" as const, content: systemPrompt },
        ...(history ?? []).map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        { role: "user" as const, content: data.message },
      ];

      const turn = await aiJSON<AiTurn>({ messages });

      // Persist both messages
      const { data: userMsg, error: u1 } = await supabase
        .from("messages")
        .insert({
          session_id: data.sessionId,
          user_id: userId,
          role: "user",
          content: data.message,
        })
        .select("id")
        .single();
      if (u1) throw new Error(u1.message);

      const { data: aiMsg, error: u2 } = await supabase
        .from("messages")
        .insert({
          session_id: data.sessionId,
          user_id: userId,
          role: "assistant",
          content: turn.reply,
          correction: turn.correction,
        })
        .select("id")
        .single();
      if (u2) throw new Error(u2.message);

      // Update session score + bump XP
      await supabase
        .from("sessions")
        .update({ last_score: turn.score, updated_at: new Date().toISOString() })
        .eq("id", data.sessionId);

      const xpGain = Math.max(1, Math.round((turn.score.overall ?? 60) / 10));
      await supabase.rpc; // noop reference for clarity
      const { data: prof } = await supabase
        .from("profiles")
        .select("xp,current_streak,last_active_date")
        .eq("id", userId)
        .maybeSingle();
      if (prof) {
        const today = new Date().toISOString().slice(0, 10);
        let streak = prof.current_streak ?? 0;
        if (prof.last_active_date !== today) {
          const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
          streak = prof.last_active_date === yesterday ? streak + 1 : 1;
        }
        await supabase
          .from("profiles")
          .update({ xp: (prof.xp ?? 0) + xpGain, current_streak: streak, last_active_date: today })
          .eq("id", userId);
      }

      return {
        ...turn,
        userMessageId: userMsg.id as string,
        assistantMessageId: aiMsg.id as string,
      };
    },
  );

export const openingLine = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ sessionId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Skip if already has messages
    const { count } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("session_id", data.sessionId);
    if ((count ?? 0) > 0) return { ok: true, skipped: true };

    const { data: session } = await supabase
      .from("sessions")
      .select("id,user_id,scenarios(*)")
      .eq("id", data.sessionId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!session) throw new Error("Session not found");
    const scenario = (session as { scenarios: Record<string, string> }).scenarios;
    const { data: profile } = await supabase
      .from("profiles")
      .select("target_language,level")
      .eq("id", userId)
      .maybeSingle();
    const target = profile?.target_language || "English";
    const level = profile?.level || "A2";

    const result = await aiJSON<{ reply: string }>({
      messages: [
        {
          role: "system",
          content: `You are ${scenario.character_name}, a ${scenario.character_role}. Start the conversation in ${target} at CEFR level ${level} for this scenario: ${scenario.title} — ${scenario.context}. Be warm, in character, and ask the learner an opening question. Reply with ONLY JSON: {"reply": "..."}`,
        },
      ],
    });

    await supabase.from("messages").insert({
      session_id: data.sessionId,
      user_id: userId,
      role: "assistant",
      content: result.reply,
    });
    return { ok: true };
  });
