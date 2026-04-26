import type {
  YouTubeCommand,
  YouTubeControlMessage,
  YouTubePlayerState,
  YouTubeSearchResult,
  YouTubeSessionState,
} from '@/types/youtube';

export const YOUTUBE_CONTROL_LEASE_MS = 8_000;
export const YOUTUBE_SYNC_HEARTBEAT_MS = 3_000;
export const YOUTUBE_DRIFT_THRESHOLD_SEC = 1.5;
export const YOUTUBE_SEARCH_DEBOUNCE_MS = 400;
export const YOUTUBE_MAX_RESULTS = 10;
export const YOUTUBE_ALLOWED_PLAYBACK_RATES = [0.25, 0.5, 1, 1.25, 1.5, 1.75, 2] as const;

const YOUTUBE_VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

type ParsedYouTubeInput =
  | { kind: 'empty' }
  | { kind: 'search' }
  | { kind: 'video'; videoId: string }
  | { kind: 'invalid'; error: string };

export function createInitialYouTubeSessionState(participantId: string): YouTubeSessionState {
  const now = Date.now();

  return {
    isOpen: false,
    controllerId: null,
    controlLeaseExpiresAt: null,
    query: '',
    results: [],
    player: {
      status: 'idle',
      videoId: null,
      currentTimeSec: 0,
      playbackRate: 1,
      lastSyncedAt: now,
    },
    updatedBy: participantId,
    updatedAt: now,
    version: 0,
  };
}

export function projectPlayerState(player: YouTubePlayerState, now = Date.now()): YouTubePlayerState {
  if (player.status !== 'playing') {
    return player;
  }

  const elapsedSec = Math.max(0, (now - player.lastSyncedAt) / 1000);
  return {
    ...player,
    currentTimeSec: Math.max(0, player.currentTimeSec + elapsedSec * player.playbackRate),
  };
}

export function normalizeYouTubeSessionState(
  session: YouTubeSessionState,
  now = Date.now(),
): YouTubeSessionState {
  const hasActiveLease =
    typeof session.controlLeaseExpiresAt === 'number' && session.controlLeaseExpiresAt > now;

  const player = projectPlayerState(session.player, now);

  if (hasActiveLease) {
    return {
      ...session,
      player,
    };
  }

  if (session.controllerId === null && session.controlLeaseExpiresAt === null) {
    return {
      ...session,
      player,
    };
  }

  return {
    ...session,
    controllerId: null,
    controlLeaseExpiresAt: null,
    player,
  };
}

export function hasActiveControlLease(session: YouTubeSessionState, now = Date.now()) {
  return (
    Boolean(session.controllerId) &&
    typeof session.controlLeaseExpiresAt === 'number' &&
    session.controlLeaseExpiresAt > now
  );
}

export function applyYouTubeControlMessage(
  session: YouTubeSessionState,
  message: YouTubeControlMessage,
): YouTubeSessionState {
  const normalizedSession = normalizeYouTubeSessionState(session, message.requestedAt);

  if (message.type === 'release-control') {
    if (normalizedSession.controllerId !== message.requestedBy) {
      return normalizedSession;
    }

    return {
      ...normalizedSession,
      controllerId: null,
      controlLeaseExpiresAt: null,
      updatedBy: message.requestedBy,
      updatedAt: message.requestedAt,
      version: normalizedSession.version + 1,
    };
  }

  if (
    message.isHost ||
    !hasActiveControlLease(normalizedSession, message.requestedAt) ||
    normalizedSession.controllerId === message.requestedBy
  ) {
    return {
      ...normalizedSession,
      controllerId: message.requestedBy,
      controlLeaseExpiresAt: message.requestedAt + YOUTUBE_CONTROL_LEASE_MS,
      updatedBy: message.requestedBy,
      updatedAt: message.requestedAt,
      version: normalizedSession.version + 1,
    };
  }

  return normalizedSession;
}

