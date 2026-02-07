'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage } from '@/hooks/useChat';
import { FileTransfer } from '@/hooks/useFileShare';
import { Send, Paperclip, Download, MessageSquare, Maximize2, Minimize2, X } from 'lucide-react';
import { formatBytes } from '@/lib/utils';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: ((text: string) => void) | null;
  transfers: FileTransfer[];
  onSendFile: ((file: File, message?: string) => void) | null;
  onClose?: () => void;
  typingPeers?: Map<string, { peerId: string; isTyping: boolean }>;
  onTypingChange?: (isTyping: boolean) => void;
}

export function ChatPanel({
  messages,
  onSendMessage,
  transfers,
  onSendFile,
  onClose,
  typingPeers,
  onTypingChange
}: ChatPanelProps) {
  const [input, setInput] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingFilePreview, setPendingFilePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wasTypingRef = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, transfers]);

  // Clean up preview URL when component unmounts or file changes
  useEffect(() => {
    return () => {
      if (pendingFilePreview) {
        URL.revokeObjectURL(pendingFilePreview);
      }
    };
  }, [pendingFilePreview]);

  // Handle typing status changes
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInput(newValue);

    // Broadcast typing status
    if (onTypingChange) {
      const isNowTyping = newValue.trim().length > 0;

      // Only broadcast if status changed or we're still typing
      if (isNowTyping !== wasTypingRef.current || isNowTyping) {
        onTypingChange(isNowTyping);
        wasTypingRef.current = isNowTyping;
      }
    }
  }, [onTypingChange]);

  const handleSend = () => {
    const hasText = input.trim();
    const hasFile = pendingFile;

    // Clear typing status when sending
    if (onTypingChange) {
      onTypingChange(false);
      wasTypingRef.current = false;
    }

    if (hasFile && onSendFile) {
      // Send file with optional message
      console.log('[ChatPanel] Sending file with message:', input.trim());
      onSendFile(pendingFile, hasText ? input.trim() : undefined);
      clearPendingFile();
      setInput('');
    } else if (hasText && onSendMessage) {
      // Send text message only
      console.log('[ChatPanel] Sending message:', input.trim());
      onSendMessage(input.trim());
      setInput('');
    } else {
      console.log('[ChatPanel] Cannot send - input:', input, 'file:', !!pendingFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create preview URL for the file
      const previewUrl = URL.createObjectURL(file);
      setPendingFile(file);
      setPendingFilePreview(previewUrl);
      e.target.value = '';
    }
  };

  const clearPendingFile = () => {
    if (pendingFilePreview) {
      URL.revokeObjectURL(pendingFilePreview);
    }
    setPendingFile(null);
    setPendingFilePreview(null);
  };

  const getFileType = (fileName: string): 'image' | 'video' | 'document' | 'other' => {
    const ext = `.${fileName.split('.').pop()?.toLowerCase()}`;
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)) return 'image';
    if (['.mp4', '.webm', '.ogg'].includes(ext)) return 'video';
    if (['.json', '.md', '.txt', '.js', '.html', '.css'].includes(ext)) return 'document';
    return 'other';
  };

  const createPreviewTag = (metadata: FileTransfer) => {
    if (metadata) {
      const fileType = getFileType(metadata.name);

      if (fileType === 'image') {
        return <img src={`${metadata.previewurl}`} className='select-none w-full h-auto' draggable="false" alt="file preview" />;
      } else if (fileType === 'document') {
        return <iframe className='w-full overflow-hidden' src={metadata.previewurl}></iframe>;
      } else if (fileType === 'video') {
        return (
          <video controls className="w-full h-auto">
            <source src={metadata.previewurl} type="video/mp4"></source>
          </video>
        );
      } else {
        return <div className="p-4 text-center text-gray-500 font-mono text-xs">No preview available</div>;
      }
    }
    return <div className="p-4 text-center text-gray-500 font-mono text-xs">No preview</div>;
  };

  const renderPendingFilePreview = () => {
    if (!pendingFile || !pendingFilePreview) return null;

    const fileType = getFileType(pendingFile.name);

    return (
      <div className="p-3 border-b-2 border-black bg-gray-100">
        <div className="flex items-start gap-3">
          {/* Preview Thumbnail */}
          <div className="w-16 h-16 border-2 border-black bg-white overflow-hidden flex-shrink-0">
            {fileType === 'image' ? (
              <img src={pendingFilePreview} className="w-full h-full object-cover" alt="preview" />
            ) : fileType === 'video' ? (
              <video src={pendingFilePreview} className="w-full h-full object-cover" muted />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[10px] font-mono text-gray-400 uppercase">
                {pendingFile.name.split('.').pop()}
              </div>
            )}
          </div>

          {/* File Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{pendingFile.name}</p>
            <p className="text-[10px] font-mono text-gray-500 uppercase">{formatBytes(pendingFile.size)}</p>
          </div>

          {/* Remove Button */}
          <button
            onClick={clearPendingFile}
            className="w-8 h-8 flex items-center justify-center border-2 border-black bg-white hover:bg-red-500 hover:text-white hover:border-red-500 transition-all"
            title="Remove file"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    );
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Generate typing indicator text
  const getTypingIndicatorText = () => {
    if (!typingPeers || typingPeers.size === 0) return null;

    const typingList = Array.from(typingPeers.values());

    if (typingList.length === 1) {
      return `${typingList[0].peerId.slice(0, 6)} is typing...`;
    } else if (typingList.length === 2) {
      return `${typingList[0].peerId.slice(0, 6)} and ${typingList[1].peerId.slice(0, 6)} are typing...`;
    } else {
      return `${typingList.length} people are typing...`;
    }
  };

  const typingText = getTypingIndicatorText();

  return (
    <div
      className={`flex flex-col bg-white transition-all duration-300 ease-in-out ${isFullscreen
          ? 'fixed inset-0 z-50'
          : 'h-full'
        }`}
      style={{
        transform: isFullscreen ? 'scale(1)' : 'scale(1)',
        opacity: 1,
      }}
    >
      {/* Header */}
      <div className="p-4 border-b-2 border-black bg-gray-50 flex items-center justify-between">
        {/* Chat Title on Left */}
        <h3 className="font-bold text-lg uppercase tracking-wide text-black">Chat</h3>

        {/* Fullscreen Toggle on Right */}
        <div className="flex items-center gap-2">
          {onClose && !isFullscreen && (
            <button
              onClick={onClose}
              className="md:hidden px-3 py-1 bg-black text-white text-xs font-bold uppercase hover:bg-gray-800 transition-colors"
            >
              Close
            </button>
          )}
          <button
            onClick={toggleFullscreen}
            className="w-10 h-10 flex items-center justify-center border-2 border-black bg-white text-black hover:bg-black hover:text-white transition-all duration-200"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && transfers.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 font-mono text-xs uppercase">
            <MessageSquare size={32} className="mb-2 opacity-20" />
            <p>No messages yet</p>
          </div>
        )}
        {[...messages.map(m => ({ type: 'message' as const, data: m, time: m.timestamp })),
        ...transfers.map(t => ({ type: 'file' as const, data: t, time: t.timestamp }))]
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
                    <p className="text-sm font-medium wrap-break-word whitespace-pre-wrap">{msg.text}</p>
                    <span className={`text-[10px] font-mono block mt-1 ${isMe ? 'text-gray-400' : 'text-gray-500'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                      <span className='text-cyan-500 text-[0.7rem]'> {isMe ? "" : msg.peerId.slice(0, 6)}</span>
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
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} mb-6`}
                >
                  <div className={`max-w-[85%] border-2 border-black bg-white overflow-hidden`}>
                    {/* Media Preview */}
                    <div className="bg-gray-100">
                      {createPreviewTag(transfer)}
                    </div>

                    {/* Horizontal Divider */}
                    <div className="border-t-2 border-black" />

                    {/* Message attached to media (if any) */}
                    {transfer.message && (
                      <>
                        <div className={`p-3 ${isMe ? 'bg-black text-white' : 'bg-white text-black'}`}>
                          <p className="text-sm font-medium whitespace-pre-wrap">{transfer.message}</p>
                        </div>
                        <div className="border-t-2 border-black" />
                      </>
                    )}

                    {/* Footer: Details and Download */}
                    <div className="p-3 flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black truncate uppercase tracking-tighter">{transfer.name}</p>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500 mt-0.5">
                          <span className="uppercase">{formatBytes(transfer.size)}</span>
                          <span className="opacity-30">•</span>
                          <span>{new Date(transfer.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {!isMe && (
                            <>
                              <span className="opacity-30">•</span>
                              <span className="text-cyan-600 font-bold">{transfer.peerId.slice(0, 6)}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Only show download button for receiver, not sender */}
                      {transfer.progress === 100 && !isMe && (
                        <button
                          className="w-10 h-10 flex items-center justify-center bg-black text-white hover:bg-gray-800 transition-all border-2 border-black active:translate-y-0.5"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = transfer.previewurl;
                            link.download = transfer.name;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                          title="Download File"
                        >
                          <Download size={20} />
                        </button>
                      )}

                      {/* Progress indicator during transfer */}
                      {transfer.progress < 100 && (
                        <div className="text-[10px] font-bold font-mono px-2 py-1 bg-black text-white">
                          {Math.round(transfer.progress)}%
                        </div>
                      )}
                    </div>

                    {/* Progress Bar (visible only during transfer) */}
                    {transfer.progress < 100 && (
                      <div className="h-1.5 w-full bg-gray-200 border-t-2 border-black">
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

      {/* Typing Indicator */}
      {typingText && (
        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs font-mono text-gray-500 italic">{typingText}</span>
          </div>
        </div>
      )}

      {/* Pending File Preview */}
      {renderPendingFilePreview()}

      {/* Input Area */}
      <div className="p-4 border-t-2 border-black bg-gray-50">
        <div className="flex gap-2">
          <label className={`w-12 h-12 flex items-center justify-center border-2 border-black bg-white text-black hover:bg-black hover:text-white cursor-pointer transition-all ${pendingFile ? 'bg-black text-white' : ''}`}>
            <Paperclip size={20} />
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            onBlur={() => {
              // Stop typing indicator when input loses focus
              if (onTypingChange && wasTypingRef.current) {
                onTypingChange(false);
                wasTypingRef.current = false;
              }
            }}
            placeholder={pendingFile ? "ADD A MESSAGE (OPTIONAL)..." : "TYPE MESSAGE..."}
            className="flex-1 px-4 border-2 border-black bg-white focus:outline-none focus:bg-white font-mono text-sm placeholder:text-gray-400"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() && !pendingFile}
            className="w-12 h-12 flex items-center justify-center border-2 border-black bg-black text-white hover:bg-white hover:text-black disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
