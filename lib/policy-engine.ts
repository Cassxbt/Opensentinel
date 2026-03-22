import type { CommandPlan, Policy, PolicyCheck, PolicyEvaluation } from "@/lib/types";
import type { CounterpartyResolution } from "@/lib/types";

function isCommandPlan(value: unknown): value is CommandPlan {
  return typeof value === "object" && value !== null && "steps" in value;
}

function isPolicy(value: unknown): value is Policy {
  return typeof value === "object" && value !== null && "dailySpendUsd" in value;
}

export function evaluateCommandPlan(
  maybePlan: unknown,
  maybePolicy: unknown,
  counterparty?: CounterpartyResolution | null,
): PolicyEvaluation {
  if (!isCommandPlan(maybePlan) || !isPolicy(maybePolicy)) {
    return {
      allowed: false,
      approvalRequired: true,
      planSummary: "Invalid plan or policy payload.",
      checks: [
        {
          rule: "payload_integrity",
          passed: false,
          detail: "The dry-run request did not include a valid plan and policy.",
        },
      ],
    };
  }

  const totalSpend = maybePlan.steps.reduce((sum, step) => sum + step.amountUsd, 0);
  const checks: PolicyCheck[] = [
    {
      rule: "daily_spend_limit",
      passed: totalSpend <= maybePolicy.dailySpendUsd,
      detail: `Requested ${totalSpend} USD against ${maybePolicy.dailySpendUsd} USD daily limit.`,
    },
    {
      rule: "allowed_chains",
      passed: maybePlan.steps.every(
        (step) =>
          maybePolicy.allowedChains.includes(step.sourceChain) &&
          maybePolicy.allowedChains.includes(step.destinationChain),
      ),
      detail: "All source and destination chains must be explicitly approved.",
    },
    {
      rule: "allowed_tokens",
      passed: maybePlan.steps.every(
        (step) =>
          maybePolicy.allowedTokens.includes(step.tokenIn) &&
          (!step.tokenOut || maybePolicy.allowedTokens.includes(step.tokenOut)),
      ),
      detail: "Every asset the agent touches must be allowlisted.",
    },
    {
      rule: "approved_destinations",
      passed: maybePlan.steps.every((step) =>
        maybePolicy.approvedDestinations.includes(step.destinationLabel),
      ),
      detail: "Execution routes must map to an approved destination profile.",
    },
    {
      rule: "counterparty_resolution",
      passed:
        !counterparty ||
        counterparty.trustStatus === "allowlisted" ||
        counterparty.trustStatus === "resolved",
      detail: counterparty
        ? `${counterparty.displayName} is ${counterparty.trustStatus}${counterparty.address ? ` at ${counterparty.address}` : ""}.`
        : "No counterparty resolution was required for this command.",
    },
    {
      rule: "dry_run_required",
      passed: maybePolicy.requireDryRun,
      detail: maybePolicy.requireDryRun
        ? "Dry-run is required and active for this wallet."
        : "Dry-run is currently disabled.",
    },
  ];

  const allowed = checks.every((check) => check.passed);

  return {
    allowed,
    checks,
    approvalRequired: totalSpend >= maybePolicy.manualApprovalThresholdUsd,
    planSummary: maybePlan.steps.map((step) => step.summary).join(" "),
  };
}
