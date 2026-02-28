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
  metadataBase: new URL("https://leank.vercel.app"),
  title: "Leank — Instant Chat & File Sharing",
  description:
    "Connect instantly with friends or colleagues. Enjoy fast, secure chat and file sharing directly in your browser without any signups or downloads.",
  keywords: [
    "instant chat",
    "share files online",
    "no signup chat",
    "browser chat",
    "secure messaging",
    "temporary chat room",
    "fast file transfer",
    "private communication",
    "real-time chat",
    "anonymous chat"
  ],
  openGraph: {
    title: "Leank — Instant Chat & File Sharing",
    description: "Start a free chat room and share files with just one click. No login required, entirely in your browser.",
    url: "https://leank.vercel.app",
    siteName: "Leank",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Leank — Instant Secure Chat",
    description: "Chat and share files with anyone instantly. No login, no downloads.",
  },
  manifest: "/favicons/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicons/favicon.ico", sizes: "any" },
      { url: "/favicons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/favicons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Leank",
  },
  other: {
    "msapplication-TileColor": "#000000",
  },
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

