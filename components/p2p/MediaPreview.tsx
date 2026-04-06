'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Mic, MicOff, Video, VideoOff, AlertTriangle } from 'lucide-react';

interface MediaPreviewProps {
  onPreferencesChange?: (prefs: { audio: boolean; video: boolean }) => void;
}

const MEDIA_PREFS_KEY = 'leank_media_prefs';

export function MediaPreview({ onPreferencesChange }: MediaPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Audio analyser refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const cleanupAudio = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try { audioContextRef.current.close(); } catch { /* ignore */ }
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevel(0);
  }, []);

  // Initialize media
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      setIsInitializing(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        setLocalStream(stream);
        setError(null);
      } catch {
        // Try audio only
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
          setLocalStream(stream);
          setIsVideoEnabled(false);
          setError(null);
        } catch {
          setError('Could not access camera or microphone. Check browser permissions.');
        }
      }
      if (!cancelled) setIsInitializing(false);
    };

    init();

    return () => {
      cancelled = true;
    };
  }, []);

  // Attach stream to video element
  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
      videoRef.current.play().catch(() => {});
    }
  }, [localStream]);

  // Audio level meter
  useEffect(() => {
    if (!localStream || !isAudioEnabled) {
      cleanupAudio();
      return;
    }

    const audioTrack = localStream.getAudioTracks()[0];
    if (!audioTrack || !audioTrack.enabled) {
      cleanupAudio();
      return;
    }

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.5;

    const source = audioContext.createMediaStreamSource(localStream);
    source.connect(analyser);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    intervalRef.current = setInterval(() => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArray);

      let sum = 0;
      for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
      const average = sum / bufferLength;
      const normalized = Math.min(100, Math.round((average / 128) * 100));
      setAudioLevel(normalized);
    }, 50);

    return cleanupAudio;
  }, [localStream, isAudioEnabled, cleanupAudio]);

  // Toggle audio
  const toggleAudio = () => {
    if (!localStream) return;
    const track = localStream.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsAudioEnabled(track.enabled);
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (!localStream) return;
    const track = localStream.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsVideoEnabled(track.enabled);
    }
  };

  // Persist preferences
  useEffect(() => {
    const prefs = { audio: isAudioEnabled, video: isVideoEnabled };
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(MEDIA_PREFS_KEY, JSON.stringify(prefs));
    }
    onPreferencesChange?.(prefs);
  }, [isAudioEnabled, isVideoEnabled, onPreferencesChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
      }
      cleanupAudio();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[200px] border-2 border-dashed border-gray-300 p-6 text-center">
        <AlertTriangle className="text-yellow-600 mb-3" size={32} />
        <p className="text-sm font-bold uppercase mb-1">Device Access Issue</p>
        <p className="text-xs font-mono text-gray-500">{error}</p>
      </div>
    );
  }

  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[200px] border-2 border-dashed border-gray-300 p-6 text-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent animate-spin mb-3" />
        <p className="text-xs font-mono text-gray-500 uppercase">Accessing devices...</p>
      </div>
    );
  }

  return (
    <div className="border-2 border-black bg-white overflow-hidden">
      {/* Video preview */}
      <div className="relative aspect-video bg-gray-100">
        {isVideoEnabled && localStream?.getVideoTracks().length ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover -scale-x-100"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <div className="w-20 h-20 border-2 border-black bg-black flex items-center justify-center text-white text-2xl font-bold">
              YOU
            </div>
          </div>
        )}

        {/* Audio level indicator bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
          <div
            className="h-full bg-green-500 transition-all duration-75"
            style={{ width: `${isAudioEnabled ? audioLevel : 0}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 p-3 border-t-2 border-black bg-gray-50">
        <button
          onClick={toggleAudio}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase border-2 border-black transition-all ${
            isAudioEnabled
              ? 'bg-black text-white hover:bg-gray-800'
              : 'bg-red-600 border-red-600 text-white hover:bg-red-700'
          }`}
        >
          {isAudioEnabled ? <Mic size={14} /> : <MicOff size={14} />}
          {isAudioEnabled ? 'Mic On' : 'Mic Off'}
        </button>

        <button
          onClick={toggleVideo}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase border-2 border-black transition-all ${
            isVideoEnabled
              ? 'bg-black text-white hover:bg-gray-800'
              : 'bg-red-600 border-red-600 text-white hover:bg-red-700'
          }`}
        >
          {isVideoEnabled ? <Video size={14} /> : <VideoOff size={14} />}
          {isVideoEnabled ? 'Cam On' : 'Cam Off'}
        </button>
      </div>

      {/* Audio level meter label */}
      {isAudioEnabled && audioLevel > 5 && (
        <div className="px-3 py-1 bg-green-50 border-t border-green-200 text-center">
          <p className="text-[10px] font-mono text-green-700 uppercase">● Mic is picking up audio</p>
        </div>
      )}
    </div>
  );
}
