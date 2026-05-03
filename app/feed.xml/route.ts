export async function GET() {
  const baseUrl = 'https://leank.space'
  const now = new Date().toUTCString()

  const items = [
    {
      title: 'Leank — Instant Secure Chat & File Sharing Rooms',
      link: baseUrl,
      description: 'Create secure real-time rooms for chat, video calls, YouTube watch sessions, and fast file sharing in your browser — no signups, no downloads.',
      pubDate: now,
    },
    {
      title: 'About Leank — The P2P Communication Platform',
      link: `${baseUrl}/about`,
      description: 'Learn about Leank\'s mission to make private, instant P2P communication accessible to everyone through the browser.',
      pubDate: now,
    },
    {
      title: 'Features — Video Calls, Chat, File Sharing & More',
      link: `${baseUrl}/features`,
      description: 'Explore all Leank features: peer-to-peer video calls, voice chat, instant messaging, large file transfer, and shared YouTube workspace.',
      pubDate: now,
    },
    {
      title: 'How It Works — Peer-to-Peer Technology Explained',
      link: `${baseUrl}/how-it-works`,
      description: 'Understand how Leank uses WebRTC and peer-to-peer technology to deliver secure, serverless communication directly in your browser.',
      pubDate: now,
    },
    {
      title: 'Frequently Asked Questions',
      link: `${baseUrl}/faq`,
      description: "Get answers to common questions about Leank's P2P chat, video calls, file sharing, and privacy features.",
      pubDate: now,
    },
  ]

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Leank — Instant Secure P2P Communication</title>
    <link>${baseUrl}</link>
    <description>Leank is a browser-based P2P platform for instant video calls, chat, file sharing, and shared YouTube sessions — no signup required.</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${items.map(item => `
    <item>
      <title>${item.title}</title>
      <link>${item.link}</link>
      <description>${item.description}</description>
      <pubDate>${item.pubDate}</pubDate>
      <guid>${item.link}</guid>
    </item>`).join('')}
  </channel>
</rss>`

  return new Response(rss.trim(), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
