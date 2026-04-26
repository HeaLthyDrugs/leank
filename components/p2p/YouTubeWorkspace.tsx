'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Clapperboard,
  Link2,
  Loader2,
  Lock,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Search,
  Shield,
  Unlock,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { SharedYouTubeSessionApi } from '@/hooks/useSharedYouTubeSession';
import type { Peer } from '@/contexts/RoomContext';
import type { PeerAudioStatus } from '@/hooks/useAudioStatus';
import {
  formatTimecode,
  getLeaseRemainingMs,
  YOUTUBE_ALLOWED_PLAYBACK_RATES,
  YOUTUBE_DRIFT_THRESHOLD_SEC,
} from '@/lib/youtube';

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

function formatParticipantLabel(
  targetParticipantId: string | null,
  participantId: string,
  isHost: boolean,
  peers: Map<string, Peer>,
) {
  if (!targetParticipantId) {
    return 'No controller';
  }

  if (targetParticipantId === participantId) {
    return isHost ? 'You (Host)' : 'You';
  }

  const matchingPeer = Array.from(peers.values()).find(
    (peer) => peer.participantId === targetParticipantId,
  );

  if (matchingPeer?.isHost) {
    return `Host ${targetParticipantId.slice(0, 6).toUpperCase()}`;
  }

  return `Peer ${targetParticipantId.slice(0, 6).toUpperCase()}`;
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
  authorityParticipantId: string | null;
  youtubeSession: SharedYouTubeSessionApi;
}

