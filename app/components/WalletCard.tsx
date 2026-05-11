import Link from "next/link";
import ScoreBadge from "./ScoreBadge";
import { shortenAddress, formatReturn } from "@/lib/client";

interface Wallet {
  address: string;
  score: number;
  total_early_buys: number;
  successful_buys: number;
  avg_return_pct: number;
  tokens_traded: string[];
}

export default function WalletCard({ wallet, rank }: { wallet: Wallet; rank: number }) {
  const winRate = wallet.total_early_buys > 0
    ? Math.round((wallet.successful_buys / wallet.total_early_buys) * 100)
    : 0;

  const isProfitable = wallet.avg_return_pct >= 0;

  return (
    <Link href={`/wallet/${wallet.address}`} className="block outline-none relative group mt-6 mb-8">
      
      {/* O BLOCO DE SOMBRA FÍSICA (Zero CSS border, puro bloco)
        Fica parado no fundo. É Verde Terminal maciço.
      */}
      <div 
        className="absolute top-4 left-4 w-full h-full bg-[#00FF41] z-0 transition-transform duration-100 ease-out group-hover:translate-x-2 group-hover:translate-y-2 group-hover:bg-[#FFD700]" 
        style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 25px), calc(100% - 25px) 100%, 0 100%)' }}
      />

      
      <div 
        className="relative z-10 bg-white text-black transition-transform duration-100 ease-out group-hover:-translate-x-1 group-hover:-translate-y-1"
        style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 25px), calc(100% - 25px) 100%, 0 100%)' }}
      >
        
        {/* FAIXA DE ALERTA (Hazard Tape) no topo, substituindo qualquer tipo de linha */}
        <div className="h-3 w-full bg-[repeating-linear-gradient(45deg,#FFD700,#FFD700_10px,#000_10px,#000_20px)]" />

        {/* HEADER DO CARTÃO */}
        <div className="flex justify-between items-start p-5 bg-white pb-2">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-[0.2em] font-bold text-black/60 mb-[-4px]">
             Monitored Target
            </div>
            <div className="font-black text-4xl uppercase tracking-tighter hover:text-[#00FF41] hover:drop-shadow-[2px_2px_0px_#000] transition-all">
              {shortenAddress(wallet.address)}
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            {/* O RANK agora é um selo de máquina, não um texto bonitinho */}
            <div className="bg-black text-white font-mono font-black text-xl px-3 py-1 scale-110 origin-top-right">
              #{rank}
            </div>
            <div className="scale-75 origin-top-right mt-1">
              <ScoreBadge score={wallet.score} />
            </div>
          </div>
        </div>

        {/* TOKENS RECENTES (Blocos pretos sobre branco) */}
        <div className="px-5 py-3">
          <div className="flex gap-2 flex-wrap">
            {(wallet.tokens_traded ?? []).slice(0, 4).map((t) => (
              <span 
                key={t} 
                className="font-mono text-xs font-bold text-white bg-black px-2 py-1 uppercase tracking-widest"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* DIVISOR BRUTALISTA: Um bloco sólido preto, não uma linha fina */}
        <div className="w-full h-2 bg-black mt-2" />

        {/* DADOS VITAIS: Tipografia esmagadora em vez de tabelas */}
        <div className="flex bg-white">
          
          <div className="flex-1 p-5 pr-2">
            <div className="text-[10px] font-mono uppercase tracking-[0.15em] font-bold text-black/60">
              Win Rate
            </div>
            <div className="font-black text-5xl tracking-tighter leading-none mt-1">
              {winRate}<span className="text-2xl">%</span>
            </div>
          </div>

          {/* Outro bloco divisor grosso vertical */}
          <div className="w-2 bg-black" />

          <div className="flex-1 p-5 pl-4 flex flex-col justify-center bg-black/5">
            <div className="text-[10px] font-mono uppercase tracking-[0.15em] font-bold text-black/60">
              Avg Return
            </div>
            <div className={`font-mono font-black text-3xl tracking-tight mt-1 ${isProfitable ? "text-green-600" : "text-red-600"}`}>
              {formatReturn(wallet.avg_return_pct)}
            </div>
            
            <div className="text-[10px] font-mono uppercase tracking-widest font-bold text-black mt-3">
              Early Buys: <span className="text-lg leading-none">{wallet.total_early_buys}</span>
            </div>
          </div>

        </div>

      </div>
    </Link>
  );
}