'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Link2,
  Loader2,
  Play,
  Search,
} from 'lucide-react';
import type { SharedYouTubeSessionApi } from '@/hooks/useSharedYouTubeSession';
import type { Peer } from '@/contexts/RoomContext';
import type { PeerAudioStatus } from '@/hooks/useAudioStatus';
import { YOUTUBE_DRIFT_THRESHOLD_SEC } from '@/lib/youtube';

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: string | HTMLElement,
        options: {
          width?: string | number;
          height?: string | number;
          videoId?: string;
          playerVars?: Record<string, string | number>;
          events?: {
            onReady?: (event: { target: YouTubePlayerInstance }) => void;
            onStateChange?: (event: { data: number; target: YouTubePlayerInstance }) => void;
            onError?: (event: { data: number; target: YouTubePlayerInstance }) => void;
          };
        },
      ) => YouTubePlayerInstance;
      PlayerState: {
        UNSTARTED: number;
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

type YouTubePlayerInstance = {
  cueVideoById: (options: { videoId: string; startSeconds?: number }) => void;
  loadVideoById: (options: { videoId: string; startSeconds?: number }) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  setPlaybackRate: (rate: number) => void;
  setVolume: (volume: number) => void;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  getVideoData: () => { video_id: string };
  destroy: () => void;
};

let youtubeIframeApiPromise: Promise<typeof window.YT> | null = null;

function loadYouTubeIframeApi() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('YouTube IFrame API is only available in the browser.'));
  }

  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }

  if (!youtubeIframeApiPromise) {
    youtubeIframeApiPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>(
        'script[src="https://www.youtube.com/iframe_api"]',
      );

      const previousReadyHandler = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previousReadyHandler?.();
        if (window.YT?.Player) {
          resolve(window.YT);
        }
      };

      if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.async = true;
        script.onerror = () => reject(new Error('Failed to load the YouTube IFrame API.'));
        document.body.appendChild(script);
      }
    });
  }

  return youtubeIframeApiPromise;
}

interface YouTubeWorkspaceProps {
  localStream: MediaStream | null;
  peers: Map<string, Peer>;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  localIsSpeaking: boolean;
  peerAudioStatuses: Map<string, PeerAudioStatus>;
  participantId: string;
  isHost: boolean;
  youtubeSession: SharedYouTubeSessionApi;
}

