import { PlayerRoomState, PresenceMap } from "@/lib/types";
import StatusBadge from "./StatusBadge";

const positions: Record<number, string> = {
  12: "left-1/2 -translate-x-1/2 top-2",
  1: "left-10 top-20",
  2: "left-2 top-1/2 -translate-y-1/2",
  3: "left-10 bottom-20",
  4: "left-1/4 bottom-2 -translate-x-1/2",
  5: "left-1/2 bottom-0 -translate-x-1/2",
  6: "right-1/4 bottom-2 translate-x-1/2",
  7: "right-10 bottom-20",
  8: "right-2 top-1/2 -translate-y-1/2",
  9: "right-10 top-20",
  10: "right-1/4 top-2 translate-x-1/2",
  11: "left-1/4 top-2 -translate-x-1/2",
};

export default function RoundTableSeats({
  players,
  meUid,
  presence,
}: {
  players: PlayerRoomState[];
  meUid?: string;
  presence?: PresenceMap;
}) {
  const playersBySeat = new Map<number, PlayerRoomState>();
  for (const p of players) {
    if (p.seat != null) playersBySeat.set(p.seat, p);
  }

  return (
    <div className="relative w-full min-h-[460px] rounded-[40px] table-surface felt-border border border-emerald-400/15 overflow-hidden hidden lg:block">
      <div className="absolute inset-10 rounded-[999px] border border-yellow-400/20" />
      <div className="absolute inset-[18%] rounded-[999px] border border-white/5" />

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
        <div className="gold-text text-3xl font-black">BLACKJACK</div>
        <div className="text-white/55 text-sm mt-1">Choose your seat</div>
      </div>

      {Array.from({ length: 12 }, (_, i) => i + 1).map((seat) => {
        const p = playersBySeat.get(seat);
        const isMe = p?.uid === meUid;

        // ✅ 房间里已加入的人先视为在线，不显示假 Offline
        const online = !!p;

        return (
          <div
            key={seat}
            className={`absolute ${positions[seat]} w-[110px] sm:w-[130px] rounded-2xl border ${
              p
                ? isMe
                  ? "border-yellow-400 bg-yellow-500/10"
                  : "border-white/10 bg-black/30"
                : "border-white/10 bg-white/5"
            } p-3 text-center`}
          >
            <div className="text-xs text-white/60">Seat {seat}</div>

            {p ? (
              <div className="mt-1 space-y-1">
                <div className="font-semibold truncate">{p.name}</div>

                <div className="flex justify-center gap-1 flex-wrap">
                  {p.isDealer && <StatusBadge label="Dealer" tone="gold" />}
                  {!p.isDealer && isMe && <StatusBadge label="You" tone="blue" />}
                  {!online && <StatusBadge label="Offline" tone="red" />}
                </div>
              </div>
            ) : (
              <div className="mt-1 text-sm text-white/50">Empty</div>
            )}
          </div>
        );
      })}
    </div>
  );
}