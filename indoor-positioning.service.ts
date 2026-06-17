/**
 * Indoor Positioning Service
 * 
 * Simulates Bluetooth beacon-based indoor positioning for real-time
 * user location tracking within the hospital campus.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface Position {
  x: number;
  y: number;
}

export interface Beacon {
  id: string;
  name: string;
  position: Position;
  uuid: string;
  major: number;
  minor: number;
  txPower: number; // dBm at 1 meter
  department: string;
  floor: number;
  isActive: boolean;
}

export interface BeaconSignal {
  beaconId: string;
  rssi: number; // Received signal strength
  distance: number; // Estimated distance in meters
  timestamp: number;
}

export interface UserPosition {
  position: Position;
  accuracy: number; // meters
  floor: number;
  timestamp: number;
  nearestBeacon: string | null;
  department: string | null;
}

export interface PositioningState {
  isTracking: boolean;
  currentPosition: UserPosition | null;
  visibleBeacons: BeaconSignal[];
  lastUpdate: number;
}

// ============================================================================
// CONSTANTS - HOSPITAL BEACON NETWORK
// ============================================================================

const HOSPITAL_BEACONS: Beacon[] = [
  // Main Building - Ground Floor
  { id: 'beacon-reception', name: 'Reception', position: { x: 150, y: 50 }, uuid: 'JEDI-HOSP-0001', major: 1, minor: 1, txPower: -59, department: 'Reception', floor: 0, isActive: true },
  { id: 'beacon-emergency', name: 'Emergency Dept', position: { x: 100, y: 120 }, uuid: 'JEDI-HOSP-0002', major: 1, minor: 2, txPower: -59, department: 'Emergency', floor: 0, isActive: true },
  { id: 'beacon-pharmacy', name: 'Pharmacy', position: { x: 250, y: 80 }, uuid: 'JEDI-HOSP-0003', major: 1, minor: 3, txPower: -59, department: 'Pharmacy', floor: 0, isActive: true },
  { id: 'beacon-cafeteria', name: 'Cafeteria', position: { x: 300, y: 150 }, uuid: 'JEDI-HOSP-0004', major: 1, minor: 4, txPower: -59, department: 'Cafeteria', floor: 0, isActive: true },
  { id: 'beacon-radiology', name: 'Radiology', position: { x: 180, y: 180 }, uuid: 'JEDI-HOSP-0005', major: 1, minor: 5, txPower: -59, department: 'Radiology', floor: 0, isActive: true },
  
  // Main Building - First Floor
  { id: 'beacon-maternity', name: 'Maternity Ward', position: { x: 120, y: 220 }, uuid: 'JEDI-HOSP-0006', major: 2, minor: 1, txPower: -59, department: 'Maternity', floor: 1, isActive: true },
  { id: 'beacon-paediatrics', name: 'Paediatrics', position: { x: 200, y: 250 }, uuid: 'JEDI-HOSP-0007', major: 2, minor: 2, txPower: -59, department: 'Paediatrics', floor: 1, isActive: true },
  { id: 'beacon-surgical', name: 'Surgical Ward', position: { x: 280, y: 220 }, uuid: 'JEDI-HOSP-0008', major: 2, minor: 3, txPower: -59, department: 'Surgical', floor: 1, isActive: true },
  { id: 'beacon-medical', name: 'Medical Ward', position: { x: 320, y: 280 }, uuid: 'JEDI-HOSP-0009', major: 2, minor: 4, txPower: -59, department: 'Medical', floor: 1, isActive: true },
  
  // Pathology Building
  { id: 'beacon-pathology', name: 'Pathology', position: { x: 80, y: 300 }, uuid: 'JEDI-HOSP-0010', major: 3, minor: 1, txPower: -59, department: 'Pathology', floor: 0, isActive: true },
  { id: 'beacon-bloodbank', name: 'Blood Bank', position: { x: 60, y: 340 }, uuid: 'JEDI-HOSP-0011', major: 3, minor: 2, txPower: -59, department: 'Pathology', floor: 0, isActive: true },
  
  // Mental Health Building (Maritana Street)
  { id: 'beacon-mentalhealth', name: 'Mental Health', position: { x: 350, y: 100 }, uuid: 'JEDI-HOSP-0012', major: 4, minor: 1, txPower: -59, department: 'Mental Health', floor: 0, isActive: true },
  { id: 'beacon-counseling', name: 'Counseling', position: { x: 380, y: 130 }, uuid: 'JEDI-HOSP-0013', major: 4, minor: 2, txPower: -59, department: 'Mental Health', floor: 0, isActive: true },
  
  // Outdoor Areas
  { id: 'beacon-parking', name: 'Main Parking', position: { x: 50, y: 50 }, uuid: 'JEDI-HOSP-0014', major: 5, minor: 1, txPower: -65, department: 'Parking', floor: 0, isActive: true },
  { id: 'beacon-garden', name: 'Healing Garden', position: { x: 250, y: 320 }, uuid: 'JEDI-HOSP-0015', major: 5, minor: 2, txPower: -65, department: 'Garden', floor: 0, isActive: true },
  { id: 'beacon-helipad', name: 'Helipad', position: { x: 400, y: 50 }, uuid: 'JEDI-HOSP-0016', major: 5, minor: 3, txPower: -65, department: 'Emergency', floor: 0, isActive: true },
];

const SIGNAL_NOISE_RANGE = 3; // dBm noise variation
const UPDATE_INTERVAL = 1000; // ms between position updates
const RSSI_AT_1M = -59; // Reference RSSI at 1 meter
const PATH_LOSS_EXPONENT = 2.5; // Environmental path loss

// ============================================================================
// INDOOR POSITIONING SERVICE
// ============================================================================

class IndoorPositioningService {
  private state: PositioningState = {
    isTracking: false,
    currentPosition: null,
    visibleBeacons: [],
    lastUpdate: 0,
  };
  
  private simulatedUserPosition: Position = { x: 150, y: 50 }; // Start at reception
  private currentFloor: number = 0;
  private updateInterval: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<(state: PositioningState) => void> = new Set();
  private positionListeners: Set<(position: UserPosition) => void> = new Set();

  // ============================================================================
  // BEACON MANAGEMENT
  // ============================================================================

  /**
   * Get all beacons
   */
  getBeacons(): Beacon[] {
    return [...HOSPITAL_BEACONS];
  }

  /**
   * Get beacons by floor
   */
  getBeaconsByFloor(floor: number): Beacon[] {
    return HOSPITAL_BEACONS.filter(b => b.floor === floor && b.isActive);
  }

  /**
   * Get beacons by department
   */
  getBeaconsByDepartment(department: string): Beacon[] {
    return HOSPITAL_BEACONS.filter(b => b.department === department && b.isActive);
  }

  /**
   * Get beacon by ID
   */
  getBeacon(beaconId: string): Beacon | undefined {
    return HOSPITAL_BEACONS.find(b => b.id === beaconId);
  }

  // ============================================================================
  // POSITIONING
  // ============================================================================

  /**
   * Start position tracking
   */
  startTracking(): void {
    if (this.state.isTracking) return;

    this.state.isTracking = true;
    this.updateInterval = setInterval(() => {
      this.updatePosition();
    }, UPDATE_INTERVAL);

    // Initial update
    this.updatePosition();
    this.notifyListeners();
  }

  /**
   * Stop position tracking
   */
  stopTracking(): void {
    if (!this.state.isTracking) return;

    this.state.isTracking = false;
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.notifyListeners();
  }

  /**
   * Update position based on beacon signals
   */
  private updatePosition(): void {
    // Simulate beacon signals
    const signals = this.simulateBeaconSignals();
    this.state.visibleBeacons = signals;

    // Calculate position using trilateration
    const position = this.calculatePosition(signals);
    
    if (position) {
      this.state.currentPosition = position;
      this.state.lastUpdate = Date.now();
      this.notifyPositionListeners(position);
    }

    this.notifyListeners();
  }

  /**
   * Simulate beacon signals based on user position
   */
  private simulateBeaconSignals(): BeaconSignal[] {
    const signals: BeaconSignal[] = [];
    const beaconsOnFloor = this.getBeaconsByFloor(this.currentFloor);

    for (const beacon of beaconsOnFloor) {
      const distance = this.calculateDistance(this.simulatedUserPosition, beacon.position);
      
      // Only detect beacons within range (roughly 30 meters)
      if (distance <= 30) {
        const rssi = this.calculateRSSI(distance, beacon.txPower);
        signals.push({
          beaconId: beacon.id,
          rssi,
          distance,
          timestamp: Date.now(),
        });
      }
    }

    // Sort by signal strength (strongest first)
    return signals.sort((a, b) => b.rssi - a.rssi);
  }

  /**
   * Calculate RSSI from distance
   */
  private calculateRSSI(distance: number, txPower: number): number {
    // Path loss model: RSSI = txPower - 10 * n * log10(d)
    const rssi = txPower - 10 * PATH_LOSS_EXPONENT * Math.log10(Math.max(distance, 0.1));
    
    // Add noise
    const noise = (Math.random() - 0.5) * SIGNAL_NOISE_RANGE * 2;
    return Math.round(rssi + noise);
  }

  /**
   * Calculate distance from RSSI
   */
  private rssiToDistance(rssi: number, txPower: number): number {
    // Inverse of path loss model
    return Math.pow(10, (txPower - rssi) / (10 * PATH_LOSS_EXPONENT));
  }

  /**
   * Calculate position using weighted trilateration
   */
  private calculatePosition(signals: BeaconSignal[]): UserPosition | null {
    if (signals.length === 0) return null;

    // Use top 3 strongest signals for trilateration
    const topSignals = signals.slice(0, 3);
    
    if (topSignals.length === 1) {
      // Single beacon - use beacon position with large accuracy
      const beacon = this.getBeacon(topSignals[0].beaconId);
      if (!beacon) return null;

      return {
        position: { ...beacon.position },
        accuracy: topSignals[0].distance,
        floor: beacon.floor,
        timestamp: Date.now(),
        nearestBeacon: beacon.id,
        department: beacon.department,
      };
    }

    // Weighted centroid based on signal strength
    let totalWeight = 0;
    let weightedX = 0;
    let weightedY = 0;
    let nearestBeacon: string | null = null;
    let nearestDistance = Infinity;
    let department: string | null = null;

    for (const signal of topSignals) {
      const beacon = this.getBeacon(signal.beaconId);
      if (!beacon) continue;

      // Weight inversely proportional to distance
      const weight = 1 / Math.max(signal.distance, 0.1);
      totalWeight += weight;
      weightedX += beacon.position.x * weight;
      weightedY += beacon.position.y * weight;

      if (signal.distance < nearestDistance) {
        nearestDistance = signal.distance;
        nearestBeacon = beacon.id;
        department = beacon.department;
      }
    }

    if (totalWeight === 0) return null;

    const position: Position = {
      x: weightedX / totalWeight,
      y: weightedY / totalWeight,
    };

    // Accuracy based on signal spread
    const accuracy = Math.min(
      ...topSignals.map(s => s.distance)
    ) + 2; // Base accuracy + 2 meters

    return {
      position,
      accuracy,
      floor: this.currentFloor,
      timestamp: Date.now(),
      nearestBeacon,
      department,
    };
  }

  /**
   * Calculate Euclidean distance between two positions
   */
  private calculateDistance(p1: Position, p2: Position): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // ============================================================================
  // USER SIMULATION
  // ============================================================================

  /**
   * Set simulated user position (for testing/demo)
   */
  setSimulatedPosition(position: Position, floor?: number): void {
    this.simulatedUserPosition = { ...position };
    if (floor !== undefined) {
      this.currentFloor = floor;
    }
    
    if (this.state.isTracking) {
      this.updatePosition();
    }
  }

  /**
   * Move simulated user towards a target
   */
  moveTowards(target: Position, speed: number = 2): void {
    const dx = target.x - this.simulatedUserPosition.x;
    const dy = target.y - this.simulatedUserPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= speed) {
      this.simulatedUserPosition = { ...target };
    } else {
      const ratio = speed / distance;
      this.simulatedUserPosition.x += dx * ratio;
      this.simulatedUserPosition.y += dy * ratio;
    }

    if (this.state.isTracking) {
      this.updatePosition();
    }
  }

  /**
   * Get simulated position
   */
  getSimulatedPosition(): Position {
    return { ...this.simulatedUserPosition };
  }

  // ============================================================================
  // STATE ACCESS
  // ============================================================================

  /**
   * Get current state
   */
  getState(): PositioningState {
    return { ...this.state };
  }

  /**
   * Get current position
   */
  getCurrentPosition(): UserPosition | null {
    return this.state.currentPosition;
  }

  /**
   * Check if tracking is active
   */
  isTracking(): boolean {
    return this.state.isTracking;
  }

  // ============================================================================
  // LISTENERS
  // ============================================================================

  /**
   * Subscribe to state changes
   */
  onStateChange(callback: (state: PositioningState) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Subscribe to position updates
   */
  onPositionUpdate(callback: (position: UserPosition) => void): () => void {
    this.positionListeners.add(callback);
    return () => this.positionListeners.delete(callback);
  }

  /**
   * Notify state listeners
   */
  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach(listener => listener(state));
  }

  /**
   * Notify position listeners
   */
  private notifyPositionListeners(position: UserPosition): void {
    this.positionListeners.forEach(listener => listener(position));
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  /**
   * Clean up the service
   */
  destroy(): void {
    this.stopTracking();
    this.listeners.clear();
    this.positionListeners.clear();
  }
}

// Singleton instance
export const indoorPositioningService = new IndoorPositioningService();

export default indoorPositioningService;
