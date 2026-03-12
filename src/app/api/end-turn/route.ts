export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/admin";
import { requireUid } from "@/server/auth";
import { applyResultsAndReveal, nextTurnSeat } from "@/server/game";

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
    if (!hand) return NextResponse.json({ error: "Hand not found." }, { status: 404 });

    const newHand = { ...hand, stood: true, locked: true, status: hand.status === "playing" ? "stood" : hand.status };
    const computedHands = { ...(room.hands || {}), [uid]: newHand };
    const currentTurnSeat = nextTurnSeat({ players: room.players, hands: computedHands });

    if (player.isDealer && currentTurnSeat == null) {
      const revealed = applyResultsAndReveal({ players: room.players, hands: computedHands });
      await roomRef.update(revealed);
      return NextResponse.json({ ok: true });
    }

    await roomRef.update({ [`hands/${uid}`]: newHand, currentTurnSeat });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "internal" }, { status: 500 });
  }
}
