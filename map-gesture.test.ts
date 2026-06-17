/**
 * Map Gesture Service Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  mapGestureService,
  DEFAULT_BOUNDS,
  ZOOM_LEVEL_SCALES,
  ZOOM_PRESETS,
} from '../map-gesture.service';

describe('Map Gesture Service', () => {
  beforeEach(() => {
    mapGestureService.resetView(false);
  });

  afterEach(() => {
    mapGestureService.destroy();
  });

  describe('Viewport', () => {
    it('should get current viewport', () => {
      const viewport = mapGestureService.getViewport();
      expect(viewport.x).toBe(0);
      expect(viewport.y).toBe(0);
      expect(viewport.scale).toBe(1);
      expect(viewport.rotation).toBe(0);
    });

    it('should set viewport', () => {
      mapGestureService.setViewport({ x: 100, y: 50, scale: 1.5 }, false);
      const viewport = mapGestureService.getViewport();
      expect(viewport.x).toBe(100);
      expect(viewport.y).toBe(50);
      expect(viewport.scale).toBe(1.5);
    });

    it('should clamp viewport to bounds', () => {
      mapGestureService.setViewport({ x: 1000, y: 1000, scale: 10 }, false);
      const viewport = mapGestureService.getViewport();
      expect(viewport.x).toBe(DEFAULT_BOUNDS.maxX);
      expect(viewport.y).toBe(DEFAULT_BOUNDS.maxY);
      expect(viewport.scale).toBe(DEFAULT_BOUNDS.maxScale);
    });

    it('should reset view', () => {
      mapGestureService.setViewport({ x: 100, y: 50, scale: 2 }, false);
      mapGestureService.resetView(false);
      const viewport = mapGestureService.getViewport();
      expect(viewport.x).toBe(0);
      expect(viewport.y).toBe(0);
      expect(viewport.scale).toBe(1);
    });
  });

  describe('State', () => {
    it('should get current state', () => {
      const state = mapGestureService.getState();
      expect(state.viewport).toBeDefined();
      expect(state.bounds).toBeDefined();
      expect(state.isGesturing).toBe(false);
      expect(state.gestureType).toBeNull();
      expect(state.zoomLevel).toBeDefined();
    });

    it('should show mini map when zoomed in', () => {
      mapGestureService.setViewport({ scale: 2 }, false);
      const state = mapGestureService.getState();
      expect(state.showMiniMap).toBe(true);
    });

    it('should hide mini map when zoomed out', () => {
      mapGestureService.setViewport({ scale: 1 }, false);
      const state = mapGestureService.getState();
      expect(state.showMiniMap).toBe(false);
    });
  });

  describe('Zoom Levels', () => {
    it('should get current zoom level', () => {
      const level = mapGestureService.getZoomLevel();
      expect(['overview', 'campus', 'building', 'floor', 'room']).toContain(level);
    });

    it('should set zoom level', () => {
      mapGestureService.setZoomLevel('building', false);
      const level = mapGestureService.getZoomLevel();
      expect(level).toBe('building');
    });

    it('should get zoom presets', () => {
      const presets = mapGestureService.getZoomPresets();
      expect(presets.length).toBe(5);
      expect(presets[0].level).toBe('overview');
    });
  });

  describe('Zoom Operations', () => {
    it('should zoom in', () => {
      const initialScale = mapGestureService.getViewport().scale;
      mapGestureService.zoomIn(1.5);
      const newScale = mapGestureService.getViewport().scale;
      expect(newScale).toBeGreaterThan(initialScale);
    });

    it('should zoom out', () => {
      mapGestureService.setViewport({ scale: 2 }, false);
      const initialScale = mapGestureService.getViewport().scale;
      mapGestureService.zoomOut(1.5);
      const newScale = mapGestureService.getViewport().scale;
      expect(newScale).toBeLessThan(initialScale);
    });

    it('should not zoom beyond max scale', () => {
      mapGestureService.setViewport({ scale: DEFAULT_BOUNDS.maxScale }, false);
      mapGestureService.zoomIn(2);
      const viewport = mapGestureService.getViewport();
      expect(viewport.scale).toBe(DEFAULT_BOUNDS.maxScale);
    });

    it('should not zoom below min scale', () => {
      mapGestureService.setViewport({ scale: DEFAULT_BOUNDS.minScale }, false);
      mapGestureService.zoomOut(2);
      const viewport = mapGestureService.getViewport();
      expect(viewport.scale).toBe(DEFAULT_BOUNDS.minScale);
    });
  });

  describe('Gestures', () => {
    it('should handle pinch gesture', () => {
      mapGestureService.handlePinch({
        scale: 1.5,
        focalX: 0,
        focalY: 0,
      });
      const state = mapGestureService.getState();
      expect(state.isGesturing).toBe(true);
      expect(state.gestureType).toBe('pinch');
      mapGestureService.endGesture();
    });

    it('should handle pan gesture', () => {
      mapGestureService.handlePan({
        translationX: 50,
        translationY: 30,
        velocityX: 0,
        velocityY: 0,
      });
      const state = mapGestureService.getState();
      expect(state.isGesturing).toBe(true);
      expect(state.gestureType).toBe('pan');
      mapGestureService.endGesture();
    });

    it('should handle tap (not double tap)', async () => {
      // Wait to ensure no previous tap timing
      await new Promise(r => setTimeout(r, 400));
      const isDoubleTap = mapGestureService.handleTap(100, 100);
      expect(isDoubleTap).toBe(false);
    });

    it('should handle double tap', async () => {
      // Wait to ensure no previous tap timing
      await new Promise(r => setTimeout(r, 400));
      mapGestureService.handleTap(100, 100);
      // Simulate quick second tap
      const isDoubleTap = mapGestureService.handleTap(100, 100);
      expect(isDoubleTap).toBe(true);
    });

    it('should end gesture', () => {
      mapGestureService.handlePan({
        translationX: 50,
        translationY: 30,
        velocityX: 0,
        velocityY: 0,
      });
      mapGestureService.endGesture();
      const state = mapGestureService.getState();
      expect(state.isGesturing).toBe(false);
      expect(state.gestureType).toBeNull();
    });
  });

  describe('Navigation', () => {
    it('should center on point', () => {
      mapGestureService.centerOn(100, 50, 1.5, false);
      const viewport = mapGestureService.getViewport();
      expect(viewport.x).toBe(-100);
      expect(viewport.y).toBe(-50);
      expect(viewport.scale).toBe(1.5);
    });

    it('should fit to bounds', () => {
      mapGestureService.fitToBounds(
        { minX: -100, maxX: 100, minY: -50, maxY: 50 },
        400,
        300,
        0,
        false
      );
      const viewport = mapGestureService.getViewport();
      // Check approximately zero (handles -0 vs 0)
      expect(Math.abs(viewport.x)).toBeLessThanOrEqual(0.001);
      expect(Math.abs(viewport.y)).toBeLessThanOrEqual(0.001);
    });
  });

  describe('Mini Map', () => {
    it('should get mini map viewport', () => {
      const miniMapViewport = mapGestureService.getMiniMapViewport(100);
      expect(miniMapViewport.x).toBeDefined();
      expect(miniMapViewport.y).toBeDefined();
      expect(miniMapViewport.width).toBeDefined();
      expect(miniMapViewport.height).toBeDefined();
    });
  });

  describe('Bounds', () => {
    it('should set custom bounds', () => {
      mapGestureService.setBounds({ minScale: 0.8, maxScale: 3.0 });
      mapGestureService.setViewport({ scale: 0.5 }, false);
      const viewport = mapGestureService.getViewport();
      expect(viewport.scale).toBe(0.8);
    });
  });

  describe('Listeners', () => {
    it('should add and remove listener', () => {
      let viewportChanged = false;
      const unsubscribe = mapGestureService.addListener({
        onViewportChange: () => {
          viewportChanged = true;
        },
      });
      mapGestureService.setViewport({ x: 50 }, false);
      expect(viewportChanged).toBe(true);
      unsubscribe();
    });

    it('should notify zoom level change', () => {
      let newLevel: string | null = null;
      const unsubscribe = mapGestureService.addListener({
        onZoomLevelChange: (level) => {
          newLevel = level;
        },
      });
      mapGestureService.setZoomLevel('building', false);
      expect(newLevel).toBe('building');
      unsubscribe();
    });

    it('should notify gesture start and end', () => {
      let gestureStarted = false;
      let gestureEnded = false;
      const unsubscribe = mapGestureService.addListener({
        onGestureStart: () => {
          gestureStarted = true;
        },
        onGestureEnd: () => {
          gestureEnded = true;
        },
      });
      mapGestureService.handlePan({
        translationX: 10,
        translationY: 10,
        velocityX: 0,
        velocityY: 0,
      });
      expect(gestureStarted).toBe(true);
      mapGestureService.endGesture();
      expect(gestureEnded).toBe(true);
      unsubscribe();
    });
  });

  describe('Constants', () => {
    it('should have default bounds', () => {
      expect(DEFAULT_BOUNDS.minX).toBeDefined();
      expect(DEFAULT_BOUNDS.maxX).toBeDefined();
      expect(DEFAULT_BOUNDS.minScale).toBeDefined();
      expect(DEFAULT_BOUNDS.maxScale).toBeDefined();
    });

    it('should have zoom level scales', () => {
      expect(ZOOM_LEVEL_SCALES.overview).toBeDefined();
      expect(ZOOM_LEVEL_SCALES.campus).toBeDefined();
      expect(ZOOM_LEVEL_SCALES.building).toBeDefined();
      expect(ZOOM_LEVEL_SCALES.floor).toBeDefined();
      expect(ZOOM_LEVEL_SCALES.room).toBeDefined();
    });

    it('should have zoom presets', () => {
      expect(ZOOM_PRESETS.length).toBe(5);
      ZOOM_PRESETS.forEach(preset => {
        expect(preset.level).toBeDefined();
        expect(preset.scale).toBeDefined();
        expect(preset.label).toBeDefined();
      });
    });
  });
});
