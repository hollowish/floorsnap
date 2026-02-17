# 08 — Conventions & File Structure

## Project File Structure

```
floorsnap/
├── README.md
├── SESSION_LOG.md                    # Updated after each coding session
├── package.json
├── vite.config.js                    # or next.config.js
├── tailwind.config.js
├── index.html
│
├── public/
│   ├── manifest.json                 # PWA manifest
│   ├── sw.js                         # Service worker
│   └── icons/                        # App icons
│
├── src/
│   ├── main.jsx                      # App entry point
│   ├── App.jsx                       # Root component
│   │
│   ├── components/                   # React components
│   │   ├── wizard/                   # Wizard flow components
│   │   │   ├── FloorPlanWizard.jsx
│   │   │   ├── ProgressBar.jsx
│   │   │   ├── AddressEntry.jsx
│   │   │   ├── CornerSelector.jsx
│   │   │   ├── RoomTypeSelector.jsx
│   │   │   ├── CameraCapture.jsx
│   │   │   ├── AnalysisLoader.jsx
│   │   │   ├── PlanReview.jsx
│   │   │   ├── DirectionPicker.jsx
│   │   │   ├── MergedPlanReview.jsx
│   │   │   ├── MoreRoomsPrompt.jsx
│   │   │   ├── FinalPlanReview.jsx
│   │   │   └── ExportOptions.jsx
│   │   │
│   │   ├── plan/                     # Plan rendering components
│   │   │   ├── PlanRenderer.jsx
│   │   │   ├── AnnotationOverlay.jsx
│   │   │   └── FeedbackPanel.jsx
│   │   │
│   │   ├── camera/                   # Camera-related components
│   │   │   ├── CameraViewfinder.jsx
│   │   │   ├── CompassOverlay.jsx
│   │   │   └── PhotoPreview.jsx
│   │   │
│   │   └── ui/                       # Shared UI components
│   │       ├── ActionButton.jsx
│   │       ├── InstructionBanner.jsx
│   │       ├── ConfirmDialog.jsx
│   │       └── Toast.jsx
│   │
│   ├── lib/                          # Business logic (non-React)
│   │   ├── api.js                    # API client functions
│   │   ├── claude.js                 # Claude API call builders
│   │   ├── svgGenerator.js           # Room JSON → SVG conversion
│   │   ├── roomMerger.js             # Multi-room merging algorithm
│   │   ├── wallReconciler.js         # Shared wall logic
│   │   ├── calibration.js            # Satellite calibration math
│   │   ├── compass.js                # DeviceOrientation helpers
│   │   ├── camera.js                 # getUserMedia helpers
│   │   ├── imageProcessor.js         # Resize, compress, strip EXIF
│   │   └── geometry.js               # Geometric utility functions
│   │
│   ├── store/                        # State management
│   │   ├── floorPlanStore.js         # Zustand store definition
│   │   └── actions.js                # Complex state actions
│   │
│   ├── hooks/                        # Custom React hooks
│   │   ├── useCamera.js              # Camera stream management
│   │   ├── useCompass.js             # Compass heading subscription
│   │   ├── useFloorPlan.js           # Convenience hook for store
│   │   └── usePanZoom.js             # Touch pan/zoom for SVG
│   │
│   ├── styles/                       # Global styles
│   │   └── globals.css               # Tailwind imports + overrides
│   │
│   └── constants/                    # App constants
│       ├── roomTypes.js              # Room type definitions + icons
│       ├── svgStyles.js              # Line weights, colors, fonts
│       └── archConventions.js        # Architectural drawing conventions
│
├── server/                           # Backend (Lambda functions)
│   ├── functions/
│   │   ├── session/
│   │   │   └── handler.js            # Session CRUD
│   │   ├── analyze/
│   │   │   └── handler.js            # Room analysis orchestrator
│   │   ├── revise/
│   │   │   └── handler.js            # Revision orchestrator
│   │   ├── merge/
│   │   │   └── handler.js            # Room merge orchestrator
│   │   ├── satellite/
│   │   │   └── handler.js            # Satellite fetch + analysis
│   │   ├── calibrate/
│   │   │   └── handler.js            # Final calibration
│   │   └── export/
│   │       ├── handler.js            # Export dispatcher
│   │       └── dxf_export.py         # Python DXF generation
│   │
│   ├── lib/
│   │   ├── claude.js                 # Shared Claude API helpers
│   │   ├── dynamodb.js               # DynamoDB helpers
│   │   ├── s3.js                     # S3 helpers
│   │   └── maps.js                   # Google Maps / Mapbox helpers
│   │
│   └── template.yaml                 # SAM template (or cdk.json)
│
├── tests/
│   ├── unit/
│   │   ├── svgGenerator.test.js
│   │   ├── roomMerger.test.js
│   │   ├── wallReconciler.test.js
│   │   ├── calibration.test.js
│   │   └── geometry.test.js
│   │
│   ├── integration/
│   │   └── claudeAnalysis.test.js    # Tests with real/recorded API responses
│   │
│   └── fixtures/
│       ├── mockAnalysis.json         # Sample Claude responses
│       ├── mockSatellite.json
│       └── samplePhotos/             # Test photos
│
└── docs/                             # This documentation set
    ├── 00_PROJECT_OVERVIEW.md
    ├── 01_WORKFLOW_GUIDE.md
    ├── 02_ARCHITECTURE.md
    ├── 03_DATA_MODELS.md
    ├── 04_API_CONTRACTS.md
    ├── 05_COMPONENT_SPECS.md
    ├── 06_CLAUDE_PROMPTS.md
    ├── 07_IMPLEMENTATION_PLAN.md
    └── 08_CONVENTIONS.md
```