export function YouTubeWorkspace({
  localStream: _localStream,
  peers: _peers,
  isVideoEnabled: _isVideoEnabled,
  isAudioEnabled: _isAudioEnabled,
  localIsSpeaking: _localIsSpeaking,
  peerAudioStatuses: _peerAudioStatuses,
  participantId: _participantId,
  isHost: _isHost,
  youtubeSession,
}: YouTubeWorkspaceProps) {
  const {
    sessionState,
    isController,
    hasActiveController,
    searchStatus,
    searchError,
    takeControl,
    play,
    pause,
    loadVideo,
    loadVideoByInput,
    updateQuery,
    markPlayerStatus,
    clearSearchError,
  } = youtubeSession;

  const playerHostRef = useRef<HTMLDivElement>(null);
  const playerShellRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayerInstance | null>(null);
  const suppressPlayerEventsUntilRef = useRef(0);
  const autoplayCheckTimeoutRef = useRef<number | null>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [directInput, setDirectInput] = useState('');
  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(true);
  const [activeInputTab, setActiveInputTab] = useState<'search' | 'direct'>('search');
  const [directInputError, setDirectInputError] = useState<string | null>(null);
  const [playerErrorState, setPlayerErrorState] = useState<{ videoId: string | null; message: string | null }>({
    videoId: null,
    message: null,
  });
  const [autoplayBlockedVideoId, setAutoplayBlockedVideoId] = useState<string | null>(null);

  const sharedVideoIdRef = useRef<string | null>(null);
  const playRef = useRef(play);
  const pauseRef = useRef(pause);
  const markPlayerStatusRef = useRef(markPlayerStatus);
  const sharedVideoId = sessionState.player.videoId;
  const playerError =
    playerErrorState.videoId === sessionState.player.videoId ? playerErrorState.message : null;
  const autoplayBlocked = autoplayBlockedVideoId === sessionState.player.videoId;
  const isPlaybackControlledByOther =
    hasActiveController &&
    sessionState.controllerId !== null &&
    sessionState.controllerId !== _participantId;

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (window.innerWidth < 1280) {
      setIsSearchPanelOpen(false);
    }
  }, []);

  useEffect(() => {
    sharedVideoIdRef.current = sharedVideoId;
  }, [sharedVideoId]);

  useEffect(() => {
    playRef.current = play;
  }, [play]);

  useEffect(() => {
    pauseRef.current = pause;
  }, [pause]);

  useEffect(() => {
    markPlayerStatusRef.current = markPlayerStatus;
  }, [markPlayerStatus]);

  useEffect(() => {
    let isCancelled = false;

    if (!playerHostRef.current || playerRef.current) {
      return;
    }

    loadYouTubeIframeApi()
      .then((YT) => {
        if (!YT?.Player) {
          throw new Error('YouTube IFrame API did not expose Player.');
        }

        if (isCancelled || !playerHostRef.current || playerRef.current) {
          return;
        }

        playerRef.current = new YT.Player(playerHostRef.current, {
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: 0,
            controls: 1,
            playsinline: 1,
            rel: 0,
            modestbranding: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (event) => {
              setPlayerReady(true);
              event.target.setVolume(100);
            },
            onStateChange: (event) => {
              const player = event.target;
              const now = Date.now();

              if (now < suppressPlayerEventsUntilRef.current) {
                return;
              }

              if (!sharedVideoIdRef.current) {
                return;
              }

              if (event.data === window.YT?.PlayerState.PLAYING) {
                setAutoplayBlockedVideoId(null);
                void playRef.current(player.getCurrentTime() || 0);
                return;
              }

              if (event.data === window.YT?.PlayerState.PAUSED) {
                const duration = player.getDuration() || 0;
                const currentTime = player.getCurrentTime() || 0;
                if (duration > 0 && Math.abs(duration - currentTime) <= 0.75) {
                  markPlayerStatusRef.current('ended', duration);
                  return;
                }

                void pauseRef.current(currentTime);
                return;
              }

              if (event.data === window.YT?.PlayerState.ENDED) {
                const endedAt = player.getDuration() || player.getCurrentTime() || 0;
                markPlayerStatusRef.current('ended', endedAt);
              }
            },
            onError: (event) => {
              console.error('[YouTubeWorkspace] Player error', event.data);
              setPlayerErrorState({
                videoId: sharedVideoIdRef.current,
                message: 'This video cannot be embedded or played here. Pick another result.',
              });
              markPlayerStatusRef.current('error', playerRef.current?.getCurrentTime() || 0);
            },
          },
        });
      })
      .catch((error) => {
        console.error('[YouTubeWorkspace] Failed to initialize player', error);
        setPlayerErrorState({
          videoId: sharedVideoIdRef.current,
          message: 'The YouTube player failed to load. Refresh the room and try again.',
        });
      });

    return () => {
      isCancelled = true;
      if (autoplayCheckTimeoutRef.current) {
        window.clearTimeout(autoplayCheckTimeoutRef.current);
      }
      playerRef.current?.destroy();
      playerRef.current = null;
      setPlayerReady(false);
    };
  }, []);

  useEffect(() => {
    if (!playerReady || !playerRef.current) {
      return;
    }

    const player = playerRef.current;
    const targetPlayerState = sessionState.player;

    if (!targetPlayerState.videoId) {
      player.pauseVideo();
      return;
    }

    const currentVideoId = player.getVideoData()?.video_id ?? null;
    const targetTime = Math.max(0, targetPlayerState.currentTimeSec);
    const shouldReloadVideo = currentVideoId !== targetPlayerState.videoId;

    suppressPlayerEventsUntilRef.current = Date.now() + 800;

    if (shouldReloadVideo) {
      if (targetPlayerState.status === 'playing' || targetPlayerState.status === 'buffering') {
        player.loadVideoById({
          videoId: targetPlayerState.videoId,
          startSeconds: targetTime,
        });
      } else {
        player.cueVideoById({
          videoId: targetPlayerState.videoId,
          startSeconds: targetTime,
        });
      }
    } else {
      const currentTime = player.getCurrentTime() || 0;
      if (Math.abs(currentTime - targetTime) > YOUTUBE_DRIFT_THRESHOLD_SEC) {
        player.seekTo(targetTime, true);
      }
    }

    player.setPlaybackRate(targetPlayerState.playbackRate);

    if (targetPlayerState.status === 'playing' || targetPlayerState.status === 'buffering') {
      player.playVideo();

      if (autoplayCheckTimeoutRef.current) {
        window.clearTimeout(autoplayCheckTimeoutRef.current);
      }

      autoplayCheckTimeoutRef.current = window.setTimeout(() => {
        if (!playerRef.current) {
          return;
        }

        const state = playerRef.current.getPlayerState();
        if (
          state !== window.YT?.PlayerState.PLAYING &&
          state !== window.YT?.PlayerState.BUFFERING
        ) {
          setAutoplayBlockedVideoId(sharedVideoIdRef.current);
        }
      }, 1200);
    } else {
      if (autoplayCheckTimeoutRef.current) {
        window.clearTimeout(autoplayCheckTimeoutRef.current);
      }
      player.pauseVideo();
    }

  }, [playerReady, sessionState.player]);

  const handleDirectLoad = async () => {
    const result = await loadVideoByInput(directInput);
    if (!result.ok) {
      setDirectInputError(result.error ?? 'We could not load that video.');
      return;
    }

    setDirectInput('');
    setDirectInputError(null);
  };

  const emptyResultsMessage = useMemo(() => {
    if (searchStatus === 'loading' && sessionState.results.length === 0) {
      return 'Searching YouTube...';
    }

    if (searchError) {
      return null;
    }

    if (sessionState.query.trim().length < 2) {
      return 'Type at least 2 characters to search the shared workspace.';
    }

    if (sessionState.results.length === 0) {
      return 'No shared results yet. Try a different search term.';
    }

    return null;
  }, [searchError, searchStatus, sessionState.query, sessionState.results.length]);

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#f3f0e8]">

      {(playerError || sessionState.player.status === 'error' || autoplayBlocked) && (
        <div className="border-b-2 border-black">
          {(playerError || sessionState.player.status === 'error') && (
            <div className="flex items-start gap-2 bg-[#ffd7d2] px-4 py-3">
              <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
              <p className="text-sm font-medium">
                {playerError ?? 'This video could not be embedded in the shared workspace. Choose another result.'}
              </p>
            </div>
          )}

          {autoplayBlocked && (
            <div className="flex items-center justify-between gap-3 bg-[#fff2c8] px-4 py-3">
              <p className="text-sm font-medium">
                Shared playback is ready, but your browser blocked autoplay locally.
              </p>
              <button
                onClick={() => {
                  setAutoplayBlockedVideoId(null);
                  playerRef.current?.playVideo();
                }}
                className="inline-flex items-center gap-2 border-2 border-black bg-black px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-white"
              >
                <Play size={14} />
                Click To Start Here
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden xl:flex-row">
        <div className="flex min-h-[52vh] min-w-0 flex-1 flex-col border-b-2 border-black bg-[#f7f6f1] xl:min-h-0 xl:border-b-0 xl:border-r-2">
          <div ref={playerShellRef} className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto p-3 sm:p-4">
            <div className="min-w-0 overflow-hidden border-2 border-black bg-white shadow-[6px_6px_0_0_#000]">
              <div className="yt-stage-frame relative w-full overflow-hidden bg-black">
                <div className="yt-stage-spacer" aria-hidden="true" />
                {!sharedVideoId && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-white">
                    <Clapperboard size={40} />
                    <div className="space-y-1">
                      <p className="text-lg font-black uppercase">Pick a YouTube video</p>
                      <p className="text-sm text-white/70">
                        Search on the right, or paste a valid YouTube watch link or video ID.
                      </p>
                    </div>
                  </div>
                )}
                <div ref={playerHostRef} className="yt-player-host absolute inset-0 h-full w-full" />
              </div>
            </div>
          </div>

        </div>

        <div className="hidden items-center justify-end border-b-2 border-black bg-[#f3f0e8] px-3 py-2 xl:flex xl:border-b-0 xl:border-l-2 xl:border-r-2 xl:px-2">
          <button
            onClick={() => setIsSearchPanelOpen((prev) => !prev)}
            className="inline-flex h-9 w-9 items-center justify-center border-2 border-black bg-black text-white transition-colors hover:bg-white hover:text-black"
            aria-expanded={isSearchPanelOpen}
            aria-label={isSearchPanelOpen ? 'Close search panel' : 'Open search panel'}
            title={isSearchPanelOpen ? 'Hide search panel' : 'Show search panel'}
          >
            {isSearchPanelOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {isSearchPanelOpen && (
          <button
            className="fixed inset-0 z-30 bg-black/30 xl:hidden"
            onClick={() => setIsSearchPanelOpen(false)}
            aria-label="Close search drawer backdrop"
          />
        )}

        <aside
          className={`fixed inset-x-0 bottom-0 z-40 flex min-h-0 w-full flex-col overflow-hidden border-2 border-black bg-[#f8f4eb] transition-all duration-300 ease-out xl:static xl:z-auto xl:border-0 ${
            isSearchPanelOpen
              ? 'max-h-[78vh] translate-y-0 xl:h-full xl:max-h-none xl:w-[360px]'
              : 'max-h-[78vh] translate-y-full xl:h-full xl:max-h-none xl:w-0 xl:translate-y-0'
          }`}
        >
          <div className="border-b-2 border-black bg-white p-3">
            <div className="mb-3 inline-flex w-full border-2 border-black">
              <button
                onClick={() => setActiveInputTab('search')}
                className={`w-1/2 px-3 py-2 text-[11px] font-bold uppercase tracking-wide ${activeInputTab === 'search' ? 'bg-black text-white' : 'bg-white text-black'}`}
              >
                Shared Search
              </button>
              <button
                onClick={() => setActiveInputTab('direct')}
                className={`w-1/2 border-l-2 border-black px-3 py-2 text-[11px] font-bold uppercase tracking-wide ${activeInputTab === 'direct' ? 'bg-black text-white' : 'bg-white text-black'}`}
              >
                Direct Load
              </button>
            </div>

            {activeInputTab === 'search' ? (
              <div className="space-y-2">
                <div className="mb-2 flex items-center gap-2 text-sm font-black uppercase tracking-[0.12em]">
                  <Search size={16} />
                  Search
                </div>
                <div className="border-2 border-black bg-white">
                  <input
                    value={sessionState.query}
                    readOnly={isPlaybackControlledByOther}
                    onClick={() => {
                      if (!isController) {
                        void takeControl();
                      }
                    }}
                    onFocus={() => {
                      if (!isController) {
                        void takeControl();
                      }
                    }}
                    onChange={(event) => {
                      setDirectInputError(null);
                      void updateQuery(event.target.value);
                    }}
                    placeholder={isPlaybackControlledByOther ? 'Take control to edit the shared query.' : 'Search YouTube videos...'}
                    className="w-full bg-white px-4 py-3 text-sm font-medium outline-none placeholder:text-black/40"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="mb-2 flex items-center gap-2 text-sm font-black uppercase tracking-[0.12em]">
                  <Link2 size={16} />
                  Direct Load
                </div>
                <textarea
                  value={directInput}
                  onChange={(event) => setDirectInput(event.target.value)}
                  placeholder="Paste a youtube.com/watch link, youtu.be link, or 11-character video ID."
                  className="min-h-[82px] w-full border-2 border-black bg-white px-4 py-3 text-sm font-medium outline-none placeholder:text-black/40"
                />
                {directInputError && (
                  <div className="border-2 border-red-500 bg-[#ffe6df] px-3 py-2 text-xs font-medium text-red-900">
                    {directInputError}
                  </div>
                )}
                <button
                  onClick={() => void handleDirectLoad()}
                  className="inline-flex w-full items-center justify-center gap-2 border-2 border-black bg-black px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-white hover:text-black"
                >
                  <Link2 size={14} />
                  Load Shared Video
                </button>
              </div>
            )}

            <div className="mt-2 rounded-none border-2 border-black bg-[#fff8e6] px-3 py-2 text-[11px] font-mono uppercase text-black/70">
              Shared results sync for everyone. Only active controller calls the YouTube API.
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clapperboard size={16} />
                <h3 className="text-sm font-black uppercase tracking-[0.2em]">Results</h3>
              </div>
              {searchStatus === 'loading' && <Loader2 size={16} className="animate-spin" />}
            </div>

            <div className="space-y-3">
              {searchStatus === 'loading' && sessionState.results.length > 0 && (
                <div className="flex items-center gap-2 border-2 border-dashed border-black/30 bg-white px-3 py-2 text-xs font-medium text-black/70">
                  <Loader2 size={14} className="animate-spin" />
                  Updating shared results...
                </div>
              )}

              {searchError && (
                <div className="flex items-start justify-between gap-2 border-2 border-[#e0a89a] bg-[#fff1eb] px-3 py-2 text-xs font-medium text-[#6f2010]">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                    <span>{searchError}</span>
                  </div>
                  <button
                    onClick={clearSearchError}
                    className="border border-black bg-white px-2 py-1 text-[10px] font-bold uppercase text-black"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {emptyResultsMessage && (
                <div className="min-h-[120px] border-2 border-dashed border-black/30 bg-white px-4 py-6 text-center text-sm font-medium text-black/60">
                  {emptyResultsMessage}
                </div>
              )}

              {sessionState.results.map((result) => (
                <button
                  key={result.videoId}
                  onClick={() => void loadVideo(result.videoId, 0)}
                  className="flex w-full gap-3 border-2 border-black bg-white p-3 text-left transition-transform hover:-translate-y-0.5 hover:bg-[#f5f0e3]"
                >
                  <img
                    src={result.thumbnailUrl}
                    alt={result.title}
                    className="h-20 w-32 border-2 border-black object-cover"
                  />
                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div>
                      <p className="line-clamp-2 text-sm font-black uppercase leading-tight">{result.title}</p>
                      <p className="mt-1 text-[11px] font-mono uppercase text-black/60">
                        {result.channelTitle}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span className="text-[10px] font-mono uppercase text-black/50">
                        {new Date(result.publishedAt).toLocaleDateString()}
                      </span>
                      <span className="inline-flex items-center gap-2 border border-black px-2 py-1 text-[10px] font-bold uppercase tracking-wide">
                        Load
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <button
          onClick={() => setIsSearchPanelOpen((prev) => !prev)}
          className="fixed bottom-24 right-4 z-50 inline-flex h-11 w-11 items-center justify-center border-2 border-black bg-black text-white shadow-[4px_4px_0_0_#000] transition-colors hover:bg-white hover:text-black xl:hidden"
          aria-expanded={isSearchPanelOpen}
          aria-label={isSearchPanelOpen ? 'Close search drawer' : 'Open search drawer'}
          title={isSearchPanelOpen ? 'Hide search drawer' : 'Show search drawer'}
        >
          {isSearchPanelOpen ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>

      </div>
    </div>
  );
}
