import { useEffect, useState, useRef } from 'react';
import { useFloorPlan } from '../../hooks/useFloorPlan';
import ProgressBar from './ProgressBar';
import AddressEntry from './AddressEntry';
import CornerSelector from './CornerSelector';
import RoomTypeSelector from './RoomTypeSelector';
import Placeholder from './Placeholder';

/**
 * FloorPlanWizard — Master orchestrator for the floor plan creation workflow.
 *
 * Renders the current step based on `currentStep` from the store.
 * Handles step transitions with a subtle slide animation.
 * Prevents accidental browser back navigation.
 */
export default function FloorPlanWizard() {
  const { currentStep } = useFloorPlan();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayedStep, setDisplayedStep] = useState(currentStep);
  const prevStepRef = useRef(currentStep);

  // Animate step transitions
  useEffect(() => {
    if (currentStep !== prevStepRef.current) {
      setIsTransitioning(true);
      // Brief fade-out, swap content, fade-in
      const timer = setTimeout(() => {
        setDisplayedStep(currentStep);
        setIsTransitioning(false);
      }, 150);
      prevStepRef.current = currentStep;
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  // Prevent accidental back navigation
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const stepComponent = renderStep(displayedStep);

  return (
    <div className="flex flex-col h-screen max-h-screen bg-gray-50">
      {/* Progress bar — always visible except on address entry */}
      {displayedStep !== 'address' && <ProgressBar />}

      {/* Step content with transition */}
      <div
        className={`flex-1 overflow-hidden transition-opacity duration-150 ${
          isTransitioning ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {stepComponent}
      </div>
    </div>
  );
}

/**
 * Route the current step to its component.
 * Unimplemented steps use Placeholder with navigation hints.
 */
function renderStep(step) {
  switch (step) {
    // ── Setup ──
    case 'address':
      return <AddressEntry />;
    case 'corner':
      return <CornerSelector />;

    // ── Room capture (Session 1.2+) ──
    case 'room-type':
      return <RoomTypeSelector />;
    case 'capture-north':
      return <Placeholder stepName="📷 Capture North Wall" nextStep="capture-east" prevStep="room-type" />;
    case 'capture-east':
      return <Placeholder stepName="📷 Capture East Wall" nextStep="capture-south" prevStep="capture-north" />;
    case 'capture-south':
      return <Placeholder stepName="📷 Capture South Wall" nextStep="capture-west" prevStep="capture-east" />;
    case 'capture-west':
      return <Placeholder stepName="📷 Capture West Wall" nextStep="analyzing" prevStep="capture-south" />;

    // ── Analysis (Session 1.3+) ──
    case 'analyzing':
      return <Placeholder stepName="🔍 Analyzing Room..." nextStep="review-room" prevStep="capture-west" />;
    case 'review-room':
      return <Placeholder stepName="📐 Review Room Plan" nextStep="direction" prevStep="analyzing" />;
    case 'annotating':
      return <Placeholder stepName="✏️ Annotate Corrections" nextStep="review-room" prevStep="review-room" />;

    // ── Multi-room (Phase 3) ──
    case 'direction':
      return <Placeholder stepName="🧭 Direction to Next Room" nextStep="more-rooms" prevStep="review-room" />;
    case 'review-merged':
      return <Placeholder stepName="🗺️ Review Combined Plan" nextStep="more-rooms" prevStep="direction" />;
    case 'more-rooms':
      return <Placeholder stepName="➕ More Rooms?" nextStep="room-type" prevStep="review-merged" />;

    // ── Finalization (Phase 4-5) ──
    case 'calibrating':
      return <Placeholder stepName="🛰️ Calibrating to Satellite" nextStep="review-final" prevStep="more-rooms" />;
    case 'review-final':
      return <Placeholder stepName="📋 Review Final Plan" nextStep="export" prevStep="calibrating" />;
    case 'export':
      return <Placeholder stepName="💾 Export Plan" nextStep="complete" prevStep="review-final" />;
    case 'complete':
      return <Placeholder stepName="✅ Complete!" prevStep="export" />;

    default:
      return <AddressEntry />;
  }
}
