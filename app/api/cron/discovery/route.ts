import { NextRequest, NextResponse } from "next/server";
import { runDiscovery } from "@/lib/discovery";

export async function GET(req: NextRequest) {
  // Verifica que é o Vercel chamando, não alguém aleatório
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runDiscovery();
    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}