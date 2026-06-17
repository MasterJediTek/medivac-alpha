/**
 * Multi-Floor Map Service
 * Manages floor selection and building filtering by floor level.
 */

export interface FloorLevel {
  id: string;
  label: string;
  shortLabel: string;
  order: number;
  buildingCount: number;
  description: string;
}

export interface FloorBuilding {
  id: string;
  name: string;
  floor: string;
  floorId: string;
}

type FloorChangeCallback = (floorId: string) => void;

const FLOOR_DEFINITIONS: FloorLevel[] = [
  {
    id: 'all',
    label: 'All Floors',
    shortLabel: 'All',
    order: 0,
    buildingCount: 0,
    description: 'View all departments across all floors',
  },
  {
    id: 'ground',
    label: 'Ground Floor',
    shortLabel: 'G',
    order: 1,
    buildingCount: 0,
    description: 'Main entrance, emergency, pharmacy, reception',
  },
  {
    id: 'level1',
    label: 'Level 1',
    shortLabel: 'L1',
    order: 2,
    buildingCount: 0,
    description: 'Maternity, paediatrics, surgical ward',
  },
  {
    id: 'level2',
    label: 'Level 2',
    shortLabel: 'L2',
    order: 3,
    buildingCount: 0,
    description: 'ICU, operating theatres, specialist clinics',
  },
];

// Map building floor strings to floor IDs
const FLOOR_MAPPING: Record<string, string> = {
  'Ground': 'ground',
  'Ground Floor': 'ground',
  'Level 1': 'level1',
  'Level 2': 'level2',
  'Level 3': 'level2', // Group with L2 if any
  'Basement': 'ground',
};

export class FloorMapService {
  private static instance: FloorMapService | null = null;
  private currentFloorId: string = 'all';
  private floors: FloorLevel[] = [...FLOOR_DEFINITIONS];
  private buildingFloorMap: Map<string, string> = new Map();
  private callbacks: Set<FloorChangeCallback> = new Set();

  private constructor() {}

  static getInstance(): FloorMapService {
    if (!FloorMapService.instance) {
      FloorMapService.instance = new FloorMapService();
    }
    return FloorMapService.instance;
  }

  static resetInstance(): void {
    if (FloorMapService.instance) {
      FloorMapService.instance.callbacks.clear();
      FloorMapService.instance.buildingFloorMap.clear();
    }
    FloorMapService.instance = null;
  }

  // ── Initialize with building data ────────────────────────────────────
  initializeBuildings(buildings: Array<{ id: string; name: string; floor: string }>): void {
    this.buildingFloorMap.clear();
    const floorCounts: Record<string, number> = {};

    buildings.forEach(b => {
      const floorId = this.mapFloorToId(b.floor);
      this.buildingFloorMap.set(b.id, floorId);
      floorCounts[floorId] = (floorCounts[floorId] || 0) + 1;
    });

    // Update floor building counts
    this.floors = this.floors.map(f => ({
      ...f,
      buildingCount: f.id === 'all' ? buildings.length : (floorCounts[f.id] || 0),
    }));
  }

  private mapFloorToId(floorStr: string): string {
    return FLOOR_MAPPING[floorStr] || 'ground';
  }

  // ── Floor selection ──────────────────────────────────────────────────
  selectFloor(floorId: string): void {
    if (this.currentFloorId === floorId) return;
    const floor = this.floors.find(f => f.id === floorId);
    if (!floor) return;
    this.currentFloorId = floorId;
    this.callbacks.forEach(cb => cb(floorId));
  }

  getCurrentFloor(): string {
    return this.currentFloorId;
  }

  getCurrentFloorLevel(): FloorLevel | undefined {
    return this.floors.find(f => f.id === this.currentFloorId);
  }

  getFloors(): FloorLevel[] {
    return [...this.floors];
  }

  getFloorsWithBuildings(): FloorLevel[] {
    return this.floors.filter(f => f.id === 'all' || f.buildingCount > 0);
  }

  // ── Filtering ────────────────────────────────────────────────────────
  filterBuildingsByFloor<T extends { id: string }>(buildings: T[]): T[] {
    if (this.currentFloorId === 'all') return buildings;
    return buildings.filter(b => {
      const floorId = this.buildingFloorMap.get(b.id);
      return floorId === this.currentFloorId;
    });
  }

  getBuildingFloor(buildingId: string): string {
    return this.buildingFloorMap.get(buildingId) || 'ground';
  }

  getBuildingCountForFloor(floorId: string): number {
    if (floorId === 'all') return this.buildingFloorMap.size;
    let count = 0;
    this.buildingFloorMap.forEach(fId => {
      if (fId === floorId) count++;
    });
    return count;
  }

  // ── Listeners ────────────────────────────────────────────────────────
  onFloorChange(callback: FloorChangeCallback): () => void {
    this.callbacks.add(callback);
    return () => { this.callbacks.delete(callback); };
  }

  // ── Helpers ──────────────────────────────────────────────────────────
  getFloorLabel(floorId: string): string {
    const floor = this.floors.find(f => f.id === floorId);
    return floor?.label || 'Unknown Floor';
  }

  getFloorDescription(floorId: string): string {
    const floor = this.floors.find(f => f.id === floorId);
    return floor?.description || '';
  }

  getFloorColor(floorId: string): string {
    const colors: Record<string, string> = {
      all: '#6366F1',
      ground: '#22C55E',
      level1: '#3B82F6',
      level2: '#F59E0B',
    };
    return colors[floorId] || '#6366F1';
  }
}
