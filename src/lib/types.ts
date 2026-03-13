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

export interface PlayerRoomState {
  uid: string;
  name: string;
  seat: number | null;
  isHost: boolean;
  isDealer: boolean;
  joinedAt: number;
}

export interface HandState {
  cards: Card[];
  score: number;
  locked: boolean;
  busted: boolean;
  stood: boolean;
  status: string;
  autoLockedReason?: string | null;
  result?: "win" | "lose" | "draw" | null;
  publicRevealed?: boolean;
}

export interface BetState {
  amount: number;
  locked: boolean;
  settled: boolean;
}

export interface WalletState {
  totalProfit: number;
  lastDelta: number;
  lastSettleLabel: string;
}

export interface RoomData {
  roomCode: string;
  hostUid: string;
  status: "betting" | "playing" | "revealed" | "closed";
  createdAt: number;
  updatedAt: number;
  lastActiveAt: number;
  dealerSeat: number;
  revealAll: boolean;
  currentRound: number;
  currentTurnSeat: number | null;
  turnOrder?: number[];
  players?: Record<string, PlayerRoomState>;
  seats?: Record<string, string | null>;
  hands?: Record<string, HandState>;
  roundBets?: Record<string, BetState>;
  wallets?: Record<string, WalletState>;
}

export interface PresenceMap {
  [uid: string]: {
    uid: string;
    online: boolean;
    ts: number;
  };
}