'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { joinRoom as joinRoomBT, Room } from 'trystero/torrent';
import { TRYSTERO_CONFIG } from '@/lib/trystero-config';
import {
    clearRoomJoinTimestamp,
    getOrCreateParticipantSession,
    getOrCreateRoomJoinTimestamp,
    resolveRoomAuthority,
} from '@/lib/room-participants';
import type { ParticipantPresence, Peer, PresencePayload } from '@/types/room';

export type { ParticipantPresence, Peer } from '@/types/room';

interface RoomContextType {
    // Room state
    room: Room | null;
    roomId: string | null;
    peers: Map<string, Peer>;
    participantId: string;
    participantJoinedAt: number;
    authorityParticipantId: string | null;
    authorityPeerId: string | null;
    isAuthority: boolean;
    isConnected: boolean;
    isReconnecting: boolean;
    connectionAttempts: number;
    isHost: boolean;

    // Actions
    joinRoom: (roomId: string, forceReconnect?: boolean) => void;
    leaveRoom: () => void;
    updatePeerStream: (peerId: string, stream: MediaStream) => void;
    updatePeerAudioStatus: (peerId: string, isSpeaking: boolean, isMuted: boolean) => void;
    forceReconnect: () => void;
    setIsHost: (value: boolean) => void;
    mutePeer: (peerId: string) => void;
    unmutePeer: (peerId: string) => void;
    stopPeerVideo: (peerId: string) => void;
    removePeer: (peerId: string) => void;
    muteAllPeers: () => void;
    stopAllVideo: () => void;
}

const RoomContext = createContext<RoomContextType | null>(null);

const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_BASE_DELAY = 1000;
const HEARTBEAT_INTERVAL = 3000;
const SESSION_STORAGE_KEY = 'leank_current_room';
const PEER_TIMEOUT = 10000; // Consider peer disconnected if no heartbeat in 10s

