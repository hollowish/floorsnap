# 03 — Data Models

## Client-Side State (Zustand Store)

### Session State

```typescript
interface FloorPlanSession {
  // Identity
  sessionId: string;
  userId: string;
  createdAt: string;          // ISO 8601
  updatedAt: string;

  // House Info
  address: string;
  startingCorner: "NW" | "NE" | "SE" | "SW";
  houseBounds: HouseBounds | null;

  // Rooms
  rooms: Room[];
  currentRoomIndex: number;   // -1 if no room in progress

  // Workflow
  currentStep: WorkflowStep;
  isFinalized: boolean;

  // Plan
  mergedPlanSvg: string | null;
  finalPlanSvg: string | null;
}

type WorkflowStep =
  | "address"           // entering address
  | "corner"            // selecting starting corner
  | "room-type"         // choosing room type
  | "capture-north"     // taking N wall photo
  | "capture-east"      // taking E wall photo
  | "capture-south"     // taking S wall photo
  | "capture-west"      // taking W wall photo
  | "analyzing"         // waiting for Claude
  | "review-room"       // reviewing individual room plan
  | "annotating"        // drawing corrections on plan
  | "review-merged"     // reviewing merged multi-room plan
  | "direction"         // choosing next room direction
  | "more-rooms"        // asking if more rooms exist
  | "calibrating"       // adjusting to satellite data
  | "review-final"      // reviewing final calibrated plan
  | "export"            // export options
  | "complete";         // done
```

### Room Model

```typescript
interface Room {
  id: string;                 // UUID
  index: number;              // sequential, for display (Room 1, Room 2, ...)
  type: RoomType;
  label: string;              // e.g., "Bedroom#1", "Kitchen#1"

  // Photos
  photos: {
    north: PhotoData | null;
    east: PhotoData | null;
    south: PhotoData | null;
    west: PhotoData | null;
  };

  // Claude Analysis Results
  analysis: RoomAnalysis | null;

  // SVG
  svgData: string | null;     // individual room SVG string

  // Position in overall plan (feet from plan origin)
  position: {
    x: number;                // feet from left edge
    y: number;                // feet from top edge
  };

  // Connections to other rooms
  connections: RoomConnection[];

  // Review
  reviewStatus: "pending" | "reviewing" | "accepted";
  revisionCount: number;
  feedback: RevisionFeedback[];
}

type RoomType =
  | "bedroom"
  | "bathroom"
  | "kitchen"
  | "family-room"
  | "living-room"
  | "dining-room"
  | "office"
  | "utility-room"
  | "laundry"
  | "garage"
  | "hallway"
  | "storage"
  | "closet"
  | "other";

interface PhotoData {
  localUri: string;           // blob URL for local display
  s3Key: string | null;       // S3 key after upload
  compassHeading: number;     // degrees (0-360, 0=North)
  capturedAt: string;         // ISO 8601
  width: number;              // pixels
  height: number;             // pixels
}
```

### Room Analysis (Claude's Output)

```typescript
interface RoomAnalysis {
  // Dimensions
  dimensions: {
    width: number;            // feet (E-W measurement)
    height: number;           // feet (N-S measurement)
    confidence: number;       // 0-1
  };

  // Ceiling height (estimated)
  ceilingHeight: number;      // feet

  // Features detected on each wall
  walls: {
    north: WallFeature[];
    east: WallFeature[];
    south: WallFeature[];
    west: WallFeature[];
  };

  // Reference object detected (if any)
  referenceObject: {
    type: string;             // "door", "light_switch", "outlet"
    knownSize: number;        // inches
    detectedSize: number;     // pixels in photo
    scaleFactor: number;      // real_inches / pixels
  } | null;

  // Raw Claude response (for debugging)
  rawResponse: string;
}

interface WallFeature {
  type: FeatureType;
  position: number;           // feet from left edge of wall (when facing wall)
  width: number;              // feet
  height: number;             // feet (for windows, doors)
  distanceFromFloor: number;  // feet (for windows)
  opensTo: string | null;     // "exterior", room label, or null
  swingDirection: "left" | "right" | "sliding" | "pocket" | null;  // doors
  notes: string;              // any additional info from Claude
}

type FeatureType =
  | "door"
  | "window"
  | "closet"
  | "closet-door"
  | "archway"
  | "pass-through"
  | "fireplace"
  | "built-in"
  | "stairs"
  | "column"
  | "outlet"                  // optional detail level
  | "light-switch";           // optional detail level
```

### Connections & Merging

