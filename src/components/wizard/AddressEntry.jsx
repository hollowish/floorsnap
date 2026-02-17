import { useState } from 'react';
import { useFloorPlan } from '../../hooks/useFloorPlan';
import ActionButton from '../ui/ActionButton';
import InstructionBanner from '../ui/InstructionBanner';

/**
 * AddressEntry — Step 1: Collect the house address.
 *
 * Phase 1 version: Simple text input, no autocomplete (Google Places added in Phase 4).
 * Stores address + generates session ID, then advances to corner selection.
 */
export default function AddressEntry() {
  const { setAddress, goToStep } = useFloorPlan();
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');

  const handleContinue = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      setError('Please enter an address');
      return;
    }
    if (trimmed.length < 5) {
      setError('Please enter a full street address');
      return;
    }
    setError('');
    setAddress(trimmed);
    goToStep('corner');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleContinue();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header area */}
      <div className="flex-1 flex flex-col justify-center px-5">
        {/* App branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blueprint-700 mb-4 shadow-lg">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-white">
              <rect x="4" y="8" width="24" height="18" rx="1" stroke="currentColor" strokeWidth="2" fill="none" />
              <line x1="4" y1="18" x2="28" y2="18" stroke="currentColor" strokeWidth="1.5" />
              <line x1="16" y1="8" x2="16" y2="26" stroke="currentColor" strokeWidth="1.5" />
              <line x1="10" y1="18" x2="10" y2="26" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
              <circle cx="16" cy="5" r="2" fill="currentColor" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">FloorSnap</h1>
          <p className="text-sm text-gray-500 mt-1">Create a floor plan from photos</p>
        </div>

        <InstructionBanner
          icon="📍"
          title="Where is this house?"
          subtitle="Enter the property address. This helps us estimate the building footprint from satellite imagery."
        />

        {/* Address input */}
        <div className="mt-6 px-1">
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1.5">
            Property Address
          </label>
          <input
            id="address"
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              if (error) setError('');
            }}
            onKeyDown={handleKeyDown}
            placeholder="123 Main St, Oakland, CA 94601"
            autoComplete="street-address"
            autoFocus
            className={`w-full px-4 py-3.5 rounded-xl border-2 text-base bg-white transition-colors duration-150
              placeholder:text-gray-300
              focus:outline-none focus:border-blueprint-400 focus:ring-1 focus:ring-blueprint-200
              ${error ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-gray-200'}
            `}
          />
          {error && (
            <p className="mt-1.5 text-sm text-red-500 font-medium">{error}</p>
          )}
          <p className="mt-2 text-xs text-gray-400">
            Satellite lookup is optional — you can skip this later if the address isn't found.
          </p>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="flex-shrink-0 px-5 pb-6 pt-4">
        <ActionButton
          label="Continue"
          onClick={handleContinue}
          disabled={!inputValue.trim()}
        />
      </div>
    </div>
  );
}
