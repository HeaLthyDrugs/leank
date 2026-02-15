'use client';

import React, { useEffect, useRef } from 'react';
import { Peer } from '@/contexts/RoomContext';
import { PeerAudioStatus } from '@/hooks/useAudioStatus';
import { MicOff } from 'lucide-react';

interface VideoGridProps {
  localStream: MediaStream | null;
  peers: Map<string, Peer>;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  localIsSpeaking: boolean;
  peerAudioStatuses: Map<string, PeerAudioStatus>;
}

export function VideoGrid({
  localStream,
  peers,
  isVideoEnabled,
  isAudioEnabled,
  localIsSpeaking,
  peerAudioStatuses,
}: VideoGridProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
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
      {/* Local user video tile */}
      <VideoTile
        isSpeaking={localIsSpeaking && isAudioEnabled}
        isMuted={!isAudioEnabled}
        label="You"
        sublabel={localStream ? '(Live)' : '(No Stream)'}
      >
        {isVideoEnabled && localStream ? (
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <div className="w-24 h-24 border-2 border-black bg-black flex items-center justify-center text-white text-3xl font-bold">
              YOU
            </div>
          </div>
        )}
      </VideoTile>

      {/* Peer video tiles */}
      {peerArray.map((peer) => {
        const audioStatus = peerAudioStatuses.get(peer.id);
        return (
          <PeerVideo
            key={peer.id}
            peer={peer}
            audioStatus={audioStatus}
          />
        );
      })}
    </div>
  );
}

/** Wrapper tile with speaking indicator border and mute icon */
function VideoTile({
  isSpeaking,
  isMuted,
  label,
  sublabel,
  children,
}: {
  isSpeaking: boolean;
  isMuted: boolean;
  label: string;
  sublabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative bg-white transition-all duration-300 ease-in-out"
      style={{
        border: isSpeaking
          ? '3px solid #22c55e'
          : '2px solid black',
        boxShadow: isSpeaking
          ? '0 0 12px 2px rgba(34, 197, 94, 0.4), 0 0 24px 4px rgba(34, 197, 94, 0.15)'
          : 'none',
      }}
    >
      {children}

      {/* Bottom label bar */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between">
        <div className="bg-black text-white text-xs px-2 py-1 font-mono uppercase">
          {label} {sublabel}
        </div>

        {/* Mute indicator */}
        {isMuted && (
          <div className="bg-red-600 text-white p-1 m-1 rounded-sm flex items-center gap-1">
            <MicOff size={12} />
            <span className="text-[10px] font-mono uppercase">Muted</span>
          </div>
        )}
      </div>

      {/* Speaking pulse animation ring */}
      {isSpeaking && (
        <div
          className="absolute inset-0 pointer-events-none rounded-sm animate-[speakingPulse_1.5s_ease-in-out_infinite]"
          style={{
            border: '2px solid rgba(34, 197, 94, 0.5)',
          }}
        />
      )}
    </div>
  );
}

function PeerVideo({
  peer,
  audioStatus,
}: {
  peer: Peer;
  audioStatus?: PeerAudioStatus;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && peer.stream) {
      videoRef.current.srcObject = peer.stream;
      videoRef.current.play().catch(e => console.error('[PeerVideo] Peer video play error:', e));
    }
  }, [peer.stream, peer.id]);

  const isSpeaking = audioStatus?.isSpeaking ?? peer.isSpeaking ?? false;
  const isMuted = audioStatus?.isMuted ?? peer.isMuted ?? false;

  return (
    <VideoTile
      isSpeaking={isSpeaking}
      isMuted={isMuted}
      label={`Peer ${peer.id.slice(0, 6)}`}
    >
      {peer.stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <div className="w-24 h-24 border-2 border-black bg-white flex items-center justify-center text-black text-3xl font-bold">
            {peer.id.slice(0, 2).toUpperCase()}
          </div>
        </div>
      )}
    </VideoTile>
  );
}
