'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useRoomContext } from '@/contexts/RoomContext';
import { useRoomState } from '@/hooks/useRoomState';
import { Copy, Check, Users, ArrowRight, Clock, Loader2, Wifi, WifiOff, RefreshCw } from 'lucide-react';
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

  // Use shared room context instead of direct useRoom
  const { room, peers, isConnected, isReconnecting, connectionAttempts, joinRoom, forceReconnect } = useRoomContext();
  const { roomState, startSession } = useRoomState(room, isHost);

  // Join the room when component mounts
  useEffect(() => {
    if (roomId) {
      joinRoom(roomId);
    }
  }, [roomId, joinRoom]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setRoomLink(`${window.location.origin}/lobby/${roomId}`);

      const isHostParam = searchParams.get('host');
      const hostFlag = isHostParam === 'true';
      setIsHost(hostFlag);

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
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-4xl w-full border-2 border-black bg-white">
        <div className="border-b-2 border-black p-8 text-center bg-gray-50">
          <h1 className="text-3xl font-black text-black uppercase tracking-tighter mb-2">
            {isHost ? 'Room Ready' : 'Lobby'}
          </h1>
          <p className="text-gray-600 font-mono text-sm tracking-wide">
            {isHost ? 'WAITING FOR PARTICIPANTS' : 'WAITING FOR HOST TO START'}
          </p>
        </div>

        {/* Connection Status Banner */}
        {!isConnected && (
          <div className="bg-yellow-50 border-b-2 border-yellow-400 px-6 py-3 flex items-center justify-center gap-3 flex-wrap">
            <Loader2 size={16} className="animate-spin text-yellow-600" />
            <span className="text-sm font-mono text-yellow-700">
              ESTABLISHING P2P CONNECTION... (ATTEMPT {connectionAttempts})
            </span>
            <button
              onClick={forceReconnect}
              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold uppercase bg-yellow-600 text-white hover:bg-yellow-700 transition-colors"
            >
              <RefreshCw size={12} />
              RETRY
            </button>
          </div>
        )}

        {isConnected && peers.size === 0 && (
          <div className="bg-blue-50 border-b-2 border-blue-400 px-6 py-3 flex items-center justify-center gap-3">
            <Wifi size={16} className="text-blue-600" />
            <span className="text-sm font-mono text-blue-700">
              CONNECTED — WAITING FOR OTHER PARTICIPANTS TO JOIN
            </span>
          </div>
        )}

        {isConnected && peers.size > 0 && (
          <div className="bg-green-50 border-b-2 border-green-400 px-6 py-3 flex items-center justify-center gap-3">
            <Check size={16} className="text-green-600" />
            <span className="text-sm font-mono text-green-700">
              ALL CONNECTED — {peers.size + 1} PARTICIPANTS READY
            </span>
          </div>
        )}

        <div className="p-8 grid md:grid-cols-2 gap-8">
          {/* Left Column: Room Info */}
          <div className="space-y-8">
            {isHost && (
              <div className="bg-white border-2 border-black p-6 flex flex-col items-center justify-center space-y-6">
                <div className="bg-white p-2 border-2 border-black">
                  <QRCodeSVG value={roomLink} size={180} />
                </div>
                <div className="w-full space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase mb-2">Room Link</label>
                    <div className="flex">
                      <input
                        type="text"
                        value={roomLink}
                        readOnly
                        className="flex-1 px-4 py-2 border-2 border-black border-r-0 text-xs font-mono bg-white outline-none"
                      />
                      <button
                        onClick={() => copyToClipboard(roomLink)}
                        className="px-4 py-2 bg-black text-white hover:bg-gray-800 transition-colors border-2 border-black"
                      >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase mb-2">Room ID</label>
                    <div className="flex">
                      <input
                        type="text"
                        value={roomId}
                        readOnly
                        className="flex-1 px-4 py-2 border-2 border-black border-r-0 text-xs font-mono bg-white outline-none"
                      />
                      <button
                        onClick={() => copyToClipboard(roomId)}
                        className="px-4 py-2 bg-black text-white hover:bg-gray-800 transition-colors border-2 border-black"
                      >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!isHost && (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] border-2 border-dashed border-gray-300 p-8 text-center">
                {roomState.isSessionStarted ? (
                  <div className="animate-pulse">
                    <p className="text-xl font-bold mb-2">SESSION STARTED</p>
                    <p className="font-mono text-sm">REDIRECTING...</p>
                  </div>
                ) : (
                  <div>
                    <Clock className="mx-auto mb-4 text-black" size={48} />
                    <p className="text-xl font-black uppercase mb-2">Waiting</p>
                    <p className="font-mono text-sm text-gray-500">HOST HAS NOT STARTED YET</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Participants & Actions */}
          <div className="flex flex-col h-full justify-between space-y-8">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-gray-100">
                <h3 className="font-bold uppercase flex items-center gap-2">
                  <Users size={18} />
                  Participants
                </h3>
                <span className={`text-xs font-mono font-bold px-2 py-1 border border-black flex items-center gap-2 ${isConnected ? 'bg-black text-white' : 'bg-transparent text-gray-400'}`}>
                  {!isConnected && <Loader2 size={12} className="animate-spin" />}
                  {isConnected ? `CONNECTED: ${peers.size + 1}` : 'CONNECTING...'}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 border border-gray-200">
                  <div className="w-8 h-8 bg-black text-white flex items-center justify-center font-bold text-xs">
                    YOU
                  </div>
                  <div>
                    <p className="font-bold text-sm">You {isHost ? '(HOST)' : ''}</p>
                    <p className="text-[10px] font-mono text-gray-500 uppercase">Status: Ready</p>
                  </div>
                </div>

                {Array.from(peers.values()).map((peer) => (
                  <div key={peer.id} className="flex items-center gap-3 p-3 border border-black bg-gray-50">
                    <div className="w-8 h-8 bg-white border border-black text-black flex items-center justify-center font-bold text-xs">
                      {peer.id.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-sm">PEER {peer.id.slice(0, 4)}</p>
                      <p className="text-[10px] font-mono text-green-600 uppercase">● Linked</p>
                    </div>
                  </div>
                ))}

                {peers.size === 0 && (
                  <p className="text-center font-mono text-xs text-gray-400 py-8 border border-dashed border-gray-200">
                    WAITING FOR OTHERS...
                  </p>
                )}
              </div>
            </div>

            <div>
              {/* Debug Info (Collapsed/Minimal) */}
              <div className="mb-4 text-[10px] font-mono text-gray-400 border-t border-gray-100 pt-2">
                <p>ID: {roomId} | PEERS: {peers.size} | CONN: {isConnected ? 'OK' : '...'}</p>
              </div>

              {isHost ? (
                <Button
                  onClick={handleStart}
                  className="w-full flex items-center justify-center gap-2"
                  size="lg"
                >
                  START SESSION
                  <ArrowRight size={18} />
                </Button>
              ) : (
                <Button
                  onClick={handleStart}
                  disabled={!roomState.isSessionStarted}
                  className="w-full flex items-center justify-center gap-2"
                  size="lg"
                  variant={roomState.isSessionStarted ? 'primary' : 'secondary'}
                >
                  {roomState.isSessionStarted ? 'JOIN NOW' : 'WAITING...'}
                  <ArrowRight size={18} />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
