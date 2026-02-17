# 05 — Component Specifications

## Component Tree

```
<App>
  └─ <FloorPlanWizard>                    // Main orchestrator
       ├─ <ProgressBar />                  // Step indicator
       ├─ <AddressEntry />                 // Step 1: address input
       ├─ <CornerSelector />               // Step 2: starting corner
       ├─ <RoomTypeSelector />             // Step 3: room type
       ├─ <CameraCapture />                // Step 4: photo capture
       │    ├─ <CompassOverlay />           // Heading display on camera
       │    └─ <PhotoPreview />             // Confirm/retake each photo
       ├─ <AnalysisLoader />               // Waiting for Claude
       ├─ <PlanReview />                   // Step 5: review room plan
       │    ├─ <PlanRenderer />             // SVG viewer with pan/zoom
       │    ├─ <AnnotationOverlay />        // Draw corrections (fabric.js)
       │    └─ <FeedbackPanel />            // Text input + submit
       ├─ <DirectionPicker />              // Choose next room direction
       ├─ <MergedPlanReview />             // Review combined rooms
       │    └─ <PlanRenderer />
       ├─ <MoreRoomsPrompt />              // Continue or finalize?
       ├─ <FinalPlanReview />              // Calibrated final plan
       │    └─ <PlanRenderer />
       └─ <ExportOptions />                // Download DXF/SVG/PDF
```

---

## Component Specifications

### FloorPlanWizard

**Purpose:** Master orchestrator. Controls which step is shown, manages transitions, holds session state.

**State:** Reads from Zustand store (`useFloorPlanStore`)

**Behavior:**
- Renders the component matching `currentStep`
- Transitions: each child calls `advanceStep()` or `goToStep(step)` when done
- Back button: allows going to previous step (but not past accepted rooms)
- Auto-saves session to API after each step transition

**Mobile considerations:**
- Full-screen layout, no scrolling within steps (each step fits viewport)
- Hardware back button = previous step (not browser back)
- Prevent accidental browser navigation (beforeunload handler)

---

### ProgressBar

**Purpose:** Visual indicator of overall progress.

**Props:**
```typescript
{
  currentStep: WorkflowStep;
  roomCount: number;
  currentRoomIndex: number;
}
```

**Display:**
- Compact horizontal bar at top of screen
- Segments: Address → Corner → [Room 1: Type → Capture → Review] → [Room 2: ...] → Finalize
- Current segment highlighted
- Room count shown: "Room 3 of ?"

**Mobile:** Fixed to top, max 40px height. Tappable to see step names.

---

### AddressEntry

**Purpose:** Collect house address, trigger satellite lookup.

**UI:**
- Text input with autocomplete (Google Places Autocomplete API)
- "Use my current location" button (Geolocation API → reverse geocode)
- "Look Up" button triggers satellite fetch
- Shows satellite image preview when available (non-blocking — user can proceed)

**On completion:** Calls `POST /sessions` → stores sessionId → advances to CornerSelector

**Mobile:** Large input field, autocomplete dropdown fills width, keyboard-aware layout.

---

### CornerSelector

**Purpose:** User indicates which corner of the house they're starting in.

**UI:**
- Simple 2×2 grid of large buttons: NW | NE / SW | SE
- Optional: if satellite image available, show it with corner labels
- Brief instruction text: "Which corner of the house are you nearest to?"

**On completion:** Updates session with startingCorner → advances to RoomTypeSelector

**Mobile:** Buttons fill 80% of viewport, easy one-thumb tap.

---

### RoomTypeSelector

**Purpose:** User chooses the room type.

**UI:**
- Grid of labeled icon buttons (3 columns):
  - Bedroom 🛏️
  - Bathroom 🚿
  - Kitchen 🍳
  - Living Room 🛋️
  - Dining Room 🍽️
  - Family Room 📺
  - Office 💻
  - Utility Room ⚙️
  - Laundry 👕
  - Garage 🚗
  - Hallway ↔️
  - Storage 📦
  - Closet 🚪
  - Other ✏️
- "Other" prompts for custom label text input

**On completion:** Creates room via API → stores roomId and label → advances to CameraCapture

**Mobile:** Scrollable grid, large tap targets (min 64×64px).

---