export function YouTubeWorkspace({
  localStream,
  peers,
  isVideoEnabled,
  isAudioEnabled,
  localIsSpeaking,
  peerAudioStatuses,
  participantId,
  isHost,
  authorityParticipantId,
  youtubeSession,
}: YouTubeWorkspaceProps) {
  const {
    sessionState,
    isController,
    hasActiveController,
    searchStatus,
    searchError,
    takeControl,
    releaseControl,
    closeWorkspace,
    play,
    pause,
    seek,
    setPlaybackRate,
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
  const [durationSec, setDurationSec] = useState(0);
  const [localCurrentTimeSec, setLocalCurrentTimeSec] = useState(0);
  const [scrubTimeSec, setScrubTimeSec] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [directInput, setDirectInput] = useState('');
  const [directInputError, setDirectInputError] = useState<string | null>(null);
  const [playerErrorState, setPlayerErrorState] = useState<{ videoId: string | null; message: string | null }>({
    videoId: null,
    message: null,
  });
  const [autoplayBlockedVideoId, setAutoplayBlockedVideoId] = useState<string | null>(null);
  const [localVolume, setLocalVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [clock, setClock] = useState(0);

  const sharedVideoIdRef = useRef<string | null>(null);
  const playRef = useRef(play);
  const pauseRef = useRef(pause);
  const markPlayerStatusRef = useRef(markPlayerStatus);
  const liveLeaseRemainingMs = getLeaseRemainingMs(
    sessionState.controlLeaseExpiresAt,
    clock || sessionState.updatedAt,
  );
  const controllerLabel = formatParticipantLabel(sessionState.controllerId, participantId, isHost, peers);
  const authorityLabel = formatParticipantLabel(authorityParticipantId, participantId, isHost, peers);
  const sharedVideoId = sessionState.player.videoId;
  const playerError =
    playerErrorState.videoId === sessionState.player.videoId ? playerErrorState.message : null;
  const autoplayBlocked = autoplayBlockedVideoId === sessionState.player.videoId;
  const displayedCurrentTime = isScrubbing ? scrubTimeSec : localCurrentTimeSec;
  const isPlaybackControlledByOther =
    hasActiveController &&
    sessionState.controllerId !== null &&
    sessionState.controllerId !== participantId;

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setClock(Date.now());
    }, 500);

    return () => window.clearInterval(intervalId);
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
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === playerShellRef.current);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

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
            controls: 0,
            playsinline: 1,
            rel: 0,
            modestbranding: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (event) => {
              setPlayerReady(true);
              event.target.setVolume(100);
              setIsMuted(event.target.isMuted());
              setDurationSec(event.target.getDuration() || 0);
            },
            onStateChange: (event) => {
              const player = event.target;
              const now = Date.now();
              setLocalCurrentTimeSec(player.getCurrentTime() || 0);
              setDurationSec(player.getDuration() || 0);
              setIsMuted(player.isMuted());

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

    playerRef.current.setVolume(localVolume);
  }, [localVolume, playerReady]);

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

  useEffect(() => {
    if (!playerReady || !playerRef.current) {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (!playerRef.current) {
        return;
      }

      setLocalCurrentTimeSec(playerRef.current.getCurrentTime() || 0);
      setDurationSec(playerRef.current.getDuration() || 0);
      setIsMuted(playerRef.current.isMuted());
    }, 400);

    return () => window.clearInterval(intervalId);
  }, [playerReady]);

  const handleToggleFullscreen = async () => {
    if (!playerShellRef.current) {
      return;
    }

    if (document.fullscreenElement === playerShellRef.current) {
      await document.exitFullscreen();
      return;
    }

    await playerShellRef.current.requestFullscreen();
  };

  const handleToggleMute = () => {
    if (!playerRef.current) {
      return;
    }

    if (playerRef.current.isMuted()) {
      playerRef.current.unMute();
      setIsMuted(false);
      return;
    }

    playerRef.current.mute();
    setIsMuted(true);
  };

  const handleVolumeChange = (volume: number) => {
    setLocalVolume(volume);
    if (!playerRef.current) {
      return;
    }

    playerRef.current.setVolume(volume);
    if (volume === 0) {
      playerRef.current.mute();
      setIsMuted(true);
      return;
    }

    playerRef.current.unMute();
    setIsMuted(false);
  };

  const handlePlayPause = () => {
    if (!playerRef.current) {
      return;
    }

    const currentTime = playerRef.current.getCurrentTime() || sessionState.player.currentTimeSec || 0;

    if (sessionState.player.status === 'playing' || sessionState.player.status === 'buffering') {
      void pause(currentTime);
      return;
    }

    void play(currentTime);
  };

  const handleSeekCommit = (nextTimeSec: number) => {
    setIsScrubbing(false);
    setScrubTimeSec(nextTimeSec);
    void seek(nextTimeSec);
  };

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
    <div className="flex h-full flex-col bg-[#f3f0e8]">
      <div className="border-b-2 border-black bg-[#fff7df] px-4 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 border-2 border-black bg-black px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-white">
                <Clapperboard size={14} />
                Shared YouTube Workspace
              </span>
              <span className="inline-flex items-center gap-2 border-2 border-black bg-white px-3 py-1 text-[11px] font-mono uppercase">
                Controller: {controllerLabel}
              </span>
              <span className="inline-flex items-center gap-2 border-2 border-black bg-white px-3 py-1 text-[11px] font-mono uppercase">
                <Shield size={14} />
                Authority: {authorityLabel}
              </span>
              {sessionState.controlLeaseExpiresAt && liveLeaseRemainingMs > 0 && (
                <span className="inline-flex items-center gap-2 border-2 border-black bg-white px-3 py-1 text-[11px] font-mono uppercase">
                  Lease: {Math.ceil(liveLeaseRemainingMs / 1000)}s
                </span>
              )}
            </div>

            <p className="max-w-3xl text-sm font-medium text-black/75">
              Search is quota-managed by the active controller. Playback, seeks, and rate changes stay synced;
              volume, mute, and fullscreen remain local to each participant.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isController ? (
              <button
                onClick={() => void takeControl()}
                className="inline-flex items-center gap-2 border-2 border-black bg-black px-4 py-2 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-white hover:text-black"
              >
                <Lock size={14} />
                {isHost ? 'Take Control (Host)' : 'Take Control'}
              </button>
            ) : (
              <button
                onClick={releaseControl}
                className="inline-flex items-center gap-2 border-2 border-black bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-black transition-colors hover:bg-black hover:text-white"
              >
                <Unlock size={14} />
                Release Control
              </button>
            )}

            <button
              onClick={() => void closeWorkspace()}
              className="inline-flex items-center gap-2 border-2 border-black bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-black transition-colors hover:bg-black hover:text-white"
            >
              Close Workspace
            </button>
          </div>
        </div>
      </div>

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

      <div className="flex min-h-0 flex-1 flex-col xl:flex-row">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col border-b-2 border-black bg-[#f7f6f1] xl:border-b-0 xl:border-r-2">
          <div ref={playerShellRef} className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto p-4">
            <div className="min-w-0 overflow-hidden border-2 border-black bg-white shadow-[6px_6px_0_0_#000]">
              <div className="border-b-2 border-black bg-[#e5f0ff] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em]">
                Shared Stage
              </div>

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

              <div className="space-y-4 border-t-2 border-black bg-white p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handlePlayPause}
                      className="inline-flex h-11 items-center justify-center gap-2 border-2 border-black bg-black px-4 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-white hover:text-black"
                    >
                      {sessionState.player.status === 'playing' || sessionState.player.status === 'buffering' ? (
                        <>
                          <Pause size={16} />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play size={16} />
                          Play
                        </>
                      )}
                    </button>

                    <label className="inline-flex items-center gap-2 border-2 border-black bg-white px-3 py-2 text-xs font-bold uppercase tracking-wide">
                      Rate
                      <select
                        value={sessionState.player.playbackRate}
                        onChange={(event) => void setPlaybackRate(Number(event.target.value) as (typeof YOUTUBE_ALLOWED_PLAYBACK_RATES)[number])}
                        className="bg-transparent text-xs font-mono outline-none"
                      >
                        {YOUTUBE_ALLOWED_PLAYBACK_RATES.map((rate) => (
                          <option key={rate} value={rate}>
                            {rate}x
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleToggleMute}
                      className="inline-flex h-11 w-11 items-center justify-center border-2 border-black bg-white text-black transition-colors hover:bg-black hover:text-white"
                    >
                      {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={localVolume}
                      onChange={(event) => handleVolumeChange(Number(event.target.value))}
                      className="h-11 w-28 accent-black"
                    />
                    <button
                      onClick={() => void handleToggleFullscreen()}
                      className="inline-flex h-11 w-11 items-center justify-center border-2 border-black bg-white text-black transition-colors hover:bg-black hover:text-white"
                    >
                      {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <input
                    type="range"
                    min={0}
                    max={Math.max(durationSec, sessionState.player.currentTimeSec, 1)}
                    step={0.25}
                    value={displayedCurrentTime}
                    onChange={(event) => {
                      const nextValue = Number(event.target.value);
                      setIsScrubbing(true);
                      setScrubTimeSec(nextValue);
                    }}
                    onMouseUp={() => handleSeekCommit(scrubTimeSec)}
                    onTouchEnd={() => handleSeekCommit(scrubTimeSec)}
                    className="w-full accent-black"
                  />
                  <div className="flex items-center justify-between text-[11px] font-mono uppercase text-black/70">
                    <span>{formatTimecode(displayedCurrentTime)}</span>
                    <span className="font-bold">{sessionState.player.status}</span>
                    <span>{formatTimecode(durationSec)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <ParticipantStrip
            localStream={localStream}
            peers={peers}
            isVideoEnabled={isVideoEnabled}
            isAudioEnabled={isAudioEnabled}
            localIsSpeaking={localIsSpeaking}
            peerAudioStatuses={peerAudioStatuses}
          />
        </div>

        <aside className="flex w-full flex-col bg-[#f8f4eb] xl:w-[360px]">
          <div className="border-b-2 border-black bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <Search size={16} />
              <h3 className="text-sm font-black uppercase tracking-[0.2em]">Shared Search</h3>
            </div>
            <div className="space-y-3">
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

              <div className="rounded-none border-2 border-black bg-[#fff8e6] px-3 py-2 text-[11px] font-mono uppercase text-black/70">
                Only the active controller calls the YouTube API. Everyone else receives the same normalized results.
              </div>
            </div>
          </div>

          <div className="border-b-2 border-black bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <Link2 size={16} />
              <h3 className="text-sm font-black uppercase tracking-[0.2em]">Direct Load</h3>
            </div>
            <div className="space-y-3">
              <textarea
                value={directInput}
                onChange={(event) => setDirectInput(event.target.value)}
                placeholder="Paste a youtube.com/watch link, youtu.be link, or 11-character video ID."
                className="min-h-[88px] w-full border-2 border-black bg-white px-4 py-3 text-sm font-medium outline-none placeholder:text-black/40"
              />
              {directInputError && (
                <div className="border-2 border-red-500 bg-[#ffe6df] px-3 py-2 text-xs font-medium text-red-900">
                  {directInputError}
                </div>
              )}
              <button
                onClick={() => void handleDirectLoad()}
                className="inline-flex w-full items-center justify-center gap-2 border-2 border-black bg-black px-4 py-3 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-white hover:text-black"
              >
                <Link2 size={14} />
                Load Shared Video
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
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
                        {isController ? 'Load' : 'Take + Load'}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

interface ParticipantStripProps {
  localStream: MediaStream | null;
  peers: Map<string, Peer>;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  localIsSpeaking: boolean;
  peerAudioStatuses: Map<string, PeerAudioStatus>;
}

function ParticipantStrip({
  localStream,
  peers,
  isVideoEnabled,
  isAudioEnabled,
  localIsSpeaking,
  peerAudioStatuses,
}: ParticipantStripProps) {
  return (
    <div className="border-t-2 border-black bg-[#ebe4d7] px-4 py-3">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-black/70">Room Cameras</p>
        <p className="text-[11px] font-mono uppercase text-black/50">{peers.size + 1} participants</p>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        <MiniLocalTile
          stream={localStream}
          isVideoEnabled={isVideoEnabled}
          isAudioEnabled={isAudioEnabled}
          isSpeaking={localIsSpeaking}
        />
        {Array.from(peers.values()).map((peer) => (
          <MiniPeerTile
            key={peer.id}
            peer={peer}
            audioStatus={peerAudioStatuses.get(peer.id)}
          />
        ))}
      </div>
    </div>
  );
}

function MiniLocalTile({
  stream,
  isVideoEnabled,
  isAudioEnabled,
  isSpeaking,
}: {
  stream: MediaStream | null;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isSpeaking: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current || !stream) {
      return;
    }

    videoRef.current.srcObject = stream;
    videoRef.current.play().catch((error) => {
      console.error('[YouTubeWorkspace] Failed to play local strip preview', error);
    });
  }, [stream]);

  return (
    <MiniTileFrame label="You" isSpeaking={isSpeaking && isAudioEnabled} isMuted={!isAudioEnabled}>
      {stream && isVideoEnabled ? (
        <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
      ) : (
        <MiniAvatar label="You" />
      )}
    </MiniTileFrame>
  );
}

function MiniPeerTile({
  peer,
  audioStatus,
}: {
  peer: Peer;
  audioStatus?: PeerAudioStatus;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current || !peer.stream) {
      return;
    }

    videoRef.current.srcObject = peer.stream;
    videoRef.current.play().catch((error) => {
      console.error('[YouTubeWorkspace] Failed to play peer strip preview', error);
    });
  }, [peer.id, peer.stream]);

  const hasVideo = peer.stream
    ? peer.stream.getVideoTracks().some((track) => track.enabled && track.readyState === 'live')
    : false;

  return (
    <MiniTileFrame
      label={peer.participantId ? `Peer ${peer.participantId.slice(0, 4).toUpperCase()}` : `Peer ${peer.id.slice(0, 4).toUpperCase()}`}
      isSpeaking={audioStatus?.isSpeaking ?? peer.isSpeaking ?? false}
      isMuted={audioStatus?.isMuted ?? peer.isMuted ?? false}
    >
      {peer.stream && hasVideo ? (
        <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
      ) : (
        <MiniAvatar label={peer.participantId?.slice(0, 2).toUpperCase() ?? peer.id.slice(0, 2).toUpperCase()} />
      )}
    </MiniTileFrame>
  );
}

function MiniTileFrame({
  label,
  isSpeaking,
  isMuted,
  children,
}: {
  label: string;
  isSpeaking: boolean;
  isMuted: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative h-28 w-40 flex-shrink-0 overflow-hidden border-2 bg-white"
      style={{
        borderColor: isSpeaking ? '#16a34a' : '#000',
        boxShadow: isSpeaking ? '0 0 0 3px rgba(22,163,74,0.18)' : 'none',
      }}
    >
      {children}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black px-2 py-1 text-[10px] font-mono uppercase text-white">
        <span className="truncate">{label}</span>
        {isMuted && <span className="text-[#ffb4b4]">Muted</span>}
      </div>
    </div>
  );
}

function MiniAvatar({ label }: { label: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#f4f4f0]">
      <div className="flex h-14 w-14 items-center justify-center border-2 border-black bg-white text-sm font-black uppercase">
        {label.slice(0, 3)}
      </div>
    </div>
  );
}
