'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '@/hooks/useChat';
import { FileTransfer } from '@/hooks/useFileShare';
import { Send, Paperclip, Download } from 'lucide-react';
import { formatBytes } from '@/lib/utils';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: ((text: string) => void) | null;
  transfers: FileTransfer[];
  onSendFile: ((file: File) => void) | null;
}

export function ChatPanel({ messages, onSendMessage, transfers, onSendFile }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (input.trim() && onSendMessage) {
      console.log('[ChatPanel] Sending message:', input.trim());
      onSendMessage(input.trim());
      setInput('');
    } else {
      console.log('[ChatPanel] Cannot send - input:', input, 'onSendMessage:', !!onSendMessage);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onSendFile) {
      onSendFile(file);
      e.target.value = '';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-lg">Chat</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && transfers.length === 0 && (
          <p className="text-center text-gray-500 text-sm">No messages yet. Start chatting!</p>
        )}
        {[...messages.map(m => ({ type: 'message' as const, data: m, time: m.timestamp })),
          ...transfers.map(t => ({ type: 'file' as const, data: t, time: Date.now() }))]
          .sort((a, b) => a.time - b.time)
          .map((item) => {
            if (item.type === 'message') {
              const msg = item.data as ChatMessage;
              return (
                <div
                  key={msg.id}
                  className={`flex ${msg.peerId === 'me' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      msg.peerId === 'me'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                    <span className="text-xs opacity-70">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              );
            } else {
              const transfer = item.data as FileTransfer;
              return (
                <div
                  key={transfer.id}
                  className={`flex ${transfer.peerId === 'me' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      transfer.peerId === 'me'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-300 text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Paperclip size={16} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{transfer.name}</p>
                        <p className="text-xs opacity-70">{formatBytes(transfer.size)}</p>
                      </div>
                      {transfer.peerId !== 'me' && transfer.progress === 100 && (
                        <Download size={16} className="cursor-pointer" />
                      )}
                    </div>
                  </div>
                </div>
              );
            }
          })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <label className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 cursor-pointer flex items-center">
            <Paperclip size={20} />
            <input type="file" onChange={handleFileSelect} className="hidden" />
          </label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
