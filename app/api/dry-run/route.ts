import { NextResponse } from "next/server";
import { evaluateCommandPlan } from "@/lib/policy-engine";
import { defaultPolicy } from "@/lib/demo-data";
import type { CounterpartyResolution } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    plan?: unknown;
    policy?: unknown;
    counterparty?: CounterpartyResolution | null;
  };

  const result = evaluateCommandPlan(
    body.plan,
    body.policy ?? defaultPolicy,
    body.counterparty ?? null,
  );

  return NextResponse.json({
    ok: true,
    result,
  });
}
