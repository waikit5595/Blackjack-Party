export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/admin";
import { requireUid } from "@/server/auth";
import {
  assertRoomNotStale,
  cleanupExpiredRooms,
  touchRoomFields,
} from "@/server/game";

export async function POST(request: NextRequest) {
  try {
    await cleanupExpiredRooms();

    const uid = await requireUid(request);
    const { roomCode, name } = await request.json();

    if (!roomCode?.trim() || !name?.trim()) {
      return NextResponse.json(
        { error: "Room code and name are required." },
        { status: 400 }
      );
    }

    const roomRef = adminDb.ref(`rooms/${roomCode.trim()}`);
    const snap = await roomRef.get();

    if (!snap.exists()) {
      return NextResponse.json({ error: "Room not found." }, { status: 404 });
    }

    const room = snap.val();
    assertRoomNotStale(room);

    // ✅ 第一阶段统一改成 betting
    if (room.status !== "betting") {
      return NextResponse.json(
        { error: "You can only join during betting phase." },
        { status: 400 }
      );
    }

    if (room.players && Object.keys(room.players).length >= 12) {
      return NextResponse.json({ error: "Room is full." }, { status: 400 });
    }

    const existing = room.players?.[uid];

    const player = {
      uid,
      name: name.trim(),
      seat: existing?.seat ?? null,
      isHost: false,
      isDealer: false,
      joinedAt: existing?.joinedAt || Date.now(),
    };

    const updates: Record<string, any> = {
      [`players/${uid}`]: player,
      ...touchRoomFields(),
    };

    if (!room.wallets?.[uid]) {
      updates[`wallets/${uid}`] = {
        totalProfit: 0,
        lastDelta: 0,
        lastSettleLabel: "",
      };
    }

    await adminDb.ref(`users/${uid}`).set({
      displayName: name.trim(),
      lastSeenAt: Date.now(),
    });

    await roomRef.update(updates);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("join-room error:", error);
    return NextResponse.json(
      { error: error.message || "internal" },
      { status: 500 }
    );
  }
}