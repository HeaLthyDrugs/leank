import type { Metadata } from 'next'
import Link from 'next/link'
import { Mail, Globe, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Contact — Get in Touch with Leank',
  description: 'Have questions about Leank? Reach out to me for support, feedback, or any inquiries about this P2P communication platform.',
  openGraph: {
    title: 'Contact — Get in Touch',
    description: 'Have questions about Leank? Reach out to me for support, feedback, or inquiries.',
    url: 'https://leank.space/contact',
    type: 'website',
  },
  alternates: { canonical: 'https://leank.space/contact' },
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white pb-20">
      <div className="max-w-4xl mx-auto px-6 pt-16">
        <nav aria-label="Breadcrumb" className="mb-8 text-xs font-bold uppercase tracking-widest text-black/40">
          <Link href="/" className="hover:text-black transition-colors">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-black">Contact</span>
        </nav>

        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-6">Contact</h1>
        <p className="text-lg md:text-xl font-medium text-black/70 leading-relaxed mb-12 max-w-2xl">
          Have a question, feedback, or just want to say hi? I&apos;d love to hear from you.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-2 border-black mb-12">
          <div className="p-8 md:p-12 border-b-2 md:border-b-0 md:border-r-2 border-black bg-black/5">
            <Mail size={32} strokeWidth={2} className="mb-6" />
            <h2 className="text-2xl font-black uppercase tracking-tight mb-3">Email</h2>
            <p className="text-base font-medium text-black/70 leading-relaxed mb-4">
              For support, feedback, or general inquiries.
            </p>
            <a href="mailto:manishvishwakarma9960@gmail.com" className="text-lg font-black underline underline-offset-4 hover:no-underline transition-all break-all">
              manishvishwakarma9960@gmail.com
            </a>
          </div>

          <div className="p-8 md:p-12">
            <Globe size={32} strokeWidth={2} className="mb-6" />
            <h2 className="text-2xl font-black uppercase tracking-tight mb-3">Portfolio</h2>
            <p className="text-base font-medium text-black/70 leading-relaxed mb-4">
              Built and maintained by Manish Vishwakarma.
            </p>
            <a href="https://mnsh.online" target="_blank" rel="noopener noreferrer" className="text-lg font-black underline underline-offset-4 hover:no-underline transition-all">
              mnsh.online
            </a>
          </div>
        </div>

        <div className="border-2 border-black p-8 md:p-12 bg-black text-white">
          <h2 className="text-2xl font-black uppercase tracking-tight mb-4">Ready to Start?</h2>
          <p className="text-base font-medium text-white/70 mb-6">
            No contact needed to get started — just create a room and go.
          </p>
          <Link href="/" className="inline-flex items-center gap-3 px-8 py-4 border-2 border-white bg-white text-black font-black uppercase tracking-wider text-sm hover:bg-transparent hover:text-white transition-colors group">
            Create a Room <ArrowRight size={18} className="transform group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  )
}
