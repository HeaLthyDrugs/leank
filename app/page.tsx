'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { generateRoomId } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Video, Users } from 'lucide-react';

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
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <div className="max-w-xl w-full">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-black p-3">
              <Video size={48} className="text-white" />
            </div>
          </div>
          <h1 className="text-6xl font-black text-black mb-4 tracking-tighter uppercase">LeanK</h1>
          <p className="text-lg text-gray-600 font-mono tracking-wide">P2P SECURE COMMUNICATION</p>
        </div>

        <div className="bg-white border-2 border-black p-0">
          <div className="p-8 border-b-2 border-black bg-gray-50">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-3 uppercase tracking-wider">
              <Users size={20} />
              New Session
            </h2>
            <Button onClick={handleCreateRoom} className="w-full" size="lg">
              Start Room
            </Button>
          </div>

          <div className="p-8">
            <h2 className="text-xl font-bold mb-6 uppercase tracking-wider">Join Session</h2>
            <div className="space-y-4">
              <input
                type="text"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                placeholder="ENTER ROOM ID"
                className="w-full px-6 py-4 border-2 border-gray-300 focus:border-black outline-none text-lg font-mono placeholder:text-gray-400 focus:bg-gray-50 transition-colors"
                onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
              />
              <Button onClick={handleJoinRoom} variant="secondary" className="w-full" size="lg">
                Join Room
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center text-xs font-mono text-gray-400 uppercase tracking-widest">
          <p>End-to-end encrypted • No data stored • P2P</p>
        </div>
      </div>
    </div>
  );
}
