import { create } from 'zustand';
import { generateRoomLabel } from '../constants/roomTypes';

/**
 * FloorPlan session store.
 *
 * Manages all state for a single floor plan session:
 * session metadata, room list, workflow step, and plan data.
 */
export const useFloorPlanStore = create((set, get) => ({
  // ── Session identity ──
  sessionId: null,
  address: '',
  startingCorner: null, // "NW" | "NE" | "SE" | "SW"

  // ── House bounds (from satellite, Phase 4) ──
  houseBounds: null,

  // ── Rooms ──
  rooms: [],
  currentRoomIndex: -1,

  // ── Workflow ──
  currentStep: 'address',
  isFinalized: false,

  // ── Plans ──
  mergedPlanSvg: null,
  finalPlanSvg: null,

  // ── Actions ──

  /** Set the house address and generate a local session ID */
  setAddress: (address) => {
    const sessionId = `ses_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    set({ address, sessionId });
  },

  /** Set the starting corner */
  setStartingCorner: (corner) => set({ startingCorner: corner }),

  /** Navigate to a workflow step */
  goToStep: (step) => set({ currentStep: step }),

  /** Create a new room and make it current */
  createRoom: (roomType, customLabel) => {
    const { rooms } = get();
    const id = `room_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const label = customLabel || generateRoomLabel(roomType, rooms);

    const newRoom = {
      id,
      index: rooms.length,
      type: roomType,
      label,
      photos: { north: null, east: null, south: null, west: null },
      analysis: null,
      svgData: null,
      position: { x: 0, y: 0 },
      connections: [],
      reviewStatus: 'pending',
      revisionCount: 0,
      feedback: [],
    };

    set({
      rooms: [...rooms, newRoom],
      currentRoomIndex: rooms.length,
    });

    return newRoom;
  },

  /** Update a field on the current room */
  updateCurrentRoom: (updates) =>
    set((state) => {
      if (state.currentRoomIndex < 0) return state;
      const rooms = [...state.rooms];
      rooms[state.currentRoomIndex] = {
        ...rooms[state.currentRoomIndex],
        ...updates,
      };
      return { rooms };
    }),

  /** Store a captured photo for the current room */
  setPhoto: (direction, photoData) =>
    set((state) => {
      if (state.currentRoomIndex < 0) return state;
      const rooms = [...state.rooms];
      const room = { ...rooms[state.currentRoomIndex] };
      room.photos = { ...room.photos, [direction]: photoData };
      rooms[state.currentRoomIndex] = room;
      return { rooms };
    }),

  /** Get the current room (convenience) */
  getCurrentRoom: () => {
    const { rooms, currentRoomIndex } = get();
    return currentRoomIndex >= 0 ? rooms[currentRoomIndex] : null;
  },

  /** Reset entire session */
  resetSession: () =>
    set({
      sessionId: null,
      address: '',
      startingCorner: null,
      houseBounds: null,
      rooms: [],
      currentRoomIndex: -1,
      currentStep: 'address',
      isFinalized: false,
      mergedPlanSvg: null,
      finalPlanSvg: null,
    }),
}));
