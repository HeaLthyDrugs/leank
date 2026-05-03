import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { RoomProvider } from "@/contexts/RoomContext";
import Script from "next/script";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://leank.space"),
  title: {
    default: "Leank — Instant Secure P2P Chat, Video Calls & File Sharing",
    template: "%s | Leank",
  },
  description:
    "Create secure real-time rooms for chat, video calls, YouTube watch sessions, and fast file sharing in your browser — no signups, no downloads, completely peer-to-peer.",
  keywords: [
    "P2P chat",
    "peer to peer communication",
    "instant video calls",
    "no signup chat",
    "browser video call",
    "secure messaging",
    "temporary chat room",
    "fast file transfer",
    "private communication",
    "WebRTC chat",
    "anonymous chat",
    "peer to peer file sharing",
    "free video calls",
    "no download video call",
    "encrypted chat",
    "share files online",
    "P2P video call",
    "browser chat room",
  ],
  openGraph: {
    title: "Leank — Instant Secure P2P Chat, Video Calls & File Sharing",
    description:
      "Create secure real-time rooms for chat, video calls, YouTube watch sessions, and fast file sharing in your browser — no signups, no downloads, completely peer-to-peer.",
    url: "https://leank.space",
    siteName: "Leank",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "https://assets.mnsh.online/work/leank-p2p-communication/home.png",
        width: 1200,
        height: 630,
        alt: "Leank — Instant P2P video calls, chat, and file sharing",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Leank — Instant Secure P2P Chat, Video Calls & File Sharing",
    description:
      "Create secure real-time rooms for chat, video calls, YouTube watch sessions, and fast file sharing — no signups, no downloads, completely P2P.",
    images: [
      "https://assets.mnsh.online/work/leank-p2p-communication/home.png",
    ],
  },
  alternates: {
    canonical: "https://leank.space",
    types: {
      "application/rss+xml": "https://leank.space/feed.xml",
    },
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
  category: "technology",
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
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-JX1C4Q4RES"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-JX1C4Q4RES');
          `}
        </Script>
        <Script id="structured-data" type="application/ld+json" strategy="beforeInteractive">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "WebApplication",
                "name": "Leank",
                "url": "https://leank.space",
                "description": "Free, browser-based peer-to-peer communication platform for instant video calls, chat, file sharing, and YouTube watch sessions.",
                "applicationCategory": "CommunicationApplication",
                "operatingSystem": "Any",
                "browserRequirements": "Requires a modern web browser with WebRTC support",
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "USD"
                },
                "featureList": [
                  "Peer-to-peer video calls",
                  "Real-time text chat",
                  "File sharing without size limits",
                  "Screen sharing",
                  "Synchronized YouTube workspace",
                  "QR code room sharing"
                ],
                "screenshot": "https://assets.mnsh.online/work/leank-p2p-communication/home.png"
              },
              {
                "@type": "Organization",
                "name": "Leank",
                "url": "https://leank.space",
                "logo": "https://leank.space/favicons/android-chrome-512x512.png",
                "sameAs": []
              },
              {
                "@type": "WebSite",
                "name": "Leank",
                "url": "https://leank.space",
                "potentialAction": {
                  "@type": "SearchAction",
                  "target": "https://leank.space/?room={search_term_string}",
                  "query-input": "required name=search_term_string"
                }
              }
            ]
          })}
        </Script>
      </head>
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
