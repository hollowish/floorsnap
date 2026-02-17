import { useEffect, useRef, useState, useCallback } from 'react';

const CAMERA_CONSTRAINTS = {
  video: {
    facingMode: { ideal: 'environment' },
    width: { ideal: 1920 },
    height: { ideal: 1080 },
  },
  audio: false,
};

const ERROR_MESSAGES = {
  NotAllowedError: 'Camera access was denied. Please allow camera permissions and try again.',
  NotFoundError: 'No camera found on this device.',
  NotReadableError: 'Camera is in use by another app. Close other camera apps and try again.',
  OverconstrainedError: 'Camera does not support the requested settings.',
  AbortError: 'Camera access was interrupted. Please try again.',
};

/**
 * Manages getUserMedia lifecycle for camera capture.
 * Returns videoRef to attach to a <video> element.
 */
export function useCamera() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    setIsReady(false);
    stopStream();

    try {
      const stream = await navigator.mediaDevices.getUserMedia(CAMERA_CONSTRAINTS);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsReady(true);
      }
    } catch (err) {
      const message = ERROR_MESSAGES[err.name] || `Camera error: ${err.message}`;
      setError(message);
    }
  }, [stopStream]);

  const restart = useCallback(() => {
    startCamera();
  }, [startCamera]);

  useEffect(() => {
    startCamera();
    return stopStream;
  }, [startCamera, stopStream]);

  return { videoRef, isReady, error, restart };
}
