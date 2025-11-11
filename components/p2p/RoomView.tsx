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
    <div className="h-screen w-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative">
      <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-lg px-4 py-2 rounded-lg text-white space-y-1">
        <p className="text-sm font-semibold">Room: {roomId.slice(0, 8)}</p>
        <p className="text-xs opacity-70">{isConnected ? `${peers.size} peer(s) connected` : 'Connecting...'}</p>
        {peers.size > 0 && (
          <div className="text-xs mt-2 space-y-1">
            <p className="font-semibold">Connected Peers:</p>
            {Array.from(peers.values()).map(peer => (
              <p key={peer.id} className="opacity-70">• {peer.id.slice(0, 8)}</p>
            ))}
          </div>
        )}
      </div>

      <div className={`h-full ${showChat ? 'grid grid-cols-[1fr_400px]' : ''}`}>
        <VideoGrid localStream={localStream} peers={peers} isVideoEnabled={isVideoEnabled} />
        
        {showChat && (
          <div className="h-full border-l border-gray-700">
            <ChatPanel 
              messages={messages} 
              onSendMessage={sendMessage}
              transfers={transfers}
              onSendFile={sendFile}
            />
          </div>
        )}
      </div>

      <ControlBar
        isAudioEnabled={isAudioEnabled}
        isVideoEnabled={isVideoEnabled}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onLeave={onLeave}
        onToggleChat={() => setShowChat(!showChat)}
        onScreenShare={handleScreenShare}
      />
    </div>
  );
}
