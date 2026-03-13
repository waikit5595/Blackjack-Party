'use client';

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { auth } from "@/lib/firebase";
import { subscribePresence, subscribeRoom } from "@/lib/room";
import { PresenceMap, RoomData } from "@/lib/types";
import SeatPicker from "@/components/SeatPicker";
import TableHero from "@/components/TableHero";
import RoundTableSeats from "@/components/RoundTableSeats";
import BetChips from "@/components/BetChips";
import {
  chooseSeatApi,
  leaveRoomApi,
  placeBetApi,
  startGameApi,
} from "@/lib/api";
import { useRoomPresence } from "@/hooks/useRoomPresence";

function money(n?: number) {
  const v = Number(n || 0);
  return `${v > 0 ? "+" : ""}RM${v}`;
}

export default function RoomPage() {
  const params = useParams<{ roomCode: string }>();
  const roomCode = params.roomCode;
  const [room, setRoom] = useState<RoomData | null>(null);
  const [presence, setPresence] = useState<PresenceMap>({});
  const router = useRouter();

  useRoomPresence(roomCode);

  useEffect(() => subscribeRoom(roomCode, setRoom), [roomCode]);
  useEffect(() => subscribePresence(roomCode, setPresence), [roomCode]);

  useEffect(() => {
    if (room?.status === "playing" || room?.status === "revealed") {
      router.push(`/game/${roomCode}`);
    }

    if (room?.status === "closed") {
      alert("This room has been closed.");
      router.push("/");
    }
  }, [room?.status, roomCode, router]);

  const uid = auth.currentUser?.uid;

  const me = useMemo(() => {
    if (!uid || !room?.players) return null;
    return room.players[uid] || null;
  }, [uid, room]);

  const myBet = useMemo(() => {
    if (!uid || !room?.roundBets) return 0;
    return room.roundBets[uid]?.amount || 0;
  }, [uid, room]);

  const myWallet = useMemo(() => {
    if (!uid || !room?.wallets) return null;
    return room.wallets[uid] || null;
  }, [uid, room]);

  async function chooseSeat(seat: number) {
    try {
      await chooseSeatApi({ roomCode, seat });
    } catch (error: any) {
      alert(error.message || "Failed to choose seat.");
    }
  }

  async function placeBet(amount: number) {
    try {
      await placeBetApi({ roomCode, amount });
    } catch (error: any) {
      alert(error.message || "Failed to place bet.");
    }
  }

  async function startGame() {
    try {
      await startGameApi({ roomCode });
    } catch (error: any) {
      alert(error.message || "Failed to start round.");
    }
  }

  async function leaveRoom() {
    try {
      await leaveRoomApi({ roomCode });
      router.push("/");
    } catch (error: any) {
      alert(error.message || "Failed to leave room.");
    }
  }

  const players = room?.players
    ? Object.values(room.players).sort((a, b) => (a.seat || 99) - (b.seat || 99))
    : [];

  const isHost = uid === room?.hostUid;

  const canStart =
    isHost &&
    room?.status === "betting" &&
    players.length >= 2 &&
    players.every((p) => p.isDealer || !!p.seat) &&
    players.every((p) => {
      if (p.isDealer) return true;
      const bet = room?.roundBets?.[p.uid];
      return !!bet && bet.amount > 0;
    });

  return (
    <main className="min-h-screen px-4 md:px-6 py-8 md:py-10">
      <TableHero
        title="BLACKJACK PARTY"
        subtitle={room?.status === "betting" ? "Betting Phase" : "Waiting Room"}
        roomCode={roomCode}
      />

      <div className="max-w-6xl mx-auto mt-8 md:mt-10 space-y-6 md:space-y-8">
        <RoundTableSeats players={players} meUid={uid} presence={presence} />

        <div className="table-surface rounded-[32px] md:rounded-[40px] border border-emerald-400/15 shadow-table p-5 md:p-8">
          <div className="grid xl:grid-cols-[1.1fr_0.9fr] gap-8">
            <div>
              <div className="text-xl font-bold">Players</div>
              <div className="text-white/60 mt-1">
                Dealer is fixed at Seat 12. Players must choose seat and place bet before round starts.
              </div>

              <div className="mt-5 space-y-3">
                {players.map((p) => {
                  const bet = room?.roundBets?.[p.uid]?.amount || 0;
                  const wallet = room?.wallets?.[p.uid];
                  return (
                    <div
                      key={p.uid}
                      className="rounded-2xl bg-black/20 border border-white/10 p-4 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div>
                          <span className="font-semibold">{p.name}</span> — Seat{" "}
                          {p.seat ?? "-"} {p.isDealer ? "(Dealer)" : ""}
                        </div>

                        {!p.isDealer && (
                          <div className="text-sm text-white/70 mt-1">
                            Bet:{" "}
                            <span className="text-yellow-200 font-semibold">
                              {bet > 0 ? `RM${bet}` : "Not set"}
                            </span>
                            {" • "}
                            Total:{" "}
                            <span className="font-semibold">{money(wallet?.totalProfit)}</span>
                          </div>
                        )}

                        {p.isDealer && (
                          <div className="text-sm text-white/70 mt-1">
                            Dealer Total:{" "}
                            <span className="font-semibold">{money(wallet?.totalProfit)}</span>
                          </div>
                        )}
                      </div>

                      <div className="text-xs px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-200 border border-emerald-400/30">
                        Online
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[28px] md:rounded-[32px] border border-white/10 bg-black/20 p-5">
              {!me?.isDealer ? (
                <>
                  <div className="text-xl font-bold">Choose Seat & Bet</div>
                  <div className="text-white/60 mt-1">
                    Select any free seat from 1 to 11, then place your bet.
                  </div>

                  <div className="mt-5">
                    <SeatPicker
                      seats={room?.seats}
                      selectedSeat={me?.seat ?? null}
                      onChoose={chooseSeat}
                    />
                  </div>

                  <div className="mt-6">
                    <div className="text-lg font-bold mb-3">Choose Bet</div>
                    <BetChips
                      currentBet={myBet}
                      onSelect={placeBet}
                      disabled={room?.status !== "betting"}
                    />
                  </div>

                  <div className="mt-5 text-sm text-white/75">
                    Your Total:{" "}
                    <span className="font-semibold text-yellow-200">
                      {money(myWallet?.totalProfit)}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-xl font-bold">Dealer Panel</div>
                  <div className="text-white/60 mt-1">
                    Wait for players to choose seat and place bet before starting round.
                  </div>

                  <div className="mt-5 rounded-2xl p-4 bg-yellow-500/10 border border-yellow-400/20 text-yellow-100">
                    You are the Dealer • Fixed at Seat 12
                  </div>

                  <div className="mt-5 text-sm text-white/75">
                    Dealer Total:{" "}
                    <span className="font-semibold text-yellow-200">
                      {money(myWallet?.totalProfit)}
                    </span>
                  </div>
                </>
              )}

              <div className="flex gap-3 flex-wrap mt-8">
                {isHost ? (
                  <button
                    onClick={startGame}
                    disabled={!canStart}
                    className="rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-5 py-3.5 font-black text-lg"
                  >
                    Start Round
                  </button>
                ) : (
                  <div className="text-white/70 self-center">
                    Waiting for dealer to start the round...
                  </div>
                )}

                <button
                  onClick={leaveRoom}
                  className="rounded-2xl bg-red-700 hover:bg-red-600 px-5 py-3.5 font-black text-lg"
                >
                  Leave Room
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}