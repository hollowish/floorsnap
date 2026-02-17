import { useFloorPlan } from '../../hooks/useFloorPlan';
import InstructionBanner from '../ui/InstructionBanner';
import ActionButton from '../ui/ActionButton';

/**
 * ReviewRoom — Displays the generated SVG floor plan for user review.
 *
 * Shows the room SVG, a summary panel with dimensions/confidence,
 * and actions to accept or re-analyze.
 */
export default function ReviewRoom() {
  const { currentRoom, updateCurrentRoom, goToStep } = useFloorPlan();

  // Safety: if no SVG data, show fallback
  if (!currentRoom?.svgData) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <p className="text-gray-500 mb-6">No room plan available yet.</p>
        <ActionButton label="Go Back" variant="ghost" onClick={() => goToStep('analyzing')} />
      </div>
    );
  }

  const { analysis, svgData, label } = currentRoom;
  const { width, height, confidence } = analysis.dimensions;
  const area = width * height;

  function handleAccept() {
    updateCurrentRoom({ reviewStatus: 'accepted' });
    goToStep('direction');
  }

  function handleReanalyze() {
    goToStep('analyzing');
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <InstructionBanner
        icon="📐"
        title="Review Your Room Plan"
        subtitle={`${label} — ${width}' × ${height}'`}
      />

      {/* SVG display */}
      <div className="flex-1 flex items-start justify-center px-4 pb-4">
        <div className="w-full max-w-md">
          <div
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
            dangerouslySetInnerHTML={{ __html: svgData }}
          />

          {/* Summary panel */}
          <div className="mt-4 bg-blueprint-50 border border-blueprint-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blueprint-700 font-medium">{label}</span>
              <span className="text-xs text-blueprint-500 bg-blueprint-100 px-2 py-0.5 rounded-full">
                {Math.round(confidence * 100)}% confidence
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-lg font-bold text-gray-900">{width}'×{height}'</p>
                <p className="text-xs text-gray-500">Dimensions</p>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{area}</p>
                <p className="text-xs text-gray-500">Sq ft</p>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{analysis.ceilingHeight}'</p>
                <p className="text-xs text-gray-500">Ceiling</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-col gap-3 pb-6">
            <ActionButton label="Looks Good" variant="primary" onClick={handleAccept} />
            <ActionButton label="Re-analyze" variant="ghost" onClick={handleReanalyze} />
          </div>
        </div>
      </div>
    </div>
  );
}
