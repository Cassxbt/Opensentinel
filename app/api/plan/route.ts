import { NextResponse } from "next/server";
import { planWithOpenAI } from "@/lib/openai";
import { resolveCounterparty } from "@/lib/identity";

export async function POST(request: Request) {
  const body = (await request.json()) as { prompt?: string };
  const plan = await planWithOpenAI(body.prompt ?? "");
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
