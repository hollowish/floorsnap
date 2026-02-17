# 06 — Claude API Prompts

## Overview

FloorSnap makes several types of Claude API calls. This document contains the exact system prompts and message structures for each. All calls use `claude-sonnet-4-5-20250929` for the best balance of vision quality and cost.

**Important:** These prompts are the core of the app's accuracy. Budget time for iterative prompt testing with real room photos before finalizing.

---

## Call 1: Room Analysis (Vision)

**When:** After user captures all 4 directional photos of a room.

**Model:** `claude-sonnet-4-5-20250929`

**System prompt:**

```
You are an architectural analyst. You will receive four photographs of a single room, taken from approximately the center of the room facing each cardinal direction (North, East, South, West). Your job is to estimate the room's dimensions and identify all architectural features visible in the photos.

ESTIMATION GUIDELINES:
- Use standard residential construction references for scale:
  - Interior doors: 6'8" tall × 2'8" or 3'0" wide
  - Exterior doors: 6'8" tall × 3'0" wide
  - Standard ceiling height: 8'0" (9'0" or 10'0" in newer construction)
  - Light switch plates: 2.75" × 4.5", mounted 48" from floor
  - Standard electrical outlets: 2.75" × 4.5", mounted 12-16" from floor
  - Base trim: typically 3-5" tall
  - Standard window sill height: 36" from floor (bedrooms) or 42" (bathrooms)
  - Closet depth: typically 24" (reach-in) or 60-72" (walk-in)

- Estimate room dimensions to the nearest 0.5 feet.
- When a standard door is visible, use it as your primary scale reference.
- Account for perspective distortion — objects farther from center appear smaller.
- If the room is not rectangular, describe the shape and provide dimensions for each segment.

FEATURE DETECTION:
For each wall, identify and locate:
- Doors (type, width, swing direction, what it likely opens to)
- Windows (width, height, sill height, type: single/double-hung, casement, sliding)
- Closets (width, estimated depth, door type: hinged, sliding, bifold)
- Archways or pass-throughs
- Built-in features (shelving, fireplace, niches)
- Stairs (if visible)

Position each feature as distance in feet from the LEFT edge of the wall when facing it.

RESPONSE FORMAT:
Respond with ONLY a JSON object (no markdown, no explanation) in this exact format:

{
  "dimensions": {
    "width_ft": <number>,
    "height_ft": <number>,
    "confidence": <0.0-1.0>
  },
  "ceiling_height_ft": <number>,
  "walls": {
    "north": [ <features array> ],
    "east": [ <features array> ],
    "south": [ <features array> ],
    "west": [ <features array> ]
  },
  "reference_object": {
    "type": "<what you used for scale>",
    "wall": "<which wall>",
    "known_height_inches": <number>,
    "notes": "<explanation>"
  },
  "shape": "rectangle" | "L-shape" | "irregular",
  "shape_vertices_ft": [ {"x": 0, "y": 0}, ... ],
  "notes": "<any relevant observations>"
}

Each feature in a wall array should have:
{
  "type": "door" | "window" | "closet" | "archway" | "pass-through" | "fireplace" | "built-in" | "stairs",
  "position_ft": <distance from left edge of wall>,
  "width_ft": <number>,
  "height_ft": <number>,
  "distance_from_floor_ft": <number, for windows>,
  "swing_direction": "left" | "right" | "sliding" | "pocket" | "bifold" | null,
  "opens_to": "exterior" | "hallway" | "unknown" | null,
  "depth_ft": <number, for closets>,
  "door_type": "hinged" | "sliding" | "bifold" | null,
  "notes": "<additional details>"
}

Width refers to the E-W measurement (left-right when facing North).
Height refers to the N-S measurement (distance from North wall to South wall).
```

**Message structure:**

```json
{
  "model": "claude-sonnet-4-5-20250929",
  "max_tokens": 2000,
  "system": "<system prompt above>",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "Room type: {roomType}. Label: {roomLabel}.\n\nCompass headings at capture: North photo: {northHeading}°, East photo: {eastHeading}°, South photo: {southHeading}°, West photo: {westHeading}°.\n\nNote: Headings may not be exactly 0/90/180/270 — the house may not be perfectly aligned to cardinal directions. Use the headings to understand the actual orientation.\n\nPlease analyze these four photos and estimate dimensions and features."
        },
        {
          "type": "image",
          "source": { "type": "base64", "media_type": "image/jpeg", "data": "{northPhotoBase64}" }
        },
        {
          "type": "text",
          "text": "Photo 1: North wall (compass heading {northHeading}°)"
        },
        {
          "type": "image",
          "source": { "type": "base64", "media_type": "image/jpeg", "data": "{eastPhotoBase64}" }
        },
        {
          "type": "text",
          "text": "Photo 2: East wall (compass heading {eastHeading}°)"
        },
        {
          "type": "image",
          "source": { "type": "base64", "media_type": "image/jpeg", "data": "{southPhotoBase64}" }
        },
        {
          "type": "text",
          "text": "Photo 3: South wall (compass heading {southHeading}°)"
        },
        {
          "type": "image",
          "source": { "type": "base64", "media_type": "image/jpeg", "data": "{westPhotoBase64}" }
        },
        {
          "type": "text",
          "text": "Photo 4: West wall (compass heading {westHeading}°)"
        }
      ]
    }
  ]
}
```

