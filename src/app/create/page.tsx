'use client';
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ensureAnonymousAuth } from "@/lib/auth";
import { createRoomApi } from "@/lib/api";
export default function CreatePage() {
  const [name, setName] = useState(""); const [loading, setLoading] = useState(false); const router = useRouter();
  async function handleCreate() {
    if (!name.trim()) return alert("Please enter your name.");
    try { setLoading(true); await ensureAnonymousAuth(name.trim()); const res = await createRoomApi({ name: name.trim() }); router.push(`/room/${res.roomCode}`); }
    catch (error:any) { alert(error.message || "Failed to create room."); }
    finally { setLoading(false); }
  }
  return <main className="min-h-screen flex items-center justify-center p-6"><div className="w-full max-w-md rounded-2xl border border-white/20 bg-black/20 p-6">
    <h1 className="text-2xl font-bold">Create Room</h1><p className="text-white/70 mt-2">You will become the dealer in seat 12.</p>
    <input className="w-full mt-6 rounded-xl bg-white text-black px-4 py-3" placeholder="Your name" value={name} onChange={(e)=>setName(e.target.value)} />
    <button onClick={handleCreate} disabled={loading} className="w-full mt-4 rounded-xl bg-yellow-500 text-black py-3 font-semibold">{loading ? "Creating..." : "Confirm Create"}</button>
  </div></main>;
}
