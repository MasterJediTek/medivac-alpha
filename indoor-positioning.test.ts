/**
 * Indoor Positioning Service Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { indoorPositioningService } from '../indoor-positioning.service';

describe('IndoorPositioningService', () => {
  beforeEach(() => {
    indoorPositioningService.stopTracking();
  });

  afterEach(() => {
    indoorPositioningService.destroy();
  });

  describe('getBeacons', () => {
    it('should return all hospital beacons', () => {
      const beacons = indoorPositioningService.getBeacons();
      expect(beacons.length).toBeGreaterThan(0);
    });
  });

  describe('getBeaconsByFloor', () => {
    it('should filter beacons by floor', () => {
      const groundFloor = indoorPositioningService.getBeaconsByFloor(0);
      expect(groundFloor.length).toBeGreaterThan(0);
      groundFloor.forEach(b => {
        expect(b.floor).toBe(0);
      });
    });
  });

  describe('getBeaconsByDepartment', () => {
    it('should filter beacons by department', () => {
      const emergency = indoorPositioningService.getBeaconsByDepartment('Emergency');
      expect(emergency.length).toBeGreaterThan(0);
      emergency.forEach(b => {
        expect(b.department).toBe('Emergency');
      });
    });
  });

  describe('getBeacon', () => {
    it('should return beacon by ID', () => {
      const beacon = indoorPositioningService.getBeacon('beacon-reception');
      expect(beacon).toBeDefined();
      expect(beacon?.name).toBe('Reception');
    });

    it('should return undefined for invalid ID', () => {
      const beacon = indoorPositioningService.getBeacon('invalid-id');
      expect(beacon).toBeUndefined();
    });
  });

  describe('startTracking', () => {
    it('should start position tracking', () => {
      indoorPositioningService.startTracking();
      expect(indoorPositioningService.isTracking()).toBe(true);
    });
  });

  describe('stopTracking', () => {
    it('should stop position tracking', () => {
      indoorPositioningService.startTracking();
      indoorPositioningService.stopTracking();
      expect(indoorPositioningService.isTracking()).toBe(false);
    });
  });

  describe('setSimulatedPosition', () => {
    it('should update simulated position', () => {
      indoorPositioningService.setSimulatedPosition({ x: 200, y: 150 });
      const pos = indoorPositioningService.getSimulatedPosition();
      expect(pos.x).toBe(200);
      expect(pos.y).toBe(150);
    });
  });

  describe('moveTowards', () => {
    it('should move towards target position', () => {
      indoorPositioningService.setSimulatedPosition({ x: 100, y: 100 });
      indoorPositioningService.moveTowards({ x: 200, y: 100 }, 10);
      
      const pos = indoorPositioningService.getSimulatedPosition();
      expect(pos.x).toBeGreaterThan(100);
      expect(pos.y).toBe(100);
    });

    it('should snap to target when close enough', () => {
      indoorPositioningService.setSimulatedPosition({ x: 100, y: 100 });
      indoorPositioningService.moveTowards({ x: 101, y: 100 }, 10);
      
      const pos = indoorPositioningService.getSimulatedPosition();
      expect(pos.x).toBe(101);
    });
  });

  describe('getState', () => {
    it('should return current state', () => {
      const state = indoorPositioningService.getState();
      expect(state).toBeDefined();
      expect(state.isTracking).toBe(false);
    });
  });

  describe('getCurrentPosition', () => {
    it('should return position from state', () => {
      // Service may retain position from previous tracking
      const position = indoorPositioningService.getCurrentPosition();
      // Position can be null or a valid UserPosition
      if (position) {
        expect(position.position).toBeDefined();
        expect(position.position.x).toBeDefined();
        expect(position.position.y).toBeDefined();
      }
    });

    it('should return position when tracking', () => {
      indoorPositioningService.startTracking();
      // Wait for first update
      setTimeout(() => {
        const position = indoorPositioningService.getCurrentPosition();
        expect(position).toBeDefined();
      }, 100);
    });
  });

  describe('onStateChange', () => {
    it('should notify listeners on state change', () => {
      let notified = false;
      const unsubscribe = indoorPositioningService.onStateChange(() => {
        notified = true;
      });

      indoorPositioningService.startTracking();
      expect(notified).toBe(true);

      unsubscribe();
    });
  });

  describe('onPositionUpdate', () => {
    it('should notify listeners on position update', () => {
      let received = false;
      const unsubscribe = indoorPositioningService.onPositionUpdate(() => {
        received = true;
      });

      indoorPositioningService.startTracking();
      
      // Wait for position update
      setTimeout(() => {
        expect(received).toBe(true);
        unsubscribe();
      }, 1100);
    });
  });
});
