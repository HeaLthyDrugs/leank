'use client';

import { useState, useEffect } from 'react';
import { Room } from 'trystero/torrent';

export interface RoomState {
  isSessionStarted: boolean;
  hostId: string | null;
}

export function useRoomState(room: Room | null, isHost: boolean, participantId: string) {
  const [remoteRoomState, setRemoteRoomState] = useState<RoomState>({
    isSessionStarted: false,
    hostId: null
  });

  useEffect(() => {
    if (!room) return;

    const [, receiveState] = room.makeAction('roomState');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    receiveState((state: any) => {
      if (state && typeof state.isSessionStarted !== 'undefined') {
        setRemoteRoomState(state);
      }
    });

    return () => {
      // Cleanup
    };
  }, [room]);

  const roomState: RoomState = isHost
    ? {
        isSessionStarted: remoteRoomState.isSessionStarted,
        hostId: participantId,
      }
    : remoteRoomState;

  const startSession = () => {
    if (!room || !isHost) return;

    const newState: RoomState = {
      isSessionStarted: true,
      hostId: participantId
    };

    setRemoteRoomState(newState);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [sendState] = room.makeAction('roomState') as unknown as [(data: any) => void];
    sendState(newState);
  };

  return { roomState, startSession };
}
