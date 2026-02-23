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
          <p className="text-xs md:text-sm text-black font-bold tracking-[0.2em] uppercase mt-4 border-2 border-black px-5 py-2.5 bg-black/5">
            Peer-to-Peer Secure Communication
          </p>
          <div className="flex flex-col sm:flex-row mt-4 items-center justify-center gap-4 text-[10px] md:text-sm font-bold text-black/50 uppercase tracking-[0.2em]">
            <span className='text-xs'>End-to-End Encrypted</span>
            <span className="w-1 h-1 bg-black/20 hidden sm:block"></span>
            <span className='text-xs'>No Data Stored</span>
            <span className="w-1 h-1 bg-black/20 hidden sm:block"></span>
            <span className='text-xs'>P2P Network</span>
          </div>
        </div>

        <div className="bg-white border-2 border-black rounded-none">
          <div className="grid grid-cols-1 md:grid-cols-2">

            {/* Create Session Section */}
            <div className="p-8 md:p-12 border-b-2 md:border-b-0 md:border-r-2 border-black flex flex-col justify-between bg-black/5 hover:bg-black/10 transition-colors">
              <div>
                <div className="w-16 h-16 border-2 border-black flex items-center justify-center mb-8 bg-white">
                  <Plus size={32} strokeWidth={2} />
                </div>
                <h2 className="text-3xl font-black mb-4 uppercase tracking-tight">New Session</h2>
                <p className="text-base font-medium text-black/70 mb-10 leading-relaxed">
                  Generate a secure room ID and start a new peer-to-peer session instantly.
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
                <h2 className="text-3xl font-black mb-4 uppercase tracking-tight">Join Session</h2>
                <p className="text-base font-medium text-black/70 mb-10 leading-relaxed">
                  Enter an existing room ID to connect with your peers securely.
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

          <div className="flex items-start gap-6 text-[10px] md:text-xs font-bold text-black/40 uppercase tracking-widest">
            <Link href="/privacy" className="hover:text-black transition-colors cursor-pointer">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-black transition-colors cursor-pointer">Terms of Service</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