### CameraCapture

**Purpose:** Guide user through taking 4 directional photos.

**State:**
```typescript
{
  currentDirection: "north" | "east" | "south" | "west";
  photos: { north?, east?, south?, west? };
  compassHeading: number;  // live from device
  isCapturing: boolean;
}
```

**UI:**
- Camera viewfinder (full viewport behind UI overlay)
- Top: current direction label ("📷 Face the NORTH wall") with large arrow pointing N
- Center: crosshair overlay
- Bottom: large capture button + compass heading readout
- After capture: photo preview with "Use Photo" / "Retake" buttons
- Progress dots showing which directions are done: ● ● ○ ○

**Camera implementation:**
```javascript
// Use getUserMedia with rear camera preference
const stream = await navigator.mediaDevices.getUserMedia({
  video: {
    facingMode: { ideal: "environment" },
    width: { ideal: 1920 },
    height: { ideal: 1080 }
  }
});
```

**Compass implementation:**
```javascript
// DeviceOrientationEvent
window.addEventListener("deviceorientationabsolute", (e) => {
  // e.alpha = compass heading (degrees from north)
  // On iOS, need to request permission first
  setCompassHeading(360 - e.alpha);  // normalize
});

// iOS permission request (must be triggered by user gesture)
if (typeof DeviceOrientationEvent.requestPermission === 'function') {
  const permission = await DeviceOrientationEvent.requestPermission();
  if (permission === 'granted') { /* add listener */ }
}
```

**Photo processing (client-side before upload):**
1. Capture frame from video stream as canvas
2. Resize: max 1200px longest edge
3. Compress: JPEG quality 0.8
4. Strip GPS EXIF (privacy)
5. Record compass heading at moment of capture
6. Upload to API

**Sequence:** North → East → South → West (automatic advance after each "Use Photo")

**On completion (all 4 photos):** Triggers analyze API → advances to AnalysisLoader

**Mobile:** 
- Landscape-friendly but works in portrait
- Camera viewfinder fills entire background
- UI elements are semi-transparent overlays
- Haptic feedback on capture (if supported)
- Compass heading font size 24px+ for readability

**Hallway mode (if room type is "hallway"):**
- Different prompt: "Stand at one END of the hallway"
- Photo sequence: "Photo from THIS end" → "Walk to OTHER end" → "Photo from OTHER end" → "Photo of LEFT wall" → "Photo of RIGHT wall"
- 5 photos instead of 4

---

### AnalysisLoader

**Purpose:** Show progress while Claude analyzes photos.

**UI:**
- Animated architectural blueprint illustration
- Step indicators:
  1. ✅ "Photos uploaded"
  2. ⏳ "Analyzing room dimensions..."
  3. ○ "Detecting features..."
  4. ○ "Generating floor plan..."
- Estimated time: "Usually takes 10-15 seconds"

**Behavior:**
- Polls or uses SSE/WebSocket for analysis status
- On completion → advances to PlanReview
- On error → shows error message with "Retry" button

---

### PlanRenderer

**Purpose:** Render SVG floor plan with pan/zoom on mobile.

**Props:**
```typescript
{
  svgContent: string;            // SVG string to render
  interactive: boolean;          // enable pan/zoom
  showDimensions: boolean;       // show room dimensions
  highlightRoomId?: string;      // highlight a specific room
  onRoomClick?: (roomId) => void;
}
```

**Implementation:**
- Inject SVG into a container div via `dangerouslySetInnerHTML` or DOM parser
- Pan/zoom: use CSS transform with touch event handlers
  - Pinch to zoom (two-finger gesture)
  - Single finger to pan
  - Double-tap to reset view
- Highlight: add CSS class to targeted room group

**Zoom controls:**
- Floating +/- buttons (bottom right, 48px tap targets)
- "Fit to screen" button (bottom left)

**Mobile:** 
- Default zoom level fits entire plan in viewport
- Min zoom: fit to screen
- Max zoom: 4x
- Smooth 60fps panning via `transform: translate() scale()`

---

### AnnotationOverlay

**Purpose:** Let user draw on the plan to indicate corrections.

**Implementation:** fabric.js canvas overlaid on the PlanRenderer

