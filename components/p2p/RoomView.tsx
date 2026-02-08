'use client';

import React, { useState, useEffect } from 'react';
import { useRoomContext } from '@/contexts/RoomContext';
import { useMedia } from '@/hooks/useMedia';
import { useChat } from '@/hooks/useChat';
import { useFileShare } from '@/hooks/useFileShare';
import { usePeerConnection } from '@/hooks/usePeerConnection';
import { VideoGrid } from './VideoGrid';
import { ChatPanel } from './ChatPanel';
import { ControlBar } from './ControlBar';
import { HostPanel } from './HostPanel';
import { Logo } from '@/components/ui/Logo';
import { Loader2, RefreshCw, Wifi, WifiOff } from 'lucide-react';

interface RoomViewProps {
  roomId: string;
  onLeave: () => void;
}

export function RoomView({ roomId, onLeave }: RoomViewProps) {
  // Use shared room context
  const {
    room,
    peers,
    isConnected,
    isReconnecting,
    connectionAttempts,
    updatePeerStream,
    joinRoom,
    leaveRoom,
    forceReconnect
  } = useRoomContext();

  const { localStream, isAudioEnabled, isVideoEnabled, startMedia, toggleAudio, toggleVideo, startScreenShare } = useMedia();
  const { messages, sendMessage, typingPeers, broadcastTypingStatus } = useChat(room);
  const { transfers, sendFile } = useFileShare(room);
  const [activePanel, setActivePanel] = useState<'chat' | 'host' | null>('chat');

  // Handle leaving the room properly
  const handleLeave = () => {
    leaveRoom();
    onLeave();
  };

  // Ensure we're connected to the room
  useEffect(() => {
    if (roomId) {
      joinRoom(roomId);
    }
  }, [roomId, joinRoom]);

  useEffect(() => {
    console.log('[RoomView] Room:', !!room, 'Connected:', isConnected, 'Peers:', peers.size);
  }, [room, isConnected, peers.size]);

  useEffect(() => {
    console.log('[RoomView] Messages:', messages.length, 'SendMessage available:', !!sendMessage);
  }, [messages, sendMessage]);

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

  const toggleChat = () => {
    setActivePanel(prev => prev === 'chat' ? null : 'chat');
  };

  const toggleHostPanel = () => {
    setActivePanel(prev => prev === 'host' ? null : 'host');
  };

  return (
    <div className="h-screen w-screen bg-white flex flex-col-reverse md:flex-row overflow-hidden relative">
      {/* Connection Overlay */}
      {!isConnected && (
        <div className="absolute inset-0 z-50 bg-white/95 flex flex-col items-center justify-center">
          <div className="text-center space-y-6 max-w-md px-8">
            {isReconnecting ? (
              <>
                <div className="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center">
                  <Loader2 size={32} className="animate-spin text-yellow-600" />
                </div>
                <h2 className="text-2xl font-black uppercase">Connecting...</h2>
                <p className="text-gray-600 font-mono text-sm">
                  ESTABLISHING P2P CONNECTION<br />
                  ATTEMPT {connectionAttempts}
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                  <WifiOff size={32} className="text-red-600" />
                </div>
                <h2 className="text-2xl font-black uppercase">Connection Lost</h2>
                <p className="text-gray-600 font-mono text-sm">
                  UNABLE TO CONNECT TO ROOM
                </p>
              </>
            )}

            <button
              onClick={forceReconnect}
              className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-bold uppercase hover:bg-gray-800 transition-colors"
            >
              <RefreshCw size={18} />
              {isReconnecting ? 'FORCE RETRY' : 'RECONNECT'}
            </button>

            <button
              onClick={handleLeave}
              className="block mx-auto text-sm font-mono text-gray-500 hover:text-black transition-colors"
            >
              ← LEAVE ROOM
            </button>
          </div>
        </div>
      )}

      {/* 1. Control Bar (Sidebar on Desktop, Bottom Bar on Mobile) */}
      <ControlBar
        isAudioEnabled={isAudioEnabled}
        isVideoEnabled={isVideoEnabled}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onLeave={handleLeave}
        onToggleChat={toggleChat}
        onScreenShare={handleScreenShare}
        onHostControl={toggleHostPanel}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header / Info Bar */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4 pointer-events-none">
          <div className="inline-flex items-center gap-4 bg-white border-2 border-black px-4 py-2 pointer-events-auto shadow-sm">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-black">
                {roomId.slice(0, 8).toUpperCase()}
              </p>
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <>
                    {/* <Wifi size={12} className="text-green-600" /> */}
                    <p className="text-xs font-mono text-green-600">
                      {peers.size} PEER{peers.size !== 1 ? 'S' : ''} CONNECTED
                    </p>
                  </>
                ) : (
                  <>
                    <Loader2 size={12} className="animate-spin text-yellow-600" />
                    <p className="text-xs font-mono text-yellow-600">
                      CONNECTING...
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Video Grid */}
        <div className="flex-1 overflow-hidden bg-gray-50 relative">
          <VideoGrid localStream={localStream} peers={peers} isVideoEnabled={isVideoEnabled} />
        </div>
      </div>

      {/* 3. Side Panel (Chat or Host) */}
      {activePanel !== null && (
        <div className="absolute inset-0 z-30 md:static md:w-[400px] md:border-l-2 md:border-black bg-white flex flex-col">
          {activePanel === 'chat' ? (
            <ChatPanel
              messages={messages}
              onSendMessage={sendMessage}
              transfers={transfers}
              onSendFile={sendFile}
              onClose={() => setActivePanel(null)}
              typingPeers={typingPeers}
              onTypingChange={broadcastTypingStatus}
            />
          ) : (
            <HostPanel
              isOpen={true}
              onClose={() => setActivePanel(null)}
            />
          )}
        </div>
      )}
    </div>
  );
}
