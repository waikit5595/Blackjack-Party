export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/admin";
import { requireUid } from "@/server/auth";
export async function POST(request: NextRequest) {
  try {
    const uid = await requireUid(request);
    const { roomCode, name } = await request.json();
    if (!roomCode?.trim() || !name?.trim()) return NextResponse.json({ error: "Room code and name are required." }, { status: 400 });
    const roomRef = adminDb.ref(`rooms/${roomCode.trim()}`);
    const snap = await roomRef.get();
    if (!snap.exists()) return NextResponse.json({ error: "Room not found." }, { status: 404 });
    const room = snap.val();
    if (room.status !== "waiting") return NextResponse.json({ error: "Game already started." }, { status: 400 });
    if (room.players && Object.keys(room.players).length >= 12) return NextResponse.json({ error: "Room is full." }, { status: 400 });
    const existing = room.players?.[uid];
    const joinedAt = existing?.joinedAt || Date.now();
    const player = { uid, name: name.trim(), seat: existing?.seat ?? null, isHost: false, isDealer: false, joinedAt };
    await adminDb.ref(`users/${uid}`).set({ displayName: name.trim(), lastSeenAt: Date.now() });
    await roomRef.child(`players/${uid}`).set(player);
    return NextResponse.json({ ok: true });
  } catch (error:any) {
    return NextResponse.json({ error: error.message || "internal" }, { status: 500 });
  }
}
