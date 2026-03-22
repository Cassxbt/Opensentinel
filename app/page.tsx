import Link from "next/link";
import { ArrowRight, Orbit, ShieldCheck, Wallet } from "lucide-react";

const featureCards = [
  {
    title: "Agent Wallet Authority",
    body: "Give an agent execution power without surrendering control. Policies stay explicit, visible, and bounded.",
    icon: Wallet,
  },
  {
    title: "Explainable Policy Engine",
    body: "Every command is translated into a concrete plan, checked against policy, then surfaced in plain English before it runs.",
    icon: ShieldCheck,
  },
  {
    title: "Receipts Built In",
    body: "Dry-runs, decisions, transaction hashes, and post-action traces are captured in one audit timeline built for Synthesis judging.",
    icon: Orbit,
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)]">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(194,255,79,0.18),_transparent_32%),radial-gradient(circle_at_80%_20%,_rgba(255,163,26,0.12),_transparent_28%),linear-gradient(180deg,_#0b0e0d,_#111513_45%,_#171b18)]" />
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col justify-between px-6 py-8 md:px-10">
        <header className="flex items-center justify-between border-b border-[var(--line)] pb-5">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[var(--text-muted)]">
              Open Sentinel
            </p>
            <p className="mt-2 max-w-md text-sm text-[var(--text-dim)]">
              Policy-first wallet control for autonomous agents.
            </p>
          </div>
          <div className="rounded-full border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-2 text-xs uppercase tracking-[0.22em] text-[var(--accent)]">
            Synthesis Build
          </div>
        </header>

        <div className="grid gap-16 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="space-y-8">
            <div className="space-y-4">
              <p className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--panel-soft)] px-3 py-1 text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">
                Agents that pay
              </p>
              <h1 className="max-w-4xl text-5xl font-semibold uppercase leading-[0.92] tracking-[-0.04em] md:text-7xl">
                Let agents move money without letting them roam.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-[var(--text-dim)] md:text-lg">
                Open Sentinel gives AI agents a dedicated wallet, a visible
                policy perimeter, and a receipt trail judges can verify. It is
                built to show deep wallet infrastructure understanding without
                collapsing into an overbuilt platform.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link className="action-button" href="/sentinel">
                Launch Sentinel
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a className="ghost-button" href="#spec">
                View MVP Scope
              </a>
            </div>
          </div>

          <div className="rotated-panel">
            <div className="grid gap-4">
              <div className="stat-strip">
                <span>Primary Tracks</span>
                <strong>OWS + MoonPay CLI</strong>
              </div>
              <div className="stat-strip">
                <span>Hero Demo</span>
                <strong>Bridge + Swap with Guardrails</strong>
              </div>
              <div className="stat-strip">
                <span>Core Signal</span>
                <strong>Bounded Autonomy</strong>
              </div>
            </div>
          </div>
        </div>

        <section id="spec" className="grid gap-5 border-t border-[var(--line)] py-10 md:grid-cols-3">
          {featureCards.map(({ title, body, icon: Icon }) => (
            <article key={title} className="feature-card">
              <div className="mb-5 inline-flex rounded-full border border-[var(--line)] bg-[var(--panel-soft)] p-3 text-[var(--accent)]">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold uppercase tracking-[-0.03em]">
                {title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-[var(--text-dim)]">
                {body}
              </p>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
