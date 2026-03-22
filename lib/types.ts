export type SupportedChain = "base" | "ethereum" | "arbitrum";

export type SupportedToken = "USDC" | "ETH" | "WETH";

export type Policy = {
  name: string;
  dailySpendUsd: number;
  allowedChains: SupportedChain[];
  allowedTokens: SupportedToken[];
  approvedDestinations: string[];
  requireDryRun: boolean;
  manualApprovalThresholdUsd: number;
};

export type CommandIntent = "bridge" | "swap" | "dca" | "transfer";

export type CommandStep = {
  id: string;
  type: CommandIntent;
  summary: string;
  amountUsd: number;
  tokenIn: SupportedToken;
  tokenOut?: SupportedToken;
  sourceChain: SupportedChain;
  destinationChain: SupportedChain;
  destinationLabel: string;
  destinationAddress?: string;
  destinationIdentity?: string;
};

export type CommandPlan = {
  rawPrompt: string;
  normalizedPrompt: string;
  intent: CommandIntent;
  confidence: "high" | "medium";
  steps: CommandStep[];
};

export type PolicyCheck = {
  rule: string;
  passed: boolean;
  detail: string;
};

export type PolicyEvaluation = {
  allowed: boolean;
  checks: PolicyCheck[];
  approvalRequired: boolean;
  planSummary: string;
};

export type CounterpartyResolution = {
  input: string;
  displayName: string;
  address: string | null;
  trustStatus: "allowlisted" | "resolved" | "unverified";
  reason: string;
};

export type Receipt = {
  id: string;
  createdAt: string;
  mode: "live" | "simulated";
  headline: string;
  txHashes: string[];
  narrative: string[];
  walletName?: string;
  walletAddress?: string;
  counterpartyDisplay?: string;
};

export type WalletRuntime = {
  walletName: string;
  walletAddress: string;
  executionMode: "live" | "simulated";
  localWalletsAvailable: boolean;
  accountLoginRequired: boolean;
};
