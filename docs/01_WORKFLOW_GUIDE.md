# 01 — Workflow Guide: Building FloorSnap Across Sessions

## The Challenge

FloorSnap is too complex to build in a single session. It spans frontend UI, camera integration, AI API calls, geometric computation, canvas rendering, and export pipelines. You'll need a strategy that keeps everything coherent across many separate coding sessions with Claude, handles inevitable mid-course corrections, and produces a working system — not just a collection of parts.

---

## Recommended Development Strategy

### Principle: Vertical Slices, Not Horizontal Layers

**Don't** build all the frontend, then all the backend, then all the AI integration. This leads to integration nightmares where nothing works together until the very end.

**Do** build thin vertical slices that work end-to-end, then widen them:

```
PHASE 1: Single room capture → SVG output (the core loop)
PHASE 2: Room review/correction cycle
PHASE 3: Multi-room assembly + merging
PHASE 4: Address lookup + satellite calibration
PHASE 5: Final plan styling + export
PHASE 6: Polish, edge cases, mobile optimization
```

Each phase produces something you can demo and test on your phone. If Phase 3 reveals that your Phase 1 data model was wrong, you catch it early — not after building 6 more components on top of it.

### How to Start Each Coding Session

Every session with Claude should begin with context-setting. Paste or reference the relevant docs from this package and state clearly:

```
"I'm working on FloorSnap Phase [X]. Here's where I left off: [brief status].
The relevant specs are in [doc names]. Today I want to accomplish: [specific goal]."
```

**What to include in your session prompt:**
1. The current phase and its goals (from `07_IMPLEMENTATION_PLAN.md`)
2. The relevant component specs (from `05_COMPONENT_SPECS.md`)
3. The relevant API contracts (from `04_API_CONTRACTS.md`)
4. Any code files that are already written and need to be extended
5. What specifically you want to build or fix this session

**What NOT to do:**
- Don't paste the entire doc set every session (too much context, wastes tokens)
- Don't start from scratch each time — always reference what exists
- Don't try to build more than one phase per session

### Session Templates

**Template: Starting a New Phase**
```
I'm building FloorSnap, a photo-to-floorplan web app. I'm starting Phase [X]: [phase name].

Previous phases completed:
- Phase 1: [status/notes]
- Phase 2: [status/notes]

Here are the specs for this phase:
[paste relevant section from 07_IMPLEMENTATION_PLAN.md]

Here are the component specs I'll need:
[paste relevant sections from 05_COMPONENT_SPECS.md]

Here's my current file structure:
[paste directory listing or key file contents]

Today's goal: [specific deliverable]
```

**Template: Continuing Within a Phase**
```
Continuing FloorSnap Phase [X]. Last session I built [component]. 

Current issue / next step: [describe]

Here's the current code for the relevant files:
[paste file contents]

The expected behavior is: [describe]
The actual behavior is: [describe, if debugging]
```

**Template: Troubleshooting**
```
FloorSnap Phase [X] — debugging [component name].

Expected: [what should happen]
Actual: [what's happening]
Error messages: [paste any errors]

Relevant code:
[paste the specific files/functions involved]

Relevant specs:
[paste from API_CONTRACTS.md or COMPONENT_SPECS.md if the issue is about wrong behavior vs. spec]
```

---

## Tool Recommendations by Task

Different parts of this project are best built with different approaches:

### Frontend UI Components (React)
**Best approach:** Build as artifacts in Claude chat, iterate visually, then extract to your codebase.
- Use Claude to generate React components with Tailwind
- Review the rendered artifact, request changes
- Once it looks right, save to your project
- **Caveat:** Artifacts can't access real APIs. Build the UI with mock data first, wire up real data later.

### SVG Floor Plan Rendering
**Best approach:** Build as artifacts first for visual iteration, then extract the rendering logic.
- The plan renderer is highly visual — you need to see output to evaluate it
- Start with hardcoded room data → SVG output as an artifact
- Once rendering looks right, extract to a reusable component
- fabric.js overlay for annotations can also be prototyped as an artifact

### Backend API + Lambda Functions
**Best approach:** Build in Claude's code execution environment (bash tool), test with curl.
- Have Claude write the Lambda handler code
- Test the logic locally with mock inputs
- The actual AWS deployment is a separate step (use SAM or CDK)

### Claude API Integration (Vision + Text)
**Best approach:** Prototype prompts first, then wrap in API calls.
- Use `06_CLAUDE_PROMPTS.md` as your starting point
- Test prompts by sending sample room photos through the API manually
- Iterate on prompts until output quality is good
- THEN wrap the working prompt in Lambda code
- **This is the highest-risk component** — budget extra time for prompt engineering

### Geometric Computation (Room Merging, Wall Reconciliation)
**Best approach:** Pure algorithm work. Build and test as standalone functions with unit tests.
- Write the merge/reconcile algorithms as isolated JavaScript or Python functions
- Test with synthetic room data (rectangles with known dimensions)
- Edge cases: L-shaped rooms, angled walls, rooms that don't align
- This is the most "traditional coding" part — good candidate for TDD

