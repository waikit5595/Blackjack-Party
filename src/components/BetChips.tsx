'use client';

import { useState } from "react";

export default function BetChips({
  currentBet,
  onSelect,
  disabled = false,
}: {
  currentBet: number;
  onSelect: (amount: number) => void;
  disabled?: boolean;
}) {
  const chips = [
    { amount: 1, color: "bg-white text-black border-black/20" },
    { amount: 2, color: "bg-blue-600 text-white border-blue-300/40" },
    { amount: 5, color: "bg-red-600 text-white border-red-300/40" },
    { amount: 10, color: "bg-emerald-600 text-white border-emerald-300/40" },
  ];

  function handleCustom() {
    const val = prompt("Enter custom bet amount");
    if (!val) return;
    const amount = Number(val);
    if (!Number.isFinite(amount) || amount <= 0) {
      alert("Invalid bet amount.");
      return;
    }
    onSelect(amount);
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-3 flex-wrap">
        {chips.map((chip) => {
          const selected = currentBet === chip.amount;
          return (
            <button
              key={chip.amount}
              disabled={disabled}
              onClick={() => onSelect(chip.amount)}
              className={`w-16 h-16 rounded-full border-4 shadow-lg font-bold transition hover:scale-105 ${
                chip.color
              } ${selected ? "ring-4 ring-yellow-400 scale-105" : ""}`}
            >
              RM{chip.amount}
            </button>
          );
        })}

        <button
          disabled={disabled}
          onClick={handleCustom}
          className={`w-16 h-16 rounded-full border-4 shadow-lg font-bold transition hover:scale-105 bg-yellow-500 text-black border-yellow-200/40 ${
            ![1, 2, 5, 10].includes(currentBet) && currentBet > 0
              ? "ring-4 ring-yellow-400 scale-105"
              : ""
          }`}
        >
          {currentBet > 0 && ![1, 2, 5, 10].includes(currentBet)
            ? `RM${currentBet}`
            : "Custom"}
        </button>
      </div>

      <div className="text-sm text-white/75">
        Current Bet:{" "}
        <span className="font-semibold text-yellow-200">
          {currentBet > 0 ? `RM${currentBet}` : "Not set"}
        </span>
      </div>
    </div>
  );
}