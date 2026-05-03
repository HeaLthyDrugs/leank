import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'FAQ — Frequently Asked Questions About Leank P2P Chat',
  description: 'Get answers to common questions about Leank: P2P video calls, chat, file sharing, privacy, security, mobile support, and more.',
  openGraph: {
    title: 'FAQ — Frequently Asked Questions About Leank P2P Chat',
    description: 'Get answers to common questions about Leank: P2P video calls, chat, file sharing, privacy, security, mobile support, and more.',
    url: 'https://leank.space/faq',
    type: 'website',
  },
  alternates: { canonical: 'https://leank.space/faq' },
}

const faqs = [
  { q: 'What is Leank?', a: 'Leank is a free, browser-based peer-to-peer communication platform. It lets you create instant rooms for video calls, voice chat, text messaging, file sharing, and synchronized YouTube watching — with no signups, no downloads, and no servers storing your data.' },
  { q: 'Is Leank really free?', a: 'Yes, completely free. There are no premium tiers, no ads, no data monetization, and no hidden costs. Leank will remain free.' },
  { q: 'Do I need to create an account?', a: 'No. Leank requires zero registration. Just create a room and start communicating instantly.' },
  { q: 'Is my communication encrypted?', a: 'Yes. WebRTC connections use DTLS encryption for data channels and SRTP for media streams by default. Your communication is encrypted in transit between peers.' },
  { q: 'Can Leank see my messages or files?', a: 'No. All data flows directly between peers via WebRTC. Leank has no servers that receive, store, or process your communication content.' },
  { q: 'What happens when everyone leaves a room?', a: 'The room ceases to exist. There is no persistent state, no chat history, no file archive. Everything disappears completely.' },
  { q: 'Does it work on mobile?', a: 'Yes. Leank works in any modern mobile browser including Chrome, Safari, and Firefox on both iOS and Android.' },
  { q: 'How many people can join a room?', a: 'WebRTC P2P mesh networking typically supports 4-6 simultaneous peers effectively, depending on network and device capabilities.' },
  { q: 'Are there file size limits?', a: 'No. Leank imposes no file size limits. Files are transferred directly between peers via WebRTC data channels. Transfer speed depends on your network connection.' },
  { q: 'Do I need to download anything?', a: 'No. Leank runs entirely in your web browser. No apps, plugins, or extensions required.' },
  { q: 'What is P2P (Peer-to-Peer)?', a: 'P2P means data is exchanged directly between users without passing through a central server. This provides better privacy, lower latency, and no single point of failure.' },
  { q: 'What browsers are supported?', a: 'Leank supports all modern browsers with WebRTC capability: Chrome, Firefox, Safari, Edge, Opera, and Brave on desktop and mobile.' },
  { q: 'How is Leank different from Zoom or Google Meet?', a: 'Unlike Zoom or Meet, Leank requires no account, no download, and no server-side processing. Your data never touches a company\'s servers — it flows directly between peers.' },
  { q: 'What is the YouTube workspace?', a: 'The YouTube workspace lets room participants watch YouTube videos together with synchronized playback. One person controls the video (play, pause, seek) and everyone sees the same thing in real time.' },
]

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white pb-20">
      <div className="max-w-4xl mx-auto px-6 pt-16">
        <nav aria-label="Breadcrumb" className="mb-8 text-xs font-bold uppercase tracking-widest text-black/40">
          <Link href="/" className="hover:text-black transition-colors">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-black">FAQ</span>
        </nav>

        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-6">Frequently Asked Questions</h1>
        <p className="text-lg md:text-xl font-medium text-black/70 leading-relaxed mb-12 max-w-2xl">
          Everything you need to know about Leank&apos;s P2P communication platform.
        </p>

        {/* FAQ Schema markup for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: faqs.map(faq => ({
                '@type': 'Question',
                name: faq.q,
                acceptedAnswer: { '@type': 'Answer', text: faq.a },
              })),
            }),
          }}
        />

        <div className="border-2 border-black mb-12">
          {faqs.map((faq, i) => (
            <div key={i} className={`p-8 ${i < faqs.length - 1 ? 'border-b-2 border-black' : ''}`}>
              <h2 className="text-lg font-black uppercase tracking-tight mb-3">{faq.q}</h2>
              <p className="text-base font-medium text-black/70 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>

        <div className="border-2 border-black p-8 md:p-12 bg-black/5">
          <h2 className="text-xl font-black uppercase tracking-tight mb-3">Still Have Questions?</h2>
          <p className="text-base font-medium text-black/70 mb-6">Reach out and we&apos;ll get back to you.</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/contact" className="inline-flex items-center gap-3 px-8 py-4 border-2 border-black bg-black text-white font-black uppercase tracking-wider text-sm hover:bg-white hover:text-black transition-colors group">
              Contact Us <ArrowRight size={18} className="transform group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/" className="inline-flex items-center gap-3 px-8 py-4 border-2 border-black bg-white text-black font-black uppercase tracking-wider text-sm hover:bg-black/5 transition-colors group">
              Start a Room <ArrowRight size={18} className="transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
