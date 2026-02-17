import { useEffect, useState, useCallback, useRef } from 'react';

const THROTTLE_MS = 100; // ~10 updates/sec

/**
 * Subscribes to device orientation for compass heading.
 * Best-effort — returns heading=null if unsupported or denied.
 *
 * iOS 13+ requires explicit permission request from a user gesture.
 * Android/desktop auto-listens on deviceorientationabsolute with deviceorientation fallback.
 */
export function useCompass() {
  const [heading, setHeading] = useState(null);
  const [isSupported, setIsSupported] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState(null);
  const lastUpdateRef = useRef(0);
  const listenerRef = useRef(null);

  const handleOrientation = useCallback((event) => {
    const now = Date.now();
    if (now - lastUpdateRef.current < THROTTLE_MS) return;
    lastUpdateRef.current = now;

    let compassHeading = null;

    if (event.webkitCompassHeading !== undefined) {
      // iOS Safari — webkitCompassHeading is already compass-relative (0=N, 90=E)
      compassHeading = event.webkitCompassHeading;
    } else if (event.alpha !== null && event.alpha !== undefined) {
      // Chrome/Android — alpha is rotation from north, but inverted
      compassHeading = (360 - event.alpha) % 360;
    }

    if (compassHeading !== null) {
      setHeading(Math.round(compassHeading));
    }
  }, []);

  const startListening = useCallback(() => {
    // Try absolute orientation first (Chrome/Android), fall back to regular
    const hasAbsolute = 'ondeviceorientationabsolute' in window;

    const eventName = hasAbsolute ? 'deviceorientationabsolute' : 'deviceorientation';
    listenerRef.current = { eventName, handler: handleOrientation };
    window.addEventListener(eventName, handleOrientation);
    setHasPermission(true);
  }, [handleOrientation]);

  const requestPermission = useCallback(async () => {
    try {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        const result = await DeviceOrientationEvent.requestPermission();
        if (result === 'granted') {
          startListening();
        } else {
          setError('Compass permission denied.');
          setHasPermission(false);
        }
      }
    } catch (err) {
      setError(`Compass error: ${err.message}`);
    }
  }, [startListening]);

  useEffect(() => {
    // Check if device orientation is available at all
    const hasOrientation =
      'DeviceOrientationEvent' in window ||
      'ondeviceorientationabsolute' in window;

    if (!hasOrientation) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);

    // iOS 13+ requires explicit permission
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      // Don't auto-request — needs user gesture. Caller will use requestPermission().
      return;
    }

    // Android / desktop — auto-listen
    startListening();

    return () => {
      if (listenerRef.current) {
        window.removeEventListener(
          listenerRef.current.eventName,
          listenerRef.current.handler
        );
      }
    };
  }, [startListening]);

  return { heading, isSupported, hasPermission, requestPermission, error };
}
