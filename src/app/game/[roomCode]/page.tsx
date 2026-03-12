'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { auth } from "@/lib/firebase";
import { subscribeRoom } from "@/lib/room";
import { RoomData } from "@/lib/types";
import PlayerSeat from "@/components/PlayerSeat";
import ActionButtons from "@/components/ActionButtons";
import TableHero from "@/components/TableHero";
import { drawCardApi, endTurnApi, nextRoundApi, revealGameApi } from "@/lib/api";
import { useGameSound } from "@/hooks/useGameSound";

export default function GamePage() {
  const params = useParams<{ roomCode: string }>();
  const roomCode = params.roomCode;
  const [room, setRoom] = useState<RoomData | null>(null);

  useEffect(() => subscribeRoom(roomCode, setRoom), [roomCode]);

  const uid = auth.currentUser?.uid;
  const me = useMemo(() => (uid && room?.players ? room.players[uid] : null), [uid, room]);
  const hand = useMemo(() => (uid && room?.hands ? room.hands[uid] : null), [uid, room]);
  const players = useMemo(() => (room?.players ? Object.values(room.players).sort((a, b) => (a.seat || 99) - (b.seat || 99)) : []), [room]);

  const isCurrentTurn = !!me && room?.currentTurnSeat === me.seat && room?.status === "playing";
  const canAct = !!isCurrentTurn && hand && !hand.locked;
  const showReveal = room?.status === "playing" && room?.currentTurnSeat == null && !!room?.hands && Object.keys(room.hands).length > 0;
  const showNextRound = room?.status === "revealed";

  const currentPlayerName = useMemo(() => {
    const seat = room?.currentTurnSeat;
    if (!seat || !room?.players) return "Dealer Finished";
    const player = Object.values(room.players).find((p) => p.seat === seat);
    return player?.name || "Dealer Finished";
  }, [room]);

  const { playDeal, playAction, playBlackjack, playBust, playReveal } = useGameSound();
  const lastRoundRef = useRef<number | null>(null);
  const lastRevealRef = useRef<boolean>(false);
  const statusPlayedRef = useRef<string>("");

  useEffect(() => {
    if (!room) return;
    if (room.currentRound && room.currentRound !== lastRoundRef.current) {
      lastRoundRef.current = room.currentRound;
      players.forEach((_, idx) => {
        setTimeout(() => playDeal(), idx * 190);
        setTimeout(() => playDeal(), idx * 190 + 120);
      });
    }
  }, [room?.currentRound, players, playDeal, room]);

  useEffect(() => {
    const currentStatus = hand?.status || "";
    if (!currentStatus || currentStatus === statusPlayedRef.current) return;
    if (currentStatus === "blackjack") {
      playBlackjack();
      statusPlayedRef.current = currentStatus;
    } else if (currentStatus === "bust") {
      playBust();
      statusPlayedRef.current = currentStatus;
    }
  }, [hand?.status, playBlackjack, playBust]);

  useEffect(() => {
    if (room?.revealAll && !lastRevealRef.current) playReveal();
    lastRevealRef.current = !!room?.revealAll;
  }, [room?.revealAll, playReveal]);

  async function onHit() {
    try {
      playAction();
      await drawCardApi({ roomCode });
    } catch (error: any) {
      alert(error.message || "Failed to draw.");
    }
  }

  async function onStand() {
    try {
      playAction();
      await endTurnApi({ roomCode });
    } catch (error: any) {
      alert(error.message || "Failed to end turn.");
    }
  }

  async function onReveal() {
    try {
      playReveal();
      await revealGameApi({ roomCode });
    } catch (error: any) {
      alert(error.message || "Failed to reveal.");
    }
  }

  async function onNextRound() {
    try {
      await nextRoundApi({ roomCode });
    } catch (error: any) {
      alert(error.message || "Failed to start next round.");
    }
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <TableHero title="BLACKJACK PARTY" subtitle={`Status: ${room?.status || "loading"} • Now Playing: ${currentPlayerName}`} roomCode={roomCode} />

      <div className="max-w-7xl mx-auto mt-10 table-surface rounded-[40px] border border-emerald-400/15 shadow-table p-6 md:p-8">
        <div className="rounded-[32px] border border-white/10 bg-black/20 p-4 md:p-5">
          <div className="text-white/70 text-sm">Important Rule</div>
          <div className="mt-1 text-white/90">Other players cannot see hidden cards, score, or bust status until the dealer finishes and the host reveals all hands.</div>
        </div>

        <div className="mt-6 grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {players.map((player, index) => (
            <PlayerSeat
              key={player.uid}
              player={player}
              hand={room?.hands?.[player.uid]}
              isSelf={uid === player.uid}
              revealAll={!!room?.revealAll}
              isCurrentTurn={room?.currentTurnSeat === player.seat}
              dealBaseDelay={index * 0.16}
            />
          ))}
        </div>

        <ActionButtons
          canAct={!!canAct}
          onHit={onHit}
          onStand={onStand}
          onReveal={onReveal}
          onNextRound={onNextRound}
          showReveal={!!showReveal}
          showNextRound={!!showNextRound}
        />
      </div>
    </main>
  );
}
