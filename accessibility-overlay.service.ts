/**
 * Accessibility Overlay Service - v9.21
 * Provides floor-specific accessibility data for the hospital map,
 * including wheelchair ramps, elevators, accessible restrooms,
 * and accessible route suggestions.
 */

export type AccessibilityFeatureType = 'elevator' | 'ramp' | 'restroom' | 'parking' | 'entrance' | 'assistance';

export interface AccessibilityFeature {
  id: string;
  type: AccessibilityFeatureType;
  name: string;
  floor: string; // 'ground' | 'level1' | 'level2' | 'all'
  x: number; // position on map (0-100 percent)
  y: number;
  description: string;
  isOperational: boolean;
  nearestBuildings: string[]; // building IDs
}

export interface AccessibilityRoute {
  id: string;
  fromBuildingId: string;
  toBuildingId: string;
  isAccessible: boolean;
  features: string[]; // feature IDs used in route
  distanceMeters: number;
  estimatedMinutes: number;
  instructions: string[];
}

export interface FloorAccessibilitySummary {
  floorId: string;
  floorLabel: string;
  elevatorCount: number;
  rampCount: number;
  restroomCount: number;
  parkingCount: number;
  entranceCount: number;
  assistanceCount: number;
  totalFeatures: number;
  operationalPercentage: number;
}

type OverlayChangeCallback = (features: AccessibilityFeature[]) => void;

const FEATURE_ICONS: Record<AccessibilityFeatureType, string> = {
  elevator: '🛗',
  ramp: '♿',
  restroom: '🚻',
  parking: '🅿️',
  entrance: '🚪',
  assistance: '🔔',
};

const FEATURE_COLORS: Record<AccessibilityFeatureType, string> = {
  elevator: '#3B82F6',
  ramp: '#22C55E',
  restroom: '#8B5CF6',
  parking: '#F59E0B',
  entrance: '#06B6D4',
  assistance: '#EF4444',
};

const FEATURE_LABELS: Record<AccessibilityFeatureType, string> = {
  elevator: 'Elevator',
  ramp: 'Wheelchair Ramp',
  restroom: 'Accessible Restroom',
  parking: 'Accessible Parking',
  entrance: 'Accessible Entrance',
  assistance: 'Assistance Point',
};

export class AccessibilityOverlayService {
  private static instance: AccessibilityOverlayService | null = null;
  private features: AccessibilityFeature[] = [];
  private isOverlayVisible: boolean = false;
  private selectedTypes: Set<AccessibilityFeatureType> = new Set(['elevator', 'ramp', 'restroom', 'parking', 'entrance', 'assistance']);
  private listeners: OverlayChangeCallback[] = [];

  private constructor() {
    this.initializeFeatures();
  }

  static getInstance(): AccessibilityOverlayService {
    if (!AccessibilityOverlayService.instance) {
      AccessibilityOverlayService.instance = new AccessibilityOverlayService();
    }
    return AccessibilityOverlayService.instance;
  }

  static resetInstance(): void {
    AccessibilityOverlayService.instance = null;
  }

