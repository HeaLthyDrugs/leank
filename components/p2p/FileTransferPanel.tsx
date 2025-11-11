'use client';

import React from 'react';
import { FileTransfer } from '@/hooks/useFileShare';
import { Download, Upload, CheckCircle } from 'lucide-react';
import { formatBytes } from '@/lib/utils';

interface FileTransferPanelProps {
  transfers: FileTransfer[];
}

export function FileTransferPanel({ transfers }: FileTransferPanelProps) {
  if (transfers.length === 0) return null;

  return (
    <div className="absolute bottom-24 right-4 bg-white rounded-lg shadow-xl p-4 w-80 max-h-64 overflow-y-auto">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <Upload size={16} />
        File Transfers
      </h3>
      <div className="space-y-2">
        {transfers.map((transfer) => (
          <div key={transfer.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
            {transfer.progress === 100 ? (
              <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
            ) : (
              <Download size={20} className="text-blue-600 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{transfer.name}</p>
              <p className="text-xs text-gray-500">
                {formatBytes(transfer.size)} • {transfer.peerId === 'me' ? 'Sent' : `From ${transfer.peerId.slice(0, 6)}`}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
