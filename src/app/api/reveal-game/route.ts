export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/admin";
import { requireUid } from "@/server/auth";
import { applyResultsAndReveal } from "@/server/game";

export async function POST(request: NextRequest) {
  try {
    const uid = await requireUid(request);
    const { roomCode } = await request.json();
    const roomRef = adminDb.ref(`rooms/${roomCode}`);
    const snap = await roomRef.get();
    if (!snap.exists()) return NextResponse.json({ error: "Room not found." }, { status: 404 });

    const room = snap.val();
    if (room.hostUid !== uid) return NextResponse.json({ error: "Only host can reveal." }, { status: 403 });
    if (room.status !== "playing") return NextResponse.json({ error: "Game must still be playing." }, { status: 400 });
    if (room.currentTurnSeat != null) return NextResponse.json({ error: "All turns must end first." }, { status: 400 });

    const revealed = applyResultsAndReveal(room);
    await roomRef.update(revealed);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "internal" }, { status: 500 });
  }
}
