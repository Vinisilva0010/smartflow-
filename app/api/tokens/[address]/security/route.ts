import { NextRequest, NextResponse } from "next/server";
import { getTokenSecurity, calcSecurityScore } from "@/lib/birdeye";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;
  const security = await getTokenSecurity(address);
  const score = calcSecurityScore(security);
  return NextResponse.json({ security, score });
}