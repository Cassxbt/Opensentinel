import type { Policy, PolicyArtifact, WalletRuntime } from "@/lib/types";

export function buildOpenWalletArtifact({
  policy,
  wallet,
}: {
  policy: Policy;
  wallet: WalletRuntime;
}): PolicyArtifact {
  return {
    standard: "OWS-aligned local-first policy profile",
    exportedAt: new Date().toISOString(),
    walletLayer: "Open Sentinel",
    walletName: wallet.walletName,
    policyTypes: [
      {
        name: "CounterpartyAllowlistPolicy",
        description:
          "Restricts transfers and routed execution to approved counterparties or named destinations.",
        value: policy.approvedDestinations,
      },
      {
        name: "ChainScopePolicy",
        description:
          "Limits execution to approved chains before any MoonPay transfer, swap, or bridge can proceed.",
        value: policy.allowedChains,
      },
      {
        name: "TokenScopePolicy",
        description:
          "Limits the wallet to an explicit token allowlist for execution.",
        value: policy.allowedTokens,
      },
      {
        name: "ManualReviewThresholdPolicy",
        description:
          "Escalates commands above the low-risk band for explicit human approval.",
        value: policy.manualApprovalThresholdUsd,
      },
      {
        name: "DryRunRequiredPolicy",
        description:
          "Requires policy evaluation before execution evidence is generated.",
        value: policy.requireDryRun,
      },
      {
        name: "DailySpendLimitPolicy",
        description:
          "Caps the maximum aggregate daily wallet authority exposed to the agent.",
        value: policy.dailySpendUsd,
      },
    ],
  };
}
