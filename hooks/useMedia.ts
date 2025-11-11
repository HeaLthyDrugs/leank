'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export function useMedia() {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const startMedia = useCallback(async (audio = true, video = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio, video });
      setLocalStream(stream);
      setIsAudioEnabled(audio && stream.getAudioTracks().length > 0);
      setIsVideoEnabled(video && stream.getVideoTracks().length > 0);
      setError(null);
      return stream;
    } catch (err) {
      try {
        const audioOnly = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        setLocalStream(audioOnly);
        setIsAudioEnabled(true);
        setIsVideoEnabled(false);
        setError(null);
        return audioOnly;
      } catch (audioErr) {
        console.log('No media devices available');
        setError(null);
        return null;
      }
    }
  }, []);

  const stopMedia = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
  }, [localStream]);

  const toggleAudio = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  }, [localStream]);

  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  }, [localStream]);

  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      return stream;
    } catch (err) {
      console.error('Screen share failed:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopMedia();
    };
  }, [stopMedia]);

  return {
    localStream,
    isAudioEnabled,
    isVideoEnabled,
    error,
    startMedia,
    stopMedia,
    toggleAudio,
    toggleVideo,
    startScreenShare
  };
}