```typescript
interface RoomConnection {
  fromRoomId: string;
  toRoomId: string;
  direction: "north" | "east" | "south" | "west";
  connectionType: "door" | "archway" | "pass-through" | "hallway";
  sharedWall: {
    fromWall: "north" | "east" | "south" | "west";  // wall in fromRoom
    toWall: "north" | "east" | "south" | "west";    // wall in toRoom
    // Position of connection along the shared wall
    connectionStart: number;   // feet from wall start
    connectionWidth: number;   // feet
  };
}

interface RevisionFeedback {
  revisionNumber: number;
  textFeedback: string;
  annotationImageUri: string | null;  // drawing overlay
  timestamp: string;
}
```

### House Bounds (from Satellite)

```typescript
interface HouseBounds {
  // Estimated exterior dimensions
  width: number;              // feet (E-W)
  height: number;             // feet (N-S)

  // Shape approximation
  shape: "rectangle" | "L-shape" | "T-shape" | "U-shape" | "irregular";
  shapeVertices: { x: number; y: number }[];  // polygon outline in feet

  // Satellite metadata
  satelliteImageUrl: string;
  satelliteScale: number;     // feet per pixel
  roofOverhangEstimate: number;  // feet (how far roof extends past walls)

  // Confidence
  confidence: number;         // 0-1
  dataSource: "satellite" | "parcel_data" | "both";
}
```

---

## DynamoDB Schema

### Table: `floorplan-sessions`

**Key Schema:**
- Partition Key: `PK` (String)
- Sort Key: `SK` (String)

**Access Patterns:**

| Pattern | PK | SK | Data |
|---------|----|----|------|
| Get session | `SESSION#{sessionId}` | `META` | Session metadata |
| Get house bounds | `SESSION#{sessionId}` | `BOUNDS` | HouseBounds |
| Get room | `SESSION#{sessionId}` | `ROOM#{roomId}` | Room data |
| List rooms | `SESSION#{sessionId}` | begins_with(`ROOM#`) | All rooms |
| Get merged plan | `SESSION#{sessionId}` | `PLAN#MERGED` | SVG + metadata |
| Get final plan | `SESSION#{sessionId}` | `PLAN#FINAL` | SVG + metadata |
| Get by user | GSI: `userId` | `updatedAt` | User's sessions |

**Item Examples:**

Session metadata:
```json
{
  "PK": "SESSION#abc123",
  "SK": "META",
  "userId": "user_456",
  "address": "123 Main St, Oakland, CA 94601",
  "startingCorner": "SW",
  "currentStep": "review-room",
  "currentRoomIndex": 2,
  "isFinalized": false,
  "createdAt": "2026-02-15T10:30:00Z",
  "updatedAt": "2026-02-15T11:15:00Z",
  "ttl": 1742400000
}
```

Room item:
```json
{
  "PK": "SESSION#abc123",
  "SK": "ROOM#room_789",
  "index": 0,
  "type": "bedroom",
  "label": "Bedroom#1",
  "photoKeys": {
    "north": "sessions/abc123/photos/room_789/north.jpg",
    "east": "sessions/abc123/photos/room_789/east.jpg",
    "south": "sessions/abc123/photos/room_789/south.jpg",
    "west": "sessions/abc123/photos/room_789/west.jpg"
  },
  "compassHeadings": {
    "north": 2.3,
    "east": 91.7,
    "south": 181.0,
    "west": 272.4
  },
  "analysis": { ... },
  "svgData": "<svg>...</svg>",
  "position": { "x": 0, "y": 0 },
  "connections": [ ... ],
  "reviewStatus": "accepted",
  "revisionCount": 1,
  "updatedAt": "2026-02-15T11:00:00Z"
}
```

---

## SVG Room Plan Structure

Each room's SVG follows a consistent internal structure for easy merging:

