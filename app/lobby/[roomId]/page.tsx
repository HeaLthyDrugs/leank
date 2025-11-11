'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useRoom } from '@/hooks/useRoom';
import { useRoomState } from '@/hooks/useRoomState';
import { Copy, Check, Users, ArrowRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function LobbyPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = params.roomId as string;
  const [copied, setCopied] = useState(false);
  const [roomLink, setRoomLink] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [peerCount, setPeerCount] = useState(0);
  
  const { room, peers, isConnected } = useRoom(roomId);
  const { roomState, startSession } = useRoomState(room, isHost);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setRoomLink(`${window.location.origin}/lobby/${roomId}`);
      
      const isHostParam = searchParams.get('host');
      console.log('Host param:', isHostParam);
      
      const hostFlag = isHostParam === 'true';
      setIsHost(hostFlag);
      console.log('User is:', hostFlag ? 'host' : 'participant');
      
      localStorage.setItem(`room_${roomId}_host`, hostFlag ? 'true' : 'false');
    }
  }, [roomId, searchParams]);

  useEffect(() => {
    if (roomState.isSessionStarted && !isHost) {
      router.push(`/room/${roomId}`);
    }
  }, [roomState.isSessionStarted, isHost, roomId, router]);

  useEffect(() => {
    const newCount = peers.size;
    if (newCount > peerCount && peerCount > 0) {
      console.log('New peer joined!');
    }
    setPeerCount(newCount);
  }, [peers.size, peerCount]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStart = async () => {
    if (isHost) {
      startSession();
    }
    router.push(`/room/${roomId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isHost ? 'Room Created!' : 'Joining Room'}
          </h1>
          <p className="text-gray-600">
            {isHost ? 'Share this room with others to join' : 'Waiting for host to start the session'}
          </p>
        </div>

        {isHost && (
          <>
            <div className="flex justify-center mb-8">
              <div className="bg-white p-4 rounded-lg border-4 border-gray-200">
                <QRCodeSVG value={roomLink} size={200} />
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Room Link</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={roomLink}
                    readOnly
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(roomLink)}
                    className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {copied ? <Check size={20} /> : <Copy size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Room ID</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={roomId}
                    readOnly
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono"
                  />
                  <button
                    onClick={() => copyToClipboard(roomId)}
                    className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    {copied ? <Check size={20} /> : <Copy size={20} />}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {!isHost && roomState.isSessionStarted && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-center">
            <p className="text-green-800 font-medium">Session has started! Redirecting...</p>
          </div>
        )}

        {!isHost && !roomState.isSessionStarted && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-center">
            <Clock className="mx-auto mb-2 text-yellow-600" size={32} />
            <p className="text-yellow-800 font-medium">Waiting for host to start the session</p>
          </div>
        )}

        <div className="bg-gray-900 text-green-400 rounded-lg p-4 mb-4">
          <div className="text-xs font-mono space-y-1">
            <p>▶ Room ID: {roomId}</p>
            <p>▶ Is Host: {isHost ? 'YES' : 'NO'}</p>
            <p>▶ Room Object: {room ? '✅ CREATED' : '❌ NOT CREATED'}</p>
            <p>▶ Peers Count: {peers.size}</p>
            <p>▶ Connected: {isConnected ? '✅ YES' : '❌ NO'}</p>
            <p>▶ Peer IDs: {Array.from(peers.keys()).join(', ') || 'None'}</p>
          </div>
          <button
            onClick={() => {
              console.log('=== CONNECTION TEST ===');
              console.log('Room:', room);
              console.log('Peers:', Array.from(peers.entries()));
              if (room) {
                const [send, receive] = room.makeAction<string>('test');
                receive((msg, peerId) => console.log('Test received from:', peerId, msg));
                send('Hello from ' + (isHost ? 'host' : 'participant'));
              }
            }}
            className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
          >
            Test Connection
          </button>
        </div>

        <div className="bg-blue-50 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Users size={20} />
              Participants
            </h3>
            <span className={`text-sm px-3 py-1 rounded-full ${isConnected ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {isConnected ? `● Connected (${peers.size + 1})` : '○ Connecting...'}
            </span>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-3 bg-white rounded-lg p-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                You
              </div>
              <div>
                <p className="font-medium text-gray-900">You {isHost ? '(Host)' : ''}</p>
                <p className="text-xs text-gray-500">Waiting in lobby</p>
              </div>
            </div>

            {Array.from(peers.values()).map((peer) => (
              <div key={peer.id} className="flex items-center gap-3 bg-white rounded-lg p-3">
                <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold">
                  {peer.id.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900">Peer {peer.id.slice(0, 6)}</p>
                  <p className="text-xs text-green-600">● Connected</p>
                </div>
              </div>
            ))}

            {peers.size === 0 && (
              <p className="text-center text-gray-500 text-sm py-4">
                Waiting for others to join...
              </p>
            )}
          </div>
        </div>

        {isHost ? (
          <>
            <Button 
              onClick={handleStart}
              className="w-full flex items-center justify-center gap-2"
              size="lg"
            >
              Start Session
              <ArrowRight size={20} />
            </Button>
            <p className="text-center text-xs text-gray-500 mt-4">
              You can start the session anytime. Others can join even after you start.
            </p>
          </>
        ) : (
          <>
            <Button 
              onClick={handleStart}
              disabled={!roomState.isSessionStarted}
              className="w-full flex items-center justify-center gap-2"
              size="lg"
            >
              {roomState.isSessionStarted ? 'Join Session' : 'Waiting for Host...'}
              <ArrowRight size={20} />
            </Button>
            <p className="text-center text-xs text-gray-500 mt-4">
              The host will start the session soon.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
