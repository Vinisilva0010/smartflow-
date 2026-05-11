"use client";

import { useEffect, useState } from "react";
import { fetchTopWallets, fetchStats } from "@/lib/client";
import WalletCard from "@/app/components/WalletCard"; // Atualizado para o novo nome

export default function HomePage() {
  const [wallets, setWallets] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  async function load() {
    try {
      const [w, s] = await Promise.all([fetchTopWallets(50), fetchStats()]);
      setWallets(w.wallets ?? []);
      setStats(s);
    } finally {
      setLoading(false);
    }
  }

  async function triggerDiscovery() {
    setRunning(true);
    await fetch("/api/discovery/run", { method: "POST" });
    setRunning(false);
    alert("Discovery iniciado! O terminal será atualizado em breve.");
  }

  useEffect(() => {
    load();
    const i = setInterval(load, 3 * 60 * 1000);
    return () => clearInterval(i);
  }, []);

  return (
    <main className="min-h-screen text-white selection:bg-[#00FF41] selection:text-black font-sans relative z-0">
      

    {/* --- EFEITO RADAR (BACKGROUND) --- */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden bg-black flex items-center justify-center">
        {/* 1. Grid Tático Escuro */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
        
        {/* 2. Anéis de Radar em Verde Terminal */}
        <div 
          className="absolute w-[800px] md:w-[1200px] h-[800px] md:h-[1200px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, transparent 15%, #00FF41 25%, transparent 40%, #00FF41 55%, transparent 70%, #00FF41 85%, transparent 100%)',
            filter: 'blur(8px)'
          }}
        />

        {/* 3. Núcleo Negro (O centro escuro da imagem) */}
        <div className="absolute w-[150px] md:w-[250px] h-[150px] md:h-[250px] bg-black rounded-full" style={{ boxShadow: '0 0 80px 80px #000' }} />
      </div>
      {/* ---------------------------------- */}

      {/* Header Brutalista */}
      <div className="border-b-4 border-white bg-black">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none">
              SmartFlow
            </h1>
            <p className="text-[#00FF41] font-mono text-xs uppercase tracking-widest mt-2 font-bold">
              [ On-Chain Discovery · Birdeye API ]
            </p>
          </div>
          
          {stats && (
            <div className="flex gap-0 border-4 border-white bg-neutral-900 divide-x-4 divide-white">
              {[
                { label: "Tracked", value: stats.smart_wallets_tracked },
                { label: "Early Buys", value: stats.early_buys_detected },
                { label: "Alerts", value: stats.alerts_generated },
              ].map(({ label, value }) => (
                <div key={label} className="px-4 py-2 text-center min-w-[100px]">
                  <div className="font-mono text-xl font-black text-white">{value}</div>
                  <div className="text-neutral-400 font-mono text-[10px] uppercase tracking-widest">{label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        
        {/* Título da Seção e Ação */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-5xl md:text-6xl font-black uppercase tracking-tighter leading-[0.85]">
              Target <br/> Rankings
            </h2>
            <p className="text-neutral-400 font-mono text-sm mt-4 leading-relaxed border-l-4 border-[#00FF41] pl-4">
              Monitoramento passivo de endereços com alto win-rate. Score calculado com dados reais de liquidez e volume. Atualização de nós a cada 2h.
            </p>
          </div>
          <button
            onClick={triggerDiscovery}
            disabled={running}
            className="group relative bg-[#FFD700] text-black border-4 border-white px-8 py-4 font-black uppercase tracking-wider transition-all duration-150 ease-out hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[8px_8px_0px_#00FF41] active:translate-y-1 active:translate-x-1 active:shadow-none disabled:opacity-50 disabled:pointer-events-none"
          >
            {running ? "[ Executando... ]" : "Rodar Discovery"}
          </button>
        </div>

        {/* Loading Mecânico */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 border-4 border-neutral-800 bg-neutral-900 animate-pulse relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-1 bg-[#00FF41] opacity-50" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && wallets.length === 0 && (
          <div className="text-center py-32 border-4 border-dashed border-neutral-700 bg-neutral-900/50">
            <p className="font-mono text-neutral-400 uppercase tracking-widest mb-6">Database vazio. Nenhuma wallet indexada.</p>
            <button
              onClick={triggerDiscovery}
              disabled={running}
              className="bg-white text-black border-4 border-black px-8 py-4 font-black uppercase tracking-wider hover:bg-[#00FF41] transition-colors"
            >
              {running ? "Buscando Blocos..." : "Iniciar Indexação"}
            </button>
          </div>
        )}

        {/* Grid de Wallets */}
        {!loading && wallets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {wallets.map((w, i) => (
              <WalletCard key={w.address} wallet={w} rank={i + 1} />
            ))}
          </div>
        )}
        
      </div>
    </main>
  );
}