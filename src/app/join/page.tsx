'use client';
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ensureAnonymousAuth } from "@/lib/auth";
import { joinRoomApi } from "@/lib/api";
export default function JoinPage() {
  const [name, setName] = useState(""); const [roomCode, setRoomCode] = useState(""); const [loading, setLoading] = useState(false); const router = useRouter();
  async function handleJoin() {
    if (!name.trim()) return alert("Please enter your name.");
    if (!roomCode.trim()) return alert("Please enter room code.");
    try { setLoading(true); await ensureAnonymousAuth(name.trim()); await joinRoomApi({ roomCode: roomCode.trim(), name: name.trim() }); router.push(`/room/${roomCode.trim()}`); }
    catch (error:any) { alert(error.message || "Failed to join room."); }
    finally { setLoading(false); }
  }
  return <main className="min-h-screen flex items-center justify-center p-6"><div className="w-full max-w-md rounded-2xl border border-white/20 bg-black/20 p-6">
    <h1 className="text-2xl font-bold">Join Room</h1>
    <input className="w-full mt-6 rounded-xl bg-white text-black px-4 py-3" placeholder="Your name" value={name} onChange={(e)=>setName(e.target.value)} />
    <input className="w-full mt-4 rounded-xl bg-white text-black px-4 py-3" placeholder="4-digit room code" value={roomCode} onChange={(e)=>setRoomCode(e.target.value)} />
    <button onClick={handleJoin} disabled={loading} className="w-full mt-4 rounded-xl bg-blue-500 text-white py-3 font-semibold">{loading ? "Joining..." : "Join Room"}</button>
  </div></main>;
}
