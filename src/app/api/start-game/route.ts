export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/admin";
import { requireUid } from "@/server/auth";
import {
  applyResultsAndReveal,
  assertRoomNotStale,
  createDeck,
  drawFromDeck,
  evaluateHand,
  getPlayersInSeatOrder,
  nextTurnSeat,
  touchRoomFields,
  cleanupExpiredRooms,
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

    if (room.status !== "waiting") {
      return NextResponse.json(
        { error: "Room not in waiting state." },
        { status: 400 }
      );
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

    const deck = createDeck();
    const hands: Record<string, any> = {};
    const ordered = getPlayersInSeatOrder(players);

    for (const p of ordered) {
      hands[p.uid] = evaluateHand([drawFromDeck(deck), drawFromDeck(deck)]);
    }

    const dealer = ordered.find((p: any) => p.isDealer);
    const dealerHand = dealer ? hands[dealer.uid] : null;

    const dealerInstantEnd =
      dealerHand &&
      (dealerHand.status === "blackjack" ||
        dealerHand.autoLockedReason === "high-pair");

    if (dealerInstantEnd) {
      const revealed = applyResultsAndReveal({
        players,
        hands,
      });

      await roomRef.update({
        ...revealed,
        currentRound: Number(room.currentRound || 0) + 1,
        turnOrder: ordered.map((p: any) => p.seat),
        deck,
        players,
        ...touchRoomFields(),
      });

      return NextResponse.json({ ok: true });
    }

    await roomRef.update({
      status: "playing",
      revealAll: false,
      currentTurnSeat: nextTurnSeat({ players, hands }),
      currentRound: Number(room.currentRound || 0) + 1,
      turnOrder: ordered.map((p: any) => p.seat),
      deck,
      hands,
      players,
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