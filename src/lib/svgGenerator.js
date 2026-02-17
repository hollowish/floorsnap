/**
 * SVG floor plan generator.
 *
 * Converts a parsed RoomAnalysis object into an SVG string following
 * the structure documented in docs/03_DATA_MODELS.md.
 *
 * Coordinate system: Origin (0,0) = NW corner, X=east, Y=south.
 */

const PIXELS_PER_FOOT = 20;
const WALL_WIDTH = 4;
const MARGIN = 40;

/**
 * Map a feature's "feet from left edge when facing wall" to SVG pixel coordinates.
 *
 * When facing a wall, "left" depends on orientation:
 *   North wall: left = west  → position increases eastward along X
 *   South wall: left = east  → position increases westward (mirrored X)
 *   East wall:  left = north → position increases southward along Y
 *   West wall:  left = south → position increases northward (mirrored Y)
 */
function getFeaturePixelCoords(feature, wallName, roomWidthPx, roomHeightPx) {
  const posPx = feature.position * PIXELS_PER_FOOT;
  const widthPx = feature.width * PIXELS_PER_FOOT;

  switch (wallName) {
    case 'north': {
      // Along top edge, left-to-right = west-to-east
      const x = MARGIN + posPx;
      const y = MARGIN;
      return { x, y, x2: x + widthPx, y2: y, horizontal: true };
    }
    case 'south': {
      // Along bottom edge, left-to-right = east-to-west (mirrored)
      const x = MARGIN + roomWidthPx - posPx - widthPx;
      const y = MARGIN + roomHeightPx;
      return { x, y, x2: x + widthPx, y2: y, horizontal: true };
    }
    case 'east': {
      // Along right edge, left-to-right = north-to-south
      const x = MARGIN + roomWidthPx;
      const y = MARGIN + posPx;
      return { x, y, x2: x, y2: y + widthPx, horizontal: false };
    }
    case 'west': {
      // Along left edge, left-to-right = south-to-north (mirrored)
      const x = MARGIN;
      const y = MARGIN + roomHeightPx - posPx - widthPx;
      return { x, y, x2: x, y2: y + widthPx, horizontal: false };
    }
    default:
      return { x: 0, y: 0, x2: 0, y2: 0, horizontal: true };
  }
}

function renderWalls(roomWidthPx, roomHeightPx) {
  const ox = MARGIN;
  const oy = MARGIN;
  return `    <g class="walls">
      <line class="wall wall-north" x1="${ox}" y1="${oy}" x2="${ox + roomWidthPx}" y2="${oy}" stroke="#000" stroke-width="${WALL_WIDTH}" data-wall-type="exterior"/>
      <line class="wall wall-east" x1="${ox + roomWidthPx}" y1="${oy}" x2="${ox + roomWidthPx}" y2="${oy + roomHeightPx}" stroke="#000" stroke-width="${WALL_WIDTH}" data-wall-type="exterior"/>
      <line class="wall wall-south" x1="${ox + roomWidthPx}" y1="${oy + roomHeightPx}" x2="${ox}" y2="${oy + roomHeightPx}" stroke="#000" stroke-width="${WALL_WIDTH}" data-wall-type="exterior"/>
      <line class="wall wall-west" x1="${ox}" y1="${oy + roomHeightPx}" x2="${ox}" y2="${oy}" stroke="#000" stroke-width="${WALL_WIDTH}" data-wall-type="exterior"/>
    </g>`;
}

