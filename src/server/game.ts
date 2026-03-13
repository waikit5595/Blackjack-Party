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
  await cleanupExpiredRooms();

  for (let i = 0; i < 30; i++) {
    const code = generateRoomCode();
    const snap = await adminDb.ref(`rooms/${code}`).get();
    if (!snap.exists()) return code;
  }

  throw new Error("Unable to generate unique room code.");
}

/* =========================
   Settlement helpers
========================= */

function rankToPairScore(rank: Rank): number {
  if (rank === "A") return 100;
  if (rank === "K") return 13;
  if (rank === "Q") return 12;
  if (rank === "J") return 11;
  return Number(rank);
}

export function getInitialSpecialType(hand: any): "aa" | "blackjack" | "pair" | null {
  const cards = hand?.cards || [];
  if (cards.length !== 2) return null;

  if (cards[0].rank === "A" && cards[1].rank === "A") return "aa";
  if (isBlackjack(cards)) return "blackjack";
  if (isHighPairLock(cards)) return "pair";
  return null;
}

function specialStrength(hand: any): number {
  const type = getInitialSpecialType(hand);
  if (type === "aa") return 300;
  if (type === "blackjack") return 200;
  if (type === "pair") return 100 + rankToPairScore(hand.cards[0].rank);
  return 0;
}

function isFiveCardNonBust(hand: any): boolean {
  return !!hand && (hand.cards?.length || 0) >= 5 && !hand.busted;
}

function positivePayoutMultiplier(hand: any): number {
  const type = getInitialSpecialType(hand);

  if (type === "aa") return 3;
  if (type === "blackjack") return 2;
  if (type === "pair") return 2;

  if ((hand?.cards?.length || 0) >= 5) {
    if (hand.score === 21 && !hand.busted) return 3;
    if (hand.busted) return -2;
    return 2;
  }

  if (hand?.status === "21") return 2;
  return 1;
}

export function ensureWallet(room: any, uid: string) {
  room.wallets = room.wallets || {};
  if (!room.wallets[uid]) {
    room.wallets[uid] = {
      totalProfit: 0,
      lastDelta: 0,
      lastSettleLabel: "",
    };
  }
}

export function getDealerUid(room: any): string {
  const dealer = Object.values(room.players || {}).find((p: any) => p.isDealer) as any;
  if (!dealer) throw new Error("Dealer not found.");
  return dealer.uid;
}

export function applySettlement(
  room: any,
  playerUid: string,
  delta: number,
  label: string,
  result: "win" | "lose" | "draw",
  opts?: { reveal?: boolean }
) {
  const dealerUid = getDealerUid(room);
  ensureWallet(room, playerUid);
  ensureWallet(room, dealerUid);

  room.wallets[playerUid].totalProfit += delta;
  room.wallets[playerUid].lastDelta = delta;
  room.wallets[playerUid].lastSettleLabel = label;

  room.wallets[dealerUid].totalProfit -= delta;
  room.wallets[dealerUid].lastDelta = -delta;
  room.wallets[dealerUid].lastSettleLabel = label;

  room.roundBets = room.roundBets || {};
  if (room.roundBets[playerUid]) {
    room.roundBets[playerUid].settled = true;
    room.roundBets[playerUid].locked = true;
  }

  room.hands = room.hands || {};
  if (room.hands[playerUid]) {
    room.hands[playerUid] = {
      ...room.hands[playerUid],
      result,
      publicRevealed: opts?.reveal ?? true,
      stood: true,
      locked: true,
    };
  }
}

export function settleImmediateInitials(room: any) {
  const dealerUid = getDealerUid(room);
  const dealerHand = room.hands?.[dealerUid];
  const dealerSpecial = getInitialSpecialType(dealerHand);

  const ordered = getPlayersInSeatOrder(room.players || {});

  for (const p of ordered) {
    if (p.uid === dealerUid) continue;

    const playerHand = room.hands?.[p.uid];
    const playerSpecial = getInitialSpecialType(playerHand);
    const bet = Number(room.roundBets?.[p.uid]?.amount || 0);

    if (!bet) continue;
    if (!playerSpecial && !dealerSpecial) continue;

    if (playerSpecial && !dealerSpecial) {
      const multiplier = positivePayoutMultiplier(playerHand);
      applySettlement(
        room,
        p.uid,
        bet * multiplier,
        multiplier === 3 ? "TRIPLE" : "DOUBLE",
        "win",
        { reveal: true }
      );
      continue;
    }

    if (!playerSpecial && dealerSpecial) {
      const dealerType = getInitialSpecialType(dealerHand);
      const loseLabel = dealerType === "aa" ? "TRIPLE" : "DOUBLE";
      const loseDelta = dealerType === "aa" ? -(bet * 3) : -(bet * 2);
      applySettlement(room, p.uid, loseDelta, loseLabel, "lose", { reveal: true });
      continue;
    }

    const playerStr = specialStrength(playerHand);
    const dealerStr = specialStrength(dealerHand);

    if (playerStr > dealerStr) {
      const multiplier = positivePayoutMultiplier(playerHand);
      applySettlement(
        room,
        p.uid,
        bet * multiplier,
        multiplier === 3 ? "TRIPLE" : "DOUBLE",
        "win",
        { reveal: true }
      );
    } else if (playerStr < dealerStr) {
      const dealerType = getInitialSpecialType(dealerHand);
      const loseLabel = dealerType === "aa" ? "TRIPLE" : "DOUBLE";
      const loseDelta = dealerType === "aa" ? -(bet * 3) : -(bet * 2);
      applySettlement(room, p.uid, loseDelta, loseLabel, "lose", { reveal: true });
    } else {
      applySettlement(room, p.uid, 0, "TIE", "draw", { reveal: true });
    }
  }
}

