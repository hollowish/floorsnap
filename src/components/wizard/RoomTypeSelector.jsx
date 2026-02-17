import { useState } from 'react';
import { useFloorPlan } from '../../hooks/useFloorPlan';
import { ROOM_TYPES } from '../../constants/roomTypes';
import ActionButton from '../ui/ActionButton';
import InstructionBanner from '../ui/InstructionBanner';

/**
 * RoomTypeSelector — Step 3: User picks the room type.
 *
 * Grid of labeled icon buttons. Selecting "Other" reveals a custom label input.
 * On continue, creates the room in the store and advances to capture.
 */
export default function RoomTypeSelector() {
  const { createRoom, goToStep, roomCount } = useFloorPlan();
  const [selected, setSelected] = useState(null);
  const [customLabel, setCustomLabel] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleSelect = (typeId) => {
    setSelected(typeId);
    if (typeId === 'other') {
      setShowCustomInput(true);
    } else {
      setShowCustomInput(false);
      setCustomLabel('');
    }
  };

  const handleContinue = () => {
    if (!selected) return;
    if (selected === 'other' && !customLabel.trim()) return;

    const label = selected === 'other' ? customLabel.trim() : undefined;
    createRoom(selected, label);
    goToStep('capture-north');
  };

  const isReady = selected && (selected !== 'other' || customLabel.trim().length > 0);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-5">
        <InstructionBanner
          icon="🏠"
          title={roomCount === 0 ? 'What type of room is this?' : 'Next room — what type?'}
          subtitle="Select the room type. This helps label your floor plan."
        />

        {/* Room type grid */}
        <div className="grid grid-cols-3 gap-2.5 mt-5">
          {ROOM_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => handleSelect(type.id)}
              className={`flex flex-col items-center justify-center py-4 px-2 rounded-xl 
                transition-all duration-150 active:scale-95
                focus:outline-none focus-visible:ring-2 focus-visible:ring-blueprint-400
                ${
                  selected === type.id
                    ? 'bg-blueprint-600 text-white shadow-md ring-2 ring-blueprint-300'
                    : 'bg-white text-gray-600 border-2 border-gray-150 hover:border-blueprint-300'
                }
              `}
            >
              <span className="text-2xl mb-1">{type.icon}</span>
              <span className="text-xs font-semibold leading-tight text-center">
                {type.label}
              </span>
            </button>
          ))}
        </div>

        {/* Custom label input for "Other" */}
        {showCustomInput && (
          <div className="mt-4 animate-[slideDown_200ms_ease-out]">
            <label htmlFor="custom-label" className="block text-sm font-medium text-gray-700 mb-1">
              Room name
            </label>
            <input
              id="custom-label"
              type="text"
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
              placeholder="e.g., Sunroom, Pantry, Mudroom"
              autoFocus
              maxLength={30}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-base bg-white
                placeholder:text-gray-300
                focus:outline-none focus:border-blueprint-400 focus:ring-1 focus:ring-blueprint-200"
            />
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="flex-shrink-0 px-5 pb-6 pt-4 space-y-2">
        <ActionButton
          label="Continue"
          onClick={handleContinue}
          disabled={!isReady}
        />
        <ActionButton
          label="Back"
          variant="ghost"
          onClick={() => goToStep(roomCount === 0 ? 'corner' : 'more-rooms')}
        />
      </div>
    </div>
  );
}
