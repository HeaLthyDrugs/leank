import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = 'https://leank.space'
  const now = new Date().toISOString()

  const pages = [
    {
      title: 'Home',
      description: 'Instant secure peer-to-peer video calls, voice chat, file sharing, and shared YouTube sessions.',
      slug: '',
      date: now,
    },
    {
      title: 'About',
      description: 'Learn about Leank - a privacy-first P2P communication platform.',
      slug: 'about',
      date: '2026-04-26T00:00:00Z',
    },
    {
      title: 'Features',
      description: 'Explore all features: video calls, voice chat, screen sharing, file transfer, and shared YouTube workspace.',
      slug: 'features',
      date: '2026-04-26T00:00:00Z',
    },
    {
      title: 'How It Works',
      description: 'Understanding the peer-to-peer architecture and WebRTC technology behind Leank.',
      slug: 'how-it-works',
      date: '2026-04-26T00:00:00Z',
    },
    {
      title: 'FAQ',
      description: 'Frequently asked questions about Leank P2P communication platform.',
      slug: 'faq',
      date: '2026-04-26T00:00:00Z',
    },
    {
      title: 'Contact',
      description: 'Get in touch with the Leank team.',
      slug: 'contact',
      date: '2026-04-26T00:00:00Z',
    },
    {
      title: 'Privacy Policy',
      description: 'Leank privacy policy - no data collection, no backend storage.',
      slug: 'privacy',
      date: '2026-04-26T00:00:00Z',
    },
    {
      title: 'Terms of Service',
      description: 'Leank terms of service.',
      slug: 'terms',
      date: '2026-04-26T00:00:00Z',
    },
  ]

  const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Leank</title>
    <link>${baseUrl}</link>
    <description>Instant secure peer-to-peer communication platform for video calls, voice chat, file sharing, and shared YouTube sessions.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <pubDate>${new Date().toUTCString()}</pubDate>
    <ttl>1440</ttl>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${baseUrl}/logo/transparent-bg-leank-logo-black.png</url>
      <title>Leank</title>
      <link>${baseUrl}</link>
    </image>
    <category>Technology</category>
    <category>Communication</category>
    <category>Privacy</category>
    <managingEditor>contact@leank.space (Leank Team)</managingEditor>
    <webMaster>contact@leank.space (Leank Team)</webMaster>
    ${pages
      .map(
        (page) => `
    <item>
      <title>${page.title}${page.slug === '' ? ' - Leank' : ' | Leank'}</title>
      <link>${baseUrl}${page.slug ? `/${page.slug}` : ''}</link>
      <guid isPermaLink="true">${baseUrl}${page.slug ? `/${page.slug}` : ''}</guid>
      <description><![CDATA[${page.description}]]></description>
      <pubDate>${new Date(page.date).toUTCString()}</pubDate>
      <content:encoded><![CDATA[${page.description}]]></content:encoded>
    </item>`
      )
      .join('')}
  </channel>
</rss>`

  return new NextResponse(rss, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate',
    },
  })
}