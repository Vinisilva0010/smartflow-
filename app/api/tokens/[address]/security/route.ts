import { NextRequest, NextResponse } from "next/server";
import { getTokenSecurity, calcSecurityScore } from "@/lib/birdeye";

export async function GET(
  _req: NextRequest,
  { params }: { params: { address: string } }
) {
  const security = await getTokenSecurity(params.address);
  const score = calcSecurityScore(security);
  return NextResponse.json({ security, score });
}