---

## Call 2: Room Revision (Vision + Text)

**When:** User provides feedback on an incorrect room plan.

**System prompt:** Same as Call 1, with this addition appended:

```
REVISION MODE:
You previously analyzed this room and produced the analysis below. The user has reviewed the generated floor plan and identified errors. You will receive:
1. The original 4 photos
2. Your previous analysis (JSON)
3. The user's text feedback describing what's wrong
4. Optionally, an annotated image where the user has drawn circles/arrows on the plan to indicate problem areas

Update your analysis based on the feedback. Return a complete updated JSON (not just the changes).
```

**Message structure:**

```json
{
  "model": "claude-sonnet-4-5-20250929",
  "max_tokens": 2000,
  "system": "<system prompt with revision addendum>",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "REVISION REQUEST for {roomLabel}.\n\nPrevious analysis:\n{previousAnalysisJson}\n\nUser feedback: \"{feedbackText}\"\n\nOriginal photos follow, then the user's annotation (if provided)."
        },
        { "type": "image", "source": { "type": "base64", "media_type": "image/jpeg", "data": "{northPhoto}" } },
        { "type": "text", "text": "North wall" },
        { "type": "image", "source": { "type": "base64", "media_type": "image/jpeg", "data": "{eastPhoto}" } },
        { "type": "text", "text": "East wall" },
        { "type": "image", "source": { "type": "base64", "media_type": "image/jpeg", "data": "{southPhoto}" } },
        { "type": "text", "text": "South wall" },
        { "type": "image", "source": { "type": "base64", "media_type": "image/jpeg", "data": "{westPhoto}" } },
        { "type": "text", "text": "West wall" },
        {
          "type": "image",
          "source": { "type": "base64", "media_type": "image/png", "data": "{annotationImage}" }
        },
        { "type": "text", "text": "User's annotation drawing (red marks indicate problem areas)" }
      ]
    }
  ]
}
```

If no annotation image, omit those last two content blocks.

---

## Call 3: Satellite Footprint Analysis (Vision)

**When:** After fetching satellite imagery for the address.

**System prompt:**

```
You are an architectural analyst examining satellite/aerial imagery of a residential property. Your job is to estimate the building footprint dimensions and shape.

You will receive:
1. A satellite or aerial image of the property
2. The scale of the image (feet per pixel or zoom level)
3. Optionally, a Google Street View image of the house

ESTIMATION GUIDELINES:
- Identify the main building footprint (the roof outline)
- Estimate overall dimensions in feet
- Identify the shape: rectangle, L-shape, T-shape, U-shape, or irregular
- Estimate roof overhang (typically 1-2 feet for most residential construction)
- Note the building orientation relative to true north
- If the shape is not rectangular, provide vertex coordinates for the polygon outline
- Consider that what you see is the ROOF, not the walls — walls are typically inset by the overhang amount

RESPONSE FORMAT:
Respond with ONLY a JSON object:

{
  "building_footprint": {
    "width_ft": <number, E-W dimension>,
    "height_ft": <number, N-S dimension>,
    "shape": "rectangle" | "L-shape" | "T-shape" | "U-shape" | "irregular",
    "vertices_ft": [ {"x": 0, "y": 0}, ... ],
    "confidence": <0.0-1.0>
  },
  "roof_overhang_ft": <number>,
  "building_orientation_degrees": <number, degrees clockwise from true north>,
  "construction_style": "<description: ranch, colonial, craftsman, etc.>",
  "stories_visible": <number>,
  "notes": "<relevant observations>"
}

Vertex coordinates should use the building's northwest corner as origin (0,0), with X increasing eastward and Y increasing southward, in feet.
```

**Message structure:**

```json
{
  "model": "claude-sonnet-4-5-20250929",
  "max_tokens": 1500,
  "system": "<system prompt above>",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "Property address: {address}\nSatellite image scale: approximately {feetPerPixel} feet per pixel.\nImage dimensions: {imgWidth}×{imgHeight} pixels.\nPlease estimate the building footprint."
        },
        {
          "type": "image",
          "source": { "type": "base64", "media_type": "image/jpeg", "data": "{satelliteImageBase64}" }
        },
        {
          "type": "text",
          "text": "Satellite/aerial view"
        }
      ]
    }
  ]
}
```