**Tools:**
- Freehand draw (default, red color, 3px width)
- Circle tool (drag to draw ellipse around problem area)
- Arrow tool (point to specific features)
- Text label (tap to place, type short text)
- Undo (last stroke)
- Clear all
- Color: red only (keeps it simple)

**UI:**
- Toolbar at bottom: [✏️ Draw] [⭕ Circle] [➡️ Arrow] [T Text] [↩️ Undo] [🗑️ Clear]
- Active tool highlighted
- Canvas matches PlanRenderer zoom/position

**Output:**
- Export canvas as PNG (transparent background, just the annotations)
- This PNG is sent to the revise API alongside text feedback

**Mobile:**
- Touch drawing with finger
- Palm rejection: only register touches that start on the canvas
- Toolbar icons 44px minimum

---

### FeedbackPanel

**Purpose:** Text input for correction feedback.

**UI:**
- Expandable text area at bottom of screen (above keyboard when active)
- Placeholder: "Describe what needs to change..."
- Quick-suggestion chips: "Missing window" "Missing door" "Room too big" "Room too small" "Missing closet" "Wrong shape"
- "Submit Feedback" button (primary CTA)
- "Looks Good ✓" button (accept, secondary style)

**Behavior:**
- Submit → sends text + annotation PNG to revise API
- Accept → advances workflow

**Mobile:** 
- Text area auto-grows (max 4 lines visible)
- Quick chips scroll horizontally
- Keyboard pushes panel up (not obscured)

---

### DirectionPicker

**Purpose:** User indicates which direction the next room is.

**UI:**
- Current room plan shown centered
- Four directional arrows around it: ↑N ←W →E ↓S
- Arrows are large (60px) tap targets with labels
- Instruction: "Which direction is the next room?"
- Optional: show compass overlay on plan

**On tap:** Stores direction → advances to RoomTypeSelector for next room

**Mobile:** Plan fits upper 60% of screen, arrows in lower 40%.

---

### MergedPlanReview

**Purpose:** Review the combined multi-room plan after each new room is added.

**UI:**
- PlanRenderer showing all rooms merged
- New room highlighted with subtle blue outline
- Connection point (door/archway) highlighted
- "Does the room arrangement look correct?"
- [Yes, continue ✓] [No, adjust ✗] buttons

**If No:** Opens FeedbackPanel for merged plan corrections

---

### MoreRoomsPrompt

**Purpose:** Ask if user wants to add more rooms.

**UI:**
- Current merged plan shown (PlanRenderer, small scale)
- Room count: "You've mapped 5 rooms"
- Two large buttons:
  - "Add Another Room +" (primary)
  - "That's All Rooms — Finalize" (secondary)

---

### FinalPlanReview

**Purpose:** Review the calibrated, styled final plan.

**UI:**
- Full styled architectural plan in PlanRenderer
- Scale reference shown on plan
- Overall dimensions shown
- Disclaimer text visible: "Plan is approximate, verify actual conditions before use"
- Calibration notes: "Adjusted 5% based on satellite imagery"
- [Approve ✓] [Request Changes ✗] buttons

---

### ExportOptions

**Purpose:** Download final plan in chosen format.

**UI:**
- Plan preview (thumbnail)
- Format buttons:
  - "Download SVG" — for editing in Illustrator, Inkscape
  - "Download DXF" — for CAD software (AutoCAD, etc.)
  - "Download PDF" — for printing
- Paper size selector (Letter / Tabloid) for PDF
- Scale selector (1/4" = 1' or 1/8" = 1') for PDF
- "Start New Plan" button (returns to AddressEntry)

**Mobile:** Buttons trigger download via browser download manager.

---

## Shared UI Components

### ActionButton

Large, mobile-friendly button used throughout.

```typescript
{
  label: string;
  variant: "primary" | "secondary" | "danger";
  icon?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
}
```

Style: min-height 48px, full-width on mobile, rounded corners, bold text.

### InstructionBanner

Top-of-screen instruction text for each step.

```typescript
{
  icon: string;      // emoji
  title: string;     // "Face the North Wall"
  subtitle?: string; // "Hold your phone upright at chest height"
}
```

### ConfirmDialog

Modal confirmation for destructive actions (restart session, discard room).

### Toast

Non-blocking notification for success/error messages.
