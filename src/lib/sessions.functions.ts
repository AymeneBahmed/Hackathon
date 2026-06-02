import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listSessions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("sessions")
      .select("id,title,created_at,scenario_id,last_score,scenarios(emoji,title,difficulty)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const startSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ scenarioSlug: z.string().min(1).max(60) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: sc, error: scErr } = await supabase
      .from("scenarios")
      .select("*")
      .eq("slug", data.scenarioSlug)
      .maybeSingle();
    if (scErr) throw new Error(scErr.message);
    if (!sc) throw new Error("Scenario not found");

    const { data: session, error } = await supabase
      .from("sessions")
      .insert({
        user_id: userId,
        scenario_id: sc.id,
        title: sc.title,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { sessionId: session.id };
  });

export const getSession = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ sessionId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: session, error } = await supabase
      .from("sessions")
      .select("*,scenarios(*)")
      .eq("id", data.sessionId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!session) throw new Error("Session not found");

    const { data: messages, error: mErr } = await supabase
      .from("messages")
      .select("*")
      .eq("session_id", data.sessionId)
      .order("created_at", { ascending: true });
    if (mErr) throw new Error(mErr.message);

    return { session, messages: messages ?? [] };
  });
