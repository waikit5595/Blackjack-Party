'use client';

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { auth } from "@/lib/firebase";
import { subscribeRoom } from "@/lib/room";
import { RoomData } from "@/lib/types";
import SeatPicker from "@/components/SeatPicker";
import TableHero from "@/components/TableHero";
import RoundTableSeats from "@/components/RoundTableSeats";
import { chooseSeatApi, startGameApi } from "@/lib/api";

export default function RoomPage() {
  const params = useParams<{ roomCode: string }>();
  const roomCode = params.roomCode;
  const [room, setRoom] = useState<RoomData | null>(null);
  const router = useRouter();

  useEffect(() => subscribeRoom(roomCode, setRoom), [roomCode]);

  useEffect(() => {
    if (room?.status === "playing" || room?.status === "revealed") {
      router.push(`/game/${roomCode}`);
    }
  }, [room?.status, roomCode, router]);

  const me = useMemo(() => {
    const uid = auth.currentUser?.uid;
    if (!uid || !room?.players) return null;
    return room.players[uid] || null;
  }, [room]);

  async function chooseSeat(seat: number) {
    try {
      await chooseSeatApi({ roomCode, seat });
    } catch (error: any) {
      alert(error.message || "Failed to choose seat.");
    }
  }

  async function startGame() {
    try {
      await startGameApi({ roomCode });
    } catch (error: any) {
      alert(error.message || "Failed to start game.");
    }
  }

  const players = room?.players ? Object.values(room.players).sort((a, b) => (a.seat || 99) - (b.seat || 99)) : [];
  const isHost = auth.currentUser?.uid === room?.hostUid;
  const canStart = isHost && players.length >= 2 && players.every((p) => p.isDealer || !!p.seat);

  return (
    <main className="min-h-screen px-6 py-10">
      <TableHero title="BLACKJACK PARTY" subtitle="Waiting Room" roomCode={roomCode} />

      <div className="max-w-6xl mx-auto mt-10 space-y-8">
        <RoundTableSeats players={players} meUid={auth.currentUser?.uid} />

        <div className="table-surface rounded-[40px] border border-emerald-400/15 shadow-table p-6 md:p-8">
          <div className="grid xl:grid-cols-[1.1fr_0.9fr] gap-8">
            <div>
              <div className="text-xl font-bold">Players</div>
              <div className="text-white/60 mt-1">Dealer is always fixed at Seat 12.</div>

              <div className="mt-5 space-y-3">
                {players.map((p) => (
                  <div key={p.uid} className="rounded-2xl bg-black/20 border border-white/10 p-4">
                    <span className="font-semibold">{p.name}</span> — Seat {p.seat ?? "-"} {p.isDealer ? "(Dealer)" : ""}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-black/20 p-5">
              {!me?.isDealer ? (
                <>
                  <div className="text-xl font-bold">Choose Seat</div>
                  <div className="text-white/60 mt-1">Select any free seat from 1 to 11.</div>
                  <div className="mt-5">
                    <SeatPicker seats={room?.seats} selectedSeat={me?.seat ?? null} onChoose={chooseSeat} />
                  </div>
                </>
              ) : (
                <>
                  <div className="text-xl font-bold">Dealer Seat</div>
                  <div className="text-white/60 mt-1">Waiting for players to join and choose seats.</div>
                  <div className="mt-5 rounded-2xl p-4 bg-yellow-500/10 border border-yellow-400/20 text-yellow-100">
                    You are the Dealer • Fixed at Seat 12
                  </div>
                </>
              )}

              {isHost ? (
                <button onClick={startGame} disabled={!canStart} className="mt-8 rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-5 py-3.5 font-black text-lg">
                  Start Game
                </button>
              ) : (
                <div className="mt-8 text-white/70">Waiting for host to start the game...</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
