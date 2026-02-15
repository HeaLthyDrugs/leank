'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const SPEAKING_THRESHOLD = 15; // Frequency data value threshold (0-255)
const SILENCE_DELAY = 300; // ms to wait before marking as not speaking (hysteresis)
const POLL_INTERVAL = 50; // ms between audio level checks (~20fps)

/**
 * Hook that uses Web Audio API to detect when the local user is speaking.
 * Uses AnalyserNode to sample audio frequency data and applies threshold + hysteresis
 * to avoid rapid flickering between speaking/silent states.
 */
export function useAudioLevel(stream: MediaStream | null, isAudioEnabled: boolean) {
    const [isSpeaking, setSpeaking] = useState(false);
    const [audioLevel, setAudioLevel] = useState(0);

    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const animFrameRef = useRef<number | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const cleanup = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        if (animFrameRef.current) {
            cancelAnimationFrame(animFrameRef.current);
            animFrameRef.current = null;
        }
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }
        if (sourceRef.current) {
            try { sourceRef.current.disconnect(); } catch { /* ignore */ }
            sourceRef.current = null;
        }
        if (analyserRef.current) {
            try { analyserRef.current.disconnect(); } catch { /* ignore */ }
            analyserRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            try { audioContextRef.current.close(); } catch { /* ignore */ }
            audioContextRef.current = null;
        }
        setSpeaking(false);
        setAudioLevel(0);
    }, []);

    useEffect(() => {
        // Don't analyze if muted or no stream
        if (!stream || !isAudioEnabled) {
            cleanup();
            return;
        }

        const audioTrack = stream.getAudioTracks()[0];
        if (!audioTrack || !audioTrack.enabled) {
            cleanup();
            return;
        }

        // Create AudioContext and AnalyserNode
        const audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.5;

        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        // Don't connect to destination - we don't want to hear our own audio

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        sourceRef.current = source;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        // Poll audio levels at regular intervals
        intervalRef.current = setInterval(() => {
            if (!analyserRef.current) return;

            analyserRef.current.getByteFrequencyData(dataArray);

            // Calculate average audio level
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
            }
            const average = sum / bufferLength;

            // Normalize to 0-100 range for consumers
            const normalizedLevel = Math.min(100, Math.round((average / 128) * 100));
            setAudioLevel(normalizedLevel);

            if (average > SPEAKING_THRESHOLD) {
                // User is speaking
                if (silenceTimerRef.current) {
                    clearTimeout(silenceTimerRef.current);
                    silenceTimerRef.current = null;
                }
                setSpeaking(true);
            } else {
                // User stopped speaking - apply hysteresis delay
                if (!silenceTimerRef.current) {
                    silenceTimerRef.current = setTimeout(() => {
                        setSpeaking(false);
                        silenceTimerRef.current = null;
                    }, SILENCE_DELAY);
                }
            }
        }, POLL_INTERVAL);

        return cleanup;
    }, [stream, isAudioEnabled, cleanup]);

    return { isSpeaking, audioLevel };
}
