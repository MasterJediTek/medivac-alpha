/**
 * Tests for MediVac WACHS v8.8 Features
 * - Voice Command Shortcuts (Macros)
 * - Gesture Controls
 * - Image Resizer
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { voiceCommandShortcutsService } from '../voice-command-shortcuts-service';
import { gestureControlsService } from '../gesture-controls-service';
import { imageResizerService } from '../image-resizer-service';

describe('Voice Command Shortcuts Service', () => {
  beforeEach(() => {
    voiceCommandShortcutsService.reset();
  });

  describe('Macro Management', () => {
    it('should have default built-in macros', () => {
      const macros = voiceCommandShortcutsService.getAllMacros();
      expect(macros.length).toBeGreaterThan(0);
      expect(macros.some(m => m.isBuiltIn)).toBe(true);
    });

    it('should get macro by ID', () => {
      const macros = voiceCommandShortcutsService.getAllMacros();
      const firstMacro = macros[0];
      const retrieved = voiceCommandShortcutsService.getMacro(firstMacro.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(firstMacro.id);
    });

    it('should create custom macro', () => {
      const macro = voiceCommandShortcutsService.createMacro({
        name: 'Test Macro',
        description: 'A test macro',
        category: 'custom',
        commands: [
          { id: 'cmd-1', action: 'test', parameters: {}, label: 'Test', order: 0, isEnabled: true }
        ],
        triggers: [],
        icon: '🧪',
        color: '#FF0000',
      });

      expect(macro.id).toBeDefined();
      expect(macro.name).toBe('Test Macro');
      expect(macro.isBuiltIn).toBe(false);
    });

    it('should toggle macro favorite', () => {
      const macros = voiceCommandShortcutsService.getAllMacros();
      const macro = macros[0];
      const initialFavorite = macro.isFavorite;

      voiceCommandShortcutsService.toggleFavorite(macro.id);
      const updated = voiceCommandShortcutsService.getMacro(macro.id);
      expect(updated?.isFavorite).toBe(!initialFavorite);
    });

    it('should toggle macro enabled state', () => {
      const macros = voiceCommandShortcutsService.getAllMacros();
      const macro = macros[0];
      const initialEnabled = macro.isEnabled;

      voiceCommandShortcutsService.toggleEnabled(macro.id);
      const updated = voiceCommandShortcutsService.getMacro(macro.id);
      expect(updated?.isEnabled).toBe(!initialEnabled);
    });

    it('should get macros by category', () => {
      const healthMacros = voiceCommandShortcutsService.getMacrosByCategory('health');
      expect(healthMacros.every(m => m.category === 'health')).toBe(true);
    });

    it('should get favorite macros', () => {
      const macros = voiceCommandShortcutsService.getAllMacros();
      voiceCommandShortcutsService.toggleFavorite(macros[0].id);

      const favorites = voiceCommandShortcutsService.getFavoriteMacros();
      expect(favorites.length).toBeGreaterThan(0);
      expect(favorites.every(m => m.isFavorite)).toBe(true);
    });
  });

  describe('Macro Execution', () => {
    it('should execute macro', () => {
      const macros = voiceCommandShortcutsService.getAllMacros();
      const macro = macros.find(m => m.isEnabled);
      expect(macro).toBeDefined();

      const execution = voiceCommandShortcutsService.executeMacro(macro!.id, 'manual');
      expect(execution).toBeDefined();
      expect(execution?.macroId).toBe(macro!.id);
    });

    it('should get execution history', () => {
      const macros = voiceCommandShortcutsService.getAllMacros();
      const macro = macros.find(m => m.isEnabled);
      voiceCommandShortcutsService.executeMacro(macro!.id, 'manual');

      const history = voiceCommandShortcutsService.getExecutionHistory();
      expect(history.length).toBeGreaterThan(0);
    });

    it('should get analytics', () => {
      const analytics = voiceCommandShortcutsService.getAnalytics();
      expect(analytics).toBeDefined();
      expect(typeof analytics.totalExecutions).toBe('number');
      expect(typeof analytics.totalMacros).toBe('number');
      expect(typeof analytics.avgExecutionTime).toBe('number');
    });
  });
});

describe('Gesture Controls Service', () => {
  beforeEach(() => {
    gestureControlsService.reset();
  });

  describe('Settings', () => {
    it('should have default settings', () => {
      const settings = gestureControlsService.getSettings();
      expect(settings).toBeDefined();
      expect(typeof settings.enabled).toBe('boolean');
      expect(typeof settings.sensitivity).toBe('number');
    });

    it('should update settings', () => {
      gestureControlsService.updateSettings({ sensitivity: 8 });
      const settings = gestureControlsService.getSettings();
      expect(settings.sensitivity).toBe(8);
    });
  });

  describe('Detection', () => {
    it('should start detection', () => {
      const result = gestureControlsService.startDetection();
      expect(result.success).toBe(true);
      expect(gestureControlsService.getState()).toBe('detecting');
    });

    it('should stop detection', () => {
      gestureControlsService.startDetection();
      const result = gestureControlsService.stopDetection();
      expect(result.success).toBe(true);
      expect(gestureControlsService.getState()).toBe('idle');
    });

    it('should detect gesture when detecting', () => {
      gestureControlsService.startDetection();
      const detection = gestureControlsService.detectGesture('wave', 0.95);
      expect(detection).toBeDefined();
      expect(detection?.gesture).toBe('wave');
      expect(detection?.confidence).toBe(0.95);
    });

    it('should not detect gesture when idle', () => {
      const detection = gestureControlsService.detectGesture('wave', 0.95);
      expect(detection).toBeNull();
    });

    it('should reject low confidence detections', () => {
      gestureControlsService.startDetection();
      const detection = gestureControlsService.detectGesture('wave', 0.3);
      expect(detection).toBeNull();
    });
  });

  describe('Gesture Mappings', () => {
    it('should have default mappings', () => {
      const mappings = gestureControlsService.getAllMappings();
      expect(mappings.length).toBeGreaterThan(0);
    });

    it('should get mapping by gesture', () => {
      const mapping = gestureControlsService.getMappingByGesture('wave');
      expect(mapping).toBeDefined();
      expect(mapping?.gesture).toBe('wave');
    });

    it('should toggle mapping', () => {
      const mappings = gestureControlsService.getAllMappings();
      const mapping = mappings[0];
      const initialEnabled = mapping.isEnabled;

      gestureControlsService.toggleMapping(mapping.id);
      const updated = gestureControlsService.getMapping(mapping.id);
      expect(updated?.isEnabled).toBe(!initialEnabled);
    });

    it('should create custom mapping', () => {
      const mapping = gestureControlsService.createMapping({
        gesture: 'custom',
        action: { type: 'custom', target: 'test' },
        isEnabled: true,
        sensitivity: 7,
        cooldown: 500,
        feedback: {},
      });

      expect(mapping.id).toBeDefined();
      expect(mapping.isBuiltIn).toBe(false);
    });

    it('should execute gesture', () => {
      gestureControlsService.startDetection();
      const detection = gestureControlsService.detectGesture('thumbs-up', 0.95);
      expect(detection).toBeDefined();

      const result = gestureControlsService.executeGesture(detection!.id);
      expect(result.success).toBe(true);
      expect(result.action).toBeDefined();
    });
  });

  describe('Training', () => {
    it('should start training', () => {
      const training = gestureControlsService.startTraining('custom');
      expect(training.id).toBeDefined();
      expect(training.gesture).toBe('custom');
      expect(training.samples).toHaveLength(0);
    });

    it('should add training sample', () => {
      const training = gestureControlsService.startTraining('custom');
      const sample = gestureControlsService.addTrainingSample(training.id, [
        { x: 0, y: 0, t: 0 },
        { x: 10, y: 10, t: 100 },
      ]);

      expect(sample).toBeDefined();
      expect(sample?.points).toHaveLength(2);
    });

    it('should complete training with enough samples', () => {
      const training = gestureControlsService.startTraining('custom');
      gestureControlsService.addTrainingSample(training.id, [{ x: 0, y: 0, t: 0 }]);
      gestureControlsService.addTrainingSample(training.id, [{ x: 0, y: 0, t: 0 }]);
      gestureControlsService.addTrainingSample(training.id, [{ x: 0, y: 0, t: 0 }]);

      const result = gestureControlsService.completeTraining(training.id);
      expect(result.success).toBe(true);
      expect(result.accuracy).toBeGreaterThan(0);
    });
  });

  describe('Analytics', () => {
    it('should get analytics', () => {
      const analytics = gestureControlsService.getAnalytics();
      expect(analytics).toBeDefined();
      expect(typeof analytics.totalDetections).toBe('number');
      expect(typeof analytics.avgConfidence).toBe('number');
    });

    it('should get gesture guide', () => {
      const guide = gestureControlsService.getGestureGuide();
      expect(guide.length).toBeGreaterThan(0);
      expect(guide[0]).toHaveProperty('gesture');
      expect(guide[0]).toHaveProperty('icon');
      expect(guide[0]).toHaveProperty('action');
    });
  });
});

describe('Image Resizer Service', () => {
  beforeEach(() => {
    imageResizerService.reset();
  });

  describe('Presets', () => {
    it('should have presets for all targets', () => {
      const watchPresets = imageResizerService.getPresets('watch-face');
      const wallpaperPresets = imageResizerService.getPresets('wallpaper');
      const screensaverPresets = imageResizerService.getPresets('screensaver');

      expect(watchPresets.length).toBeGreaterThan(0);
      expect(wallpaperPresets.length).toBeGreaterThan(0);
      expect(screensaverPresets.length).toBeGreaterThan(0);
    });

    it('should get all presets', () => {
      const allPresets = imageResizerService.getPresets();
      expect(allPresets.length).toBeGreaterThan(10);
    });

    it('should get preset by ID', () => {
      const presets = imageResizerService.getPresets('watch-face');
      const preset = imageResizerService.getPreset(presets[0].id);
      expect(preset).toBeDefined();
      expect(preset?.id).toBe(presets[0].id);
    });
  });

  describe('Filters and Effects', () => {
    it('should get default filters', () => {
      const filters = imageResizerService.getFilters();
      expect(filters.length).toBeGreaterThan(0);
      expect(filters.some(f => f.type === 'brightness')).toBe(true);
    });

    it('should get JEDI effects', () => {
      const effects = imageResizerService.getEffects();
      expect(effects.length).toBeGreaterThan(0);
      expect(effects.some(e => e.type === 'jedi-hologram')).toBe(true);
    });
  });

  describe('Image Processing', () => {
    it('should process image with preset', () => {
      const presets = imageResizerService.getPresets('watch-face');
      const processed = imageResizerService.processImage('test.jpg', 'watch-face', {
        presetId: presets[0].id,
      });

      expect(processed.id).toBeDefined();
      expect(processed.target).toBe('watch-face');
      expect(processed.processedUri).toBeDefined();
    });

    it('should process image with custom dimensions', () => {
      const processed = imageResizerService.processImage('test.jpg', 'custom', {
        customDimensions: { width: 500, height: 500 },
      });

      expect(processed.targetDimensions.width).toBe(500);
      expect(processed.targetDimensions.height).toBe(500);
    });

    it('should get all processed images', () => {
      // Process two images
      const img1 = imageResizerService.processImage('test1.jpg', 'watch-face');
      const img2 = imageResizerService.processImage('test2.jpg', 'wallpaper');

      // Verify both images are retrievable
      expect(imageResizerService.getProcessedImage(img1.id)).toBeDefined();
      expect(imageResizerService.getProcessedImage(img2.id)).toBeDefined();
    });

    it('should filter processed images by target', () => {
      // Process images of different types
      imageResizerService.processImage('test1.jpg', 'watch-face');
      imageResizerService.processImage('test2.jpg', 'wallpaper');

      const allImages = imageResizerService.getAllProcessedImages();
      const watchImages = imageResizerService.getProcessedImagesByTarget('watch-face');
      const wallpaperImages = imageResizerService.getProcessedImagesByTarget('wallpaper');

      // Verify filtering works
      expect(watchImages.every(img => img.target === 'watch-face')).toBe(true);
      expect(wallpaperImages.every(img => img.target === 'wallpaper')).toBe(true);
    });

    it('should delete processed image', () => {
      const processed = imageResizerService.processImage('test.jpg', 'watch-face');
      const deleted = imageResizerService.deleteProcessedImage(processed.id);
      expect(deleted).toBe(true);

      const retrieved = imageResizerService.getProcessedImage(processed.id);
      expect(retrieved).toBeUndefined();
    });
  });

  describe('Batch Processing', () => {
    it('should create batch', () => {
      const batch = imageResizerService.createBatch('Test Batch', ['img1.jpg', 'img2.jpg'], 'watch-face');
      expect(batch.id).toBeDefined();
      expect(batch.name).toBe('Test Batch');
      // Status may be 'pending' or 'processing' depending on timing
      expect(['pending', 'processing', 'completed']).toContain(batch.status);
    });

    it('should get all batches', () => {
      imageResizerService.createBatch('Batch 1', ['img1.jpg'], 'watch-face');
      imageResizerService.createBatch('Batch 2', ['img2.jpg'], 'wallpaper');

      const batches = imageResizerService.getAllBatches();
      expect(batches.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Startup Animations', () => {
    it('should have default animation', () => {
      const animations = imageResizerService.getAllStartupAnimations();
      expect(animations.length).toBeGreaterThan(0);
    });

    it('should create startup animation', () => {
      const animation = imageResizerService.createStartupAnimation('Test Animation', [
        { imageUri: 'frame1.png', duration: 500, transition: 'fade', transitionDuration: 200 },
        { imageUri: 'frame2.png', duration: 500, transition: 'fade', transitionDuration: 200 },
      ]);

      expect(animation.id).toBeDefined();
      expect(animation.name).toBe('Test Animation');
      expect(animation.frames).toHaveLength(2);
    });

    it('should set active animation', () => {
      const animation = imageResizerService.createStartupAnimation('New Animation', [
        { imageUri: 'frame1.png', duration: 500, transition: 'fade', transitionDuration: 200 },
      ]);

      const result = imageResizerService.setActiveStartupAnimation(animation.id);
      expect(result).toBe(true);

      const updated = imageResizerService.getStartupAnimation(animation.id);
      expect(updated?.isActive).toBe(true);
    });

    it('should add animation frame', () => {
      const animation = imageResizerService.createStartupAnimation('Test', [
        { imageUri: 'frame1.png', duration: 500, transition: 'fade', transitionDuration: 200 },
      ]);

      const frame = imageResizerService.addAnimationFrame(animation.id, {
        imageUri: 'frame2.png',
        duration: 300,
        transition: 'zoom',
        transitionDuration: 150,
      });

      expect(frame).toBeDefined();
      const updated = imageResizerService.getStartupAnimation(animation.id);
      expect(updated?.frames).toHaveLength(2);
    });
  });

  describe('Screensavers', () => {
    it('should have default screensaver', () => {
      const screensavers = imageResizerService.getAllScreensavers();
      expect(screensavers.length).toBeGreaterThan(0);
    });

    it('should create screensaver', () => {
      const screensaver = imageResizerService.createScreensaver({
        name: 'Test Screensaver',
        images: ['img1.jpg', 'img2.jpg'],
        displayMode: 'slideshow',
        transitionType: 'fade',
        transitionDuration: 1000,
        displayDuration: 5000,
        backgroundColor: '#000000',
        showClock: true,
        clockPosition: 'bottom-right',
        clockStyle: 'digital',
        isActive: false,
      });

      expect(screensaver.id).toBeDefined();
      expect(screensaver.name).toBe('Test Screensaver');
    });

    it('should set active screensaver', () => {
      const screensaver = imageResizerService.createScreensaver({
        name: 'New Screensaver',
        images: ['img1.jpg'],
        displayMode: 'slideshow',
        transitionType: 'fade',
        transitionDuration: 1000,
        displayDuration: 5000,
        backgroundColor: '#000000',
        showClock: false,
        clockPosition: 'center',
        clockStyle: 'digital',
        isActive: false,
      });

      const result = imageResizerService.setActiveScreensaver(screensaver.id);
      expect(result).toBe(true);

      const updated = imageResizerService.getScreensaver(screensaver.id);
      expect(updated?.isActive).toBe(true);
    });

    it('should add screensaver image', () => {
      const screensaver = imageResizerService.createScreensaver({
        name: 'Test',
        images: ['img1.jpg'],
        displayMode: 'slideshow',
        transitionType: 'fade',
        transitionDuration: 1000,
        displayDuration: 5000,
        backgroundColor: '#000000',
        showClock: false,
        clockPosition: 'center',
        clockStyle: 'digital',
        isActive: false,
      });

      const result = imageResizerService.addScreensaverImage(screensaver.id, 'img2.jpg');
      expect(result).toBe(true);

      const updated = imageResizerService.getScreensaver(screensaver.id);
      expect(updated?.images).toHaveLength(2);
    });
  });

  describe('Utilities', () => {
    it('should generate filter CSS', () => {
      const filters = imageResizerService.getFilters();
      const css = imageResizerService.generateFilterCSS(filters);
      expect(typeof css).toBe('string');
    });

    it('should calculate aspect ratio', () => {
      const ratio = imageResizerService.calculateAspectRatio(1920, 1080);
      expect(ratio).toBe('16:9');
    });

    it('should calculate fit dimensions', () => {
      const result = imageResizerService.calculateFitDimensions(
        { width: 2000, height: 1000 },
        { width: 500, height: 500 },
        'fit'
      );

      expect(result.dimensions).toBeDefined();
      expect(result.offset).toBeDefined();
    });

    it('should export configuration', () => {
      const json = imageResizerService.exportConfiguration();
      expect(typeof json).toBe('string');
      const parsed = JSON.parse(json);
      expect(parsed.startupAnimations).toBeDefined();
      expect(parsed.screensavers).toBeDefined();
    });

    it('should import configuration', () => {
      const config = {
        startupAnimations: [{
          id: 'imported-anim',
          name: 'Imported Animation',
          frames: [],
          totalDuration: 0,
          loopCount: 1,
          backgroundColor: '#000',
          isActive: false,
          createdAt: Date.now(),
        }],
        screensavers: [],
      };

      const result = imageResizerService.importConfiguration(JSON.stringify(config));
      expect(result.success).toBe(true);
      expect(result.imported.animations).toBe(1);
    });
  });
});
