/**
 * Avatar Navigation Service
 * 
 * Handles avatar movement, collision detection, pathfinding,
 * and interactions within the virtual hospital environment.
 * 
 * Features:
 * - Character movement controls (walk, run, wheelchair, teleport)
 * - Collision detection with buildings and obstacles
 * - A* pathfinding algorithm
 * - Avatar customization
 * - Pet companion following behavior
 * - Accessibility navigation modes
 * - Interaction prompts near NPCs/AI
 */

import {
  Avatar,
  AvatarPosition,
  MovementState,
  PathNode,
  Companion,
  CompanionType,
  HospitalBuilding,
  InteractionPoint,
  kalgoorlieHospitalMapService
} from './kalgoorlie-hospital-map.service';

// ============================================================================
// NAVIGATION TYPES
// ============================================================================

export interface NavigationConfig {
  walkSpeed: number;
  runSpeed: number;
  wheelchairSpeed: number;
  rotationSpeed: number;
  collisionRadius: number;
  interactionRadius: number;
  pathfindingGridSize: number;
}

export interface CollisionResult {
  collided: boolean;
  collidedWith?: string;
  adjustedPosition?: { x: number; y: number };
  collisionType?: 'building' | 'boundary' | 'obstacle' | 'npc';
}

export interface PathfindingResult {
  success: boolean;
  path: PathNode[];
  distance: number;
  estimatedTime: number;
  waypoints: Waypoint[];
}

export interface Waypoint {
  x: number;
  y: number;
  name: string;
  type: 'start' | 'turn' | 'door' | 'elevator' | 'destination' | 'landmark';
  instruction: string;
}

export interface NavigationState {
  avatarId: string;
  isNavigating: boolean;
  currentPath: PathNode[];
  currentNodeIndex: number;
  destination?: { x: number; y: number; buildingId?: string };
  progress: number;
  eta: number;
  pauseReason?: string;
}

export interface MovementInput {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  run: boolean;
  interact: boolean;
}

export interface AvatarCustomization {
  bodyType: 'adult' | 'child' | 'elderly';
  gender: 'male' | 'female' | 'neutral';
  skinTone: string;
  hairStyle: string;
  hairColor: string;
  outfit: string;
  accessories: string[];
  wheelchairUser: boolean;
  assistiveDevice?: 'cane' | 'walker' | 'guide-dog';
}

export interface AccessibilityMode {
  enabled: boolean;
  type: 'standard' | 'wheelchair' | 'visual-impairment' | 'hearing-impairment';
  features: AccessibilityFeature[];
}

export interface AccessibilityFeature {
  id: string;
  name: string;
  enabled: boolean;
  settings: Record<string, unknown>;
}

export interface InteractionPrompt {
  id: string;
  type: 'npc' | 'ai' | 'pet' | 'service' | 'info' | 'quest';
  name: string;
  description: string;
  icon: string;
  position: { x: number; y: number };
  distance: number;
  available: boolean;
  cooldown?: number;
}

// ============================================================================
// AVATAR CUSTOMIZATION OPTIONS
// ============================================================================

