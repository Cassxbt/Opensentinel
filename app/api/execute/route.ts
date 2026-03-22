import { NextResponse } from "next/server";
import { getMoonPayEnvironment, buildExecutionNarrative } from "@/lib/moonpay";
import { createReceipt } from "@/lib/receipts";
import type { CounterpartyResolution } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    plan?: unknown;
    policyResult?: unknown;
    counterparty?: CounterpartyResolution | null;
  };
  const wallet = getMoonPayEnvironment();
  const typedPlan = body.plan as Parameters<typeof buildExecutionNarrative>[0]["plan"] | undefined;
  const narrative =
    typedPlan
      ? buildExecutionNarrative({
          plan: typedPlan,
          counterparty: body.counterparty ?? null,
          wallet,
        })
      : undefined;

  const receipt = createReceipt({
    plan: body.plan,
    policyResult: body.policyResult,
    mode: wallet.executionMode,
    wallet,
    counterparty: body.counterparty ?? null,
    narrative,
  });

  return NextResponse.json({
    ok: true,
    receipt,
  });
}
