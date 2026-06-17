/**
 * Accessibility Routes Service Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { accessibilityRoutesService } from '../accessibility-routes.service';

describe('AccessibilityRoutesService', () => {
  beforeEach(() => {
    // Reset to default settings
    accessibilityRoutesService.updateSettings({
      requireWheelchairAccess: true,
      preferElevators: true,
      preferRamps: true,
      avoidStairs: true,
      minimumPathWidth: 90,
      maximumGradient: 8,
      requireAutomaticDoors: false,
      requireAccessibleRestrooms: false,
    });
  });

  describe('getSettings', () => {
    it('should return current settings', () => {
      const settings = accessibilityRoutesService.getSettings();
      expect(settings).toBeDefined();
      expect(settings.requireWheelchairAccess).toBe(true);
    });
  });

  describe('updateSettings', () => {
    it('should update settings', () => {
      accessibilityRoutesService.updateSettings({ minimumPathWidth: 100 });
      const settings = accessibilityRoutesService.getSettings();
      expect(settings.minimumPathWidth).toBe(100);
    });
  });

  describe('enableWheelchairMode', () => {
    it('should enable wheelchair accessibility settings', () => {
      accessibilityRoutesService.disableAccessibilityMode();
      accessibilityRoutesService.enableWheelchairMode();
      
      const settings = accessibilityRoutesService.getSettings();
      expect(settings.requireWheelchairAccess).toBe(true);
      expect(settings.preferElevators).toBe(true);
      expect(settings.avoidStairs).toBe(true);
    });
  });

  describe('disableAccessibilityMode', () => {
    it('should disable accessibility restrictions', () => {
      accessibilityRoutesService.disableAccessibilityMode();
      
      const settings = accessibilityRoutesService.getSettings();
      expect(settings.requireWheelchairAccess).toBe(false);
      expect(settings.avoidStairs).toBe(false);
    });
  });

  describe('getNodes', () => {
    it('should return all accessibility nodes', () => {
      const nodes = accessibilityRoutesService.getNodes();
      expect(nodes.length).toBeGreaterThan(0);
    });
  });

  describe('getAccessibleNodes', () => {
    it('should return only accessible nodes', () => {
      const nodes = accessibilityRoutesService.getAccessibleNodes();
      nodes.forEach(node => {
        expect(node.isAccessible).toBe(true);
      });
    });
  });

  describe('getNode', () => {
    it('should return node by ID', () => {
      const node = accessibilityRoutesService.getNode('entrance-main');
      expect(node).toBeDefined();
      expect(node?.name).toBe('Main Entrance');
    });

    it('should return undefined for invalid ID', () => {
      const node = accessibilityRoutesService.getNode('invalid-id');
      expect(node).toBeUndefined();
    });
  });

  describe('getNodesWithFeature', () => {
    it('should filter nodes by accessibility feature', () => {
      const nodes = accessibilityRoutesService.getNodesWithFeature('automatic_door');
      expect(nodes.length).toBeGreaterThan(0);
      nodes.forEach(node => {
        expect(node.accessibilityFeatures).toContain('automatic_door');
      });
    });
  });

  describe('findNearestAccessibleNode', () => {
    it('should find nearest accessible node to position', () => {
      const node = accessibilityRoutesService.findNearestAccessibleNode({ x: 150, y: 50 });
      expect(node).toBeDefined();
    });

    it('should filter by floor', () => {
      const node = accessibilityRoutesService.findNearestAccessibleNode({ x: 150, y: 220 }, 1);
      expect(node).toBeDefined();
      expect(node?.floor).toBe(1);
    });
  });

  describe('findAccessibleRoute', () => {
    it('should find route between two nodes', () => {
      const route = accessibilityRoutesService.findAccessibleRoute('entrance-main', 'junction-pharmacy');
      expect(route).toBeDefined();
      expect(route?.path.length).toBeGreaterThan(0);
    });

    it('should return null for invalid nodes', () => {
      const route = accessibilityRoutesService.findAccessibleRoute('invalid', 'also-invalid');
      expect(route).toBeNull();
    });

    it('should avoid stairs in wheelchair mode', () => {
      accessibilityRoutesService.enableWheelchairMode();
      const route = accessibilityRoutesService.findAccessibleRoute('entrance-main', 'junction-maternity');
      
      if (route) {
        // Route should use elevator, not stairs
        expect(route.hasElevator).toBe(true);
        expect(route.hasStairs).toBe(false);
      }
    });

    it('should calculate accessibility score', () => {
      const route = accessibilityRoutesService.findAccessibleRoute('entrance-main', 'junction-pharmacy');
      expect(route?.accessibilityScore).toBeGreaterThan(0);
      expect(route?.accessibilityScore).toBeLessThanOrEqual(100);
    });

    it('should estimate travel time', () => {
      const route = accessibilityRoutesService.findAccessibleRoute('entrance-main', 'junction-pharmacy');
      expect(route?.estimatedTime).toBeGreaterThan(0);
    });
  });

  describe('onSettingsChange', () => {
    it('should notify listeners on settings change', () => {
      let notified = false;
      const unsubscribe = accessibilityRoutesService.onSettingsChange(() => {
        notified = true;
      });

      accessibilityRoutesService.updateSettings({ minimumPathWidth: 95 });
      expect(notified).toBe(true);

      unsubscribe();
    });
  });
});
