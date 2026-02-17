/**
 * Room type definitions used throughout the app.
 * Each type has an id, display label, and icon (emoji for now — swap for SVG icons later).
 */
export const ROOM_TYPES = [
  { id: 'bedroom', label: 'Bedroom', icon: '🛏️' },
  { id: 'bathroom', label: 'Bathroom', icon: '🚿' },
  { id: 'kitchen', label: 'Kitchen', icon: '🍳' },
  { id: 'living-room', label: 'Living Room', icon: '🛋️' },
  { id: 'dining-room', label: 'Dining Room', icon: '🍽️' },
  { id: 'family-room', label: 'Family Room', icon: '📺' },
  { id: 'office', label: 'Office', icon: '💻' },
  { id: 'utility-room', label: 'Utility', icon: '⚙️' },
  { id: 'laundry', label: 'Laundry', icon: '👕' },
  { id: 'garage', label: 'Garage', icon: '🚗' },
  { id: 'hallway', label: 'Hallway', icon: '↔️' },
  { id: 'storage', label: 'Storage', icon: '📦' },
  { id: 'closet', label: 'Closet', icon: '🚪' },
  { id: 'other', label: 'Other', icon: '✏️' },
];

/**
 * Generate a room label like "Bedroom#1", "Bedroom#2"
 * based on how many rooms of that type already exist.
 */
export function generateRoomLabel(roomType, existingRooms) {
  const typeInfo = ROOM_TYPES.find((t) => t.id === roomType);
  const label = typeInfo ? typeInfo.label : 'Room';
  const count = existingRooms.filter((r) => r.type === roomType).length + 1;
  return `${label}#${count}`;
}