export const AVATAR_CUSTOMIZATION_OPTIONS = {
  bodyTypes: ['adult', 'child', 'elderly'] as const,
  genders: ['male', 'female', 'neutral'] as const,
  skinTones: [
    { id: 'fair', color: '#FFE0BD', name: 'Fair' },
    { id: 'light', color: '#F5D0C5', name: 'Light' },
    { id: 'medium', color: '#D4A574', name: 'Medium' },
    { id: 'olive', color: '#C68642', name: 'Olive' },
    { id: 'tan', color: '#8D5524', name: 'Tan' },
    { id: 'brown', color: '#6B4423', name: 'Brown' },
    { id: 'dark', color: '#4A3728', name: 'Dark' }
  ],
  hairStyles: [
    { id: 'short', name: 'Short', icon: '💇' },
    { id: 'medium', name: 'Medium', icon: '💇‍♀️' },
    { id: 'long', name: 'Long', icon: '👩‍🦰' },
    { id: 'curly', name: 'Curly', icon: '👨‍🦱' },
    { id: 'bald', name: 'Bald', icon: '👨‍🦲' },
    { id: 'ponytail', name: 'Ponytail', icon: '🧑' },
    { id: 'bun', name: 'Bun', icon: '👩' },
    { id: 'braids', name: 'Braids', icon: '👧' }
  ],
  hairColors: [
    { id: 'black', color: '#1A1A1A', name: 'Black' },
    { id: 'brown', color: '#4A3728', name: 'Brown' },
    { id: 'blonde', color: '#E6C87A', name: 'Blonde' },
    { id: 'red', color: '#8B4513', name: 'Red' },
    { id: 'gray', color: '#808080', name: 'Gray' },
    { id: 'white', color: '#F5F5F5', name: 'White' },
    { id: 'auburn', color: '#A52A2A', name: 'Auburn' }
  ],
  outfits: [
    { id: 'casual', name: 'Casual', description: 'Comfortable everyday wear' },
    { id: 'formal', name: 'Formal', description: 'Professional attire' },
    { id: 'hospital-gown', name: 'Hospital Gown', description: 'Patient attire' },
    { id: 'scrubs', name: 'Scrubs', description: 'Medical staff uniform' },
    { id: 'visitor', name: 'Visitor', description: 'Visitor badge included' },
    { id: 'traditional', name: 'Traditional', description: 'Cultural attire' },
    { id: 'activewear', name: 'Activewear', description: 'Sporty and comfortable' }
  ],
  accessories: [
    { id: 'glasses', name: 'Glasses', icon: '👓' },
    { id: 'sunglasses', name: 'Sunglasses', icon: '🕶️' },
    { id: 'hat', name: 'Hat', icon: '🎩' },
    { id: 'cap', name: 'Cap', icon: '🧢' },
    { id: 'headscarf', name: 'Headscarf', icon: '🧕' },
    { id: 'mask', name: 'Face Mask', icon: '😷' },
    { id: 'hearing-aid', name: 'Hearing Aid', icon: '🦻' },
    { id: 'watch', name: 'Watch', icon: '⌚' },
    { id: 'bracelet', name: 'Hospital Bracelet', icon: '📿' }
  ],
  assistiveDevices: [
    { id: 'none', name: 'None', icon: '' },
    { id: 'wheelchair', name: 'Wheelchair', icon: '🦽' },
    { id: 'motorized-wheelchair', name: 'Motorized Wheelchair', icon: '🦼' },
    { id: 'cane', name: 'Walking Cane', icon: '🦯' },
    { id: 'walker', name: 'Walker', icon: '🚶' },
    { id: 'guide-dog', name: 'Guide Dog', icon: '🦮' },
    { id: 'crutches', name: 'Crutches', icon: '🩼' }
  ]
};

// ============================================================================
// AVATAR NAVIGATION SERVICE
// ============================================================================

export class AvatarNavigationService {
  private config: NavigationConfig;
  private navigationStates: Map<string, NavigationState> = new Map();
  private collisionGrid: boolean[][] = [];
  private gridWidth: number = 100;
  private gridHeight: number = 100;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    this.config = {
      walkSpeed: 3,
      runSpeed: 6,
      wheelchairSpeed: 2.5,
      rotationSpeed: 180,
      collisionRadius: 0.5,
      interactionRadius: 3,
      pathfindingGridSize: 1
    };
    this.initializeCollisionGrid();
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  private initializeCollisionGrid(): void {
    // Initialize empty grid
    this.collisionGrid = Array(this.gridHeight).fill(null).map(() => 
      Array(this.gridWidth).fill(false)
    );

    // Mark building footprints as collision zones
    const buildings = kalgoorlieHospitalMapService.getAllBuildings();
    for (const building of buildings) {
      this.markBuildingCollision(building);
    }
  }

