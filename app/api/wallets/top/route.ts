import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 50);

  const { data, error } = await supabaseAdmin
    .from("smart_wallets")
    .select("*")
    .order("score", { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ wallets: data ?? [], count: data?.length ?? 0 });
}