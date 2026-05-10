import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getWalletPortfolio } from "@/lib/birdeye";

export async function GET(
  _req: NextRequest,
  { params }: { params: { address: string } }
) {
  const { address } = params;

  const [walletRes, earlyBuysRes, alertsRes] = await Promise.all([
    supabaseAdmin.from("smart_wallets").select("*").eq("address", address).single(),
    supabaseAdmin
      .from("early_buys")
      .select("*")
      .eq("wallet_address", address)
      .order("buy_timestamp", { ascending: false }),
    supabaseAdmin
      .from("wallet_alerts")
      .select("*")
      .eq("wallet_address", address)
      .order("timestamp", { ascending: false })
      .limit(20),
  ]);

  const portfolio = await getWalletPortfolio(address);

  return NextResponse.json({
    wallet: walletRes.data ?? null,
    early_buys: earlyBuysRes.data ?? [],
    recent_activity: alertsRes.data ?? [],
    current_portfolio: portfolio,
  });
}