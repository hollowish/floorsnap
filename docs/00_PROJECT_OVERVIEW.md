# FloorSnap — Photo-to-Floorplan Web App

## Project Summary

FloorSnap is a mobile-first web application that guides users through photographing each room of a single-story house and uses Claude's vision API to generate an approximate architectural floor plan. The app assembles individual room plans into a complete floor layout, calibrates against aerial/satellite imagery of the property, and exports the result as a professional black-and-white floor plan in DXF, SVG, or PDF format.

**Target Users:** Homeowners, real estate agents, renovators, inspectors — anyone who needs a quick approximate floor plan without hiring a surveyor.

**Key Constraint:** Plans are explicitly approximate. The app prominently disclaims: *"Plan is approximate, verify actual conditions before use."*

---

## Core Workflow (User Perspective)

```
START
  │
  ├─ 1. Enter house address
  │     └─ App fetches satellite imagery, estimates house footprint
  │
  ├─ 2. Select starting corner (NW, NE, SE, SW)
  │
  ├─ 3. ROOM CAPTURE LOOP:
  │     ├─ a. Select room type (bedroom, kitchen, bathroom, etc.)
  │     ├─ b. App names room automatically (e.g., Bedroom#1)
  │     ├─ c. Stand in center, take 4 photos (N, E, S, W walls)
  │     │     └─ Phone compass auto-tags heading per photo
  │     ├─ d. App sends photos to Claude → generates room plan (SVG)
  │     ├─ e. REVIEW CYCLE:
  │     │     ├─ User reviews plan
  │     │     ├─ If correct → accept, choose direction to next room
  │     │     └─ If wrong → annotate (draw + type feedback) → regenerate
  │     ├─ f. Room merges into cumulative floor plan
  │     ├─ g. User reviews merged plan, provides corrections if needed
  │     └─ h. "More rooms?" → Yes: repeat │ No: finalize
  │
  ├─ 4. FINALIZATION:
  │     ├─ Compare combined plan to satellite footprint
  │     ├─ Adjust proportions (account for eave overhang)
  │     ├─ Apply architectural styling (B&W, room labels, scale bar)
  │     ├─ User reviews final plan
  │     └─ Export as DXF / SVG / PDF
  │
  └─ END
```

---

## Design Principles

1. **Mobile-first**: All interactions designed for one-handed phone use. Large tap targets, swipe navigation, camera integration via browser APIs.
2. **Guided workflow**: Step-by-step wizard prevents user confusion. Progress indicator always visible.
3. **Iterative refinement**: Every generated plan goes through review. User is never stuck with a bad result.
4. **Architectural accuracy over visual polish**: Output follows drafting conventions (thin walls, door arcs, window marks), not interior design aesthetics.
5. **Graceful degradation**: If Claude's estimates are poor, the review cycle catches it. If satellite data is unavailable, the app still works (just without exterior calibration).

---

## Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | React (Next.js or Vite) | Component-based, great mobile PWA support |
| Styling | Tailwind CSS | Rapid mobile-first responsive design |
| Canvas/Drawing | SVG + fabric.js | Interactive plan editing + annotation overlay |
| Camera | Browser MediaDevices API | Direct camera access, no native app needed |
| Compass | DeviceOrientation API | Auto-tag photo headings |
| State Management | Zustand or React Context | Lightweight, good for wizard-style flows |
| Backend | AWS Lambda + API Gateway | Serverless, scales to zero when idle |
| AI Integration | Claude API (Sonnet for vision, Sonnet for text) | Vision for room analysis, text for plan assembly |
| Image Storage | AWS S3 | Temporary photo storage during session |
| Session Data | DynamoDB | Room data, plan state, user progress |
| Satellite Imagery | Google Maps Static API or Mapbox | Known-scale aerial views for calibration |
| Export - SVG | Built-in (frontend) | Interactive review format |
| Export - DXF | ezdxf (Python, Lambda) | Professional CAD output |
| Export - PDF | Puppeteer or svg2pdf.js | Print-ready output with disclaimers |
| Hosting | AWS CloudFront + S3 | Static frontend hosting |

---

## Integration Context

FloorSnap is one feature within a larger application hosted on AWS. It will:
- Share authentication/user management with the parent app
- Have its own dedicated API routes (e.g., `/api/floorplan/*`)
- Use a dedicated S3 prefix (e.g., `floorplan-sessions/`)
- Use a dedicated DynamoDB table (e.g., `floorplan-sessions`)
- Be accessible as a route/module within the parent app's navigation

---

## Key Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Claude vision estimates inaccurate | Poor room dimensions | Reference object calibration, tape-measure check, iterative review |
| Phone compass unreliable indoors | Photos tagged wrong direction | Allow manual heading correction, show compass reading for confirmation |
| Rooms don't align when merged | Disjointed floor plan | Shared-wall reconciliation algorithm, aerial calibration |
| Satellite imagery unavailable | No exterior calibration | App works without it; skip calibration step |
| Large houses = many API calls | Cost and latency | Batch photos per room, cache intermediate results |
| User on slow mobile connection | Photo upload failures | Compress photos client-side, retry logic, offline queue |

---

## File Index (This Documentation Set)

| File | Purpose |
|------|---------|
| `00_PROJECT_OVERVIEW.md` | This file — vision, workflow, stack, risks |
| `01_WORKFLOW_GUIDE.md` | How to build this project across multiple sessions |
| `02_ARCHITECTURE.md` | System architecture, AWS layout, data flow diagrams |
| `03_DATA_MODELS.md` | Database schemas, state shapes, API payloads |
| `04_API_CONTRACTS.md` | Every API endpoint with request/response formats |
| `05_COMPONENT_SPECS.md` | Detailed specs for every frontend component |
| `06_CLAUDE_PROMPTS.md` | Exact prompts for Claude vision and text API calls |
| `07_IMPLEMENTATION_PLAN.md` | Phased build plan with acceptance criteria |
| `08_CONVENTIONS.md` | Code style, naming, file structure, testing approach |
