import { useFloorPlanStore } from '../store/floorPlanStore';

/**
 * Convenience hook that re-exports the store with common selectors.
 * Components import this instead of the raw store.
 */
export function useFloorPlan() {
  const store = useFloorPlanStore();
  return {
    ...store,
    currentRoom: store.getCurrentRoom(),
    roomCount: store.rooms.length,
    hasRooms: store.rooms.length > 0,
  };
}
