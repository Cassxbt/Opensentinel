"use client";

import { useEffect, useState, useTransition } from "react";
import { ArrowUpRight, Orbit, ShieldCheck, Sparkles } from "lucide-react";
import { CommandConsole } from "@/components/command-console";
import { PolicyForm } from "@/components/policy-form";
import { ReceiptTimeline } from "@/components/receipt-timeline";
import { ReviewPanel } from "@/components/review-panel";
import { WalletStatus } from "@/components/wallet-status";
import { defaultPolicy, demoReceipts, starterPrompt } from "@/lib/demo-data";
import { createCommandPlan } from "@/lib/command-parser";
import { evaluateCommandPlan } from "@/lib/policy-engine";
import type {
  CommandPlan,
  CounterpartyResolution,
  Policy,
  PolicyEvaluation,
  Receipt,
  WalletRuntime,
} from "@/lib/types";

export function AppShell() {
  const [policy, setPolicy] = useState<Policy>(defaultPolicy);
  const [prompt, setPrompt] = useState(starterPrompt);
  const [plan, setPlan] = useState<CommandPlan>(() => createCommandPlan(starterPrompt));
  const [policyResult, setPolicyResult] = useState<PolicyEvaluation>(() =>
    evaluateCommandPlan(createCommandPlan(starterPrompt), defaultPolicy),
  );
  const [counterparty, setCounterparty] = useState<CounterpartyResolution | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>(demoReceipts);
  const [wallet, setWallet] = useState<WalletRuntime | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;

    async function loadWallet() {
      try {
        const response = await fetch("/api/runtime");
        const data = (await response.json()) as { wallet: WalletRuntime };
        if (active) {
          setWallet(data.wallet);
        }
      } catch {
        if (active) {
          setWallet(null);
        }
      }
    }

    void loadWallet();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    startTransition(async () => {
      try {
        const planResponse = await fetch("/api/plan", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt }),
          signal: controller.signal,
        });
        const planData = (await planResponse.json()) as {
          plan: CommandPlan;
          counterparty: CounterpartyResolution | null;
        };

        const dryRunResponse = await fetch("/api/dry-run", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            plan: planData.plan,
            policy,
            counterparty: planData.counterparty,
          }),
          signal: controller.signal,
        });
        const dryRunData = (await dryRunResponse.json()) as {
          result: PolicyEvaluation;
        };

        setPlan(planData.plan);
        setCounterparty(planData.counterparty);
        setPolicyResult(dryRunData.result);
      } catch {
        const fallbackPlan = createCommandPlan(prompt);
        setPlan(fallbackPlan);
        setCounterparty(null);
        setPolicyResult(evaluateCommandPlan(fallbackPlan, policy));
      }
    });

    return () => controller.abort();
  }, [prompt, policy]);

  async function handleExecute() {
    const response = await fetch("/api/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ plan, policyResult, counterparty, policy }),
    });
    const data = (await response.json()) as { receipt: Receipt };
    setReceipts((current) => [data.receipt, ...current]);
  }

  const requestedVolume = plan.steps.reduce((sum, step) => sum + step.amountUsd, 0);

  return (
    <main className="shell text-[var(--text-primary)]">
      <div className="shell-inner">
        <section className="signal-bar">
          <article className="signal-card">
            <span>Runtime</span>
            <strong>{wallet?.executionMode ?? "simulated"} MoonPay wallet</strong>
          </article>
          <article className="signal-card">
            <span>Build Closes</span>
            <strong>Mon Mar 23, 08:59 WAT</strong>
          </article>
          <article className="signal-card">
            <span>Primary Tracks</span>
            <strong>OpenWallet Standard + MoonPay CLI Agents</strong>
          </article>
        </section>

        <section className="hero-grid">
          <div className="dashboard-panel space-y-6">
            <div className="hero-kicker">
              <Sparkles className="h-4 w-4 text-[var(--accent)]" />
              Open Sentinel / bounded wallet autonomy
            </div>

            <div className="space-y-4">
              <h1 className="section-title max-w-5xl">
                Give the agent a wallet. Keep the perimeter.
              </h1>
              <p className="max-w-3xl text-base leading-8 text-[var(--text-dim)] md:text-lg">
                Open Sentinel turns a natural-language money instruction into an
                auditable execution plan. The agent understands who gets paid,
                what moves cross-chain, how a DCA plan is staged, and why the
                wallet is still constrained before anything happens.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="policy-pill">OpenWallet Standard</span>
              <span className="policy-pill">MoonPay CLI Agents</span>
              <span className="policy-pill">Synthesis Open Track</span>
              <span className="policy-pill">
                {wallet?.executionMode === "live"
                  ? "live MoonPay wallet runtime"
                  : "MoonPay wallet runtime"}
              </span>
            </div>

            <div className="hero-summary">
              <article className="summary-card">
                <span>Wallet authority</span>
                <strong>${policy.dailySpendUsd}</strong>
                <p className="mt-2 muted-copy">Daily ceiling enforced before execution.</p>
              </article>
              <article className="summary-card">
                <span>Agent workload</span>
                <strong>{plan.steps.length} steps</strong>
                <p className="mt-2 muted-copy">Parsed from a single natural-language instruction.</p>
              </article>
              <article className="summary-card">
                <span>Execution path</span>
                <strong>{wallet?.readiness ?? wallet?.executionMode ?? "simulated"}</strong>
                <p className="mt-2 muted-copy">
                  {wallet?.readiness === "ready"
                    ? "Wallet is authenticated and funded enough for live MoonPay execution."
                    : wallet?.readiness === "needs-funding"
                      ? "Auth is in place. Funding the wallet is the remaining gate for live execution."
                      : wallet?.readiness === "auth-required"
                        ? "Wallet exists, but authenticated MoonPay execution still needs a valid session."
                        : "Local wallet path stays usable while live execution is being prepared."}
                </p>
              </article>
            </div>
          </div>

          <div className="dashboard-card space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">Hero Scenario</p>
                <h2 className="mt-2 text-2xl font-semibold uppercase tracking-[-0.04em]">
                  Compound wallet instruction
                </h2>
              </div>
              <span className={policyResult.allowed ? "badge-ok" : "badge-blocked"}>
                {policyResult.allowed ? "Dry-run clears" : "Needs fix"}
              </span>
            </div>

            <div className="timeline-rail">
              <div className="timeline-item">
                <p className="mini-label">1. Send payment</p>
                <p className="muted-copy">Pay an allowlisted agent identity with explicit counterparty resolution.</p>
              </div>
              <div className="timeline-item">
                <p className="mini-label">2. Bridge funds</p>
                <p className="muted-copy">Move value to Base through the wallet action layer before strategy execution.</p>
              </div>
              <div className="timeline-item">
                <p className="mini-label">3. Create DCA plan</p>
                <p className="muted-copy">Convert staged USDC into a policy-constrained recurring buy schedule.</p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="insight-card">
                <p className="label">Counterparty</p>
                <p className="value">
                  {counterparty?.displayName ?? "No identity resolved yet"}
                </p>
              </div>
              <div className="insight-card">
                <p className="label">Requested volume</p>
                <p className="value">${requestedVolume}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mission-grid">
          <div className="panel-stack">
            <WalletStatus policy={policy} wallet={wallet} />
            <PolicyForm policy={policy} onChange={setPolicy} />
          </div>

          <div className="right-column">
            <div className="panel-stack">
              <CommandConsole
                prompt={prompt}
                onPromptChange={setPrompt}
                pending={isPending}
                counterparty={counterparty}
              />
              <ReviewPanel
                plan={plan}
                policyResult={policyResult}
                counterparty={counterparty}
                onExecute={handleExecute}
              />
            </div>

            <ReceiptTimeline receipts={receipts} />
          </div>
        </section>

        <section className="dashboard-card flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="eyebrow">Submission framing</p>
            <p className="max-w-3xl text-base leading-8 text-[var(--text-dim)]">
              Open Sentinel is strongest when framed as wallet infrastructure for
              autonomous agents: policy-constrained authority, legible agent
              reasoning, counterparty identity, and receipt-grade execution
              records.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <span className="policy-pill">
              <ShieldCheck className="h-3.5 w-3.5" />
              policy engine
            </span>
            <span className="policy-pill">
              <Orbit className="h-3.5 w-3.5" />
              receipt trail
            </span>
            <span className="policy-pill">
              <ArrowUpRight className="h-3.5 w-3.5" />
              wallet execution
            </span>
          </div>
        </section>
      </div>
    </main>
  );
}
