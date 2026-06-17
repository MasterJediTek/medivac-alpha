/**
 * Accessibility Routes Service
 * 
 * Provides wheelchair-accessible routing that avoids stairs and narrow
 * corridors, preferring elevators, ramps, and wide pathways.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface Position {
  x: number;
  y: number;
}

export interface AccessibilityNode {
  id: string;
  position: Position;
  name: string;
  type: NodeType;
  floor: number;
  isAccessible: boolean;
  accessibilityFeatures: AccessibilityFeature[];
  connections: NodeConnection[];
}

export type NodeType = 
  | 'entrance'
  | 'elevator'
  | 'ramp'
  | 'stairs'
  | 'corridor'
  | 'room'
  | 'junction'
  | 'restroom'
  | 'parking';

export type AccessibilityFeature = 
  | 'wheelchair_accessible'
  | 'automatic_door'
  | 'wide_corridor'
  | 'handrails'
  | 'tactile_paving'
  | 'braille_signage'
  | 'hearing_loop'
  | 'accessible_restroom'
  | 'lowered_counter';

export interface NodeConnection {
  targetId: string;
  distance: number;
  isAccessible: boolean;
  pathWidth: number; // cm
  hasStairs: boolean;
  hasRamp: boolean;
  hasElevator: boolean;
  gradient: number; // percentage slope
  surfaceType: 'smooth' | 'textured' | 'carpet' | 'outdoor';
}

export interface AccessibilitySettings {
  requireWheelchairAccess: boolean;
  preferElevators: boolean;
  preferRamps: boolean;
  avoidStairs: boolean;
  minimumPathWidth: number; // cm
  maximumGradient: number; // percentage
  requireAutomaticDoors: boolean;
  requireAccessibleRestrooms: boolean;
}

export interface AccessibleRoute {
  path: AccessibilityNode[];
  totalDistance: number;
  estimatedTime: number; // seconds
  accessibilityScore: number; // 0-100
  hasElevator: boolean;
  hasRamp: boolean;
  hasStairs: boolean;
  warnings: AccessibilityWarning[];
}

export interface AccessibilityWarning {
  type: 'stairs' | 'narrow' | 'gradient' | 'surface' | 'door';
  message: string;
  severity: 'info' | 'warning' | 'critical';
  nodeId: string;
}

// ============================================================================
// CONSTANTS - HOSPITAL ACCESSIBILITY NETWORK
// ============================================================================

const ACCESSIBILITY_NODES: AccessibilityNode[] = [
  // Main Entrances
  { id: 'entrance-main', position: { x: 150, y: 30 }, name: 'Main Entrance', type: 'entrance', floor: 0, isAccessible: true, accessibilityFeatures: ['wheelchair_accessible', 'automatic_door', 'tactile_paving'], connections: [] },
  { id: 'entrance-emergency', position: { x: 80, y: 100 }, name: 'Emergency Entrance', type: 'entrance', floor: 0, isAccessible: true, accessibilityFeatures: ['wheelchair_accessible', 'automatic_door', 'wide_corridor'], connections: [] },
  { id: 'entrance-parking', position: { x: 50, y: 50 }, name: 'Accessible Parking', type: 'parking', floor: 0, isAccessible: true, accessibilityFeatures: ['wheelchair_accessible'], connections: [] },
  
  // Elevators
  { id: 'elevator-main', position: { x: 180, y: 100 }, name: 'Main Elevator', type: 'elevator', floor: 0, isAccessible: true, accessibilityFeatures: ['wheelchair_accessible', 'braille_signage', 'hearing_loop'], connections: [] },
  { id: 'elevator-east', position: { x: 280, y: 150 }, name: 'East Wing Elevator', type: 'elevator', floor: 0, isAccessible: true, accessibilityFeatures: ['wheelchair_accessible', 'braille_signage'], connections: [] },
  
  // Ramps
  { id: 'ramp-reception', position: { x: 160, y: 60 }, name: 'Reception Ramp', type: 'ramp', floor: 0, isAccessible: true, accessibilityFeatures: ['wheelchair_accessible', 'handrails'], connections: [] },
  { id: 'ramp-garden', position: { x: 240, y: 300 }, name: 'Garden Ramp', type: 'ramp', floor: 0, isAccessible: true, accessibilityFeatures: ['wheelchair_accessible', 'handrails'], connections: [] },
  
  // Stairs (not accessible)
  { id: 'stairs-main', position: { x: 200, y: 100 }, name: 'Main Stairwell', type: 'stairs', floor: 0, isAccessible: false, accessibilityFeatures: ['handrails'], connections: [] },
  { id: 'stairs-emergency', position: { x: 320, y: 200 }, name: 'Emergency Stairs', type: 'stairs', floor: 0, isAccessible: false, accessibilityFeatures: ['handrails'], connections: [] },
  
  // Corridors
  { id: 'corridor-main', position: { x: 180, y: 80 }, name: 'Main Corridor', type: 'corridor', floor: 0, isAccessible: true, accessibilityFeatures: ['wheelchair_accessible', 'wide_corridor', 'tactile_paving'], connections: [] },
  { id: 'corridor-east', position: { x: 260, y: 120 }, name: 'East Corridor', type: 'corridor', floor: 0, isAccessible: true, accessibilityFeatures: ['wheelchair_accessible', 'wide_corridor'], connections: [] },
  { id: 'corridor-narrow', position: { x: 100, y: 200 }, name: 'Service Corridor', type: 'corridor', floor: 0, isAccessible: false, accessibilityFeatures: [], connections: [] },
  
  // Accessible Restrooms
  { id: 'restroom-main', position: { x: 200, y: 60 }, name: 'Accessible Restroom', type: 'restroom', floor: 0, isAccessible: true, accessibilityFeatures: ['wheelchair_accessible', 'accessible_restroom', 'handrails'], connections: [] },
  { id: 'restroom-emergency', position: { x: 90, y: 140 }, name: 'ED Accessible Restroom', type: 'restroom', floor: 0, isAccessible: true, accessibilityFeatures: ['wheelchair_accessible', 'accessible_restroom'], connections: [] },
  
  // Department Junctions
  { id: 'junction-reception', position: { x: 150, y: 50 }, name: 'Reception', type: 'junction', floor: 0, isAccessible: true, accessibilityFeatures: ['wheelchair_accessible', 'lowered_counter'], connections: [] },
  { id: 'junction-emergency', position: { x: 100, y: 120 }, name: 'Emergency Dept', type: 'junction', floor: 0, isAccessible: true, accessibilityFeatures: ['wheelchair_accessible', 'automatic_door'], connections: [] },
  { id: 'junction-pharmacy', position: { x: 250, y: 80 }, name: 'Pharmacy', type: 'junction', floor: 0, isAccessible: true, accessibilityFeatures: ['wheelchair_accessible', 'lowered_counter'], connections: [] },
  { id: 'junction-radiology', position: { x: 180, y: 180 }, name: 'Radiology', type: 'junction', floor: 0, isAccessible: true, accessibilityFeatures: ['wheelchair_accessible', 'automatic_door'], connections: [] },
  { id: 'junction-cafeteria', position: { x: 300, y: 150 }, name: 'Cafeteria', type: 'junction', floor: 0, isAccessible: true, accessibilityFeatures: ['wheelchair_accessible', 'wide_corridor'], connections: [] },
  
  // First Floor
  { id: 'junction-maternity', position: { x: 120, y: 220 }, name: 'Maternity Ward', type: 'junction', floor: 1, isAccessible: true, accessibilityFeatures: ['wheelchair_accessible', 'automatic_door'], connections: [] },
  { id: 'junction-paediatrics', position: { x: 200, y: 250 }, name: 'Paediatrics', type: 'junction', floor: 1, isAccessible: true, accessibilityFeatures: ['wheelchair_accessible'], connections: [] },
  { id: 'junction-surgical', position: { x: 280, y: 220 }, name: 'Surgical Ward', type: 'junction', floor: 1, isAccessible: true, accessibilityFeatures: ['wheelchair_accessible', 'automatic_door'], connections: [] },
];

// Define connections between nodes
const NODE_CONNECTIONS: { fromId: string; toId: string; connection: Omit<NodeConnection, 'targetId'> }[] = [
  // Main entrance connections
  { fromId: 'entrance-main', toId: 'junction-reception', connection: { distance: 20, isAccessible: true, pathWidth: 200, hasStairs: false, hasRamp: false, hasElevator: false, gradient: 0, surfaceType: 'smooth' } },
  { fromId: 'entrance-parking', toId: 'entrance-main', connection: { distance: 100, isAccessible: true, pathWidth: 150, hasStairs: false, hasRamp: true, hasElevator: false, gradient: 2, surfaceType: 'outdoor' } },
  
  // Reception area
  { fromId: 'junction-reception', toId: 'corridor-main', connection: { distance: 30, isAccessible: true, pathWidth: 180, hasStairs: false, hasRamp: false, hasElevator: false, gradient: 0, surfaceType: 'smooth' } },
  { fromId: 'junction-reception', toId: 'restroom-main', connection: { distance: 50, isAccessible: true, pathWidth: 150, hasStairs: false, hasRamp: false, hasElevator: false, gradient: 0, surfaceType: 'smooth' } },
  
  // Main corridor connections
  { fromId: 'corridor-main', toId: 'elevator-main', connection: { distance: 20, isAccessible: true, pathWidth: 180, hasStairs: false, hasRamp: false, hasElevator: true, gradient: 0, surfaceType: 'smooth' } },
  { fromId: 'corridor-main', toId: 'stairs-main', connection: { distance: 20, isAccessible: false, pathWidth: 120, hasStairs: true, hasRamp: false, hasElevator: false, gradient: 30, surfaceType: 'smooth' } },
  { fromId: 'corridor-main', toId: 'junction-pharmacy', connection: { distance: 70, isAccessible: true, pathWidth: 160, hasStairs: false, hasRamp: false, hasElevator: false, gradient: 0, surfaceType: 'smooth' } },
  { fromId: 'corridor-main', toId: 'junction-emergency', connection: { distance: 80, isAccessible: true, pathWidth: 200, hasStairs: false, hasRamp: false, hasElevator: false, gradient: 0, surfaceType: 'smooth' } },
  
  // Emergency department
  { fromId: 'entrance-emergency', toId: 'junction-emergency', connection: { distance: 20, isAccessible: true, pathWidth: 250, hasStairs: false, hasRamp: true, hasElevator: false, gradient: 3, surfaceType: 'smooth' } },
  { fromId: 'junction-emergency', toId: 'restroom-emergency', connection: { distance: 20, isAccessible: true, pathWidth: 150, hasStairs: false, hasRamp: false, hasElevator: false, gradient: 0, surfaceType: 'smooth' } },
  
  // East wing
  { fromId: 'corridor-main', toId: 'corridor-east', connection: { distance: 80, isAccessible: true, pathWidth: 160, hasStairs: false, hasRamp: false, hasElevator: false, gradient: 0, surfaceType: 'smooth' } },
  { fromId: 'corridor-east', toId: 'elevator-east', connection: { distance: 20, isAccessible: true, pathWidth: 150, hasStairs: false, hasRamp: false, hasElevator: true, gradient: 0, surfaceType: 'smooth' } },
  { fromId: 'corridor-east', toId: 'junction-cafeteria', connection: { distance: 40, isAccessible: true, pathWidth: 180, hasStairs: false, hasRamp: false, hasElevator: false, gradient: 0, surfaceType: 'smooth' } },
  
  // Radiology
  { fromId: 'corridor-main', toId: 'junction-radiology', connection: { distance: 100, isAccessible: true, pathWidth: 160, hasStairs: false, hasRamp: false, hasElevator: false, gradient: 0, surfaceType: 'smooth' } },
  
  // Elevator to first floor
  { fromId: 'elevator-main', toId: 'junction-maternity', connection: { distance: 50, isAccessible: true, pathWidth: 180, hasStairs: false, hasRamp: false, hasElevator: true, gradient: 0, surfaceType: 'smooth' } },
  { fromId: 'elevator-east', toId: 'junction-surgical', connection: { distance: 40, isAccessible: true, pathWidth: 160, hasStairs: false, hasRamp: false, hasElevator: true, gradient: 0, surfaceType: 'smooth' } },
  
  // First floor connections
  { fromId: 'junction-maternity', toId: 'junction-paediatrics', connection: { distance: 80, isAccessible: true, pathWidth: 160, hasStairs: false, hasRamp: false, hasElevator: false, gradient: 0, surfaceType: 'smooth' } },
  { fromId: 'junction-paediatrics', toId: 'junction-surgical', connection: { distance: 80, isAccessible: true, pathWidth: 160, hasStairs: false, hasRamp: false, hasElevator: false, gradient: 0, surfaceType: 'smooth' } },
];

const DEFAULT_SETTINGS: AccessibilitySettings = {
  requireWheelchairAccess: true,
  preferElevators: true,
  preferRamps: true,
  avoidStairs: true,
  minimumPathWidth: 90, // cm (wheelchair width + clearance)
  maximumGradient: 8, // percentage (ADA compliant)
  requireAutomaticDoors: false,
  requireAccessibleRestrooms: false,
};

// ============================================================================
// ACCESSIBILITY ROUTES SERVICE
// ============================================================================

class AccessibilityRoutesService {
  private settings: AccessibilitySettings = { ...DEFAULT_SETTINGS };
  private nodes: Map<string, AccessibilityNode> = new Map();
  private settingsListeners: Set<(settings: AccessibilitySettings) => void> = new Set();

  constructor() {
    this.initializeNetwork();
  }

  /**
   * Initialize the accessibility network
   */
  private initializeNetwork(): void {
    // Add all nodes
    for (const node of ACCESSIBILITY_NODES) {
      this.nodes.set(node.id, { ...node, connections: [] });
    }

    // Add connections (bidirectional)
    for (const conn of NODE_CONNECTIONS) {
      const fromNode = this.nodes.get(conn.fromId);
      const toNode = this.nodes.get(conn.toId);

      if (fromNode && toNode) {
        fromNode.connections.push({ targetId: conn.toId, ...conn.connection });
        toNode.connections.push({ targetId: conn.fromId, ...conn.connection });
      }
    }
  }

  // ============================================================================
  // SETTINGS
  // ============================================================================

  /**
   * Get current settings
   */
  getSettings(): AccessibilitySettings {
    return { ...this.settings };
  }

  /**
   * Update settings
   */
  updateSettings(updates: Partial<AccessibilitySettings>): void {
    this.settings = { ...this.settings, ...updates };
    this.notifySettingsListeners();
  }

  /**
   * Enable wheelchair mode
   */
  enableWheelchairMode(): void {
    this.updateSettings({
      requireWheelchairAccess: true,
      preferElevators: true,
      avoidStairs: true,
      minimumPathWidth: 90,
    });
  }

  /**
   * Disable accessibility restrictions
   */
  disableAccessibilityMode(): void {
    this.updateSettings({
      requireWheelchairAccess: false,
      preferElevators: false,
      avoidStairs: false,
      minimumPathWidth: 60,
    });
  }

  // ============================================================================
  // ROUTING
  // ============================================================================

  /**
   * Find accessible route between two nodes
   */
  findAccessibleRoute(startId: string, endId: string): AccessibleRoute | null {
    const startNode = this.nodes.get(startId);
    const endNode = this.nodes.get(endId);

    if (!startNode || !endNode) return null;

    // A* pathfinding with accessibility weights
    const path = this.aStarAccessible(startId, endId);
    
    if (!path || path.length === 0) return null;

    return this.buildRoute(path);
  }

  /**
   * Find nearest accessible node to a position
   */
  findNearestAccessibleNode(position: Position, floor: number = 0): AccessibilityNode | null {
    let nearest: AccessibilityNode | null = null;
    let minDistance = Infinity;

    for (const node of this.nodes.values()) {
      if (node.floor !== floor) continue;
      if (this.settings.requireWheelchairAccess && !node.isAccessible) continue;

      const distance = this.calculateDistance(position, node.position);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = node;
      }
    }

    return nearest;
  }

  /**
   * A* pathfinding with accessibility considerations
   */
  private aStarAccessible(startId: string, endId: string): string[] | null {
    const openSet = new Set<string>([startId]);
    const cameFrom = new Map<string, string>();
    const gScore = new Map<string, number>();
    const fScore = new Map<string, number>();

    gScore.set(startId, 0);
    fScore.set(startId, this.heuristic(startId, endId));

    while (openSet.size > 0) {
      // Find node with lowest fScore
      let current: string | null = null;
      let lowestF = Infinity;
      for (const nodeId of openSet) {
        const f = fScore.get(nodeId) ?? Infinity;
        if (f < lowestF) {
          lowestF = f;
          current = nodeId;
        }
      }

      if (!current) break;
      if (current === endId) {
        return this.reconstructPath(cameFrom, current);
      }

      openSet.delete(current);
      const currentNode = this.nodes.get(current);
      if (!currentNode) continue;

      for (const connection of currentNode.connections) {
        // Check if connection is accessible
        if (!this.isConnectionAccessible(connection)) continue;

        const tentativeG = (gScore.get(current) ?? Infinity) + 
          this.getConnectionCost(connection);

        if (tentativeG < (gScore.get(connection.targetId) ?? Infinity)) {
          cameFrom.set(connection.targetId, current);
          gScore.set(connection.targetId, tentativeG);
          fScore.set(connection.targetId, tentativeG + this.heuristic(connection.targetId, endId));
          openSet.add(connection.targetId);
        }
      }
    }

    return null; // No path found
  }

  /**
   * Check if a connection meets accessibility requirements
   */
  private isConnectionAccessible(connection: NodeConnection): boolean {
    if (this.settings.requireWheelchairAccess && !connection.isAccessible) {
      return false;
    }
    if (this.settings.avoidStairs && connection.hasStairs) {
      return false;
    }
    if (connection.pathWidth < this.settings.minimumPathWidth) {
      return false;
    }
    if (connection.gradient > this.settings.maximumGradient) {
      return false;
    }
    return true;
  }

  /**
   * Get cost for a connection (lower is better)
   */
  private getConnectionCost(connection: NodeConnection): number {
    let cost = connection.distance;

    // Prefer elevators
    if (this.settings.preferElevators && connection.hasElevator) {
      cost *= 0.8;
    }

    // Prefer ramps
    if (this.settings.preferRamps && connection.hasRamp) {
      cost *= 0.9;
    }

    // Penalize stairs
    if (connection.hasStairs) {
      cost *= 2.0;
    }

    // Penalize narrow paths
    if (connection.pathWidth < 120) {
      cost *= 1.3;
    }

    // Penalize steep gradients
    if (connection.gradient > 5) {
      cost *= 1.2;
    }

    return cost;
  }

  /**
   * Heuristic for A* (Euclidean distance)
   */
  private heuristic(nodeId: string, targetId: string): number {
    const node = this.nodes.get(nodeId);
    const target = this.nodes.get(targetId);
    if (!node || !target) return Infinity;
    return this.calculateDistance(node.position, target.position);
  }

  /**
   * Reconstruct path from A* result
   */
  private reconstructPath(cameFrom: Map<string, string>, current: string): string[] {
    const path = [current];
    while (cameFrom.has(current)) {
      current = cameFrom.get(current)!;
      path.unshift(current);
    }
    return path;
  }

  /**
   * Build route from path
   */
  private buildRoute(pathIds: string[]): AccessibleRoute {
    const path: AccessibilityNode[] = [];
    let totalDistance = 0;
    let hasElevator = false;
    let hasRamp = false;
    let hasStairs = false;
    const warnings: AccessibilityWarning[] = [];

    for (let i = 0; i < pathIds.length; i++) {
      const node = this.nodes.get(pathIds[i]);
      if (!node) continue;
      path.push(node);

      // Check connections to next node
      if (i < pathIds.length - 1) {
        const connection = node.connections.find(c => c.targetId === pathIds[i + 1]);
        if (connection) {
          totalDistance += connection.distance;
          if (connection.hasElevator) hasElevator = true;
          if (connection.hasRamp) hasRamp = true;
          if (connection.hasStairs) hasStairs = true;

          // Generate warnings
          if (connection.hasStairs) {
            warnings.push({
              type: 'stairs',
              message: `Stairs between ${node.name} and next location`,
              severity: 'warning',
              nodeId: node.id,
            });
          }
          if (connection.pathWidth < 100) {
            warnings.push({
              type: 'narrow',
              message: `Narrow passage (${connection.pathWidth}cm) near ${node.name}`,
              severity: 'info',
              nodeId: node.id,
            });
          }
          if (connection.gradient > 5) {
            warnings.push({
              type: 'gradient',
              message: `Steep slope (${connection.gradient}%) near ${node.name}`,
              severity: 'info',
              nodeId: node.id,
            });
          }
        }
      }
    }

    // Calculate accessibility score
    const accessibilityScore = this.calculateAccessibilityScore(path, warnings);

    // Estimate time (assuming 1m/s walking speed, slower for accessibility)
    const speedFactor = this.settings.requireWheelchairAccess ? 0.7 : 1.0;
    const estimatedTime = totalDistance / speedFactor;

    return {
      path,
      totalDistance,
      estimatedTime,
      accessibilityScore,
      hasElevator,
      hasRamp,
      hasStairs,
      warnings,
    };
  }

  /**
   * Calculate accessibility score (0-100)
   */
  private calculateAccessibilityScore(path: AccessibilityNode[], warnings: AccessibilityWarning[]): number {
    let score = 100;

    // Deduct for warnings
    for (const warning of warnings) {
      switch (warning.severity) {
        case 'critical': score -= 30; break;
        case 'warning': score -= 15; break;
        case 'info': score -= 5; break;
      }
    }

    // Bonus for accessible features
    for (const node of path) {
      if (node.accessibilityFeatures.includes('automatic_door')) score += 2;
      if (node.accessibilityFeatures.includes('wide_corridor')) score += 2;
      if (node.accessibilityFeatures.includes('tactile_paving')) score += 1;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate distance between positions
   */
  private calculateDistance(p1: Position, p2: Position): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // ============================================================================
  // NODE ACCESS
  // ============================================================================

  /**
   * Get all nodes
   */
  getNodes(): AccessibilityNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Get accessible nodes only
   */
  getAccessibleNodes(): AccessibilityNode[] {
    return Array.from(this.nodes.values()).filter(n => n.isAccessible);
  }

  /**
   * Get node by ID
   */
  getNode(nodeId: string): AccessibilityNode | undefined {
    return this.nodes.get(nodeId);
  }

  /**
   * Get nodes with specific feature
   */
  getNodesWithFeature(feature: AccessibilityFeature): AccessibilityNode[] {
    return Array.from(this.nodes.values()).filter(
      n => n.accessibilityFeatures.includes(feature)
    );
  }

  // ============================================================================
  // LISTENERS
  // ============================================================================

  /**
   * Subscribe to settings changes
   */
  onSettingsChange(callback: (settings: AccessibilitySettings) => void): () => void {
    this.settingsListeners.add(callback);
    return () => this.settingsListeners.delete(callback);
  }

  /**
   * Notify settings listeners
   */
  private notifySettingsListeners(): void {
    const settings = this.getSettings();
    this.settingsListeners.forEach(listener => listener(settings));
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  /**
   * Clean up the service
   */
  destroy(): void {
    this.settingsListeners.clear();
  }
}

// Singleton instance
export const accessibilityRoutesService = new AccessibilityRoutesService();

export default accessibilityRoutesService;