### Export Pipeline (DXF, PDF)
**Best approach:** Build last. Input is the final SVG; output is a file download.
- DXF export: Python `ezdxf` library in a Lambda function
- PDF export: Puppeteer rendering of the styled SVG, or `svg2pdf.js` client-side
- These are straightforward transformations — don't over-engineer

---

## State Management Strategy

This app has complex state that persists across the entire session. Here's how to manage it:

### Client-Side State (Zustand Store)

```
FloorPlanSession {
  sessionId: string
  address: string
  startingCorner: "NW" | "NE" | "SE" | "SW"
  houseBounds: { width, height, shape, confidence }  // from satellite
  rooms: Room[]
  currentRoomIndex: number
  currentStep: "address" | "corner" | "room-type" | "capture" | "review" | "direction" | "finalize"
}

Room {
  id: string
  type: string
  label: string  // e.g., "Bedroom#1"
  photos: { north, east, south, west }  // S3 URLs
  compassHeadings: { north, east, south, west }  // actual degrees
  dimensions: { width, height }  // feet, estimated by Claude
  features: Feature[]  // doors, windows, closets with positions
  svgData: string  // individual room SVG
  position: { x, y }  // position in overall plan (feet from origin)
  adjacentTo: { roomId, direction, connectionType }[]
  reviewStatus: "pending" | "reviewing" | "accepted"
}
```

### Server-Side State (DynamoDB)

Mirror the client state for persistence and recovery. Save after each room is accepted. This lets users close the browser and resume later.

### State Sync Pattern

```
Client action → Update local state → API call to save → 
  If API fails → Queue for retry, continue locally
  If API succeeds → Confirm save
```

---

## Testing Strategy

### During Development (Each Phase)
- **Visual testing**: Use artifacts to render SVGs and review them manually
- **API testing**: Use Claude's bash tool to make curl requests to your endpoints
- **Unit testing**: Write Jest tests for geometric computation functions
- **Phone testing**: After each phase, deploy to a staging URL and test on your actual phone

### Integration Testing
- After Phase 3 (multi-room): Walk through a real 3-room capture end-to-end
- After Phase 5 (export): Verify DXF opens in a CAD program, PDF prints correctly
- After Phase 6 (polish): Full end-to-end test with a real house

### What to Test on Mobile Specifically
- Camera permissions and capture flow
- Compass accuracy (test in different rooms, near metal objects)
- Touch annotation (drawing on the review overlay)
- SVG pan/zoom performance
- Photo upload on slow connections
- Screen rotation handling

---

## Version Control Strategy

### Branch Structure
```
main ─── stable, deployed
  ├── dev ─── integration branch
  │    ├── phase-1/room-capture
  │    ├── phase-2/review-cycle
  │    ├── phase-3/multi-room
  │    └── ...
```

### Commit Discipline
- Commit after each working component within a phase
- Commit message format: `phase-X: [component] - [what changed]`
- Don't commit broken code to `dev` — keep a working branch

### Between Sessions
- Always note what's working and what's not before ending a session
- Keep a `SESSION_LOG.md` file (see below) that tracks progress

---

## Session Log Template

Keep this file updated after every coding session:

```markdown
# FloorSnap Session Log

## Session [N] — [Date]
**Phase:** [X]
**Goal:** [what you planned to build]
**Accomplished:** [what actually got done]
**Issues:** [any bugs, design problems, or open questions]
**Next Session:** [what to do next]
**Files Changed:**
- `src/components/CameraCapture.jsx` — created
- `src/lib/roomAnalysis.js` — updated prompt format
**Notes:** [anything useful for future context]
```

---

## Common Pitfalls to Avoid

1. **Over-engineering the data model early.** Start with the simplest Room shape that works for Phase 1. You WILL refactor it when you add multi-room merging — that's fine.

2. **Spending too long on prompts before building UI.** Get the capture flow working with mock Claude responses first. Swap in real API calls once the UI flow is solid.

3. **Ignoring mobile testing until the end.** Test on your phone after every phase. Desktop browser behavior ≠ mobile browser behavior, especially for camera and touch.

4. **Trying to make the SVG renderer perfect in Phase 1.** Phase 1 SVG just needs to show rectangles with labeled features. Architectural styling comes in Phase 5.

5. **Not saving intermediate state.** If the user's browser crashes after capturing 6 rooms, they should be able to resume. Build the DynamoDB persistence early (Phase 1), not late.

6. **Assuming Claude's vision will be highly accurate.** It won't be — especially for dimensions. The review cycle and the aerial calibration are your safety nets. Design for inaccuracy.

---

## Estimated Timeline

| Phase | Estimated Sessions | Complexity |
|-------|-------------------|------------|
| Phase 1: Single Room | 3-4 sessions | High (most new components) |
| Phase 2: Review Cycle | 2-3 sessions | Medium (annotation is tricky) |
| Phase 3: Multi-Room | 3-4 sessions | High (geometry + merging) |
| Phase 4: Satellite Cal. | 2 sessions | Medium (API integration) |
| Phase 5: Styling + Export | 2-3 sessions | Medium (DXF is fiddly) |
| Phase 6: Polish | 2-3 sessions | Low-Medium (bug fixes) |
| **Total** | **14-19 sessions** | |

This assumes ~1-2 hour focused sessions. Adjust based on your pace.
