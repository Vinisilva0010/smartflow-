export default function SecurityBadge({ score }: { score: number }) {
  const cls =
    score >= 70 ? "bg-emerald-900/50 text-emerald-300 border-emerald-700" :
    score >= 40 ? "bg-yellow-900/50 text-yellow-300 border-yellow-700" :
                  "bg-red-900/50 text-red-300 border-red-700";
  const label = score >= 70 ? "Safe" : score >= 40 ? "Risky" : "Danger";
  return (
    <span className={`text-xs px-2 py-0.5 rounded border font-mono ${cls}`}>
      {label} {score}/100
    </span>
  );
}