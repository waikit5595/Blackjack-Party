export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/admin";
import { requireUid } from "@/server/auth";
import { cleanupExpiredRooms, touchRoomFields } from "@/server/game";

export async function POST(request: NextRequest) {
  try {
    await cleanupExpiredRooms();

    const uid = await requireUid(request);
    const { roomCode, amount } = await request.json();

    if (!roomCode) {
      return NextResponse.json({ error: "Room code required." }, { status: 400 });
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid bet." }, { status: 400 });
    }

    const roomRef = adminDb.ref(`rooms/${roomCode}`);
    const snap = await roomRef.get();

    if (!snap.exists()) {
      return NextResponse.json({ error: "Room not found." }, { status: 404 });
    }

    const room = snap.val();

    if (!room.players?.[uid]) {
      return NextResponse.json({ error: "You are not in this room." }, { status: 403 });
    }

    if (room.players?.[uid]?.isDealer) {
      return NextResponse.json({ error: "Dealer does not place bet." }, { status: 400 });
    }

    if (room.status !== "betting") {
      return NextResponse.json({ error: "Betting phase already finished." }, { status: 400 });
    }

    const currentBet = room.roundBets?.[uid];
    if (currentBet?.locked) {
      return NextResponse.json({ error: "Bet is already locked." }, { status: 400 });
    }

    const updates: Record<string, any> = {
      [`roundBets/${uid}`]: {
        amount: Number(amount),
        locked: false,
        settled: false,
      },
      ...touchRoomFields(),
    };

    if (!room.wallets?.[uid]) {
      updates[`wallets/${uid}`] = {
        totalProfit: 0,
        lastDelta: 0,
        lastSettleLabel: "",
      };
    }

    await roomRef.update(updates);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("place-bet error:", error);
    return NextResponse.json(
      { error: error.message || "internal" },
      { status: 500 }
    );
  }
}