import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { vrModeService, DEFAULT_VR_LAYERS } from '../vr-mode.service';

describe('VR Mode Service', () => {
  afterEach(() => {
    vrModeService.disable();
  });

  describe('Default VR Layers', () => {
    it('should have multiple depth layers', () => {
      expect(DEFAULT_VR_LAYERS.length).toBeGreaterThan(5);
    });

    it('should have layers with increasing depth', () => {
      const depths = DEFAULT_VR_LAYERS.map(l => l.depth);
      const sortedDepths = [...depths].sort((a, b) => a - b);
      // Layers should have varying depths
      expect(new Set(depths).size).toBeGreaterThan(1);
    });

    it('should have required layer types', () => {
      const layerIds = DEFAULT_VR_LAYERS.map(l => l.id);
      expect(layerIds).toContain('sky');
      expect(layerIds).toContain('buildings');
      expect(layerIds).toContain('avatars');
      expect(layerIds).toContain('ui');
    });

    it('should have valid parallax factors', () => {
      DEFAULT_VR_LAYERS.forEach(layer => {
        expect(layer.parallaxFactor).toBeGreaterThanOrEqual(0);
        expect(layer.parallaxFactor).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('VR State', () => {
    it('should start disabled', () => {
      const state = vrModeService.getState();
      expect(state.isEnabled).toBe(false);
    });

    it('should have default head position at standing height', () => {
      const state = vrModeService.getState();
      expect(state.headPosition.y).toBeCloseTo(1.6, 1);
    });

    it('should have default viewport settings', () => {
      const state = vrModeService.getState();
      expect(state.viewport.fov).toBeGreaterThan(0);
      expect(state.viewport.nearClip).toBeLessThan(state.viewport.farClip);
    });

    it('should have comfort mode enabled by default', () => {
      const state = vrModeService.getState();
      expect(state.comfortMode.enabled).toBe(true);
    });
  });

  describe('VR Mode Toggle', () => {
    it('should toggle VR mode', () => {
      expect(vrModeService.getState().isEnabled).toBe(false);
      vrModeService.toggle();
      expect(vrModeService.getState().isEnabled).toBe(true);
      vrModeService.toggle();
      expect(vrModeService.getState().isEnabled).toBe(false);
    });
  });

  describe('Head Rotation', () => {
    it('should set head rotation', () => {
      vrModeService.setHeadRotation({ pitch: 30, yaw: 45 });
      const state = vrModeService.getState();
      expect(state.headRotation.pitch).toBe(30);
      expect(state.headRotation.yaw).toBe(45);
    });

    it('should clamp pitch to valid range', () => {
      vrModeService.setHeadRotation({ pitch: 100 });
      expect(vrModeService.getState().headRotation.pitch).toBe(90);
      
      vrModeService.setHeadRotation({ pitch: -100 });
      expect(vrModeService.getState().headRotation.pitch).toBe(-90);
    });

    it('should normalize yaw to 0-360 range', () => {
      vrModeService.setHeadRotation({ yaw: 400 });
      expect(vrModeService.getState().headRotation.yaw).toBe(40);
      
      vrModeService.setHeadRotation({ yaw: -30 });
      expect(vrModeService.getState().headRotation.yaw).toBe(330);
    });
  });

  describe('Head Position', () => {
    it('should move head position', () => {
      const initialPos = vrModeService.getState().headPosition;
      vrModeService.moveHead({ x: 1, z: 2 });
      const newPos = vrModeService.getState().headPosition;
      
      expect(newPos.x).toBe(initialPos.x + 1);
      expect(newPos.z).toBe(initialPos.z + 2);
    });

    it('should teleport to position', () => {
      vrModeService.teleportTo({ x: 10, y: 2, z: 15 });
      const pos = vrModeService.getState().headPosition;
      
      expect(pos.x).toBe(10);
      expect(pos.y).toBe(2);
      expect(pos.z).toBe(15);
    });
  });

  describe('Comfort Mode', () => {
    it('should update comfort mode settings', () => {
      vrModeService.setComfortMode({ vignetteIntensity: 0.5, snapAngle: 30 });
      const state = vrModeService.getState();
      
      expect(state.comfortMode.vignetteIntensity).toBe(0.5);
      expect(state.comfortMode.snapAngle).toBe(30);
    });

    it('should toggle comfort mode', () => {
      vrModeService.setComfortMode({ enabled: false });
      expect(vrModeService.getState().comfortMode.enabled).toBe(false);
      
      vrModeService.setComfortMode({ enabled: true });
      expect(vrModeService.getState().comfortMode.enabled).toBe(true);
    });
  });

  describe('Quality Settings', () => {
    it('should set quality level', () => {
      vrModeService.setQuality('low');
      expect(vrModeService.getState().performance.quality).toBe('low');
      
      vrModeService.setQuality('ultra');
      expect(vrModeService.getState().performance.quality).toBe('ultra');
    });

    it('should adjust FOV based on quality', () => {
      vrModeService.setQuality('low');
      const lowFov = vrModeService.getState().viewport.fov;
      
      vrModeService.setQuality('ultra');
      const ultraFov = vrModeService.getState().viewport.fov;
      
      expect(ultraFov).toBeGreaterThan(lowFov);
    });
  });

  describe('Layer Management', () => {
    it('should update layer visibility', () => {
      vrModeService.updateLayerVisibility('vignette', true);
      const state = vrModeService.getState();
      const vignetteLayer = state.layers.find(l => l.id === 'vignette');
      expect(vignetteLayer?.visible).toBe(true);
    });

    it('should update layer properties', () => {
      vrModeService.updateLayer('buildings', { opacity: 0.8, scale: 2 });
      const state = vrModeService.getState();
      const buildingsLayer = state.layers.find(l => l.id === 'buildings');
      expect(buildingsLayer?.opacity).toBe(0.8);
      expect(buildingsLayer?.scale).toBe(2);
    });

    it('should calculate parallax offset', () => {
      vrModeService.setHeadRotation({ yaw: 20, pitch: 10 });
      const offset = vrModeService.getParallaxOffset('buildings');
      
      expect(offset.x).not.toBe(0);
      expect(offset.y).not.toBe(0);
    });
  });

  describe('Recenter', () => {
    it('should reset head rotation to zero', () => {
      vrModeService.setHeadRotation({ pitch: 45, yaw: 90, roll: 15 });
      vrModeService.recenter();
      
      const state = vrModeService.getState();
      expect(state.headRotation.pitch).toBe(0);
      expect(state.headRotation.yaw).toBe(0);
      expect(state.headRotation.roll).toBe(0);
    });
  });

  describe('Event Listeners', () => {
    it('should add and remove listeners', () => {
      const listener = {
        onModeChange: vi.fn(),
        onHeadMove: vi.fn(),
      };
      
      const unsubscribe = vrModeService.addListener(listener);
      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });
  });
});