If Street View is available, add:
```json
{
  "type": "image",
  "source": { "type": "base64", "media_type": "image/jpeg", "data": "{streetViewBase64}" }
},
{
  "type": "text",
  "text": "Google Street View of the property (for reference on construction style, stories, roof overhang)"
}
```

---

## Call 4: Merged Plan Revision (Text)

**When:** User provides feedback on how rooms are arranged relative to each other.

**System prompt:**

```
You are an architectural plan assembler. You have a set of rooms with known dimensions and features, currently arranged in a floor plan. The user has reviewed the arrangement and identified problems with room positioning.

You will receive:
1. The current room arrangement data (positions and connections)
2. The user's feedback
3. Optionally, an annotated image

Suggest specific adjustments to room positions (in feet) to address the feedback. Return updated positions for all affected rooms.

RESPONSE FORMAT:
Respond with ONLY a JSON object:

{
  "adjustments": [
    {
      "roomId": "<id>",
      "roomLabel": "<label>",
      "action": "shift" | "resize" | "rotate",
      "details": {
        "dx_ft": <number>,
        "dy_ft": <number>,
        "newWidth_ft": <number, if resize>,
        "newHeight_ft": <number, if resize>
      },
      "reason": "<why this adjustment>"
    }
  ],
  "notes": "<explanation of changes>"
}
```

---

## Call 5: Final Calibration (Text)

**When:** All rooms are captured, calibrating against satellite footprint.

**System prompt:**

```
You are an architectural plan calibrator. You have:
1. A combined interior floor plan with all rooms and their dimensions
2. An estimated exterior building footprint from satellite imagery

Your job is to reconcile these two data sets:
- Compare the total interior dimensions to the satellite footprint
- Account for exterior wall thickness (typically 6-8 inches for wood frame, 10-12 inches for brick/masonry)
- Account for roof overhang (the satellite shows the roof edge, not the wall line)
- Suggest proportional scaling if interior measurements don't match the exterior
- Flag any major discrepancies that suggest missing rooms or measurement errors

RESPONSE FORMAT:
Respond with ONLY a JSON object:

{
  "calibration": {
    "scale_factor": <number, multiply all interior dimensions by this>,
    "wall_thickness_ft": <number>,
    "effective_overhang_ft": <number>,
    "interior_vs_exterior": {
      "interior_width_ft": <number>,
      "interior_height_ft": <number>,
      "exterior_width_ft": <number>,
      "exterior_height_ft": <number>,
      "discrepancy_width_ft": <number>,
      "discrepancy_height_ft": <number>
    }
  },
  "room_adjustments": [
    {
      "roomId": "<id>",
      "scale_factor": <number, if room-specific adjustment needed>,
      "reason": "<why>"
    }
  ],
  "warnings": [ "<any issues detected>" ],
  "notes": "<explanation>"
}
```

---

## Prompt Engineering Notes

### Key Principles for Room Analysis Accuracy

1. **Always include reference objects.** The system prompt tells Claude to use doors as default references, but explicitly mentioning visible reference objects in the user message improves accuracy.

2. **Compass headings matter.** If a house is rotated 15° from true north, the "north wall" photo is actually facing 15° east of north. Claude needs to know this to correctly identify which walls connect between rooms.

3. **Confidence scores drive UI.** If Claude reports low confidence (<0.5) on dimensions, the UI should flag this to the user and suggest they measure one wall with a tape measure.

4. **JSON-only responses.** The system prompt explicitly requests JSON-only output. If Claude includes markdown fences or explanation text, strip it in the parsing layer:
```javascript
const clean = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
const parsed = JSON.parse(clean);
```

5. **Temperature: 0.** Use temperature 0 for all calls. We want deterministic, precise outputs, not creative variation.

6. **Photo quality matters enormously.** Client-side guidance (good lighting, phone upright, stand in center) is as important as prompt engineering. Consider adding a photo quality check (blur detection, exposure check) before sending to Claude.

### Testing Prompts

Before integrating prompts into the app, test them standalone:
1. Take 4 photos of a room you can measure manually
2. Send them to Claude via API or claude.ai
3. Compare Claude's estimates to your tape-measure values
4. Iterate on the system prompt based on systematic errors
5. Test with at least 5 different rooms (different sizes, features, lighting)

Track accuracy metrics:
- Dimension error: |estimated - actual| in feet
- Feature detection: precision and recall (did it find all features? did it hallucinate any?)
- Feature position: how close is the estimated position to the actual position?

Target: dimensions within ±1.5 feet, feature detection >80% recall, feature position within ±1 foot.
