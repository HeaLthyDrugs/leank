'use client';

import { useState, useCallback } from 'react';

export interface MediaPermissions {
  audio: boolean;
  video: boolean;
}

export function useMediaPermissions() {
  const [permissions, setPermissions] = useState<MediaPermissions>({
    audio: false,
    video: false
  });
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkPermissions = useCallback(async () => {
    setIsChecking(true);
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: true 
      });
      
      stream.getTracks().forEach(track => track.stop());
      
      setPermissions({ audio: true, video: true });
      setIsChecking(false);
      return true;
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera and microphone access denied. Please allow permissions.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera or microphone found on this device.');
      } else {
        setError('Failed to access media devices.');
      }
      setIsChecking(false);
      return false;
    }
  }, []);

  return { permissions, isChecking, error, checkPermissions };
}
