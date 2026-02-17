import { useFloorPlan } from '../../hooks/useFloorPlan';

/**
 * ProgressBar — Compact horizontal indicator at top of wizard.
 *
 * Shows: setup steps (address, corner) → room steps → finalize
 * Highlights the current segment.
 */

const SETUP_STEPS = ['address', 'corner'];
const ROOM_STEPS = ['room-type', 'capture-north', 'capture-east', 'capture-south', 'capture-west', 'analyzing', 'review-room', 'annotating'];
const MERGE_STEPS = ['direction', 'review-merged', 'more-rooms'];
const FINAL_STEPS = ['calibrating', 'review-final', 'export', 'complete'];

function getPhase(step) {
  if (SETUP_STEPS.includes(step)) return 'setup';
  if (ROOM_STEPS.includes(step)) return 'room';
  if (MERGE_STEPS.includes(step)) return 'merge';
  if (FINAL_STEPS.includes(step)) return 'final';
  return 'setup';
}

export default function ProgressBar() {
  const { currentStep, roomCount, currentRoomIndex } = useFloorPlan();
  const phase = getPhase(currentStep);

  // Determine which room step we're on (for the sub-indicator)
  const roomStepIndex = ROOM_STEPS.indexOf(currentStep);

  return (
    <div className="w-full bg-white border-b border-gray-100 px-4 py-2.5 flex-shrink-0">
      {/* Phase segments */}
      <div className="flex items-center gap-1.5 mb-1.5">
        <Segment label="Setup" active={phase === 'setup'} done={phase !== 'setup'} />
        <SegmentConnector />
        <Segment
          label={roomCount > 0 ? `Room ${currentRoomIndex + 1}` : 'Rooms'}
          active={phase === 'room' || phase === 'merge'}
          done={phase === 'final'}
        />
        <SegmentConnector />
        <Segment label="Finalize" active={phase === 'final'} done={currentStep === 'complete'} />
      </div>

      {/* Sub-step dots for room capture */}
      {(phase === 'room') && (
        <div className="flex items-center justify-center gap-1">
          {ROOM_STEPS.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors duration-200 ${
                i <= roomStepIndex ? 'bg-blueprint-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Segment({ label, active, done }) {
  let style = 'bg-gray-100 text-gray-400';
  if (done) style = 'bg-blueprint-100 text-blueprint-600';
  if (active) style = 'bg-blueprint-600 text-white';

  return (
    <div
      className={`flex-1 text-center text-xs font-semibold py-1 rounded-md transition-colors duration-200 ${style}`}
    >
      {label}
    </div>
  );
}

function SegmentConnector() {
  return <div className="w-2 h-px bg-gray-200" />;
}
