import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const [w, b, a] = await Promise.all([
    supabaseAdmin.from("smart_wallets").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("early_buys").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("wallet_alerts").select("*", { count: "exact", head: true }),
  ]);

  return NextResponse.json({
    smart_wallets_tracked: w.count ?? 0,
    early_buys_detected: b.count ?? 0,
    alerts_generated: a.count ?? 0,
    last_updated: Math.floor(Date.now() / 1000),
  });
}