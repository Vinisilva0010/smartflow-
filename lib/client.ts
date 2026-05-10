export const API = "";  // vazio = mesmo domínio (Vercel)

export async function fetchTopWallets(limit = 50) {
  const res = await fetch(`${API}/api/wallets/top?limit=${limit}`);
  return res.json();
}

export async function fetchWalletDetail(address: string) {
  const res = await fetch(`${API}/api/wallets/${address}`);
  return res.json();
}

export async function fetchWalletAlerts(address: string) {
  const res = await fetch(`${API}/api/wallets/${address}/alerts`);
  return res.json();
}

export async function checkWalletAlerts(address: string) {
  const res = await fetch(`${API}/api/wallets/${address}/alerts?check=true`);
  return res.json();
}

export async function fetchStats() {
  const res = await fetch(`${API}/api/stats`);
  return res.json();
}

export function shortenAddress(addr: string) {
  if (!addr) return "";
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

export function formatReturn(pct: number) {
  return pct >= 0 ? `+${pct.toFixed(0)}%` : `${pct.toFixed(0)}%`;
}

export function getScoreLabel(score: number) {
  if (score >= 80) return { label: "Elite", color: "text-emerald-400", bar: "bg-emerald-400" };
  if (score >= 50) return { label: "Strong", color: "text-blue-400", bar: "bg-blue-400" };
  if (score >= 25) return { label: "Moderate", color: "text-yellow-400", bar: "bg-yellow-400" };
  return { label: "Weak", color: "text-gray-500", bar: "bg-gray-500" };
}