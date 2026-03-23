"use client";

import { useEffect, useRef, useState, useTransition } from "react";
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

type TerminalTurn = {
  id: string;
  prompt: string;
  ts: string;
  plan: CommandPlan;
  policyResult: PolicyEvaluation;
  counterparty: CounterpartyResolution | null;
  pending: boolean;
};

export function AppShell() {
  const [policy, setPolicy] = useState<Policy>(defaultPolicy);
  const [prompt, setPrompt] = useState("");
  const [turns, setTurns] = useState<TerminalTurn[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [wallet, setWallet] = useState<WalletRuntime | null>(null);
  const [executingTurnId, setExecutingTurnId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const logEndRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, isPending, receipts]);

  async function handleRun() {
    if (!prompt.trim() || isPending) return;

    const currentPrompt = prompt;
    const currentTs = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const turnId = crypto.randomUUID();
    const initialPlan = createCommandPlan(currentPrompt);
    const initialPolicy = evaluateCommandPlan(initialPlan, policy);

    setPrompt("");
    setTurns((prev) => [
      ...prev,
      {
        id: turnId,
        prompt: currentPrompt,
        ts: currentTs,
        plan: initialPlan,
        policyResult: initialPolicy,
        counterparty: null,
        pending: true,
      },
    ]);

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

        const nextPolicyResult =
          planData.plan.steps.length > 0
            ? (
                (await (
                  await fetch("/api/dry-run", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      plan: planData.plan,
                      policy,
                      counterparty: planData.counterparty,
                    }),
                  })
                ).json()) as { result: PolicyEvaluation }
              ).result
            : evaluateCommandPlan(planData.plan, policy);

        setTurns((current) =>
          current.map((turn) =>
            turn.id === turnId
              ? {
                  ...turn,
                  plan: planData.plan,
                  counterparty: planData.counterparty,
                  policyResult: nextPolicyResult,
                  pending: false,
                }
              : turn,
          ),
        );
      } catch {
        const fallbackPlan = createCommandPlan(currentPrompt);
        setTurns((current) =>
          current.map((turn) =>
            turn.id === turnId
              ? {
                  ...turn,
                  plan: fallbackPlan,
                  counterparty: null,
                  policyResult: evaluateCommandPlan(fallbackPlan, policy),
                  pending: false,
                }
              : turn,
          ),
        );
      }
    });
  }

  async function handleExecute(turn: TerminalTurn) {
    if (!turn.plan.steps.length || !turn.policyResult.allowed || isPending || executingTurnId) return;

    setExecutingTurnId(turn.id);
    try {
      const execRes = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: turn.plan,
          policyResult: turn.policyResult,
          counterparty: turn.counterparty,
          policy,
        }),
      });
      const execData = (await execRes.json()) as { receipt: Receipt };
      setReceipts((current) => [execData.receipt, ...current]);
      setPrompt("");
    } finally {
      setExecutingTurnId(null);
    }
  }

  const mode = wallet?.executionMode ?? "simulated";
  const walletShort = wallet?.walletAddress
    ? `${wallet.walletAddress.slice(0, 8)}…${wallet.walletAddress.slice(-4)}`
    : "resolving";

  const placeholderPlan = createCommandPlan("");
  const placeholderPolicy = evaluateCommandPlan(placeholderPlan, policy);
  const latestTurn = turns.at(-1) ?? null;

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
            {turns.map((turn) => (
              <div key={turn.id}>
                <div className="log-line log-user-msg">
                  <span className="log-prompt">&gt;</span>
                  <span className="log-text">{turn.prompt}</span>
                  <span className="log-dim log-msg-ts">{turn.ts}</span>
                </div>
                <ReviewPanel
                  plan={turn.plan}
                  policyResult={turn.policyResult}
                  counterparty={turn.counterparty}
                  pending={turn.pending}
                  executing={executingTurnId === turn.id}
                  onExecute={() => void handleExecute(turn)}
                  executionMode={mode}
                  wallet={wallet}
                />
              </div>
            ))}
            {!latestTurn && (
              <ReviewPanel
                plan={placeholderPlan}
                policyResult={placeholderPolicy}
                counterparty={null}
                pending={false}
                executing={false}
                onExecute={() => undefined}
                executionMode={mode}
                wallet={wallet}
              />
            )}
            <ReceiptTimeline receipts={receipts} />
            <div ref={logEndRef} />
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
        <span style={{ color: latestTurn?.policyResult.allowed ?? true ? "var(--green)" : "var(--red)" }}>
          {latestTurn?.policyResult.allowed ?? true ? "policy clear" : "policy block"}
        </span>
        <span className="term-statusbar-sep">│</span>
        <span>{isPending ? "running…" : "ready"}</span>
        <span className="term-statusbar-sep">│</span>
        <span>synthesis 2026</span>
      </footer>
    </div>
  );
}
