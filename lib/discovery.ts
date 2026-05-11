import {
  getNewListings,
  getOHLCV,
  getTokenHolders,
  getWalletTrades,
  getTokenSecurity,
  calcSecurityScore,
} from "./birdeye";
import { supabaseAdmin } from "./supabase";

const BLACKLIST = new Set([
  "So11111111111111111111111111111111111111112",
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  "11111111111111111111111111111111",
]);

const EARLY_BUY_HOURS = 6;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function findPeakCandle(candles: any[]) {
  if (!candles.length) return null;
  return candles.reduce((a, b) => (b.v > a.v ? b : a));
}

async function findEarlyBuyers(tokenAddress: string, peakTimestamp: number) {
  const holders = await getTokenHolders(tokenAddress, 30);
  const results: any[] = [];

  for (const holder of holders.slice(0, 15)) {
    const wallet = holder?.owner ?? holder?.address;
    if (!wallet || BLACKLIST.has(wallet)) continue;

    const trades = await getWalletTrades(wallet, 100);
    if (!trades.length) {
      await sleep(300);
      continue;
    }

    for (const trade of trades) {
      const txTime = trade?.timestamp ?? 0;
      if (!txTime || txTime >= peakTimestamp) continue;

      const hoursBefore = (peakTimestamp - txTime) / 3600;
      if (hoursBefore <= 0 || hoursBefore > EARLY_BUY_HOURS) continue;

      const viaTransfers = (trade?.tokenTransfers ?? []).some(
        (t: any) => t.mint === tokenAddress && t.toUserAccount === wallet
      );

      const viaAccountData = (trade?.accountData ?? []).some((acc: any) =>
        (acc?.tokenBalanceChanges ?? []).some(
          (change: any) =>
            change.mint === tokenAddress &&
            change.userAccount === wallet &&
            parseInt(change.rawTokenAmount?.tokenAmount ?? "0") > 0
        )
      );

      if (viaTransfers || viaAccountData) {
        results.push({ wallet, buyTimestamp: txTime, hoursBefore });
        break;
      }
    }

    await sleep(300);
  }

  return results;
}

function calcWalletScore(earlyBuys: any[]) {
  let score = 0;
  let successful = 0;
  const returns: number[] = [];

  for (const eb of earlyBuys) {
    let base = 10;
    if (eb.hoursBefore > 3) base += 5;

    const ret = eb.returnPct ?? 0;
    if (ret > 100) { base += 10; successful++; }
    else if (ret > 50) { base += 5; successful++; }
    else if (ret > 0) successful++;

    returns.push(ret);
    score += base;
  }

  const tokens = [...new Set(earlyBuys.map((e: any) => e.tokenSymbol))];
  if (tokens.length > 3) score += 10;

  const avgReturn = returns.length
    ? returns.reduce((a, b) => a + b, 0) / returns.length
    : 0;

  return { score, successful, avgReturn: Math.round(avgReturn * 100) / 100, tokens };
}