  private markBuildingCollision(building: HospitalBuilding): void {
    const { x, y } = building.position;
    const { width, depth } = building.dimensions;
    
    // Mark building footprint (leaving entrances clear)
    const startX = Math.max(0, Math.floor(x - width / 2));
    const endX = Math.min(this.gridWidth - 1, Math.floor(x + width / 2));
    const startY = Math.max(0, Math.floor(y - depth / 2));
    const endY = Math.min(this.gridHeight - 1, Math.floor(y + depth / 2));

    for (let gx = startX; gx <= endX; gx++) {
      for (let gy = startY; gy <= endY; gy++) {
        // Check if this is an entrance
        const isEntrance = building.entrances.some(e => 
          Math.abs(e.position.x - gx) < 2 && Math.abs(e.position.y - gy) < 2
        );
        if (!isEntrance) {
          this.collisionGrid[gy][gx] = true;
        }
      }
    }
  }

  // ============================================================================
  // MOVEMENT CONTROLS
  // ============================================================================

  /**
   * Process movement input for an avatar
   */
  processMovementInput(avatarId: string, input: MovementInput, deltaTime: number): AvatarPosition | null {
    const avatar = kalgoorlieHospitalMapService.getAvatar(avatarId);
    if (!avatar) return null;

    const speed = input.run ? this.config.runSpeed : this.config.walkSpeed;
    let dx = 0;
    let dy = 0;

    // Calculate movement direction
    if (input.forward) dy -= 1;
    if (input.backward) dy += 1;
    if (input.left) dx -= 1;
    if (input.right) dx += 1;

    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
      const magnitude = Math.sqrt(dx * dx + dy * dy);
      dx /= magnitude;
      dy /= magnitude;
    }

    // Apply speed and delta time
    dx *= speed * deltaTime;
    dy *= speed * deltaTime;

    // Calculate new position
    const newX = avatar.position.x + dx;
    const newY = avatar.position.y + dy;

    // Check collision
    const collision = this.checkCollision(newX, newY, this.config.collisionRadius);
    
    if (!collision.collided) {
      // Update avatar position
      avatar.position.x = newX;
      avatar.position.y = newY;
      
      // Update rotation based on movement direction
      if (dx !== 0 || dy !== 0) {
        avatar.position.rotation = Math.atan2(dy, dx) * (180 / Math.PI);
      }

      // Update companions
      this.updateCompanionPositions(avatar);

      this.emit('avatar-moved', { avatarId, position: avatar.position });
    } else if (collision.adjustedPosition) {
      // Use adjusted position (slide along wall)
      avatar.position.x = collision.adjustedPosition.x;
      avatar.position.y = collision.adjustedPosition.y;
      
      this.emit('avatar-collision', { avatarId, collision });
    }

    // Check for interactions if interact button pressed
    if (input.interact) {
      this.checkAndTriggerInteractions(avatarId);
    }

