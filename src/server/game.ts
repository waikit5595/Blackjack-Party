import { adminDb } from "@/lib/admin";

export type Suit = "spades" | "hearts" | "clubs" | "diamonds";
export type Rank =
  | "A"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K";

export interface Card {
  rank: Rank;
  suit: Suit;
}

export const ROOM_STALE_MS = 30 * 60 * 1000;

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function createDeck(): Card[] {
  const suits: Suit[] = ["spades", "hearts", "clubs", "diamonds"];
  const ranks: Rank[] = [
    "A",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K",
  ];
  const deck: Card[] = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ rank, suit });
    }
  }
  return shuffle(deck);
}

function getBaseValue(rank: Rank): number {
  if (rank === "J" || rank === "Q" || rank === "K") return 10;
  if (rank === "A") return 1;
  return Number(rank);
}

export function calculateScore(cards: Card[]): number {
  const cardCount = cards.length;
  let total = 0;
  let aceCount = 0;

  for (const card of cards) {
    if (card.rank === "A") {
      aceCount++;
      total += 1;
    } else {
      total += getBaseValue(card.rank);
    }
  }

  const aceBonus = cardCount === 2 ? 10 : cardCount === 3 ? 9 : 0;
  let possibleScores: number[] = [total];

  for (let i = 0; i < aceCount; i++) {
    const next: number[] = [];
    for (const score of possibleScores) {
      next.push(score);
      if (aceBonus > 0) next.push(score + aceBonus);
    }
    possibleScores = [...new Set(next)];
  }

  const valid = possibleScores.filter((x) => x <= 21).sort((a, b) => b - a);
  if (valid.length > 0) return valid[0];
  return Math.min(...possibleScores);
}

export function isBlackjack(cards: Card[]) {
  if (cards.length !== 2) return false;
  const ranks = cards.map((c) => c.rank);
  return ranks.includes("A") && ranks.some((r) => ["10", "J", "Q", "K"].includes(r));
}

export function isHighPairLock(cards: Card[]) {
  return (
    cards.length === 2 &&
    cards[0].rank === cards[1].rank &&
    ["8", "9", "10", "J", "Q", "K", "A"].includes(cards[0].rank)
  );
}

export function evaluateHand(cards: Card[]) {
  const score = calculateScore(cards);

  if (isBlackjack(cards)) {
    return {
      cards,
      score,
      locked: true,
      busted: false,
      stood: false,
      status: "blackjack",
      autoLockedReason: "blackjack",
      result: null,
      publicRevealed: false,
    };
  }

  if (isHighPairLock(cards)) {
    return {
      cards,
      score,
      locked: true,
      busted: false,
      stood: false,
      status: "locked",
      autoLockedReason: "high-pair",
      result: null,
      publicRevealed: false,
    };
  }

  if (score > 21) {
    return {
      cards,
      score,
      locked: true,
      busted: true,
      stood: false,
      status: "bust",
      autoLockedReason: "bust",
      result: null,
      publicRevealed: false,
    };
  }

  if (score === 21) {
    return {
      cards,
      score,
      locked: true,
      busted: false,
      stood: false,
      status: "21",
      autoLockedReason: "21",
      result: null,
      publicRevealed: false,
    };
  }

  if (cards.length >= 5) {
    return {
      cards,
      score,
      locked: true,
      busted: false,
      stood: false,
      status: "five-card",
      autoLockedReason: "five-card",
      result: null,
      publicRevealed: false,
    };
  }

  return {
    cards,
    score,
    locked: false,
    busted: false,
    stood: false,
    status: "playing",
    autoLockedReason: null,
    result: null,
    publicRevealed: false,
  };
}

export function buildEmptySeats() {
  const seats: Record<string, string | null> = {};
  for (let i = 1; i <= 12; i++) seats[String(i)] = null;
  return seats;
}

export function generateRoomCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function getPlayersInSeatOrder(players: Record<string, any>) {
  return Object.values(players)
    .filter((p: any) => p.seat !== null)
    .sort((a: any, b: any) => a.seat - b.seat);
}

export function drawFromDeck(deck: Card[]) {
  const card = deck.shift();
  if (!card) throw new Error("Deck is empty.");
  return card;
}

export function nextTurnSeat(room: any): number | null {
  const players = room.players || {};
  const hands = room.hands || {};
  const ordered = getPlayersInSeatOrder(players);

  for (const p of ordered) {
    const hand = hands[p.uid];
    if (!hand) continue;
    if (!hand.locked && !hand.stood) return p.seat;
  }

  return null;
}

export function compareToDealer(player: any, dealer: any): "win" | "lose" | "draw" {
  if (player.busted) return "lose";
  if (dealer.busted && !player.busted) return "win";
  if (player.score > 21) return "lose";
  if (dealer.score > 21) return "win";
  if (player.score > dealer.score) return "win";
  if (player.score < dealer.score) return "lose";
  return "draw";
}

export function applyResultsAndReveal(room: any) {
  const ordered = getPlayersInSeatOrder(room.players || {});
  const dealer = ordered.find((p: any) => p.isDealer);
  if (!dealer) throw new Error("Dealer not found.");

  const dealerHand = room.hands?.[dealer.uid];
  if (!dealerHand) throw new Error("Dealer hand not found.");

  const hands = { ...(room.hands || {}) };

  for (const p of ordered) {
    hands[p.uid] = {
      ...hands[p.uid],
      result: p.uid === dealer.uid ? "draw" : compareToDealer(hands[p.uid], dealerHand),
      publicRevealed: true,
    };
  }

  return {
    status: "revealed",
    revealAll: true,
    currentTurnSeat: null,
    hands,
    updatedAt: Date.now(),
    lastActiveAt: Date.now(),
  };
}

export function assertRoomNotStale(room: any) {
  const lastActiveAt = Number(room?.lastActiveAt || room?.updatedAt || room?.createdAt || 0);
  if (lastActiveAt && Date.now() - lastActiveAt > ROOM_STALE_MS) {
    throw new Error("This room has expired.");
  }
}

export function baseRoomTimestamps() {
  const now = Date.now();
  return {
    createdAt: now,
    updatedAt: now,
    lastActiveAt: now,
  };
}

export function touchRoomFields() {
  return {
    updatedAt: Date.now(),
    lastActiveAt: Date.now(),
  };
}

/**
 * ✅ 自动清理过期房间
 * 规则：超过 30 分钟没有活动就删掉 rooms/{roomCode} 和 presence/{roomCode}
 */
export async function cleanupExpiredRooms() {
  const roomsSnap = await adminDb.ref("rooms").get();
  if (!roomsSnap.exists()) return;

  const rooms = roomsSnap.val() || {};
  const now = Date.now();
  const updates: Record<string, null> = {};

  for (const [roomCode, room] of Object.entries<any>(rooms)) {
    const lastActiveAt = Number(
      room?.lastActiveAt || room?.updatedAt || room?.createdAt || 0
    );

    if (!lastActiveAt) continue;

    if (now - lastActiveAt > ROOM_STALE_MS) {
      updates[`rooms/${roomCode}`] = null;
      updates[`presence/${roomCode}`] = null;
    }
  }

  if (Object.keys(updates).length > 0) {
    await adminDb.ref().update(updates);
  }
}

export async function nextAvailableRoomCode(): Promise<string> {
  // ✅ 每次创建房间前，先自动清一遍过期房间
  await cleanupExpiredRooms();

  for (let i = 0; i < 30; i++) {
    const code = generateRoomCode();
    const snap = await adminDb.ref(`rooms/${code}`).get();
    if (!snap.exists()) return code;
  }

  throw new Error("Unable to generate unique room code.");
}