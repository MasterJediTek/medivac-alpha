 * Wayfinding Service
 * 
 * Provides navigation assistance with destination selection,
 * optimal path calculation using A* algorithm, and turn-by-turn directions.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface Position {
  x: number;
  y: number;
}

export interface Destination {
  id: string;
  name: string;
  category: DestinationCategory;
  icon: string;
  position: Position;
  buildingId: string;
  floor: number;
  description?: string;
  isAccessible?: boolean;
}

export type DestinationCategory = 
  | 'emergency'
  | 'department'
  | 'service'
  | 'facility'
  | 'entrance'
  | 'parking';

export interface NavigationStep {
  instruction: string;
  direction: 'straight' | 'left' | 'right' | 'up' | 'down' | 'arrive';
  distance: number; // meters
  landmark?: string;
  icon: string;
}

export interface Route {
  id: string;
  origin: Position;
  destination: Destination;
  path: Position[];
  steps: NavigationStep[];
  totalDistance: number; // meters
  estimatedTime: number; // seconds
  isAccessible: boolean;
  createdAt: number;
}

export interface WayfindingState {
  currentPosition: Position | null;
  selectedDestination: Destination | null;
  activeRoute: Route | null;
  isNavigating: boolean;
  currentStepIndex: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const WALKING_SPEED = 1.4; // meters per second (average walking speed)
const PIXELS_PER_METER = 10; // scale factor for the map

// Hospital destinations
const HOSPITAL_DESTINATIONS: Destination[] = [
  // Emergency & Main
  { id: 'dest-emergency', name: 'Emergency Department', category: 'emergency', icon: '🚨', position: { x: 200, y: 150 }, buildingId: 'emergency', floor: 1, description: '24/7 Emergency Services' },
  { id: 'dest-main-entrance', name: 'Main Entrance', category: 'entrance', icon: '🚪', position: { x: 100, y: 50 }, buildingId: 'main', floor: 1 },
  { id: 'dest-reception', name: 'Main Reception', category: 'service', icon: '📋', position: { x: 120, y: 80 }, buildingId: 'main', floor: 1 },
  
  // Departments
  { id: 'dest-maternity', name: 'Maternity Ward', category: 'department', icon: '👶', position: { x: 300, y: 200 }, buildingId: 'maternity', floor: 1, description: 'Birthing suites and postnatal care' },