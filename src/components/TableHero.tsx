export default function TableHero({
  title,
  subtitle,
  roomCode,
}: {
  title: string;
  subtitle: string;
  roomCode?: string;
}) {
  return (
    <div className="text-center max-w-3xl mx-auto">
      <div className="gold-text text-5xl md:text-6xl font-black tracking-wide">{title}</div>
      <div className="mt-3 text-white/75 text-base md:text-lg">{subtitle}</div>
      {roomCode && (
        <div className="mt-5 inline-flex items-center gap-3 rounded-full border border-yellow-400/25 bg-yellow-500/10 px-5 py-2.5 text-yellow-100">
          <span className="text-sm uppercase tracking-[0.2em]">Room</span>
          <span className="text-2xl font-black">{roomCode}</span>
        </div>
      )}
    </div>
  );
}
