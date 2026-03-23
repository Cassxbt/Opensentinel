"use client";

import type { CommandPlan, CounterpartyResolution, PolicyEvaluation } from "@/lib/types";

export function ReviewPanel({
  plan,
  policyResult,
  counterparty,
  pending,
  onExecute,
  executionMode,
}: {
  plan: CommandPlan;
  policyResult: PolicyEvaluation;
  counterparty: CounterpartyResolution | null;
  pending?: boolean;
  onExecute: () => void;
  executionMode?: "live" | "simulated";
}) {
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
      {plan.thinking && (
        <div className="log-thinking">
          thinking: {plan.thinking}
        </div>
      )}

      <div className="log-line">
        <span className="log-prompt">planning</span>
        <span className="log-cyan">{plan.intent}</span>
        <span className="log-dim">·</span>
        <span className="log-amber">{plan.confidence} confidence</span>
        <span className="log-dim">·</span>
        <span className="log-dim">{plan.steps.length} step(s)</span>
      </div>

      {plan.steps.length === 0 && plan.agentResponse && (
        <div className="log-agent-response">{plan.agentResponse}</div>
      )}

      {plan.steps.length === 0 && !plan.agentResponse && (
        <div className="log-line" style={{ marginTop: "0.2rem" }}>
          <span className="log-prompt">sentinel</span>
          <span className="log-dim">no executable wallet action found</span>
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
                style={{ padding: "0.28rem 0.75rem", alignSelf: "auto" }}
              >
                {executionMode === "live" ? "run moonpay route" : "prepare receipt"}
              </button>
            </div>
          )}

          <hr className="log-sep" />
        </>
      )}
    </div>
  );
}
