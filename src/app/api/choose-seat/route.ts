export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/admin";
import { requireUid } from "@/server/auth";
export async function POST(request: NextRequest) {
  try {
    const uid = await requireUid(request);
    const { roomCode, seat } = await request.json();
    const seatNum = Number(seat);
    if (!roomCode?.trim()) return NextResponse.json({ error: "Room code is required." }, { status: 400 });
    if (!Number.isInteger(seatNum) || seatNum < 1 || seatNum > 11) return NextResponse.json({ error: "Seat must be 1-11." }, { status: 400 });
    const roomRef = adminDb.ref(`rooms/${roomCode.trim()}`);
    const snap = await roomRef.get();
    if (!snap.exists()) return NextResponse.json({ error: "Room not found." }, { status: 404 });
    const room = snap.val();
    if (room.status !== "waiting") return NextResponse.json({ error: "Cannot choose seat after start." }, { status: 400 });
    if (!room.players?.[uid]) return NextResponse.json({ error: "You are not in this room." }, { status: 403 });
    if (room.seats?.[String(seatNum)]) return NextResponse.json({ error: "Seat already taken." }, { status: 400 });
    const updates: Record<string, any> = {};
    const currentSeat = room.players[uid].seat;
    if (currentSeat && currentSeat !== 12) updates[`seats/${currentSeat}`] = null;
    updates[`seats/${seatNum}`] = uid;
    updates[`players/${uid}/seat`] = seatNum;
    await roomRef.update(updates);
    return NextResponse.json({ ok: true });
  } catch (error:any) {
    return NextResponse.json({ error: error.message || "internal" }, { status: 500 });
  }
}
