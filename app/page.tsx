'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { generateRoomId } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { Users, ArrowRight, Plus } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [joinRoomId, setJoinRoomId] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setJoinRoomId(roomParam);
    }
  }, []);

  const handleCreateRoom = () => {
    const newRoomId = generateRoomId();
    router.push(`/lobby/${newRoomId}?host=true`);
  };

  const handleJoinRoom = () => {
    if (joinRoomId.trim()) {
      let roomIdToJoin = joinRoomId.trim();

      if (roomIdToJoin.includes('/lobby/')) {
        roomIdToJoin = roomIdToJoin.split('/lobby/')[1];
      } else if (roomIdToJoin.includes('?room=')) {
        roomIdToJoin = roomIdToJoin.split('?room=')[1];
      }

      router.push(`/lobby/${roomIdToJoin}`);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 selection:bg-black selection:text-white font-sans">
      <div className="w-full max-w-4xl">
        <div className="flex flex-col items-start text-center mb-10">
          <Logo size="lg" variant="light" />
        </div>

        <div className="bg-white border-2 border-black rounded-none">
          <div className="grid grid-cols-1 md:grid-cols-2">

            {/* Create Session Section */}
            <div className="p-8 md:p-12 border-b-2 md:border-b-0 md:border-r-2 border-black flex flex-col justify-between bg-black/5 hover:bg-black/10 transition-colors">
              <div>
                <div className="w-16 h-16 border-2 border-black flex items-center justify-center mb-8 bg-white">
                  <Plus size={32} strokeWidth={2} />
                </div>
                <h2 className="text-3xl font-black mb-4 uppercase tracking-tight">Create Room</h2>
                <p className="text-base font-medium text-black/70 mb-10 leading-relaxed">
                  Start a private room instantly and share the link to begin chatting and sharing files.
                </p>
              </div>
              <Button onClick={handleCreateRoom} className="w-full flex items-center justify-between group border-2" size="lg">
                <span>Start Room</span>
                <ArrowRight size={20} className="transform group-hover:translate-x-2 transition-transform" />
              </Button>
            </div>

            {/* Join Session Section */}
            <div className="p-8 md:p-12 flex flex-col justify-between bg-white">
              <div>
                <div className="w-16 h-16 border-2 border-black flex items-center justify-center mb-8 bg-black text-white">
                  <Users size={32} strokeWidth={2} />
                </div>
                <h2 className="text-3xl font-black mb-4 uppercase tracking-tight">Join Room</h2>
                <p className="text-base font-medium text-black/70 mb-10 leading-relaxed">
                  Paste a room ID or join link to instantly connect with others and start chatting.
                </p>
              </div>
              <div className="space-y-4">
                <input
                  type="text"
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value)}
                  placeholder="ENTER ROOM ID"
                  className="w-full px-5 py-4 border-2 border-black outline-none text-base font-bold font-mono placeholder:text-black/30 focus:bg-black/5 transition-colors rounded-none uppercase tracking-wider"
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                />
                <Button onClick={handleJoinRoom} variant="primary" className="w-full flex items-center justify-between group border-2" size="lg">
                  <span>Join Room</span>
                  <ArrowRight size={20} className="transform group-hover:translate-x-2 transition-transform" />
                </Button>
              </div>
            </div>

          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-center gap-6">

          <div className="flex flex-wrap items-start gap-x-6 gap-y-2 text-[10px] md:text-xs font-bold text-black/40 uppercase tracking-widest">
            <Link href="/about" className="hover:text-black transition-colors cursor-pointer">About</Link>
            <Link href="/features" className="hover:text-black transition-colors cursor-pointer">Features</Link>
            <Link href="/how-it-works" className="hover:text-black transition-colors cursor-pointer">How It Works</Link>
            <Link href="/faq" className="hover:text-black transition-colors cursor-pointer">FAQ</Link>
            <Link href="/contact" className="hover:text-black transition-colors cursor-pointer">Contact</Link>
            <Link href="/privacy" className="hover:text-black transition-colors cursor-pointer">Privacy</Link>
            <Link href="/terms" className="hover:text-black transition-colors cursor-pointer">Terms</Link>
          </div>

          <div className="flex flex-wrap items-start gap-x-4 gap-y-2 text-[10px] md:text-xs font-bold text-black/25 uppercase tracking-widest">
            <Link href="/sitemap.xml" className="hover:text-black/50 transition-colors cursor-pointer">Sitemap</Link>
            <Link href="/robots.txt" className="hover:text-black/50 transition-colors cursor-pointer">Robots</Link>
            <Link href="/rss.xml" className="hover:text-black/50 transition-colors cursor-pointer">RSS</Link>
            <Link href="/llms.txt" className="hover:text-black/50 transition-colors cursor-pointer">LLM</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
