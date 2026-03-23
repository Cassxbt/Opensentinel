import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type {
  CommandPlan,
  CommandStep,
  CounterpartyResolution,
  ExecutionStepResult,
  SupportedChain,
  SupportedToken,
  WalletHolding,
  WalletRuntime,
} from "@/lib/types";

const execFileAsync = promisify(execFile);

const defaultWalletName = "open-sentinel-demo";
const defaultWalletAddress = "0x1A28C3C6263f6f7B65458457081Eb57d20Cd3856";

const tokenAddresses: Record<SupportedChain, Record<SupportedToken, string>> = {
  base: {
    USDC: "0x833589fCD6EDB6E08f4c7C32D4f71b54bdA02913",
    ETH: "0x0000000000000000000000000000000000000000",
    WETH: "0x4200000000000000000000000000000000000006",
  },
  ethereum: {
    USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    ETH: "0x0000000000000000000000000000000000000000",
    WETH: "0xC02aaA39b223FE8D0A0E5C4F27eAD9083C756Cc2",
  },
  arbitrum: {
    USDC: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    ETH: "0x0000000000000000000000000000000000000000",
    WETH: "0x82aF49447D8a07e3Bd95BD0d56f35241523fBab1",
  },
};

export function getMoonPayEnvironment(): WalletRuntime {
  return {
    walletName: process.env.MOONPAY_WALLET_NAME || defaultWalletName,
    walletAddress: process.env.DEMO_WALLET_ADDRESS || defaultWalletAddress,
    executionMode:
      process.env.MOONPAY_EXECUTION_MODE === "live" ? "live" : "simulated",
    localWalletsAvailable: true,
    accountLoginRequired: true,
    authStatus: "unknown",
    readiness:
      process.env.MOONPAY_EXECUTION_MODE === "live" ? "needs-funding" : "simulated",
  };
}

export function moonPaySetupChecklist() {
  return [
    "Install MoonPay CLI and create a local non-custodial wallet with mp wallet create.",
    "Verify email auth with mp login and mp verify so the wallet can read balances and activity.",
    "Fund the local wallet with the asset and chain required for the live command path you want to demo.",
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

function formatCommand(args: string[]) {
  return `mp ${args.map((value) => (/\s/.test(value) ? `"${value}"` : value)).join(" ")}`;
}

function normalizeNumericString(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function normalizeNumericValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function extractTxHashes(payload: unknown, sink: Set<string>) {
  if (!payload) return;

  if (typeof payload === "string") {
    const matches = payload.match(/0x[a-fA-F0-9]{64}/g);
    if (matches) {
      for (const match of matches) sink.add(match);
    }
    return;
  }

  if (Array.isArray(payload)) {
    for (const item of payload) extractTxHashes(item, sink);
    return;
  }

  if (typeof payload === "object") {
    for (const value of Object.values(payload as Record<string, unknown>)) {
      extractTxHashes(value, sink);
    }
  }
}

async function runMoonPay(args: string[]) {
  const command = formatCommand(args);

  try {
    const { stdout, stderr } = await execFileAsync("mp", args, {
      timeout: 45_000,
      maxBuffer: 1024 * 1024,
    });

    let parsed: unknown = null;
    const text = stdout.trim();

    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
    }

    return {
      ok: true as const,
      command,
      stdout: text,
      stderr: stderr.trim(),
      parsed,
    };
  } catch (error) {
    const failure = error as {
      stdout?: string;
      stderr?: string;
      message?: string;
    };

    return {
      ok: false as const,
      command,
      stdout: failure.stdout?.trim() ?? "",
      stderr: failure.stderr?.trim() ?? failure.message ?? "MoonPay command failed.",
      parsed: null,
    };
  }
}

async function getBalancesForChain(wallet: WalletRuntime, chain: SupportedChain) {
  const result = await runMoonPay([
    "--json",
    "token",
    "balance",
    "list",
    "--wallet",
    wallet.walletName,
    "--chain",
    chain,
  ]);

  if (!result.ok || !result.parsed || typeof result.parsed !== "object") {
    return [] as WalletHolding[];
  }

  const items = (result.parsed as { items?: unknown[] }).items;
  if (!Array.isArray(items)) {
    return [] as WalletHolding[];
  }

  return items.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const entry = item as Record<string, unknown>;
    const token = typeof entry.symbol === "string" ? entry.symbol : "UNKNOWN";
    const tokenAddress =
      typeof entry.address === "string" ? entry.address : "unknown";
    const balanceObject =
      typeof entry.balance === "object" && entry.balance
        ? (entry.balance as Record<string, unknown>)
        : null;
    const amount =
      normalizeNumericString(balanceObject?.amount) ??
      normalizeNumericString(entry.amount) ??
      "0";
    const amountUsd =
      normalizeNumericValue(entry.valueUsd) ??
      normalizeNumericValue(entry.usdValue) ??
      normalizeNumericValue(balanceObject?.value) ??
      null;

    return [
      {
        chain,
        tokenSymbol: token,
        tokenAddress,
        amount,
        amountUsd,
      },
    ];
  });
}

