'use client';

import React, { useEffect, useRef } from 'react';
import { Peer } from '@/hooks/useRoom';

interface VideoGridProps {
  localStream: MediaStream | null;
  peers: Map<string, Peer>;
  isVideoEnabled: boolean;
}

export function VideoGrid({ localStream, peers, isVideoEnabled }: VideoGridProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    console.log('[VideoGrid] Local stream:', !!localStream, 'Video enabled:', isVideoEnabled);
    console.log('[VideoGrid] Peers with streams:', Array.from(peers.values()).filter(p => p.stream).length);
  }, [localStream, isVideoEnabled, peers]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      console.log('[VideoGrid] Setting local stream');
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(e => console.error('[VideoGrid] Local video play error:', e));
    }
  }, [localStream]);

  const peerArray = Array.from(peers.values());
  const totalVideos = 1 + peerArray.length;
  
  const getGridClass = () => {
    if (totalVideos === 1) return 'grid-cols-1';
    if (totalVideos === 2) return 'grid-cols-2';
    if (totalVideos <= 4) return 'grid-cols-2';
    if (totalVideos <= 6) return 'grid-cols-3';
    return 'grid-cols-4';
  };

  return (
    <div className={`grid gap-4 h-full p-4 ${getGridClass()}`}>
      <div className="relative bg-gray-900 rounded-lg overflow-hidden">
        {isVideoEnabled && localStream ? (
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold">
              You
            </div>
          </div>
        )}
        <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-sm">
          You {localStream ? '(Live)' : '(No Stream)'}
        </div>
      </div>

      {peerArray.map((peer) => (
        <PeerVideo key={peer.id} peer={peer} />
      ))}
    </div>
  );
}

function PeerVideo({ peer }: { peer: Peer }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && peer.stream) {
      console.log('[PeerVideo] Setting peer stream for:', peer.id);
      videoRef.current.srcObject = peer.stream;
      videoRef.current.play().catch(e => console.error('[PeerVideo] Peer video play error:', e));
    }
  }, [peer.stream, peer.id]);

  return (
    <div className="relative bg-gray-900 rounded-lg overflow-hidden">
      {peer.stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-800">
          <div className="w-24 h-24 rounded-full bg-purple-600 flex items-center justify-center text-white text-3xl font-bold">
            {peer.id.slice(0, 2).toUpperCase()}
          </div>
        </div>
      )}
      <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-sm">
        Peer {peer.id.slice(0, 6)}
      </div>
    </div>
  );
}
