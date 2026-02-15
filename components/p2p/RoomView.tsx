'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRoomContext } from '@/contexts/RoomContext';
import { useMedia } from '@/hooks/useMedia';
import { useChat } from '@/hooks/useChat';
import { useFileShare } from '@/hooks/useFileShare';
import { usePeerConnection } from '@/hooks/usePeerConnection';
import { useAudioLevel } from '@/hooks/useAudioLevel';
import { useAudioStatus } from '@/hooks/useAudioStatus';
import { VideoGrid } from './VideoGrid';
import { ChatPanel } from './ChatPanel';
import { ControlBar } from './ControlBar';
import { PeersPanel } from './PeersPanel';
import { Loader2, RefreshCw, WifiOff } from 'lucide-react';

interface RoomViewProps {
  roomId: string;
  onLeave: () => void;
}

export function RoomView({ roomId, onLeave }: RoomViewProps) {
  const searchParams = useSearchParams();

  // Use shared room context
  const {
    room,
    peers,
    isConnected,
    isReconnecting,
    connectionAttempts,
    isHost,
    updatePeerStream,
    joinRoom,
    leaveRoom,
    forceReconnect,
    setIsHost,
    mutePeer,
    unmutePeer,
    stopPeerVideo,
    removePeer,
    muteAllPeers,
    stopAllVideo
  } = useRoomContext();

  const {
    localStream,
    isAudioEnabled,
    isVideoEnabled,
    startMedia,
    toggleAudio,
    toggleVideo,
    setAudioEnabled,
    startScreenShare
  } = useMedia();

  const { messages, sendMessage, typingPeers, broadcastTypingStatus } = useChat(room);
  const { transfers, sendFile } = useFileShare(room);
  const [activePanel, setActivePanel] = useState<'chat' | 'host' | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Audio level detection for local user
  const { isSpeaking: localIsSpeaking } = useAudioLevel(localStream, isAudioEnabled);

  // Broadcast and receive audio status across peers
  const { peerAudioStatuses } = useAudioStatus(room, localIsSpeaking, !isAudioEnabled);

  // Set host status from URL params or localStorage on mount
  useEffect(() => {
    const hostParam = searchParams.get('host');
    if (hostParam === 'true') {
      setIsHost(true);
    } else if (typeof window !== 'undefined') {
      // Fall back to localStorage (set by lobby page)
      const storedHostStatus = localStorage.getItem(`room_${roomId}_host`);
      if (storedHostStatus === 'true') {
        setIsHost(true);
      }
    }
  }, [searchParams, setIsHost, roomId]);

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

  const { replaceTrack } = usePeerConnection(room, localStream, updatePeerStream);

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

  // Listen for host commands (mute, unmute, stop-video, kick)
  useEffect(() => {
    if (!room) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [, receiveHostCommand] = room.makeAction('host-command') as unknown as [
      (data: any, peerId?: string) => void,
      (callback: (data: any, peerId: string) => void) => void
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    receiveHostCommand((data: any, peerId: string) => {
      console.log('[RoomView] Received host command from:', peerId, 'type:', data.type);

      switch (data.type) {
        case 'mute':
          console.log('[RoomView] Host requested mute');
          setAudioEnabled(false);
          break;
        case 'unmute':
          console.log('[RoomView] Host requested unmute');
          setAudioEnabled(true);
          break;
        case 'stop-video':
          console.log('[RoomView] Host requested stop video');
          if (isVideoEnabled) {
            toggleVideo();
          }
          break;
        case 'kick':
          console.log('[RoomView] Host kicked us from room');
          handleLeave();
          break;
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room, setAudioEnabled, toggleVideo]);

  const handleScreenShare = async () => {
    if (isScreenSharing) {
      // Stop screen share and revert to camera
      console.log('[RoomView] Stopping screen share...');
      const cameraStream = await startMedia(true, true);
      if (cameraStream && localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        const newTrack = cameraStream.getVideoTracks()[0];

        if (videoTrack && newTrack) {
          replaceTrack(videoTrack, newTrack, localStream);
          localStream.removeTrack(videoTrack);
          localStream.addTrack(newTrack);
          videoTrack.stop(); // Stop the screen share track
        }
      }
      setIsScreenSharing(false);
      return;
    }

    const screenStream = await startScreenShare();
    if (!screenStream) {
      console.log('[RoomView] Screen share cancelled or failed');
      return;
    }

    console.log('[RoomView] Screen share started');
    setIsScreenSharing(true);

    if (localStream) {
      const videoTrack = screenStream.getVideoTracks()[0];
      const sender = localStream.getVideoTracks()[0];

      if (sender) {
        replaceTrack(sender, videoTrack, localStream);
        localStream.removeTrack(sender);
        sender.stop();
      }

      localStream.addTrack(videoTrack);

      videoTrack.onended = async () => {
        console.log('[RoomView] Screen share ended by browser UI');
        const cameraStream = await startMedia(true, true);
        if (cameraStream) {
          const newTrack = cameraStream.getVideoTracks()[0];
          if (newTrack) {
            replaceTrack(videoTrack, newTrack, localStream);
            localStream.removeTrack(videoTrack);
            localStream.addTrack(newTrack);
          }
        }
        setIsScreenSharing(false);
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
        isHost={isHost}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onLeave={handleLeave}
        onToggleChat={toggleChat}
        onScreenShare={handleScreenShare}
        isScreenSharing={isScreenSharing}
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
          <VideoGrid
            localStream={localStream}
            peers={peers}
            isVideoEnabled={isVideoEnabled}
            isAudioEnabled={isAudioEnabled}
            localIsSpeaking={localIsSpeaking}
            peerAudioStatuses={peerAudioStatuses}
          />
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
            <PeersPanel
              isOpen={true}
              onClose={() => setActivePanel(null)}
              peers={peers}
              roomId={roomId}
            />
          )}
        </div>
      )}
    </div>
  );
}
