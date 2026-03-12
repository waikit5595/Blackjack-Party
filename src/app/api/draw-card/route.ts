export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/admin";
import { requireUid } from "@/server/auth";
import {
  applyResultsAndReveal,
  assertRoomNotStale,
  drawFromDeck,
  evaluateHand,
  nextTurnSeat,
  touchRoomFields,
} from "@/server/game";

export async function POST(request: NextRequest) {
  try {
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
    if (!hand || hand.locked || hand.stood) {
      return NextResponse.json({ error: "You cannot draw now." }, { status: 400 });
    }

    if ((hand.cards || []).length >= 5) {
      return NextResponse.json({ error: "Maximum 5 cards." }, { status: 400 });
    }

    const deck = room.deck || [];
    const newCard = drawFromDeck(deck);
    const newHand = evaluateHand([...(hand.cards || []), newCard]);

    // ✅ 新规则：
    // 抽到第 5 张牌时，不管有没有爆点，都直接公开这名玩家的手牌
    const shouldPublicReveal = (newHand.cards?.length || 0) >= 5;

    const finalHand = {
      ...newHand,
      publicRevealed: shouldPublicReveal ? true : !!newHand.publicRevealed,
    };

    const computedHands = {
      ...(room.hands || {}),
      [uid]: finalHand,
    };

    /**
     * ✅ 最终规则：
     * - 爆点不会自动 pass
     * - 21 点不会自动 pass
     * - 这两种情况都要自己按 Pass / Stand
     *
     * 所以只有以下情况才自动跳下一个人：
     * - blackjack
     * - high-pair
     * - five-card（但五张牌会直接公开）
     * 另外：
     * - bust 不自动跳
     * - 21 不自动跳
     */
    let nextSeat = room.currentTurnSeat;

    const shouldAutoMove =
      finalHand.locked &&
      finalHand.status !== "bust" &&
      finalHand.status !== "21";

    if (shouldAutoMove) {
      nextSeat = nextTurnSeat({
        players: room.players,
        hands: computedHands,
      });
    }

    const dealerAutoReveal =
      player.isDealer &&
      nextSeat == null &&
      (finalHand.status === "blackjack" ||
        finalHand.status === "five-card" ||
        finalHand.autoLockedReason === "high-pair");

    if (dealerAutoReveal) {
      const revealed = applyResultsAndReveal({
        players: room.players,
        hands: computedHands,
      });

      await roomRef.update({
        ...revealed,
        deck,
        ...touchRoomFields(),
      });

      return NextResponse.json({ ok: true });
    }

    await roomRef.update({
      deck,
      [`hands/${uid}`]: finalHand,
      currentTurnSeat: nextSeat,
      ...touchRoomFields(),
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("draw-card error:", error);
    return NextResponse.json(
      { error: error.message || "internal" },
      { status: 500 }
    );
  }
}