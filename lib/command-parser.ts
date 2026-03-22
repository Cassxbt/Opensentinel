import type { CommandIntent, CommandPlan, CommandStep, SupportedChain, SupportedToken } from "@/lib/types";

function inferIntent(prompt: string): CommandIntent {
  if (prompt.includes("dca")) return "dca";
  if (prompt.includes("send") || prompt.includes("pay") || prompt.includes("transfer")) {
    return "transfer";
  }
  if (prompt.includes("bridge")) return "bridge";
  return "swap";
}

function inferToken(prompt: string, fallback: SupportedToken): SupportedToken {
  if (prompt.includes("weth")) return "WETH";
  if (prompt.includes("eth")) return "ETH";
  if (prompt.includes("usdc")) return "USDC";
  return fallback;
}

function inferChain(prompt: string, chain: SupportedChain): SupportedChain {
  if (prompt.includes("ethereum")) return "ethereum";
  if (prompt.includes("arbitrum")) return "arbitrum";
  if (prompt.includes("base")) return "base";
  return chain;
}

function inferAmount(prompt: string): number {
  const match = prompt.match(/(\d+(?:\.\d+)?)/);
  if (!match) return 50;
  return Number(match[1]);
}

function buildSteps(intent: CommandIntent, prompt: string): CommandStep[] {
  const amount = inferAmount(prompt);
  const sourceChain = inferChain(prompt, "ethereum");
  const destinationChain = prompt.includes("to base")
    ? "base"
    : inferChain(prompt, "base");
  const tokenIn = inferToken(prompt, "USDC");
  const tokenOut = intent === "swap" || intent === "dca" ? inferToken(prompt.split("into")[1] ?? "", "ETH") : undefined;
  const addressMatch = prompt.match(/0x[a-f0-9.]{6,}/i);
  const destinationAddress = addressMatch?.[0];
  const ensMatch = prompt.match(/\b[a-z0-9-]+\.eth\b/i);
  const destinationIdentity = ensMatch?.[0]?.toLowerCase();

  if (intent === "transfer") {
    return [
      {
        id: "step_transfer",
        type: "transfer",
        summary: `Send ${amount} ${tokenIn} to ${destinationIdentity ?? destinationAddress ?? "approved payout address"} on ${destinationChain}.`,
        amountUsd: amount,
        tokenIn,
        sourceChain: destinationChain,
        destinationChain,
        destinationLabel: "Approved payout",
        destinationAddress,
        destinationIdentity,
      },
    ];
  }

  if (intent === "bridge") {
    return [
      {
        id: "step_bridge",
        type: "bridge",
        summary: `Bridge ${amount} ${tokenIn} from ${sourceChain} to ${destinationChain}.`,
        amountUsd: amount,
        tokenIn,
        sourceChain,
        destinationChain,
        destinationLabel: "MoonPay route",
        destinationIdentity,
      },
    ];
  }

  if (intent === "dca") {
    return [
      {
        id: "step_bridge_seed",
        type: "bridge",
        summary: `Stage ${amount} USDC onto Base for scheduled buying.`,
        amountUsd: amount,
        tokenIn: "USDC",
        sourceChain,
        destinationChain: "base",
        destinationLabel: "MoonPay route",
      },
      {
        id: "step_dca_execute",
        type: "dca",
        summary: `Create a lightweight DCA plan into ${tokenOut ?? "ETH"} using the staged balance in scheduled slices.`,
        amountUsd: amount,
        tokenIn: "USDC",
        tokenOut: tokenOut ?? "ETH",
        sourceChain: "base",
        destinationChain: "base",
        destinationLabel: "Agent execution wallet",
        destinationIdentity,
      },
    ];
  }

  return [
    {
      id: "step_swap",
      type: "swap",
      summary: `Swap ${amount} ${tokenIn} into ${tokenOut ?? "ETH"} on ${destinationChain}.`,
      amountUsd: amount,
      tokenIn,
      tokenOut: tokenOut ?? "ETH",
      sourceChain: destinationChain,
      destinationChain,
      destinationLabel: "Agent execution wallet",
      destinationIdentity,
    },
  ];
}

export function createCommandPlan(rawPrompt: string): CommandPlan {
  const normalizedPrompt = rawPrompt.trim().toLowerCase() || "swap 50 usdc into eth on base";
  const intent = inferIntent(normalizedPrompt);

  return {
    rawPrompt,
    normalizedPrompt,
    intent,
    confidence: rawPrompt.length > 18 ? "high" : "medium",
    steps: buildSteps(intent, normalizedPrompt),
  };
}
