import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, MessageCircleHeart, Globe2, Zap, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

const SCENARIOS = [
  { emoji: "☕", title: "Coffee Shop", level: "A2" },
  { emoji: "✈️", title: "Airport Check-In", level: "B1" },
  { emoji: "💼", title: "Job Interview", level: "B2" },
  { emoji: "🩺", title: "Doctor Visit", level: "B1" },
  { emoji: "🛍️", title: "Clothes Shopping", level: "A2" },
  { emoji: "🚕", title: "Taxi Ride", level: "A1" },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-foreground text-background font-display text-lg font-bold">
            L
          </div>
          <span className="font-display text-lg font-semibold">Language Living</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="rounded-full px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Sign in
          </Link>
          <Link
            to="/login"
            className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background hover:opacity-90"
          >
            Get started
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        <section className="pt-12 pb-20 md:pt-20 md:pb-28">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Powered by Lovable AI
              </span>
              <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] md:text-6xl">
                Learn by <span className="italic text-primary">living</span> the language.
              </h1>
              <p className="mt-5 max-w-lg text-lg text-muted-foreground">
                Skip textbooks. Step into real-life scenarios with AI characters that adapt to your
                level — and gently correct you as you go.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/login"
                  className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-[var(--shadow-warm)] hover:opacity-95"
                >
                  Start learning free
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <a
                  href="#how"
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-base font-medium text-foreground hover:bg-muted"
                >
                  How it works
                </a>
              </div>
              <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Globe2 className="h-4 w-4 text-accent" /> 30+ languages
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-accent" /> Adaptive to your CEFR level
                </div>
              </div>
            </div>

            <div className="relative">
              <div
                className="absolute -inset-4 -z-10 rounded-[2rem] opacity-60 blur-2xl"
                style={{ background: "var(--gradient-warm)" }}
              />
              <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
                <div className="flex items-center gap-3 border-b border-border pb-4">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/15 text-xl">
                    ☕
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Sofia · Barista</div>
                    <div className="text-xs text-muted-foreground">Coffee Shop · A2</div>
                  </div>
                </div>
                <div className="space-y-3 pt-4 text-sm">
                  <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5">
                    Buongiorno! What can I get you today?
                  </div>
                  <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-primary-foreground">
                    I would like one cappuccino, please.
                  </div>
                  <div className="rounded-xl border border-accent/30 bg-accent/10 px-3 py-2 text-xs text-foreground">
                    <span className="font-semibold text-accent">Tip</span> · In Italian cafés, try{" "}
                    <em>"Un cappuccino, per favore."</em>
                  </div>
                  <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5">
                    Perfetto! Anything to eat with that?
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how" className="pb-24">
          <h2 className="font-display text-3xl font-semibold md:text-4xl">
            How Language Living works
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Sparkles,
                title: "Adaptive placement",
                body: "A 5-minute CEFR test pins your level and finds your weak spots.",
              },
              {
                icon: MessageCircleHeart,
                title: "Real-life scenarios",
                body: "Order food, book a hotel, ace an interview — with AI characters.",
              },
              {
                icon: Zap,
                title: "Live coaching",
                body: "Get gentle corrections, pronunciation feedback, and a daily streak.",
              },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-border bg-card p-6">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-xl font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="pb-24">
          <h2 className="font-display text-3xl font-semibold md:text-4xl">
            Pick a scene. Start speaking.
          </h2>
          <p className="mt-3 max-w-xl text-muted-foreground">
            A library of real-world situations, from buying coffee to negotiating a raise.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
            {SCENARIOS.map((s) => (
              <div
                key={s.title}
                className="group rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]"
              >
                <div className="text-3xl">{s.emoji}</div>
                <div className="mt-3 font-display text-lg font-semibold">{s.title}</div>
                <div className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  CEFR · {s.level}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section
          className="mb-24 rounded-3xl border border-border p-8 md:p-12"
          style={{ background: "var(--gradient-warm)" }}
        >
          <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="font-display text-3xl font-semibold text-primary-foreground md:text-4xl">
                Ready to live your next language?
              </h3>
              <p className="mt-2 text-primary-foreground/80">Free to start. No credit card.</p>
            </div>
            <Link
              to="/login"
              className="rounded-full bg-foreground px-6 py-3 text-base font-semibold text-background hover:opacity-90"
            >
              Create your account
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Language Living AI
      </footer>
    </div>
  );
}
