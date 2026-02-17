import { useState, useEffect, useRef, useCallback } from 'react';
import { useFloorPlan } from '../../hooks/useFloorPlan';
import { useCamera } from '../../hooks/useCamera';
import { useCompass } from '../../hooks/useCompass';
import { processPhoto } from '../../lib/imageProcessor';
import CameraViewfinder from '../camera/CameraViewfinder';
import CompassOverlay from '../camera/CompassOverlay';
import PhotoPreview from '../camera/PhotoPreview';
import ActionButton from '../ui/ActionButton';

const DIRECTIONS = ['north', 'east', 'south', 'west'];
const DIRECTION_INSTRUCTIONS = {
  north: 'Face the NORTH wall',
  east: 'Face the EAST wall',
  south: 'Face the SOUTH wall',
  west: 'Face the WEST wall',
};

function directionIndexFromStep(step) {
  const map = {
    'capture-north': 0,
    'capture-east': 1,
    'capture-south': 2,
    'capture-west': 3,
  };
  return map[step] ?? 0;
}

/**
 * CameraCapture — Orchestrates 4-direction photo capture with compass overlay.
 *
 * Manages two modes: viewfinder (live camera) and preview (photo review).
 * Syncs direction progress with the store step for ProgressBar updates.
 */
export default function CameraCapture() {
  const { currentStep, setPhoto, goToStep } = useFloorPlan();
  const { videoRef, isReady, error: cameraError, restart } = useCamera();
  const { heading, isSupported, hasPermission, requestPermission } = useCompass();

  const [directionIndex, setDirectionIndex] = useState(() =>
    directionIndexFromStep(currentStep)
  );
  const [mode, setMode] = useState('viewfinder'); // 'viewfinder' | 'preview'
  const [preview, setPreview] = useState(null); // { localUri, blob, width, height, compassHeading }
  const [isCapturing, setIsCapturing] = useState(false);
  const [showCompassBanner, setShowCompassBanner] = useState(false);
  const uncommittedUriRef = useRef(null);

  const direction = DIRECTIONS[directionIndex];

  // Show iOS compass permission banner if needed
  useEffect(() => {
    if (isSupported && !hasPermission) {
      setShowCompassBanner(true);
    }
  }, [isSupported, hasPermission]);

  // Clean up uncommitted blob URL on unmount
  useEffect(() => {
    return () => {
      if (uncommittedUriRef.current) {
        URL.revokeObjectURL(uncommittedUriRef.current);
      }
    };
  }, []);

  const handleCapture = useCallback(async () => {
    if (!videoRef.current || isCapturing) return;
    setIsCapturing(true);

    try {
      const photo = await processPhoto(videoRef.current);
      const compassHeading = heading;

      // Track for cleanup
      uncommittedUriRef.current = photo.localUri;

      setPreview({
        localUri: photo.localUri,
        blob: photo.blob,
        width: photo.width,
        height: photo.height,
        compassHeading,
      });
      setMode('preview');

      // Haptic feedback
      navigator.vibrate?.(50);
    } finally {
      setIsCapturing(false);
    }
  }, [heading, isCapturing, videoRef]);

  const handleUsePhoto = useCallback(() => {
    if (!preview) return;

    const photoData = {
      localUri: preview.localUri,
      compassHeading: preview.compassHeading,
      capturedAt: new Date().toISOString(),
      width: preview.width,
      height: preview.height,
      s3Key: null,
    };

    setPhoto(direction, photoData);

    // Photo is committed — no longer needs cleanup
    uncommittedUriRef.current = null;
    setPreview(null);

    // Advance to next direction or finish
    if (directionIndex < DIRECTIONS.length - 1) {
      const nextIndex = directionIndex + 1;
      setDirectionIndex(nextIndex);
      goToStep(`capture-${DIRECTIONS[nextIndex]}`);
      setMode('viewfinder');
    } else {
      goToStep('analyzing');
    }
  }, [preview, direction, directionIndex, setPhoto, goToStep]);

  const handleRetake = useCallback(() => {
    if (preview) {
      URL.revokeObjectURL(preview.localUri);
      uncommittedUriRef.current = null;
    }
    setPreview(null);
    setMode('viewfinder');
  }, [preview]);

  const handleBack = useCallback(() => {
    goToStep('room-type');
  }, [goToStep]);

  const handleRequestCompass = useCallback(() => {
    requestPermission();
    setShowCompassBanner(false);
  }, [requestPermission]);

  // ── Camera Error State ──
  if (cameraError) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-black px-6 text-center">
        <div className="w-16 h-16 mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M15 9l-6 6M9 9l6 6" />
          </svg>
        </div>
        <p className="text-white text-lg font-semibold mb-2">Camera Unavailable</p>
        <p className="text-white/60 text-sm mb-8 max-w-xs">{cameraError}</p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <ActionButton label="Try Again" variant="primary" onClick={restart} />
          <ActionButton
            label="Back"
            variant="ghost"
            className="text-white/70 hover:text-white hover:bg-white/10"
            onClick={handleBack}
          />
        </div>
      </div>
    );
  }

  const isPreview = mode === 'preview' && preview;

  // Always render the video element so videoRef stays attached to the same DOM node.
  // During preview, it's hidden behind the preview layer but keeps the stream alive.
  return (
    <div className="relative w-full h-full bg-black">
      {/* Camera feed — always mounted to keep videoRef stable */}
      <CameraViewfinder videoRef={videoRef} />

      {/* ── Preview layer (overlays the viewfinder) ── */}
      {isPreview && (
        <div className="absolute inset-0 z-30">
          <PhotoPreview
            localUri={preview.localUri}
            direction={direction}
            compassHeading={preview.compassHeading}
            onUsePhoto={handleUsePhoto}
            onRetake={handleRetake}
          />
        </div>
      )}

      {/* ── Viewfinder overlays (hidden during preview) ── */}
      {!isPreview && (
        <>
          {/* Top overlay — direction instruction + compass */}
          <div className="absolute inset-x-0 top-0 z-10">
            <div className="bg-gradient-to-b from-black/70 via-black/40 to-transparent px-4 pt-4 pb-10">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-white font-bold text-lg">
                  {DIRECTION_INSTRUCTIONS[direction]}
                </h2>
              </div>
              <CompassOverlay
                heading={heading}
                isSupported={isSupported}
                hasPermission={hasPermission}
              />
            </div>
          </div>

          {/* iOS compass permission banner */}
          {showCompassBanner && (
            <div className="absolute top-24 inset-x-4 z-20 bg-blueprint-700/90 backdrop-blur-sm rounded-xl px-4 py-3 flex items-center gap-3">
              <span className="text-white text-sm flex-1">
                Enable compass for heading data?
              </span>
              <button
                onClick={handleRequestCompass}
                className="text-white font-semibold text-sm bg-white/20 rounded-lg px-3 py-1.5 active:bg-white/30"
              >
                Enable
              </button>
              <button
                onClick={() => setShowCompassBanner(false)}
                className="text-white/60 text-sm px-1"
              >
                Skip
              </button>
            </div>
          )}

          {/* Bottom overlay — progress + capture button */}
          <div className="absolute inset-x-0 bottom-0 z-10">
            <div className="bg-gradient-to-t from-black/80 via-black/50 to-transparent px-4 pt-10 pb-8">
              {/* Progress dots */}
              <div className="flex items-center justify-center gap-2.5 mb-6">
                {DIRECTIONS.map((d, i) => (
                  <div
                    key={d}
                    className={`w-2.5 h-2.5 rounded-full transition-colors duration-200 ${
                      i < directionIndex
                        ? 'bg-green-400'
                        : i === directionIndex
                          ? 'bg-white'
                          : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>

              {/* Capture button + count */}
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={handleCapture}
                  disabled={!isReady || isCapturing}
                  className="w-[72px] h-[72px] rounded-full border-[4px] border-white flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40"
                  aria-label={`Capture ${direction} wall photo`}
                >
                  <div className="w-[58px] h-[58px] rounded-full bg-white" />
                </button>
                <span className="text-white/60 text-sm font-medium">
                  {directionIndex + 1} of {DIRECTIONS.length}
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