export async function inspectWalletRuntime(): Promise<WalletRuntime> {
  const wallet = getMoonPayEnvironment();

  const authResult = await runMoonPay(["user", "retrieve", "--json"]);
  const balances = (
    await Promise.all(
      (["base", "ethereum", "arbitrum"] as SupportedChain[]).map((chain) =>
        getBalancesForChain(wallet, chain),
      ),
    )
  ).flat();

  const funded = balances.some((entry) => Number(entry.amount) > 0);

  return {
    ...wallet,
    authStatus: authResult.ok ? "authenticated" : "unauthenticated",
    readiness:
      wallet.executionMode !== "live"
        ? "simulated"
        : !authResult.ok
          ? "auth-required"
          : funded
            ? "ready"
            : "needs-funding",
    balances,
    lastCheckedAt: new Date().toISOString(),
  };
}

function getTokenAddress(chain: SupportedChain, token: SupportedToken) {
  return tokenAddresses[chain][token];
}

function getBalancesSnapshot(wallet: WalletRuntime, chain: SupportedChain) {
  return (wallet.balances ?? []).filter((entry) => entry.chain === chain);
}

function findFundedHolding({
  wallet,
  chain,
  token,
}: {
  wallet: WalletRuntime;
  chain: SupportedChain;
  token: SupportedToken;
}) {
  return (wallet.balances ?? []).find(
    (entry) =>
      entry.chain === chain &&
      entry.tokenSymbol.toUpperCase() === token &&
      Number(entry.amount) > 0,
  );
}

function getLiveBlockDetail(wallet: WalletRuntime) {
  if (wallet.readiness === "auth-required") {
    return "Live execution is blocked until MoonPay authentication is restored.";
  }

  if (wallet.readiness === "needs-funding") {
    return "Live execution is blocked until the wallet is funded on the required chain.";
  }

  return "Live execution is not ready yet.";
}

function getGasTokenForChain(chain: SupportedChain) {
  if (chain === "base" || chain === "ethereum" || chain === "arbitrum") {
    return "ETH" as const;
  }

  return null;
}

function getInsufficientBalanceDetail({
  wallet,
  step,
}: {
  wallet: WalletRuntime;
  step: CommandStep;
}) {
  const requiredChain = step.type === "bridge" ? step.sourceChain : step.destinationChain;
  const fundedOnOtherChains = (wallet.balances ?? []).filter(
    (entry) =>
      entry.tokenSymbol.toUpperCase() === step.tokenIn &&
      Number(entry.amount) > 0 &&
      entry.chain !== requiredChain,
  );

  if (fundedOnOtherChains.length > 0) {
    const alternative = fundedOnOtherChains[0];
    return `Live execution blocked: ${step.tokenIn} is funded on ${alternative.chain}, but this action is trying to execute on ${requiredChain}. Specify the funded chain in the prompt or move funds first.`;
  }

  return `Live execution blocked: no funded ${step.tokenIn} balance was found on ${requiredChain}.`;
}

function getMissingGasDetail(chain: SupportedChain) {
  const gasToken = getGasTokenForChain(chain);
  if (!gasToken) {
    return `Live execution blocked: no funded gas token was found on ${chain}.`;
  }

  return `Live execution blocked: no funded ${gasToken} balance was found on ${chain} for gas. Add a small amount of ${gasToken} on ${chain}, then retry.`;
}

function getRecipient({
  step,
  counterparty,
}: {
  step: CommandStep;
  counterparty: CounterpartyResolution | null;
}) {
  return counterparty?.address ?? step.destinationAddress ?? null;
}

function buildStepCommand({
  step,
  wallet,
  counterparty,
}: {
  step: CommandStep;
  wallet: WalletRuntime;
  counterparty: CounterpartyResolution | null;
}) {
  if (step.type === "transfer") {
    const recipient = getRecipient({ step, counterparty });
    if (!recipient) {
      return null;
    }

    return [
      "--json",
      "token",
      "transfer",
      "--wallet",
      wallet.walletName,
      "--chain",
      step.destinationChain,
      "--token",
      getTokenAddress(step.destinationChain, step.tokenIn),
      "--amount",
      String(step.amountUsd),
      "--to",
      recipient,
    ];
  }

  if (step.type === "swap") {
    return [
      "--json",
      "token",
      "swap",
      "--wallet",
      wallet.walletName,
      "--chain",
      step.destinationChain,
      "--from-token",
      getTokenAddress(step.destinationChain, step.tokenIn),
      "--from-amount",
      String(step.amountUsd),
      "--to-token",
      getTokenAddress(step.destinationChain, step.tokenOut ?? "ETH"),
    ];
  }

  if (step.type === "bridge") {
    return [
      "--json",
      "token",
      "bridge",
      "--from-wallet",
      wallet.walletName,
      "--from-chain",
      step.sourceChain,
      "--from-token",
      getTokenAddress(step.sourceChain, step.tokenIn),
      "--from-amount",
      String(step.amountUsd),
      "--to-wallet",
      wallet.walletName,
      "--to-chain",
      step.destinationChain,
      "--to-token",
      getTokenAddress(step.destinationChain, step.tokenOut ?? step.tokenIn),
    ];
  }

  return null;
}

