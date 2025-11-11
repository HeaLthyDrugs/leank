'use client';

import { useState, useEffect } from 'react';
import { Room } from 'trystero/torrent';

export interface RoomState {
  isSessionStarted: boolean;
  hostId: string | null;
}

export function useRoomState(room: Room | null, isHost: boolean) {
  const [roomState, setRoomState] = useState<RoomState>({
    isSessionStarted: false,
    hostId: null
  });

  useEffect(() => {
    if (!room) return;

    const [sendState, receiveState] = room.makeAction<RoomState>('roomState');

    receiveState((state) => {
      setRoomState(state);
    });

    if (isHost) {
      const initialState: RoomState = {
        isSessionStarted: false,
        hostId: 'me'
      };
      setRoomState(initialState);
    }

    return () => {
      // Cleanup
    };
  }, [room, isHost]);

  const startSession = () => {
    if (!room || !isHost) return;

    const newState: RoomState = {
      isSessionStarted: true,
      hostId: 'me'
    };
    
    setRoomState(newState);
    
    const [sendState] = room.makeAction('roomState');
    sendState(newState);
  };

  return { roomState, startSession };
}
