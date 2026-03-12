export default function StatusBadge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "gold" | "red" | "green" | "blue";
}) {
  const styles = {
    neutral: "bg-white/10 text-white/85 border border-white/10",
    gold: "bg-yellow-500/15 text-yellow-200 border border-yellow-400/30",
    red: "bg-red-500/15 text-red-200 border border-red-400/30",
    green: "bg-emerald-500/15 text-emerald-200 border border-emerald-400/30",
    blue: "bg-sky-500/15 text-sky-200 border border-sky-400/30",
  };

  return <div className={`text-xs px-2.5 py-1 rounded-full ${styles[tone]}`}>{label}</div>;
}
