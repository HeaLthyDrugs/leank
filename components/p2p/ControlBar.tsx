'use client';

import React, { useEffect, useState } from 'react';
import { Clapperboard, Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, Monitor, Users } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Tooltip } from '@/components/ui/Tooltip';
import { Kbd } from '@/components/ui/kbd';

interface ControlBarProps {
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  localIsSpeaking?: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onLeave: () => void;
  onToggleChat: () => void;
  onScreenShare: () => void;
  isScreenSharing?: boolean;
  isYouTubeOpen?: boolean;
  onToggleYouTube?: () => void;
  onHostControl?: () => void;
}

// Detect if device is touch-only (mobile/tablet)
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      const isTouchOnly = window.matchMedia('(pointer: coarse)').matches
        && !window.matchMedia('(pointer: fine)').matches;
      setIsMobile(isTouchOnly || window.innerWidth < 768);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return isMobile;
}

export function ControlBar({
  isAudioEnabled,
  isVideoEnabled,
  localIsSpeaking = false,
  onToggleAudio,
  onToggleVideo,
  onLeave,
  onToggleChat,
  onScreenShare,
  isScreenSharing = false,
  isYouTubeOpen = false,
  onToggleYouTube,
  onHostControl
}: ControlBarProps) {
  const isMobile = useIsMobile();

  // Keyboard shortcuts — only active when no input/textarea is focused
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'm':
          e.preventDefault();
          onToggleAudio();
          break;
        case 'v':
          e.preventDefault();
          onToggleVideo();
          break;
        case 's':
          e.preventDefault();
          onScreenShare();
          break;
        case 'c':
          e.preventDefault();
          onToggleChat();
          break;
        case 'y':
          if (!onToggleYouTube) {
            break;
          }
          e.preventDefault();
          onToggleYouTube();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggleAudio, onToggleVideo, onScreenShare, onToggleChat, onToggleYouTube]);

  // Tooltip text
  const micTooltip = isAudioEnabled ? 'Mute' : 'Unmute';
  const videoTooltip = isVideoEnabled ? 'Camera Off' : 'Camera On';
  const screenTooltip = isScreenSharing ? 'Stop Sharing' : 'Share Screen';

  return (
    <div className="flex bg-white z-20 
      w-full h-16 border-t-2 border-black flex-row items-center justify-center space-x-4
      md:w-20 md:h-full md:flex-col md:border-r-2 md:border-t-0 md:space-x-0 md:space-y-4 md:justify-start
    ">
      {/* Logo - hidden on mobile, shown on desktop */}
      <div className="hidden md:flex md:flex-col md:items-center w-full">
        <div className="w-full aspect-square flex items-center justify-center">
          <Logo size="md" showText={false} />
        </div>
        <div className="w-full h-px border-b-2 border-black" />
      </div>

      <div className="flex md:flex-col gap-4">
        {/* Mic button with speaking pulse + Kbd */}
        <Tooltip content={micTooltip} position="right">
          <div className="relative">
            <button
              onClick={onToggleAudio}
              className={`relative w-12 h-12 flex items-center justify-center border-2 border-black transition-all ${isAudioEnabled ? 'bg-black text-white hover:bg-gray-800' : 'bg-red-600 border-red-600 text-white hover:bg-red-700'
                }`}
            >
              {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
            {/* Speaking pulse ring */}
            {localIsSpeaking && isAudioEnabled && (
              <div
                className="absolute inset-0 pointer-events-none border-2 border-green-400 animate-ping"
                style={{ animationDuration: '1.5s' }}
              />
            )}
            {/* Kbd badge — desktop only */}
            {!isMobile && (
              <Kbd className="absolute -bottom-1 -right-1 h-4 min-w-4 text-[9px] px-0.5 bg-white text-black border border-black shadow-none">
                M
              </Kbd>
            )}
          </div>
        </Tooltip>

        {/* Video button + Kbd */}
        <Tooltip content={videoTooltip} position="right">
          <div className="relative">
            <button
              onClick={onToggleVideo}
              className={`w-12 h-12 flex items-center justify-center border-2 border-black transition-all ${isVideoEnabled ? 'bg-black text-white hover:bg-gray-800' : 'bg-red-600 border-red-600 text-white hover:bg-red-700'
                }`}
            >
              {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
            </button>
            {!isMobile && (
              <Kbd className="absolute -bottom-1 -right-1 h-4 min-w-4 text-[9px] px-0.5 bg-white text-black border border-black shadow-none">
                V
              </Kbd>
            )}
          </div>
        </Tooltip>

        {/* Screen share — hidden on mobile */}
        {!isMobile && (
          <Tooltip content={screenTooltip} position="right">
            <div className="relative">
              <button
                onClick={onScreenShare}
                className={`w-12 h-12 flex items-center justify-center border-2 border-black transition-all ${isScreenSharing ? 'bg-black text-white hover:bg-gray-800' : 'bg-white text-black hover:bg-black hover:text-white'}`}
              >
                <Monitor size={20} />
              </button>
              <Kbd className="absolute -bottom-1 -right-1 h-4 min-w-4 text-[9px] px-0.5 bg-white text-black border border-black shadow-none">
                S
              </Kbd>
            </div>
          </Tooltip>
        )}

        {/* Chat button + Kbd */}
        <Tooltip content="Chat" position="right">
          <div className="relative">
            <button
              onClick={onToggleChat}
              className="w-12 h-12 flex items-center justify-center border-2 border-black bg-white text-black hover:bg-black hover:text-white transition-all"
            >
              <MessageSquare size={20} />
            </button>
            {!isMobile && (
              <Kbd className="absolute -bottom-1 -right-1 h-4 min-w-4 text-[9px] px-0.5 bg-white text-black border border-black shadow-none">
                C
              </Kbd>
            )}
          </div>
        </Tooltip>

        {onToggleYouTube && (
          <Tooltip content={isYouTubeOpen ? 'Close YouTube' : 'Open YouTube'} position="right">
            <div className="relative">
              <button
                onClick={onToggleYouTube}
                className={`w-12 h-12 flex items-center justify-center border-2 border-black transition-all ${
                  isYouTubeOpen ? 'bg-black text-white hover:bg-gray-800' : 'bg-white text-black hover:bg-black hover:text-white'
                }`}
              >
                <Clapperboard size={20} />
              </button>
              {!isMobile && (
                <Kbd className="absolute -bottom-1 -right-1 h-4 min-w-4 text-[9px] px-0.5 bg-white text-black border border-black shadow-none">
                  Y
                </Kbd>
              )}
            </div>
          </Tooltip>
        )}

        {onHostControl && (
          <Tooltip content="Peers" position="right">
            <button
              onClick={onHostControl}
              className="w-12 h-12 flex items-center justify-center border-2 border-black bg-white text-black hover:bg-black hover:text-white transition-all"
            >
              <Users size={20} />
            </button>
          </Tooltip>
        )}
      </div>

      <Tooltip content="Leave" position="right">
        <button
          onClick={onLeave}
          className="w-12 h-12 flex items-center justify-center border-2 border-red-600 bg-red-600 text-white hover:bg-white hover:text-red-600 transition-all md:mt-auto"
        >
          <PhoneOff size={20} />
        </button>
      </Tooltip>
    </div>
  );
}
