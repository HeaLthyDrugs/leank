'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Room } from 'trystero/torrent';

export interface ChatMessage {
  id: string;
  peerId: string;
  text: string;
  timestamp: number;
}

export function useChat(room: Room | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sendMessage, setSendMessage] = useState<((text: string) => void) | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sendFunctionRef = useRef<((msg: any) => void) | null>(null);
  const roomIdRef = useRef<string | null>(null);

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
  }, []);

  useEffect(() => {
    if (!room) {
      console.log('[useChat] No room available, clearing send function');
      setSendMessage(null);
      sendFunctionRef.current = null;
      return;
    }

    console.log('[useChat] Setting up chat for room');

    // Create chat action
    const [sendMsg, receiveMsg] = room.makeAction('chat');

    // Store send function reference
    sendFunctionRef.current = sendMsg;

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
      }
    });

    // Cleanup on room change
    return () => {
      console.log('[useChat] Cleaning up chat action');
      sendFunctionRef.current = null;
    };
  }, [room, handleSendMessage]);

  return { messages, sendMessage };
}

