"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  fetchWalletDetail,
  checkWalletAlerts,
  shortenAddress,
  formatReturn,
} from "@/lib/client";
import ScoreBadge from "@/app/components/ScoreBadge";
import SecurityBadge from "@/app/components/SecurityBadge";

export default function WalletPage() {
  const { address } = useParams() as { address: string };
  const [detail, setDetail] = useState<any>(null);
  const [liveAlerts, setLiveAlerts] = useState<any[]>([]);
  const [monitoring, setMonitoring] = useState(false);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchWalletDetail(address).then((d) => {
      setDetail(d);
      setLoading(false);
    });
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [address]);

  function startMonitoring() {
    setMonitoring(true);
    intervalRef.current = setInterval(async () => {
      const result = await checkWalletAlerts(address);
      if (result.new_alerts?.length) {
        setLiveAlerts((prev) => [...result.new_alerts, ...prev].slice(0, 20));
      }
    }, 30000); // checa a cada 30s
  }

  function stopMonitoring() {
    setMonitoring(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-[#00FF41] font-mono uppercase tracking-widest font-bold">
        <div className="w-8 h-8 bg-[#00FF41] animate-[ping_1s_steps(2,start)_infinite] mb-6" />
        Decodificando alvo...
      </div>
    );
  }

  const wallet = detail?.wallet;
  const earlyBuys = detail?.early_buys ?? [];
  const activity = detail?.recent_activity ?? [];
  const winRate = wallet
    ? Math.round((wallet.successful_buys / (wallet.total_early_buys || 1)) * 100)
    : 0;

  return (
    <main className="min-h-screen bg-black text-white selection:bg-[#00FF41] selection:text-black pb-24">
      
      {/* HEADER / BREADCRUMB BRUTALISTA */}
      <div className="border-b-4 border-white bg-black px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4 text-sm font-mono uppercase tracking-widest font-bold overflow-x-auto whitespace-nowrap pb-2 md:pb-0">
          <Link href="/" className="text-white hover:bg-[#00FF41] hover:text-black px-3 py-1 transition-colors border-2 border-transparent hover:border-[#00FF41]">
            [ Retornar ao Radar ]
          </Link>
          <span className="text-[#00FF41] font-black">&gt;</span>
          <span className="bg-white text-black px-3 py-1 border-2 border-white">
            ALVO: {shortenAddress(address)}
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">

        {/* --- DOSSIÊ DA WALLET --- */}
        {wallet ? (
          <div className="relative border-4 border-white bg-black mb-16 group">
            {/* Faixa de alerta lateral */}
            <div className="absolute top-0 left-0 w-3 h-full bg-[repeating-linear-gradient(-45deg,#00FF41,#00FF41_10px,#000_10px,#000_20px)]" />

            <div className="p-6 md:p-10 pl-10 md:pl-14">
              <div className="flex justify-between items-start flex-wrap gap-8 mb-10">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.2em] font-bold text-[#00FF41] mb-2">
                    // Identidade do Alvo
                  </div>
                  <div className="font-black text-4xl md:text-6xl text-white tracking-tighter break-all leading-none">
                    {shortenAddress(address)}
                  </div>
                  
                  {/* Tokens */}
                  <div className="flex gap-2 mt-6 flex-wrap">
                    {(wallet.tokens_traded ?? []).map((t: string) => (
                      <span key={t} className="font-mono text-xs font-bold text-black bg-white px-3 py-1 uppercase tracking-widest">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* ScoreBadge gigante */}
                <div className="scale-125 origin-top-right mt-2">
                  <ScoreBadge score={wallet.score} />
                </div>
              </div>

              {/* GRADE BRUTALISTA DE DADOS */}
              <div className="grid grid-cols-2 md:grid-cols-4 border-t-4 border-l-4 border-white bg-black">
                {[
                  { label: "Early Buys", value: wallet.total_early_buys, neutral: true },
                  { label: "Successful", value: wallet.successful_buys, neutral: true },
                  { label: "Win Rate", value: `${winRate}%`, neutral: true },
                  { label: "Avg Return", value: formatReturn(wallet.avg_return_pct), green: wallet.avg_return_pct >= 0 },
                ].map(({ label, value, neutral, green }) => (
                  <div key={label} className="border-r-4 border-b-4 border-white p-5 md:p-8 transition-colors hover:bg-white hover:text-black">
                    <div className="text-[10px] font-mono uppercase tracking-[0.15em] font-bold text-neutral-500 mb-2">
                      {label}
                    </div>
                    <div className={`font-black text-3xl md:text-5xl tracking-tighter ${neutral ? "text-white" : green ? "text-[#00FF41]" : "text-red-600"}`}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>

              {/* LINKS EXTERNOS */}
              <div className="flex flex-wrap gap-4 mt-10">
                <a href={`https://solscan.io/account/${address}`} target="_blank" rel="noopener noreferrer"
                  className="font-mono text-sm uppercase tracking-widest font-bold text-white border-2 border-white px-6 py-3 hover:bg-white hover:text-black transition-colors">
                  [ Exec: Solscan ]
                </a>
                <a href={`https://birdeye.so/profile/${address}?chain=solana`} target="_blank" rel="noopener noreferrer"
                  className="font-mono text-sm uppercase tracking-widest font-bold text-white border-2 border-white px-6 py-3 hover:bg-white hover:text-black transition-colors">
                  [ Exec: Birdeye ]
                </a>
              </div>
            </div>
          </div>
        ) : (
          
          /* ESTADO: ALVO NÃO ENCONTRADO */
          <div className="relative border-4 border-red-600 bg-black p-10 md:p-16 mb-16 flex flex-col items-center text-center">
            <div className="absolute top-0 left-0 w-full h-3 bg-[repeating-linear-gradient(45deg,#dc2626,#dc2626_10px,#000_10px,#000_20px)]" />
            
            <h2 className="font-black text-4xl md:text-5xl uppercase text-red-600 tracking-tighter mb-4">
              ALVO NÃO INDEXADO
            </h2>
            <p className="font-mono font-bold text-white text-sm uppercase tracking-widest mb-6 max-w-xl">
              A entidade não possui registros suficientes de smart money na base local. Acesso aos exploradores externos habilitado para varredura manual.
            </p>
            
            <div className="font-mono text-neutral-600 text-xs md:text-sm mb-10 break-all bg-neutral-950 p-4 border border-neutral-900 w-full max-w-2xl">
              {address}
            </div>
            
            <div className="flex flex-wrap gap-4 justify-center">
              <a href={`https://solscan.io/account/${address}`} target="_blank" rel="noopener noreferrer"
                className="font-mono text-sm uppercase tracking-widest font-bold text-red-600 border-2 border-red-600 px-6 py-3 hover:bg-red-600 hover:text-black transition-colors">
                [ FORÇAR SOLSCAN ]
              </a>
              <a href={`https://birdeye.so/profile/${address}?chain=solana`} target="_blank" rel="noopener noreferrer"
                className="font-mono text-sm uppercase tracking-widest font-bold text-red-600 border-2 border-red-600 px-6 py-3 hover:bg-red-600 hover:text-black transition-colors">
                [ FORÇAR BIRDEYE ]
              </a>
            </div>
          </div>
        )}

        {/* --- PAINEL DE COMANDO: MONITORAMENTO --- */}
        <div 
          className="relative bg-white text-black mt-16 p-6 md:p-10 transition-all"
          style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 40px), calc(100% - 40px) 100%, 0 100%)' }}
        >
          <div className="absolute top-0 left-0 w-full h-3 bg-[repeating-linear-gradient(-45deg,#000,#000_10px,transparent_10px,transparent_20px)]" />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 mt-4">
            <div>
              <h3 className="font-black text-4xl uppercase tracking-tighter leading-none">
                Radar de Execução
              </h3>
              <p className="font-mono font-bold text-[11px] uppercase tracking-[0.2em] text-black/60 mt-2">
                [ Ping Birdeye API: 30s ]
              </p>
            </div>
            
            {!monitoring ? (
              <button 
                onClick={startMonitoring}
                className="group relative bg-black text-[#00FF41] font-black uppercase text-xl px-8 py-4 border-none transition-transform hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_#00FF41]"
              >
                [ Iniciar Varredura ]
              </button>
            ) : (
              <button 
                onClick={stopMonitoring}
                className="group relative bg-red-600 text-white font-black uppercase text-xl px-8 py-4 border-none transition-transform hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_#000]"
              >
                [ Abortar Radar ]
              </button>
            )}
          </div>

          {monitoring && (
            <div className="flex items-center gap-3 bg-black text-[#00FF41] font-mono font-bold uppercase text-xs tracking-widest p-3 mb-6 w-fit">
              <div className="w-4 h-4 bg-[#00FF41] animate-[ping_1.5s_steps(2,start)_infinite]" />
              Conexão Estabelecida. Lendo Mempool...
            </div>
          )}

          {/* ALERTAS AO VIVO */}
          {liveAlerts.length > 0 && (
            <div className="border-t-4 border-black">
              {liveAlerts.map((a, i) => (
                <div key={i} className="flex flex-wrap items-center gap-4 bg-black text-white p-4 border-b-4 border-white transition-colors hover:bg-neutral-900">
                  <div className={`font-black uppercase text-lg px-3 py-1 ${
                    a.action === "buy" ? "bg-[#00FF41] text-black" : "bg-red-600 text-white"
                  }`}>
                    {a.action}
                  </div>
                  <span className="font-black text-2xl tracking-tighter">{a.token_symbol}</span>
                  
                  {a.amount_usd > 0 && (
                    <span className="font-mono text-[#00FF41] text-xl font-bold ml-auto mr-4">
                      ${a.amount_usd.toFixed(0)}
                    </span>
                  )}
                  
                  <div className="scale-90 origin-right">
                    <SecurityBadge score={a.security_score} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {monitoring && liveAlerts.length === 0 && (
            <div className="bg-black/5 p-10 text-center border-4 border-dashed border-black/20 mt-4">
              <p className="font-mono font-bold text-black uppercase tracking-widest">
                Aguardando assinatura de novos blocos...
              </p>
            </div>
          )}
        </div>

        {/* --- EARLY BUYS DETECTADOS --- */}
        {earlyBuys.length > 0 && (
          <div className="mt-20">
            <h3 className="font-black text-white text-3xl uppercase tracking-tighter mb-6 border-l-8 border-[#00FF41] pl-4">
              Registro de Early Buys
            </h3>
            
            <div className="flex flex-col gap-2">
              {earlyBuys.map((b: any, i: number) => (
                <div key={i} className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white text-black p-5 group hover:bg-[#00FF41] transition-colors cursor-crosshair">
                  <div className="flex items-center gap-4">
                    <span className="bg-black text-white font-mono font-bold text-xs px-2 py-1">
                      IDX-{i.toString().padStart(2, '0')}
                    </span>
                    <span className="font-black text-3xl tracking-tighter">{b.token_symbol}</span>
                  </div>
                  
                  <div className="font-mono text-xs uppercase tracking-widest font-bold mt-4 md:mt-0 md:ml-auto md:mr-10">
                    <span className="bg-black text-white px-2 py-1">{b.hours_before_peak.toFixed(1)}H</span> ANTES DO PICO
                  </div>
                  
                  <div className={`font-mono font-black text-3xl mt-4 md:mt-0 ${b.return_pct >= 0 ? "text-green-600 group-hover:text-black" : "text-red-600 group-hover:text-red-900"}`}>
                    {formatReturn(b.return_pct)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- ATIVIDADE RECENTE --- */}
        {activity.length > 0 && (
          <div className="mt-20 mb-10">
            <h3 className="font-black text-white text-3xl uppercase tracking-tighter mb-6 border-l-8 border-[#FFD700] pl-4">
              Log de Operações
            </h3>
            
            <div className="border-t-4 border-white flex flex-col">
              {activity.map((a: any, i: number) => (
                <div key={i} className="flex flex-wrap items-center gap-4 bg-transparent text-white p-4 border-b-4 border-white hover:bg-[#1A1A1A] transition-colors">
                  <div className={`font-black uppercase text-sm px-3 py-1 ${
                    a.action === "buy" ? "bg-[#00FF41] text-black" : "bg-red-600 text-white"
                  }`}>
                    {a.action}
                  </div>
                  
                  <span className="font-black text-2xl tracking-tighter w-24">{a.token_symbol}</span>
                  
                  {a.amount_usd > 0 && (
                    <span className="font-mono text-neutral-400 text-lg">
                      ${a.amount_usd.toFixed(0)}
                    </span>
                  )}
                  
                  <div className="ml-auto">
                    <SecurityBadge score={a.security_score} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}