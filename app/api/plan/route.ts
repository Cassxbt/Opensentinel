import { NextResponse } from "next/server";
import { inspectWalletRuntime } from "@/lib/moonpay";
import { planWithOpenAI } from "@/lib/openai";
import { resolveCounterparty } from "@/lib/identity";
import type { CommandPlan, SupportedChain } from "@/lib/types";

function promptMentionsChain(prompt: string) {
  return ["base", "ethereum", "arbitrum"].some((chain) => prompt.includes(chain));
}

function preferFundedChain(plan: CommandPlan, fundedChains: SupportedChain[]) {
  if (fundedChains.length !== 1) return plan;
  if (!["transfer", "swap"].includes(plan.intent)) return plan;

  const preferredChain = fundedChains[0];

  return {
    ...plan,
    steps: plan.steps.map((step) => ({
      ...step,
      sourceChain: step.type === "bridge" ? step.sourceChain : preferredChain,
      destinationChain: step.type === "bridge" ? step.destinationChain : preferredChain,
      summary:
        step.type === "transfer"
          ? `Send ${step.amountUsd} ${step.tokenIn} to ${step.destinationIdentity ?? step.destinationAddress ?? "approved payout address"} on ${preferredChain}.`
          : step.type === "swap"
            ? `Swap ${step.amountUsd} ${step.tokenIn} into ${step.tokenOut ?? "ETH"} on ${preferredChain}.`
            : step.summary,
    })),
  };
}

export async function POST(request: Request) {
  const body = (await request.json()) as { prompt?: string };
  const prompt = body.prompt ?? "";
  let plan = await planWithOpenAI(prompt);
  if (prompt && !promptMentionsChain(prompt.toLowerCase()) && ["transfer", "swap"].includes(plan.intent)) {
    const wallet = await inspectWalletRuntime();
    const fundedChains = [...new Set((wallet.balances ?? []).filter((entry) => Number(entry.amount) > 0).map((entry) => entry.chain))];
    plan = preferFundedChain(plan, fundedChains);
  }
  const primaryCounterparty =
    plan.steps.find((step) => step.destinationIdentity || step.destinationAddress) ?? null;
  const counterparty = primaryCounterparty
    ? await resolveCounterparty(
        primaryCounterparty.destinationIdentity ??
          primaryCounterparty.destinationAddress ??
          "",
      )
    : null;

  return NextResponse.json({
    ok: true,
    plan,
    counterparty,
  });
}
