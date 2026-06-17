/**
 * Avatar A* Pathfinding Service
 * 
 * Provides intelligent pathfinding for avatars in the hospital map:
 * - A* algorithm for optimal route calculation
 * - Walkway node system
 * - Collision avoidance
 * - Smooth path interpolation
 */

// ============================================================================
// TYPES
// ============================================================================

export interface Position {
  x: number;
  y: number;
}

export interface PathNode {
  id: string;
  position: Position;
  connections: string[]; // IDs of connected nodes
  type: 'walkway' | 'intersection' | 'entrance' | 'destination';
  buildingId?: string;
}

export interface Avatar {
  id: string;
  name: string;
  type: 'patient' | 'staff' | 'visitor' | 'pet' | 'security';
  icon: string;
  position: Position;
  targetPosition: Position | null;
  currentPath: Position[];
  pathIndex: number;
  speed: number; // units per second
  animation: 'idle' | 'walking' | 'running' | 'playing' | 'patrolling';
  destinationNodeId: string | null;
  isMoving: boolean;
}

export interface PathResult {
  path: Position[];
  distance: number;
  estimatedTime: number; // seconds
  nodes: string[];
}

// ============================================================================
// HOSPITAL WALKWAY NETWORK
// ============================================================================

export const HOSPITAL_NODES: PathNode[] = [
  // Main Entrances
  { id: 'entrance-main', position: { x: 50, y: 85 }, connections: ['walk-1'], type: 'entrance' },
  { id: 'entrance-emergency', position: { x: 20, y: 45 }, connections: ['walk-2'], type: 'entrance' },
  { id: 'entrance-parking', position: { x: 85, y: 85 }, connections: ['walk-8'], type: 'entrance' },
  
  // Main Walkway Intersections
  { id: 'walk-1', position: { x: 50, y: 70 }, connections: ['entrance-main', 'walk-3', 'walk-4', 'walk-8'], type: 'intersection' },
  { id: 'walk-2', position: { x: 30, y: 45 }, connections: ['entrance-emergency', 'walk-3', 'dest-emergency', 'dest-mental-health'], type: 'intersection' },
  { id: 'walk-3', position: { x: 50, y: 50 }, connections: ['walk-1', 'walk-2', 'walk-5', 'walk-6', 'dest-main', 'dest-pharmacy'], type: 'intersection' },
  { id: 'walk-4', position: { x: 70, y: 70 }, connections: ['walk-1', 'walk-5', 'walk-7'], type: 'intersection' },
  { id: 'walk-5', position: { x: 70, y: 50 }, connections: ['walk-3', 'walk-4', 'dest-paediatrics', 'dest-maternity'], type: 'intersection' },
  { id: 'walk-6', position: { x: 50, y: 55 }, connections: ['walk-3', 'dest-pathology', 'dest-radiology'], type: 'intersection' },
  { id: 'walk-7', position: { x: 80, y: 65 }, connections: ['walk-4', 'dest-physio', 'dest-chapel'], type: 'intersection' },
  { id: 'walk-8', position: { x: 85, y: 75 }, connections: ['walk-1', 'entrance-parking', 'dest-parking'], type: 'intersection' },
  { id: 'walk-9', position: { x: 15, y: 50 }, connections: ['walk-2', 'dest-garden', 'dest-helipad'], type: 'intersection' },
  
  // Building Destinations
  { id: 'dest-main', position: { x: 55, y: 42 }, connections: ['walk-3'], type: 'destination', buildingId: 'main-hospital' },
  { id: 'dest-emergency', position: { x: 35, y: 40 }, connections: ['walk-2'], type: 'destination', buildingId: 'emergency' },
  { id: 'dest-maternity', position: { x: 72, y: 35 }, connections: ['walk-5'], type: 'destination', buildingId: 'maternity' },
  { id: 'dest-paediatrics', position: { x: 77, y: 52 }, connections: ['walk-5'], type: 'destination', buildingId: 'paediatrics' },
  { id: 'dest-mental-health', position: { x: 28, y: 65 }, connections: ['walk-2'], type: 'destination', buildingId: 'mental-health' },
  { id: 'dest-pathology', position: { x: 62, y: 57 }, connections: ['walk-6'], type: 'destination', buildingId: 'pathology' },
  { id: 'dest-radiology', position: { x: 47, y: 57 }, connections: ['walk-6'], type: 'destination', buildingId: 'radiology' },
  { id: 'dest-physio', position: { x: 82, y: 67 }, connections: ['walk-7'], type: 'destination', buildingId: 'physiotherapy' },
  { id: 'dest-pharmacy', position: { x: 57, y: 47 }, connections: ['walk-3'], type: 'destination', buildingId: 'pharmacy' },
  { id: 'dest-helipad', position: { x: 22, y: 27 }, connections: ['walk-9'], type: 'destination', buildingId: 'helipad' },
  { id: 'dest-parking', position: { x: 87, y: 82 }, connections: ['walk-8'], type: 'destination', buildingId: 'parking' },
  { id: 'dest-garden', position: { x: 17, y: 52 }, connections: ['walk-9'], type: 'destination', buildingId: 'garden' },
  { id: 'dest-chapel', position: { x: 92, y: 37 }, connections: ['walk-7'], type: 'destination', buildingId: 'chapel' },
];