    return avatar.position;
  }

  /**
   * Move avatar using joystick/analog input
   */
  processAnalogInput(avatarId: string, axisX: number, axisY: number, deltaTime: number): AvatarPosition | null {
    const avatar = kalgoorlieHospitalMapService.getAvatar(avatarId);
    if (!avatar) return null;

    // Apply deadzone
    const deadzone = 0.1;
    if (Math.abs(axisX) < deadzone) axisX = 0;
    if (Math.abs(axisY) < deadzone) axisY = 0;

    // Calculate speed based on stick magnitude
    const magnitude = Math.min(1, Math.sqrt(axisX * axisX + axisY * axisY));
    const speed = this.config.walkSpeed * magnitude;

    // Normalize direction
    let dx = axisX;
    let dy = axisY;
    if (magnitude > 0) {
      dx /= magnitude;
      dy /= magnitude;
    }

    // Apply movement
    dx *= speed * deltaTime;
    dy *= speed * deltaTime;

    const newX = avatar.position.x + dx;
    const newY = avatar.position.y + dy;

    const collision = this.checkCollision(newX, newY, this.config.collisionRadius);
    
    if (!collision.collided) {
      avatar.position.x = newX;
      avatar.position.y = newY;
      
      if (magnitude > 0) {
        avatar.position.rotation = Math.atan2(dy, dx) * (180 / Math.PI);
      }

      this.updateCompanionPositions(avatar);
      this.emit('avatar-moved', { avatarId, position: avatar.position });
    }

    return avatar.position;
  }

  // ============================================================================
  // COLLISION DETECTION
  // ============================================================================

  /**
   * Check collision at position
   */
  checkCollision(x: number, y: number, radius: number): CollisionResult {
    // Check map boundaries
    const bounds = kalgoorlieHospitalMapService.getMapBounds();
    if (x - radius < bounds.minX || x + radius > bounds.maxX ||
        y - radius < bounds.minY || y + radius > bounds.maxY) {
      return {
        collided: true,
        collisionType: 'boundary',
        adjustedPosition: {
          x: Math.max(bounds.minX + radius, Math.min(bounds.maxX - radius, x)),
          y: Math.max(bounds.minY + radius, Math.min(bounds.maxY - radius, y))
        }
      };
    }

    // Check grid collision
    const gridX = Math.floor(x);
    const gridY = Math.floor(y);

    // Check surrounding cells
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const checkX = gridX + dx;
        const checkY = gridY + dy;
        
        if (checkX >= 0 && checkX < this.gridWidth &&
            checkY >= 0 && checkY < this.gridHeight &&
            this.collisionGrid[checkY][checkX]) {
          
          // Find which building we collided with
          const buildings = kalgoorlieHospitalMapService.getAllBuildings();
          for (const building of buildings) {
            const bx = building.position.x;
            const by = building.position.y;
            const hw = building.dimensions.width / 2;
            const hd = building.dimensions.depth / 2;
            
            if (x >= bx - hw && x <= bx + hw && y >= by - hd && y <= by + hd) {
              // Calculate slide direction
              const slideX = x < bx ? bx - hw - radius : bx + hw + radius;
              const slideY = y < by ? by - hd - radius : by + hd + radius;
              
              return {
                collided: true,
                collidedWith: building.id,
                collisionType: 'building',
                adjustedPosition: {
                  x: Math.abs(x - slideX) < Math.abs(y - slideY) ? slideX : x,
                  y: Math.abs(y - slideY) < Math.abs(x - slideX) ? slideY : y
                }
              };
            }
          }
        }
      }
    }

    return { collided: false };
  }

  // ============================================================================
  // PATHFINDING (A* Algorithm)
  // ============================================================================

  /**
   * Find path between two points using A* algorithm
   */
  findPath(startX: number, startY: number, endX: number, endY: number): PathfindingResult {
    const gridSize = this.config.pathfindingGridSize;
    
    // Convert to grid coordinates
    const startNode = { x: Math.floor(startX / gridSize), y: Math.floor(startY / gridSize) };
    const endNode = { x: Math.floor(endX / gridSize), y: Math.floor(endY / gridSize) };

    // A* implementation
    const openSet: AStarNode[] = [];
    const closedSet = new Set<string>();
    const cameFrom = new Map<string, AStarNode>();

    const startAStarNode: AStarNode = {
      x: startNode.x,
      y: startNode.y,
      g: 0,
      h: this.heuristic(startNode.x, startNode.y, endNode.x, endNode.y),
      f: 0
    };
    startAStarNode.f = startAStarNode.g + startAStarNode.h;
    openSet.push(startAStarNode);

    while (openSet.length > 0) {
      // Get node with lowest f score
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift()!;
      const currentKey = `${current.x},${current.y}`;

      // Check if we reached the goal
      if (current.x === endNode.x && current.y === endNode.y) {
        return this.reconstructPath(cameFrom, current, gridSize, startX, startY, endX, endY);
      }

      closedSet.add(currentKey);

      // Check neighbors
      const neighbors = this.getNeighbors(current.x, current.y);
      for (const neighbor of neighbors) {
        const neighborKey = `${neighbor.x},${neighbor.y}`;
        
        if (closedSet.has(neighborKey)) continue;
        if (this.isBlocked(neighbor.x, neighbor.y)) continue;

        const tentativeG = current.g + this.distance(current.x, current.y, neighbor.x, neighbor.y);
        
        const existingNode = openSet.find(n => n.x === neighbor.x && n.y === neighbor.y);
        
        if (!existingNode) {
          const newNode: AStarNode = {
            x: neighbor.x,
            y: neighbor.y,
            g: tentativeG,
            h: this.heuristic(neighbor.x, neighbor.y, endNode.x, endNode.y),
            f: 0
          };
          newNode.f = newNode.g + newNode.h;
          openSet.push(newNode);
          cameFrom.set(neighborKey, current);
        } else if (tentativeG < existingNode.g) {
          existingNode.g = tentativeG;
          existingNode.f = existingNode.g + existingNode.h;
          cameFrom.set(neighborKey, current);
        }
      }
    }

    // No path found
    return {
      success: false,
      path: [],
      distance: 0,
      estimatedTime: 0,
      waypoints: []
    };
  }

  private heuristic(x1: number, y1: number, x2: number, y2: number): number {
    // Manhattan distance with diagonal movement
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }

  private distance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }

  private getNeighbors(x: number, y: number): { x: number; y: number }[] {
    const neighbors: { x: number; y: number }[] = [];
    const directions = [
      { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 },
      { x: -1, y: -1 }, { x: 1, y: -1 }, { x: -1, y: 1 }, { x: 1, y: 1 }
    ];

    for (const dir of directions) {
      const nx = x + dir.x;
      const ny = y + dir.y;
      if (nx >= 0 && nx < this.gridWidth && ny >= 0 && ny < this.gridHeight) {
        neighbors.push({ x: nx, y: ny });
      }
    }

    return neighbors;
  }

  private isBlocked(x: number, y: number): boolean {
    if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) {
      return true;
    }
    return this.collisionGrid[y][x];
  }

  private reconstructPath(
    cameFrom: Map<string, AStarNode>,
    current: AStarNode,
    gridSize: number,
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ): PathfindingResult {
    const path: PathNode[] = [];
    const waypoints: Waypoint[] = [];
    
    let node: AStarNode | undefined = current;
    while (node) {
      path.unshift({
        x: node.x * gridSize + gridSize / 2,
        y: node.y * gridSize + gridSize / 2,
        z: 0
      });
      node = cameFrom.get(`${node.x},${node.y}`);
    }

    // Add exact start and end points
    if (path.length > 0) {
      path[0] = { x: startX, y: startY, z: 0 };
      path[path.length - 1] = { x: endX, y: endY, z: 0 };
    }

    // Simplify path (remove unnecessary nodes)
    const simplifiedPath = this.simplifyPath(path);

    // Calculate total distance
    let totalDistance = 0;
    for (let i = 1; i < simplifiedPath.length; i++) {
      totalDistance += this.distance(
        simplifiedPath[i - 1].x, simplifiedPath[i - 1].y,
        simplifiedPath[i].x, simplifiedPath[i].y
      );
    }

    // Generate waypoints with instructions
    waypoints.push({
      x: startX, y: startY,
      name: 'Start',
      type: 'start',
      instruction: 'Begin navigation'
    });

    for (let i = 1; i < simplifiedPath.length - 1; i++) {
      const prev = simplifiedPath[i - 1];
      const curr = simplifiedPath[i];
      const next = simplifiedPath[i + 1];

      // Calculate turn direction
      const angle1 = Math.atan2(curr.y - prev.y, curr.x - prev.x);
      const angle2 = Math.atan2(next.y - curr.y, next.x - curr.x);
      const turnAngle = (angle2 - angle1) * (180 / Math.PI);

      let instruction = 'Continue straight';
      if (turnAngle > 30) instruction = 'Turn right';
      else if (turnAngle < -30) instruction = 'Turn left';

      waypoints.push({
        x: curr.x, y: curr.y,
        name: `Waypoint ${i}`,
        type: 'turn',
        instruction
      });
    }

    waypoints.push({
      x: endX, y: endY,
      name: 'Destination',
      type: 'destination',
      instruction: 'You have arrived'
    });

    return {
      success: true,
      path: simplifiedPath,
      distance: totalDistance,
      estimatedTime: totalDistance / this.config.walkSpeed,
      waypoints
    };
  }

  private simplifyPath(path: PathNode[]): PathNode[] {
    if (path.length <= 2) return path;

    const simplified: PathNode[] = [path[0]];
    let lastDirection = { x: 0, y: 0 };

    for (let i = 1; i < path.length; i++) {
      const dx = path[i].x - path[i - 1].x;
      const dy = path[i].y - path[i - 1].y;
      
      // Check if direction changed significantly
      if (Math.abs(dx - lastDirection.x) > 0.1 || Math.abs(dy - lastDirection.y) > 0.1) {
        simplified.push(path[i - 1]);
        lastDirection = { x: dx, y: dy };
      }
    }

    simplified.push(path[path.length - 1]);
    return simplified;
  }

  // ============================================================================
  // NAVIGATION TO BUILDING
  // ============================================================================

  /**
   * Navigate avatar to a building entrance
   */
  navigateToBuilding(avatarId: string, buildingId: string): NavigationState | null {
    const avatar = kalgoorlieHospitalMapService.getAvatar(avatarId);
    const building = kalgoorlieHospitalMapService.getBuilding(buildingId);
    
    if (!avatar || !building) return null;

    // Find nearest entrance
    let nearestEntrance = building.entrances[0];
    let minDistance = Infinity;

    for (const entrance of building.entrances) {
      const dist = this.distance(
        avatar.position.x, avatar.position.y,
        entrance.position.x, entrance.position.y
      );
      if (dist < minDistance) {
        minDistance = dist;
        nearestEntrance = entrance;
      }
    }

    // Find path to entrance
    const pathResult = this.findPath(
      avatar.position.x, avatar.position.y,
      nearestEntrance.position.x, nearestEntrance.position.y
    );

    if (!pathResult.success) return null;

    const state: NavigationState = {
      avatarId,
      isNavigating: true,
      currentPath: pathResult.path,
      currentNodeIndex: 0,
      destination: {
        x: nearestEntrance.position.x,
        y: nearestEntrance.position.y,
        buildingId
      },
      progress: 0,
      eta: pathResult.estimatedTime
    };

    this.navigationStates.set(avatarId, state);
    this.emit('navigation-started', { avatarId, buildingId, path: pathResult });

    return state;
  }

  /**
   * Update navigation progress
   */
  updateNavigation(avatarId: string, deltaTime: number): NavigationState | null {
    const state = this.navigationStates.get(avatarId);
    if (!state || !state.isNavigating) return null;

    const avatar = kalgoorlieHospitalMapService.getAvatar(avatarId);
    if (!avatar) return null;

    const currentNode = state.currentPath[state.currentNodeIndex];
    const nextNode = state.currentPath[state.currentNodeIndex + 1];

    if (!nextNode) {
      // Reached destination
      state.isNavigating = false;
      state.progress = 100;
      this.emit('navigation-complete', { avatarId, destination: state.destination });
      return state;
    }

    // Move towards next node
    const dx = nextNode.x - avatar.position.x;
    const dy = nextNode.y - avatar.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 0.5) {
      // Reached node, move to next
      state.currentNodeIndex++;
      state.progress = (state.currentNodeIndex / state.currentPath.length) * 100;
    } else {
      // Move towards node
      const speed = this.config.walkSpeed * deltaTime;
      avatar.position.x += (dx / distance) * Math.min(speed, distance);
      avatar.position.y += (dy / distance) * Math.min(speed, distance);
      avatar.position.rotation = Math.atan2(dy, dx) * (180 / Math.PI);

      this.updateCompanionPositions(avatar);
    }

    return state;
  }

  /**
   * Cancel navigation
   */
  cancelNavigation(avatarId: string): void {
    const state = this.navigationStates.get(avatarId);
    if (state) {
      state.isNavigating = false;
      state.pauseReason = 'cancelled';
      this.emit('navigation-cancelled', { avatarId });
    }
  }

  // ============================================================================
  // COMPANION MANAGEMENT
  // ============================================================================

  private updateCompanionPositions(avatar: Avatar): void {
    for (const companion of avatar.companions) {
      // Calculate follow position behind avatar
      const followAngle = (avatar.position.rotation + 180) * (Math.PI / 180);
      const followDistance = 1.5;

      const targetX = avatar.position.x + Math.cos(followAngle) * followDistance;
      const targetY = avatar.position.y + Math.sin(followAngle) * followDistance;

      // Smooth movement towards target
      const dx = targetX - companion.position.x;
      const dy = targetY - companion.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 0.1) {
        const moveSpeed = 0.1;
        companion.position.x += (dx / distance) * Math.min(moveSpeed, distance);
        companion.position.y += (dy / distance) * Math.min(moveSpeed, distance);
      }
    }
  }

  // ============================================================================
  // INTERACTION SYSTEM
  // ============================================================================

  /**
   * Get nearby interaction prompts
   */
  getNearbyInteractions(avatarId: string): InteractionPrompt[] {
    const avatar = kalgoorlieHospitalMapService.getAvatar(avatarId);
    if (!avatar) return [];

    const prompts: InteractionPrompt[] = [];
    const interactionPoints = kalgoorlieHospitalMapService.getInteractionPointsNear(
      avatar.position.x,
      avatar.position.y,
      this.config.interactionRadius
    );

    for (const point of interactionPoints) {
      const distance = this.distance(
        avatar.position.x, avatar.position.y,
        point.position.x, point.position.y
      );

      prompts.push({
        id: point.id,
        type: this.mapInteractionType(point.type),
        name: point.name,
        description: `Interact with ${point.name}`,
        icon: this.getInteractionIcon(point.type),
        position: { x: point.position.x, y: point.position.y },
        distance,
        available: distance <= point.triggerRadius
      });
    }

    return prompts.sort((a, b) => a.distance - b.distance);
  }

  private mapInteractionType(type: string): InteractionPrompt['type'] {
    const mapping: Record<string, InteractionPrompt['type']> = {
      'npc-staff': 'npc',
      'npc-patient': 'npc',
      'ai-assistant': 'ai',
      'pet-companion': 'pet',
      'info-kiosk': 'info',
      'quest-giver': 'quest',
      'service-point': 'service',
      'emergency-button': 'service',
      'wayfinding': 'info',
      'storyboard-trigger': 'info'
    };
    return mapping[type] || 'info';
  }

  private getInteractionIcon(type: string): string {
    const icons: Record<string, string> = {
      'npc-staff': '👨‍⚕️',
      'npc-patient': '🧑',
      'ai-assistant': '🤖',
      'pet-companion': '🐕',
      'info-kiosk': 'ℹ️',
      'quest-giver': '❗',
      'service-point': '🏥',
      'emergency-button': '🚨',
      'wayfinding': '🧭',
      'storyboard-trigger': '📖'
    };
    return icons[type] || '💬';
  }

  private checkAndTriggerInteractions(avatarId: string): void {
    const prompts = this.getNearbyInteractions(avatarId);
    const availablePrompts = prompts.filter(p => p.available);

    if (availablePrompts.length > 0) {
      const nearest = availablePrompts[0];
      kalgoorlieHospitalMapService.triggerInteraction(avatarId, nearest.id);
    }
  }

  // ============================================================================
  // ACCESSIBILITY
  // ============================================================================

  /**
   * Enable accessibility mode
   */
  enableAccessibilityMode(avatarId: string, mode: AccessibilityMode['type']): AccessibilityMode {
    const features: AccessibilityFeature[] = [];

    switch (mode) {
      case 'wheelchair':
        features.push(
          { id: 'wheelchair-paths', name: 'Wheelchair-Accessible Paths', enabled: true, settings: {} },
          { id: 'ramp-priority', name: 'Prioritize Ramps', enabled: true, settings: {} },
          { id: 'accessible-entrances', name: 'Use Accessible Entrances', enabled: true, settings: {} },
          { id: 'elevator-routing', name: 'Route via Elevators', enabled: true, settings: {} }
        );
        this.config.walkSpeed = this.config.wheelchairSpeed;
        break;

      case 'visual-impairment':
        features.push(
          { id: 'audio-descriptions', name: 'Audio Descriptions', enabled: true, settings: { volume: 1.0 } },
          { id: 'high-contrast', name: 'High Contrast Mode', enabled: true, settings: {} },
          { id: 'voice-navigation', name: 'Voice Navigation', enabled: true, settings: {} },
          { id: 'haptic-feedback', name: 'Enhanced Haptic Feedback', enabled: true, settings: { intensity: 1.0 } }
        );
        break;

      case 'hearing-impairment':
        features.push(
          { id: 'visual-alerts', name: 'Visual Alerts', enabled: true, settings: {} },
          { id: 'captions', name: 'Closed Captions', enabled: true, settings: {} },
          { id: 'sign-language', name: 'Sign Language Avatars', enabled: true, settings: {} },
          { id: 'vibration-alerts', name: 'Vibration Alerts', enabled: true, settings: {} }
        );
        break;

      default:
        features.push(
          { id: 'standard-navigation', name: 'Standard Navigation', enabled: true, settings: {} }
        );
    }

    const accessibilityMode: AccessibilityMode = {
      enabled: true,
      type: mode,
      features
    };

    this.emit('accessibility-mode-changed', { avatarId, mode: accessibilityMode });
    return accessibilityMode;
  }

  // ============================================================================
  // AVATAR CUSTOMIZATION
  // ============================================================================

  /**
   * Customize avatar appearance
   */
  customizeAvatar(avatarId: string, customization: Partial<AvatarCustomization>): boolean {
    const avatar = kalgoorlieHospitalMapService.getAvatar(avatarId);
    if (!avatar) return false;

    if (customization.bodyType) avatar.appearance.bodyType = customization.bodyType;
    if (customization.gender) avatar.appearance.gender = customization.gender;
    if (customization.skinTone) avatar.appearance.skinTone = customization.skinTone;
    if (customization.hairStyle) avatar.appearance.hairStyle = customization.hairStyle;
    if (customization.hairColor) avatar.appearance.hairColor = customization.hairColor;
    if (customization.outfit) avatar.appearance.outfit = customization.outfit;
    if (customization.accessories) avatar.appearance.accessories = customization.accessories;

    // Handle wheelchair user
    if (customization.wheelchairUser !== undefined) {
      avatar.movement.movementType = customization.wheelchairUser ? 'wheelchair' : 'walk';
    }

    this.emit('avatar-customized', { avatarId, customization });
    return true;
  }

  /**
   * Get customization options
   */
  getCustomizationOptions(): typeof AVATAR_CUSTOMIZATION_OPTIONS {
    return AVATAR_CUSTOMIZATION_OPTIONS;
  }

  // ============================================================================
  // EVENT SYSTEM
  // ============================================================================

  private emit(event: string, data: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(data));
    }
  }

  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // ============================================================================
  // CONFIGURATION
  // ============================================================================

  /**
   * Update navigation configuration
   */
  updateConfig(config: Partial<NavigationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): NavigationConfig {
    return { ...this.config };
  }
}

// Helper type for A* algorithm
interface AStarNode {
  x: number;
  y: number;
  g: number;
  h: number;
  f: number;
}

// Export singleton instance
export const avatarNavigationService = new AvatarNavigationService();
