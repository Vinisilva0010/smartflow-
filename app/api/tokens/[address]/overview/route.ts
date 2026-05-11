import { NextRequest, NextResponse } from "next/server";
import { getTokenOverview } from "@/lib/birdeye";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;
  const overview = await getTokenOverview(address);
  return NextResponse.json({ address, data: overview });
}