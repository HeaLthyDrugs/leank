import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Shield, Zap, Globe, Lock, Users, MonitorSmartphone } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About Leank — Free P2P Communication Platform',
  description: 'Leank is a free, open, browser-based peer-to-peer communication platform for instant video calls, chat, file sharing, and YouTube watch sessions — no signup required.',
  openGraph: {
    title: 'About Leank — Free P2P Communication Platform',
    description: 'Leank is a free, open, browser-based peer-to-peer communication platform for instant video calls, chat, file sharing, and YouTube watch sessions — no signup required.',
    url: 'https://leank.space/about',
    type: 'website',
  },
  alternates: {
    canonical: 'https://leank.space/about',
  },
}

const values = [
  {
    icon: Shield,
    title: 'Privacy First',
    description: 'No accounts, no data collection, no tracking. Your conversations are yours alone.',
  },
  {
    icon: Zap,
    title: 'Instant Access',
    description: 'Create a room and start communicating in under 3 seconds. No downloads, no installations.',
  },
  {
    icon: Globe,
    title: 'Works Everywhere',
    description: 'Any modern browser on any device. Desktop, tablet, or mobile — it just works.',
  },
  {
    icon: Lock,
    title: 'Zero Data Retention',
    description: 'When your session ends, everything disappears. No logs, no archives, no traces.',
  },
  {
    icon: Users,
    title: 'Truly P2P',
    description: 'Data flows directly between you and your peers. No middleman servers touch your content.',
  },
  {
    icon: MonitorSmartphone,
    title: 'Free Forever',
    description: 'No premium tiers, no ads, no paywalls. Leank is and will remain completely free.',
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white pb-20">
      <div className="max-w-4xl mx-auto px-6 pt-16">

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8 text-xs font-bold uppercase tracking-widest text-black/40">
          <Link href="/" className="hover:text-black transition-colors">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-black">About</span>
        </nav>

        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-6">
          About Leank
        </h1>

        <p className="text-lg md:text-xl font-medium text-black/70 leading-relaxed mb-12 max-w-2xl">
          Leank is a free, browser-based peer-to-peer communication platform.
          Create instant rooms for video calls, chat, file sharing, and YouTube
          watch sessions — with zero signups, zero downloads, and zero servers
          storing your data.
        </p>

        {/* Mission */}
        <div className="border-2 border-black p-8 md:p-12 mb-12 bg-black/5 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-2xl font-black uppercase tracking-tight mb-4">Our Mission</h2>
          <p className="text-base md:text-lg font-medium text-black/80 leading-relaxed">
            We believe private communication should be instant, free, and accessible to everyone.
            Leank exists to prove that you don&apos;t need accounts, apps, or corporate infrastructure
            to have a secure, high-quality conversation. We built the simplest possible path from
            &quot;I need to talk to someone&quot; to actually talking — with nothing in between.
          </p>
        </div>

        {/* Values Grid */}
        <h2 className="text-2xl font-black uppercase tracking-tight mb-8">What We Stand For</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-2 border-black mb-12">
          {values.map((value, i) => (
            <div
              key={value.title}
              className={`p-8 ${i % 2 === 0 ? 'md:border-r-2 border-black' : ''} ${i < values.length - 2 ? 'border-b-2 border-black' : i < values.length - 1 ? 'border-b-2 md:border-b-0 border-black' : ''}`}
            >
              <value.icon size={32} strokeWidth={2} className="mb-4" />
              <h3 className="text-lg font-black uppercase tracking-tight mb-2">{value.title}</h3>
              <p className="text-base font-medium text-black/70 leading-relaxed">{value.description}</p>
            </div>
          ))}
        </div>

        {/* How It's Different */}
        <div className="border-2 border-black p-8 md:p-12 mb-12">
          <h2 className="text-2xl font-black uppercase tracking-tight mb-4">How Leank Is Different</h2>
          <div className="space-y-4 text-base md:text-lg font-medium text-black/80 leading-relaxed">
            <p>
              Most communication tools require you to create an account, download an app, and trust a company
              with your data. Leank flips this model entirely.
            </p>
            <p>
              Every piece of data — your video, your messages, your files — travels directly from your
              device to your peer&apos;s device using WebRTC. There is no central server that sees, stores,
              or processes your content. When you leave a room, it ceases to exist.
            </p>
            <p>
              This is communication as it should be: direct, private, and ephemeral.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <Link
            href="/"
            className="inline-flex items-center gap-3 px-8 py-4 border-2 border-black bg-black text-white font-black uppercase tracking-wider text-sm hover:bg-white hover:text-black transition-colors group"
          >
            Start a Room
            <ArrowRight size={18} className="transform group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/features"
            className="inline-flex items-center gap-3 px-8 py-4 border-2 border-black bg-white text-black font-black uppercase tracking-wider text-sm hover:bg-black/5 transition-colors group"
          >
            View Features
            <ArrowRight size={18} className="transform group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

      </div>
    </div>
  )
}
