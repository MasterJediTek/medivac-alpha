/**
 * Accessible Route Planner Service
 * Plans wheelchair-friendly routes with elevators, ramps, and accessible facilities
 */

import { RouteHistoryEntry } from './route-history.service';
import { accessibilityOverlayService } from './accessibility-overlay.service';

export interface AccessibleRoute extends RouteHistoryEntry {
  accessibilityScore: number; // 0-100
  hasElevators: boolean;
  hasRamps: boolean;
  accessibleRestrooms: number;
  parkingSpaces: number;
  wheelchairWidth: number; // in cm
  estimatedAccessibleTime: number; // in seconds
  accessibilityNotes: string[];
  warnings: string[];
  alternativeRoutes: AccessibleRoute[];
}

export interface AccessibilityCheckpoint {
  location: string;
  lat: number;
  lng: number;
  type: 'elevator' | 'ramp' | 'restroom' | 'parking' | 'entrance' | 'assistance';
  isOperational: boolean;
  width?: number;
  capacity?: number;
  notes?: string;
}

class AccessibleRoutePlannerService {
  private readonly ACCESSIBLE_ROUTES_KEY = 'accessible_routes_cache';

  /**
   * Plan an accessible route between two locations
   */
  async planAccessibleRoute(
    startLocation: string,
    endLocation: string,
    wheelchairWidth: number = 70 // Standard wheelchair width in cm
  ): Promise<AccessibleRoute> {
    // Get base route
    const baseRoute: RouteHistoryEntry = {
      id: 'route_' + Date.now(),
      startLocation,
      endLocation,
      distance: Math.random() * 500 + 100, // Simulated distance in meters
      estimatedTime: Math.random() * 600 + 300, // Simulated time in seconds
      waypoints: this.generateWaypoints(startLocation, endLocation),
      directions: this.generateDirections(startLocation, endLocation),
      timestamp: new Date().toISOString(),
      usageCount: 0,
    };

    // Get accessibility checkpoints along route
    const checkpoints = await this.getAccessibilityCheckpoints(baseRoute.waypoints);
    
    // Calculate accessibility score
    const accessibilityScore = this.calculateAccessibilityScore(checkpoints, wheelchairWidth);
    
    // Check for warnings
    const warnings = this.checkAccessibilityWarnings(checkpoints, wheelchairWidth);
    
    // Generate accessibility notes
    const accessibilityNotes = this.generateAccessibilityNotes(checkpoints);

    // Count facilities
    const hasElevators = checkpoints.some(c => c.type === 'elevator' && c.isOperational);
    const hasRamps = checkpoints.some(c => c.type === 'ramp' && c.isOperational);
    const accessibleRestrooms = checkpoints.filter(c => c.type === 'restroom' && c.isOperational).length;
    const parkingSpaces = checkpoints
      .filter(c => c.type === 'parking' && c.isOperational)
      .reduce((sum, c) => sum + (c.capacity || 0), 0);

    // Adjust time for accessibility constraints
    const estimatedAccessibleTime = this.adjustTimeForAccessibility(
      baseRoute.estimatedTime,
      accessibilityScore,
      warnings.length
    );

    const accessibleRoute: AccessibleRoute = {
      ...baseRoute,
      accessibilityScore,
      hasElevators,
      hasRamps,
      accessibleRestrooms,
      parkingSpaces,
      wheelchairWidth,
      estimatedAccessibleTime,
      accessibilityNotes,
      warnings,
      alternativeRoutes: await this.generateAlternativeAccessibleRoutes(
        startLocation,
        endLocation,
        wheelchairWidth,
        accessibleRoute
      ),
    };

    return accessibleRoute;
  }

  /**
   * Get accessibility checkpoints along a route
   */
  private async getAccessibilityCheckpoints(waypoints: Array<{ lat: number; lng: number; name: string }>): Promise<AccessibilityCheckpoint[]> {
    const checkpoints: AccessibilityCheckpoint[] = [];
    
    // Get all accessibility features from the overlay service
    const allFeatures = accessibilityOverlayService.getAllFeatures();
    
    // Filter features near waypoints (within 50 meters)
    for (const waypoint of waypoints) {
      const nearbyFeatures = allFeatures.filter(feature => {
        const distance = Math.sqrt(
          Math.pow(feature.lat - waypoint.lat, 2) + Math.pow(feature.lng - waypoint.lng, 2)
        ) * 111000; // Rough conversion to meters
        return distance < 50;
      });

      for (const feature of nearbyFeatures) {
        checkpoints.push({
          location: feature.name,
          lat: feature.lat,
          lng: feature.lng,
          type: feature.type as any,
          isOperational: feature.isOperational,
          width: feature.width,
          capacity: feature.capacity,
          notes: feature.notes,
        });
      }
    }

    return checkpoints;
  }