// ============================================================================
// A* PATHFINDING ALGORITHM
// ============================================================================

interface AStarNode {
  id: string;
  position: Position;
  g: number; // Cost from start
  h: number; // Heuristic (estimated cost to end)
  f: number; // Total cost (g + h)
  parent: AStarNode | null;
}

function heuristic(a: Position, b: Position): number {
  // Euclidean distance
  return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
}

function getNodeById(id: string): PathNode | undefined {
  return HOSPITAL_NODES.find(n => n.id === id);
}

function findPath(startNodeId: string, endNodeId: string): PathResult | null {
  const startNode = getNodeById(startNodeId);
  const endNode = getNodeById(endNodeId);
  
  if (!startNode || !endNode) return null;

  const openSet: Map<string, AStarNode> = new Map();
  const closedSet: Set<string> = new Set();
  
  const start: AStarNode = {
    id: startNodeId,
    position: startNode.position,
    g: 0,
    h: heuristic(startNode.position, endNode.position),
    f: 0,
    parent: null,
  };
  start.f = start.g + start.h;
  
  openSet.set(startNodeId, start);
  
  while (openSet.size > 0) {
    // Get node with lowest f score
    let current: AStarNode | null = null;
    let lowestF = Infinity;
    
    openSet.forEach((node) => {
      if (node.f < lowestF) {
        lowestF = node.f;
        current = node;
      }
    });
    
    if (!current) break;
    
    // Check if we reached the goal
    if (current.id === endNodeId) {
      // Reconstruct path
      const path: Position[] = [];
      const nodes: string[] = [];
      let node: AStarNode | null = current;
      
      while (node) {
        path.unshift(node.position);
        nodes.unshift(node.id);
        node = node.parent;
      }
      
      return {
        path,
        distance: current.g,
        estimatedTime: current.g / 5, // Assuming speed of 5 units/second
        nodes,
      };
    }
    
    // Move current to closed set
    openSet.delete(current.id);
    closedSet.add(current.id);
    
    // Check neighbors
    const currentPathNode = getNodeById(current.id);
    if (!currentPathNode) continue;
    
    for (const neighborId of currentPathNode.connections) {
      if (closedSet.has(neighborId)) continue;
      
      const neighborNode = getNodeById(neighborId);
      if (!neighborNode) continue;
      
      const tentativeG = current.g + heuristic(current.position, neighborNode.position);
      
      let neighbor = openSet.get(neighborId);
      
      if (!neighbor) {
        neighbor = {
          id: neighborId,
          position: neighborNode.position,
          g: Infinity,
          h: heuristic(neighborNode.position, endNode.position),
          f: Infinity,
          parent: null,
        };
        openSet.set(neighborId, neighbor);
      }
      
      if (tentativeG < neighbor.g) {
        neighbor.parent = current;
        neighbor.g = tentativeG;
        neighbor.f = neighbor.g + neighbor.h;
      }
    }
  }
  
  return null; // No path found
}

// ============================================================================
// PATHFINDING SERVICE CLASS
// ============================================================================

