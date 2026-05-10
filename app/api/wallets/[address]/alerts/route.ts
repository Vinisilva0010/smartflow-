import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { checkWalletNewTrades } from "@/lib/discovery";

export async function GET(
  req: NextRequest,
  { params }: { params: { address: string } }
) {
  const { address } = params;
  const check = req.nextUrl.searchParams.get("check") === "true";

  // Se check=true, verifica novos trades agora
  if (check) {
    const newAlerts = await checkWalletNewTrades(address);
    return NextResponse.json({ new_alerts: newAlerts });
  }

  // Senão, retorna histórico
  const { data } = await supabaseAdmin
    .from("wallet_alerts")
    .select("*")
    .eq("wallet_address", address)
    .order("timestamp", { ascending: false })
    .limit(30);

  return NextResponse.json({ alerts: data ?? [] });
}