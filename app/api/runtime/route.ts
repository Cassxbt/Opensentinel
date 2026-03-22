import { NextResponse } from "next/server";
import { getMoonPayEnvironment } from "@/lib/moonpay";

export async function GET() {
  return NextResponse.json({
    ok: true,
    wallet: getMoonPayEnvironment(),
  });
}
