"use client";

import { useEffect, useState, useTransition } from "react";
import { CommandConsole } from "@/components/command-console";
import { PolicyForm } from "@/components/policy-form";
import { ReceiptTimeline } from "@/components/receipt-timeline";
import { ReviewPanel } from "@/components/review-panel";
import { WalletStatus } from "@/components/wallet-status";
import { defaultPolicy } from "@/lib/demo-data";
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
  const [prompt, setPrompt] = useState("");
  const [plan, setPlan] = useState<CommandPlan>(() => createCommandPlan(""));
  const [policyResult, setPolicyResult] = useState<PolicyEvaluation>(() =>
    evaluateCommandPlan(createCommandPlan(""), defaultPolicy),
  );
  const [counterparty, setCounterparty] = useState<CounterpartyResolution | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [wallet, setWallet] = useState<WalletRuntime | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;
    async function loadWallet() {
      try {
        const response = await fetch("/api/runtime");
        const data = (await response.json()) as { wallet: WalletRuntime };
        if (active) setWallet(data.wallet);
      } catch {
        if (active) setWallet(null);
      }
    }
    void loadWallet();
    return () => { active = false; };
  }, []);

  async function handleRun() {
    if (!prompt.trim() || isPending) return;

    const currentPrompt = prompt;

    startTransition(async () => {
      try {
        const planRes = await fetch("/api/plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: currentPrompt }),
        });
        const planData = (await planRes.json()) as {
          plan: CommandPlan;
          counterparty: CounterpartyResolution | null;
        };

        setPlan(planData.plan);
        setCounterparty(planData.counterparty);

        if (planData.plan.steps.length > 0) {
          const dryRunRes = await fetch("/api/dry-run", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              plan: planData.plan,
              policy,
              counterparty: planData.counterparty,
            }),
          });
          const dryRunData = (await dryRunRes.json()) as { result: PolicyEvaluation };
          setPolicyResult(dryRunData.result);
        } else {
          setPolicyResult(evaluateCommandPlan(planData.plan, policy));
        }
      } catch {
        const fallbackPlan = createCommandPlan(currentPrompt);
        setPlan(fallbackPlan);
        setCounterparty(null);
        setPolicyResult(evaluateCommandPlan(fallbackPlan, policy));
      }
    });
  }

  async function handleExecute() {
    if (!plan.steps.length || !policyResult.allowed || isPending) return;

    const execRes = await fetch("/api/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan,
        policyResult,
        counterparty,
        policy,
      }),
    });
    const execData = (await execRes.json()) as { receipt: Receipt };
    setReceipts((current) => [execData.receipt, ...current]);
    setPrompt("");
  }

  const mode = wallet?.executionMode ?? "simulated";
  const walletShort = wallet?.walletAddress
    ? `${wallet.walletAddress.slice(0, 8)}…${wallet.walletAddress.slice(-4)}`
    : "resolving";

  return (
    <div className="term-root">
      <header className="term-header">
        <span className="term-header-logo">open-sentinel</span>
        <span className="term-header-sep">│</span>
        <span className="term-header-dim">policy-bound agent wallet</span>
        <span className="term-header-sep">│</span>
        <span className="term-header-dim">moonpay cli · openwallet standard</span>
        <span className="term-header-sep">│</span>
        <span className="term-header-dim">synthesis hackathon 2026</span>
      </header>

      <div className="term-body">
        <div className="term-main">
          <div className="term-log">
            <ReviewPanel
              plan={plan}
              policyResult={policyResult}
              counterparty={counterparty}
              pending={isPending}
              onExecute={handleExecute}
              executionMode={mode}
            />
            <ReceiptTimeline receipts={receipts} />
          </div>
          <div className="term-input-zone">
            <CommandConsole
              prompt={prompt}
              onPromptChange={setPrompt}
              pending={isPending}
              onExecute={handleRun}
            />
          </div>
        </div>

        <aside className="term-sidebar">
          <WalletStatus policy={policy} wallet={wallet} />
          <PolicyForm policy={policy} onChange={setPolicy} />
        </aside>
      </div>

      <footer className="term-statusbar">
        <span className={mode === "live" ? "term-header-live" : "term-header-sim"}>{mode}</span>
        <span className="term-statusbar-sep">│</span>
        <span>{walletShort}</span>
        <span className="term-statusbar-sep">│</span>
        <span style={{ color: policyResult.allowed ? "var(--green)" : "var(--red)" }}>
          {policyResult.allowed ? "policy clear" : "policy block"}
        </span>
        <span className="term-statusbar-sep">│</span>
        <span>{isPending ? "running…" : "ready"}</span>
        <span className="term-statusbar-sep">│</span>
        <span>synthesis 2026</span>
      </footer>
    </div>
  );
}
