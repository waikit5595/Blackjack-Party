export default function ActionButtons({
  canAct,
  onHit,
  onStand,
  onReveal,
  onNextRound,
  onLeave,
  showReveal,
  showNextRound,
  canDealerRevealPlayer,
  revealTargets,
  onRevealPlayer,
  disableHit,
}: {
  canAct: boolean;
  onHit: () => void;
  onStand: () => void;
  onReveal: () => void;
  onNextRound: () => void;
  onLeave: () => void;
  showReveal: boolean;
  showNextRound: boolean;
  canDealerRevealPlayer: boolean;
  revealTargets: { uid: string; name: string }[];
  onRevealPlayer: (uid: string) => void;
  disableHit: boolean;
}) {
  return (
    <div className="mt-8 rounded-3xl border border-white/10 bg-black/30 p-4 md:p-5">
      <div className="text-sm text-white/60 mb-3">Game Controls</div>

      {showReveal && (
        <div className="mb-4 rounded-2xl border border-yellow-400/30 bg-yellow-500/10 p-4">
          <div className="text-yellow-200 font-semibold">Dealer finished.</div>
          <div className="text-white/75 text-sm mt-1">
            Click below to end the game and reveal all hands.
          </div>
        </div>
      )}

      {canDealerRevealPlayer && revealTargets.length > 0 && (
        <div className="mb-4 rounded-2xl border border-purple-400/30 bg-purple-500/10 p-4">
          <div className="text-purple-200 font-semibold">Dealer Special Reveal</div>
          <div className="text-white/75 text-sm mt-1 mb-3">
            Dealer has 16+ points and may reveal one player's hand early.
          </div>

          <div className="flex flex-wrap gap-2">
            {revealTargets.map((p) => (
              <button
                key={p.uid}
                onClick={() => onRevealPlayer(p.uid)}
                className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 font-semibold"
              >
                Reveal {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        {!showReveal && !showNextRound && (
          <>
            <button
              onClick={onHit}
              disabled={!canAct || disableHit}
              className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 font-semibold"
            >
              Hit
            </button>

            <button
              onClick={onStand}
              disabled={!canAct}
              className="px-5 py-3 rounded-2xl bg-slate-700 hover:bg-slate-600 font-semibold"
            >
              Pass / Stand
            </button>
          </>
        )}

        {showReveal && (
          <button
            onClick={onReveal}
            className="px-5 py-3 rounded-2xl bg-purple-700 hover:bg-purple-600 font-semibold"
          >
            End Game & Reveal Hands
          </button>
        )}

        {showNextRound && (
          <button
            onClick={onNextRound}
            className="px-5 py-3 rounded-2xl bg-yellow-500 hover:bg-yellow-400 text-black font-semibold"
          >
            New Round
          </button>
        )}

        <button
          onClick={onLeave}
          className="px-5 py-3 rounded-2xl bg-red-700 hover:bg-red-600 font-semibold"
        >
          Leave Room
        </button>
      </div>
    </div>
  );
}