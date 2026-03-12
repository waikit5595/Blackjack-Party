import Link from "next/link";
import TableHero from "@/components/TableHero";

export default function HomePage() {
  return (
    <main className="min-h-screen px-6 py-12 md:py-20">
      <TableHero
        title="BLACKJACK PARTY"
        subtitle="2–12 Players • Dealer Fixed at Seat 12 • Real-time Multiplayer Room"
      />

      <div className="max-w-5xl mx-auto mt-12">
        <div className="table-surface shadow-[0_30px_80px_rgba(0,0,0,0.45)] rounded-[40px] border border-emerald-400/15 p-8 md:p-12 relative overflow-hidden">
          <div className="absolute inset-0 opacity-30 pointer-events-none">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[65%] rounded-[999px] border border-yellow-400/20" />
          </div>

          <div className="relative grid md:grid-cols-2 gap-5">
            <Link
              href="/create"
              className="rounded-3xl border border-yellow-400/25 bg-black/20 hover:bg-black/30 px-8 py-10"
            >
              <div className="text-3xl font-bold gold-text">Create Room</div>
              <div className="mt-3 text-white/70">Create a table and become the dealer.</div>
            </Link>

            <Link
              href="/join"
              className="rounded-3xl border border-white/10 bg-black/20 hover:bg-black/30 px-8 py-10"
            >
              <div className="text-3xl font-bold">Join Room</div>
              <div className="mt-3 text-white/70">Enter a room code and choose your seat.</div>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
