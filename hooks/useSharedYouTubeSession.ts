'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Room } from 'trystero/torrent';
import { useRoomContext } from '@/contexts/RoomContext';
import {
  applyYouTubeCommand,
  applyYouTubeControlMessage,
  applyYouTubePlayerStatus,
  applyYouTubeSearchQuery,
  applyYouTubeSearchResults,
  createInitialYouTubeSessionState,
  getLeaseRemainingMs,
  hasActiveControlLease,
  mergeYouTubeSessionState,
  normalizeYouTubeSearchResults,
  normalizeYouTubeSessionState,
  parseYouTubeInput,
  YOUTUBE_MAX_RESULTS,
  YOUTUBE_SEARCH_DEBOUNCE_MS,
  YOUTUBE_SYNC_HEARTBEAT_MS,
} from '@/lib/youtube';
import type {
  YouTubeCommand,
  YouTubeControlMessage,
  YouTubePlayerState,
  YouTubeSearchMessage,
  YouTubeSessionState,
  YouTubeSyncRequest,
  YouTubeSyncResponse,
} from '@/types/youtube';

type SearchStatus = 'idle' | 'loading' | 'error';
type YouTubePlaybackRate = Extract<YouTubeCommand, { type: 'set-playback-rate' }>['rate'];
type SearchOutcome = 'success' | 'error';

const SEARCH_ERROR_RETRY_COOLDOWN_MS = 10_000;

const YOUTUBE_ACTION_NAMES = {
  session: 'yt-session',
  command: 'yt-command',
  search: 'yt-search',
  control: 'yt-control',
  syncRequest: 'yt-syncreq',
  syncResponse: 'yt-syncres',
} as const;

interface DirectLoadResult {
  ok: boolean;
  error?: string;
}

function didSessionMutate(previous: YouTubeSessionState, next: YouTubeSessionState) {
  return (
    previous.version !== next.version ||
    previous.updatedAt !== next.updatedAt ||
    previous.controllerId !== next.controllerId ||
    previous.controlLeaseExpiresAt !== next.controlLeaseExpiresAt ||
    previous.player.status !== next.player.status ||
    previous.player.videoId !== next.player.videoId ||
    previous.player.playbackRate !== next.player.playbackRate ||
    previous.isOpen !== next.isOpen ||
    previous.query !== next.query
  );
}

function isYouTubeSessionState(value: unknown): value is YouTubeSessionState {
  return (
    !!value &&
    typeof value === 'object' &&
    'isOpen' in value &&
    'controllerId' in value &&
    'query' in value &&
    'results' in value &&
    'player' in value &&
    'updatedBy' in value &&
    'updatedAt' in value &&
    'version' in value
  );
}

function isYouTubeControlMessage(value: unknown): value is YouTubeControlMessage {
  return (
    !!value &&
    typeof value === 'object' &&
    'type' in value &&
    (value.type === 'take-control' || value.type === 'release-control') &&
    'requestedBy' in value &&
    'requestedAt' in value &&
    'isHost' in value
  );
}

function isYouTubeSearchMessage(value: unknown): value is YouTubeSearchMessage {
  return (
    !!value &&
    typeof value === 'object' &&
    'type' in value &&
    (value.type === 'query' || value.type === 'results') &&
    'requestedBy' in value &&
    'requestedAt' in value
  );
}

function isYouTubeSyncRequest(value: unknown): value is YouTubeSyncRequest {
  return (
    !!value &&
    typeof value === 'object' &&
    'requestedBy' in value &&
    'requestedAt' in value
  );
}

function isYouTubeSyncResponse(value: unknown): value is YouTubeSyncResponse {
  return (
    !!value &&
    typeof value === 'object' &&
    'requestedBy' in value &&
    'requestedAt' in value &&
    'state' in value &&
    isYouTubeSessionState(value.state)
  );
}