  private initializeFeatures(): void {
    this.features = [
      // Ground Floor
      { id: 'elev-main-g', type: 'elevator', name: 'Main Elevator A', floor: 'ground', x: 50, y: 45, description: 'Main elevator serving all floors. Braille buttons, audio announcements.', isOperational: true, nearestBuildings: ['main-entrance', 'reception'] },
      { id: 'elev-east-g', type: 'elevator', name: 'East Wing Elevator', floor: 'ground', x: 75, y: 40, description: 'East wing elevator near Emergency. Stretcher-capable.', isOperational: true, nearestBuildings: ['emergency', 'radiology'] },
      { id: 'elev-west-g', type: 'elevator', name: 'West Wing Elevator', floor: 'ground', x: 25, y: 50, description: 'West wing elevator near Pharmacy.', isOperational: true, nearestBuildings: ['pharmacy', 'pathology'] },
      { id: 'ramp-main', type: 'ramp', name: 'Main Entrance Ramp', floor: 'ground', x: 48, y: 85, description: 'Gentle gradient ramp with handrails at main entrance.', isOperational: true, nearestBuildings: ['main-entrance'] },
      { id: 'ramp-emergency', type: 'ramp', name: 'Emergency Ramp', floor: 'ground', x: 80, y: 55, description: 'Wide ramp for ambulance bay access.', isOperational: true, nearestBuildings: ['emergency'] },
      { id: 'ramp-garden', type: 'ramp', name: 'Garden Courtyard Ramp', floor: 'ground', x: 35, y: 65, description: 'Ramp access to healing garden area.', isOperational: true, nearestBuildings: ['cafeteria'] },
      { id: 'rest-main-g', type: 'restroom', name: 'Main Lobby Restroom', floor: 'ground', x: 52, y: 55, description: 'Accessible restroom with grab bars, lowered sink, emergency pull cord.', isOperational: true, nearestBuildings: ['reception', 'main-entrance'] },
      { id: 'rest-emerg-g', type: 'restroom', name: 'Emergency Restroom', floor: 'ground', x: 78, y: 48, description: 'Accessible restroom in Emergency waiting area.', isOperational: true, nearestBuildings: ['emergency'] },
      { id: 'rest-cafe-g', type: 'restroom', name: 'Cafeteria Restroom', floor: 'ground', x: 30, y: 60, description: 'Accessible restroom near cafeteria.', isOperational: true, nearestBuildings: ['cafeteria'] },
      { id: 'park-main', type: 'parking', name: 'Main Accessible Parking', floor: 'ground', x: 45, y: 92, description: '8 designated accessible parking bays near main entrance.', isOperational: true, nearestBuildings: ['main-entrance'] },
      { id: 'park-emerg', type: 'parking', name: 'Emergency Parking', floor: 'ground', x: 85, y: 70, description: '4 accessible parking bays near Emergency entrance.', isOperational: true, nearestBuildings: ['emergency'] },
      { id: 'entr-main', type: 'entrance', name: 'Main Accessible Entrance', floor: 'ground', x: 50, y: 88, description: 'Automatic sliding doors, level access, tactile ground indicators.', isOperational: true, nearestBuildings: ['main-entrance'] },
      { id: 'entr-emerg', type: 'entrance', name: 'Emergency Entrance', floor: 'ground', x: 82, y: 60, description: 'Wide automatic doors for stretcher and wheelchair access.', isOperational: true, nearestBuildings: ['emergency'] },
      { id: 'entr-west', type: 'entrance', name: 'West Wing Entrance', floor: 'ground', x: 15, y: 50, description: 'Accessible entrance with push-button door opener.', isOperational: true, nearestBuildings: ['pharmacy'] },
      { id: 'assist-reception', type: 'assistance', name: 'Reception Assistance', floor: 'ground', x: 50, y: 50, description: 'Staff assistance available. Hearing loop installed.', isOperational: true, nearestBuildings: ['reception'] },
      { id: 'assist-emerg', type: 'assistance', name: 'Emergency Assistance', floor: 'ground', x: 76, y: 42, description: 'Triage assistance with wheelchair provision.', isOperational: true, nearestBuildings: ['emergency'] },

      // Level 1
      { id: 'elev-main-1', type: 'elevator', name: 'Main Elevator A - L1', floor: 'level1', x: 50, y: 45, description: 'Main elevator Level 1 access.', isOperational: true, nearestBuildings: ['maternity', 'paediatrics'] },
      { id: 'elev-east-1', type: 'elevator', name: 'East Wing Elevator - L1', floor: 'level1', x: 75, y: 40, description: 'East wing elevator Level 1.', isOperational: true, nearestBuildings: ['surgical'] },
      { id: 'rest-mat-1', type: 'restroom', name: 'Maternity Restroom', floor: 'level1', x: 40, y: 35, description: 'Accessible family restroom with baby change.', isOperational: true, nearestBuildings: ['maternity'] },
      { id: 'rest-surg-1', type: 'restroom', name: 'Surgical Ward Restroom', floor: 'level1', x: 70, y: 45, description: 'Accessible restroom with shower.', isOperational: true, nearestBuildings: ['surgical'] },
      { id: 'assist-nurses-1', type: 'assistance', name: 'Level 1 Nurse Station', floor: 'level1', x: 55, y: 40, description: 'Nurse assistance station with call button.', isOperational: true, nearestBuildings: ['maternity', 'paediatrics'] },
      { id: 'ramp-corridor-1', type: 'ramp', name: 'Corridor Ramp L1', floor: 'level1', x: 60, y: 50, description: 'Gradual ramp connecting east and west wings.', isOperational: true, nearestBuildings: ['surgical'] },

      // Level 2
      { id: 'elev-main-2', type: 'elevator', name: 'Main Elevator A - L2', floor: 'level2', x: 50, y: 45, description: 'Main elevator Level 2 access.', isOperational: true, nearestBuildings: ['icu', 'admin'] },
      { id: 'elev-east-2', type: 'elevator', name: 'East Wing Elevator - L2', floor: 'level2', x: 75, y: 40, description: 'East wing elevator Level 2.', isOperational: false, nearestBuildings: ['icu'] },
      { id: 'rest-icu-2', type: 'restroom', name: 'ICU Visitor Restroom', floor: 'level2', x: 72, y: 35, description: 'Accessible restroom for ICU visitors.', isOperational: true, nearestBuildings: ['icu'] },
      { id: 'rest-admin-2', type: 'restroom', name: 'Admin Restroom', floor: 'level2', x: 35, y: 50, description: 'Accessible restroom near admin offices.', isOperational: true, nearestBuildings: ['admin'] },
      { id: 'assist-icu-2', type: 'assistance', name: 'ICU Assistance Desk', floor: 'level2', x: 70, y: 42, description: 'ICU visitor assistance and information.', isOperational: true, nearestBuildings: ['icu'] },
    ];
  }

