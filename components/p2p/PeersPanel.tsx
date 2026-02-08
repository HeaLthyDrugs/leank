'use client';

import React, { useState } from 'react';
import { X, Users, UserPlus, Copy, Check, QrCode } from 'lucide-react';
import { Peer } from '@/contexts/RoomContext';
import { QRCodeSVG } from 'qrcode.react';

interface PeersPanelProps {
    isOpen: boolean;
    onClose: () => void;
    peers: Map<string, Peer>;
    roomId: string;
}

export function PeersPanel({
    isOpen,
    onClose,
    peers,
    roomId
}: PeersPanelProps) {
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const peerList = Array.from(peers.entries());
    const roomLink = typeof window !== 'undefined'
        ? `${window.location.origin}/lobby/${roomId}`
        : '';

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <>
            <div className="flex flex-col h-full bg-white animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="p-4 border-b-2 border-black bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users size={20} className="text-black" />
                        <h3 className="font-bold uppercase tracking-wide">Peers</h3>
                        <span className="text-xs font-mono bg-black text-white px-2 py-0.5">
                            {peerList.length + 1}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center border-2 border-transparent hover:bg-black hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {/* You (current user) */}
                    <div className="p-3 border-2 border-black bg-black text-white">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white text-black flex items-center justify-center font-bold text-sm border-2 border-white">
                                YOU
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold">You</p>
                                <p className="text-[10px] font-mono text-gray-300 uppercase">
                                    Connected
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Connected Peers */}
                    {peerList.length === 0 ? (
                        <div className="p-6 border-2 border-dashed border-gray-300 text-center">
                            <Users size={32} className="mx-auto mb-3 text-gray-300" />
                            <p className="text-sm text-gray-500 font-medium">No other peers yet</p>
                            <p className="text-xs text-gray-400 font-mono mt-1">
                                Invite someone to join!
                            </p>
                        </div>
                    ) : (
                        peerList.map(([peerId, peer]) => {
                            const displayName = `Peer ${peerId.slice(0, 6).toUpperCase()}`;
                            return (
                                <div
                                    key={peerId}
                                    className="p-3 border-2 border-black bg-white hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-100 text-black flex items-center justify-center font-bold text-xs border-2 border-black">
                                            {peerId.slice(0, 2).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold truncate">{displayName}</p>
                                            <p className="text-[10px] font-mono text-green-600 uppercase flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                                Connected
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Invite Button */}
                <div className="p-4 border-t-2 border-black">
                    <button
                        onClick={() => setShowInviteModal(true)}
                        className="w-full flex items-center justify-center gap-2 p-3 border-2 border-black bg-black text-white font-bold uppercase text-sm tracking-wide hover:bg-white hover:text-black transition-all"
                    >
                        <UserPlus size={18} />
                        Invite Peer
                    </button>
                </div>
            </div>

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={() => setShowInviteModal(false)}
                    />

                    {/* Modal */}
                    <div className="relative w-full max-w-md mx-4 bg-white border-2 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                        {/* Header */}
                        <div className="p-4 border-b-2 border-black bg-gray-50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <UserPlus size={20} className="text-black" />
                                <h3 className="font-bold uppercase tracking-wide">Invite Peer</h3>
                            </div>
                            <button
                                onClick={() => setShowInviteModal(false)}
                                className="w-8 h-8 flex items-center justify-center border-2 border-transparent hover:border-black hover:bg-black hover:text-white transition-all"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-6">
                            {/* QR Code */}
                            <div className="flex flex-col items-center">
                                <div className="p-3 border-2 border-black bg-white">
                                    <QRCodeSVG value={roomLink} size={160} />
                                </div>
                                <p className="text-xs font-mono text-gray-500 mt-2 flex items-center gap-1">
                                    <QrCode size={12} />
                                    Scan to join
                                </p>
                            </div>

                            {/* Room Link */}
                            <div>
                                <label className="block text-xs font-bold uppercase mb-2">
                                    Room Link
                                </label>
                                <div className="flex">
                                    <input
                                        type="text"
                                        value={roomLink}
                                        readOnly
                                        className="flex-1 px-4 py-2.5 border-2 border-black border-r-0 text-xs font-mono bg-gray-50 outline-none"
                                    />
                                    <button
                                        onClick={() => copyToClipboard(roomLink)}
                                        className="px-4 py-2.5 bg-black text-white hover:bg-gray-800 transition-colors border-2 border-black flex items-center gap-2"
                                    >
                                        {copied ? <Check size={16} /> : <Copy size={16} />}
                                        <span className="text-xs font-bold uppercase">
                                            {copied ? 'Copied!' : 'Copy'}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* Room ID */}
                            <div>
                                <label className="block text-xs font-bold uppercase mb-2">
                                    Room ID
                                </label>
                                <div className="flex">
                                    <input
                                        type="text"
                                        value={roomId}
                                        readOnly
                                        className="flex-1 px-4 py-2.5 border-2 border-black border-r-0 text-xs font-mono bg-gray-50 outline-none"
                                    />
                                    <button
                                        onClick={() => copyToClipboard(roomId)}
                                        className="px-4 py-2.5 bg-black text-white hover:bg-gray-800 transition-colors border-2 border-black"
                                    >
                                        {copied ? <Check size={16} /> : <Copy size={16} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t-2 border-black bg-gray-50">
                            <p className="text-[10px] font-mono text-gray-500 text-center uppercase">
                                Share this link with anyone you want to invite
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
