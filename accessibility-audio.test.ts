import { describe, it, expect, beforeEach } from 'vitest';
import { accessibilityAudioService } from '../accessibility-audio.service';

describe('AccessibilityAudioService', () => {
  beforeEach(() => {
    // Reset settings before each test
    accessibilityAudioService.updateSettings({
      enabled: true,
      volume: 0.8,
      rate: 1.0,
      detailedMode: false
    });
  });

  describe('getFeatures', () => {
    it('should return all accessibility features', () => {
      const features = accessibilityAudioService.getFeatures();
      expect(features).toBeDefined();
      expect(Array.isArray(features)).toBe(true);
      expect(features.length).toBeGreaterThan(0);
    });

    it('should include elevators', () => {
      const features = accessibilityAudioService.getFeatures();
      const elevators = features.filter(f => f.type === 'elevator');
      expect(elevators.length).toBeGreaterThan(0);
    });

    it('should include ramps', () => {
      const features = accessibilityAudioService.getFeatures();
      const ramps = features.filter(f => f.type === 'ramp');
      expect(ramps.length).toBeGreaterThan(0);
    });

    it('should include restrooms', () => {
      const features = accessibilityAudioService.getFeatures();
      const restrooms = features.filter(f => f.type === 'restroom');
      expect(restrooms.length).toBeGreaterThan(0);
    });
  });

  describe('getFeaturesByType', () => {
    it('should filter features by type', () => {
      const elevators = accessibilityAudioService.getFeaturesByType('elevator');
      expect(elevators.every(f => f.type === 'elevator')).toBe(true);
    });
  });

  describe('settings', () => {
    it('should get current settings', () => {
      const settings = accessibilityAudioService.getSettings();
      expect(settings).toBeDefined();
      expect(typeof settings.enabled).toBe('boolean');
      expect(typeof settings.volume).toBe('number');
    });

    it('should update settings', () => {
      accessibilityAudioService.updateSettings({ volume: 0.5 });
      const settings = accessibilityAudioService.getSettings();
      expect(settings.volume).toBe(0.5);
    });

    it('should toggle enabled state', () => {
      accessibilityAudioService.setEnabled(false);
      expect(accessibilityAudioService.getSettings().enabled).toBe(false);
      
      accessibilityAudioService.setEnabled(true);
      expect(accessibilityAudioService.getSettings().enabled).toBe(true);
    });

    it('should set volume within bounds', () => {
      accessibilityAudioService.setVolume(1.5);
      expect(accessibilityAudioService.getSettings().volume).toBe(1);
      
      accessibilityAudioService.setVolume(-0.5);
      expect(accessibilityAudioService.getSettings().volume).toBe(0);
    });

    it('should set rate within bounds', () => {
      accessibilityAudioService.setRate(3.0);
      expect(accessibilityAudioService.getSettings().rate).toBe(2);
      
      accessibilityAudioService.setRate(0.1);
      expect(accessibilityAudioService.getSettings().rate).toBe(0.5);
    });

    it('should toggle detailed mode', () => {
      accessibilityAudioService.setDetailedMode(true);
      expect(accessibilityAudioService.getSettings().detailedMode).toBe(true);
      
      accessibilityAudioService.setDetailedMode(false);
      expect(accessibilityAudioService.getSettings().detailedMode).toBe(false);
    });
  });

  describe('position updates', () => {
    it('should accept position updates without error', () => {
      expect(() => {
        accessibilityAudioService.updatePosition(100, 100);
      }).not.toThrow();
    });
  });

  describe('announcements', () => {
    it('should announce feature by ID without error', () => {
      const features = accessibilityAudioService.getFeatures();
      if (features.length > 0) {
        expect(() => {
          accessibilityAudioService.announceFeatureById(features[0].id);
        }).not.toThrow();
      }
    });

    it('should announce location summary without error', () => {
      accessibilityAudioService.updatePosition(200, 150);
      expect(() => {
        accessibilityAudioService.announceLocationSummary();
      }).not.toThrow();
    });

    it('should stop speaking without error', () => {
      expect(() => {
        accessibilityAudioService.stopSpeaking();
      }).not.toThrow();
    });
  });
});
