/**
 * Mock Claude API analysis response and parser.
 *
 * Provides realistic hardcoded data for development/testing.
 * `analyzeRoom` is designed as a drop-in replacement point for real API calls.
 */

// Hardcoded Claude API response format (snake_case) — realistic bedroom
export const MOCK_ROOM_ANALYSIS = {
  dimensions: {
    width_ft: 12.0,
    height_ft: 14.0,
    confidence: 0.7,
  },
  ceiling_height_ft: 8.0,
  walls: {
    north: [
      {
        type: 'window',
        position_ft: 4.0,
        width_ft: 4.0,
        height_ft: 4.0,
        distance_from_floor_ft: 3.0,
        notes: 'Double-hung window with blinds',
      },
    ],
    east: [
      {
        type: 'closet',
        position_ft: 3.0,
        width_ft: 6.0,
        depth_ft: 2.0,
        door_type: 'sliding',
        notes: 'Sliding door closet, reach-in style',
      },
    ],
    south: [
      {
        type: 'door',
        position_ft: 8.0,
        width_ft: 2.67,
        height_ft: 6.67,
        swing_direction: 'right',
        opens_to: 'hallway',
        notes: 'Standard interior door, swings into hallway',
      },
    ],
    west: [
      {
        type: 'window',
        position_ft: 4.0,
        width_ft: 3.5,
        height_ft: 3.5,
        distance_from_floor_ft: 3.0,
        notes: 'Single window with curtains',
      },
    ],
  },
  reference_object: {
    type: 'door',
    wall: 'south',
    known_height_inches: 80,
    notes: 'Used standard door height for scale calibration',
  },
  shape: 'rectangle',
  notes: 'Standard rectangular bedroom. Carpet flooring. One overhead light fixture centered.',
};

/**
 * Convert snake_case Claude API response → camelCase RoomAnalysis store schema.
 */
export function parseAnalysisResponse(rawJson) {
  const raw = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;

  function parseFeature(f) {
    return {
      type: f.type,
      position: f.position_ft ?? 0,
      width: f.width_ft ?? 0,
      height: f.height_ft ?? 0,
      distanceFromFloor: f.distance_from_floor_ft ?? 0,
      opensTo: f.opens_to ?? null,
      swingDirection: f.swing_direction ?? null,
      doorType: f.door_type ?? null,
      depth: f.depth_ft ?? null,
      notes: f.notes ?? '',
    };
  }

  function parseWall(features) {
    return (features || []).map(parseFeature);
  }

  return {
    dimensions: {
      width: raw.dimensions.width_ft,
      height: raw.dimensions.height_ft,
      confidence: raw.dimensions.confidence,
    },
    ceilingHeight: raw.ceiling_height_ft,
    walls: {
      north: parseWall(raw.walls.north),
      east: parseWall(raw.walls.east),
      south: parseWall(raw.walls.south),
      west: parseWall(raw.walls.west),
    },
    referenceObject: raw.reference_object
      ? {
          type: raw.reference_object.type,
          knownSize: raw.reference_object.known_height_inches,
          detectedSize: null,
          scaleFactor: null,
        }
      : null,
    rawResponse: JSON.stringify(raw),
  };
}

const PROGRESS_STAGES = [
  { name: 'uploading', delay: 400 },
  { name: 'dimensions', delay: 800 },
  { name: 'features', delay: 700 },
  { name: 'generating', delay: 600 },
];

/**
 * Simulate Claude room analysis with progress callbacks.
 *
 * @param {object} room - Current room from store (has photos, type, label)
 * @param {function} [onProgress] - Called with (stageName, stageIndex) as each stage completes
 * @returns {Promise<object>} Parsed RoomAnalysis in camelCase store format
 */
export async function analyzeRoom(room, onProgress) {
  for (let i = 0; i < PROGRESS_STAGES.length; i++) {
    const stage = PROGRESS_STAGES[i];
    onProgress?.(stage.name, i);
    await new Promise((resolve) => setTimeout(resolve, stage.delay));
  }

  return parseAnalysisResponse(MOCK_ROOM_ANALYSIS);
}
