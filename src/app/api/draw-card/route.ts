export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/admin";
import { requireUid } from "@/server/auth";
import {
  assertRoomNotStale,
  cleanupExpiredRooms,
  drawFromDeck,
  evaluateHand,
  nextTurnSeat,
  settleFiveCard,
  settleFinalAgainstDealer,
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

    if (room.status !== "playing") {
      return NextResponse.json({ error: "Game is not active." }, { status: 400 });
    }

    const player = room.players?.[uid];
    if (!player) {
      return NextResponse.json({ error: "You are not in this room." }, { status: 403 });
    }

    if (player.seat !== room.currentTurnSeat) {
      return NextResponse.json({ error: "It is not your turn." }, { status: 400 });
    }

    const hand = room.hands?.[uid];
    if (!hand || hand.stood) {
      return NextResponse.json({ error: "You cannot draw now." }, { status: 400 });
    }

    if ((hand.cards || []).length >= 5) {
      return NextResponse.json({ error: "Maximum 5 cards." }, { status: 400 });
    }

    const deck = room.deck || [];
    const newCard = drawFromDeck(deck);
    const newHand = evaluateHand([...(hand.cards || []), newCard]);

    room.deck = deck;
    room.hands[uid] = {
      ...newHand,
      publicRevealed: (newHand.cards?.length || 0) >= 5 ? true : !!newHand.publicRevealed,
    };

    // five-card = immediate reveal + immediate settlement + auto move next player
    if ((room.hands[uid].cards?.length || 0) >= 5) {
      settleFiveCard(room, uid);
      room.currentTurnSeat = nextTurnSeat({
        players: room.players,
        hands: room.hands,
      });

      // if dealer was acting and no next turn, reveal remaining final settlement
      if (player.isDealer && room.currentTurnSeat == null) {
        settleFinalAgainstDealer(room);
      }

      room.updatedAt = Date.now();
      room.lastActiveAt = Date.now();
      await roomRef.set({
        ...room,
        ...touchRoomFields(),
      });
      return NextResponse.json({ ok: true });
    }

    // bust and 21 do NOT auto pass
    room.currentTurnSeat = room.currentTurnSeat;

    room.updatedAt = Date.now();
    room.lastActiveAt = Date.now();

    await roomRef.set({
      ...room,
      ...touchRoomFields(),
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("draw-card error:", error);
    return NextResponse.json(
      { error: error.message || "internal" },
      { status: 500 }
    );
  }
}