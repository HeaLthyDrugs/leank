'use client';

import React, { useState, useEffect } from 'react';
import { useRoom } from '@/hooks/useRoom';
import { useMedia } from '@/hooks/useMedia';
import { useChat } from '@/hooks/useChat';
import { useFileShare } from '@/hooks/useFileShare';
import { usePeerConnection } from '@/hooks/usePeerConnection';
import { VideoGrid } from './VideoGrid';
import { ChatPanel } from './ChatPanel';
import { ControlBar } from './ControlBar';

interface RoomViewProps {
  roomId: string;
  onLeave: () => void;
}

export function RoomView({ roomId, onLeave }: RoomViewProps) {
  const { room, peers, isConnected, updatePeerStream } = useRoom(roomId);
  const { localStream, isAudioEnabled, isVideoEnabled, startMedia, toggleAudio, toggleVideo, startScreenShare } = useMedia();
  const { messages, sendMessage } = useChat(room);
  const { transfers, sendFile } = useFileShare(room);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    console.log('[RoomView] Messages:', messages.length);
    console.log('[RoomView] SendMessage available:', !!sendMessage);
  }, [messages, sendMessage]);

  useEffect(() => {
    console.log('[RoomView] Transfers:', transfers.length);
    console.log('[RoomView] SendFile available:', !!sendFile);
  }, [transfers, sendFile]);

  usePeerConnection(room, localStream, updatePeerStream);

  useEffect(() => {
    const initMedia = async () => {
      try {
        const stream = await startMedia(true, true);
        console.log('[RoomView] Media initialized:', !!stream);
      } catch (err) {
        console.log('[RoomView] Media not available, continuing without camera/mic');
      }
    };
    initMedia();
  }, [startMedia]);

  useEffect(() => {
    console.log('[RoomView] Local stream updated:', !!localStream);
    if (localStream) {
      console.log('[RoomView] Stream tracks:', localStream.getTracks().map(t => t.kind));
    }
  }, [localStream]);



  const handleScreenShare = async () => {
    const screenStream = await startScreenShare();
    if (!screenStream) {
      console.log('[RoomView] Screen share cancelled or failed');
      return;
    }

    console.log('[RoomView] Screen share started');

    if (localStream) {
      const videoTrack = screenStream.getVideoTracks()[0];
      const sender = localStream.getVideoTracks()[0];

      if (sender) {
        localStream.removeTrack(sender);
        sender.stop();
      }

      localStream.addTrack(videoTrack);

      videoTrack.onended = async () => {
        console.log('[RoomView] Screen share ended');
        await startMedia(true, true);
      };
    }
  };

  return (
    <div className="h-screen w-screen bg-white flex flex-col-reverse md:flex-row overflow-hidden">
      {/* 1. Control Bar (Sidebar on Desktop, Bottom Bar on Mobile) */}
      <ControlBar
        isAudioEnabled={isAudioEnabled}
        isVideoEnabled={isVideoEnabled}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onLeave={onLeave}
        onToggleChat={() => setShowChat(!showChat)}
        onScreenShare={handleScreenShare}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header / Info Bar */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4 pointer-events-none">
          <div className="inline-block bg-white border-2 border-black px-4 py-2 pointer-events-auto shadow-sm">
            <p className="text-sm font-bold uppercase tracking-wide text-black">
              ROOM: {roomId.slice(0, 8)}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 ${isConnected ? 'bg-green-600' : 'bg-yellow-400'} border border-black`}></div>
              <p className="text-xs font-mono text-gray-600">
                {isConnected ? `${peers.size} PEERS` : 'CONNECTING...'}
              </p>
            </div>
          </div>
        </div>

        {/* Video Grid */}
        <div className="flex-1 overflow-hidden bg-gray-50 relative">
          <VideoGrid localStream={localStream} peers={peers} isVideoEnabled={isVideoEnabled} />
        </div>
      </div>

      {/* 3. Chat Panel (Right Sidebar on Desktop, Overlay on Mobile) */}
      {showChat && (
        <div className="absolute inset-0 z-30 md:static md:w-[400px] md:border-l-2 md:border-black bg-white flex flex-col">
          <ChatPanel
            messages={messages}
            onSendMessage={sendMessage}
            transfers={transfers}
            onSendFile={sendFile}
            onClose={() => setShowChat(false)}
          />
        </div>
      )}
    </div>
  );
}
