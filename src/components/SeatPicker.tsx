export default function SeatPicker({
  seats,
  selectedSeat,
  onChoose,
}: {
  seats: Record<string, string | null> | undefined;
  selectedSeat: number | null;
  onChoose: (seat: number) => void;
}) {
  const items = Array.from({ length: 11 }, (_, i) => i + 1);

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
      {items.map((seat) => {
        const occupied = !!seats?.[String(seat)];
        return (
          <button
            key={seat}
            onClick={() => onChoose(seat)}
            disabled={occupied}
            className={`p-3 rounded-2xl border text-left ${
              selectedSeat === seat
                ? "border-yellow-400 bg-yellow-500/10 shadow-[0_0_30px_rgba(250,204,21,0.2)]"
                : "border-white/10 bg-white/5 hover:bg-white/10"
            }`}
          >
            <div className="font-semibold">Seat {seat}</div>
            <div className="text-xs mt-1 text-white/65">{occupied ? "Taken" : "Available"}</div>
          </button>
        );
      })}
    </div>
  );
}
