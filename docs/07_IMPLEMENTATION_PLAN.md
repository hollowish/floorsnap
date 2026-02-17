# 07 — Implementation Plan

## Phase Overview

```
Phase 1: Single Room Capture → SVG          [Foundation]
Phase 2: Review & Correction Cycle          [Core Loop]
Phase 3: Multi-Room Assembly                [Key Feature]
Phase 4: Satellite Calibration              [Accuracy]
Phase 5: Final Styling & Export             [Output]
Phase 6: Polish & Mobile Optimization       [Production]
```

---

## Phase 1: Single Room Capture → SVG

**Goal:** User can photograph one room and see a basic SVG floor plan of it.

**What to build:**

1. **Project scaffolding**
   - Vite + React + Tailwind setup
   - Zustand store with session/room state
   - Basic routing (for now, single-page wizard)
   - File structure following conventions (see `08_CONVENTIONS.md`)

2. **AddressEntry component** (simplified)
   - Text input for address (no autocomplete yet — add in Phase 4)
   - "Continue" button
   - For now: skip satellite lookup entirely (just store address)

3. **CornerSelector component**
   - 2×2 button grid
   - Store selection in session state

4. **RoomTypeSelector component**
   - Grid of room type buttons
   - Auto-generate label

5. **CameraCapture component**
   - Camera viewfinder with getUserMedia
   - Direction prompt (N/E/S/W)
   - Compass heading display + capture
   - Photo preview with use/retake
   - Store photos in local state (blob URLs)
   - **Skip upload to S3 for now** — photos stay client-side

6. **Claude API integration (mock first, then real)**
   - Start with a MOCK response: hardcoded JSON matching the analysis schema
   - Build the SVG renderer against mock data
   - Then: implement actual API call (can call Claude directly from client for prototype, move to Lambda later)

7. **SVG Room Renderer**
   - Function: `generateRoomSVG(analysis: RoomAnalysis): string`
   - Draws: outer walls, doors (with swing arcs), windows (parallel lines), closets (dashed), room label
   - Uses standard architectural line conventions
   - Configurable pixelsPerFoot scale