  // ── Overlay Visibility ──────────────────────────────────────────────
  toggleOverlay(): boolean {
    this.isOverlayVisible = !this.isOverlayVisible;
    this.notifyListeners();
    return this.isOverlayVisible;
  }

  setOverlayVisible(visible: boolean): void {
    if (this.isOverlayVisible !== visible) {
      this.isOverlayVisible = visible;
      this.notifyListeners();
    }
  }

  getOverlayVisible(): boolean {
    return this.isOverlayVisible;
  }

  // ── Type Filtering ──────────────────────────────────────────────────
  toggleType(type: AccessibilityFeatureType): void {
    if (this.selectedTypes.has(type)) {
      this.selectedTypes.delete(type);
    } else {
      this.selectedTypes.add(type);
    }
    this.notifyListeners();
  }

  setSelectedTypes(types: AccessibilityFeatureType[]): void {
    this.selectedTypes = new Set(types);
    this.notifyListeners();
  }

  getSelectedTypes(): AccessibilityFeatureType[] {
    return Array.from(this.selectedTypes);
  }

  isTypeSelected(type: AccessibilityFeatureType): boolean {
    return this.selectedTypes.has(type);
  }

  selectAllTypes(): void {
    this.selectedTypes = new Set(['elevator', 'ramp', 'restroom', 'parking', 'entrance', 'assistance']);
    this.notifyListeners();
  }

  deselectAllTypes(): void {
    this.selectedTypes.clear();
    this.notifyListeners();
  }

  // ── Feature Queries ─────────────────────────────────────────────────
  getAllFeatures(): AccessibilityFeature[] {
    return [...this.features];
  }

  getFeaturesForFloor(floorId: string): AccessibilityFeature[] {
    if (floorId === 'all') return [...this.features];
    return this.features.filter(f => f.floor === floorId);
  }

  getFilteredFeatures(floorId: string): AccessibilityFeature[] {
    let filtered = floorId === 'all' ? [...this.features] : this.features.filter(f => f.floor === floorId);
    if (this.selectedTypes.size < 6) {
      filtered = filtered.filter(f => this.selectedTypes.has(f.type));
    }
    return filtered;
  }

  getVisibleFeatures(floorId: string): AccessibilityFeature[] {
    if (!this.isOverlayVisible) return [];
    return this.getFilteredFeatures(floorId);
  }

  getFeatureById(id: string): AccessibilityFeature | null {
    return this.features.find(f => f.id === id) || null;
  }

  getNearestFeature(buildingId: string, type: AccessibilityFeatureType, floorId?: string): AccessibilityFeature | null {
    let candidates = this.features.filter(f =>
      f.type === type &&
      f.isOperational &&
      f.nearestBuildings.includes(buildingId)
    );
    if (floorId && floorId !== 'all') {
      candidates = candidates.filter(f => f.floor === floorId);
    }
    return candidates[0] || null;
  }

  getNearestFeatures(buildingId: string, floorId?: string): AccessibilityFeature[] {
    let candidates = this.features.filter(f =>
      f.isOperational &&
      f.nearestBuildings.includes(buildingId)
    );
    if (floorId && floorId !== 'all') {
      candidates = candidates.filter(f => f.floor === floorId);
    }
    return candidates;
  }

