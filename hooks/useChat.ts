'use client';

import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (!room) return;

    console.log('[useChat] Setting up chat');
    const [sendMsg, receiveMsg] = room.makeAction('chat');

    receiveMsg((msg: ChatMessage, peerId: string) => {
      console.log('[useChat] Received message from:', peerId, msg);
      setMessages((prev) => [...prev, { ...msg, peerId }]);
    });

    setSendMessage(() => (text: string) => {
      const msg: ChatMessage = {
        id: crypto.randomUUID(),
        peerId: 'me',
        text,
        timestamp: Date.now()
      };
      console.log('[useChat] Sending message:', msg);
      setMessages((prev) => [...prev, msg]);
      sendMsg(msg);
    });
  }, [room]);

  return { messages, sendMessage };
}
