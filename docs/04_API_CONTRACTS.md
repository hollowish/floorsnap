# 04 — API Contracts

## Base URL

```
Production:  https://{domain}/api/floorplan
Development: http://localhost:3001/api/floorplan
```

All endpoints require JWT authentication via `Authorization: Bearer {token}` header (provided by parent app).

---

## Sessions

### POST /sessions — Create Session

Start a new floor plan session.

**Request:**
```json
{
  "address": "123 Main St, Oakland, CA 94601"
}
```

**Response (201):**
```json
{
  "sessionId": "ses_abc123def",
  "address": "123 Main St, Oakland, CA 94601",
  "houseBounds": null,
  "createdAt": "2026-02-15T10:30:00Z"
}
```

**Notes:**
- `houseBounds` is null initially; populated asynchronously by satellite lookup
- Session auto-expires after 30 days (DynamoDB TTL)

---

### GET /sessions/{sessionId} — Get Session

Retrieve full session state for resuming.

**Response (200):**
```json
{
  "sessionId": "ses_abc123def",
  "address": "123 Main St, Oakland, CA 94601",
  "startingCorner": "SW",
  "houseBounds": { ... },
  "currentStep": "review-room",
  "currentRoomIndex": 2,
  "rooms": [ ... ],
  "mergedPlanSvg": "<svg>...</svg>",
  "isFinalized": false,
  "createdAt": "2026-02-15T10:30:00Z",
  "updatedAt": "2026-02-15T11:15:00Z"
}
```

---

### PATCH /sessions/{sessionId} — Update Session

Update session metadata (starting corner, workflow step).

**Request:**
```json
{
  "startingCorner": "SW",
  "currentStep": "room-type"
}
```

**Response (200):** Updated session object.

---

### POST /sessions/{sessionId}/satellite — Fetch Satellite Data

Triggers satellite imagery lookup and Claude analysis of house footprint. Can be called asynchronously after session creation.

**Request:** (empty body — uses session address)

**Response (202):**
```json
{
  "status": "processing",
  "estimatedSeconds": 15
}
```

**Polling:** GET /sessions/{sessionId} — check `houseBounds` field.

**Final result (in session):**
```json
{
  "houseBounds": {
    "width": 52.0,
    "height": 38.0,
    "shape": "L-shape",
    "shapeVertices": [ ... ],
    "satelliteImageUrl": "https://s3.../aerial.jpg",
    "satelliteScale": 0.82,
    "roofOverhangEstimate": 1.5,
    "confidence": 0.65,
    "dataSource": "satellite"
  }
}
```

---

## Rooms

### POST /sessions/{sessionId}/rooms — Create Room

**Request:**
```json
{
  "type": "bedroom"
}
```

**Response (201):**
```json
{
  "roomId": "room_xyz789",
  "index": 0,
  "type": "bedroom",
  "label": "Bedroom#1",
  "reviewStatus": "pending"
}
```

**Label generation logic:**
- Track count of each room type per session
- Label = `{Type}#{count}` (e.g., first bedroom = "Bedroom#1", second = "Bedroom#2")
- "Other" type prompts user for custom label

---

### PUT /sessions/{sessionId}/rooms/{roomId}/photos/{direction} — Upload Photo

**Request:**
```
Content-Type: multipart/form-data

Fields:
  image: (JPEG file, max 2MB after client compression)
  compassHeading: 187.3
```

**Response (200):**
```json
{
  "direction": "south",
  "s3Key": "sessions/abc123/photos/room_xyz789/south.jpg",
  "compassHeading": 187.3,
  "uploadedAt": "2026-02-15T11:01:00Z"
}
```

**Client-side pre-processing:**
- Resize to max 1200px on longest edge
- JPEG quality 80%
- Strip EXIF location data (privacy)
- Retain EXIF orientation for correct display

---

### POST /sessions/{sessionId}/rooms/{roomId}/analyze — Analyze Room

Sends all 4 photos to Claude vision API, returns room analysis and SVG.

**Request:** (empty body — uses uploaded photos)

**Response (200):**
```json
{
  "roomId": "room_xyz789",
  "analysis": {
    "dimensions": { "width": 12.0, "height": 14.0, "confidence": 0.7 },
    "ceilingHeight": 8.0,
    "walls": {
      "north": [ { "type": "window", "position": 3.0, "width": 4.0, ... } ],
      "east": [ { "type": "door", "position": 5.0, "width": 2.67, ... } ],
      "south": [ { "type": "closet", "position": 1.0, "width": 6.0, ... } ],
      "west": []
    },
    "referenceObject": { "type": "door", "knownSize": 80, "scaleFactor": 0.12 },
    "shape": "rectangle"
  },
  "svgData": "<svg xmlns='http://www.w3.org/2000/svg' ...>...</svg>",
  "analysisConfidence": 0.7
}
```

**Latency:** Expect 5-15 seconds (Claude vision processing).

---

### POST /sessions/{sessionId}/rooms/{roomId}/revise — Revise Room

Send corrections back to Claude for re-analysis.

**Request:**
```json
{
  "feedback": "Window is missing on the north wall, between the door and the corner",
  "annotationImage": "data:image/png;base64,..."
}
```

