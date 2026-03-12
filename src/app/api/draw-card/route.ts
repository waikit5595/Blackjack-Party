export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/admin";
import { requireUid } from "@/server/auth";
import { applyResultsAndReveal, drawFromDeck, evaluateHand, nextTurnSeat } from "@/server/game";

export async function POST(request: NextRequest) {
  try {
    const uid = await requireUid(request);
    const { roomCode } = await request.json();
    const roomRef = adminDb.ref(`rooms/${roomCode}`);
    const snap = await roomRef.get();
    if (!snap.exists()) return NextResponse.json({ error: "Room not found." }, { status: 404 });

    const room = snap.val();
    if (room.status !== "playing") return NextResponse.json({ error: "Game is not active." }, { status: 400 });
    const player = room.players?.[uid];
    if (!player) return NextResponse.json({ error: "You are not in this room." }, { status: 403 });
    if (player.seat !== room.currentTurnSeat) return NextResponse.json({ error: "It is not your turn." }, { status: 400 });

    const hand = room.hands?.[uid];
    if (!hand || hand.locked || hand.stood) return NextResponse.json({ error: "You cannot draw now." }, { status: 400 });
    if ((hand.cards || []).length >= 5) return NextResponse.json({ error: "Maximum 5 cards." }, { status: 400 });

    const deck = room.deck || [];
    const newCard = drawFromDeck(deck);
    const newHand = evaluateHand([...(hand.cards || []), newCard]);
    const computedHands = { ...(room.hands || {}), [uid]: newHand };
    const nextSeat = newHand.locked ? nextTurnSeat({ players: room.players, hands: computedHands }) : room.currentTurnSeat;

    const dealerAutoReveal =
      player.isDealer &&
      nextSeat == null &&
      (newHand.status === "bust" || newHand.status === "21" || newHand.status === "blackjack" || newHand.status === "five-card" || newHand.autoLockedReason === "high-pair");

    if (dealerAutoReveal) {
      const revealed = applyResultsAndReveal({ players: room.players, hands: computedHands });
      await roomRef.update({ ...revealed, deck });
      return NextResponse.json({ ok: true });
    }

    await roomRef.update({ deck, [`hands/${uid}`]: newHand, currentTurnSeat: nextSeat });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "internal" }, { status: 500 });
  }
}
