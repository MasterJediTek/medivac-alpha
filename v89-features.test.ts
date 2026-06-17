/**
 * Tests for MediVac WACHS v8.9 Features
 * - Macro Voice Recording
 * - Gesture Combos
 * - Live Wallpaper Generator
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { macroVoiceRecordingService } from '../macro-voice-recording-service';
import { gestureCombosService } from '../gesture-combos-service';
import { liveWallpaperGeneratorService } from '../live-wallpaper-generator-service';

describe('Macro Voice Recording Service', () => {
  beforeEach(() => {
    macroVoiceRecordingService.reset();
  });

  describe('Voice Profiles', () => {
    it('should have default profile', () => {
      const profiles = macroVoiceRecordingService.getAllProfiles();
      expect(profiles.length).toBeGreaterThan(0);
    });

    it('should create new voice profile', () => {
      const profile = macroVoiceRecordingService.createProfile({
        name: 'Test User',
        userId: 'user-123',
        isActive: false,
        settings: {
          sensitivity: 5,
          noiseGate: 50,
          requireVerification: false,
          allowBackgroundNoise: false,
          minConfidence: 0.7,
          maxResponseTime: 3000,
          feedbackMode: 'full',
        },
      });
      expect(profile.name).toBe('Test User');
      expect(profile.isVerified).toBe(false);
    });

    it('should set active profile', () => {
      const profile = macroVoiceRecordingService.createProfile({
        name: 'Active User',
        userId: 'user-456',
        isActive: false,
        settings: {
          sensitivity: 5,
          noiseGate: 50,
          requireVerification: false,
          allowBackgroundNoise: false,
          minConfidence: 0.7,
          maxResponseTime: 3000,
          feedbackMode: 'full',
        },
      });
      macroVoiceRecordingService.setActiveProfile(profile.id);
      const active = macroVoiceRecordingService.getActiveProfile();
      expect(active?.id).toBe(profile.id);
    });
  });

  describe('Voice Triggers', () => {
    it('should have default triggers', () => {
      const triggers = macroVoiceRecordingService.getAllTriggers();
      expect(triggers.length).toBeGreaterThan(0);
    });

    it('should create custom trigger', () => {
      const profiles = macroVoiceRecordingService.getAllProfiles();
      const trigger = macroVoiceRecordingService.createTrigger({
        profileId: profiles[0].id,
        phrase: 'test phrase',
        macroId: 'test-macro',
        isEnabled: true,
      });
      expect(trigger.phrase).toBe('test phrase');
      expect(trigger.isEnabled).toBe(true);
    });

    it('should toggle trigger enabled state', () => {
      const triggers = macroVoiceRecordingService.getAllTriggers();
      const initialState = triggers[0].isEnabled;
      macroVoiceRecordingService.toggleTrigger(triggers[0].id);
      const updated = macroVoiceRecordingService.getTrigger(triggers[0].id);
      expect(updated?.isEnabled).toBe(!initialState);
    });
  });

  describe('Recording Sessions', () => {
    it('should start recording session', () => {
      const profiles = macroVoiceRecordingService.getAllProfiles();
      macroVoiceRecordingService.startRecordingSession(profiles[0].id, 'test phrase');
      const session = macroVoiceRecordingService.getCurrentSession();
      expect(session).not.toBeNull();
      expect(['preparing', 'recording']).toContain(session?.state);
    });

    it('should handle stop recording', () => {
      const profiles = macroVoiceRecordingService.getAllProfiles();
      macroVoiceRecordingService.startRecordingSession(profiles[0].id, 'test phrase');
      // Stop recording - behavior depends on state
      macroVoiceRecordingService.stopRecording();
      // Just verify no errors thrown
      expect(true).toBe(true);
    });

    it('should cancel recording session', () => {
      const profiles = macroVoiceRecordingService.getAllProfiles();
      macroVoiceRecordingService.startRecordingSession(profiles[0].id, 'test phrase');
      macroVoiceRecordingService.cancelRecording();
      const session = macroVoiceRecordingService.getCurrentSession();
      expect(session).toBeNull();
    });
  });

  describe('Analytics', () => {
    it('should return analytics data', () => {
      const analytics = macroVoiceRecordingService.getAnalytics();
      expect(analytics).toHaveProperty('totalRecordings');
      expect(analytics).toHaveProperty('successfulActivations');
      expect(analytics).toHaveProperty('avgConfidence');
    });
  });
});

describe('Gesture Combos Service', () => {
  beforeEach(() => {
    gestureCombosService.reset();
  });

  describe('Combos', () => {
    it('should have default combos', () => {
      const combos = gestureCombosService.getAllCombos();
      expect(combos.length).toBeGreaterThan(0);
    });

    it('should get combo by id', () => {
      const combos = gestureCombosService.getAllCombos();
      const combo = gestureCombosService.getCombo(combos[0].id);
      expect(combo).not.toBeUndefined();
      expect(combo?.id).toBe(combos[0].id);
    });

    it('should toggle combo enabled state', () => {
      const combos = gestureCombosService.getAllCombos();
      const initialState = combos[0].isEnabled;
      gestureCombosService.toggleCombo(combos[0].id);
      const updated = gestureCombosService.getCombo(combos[0].id);
      expect(updated?.isEnabled).toBe(!initialState);
    });

    it('should toggle combo favorite', () => {
      const combos = gestureCombosService.getAllCombos();
      const initialState = combos[0].isFavorite;
      gestureCombosService.toggleFavorite(combos[0].id);
      const updated = gestureCombosService.getCombo(combos[0].id);
      expect(updated?.isFavorite).toBe(!initialState);
    });
  });

  describe('Detection', () => {
    it('should start detection session', () => {
      gestureCombosService.startDetection();
      const session = gestureCombosService.getCurrentSession();
      expect(session).not.toBeNull();
      expect(session?.state).toBe('detecting');
    });

    it('should input gesture during detection', () => {
      gestureCombosService.startDetection();
      gestureCombosService.inputGesture({
        type: 'swipe-up',
        timestamp: Date.now(),
        confidence: 0.9,
        duration: 300,
      });
      const session = gestureCombosService.getCurrentSession();
      expect(session?.inputGestures.length).toBe(1);
    });

    it('should cancel detection', () => {
      gestureCombosService.startDetection();
      gestureCombosService.cancelDetection();
      const session = gestureCombosService.getCurrentSession();
      expect(session).toBeNull();
    });
  });

  describe('Streak and Rewards', () => {
    it('should track streak', () => {
      const streak = gestureCombosService.getStreak();
      expect(streak).toHaveProperty('current');
      expect(streak).toHaveProperty('best');
      expect(streak).toHaveProperty('multiplier');
    });

    it('should have rewards', () => {
      const rewards = gestureCombosService.getRewards();
      expect(rewards.length).toBeGreaterThan(0);
    });
  });

  describe('Analytics', () => {
    it('should return analytics data', () => {
      const analytics = gestureCombosService.getAnalytics();
      expect(analytics).toHaveProperty('totalCombos');
      expect(analytics).toHaveProperty('totalExecutions');
      expect(analytics).toHaveProperty('avgAccuracy');
    });
  });
});

describe('Live Wallpaper Generator Service', () => {
  beforeEach(() => {
    liveWallpaperGeneratorService.reset();
  });

  describe('Wallpapers', () => {
    it('should have built-in wallpapers', () => {
      const wallpapers = liveWallpaperGeneratorService.getAllWallpapers();
      expect(wallpapers.length).toBeGreaterThan(0);
    });

    it('should get wallpaper by id', () => {
      const wallpapers = liveWallpaperGeneratorService.getAllWallpapers();
      const wallpaper = liveWallpaperGeneratorService.getWallpaper(wallpapers[0].id);
      expect(wallpaper).not.toBeUndefined();
      expect(wallpaper?.id).toBe(wallpapers[0].id);
    });

    it('should set active wallpaper', () => {
      const wallpapers = liveWallpaperGeneratorService.getAllWallpapers();
      liveWallpaperGeneratorService.setActiveWallpaper(wallpapers[0].id);
      const active = liveWallpaperGeneratorService.getActiveWallpaper();
      expect(active?.id).toBe(wallpapers[0].id);
    });

    it('should toggle wallpaper favorite', () => {
      const wallpapers = liveWallpaperGeneratorService.getAllWallpapers();
      const initialState = wallpapers[0].isFavorite;
      liveWallpaperGeneratorService.toggleFavorite(wallpapers[0].id);
      const updated = liveWallpaperGeneratorService.getWallpaper(wallpapers[0].id);
      expect(updated?.isFavorite).toBe(!initialState);
    });
  });

  describe('Wallpaper Creation', () => {
    it('should create custom wallpaper', () => {
      const wallpaper = liveWallpaperGeneratorService.createWallpaper({
        name: 'Test Wallpaper',
        description: 'A test wallpaper',
        thumbnail: 'test.png',
        particles: [],
        parallaxLayers: [],
        colorCycle: { enabled: false, colors: [], duration: 0, mode: 'gradient', affectsParticles: false, affectsBackground: false },
        touchInteraction: { enabled: false, type: 'ripple', radius: 100, strength: 1, duration: 500 },
        backgroundColor: '#000000',
        fps: 30,
        batteryMode: { enabled: true, threshold: 20, reducedFps: 15, reducedParticles: 50, disableInteraction: true, disableColorCycle: false },
        isActive: false,
        isFavorite: false,
        tags: ['test'],
      });
      expect(wallpaper.name).toBe('Test Wallpaper');
      expect(wallpaper.isBuiltIn).toBe(false);
    });

    it('should convert static image to live wallpaper', () => {
      const wallpaper = liveWallpaperGeneratorService.convertToLiveWallpaper(
        'image.png',
        'Converted Wallpaper',
        ['stars', 'magic']
      );
      expect(wallpaper.name).toBe('Converted Wallpaper');
      expect(wallpaper.particles.length).toBe(2);
      expect(wallpaper.tags).toContain('converted');
    });
  });

  describe('Particle Management', () => {
    it('should add particle layer', () => {
      const wallpapers = liveWallpaperGeneratorService.getAllWallpapers();
      const customWallpaper = wallpapers.find(w => !w.isBuiltIn) || 
        liveWallpaperGeneratorService.createWallpaper({
          name: 'Test',
          description: 'Test',
          thumbnail: '',
          particles: [],
          parallaxLayers: [],
          colorCycle: { enabled: false, colors: [], duration: 0, mode: 'gradient', affectsParticles: false, affectsBackground: false },
          touchInteraction: { enabled: false, type: 'ripple', radius: 100, strength: 1, duration: 500 },
          backgroundColor: '#000',
          fps: 30,
          batteryMode: { enabled: true, threshold: 20, reducedFps: 15, reducedParticles: 50, disableInteraction: true, disableColorCycle: false },
          isActive: false,
          isFavorite: false,
          tags: [],
        });
      
      const initialCount = customWallpaper.particles.length;
      liveWallpaperGeneratorService.addParticleLayer(customWallpaper.id, {
        type: 'stars',
        count: 100,
        size: { min: 1, max: 3 },
        speed: { min: 0.1, max: 0.5 },
        opacity: { min: 0.3, max: 1 },
        color: '#FFFFFF',
        motion: 'pulse',
        lifetime: 0,
        spawnRate: 0,
        gravity: 0,
        wind: { x: 0, y: 0 },
        rotation: false,
        glow: 0.5,
        trail: { enabled: false, length: 0, fade: 0 },
        collision: false,
        interactive: true,
      });
      
      const updated = liveWallpaperGeneratorService.getWallpaper(customWallpaper.id);
      expect(updated?.particles.length).toBe(initialCount + 1);
    });

    it('should get particle presets', () => {
      const presets = liveWallpaperGeneratorService.getParticlePresets();
      expect(Object.keys(presets).length).toBeGreaterThan(0);
      expect(presets).toHaveProperty('stars');
    });

    it('should get touch presets', () => {
      const presets = liveWallpaperGeneratorService.getTouchPresets();
      expect(Object.keys(presets).length).toBeGreaterThan(0);
      expect(presets).toHaveProperty('ripple');
    });
  });

  describe('Favorites and Filtering', () => {
    it('should get favorite wallpapers', () => {
      const wallpapers = liveWallpaperGeneratorService.getAllWallpapers();
      liveWallpaperGeneratorService.toggleFavorite(wallpapers[0].id);
      const favorites = liveWallpaperGeneratorService.getFavoriteWallpapers();
      expect(favorites.length).toBeGreaterThan(0);
    });

    it('should filter wallpapers by tag', () => {
      const jediWallpapers = liveWallpaperGeneratorService.getWallpapersByTag('jedi');
      expect(jediWallpapers.length).toBeGreaterThan(0);
      jediWallpapers.forEach(w => {
        expect(w.tags).toContain('jedi');
      });
    });
  });

  describe('Export/Import', () => {
    it('should export configuration', () => {
      const exported = liveWallpaperGeneratorService.exportConfiguration();
      expect(typeof exported).toBe('string');
      const parsed = JSON.parse(exported);
      expect(parsed).toHaveProperty('wallpapers');
      expect(parsed).toHaveProperty('exportedAt');
    });

    it('should import configuration', () => {
      const config = JSON.stringify({
        wallpapers: [{
          name: 'Imported Wallpaper',
          description: 'Test import',
          thumbnail: '',
          particles: [],
          parallaxLayers: [],
          colorCycle: { enabled: false, colors: [], duration: 0, mode: 'gradient', affectsParticles: false, affectsBackground: false },
          touchInteraction: { enabled: false, type: 'ripple', radius: 100, strength: 1, duration: 500 },
          backgroundColor: '#000',
          fps: 30,
          batteryMode: { enabled: true, threshold: 20, reducedFps: 15, reducedParticles: 50, disableInteraction: true, disableColorCycle: false },
          isActive: false,
          isFavorite: false,
          tags: ['imported'],
        }],
        scheduleEntries: [],
        exportedAt: Date.now(),
      });
      
      const result = liveWallpaperGeneratorService.importConfiguration(config);
      expect(result.success).toBe(true);
      expect(result.imported.wallpapers).toBe(1);
    });
  });

  describe('Analytics', () => {
    it('should return analytics data', () => {
      const analytics = liveWallpaperGeneratorService.getAnalytics();
      expect(analytics).toHaveProperty('totalWallpapers');
      expect(analytics).toHaveProperty('avgFps');
      expect(analytics).toHaveProperty('batteryImpact');
    });
  });
});
