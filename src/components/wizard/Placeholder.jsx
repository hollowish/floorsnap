import ActionButton from '../ui/ActionButton';
import { useFloorPlan } from '../../hooks/useFloorPlan';

/**
 * Placeholder — Temporary stand-in for wizard steps not yet implemented.
 *
 * Shows the step name, current state summary, and navigation buttons
 * so the wizard flow can be tested end-to-end with stub steps.
 *
 * Remove this file once all real components are built.
 */
export default function Placeholder({ stepName, nextStep, prevStep }) {
  const { goToStep, currentRoom, rooms, address, startingCorner } = useFloorPlan();

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        {/* Step badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold mb-4">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          Not yet implemented
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-2">{stepName}</h2>
        <p className="text-sm text-gray-500 mb-6">
          This step will be built in a future session.
        </p>

        {/* State debug info */}
        <div className="w-full max-w-sm bg-gray-50 rounded-xl p-4 text-left text-xs font-mono text-gray-500 space-y-1">
          <p><span className="text-gray-400">address:</span> {address || '—'}</p>
          <p><span className="text-gray-400">corner:</span> {startingCorner || '—'}</p>
          <p><span className="text-gray-400">rooms:</span> {rooms.length}</p>
          {currentRoom && (
            <>
              <p><span className="text-gray-400">current room:</span> {currentRoom.label}</p>
              <p><span className="text-gray-400">room type:</span> {currentRoom.type}</p>
            </>
          )}
        </div>
      </div>

      <div className="flex-shrink-0 px-5 pb-6 pt-4 space-y-2">
        {nextStep && (
          <ActionButton
            label={`Skip to: ${nextStep}`}
            variant="secondary"
            onClick={() => goToStep(nextStep)}
          />
        )}
        {prevStep && (
          <ActionButton
            label="Back"
            variant="ghost"
            onClick={() => goToStep(prevStep)}
          />
        )}
      </div>
    </div>
  );
}
