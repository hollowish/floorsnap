# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Summary

FloorSnap is a mobile-first React SPA that guides users through photographing rooms of a house and uses Claude's vision API to generate architectural floor plans as SVG. Currently in Phase 1 (single room capture → SVG). See `docs/07_IMPLEMENTATION_PLAN.md` for the full 6-phase roadmap.

## Commands

```bash
npm run dev          # Start Vite dev server (port 5173, exposed to network for mobile testing)
npm run build        # Production build to dist/
npm run preview      # Preview production build locally
```

No test runner is configured yet. Tests are planned with Jest in `tests/` (see `docs/08_CONVENTIONS.md`).

## Architecture

**Stack:** React 18 + Vite + Tailwind CSS + Zustand

**Wizard-driven flow:** The entire app is a single-page wizard. `FloorPlanWizard` (`src/components/wizard/FloorPlanWizard.jsx`) is the master orchestrator — it reads `currentStep` from the Zustand store and renders the corresponding step component. There is no router.

**Workflow steps** (in order): `address` → `corner` → `room-type` → `capture-north` → `capture-east` → `capture-south` → `capture-west` → `analyzing` → `review-room` → `annotating` → `direction` → `review-merged` → `more-rooms` → `calibrating` → `review-final` → `export` → `complete`. Steps after `room-type` currently render a `Placeholder` stub.

**State management:** Single Zustand store at `src/store/floorPlanStore.js` is the source of truth for the entire session (address, rooms, photos, workflow step, SVG output). Components access it via `src/hooks/useFloorPlan.js`. No prop drilling — all wizard steps read/write the store directly.

**Key data flow:** Each room gets 4 directional photos (N/E/S/W) → sent to Claude vision API → returns JSON room analysis → `svgGenerator` (future, in `src/lib/`) converts to SVG → displayed in review step → multi-room merge assembles full plan.

## Source Layout

- `src/components/wizard/` — Wizard step components (one per step)
- `src/components/ui/` — Reusable UI primitives (`ActionButton`, `InstructionBanner`, `Toast`)
- `src/store/floorPlanStore.js` — Zustand store with all state and actions
- `src/hooks/useFloorPlan.js` — Convenience hook wrapping store selectors
- `src/constants/roomTypes.js` — Room type definitions (14 types with emoji icons, label generator)
- `src/styles/globals.css` — Tailwind imports + mobile viewport fixes + animations

Future directories (not yet created): `src/lib/` (business logic), `src/components/plan/` (SVG rendering), `src/components/camera/` (capture UI), `server/` (Lambda functions).

## Conventions

- **Git commits:** `phase-N: [Component] short description`
- **Components:** Functional only, PascalCase files (`.jsx`), default export for wizard steps, named export for shared components
- **Event handlers:** `handle` prefix (`handleSubmit`, `handlePhotoCapture`)
- **Booleans:** `is`/`has`/`should`/`can` prefix
- **Styling:** Tailwind utilities only (mobile-first, use `md:`/`lg:` for larger screens). Custom "blueprint" color palette defined in `tailwind.config.js`
- **SVG coordinates:** Origin (0,0) = northwest corner, X = east, Y = south, units in feet internally

## Environment Variables

Copy `.env.example` to `.env.local`. The key variable is `VITE_ANTHROPIC_API_KEY` for Claude API access. Google Maps keys and backend API URL are needed in later phases.

## Documentation

Detailed specs live in `docs/` — notably `03_DATA_MODELS.md` for the full Zustand store schema, `05_COMPONENT_SPECS.md` for component behavior specs, `06_CLAUDE_PROMPTS.md` for vision API prompts, and `08_CONVENTIONS.md` for code patterns.
