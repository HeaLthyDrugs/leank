'use client';

import React, { useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'danger';
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'default'
}: ConfirmModalProps) {
    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const isDanger = variant === 'danger';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md mx-4 bg-white border-2 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                {/* Header */}
                <div className={`p-4 border-b-2 border-black flex items-center justify-between ${isDanger ? 'bg-red-50' : 'bg-gray-50'
                    }`}>
                    <div className="flex items-center gap-3">
                        {isDanger && (
                            <div className="w-8 h-8 bg-red-100 border-2 border-red-600 flex items-center justify-center">
                                <AlertTriangle size={18} className="text-red-600" />
                            </div>
                        )}
                        <h3 className="font-bold uppercase tracking-wide text-lg">{title}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center border-2 border-transparent hover:border-black hover:bg-black hover:text-white transition-all"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <p className="text-gray-700 leading-relaxed">{message}</p>
                </div>

                {/* Footer */}
                <div className="p-4 border-t-2 border-black bg-gray-50 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 border-2 border-black bg-white text-black font-bold uppercase text-sm tracking-wide hover:bg-black hover:text-white transition-all"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`px-5 py-2.5 border-2 font-bold uppercase text-sm tracking-wide transition-all ${isDanger
                                ? 'border-red-600 bg-red-600 text-white hover:bg-white hover:text-red-600'
                                : 'border-black bg-black text-white hover:bg-white hover:text-black'
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
