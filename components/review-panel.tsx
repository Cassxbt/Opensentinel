"use client";

import type { CommandPlan, CounterpartyResolution, PolicyEvaluation, WalletRuntime } from "@/lib/types";

export function ReviewPanel({
  plan,
  policyResult,
  counterparty,
  pending,
  executing,
  onExecute,
  executionMode,
  wallet,
}: {
  plan: CommandPlan;
  policyResult: PolicyEvaluation;
  counterparty: CounterpartyResolution | null;
  pending?: boolean;
  executing?: boolean;
  onExecute: () => void;
  executionMode?: "live" | "simulated";
  wallet: WalletRuntime | null;
}) {
  const isReadOnlyReply = plan.steps.length === 0;
  const readiness = wallet?.readiness ?? "simulated";
  const canAttemptLiveExecution =
    executionMode === "live" && readiness === "ready" && policyResult.allowed && !executing;
  const canPrepareDryRun = executionMode !== "live" && policyResult.allowed;
  const actionEnabled = canAttemptLiveExecution || canPrepareDryRun;
  const actionLabel =
    executing
      ? "executing via MoonPay…"
      : executionMode === "live" && readiness === "ready"
      ? "execute live via MoonPay"
      : executionMode === "live"
        ? "live execution unavailable"
      : "prepare dry-run receipt";
  const blockReason =
    executionMode === "live" && readiness === "needs-funding"
      ? "wallet authenticated but not funded yet"
      : executionMode === "live" && readiness === "auth-required"
        ? "live execution blocked until MoonPay auth is restored"
        : executionMode === "live" && readiness !== "ready"
          ? "live execution is not ready"
          : null;

  if (pending) {
    return (
      <div className="log-line">
        <span className="log-prompt">planning</span>
        <span className="log-amber">resolving…</span>
      </div>
    );
  }

  if (!plan.rawPrompt.trim()) {
    return (
      <div className="log-line">
        <span className="log-prompt">sentinel</span>
        <span className="log-dim">awaiting command…</span>
      </div>
    );
  }

  return (
    <div>
      {plan.thinking && !isReadOnlyReply && (
        <div className="log-thinking">
          thinking: {plan.thinking}
        </div>
      )}

      {!isReadOnlyReply && (
        <div className="log-line">
          <span className="log-prompt">planning</span>
          <span className="log-cyan">{plan.intent}</span>
          <span className="log-dim">·</span>
          <span className="log-amber">{plan.confidence} confidence</span>
          <span className="log-dim">·</span>
          <span className="log-dim">{plan.steps.length} step(s)</span>
        </div>
      )}

      {isReadOnlyReply && plan.agentResponse && (
        <div className="log-agent-response">{plan.agentResponse}</div>
      )}

      {isReadOnlyReply && !plan.agentResponse && (
        <div className="log-line" style={{ marginTop: "0.2rem" }}>
          <span className="log-prompt">sentinel</span>
          <span className="log-dim">no reply generated</span>
        </div>
      )}

      {plan.steps.map((step, i) => (
        <div key={step.id} className="log-step-block">
          <div className="log-step-type">{i + 1}. {step.type}</div>
          <div className="log-step-summary">{step.summary}</div>
          <div className="log-step-meta">
            <span className="log-cyan">{step.sourceChain}</span>
            <span className="log-dim"> → </span>
            <span className="log-cyan">{step.destinationChain}</span>
            {(step.destinationIdentity ?? step.destinationAddress) ? (
              <>
                <span className="log-dim"> · </span>
                <span className="log-amber">{step.destinationIdentity ?? step.destinationAddress}</span>
              </>
            ) : (
              <>
                <span className="log-dim"> · </span>
                <span className="log-dim">{step.destinationLabel}</span>
              </>
            )}
            {step.amountUsd > 0 && (
              <>
                <span className="log-dim"> · </span>
                <span className="log-amber">${step.amountUsd} {step.tokenIn}</span>
              </>
            )}
          </div>
        </div>
      ))}

      {counterparty && (
        <div className="log-line" style={{ marginTop: "0.2rem" }}>
          <span className="log-prompt">identity</span>
          <span className="log-amber">{counterparty.displayName}</span>
          <span className="log-dim">·</span>
          <span className={
            counterparty.trustStatus === "allowlisted" ? "log-green" :
            counterparty.trustStatus === "resolved"    ? "log-amber" : "log-dim"
          }>
            {counterparty.trustStatus}
          </span>
        </div>
      )}

      {plan.steps.length > 0 && (
        <>
          <hr className="log-sep" />
          <div className="log-section-head">policy evaluation</div>

          {policyResult.checks.map((check) => (
            <div key={check.rule} className="log-check-line">
              <span className={check.passed ? "log-check-pass" : "log-check-fail"}>
                {check.passed ? "[ PASS ]" : "[ FAIL ]"}
              </span>
              <span className="log-check-rule">{check.rule.replaceAll("_", " ")}</span>
              <span className="log-check-detail">— {check.detail}</span>
            </div>
          ))}

          <div className="log-line" style={{ marginTop: "0.45rem" }}>
            <span className="log-prompt">verdict</span>
            <span className={policyResult.allowed ? "log-green" : "log-red"}>
              {policyResult.allowed ? "ALL CLEAR" : "BLOCKED · one or more policy checks failed"}
            </span>
            {policyResult.allowed && policyResult.approvalRequired && (
              <>
                <span className="log-dim">·</span>
                <span className="log-amber">manual approval required above threshold</span>
              </>
            )}
          </div>

          {policyResult.allowed && (
            <div className="log-line" style={{ marginTop: "0.6rem" }}>
              <span className="log-prompt">execute</span>
              <button
                className="term-run-btn"
                type="button"
                onClick={onExecute}
                disabled={!actionEnabled}
                style={{ padding: "0.28rem 0.75rem", alignSelf: "auto" }}
              >
                {actionLabel}
              </button>
              {blockReason && (
                <>
                  <span className="log-dim">·</span>
                  <span className="log-amber">{blockReason}</span>
                </>
              )}
              {executing && (
                <>
                  <span className="log-dim">·</span>
                  <span className="log-amber">sending command to MoonPay and waiting for execution output</span>
                </>
              )}
              {executionMode !== "live" && (
                <>
                  <span className="log-dim">·</span>
                  <span className="log-dim">no funds will move in dry-run mode</span>
                </>
              )}
            </div>
          )}

          <hr className="log-sep" />
        </>
      )}
    </div>
  );
}
