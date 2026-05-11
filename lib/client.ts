const API = typeof window === "undefined"
  ? "http://localhost:3000"  // SSR: precisa de URL absoluta
  : "";                       // Browser: URL relativa funciona

export async function fetchTopWallets(limit = 50) {
  try {
    const res = await fetch(`${API}/api/wallets/top?limit=${limit}`);
    if (!res.ok) return { wallets: [] };
    return res.json();
  } catch { return { wallets: [] }; }
}

export async function fetchWalletDetail(address: string) {
  try {
    const res = await fetch(`${API}/api/wallets/${address}`);
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export async function fetchWalletAlerts(address: string) {
  try {
    const res = await fetch(`${API}/api/wallets/${address}/alerts`);
    if (!res.ok) return { alerts: [] };
    return res.json();
  } catch { return { alerts: [] }; }
}

export async function checkWalletAlerts(address: string) {
  try {
    const res = await fetch(`${API}/api/wallets/${address}/alerts?check=true`);
    if (!res.ok) return { new_alerts: [] };
    return res.json();
  } catch { return { new_alerts: [] }; }
}

export async function fetchStats() {
  try {
    const res = await fetch(`${API}/api/stats`);
    if (!res.ok) return { smart_wallets_tracked: 0, early_buys_detected: 0, alerts_generated: 0 };
    return res.json();
  } catch { return { smart_wallets_tracked: 0, early_buys_detected: 0, alerts_generated: 0 }; }
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