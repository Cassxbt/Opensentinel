import type {
  ExecutionStepResult,
  Policy,
  PolicyArtifact,
  PolicyEvaluation,
  Receipt,
  CommandPlan,
  CounterpartyResolution,
  WalletRuntime,
} from "@/lib/types";

export function createReceipt({
  plan,
  policyResult,
  mode,
  wallet,
  counterparty,
  narrative,
  policy,
  policyArtifact,
  executionSteps,
  txHashes,
}: {
  plan: unknown;
  policyResult: unknown;
  mode: "live" | "simulated";
  wallet?: WalletRuntime;
  counterparty?: CounterpartyResolution | null;
  narrative?: string[];
  policy?: Policy;
  policyArtifact?: PolicyArtifact;
  executionSteps?: ExecutionStepResult[];
  txHashes?: string[];
}): Receipt {
  const typedPlan = plan as CommandPlan | undefined;
  const typedPolicy = policyResult as PolicyEvaluation | undefined;
  const executedLiveStep = executionSteps?.some((step) => step.status === "executed");
  const attemptedLiveStep = executionSteps?.some(
    (step) => step.status === "executed" || step.status === "failed",
  );
  const blockedLiveStep = executionSteps?.some((step) => step.status === "blocked");

  return {
    id: `receipt_${Date.now()}`,
    createdAt: new Date().toISOString(),
    mode,
    headline:
      typedPolicy?.allowed && typedPlan
        ? mode === "live"
          ? `${typedPlan.intent.toUpperCase()} request ${executedLiveStep ? "executed" : attemptedLiveStep ? "attempted live" : blockedLiveStep ? "blocked before live execution" : "prepared"} under Sentinel policy`
          : `${typedPlan.intent.toUpperCase()} dry-run prepared under Sentinel policy`
        : "Execution blocked by Sentinel policy",
    txHashes: txHashes ?? [],
    walletName: wallet?.walletName,
    walletAddress: wallet?.walletAddress,
    counterpartyDisplay: counterparty?.displayName,
    policyArtifact,
    executionSteps,
    narrative:
      narrative ??
      (typedPolicy?.allowed && typedPlan
        ? [
            `Sentinel reviewed ${typedPlan.steps.length} execution step(s).`,
            typedPolicy.approvalRequired
              ? "Command exceeded the low-risk band and was flagged for manual review."
              : "Command stayed inside the low-risk band and remained eligible for one-click execution.",
            mode === "live"
              ? executedLiveStep
                ? "MoonPay live execution ran and returned result data."
                : attemptedLiveStep
                  ? "MoonPay live execution was attempted but did not complete successfully."
                  : blockedLiveStep
                    ? "Live execution was blocked before any MoonPay command ran."
                  : "MoonPay live execution is enabled, but this receipt only captured a prepared action."
              : "Dry-run mode only. This receipt does not send funds and does not claim an onchain transaction hash.",
            policy
              ? `Active wallet policy: ${policy.name}.`
              : "Counterparty identity, policy evaluation, and resulting wallet actions are captured together for auditability.",
          ]
        : [
            "The command was stopped before execution.",
            "At least one policy check failed, so no wallet action was produced.",
          ]),
  };
}