export async function runDiscovery() {
  console.log("[Discovery] Iniciando...");

  const now = Math.floor(Date.now() / 1000);
  const newTokens = await getNewListings(20);

  console.log(`[Discovery] ${newTokens.length} tokens para analisar`);

  const walletBuys: Record<string, any[]> = {};

  for (const token of newTokens) {
    const address = token.address;
    const symbol = token.symbol ?? "???";
    console.log(`[Discovery] Analisando ${symbol}`);

    // 7 dias de janela para pegar o pico real do token
    const candles = await getOHLCV(address, now - 7 * 24 * 3600, now, "1H");
    if (!candles.length) {
      console.log(`[Discovery] Sem candles para ${symbol}, pulando`);
      continue;
    }

    const peak = findPeakCandle(candles);
    if (!peak) continue;

    const peakTs: number = peak.unixTime;
    const peakPrice: number = peak.h;
    const prePeakCandles = candles.filter((c: any) => c.unixTime < peakTs - 3600);
    const prePeakPrice: number = prePeakCandles.at(-1)?.c ?? 0;

    await supabaseAdmin.from("trending_tokens").upsert({
      address,
      symbol,
      peak_timestamp: peakTs,
      peak_price: peakPrice,
      pre_peak_price: prePeakPrice,
      analyzed: true,
    });

    const earlyBuyers = await findEarlyBuyers(address, peakTs);
    console.log(`[Discovery] Early buyers para ${symbol}: ${earlyBuyers.length}`);

    for (const buyer of earlyBuyers) {
      const returnPct =
        prePeakPrice > 0
          ? ((peakPrice - prePeakPrice) / prePeakPrice) * 100
          : 0;

      const entry = {
        wallet: buyer.wallet,
        tokenAddress: address,
        tokenSymbol: symbol,
        buyTimestamp: buyer.buyTimestamp,
        peakTimestamp: peakTs,
        hoursBefore: buyer.hoursBefore,
        priceAtBuy: prePeakPrice,
        priceAtPeak: peakPrice,
        returnPct: Math.round(returnPct * 100) / 100,
      };

      if (!walletBuys[buyer.wallet]) walletBuys[buyer.wallet] = [];
      walletBuys[buyer.wallet].push(entry);

      await supabaseAdmin.from("early_buys").insert({
        wallet_address: buyer.wallet,
        token_address: address,
        token_symbol: symbol,
        buy_timestamp: buyer.buyTimestamp,
        peak_timestamp: peakTs,
        hours_before_peak: buyer.hoursBefore,
        price_at_buy: prePeakPrice,
        price_at_peak: peakPrice,
        return_pct: entry.returnPct,
      });
    }

    await sleep(1000);
  }

  console.log(`[Discovery] Total wallets encontradas: ${Object.keys(walletBuys).length}`);

  for (const [wallet, buys] of Object.entries(walletBuys)) {
    const { score, successful, avgReturn, tokens: tks } = calcWalletScore(buys);
    if (score < 10) continue;

    const { error } = await supabaseAdmin.from("smart_wallets").upsert({
      address: wallet,
      score,
      total_early_buys: buys.length,
      successful_buys: successful,
      avg_return_pct: avgReturn,
      tokens_traded: tks,
      last_updated: Math.floor(Date.now() / 1000),
    });

    if (error) {
      console.error("[Supabase] Erro ao salvar wallet:", wallet, error);
    } else {
      console.log(`[Discovery] Wallet salva: ${wallet.slice(0, 8)}... score=${score}`);
    }
  }

  console.log("[Discovery] Concluído.");
  return { walletsFound: Object.keys(walletBuys).length };
}

export async function checkWalletNewTrades(walletAddress: string) {
  const { data: lastAlert } = await supabaseAdmin
    .from("wallet_alerts")
    .select("timestamp")
    .eq("wallet_address", walletAddress)
    .order("timestamp", { ascending: false })
    .limit(1)
    .single();

  const lastKnown = lastAlert?.timestamp ?? 0;
  const trades = await getWalletTrades(walletAddress, 10);
  const newAlerts: any[] = [];

  for (const trade of trades) {
    const txTime = trade?.timestamp ?? 0;
    if (!txTime || txTime <= lastKnown) continue;

    for (const acc of trade?.accountData ?? []) {
      for (const change of acc?.tokenBalanceChanges ?? []) {
        const amount = parseInt(change.rawTokenAmount?.tokenAmount ?? "0");
        if (change.userAccount !== walletAddress || amount <= 0) continue;

        const tokenAddress = change.mint;
        if (!tokenAddress || BLACKLIST.has(tokenAddress)) continue;

        const transferMatch = (trade?.tokenTransfers ?? []).find(
          (t: any) => t.mint === tokenAddress && t.toUserAccount === walletAddress
        );
        const tokenSymbol = transferMatch?.symbol ?? "???";

        const security = await getTokenSecurity(tokenAddress);
        const securityScore = calcSecurityScore(security);

        const alert = {
          wallet_address: walletAddress,
          token_address: tokenAddress,
          token_symbol: tokenSymbol,
          action: "buy",
          amount_usd: 0,
          timestamp: txTime,
          security_score: securityScore,
        };

        await supabaseAdmin.from("wallet_alerts").insert(alert);
        newAlerts.push(alert);
        break;
      }
    }
  }

  return newAlerts;
}