  /**
   * Calculate accessibility score (0-100)
   */
  private calculateAccessibilityScore(
    checkpoints: AccessibilityCheckpoint[],
    wheelchairWidth: number
  ): number {
    if (checkpoints.length === 0) return 0;

    let score = 50; // Base score

    // Add points for facilities
    const elevators = checkpoints.filter(c => c.type === 'elevator' && c.isOperational).length;
    const ramps = checkpoints.filter(c => c.type === 'ramp' && c.isOperational).length;
    const restrooms = checkpoints.filter(c => c.type === 'restroom' && c.isOperational).length;

    score += Math.min(elevators * 10, 20);
    score += Math.min(ramps * 5, 15);
    score += Math.min(restrooms * 3, 10);

    // Subtract points for width constraints
    const narrowPassages = checkpoints.filter(c => c.width && c.width < wheelchairWidth).length;
    score -= narrowPassages * 5;

    // Subtract points for non-operational facilities
    const nonOperational = checkpoints.filter(c => !c.isOperational).length;
    score -= nonOperational * 2;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Check for accessibility warnings
   */
  private checkAccessibilityWarnings(
    checkpoints: AccessibilityCheckpoint[],
    wheelchairWidth: number
  ): string[] {
    const warnings: string[] = [];

    // Check for narrow passages
    const narrowPassages = checkpoints.filter(c => c.width && c.width < wheelchairWidth);
    if (narrowPassages.length > 0) {
      warnings.push(`${narrowPassages.length} narrow passages may be difficult for wheelchair`);
    }

    // Check for non-operational elevators
    const brokenElevators = checkpoints.filter(c => c.type === 'elevator' && !c.isOperational);
    if (brokenElevators.length > 0) {
      warnings.push(`${brokenElevators.length} elevator(s) currently out of service`);
    }

    // Check for missing ramps
    const missingRamps = checkpoints.filter(c => c.type === 'ramp' && !c.isOperational);
    if (missingRamps.length > 0) {
      warnings.push(`${missingRamps.length} ramp(s) currently unavailable`);
    }

    // Check for parking availability
    const parking = checkpoints.find(c => c.type === 'parking');
    if (!parking) {
      warnings.push('No accessible parking found on this route');
    }

    return warnings;
  }

  /**
   * Generate accessibility notes
   */
  private generateAccessibilityNotes(checkpoints: AccessibilityCheckpoint[]): string[] {
    const notes: string[] = [];

    const elevators = checkpoints.filter(c => c.type === 'elevator' && c.isOperational);
    if (elevators.length > 0) {
      notes.push(`${elevators.length} elevator(s) available on route`);
    }

    const ramps = checkpoints.filter(c => c.type === 'ramp' && c.isOperational);
    if (ramps.length > 0) {
      notes.push(`${ramps.length} ramp(s) available for level changes`);
    }

    const restrooms = checkpoints.filter(c => c.type === 'restroom' && c.isOperational);
    if (restrooms.length > 0) {
      notes.push(`${restrooms.length} accessible restroom(s) along route`);
    }

    const assistance = checkpoints.filter(c => c.type === 'assistance' && c.isOperational);
    if (assistance.length > 0) {
      notes.push(`Staff assistance available at ${assistance.length} location(s)`);
    }

    return notes;
  }

  /**
   * Adjust estimated time for accessibility constraints
   */
  private adjustTimeForAccessibility(baseTime: number, accessibilityScore: number, warningCount: number): number {
    // Add time for accessibility constraints
    let adjustedTime = baseTime;

    // Lower accessibility score = more time needed
    const scoreMultiplier = 1 + (100 - accessibilityScore) / 500;
    adjustedTime *= scoreMultiplier;

    // Add time for each warning (30 seconds per warning)
    adjustedTime += warningCount * 30;

    return Math.round(adjustedTime);
  }

  /**
   * Generate alternative accessible routes
   */
  private async generateAlternativeAccessibleRoutes(
    startLocation: string,
    endLocation: string,
    wheelchairWidth: number,
    primaryRoute: AccessibleRoute
  ): Promise<AccessibleRoute[]> {
    // Generate 2 alternative routes with different characteristics
    const alternatives: AccessibleRoute[] = [];

    // Alternative 1: Fastest accessible route
    const fastRoute = { ...primaryRoute };
    fastRoute.id = 'alt_fast_' + Date.now();
    fastRoute.estimatedAccessibleTime = Math.round(primaryRoute.estimatedAccessibleTime * 0.85);
    fastRoute.accessibilityNotes.push('Optimized for speed');
    alternatives.push(fastRoute);

    // Alternative 2: Most accessible route
    const safestRoute = { ...primaryRoute };
    safestRoute.id = 'alt_safest_' + Date.now();
    safestRoute.accessibilityScore = Math.min(100, primaryRoute.accessibilityScore + 15);
    safestRoute.estimatedAccessibleTime = Math.round(primaryRoute.estimatedAccessibleTime * 1.15);
    safestRoute.accessibilityNotes.push('Optimized for maximum accessibility');
    alternatives.push(safestRoute);

    return alternatives;
  }

  /**
   * Generate waypoints between two locations
   */
  private generateWaypoints(start: string, end: string): Array<{ lat: number; lng: number; name: string }> {
    // Simulated waypoints
    const startLat = 40.7 + Math.random() * 0.01;
    const startLng = -74.0 + Math.random() * 0.01;
    const endLat = 40.75 + Math.random() * 0.01;
    const endLng = -73.95 + Math.random() * 0.01;

    return [
      { lat: startLat, lng: startLng, name: start },
      { lat: (startLat + endLat) / 2, lng: (startLng + endLng) / 2, name: 'Midpoint' },
      { lat: endLat, lng: endLng, name: end },
    ];
  }

  /**
   * Generate directions
   */
  private generateDirections(start: string, end: string): string[] {
    return [
      `Start at ${start}`,
      'Head toward main corridor',
      'Use elevator to reach second floor',
      'Turn right at accessible ramp',
      `Arrive at ${end}`,
    ];
  }
}

export const accessibleRoutePlannerService = new AccessibleRoutePlannerService();
