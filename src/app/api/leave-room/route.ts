export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/admin";
import { requireUid } from "@/server/auth";
import { touchRoomFields, cleanupExpiredRooms } from "@/server/game";

export async function POST(request: NextRequest) {
  try {
    await cleanupExpiredRooms();

    const uid = await requireUid(request);
    const { roomCode } = await request.json();

    if (!roomCode) {
      return NextResponse.json({ error: "Room code required." }, { status: 400 });
    }

    const roomRef = adminDb.ref(`rooms/${roomCode}`);
    const snap = await roomRef.get();

    if (!snap.exists()) {
      return NextResponse.json({ ok: true });
    }

    const room = snap.val();
    const player = room.players?.[uid];

    if (!player) {
      return NextResponse.json({ ok: true });
    }

    if (room.hostUid === uid) {
      await adminDb.ref(`rooms/${roomCode}`).remove();
      await adminDb.ref(`presence/${roomCode}`).remove().catch(() => undefined);
      return NextResponse.json({ ok: true });
    }

    const updates: Record<string, any> = {
      [`players/${uid}`]: null,
      [`hands/${uid}`]: null,
      ...touchRoomFields(),
    };

    if (player.seat != null) {
      updates[`seats/${player.seat}`] = null;
    }

    await roomRef.update(updates);
    await adminDb.ref(`presence/${roomCode}/${uid}`).remove().catch(() => undefined);

    const roomAfterSnap = await roomRef.get();
    if (roomAfterSnap.exists()) {
      const roomAfter = roomAfterSnap.val();
      const playersLeft = roomAfter.players ? Object.keys(roomAfter.players).length : 0;
      if (playersLeft <= 0) {
        await roomRef.remove();
        await adminDb.ref(`presence/${roomCode}`).remove().catch(() => undefined);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("leave-room error:", error);
    return NextResponse.json(
      { error: error.message || "internal" },
      { status: 500 }
    );
  }
}