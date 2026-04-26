import type { ParticipantPresence } from '@/types/room';

export const PARTICIPANT_SESSION_STORAGE_KEY = 'leank_participant_session';
export const ROOM_PARTICIPATION_SESSION_STORAGE_KEY = 'leank_room_participation_session';

interface StoredParticipantSession {
  participantId: string;
}

interface StoredRoomParticipationSession {
  roomId: string;
  joinedAt: number;
}

export function getOrCreateParticipantSession(): StoredParticipantSession {
  if (typeof window === 'undefined') {
    return {
      participantId: crypto.randomUUID(),
    };
  }

  const stored = window.sessionStorage.getItem(PARTICIPANT_SESSION_STORAGE_KEY);

  if (stored) {
    try {
      const parsed = JSON.parse(stored) as Partial<StoredParticipantSession>;
      if (
        typeof parsed.participantId === 'string' &&
        parsed.participantId.length > 0
      ) {
        return {
          participantId: parsed.participantId,
        };
      }
    } catch (error) {
      console.warn('[room-participants] Failed to restore participant session', error);
    }
  }

  const session = {
    participantId: crypto.randomUUID(),
  };

  window.sessionStorage.setItem(PARTICIPANT_SESSION_STORAGE_KEY, JSON.stringify(session));
  return session;
}

export function getOrCreateRoomJoinTimestamp(roomId: string) {
  if (typeof window === 'undefined') {
    return Date.now();
  }

  const stored = window.sessionStorage.getItem(ROOM_PARTICIPATION_SESSION_STORAGE_KEY);

  if (stored) {
    try {
      const parsed = JSON.parse(stored) as Partial<StoredRoomParticipationSession>;
      if (parsed.roomId === roomId && typeof parsed.joinedAt === 'number') {
        return parsed.joinedAt;
      }
    } catch (error) {
      console.warn('[room-participants] Failed to restore room participation session', error);
    }
  }

  const joinedAt = Date.now();
  window.sessionStorage.setItem(
    ROOM_PARTICIPATION_SESSION_STORAGE_KEY,
    JSON.stringify({ roomId, joinedAt } satisfies StoredRoomParticipationSession),
  );

  return joinedAt;
}

export function clearRoomJoinTimestamp(roomId: string) {
  if (typeof window === 'undefined') {
    return;
  }

  const stored = window.sessionStorage.getItem(ROOM_PARTICIPATION_SESSION_STORAGE_KEY);
  if (!stored) {
    return;
  }

  try {
    const parsed = JSON.parse(stored) as Partial<StoredRoomParticipationSession>;
    if (parsed.roomId === roomId) {
      window.sessionStorage.removeItem(ROOM_PARTICIPATION_SESSION_STORAGE_KEY);
    }
  } catch (error) {
    console.warn('[room-participants] Failed to clear room participation session', error);
  }
}

export function resolveRoomAuthority(
  localParticipant: ParticipantPresence,
  remoteParticipants: ParticipantPresence[],
) {
  const allParticipants = [localParticipant, ...remoteParticipants].filter(
    (participant): participant is ParticipantPresence =>
      Boolean(participant.participantId) && typeof participant.joinedAt === 'number',
  );

  if (allParticipants.length === 0) {
    return null;
  }

  return [...allParticipants].sort(compareParticipants)[0];
}

export function compareParticipants(a: ParticipantPresence, b: ParticipantPresence) {
  if (a.isHost !== b.isHost) {
    return a.isHost ? -1 : 1;
  }

  if (a.joinedAt !== b.joinedAt) {
    return a.joinedAt - b.joinedAt;
  }

  return a.participantId.localeCompare(b.participantId);
}
