import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { RoomProvider } from "@/contexts/RoomContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Leank — Peer-to-Peer Calls, Chat & File Sharing",
  description:
    "Leank is a lightweight, browser-based communication tool for instant peer-to-peer video calls, voice chat, file sharing, and screen sharing — no login, no storage, no backend.",
  keywords: [
    "P2P video call",
    "WebRTC",
    "voice chat app",
    "screen sharing tool",
    "peer-to-peer file transfer",
    "Next.js WebRTC",
    "real-time collaboration",
    "no signup chat",
    "frontend-only SaaS",
    "privacy-first communication"
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <RoomProvider>
          {children}
        </RoomProvider>
      </body>
    </html>
  );
}