function renderDoor(feature, wallName, roomWidthPx, roomHeightPx) {
  const coords = getFeaturePixelCoords(feature, wallName, roomWidthPx, roomHeightPx);
  const widthPx = feature.width * PIXELS_PER_FOOT;
  const isSliding = feature.swingDirection === 'sliding' || feature.doorType === 'sliding';

  if (isSliding) {
    return renderSlidingDoor(coords, wallName, widthPx);
  }

  // Gap line (white over wall)
  let gap;
  if (coords.horizontal) {
    gap = `<line class="wall-gap" x1="${coords.x}" y1="${coords.y}" x2="${coords.x2}" y2="${coords.y2}" stroke="#fff" stroke-width="${WALL_WIDTH + 2}"/>`;
  } else {
    gap = `<line class="wall-gap" x1="${coords.x}" y1="${coords.y}" x2="${coords.x2}" y2="${coords.y2}" stroke="#fff" stroke-width="${WALL_WIDTH + 2}"/>`;
  }

  // Quarter-circle arc for swing
  const isRight = feature.swingDirection === 'right';
  let arcPath;

  switch (wallName) {
    case 'north': {
      // Arc swings inward (downward)
      const hingeX = isRight ? coords.x2 : coords.x;
      const freeX = isRight ? coords.x : coords.x2;
      const sweepFlag = isRight ? 1 : 0;
      arcPath = `<path class="door-arc" d="M ${freeX} ${coords.y} A ${widthPx} ${widthPx} 0 0 ${sweepFlag} ${hingeX} ${coords.y + widthPx}" fill="none" stroke="#000" stroke-width="1"/>`;
      break;
    }
    case 'south': {
      // Arc swings inward (upward)
      const hingeX = isRight ? coords.x : coords.x2;
      const freeX = isRight ? coords.x2 : coords.x;
      const sweepFlag = isRight ? 1 : 0;
      arcPath = `<path class="door-arc" d="M ${freeX} ${coords.y} A ${widthPx} ${widthPx} 0 0 ${sweepFlag} ${hingeX} ${coords.y - widthPx}" fill="none" stroke="#000" stroke-width="1"/>`;
      break;
    }
    case 'east': {
      // Arc swings inward (leftward)
      const hingeY = isRight ? coords.y2 : coords.y;
      const freeY = isRight ? coords.y : coords.y2;
      const sweepFlag = isRight ? 1 : 0;
      arcPath = `<path class="door-arc" d="M ${coords.x} ${freeY} A ${widthPx} ${widthPx} 0 0 ${sweepFlag} ${coords.x - widthPx} ${hingeY}" fill="none" stroke="#000" stroke-width="1"/>`;
      break;
    }
    case 'west': {
      // Arc swings inward (rightward)
      const hingeY = isRight ? coords.y : coords.y2;
      const freeY = isRight ? coords.y2 : coords.y;
      const sweepFlag = isRight ? 1 : 0;
      arcPath = `<path class="door-arc" d="M ${coords.x} ${freeY} A ${widthPx} ${widthPx} 0 0 ${sweepFlag} ${coords.x + widthPx} ${hingeY}" fill="none" stroke="#000" stroke-width="1"/>`;
      break;
    }
  }

  return `      <g class="door" data-wall="${wallName}" data-position="${feature.position}" data-width="${feature.width}">
        ${gap}
        ${arcPath}
      </g>`;
}

function renderSlidingDoor(coords, wallName, widthPx) {
  const offset = 3;
  let lines;

  if (coords.horizontal) {
    lines = `<line x1="${coords.x}" y1="${coords.y - offset}" x2="${coords.x2}" y2="${coords.y2 - offset}" stroke="#000" stroke-width="1.5"/>
        <line x1="${coords.x}" y1="${coords.y + offset}" x2="${coords.x2}" y2="${coords.y2 + offset}" stroke="#000" stroke-width="1.5"/>`;
  } else {
    lines = `<line x1="${coords.x - offset}" y1="${coords.y}" x2="${coords.x2 - offset}" y2="${coords.y2}" stroke="#000" stroke-width="1.5"/>
        <line x1="${coords.x + offset}" y1="${coords.y}" x2="${coords.x2 + offset}" y2="${coords.y2}" stroke="#000" stroke-width="1.5"/>`;
  }

  return `      <g class="door sliding-door" data-wall="${wallName}">
        <line class="wall-gap" x1="${coords.x}" y1="${coords.y}" x2="${coords.x2}" y2="${coords.y2}" stroke="#fff" stroke-width="${WALL_WIDTH + 2}"/>
        ${lines}
      </g>`;
}

function renderWindow(feature, wallName, roomWidthPx, roomHeightPx) {
  const coords = getFeaturePixelCoords(feature, wallName, roomWidthPx, roomHeightPx);
  const paneOffset = 3; // offset perpendicular to wall for pane lines

  // Gap line + 3 parallel pane lines
  let gap, panes;

  if (coords.horizontal) {
    gap = `<line class="wall-gap" x1="${coords.x}" y1="${coords.y}" x2="${coords.x2}" y2="${coords.y2}" stroke="#fff" stroke-width="${WALL_WIDTH + 2}"/>`;
    panes = [-paneOffset, 0, paneOffset]
      .map(
        (off) =>
          `<line x1="${coords.x}" y1="${coords.y + off}" x2="${coords.x2}" y2="${coords.y2 + off}" stroke="#000" stroke-width="1"/>`
      )
      .join('\n        ');
  } else {
    gap = `<line class="wall-gap" x1="${coords.x}" y1="${coords.y}" x2="${coords.x2}" y2="${coords.y2}" stroke="#fff" stroke-width="${WALL_WIDTH + 2}"/>`;
    panes = [-paneOffset, 0, paneOffset]
      .map(
        (off) =>
          `<line x1="${coords.x + off}" y1="${coords.y}" x2="${coords.x2 + off}" y2="${coords.y2}" stroke="#000" stroke-width="1"/>`
      )
      .join('\n        ');
  }

  return `      <g class="window" data-wall="${wallName}" data-position="${feature.position}" data-width="${feature.width}">
        ${gap}
        ${panes}
      </g>`;
}

