'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ensureAnonymousAuth } from "@/lib/auth";
import { joinRoomApi } from "@/lib/api";

export default function JoinPage() {
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleJoin() {
    if (!name.trim()) return alert("Please enter your name.");
    if (!roomCode.trim()) return alert("Please enter room code.");

    try {
      setLoading(true);
      await ensureAnonymousAuth(name.trim());
      await joinRoomApi({ roomCode: roomCode.trim(), name: name.trim() });
      router.push(`/room/${roomCode.trim()}`);
    } catch (error: any) {
      alert(error.message || "Failed to join room.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-lg rounded-[32px] border border-white/10 bg-black/30 p-6 md:p-8 backdrop-blur-sm">
        <div className="gold-text text-3xl md:text-4xl font-black">Join Table</div>
        <p className="text-white/70 mt-3">
          Enter the 6-digit room code and pick any empty seat from 1 to 11.
        </p>

        <input
          className="w-full mt-8 rounded-2xl bg-white text-black px-4 py-3.5 text-lg"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="w-full mt-4 rounded-2xl bg-white text-black px-4 py-3.5 text-lg"
          placeholder="6-digit room code"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
        />

        <button
          onClick={handleJoin}
          disabled={loading}
          className="w-full mt-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 font-black text-lg"
        >
          {loading ? "Joining..." : "Join Room"}
        </button>
      </div>
    </main>
  );
}