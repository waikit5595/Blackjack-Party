import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Blackjack Room Free", description: "Multiplayer Blackjack with Vercel API + Firebase RTDB" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
