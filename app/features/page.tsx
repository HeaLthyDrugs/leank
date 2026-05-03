import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Video, MessageSquare, FileUp, Monitor, Play, QrCode, Wifi, WifiOff } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Features — Leank P2P Video Calls, Chat, File Sharing & More',
  description: 'Explore Leank\'s full feature set: peer-to-peer video & voice calls, real-time chat, fast file sharing, screen sharing, synchronized YouTube workspace, and QR code room sharing.',
  openGraph: {
    title: 'Features — Leank P2P Video Calls, Chat, File Sharing & More',
    description: 'Explore Leank\'s full feature set: peer-to-peer video & voice calls, real-time chat, fast file sharing, screen sharing, synchronized YouTube workspace, and QR code room sharing.',
    url: 'https://leank.space/features',
    type: 'website',
  },
  alternates: {
    canonical: 'https://leank.space/features',
  },
}

const features = [
  {
    icon: Video,
    title: 'Video & Voice Calls',
    description: 'High-quality peer-to-peer video and voice calls powered by WebRTC. Toggle camera and microphone with one click. No downloads, no plugins.',
    highlights: ['HD Video Streaming', 'Adaptive Quality', 'One-Click Toggle'],
  },
  {
    icon: MessageSquare,
    title: 'Real-Time Chat',
    description: 'Instant messaging between all room participants. Messages exist only in your browser session — nothing is stored on any server, ever.',
    highlights: ['Zero Latency', 'No Message History', 'Multi-Peer Support'],
  },
  {
    icon: FileUp,
    title: 'Fast File Transfer',
    description: 'Share files of any size directly between peers using WebRTC data channels. Files never touch a server — they go straight from you to your peer.',
    highlights: ['No Size Limits', 'Direct Transfer', 'Any File Type'],
  },
  {
    icon: Monitor,
    title: 'Screen Sharing',
    description: 'Share your entire screen, a specific window, or a browser tab with all connected peers in real time. Perfect for collaboration and presentations.',
    highlights: ['Full Screen', 'Window Selection', 'Tab Sharing'],
  },
  {
    icon: Play,
    title: 'YouTube Workspace',
    description: 'Watch YouTube videos together with synchronized playback. Search, queue, and control videos from a shared workspace. One peer controls, everyone watches.',
    highlights: ['Synced Playback', 'Built-in Search', 'Controller System'],
  },
  {
    icon: QrCode,
    title: 'QR Code Sharing',
    description: 'Instantly generate a QR code for your room link. Point your phone camera at the screen and join in seconds — no typing required.',
    highlights: ['Instant Generation', 'Mobile-Friendly', 'One-Scan Join'],
  },
]

const comparisons = [
  { feature: 'Account Required', leank: 'No', others: 'Yes' },
  { feature: 'App Download', leank: 'No', others: 'Usually' },
  { feature: 'Data Stored on Servers', leank: 'Never', others: 'Always' },
  { feature: 'Free to Use', leank: 'Fully Free', others: 'Freemium' },
  { feature: 'File Size Limits', leank: 'None', others: '25MB–2GB' },
  { feature: 'P2P Architecture', leank: 'Yes', others: 'Rarely' },
  { feature: 'Ephemeral Rooms', leank: 'Yes', others: 'No' },
]

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white pb-20">
      <div className="max-w-4xl mx-auto px-6 pt-16">

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8 text-xs font-bold uppercase tracking-widest text-black/40">
          <Link href="/" className="hover:text-black transition-colors">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-black">Features</span>
        </nav>

        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-6">
          Features
        </h1>
        <p className="text-lg md:text-xl font-medium text-black/70 leading-relaxed mb-12 max-w-2xl">
          Everything you need for instant, private communication — built directly
          into your browser with zero compromises.
        </p>

        {/* Feature Cards */}
        <div className="space-y-0 border-2 border-black mb-16">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className={`p-8 md:p-10 ${i < features.length - 1 ? 'border-b-2 border-black' : ''} hover:bg-black/5 transition-colors`}
            >
              <div className="flex flex-col md:flex-row md:items-start gap-6">
                <div className="w-16 h-16 border-2 border-black flex items-center justify-center flex-shrink-0 bg-white">
                  <feature.icon size={28} strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-black uppercase tracking-tight mb-3">{feature.title}</h2>
                  <p className="text-base font-medium text-black/70 leading-relaxed mb-4">{feature.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {feature.highlights.map((h) => (
                      <span key={h} className="text-xs font-bold uppercase tracking-widest px-3 py-1.5 border-2 border-black/20 text-black/60">
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        <h2 className="text-2xl font-black uppercase tracking-tight mb-6">Leank vs. Traditional Tools</h2>
        <div className="border-2 border-black mb-12 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-2 border-black bg-black text-white">
                <th className="p-4 font-black uppercase tracking-wider text-sm">Feature</th>
                <th className="p-4 font-black uppercase tracking-wider text-sm">Leank</th>
                <th className="p-4 font-black uppercase tracking-wider text-sm">Others</th>
              </tr>
            </thead>
            <tbody>
              {comparisons.map((row, i) => (
                <tr key={row.feature} className={`${i < comparisons.length - 1 ? 'border-b border-black/20' : ''}`}>
                  <td className="p-4 font-bold text-sm">{row.feature}</td>
                  <td className="p-4 font-bold text-sm text-black">
                    <span className="inline-flex items-center gap-2">
                      <Wifi size={14} strokeWidth={2.5} />
                      {row.leank}
                    </span>
                  </td>
                  <td className="p-4 font-medium text-sm text-black/50">
                    <span className="inline-flex items-center gap-2">
                      <WifiOff size={14} strokeWidth={2} />
                      {row.others}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* CTA */}
        <div className="border-2 border-black p-8 md:p-12 bg-black text-white shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]">
          <h2 className="text-2xl font-black uppercase tracking-tight mb-4">Ready to Try?</h2>
          <p className="text-base font-medium text-white/70 leading-relaxed mb-6">
            Create a room in seconds and experience truly private P2P communication.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-3 px-8 py-4 border-2 border-white bg-white text-black font-black uppercase tracking-wider text-sm hover:bg-transparent hover:text-white transition-colors group"
          >
            Create a Room Now
            <ArrowRight size={18} className="transform group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

      </div>
    </div>
  )
}