export function RoomProvider({ children }: { children: React.ReactNode }) {
    const [room, setRoom] = useState<Room | null>(null);
    const [roomId, setRoomId] = useState<string | null>(null);
    const [peers, setPeers] = useState<Map<string, Peer>>(new Map());
    const [participantId, setParticipantId] = useState('');
    const [participantJoinedAt, setParticipantJoinedAt] = useState(0);
    const [isConnected, setIsConnected] = useState(false);
    const [isReconnecting, setIsReconnecting] = useState(false);
    const [connectionAttempts, setConnectionAttempts] = useState(0);
    const [isHost, setIsHost] = useState(false);

    const reconnectAttemptRef = useRef(0);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const presenceIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const currentRoomRef = useRef<Room | null>(null);
    const currentRoomIdRef = useRef<string | null>(null);
    const peerHeartbeatsRef = useRef<Map<string, number>>(new Map());
    const participantIdRef = useRef('');
    const participantJoinedAtRef = useRef(0);
    const isHostRef = useRef(false);
    const sendPresenceRef = useRef<((data: PresencePayload, peerId?: string) => void) | null>(null);
    const isInitializedRef = useRef(false);

    const ensureParticipantSession = useCallback((targetRoomId?: string) => {
        const session = getOrCreateParticipantSession();

        if (!participantIdRef.current || participantIdRef.current !== session.participantId) {
            participantIdRef.current = session.participantId;
            setParticipantId(session.participantId);
        }

        if (targetRoomId) {
            const joinedAt = getOrCreateRoomJoinTimestamp(targetRoomId);
            participantJoinedAtRef.current = joinedAt;
            setParticipantJoinedAt(joinedAt);

            return {
                participantId: session.participantId,
                joinedAt,
            };
        }

        return {
            participantId: session.participantId,
            joinedAt: participantJoinedAtRef.current,
        };
    }, []);

    const updatePeerPresence = useCallback((peerId: string, presence: PresencePayload) => {
        const lastSeenAt = Date.now();
        peerHeartbeatsRef.current.set(peerId, lastSeenAt);

        setPeers((prev) => {
            const updated = new Map(prev);

            for (const [existingPeerId, existingPeer] of updated.entries()) {
                if (
                    existingPeerId !== peerId &&
                    existingPeer.participantId === presence.participantId
                ) {
                    updated.delete(existingPeerId);
                    peerHeartbeatsRef.current.delete(existingPeerId);
                }
            }

            const existingPeer = updated.get(peerId);

            updated.set(peerId, {
                id: peerId,
                participantId: presence.participantId,
                joinedAt: presence.joinedAt,
                isHost: presence.isHost,
                lastSeenAt,
                stream: existingPeer?.stream,
                isMuted: existingPeer?.isMuted,
                isVideoStopped: existingPeer?.isVideoStopped,
                isSpeaking: existingPeer?.isSpeaking,
            });

            return updated;
        });
    }, []);

    const sendPresenceUpdate = useCallback((type: PresencePayload['type'], peerId?: string) => {
        if (!sendPresenceRef.current) {
            return;
        }

        const session = ensureParticipantSession();
        sendPresenceRef.current(
            {
                type,
                timestamp: Date.now(),
                participantId: session.participantId,
                isHost: isHostRef.current,
                joinedAt: session.joinedAt,
            },
            peerId,
        );
    }, [ensureParticipantSession]);

    // Cleanup function - doesn't clear sessionStorage by default
    const cleanup = useCallback((clearSession = false) => {
        console.log('[RoomContext] Cleaning up room connection, clearSession:', clearSession);

        if (presenceIntervalRef.current) {
            clearInterval(presenceIntervalRef.current);
            presenceIntervalRef.current = null;
        }

        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (currentRoomRef.current) {
            try {
                currentRoomRef.current.leave();
            } catch (e) {
                console.log('[RoomContext] Error leaving room:', e);
            }
            currentRoomRef.current = null;
        }

        if (clearSession && typeof window !== 'undefined') {
            sessionStorage.removeItem(SESSION_STORAGE_KEY);
            if (currentRoomIdRef.current) {
                clearRoomJoinTimestamp(currentRoomIdRef.current);
            }
        }

        sendPresenceRef.current = null;
        setRoom(null);
        setIsConnected(false);
        setPeers(new Map());
        peerHeartbeatsRef.current.clear();
    }, []);

    // Create room connection
    const createConnection = useCallback((targetRoomId: string): Room | null => {
        console.log('[RoomContext] Creating connection to room:', targetRoomId);
        const session = ensureParticipantSession(targetRoomId);
        setConnectionAttempts(prev => prev + 1);

        // Clean up existing connection first (without clearing session)
        if (currentRoomRef.current) {
            try {
                currentRoomRef.current.leave();
            } catch (e) {
                console.log('[RoomContext] Error leaving old room:', e);
            }
            currentRoomRef.current = null;
        }

        const config = {
            appId: TRYSTERO_CONFIG.appId,
            rtcConfig: TRYSTERO_CONFIG.rtcConfig,
            trackerUrls: TRYSTERO_CONFIG.trackerUrls
        };

        try {
            const newRoom = joinRoomBT(config, targetRoomId);
            console.log('[RoomContext] Room object created successfully');

            currentRoomRef.current = newRoom;
            currentRoomIdRef.current = targetRoomId;
            setRoom(newRoom);
            setRoomId(targetRoomId);
            setIsConnected(true);
            setIsReconnecting(false);
            reconnectAttemptRef.current = 0;

            // Store in sessionStorage for reload handling
            if (typeof window !== 'undefined') {
                sessionStorage.setItem(SESSION_STORAGE_KEY, targetRoomId);
            }

            // Handle peer join
            newRoom.onPeerJoin((peerId) => {
                console.log('[RoomContext] Peer joined:', peerId);
                peerHeartbeatsRef.current.set(peerId, Date.now());
                setPeers((prev) => {
                    const updated = new Map(prev);
                    const existingPeer = updated.get(peerId);

                    updated.set(peerId, {
                        id: peerId,
                        participantId: existingPeer?.participantId ?? null,
                        joinedAt: existingPeer?.joinedAt ?? null,
                        isHost: existingPeer?.isHost ?? false,
                        lastSeenAt: Date.now(),
                        stream: existingPeer?.stream,
                        isMuted: existingPeer?.isMuted,
                        isVideoStopped: existingPeer?.isVideoStopped,
                        isSpeaking: existingPeer?.isSpeaking,
                    });

                    console.log('[RoomContext] Total peers:', updated.size);
                    return updated;
                });

                window.setTimeout(() => {
                    sendPresenceUpdate('announce', peerId);
                }, 150);
            });

            // Handle peer leave
            newRoom.onPeerLeave((peerId) => {
                console.log('[RoomContext] Peer left:', peerId);
                peerHeartbeatsRef.current.delete(peerId);
                setPeers((prev) => {
                    const updated = new Map(prev);
                    updated.delete(peerId);
                    console.log('[RoomContext] Total peers:', updated.size);
                    return updated;
                });
            });

            // Setup presence heartbeat
            const [sendPresence, receivePresence] = newRoom.makeAction('presence') as unknown as [
                (data: PresencePayload, peerId?: string) => void,
                (callback: (data: PresencePayload, peerId: string) => void) => void
            ];

            sendPresenceRef.current = sendPresence;

            receivePresence((data: PresencePayload, peerId: string) => {
                if (
                    !data ||
                    typeof data.participantId !== 'string' ||
                    typeof data.joinedAt !== 'number' ||
                    typeof data.isHost !== 'boolean'
                ) {
                    return;
                }

                updatePeerPresence(peerId, data);
            });

            // Send initial presence immediately
            sendPresence({
                type: 'join',
                timestamp: Date.now(),
                participantId: session.participantId,
                isHost: isHostRef.current,
                joinedAt: session.joinedAt,
            });

            // Also send after a short delay to ensure peers receive it
            window.setTimeout(() => {
                sendPresence({
                    type: 'announce',
                    timestamp: Date.now(),
                    participantId: session.participantId,
                    isHost: isHostRef.current,
                    joinedAt: session.joinedAt,
                });
            }, 500);

            // Periodic heartbeat with peer cleanup
            presenceIntervalRef.current = setInterval(() => {
                sendPresenceUpdate('heartbeat');

                // Check for stale peers
                const now = Date.now();
                peerHeartbeatsRef.current.forEach((lastSeen, peerId) => {
                    if (now - lastSeen > PEER_TIMEOUT) {
                        console.log('[RoomContext] Peer timed out:', peerId);
                        peerHeartbeatsRef.current.delete(peerId);
                        setPeers((prev) => {
                            const updated = new Map(prev);
                            updated.delete(peerId);
                            return updated;
                        });
                    }
                });
            }, HEARTBEAT_INTERVAL);

            return newRoom;
        } catch (error) {
            console.error('[RoomContext] Failed to create room connection:', error);
            setIsConnected(false);
            return null;
        }
    }, [ensureParticipantSession, sendPresenceUpdate, updatePeerPresence]);

    // Attempt reconnection with exponential backoff
    const attemptReconnect = useCallback(function retryConnection(targetRoomId: string) {
        const attempt = reconnectAttemptRef.current;

        if (attempt >= MAX_RECONNECT_ATTEMPTS) {
            console.log('[RoomContext] Max reconnection attempts reached, will try again on user action');
            setIsReconnecting(false);
            return;
        }

        // Exponential backoff with jitter
        const delay = Math.min(RECONNECT_BASE_DELAY * Math.pow(1.5, attempt) + Math.random() * 1000, 30000);
        console.log(`[RoomContext] Attempting reconnection in ${Math.round(delay)}ms (attempt ${attempt + 1}/${MAX_RECONNECT_ATTEMPTS})`);

        setIsReconnecting(true);

        reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptRef.current++;
            setConnectionAttempts(prev => prev + 1);
            const newRoom = createConnection(targetRoomId);

            if (!newRoom) {
                retryConnection(targetRoomId);
            }
        }, delay);
    }, [createConnection]);

    // Force reconnect
    const forceReconnect = useCallback(() => {
        const targetRoomId = currentRoomIdRef.current || roomId;
        if (targetRoomId) {
            console.log('[RoomContext] Force reconnecting to:', targetRoomId);
            reconnectAttemptRef.current = 0;
            cleanup(false); // Don't clear session
            createConnection(targetRoomId);
        }
    }, [roomId, cleanup, createConnection]);

    // Join a room
    const joinRoom = useCallback((newRoomId: string, forceReconnect = false) => {
        console.log('[RoomContext] joinRoom called with:', newRoomId, 'force:', forceReconnect);
        ensureParticipantSession(newRoomId);

        // If already in this room and connected, don't rejoin unless forced
        if (!forceReconnect && roomId === newRoomId && isConnected && currentRoomRef.current) {
            console.log('[RoomContext] Already connected to this room');
            return;
        }

        // If already in this room but not connected, reconnect
        if (roomId === newRoomId && !isConnected) {
            console.log('[RoomContext] Room ID matches but not connected, reconnecting');
            createConnection(newRoomId);
            return;
        }

        // If different room, cleanup first (but don't clear session yet)
        if (roomId && roomId !== newRoomId) {
            cleanup(false);
        }

        currentRoomIdRef.current = newRoomId;
        createConnection(newRoomId);
    }, [roomId, isConnected, cleanup, createConnection, ensureParticipantSession]);

    // Leave room explicitly
    const leaveRoom = useCallback(() => {
        console.log('[RoomContext] leaveRoom called');
        currentRoomIdRef.current = null;
        cleanup(true); // Clear session storage
        setRoomId(null);
    }, [cleanup]);

    // Update peer stream
    const updatePeerStream = useCallback((peerId: string, stream: MediaStream) => {
        setPeers((prev) => {
            const updated = new Map(prev);
            const peer = updated.get(peerId);
            if (peer) {
                updated.set(peerId, { ...peer, stream });
            } else {
                // Add peer if not exists
                updated.set(peerId, {
                    id: peerId,
                    participantId: null,
                    joinedAt: null,
                    isHost: false,
                    lastSeenAt: Date.now(),
                    stream,
                });
            }
            return updated;
        });
    }, []);

    // Update peer audio status (speaking / muted)
    const updatePeerAudioStatus = useCallback((peerId: string, isSpeaking: boolean, isMuted: boolean) => {
        setPeers((prev) => {
            const peer = prev.get(peerId);
            if (!peer) return prev;
            // Only update if values actually changed to avoid unnecessary re-renders
            if (peer.isSpeaking === isSpeaking && peer.isMuted === isMuted) return prev;
            const updated = new Map(prev);
            updated.set(peerId, { ...peer, isSpeaking, isMuted });
            return updated;
        });
    }, []);

    // Initialize from sessionStorage on mount
    useEffect(() => {
        if (isInitializedRef.current) return;
        isInitializedRef.current = true;
        ensureParticipantSession();

        if (typeof window !== 'undefined') {
            const savedRoomId = sessionStorage.getItem(SESSION_STORAGE_KEY);
            if (savedRoomId) {
                console.log('[RoomContext] Restoring room from session on mount:', savedRoomId);
                currentRoomIdRef.current = savedRoomId;
                setRoomId(savedRoomId);
                createConnection(savedRoomId);
            }
        }
    }, [createConnection, ensureParticipantSession]);

    useEffect(() => {
        isHostRef.current = isHost;

        if (room && participantId) {
            sendPresenceUpdate('announce');
        }
    }, [isHost, room, participantId, sendPresenceUpdate]);

    // Handle online/offline events
    useEffect(() => {
        const handleOnline = () => {
            console.log('[RoomContext] Network online');
            const targetRoomId = currentRoomIdRef.current;
            if (targetRoomId && !isConnected) {
                console.log('[RoomContext] Network back, reconnecting');
                reconnectAttemptRef.current = 0;
                attemptReconnect(targetRoomId);
            }
        };

        const handleOffline = () => {
            console.log('[RoomContext] Network offline');
            setIsConnected(false);
            setIsReconnecting(true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [isConnected, attemptReconnect]);

    // Handle page visibility changes for reconnection
    useEffect(() => {
        const handleVisibilityChange = () => {
            const targetRoomId = currentRoomIdRef.current;
            if (document.visibilityState === 'visible' && targetRoomId) {
                if (!isConnected || !currentRoomRef.current) {
                    console.log('[RoomContext] Page visible, reconnecting');
                    reconnectAttemptRef.current = 0;
                    attemptReconnect(targetRoomId);
                } else {
                    sendPresenceUpdate('visible');
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [isConnected, attemptReconnect, sendPresenceUpdate]);

    // Handle beforeunload - save state
    useEffect(() => {
        const handleBeforeUnload = () => {
            // Session storage is already being maintained, just log
            console.log('[RoomContext] Page unloading, room saved in session:', currentRoomIdRef.current);
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);

    // Periodic connection health check
    useEffect(() => {
        const healthCheckInterval = setInterval(() => {
            const targetRoomId = currentRoomIdRef.current;

            if (targetRoomId && !isConnected && !isReconnecting) {
                console.log('[RoomContext] Health check: not connected, attempting reconnect');
                reconnectAttemptRef.current = 0;
                attemptReconnect(targetRoomId);
            }
        }, 5000);

        return () => clearInterval(healthCheckInterval);
    }, [isConnected, isReconnecting, attemptReconnect]);

    // Cleanup on unmount (but don't clear session)
    useEffect(() => {
        return () => {
            if (presenceIntervalRef.current) {
                clearInterval(presenceIntervalRef.current);
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            // Don't call full cleanup or leave room - we want to keep session for reload
        };
    }, []);

    // Host management functions
    const mutePeer = useCallback((peerId: string) => {
        console.log('[RoomContext] Muting peer:', peerId);
        if (!currentRoomRef.current) return;

        try {
            const [sendHostCommand] = currentRoomRef.current.makeAction('host-command');
            sendHostCommand({ type: 'mute', targetPeerId: peerId }, peerId);

            // Update local state
            setPeers((prev) => {
                const updated = new Map(prev);
                const peer = updated.get(peerId);
                if (peer) {
                    updated.set(peerId, { ...peer, isMuted: true });
                }
                return updated;
            });
        } catch (e) {
            console.error('[RoomContext] Error muting peer:', e);
        }
    }, []);

    const unmutePeer = useCallback((peerId: string) => {
        console.log('[RoomContext] Unmuting peer:', peerId);
        if (!currentRoomRef.current) return;

        try {
            const [sendHostCommand] = currentRoomRef.current.makeAction('host-command');
            sendHostCommand({ type: 'unmute', targetPeerId: peerId }, peerId);

            setPeers((prev) => {
                const updated = new Map(prev);
                const peer = updated.get(peerId);
                if (peer) {
                    updated.set(peerId, { ...peer, isMuted: false });
                }
                return updated;
            });
        } catch (e) {
            console.error('[RoomContext] Error unmuting peer:', e);
        }
    }, []);

    const stopPeerVideo = useCallback((peerId: string) => {
        console.log('[RoomContext] Stopping video for peer:', peerId);
        if (!currentRoomRef.current) return;

        try {
            const [sendHostCommand] = currentRoomRef.current.makeAction('host-command');
            sendHostCommand({ type: 'stop-video', targetPeerId: peerId }, peerId);

            setPeers((prev) => {
                const updated = new Map(prev);
                const peer = updated.get(peerId);
                if (peer) {
                    updated.set(peerId, { ...peer, isVideoStopped: true });
                }
                return updated;
            });
        } catch (e) {
            console.error('[RoomContext] Error stopping peer video:', e);
        }
    }, []);

    const removePeer = useCallback((peerId: string) => {
        console.log('[RoomContext] Removing peer:', peerId);
        if (!currentRoomRef.current) return;

        try {
            const [sendHostCommand] = currentRoomRef.current.makeAction('host-command');
            sendHostCommand({ type: 'kick', targetPeerId: peerId }, peerId);

            // Remove from local state after a brief delay to allow the command to be sent
            setTimeout(() => {
                peerHeartbeatsRef.current.delete(peerId);
                setPeers((prev) => {
                    const updated = new Map(prev);
                    updated.delete(peerId);
                    return updated;
                });
            }, 500);
        } catch (e) {
            console.error('[RoomContext] Error removing peer:', e);
        }
    }, []);

    const muteAllPeers = useCallback(() => {
        console.log('[RoomContext] Muting all peers');
        peers.forEach((_, peerId) => {
            mutePeer(peerId);
        });
    }, [peers, mutePeer]);

    const stopAllVideo = useCallback(() => {
        console.log('[RoomContext] Stopping all video');
        peers.forEach((_, peerId) => {
            stopPeerVideo(peerId);
        });
    }, [peers, stopPeerVideo]);

    const authority = useMemo(() => {
        if (!participantId || !participantJoinedAt) {
            return null;
        }

        const remoteParticipants: ParticipantPresence[] = Array.from(peers.values())
            .filter((peer): peer is Peer & { participantId: string; joinedAt: number; lastSeenAt: number } =>
                Boolean(peer.participantId) &&
                typeof peer.joinedAt === 'number' &&
                typeof peer.lastSeenAt === 'number',
            )
            .map((peer) => ({
                participantId: peer.participantId,
                transportId: peer.id,
                joinedAt: peer.joinedAt,
                isHost: peer.isHost,
                lastSeenAt: peer.lastSeenAt,
            }));

        return resolveRoomAuthority(
            {
                participantId,
                transportId: null,
                joinedAt: participantJoinedAt,
                isHost,
                lastSeenAt: participantJoinedAt,
            },
            remoteParticipants,
        );
    }, [isHost, participantId, participantJoinedAt, peers]);

    const value: RoomContextType = {
        room,
        roomId,
        peers,
        participantId,
        participantJoinedAt,
        authorityParticipantId: authority?.participantId ?? null,
        authorityPeerId: authority?.transportId ?? null,
        isAuthority: authority?.participantId === participantId,
        isConnected,
        isReconnecting,
        connectionAttempts,
        isHost,
        joinRoom,
        leaveRoom,
        updatePeerStream,
        updatePeerAudioStatus,
        forceReconnect,
        setIsHost,
        mutePeer,
        unmutePeer,
        stopPeerVideo,
        removePeer,
        muteAllPeers,
        stopAllVideo
    };

    return (
        <RoomContext.Provider value={value}>
            {children}
        </RoomContext.Provider>
    );
}

export function useRoomContext() {
    const context = useContext(RoomContext);
    if (!context) {
        throw new Error('useRoomContext must be used within a RoomProvider');
    }
    return context;
}
