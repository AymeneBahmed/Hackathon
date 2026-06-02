import { Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Flame, LogOut } from "lucide-react";

export function AppHeader() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [streak, setStreak] = useState<number | null>(null);
  const [xp, setXp] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active || !user) return;
      setEmail(user.email ?? null);
      const { data } = await supabase
        .from("profiles")
        .select("current_streak,xp")
        .eq("id", user.id)
        .maybeSingle();
      if (!active) return;
      setStreak(data?.current_streak ?? 0);
      setXp(data?.xp ?? 0);
    })();
    return () => { active = false; };
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    router.navigate({ to: "/" });
  }

  return (
    <header className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-30">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-foreground text-background font-display text-base font-bold">L</div>
          <span className="font-display text-base font-semibold">Language Living</span>
        </Link>
        <nav className="hidden items-center gap-1 text-sm md:flex">
          <Link to="/dashboard" className="rounded-full px-3 py-1.5 hover:bg-muted" activeProps={{ className: "bg-muted font-semibold" }}>Scenarios</Link>
          <Link to="/progress" className="rounded-full px-3 py-1.5 hover:bg-muted" activeProps={{ className: "bg-muted font-semibold" }}>Progress</Link>
          <Link to="/profile" className="rounded-full px-3 py-1.5 hover:bg-muted" activeProps={{ className: "bg-muted font-semibold" }}>Profile</Link>
        </nav>
        <div className="flex items-center gap-3">
          {streak !== null && (
            <span className="hidden items-center gap-1 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-foreground sm:inline-flex">
              <Flame className="h-3.5 w-3.5 text-primary" /> {streak}
            </span>
          )}
          {xp !== null && (
            <span className="hidden rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-foreground sm:inline-block">
              {xp} XP
            </span>
          )}
          <button
            onClick={logout}
            title={email ?? "Sign out"}
            className="grid h-8 w-8 place-items-center rounded-full border border-border bg-card hover:bg-muted"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
