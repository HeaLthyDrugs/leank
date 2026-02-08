'use client';

import React from 'react';
import { X, Trophy, Users, Shield, MicOff, VideoOff, Lock } from 'lucide-react';

interface HostPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export function HostPanel({ isOpen, onClose }: HostPanelProps) {
    if (!isOpen) return null;

    return (
        <div className="flex flex-col h-full bg-white animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 border-b-2 border-black bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Trophy size={20} className="text-black" />
                    <h3 className="font-bold uppercase tracking-wide">Host Controls</h3>
                </div>
                <button
                    onClick={onClose}
                    className="w-8 h-8 flex items-center justify-center border-2 border-transparent hover:bg-black hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Section: Participants */}
                <div>
                    <h4 className="text-xs font-bold uppercase text-gray-500 mb-2 flex items-center gap-2">
                        <Users size={12} />
                        Participants
                    </h4>
                    <div className="space-y-2">
                        <button className="w-full flex items-center justify-between p-3 border-2 border-black bg-white hover:bg-black hover:text-white transition-all group">
                            <span className="text-sm font-medium">Mute All</span>
                            <MicOff size={16} />
                        </button>
                        <button className="w-full flex items-center justify-between p-3 border-2 border-black bg-white hover:bg-black hover:text-white transition-all group">
                            <span className="text-sm font-medium">Stop All Video</span>
                            <VideoOff size={16} />
                        </button>
                    </div>
                </div>

                {/* Separator */}
                <div className="h-px bg-gray-200"></div>

                {/* Section: Security */}
                <div>
                    <h4 className="text-xs font-bold uppercase text-gray-500 mb-2 flex items-center gap-2">
                        <Shield size={12} />
                        Security
                    </h4>
                    <div className="space-y-2">
                        <button className="w-full flex items-center justify-between p-3 border-2 border-black bg-white hover:bg-black hover:text-white transition-all group">
                            <span className="text-sm font-medium">Lock Meeting</span>
                            <Lock size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer status */}
            <div className="p-2 bg-gray-100 border-t-2 border-black text-center">
                <p className="text-[10px] font-mono text-gray-500 uppercase">You are the host</p>
            </div>
        </div>
    );
}
