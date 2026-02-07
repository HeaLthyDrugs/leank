'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { joinRoom as joinRoomBT, Room } from 'trystero/torrent';
import { TRYSTERO_CONFIG } from '@/lib/trystero-config';

export interface Peer {
    id: string;
    stream?: MediaStream;
}

interface RoomContextType {
    // Room state
    room: Room | null;
    roomId: string | null;
    peers: Map<string, Peer>;
    isConnected: boolean;
    isRoomLocked:boolean;
    isReconnecting: boolean;
    connectionAttempts: number;

    // Actions
    setIsRoomLocked: React.Dispatch<React.SetStateAction<boolean>>;
    joinRoom: (roomId: string, forceReconnect?: boolean) => void;
    leaveRoom: () => void;
    updatePeerStream: (peerId: string, stream: MediaStream) => void;
    forceReconnect: () => void;
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
    const [isConnected, setIsConnected] = useState(false);
    const [isReconnecting, setIsReconnecting] = useState(false);
    const [isRoomLocked, setIsRoomLocked] = useState(false);
    const [connectionAttempts, setConnectionAttempts] = useState(0);

    const reconnectAttemptRef = useRef(0);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const presenceIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const currentRoomRef = useRef<Room | null>(null);
    const currentRoomIdRef = useRef<string | null>(null);
    const peerHeartbeatsRef = useRef<Map<string, number>>(new Map());
    const isInitializedRef = useRef(false);

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
        }

        setRoom(null);
        setIsConnected(false);
        setPeers(new Map());
        peerHeartbeatsRef.current.clear();
    }, []);

    // Create room connection
    const createConnection = useCallback((targetRoomId: string): Room | null => {
        console.log('[RoomContext] Creating connection to room:', targetRoomId);
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
                console.log('[RoomContext] ✅ Peer joined:', peerId);
                peerHeartbeatsRef.current.set(peerId, Date.now());
                setPeers((prev) => {
                    const updated = new Map(prev);
                    updated.set(peerId, { id: peerId });
                    console.log('[RoomContext] Total peers:', updated.size);
                    return updated;
                });
            });

            // Handle peer leave
            newRoom.onPeerLeave((peerId) => {
                console.log('[RoomContext] ❌ Peer left:', peerId);
                peerHeartbeatsRef.current.delete(peerId);
                setPeers((prev) => {
                    const updated = new Map(prev);
                    updated.delete(peerId);
                    console.log('[RoomContext] Total peers:', updated.size);
                    return updated;
                });
            });

            // Setup presence heartbeat
            const [sendPresence, receivePresence] = newRoom.makeAction('presence');

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            receivePresence((data: any, peerId: string) => {
                peerHeartbeatsRef.current.set(peerId, Date.now());

                // If we receive presence from a peer we don't know, add them
                setPeers((prev) => {
                    if (!prev.has(peerId)) {
                        console.log('[RoomContext] Adding peer from presence:', peerId);
                        const updated = new Map(prev);
                        updated.set(peerId, { id: peerId });
                        return updated;
                    }
                    return prev;
                });
            });

            // Send initial presence immediately
            sendPresence({ type: 'join', peerId: 'me', timestamp: Date.now() });

            // Also send after a short delay to ensure peers receive it
            setTimeout(() => {
                sendPresence({ type: 'announce', peerId: 'me', timestamp: Date.now() });
            }, 500);

            // Periodic heartbeat with peer cleanup
            presenceIntervalRef.current = setInterval(() => {
                sendPresence({ type: 'heartbeat', peerId: 'me', timestamp: Date.now() });

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
    }, []);

    // Attempt reconnection with exponential backoff
    const attemptReconnect = useCallback((targetRoomId: string) => {
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
                attemptReconnect(targetRoomId);
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
    }, [roomId, isConnected, cleanup, createConnection]);

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
                updated.set(peerId, { id: peerId, stream });
            }
            return updated;
        });
    }, []);

    // Initialize from sessionStorage on mount
    useEffect(() => {
        if (isInitializedRef.current) return;
        isInitializedRef.current = true;

        if (typeof window !== 'undefined') {
            const savedRoomId = sessionStorage.getItem(SESSION_STORAGE_KEY);
            if (savedRoomId) {
                console.log('[RoomContext] Restoring room from session on mount:', savedRoomId);
                currentRoomIdRef.current = savedRoomId;
                setRoomId(savedRoomId);
                createConnection(savedRoomId);
            }
        }
    }, [createConnection]);

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
                    // Send presence to announce we're back
                    if (currentRoomRef.current) {
                        try {
                            const [sendPresence] = currentRoomRef.current.makeAction('presence');
                            sendPresence({ type: 'visible', peerId: 'me', timestamp: Date.now() });
                        } catch (e) {
                            console.log('[RoomContext] Error sending visibility presence');
                        }
                    }
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [isConnected, attemptReconnect]);

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

    const value: RoomContextType = {
        room,
        roomId,
        peers,
        isRoomLocked,
        isConnected,
        isReconnecting,
        connectionAttempts,
        setIsRoomLocked,
        joinRoom,
        leaveRoom,
        updatePeerStream,
        forceReconnect
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
