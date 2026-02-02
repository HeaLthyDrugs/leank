'use client';

import React from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, Monitor } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Tooltip } from '@/components/ui/Tooltip';

interface ControlBarProps {
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onLeave: () => void;
  onToggleChat: () => void;
  onScreenShare: () => void;
}

export function ControlBar({
  isAudioEnabled,
  isVideoEnabled,
  onToggleAudio,
  onToggleVideo,
  onLeave,
  onToggleChat,
  onScreenShare
}: ControlBarProps) {

  return (
    <div className="flex bg-white z-20 
      w-full h-16 border-t-2 border-black flex-row items-center justify-center space-x-4
      md:w-20 md:h-full md:flex-col md:border-r-2 md:border-t-0 md:space-x-0 md:space-y-4 md:py-4 md:justify-start
    ">
      {/* Logo - hidden on mobile, shown on desktop */}
      <div className="hidden md:flex md:flex-col md:items-center md:gap-4">
        <Logo size="sm" showText={false} />
        {/* Separator */}
        <div className="w-10 h-px bg-gray-300" />
      </div>

      <div className="flex md:flex-col gap-4">
        <Tooltip content={isAudioEnabled ? "Mute" : "Unmute"} position="right">
          <button
            onClick={onToggleAudio}
            className={`w-12 h-12 flex items-center justify-center border-2 border-black transition-all ${isAudioEnabled ? 'bg-black text-white hover:bg-white hover:text-black' : 'bg-red-600 border-red-600 text-white hover:bg-white hover:text-red-600'
              }`}
          >
            {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
          </button>
        </Tooltip>

        <Tooltip content={isVideoEnabled ? "Blocking" : "Share"} position="right">
          <button
            onClick={onToggleVideo}
            className={`w-12 h-12 flex items-center justify-center border-2 border-black transition-all ${isVideoEnabled ? 'bg-black text-white hover:bg-white hover:text-black' : 'bg-red-600 border-red-600 text-white hover:bg-white hover:text-red-600'
              }`}
          >
            {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
          </button>
        </Tooltip>

        <Tooltip content="Screen Share" position="right">
          <button
            onClick={onScreenShare}
            className="w-12 h-12 flex items-center justify-center border-2 border-black bg-white text-black hover:bg-black hover:text-white transition-all"
          >
            <Monitor size={20} />
          </button>
        </Tooltip>

        <Tooltip content="Chat" position="right">
          <button
            onClick={onToggleChat}
            className="w-12 h-12 flex items-center justify-center border-2 border-black bg-white text-black hover:bg-black hover:text-white transition-all"
          >
            <MessageSquare size={20} />
          </button>
        </Tooltip>
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
