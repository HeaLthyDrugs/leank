export type YouTubeSearchResult = {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  publishedAt: string;
};

export type YouTubePlayerState = {
  status: 'idle' | 'playing' | 'paused' | 'buffering' | 'ended' | 'error';
  videoId: string | null;
  currentTimeSec: number;
  playbackRate: number;
  lastSyncedAt: number;
};

export type YouTubeSessionState = {
  isOpen: boolean;
  controllerId: string | null;
  controlLeaseExpiresAt: number | null;
  query: string;
  results: YouTubeSearchResult[];
  player: YouTubePlayerState;
  updatedBy: string;
  updatedAt: number;
  version: number;
};

export type YouTubeCommand =
  | { type: 'open' | 'close' }
  | { type: 'load-video'; videoId: string; startAtSec?: number }
  | { type: 'play'; atSec: number; issuedAt: number }
  | { type: 'pause'; atSec: number; issuedAt: number }
  | { type: 'seek'; toSec: number; issuedAt: number }
  | { type: 'set-playback-rate'; rate: 0.25 | 0.5 | 1 | 1.25 | 1.5 | 1.75 | 2 };

export type YouTubeControlMessage = {
  type: 'take-control' | 'release-control';
  requestedBy: string;
  requestedAt: number;
  isHost: boolean;
};

export type YouTubeSearchMessage =
  | {
      type: 'query';
      query: string;
      requestedBy: string;
      requestedAt: number;
    }
  | {
      type: 'results';
      query: string;
      requestedBy: string;
      requestedAt: number;
      results: YouTubeSearchResult[];
      error?: string | null;
    };

export type YouTubeSyncRequest = {
  requestedBy: string;
  requestedAt: number;
};

export type YouTubeSyncResponse = {
  requestedBy: string;
  requestedAt: number;
  state: YouTubeSessionState;
};
