import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getProgressOverview } from "@/lib/progress.functions";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Flame, Trophy, Target } from "lucide-react";

export const Route = createFileRoute("/_authenticated/progress")({
  component: Progress,
});

function Progress() {
  const fn = useServerFn(getProgressOverview);
  const { data, isLoading } = useQuery({ queryKey: ["progress"], queryFn: () => fn() });

  if (isLoading || !data) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10 text-muted-foreground">Loading progress…</main>
    );
  }

  const p = data.profile;
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="font-display text-3xl font-semibold">Your progress</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card
          icon={<Trophy className="h-5 w-5 text-primary" />}
          label="Level"
          value={p?.level ?? "—"}
        />
        <Card
          icon={<Flame className="h-5 w-5 text-primary" />}
          label="Streak"
          value={`${p?.current_streak ?? 0}d`}
        />
        <Card
          icon={<Target className="h-5 w-5 text-primary" />}
          label="XP"
          value={String(p?.xp ?? 0)}
        />
        <Card label="Sessions (30d)" value={String(data.totalSessions)} />
      </div>

      <section className="mt-8 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display text-xl font-semibold">Average score per day</h2>
        <div className="mt-4 h-64">
          {data.timeline.length === 0 ? (
            <div className="grid h-full place-items-center text-sm text-muted-foreground">
              No sessions yet — start one from the dashboard.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.timeline}>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
                <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis domain={[0, 100]} stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="avg"
                  stroke="var(--color-primary)"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <List title="Strengths" items={(p?.strengths as string[] | undefined) ?? []} />
        <List title="Focus areas" items={(p?.weaknesses as string[] | undefined) ?? []} />
      </section>
    </main>
  );
}

function Card({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </div>
      <div className="mt-2 font-display text-3xl font-semibold">{value}</div>
    </div>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.length === 0 && <span className="text-sm text-muted-foreground">—</span>}
        {items.map((x) => (
          <span key={x} className="rounded-full bg-muted px-3 py-1 text-sm capitalize">
            {x}
          </span>
        ))}
      </div>
    </div>
  );
}
