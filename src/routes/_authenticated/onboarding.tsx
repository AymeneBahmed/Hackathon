import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { saveOnboarding } from "@/lib/profile.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: Onboarding,
});

const LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "Italian",
  "German",
  "Portuguese",
  "Japanese",
  "Korean",
  "Mandarin",
  "Arabic",
  "Dutch",
  "Turkish",
];
const GOALS = [
  { id: "travel", label: "Travel", emoji: "✈️" },
  { id: "work", label: "Work", emoji: "💼" },
  { id: "study", label: "Study", emoji: "📚" },
  { id: "personal", label: "Personal", emoji: "💜" },
] as const;
const INTERESTS = [
  "Travel",
  "Technology",
  "Movies",
  "Sports",
  "Music",
  "Business",
  "Gaming",
  "Food",
  "Books",
  "Art",
  "Science",
  "Fashion",
];

function Onboarding() {
  const navigate = useNavigate();
  const save = useServerFn(saveOnboarding);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    display_name: "",
    native_language: "English",
    target_language: "Italian",
    goal: "travel" as "travel" | "work" | "study" | "personal",
    daily_minutes: 15,
    interests: [] as string[],
  });

  function toggleInterest(x: string) {
    setForm((f) => ({
      ...f,
      interests: f.interests.includes(x)
        ? f.interests.filter((i) => i !== x)
        : [...f.interests, x].slice(0, 8),
    }));
  }

  async function finish() {
    setBusy(true);
    try {
      await save({ data: form });
      toast.success("Profile set. Let's place your level.");
      navigate({ to: "/placement" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-6 flex items-center gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`}
          />
        ))}
      </div>

      <div className="rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-soft)]">
        {step === 0 && (
          <div>
            <h1 className="font-display text-3xl font-semibold">What should we call you?</h1>
            <p className="mt-1 text-muted-foreground">And which language are you here to learn?</p>
            <div className="mt-6 space-y-4">
              <input
                placeholder="Your name"
                value={form.display_name}
                onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base outline-none focus:border-primary"
              />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Native language">
                  <select
                    value={form.native_language}
                    onChange={(e) => setForm({ ...form, native_language: e.target.value })}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Learning">
                  <select
                    value={form.target_language}
                    onChange={(e) => setForm({ ...form, target_language: e.target.value })}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h1 className="font-display text-3xl font-semibold">Why are you learning?</h1>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {GOALS.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setForm({ ...form, goal: g.id })}
                  className={`rounded-2xl border p-5 text-left transition ${form.goal === g.id ? "border-primary bg-primary/10" : "border-border bg-background hover:bg-muted"}`}
                >
                  <div className="text-3xl">{g.emoji}</div>
                  <div className="mt-2 font-display text-lg font-semibold">{g.label}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 className="font-display text-3xl font-semibold">How much time per day?</h1>
            <p className="mt-1 text-muted-foreground">A little daily beats a lot weekly.</p>
            <div className="mt-8">
              <input
                type="range"
                min={5}
                max={60}
                step={5}
                value={form.daily_minutes}
                onChange={(e) => setForm({ ...form, daily_minutes: Number(e.target.value) })}
                className="w-full accent-[var(--color-primary)]"
              />
              <div className="mt-2 text-center font-display text-4xl font-semibold">
                {form.daily_minutes} min
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h1 className="font-display text-3xl font-semibold">What are you into?</h1>
            <p className="mt-1 text-muted-foreground">We'll bias your scenarios toward these.</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {INTERESTS.map((x) => (
                <button
                  key={x}
                  onClick={() => toggleInterest(x)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${form.interests.includes(x) ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-muted"}`}
                >
                  {x}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-between">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="rounded-full px-5 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-30"
          >
            Back
          </button>
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={step === 0 && !form.display_name.trim()}
              className="rounded-full bg-foreground px-6 py-2.5 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-50"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={finish}
              disabled={busy}
              className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "Saving..." : "Finish"}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
