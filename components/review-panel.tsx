"use client";

import type { CommandPlan, PolicyEvaluation } from "@/lib/types";
import type { CounterpartyResolution } from "@/lib/types";

export function ReviewPanel({
  plan,
  policyResult,
  counterparty,
  onExecute,
}: {
  plan: CommandPlan;
  policyResult: PolicyEvaluation;
  counterparty: CounterpartyResolution | null;
  onExecute: () => void;
}) {
  return (
    <section className="dashboard-card space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Execution Review</p>
          <h2 className="mt-2 text-2xl font-semibold uppercase tracking-[-0.04em]">
            Agent reasoning meets wallet perimeter
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-dim)]">
            The planner proposes a sequence, the policy engine checks it, and
            the wallet only proceeds when the route stays inside explicit rules.
          </p>
        </div>
        <span className={policyResult.allowed ? "badge-ok" : "badge-blocked"}>
          {policyResult.allowed ? "Policy allows" : "Policy blocks"}
        </span>
      </div>

      <div className="understanding-grid">
        <div className="insight-card">
          <p className="label">Intent</p>
          <p className="value">{plan.intent}</p>
        </div>
        <div className="insight-card">
          <p className="label">Confidence</p>
          <p className="value">{plan.confidence}</p>
        </div>
        <div className="insight-card">
          <p className="label">Execution chain</p>
          <p className="value">{plan.steps.length} step(s)</p>
        </div>
      </div>

      <div className="timeline-grid">
        {plan.steps.map((step, index) => (
          <article key={step.id} className="step-card">
            <div className="step-head">
              <div className="flex items-center gap-3">
                <span className="step-index">{index + 1}</span>
                <div>
                  <p className="mini-label">{step.type}</p>
                  <p className="mt-2 text-lg uppercase tracking-[-0.04em] text-[var(--text-primary)]">
                    {step.summary}
                  </p>
                </div>
              </div>
              <div className="step-meta">
                <span className="policy-pill">{step.sourceChain}</span>
                <span className="policy-pill">{step.destinationChain}</span>
              </div>
            </div>
            <p className="step-subcopy">
              {step.destinationIdentity || step.destinationAddress
                ? `Counterparty / destination: ${step.destinationIdentity ?? step.destinationAddress}`
                : `Execution route: ${step.destinationLabel}`}
            </p>
          </article>
        ))}
      </div>

      {counterparty ? (
        <div className="insight-card">
          <p className="label">Counterparty identity</p>
          <p className="value">{counterparty.displayName}</p>
          <p className="mt-3 muted-copy">{counterparty.reason}</p>
        </div>
      ) : null}

      <div className="policy-check-grid">
        {policyResult.checks.map((check) => (
          <div
            key={check.rule}
            className="flex items-start justify-between gap-4 rounded-[22px] border border-[var(--line)] bg-[rgba(255,255,255,0.024)] px-4 py-4"
          >
            <div>
              <p className="mini-label">
                {check.rule.replaceAll("_", " ")}
              </p>
              <p className="mt-2 muted-copy">
                {check.detail}
              </p>
            </div>
            <span className={check.passed ? "badge-ok" : "badge-blocked"}>
              {check.passed ? "Pass" : "Fail"}
            </span>
          </div>
        ))}
      </div>

      <button
        className="action-button w-full justify-center"
        type="button"
        onClick={onExecute}
      >
        Generate receipt + simulate route
      </button>
    </section>
  );
}