8. **Basic PlanReview component**
   - Render SVG in viewport
   - "Looks Good" button (accept)
   - For now: no correction cycle (that's Phase 2)

**Acceptance criteria:**
- [ ] Can enter address, select corner, select room type
- [ ] Can take 4 photos with compass headings recorded
- [ ] Photos are sent to Claude (or mock), JSON analysis returned
- [ ] SVG floor plan renders showing walls, doors, windows, closets
- [ ] SVG dimensions roughly match a real room (within ±2 feet with real API)
- [ ] Works on mobile browser (iOS Safari, Android Chrome)

**Session notes for coding:**
- Session 1.1: Scaffolding + AddressEntry + CornerSelector + RoomTypeSelector
- Session 1.2: CameraCapture with compass
- Session 1.3: Mock Claude response + SVG renderer
- Session 1.4: Wire up real Claude API, test with real photos

---

## Phase 2: Review & Correction Cycle

**Goal:** User can annotate and correct the room plan through iterative feedback.

**What to build:**

1. **FeedbackPanel component**
   - Text input for corrections
   - Quick-suggestion chips
   - Submit and Accept buttons

2. **AnnotationOverlay component**
   - fabric.js canvas overlay on PlanRenderer
   - Drawing tools: freehand, circle, arrow
   - Undo/clear
   - Export to PNG

3. **Revision API call**
   - Send original photos + previous analysis + feedback + annotation to Claude
   - Parse updated analysis
   - Re-render SVG

4. **Review loop in wizard flow**
   - PlanReview → if not accepted → show AnnotationOverlay + FeedbackPanel → submit → AnalysisLoader → PlanReview again
   - Track revision count per room

**Acceptance criteria:**
- [ ] User can draw on the plan to circle problems
- [ ] User can type correction text
- [ ] Annotation PNG + text sent to Claude
- [ ] Claude returns updated analysis addressing the feedback
- [ ] Updated SVG renders with corrections
- [ ] User can iterate multiple times, then accept
- [ ] Works with touch drawing on mobile

**Session notes:**
- Session 2.1: FeedbackPanel + text feedback flow
- Session 2.2: AnnotationOverlay with fabric.js
- Session 2.3: Revision API integration + loop

---

## Phase 3: Multi-Room Assembly

**Goal:** Multiple rooms merge into a connected floor plan with shared walls.

**What to build:**

1. **DirectionPicker component**
   - Shows current room with directional arrows
   - User taps direction for next room

2. **Room positioning algorithm**
   - Given room A dimensions + direction → calculate room B position
   - Handle: door alignment between rooms
   - Handle: shared wall reconciliation (if room A says wall is 14ft but room B says 13.5ft, average or prompt user)

3. **Wall merging logic**
   - Detect shared walls between adjacent rooms
   - Remove duplicate wall lines
   - Draw shared walls once with correct weight
   - Doors on shared walls: draw once, correctly positioned

4. **Merged SVG generator**
   - Combine all room SVGs into single plan SVG
   - Apply room positions via transform/translate
   - Remove internal duplicate walls
   - Update viewBox for total plan size

5. **MergedPlanReview component**
   - Show combined plan after each new room
   - Highlight newest room
   - Allow corrections to arrangement

6. **MoreRoomsPrompt component**

7. **Hallway handling**
   - Different capture mode for hallways
   - Hallways connect to multiple rooms
   - May need to adjust hallway dimensions to span correctly

**Acceptance criteria:**
- [ ] Can capture 3+ rooms sequentially
- [ ] Rooms positioned correctly relative to each other
- [ ] Shared walls rendered once (not doubled)
- [ ] Doors between rooms shown correctly
- [ ] User can adjust room arrangement via feedback
- [ ] Hallway mode works for long narrow spaces

**Session notes:**
- Session 3.1: DirectionPicker + basic room positioning
- Session 3.2: Wall merging algorithm
- Session 3.3: Merged SVG generator + MergedPlanReview
- Session 3.4: Hallway mode + edge cases

---

## Phase 4: Satellite Calibration

**Goal:** Fetch aerial imagery, estimate house footprint, calibrate the interior plan against it.

**What to build:**

1. **Google Maps / Mapbox integration**
   - API call to fetch satellite image at known scale
   - Optionally fetch Street View
   - Store images in S3

2. **Satellite analysis Claude call**
   - Send satellite image to Claude
   - Parse building footprint response
   - Store as houseBounds in session

3. **Address autocomplete**
   - Add Google Places Autocomplete to AddressEntry
   - Better address → better satellite match

4. **Calibration algorithm**
   - Compare interior plan total dimensions to satellite footprint
   - Account for wall thickness + roof overhang
   - Apply proportional scaling
   - Handle shape mismatches (L-shape house but rooms only cover rectangle portion → flag missing area)

5. **Calibration review UI**
   - Show interior plan overlaid on satellite footprint
   - Show scaling adjustments
   - Let user approve or adjust

**Acceptance criteria:**
- [ ] Satellite image fetched for entered address
- [ ] Claude estimates house footprint from satellite
- [ ] Interior plan scaled to match exterior
- [ ] Roof overhang offset applied
- [ ] User can review and adjust calibration
- [ ] Graceful handling when satellite unavailable

**Session notes:**
- Session 4.1: Maps API integration + satellite fetch
- Session 4.2: Claude satellite analysis + calibration algorithm
- Session 4.3: Calibration review UI

---

## Phase 5: Final Styling & Export

**Goal:** Professional architectural output in DXF, SVG, and PDF.

**What to build:**

1. **Architectural styling for SVG**
   - Black and white only
   - Standard line weights: exterior walls 4px, interior walls 2px, features 1px
   - Door arcs per architectural convention
   - Window symbols per architectural convention
   - Room labels centered in each room
   - Exterior dimensions only (positioned outside the plan boundary)
   - Visual scale bar
   - North arrow
   - Disclaimer text: "Plan is approximate, verify actual conditions before use"
   - Title block (optional): address, date, "Generated by FloorSnap"
   - No furniture

2. **DXF export**
   - Python Lambda using `ezdxf`
   - Convert SVG room/feature data to DXF entities
   - Proper layers: WALLS, DOORS, WINDOWS, CLOSETS, LABELS, DIMENSIONS
   - Scale: real-world feet

3. **PDF export**
   - Render styled SVG to PDF
   - Page setup: Letter or Tabloid, landscape
   - Scale options: 1/4" = 1' or 1/8" = 1'
   - Include disclaimer and scale bar on printed page

4. **ExportOptions component**
   - Format selection buttons
   - Paper/scale options for PDF
   - Download triggers

**Acceptance criteria:**
- [ ] Final plan follows architectural drawing conventions
- [ ] DXF opens correctly in AutoCAD / LibreCAD with proper layers
- [ ] PDF prints at correct scale with ruler verification
- [ ] All exports include disclaimer, scale bar, room labels
- [ ] No furniture shown in any export
- [ ] Exterior dimensions shown, interior dimensions hidden

**Session notes:**
- Session 5.1: Architectural SVG styling
- Session 5.2: DXF export Lambda
- Session 5.3: PDF export + ExportOptions UI

---

## Phase 6: Polish & Mobile Optimization

**Goal:** Production-ready quality. Smooth on real phones.

**What to build:**

1. **Mobile UX polish**
   - Test and fix on iOS Safari, Android Chrome, Samsung Internet
   - Camera permission flows for each browser
   - Compass permission on iOS (requires user gesture)
   - Touch responsiveness for all interactive elements
   - Keyboard handling (text inputs don't obscure UI)
   - Orientation lock (portrait preferred, but handle landscape)

2. **PWA setup**
   - Service worker for app shell caching
   - manifest.json for "Add to Home Screen"
   - Offline photo capture (save to IndexedDB, upload when online)

3. **Session persistence**
   - DynamoDB save/resume
   - "Resume session" on app open if incomplete session exists
   - Session list for user's past plans

4. **Backend deployment**
   - SAM or CDK template for Lambda + API Gateway + DynamoDB + S3
   - Staging and production environments
   - API key management (Secrets Manager)
   - CORS configuration

5. **Error handling**
   - Graceful failures for Claude API errors
   - Retry logic for network issues
   - User-friendly error messages
   - Photo upload retry queue

6. **Performance**
   - Photo compression optimization
   - SVG rendering performance for large plans (10+ rooms)
   - Lazy loading of non-visible rooms in merged plan

7. **Tape measure calibration step (optional enhancement)**
   - After all rooms captured, ask user to measure one dimension
   - Use as ground-truth to scale-correct entire plan

**Acceptance criteria:**
- [ ] Full end-to-end workflow on iPhone SE (smallest common screen)
- [ ] Full end-to-end workflow on Pixel 7 (common Android)
- [ ] Can resume interrupted session
- [ ] Handles airplane mode during capture (queues uploads)
- [ ] No unhandled errors in any workflow path
- [ ] Plan with 8+ rooms renders smoothly
- [ ] All AWS resources deployed and working

---

## Dependency Graph

```
Phase 1 ─────► Phase 2 ─────► Phase 3 ─────► Phase 5
                                  │               │
Phase 4 (independent) ───────────┘               │
                                                  ▼
                                              Phase 6
```

Phase 4 can be developed in parallel with Phase 3. Phase 5 depends on Phase 3 (needs multi-room plans). Phase 6 depends on everything else.