---

## Naming Conventions

### Files
- React components: PascalCase (`CameraCapture.jsx`)
- Utility modules: camelCase (`svgGenerator.js`)
- Test files: match source + `.test.js` (`svgGenerator.test.js`)
- Constants: camelCase files, UPPER_SNAKE_CASE for exported values

### React Components
- Functional components only (no class components)
- Named exports for components used by other components
- Default export for page-level / wizard step components
- Props interface documented with JSDoc or TypeScript types

### Variables & Functions
- camelCase for variables and functions
- PascalCase for component names and type/interface names
- UPPER_SNAKE_CASE for constants
- Prefix boolean variables with `is`, `has`, `should`, `can`
- Prefix event handlers with `handle` (`handleSubmit`, `handlePhotoCapture`)
- Prefix custom hooks with `use` (`useCamera`, `useCompass`)

### CSS / Tailwind
- Use Tailwind utilities exclusively (no custom CSS except globals)
- For complex repeating patterns, use `@apply` in globals.css sparingly
- Mobile-first: base classes are mobile, use `md:` and `lg:` for larger screens

---

## Code Patterns

### Component Template

```jsx
import { useState } from 'react';
import { useFloorPlan } from '../../hooks/useFloorPlan';
import ActionButton from '../ui/ActionButton';

/**
 * ComponentName — brief description
 * 
 * Used in: FloorPlanWizard (step: "step-name")
 * Depends on: list dependencies
 */
export default function ComponentName() {
  const { sessionData, advanceStep } = useFloorPlan();
  const [localState, setLocalState] = useState(null);

  const handleAction = async () => {
    // logic
    advanceStep('next-step');
  };

  return (
    <div className="flex flex-col h-full p-4">
      {/* Component content */}
      <ActionButton label="Continue" onClick={handleAction} />
    </div>
  );
}
```

### API Call Pattern

```javascript
// src/lib/api.js
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/floorplan';

export async function analyzeRoom(sessionId, roomId) {
  const response = await fetch(`${API_BASE}/sessions/${sessionId}/rooms/${roomId}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new ApiError(error.error.code, error.error.message);
  }

  return response.json();
}
```

### Zustand Store Pattern

```javascript
// src/store/floorPlanStore.js
import { create } from 'zustand';