export async function executePlanWithMoonPay({
  plan,
  counterparty,
}: {
  plan: CommandPlan;
  counterparty: CounterpartyResolution | null;
}) {
  const wallet = await inspectWalletRuntime();
  const executionSteps: ExecutionStepResult[] = [];
  const receiptHashes = new Set<string>();

  if (wallet.executionMode === "live" && wallet.readiness !== "ready") {
    for (const step of plan.steps) {
      const chain = step.type === "bridge" ? step.sourceChain : step.destinationChain;
      const balances = getBalancesSnapshot(wallet, chain);

      executionSteps.push({
        stepId: step.id,
        type: step.type,
        status: "blocked",
        detail: getLiveBlockDetail(wallet),
        command: "live execution unavailable",
        txHashes: [],
        beforeBalances: balances,
        afterBalances: balances,
      });
    }

    return {
      wallet,
      executionSteps,
      txHashes: [],
    };
  }

  for (const step of plan.steps) {
    const activeChain = step.type === "bridge" ? step.sourceChain : step.destinationChain;
    const beforeBalances =
      wallet.executionMode === "live"
        ? await getBalancesForChain(wallet, activeChain)
        : getBalancesSnapshot(wallet, activeChain);

    if (step.type === "dca") {
      executionSteps.push({
        stepId: step.id,
        type: step.type,
        status: "prepared",
        detail:
          "DCA remains a machine-readable execution plan. MoonPay’s own automation guidance composes scheduled CLI swaps rather than exposing a single native DCA command.",
        command: "moonpay-trading-automation pattern",
        txHashes: [],
        beforeBalances,
        afterBalances: beforeBalances,
      });
      continue;
    }

    const args = buildStepCommand({ step, wallet, counterparty });
    if (!args) {
      executionSteps.push({
        stepId: step.id,
        type: step.type,
        status: "blocked",
        detail:
          "Execution could not be prepared because the destination did not resolve to a concrete recipient address.",
        command: "unresolved recipient",
        txHashes: [],
        beforeBalances,
        afterBalances: beforeBalances,
      });
      continue;
    }

    const fundedHolding = findFundedHolding({
      wallet,
      chain: activeChain,
      token: step.tokenIn,
    });

    if (wallet.executionMode === "live" && !fundedHolding) {
      executionSteps.push({
        stepId: step.id,
        type: step.type,
        status: "blocked",
        detail: getInsufficientBalanceDetail({ wallet, step }),
        command: "insufficient funded balance",
        txHashes: [],
        beforeBalances,
        afterBalances: beforeBalances,
      });
      continue;
    }

    const gasToken = getGasTokenForChain(activeChain);
    const gasHolding =
      gasToken
        ? findFundedHolding({
            wallet,
            chain: activeChain,
            token: gasToken,
          })
        : null;

    if (wallet.executionMode === "live" && !gasHolding) {
      executionSteps.push({
        stepId: step.id,
        type: step.type,
        status: "blocked",
        detail: getMissingGasDetail(activeChain),
        command: "missing gas balance",
        txHashes: [],
        beforeBalances,
        afterBalances: beforeBalances,
      });
      continue;
    }

    if (wallet.executionMode !== "live") {
      executionSteps.push({
        stepId: step.id,
        type: step.type,
        status: "prepared",
        detail:
          "MoonPay command is fully prepared, but the wallet is still configured for non-live execution mode.",
        command: formatCommand(args),
        txHashes: [],
        beforeBalances,
        afterBalances: beforeBalances,
      });
      continue;
    }

    const result = await runMoonPay(args);
    const afterBalances = await getBalancesForChain(
      wallet,
      step.type === "bridge" ? step.destinationChain : activeChain,
    );
    const stepHashes = new Set<string>();
    extractTxHashes(result.parsed ?? result.stdout ?? result.stderr, stepHashes);
    for (const hash of stepHashes) receiptHashes.add(hash);

    executionSteps.push({
      stepId: step.id,
      type: step.type,
      status: result.ok ? "executed" : "failed",
      detail: result.ok
        ? "MoonPay command completed and returned execution output."
        : "MoonPay command returned an error. Inspect raw result before retrying.",
      command: result.command,
      txHashes: [...stepHashes],
      beforeBalances,
      afterBalances,
      rawResult: result.ok
        ? result.stdout || result.stderr || "MoonPay command completed."
        : result.stderr || result.stdout,
    });
  }

  return {
    wallet,
    executionSteps,
    txHashes: [...receiptHashes],
  };
}
