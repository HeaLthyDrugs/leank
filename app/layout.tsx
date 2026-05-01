import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { RoomProvider } from "@/contexts/RoomContext";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://leank.online"),
  title: "Leank - Instant Secure Chat and File Sharing Rooms",
  description:
    "Create secure real-time rooms for chat, video calls, YouTube watch sessions, and fast file sharing in your browser with no signups or downloads required.",
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
    title: "Leank - Instant Secure Chat and File Sharing Rooms",
    description:
      "Create secure real-time rooms for chat, video calls, YouTube watch sessions, and fast file sharing in your browser with no signups or downloads required.",
    url: "https://leank.online",
    siteName: "Leank",
    type: "website",
    images: [
      {
        url: "https://assets.mnsh.online/work/leank-p2p-communication/home.png",
        width: 1200,
        height: 630,
        alt: "Leank home interface for secure chat, calls, and file sharing",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Leank - Instant Secure Chat and File Sharing Rooms",
    description:
      "Create secure real-time rooms for chat, video calls, YouTube watch sessions, and fast file sharing in your browser with no signups or downloads required.",
    images: [
      "https://assets.mnsh.online/work/leank-p2p-communication/home.png",
    ],
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
        className={`${geistMono.variable} font-mono antialiased`}
      >
        <RoomProvider>
          {children}
        </RoomProvider>
      </body>
    </html>
  );
}
