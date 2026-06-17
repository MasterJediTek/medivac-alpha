/**
 * Gesture Handler Tests
 * 
 * Tests for gesture state management logic without importing React Native components
 */

import { describe, it, expect, beforeEach } from 'vitest';

// ============================================================================
// GESTURE STATE MANAGER (Standalone for testing)
// ============================================================================

interface GestureState {
  scale: number;
  translateX: number;
  translateY: number;
  rotation: number;
  isGesturing: boolean;
  gestureType: 'pinch' | 'pan' | 'tap' | 'doubleTap' | null;
}

interface GestureConfig {
  minScale: number;
  maxScale: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  doubleTapScale: number;
}

const DEFAULT_CONFIG: GestureConfig = {
  minScale: 0.5,
  maxScale: 4.0,
  minX: -500,
  maxX: 500,
  minY: -500,
  maxY: 500,
  doubleTapScale: 2.0,
};

class TestGestureStateManager {
  private scale: number = 1;
  private translateX: number = 0;
  private translateY: number = 0;
  private rotation: number = 0;
  private savedScale: number = 1;
  private savedTranslateX: number = 0;
  private savedTranslateY: number = 0;
  private config: GestureConfig;
  private listeners: Set<(state: GestureState) => void> = new Set();
  private isGesturing: boolean = false;
  private gestureType: GestureState['gestureType'] = null;

  constructor(config: GestureConfig = DEFAULT_CONFIG) {
    this.config = config;
  }