export function applyYouTubeCommand(
  session: YouTubeSessionState,
  command: YouTubeCommand,
  participantId: string,
  now = Date.now(),
): YouTubeSessionState {
  const normalizedSession = normalizeYouTubeSessionState(session, now);
  const projectedPlayer = projectPlayerState(normalizedSession.player, now);

  switch (command.type) {
    case 'open':
      return {
        ...normalizedSession,
        isOpen: true,
        updatedBy: participantId,
        updatedAt: now,
        version: normalizedSession.version + 1,
      };

    case 'close':
      return {
        ...normalizedSession,
        isOpen: false,
        player:
          projectedPlayer.status === 'playing' || projectedPlayer.status === 'buffering'
            ? {
                ...projectedPlayer,
                status: 'paused',
                lastSyncedAt: now,
              }
            : projectedPlayer,
        updatedBy: participantId,
        updatedAt: now,
        version: normalizedSession.version + 1,
      };

    case 'load-video':
      return {
        ...normalizedSession,
        isOpen: true,
        player: {
          status: 'paused',
          videoId: command.videoId,
          currentTimeSec: Math.max(0, command.startAtSec ?? 0),
          playbackRate: projectedPlayer.playbackRate,
          lastSyncedAt: now,
        },
        updatedBy: participantId,
        updatedAt: now,
        version: normalizedSession.version + 1,
      };

    case 'play':
      return {
        ...normalizedSession,
        player: {
          ...projectedPlayer,
          status: 'playing',
          currentTimeSec: Math.max(0, command.atSec),
          lastSyncedAt: command.issuedAt,
        },
        updatedBy: participantId,
        updatedAt: now,
        version: normalizedSession.version + 1,
      };

    case 'pause':
      return {
        ...normalizedSession,
        player: {
          ...projectedPlayer,
          status: 'paused',
          currentTimeSec: Math.max(0, command.atSec),
          lastSyncedAt: command.issuedAt,
        },
        updatedBy: participantId,
        updatedAt: now,
        version: normalizedSession.version + 1,
      };

    case 'seek':
      return {
        ...normalizedSession,
        player: {
          ...projectedPlayer,
          currentTimeSec: Math.max(0, command.toSec),
          lastSyncedAt: command.issuedAt,
        },
        updatedBy: participantId,
        updatedAt: now,
        version: normalizedSession.version + 1,
      };

    case 'set-playback-rate':
      return {
        ...normalizedSession,
        player: {
          ...projectedPlayer,
          playbackRate: command.rate,
          lastSyncedAt: now,
        },
        updatedBy: participantId,
        updatedAt: now,
        version: normalizedSession.version + 1,
      };
  }
}

export function applyYouTubeSearchQuery(
  session: YouTubeSessionState,
  query: string,
  participantId: string,
  requestedAt = Date.now(),
): YouTubeSessionState {
  const normalizedSession = normalizeYouTubeSessionState(session, requestedAt);

  return {
    ...normalizedSession,
    query,
    results: query.trim().length >= 2 ? normalizedSession.results : [],
    updatedBy: participantId,
    updatedAt: requestedAt,
    version: normalizedSession.version + 1,
  };
}

export function applyYouTubeSearchResults(
  session: YouTubeSessionState,
  query: string,
  results: YouTubeSearchResult[],
  participantId: string,
  requestedAt = Date.now(),
): YouTubeSessionState {
  const normalizedSession = normalizeYouTubeSessionState(session, requestedAt);

  return {
    ...normalizedSession,
    query,
    results,
    updatedBy: participantId,
    updatedAt: requestedAt,
    version: normalizedSession.version + 1,
  };
}

export function applyYouTubePlayerStatus(
  session: YouTubeSessionState,
  status: YouTubePlayerState['status'],
  participantId: string,
  now = Date.now(),
  currentTimeSec?: number,
): YouTubeSessionState {
  const normalizedSession = normalizeYouTubeSessionState(session, now);
  const projectedPlayer = projectPlayerState(normalizedSession.player, now);

  return {
    ...normalizedSession,
    player: {
      ...projectedPlayer,
      status,
      currentTimeSec:
        typeof currentTimeSec === 'number' ? Math.max(0, currentTimeSec) : projectedPlayer.currentTimeSec,
      lastSyncedAt: now,
    },
    updatedBy: participantId,
    updatedAt: now,
    version: normalizedSession.version + 1,
  };
}

export function mergeYouTubeSessionState(
  currentState: YouTubeSessionState,
  incomingState: YouTubeSessionState,
): YouTubeSessionState {
  if (incomingState.version > currentState.version) {
    return normalizeYouTubeSessionState(incomingState);
  }

  if (incomingState.version === currentState.version && incomingState.updatedAt >= currentState.updatedAt) {
    return normalizeYouTubeSessionState(incomingState);
  }

  return currentState;
}

