import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getMyProfile } from "@/lib/profile.functions";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const fn = useServerFn(getMyProfile);
  const { data: p } = useQuery({ queryKey: ["profile"], queryFn: () => fn() });

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="font-display text-3xl font-semibold">Profile</h1>
      <div className="mt-6 rounded-2xl border border-border bg-card p-6">
        {!p ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : (
          <dl className="grid grid-cols-2 gap-y-4 text-sm">
            <Row label="Name" value={p.display_name ?? "—"} />
            <Row label="Level" value={p.level ?? "—"} />
            <Row label="Native" value={p.native_language ?? "—"} />
            <Row label="Learning" value={p.target_language ?? "—"} />
            <Row label="Goal" value={p.goal ?? "—"} />
            <Row label="Daily target" value={`${p.daily_minutes ?? 15} min`} />
            <Row label="Streak" value={`${p.current_streak ?? 0} days`} />
            <Row label="XP" value={String(p.xp ?? 0)} />
          </dl>
        )}
        <div className="mt-6 flex gap-3">
          <Link to="/onboarding" className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
            Edit preferences
          </Link>
          <Link to="/placement" className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            Retake placement
          </Link>
        </div>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </>
  );
}
