import { NextResponse } from "next/server";
import { getNewListings } from "@/lib/birdeye";

export async function GET() {
  const tokens = await getNewListings(20);
  return NextResponse.json({ tokens });
}