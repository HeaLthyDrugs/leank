import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
  peerCount: number;
}

export function ConnectionStatus({ isConnected, peerCount }: ConnectionStatusProps) {
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
      isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
    }`}>
      {isConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
      <span>{isConnected ? `${peerCount} connected` : 'Connecting...'}</span>
    </div>
  );
}
