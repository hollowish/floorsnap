import { useState } from 'react';
import { useFloorPlan } from '../../hooks/useFloorPlan';
import ActionButton from '../ui/ActionButton';
import InstructionBanner from '../ui/InstructionBanner';

/**
 * CornerSelector — Step 2: User picks which corner of the house they're starting in.
 *
 * Simple 2×2 grid of corner buttons. Tapping one selects it (highlighted),
 * then user confirms with Continue.
 */

const CORNERS = [
  { id: 'NW', label: 'Northwest', short: 'NW', row: 0, col: 0 },
  { id: 'NE', label: 'Northeast', short: 'NE', row: 0, col: 1 },
  { id: 'SW', label: 'Southwest', short: 'SW', row: 1, col: 0 },
  { id: 'SE', label: 'Southeast', short: 'SE', row: 1, col: 1 },
];

export default function CornerSelector() {
  const { setStartingCorner, goToStep } = useFloorPlan();
  const [selected, setSelected] = useState(null);

  const handleContinue = () => {
    if (!selected) return;
    setStartingCorner(selected);
    goToStep('room-type');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col justify-center px-5">
        <InstructionBanner
          icon="🧭"
          title="Which corner are you starting in?"
          subtitle="Stand in a corner room of the house. Select which corner of the house you're nearest to."
        />

        {/* House outline with corner selectors */}
        <div className="mt-8 mx-auto w-full max-w-xs">
          {/* Compass indicator */}
          <div className="text-center mb-3">
            <span className="text-xs font-semibold text-gray-400 tracking-widest uppercase">
              ↑ North
            </span>
          </div>

          {/* House shape with corners */}
          <div className="relative aspect-[4/3] border-2 border-gray-200 rounded-lg bg-gray-50/50">
            {/* Compass labels on edges */}
            <span className="absolute -left-6 top-1/2 -translate-y-1/2 text-[10px] font-medium text-gray-300 -rotate-90">
              West
            </span>
            <span className="absolute -right-6 top-1/2 -translate-y-1/2 text-[10px] font-medium text-gray-300 rotate-90">
              East
            </span>
            <span className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 text-[10px] font-medium text-gray-300">
              South
            </span>

            {/* Corner buttons */}
            {CORNERS.map((corner) => (
              <button
                key={corner.id}
                onClick={() => setSelected(corner.id)}
                className={`absolute w-[44%] h-[44%] rounded-xl font-bold text-lg transition-all duration-150 
                  active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blueprint-400
                  ${corner.row === 0 ? 'top-1' : 'bottom-1'}
                  ${corner.col === 0 ? 'left-1' : 'right-1'}
                  ${
                    selected === corner.id
                      ? 'bg-blueprint-600 text-white shadow-md ring-2 ring-blueprint-300'
                      : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-blueprint-300 hover:text-blueprint-600'
                  }
                `}
              >
                <span className="block text-xl font-bold">{corner.short}</span>
                <span className="block text-[10px] font-medium opacity-70 mt-0.5">
                  {corner.label}
                </span>
              </button>
            ))}

            {/* Center house icon */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-2xl opacity-20">🏠</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="flex-shrink-0 px-5 pb-6 pt-4 space-y-2">
        <ActionButton
          label="Continue"
          onClick={handleContinue}
          disabled={!selected}
        />
        <ActionButton
          label="Back"
          variant="ghost"
          onClick={() => goToStep('address')}
        />
      </div>
    </div>
  );
}
