import type {
  PolicyEvaluation,
  Receipt,
  CommandPlan,
  CounterpartyResolution,
  WalletRuntime,
} from "@/lib/types";

function safeRandomHash(seed: string) {
  const padded = seed.replace(/[^a-z0-9]/gi, "").padEnd(64, "0").slice(0, 64);
  return `0x${padded}`;
}

export function createReceipt({
  plan,
  policyResult,
  mode,
  wallet,
  counterparty,
  narrative,
}: {
  plan: unknown;
  policyResult: unknown;
  mode: "live" | "simulated";
  wallet?: WalletRuntime;
  counterparty?: CounterpartyResolution | null;
  narrative?: string[];
}): Receipt {
  const typedPlan = plan as CommandPlan | undefined;
  const typedPolicy = policyResult as PolicyEvaluation | undefined;

  const txHashes =
    typedPolicy?.allowed && typedPlan
      ? typedPlan.steps.map((step) => safeRandomHash(step.id))
      : [];

  return {
    id: `receipt_${Date.now()}`,
    createdAt: new Date().toISOString(),
    mode,
    headline:
      typedPolicy?.allowed && typedPlan
        ? `${typedPlan.intent.toUpperCase()} request ${mode === "live" ? "executed" : "simulated"} under Sentinel policy`
        : "Execution blocked by Sentinel policy",
    txHashes,
    walletName: wallet?.walletName,
    walletAddress: wallet?.walletAddress,
    counterpartyDisplay: counterparty?.displayName,
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
              : "Execution is currently simulated until MoonPay credentials are configured.",
            "Counterparty identity, policy evaluation, and resulting wallet actions are captured together for auditability.",
          ]
        : [
            "The command was stopped before execution.",
            "At least one policy check failed, so no wallet action was produced.",
          ]),
  };
}
