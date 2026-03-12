'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { subscribePresence, subscribeRoom } from "@/lib/room";
import { PresenceMap, RoomData } from "@/lib/types";
import ActionButtons from "@/components/ActionButtons";
import TableHero from "@/components/TableHero";
import RoundTableGame from "@/components/RoundTableGame";
import {
  drawCardApi,
  endTurnApi,
  leaveRoomApi,
  nextRoundApi,
  revealGameApi,
  revealPlayerApi,
} from "@/lib/api";
import { useGameSound } from "@/hooks/useGameSound";
import { useRoomPresence } from "@/hooks/useRoomPresence";

export default function GamePage() {
  const params = useParams<{ roomCode: string }>();
  const roomCode = params.roomCode;
  const [room, setRoom] = useState<RoomData | null>(null);
  const [presence, setPresence] = useState<PresenceMap>({});
  const router = useRouter();

  useRoomPresence(roomCode);

  useEffect(() => subscribeRoom(roomCode, setRoom), [roomCode]);
  useEffect(() => subscribePresence(roomCode, setPresence), [roomCode]);

  const uid = auth.currentUser?.uid;

  const me = useMemo(
    () => (uid && room?.players ? room.players[uid] : null),
    [uid, room]
  );

  const hand = useMemo(
    () => (uid && room?.hands ? room.hands[uid] : null),
    [uid, room]
  );

  const players = useMemo(
    () =>
      room?.players
        ? Object.values(room.players).sort((a, b) => (a.seat || 99) - (b.seat || 99))
        : [],
    [room]
  );

  useEffect(() => {
    if (room?.status === "waiting") {
      router.push(`/room/${roomCode}`);
    }

    if (room?.status === "closed") {
      alert("This room has been closed.");
      router.push("/");
    }
  }, [room?.status, roomCode, router]);

  const isCurrentTurn =
    !!me &&
    room?.currentTurnSeat === me.seat &&
    room?.status === "playing";

  const canAct = !!isCurrentTurn && !!hand;

  const showReveal =
    room?.status === "playing" &&
    room?.currentTurnSeat == null &&
    !!room?.hands &&
    Object.keys(room.hands).length > 0;

  const showNextRound = room?.status === "revealed";

  // ✅ 最终规则：这三种都不能继续 Hit，只能自己按 Pass
  const disableHit = !!(
    isCurrentTurn &&
    (hand?.status === "bust" ||
      hand?.status === "21" ||
      hand?.status === "five-card")
  );

  const currentPlayerName = useMemo(() => {
    const seat = room?.currentTurnSeat;
    if (!seat || !room?.players) return "Dealer Finished";
    const player = Object.values(room.players).find((p) => p.seat === seat);
    return player?.name || "Dealer Finished";
  }, [room]);

  const canDealerRevealPlayer =
    !!me?.isDealer &&
    room?.status === "playing" &&
    (hand?.score || 0) >= 16;

  const revealTargets = useMemo(() => {
    if (!room?.players || !room?.hands || !me?.isDealer) return [];
    return Object.values(room.players)
      .filter((p) => !p.isDealer)
      .filter((p) => room.hands?.[p.uid])
      .filter((p) => !room.hands?.[p.uid]?.publicRevealed)
      .map((p) => ({
        uid: p.uid,
        name: p.name,
      }));
  }, [room, me]);

  const { playDeal, playAction, playBlackjack, playBust, playReveal } =
    useGameSound();

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
    if (room?.revealAll && !lastRevealRef.current) {
      playReveal();
    }
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

  async function onLeave() {
    try {
      await leaveRoomApi({ roomCode });
      router.push("/");
    } catch (error: any) {
      alert(error.message || "Failed to leave room.");
    }
  }

  async function onRevealPlayer(targetUid: string) {
    try {
      await revealPlayerApi({ roomCode, targetUid });
    } catch (error: any) {
      alert(error.message || "Failed to reveal player.");
    }
  }

  return (
    <main className="min-h-screen px-4 md:px-6 py-8 md:py-10">
      <TableHero
        title="BLACKJACK PARTY"
        subtitle={`Status: ${room?.status || "loading"} • Now Playing: ${currentPlayerName}`}
        roomCode={roomCode}
      />

      <div className="max-w-7xl mx-auto mt-8 md:mt-10 table-surface rounded-[32px] md:rounded-[40px] border border-emerald-400/15 shadow-table p-5 md:p-8">
        <div className="rounded-[28px] md:rounded-[32px] border border-white/10 bg-black/20 p-4 md:p-5">
          <div className="text-white/70 text-sm">Important Rule</div>
          <div className="mt-1 text-white/90">
            Other players cannot see hidden cards, score, or bust status until
            the dealer finishes and the host reveals all hands.
          </div>
        </div>

        <div className="mt-6">
          <RoundTableGame
            players={players}
            hands={room?.hands}
            uid={uid}
            revealAll={!!room?.revealAll}
            currentTurnSeat={room?.currentTurnSeat}
            presence={presence}
          />
        </div>

        <ActionButtons
          canAct={!!canAct}
          onHit={onHit}
          onStand={onStand}
          onReveal={onReveal}
          onNextRound={onNextRound}
          onLeave={onLeave}
          showReveal={!!showReveal}
          showNextRound={!!showNextRound}
          canDealerRevealPlayer={!!canDealerRevealPlayer}
          revealTargets={revealTargets}
          onRevealPlayer={onRevealPlayer}
          disableHit={disableHit}
        />
      </div>
    </main>
  );
}