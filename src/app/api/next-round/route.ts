export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/admin";
import { requireUid } from "@/server/auth";
import {
  assertRoomNotStale,
  cleanupExpiredRooms,
  resetRoundVisualWallets,
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
      return NextResponse.json(
        { error: "Only host can start next round." },
        { status: 403 }
      );
    }

    if (room.status !== "revealed") {
      return NextResponse.json(
        { error: "Round is not finished yet." },
        { status: 400 }
      );
    }

    const roundBets = room.roundBets || {};
    const unlockedBets: Record<string, any> = {};

    for (const key of Object.keys(roundBets)) {
      unlockedBets[key] = {
        ...roundBets[key],
        locked: false,
        settled: false,
      };
    }

    resetRoundVisualWallets(room);

    await roomRef.update({
      status: "betting",
      revealAll: false,
      currentTurnSeat: null,
      turnOrder: [],
      deck: [],
      hands: {},
      roundBets: unlockedBets,
      wallets: room.wallets || {},
      ...touchRoomFields(),
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("next-round error:", error);
    return NextResponse.json(
      { error: error.message || "internal" },
      { status: 500 }
    );
  }
}