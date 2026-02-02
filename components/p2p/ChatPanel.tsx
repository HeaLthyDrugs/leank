'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '@/hooks/useChat';
import { FileTransfer } from '@/hooks/useFileShare';
import { Send, Paperclip, Download, MessageSquare } from 'lucide-react';
import { formatBytes } from '@/lib/utils';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: ((text: string) => void) | null;
  transfers: FileTransfer[];
  onSendFile: ((file: File) => void) | null;
  onClose?: () => void;
}

export function ChatPanel({ messages, onSendMessage, transfers, onSendFile, onClose }: ChatPanelProps) {
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
      <div className="p-4 border-b-2 border-black bg-gray-50 flex items-center justify-between">
        <h3 className="font-bold text-lg uppercase tracking-wide text-black">Discovery Chat</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden px-3 py-1 bg-black text-white text-xs font-bold uppercase hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && transfers.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 font-mono text-xs uppercase">
            <MessageSquare size={32} className="mb-2 opacity-20" />
            <p>No messages yet</p>
          </div>
        )}
        {[...messages.map(m => ({ type: 'message' as const, data: m, time: m.timestamp })),
        ...transfers.map(t => ({ type: 'file' as const, data: t, time: Date.now() }))]
          .sort((a, b) => a.time - b.time)
          .map((item) => {
            if (item.type === 'message') {
              const msg = item.data as ChatMessage;
              const isMe = msg.peerId === 'me';
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-3 border-2 border-black overflow-hidden ${isMe
                      ? 'bg-black text-white'
                      : 'bg-white text-black'
                      }`}
                  >
                    <p className="text-sm font-medium break-words whitespace-pre-wrap">{msg.text}</p>
                    <span className={`text-[10px] font-mono block mt-1 ${isMe ? 'text-gray-400' : 'text-gray-500'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              );
            } else {
              const transfer = item.data as FileTransfer;
              const isMe = transfer.peerId === 'me';
              return (
                <div
                  key={transfer.id}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-3 border-2 border-black ${isMe
                      ? 'bg-gray-100 text-black'
                      : 'bg-white text-black'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <Paperclip size={18} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{transfer.name}</p>
                        <p className="text-[10px] font-mono uppercase">{formatBytes(transfer.size)}</p>
                      </div>
                      {!isMe && transfer.progress === 100 && (
                        <button className="p-1 hover:bg-black hover:text-white transition-colors border border-black">
                          <Download size={16} />
                        </button>
                      )}
                    </div>
                    {transfer.progress < 100 && (
                      <div className="mt-2 h-1 w-full bg-gray-200">
                        <div
                          className="h-full bg-black transition-all duration-300"
                          style={{ width: `${transfer.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            }
          })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t-2 border-black bg-gray-50">
        <div className="flex gap-2">
          <label className="w-12 h-12 flex items-center justify-center border-2 border-black bg-white text-black hover:bg-black hover:text-white cursor-pointer transition-all">
            <Paperclip size={20} />
            <input type="file" onChange={handleFileSelect} className="hidden" />
          </label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="TYPE MESSAGE..."
            className="flex-1 px-4 border-2 border-black bg-white focus:outline-none focus:bg-white font-mono text-sm placeholder:text-gray-400"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-12 h-12 flex items-center justify-center border-2 border-black bg-black text-white hover:bg-white hover:text-black disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
