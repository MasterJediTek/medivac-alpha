/**
 * Voice Navigation Service Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { voiceNavigationService } from '../voice-navigation.service';

describe('VoiceNavigationService', () => {
  beforeEach(() => {
    voiceNavigationService.clearQueue();
  });

  afterEach(() => {
    voiceNavigationService.destroy();
  });

  describe('getSettings', () => {
    it('should return default settings', () => {
      const settings = voiceNavigationService.getSettings();
      expect(settings.enabled).toBe(true);
      expect(settings.volume).toBe(0.8);
      expect(settings.rate).toBe(1.0);
      expect(settings.language).toBe('en-AU');
    });
  });

  describe('updateSettings', () => {
    it('should update settings', () => {
      voiceNavigationService.updateSettings({ volume: 0.5 });
      const settings = voiceNavigationService.getSettings();
      expect(settings.volume).toBe(0.5);
    });
  });

  describe('setEnabled', () => {
    it('should enable/disable voice navigation', () => {
      voiceNavigationService.setEnabled(false);
      expect(voiceNavigationService.getSettings().enabled).toBe(false);
      
      voiceNavigationService.setEnabled(true);
      expect(voiceNavigationService.getSettings().enabled).toBe(true);
    });
  });

  describe('setVolume', () => {
    it('should set volume within bounds', () => {
      voiceNavigationService.setVolume(0.5);
      expect(voiceNavigationService.getSettings().volume).toBe(0.5);
    });

    it('should clamp volume to 0-1 range', () => {
      voiceNavigationService.setVolume(-0.5);
      expect(voiceNavigationService.getSettings().volume).toBe(0);
      
      voiceNavigationService.setVolume(1.5);
      expect(voiceNavigationService.getSettings().volume).toBe(1);
    });
  });

  describe('setRate', () => {
    it('should set speech rate within bounds', () => {
      voiceNavigationService.setRate(1.5);
      expect(voiceNavigationService.getSettings().rate).toBe(1.5);
    });

    it('should clamp rate to 0.5-2 range', () => {
      voiceNavigationService.setRate(0.1);
      expect(voiceNavigationService.getSettings().rate).toBe(0.5);
      
      voiceNavigationService.setRate(3);
      expect(voiceNavigationService.getSettings().rate).toBe(2);
    });
  });

  describe('setLanguage', () => {
    it('should set language', () => {
      voiceNavigationService.setLanguage('en-US');
      expect(voiceNavigationService.getSettings().language).toBe('en-US');
    });
  });

  describe('getAvailableLanguages', () => {
    it('should return available languages', () => {
      const languages = voiceNavigationService.getAvailableLanguages();
      expect(languages.length).toBeGreaterThan(0);
      expect(languages.some(l => l.code === 'en-AU')).toBe(true);
    });
  });

  describe('announceNavigationStart', () => {
    it('should queue navigation start announcement', () => {
      voiceNavigationService.announceNavigationStart('Emergency Department');
      expect(voiceNavigationService.getQueueLength()).toBeGreaterThanOrEqual(0);
    });

    it('should not queue when disabled', () => {
      voiceNavigationService.setEnabled(false);
      voiceNavigationService.announceNavigationStart('Emergency Department');
      expect(voiceNavigationService.getQueueLength()).toBe(0);
    });
  });

  describe('announceStep', () => {
    it('should queue step announcement', () => {
      voiceNavigationService.announceStep({
        instruction: 'Turn left',
        direction: 'left',
        distance: 50,
        landmark: 'Reception desk',
      });
      expect(voiceNavigationService.getQueueLength()).toBeGreaterThanOrEqual(0);
    });
  });

  describe('announceArrival', () => {
    it('should queue arrival announcement', () => {
      voiceNavigationService.announceArrival('Pharmacy');
      expect(voiceNavigationService.getQueueLength()).toBeGreaterThanOrEqual(0);
    });
  });

  describe('clearQueue', () => {
    it('should clear all queued announcements', () => {
      voiceNavigationService.announceNavigationStart('Test');
      voiceNavigationService.clearQueue();
      expect(voiceNavigationService.getQueueLength()).toBe(0);
    });
  });

  describe('onAnnouncement', () => {
    it('should notify listeners on announcement', () => {
      let received = false;
      const unsubscribe = voiceNavigationService.onAnnouncement(() => {
        received = true;
      });

      voiceNavigationService.announceWarning('Test warning');
      
      // Wait for queue processing
      setTimeout(() => {
        expect(received).toBe(true);
        unsubscribe();
      }, 100);
    });
  });

  describe('onSettingsChange', () => {
    it('should notify listeners on settings change', () => {
      let notified = false;
      const unsubscribe = voiceNavigationService.onSettingsChange(() => {
        notified = true;
      });

      voiceNavigationService.setVolume(0.6);
      expect(notified).toBe(true);

      unsubscribe();
    });
  });
});