export function settleFiveCard(room: any, playerUid: string) {
  const hand = room.hands?.[playerUid];
  const bet = Number(room.roundBets?.[playerUid]?.amount || 0);
  if (!hand || !bet) return;
  if ((hand.cards?.length || 0) < 5) return;
  if (room.roundBets?.[playerUid]?.settled) return;

  if (hand.busted) {
    applySettlement(room, playerUid, -(bet * 2), "DOUBLE", "lose", { reveal: true });
    return;
  }

  if (hand.score === 21) {
    applySettlement(room, playerUid, bet * 3, "TRIPLE", "win", { reveal: true });
    return;
  }

  applySettlement(room, playerUid, bet * 2, "DOUBLE", "win", { reveal: true });
}

function compareNormalHands(player: any, dealer: any): "win" | "lose" | "draw" {
  if (player.busted && dealer.busted) return "draw";
  if (player.busted) return "lose";
  if (dealer.busted && !player.busted) return "win";
  if (player.score > dealer.score) return "win";
  if (player.score < dealer.score) return "lose";
  return "draw";
}

export function settleFinalAgainstDealer(room: any) {
  const dealerUid = getDealerUid(room);
  const dealerHand = room.hands?.[dealerUid];
  const ordered = getPlayersInSeatOrder(room.players || {});

  const dealerInitialSpecial = getInitialSpecialType(dealerHand);
  const dealerHasFiveCard = isFiveCardNonBust(dealerHand);

  for (const p of ordered) {
    if (p.uid === dealerUid) continue;

    const bet = Number(room.roundBets?.[p.uid]?.amount || 0);
    if (!bet) continue;
    if (room.roundBets?.[p.uid]?.settled) continue;

    const hand = room.hands?.[p.uid];
    if (!hand) continue;

    const playerInitialSpecial = getInitialSpecialType(hand);
    const playerHasFiveCard = isFiveCardNonBust(hand);

    // 起手特殊牌型通常已经即时结算，这里只是防守补位
    if (playerInitialSpecial || dealerInitialSpecial) {
      const playerStr = specialStrength(hand);
      const dealerStr = specialStrength(dealerHand);

      if (playerStr > dealerStr) {
        const multiplier = positivePayoutMultiplier(hand);
        applySettlement(
          room,
          p.uid,
          bet * multiplier,
          multiplier === 3 ? "TRIPLE" : "DOUBLE",
          "win",
          { reveal: true }
        );
      } else if (playerStr < dealerStr) {
        const dealerType = getInitialSpecialType(dealerHand);
        const loseLabel = dealerType === "aa" ? "TRIPLE" : "DOUBLE";
        const loseDelta = dealerType === "aa" ? -(bet * 3) : -(bet * 2);
        applySettlement(room, p.uid, loseDelta, loseLabel, "lose", { reveal: true });
      } else {
        applySettlement(room, p.uid, 0, "TIE", "draw", { reveal: true });
      }
      continue;
    }

    // ✅ 五张没爆 > 所有普通牌型
    if (dealerHasFiveCard && !playerHasFiveCard) {
      applySettlement(room, p.uid, -bet, "LOSE", "lose", { reveal: true });
      continue;
    }

    if (playerHasFiveCard && !dealerHasFiveCard) {
      // 这里理论上早就即时结算过，防守补位
      const multiplier = hand.score === 21 ? 3 : 2;
      applySettlement(
        room,
        p.uid,
        bet * multiplier,
        multiplier === 3 ? "TRIPLE" : "DOUBLE",
        "win",
        { reveal: true }
      );
      continue;
    }

    // 庄家补牌后得到 21 = 双倍赢
    if (dealerHand?.status === "21") {
      if (hand.status === "21") {
        applySettlement(room, p.uid, 0, "TIE", "draw", { reveal: true });
      } else if (hand.busted) {
        applySettlement(room, p.uid, -(bet * 2), "DOUBLE", "lose", { reveal: true });
      } else {
        applySettlement(room, p.uid, -(bet * 2), "DOUBLE", "lose", { reveal: true });
      }
      continue;
    }

    // 玩家补牌后 21 = 双倍赢
    if (hand.status === "21") {
      if (dealerHand?.status === "21") {
        applySettlement(room, p.uid, 0, "TIE", "draw", { reveal: true });
      } else {
        applySettlement(room, p.uid, bet * 2, "DOUBLE", "win", { reveal: true });
      }
      continue;
    }

    // 庄家爆点
    if (dealerHand?.busted) {
      if (hand.busted) {
        applySettlement(room, p.uid, 0, "TIE", "draw", { reveal: true });
      } else {
        applySettlement(room, p.uid, bet, "WIN", "win", { reveal: true });
      }
      continue;
    }

    // 普通比牌
    const result = compareNormalHands(hand, dealerHand);

    if (result === "win") {
      applySettlement(room, p.uid, bet, "WIN", "win", { reveal: true });
    } else if (result === "lose") {
      applySettlement(room, p.uid, -bet, "LOSE", "lose", { reveal: true });
    } else {
      applySettlement(room, p.uid, 0, "TIE", "draw", { reveal: true });
    }
  }

  room.status = "revealed";
  room.revealAll = true;
  room.currentTurnSeat = null;
  room.updatedAt = Date.now();
  room.lastActiveAt = Date.now();
}

export function resetRoundVisualWallets(room: any) {
  room.wallets = room.wallets || {};
  for (const uid of Object.keys(room.wallets)) {
    room.wallets[uid] = {
      ...room.wallets[uid],
      lastDelta: 0,
      lastSettleLabel: "",
    };
  }
}