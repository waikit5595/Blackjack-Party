export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/admin";
import { requireUid } from "@/server/auth";
import {
  assertRoomNotStale,
  cleanupExpiredRooms,
  createDeck,
  drawFromDeck,
  ensureWallet,
  evaluateHand,
  getPlayersInSeatOrder,
  nextTurnSeat,
  resetRoundVisualWallets,
  settleImmediateInitials,
  touchRoomFields,
} from "@/server/game";

export async function POST(request: NextRequest) {
  try {
    await cleanupExpiredRooms();

    const uid = await requireUid(request);
    const { roomCode } = await request.json();

    const roomRef = adminDb.ref(`rooms/${roomCode}`);
    const snap = await roomRef.get();

    if (!snap.exists()) {
      return NextResponse.json({ error: "Room not found." }, { status: 404 });
    }

    const room = snap.val();
    assertRoomNotStale(room);

    if (room.hostUid !== uid) {
      return NextResponse.json({ error: "Only host can start." }, { status: 403 });
    }

    if (room.status !== "betting") {
      return NextResponse.json({ error: "Room not in betting phase." }, { status: 400 });
    }

    const players = room.players || {};
    const playerList = Object.values(players) as any[];

    if (playerList.length < 2) {
      return NextResponse.json({ error: "Need at least 2 players." }, { status: 400 });
    }

    if (playerList.some((p) => !p.isDealer && !p.seat)) {
      return NextResponse.json(
        { error: "All players must choose seat." },
        { status: 400 }
      );
    }

    const roundBets = room.roundBets || {};
    for (const p of playerList) {
      ensureWallet(room, p.uid);
      if (p.isDealer) continue;
      const bet = roundBets[p.uid];
      if (!bet || !bet.amount || bet.amount <= 0) {
        return NextResponse.json(
          { error: "All players must place bet before starting." },
          { status: 400 }
        );
      }
    }

    resetRoundVisualWallets(room);

    const lockedBets: Record<string, any> = { ...roundBets };
    for (const key of Object.keys(lockedBets)) {
      lockedBets[key] = {
        ...lockedBets[key],
        locked: true,
        settled: false,
      };
    }

    room.roundBets = lockedBets;

    const deck = createDeck();
    const hands: Record<string, any> = {};
    const ordered = getPlayersInSeatOrder(players);

    for (const p of ordered) {
      hands[p.uid] = evaluateHand([drawFromDeck(deck), drawFromDeck(deck)]);
    }

    room.players = players;
    room.hands = hands;
    room.deck = deck;
    room.status = "playing";
    room.revealAll = false;
    room.currentRound = Number(room.currentRound || 0) + 1;
    room.turnOrder = ordered.map((p: any) => p.seat);

    // initial specials settle immediately
    settleImmediateInitials(room);

    room.currentTurnSeat = nextTurnSeat({
      players: room.players,
      hands: room.hands,
    });

    // if everyone already settled immediately
    if (room.currentTurnSeat == null) {
      room.status = "revealed";
      room.revealAll = true;
    }

    room.updatedAt = Date.now();
    room.lastActiveAt = Date.now();

    await roomRef.set({
      ...room,
      ...touchRoomFields(),
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("start-game error:", error);
    return NextResponse.json(
      { error: error.message || "internal" },
      { status: 500 }
    );
  }
}