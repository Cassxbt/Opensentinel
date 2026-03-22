import { NextResponse } from "next/server";
import { inspectWalletRuntime } from "@/lib/moonpay";

export async function GET() {
  const wallet = await inspectWalletRuntime();

  return NextResponse.json({
    ok: true,
    wallet,
  });
}
