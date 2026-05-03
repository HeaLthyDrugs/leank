import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'How It Works — Leank P2P Technology Explained',
  description: 'Learn how Leank uses WebRTC peer-to-peer technology to deliver secure, serverless video calls, chat, and file sharing directly in your browser.',
  openGraph: {
    title: 'How It Works — Leank P2P Technology Explained',
    description: 'Learn how Leank uses WebRTC peer-to-peer technology to deliver secure, serverless video calls, chat, and file sharing directly in your browser.',
    url: 'https://leank.space/how-it-works',
    type: 'website',
  },
  alternates: { canonical: 'https://leank.space/how-it-works' },
}

const steps = [
  { number: '01', title: 'Create a Room', description: 'Click "Start Room" — a cryptographically random room ID is generated instantly. No account needed.', detail: 'Room IDs are generated client-side using secure random functions.' },
  { number: '02', title: 'Share the Link', description: 'Copy the room link or scan the QR code. Send it via any channel you prefer.', detail: 'The link contains only the room ID — shareable via text, email, or QR.' },
  { number: '03', title: 'Peer Discovery', description: 'Both browsers find each other using torrent-based signaling — no centralized server.', detail: 'Trystero leverages public BitTorrent trackers for peer discovery.' },
  { number: '04', title: 'Direct Connection', description: 'A WebRTC connection is established directly between browsers. STUN helps with NAT traversal only.', detail: 'STUN servers never see or relay your actual data.' },
  { number: '05', title: 'Communicate', description: 'Video, audio, chat, and files flow directly peer-to-peer with DTLS encryption.', detail: 'WebRTC provides built-in encryption for all channels.' },
  { number: '06', title: 'Session Ends', description: 'When everyone leaves, connections close and the room ceases to exist. No data retained.', detail: 'No database, no logs, no archive — everything disappears.' },
]

const techStack = [
  { name: 'WebRTC', role: 'P2P media and data channels' },
  { name: 'Trystero', role: 'Torrent-based peer signaling' },
  { name: 'simple-peer', role: 'WebRTC connection wrapper' },
  { name: 'DTLS/SRTP', role: 'Encryption for data and media' },
  { name: 'STUN', role: 'NAT traversal' },
  { name: 'Next.js', role: 'Application framework' },
]

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white pb-20">
      <div className="max-w-4xl mx-auto px-6 pt-16">
        <nav aria-label="Breadcrumb" className="mb-8 text-xs font-bold uppercase tracking-widest text-black/40">
          <Link href="/" className="hover:text-black transition-colors">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-black">How It Works</span>
        </nav>

        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-6">How It Works</h1>
        <p className="text-lg md:text-xl font-medium text-black/70 leading-relaxed mb-12 max-w-2xl">
          Leank uses WebRTC and peer-to-peer technology to connect you directly — no middleman servers, no data collection.
        </p>

        <div className="border-2 border-black p-8 md:p-12 mb-12 bg-black/5">
          <h2 className="text-2xl font-black uppercase tracking-tight mb-4">The P2P Architecture</h2>
          <p className="text-base md:text-lg font-medium text-black/80 leading-relaxed mb-4">
            Traditional tools route everything through centralized servers where data can be stored or analyzed.
          </p>
          <p className="text-base md:text-lg font-medium text-black/80 leading-relaxed">
            Leank eliminates the middleman. Your browser connects directly to your peer&apos;s browser via WebRTC.
          </p>
        </div>

        <h2 className="text-2xl font-black uppercase tracking-tight mb-8">Step by Step</h2>
        <div className="border-2 border-black mb-12">
          {steps.map((step, i) => (
            <div key={step.number} className={`p-8 ${i < steps.length - 1 ? 'border-b-2 border-black' : ''}`}>
              <div className="flex flex-col md:flex-row md:items-start gap-6">
                <div className="w-16 h-16 border-2 border-black flex items-center justify-center flex-shrink-0 bg-black text-white font-black text-xl">{step.number}</div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight mb-2">{step.title}</h3>
                  <p className="text-base font-medium text-black/80 leading-relaxed mb-1">{step.description}</p>
                  <p className="text-sm font-medium text-black/50">{step.detail}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <h2 className="text-2xl font-black uppercase tracking-tight mb-6">Technology Stack</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-2 border-black mb-12">
          {techStack.map((tech, i) => (
            <div key={tech.name} className={`p-6 ${i % 2 === 0 ? 'md:border-r-2 border-black' : ''} ${i < techStack.length - 2 ? 'border-b-2 border-black' : i < techStack.length - 1 ? 'border-b-2 md:border-b-0 border-black' : ''}`}>
              <h3 className="text-lg font-black uppercase tracking-tight mb-1">{tech.name}</h3>
              <p className="text-sm font-medium text-black/60">{tech.role}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <Link href="/" className="inline-flex items-center gap-3 px-8 py-4 border-2 border-black bg-black text-white font-black uppercase tracking-wider text-sm hover:bg-white hover:text-black transition-colors group">
            Try It Now <ArrowRight size={18} className="transform group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/faq" className="inline-flex items-center gap-3 px-8 py-4 border-2 border-black bg-white text-black font-black uppercase tracking-wider text-sm hover:bg-black/5 transition-colors group">
            Read FAQ <ArrowRight size={18} className="transform group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  )
}
