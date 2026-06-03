import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getProgressOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const since = new Date(Date.now() - 30 * 86400000).toISOString();

    const [profileRes, sessionsRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("xp,current_streak,level,strengths,weaknesses")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("sessions")
        .select("id,title,created_at,last_score")
        .eq("user_id", userId)
        .gte("created_at", since)
        .order("created_at", { ascending: true }),
    ]);

    if (profileRes.error) throw new Error(profileRes.error.message);
    if (sessionsRes.error) throw new Error(sessionsRes.error.message);

    const sessions = sessionsRes.data ?? [];
    const byDay: Record<string, { day: string; sessions: number; avg: number; total: number }> = {};
    for (const s of sessions) {
      const day = (s.created_at as string).slice(0, 10);
      byDay[day] ??= { day, sessions: 0, avg: 0, total: 0 };
      const score = (s.last_score as { overall?: number } | null)?.overall ?? 0;
      byDay[day].sessions++;
      byDay[day].total += score;
      byDay[day].avg = Math.round(byDay[day].total / byDay[day].sessions);
    }
    const timeline = Object.values(byDay);

    return {
      profile: profileRes.data,
      totalSessions: sessions.length,
      timeline,
      recent: sessions.slice(-10).reverse(),
    };
  });
