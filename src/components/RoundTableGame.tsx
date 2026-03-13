import { HandState, PlayerRoomState, PresenceMap, WalletState, BetState } from "@/lib/types";
import PlayerSeat from "./PlayerSeat";

const positions: Record<number, string> = {
  12: "left-1/2 -translate-x-1/2 top-1",
  1: "left-6 top-16",
  2: "left-0 top-1/2 -translate-y-1/2",
  3: "left-6 bottom-16",
  4: "left-1/4 bottom-0 -translate-x-1/2",
  5: "left-1/2 bottom-0 -translate-x-1/2",
  6: "right-1/4 bottom-0 translate-x-1/2",
  7: "right-6 bottom-16",
  8: "right-0 top-1/2 -translate-y-1/2",
  9: "right-6 top-16",
  10: "right-1/4 top-0 translate-x-1/2",
  11: "left-1/4 top-0 -translate-x-1/2",
};

export default function RoundTableGame({
  players,
  hands,
  uid,
  revealAll,
  currentTurnSeat,
  presence,
  wallets,
  roundBets,
}: {
  players: PlayerRoomState[];
  hands: Record<string, HandState> | undefined;
  uid?: string;
  revealAll: boolean;
  currentTurnSeat: number | null | undefined;
  presence?: PresenceMap;
  wallets?: Record<string, WalletState>;
  roundBets?: Record<string, BetState>;
}) {
  return (
    <>
      <div className="hidden xl:block relative min-h-[760px] rounded-[40px] table-surface felt-border border border-emerald-400/15 overflow-hidden">
        <div className="absolute inset-10 rounded-[999px] border border-yellow-400/20" />
        <div className="absolute inset-[15%] rounded-[999px] border border-white/5" />

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          <div className="gold-text text-3xl font-black">BLACKJACK TABLE</div>
          <div className="text-white/55 text-sm mt-1">Players around the table</div>
        </div>

        {players.map((player, index) => (
          <div
            key={player.uid}
            className={`absolute ${positions[player.seat || 12]} w-[290px]`}
          >
            <PlayerSeat
              player={player}
              hand={hands?.[player.uid]}
              isSelf={uid === player.uid}
              revealAll={revealAll}
              isCurrentTurn={currentTurnSeat === player.seat}
              dealBaseDelay={index * 0.16}
              online={player.uid === uid || !!presence?.[player.uid]?.online}
              totalProfit={wallets?.[player.uid]?.totalProfit || 0}
              betAmount={roundBets?.[player.uid]?.amount || 0}
              lastDelta={wallets?.[player.uid]?.lastDelta || 0}
              lastSettleLabel={wallets?.[player.uid]?.lastSettleLabel || ""}
            />
          </div>
        ))}
      </div>

      <div className="xl:hidden grid md:grid-cols-2 gap-4">
        {players.map((player, index) => (
          <PlayerSeat
            key={player.uid}
            player={player}
            hand={hands?.[player.uid]}
            isSelf={uid === player.uid}
            revealAll={revealAll}
            isCurrentTurn={currentTurnSeat === player.seat}
            dealBaseDelay={index * 0.16}
            online={player.uid === uid || !!presence?.[player.uid]?.online}
            totalProfit={wallets?.[player.uid]?.totalProfit || 0}
            betAmount={roundBets?.[player.uid]?.amount || 0}
            lastDelta={wallets?.[player.uid]?.lastDelta || 0}
            lastSettleLabel={wallets?.[player.uid]?.lastSettleLabel || ""}
          />
        ))}
      </div>
    </>
  );
}