'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Room } from 'trystero/torrent';

export interface ChatMessage {
  id: string;
  peerId: string;
  text: string;
  timestamp: number;
}

export interface TypingPeer {
  peerId: string;
  isTyping: boolean;
  lastUpdate: number;
}

export function useChat(room: Room | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sendMessage, setSendMessage] = useState<((text: string) => void) | null>(null);
  const [typingPeers, setTypingPeers] = useState<Map<string, TypingPeer>>(new Map());

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sendFunctionRef = useRef<((msg: any) => void) | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sendTypingFunctionRef = useRef<((status: any) => void) | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingBroadcastRef = useRef<number>(0);

  // Clean up stale typing indicators (older than 3 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingPeers(prev => {
        const updated = new Map(prev);
        let hasChanges = false;

        updated.forEach((peer, peerId) => {
          if (now - peer.lastUpdate > 3000) {
            updated.delete(peerId);
            hasChanges = true;
          }
        });

        return hasChanges ? updated : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Stable send message function that won't lose reference
  const handleSendMessage = useCallback((text: string) => {
    if (!sendFunctionRef.current) {
      console.log('[useChat] Cannot send - no send function available');
      return;
    }

    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      peerId: 'me',
      text,
      timestamp: Date.now()
    };

    console.log('[useChat] Sending message:', msg);
    setMessages((prev) => [...prev, msg]);
    sendFunctionRef.current(msg);

    // Clear typing status when message is sent
    if (sendTypingFunctionRef.current) {
      sendTypingFunctionRef.current({ isTyping: false });
    }
  }, []);

  // Broadcast typing status with throttling (max once per 500ms)
  const broadcastTypingStatus = useCallback((isTyping: boolean) => {
    if (!sendTypingFunctionRef.current) return;

    const now = Date.now();

    // Throttle typing broadcasts to avoid flooding
    if (isTyping && now - lastTypingBroadcastRef.current < 500) {
      return;
    }

    lastTypingBroadcastRef.current = now;
    sendTypingFunctionRef.current({ isTyping });

    // Auto-stop typing after 2 seconds of no activity
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        if (sendTypingFunctionRef.current) {
          sendTypingFunctionRef.current({ isTyping: false });
        }
      }, 2000);
    }
  }, []);

  useEffect(() => {
    if (!room) {
      console.log('[useChat] No room available, clearing send function');
      setSendMessage(null);
      sendFunctionRef.current = null;
      sendTypingFunctionRef.current = null;
      return;
    }

    console.log('[useChat] Setting up chat for room');

    // Create chat action
    const [sendMsg, receiveMsg] = room.makeAction('chat');

    // Create typing indicator action
    const [sendTyping, receiveTyping] = room.makeAction('typing');

    // Store send function references
    sendFunctionRef.current = sendMsg;
    sendTypingFunctionRef.current = sendTyping;

    // Set up send message handler
    setSendMessage(() => handleSendMessage);

    // Handle incoming messages
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    receiveMsg((msg: any, peerId: string) => {
      console.log('[useChat] Received message from:', peerId, msg);
      if (msg && typeof msg === 'object' && 'text' in msg) {
        setMessages((prev) => {
          // Prevent duplicate messages
          const exists = prev.some(m => m.id === msg.id);
          if (exists) return prev;
          return [...prev, { ...msg, peerId }];
        });

        // Clear typing status for this peer when they send a message
        setTypingPeers(prev => {
          if (prev.has(peerId)) {
            const updated = new Map(prev);
            updated.delete(peerId);
            return updated;
          }
          return prev;
        });
      }
    });

    // Handle typing status updates
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    receiveTyping((status: any, peerId: string) => {
      console.log('[useChat] Received typing status from:', peerId, status);
      if (status && typeof status === 'object' && 'isTyping' in status) {
        setTypingPeers(prev => {
          const updated = new Map(prev);

          if (status.isTyping) {
            updated.set(peerId, {
              peerId,
              isTyping: true,
              lastUpdate: Date.now()
            });
          } else {
            updated.delete(peerId);
          }

          return updated;
        });
      }
    });

    // Cleanup on room change
    return () => {
      console.log('[useChat] Cleaning up chat action');
      sendFunctionRef.current = null;
      sendTypingFunctionRef.current = null;
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [room, handleSendMessage]);

  return { messages, sendMessage, typingPeers, broadcastTypingStatus };
}
