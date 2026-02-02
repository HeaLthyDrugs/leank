'use client';

import { useState, useEffect, useCallback } from 'react';
import { joinRoom as joinRoomBT, Room } from 'trystero/torrent';
import { TRYSTERO_CONFIG } from '@/lib/trystero-config';

export interface Peer {
  id: string;
  stream?: MediaStream;
}

export function useRoom(roomId: string) {
  const [room, setRoom] = useState<Room | null>(null);
  const [peers, setPeers] = useState<Map<string, Peer>>(new Map());
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!roomId) return;

    console.log('[useRoom] Joining room:', roomId);

    const config = {
      appId: TRYSTERO_CONFIG.appId,
      rtcConfig: TRYSTERO_CONFIG.rtcConfig,
      trackerUrls: TRYSTERO_CONFIG.trackerUrls
    };

    const newRoom = joinRoomBT(config, roomId);
    console.log('[useRoom] Room object created');
    setRoom(newRoom);
    setIsConnected(true);

    newRoom.onPeerJoin((peerId) => {
      console.log('[useRoom] ✅ Peer joined:', peerId);
      setPeers((prev) => {
        const updated = new Map(prev);
        updated.set(peerId, { id: peerId });
        console.log('[useRoom] Total peers:', updated.size);
        return updated;
      });
    });

    newRoom.onPeerLeave((peerId) => {
      console.log('[useRoom] ❌ Peer left:', peerId);
      setPeers((prev) => {
        const updated = new Map(prev);
        updated.delete(peerId);
        console.log('[useRoom] Total peers:', updated.size);
        return updated;
      });
    });

    const [sendPresence, receivePresence] = newRoom.makeAction('presence');

    receivePresence((data, peerId) => {
      console.log('[useRoom] Presence from:', peerId);
    });

    const presenceInterval = setInterval(() => {
      sendPresence({ type: 'heartbeat', timestamp: Date.now() });
    }, 2000);

    sendPresence({ type: 'join', timestamp: Date.now() });

    return () => {
      clearInterval(presenceInterval);
      console.log('[useRoom] Leaving room');
      newRoom.leave();
      setIsConnected(false);
      setPeers(new Map());
    };
  }, [roomId]);

  const updatePeerStream = useCallback((peerId: string, stream: MediaStream) => {
    setPeers((prev) => {
      const updated = new Map(prev);
      const peer = updated.get(peerId);
      if (peer) {
        updated.set(peerId, { ...peer, stream });
      }
      return updated;
    });
  }, []);

  return { room, peers, isConnected, updatePeerStream };
}