export const useFloorPlanStore = create((set, get) => ({
  // State
  sessionId: null,
  currentStep: 'address',
  rooms: [],
  currentRoomIndex: -1,

  // Actions
  advanceStep: (step) => set({ currentStep: step }),
  
  addRoom: (room) => set((state) => ({
    rooms: [...state.rooms, room],
    currentRoomIndex: state.rooms.length
  })),

  updateCurrentRoom: (updates) => set((state) => {
    const rooms = [...state.rooms];
    rooms[state.currentRoomIndex] = { ...rooms[state.currentRoomIndex], ...updates };
    return { rooms };
  }),

  // Computed (use selectors)
  getCurrentRoom: () => {
    const { rooms, currentRoomIndex } = get();
    return currentRoomIndex >= 0 ? rooms[currentRoomIndex] : null;
  }
}));
```

---

## SVG Generation Conventions

### Coordinate System
- Origin (0,0) = northwest corner of plan
- X axis = eastward (positive right)
- Y axis = southward (positive down)
- Units: internal calculations in feet, SVG output in pixels (feet × pixelsPerFoot)

### Line Weights (at default 20px/ft screen scale)
| Element | Stroke Width | Dash Pattern |
|---------|-------------|--------------|
| Exterior walls | 4px | solid |
| Interior walls | 2px | solid |
| Doors | 1px | solid |
| Door swing arc | 1px | solid |
| Windows | 1px | solid |
| Closet walls | 1px | dash 4,2 |
| Dimension lines | 0.5px | solid |
| Closet shelving | 0.5px | dash 2,2 |

### Architectural Symbols
- **Door:** Gap in wall + quarter-circle arc showing swing direction
- **Sliding door:** Gap in wall + two parallel lines showing overlap
- **Window:** Three parallel lines across wall gap (perpendicular to wall)
- **Closet:** Dashed rectangle with shelf line at back
- **Archway:** Gap in wall with no door symbol
- **Fireplace:** Rectangular bump-out on wall

### Colors
- All elements: #000000 (black) in final output
- During review: rooms may have subtle fill colors for distinction
  - Current room: rgba(59, 130, 246, 0.05) (light blue)
  - Accepted rooms: no fill
  - Highlighted room: rgba(59, 130, 246, 0.1)

---

## Error Handling Convention

```javascript
// Custom error class
class FloorSnapError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

// Usage in components
try {
  const result = await analyzeRoom(sessionId, roomId);
  // handle success
} catch (error) {
  if (error.code === 'ANALYSIS_FAILED') {
    showToast('Could not analyze photos. Please retake in better lighting.', 'warning');
  } else if (error.code === 'RATE_LIMITED') {
    showToast('Please wait a moment and try again.', 'info');
  } else {
    showToast('Something went wrong. Please try again.', 'error');
    console.error('Unexpected error:', error);
  }
}
```

---

## Git Commit Message Format

```
phase-N: [component] short description

Longer description if needed. Explain WHY, not just WHAT.

Refs: #issue-number (if using issue tracker)
```

Examples:
```
phase-1: [CameraCapture] implement compass heading capture
phase-2: [AnnotationOverlay] add circle and arrow drawing tools
phase-3: [roomMerger] handle shared wall reconciliation with averaging
phase-3: [svgGenerator] fix door arc direction for south-facing doors
```

---

## Environment Variables

```bash
# .env.local (frontend)
VITE_API_URL=http://localhost:3001/api/floorplan
VITE_GOOGLE_MAPS_KEY=AIza...          # client-side, restricted to your domain
VITE_GOOGLE_PLACES_KEY=AIza...        # for autocomplete

# server/.env (backend, or Secrets Manager in production)
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_MAPS_SERVER_KEY=AIza...         # server-side, IP restricted
AWS_REGION=us-west-2
DYNAMODB_TABLE=floorplan-sessions
S3_BUCKET=myapp-floorplan
```

---

## Testing Conventions

- Unit tests for all `lib/` modules (pure functions)
- Integration tests for Claude API calls (use recorded responses)
- No unit tests for React components initially (visual testing via artifacts)
- Test file co-located with source: `roomMerger.js` → `roomMerger.test.js` in tests/unit/
- Use Jest for test runner
- Mock Claude responses stored in `tests/fixtures/`
