import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { PLACEMENT_BANK } from "@/lib/cefr";
import { submitPlacement } from "@/lib/placement.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/placement")({
  component: PlacementTest,
});

function PlacementTest() {
  const navigate = useNavigate();
  const submit = useServerFn(submitPlacement);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<null | Awaited<ReturnType<typeof submit>>>(null);

  const q = PLACEMENT_BANK[i];
  const total = PLACEMENT_BANK.length;

  function choose(idx: number) {
    setAnswers((a) => ({ ...a, [q.id]: idx }));
    if (i < total - 1) setTimeout(() => setI(i + 1), 150);
  }

  async function finalize() {
    setBusy(true);
    try {
      const r = await submit({ data: { answers } });
      setResult(r);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <main className="mx-auto max-w-xl px-6 py-16">
        <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-[var(--shadow-soft)]">
          <div className="font-display text-6xl font-bold text-primary">{result.level}</div>
          <div className="mt-2 text-sm text-muted-foreground">Confidence {result.confidence}%</div>
          <div className="mt-6 grid grid-cols-2 gap-3 text-left">
            <Tile label="Strengths" items={result.strengths} tone="success" />
            <Tile label="Focus areas" items={result.weaknesses} tone="warning" />
          </div>
          <button
            onClick={() => navigate({ to: "/dashboard" })}
            className="mt-8 w-full rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground"
          >
            Take me to scenarios
          </button>
        </div>
      </main>
    );
  }

  const answered = Object.keys(answers).length;
  const canFinish = answered === total;

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>Placement test</span>
        <span>
          {i + 1} / {total}
        </span>
      </div>
      <div className="mb-6 h-1.5 w-full rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${((i + 1) / total) * 100}%` }}
        />
      </div>

      <div className="rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-soft)]">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {q.skill} · {q.level}
        </div>
        {q.passage && <p className="mt-3 rounded-xl bg-muted p-4 italic">{q.passage}</p>}
        <h2 className="mt-4 font-display text-2xl font-semibold">{q.prompt}</h2>
        <div className="mt-6 space-y-2">
          {q.options.map((opt, idx) => {
            const picked = answers[q.id] === idx;
            return (
              <button
                key={idx}
                onClick={() => choose(idx)}
                className={`block w-full rounded-xl border px-4 py-3 text-left text-sm transition ${picked ? "border-primary bg-primary/10" : "border-border bg-background hover:bg-muted"}`}
              >
                {opt}
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => setI(Math.max(0, i - 1))}
            disabled={i === 0}
            className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-30"
          >
            ← Previous
          </button>
          {i < total - 1 ? (
            <button
              onClick={() => setI(i + 1)}
              className="rounded-full bg-muted px-5 py-2 text-sm font-medium"
            >
              Skip
            </button>
          ) : (
            <button
              onClick={finalize}
              disabled={!canFinish || busy}
              className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {busy ? "Scoring..." : canFinish ? "Get my level" : `Answer ${total - answered} more`}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

function Tile({
  label,
  items,
  tone,
}: {
  label: string;
  items: string[];
  tone: "success" | "warning";
}) {
  const bg = tone === "success" ? "bg-accent/15 text-accent-foreground" : "bg-warning/15";
  return (
    <div className={`rounded-2xl p-4 ${bg}`}>
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 text-sm font-medium capitalize">
        {items.length ? items.join(", ") : "—"}
      </div>
    </div>
  );
}
