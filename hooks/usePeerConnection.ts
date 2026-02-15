'use client';

import { useEffect, useRef } from 'react';
import { Room } from 'trystero/torrent';
import SimplePeer from 'simple-peer';
import { RTC_CONFIG } from '@/lib/rtc-config';

export function usePeerConnection(
  room: Room | null,
  localStream: MediaStream | null,
  onPeerStream: (peerId: string, stream: MediaStream) => void
) {
  const peersRef = useRef<Map<string, SimplePeer.Instance>>(new Map());

  // Function to replace tracks for all connected peers
  const replaceTrack = (oldTrack: MediaStreamTrack, newTrack: MediaStreamTrack, stream: MediaStream) => {
    console.log('[usePeerConnection] Replacing track for', peersRef.current.size, 'peers');
    peersRef.current.forEach((peer, peerId) => {
      try {
        console.log('[usePeerConnection] Replacing track for peer:', peerId);
        peer.replaceTrack(oldTrack, newTrack, stream);
      } catch (err) {
        console.error('[usePeerConnection] Failed to replace track for peer:', peerId, err);
      }
    });
  };

  useEffect(() => {
    if (!room) return;

    console.log('[usePeerConnection] Setting up peer connections, localStream:', !!localStream);
    // Cleanup any existing peers when room changes
    peersRef.current.forEach(peer => peer.destroy());
    peersRef.current.clear();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [sendSignal, receiveSignal] = room.makeAction('signal') as unknown as [(data: any, peerId?: string) => void, (callback: (data: any, peerId: string) => void) => void];

    room.onPeerJoin((peerId) => {
      console.log('[usePeerConnection] Peer joined, creating connection:', peerId);
      const peer = new SimplePeer({
        initiator: true,
        stream: localStream || undefined,
        config: RTC_CONFIG
      });

      peer.on('signal', (signal) => {
        console.log('[usePeerConnection] Sending signal to:', peerId);
        sendSignal(signal, peerId);
      });

      peer.on('stream', (stream) => {
        console.log('[usePeerConnection] Received stream from:', peerId);
        onPeerStream(peerId, stream);
      });

      peer.on('error', (err) => {
        console.error('[usePeerConnection] Peer error:', peerId, err);
      });

      peersRef.current.set(peerId, peer);
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    receiveSignal((signal: any, peerId: string) => {
      console.log('[usePeerConnection] Received signal from:', peerId);
      let peer = peersRef.current.get(peerId);

      if (!peer) {
        console.log('[usePeerConnection] Creating peer connection for:', peerId);
        peer = new SimplePeer({
          initiator: false,
          stream: localStream || undefined,
          config: RTC_CONFIG
        });

        peer.on('signal', (sig) => {
          console.log('[usePeerConnection] Sending response signal to:', peerId);
          sendSignal(sig, peerId);
        });

        peer.on('stream', (stream) => {
          console.log('[usePeerConnection] Received stream from:', peerId);
          onPeerStream(peerId, stream);
        });

        peer.on('error', (err) => {
          console.error('[usePeerConnection] Peer error:', peerId, err);
        });

        peersRef.current.set(peerId, peer);
      }

      peer.signal(signal);
    });

    room.onPeerLeave((peerId) => {
      const peer = peersRef.current.get(peerId);
      if (peer) {
        peer.destroy();
        peersRef.current.delete(peerId);
      }
    });

    return () => {
      peersRef.current.forEach(peer => peer.destroy());
      peersRef.current.clear();
    };
  }, [room, localStream, onPeerStream]);

  return { replaceTrack };
}
