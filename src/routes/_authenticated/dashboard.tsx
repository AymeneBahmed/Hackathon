import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getMyProfile } from "@/lib/profile.functions";
import { listScenarios } from "@/lib/scenarios.functions";
import { listSessions, startSession } from "@/lib/sessions.functions";
import { Flame, ArrowRight, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const getProfile = useServerFn(getMyProfile);
  const listSc = useServerFn(listScenarios);
  const listSess = useServerFn(listSessions);
  const startSess = useServerFn(startSession);
  const [starting, setStarting] = useState<string | null>(null);

  const profileQ = useQuery({ queryKey: ["profile"], queryFn: () => getProfile() });
  const scenariosQ = useQuery({ queryKey: ["scenarios"], queryFn: () => listSc() });
  const sessionsQ = useQuery({ queryKey: ["sessions"], queryFn: () => listSess() });

  useEffect(() => {
    if (!profileQ.data) return;
    if (!profileQ.data.onboarded) navigate({ to: "/onboarding" });
    else if (!profileQ.data.placed) navigate({ to: "/placement" });
  }, [profileQ.data, navigate]);

  async function begin(slug: string) {
    setStarting(slug);
    try {
      const { sessionId } = await startSess({ data: { scenarioSlug: slug } });
      navigate({ to: "/chat/$sessionId", params: { sessionId } });
    } finally {
      setStarting(null);
    }
  }

  const profile = profileQ.data;
  const scenarios = scenariosQ.data ?? [];
  const sessions = sessionsQ.data ?? [];

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <section
        className="rounded-3xl border border-border p-6 md:p-8"
        style={{ background: "var(--gradient-warm)" }}
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary-foreground/80">
              {profile?.target_language ? `Learning ${profile.target_language}` : "Welcome"}
            </p>
            <h1 className="mt-1 font-display text-3xl font-semibold text-primary-foreground md:text-4xl">
              Hello {profile?.display_name ?? "there"} 👋
            </h1>
          </div>
          <div className="flex gap-2">
            <Stat label="Level" value={profile?.level ?? "—"} />
            <Stat label="Streak" value={`${profile?.current_streak ?? 0} 🔥`} />
            <Stat label="XP" value={String(profile?.xp ?? 0)} />
          </div>
        </div>
      </section>

      {sessions.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-2xl font-semibold">Continue practicing</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sessions.slice(0, 6).map((s) => {
              const sc = (s as { scenarios: { emoji: string; difficulty: string } | null })
                .scenarios;
              return (
                <button
                  key={s.id}
                  onClick={() => navigate({ to: "/chat/$sessionId", params: { sessionId: s.id } })}
                  className="rounded-2xl border border-border bg-card p-5 text-left transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-3xl">{sc?.emoji ?? "💬"}</div>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                      {sc?.difficulty ?? "—"}
                    </span>
                  </div>
                  <div className="mt-3 font-display text-lg font-semibold">{s.title}</div>
                  <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    Resume <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section className="mt-12">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-2xl font-semibold">Start a new scene</h2>
          <span className="text-sm text-muted-foreground">{scenarios.length} scenarios</span>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {scenarios.map((s) => (
            <article
              key={s.id}
              className="group rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]"
            >
              <div className="flex items-center justify-between">
                <div className="text-4xl">{s.emoji}</div>
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground">
                  CEFR · {s.difficulty}
                </span>
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
              <p className="mt-3 text-xs italic text-muted-foreground">Goal: {s.goal}</p>
              <button
                onClick={() => begin(s.slug)}
                disabled={starting === s.slug}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-50"
              >
                {starting === s.slug ? (
                  "Starting..."
                ) : (
                  <>
                    <Plus className="h-4 w-4" /> Start scene
                  </>
                )}
              </button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-background/90 px-4 py-3 text-center">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="font-display text-xl font-semibold">{value}</div>
    </div>
  );
}