export interface PathfindingEventListener {
  onAvatarMove?: (avatar: Avatar) => void;
  onAvatarArrived?: (avatar: Avatar, destinationId: string) => void;
  onPathCalculated?: (avatar: Avatar, path: PathResult) => void;
  onCollisionDetected?: (avatar1: Avatar, avatar2: Avatar) => void;
}

class AvatarPathfindingService {
  private avatars: Map<string, Avatar>;
  private listeners: Set<PathfindingEventListener>;
  private updateInterval: NodeJS.Timeout | null;
  private readonly UPDATE_RATE = 50; // ms between updates
  private readonly COLLISION_RADIUS = 3; // units

  constructor() {
    this.avatars = new Map();
    this.listeners = new Set();
    this.updateInterval = null;
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Register an avatar for pathfinding
   */
  registerAvatar(avatar: Avatar): void {
    this.avatars.set(avatar.id, {
      ...avatar,
      currentPath: [],
      pathIndex: 0,
      isMoving: false,
    });
  }

  /**
   * Remove an avatar
   */
  unregisterAvatar(avatarId: string): void {
    this.avatars.delete(avatarId);
  }

  /**
   * Get all avatars
   */
  getAvatars(): Avatar[] {
    return Array.from(this.avatars.values());
  }

  /**
   * Get avatar by ID
   */
  getAvatar(avatarId: string): Avatar | undefined {
    return this.avatars.get(avatarId);
  }

  /**
   * Navigate avatar to a building
   */
  navigateTo(avatarId: string, buildingId: string): PathResult | null {
    const avatar = this.avatars.get(avatarId);
    if (!avatar) return null;

    // Find destination node for building
    const destNode = HOSPITAL_NODES.find(n => n.buildingId === buildingId);
    if (!destNode) return null;

    // Find nearest node to avatar's current position
    const startNode = this.findNearestNode(avatar.position);
    if (!startNode) return null;

    // Calculate path
    const result = findPath(startNode.id, destNode.id);
    if (!result) return null;

    // Assign path to avatar
    avatar.currentPath = result.path;
    avatar.pathIndex = 0;
    avatar.destinationNodeId = destNode.id;
    avatar.isMoving = true;
    avatar.animation = avatar.type === 'pet' ? 'playing' : 'walking';

    this.notifyPathCalculated(avatar, result);
    
    return result;
  }

  /**
   * Navigate avatar to specific position
   */
  navigateToPosition(avatarId: string, position: Position): PathResult | null {
    const avatar = this.avatars.get(avatarId);
    if (!avatar) return null;

    // Find nearest nodes
    const startNode = this.findNearestNode(avatar.position);
    const endNode = this.findNearestNode(position);
    
    if (!startNode || !endNode) return null;

    const result = findPath(startNode.id, endNode.id);
    if (!result) return null;

    // Add final position if different from last node
    if (result.path.length > 0) {
      const lastPos = result.path[result.path.length - 1];
      if (lastPos.x !== position.x || lastPos.y !== position.y) {
        result.path.push(position);
      }
    }

    avatar.currentPath = result.path;
    avatar.pathIndex = 0;
    avatar.isMoving = true;
    avatar.animation = avatar.type === 'pet' ? 'playing' : 'walking';

    this.notifyPathCalculated(avatar, result);
    
    return result;
  }

  /**
   * Stop avatar movement
   */
  stopAvatar(avatarId: string): void {
    const avatar = this.avatars.get(avatarId);
    if (!avatar) return;

    avatar.isMoving = false;
    avatar.currentPath = [];
    avatar.pathIndex = 0;
    avatar.animation = 'idle';
  }

  /**
   * Start the pathfinding update loop
   */
  start(): void {
    if (this.updateInterval) return;

    this.updateInterval = setInterval(() => {
      this.update();
    }, this.UPDATE_RATE);
  }

  /**
   * Stop the pathfinding update loop
   */
  stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Add event listener
   */
  addListener(listener: PathfindingEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Set random destinations for all avatars (for demo)
   */
  setRandomDestinations(): void {
    const destinations = HOSPITAL_NODES.filter(n => n.type === 'destination');
    
    this.avatars.forEach((avatar) => {
      const randomDest = destinations[Math.floor(Math.random() * destinations.length)];
      if (randomDest.buildingId) {
        this.navigateTo(avatar.id, randomDest.buildingId);
      }
    });
  }

  /**
   * Get path between two buildings (for preview)
   */
  getPathPreview(fromBuildingId: string, toBuildingId: string): PathResult | null {
    const fromNode = HOSPITAL_NODES.find(n => n.buildingId === fromBuildingId);
    const toNode = HOSPITAL_NODES.find(n => n.buildingId === toBuildingId);
    
    if (!fromNode || !toNode) return null;
    
    return findPath(fromNode.id, toNode.id);
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private update(): void {
    const deltaTime = this.UPDATE_RATE / 1000; // Convert to seconds

    this.avatars.forEach((avatar) => {
      if (!avatar.isMoving || avatar.currentPath.length === 0) return;

      const targetPos = avatar.currentPath[avatar.pathIndex];
      if (!targetPos) {
        this.handleArrival(avatar);
        return;
      }

      // Calculate movement
      const dx = targetPos.x - avatar.position.x;
      const dy = targetPos.y - avatar.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 0.5) {
        // Reached waypoint
        avatar.pathIndex++;
        
        if (avatar.pathIndex >= avatar.currentPath.length) {
          this.handleArrival(avatar);
        }
        return;
      }

      // Move towards target
      const moveDistance = avatar.speed * deltaTime;
      const ratio = Math.min(moveDistance / distance, 1);

      avatar.position = {
        x: avatar.position.x + dx * ratio,
        y: avatar.position.y + dy * ratio,
      };

      this.notifyAvatarMove(avatar);
      this.checkCollisions(avatar);
    });
  }

  private handleArrival(avatar: Avatar): void {
    avatar.isMoving = false;
    avatar.animation = 'idle';
    avatar.currentPath = [];
    avatar.pathIndex = 0;

    if (avatar.destinationNodeId) {
      this.notifyAvatarArrived(avatar, avatar.destinationNodeId);
      avatar.destinationNodeId = null;
    }

    // After a delay, set a new random destination
    setTimeout(() => {
      if (this.avatars.has(avatar.id)) {
        const destinations = HOSPITAL_NODES.filter(n => n.type === 'destination');
        const randomDest = destinations[Math.floor(Math.random() * destinations.length)];
        if (randomDest.buildingId) {
          this.navigateTo(avatar.id, randomDest.buildingId);
        }
      }
    }, 3000 + Math.random() * 5000); // Wait 3-8 seconds
  }

  private findNearestNode(position: Position): PathNode | null {
    let nearest: PathNode | null = null;
    let minDistance = Infinity;

    HOSPITAL_NODES.forEach((node) => {
      const distance = heuristic(position, node.position);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = node;
      }
    });

    return nearest;
  }

  private checkCollisions(avatar: Avatar): void {
    this.avatars.forEach((other) => {
      if (other.id === avatar.id) return;

      const distance = heuristic(avatar.position, other.position);
      if (distance < this.COLLISION_RADIUS) {
        this.notifyCollision(avatar, other);
        
        // Simple collision avoidance - nudge apart
        const dx = avatar.position.x - other.position.x;
        const dy = avatar.position.y - other.position.y;
        const nudge = 0.5;
        
        if (distance > 0) {
          avatar.position.x += (dx / distance) * nudge;
          avatar.position.y += (dy / distance) * nudge;
        }
      }
    });
  }

  // ============================================================================
  // NOTIFICATION METHODS
  // ============================================================================

  private notifyAvatarMove(avatar: Avatar): void {
    this.listeners.forEach(l => l.onAvatarMove?.(avatar));
  }

  private notifyAvatarArrived(avatar: Avatar, destinationId: string): void {
    this.listeners.forEach(l => l.onAvatarArrived?.(avatar, destinationId));
  }

  private notifyPathCalculated(avatar: Avatar, path: PathResult): void {
    this.listeners.forEach(l => l.onPathCalculated?.(avatar, path));
  }

  private notifyCollision(avatar1: Avatar, avatar2: Avatar): void {
    this.listeners.forEach(l => l.onCollisionDetected?.(avatar1, avatar2));
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  destroy(): void {
    this.stop();
    this.avatars.clear();
    this.listeners.clear();
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const avatarPathfindingService = new AvatarPathfindingService();
export default avatarPathfindingService;
