/**
 * Path Animation Service - v9.19
 * Provides animated walking dot along route paths on the hospital map.
 * Handles waypoint interpolation, progress tracking, and navigation state.
 */

export interface MapPoint {
  x: number;
  y: number;
}

export interface NavigationStep {
  instruction: string;
  icon: string;
  distance: string;
  distanceMeters: number;
  fromPoint: MapPoint;
  toPoint: MapPoint;
}

export interface NavigationState {
  isActive: boolean;
  isPaused: boolean;
  currentStepIndex: number;
  totalSteps: number;
  progress: number; // 0-1 overall
  stepProgress: number; // 0-1 within current step
  currentPosition: MapPoint;
  distanceRemaining: number;
  etaSeconds: number;
  elapsedSeconds: number;
  destinationId: string;
  destinationName: string;
}

export type NavigationListener = (state: NavigationState) => void;

// Walking speed: ~1.2 m/s average indoor walking
const WALKING_SPEED_MPS = 1.2;
// Map scale: 1% = ~2 meters
const MAP_SCALE = 2;
// Animation tick rate
const TICK_MS = 100;

export class PathAnimationService {
  private static instance: PathAnimationService | null = null;
  private state: NavigationState;
  private steps: NavigationStep[] = [];
  private tickInterval: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<NavigationListener> = new Set();
  private startTime: number = 0;

  constructor() {
    this.state = this.getDefaultState();
  }

  static getInstance(): PathAnimationService {
    if (!PathAnimationService.instance) {
      PathAnimationService.instance = new PathAnimationService();
    }
    return PathAnimationService.instance;
  }

  static resetInstance(): void {
    if (PathAnimationService.instance) {
      PathAnimationService.instance.cancelNavigation();
      PathAnimationService.instance = null;
    }
  }

  private getDefaultState(): NavigationState {
    return {
      isActive: false,
      isPaused: false,
      currentStepIndex: 0,
      totalSteps: 0,
      progress: 0,
      stepProgress: 0,
      currentPosition: { x: 50, y: 85 },
      distanceRemaining: 0,
      etaSeconds: 0,
      elapsedSeconds: 0,
      destinationId: '',
      destinationName: '',
    };
  }

  /**
   * Generate waypoints between two map points for smooth animation.
   */
  private generateWaypoints(from: MapPoint, to: MapPoint): MapPoint[] {
    const points: MapPoint[] = [from];
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const numPoints = Math.max(2, Math.round(distance / 2));

    for (let i = 1; i <= numPoints; i++) {
      const t = i / numPoints;
      // Add slight curve for realistic indoor paths
      const curve = Math.sin(t * Math.PI) * (distance > 20 ? 2 : 0.5);
      points.push({
        x: from.x + dx * t + (dy > 0 ? curve : -curve) * 0.3,
        y: from.y + dy * t + (dx > 0 ? -curve : curve) * 0.3,
      });
    }

    return points;
  }

  /**
   * Build navigation steps from start to destination building.
   */
  buildRoute(
    destinationId: string,
    destinationName: string,
    destinationPosition: MapPoint,
    destinationFloor: string
  ): NavigationStep[] {
    const startPoint: MapPoint = { x: 50, y: 85 }; // Main Entrance
    const steps: NavigationStep[] = [];

    // Step 1: Enter lobby
    const lobbyPoint: MapPoint = { x: 50, y: 72 };
    steps.push({
      instruction: 'Enter through Main Entrance',
      icon: '🚪',
      distance: '15m',
      distanceMeters: 15,
      fromPoint: startPoint,
      toPoint: lobbyPoint,
    });

    // Step 2: Navigate corridor
    const corridorTarget: MapPoint = {
      x: destinationPosition.x,
      y: Math.max(destinationPosition.y, 55),
    };
    const corridorDist = Math.round(
      Math.sqrt(
        Math.pow(corridorTarget.x - lobbyPoint.x, 2) +
        Math.pow(corridorTarget.y - lobbyPoint.y, 2)
      ) * MAP_SCALE
    );

    if (corridorTarget.x < 40) {
      steps.push({
        instruction: 'Turn left at the main corridor',
        icon: '⬅️',
        distance: `${corridorDist}m`,
        distanceMeters: corridorDist,
        fromPoint: lobbyPoint,
        toPoint: corridorTarget,
      });
    } else if (corridorTarget.x > 60) {
      steps.push({
        instruction: 'Turn right at the main corridor',
        icon: '➡️',
        distance: `${corridorDist}m`,
        distanceMeters: corridorDist,
        fromPoint: lobbyPoint,
        toPoint: corridorTarget,
      });
    } else {
      steps.push({
        instruction: 'Continue straight through the corridor',
        icon: '⬆️',
        distance: `${corridorDist}m`,
        distanceMeters: corridorDist,
        fromPoint: lobbyPoint,
        toPoint: corridorTarget,
      });
    }

    // Step 3: Elevator if needed
    if (destinationFloor !== 'Ground') {
      const elevatorPoint: MapPoint = { x: corridorTarget.x, y: corridorTarget.y - 3 };
      steps.push({
        instruction: `Take elevator to ${destinationFloor}`,
        icon: '🛗',
        distance: '',
        distanceMeters: 5,
        fromPoint: corridorTarget,
        toPoint: elevatorPoint,
      });

      // Step 4: Walk to destination from elevator
      const finalDist = Math.round(
        Math.sqrt(
          Math.pow(destinationPosition.x - elevatorPoint.x, 2) +
          Math.pow(destinationPosition.y - elevatorPoint.y, 2)
        ) * MAP_SCALE
      );
      steps.push({
        instruction: `Walk to ${destinationName}`,
        icon: '⬆️',
        distance: `${finalDist}m`,
        distanceMeters: finalDist,
        fromPoint: elevatorPoint,
        toPoint: destinationPosition,
      });
    } else {
      // Walk directly to destination
      const finalDist = Math.round(
        Math.sqrt(
          Math.pow(destinationPosition.x - corridorTarget.x, 2) +
          Math.pow(destinationPosition.y - corridorTarget.y, 2)
        ) * MAP_SCALE
      );
      if (finalDist > 3) {
        steps.push({
          instruction: `Continue to ${destinationName}`,
          icon: '⬆️',
          distance: `${finalDist}m`,
          distanceMeters: finalDist,
          fromPoint: corridorTarget,
          toPoint: destinationPosition,
        });
      }
    }

    // Final step: Arrive
    steps.push({
      instruction: `You have arrived at ${destinationName}`,
      icon: '📍',
      distance: '',
      distanceMeters: 0,
      fromPoint: destinationPosition,
      toPoint: destinationPosition,
    });

    return steps;
  }

