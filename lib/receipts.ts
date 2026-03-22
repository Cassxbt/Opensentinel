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

  return {
    id: `receipt_${Date.now()}`,
    createdAt: new Date().toISOString(),
    mode,
    headline:
      typedPolicy?.allowed && typedPlan
        ? `${typedPlan.intent.toUpperCase()} request ${mode === "live" ? "executed" : "simulated"} under Sentinel policy`
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
              ? "MoonPay execution mode is configured for live actions."
              : "Execution is currently simulated until MoonPay credentials are configured. No onchain transaction hash is recorded in this mode.",
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
