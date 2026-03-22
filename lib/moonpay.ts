import type { CommandPlan, CounterpartyResolution, WalletRuntime } from "@/lib/types";

const defaultWalletName = "open-sentinel-demo";
const defaultWalletAddress = "0x1A28C3C6263f6f7B65458457081Eb57d20Cd3856";

export function getMoonPayEnvironment(): WalletRuntime {
  return {
    walletName: process.env.MOONPAY_WALLET_NAME || defaultWalletName,
    walletAddress: process.env.DEMO_WALLET_ADDRESS || defaultWalletAddress,
    executionMode:
      process.env.MOONPAY_EXECUTION_MODE === "live" ? "live" : "simulated",
    localWalletsAvailable: true,
    accountLoginRequired: true,
  };
}

export function moonPaySetupChecklist() {
  return [
    "Install MoonPay CLI and create a local non-custodial wallet with mp wallet create.",
    "Use simulated mode for product development even if account login is blocked.",
    "Treat account-backed MoonPay features as a later step; keep execution mode on simulated until dry-run is stable.",
  ];
}

export function buildExecutionNarrative({
  plan,
  counterparty,
  wallet,
}: {
  plan: CommandPlan;
  counterparty: CounterpartyResolution | null;
  wallet: WalletRuntime;
}) {
  const stepNarratives = plan.steps.map((step, index) => {
    const ordinal = `Action ${index + 1}`;
    if (step.type === "transfer") {
      return `${ordinal}: use MoonPay wallet ${wallet.walletName} to send ${step.amountUsd} ${step.tokenIn} to ${counterparty?.displayName ?? step.destinationIdentity ?? step.destinationAddress ?? "the resolved destination"}.`;
    }
    if (step.type === "bridge") {
      return `${ordinal}: bridge ${step.amountUsd} ${step.tokenIn} from ${step.sourceChain} to ${step.destinationChain} through the wallet action layer.`;
    }
    if (step.type === "swap") {
      return `${ordinal}: swap ${step.amountUsd} ${step.tokenIn} into ${step.tokenOut ?? "ETH"} on ${step.destinationChain}.`;
    }
    return `${ordinal}: create a DCA plan that slices ${step.amountUsd} ${step.tokenIn} into scheduled purchases of ${step.tokenOut ?? "ETH"}.`;
  });

  const topLine =
    wallet.executionMode === "live"
      ? `Execution is configured for live MoonPay wallet actions from ${wallet.walletAddress}.`
      : `Execution remains in simulated mode, but the command is bound to local MoonPay wallet ${wallet.walletName} at ${wallet.walletAddress}.`;

  const loginLine = wallet.accountLoginRequired
    ? "Local wallet operations are available now; authenticated account endpoints remain login-gated."
    : "Account-backed MoonPay features are available."
;

  return [topLine, loginLine, ...stepNarratives];
}