export function formatTimecode(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return [hours, minutes, seconds].map((part) => part.toString().padStart(2, '0')).join(':');
  }

  return [minutes, seconds].map((part) => part.toString().padStart(2, '0')).join(':');
}

export function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function getLeaseRemainingMs(controlLeaseExpiresAt: number | null, now = Date.now()) {
  if (typeof controlLeaseExpiresAt !== 'number') {
    return 0;
  }

  return Math.max(0, controlLeaseExpiresAt - now);
}

export function parseYouTubeInput(input: string): ParsedYouTubeInput {
  const trimmed = input.trim();

  if (!trimmed) {
    return { kind: 'empty' };
  }

  if (YOUTUBE_VIDEO_ID_REGEX.test(trimmed)) {
    return {
      kind: 'video',
      videoId: trimmed,
    };
  }

  const looksLikeUrl =
    trimmed.includes('://') ||
    trimmed.startsWith('www.') ||
    trimmed.startsWith('youtu') ||
    trimmed.includes('youtube.com/') ||
    trimmed.includes('youtu.be/');

  if (!looksLikeUrl) {
    return { kind: 'search' };
  }

  let url: URL;

  try {
    url = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`);
  } catch {
    return {
      kind: 'invalid',
      error: 'Only direct video IDs or standard YouTube watch links are supported in v1.',
    };
  }

  const hostname = url.hostname.replace(/^www\./, '').toLowerCase();

  if (hostname === 'youtu.be') {
    const videoId = url.pathname.split('/').filter(Boolean)[0];
    if (videoId && YOUTUBE_VIDEO_ID_REGEX.test(videoId)) {
      return {
        kind: 'video',
        videoId,
      };
    }

    return {
      kind: 'invalid',
      error: 'That youtu.be link does not contain a valid video ID.',
    };
  }

  if (hostname.endsWith('youtube.com')) {
    if (url.pathname !== '/watch') {
      return {
        kind: 'invalid',
        error: 'Only youtube.com/watch links are supported in v1.',
      };
    }

    const videoId = url.searchParams.get('v');
    if (videoId && YOUTUBE_VIDEO_ID_REGEX.test(videoId)) {
      return {
        kind: 'video',
        videoId,
      };
    }

    return {
      kind: 'invalid',
      error: 'That YouTube watch link does not contain a valid video ID.',
    };
  }

  return {
    kind: 'invalid',
    error: 'Only YouTube watch links, youtu.be links, or direct video IDs are supported in v1.',
  };
}

export function normalizeYouTubeSearchResults(payload: unknown): YouTubeSearchResult[] {
  if (
    !payload ||
    typeof payload !== 'object' ||
    !('items' in payload) ||
    !Array.isArray(payload.items)
  ) {
    return [];
  }

  return payload.items
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const maybeId = 'id' in item ? item.id : null;
      const maybeSnippet = 'snippet' in item ? item.snippet : null;

      if (
        !maybeId ||
        typeof maybeId !== 'object' ||
        !maybeSnippet ||
        typeof maybeSnippet !== 'object' ||
        !('videoId' in maybeId) ||
        !('title' in maybeSnippet) ||
        !('channelTitle' in maybeSnippet) ||
        !('publishedAt' in maybeSnippet) ||
        !('thumbnails' in maybeSnippet)
      ) {
        return null;
      }

      const thumbnails = maybeSnippet.thumbnails;
      const defaultThumbnail =
        thumbnails &&
        typeof thumbnails === 'object' &&
        'medium' in thumbnails &&
        thumbnails.medium &&
        typeof thumbnails.medium === 'object' &&
        'url' in thumbnails.medium
          ? thumbnails.medium.url
          : '';

      if (
        typeof maybeId.videoId !== 'string' ||
        typeof maybeSnippet.title !== 'string' ||
        typeof maybeSnippet.channelTitle !== 'string' ||
        typeof maybeSnippet.publishedAt !== 'string' ||
        typeof defaultThumbnail !== 'string'
      ) {
        return null;
      }

      return {
        videoId: maybeId.videoId,
        title: maybeSnippet.title,
        channelTitle: maybeSnippet.channelTitle,
        thumbnailUrl: defaultThumbnail,
        publishedAt: maybeSnippet.publishedAt,
      } satisfies YouTubeSearchResult;
    })
    .filter((result): result is YouTubeSearchResult => result !== null);
}
