/**
 * Tests for MediVac WACHS v9.0 Features
 * - Voice-Activated Live Wallpapers
 * - Combo-Triggered Animations
 * - Wallpaper Weather Integration
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { voiceActivatedWallpapersService } from '../voice-activated-wallpapers-service';
import { comboTriggeredAnimationsService } from '../combo-triggered-animations-service';
import { wallpaperWeatherIntegrationService } from '../wallpaper-weather-integration-service';

describe('Voice-Activated Live Wallpapers Service', () => {
  beforeEach(() => {
    voiceActivatedWallpapersService.reset();
  });

  it('should initialize with default triggers', () => {
    const triggers = voiceActivatedWallpapersService.getAllTriggers();
    expect(triggers.length).toBeGreaterThan(0);
  });

  it('should process voice input and find matching trigger', () => {
    const result = voiceActivatedWallpapersService.processVoiceInput('hyperspace', 0.9);
    expect(result).toBeDefined();
  });

  it('should create custom voice triggers', () => {
    const trigger = voiceActivatedWallpapersService.createTrigger({
      phrases: ['test phrase', 'test command'],
      wallpaperIds: ['test-wallpaper-1'],
      mood: 'calm',
      transitionEffect: 'fade',
      soundEffect: 'chime',
      isEnabled: true,
    });
    expect(trigger.id).toBeDefined();
    expect(trigger.phrases).toContain('test phrase');
  });

  it('should toggle trigger enabled state', () => {
    const triggers = voiceActivatedWallpapersService.getAllTriggers();
    const firstTrigger = triggers[0];
    const originalState = firstTrigger.isEnabled;
    
    voiceActivatedWallpapersService.toggleTrigger(firstTrigger.id);
    const updated = voiceActivatedWallpapersService.getTrigger(firstTrigger.id);
    expect(updated?.isEnabled).toBe(!originalState);
  });

  it('should manage wallpaper playlists', () => {
    const playlist = voiceActivatedWallpapersService.createPlaylist({
      name: 'Test Playlist',
      description: 'A test playlist',
      wallpaperIds: ['wp-1', 'wp-2', 'wp-3'],
      intervalSeconds: 30,
      shuffle: false,
      voiceTrigger: 'play test',
    });
    expect(playlist.id).toBeDefined();
    expect(playlist.wallpaperIds.length).toBe(3);
  });

  it('should start and stop playlists', () => {
    const playlists = voiceActivatedWallpapersService.getAllPlaylists();
    if (playlists.length > 0) {
      voiceActivatedWallpapersService.startPlaylist(playlists[0].id);
      let playlist = voiceActivatedWallpapersService.getPlaylist(playlists[0].id);
      expect(playlist?.isPlaying).toBe(true);
      
      voiceActivatedWallpapersService.stopPlaylist(playlists[0].id);
      playlist = voiceActivatedWallpapersService.getPlaylist(playlists[0].id);
      expect(playlist?.isPlaying).toBe(false);
    }
  });

  it('should track analytics', () => {
    const analytics = voiceActivatedWallpapersService.getAnalytics();
    expect(analytics).toBeDefined();
    expect(typeof analytics.totalActivations).toBe('number');
    expect(typeof analytics.successfulActivations).toBe('number');
  });

  it('should get mood mappings', () => {
    const calmMapping = voiceActivatedWallpapersService.getMoodMapping('calm');
    expect(calmMapping).toBeDefined();
    expect(calmMapping?.keywords.length).toBeGreaterThan(0);
  });
});

describe('Combo-Triggered Animations Service', () => {
  beforeEach(() => {
    comboTriggeredAnimationsService.reset();
  });

  it('should initialize with default animations', () => {
    const animations = comboTriggeredAnimationsService.getAllAnimations();
    expect(animations.length).toBeGreaterThan(0);
  });

  it('should trigger combo animations', () => {
    const result = comboTriggeredAnimationsService.triggerComboAnimation('test-combo', false);
    expect(result).toBeDefined();
    expect(result.animationId).toBeDefined();
  });

  it('should track streak correctly', () => {
    comboTriggeredAnimationsService.triggerComboAnimation('combo-1', false);
    comboTriggeredAnimationsService.triggerComboAnimation('combo-2', false);
    comboTriggeredAnimationsService.triggerComboAnimation('combo-3', false);
    
    const streak = comboTriggeredAnimationsService.getStreak();
    expect(streak.current).toBe(3);
  });

  it('should apply multiplier bonus at milestones', () => {
    // Trigger multiple combos to reach milestone
    for (let i = 0; i < 5; i++) {
      comboTriggeredAnimationsService.triggerComboAnimation(`combo-${i}`, false);
    }
    
    const streak = comboTriggeredAnimationsService.getStreak();
    expect(streak.multiplier).toBeGreaterThanOrEqual(1.0);
  });

  it('should reset streak', () => {
    comboTriggeredAnimationsService.triggerComboAnimation('combo-1', false);
    comboTriggeredAnimationsService.triggerComboAnimation('combo-2', false);
    
    comboTriggeredAnimationsService.resetStreak();
    const streak = comboTriggeredAnimationsService.getStreak();
    expect(streak.current).toBe(0);
  });

  it('should track achievements', () => {
    const achievements = comboTriggeredAnimationsService.getAllAchievements();
    expect(achievements.length).toBeGreaterThan(0);
  });

  it('should get milestones', () => {
    const milestones = comboTriggeredAnimationsService.getMilestones();
    expect(milestones.length).toBeGreaterThan(0);
    expect(milestones[0].streak).toBeDefined();
  });

  it('should get next milestone', () => {
    const nextMilestone = comboTriggeredAnimationsService.getNextMilestone();
    expect(nextMilestone).toBeDefined();
  });

  it('should play animation manually', () => {
    const animations = comboTriggeredAnimationsService.getAllAnimations();
    const unlockedAnimation = animations.find(a => a.isUnlocked);
    
    if (unlockedAnimation) {
      const result = comboTriggeredAnimationsService.playAnimationManually(unlockedAnimation.id);
      expect(result).toBeDefined();
      expect(result.animationId).toBe(unlockedAnimation.id);
    }
  });

  it('should track analytics', () => {
    comboTriggeredAnimationsService.triggerComboAnimation('test', false);
    const analytics = comboTriggeredAnimationsService.getAnalytics();
    expect(analytics.totalAnimationsPlayed).toBeGreaterThan(0);
  });
});

describe('Wallpaper Weather Integration Service', () => {
  beforeEach(() => {
    wallpaperWeatherIntegrationService.reset();
  });

  it('should initialize with default weather data', () => {
    const weather = wallpaperWeatherIntegrationService.getCurrentWeather();
    expect(weather).toBeDefined();
    expect(weather?.condition).toBeDefined();
  });

  it('should initialize with default location', () => {
    const location = wallpaperWeatherIntegrationService.getCurrentLocation();
    expect(location).toBeDefined();
    expect(location?.city).toBeDefined();
  });

  it('should update weather data', () => {
    wallpaperWeatherIntegrationService.updateWeather({ 
      condition: 'rain',
      temperature: 15,
    });
    
    const weather = wallpaperWeatherIntegrationService.getCurrentWeather();
    expect(weather?.condition).toBe('rain');
    expect(weather?.temperature).toBe(15);
  });

  it('should simulate weather change', () => {
    wallpaperWeatherIntegrationService.simulateWeatherChange('thunderstorm');
    const weather = wallpaperWeatherIntegrationService.getCurrentWeather();
    expect(weather?.condition).toBe('thunderstorm');
  });

  it('should get current time of day', () => {
    const timeOfDay = wallpaperWeatherIntegrationService.getCurrentTimeOfDay();
    expect(['dawn', 'morning', 'noon', 'afternoon', 'dusk', 'evening', 'night', 'midnight']).toContain(timeOfDay);
  });

  it('should get current season', () => {
    const season = wallpaperWeatherIntegrationService.getCurrentSeason();
    expect(['spring', 'summer', 'autumn', 'winter']).toContain(season);
  });

  it('should have default weather mappings', () => {
    const mappings = wallpaperWeatherIntegrationService.getAllMappings();
    expect(mappings.length).toBeGreaterThan(0);
  });

  it('should get mappings for specific condition', () => {
    const rainMappings = wallpaperWeatherIntegrationService.getMappingsForCondition('rain');
    expect(rainMappings.length).toBeGreaterThan(0);
  });

  it('should toggle mapping enabled state', () => {
    const mappings = wallpaperWeatherIntegrationService.getAllMappings();
    const firstMapping = mappings[0];
    const originalState = firstMapping.isEnabled;
    
    wallpaperWeatherIntegrationService.toggleMapping(firstMapping.id);
    const updated = wallpaperWeatherIntegrationService.getMapping(firstMapping.id);
    expect(updated?.isEnabled).toBe(!originalState);
  });

  it('should apply weather wallpaper', () => {
    const wallpaperId = wallpaperWeatherIntegrationService.applyWeatherWallpaper();
    expect(wallpaperId).toBeDefined();
  });

  it('should get weather particles for condition', () => {
    const particles = wallpaperWeatherIntegrationService.getWeatherParticles('rain');
    expect(particles).toBeDefined();
    expect(particles.type).toBe('rain');
    expect(particles.count).toBeGreaterThan(0);
  });

  it('should get weather sound for condition', () => {
    const sound = wallpaperWeatherIntegrationService.getWeatherSound('thunderstorm');
    expect(sound).toBeDefined();
    expect(sound).toBe('thunder-storm');
  });

  it('should manage auto sync', () => {
    wallpaperWeatherIntegrationService.startAutoSync();
    expect(wallpaperWeatherIntegrationService.isAutoSyncActive()).toBe(true);
    
    wallpaperWeatherIntegrationService.stopAutoSync();
    expect(wallpaperWeatherIntegrationService.isAutoSyncActive()).toBe(false);
  });

  it('should track analytics', () => {
    wallpaperWeatherIntegrationService.updateWeather({ condition: 'snow' });
    wallpaperWeatherIntegrationService.applyWeatherWallpaper();
    
    const analytics = wallpaperWeatherIntegrationService.getAnalytics();
    expect(analytics.totalWeatherChanges).toBeGreaterThan(0);
  });

  it('should export and import configuration', () => {
    const exported = wallpaperWeatherIntegrationService.exportConfiguration();
    expect(exported).toBeDefined();
    
    const parsed = JSON.parse(exported);
    expect(parsed.mappings).toBeDefined();
    
    const importResult = wallpaperWeatherIntegrationService.importConfiguration(exported);
    expect(importResult.success).toBe(true);
  });

  it('should create custom mapping', () => {
    const mapping = wallpaperWeatherIntegrationService.createMapping({
      condition: 'clear',
      timeOfDay: 'morning',
      wallpaperIds: ['custom-wallpaper'],
      particleEffects: ['custom-effect'],
      overlayOpacity: 0.1,
      transitionDuration: 1500,
      priority: 10,
      isEnabled: true,
    });
    
    expect(mapping.id).toBeDefined();
    expect(mapping.wallpaperIds).toContain('custom-wallpaper');
  });
});
