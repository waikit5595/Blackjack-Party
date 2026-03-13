import CardView from "./CardView";
import StatusBadge from "./StatusBadge";
import FloatingResult from "./FloatingResult";
import { HandState, PlayerRoomState } from "@/lib/types";

function getPublicLabel(hand?: HandState, revealAll?: boolean, isSelf?: boolean) {
  if (!hand) return { label: "Waiting", tone: "neutral" as const };

  if (!revealAll && !isSelf && !hand.publicRevealed) {
    if (hand.locked) return { label: "Locked", tone: "blue" as const };
    return { label: "Waiting", tone: "neutral" as const };
  }

  switch (hand.status) {
    case "blackjack":
      return { label: "Blackjack", tone: "gold" as const };
    case "bust":
      return { label: "Bust", tone: "red" as const };
    case "21":
      return { label: "21", tone: "gold" as const };
    case "five-card":
      return { label: "5 Cards", tone: "green" as const };
    case "stood":
      return { label: "Pass", tone: "blue" as const };
    case "locked":
      return { label: "Locked", tone: "blue" as const };
    default:
      return { label: "Playing", tone: "neutral" as const };
  }
}

export default function PlayerSeat({
  player,
  hand,
  isSelf,
  revealAll,
  isCurrentTurn,
  dealBaseDelay = 0,
  online = true,
  totalProfit = 0,
  betAmount = 0,
  lastDelta = 0,
  lastSettleLabel = "",
}: {
  player: PlayerRoomState;
  hand?: HandState;
  isSelf: boolean;
  revealAll: boolean;
  isCurrentTurn: boolean;
  dealBaseDelay?: number;
  online?: boolean;
  totalProfit?: number;
  betAmount?: number;
  lastDelta?: number;
  lastSettleLabel?: string;
}) {
  const cards = hand?.cards || [];
  const forceReveal = revealAll || isSelf || !!hand?.publicRevealed;
  const publicState = getPublicLabel(hand, revealAll, isSelf);

  return (
    <div
      className={`relative rounded-3xl p-4 md:p-5 border backdrop-blur-sm transition-all ${
        isCurrentTurn
          ? "border-yellow-400 bg-yellow-500/10 shadow-gold scale-[1.01]"
          : "border-white/10 bg-black/25"
      }`}
    >
      <FloatingResult delta={lastDelta} label={lastSettleLabel} />

      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-lg flex items-center gap-2 flex-wrap">
            <span>{player.name}</span>
            {player.isDealer && <StatusBadge label="Dealer" tone="gold" />}
            {!online && <StatusBadge label="Offline" tone="red" />}
          </div>
          <div className="text-sm text-white/60 mt-1">Seat {player.seat ?? "-"}</div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {isCurrentTurn && <StatusBadge label="Your Turn" tone="gold" />}
          {!isCurrentTurn && <StatusBadge label={publicState.label} tone={publicState.tone} />}
        </div>
      </div>

      <div className="mt-3 text-sm text-white/75 flex flex-wrap gap-x-4 gap-y-1">
        {!player.isDealer && (
          <div>
            Bet: <span className="font-semibold text-yellow-200">RM{betAmount || 0}</span>
          </div>
        )}
        <div>
          Total:{" "}
          <span className="font-semibold">
            {Number(totalProfit) > 0 ? "+" : ""}RM{Number(totalProfit || 0)}
          </span>
        </div>
      </div>

      <div className="mt-4 flex gap-2 flex-wrap min-h-24">
        {cards.length === 0 && <div className="text-sm text-white/50">No cards yet</div>}
        {cards.map((card, index) => (
          <CardView
            key={index}
            card={card}
            hidden={!forceReveal}
            delay={dealBaseDelay + index * 0.17}
            emphasize={forceReveal && hand?.status === "blackjack"}
          />
        ))}
      </div>

      <div className="mt-4 text-sm min-h-10">
        {forceReveal ? (
          <div className="space-y-1">
            <div className="text-white/85">
              Score: <span className="font-semibold">{hand?.score ?? "-"}</span>
            </div>
            {revealAll && hand?.result && (
              <div
                className={`font-semibold uppercase ${
                  hand.result === "win"
                    ? "text-emerald-300"
                    : hand.result === "lose"
                    ? "text-red-300"
                    : "text-yellow-200"
                }`}
              >
                {hand.result}
              </div>
            )}
          </div>
        ) : (
          <div className="text-white/50">Cards and score hidden until reveal</div>
        )}
      </div>
    </div>
  );
}