export function useSharedYouTubeSession(room: Room | null, participantId: string, isHost: boolean) {
  const { peers, authorityPeerId, isAuthority } = useRoomContext();

  const [sessionState, setSessionState] = useState<YouTubeSessionState>(() =>
    createInitialYouTubeSessionState(participantId || ''),
  );
  const [searchStatus, setSearchStatus] = useState<SearchStatus>('idle');
  const [searchError, setSearchError] = useState<string | null>(null);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const searchRequestIdRef = useRef(0);
  const lastCompletedSearchRef = useRef<{
    controllerId: string;
    query: string;
    outcome: SearchOutcome;
    at: number;
  } | null>(null);

  const sessionStateRef = useRef(sessionState);
  const participantIdRef = useRef(participantId);
  const isHostRef = useRef(isHost);
  const isAuthorityRef = useRef(isAuthority);
  const authorityPeerIdRef = useRef(authorityPeerId);
  const peersRef = useRef(peers);

  const sendSessionRef = useRef<((state: YouTubeSessionState, peerId?: string) => void) | null>(null);
  const sendCommandRef = useRef<((command: YouTubeCommand, peerId?: string) => void) | null>(null);
  const sendSearchRef = useRef<((message: YouTubeSearchMessage, peerId?: string) => void) | null>(null);
  const sendControlRef = useRef<((message: YouTubeControlMessage, peerId?: string) => void) | null>(null);
  const sendSyncRequestRef = useRef<((message: YouTubeSyncRequest, peerId?: string) => void) | null>(null);
  const sendSyncResponseRef = useRef<((message: YouTubeSyncResponse, peerId?: string) => void) | null>(null);

  useEffect(() => {
    sessionStateRef.current = sessionState;
  }, [sessionState]);

  useEffect(() => {
    participantIdRef.current = participantId;
    if (!participantId) {
      return;
    }

    setSessionState((prev) => {
      if (prev.updatedBy || prev.version > 0) {
        return prev;
      }

      const next = createInitialYouTubeSessionState(participantId);
      sessionStateRef.current = next;
      return next;
    });
  }, [participantId]);

  useEffect(() => {
    isHostRef.current = isHost;
  }, [isHost]);

  useEffect(() => {
    isAuthorityRef.current = isAuthority;
  }, [isAuthority]);

  useEffect(() => {
    authorityPeerIdRef.current = authorityPeerId;
  }, [authorityPeerId]);

  useEffect(() => {
    peersRef.current = peers;
  }, [peers]);

  const commitSessionState = useCallback(
    (updater: YouTubeSessionState | ((previous: YouTubeSessionState) => YouTubeSessionState)) => {
      setSessionState((previous) => {
        const nextState =
          typeof updater === 'function'
            ? (updater as (value: YouTubeSessionState) => YouTubeSessionState)(previous)
            : updater;
        const normalized = normalizeYouTubeSessionState(nextState);
        sessionStateRef.current = normalized;
        return normalized;
      });
    },
    [],
  );

  const getSenderParticipant = useCallback(
    (peerId: string) => peersRef.current.get(peerId)?.participantId ?? null,
    [],
  );

  const sendToAuthorityOrBroadcast = useCallback(
    <T,>(sender: ((payload: T, peerId?: string) => void) | null, payload: T) => {
      if (!sender) {
        return;
      }

      if (isAuthorityRef.current || !authorityPeerIdRef.current) {
        sender(payload);
        return;
      }

      sender(payload, authorityPeerIdRef.current);
    },
    [],
  );

  const broadcastSnapshot = useCallback(
    (state: YouTubeSessionState, peerId?: string) => {
      if (!sendSessionRef.current) {
        return;
      }

      const normalized = normalizeYouTubeSessionState(state);
      if (peerId) {
        sendSessionRef.current(normalized, peerId);
        return;
      }

      sendSessionRef.current(normalized);
    },
    [],
  );

  const requestSync = useCallback(() => {
    if (!sendSyncRequestRef.current || !participantIdRef.current || isAuthorityRef.current) {
      return;
    }

    sendToAuthorityOrBroadcast(sendSyncRequestRef.current, {
      requestedBy: participantIdRef.current,
      requestedAt: Date.now(),
    });
  }, [sendToAuthorityOrBroadcast]);

  const waitForControlGrant = useCallback(() => {
    return new Promise<boolean>((resolve) => {
      const start = Date.now();
      const intervalId = window.setInterval(() => {
        const normalized = normalizeYouTubeSessionState(sessionStateRef.current);
        if (
          normalized.controllerId === participantIdRef.current &&
          hasActiveControlLease(normalized)
        ) {
          window.clearInterval(intervalId);
          window.clearTimeout(timeoutId);
          resolve(true);
        }

        if (Date.now() - start >= 1500) {
          window.clearInterval(intervalId);
          window.clearTimeout(timeoutId);
          resolve(false);
        }
      }, 60);

      const timeoutId = window.setTimeout(() => {
        window.clearInterval(intervalId);
        resolve(
          normalizeYouTubeSessionState(sessionStateRef.current).controllerId ===
            participantIdRef.current,
        );
      }, 1500);
    });
  }, []);

  const renewControlLease = useCallback(() => {
    if (!participantIdRef.current) {
      return;
    }

    const message: YouTubeControlMessage = {
      type: 'take-control',
      requestedBy: participantIdRef.current,
      requestedAt: Date.now(),
      isHost: isHostRef.current,
    };

    const currentState = normalizeYouTubeSessionState(sessionStateRef.current);
    if (currentState.controllerId !== participantIdRef.current) {
      return;
    }

    const nextState = applyYouTubeControlMessage(currentState, message);
    commitSessionState(nextState);

    if (isAuthorityRef.current) {
      broadcastSnapshot(nextState);
      return;
    }

    sendToAuthorityOrBroadcast(sendControlRef.current, message);
  }, [broadcastSnapshot, commitSessionState, sendToAuthorityOrBroadcast]);

  const takeControl = useCallback(async () => {
    if (!room || !participantIdRef.current) {
      return false;
    }

    const normalized = normalizeYouTubeSessionState(sessionStateRef.current);
    if (
      normalized.controllerId === participantIdRef.current &&
      hasActiveControlLease(normalized)
    ) {
      renewControlLease();
      return true;
    }

    const message: YouTubeControlMessage = {
      type: 'take-control',
      requestedBy: participantIdRef.current,
      requestedAt: Date.now(),
      isHost: isHostRef.current,
    };

    if (isAuthorityRef.current) {
      const nextState = applyYouTubeControlMessage(normalized, message);
      commitSessionState(nextState);
      broadcastSnapshot(nextState);
      return nextState.controllerId === participantIdRef.current;
    }

    sendToAuthorityOrBroadcast(sendControlRef.current, message);
    return waitForControlGrant();
  }, [
    broadcastSnapshot,
    commitSessionState,
    renewControlLease,
    room,
    sendToAuthorityOrBroadcast,
    waitForControlGrant,
  ]);

  const releaseControl = useCallback(() => {
    if (!room || !participantIdRef.current) {
      return;
    }

    const message: YouTubeControlMessage = {
      type: 'release-control',
      requestedBy: participantIdRef.current,
      requestedAt: Date.now(),
      isHost: isHostRef.current,
    };

    if (isAuthorityRef.current) {
      const nextState = applyYouTubeControlMessage(sessionStateRef.current, message);
      commitSessionState(nextState);
      broadcastSnapshot(nextState);
      return;
    }

    sendToAuthorityOrBroadcast(sendControlRef.current, message);
  }, [broadcastSnapshot, commitSessionState, room, sendToAuthorityOrBroadcast]);

  const issueCommand = useCallback(
    async (command: YouTubeCommand) => {
      if (!room || !participantIdRef.current) {
        return false;
      }

      const hasControl = await takeControl();
      if (!hasControl) {
        return false;
      }

      const nextState = applyYouTubeCommand(
        sessionStateRef.current,
        command,
        participantIdRef.current,
      );

      commitSessionState(nextState);
      sendCommandRef.current?.(command);

      if (isAuthorityRef.current) {
        broadcastSnapshot(nextState);
      }

      return true;
    },
    [broadcastSnapshot, commitSessionState, room, takeControl],
  );

  const updateQuery = useCallback(
    async (query: string) => {
      if (!room || !participantIdRef.current) {
        return false;
      }

      const hasControl = await takeControl();
      if (!hasControl) {
        return false;
      }

      const requestedAt = Date.now();
      const nextState = applyYouTubeSearchQuery(
        sessionStateRef.current,
        query,
        participantIdRef.current,
        requestedAt,
      );

      commitSessionState(nextState);
      setSearchError(null);
      if (query.trim().length < 2) {
        setSearchStatus('idle');
      }

      sendSearchRef.current?.({
        type: 'query',
        query,
        requestedBy: participantIdRef.current,
        requestedAt,
      });

      if (isAuthorityRef.current) {
        broadcastSnapshot(nextState);
      }

      return true;
    },
    [broadcastSnapshot, commitSessionState, room, takeControl],
  );

  const publishSearchResults = useCallback(
    (query: string, results: YouTubeSessionState['results'], error?: string | null) => {
      if (!participantIdRef.current) {
        return;
      }

      const requestedAt = Date.now();
      const nextState = applyYouTubeSearchResults(
        sessionStateRef.current,
        query,
        results,
        participantIdRef.current,
        requestedAt,
      );

      commitSessionState(nextState);
      sendSearchRef.current?.({
        type: 'results',
        query,
        requestedBy: participantIdRef.current,
        requestedAt,
        results,
        error,
      });

      if (isAuthorityRef.current) {
        broadcastSnapshot(nextState);
      }
    },
    [broadcastSnapshot, commitSessionState],
  );

  const loadVideo = useCallback(
    async (videoId: string, startAtSec = 0) =>
      issueCommand({ type: 'load-video', videoId, startAtSec }),
    [issueCommand],
  );

  const loadVideoByInput = useCallback(
    async (input: string): Promise<DirectLoadResult> => {
      const parsed = parseYouTubeInput(input);

      if (parsed.kind === 'video') {
        const ok = await loadVideo(parsed.videoId, 0);
        return {
          ok,
          error: ok ? undefined : 'Control is currently held by another participant.',
        };
      }

      if (parsed.kind === 'invalid') {
        return {
          ok: false,
          error: parsed.error,
        };
      }

      return {
        ok: false,
        error: 'Paste a youtube.com/watch link, youtu.be link, or a direct 11-character video ID.',
      };
    },
    [loadVideo],
  );

  const markPlayerStatus = useCallback(
    (status: YouTubePlayerState['status'], currentTimeSec?: number) => {
      if (!participantIdRef.current) {
        return;
      }

      const normalized = normalizeYouTubeSessionState(sessionStateRef.current);
      if (
        normalized.controllerId !== participantIdRef.current &&
        !isAuthorityRef.current
      ) {
        return;
      }

      const nextState = applyYouTubePlayerStatus(
        normalized,
        status,
        participantIdRef.current,
        Date.now(),
        currentTimeSec,
      );

      commitSessionState(nextState);

      if (isAuthorityRef.current) {
        broadcastSnapshot(nextState);
        return;
      }

      sendToAuthorityOrBroadcast(sendSessionRef.current, nextState);
    },
    [broadcastSnapshot, commitSessionState, sendToAuthorityOrBroadcast],
  );

  useEffect(() => {
    if (!room) {
      sendSessionRef.current = null;
      sendCommandRef.current = null;
      sendSearchRef.current = null;
      sendControlRef.current = null;
      sendSyncRequestRef.current = null;
      sendSyncResponseRef.current = null;
      const resetState = createInitialYouTubeSessionState(participantIdRef.current || '');
      sessionStateRef.current = resetState;
      setSessionState(resetState);
      setSearchStatus('idle');
      setSearchError(null);
      setAutoplayBlocked(false);
      return;
    }

    const [sendSession, receiveSession] = room.makeAction(YOUTUBE_ACTION_NAMES.session) as unknown as [
      (state: YouTubeSessionState, peerId?: string) => void,
      (callback: (state: YouTubeSessionState, peerId: string) => void) => void,
    ];
    const [sendCommand, receiveCommand] = room.makeAction(YOUTUBE_ACTION_NAMES.command) as unknown as [
      (command: YouTubeCommand, peerId?: string) => void,
      (callback: (command: YouTubeCommand, peerId: string) => void) => void,
    ];
    const [sendSearch, receiveSearch] = room.makeAction(YOUTUBE_ACTION_NAMES.search) as unknown as [
      (message: YouTubeSearchMessage, peerId?: string) => void,
      (callback: (message: YouTubeSearchMessage, peerId: string) => void) => void,
    ];
    const [sendControl, receiveControl] = room.makeAction(YOUTUBE_ACTION_NAMES.control) as unknown as [
      (message: YouTubeControlMessage, peerId?: string) => void,
      (callback: (message: YouTubeControlMessage, peerId: string) => void) => void,
    ];
    const [sendSyncRequest, receiveSyncRequest] = room.makeAction(YOUTUBE_ACTION_NAMES.syncRequest) as unknown as [
      (message: YouTubeSyncRequest, peerId?: string) => void,
      (callback: (message: YouTubeSyncRequest, peerId: string) => void) => void,
    ];
    const [sendSyncResponse, receiveSyncResponse] = room.makeAction(YOUTUBE_ACTION_NAMES.syncResponse) as unknown as [
      (message: YouTubeSyncResponse, peerId?: string) => void,
      (callback: (message: YouTubeSyncResponse, peerId: string) => void) => void,
    ];

    sendSessionRef.current = sendSession;
    sendCommandRef.current = sendCommand;
    sendSearchRef.current = sendSearch;
    sendControlRef.current = sendControl;
    sendSyncRequestRef.current = sendSyncRequest;
    sendSyncResponseRef.current = sendSyncResponse;

    receiveSession((incomingState: YouTubeSessionState, peerId: string) => {
      if (!isYouTubeSessionState(incomingState)) {
        return;
      }

      const knownAuthorityPeerId = authorityPeerIdRef.current;
      if (knownAuthorityPeerId && peerId !== knownAuthorityPeerId && !isAuthorityRef.current) {
        return;
      }

      commitSessionState((previous) => mergeYouTubeSessionState(previous, incomingState));
    });

    receiveCommand((command: YouTubeCommand, peerId: string) => {
      const senderParticipantId = getSenderParticipant(peerId);
      const normalized = normalizeYouTubeSessionState(sessionStateRef.current);

      if (!senderParticipantId || normalized.controllerId !== senderParticipantId) {
        return;
      }

      const nextState = applyYouTubeCommand(normalized, command, senderParticipantId);
      commitSessionState(nextState);

      if (isAuthorityRef.current && didSessionMutate(normalized, nextState)) {
        broadcastSnapshot(nextState);
      }
    });

    receiveSearch((message: YouTubeSearchMessage, peerId: string) => {
      if (!isYouTubeSearchMessage(message)) {
        return;
      }

      const senderParticipantId = getSenderParticipant(peerId);
      const normalized = normalizeYouTubeSessionState(sessionStateRef.current);

      if (!senderParticipantId || normalized.controllerId !== senderParticipantId) {
        return;
      }

      if (message.type === 'query') {
        const nextState = applyYouTubeSearchQuery(
          normalized,
          message.query,
          senderParticipantId,
          message.requestedAt,
        );
        commitSessionState(nextState);

        if (isAuthorityRef.current && didSessionMutate(normalized, nextState)) {
          broadcastSnapshot(nextState);
        }
        return;
      }

      const nextState = applyYouTubeSearchResults(
        normalized,
        message.query,
        message.results,
        senderParticipantId,
        message.requestedAt,
      );

      setSearchError(message.error ?? null);
      setSearchStatus(message.error ? 'error' : 'idle');
      commitSessionState(nextState);

      if (isAuthorityRef.current && didSessionMutate(normalized, nextState)) {
        broadcastSnapshot(nextState);
      }
    });

    receiveControl((message: YouTubeControlMessage, peerId: string) => {
      if (!isAuthorityRef.current || !isYouTubeControlMessage(message)) {
        return;
      }

      const senderParticipantId = getSenderParticipant(peerId);
      if (!senderParticipantId || senderParticipantId !== message.requestedBy) {
        return;
      }

      const previous = normalizeYouTubeSessionState(sessionStateRef.current);
      const nextState = applyYouTubeControlMessage(previous, message);

      if (!didSessionMutate(previous, nextState)) {
        return;
      }

      commitSessionState(nextState);
      broadcastSnapshot(nextState);
    });

    receiveSyncRequest((message: YouTubeSyncRequest, peerId: string) => {
      if (!isAuthorityRef.current || !isYouTubeSyncRequest(message)) {
        return;
      }

      sendSyncResponseRef.current?.(
        {
          requestedBy: message.requestedBy,
          requestedAt: message.requestedAt,
          state: normalizeYouTubeSessionState(sessionStateRef.current),
        },
        peerId,
      );
    });

    receiveSyncResponse((message: YouTubeSyncResponse) => {
      if (
        !isYouTubeSyncResponse(message) ||
        message.requestedBy !== participantIdRef.current
      ) {
        return;
      }

      commitSessionState((previous) => mergeYouTubeSessionState(previous, message.state));
    });

    const syncTimeoutId = window.setTimeout(() => {
      if (!isAuthorityRef.current) {
        requestSync();
      }
    }, 350);

    return () => {
      window.clearTimeout(syncTimeoutId);
      sendSessionRef.current = null;
      sendCommandRef.current = null;
      sendSearchRef.current = null;
      sendControlRef.current = null;
      sendSyncRequestRef.current = null;
      sendSyncResponseRef.current = null;
    };
  }, [broadcastSnapshot, commitSessionState, getSenderParticipant, requestSync, room]);

  useEffect(() => {
    if (!room || !isAuthority) {
      return;
    }

    const intervalId = window.setInterval(() => {
      const normalized = normalizeYouTubeSessionState(sessionStateRef.current);

      if (didSessionMutate(sessionStateRef.current, normalized)) {
        commitSessionState(normalized);
      }

      broadcastSnapshot(normalized);
    }, YOUTUBE_SYNC_HEARTBEAT_MS);

    return () => window.clearInterval(intervalId);
  }, [broadcastSnapshot, commitSessionState, isAuthority, room]);

  useEffect(() => {
    if (!room || !participantId) {
      return;
    }

    if (isAuthority) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      requestSync();
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [authorityPeerId, isAuthority, participantId, requestSync, room]);

  const computedState = useMemo(() => normalizeYouTubeSessionState(sessionState), [sessionState]);
  const isController = computedState.controllerId === participantId;

  useEffect(() => {
    if (!room || computedState.controllerId !== participantId) {
      setSearchStatus((previous) => (previous === 'loading' ? 'idle' : previous));
      return;
    }

    const query = computedState.query.trim();
    if (query.length < 2) {
      setSearchStatus('idle');
      setSearchError(null);
      lastCompletedSearchRef.current = null;
      return;
    }

    const previousSearch = lastCompletedSearchRef.current;
    if (
      previousSearch &&
      previousSearch.controllerId === participantId &&
      previousSearch.query === query
    ) {
      if (previousSearch.outcome === 'success') {
        return;
      }

      if (Date.now() - previousSearch.at < SEARCH_ERROR_RETRY_COOLDOWN_MS) {
        return;
      }
    }

    const timeoutId = window.setTimeout(async () => {
      const requestId = ++searchRequestIdRef.current;
      const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

      if (!apiKey) {
        const message = 'Search is unavailable until NEXT_PUBLIC_YOUTUBE_API_KEY is configured.';
        setSearchStatus('error');
        setSearchError(message);
        publishSearchResults(computedState.query, [], message);
        lastCompletedSearchRef.current = {
          controllerId: participantIdRef.current,
          query,
          outcome: 'error',
          at: Date.now(),
        };
        return;
      }

      setSearchStatus('loading');
      setSearchError(null);

      try {
        const params = new URLSearchParams({
          part: 'snippet',
          q: query,
          maxResults: YOUTUBE_MAX_RESULTS.toString(),
          type: 'video',
          key: apiKey,
        });

        const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`);
        if (!response.ok) {
          throw new Error(`YouTube search failed with status ${response.status}`);
        }

        const payload = await response.json();
        const results = normalizeYouTubeSearchResults(payload);

        const latestState = normalizeYouTubeSessionState(sessionStateRef.current);
        if (
          latestState.controllerId !== participantIdRef.current ||
          latestState.query.trim() !== query ||
          requestId !== searchRequestIdRef.current
        ) {
          return;
        }

        setSearchStatus('idle');
        setSearchError(null);
        publishSearchResults(computedState.query, results, null);
        lastCompletedSearchRef.current = {
          controllerId: participantIdRef.current,
          query,
          outcome: 'success',
          at: Date.now(),
        };
      } catch (error) {
        console.error('[useSharedYouTubeSession] Search failed', error);
        const latestState = normalizeYouTubeSessionState(sessionStateRef.current);
        if (
          latestState.controllerId !== participantIdRef.current ||
          latestState.query.trim() !== query ||
          requestId !== searchRequestIdRef.current
        ) {
          return;
        }

        const message = 'We could not reach the YouTube search API. Try again in a moment.';
        setSearchStatus('error');
        setSearchError(message);
        publishSearchResults(computedState.query, [], message);
        lastCompletedSearchRef.current = {
          controllerId: participantIdRef.current,
          query,
          outcome: 'error',
          at: Date.now(),
        };
      }
    }, YOUTUBE_SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [
    computedState.controllerId,
    computedState.query,
    participantId,
    publishSearchResults,
    room,
  ]);

  return {
    sessionState: computedState,
    isController,
    hasActiveController: hasActiveControlLease(computedState),
    leaseRemainingMs: getLeaseRemainingMs(computedState.controlLeaseExpiresAt),
    searchStatus,
    searchError,
    autoplayBlocked,
    setAutoplayBlocked,
    takeControl,
    releaseControl,
    requestSync,
    openWorkspace: () => issueCommand({ type: 'open' }),
    closeWorkspace: () => issueCommand({ type: 'close' }),
    play: (atSec: number) => issueCommand({ type: 'play', atSec, issuedAt: Date.now() }),
    pause: (atSec: number) => issueCommand({ type: 'pause', atSec, issuedAt: Date.now() }),
    seek: (toSec: number) => issueCommand({ type: 'seek', toSec, issuedAt: Date.now() }),
    setPlaybackRate: (rate: YouTubePlaybackRate) =>
      issueCommand({ type: 'set-playback-rate', rate }),
    loadVideo,
    loadVideoByInput,
    updateQuery,
    markPlayerStatus,
    clearSearchError: () => {
      setSearchError(null);
      setSearchStatus('idle');
    },
  };
}

export type SharedYouTubeSessionApi = ReturnType<typeof useSharedYouTubeSession>;
