export type SupportedChain = "base" | "ethereum" | "arbitrum";

export type SupportedToken = "USDC" | "ETH" | "WETH";

export type CommandIntent = "bridge" | "swap" | "dca" | "transfer" | "research";

export type Policy = {
  name: string;
  dailySpendUsd: number;
  allowedChains: SupportedChain[];
  allowedTokens: SupportedToken[];
  approvedDestinations: string[];
  requireDryRun: boolean;
  manualApprovalThresholdUsd: number;
};

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
  thinking?: string;
  agentResponse?: string;
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

export type WalletHolding = {
  chain: SupportedChain;
  tokenSymbol: string;
  tokenAddress: string;
  amount: string;
  amountUsd?: number | null;
};

export type PolicyArtifact = {
  standard: string;
  exportedAt: string;
  walletLayer: string;
  walletName: string;
  policyTypes: Array<{
    name: string;
    description: string;
    value: string | number | boolean | string[];
  }>;
};

export type ExecutionStepResult = {
  stepId: string;
  type: CommandIntent;
  status: "prepared" | "executed" | "failed" | "blocked";
  detail: string;
  command: string;
  txHashes: string[];
  beforeBalances?: WalletHolding[];
  afterBalances?: WalletHolding[];
  rawResult?: string;
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
  policyArtifact?: PolicyArtifact;
  executionSteps?: ExecutionStepResult[];
};

export type WalletRuntime = {
  walletName: string;
  walletAddress: string;
  executionMode: "live" | "simulated";
  localWalletsAvailable: boolean;
  accountLoginRequired: boolean;
  authStatus?: "authenticated" | "unauthenticated" | "unknown";
  readiness?: "ready" | "needs-funding" | "auth-required" | "simulated";
  balances?: WalletHolding[];
  lastCheckedAt?: string;
};
