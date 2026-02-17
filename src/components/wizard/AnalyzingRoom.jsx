import { useState, useEffect } from 'react';
import { useFloorPlan } from '../../hooks/useFloorPlan';
import { analyzeRoom } from '../../lib/mockAnalysis';
import { generateRoomSVG } from '../../lib/svgGenerator';
import { fireToast } from '../ui/Toast';
import ActionButton from '../ui/ActionButton';

const PROGRESS_STEPS = [
  { label: 'Photos uploaded', stage: 'uploading' },
  { label: 'Analyzing room dimensions...', stage: 'dimensions' },
  { label: 'Detecting features...', stage: 'features' },
  { label: 'Generating floor plan...', stage: 'generating' },
];

/**
 * AnalyzingRoom — Progress UI while mock analysis runs.
 *
 * Runs analysis on mount, shows animated step indicators,
 * stores results and advances to review-room on completion.
 */
export default function AnalyzingRoom() {
  const { currentRoom, updateCurrentRoom, goToStep } = useFloorPlan();

  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setError(null);
      setActiveStageIndex(0);

      try {
        const analysis = await analyzeRoom(currentRoom, (_stageName, stageIndex) => {
          if (!cancelled) {
            // Mark the current stage as active (next one after completed)
            setActiveStageIndex(stageIndex + 1);
          }
        });

        if (cancelled) return;

        const svgData = generateRoomSVG(analysis, currentRoom.label, currentRoom.id);

        updateCurrentRoom({ analysis, svgData, reviewStatus: 'reviewing' });
        fireToast('Room analysis complete!', 'success');
        goToStep('review-room');
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Analysis failed. Please try again.');
        }
      }
    }

    run();
    return () => { cancelled = true; };
  }, [retryCount]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleRetry() {
    setRetryCount((c) => c + 1);
  }

  function handleBack() {
    goToStep('capture-west');
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <div className="w-14 h-14 mb-4 rounded-full bg-red-100 flex items-center justify-center">
          <svg className="w-7 h-7 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M15 9l-6 6M9 9l6 6" />
          </svg>
        </div>
        <p className="text-red-600 font-semibold text-lg mb-2">Analysis Failed</p>
        <p className="text-gray-500 text-sm mb-8 max-w-xs">{error}</p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <ActionButton label="Retry Analysis" variant="primary" onClick={handleRetry} />
          <ActionButton label="Back to Camera" variant="ghost" onClick={handleBack} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      {/* Animated blueprint icon */}
      <div className="w-20 h-20 mb-8 rounded-2xl bg-blueprint-50 border-2 border-blueprint-200 flex items-center justify-center">
        <svg className="w-10 h-10 text-blueprint-600 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="1" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="9" y1="3" x2="9" y2="21" />
        </svg>
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-1">Analyzing Room</h2>
      <p className="text-sm text-gray-500 mb-8">This usually takes a few seconds</p>

      {/* Progress steps */}
      <div className="w-full max-w-xs space-y-4">
        {PROGRESS_STEPS.map((step, i) => {
          const isDone = i < activeStageIndex;
          const isActive = i === activeStageIndex;

          return (
            <div key={step.stage} className="flex items-center gap-3">
              {/* Status indicator */}
              <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                {isDone ? (
                  <svg className="w-6 h-6 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 12l3 3 5-5" />
                  </svg>
                ) : isActive ? (
                  <div className="w-3 h-3 rounded-full bg-blueprint-500 animate-pulse" />
                ) : (
                  <div className="w-3 h-3 rounded-full border-2 border-gray-300" />
                )}
              </div>

              {/* Label */}
              <span
                className={`text-sm ${
                  isDone
                    ? 'text-green-700 font-medium'
                    : isActive
                      ? 'text-blueprint-700 font-medium'
                      : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
