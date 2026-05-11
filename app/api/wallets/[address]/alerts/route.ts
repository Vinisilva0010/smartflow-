import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { checkWalletNewTrades } from "@/lib/discovery";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;
  const check = req.nextUrl.searchParams.get("check") === "true";

  if (check) {
    const newAlerts = await checkWalletNewTrades(address);
    return NextResponse.json({ new_alerts: newAlerts });
  }

  const { data } = await supabaseAdmin
    .from("wallet_alerts")
    .select("*")
    .eq("wallet_address", address)
    .order("timestamp", { ascending: false })
    .limit(30);

  return NextResponse.json({ alerts: data ?? [] });
}