The `annotationImage` is optional — it's a PNG of the user's drawing overlay on the current SVG plan, showing circled areas or drawn corrections.

**Response (200):**
```json
{
  "roomId": "room_xyz789",
  "revisionNumber": 2,
  "analysis": { ... },
  "svgData": "<svg>...updated...</svg>",
  "analysisConfidence": 0.75,
  "changesApplied": [
    "Added window on north wall at position 8.0 ft, width 3.0 ft"
  ]
}
```

---

### PATCH /sessions/{sessionId}/rooms/{roomId} — Update Room

Accept room, update position, add connections.

**Request (accept):**
```json
{
  "reviewStatus": "accepted"
}
```

**Request (set position + connection):**
```json
{
  "position": { "x": 12.0, "y": 0.0 },
  "connections": [
    {
      "toRoomId": "room_abc",
      "direction": "west",
      "connectionType": "door",
      "sharedWall": {
        "fromWall": "west",
        "toWall": "east",
        "connectionStart": 5.0,
        "connectionWidth": 2.67
      }
    }
  ]
}
```

---

## Plan Assembly

### POST /sessions/{sessionId}/merge — Merge Rooms

Merge a newly accepted room into the cumulative floor plan.

**Request:**
```json
{
  "newRoomId": "room_xyz789",
  "adjacentRoomId": "room_abc456",
  "direction": "east",
  "connectionType": "door"
}
```

**Response (200):**
```json
{
  "mergedPlanSvg": "<svg>...combined rooms...</svg>",
  "roomPositions": {
    "room_abc456": { "x": 0, "y": 0 },
    "room_xyz789": { "x": 12.0, "y": 0 }
  },
  "totalDimensions": { "width": 24.0, "height": 14.0 },
  "sharedWalls": [
    {
      "rooms": ["room_abc456", "room_xyz789"],
      "wall": "east/west",
      "reconciled": true,
      "lengthDiscrepancy": 0.5
    }
  ]
}
```

---

### POST /sessions/{sessionId}/merge/revise — Revise Merged Plan

User feedback on the merged arrangement.

**Request:**
```json
{
  "feedback": "Bedroom#2 needs to shift down about 2 feet, the doors don't line up",
  "annotationImage": "data:image/png;base64,..."
}
```

**Response (200):**
```json
{
  "mergedPlanSvg": "<svg>...adjusted...</svg>",
  "roomPositions": { ... },
  "changesApplied": [
    "Shifted Bedroom#2 south by 2.0 ft to align door positions"
  ]
}
```

---

## Finalization

### POST /sessions/{sessionId}/finalize — Generate Final Plan

Calibrate against satellite data and produce styled output.

**Request:** (empty body)

**Response (200):**
```json
{
  "finalPlanSvg": "<svg>...styled architectural plan...</svg>",
  "calibration": {
    "scaleFactor": 0.95,
    "adjustments": [
      "Scaled all rooms by 0.95x to match satellite footprint",
      "Applied 1.5 ft roof overhang offset"
    ],
    "overallDimensions": { "width": 49.4, "height": 36.1 },
    "scaleReference": "1 inch = 8 feet"
  },
  "isFinalized": true
}
```

---

### POST /sessions/{sessionId}/finalize/revise — Revise Final Plan

**Request:**
```json
{
  "feedback": "Kitchen is about 2 feet too wide"
}
```

---

## Export

### GET /sessions/{sessionId}/export/{format} — Export Plan

**Formats:** `svg`, `dxf`, `pdf`

**Response:**
- `svg`: Returns SVG string with `Content-Type: image/svg+xml`
- `dxf`: Returns DXF file with `Content-Type: application/dxf`
- `pdf`: Returns PDF file with `Content-Type: application/pdf`

All exports include:
- Room labels
- Exterior dimensions only
- Visual scale reference
- Disclaimer text: "Plan is approximate, verify actual conditions before use"
- No furniture
- Black and white, standard architectural line weights

**Query params:**
- `?scale=quarter` — 1/4" = 1' (default for PDF)
- `?scale=eighth` — 1/8" = 1'
- `?paper=letter` — 8.5" × 11" (default)
- `?paper=tabloid` — 11" × 17"

---

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "code": "ROOM_NOT_FOUND",
    "message": "Room room_xyz789 not found in session ses_abc123",
    "details": {}
  }
}
```

**Common error codes:**

| Code | HTTP | Meaning |
|------|------|---------|
| `SESSION_NOT_FOUND` | 404 | Session doesn't exist or expired |
| `ROOM_NOT_FOUND` | 404 | Room doesn't exist in session |
| `PHOTOS_INCOMPLETE` | 400 | Not all 4 direction photos uploaded |
| `ANALYSIS_FAILED` | 500 | Claude API returned unusable results |
| `SATELLITE_UNAVAILABLE` | 503 | Could not fetch satellite imagery |
| `EXPORT_FAILED` | 500 | Export generation failed |
| `SESSION_EXPIRED` | 410 | Session past TTL |
| `RATE_LIMITED` | 429 | Too many requests (Claude API throttle) |
