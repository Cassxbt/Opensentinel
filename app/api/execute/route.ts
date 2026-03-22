import { NextResponse } from "next/server";
import {
  buildExecutionNarrative,
  executePlanWithMoonPay,
  getMoonPayEnvironment,
} from "@/lib/moonpay";
import { buildOpenWalletArtifact } from "@/lib/openwallet";
import { createReceipt } from "@/lib/receipts";
import type { CounterpartyResolution, Policy } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    plan?: unknown;
    policyResult?: unknown;
    counterparty?: CounterpartyResolution | null;
    policy?: Policy;
  };
  const typedPlan = body.plan as Parameters<typeof buildExecutionNarrative>[0]["plan"] | undefined;
  const fallbackWallet = getMoonPayEnvironment();
  const walletExecution =
    typedPlan
      ? await executePlanWithMoonPay({
          plan: typedPlan,
          counterparty: body.counterparty ?? null,
        })
      : {
          wallet: fallbackWallet,
          executionSteps: [],
          txHashes: [],
        };
  const narrative =
    typedPlan
      ? buildExecutionNarrative({
          plan: typedPlan,
          counterparty: body.counterparty ?? null,
          wallet: walletExecution.wallet,
        })
      : undefined;

  const policyArtifact =
    body.policy && walletExecution.wallet
      ? buildOpenWalletArtifact({
          policy: body.policy,
          wallet: walletExecution.wallet,
        })
      : undefined;

  const receipt = createReceipt({
    plan: body.plan,
    policyResult: body.policyResult,
    policy: body.policy,
    mode: walletExecution.wallet.executionMode,
    wallet: walletExecution.wallet,
    counterparty: body.counterparty ?? null,
    narrative,
    policyArtifact,
    executionSteps: walletExecution.executionSteps,
    txHashes: walletExecution.txHashes,
  });

  return NextResponse.json({
    ok: true,
    receipt,
  });
}
