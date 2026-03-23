import type { Policy } from "@/lib/types";

export const defaultPolicy: Policy = {
  name: "Sentinel Demo Wallet",
  dailySpendUsd: 250,
  allowedChains: ["base", "ethereum"],
  allowedTokens: ["USDC", "ETH"],
  approvedDestinations: [
    "MoonPay route",
    "Agent execution wallet",
    "Approved payout",
    "research-agent",
    "research-agent.eth",
    "DCA strategy",
  ],
  requireDryRun: true,
  manualApprovalThresholdUsd: 150,
};