```xml
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 {widthPx} {heightPx}"
     data-room-id="{roomId}"
     data-room-label="{label}"
     data-scale="{pixelsPerFoot}">

  <!-- Room group, positioned at (0,0) in room-local coordinates -->
  <g class="room" data-room-id="{roomId}">

    <!-- Walls (thick stroke for exterior, thin for interior) -->
    <g class="walls">
      <line class="wall wall-north" x1="0" y1="0" x2="{w}" y2="0"
            stroke="#000" stroke-width="4" data-wall-type="exterior"/>
      <line class="wall wall-east" x1="{w}" y1="0" x2="{w}" y2="{h}"
            stroke="#000" stroke-width="2" data-wall-type="interior"/>
      <!-- ... south, west ... -->
    </g>

    <!-- Doors (arc showing swing direction) -->
    <g class="doors">
      <g class="door" data-wall="north" data-position="{pos}" data-width="{dw}">
        <!-- Gap in wall -->
        <line class="wall-gap" ... stroke="#fff" stroke-width="5"/>
        <!-- Door arc -->
        <path class="door-arc" d="M ... A ..." fill="none" stroke="#000" stroke-width="1"/>
      </g>
    </g>

    <!-- Windows (parallel lines on wall) -->
    <g class="windows">
      <g class="window" data-wall="east" data-position="{pos}" data-width="{ww}">
        <line ... stroke="#000" stroke-width="1"/>
        <line ... stroke="#000" stroke-width="1"/>
        <line ... stroke="#000" stroke-width="1"/>
      </g>
    </g>

    <!-- Closets (dashed rectangle) -->
    <g class="closets">
      <rect class="closet" ... stroke="#000" stroke-width="1" stroke-dasharray="4,2" fill="none"/>
    </g>

    <!-- Room label -->
    <text class="room-label" x="{cx}" y="{cy}"
          text-anchor="middle" font-family="Arial" font-size="12">{label}</text>

    <!-- Dimensions (shown during review, hidden in final) -->
    <g class="dimensions" visibility="visible">
      <text ...>{width}'</text>
      <text ...>{height}'</text>
    </g>
  </g>
</svg>
```

### Coordinate System

- Origin (0,0) is the **northwest corner** of the plan
- X increases **eastward** (right)
- Y increases **southward** (down)
- All dimensions stored in **feet**
- SVG rendering uses a configurable `pixelsPerFoot` scale (default: 20px/ft for screen, 48px/ft for export)

### Merging Rooms

When rooms are merged into a combined plan:

```xml
<svg viewBox="0 0 {totalW} {totalH}" data-scale="20">
  <!-- Room 1 at its position -->
  <g transform="translate({room1.x * scale}, {room1.y * scale})">
    {room1 SVG content}
  </g>

  <!-- Room 2 at its position -->
  <g transform="translate({room2.x * scale}, {room2.y * scale})">
    {room2 SVG content}
  </g>

  <!-- Shared walls are drawn once, thicker -->
  <!-- Individual room walls at shared boundaries are removed -->
</svg>
```

---

## Claude API Response Format (Expected)

### Room Analysis Response

The Claude vision API is prompted to return JSON in this format:

```json
{
  "dimensions": {
    "width_ft": 12.0,
    "height_ft": 14.0,
    "confidence": 0.7
  },
  "ceiling_height_ft": 8.0,
  "walls": {
    "north": [
      {
        "type": "window",
        "position_ft": 3.0,
        "width_ft": 4.0,
        "height_ft": 4.0,
        "distance_from_floor_ft": 3.0,
        "notes": "Double-hung window with blinds"
      },
      {
        "type": "outlet",
        "position_ft": 1.0,
        "width_ft": 0.3,
        "height_ft": 0.3,
        "distance_from_floor_ft": 1.0,
        "notes": "Standard duplex outlet"
      }
    ],
    "east": [
      {
        "type": "door",
        "position_ft": 5.0,
        "width_ft": 2.67,
        "height_ft": 6.67,
        "swing_direction": "left",
        "opens_to": "hallway",
        "notes": "Standard interior door, swings into room"
      }
    ],
    "south": [
      {
        "type": "closet",
        "position_ft": 1.0,
        "width_ft": 6.0,
        "depth_ft": 2.0,
        "door_type": "sliding",
        "notes": "Sliding door closet, appears to be reach-in style"
      }
    ],
    "west": []
  },
  "reference_object": {
    "type": "door",
    "wall": "east",
    "known_height_inches": 80,
    "notes": "Used standard door height for scale calibration"
  },
  "shape": "rectangle",
  "notes": "Room appears to be a standard rectangular bedroom. Carpet flooring. One overhead light fixture centered."
}
```

### Satellite Analysis Response

```json
{
  "building_footprint": {
    "width_ft": 52.0,
    "height_ft": 38.0,
    "shape": "L-shape",
    "vertices_ft": [
      { "x": 0, "y": 0 },
      { "x": 52, "y": 0 },
      { "x": 52, "y": 24 },
      { "x": 32, "y": 24 },
      { "x": 32, "y": 38 },
      { "x": 0, "y": 38 }
    ],
    "confidence": 0.65
  },
  "roof_overhang_ft": 1.5,
  "building_orientation_degrees": 5,
  "notes": "Single-story ranch-style home. L-shape with garage on east side. Roof overhang estimated at 1.5 ft typical for this construction style."
}
```
