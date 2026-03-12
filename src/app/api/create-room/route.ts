export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/admin";
import { requireUid } from "@/server/auth";
import { buildEmptySeats, nextAvailableRoomCode } from "@/server/game";

export async function POST(request: NextRequest) {
  try {
    const uid = await requireUid(request);
    const { name } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    const roomCode = await nextAvailableRoomCode();
    const now = Date.now();

    const player = {
      uid,
      name: name.trim(),
      seat: 12,
      isHost: true,
      isDealer: true,
      joinedAt: now,
    };

    await Promise.race([
      adminDb.ref(`users/${uid}`).set({
        displayName: name.trim(),
        lastSeenAt: now,
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timed out writing user data.")), 8000)
      ),
    ]);

    await Promise.race([
      adminDb.ref(`rooms/${roomCode}`).set({
        roomCode,
        hostUid: uid,
        status: "waiting",
        createdAt: now,
        dealerSeat: 12,
        revealAll: false,
        currentRound: 0,
        currentTurnSeat: null,
        turnOrder: [],
        deck: [],
        seats: { ...buildEmptySeats(), "12": uid },
        players: { [uid]: player },
        hands: {},
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timed out writing room data.")), 8000)
      ),
    ]);

    return NextResponse.json({ roomCode });
  } catch (error: any) {
    console.error("create-room error:", error);
    return NextResponse.json(
      { error: error?.message || "internal" },
      { status: 500 }
    );
  }
}