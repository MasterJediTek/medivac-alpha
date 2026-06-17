/**
 * Wayfinding Service Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { wayfindingService } from '../wayfinding.service';

describe('WayfindingService', () => {
  beforeEach(() => {
    // Reset state before each test
    wayfindingService.stopNavigation();
  });

  afterEach(() => {
    wayfindingService.destroy();
  });

  describe('getDestinations', () => {
    it('should return all hospital destinations', () => {
      const destinations = wayfindingService.getDestinations();
      expect(destinations.length).toBeGreaterThan(0);
      expect(destinations.some(d => d.id === 'dest-emergency')).toBe(true);
      expect(destinations.some(d => d.id === 'dest-maternity')).toBe(true);
    });
  });

  describe('getDestinationsByCategory', () => {
    it('should filter destinations by emergency category', () => {
      const emergencies = wayfindingService.getDestinationsByCategory('emergency');
      expect(emergencies.length).toBeGreaterThan(0);
      emergencies.forEach(d => {
        expect(d.category).toBe('emergency');
      });
    });

    it('should filter destinations by department category', () => {
      const departments = wayfindingService.getDestinationsByCategory('department');
      expect(departments.length).toBeGreaterThan(0);
      departments.forEach(d => {
        expect(d.category).toBe('department');
      });
    });
  });

  describe('searchDestinations', () => {
    it('should find destinations by name', () => {
      const results = wayfindingService.searchDestinations('emergency');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(d => d.name.toLowerCase().includes('emergency'))).toBe(true);
    });

    it('should find destinations by description', () => {
      const results = wayfindingService.searchDestinations('blood');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return empty array for no matches', () => {
      const results = wayfindingService.searchDestinations('xyznonexistent');
      expect(results).toEqual([]);
    });
  });

  describe('getDestination', () => {
    it('should return destination by ID', () => {
      const dest = wayfindingService.getDestination('dest-emergency');
      expect(dest).toBeDefined();
      expect(dest?.name).toBe('Emergency Department');
    });

    it('should return undefined for invalid ID', () => {
      const dest = wayfindingService.getDestination('invalid-id');
      expect(dest).toBeUndefined();
    });
  });

  describe('setCurrentPosition', () => {
    it('should update current position', () => {
      wayfindingService.setCurrentPosition({ x: 150, y: 100 });
      const state = wayfindingService.getState();
      expect(state.currentPosition).toEqual({ x: 150, y: 100 });
    });
  });

  describe('selectDestination', () => {
    it('should calculate route to destination', () => {
      wayfindingService.setCurrentPosition({ x: 100, y: 50 });
      const route = wayfindingService.selectDestination('dest-emergency');
      
      expect(route).toBeDefined();
      expect(route?.destination.id).toBe('dest-emergency');
      expect(route?.path.length).toBeGreaterThan(0);
      expect(route?.steps.length).toBeGreaterThan(0);
      expect(route?.totalDistance).toBeGreaterThan(0);
      expect(route?.estimatedTime).toBeGreaterThan(0);
    });

    it('should return null for invalid destination', () => {
      const route = wayfindingService.selectDestination('invalid-id');
      expect(route).toBeNull();
    });

    it('should update state with active route', () => {
      wayfindingService.selectDestination('dest-maternity');
      const state = wayfindingService.getState();
      expect(state.activeRoute).toBeDefined();
      expect(state.selectedDestination?.id).toBe('dest-maternity');
    });
  });

  describe('navigation', () => {
    it('should start navigation', () => {
      wayfindingService.selectDestination('dest-pharmacy');
      wayfindingService.startNavigation();
      
      const state = wayfindingService.getState();
      expect(state.isNavigating).toBe(true);
      expect(state.currentStepIndex).toBe(0);
    });

    it('should advance to next step', () => {
      wayfindingService.selectDestination('dest-cafeteria');
      wayfindingService.startNavigation();
      wayfindingService.nextStep();
      
      const state = wayfindingService.getState();
      expect(state.currentStepIndex).toBe(1);
    });

    it('should go back to previous step', () => {
      wayfindingService.selectDestination('dest-radiology');
      wayfindingService.startNavigation();
      wayfindingService.nextStep();
      wayfindingService.previousStep();
      
      const state = wayfindingService.getState();
      expect(state.currentStepIndex).toBe(0);
    });

    it('should stop navigation', () => {
      wayfindingService.selectDestination('dest-pathology');
      wayfindingService.startNavigation();
      wayfindingService.stopNavigation();
      
      const state = wayfindingService.getState();
      expect(state.isNavigating).toBe(false);
      expect(state.activeRoute).toBeNull();
      expect(state.selectedDestination).toBeNull();
    });
  });

  describe('formatting', () => {
    it('should format time in seconds', () => {
      expect(wayfindingService.formatTime(30)).toBe('30 sec');
    });

    it('should format time in minutes', () => {
      expect(wayfindingService.formatTime(120)).toBe('2 min');
    });

    it('should format time in minutes and seconds', () => {
      expect(wayfindingService.formatTime(90)).toBe('1 min 30 sec');
    });

    it('should format distance in meters', () => {
      expect(wayfindingService.formatDistance(50)).toBe('50 m');
    });

    it('should round distance to nearest 10 for larger values', () => {
      expect(wayfindingService.formatDistance(123)).toBe('120 m');
    });
  });

  describe('state listeners', () => {
    it('should notify listeners on state change', () => {
      let notified = false;
      const unsubscribe = wayfindingService.onStateChange(() => {
        notified = true;
      });

      wayfindingService.setCurrentPosition({ x: 200, y: 200 });
      expect(notified).toBe(true);

      unsubscribe();
    });

    it('should stop notifying after unsubscribe', () => {
      let count = 0;
      const unsubscribe = wayfindingService.onStateChange(() => {
        count++;
      });

      wayfindingService.setCurrentPosition({ x: 100, y: 100 });
      unsubscribe();
      wayfindingService.setCurrentPosition({ x: 200, y: 200 });

      expect(count).toBe(1);
    });
  });
});
