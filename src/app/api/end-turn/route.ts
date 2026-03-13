export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/admin";
import { requireUid } from "@/server/auth";
import {
  assertRoomNotStale,
  cleanupExpiredRooms,
  nextTurnSeat,
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
    if (!hand) {
      return NextResponse.json({ error: "Hand not found." }, { status: 404 });
    }

    // Rule: below 16 cannot pass unless bust or 21
    if (!hand.busted && hand.status !== "21" && hand.score < 16) {
      return NextResponse.json(
        { error: "Points below 16 cannot pass or stand." },
        { status: 400 }
      );
    }

    room.hands[uid] = {
      ...hand,
      stood: true,
      locked: true,
      status:
        hand.status === "playing"
          ? "stood"
          : hand.status,
    };

    room.currentTurnSeat = nextTurnSeat({
      players: room.players,
      hands: room.hands,
    });

    // dealer ended or no more turns => final settlement
    if (room.currentTurnSeat == null) {
      settleFinalAgainstDealer(room);
    }

    room.updatedAt = Date.now();
    room.lastActiveAt = Date.now();

    await roomRef.set({
      ...room,
      ...touchRoomFields(),
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("end-turn error:", error);
    return NextResponse.json(
      { error: error.message || "internal" },
      { status: 500 }
    );
  }
}