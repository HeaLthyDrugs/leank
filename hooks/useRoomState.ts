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

    const [sendState, receiveState] = room.makeAction('roomState');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    receiveState((state: any) => {
      if (state && typeof state.isSessionStarted !== 'undefined') {
        setRoomState(state);
      }
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [sendState] = room.makeAction('roomState') as unknown as [(data: any) => void];
    sendState(newState);
  };

  return { roomState, startSession };
}
