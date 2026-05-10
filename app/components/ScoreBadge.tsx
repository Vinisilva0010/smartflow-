import { getScoreLabel } from "@/lib/client";

export default function ScoreBadge({ score }: { score: number }) {
  const { label, color, bar } = getScoreLabel(score);
  return (
    <div className="flex items-center gap-2">
      <span className={`font-bold text-lg ${color}`}>{score}</span>
      <span className={`text-xs border border-current px-2 py-0.5 rounded-full ${color}`}>
        {label}
      </span>
      <div className="w-20 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full ${bar} rounded-full`} style={{ width: `${Math.min(100, score)}%` }} />
      </div>
    </div>
  );
}