  setConfig(config: Partial<GestureConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getState(): GestureState {
    return {
      scale: this.scale,
      translateX: this.translateX,
      translateY: this.translateY,
      rotation: this.rotation,
      isGesturing: this.isGesturing,
      gestureType: this.gestureType,
    };
  }

  setInitialState(scale: number, translateX: number, translateY: number): void {
    this.scale = scale;
    this.translateX = translateX;
    this.translateY = translateY;
    this.savedScale = scale;
    this.savedTranslateX = translateX;
    this.savedTranslateY = translateY;
    this.notifyListeners();
  }

  onPinchStart(): void {
    this.savedScale = this.scale;
    this.isGesturing = true;
    this.gestureType = 'pinch';
    this.notifyListeners();
  }

  onPinchUpdate(scale: number): void {
    const newScale = Math.min(
      Math.max(this.savedScale * scale, this.config.minScale),
      this.config.maxScale
    );
    this.scale = newScale;
    this.notifyListeners();
  }

  onPinchEnd(): void {
    this.savedScale = this.scale;
    this.isGesturing = false;
    this.gestureType = null;
    this.notifyListeners();
  }

  onPanStart(): void {
    this.savedTranslateX = this.translateX;
    this.savedTranslateY = this.translateY;
    this.isGesturing = true;
    this.gestureType = 'pan';
    this.notifyListeners();
  }

  onPanUpdate(translationX: number, translationY: number): void {
    this.translateX = Math.min(
      Math.max(this.savedTranslateX + translationX, this.config.minX),
      this.config.maxX
    );
    this.translateY = Math.min(
      Math.max(this.savedTranslateY + translationY, this.config.minY),
      this.config.maxY
    );
    this.notifyListeners();
  }

  onPanEnd(): void {
    this.savedTranslateX = this.translateX;
    this.savedTranslateY = this.translateY;
    this.isGesturing = false;
    this.gestureType = null;
    this.notifyListeners();
  }

  onDoubleTap(): void {
    const targetScale = this.scale > 1.5 ? 1 : this.config.doubleTapScale;
    if (targetScale <= 1) {
      this.translateX = 0;
      this.translateY = 0;
    }
    this.scale = targetScale;
    this.savedScale = targetScale;
    this.savedTranslateX = this.translateX;
    this.savedTranslateY = this.translateY;
    this.notifyListeners();
  }

  reset(): void {
    this.scale = 1;
    this.translateX = 0;
    this.translateY = 0;
    this.rotation = 0;
    this.savedScale = 1;
    this.savedTranslateX = 0;
    this.savedTranslateY = 0;
    this.isGesturing = false;
    this.gestureType = null;
    this.notifyListeners();
  }

  addListener(callback: (state: GestureState) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach(listener => listener(state));
  }

  destroy(): void {
    this.listeners.clear();
  }
}

// ============================================================================
// TESTS
// ============================================================================

describe('Gesture State Manager', () => {
  let manager: TestGestureStateManager;

  beforeEach(() => {
    manager = new TestGestureStateManager();
  });

  describe('Initial State', () => {
    it('should have default state', () => {
      const state = manager.getState();
      expect(state.scale).toBe(1);
      expect(state.translateX).toBe(0);
      expect(state.translateY).toBe(0);
      expect(state.rotation).toBe(0);
      expect(state.isGesturing).toBe(false);
      expect(state.gestureType).toBeNull();
    });

    it('should set initial state', () => {
      manager.setInitialState(2, 100, 50);
      const state = manager.getState();
      expect(state.scale).toBe(2);
      expect(state.translateX).toBe(100);
      expect(state.translateY).toBe(50);
    });
  });

  describe('Pinch Gestures', () => {
    it('should start pinch gesture', () => {
      manager.onPinchStart();
      const state = manager.getState();
      expect(state.isGesturing).toBe(true);
      expect(state.gestureType).toBe('pinch');
    });

    it('should update scale on pinch', () => {
      manager.onPinchStart();
      manager.onPinchUpdate(1.5);
      const state = manager.getState();
      expect(state.scale).toBe(1.5);
    });

    it('should clamp scale to max', () => {
      manager.onPinchStart();
      manager.onPinchUpdate(10);
      const state = manager.getState();
      expect(state.scale).toBe(4.0);
    });

    it('should clamp scale to min', () => {
      manager.onPinchStart();
      manager.onPinchUpdate(0.1);
      const state = manager.getState();
      expect(state.scale).toBe(0.5);
    });

    it('should end pinch gesture', () => {
      manager.onPinchStart();
      manager.onPinchEnd();
      const state = manager.getState();
      expect(state.isGesturing).toBe(false);
      expect(state.gestureType).toBeNull();
    });
  });

  describe('Pan Gestures', () => {
    it('should start pan gesture', () => {
      manager.onPanStart();
      const state = manager.getState();
      expect(state.isGesturing).toBe(true);
      expect(state.gestureType).toBe('pan');
    });

    it('should update translation on pan', () => {
      manager.onPanStart();
      manager.onPanUpdate(100, 50);
      const state = manager.getState();
      expect(state.translateX).toBe(100);
      expect(state.translateY).toBe(50);
    });

    it('should clamp translation to bounds', () => {
      manager.onPanStart();
      manager.onPanUpdate(1000, 1000);
      const state = manager.getState();
      expect(state.translateX).toBe(500);
      expect(state.translateY).toBe(500);
    });

    it('should end pan gesture', () => {
      manager.onPanStart();
      manager.onPanEnd();
      const state = manager.getState();
      expect(state.isGesturing).toBe(false);
      expect(state.gestureType).toBeNull();
    });
  });

  describe('Double Tap', () => {
    it('should zoom in on double tap when scale is 1', () => {
      manager.onDoubleTap();
      const state = manager.getState();
      expect(state.scale).toBe(2.0);
    });

    it('should zoom out on double tap when already zoomed', () => {
      manager.setInitialState(2, 0, 0);
      manager.onDoubleTap();
      const state = manager.getState();
      expect(state.scale).toBe(1);
    });
  });

  describe('Reset', () => {
    it('should reset to default state', () => {
      manager.setInitialState(2, 100, 50);
      manager.reset();
      const state = manager.getState();
      expect(state.scale).toBe(1);
      expect(state.translateX).toBe(0);
      expect(state.translateY).toBe(0);
    });
  });

  describe('Listeners', () => {
    it('should add and remove listener', () => {
      let callCount = 0;
      const unsubscribe = manager.addListener(() => {
        callCount++;
      });
      
      manager.onPanStart();
      expect(callCount).toBe(1);
      
      unsubscribe();
      manager.onPanEnd();
      expect(callCount).toBe(1);
    });

    it('should notify on state changes', () => {
      let lastState: GestureState | null = null;
      manager.addListener((state) => {
        lastState = state;
      });
      
      manager.onPanStart();
      expect(lastState?.isGesturing).toBe(true);
      expect(lastState?.gestureType).toBe('pan');
    });
  });

  describe('Configuration', () => {
    it('should update configuration', () => {
      manager.setConfig({ minScale: 0.8, maxScale: 3.0 });
      manager.onPinchStart();
      manager.onPinchUpdate(0.5);
      const state = manager.getState();
      expect(state.scale).toBe(0.8);
    });
  });
});
