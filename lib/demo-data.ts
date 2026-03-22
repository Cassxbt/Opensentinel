import type { Policy, Receipt } from "@/lib/types";

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

export const starterPrompt =
  "Send 45 USDC to research-agent.eth for research ops, then bridge 80 USDC to Base and create a 5 day DCA plan into ETH.";

export const demoReceipts: Receipt[] = [
  {
    id: "rcpt_bootstrap",
    createdAt: "2026-03-22T20:14:00.000Z",
    mode: "simulated",
    headline: "Sentinel initialized dedicated demo wallet policy",
    txHashes: [],
    narrative: [
      "Created a bounded policy profile for the demo wallet.",
      "Enabled dry-run before any transfer or swap execution.",
    ],
  },
];
