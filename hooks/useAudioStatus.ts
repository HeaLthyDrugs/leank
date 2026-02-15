'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Room } from 'trystero/torrent';

export interface PeerAudioStatus {
    isSpeaking: boolean;
    isMuted: boolean;
    lastUpdate: number;
}

const BROADCAST_INTERVAL = 100; // ms between broadcasts (~10/sec)
const STALE_TIMEOUT = 5000; // Consider audio status stale after 5s with no updates

/**
 * Hook that broadcasts local audio status (speaking/muted) to all peers
 * and receives their audio status updates via Trystero actions.
 */
export function useAudioStatus(
    room: Room | null,
    localIsSpeaking: boolean,
    localIsMuted: boolean
) {
    const [peerAudioStatuses, setPeerAudioStatuses] = useState<Map<string, PeerAudioStatus>>(new Map());

    const lastBroadcastRef = useRef<number>(0);
    const lastStatusRef = useRef<{ isSpeaking: boolean; isMuted: boolean }>({ isSpeaking: false, isMuted: false });
    const broadcastIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const sendFnRef = useRef<((data: unknown, peerId?: string) => void) | null>(null);

    // Broadcast local status to all peers (throttled)
    const broadcastStatus = useCallback((isSpeaking: boolean, isMuted: boolean) => {
        const now = Date.now();
        if (now - lastBroadcastRef.current < BROADCAST_INTERVAL) return;

        if (sendFnRef.current) {
            lastBroadcastRef.current = now;
            lastStatusRef.current = { isSpeaking, isMuted };
            sendFnRef.current({ isSpeaking, isMuted, timestamp: now });
        }
    }, []);

    // Set up the Trystero action for audio status
    useEffect(() => {
        if (!room) {
            sendFnRef.current = null;
            setPeerAudioStatuses(new Map());
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const [sendAudioStatus, receiveAudioStatus] = room.makeAction('audio-status') as unknown as [
            (data: any, peerId?: string) => void,
            (callback: (data: any, peerId: string) => void) => void
        ];

        sendFnRef.current = sendAudioStatus;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        receiveAudioStatus((data: any, peerId: string) => {
            setPeerAudioStatuses(prev => {
                const updated = new Map(prev);
                updated.set(peerId, {
                    isSpeaking: data.isSpeaking ?? false,
                    isMuted: data.isMuted ?? false,
                    lastUpdate: Date.now(),
                });
                return updated;
            });
        });

        // Periodically clean up stale statuses (peers that left without cleanup)
        cleanupIntervalRef.current = setInterval(() => {
            const now = Date.now();
            setPeerAudioStatuses(prev => {
                let changed = false;
                const updated = new Map(prev);
                updated.forEach((status, peerId) => {
                    if (now - status.lastUpdate > STALE_TIMEOUT) {
                        // Don't delete, just mark as not speaking
                        if (status.isSpeaking) {
                            updated.set(peerId, { ...status, isSpeaking: false });
                            changed = true;
                        }
                    }
                });
                return changed ? updated : prev;
            });
        }, STALE_TIMEOUT);

        return () => {
            sendFnRef.current = null;
            if (cleanupIntervalRef.current) {
                clearInterval(cleanupIntervalRef.current);
                cleanupIntervalRef.current = null;
            }
        };
    }, [room]);

    // Broadcast when local status changes
    useEffect(() => {
        const { isSpeaking: lastSpeaking, isMuted: lastMuted } = lastStatusRef.current;
        if (localIsSpeaking !== lastSpeaking || localIsMuted !== lastMuted) {
            broadcastStatus(localIsSpeaking, localIsMuted);
        }
    }, [localIsSpeaking, localIsMuted, broadcastStatus]);

    // Periodic heartbeat broadcast of current status
    useEffect(() => {
        broadcastIntervalRef.current = setInterval(() => {
            broadcastStatus(localIsSpeaking, localIsMuted);
        }, 1000); // Heartbeat every 1s

        return () => {
            if (broadcastIntervalRef.current) {
                clearInterval(broadcastIntervalRef.current);
                broadcastIntervalRef.current = null;
            }
        };
    }, [localIsSpeaking, localIsMuted, broadcastStatus]);

    return { peerAudioStatuses };
}
