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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Video size={48} className="text-blue-600" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">LeanK</h1>
          <p className="text-xl text-gray-600">Secure P2P Video Calls, Chat & File Sharing</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Users size={24} />
              Start a New Room
            </h2>
            <Button onClick={handleCreateRoom} className="w-full" size="lg">
              Create Room
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">OR</span>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">Join Existing Room</h2>
            <div className="space-y-3">
              <input
                type="text"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                placeholder="Enter room ID or paste room link"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
              />
              <Button onClick={handleJoinRoom} variant="secondary" className="w-full" size="lg">
                Join Room
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-600">
          <p>🔒 End-to-end encrypted • No data stored • Peer-to-peer connection</p>
        </div>
      </div>
    </div>
  );
}
