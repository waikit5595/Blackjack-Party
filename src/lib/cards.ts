import { Card } from "./types";
const suitMap: Record<string, string> = { spades: "♠", hearts: "♥", clubs: "♣", diamonds: "♦" };
export function cardLabel(card: Card) { return `${card.rank}${suitMap[card.suit] || ""}`; }
