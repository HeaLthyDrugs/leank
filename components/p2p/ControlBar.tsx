'use client';

import React from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, Monitor } from 'lucide-react';

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
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900/90 backdrop-blur-lg rounded-full px-6 py-4 flex items-center gap-4 shadow-2xl">
      <button
        onClick={onToggleAudio}
        className={`p-3 rounded-full transition-all ${
          isAudioEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
        }`}
      >
        {isAudioEnabled ? <Mic size={24} className="text-white" /> : <MicOff size={24} className="text-white" />}
      </button>

      <button
        onClick={onToggleVideo}
        className={`p-3 rounded-full transition-all ${
          isVideoEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
        }`}
      >
        {isVideoEnabled ? <Video size={24} className="text-white" /> : <VideoOff size={24} className="text-white" />}
      </button>

      <button
        onClick={onScreenShare}
        className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 transition-all"
      >
        <Monitor size={24} className="text-white" />
      </button>

      <button
        onClick={onToggleChat}
        className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 transition-all"
      >
        <MessageSquare size={24} className="text-white" />
      </button>

      <button
        onClick={onLeave}
        className="p-3 rounded-full bg-red-600 hover:bg-red-700 transition-all ml-2"
      >
        <PhoneOff size={24} className="text-white" />
      </button>
    </div>
  );
}