  /**
   * Start navigation to a destination.
   */
  startNavigation(
    destinationId: string,
    destinationName: string,
    destinationPosition: MapPoint,
    destinationFloor: string
  ): void {
    this.cancelNavigation();

    this.steps = this.buildRoute(destinationId, destinationName, destinationPosition, destinationFloor);
    const totalDistance = this.steps.reduce((sum, s) => sum + s.distanceMeters, 0);
    const totalEta = Math.round(totalDistance / WALKING_SPEED_MPS);

    this.state = {
      isActive: true,
      isPaused: false,
      currentStepIndex: 0,
      totalSteps: this.steps.length,
      progress: 0,
      stepProgress: 0,
      currentPosition: { x: 50, y: 85 },
      distanceRemaining: totalDistance,
      etaSeconds: totalEta,
      elapsedSeconds: 0,
      destinationId,
      destinationName,
    };

    this.startTime = Date.now();
    this.startTicking();
    this.notifyListeners();
  }

  /**
   * Pause navigation.
   */
  pauseNavigation(): void {
    if (this.state.isActive && !this.state.isPaused) {
      this.state.isPaused = true;
      this.stopTicking();
      this.notifyListeners();
    }
  }

  /**
   * Resume navigation.
   */
  resumeNavigation(): void {
    if (this.state.isActive && this.state.isPaused) {
      this.state.isPaused = false;
      this.startTicking();
      this.notifyListeners();
    }
  }

  /**
   * Cancel navigation.
   */
  cancelNavigation(): void {
    this.stopTicking();
    this.state = this.getDefaultState();
    this.steps = [];
    this.notifyListeners();
  }

  /**
   * Get current navigation state.
   */
  getState(): NavigationState {
    return { ...this.state };
  }

  /**
   * Get current navigation steps.
   */
  getSteps(): NavigationStep[] {
    return [...this.steps];
  }

  /**
   * Subscribe to navigation state changes.
   */
  subscribe(listener: NavigationListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private startTicking(): void {
    this.stopTicking();
    this.tickInterval = setInterval(() => this.tick(), TICK_MS);
  }

  private stopTicking(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  private tick(): void {
    if (!this.state.isActive || this.state.isPaused) return;

    const totalDistance = this.steps.reduce((sum, s) => sum + s.distanceMeters, 0);
    const elapsed = (Date.now() - this.startTime) / 1000;
    // Speed up animation: 1 real second = 3 simulated seconds
    const simElapsed = elapsed * 3;
    const distanceCovered = simElapsed * WALKING_SPEED_MPS;
    const overallProgress = Math.min(1, distanceCovered / Math.max(1, totalDistance));

    // Find current step
    let accDist = 0;
    let stepIndex = 0;
    let stepProgress = 0;
    for (let i = 0; i < this.steps.length; i++) {
      const stepDist = this.steps[i].distanceMeters;
      if (accDist + stepDist >= distanceCovered) {
        stepIndex = i;
        stepProgress = stepDist > 0 ? (distanceCovered - accDist) / stepDist : 1;
        break;
      }
      accDist += stepDist;
      stepIndex = i;
      stepProgress = 1;
    }

    // Interpolate position
    const step = this.steps[stepIndex];
    if (step) {
      const t = Math.min(1, stepProgress);
      this.state.currentPosition = {
        x: step.fromPoint.x + (step.toPoint.x - step.fromPoint.x) * t,
        y: step.fromPoint.y + (step.toPoint.y - step.fromPoint.y) * t,
      };
    }

    this.state.progress = overallProgress;
    this.state.stepProgress = stepProgress;
    this.state.currentStepIndex = stepIndex;
    this.state.distanceRemaining = Math.max(0, totalDistance - distanceCovered);
    this.state.etaSeconds = Math.max(0, Math.round(this.state.distanceRemaining / WALKING_SPEED_MPS));
    this.state.elapsedSeconds = Math.round(simElapsed);

    this.notifyListeners();

    // Check if arrived
    if (overallProgress >= 1) {
      this.state.currentStepIndex = this.steps.length - 1;
      this.state.progress = 1;
      this.state.distanceRemaining = 0;
      this.state.etaSeconds = 0;
      this.stopTicking();
      this.notifyListeners();
    }
  }

  private notifyListeners(): void {
    const snapshot = { ...this.state };
    this.listeners.forEach(l => l(snapshot));
  }
}