  // ── Floor Summary ───────────────────────────────────────────────────
  getFloorSummary(floorId: string): FloorAccessibilitySummary {
    const features = this.getFeaturesForFloor(floorId);
    const operational = features.filter(f => f.isOperational).length;
    const floorLabels: Record<string, string> = {
      all: 'All Floors',
      ground: 'Ground Floor',
      level1: 'Level 1',
      level2: 'Level 2',
    };

    return {
      floorId,
      floorLabel: floorLabels[floorId] || floorId,
      elevatorCount: features.filter(f => f.type === 'elevator').length,
      rampCount: features.filter(f => f.type === 'ramp').length,
      restroomCount: features.filter(f => f.type === 'restroom').length,
      parkingCount: features.filter(f => f.type === 'parking').length,
      entranceCount: features.filter(f => f.type === 'entrance').length,
      assistanceCount: features.filter(f => f.type === 'assistance').length,
      totalFeatures: features.length,
      operationalPercentage: features.length > 0 ? Math.round((operational / features.length) * 100) : 100,
    };
  }

  // ── Accessible Routes ───────────────────────────────────────────────
  getAccessibleRoute(fromBuildingId: string, toBuildingId: string): AccessibilityRoute {
    const fromFeatures = this.getNearestFeatures(fromBuildingId);
    const toFeatures = this.getNearestFeatures(toBuildingId);
    const featureIds = [...new Set([...fromFeatures, ...toFeatures].map(f => f.id))];

    const hasElevator = fromFeatures.some(f => f.type === 'elevator') || toFeatures.some(f => f.type === 'elevator');
    const hasRamp = fromFeatures.some(f => f.type === 'ramp') || toFeatures.some(f => f.type === 'ramp');

    const instructions: string[] = [];
    const fromEntrance = fromFeatures.find(f => f.type === 'entrance');
    const toEntrance = toFeatures.find(f => f.type === 'entrance');

    if (fromEntrance) {
      instructions.push(`Start at ${fromEntrance.name} (automatic doors)`);
    } else {
      instructions.push(`Exit from ${fromBuildingId} area`);
    }

    if (hasRamp) {
      const ramp = fromFeatures.find(f => f.type === 'ramp') || toFeatures.find(f => f.type === 'ramp');
      if (ramp) instructions.push(`Use ${ramp.name} for level access`);
    }

    if (hasElevator) {
      const elevator = fromFeatures.find(f => f.type === 'elevator') || toFeatures.find(f => f.type === 'elevator');
      if (elevator) instructions.push(`Take ${elevator.name} to destination floor`);
    }

    instructions.push('Follow accessible corridor markings');

    if (toEntrance) {
      instructions.push(`Arrive at ${toEntrance.name}`);
    } else {
      instructions.push(`Arrive at ${toBuildingId} area`);
    }

    const distance = 80 + Math.floor(Math.random() * 200);
    const minutes = Math.ceil(distance / 40); // slower pace for accessibility

    return {
      id: `route-${fromBuildingId}-${toBuildingId}`,
      fromBuildingId,
      toBuildingId,
      isAccessible: true,
      features: featureIds,
      distanceMeters: distance,
      estimatedMinutes: minutes,
      instructions,
    };
  }

  // ── Static Helpers ──────────────────────────────────────────────────
  static getFeatureIcon(type: AccessibilityFeatureType): string {
    return FEATURE_ICONS[type];
  }

  static getFeatureColor(type: AccessibilityFeatureType): string {
    return FEATURE_COLORS[type];
  }

  static getFeatureLabel(type: AccessibilityFeatureType): string {
    return FEATURE_LABELS[type];
  }

  static getAllTypes(): AccessibilityFeatureType[] {
    return ['elevator', 'ramp', 'restroom', 'parking', 'entrance', 'assistance'];
  }

  static getFeatureTypeInfo(): Array<{ type: AccessibilityFeatureType; icon: string; color: string; label: string }> {
    return AccessibilityOverlayService.getAllTypes().map(type => ({
      type,
      icon: FEATURE_ICONS[type],
      color: FEATURE_COLORS[type],
      label: FEATURE_LABELS[type],
    }));
  }

  // ── Listeners ───────────────────────────────────────────────────────
  onOverlayChange(cb: OverlayChangeCallback): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  private notifyListeners(): void {
    const visible = this.isOverlayVisible ? this.getFilteredFeatures('all') : [];
    this.listeners.forEach(cb => cb(visible));
  }
}
