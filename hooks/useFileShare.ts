'use client';

import { useState, useEffect } from 'react';
import { Room } from 'trystero/torrent';

export interface FileTransfer {
  id: string;
  name: string;
  size: number;
  progress: number;
  previewurl: string;
  peerId: string;
  timestamp: number;
  message?: string;
}

export function useFileShare(room: Room | null) {
  const [transfers, setTransfers] = useState<FileTransfer[]>([]);
  const [sendFile, setSendFile] = useState<((file: File, message?: string) => void) | null>(null);

  useEffect(() => {
    if (!room) return;

    console.log('[useFileShare] Setting up file sharing');
    const [sendData, receiveData] = room.makeAction('file');
    const [sendMeta, receiveMeta] = room.makeAction('fileMeta');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    receiveMeta((meta: any, peerId: string) => {
      console.log('[useFileShare] Received file meta:', meta, 'from:', peerId);
      if (meta && meta.name && meta.size && meta.id) {
        setTransfers((prev) => [...prev, { ...meta, progress: 0, peerId, timestamp: meta.timestamp || Date.now(), message: meta.message }]);
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    receiveData((data: any, peerId: string) => {
      console.log('[useFileShare] Received file data from:', peerId, 'size:', data?.byteLength);
      if (!data) return;
      setTransfers((prev) => {
        const updated = [...prev];
        const transfer = updated.find(t => t.peerId === peerId && t.progress < 100);
        if (transfer) {
          const blob = new Blob([data]);
          const url = URL.createObjectURL(blob);
          // Don't auto-download - let user download via the download button
          transfer.progress = 100;
          transfer.previewurl = url;
        }
        return updated;
      });
    });

    setSendFile(() => async (file: File, message?: string) => {
      console.log('[useFileShare] Sending file:', file.name, file.size, 'with message:', message);
      const id = crypto.randomUUID();
      const meta = { name: file.name, size: file.size, id, timestamp: Date.now(), message: message || '' };
      sendMeta(meta);

      const buffer = await file.arrayBuffer();
      sendData(buffer);

      const blob = new Blob([buffer]);
      const url = URL.createObjectURL(blob);
      console.log('[useFileShare] File sent successfully');

      setTransfers((prev) => [...prev, { ...meta, progress: 100, peerId: 'me', previewurl: url }]);
    });
  }, [room]);

  return { transfers, sendFile };
}
