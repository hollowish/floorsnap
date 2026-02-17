# 02 — System Architecture

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser/PWA)                       │
│                                                                    │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌────────────────┐  │
│  │  Wizard   │  │  Camera  │  │   Plan    │  │  Annotation    │  │
│  │  Flow     │  │  Capture │  │  Renderer │  │  Overlay       │  │
│  │  Manager  │  │  + Comp. │  │  (SVG)    │  │  (fabric.js)   │  │
│  └────┬─────┘  └────┬─────┘  └─────┬─────┘  └──────┬─────────┘  │
│       │              │              │                │             │
│       └──────────────┴──────────────┴────────────────┘             │
│                              │                                     │
│                    ┌─────────┴─────────┐                          │
│                    │   Zustand Store    │                          │
│                    │   (Session State)  │                          │
│                    └─────────┬─────────┘                          │
│                              │                                     │
└──────────────────────────────┼─────────────────────────────────────┘
                               │ HTTPS
                    ┌──────────┴──────────┐
                    │   API Gateway        │
                    │   /api/floorplan/*   │
                    └──────────┬──────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                     │
   ┌──────┴──────┐   ┌────────┴────────┐   ┌───────┴───────┐
   │   Session   │   │   Room Analysis │   │   Export      │
   │   Lambda    │   │   Lambda        │   │   Lambda      │
   │             │   │                 │   │               │
   │ CRUD for    │   │ Orchestrates:   │   │ SVG → DXF    │
   │ sessions,   │   │ - Photo upload  │   │ SVG → PDF    │
   │ rooms,      │   │ - Claude vision │   │               │
   │ progress    │   │ - SVG generation│   │               │
   └──────┬──────┘   └────────┬────────┘   └───────┬───────┘
          │                    │                     │
          │           ┌────────┴────────┐            │
          │           │   Claude API    │            │
          │           │   (Anthropic)   │            │
          │           └─────────────────┘            │
          │                                          │
   ┌──────┴──────────────────────────────────────────┴──────┐
   │                    AWS Services                         │
   │                                                         │
   │  ┌───────────┐  ┌──────────────┐  ┌─────────────────┐ │
   │  │    S3     │  │  DynamoDB    │  │  CloudFront     │ │
   │  │           │  │              │  │                 │ │
   │  │ /photos/  │  │ Sessions     │  │ Static assets   │ │
   │  │ /exports/ │  │ Rooms        │  │ (React app)     │ │
   │  │ /temp/    │  │ Plans        │  │                 │ │
   │  └───────────┘  └──────────────┘  └─────────────────┘ │
   └─────────────────────────────────────────────────────────┘
```

---

## Data Flow: Room Capture Sequence

```
1. User selects room type
   Client → POST /api/floorplan/rooms { sessionId, roomType }
   ← { roomId, label: "Bedroom#1" }

2. User takes 4 photos
   For each photo:
     Client compresses image (max 1200px wide, 80% JPEG quality)
     Client reads compass heading from DeviceOrientation API
     Client → PUT /api/floorplan/rooms/{roomId}/photos/{direction}
       Body: { image: base64, compassHeading: 187.3 }
     Lambda → S3: store photo
     ← { photoUrl, direction, heading }

3. All 4 photos captured → trigger analysis
   Client → POST /api/floorplan/rooms/{roomId}/analyze
   Lambda → Claude Vision API:
     - Sends all 4 photos + compass data + room type
     - Claude returns JSON: dimensions, features, confidence scores
   Lambda → SVG Generator:
     - Converts Claude's JSON to SVG room plan
   Lambda → DynamoDB: save room data + SVG
   ← { roomData, svgString, analysisConfidence }

4. User reviews SVG in Plan Renderer
   If corrections needed:
     Client → POST /api/floorplan/rooms/{roomId}/revise
       Body: { feedback: "window missing on north wall", annotationImage: base64 }
     Lambda → Claude API (text + annotated image):
       - Sends original photos, current SVG, feedback, annotation
       - Claude returns updated JSON
     Lambda → regenerate SVG
     ← { updatedRoomData, updatedSvg }

5. User accepts room
   Client → PATCH /api/floorplan/rooms/{roomId} { status: "accepted" }

6. Room merged into floor plan
   Client → POST /api/floorplan/sessions/{sessionId}/merge
     Body: { newRoomId, adjacentRoomId, direction, connectionType }
   Lambda → Merge Algorithm:
     - Reconcile shared walls
     - Position new room relative to existing
     - Generate combined SVG
   ← { mergedSvg, mergedPlanData }
```

---

## Data Flow: Satellite Calibration

```
1. User enters address
   Client → POST /api/floorplan/sessions { address }

2. Lambda → Google Maps Static API or Mapbox
   - Fetch satellite image at known zoom/scale
   - Optionally fetch parcel data if available
   - Optionally fetch Street View imagery

3. Lambda → Claude Vision API
   - Send satellite image + scale info
   - "Estimate the building footprint dimensions and shape"
   - Claude returns: { width, height, shape, roofOverhang, confidence }

4. Store as session.houseBounds
   ← { sessionId, houseBounds, satelliteImageUrl }

5. At finalization:
   Lambda → Calibration Algorithm
   - Compare sum of room dimensions to houseBounds
   - Apply proportional scaling
   - Account for roof overhang (region-dependent)
   - Generate final calibrated plan
```

---

## AWS Resource Layout

### S3 Bucket: `{app-name}-floorplan`

```
floorplan-sessions/
  {sessionId}/
    photos/
      {roomId}/
        north.jpg
        east.jpg
        south.jpg
        west.jpg
    satellite/
      aerial.jpg
      streetview.jpg
    plans/
      room_{roomId}.svg
      merged_plan.svg
      final_plan.svg
    exports/
      final_plan.dxf
      final_plan.pdf
    annotations/
      {roomId}_{revision}.png
```

### DynamoDB Table: `floorplan-sessions`

```
Partition Key: sessionId (String)
Sort Key: recordType (String)  — "SESSION", "ROOM#{roomId}", "PLAN"

GSI: userId-index
  Partition Key: userId
  Sort Key: createdAt
```

### Lambda Functions

| Function | Runtime | Memory | Timeout | Trigger |
|----------|---------|--------|---------|---------|
| `floorplan-session` | Node.js 20 | 256MB | 10s | API Gateway |
| `floorplan-room-analyze` | Node.js 20 | 512MB | 60s | API Gateway |
| `floorplan-room-revise` | Node.js 20 | 512MB | 60s | API Gateway |
| `floorplan-merge` | Node.js 20 | 512MB | 30s | API Gateway |
| `floorplan-calibrate` | Node.js 20 | 512MB | 30s | API Gateway |
| `floorplan-export-dxf` | Python 3.12 | 512MB | 30s | API Gateway |
| `floorplan-export-pdf` | Node.js 20 | 1024MB | 30s | API Gateway |

### API Gateway

All routes under `/api/floorplan/` with JWT authorization from parent app.

---

## Security Considerations

- Photos are stored with session-scoped S3 keys; pre-signed URLs for upload/download
- Session data tied to authenticated userId
- Photos auto-deleted 30 days after session completion (S3 lifecycle rule)
- Claude API key stored in AWS Secrets Manager, accessed by Lambda at runtime
- Google Maps API key restricted to server-side IPs only
- No PII stored beyond address (used only for satellite lookup)

---

## Cost Estimation (Per Floor Plan)

| Resource | Usage | Est. Cost |
|----------|-------|-----------|
| Claude Vision API | ~4-8 calls (rooms) + 1-3 revisions + 1 satellite | ~$0.50-2.00 |
| S3 Storage | ~20-40 photos @ 200KB each = ~8MB | ~$0.001 |
| Lambda Compute | ~15-25 invocations @ avg 5s | ~$0.01 |
| Google Maps API | 1 satellite + 1 street view | ~$0.02 |
| DynamoDB | ~10-20 writes, ~20-40 reads | ~$0.001 |
| **Total per plan** | | **~$0.50-2.10** |

Primary cost driver is Claude API calls. Minimizing revision cycles (through better prompts and reference objects) directly reduces cost.

---

## Offline / Resilience Considerations

The app should handle intermittent connectivity gracefully:

1. **Photo capture is fully offline** — photos stored in browser memory/IndexedDB
2. **Upload retries** — exponential backoff on failed photo uploads
3. **Session recovery** — if browser closes, user can resume from last saved state in DynamoDB
4. **Optimistic UI** — show room in plan immediately with "analyzing..." overlay, don't block
5. **Service worker** — cache the app shell for instant reload (PWA)