function renderCloset(feature, wallName, roomWidthPx, roomHeightPx) {
  const coords = getFeaturePixelCoords(feature, wallName, roomWidthPx, roomHeightPx);
  const depthPx = (feature.depth || 2) * PIXELS_PER_FOOT;
  const widthPx = feature.width * PIXELS_PER_FOOT;

  let rect;
  switch (wallName) {
    case 'north':
      rect = `<rect x="${coords.x}" y="${MARGIN}" width="${widthPx}" height="${depthPx}"`;
      break;
    case 'south':
      rect = `<rect x="${coords.x}" y="${MARGIN + roomHeightPx - depthPx}" width="${widthPx}" height="${depthPx}"`;
      break;
    case 'east':
      rect = `<rect x="${MARGIN + roomWidthPx - depthPx}" y="${coords.y}" width="${depthPx}" height="${widthPx}"`;
      break;
    case 'west':
      rect = `<rect x="${MARGIN}" y="${coords.y}" width="${depthPx}" height="${widthPx}"`;
      break;
  }

  // Render sliding door on the closet if applicable
  const isSliding = feature.doorType === 'sliding';
  let slidingDoorSvg = '';
  if (isSliding) {
    slidingDoorSvg = '\n' + renderSlidingDoor(coords, wallName, widthPx);
  }

  return `      <g class="closet" data-wall="${wallName}">
        ${rect} stroke="#000" stroke-width="1" stroke-dasharray="4,2" fill="none"/>
        <line class="wall-gap" x1="${coords.x}" y1="${coords.y}" x2="${coords.x2}" y2="${coords.y2}" stroke="#fff" stroke-width="${WALL_WIDTH + 2}"/>${slidingDoorSvg}
      </g>`;
}

function renderLabel(roomLabel, roomWidthPx, roomHeightPx) {
  const cx = MARGIN + roomWidthPx / 2;
  const cy = MARGIN + roomHeightPx / 2;
  return `    <text class="room-label" x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" font-family="Arial, sans-serif" font-size="12" fill="#333">${roomLabel}</text>`;
}

function renderDimensions(widthFt, heightFt, roomWidthPx, roomHeightPx) {
  // Width label below south wall
  const widthX = MARGIN + roomWidthPx / 2;
  const widthY = MARGIN + roomHeightPx + 20;

  // Height label right of east wall (rotated 90°)
  const heightX = MARGIN + roomWidthPx + 20;
  const heightY = MARGIN + roomHeightPx / 2;

  return `    <g class="dimensions" visibility="visible">
      <text x="${widthX}" y="${widthY}" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#666">${widthFt}'</text>
      <text x="${heightX}" y="${heightY}" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#666" transform="rotate(90, ${heightX}, ${heightY})">${heightFt}'</text>
    </g>`;
}

/**
 * Generate an SVG string from a parsed RoomAnalysis object.
 *
 * @param {object} analysis - Parsed RoomAnalysis (camelCase)
 * @param {string} roomLabel - Display label (e.g. "Bedroom#1")
 * @param {string} roomId - Unique room ID
 * @returns {string} Complete SVG string
 */
export function generateRoomSVG(analysis, roomLabel, roomId) {
  const { dimensions, walls } = analysis;
  const roomWidthPx = dimensions.width * PIXELS_PER_FOOT;
  const roomHeightPx = dimensions.height * PIXELS_PER_FOOT;
  const viewBoxW = roomWidthPx + MARGIN * 2;
  const viewBoxH = roomHeightPx + MARGIN * 2;

  // Collect feature SVG by type
  const doorsSvg = [];
  const windowsSvg = [];
  const closetsSvg = [];

  for (const [wallName, features] of Object.entries(walls)) {
    for (const feature of features) {
      switch (feature.type) {
        case 'door':
          doorsSvg.push(renderDoor(feature, wallName, roomWidthPx, roomHeightPx));
          break;
        case 'window':
          windowsSvg.push(renderWindow(feature, wallName, roomWidthPx, roomHeightPx));
          break;
        case 'closet':
        case 'closet-door':
          closetsSvg.push(renderCloset(feature, wallName, roomWidthPx, roomHeightPx));
          break;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBoxW} ${viewBoxH}" data-room-id="${roomId}" data-room-label="${roomLabel}" data-scale="${PIXELS_PER_FOOT}">
  <g class="room" data-room-id="${roomId}">
${renderWalls(roomWidthPx, roomHeightPx)}
    <g class="doors">
${doorsSvg.length ? doorsSvg.join('\n') : ''}
    </g>
    <g class="windows">
${windowsSvg.length ? windowsSvg.join('\n') : ''}
    </g>
    <g class="closets">
${closetsSvg.length ? closetsSvg.join('\n') : ''}
    </g>
${renderLabel(roomLabel, roomWidthPx, roomHeightPx)}
${renderDimensions(dimensions.width, dimensions.height, roomWidthPx, roomHeightPx)}
  </g>
</svg>`;
}
