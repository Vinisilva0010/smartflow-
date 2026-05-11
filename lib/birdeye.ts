const BASE_URL = "https://public-api.birdeye.so";
const API_KEY = process.env.BIRDEYE_API_KEY!;

const HEADERS = {
  "X-API-KEY": API_KEY,
  "x-chain": "solana",
  accept: "application/json",
};

async function birdeyeGet(path: string, params: Record<string, any> = {}) {
  const url = new URL(`${BASE_URL}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  try {
    const res = await fetch(url.toString(), { headers: HEADERS, next: { revalidate: 0 } });
    if (!res.ok) {
      console.error(`[Birdeye] ${res.status} em ${path}`);
      return null;
    }
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      console.error(`[Birdeye] Resposta não-JSON em ${path}: ${contentType}`);
      return null;
    }
    return res.json();
  } catch (e) {
    console.error(`[Birdeye] Erro em ${path}:`, e);
    return null;
  }
}

export async function getTrendingTokens(limit = 20) {
  const data = await birdeyeGet("/defi/token_trending", {
    sort_by: "rank", sort_type: "asc", offset: 0, limit,
  });
  return data?.data?.tokens ?? [];
}

export async function getNewListings(limit = 30) {
  const data = await birdeyeGet("/defi/token_trending", {
    sort_by: "rank",
    sort_type: "asc",
    offset: 0,
    limit,
  });
  const tokens = data?.data?.tokens ?? [];
  console.log(`[Birdeye] ${tokens.length} tokens retornados`);
  return tokens;
}

export async function getTokenSecurity(address: string) {
  const data = await birdeyeGet("/defi/token_security", { address });
  return data?.data ?? {};
}

export async function getTokenOverview(address: string) {
  const data = await birdeyeGet("/defi/token_overview", { address });
  return data?.data ?? {};
}

export async function getOHLCV(
  address: string,
  timeFrom: number,
  timeTo: number,
  resolution = "15m"
) {
  const data = await birdeyeGet("/defi/ohlcv", {
    address, type: resolution, time_from: timeFrom, time_to: timeTo,
  });
  return data?.data?.items ?? [];
}

export async function getWalletTrades(wallet: string, limit = 50) {
  const url = `https://api.helius.xyz/v0/addresses/${wallet}/transactions?api-key=${process.env.HELIUS_API_KEY}&limit=${limit}`;
  try {
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) {
      console.error(`[Helius] ${res.status}`);
      return [];
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("[Helius] Erro:", e);
    return [];
  }
}

export async function getWalletPortfolio(wallet: string) {
  const url = `https://api.helius.xyz/v0/addresses/${wallet}/balances?api-key=${process.env.HELIUS_API_KEY}`;
  try {
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) { console.error(`[Helius] ${res.status}`); return {}; }
    return await res.json() ?? {};
  } catch (e) {
    console.error("[Helius] Erro:", e);
    return {};
  }
}

export async function getTokenHolders(address: string, limit = 50) {
  const data = await birdeyeGet("/defi/v3/token/holder", {
    address, offset: 0, limit,
  });
  return data?.data?.items ?? [];
}

export function calcSecurityScore(security: Record<string, any>): number {
  if (!security || Object.keys(security).length === 0) return 0;
  let score = 50;
  if (security.freezeAuthority) score -= 20;
  if (security.mintAuthority) score -= 20;
  const top10 = security.top10HolderPercent ?? 100;
  if (top10 < 30) score += 20;
  else if (top10 < 50) score += 10;
  else if (top10 > 80) score -= 20;
  return Math.max(0, Math.min(100, score));
}