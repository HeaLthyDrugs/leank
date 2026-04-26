export interface ParticipantPresence {
  participantId: string;
  transportId: string | null;
  joinedAt: number;
  isHost: boolean;
  lastSeenAt: number;
}

export interface Peer {
  id: string;
  participantId: string | null;
  joinedAt: number | null;
  isHost: boolean;
  lastSeenAt: number | null;
  stream?: MediaStream;
  isMuted?: boolean;
  isVideoStopped?: boolean;
  isSpeaking?: boolean;
}

export interface PresencePayload {
  type: 'join' | 'announce' | 'heartbeat' | 'visible';
  timestamp: number;
  participantId: string;
  isHost: boolean;
  joinedAt: number;
}
