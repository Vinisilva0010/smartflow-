import { NextResponse } from "next/server";
import { runDiscovery } from "@/lib/discovery";

export async function POST() {
  try {
    const result = await runDiscovery();
    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    console.error("[Discovery] ERRO FATAL:", e);
    return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 });
  }
}