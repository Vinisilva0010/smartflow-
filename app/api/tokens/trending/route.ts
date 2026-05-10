import { NextResponse } from "next/server";
import { getTrendingTokens } from "@/lib/birdeye";

export async function GET() {
  const tokens = await getTrendingTokens(20);
  return NextResponse.json({ tokens });
}