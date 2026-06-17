/**
 * Map Gesture Service
 * 
 * Handles map zoom/pan gestures:
 * - Pinch-to-zoom functionality
 * - Drag-to-pan navigation
 * - Zoom level indicators
 * - Double-tap to zoom
 * - Zoom boundaries
 * - Mini-map overview
 */

// ============================================================================
// TYPES
// ============================================================================

export interface MapViewport {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export interface MapBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minScale: number;
  maxScale: number;
}

export interface MapGestureState {
  viewport: MapViewport;
  bounds: MapBounds;
  isGesturing: boolean;
  gestureType: GestureType | null;
  zoomLevel: ZoomLevel;
  showMiniMap: boolean;
}

export type GestureType = 'pan' | 'pinch' | 'double-tap' | 'long-press';
export type ZoomLevel = 'overview' | 'campus' | 'building' | 'floor' | 'room';

export interface GestureListener {
  onViewportChange?: (viewport: MapViewport) => void;
  onZoomLevelChange?: (level: ZoomLevel) => void;
  onGestureStart?: (type: GestureType) => void;
  onGestureEnd?: () => void;
  onBoundsReached?: (edge: 'top' | 'bottom' | 'left' | 'right') => void;
}

export interface PinchGestureData {
  scale: number;
  focalX: number;
  focalY: number;
}

export interface PanGestureData {
  translationX: number;
  translationY: number;
  velocityX: number;
  velocityY: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const DEFAULT_BOUNDS: MapBounds = {
  minX: -500,
  maxX: 500,
  minY: -500,
  maxY: 500,
  minScale: 0.5,
  maxScale: 4.0,
};

export const ZOOM_LEVEL_SCALES: Record<ZoomLevel, { min: number; max: number }> = {
  overview: { min: 0.5, max: 0.8 },
  campus: { min: 0.8, max: 1.2 },
  building: { min: 1.2, max: 2.0 },
  floor: { min: 2.0, max: 3.0 },
  room: { min: 3.0, max: 4.0 },
};

export const ZOOM_PRESETS = [
  { level: 'overview' as ZoomLevel, scale: 0.6, label: 'Overview' },
  { level: 'campus' as ZoomLevel, scale: 1.0, label: 'Campus' },
  { level: 'building' as ZoomLevel, scale: 1.5, label: 'Building' },
  { level: 'floor' as ZoomLevel, scale: 2.5, label: 'Floor' },
  { level: 'room' as ZoomLevel, scale: 3.5, label: 'Room' },
];

// ============================================================================
// SERVICE CLASS
// ============================================================================

class MapGestureService {
  private viewport: MapViewport;
  private bounds: MapBounds;
  private isGesturing: boolean;
  private gestureType: GestureType | null;
  private listeners: Set<GestureListener>;
  private lastTapTime: number;
  private doubleTapDelay: number;
  private animationFrame: number | null;

  constructor() {
    this.viewport = {
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
    };
    this.bounds = { ...DEFAULT_BOUNDS };
    this.isGesturing = false;
    this.gestureType = null;
    this.listeners = new Set();
    this.lastTapTime = 0;
    this.doubleTapDelay = 300;
    this.animationFrame = null;
  }

  /**
   * Get current state
   */
  getState(): MapGestureState {
    return {
      viewport: { ...this.viewport },
      bounds: { ...this.bounds },
      isGesturing: this.isGesturing,
      gestureType: this.gestureType,
      zoomLevel: this.getZoomLevel(),
      showMiniMap: this.viewport.scale > 1.5,
    };
  }

  /**
   * Get current viewport
   */
  getViewport(): MapViewport {
    return { ...this.viewport };
  }

  /**
   * Set viewport
   */
  setViewport(viewport: Partial<MapViewport>, animate: boolean = false): void {
    const newViewport = {
      ...this.viewport,
      ...viewport,
    };
    
    // Apply bounds
    newViewport.x = this.clamp(newViewport.x, this.bounds.minX, this.bounds.maxX);
    newViewport.y = this.clamp(newViewport.y, this.bounds.minY, this.bounds.maxY);
    newViewport.scale = this.clamp(newViewport.scale, this.bounds.minScale, this.bounds.maxScale);
    
    if (animate) {
      this.animateToViewport(newViewport);
    } else {
      this.viewport = newViewport;
      this.notifyViewportChange(this.viewport);
      this.checkZoomLevelChange();
    }
  }

  /**
   * Get current zoom level
   */
  getZoomLevel(): ZoomLevel {
    const scale = this.viewport.scale;
    
    for (const [level, range] of Object.entries(ZOOM_LEVEL_SCALES)) {
      if (scale >= range.min && scale < range.max) {
        return level as ZoomLevel;
      }
    }
    
    return scale < ZOOM_LEVEL_SCALES.overview.min ? 'overview' : 'room';
  }

  /**
   * Set zoom level
   */
  setZoomLevel(level: ZoomLevel, animate: boolean = true): void {
    const preset = ZOOM_PRESETS.find(p => p.level === level);
    if (preset) {
      this.setViewport({ scale: preset.scale }, animate);
    }
  }

  /**
   * Get zoom presets
   */
  getZoomPresets(): typeof ZOOM_PRESETS {
    return [...ZOOM_PRESETS];
  }

  /**
   * Set bounds
   */
  setBounds(bounds: Partial<MapBounds>): void {
    this.bounds = { ...this.bounds, ...bounds };
    // Re-apply bounds to current viewport
    this.setViewport({});
  }

  /**
   * Handle pinch gesture
   */
  handlePinch(data: PinchGestureData): void {
    if (!this.isGesturing) {
      this.startGesture('pinch');
    }
    
    // Calculate new scale
    const newScale = this.clamp(
      this.viewport.scale * data.scale,
      this.bounds.minScale,
      this.bounds.maxScale
    );
    
    // Adjust position to zoom toward focal point
    const scaleDiff = newScale / this.viewport.scale;
    const newX = data.focalX - (data.focalX - this.viewport.x) * scaleDiff;
    const newY = data.focalY - (data.focalY - this.viewport.y) * scaleDiff;
    
    this.setViewport({
      x: newX,
      y: newY,
      scale: newScale,
    });
  }

  /**
   * Handle pan gesture
   */
  handlePan(data: PanGestureData): void {
    if (!this.isGesturing) {
      this.startGesture('pan');
    }
    
    const newX = this.viewport.x + data.translationX / this.viewport.scale;
    const newY = this.viewport.y + data.translationY / this.viewport.scale;
    
    // Check bounds
    this.checkBoundsReached(newX, newY);
    
    this.setViewport({
      x: newX,
      y: newY,
    });
  }

  /**
   * Handle tap
   */
  handleTap(x: number, y: number): boolean {
    const now = Date.now();
    const isDoubleTap = now - this.lastTapTime < this.doubleTapDelay;
    this.lastTapTime = now;
    
    if (isDoubleTap) {
      this.handleDoubleTap(x, y);
      return true;
    }
    
    return false;
  }

  /**
   * Handle double tap to zoom
   */
  handleDoubleTap(x: number, y: number): void {
    this.startGesture('double-tap');
    
    // Cycle through zoom levels
    const currentLevel = this.getZoomLevel();
    const currentIndex = ZOOM_PRESETS.findIndex(p => p.level === currentLevel);
    const nextIndex = (currentIndex + 1) % ZOOM_PRESETS.length;
    const nextPreset = ZOOM_PRESETS[nextIndex];
    
    // Zoom toward tap point
    const scaleDiff = nextPreset.scale / this.viewport.scale;
    const newX = x - (x - this.viewport.x) * scaleDiff;
    const newY = y - (y - this.viewport.y) * scaleDiff;
    
    this.setViewport({
      x: newX,
      y: newY,
      scale: nextPreset.scale,
    }, true);
    
    this.endGesture();
  }

  /**
   * Handle long press
   */
  handleLongPress(x: number, y: number): void {
    this.startGesture('long-press');
    // Long press could be used for context menu or marker placement
    this.endGesture();
  }

  /**
   * Zoom in
   */
  zoomIn(factor: number = 1.5): void {
    this.setViewport({
      scale: this.viewport.scale * factor,
    }, true);
  }

  /**
   * Zoom out
   */
  zoomOut(factor: number = 1.5): void {
    this.setViewport({
      scale: this.viewport.scale / factor,
    }, true);
  }

  /**
   * Reset to default view
   */
  resetView(animate: boolean = true): void {
    this.setViewport({
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
    }, animate);
  }

  /**
   * Center on point
   */
  centerOn(x: number, y: number, scale?: number, animate: boolean = true): void {
    this.setViewport({
      x: -x,
      y: -y,
      scale: scale ?? this.viewport.scale,
    }, animate);
  }

  /**
   * Fit to bounds
   */
  fitToBounds(
    targetBounds: { minX: number; maxX: number; minY: number; maxY: number },
    viewportWidth: number,
    viewportHeight: number,
    padding: number = 50,
    animate: boolean = true
  ): void {
    const boundsWidth = targetBounds.maxX - targetBounds.minX + padding * 2;
    const boundsHeight = targetBounds.maxY - targetBounds.minY + padding * 2;
    
    const scaleX = viewportWidth / boundsWidth;
    const scaleY = viewportHeight / boundsHeight;
    const scale = Math.min(scaleX, scaleY, this.bounds.maxScale);
    
    const centerX = (targetBounds.minX + targetBounds.maxX) / 2;
    const centerY = (targetBounds.minY + targetBounds.maxY) / 2;
    
    this.setViewport({
      x: -centerX,
      y: -centerY,
      scale: Math.max(scale, this.bounds.minScale),
    }, animate);
  }

  /**
   * Get mini-map viewport
   */
  getMiniMapViewport(miniMapSize: number): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    const mapRange = this.bounds.maxX - this.bounds.minX;
    const viewportSize = miniMapSize / this.viewport.scale;
    
    return {
      x: ((this.viewport.x - this.bounds.minX) / mapRange) * miniMapSize,
      y: ((this.viewport.y - this.bounds.minY) / mapRange) * miniMapSize,
      width: (viewportSize / mapRange) * miniMapSize,
      height: (viewportSize / mapRange) * miniMapSize,
    };
  }

  /**
   * Start gesture
   */
  startGesture(type: GestureType): void {
    this.isGesturing = true;
    this.gestureType = type;
    this.notifyGestureStart(type);
  }

  /**
   * End gesture
   */
  endGesture(): void {
    this.isGesturing = false;
    this.gestureType = null;
    this.notifyGestureEnd();
  }

  /**
   * Animate to viewport
   */
  private animateToViewport(target: MapViewport, duration: number = 300): void {
    const start = { ...this.viewport };
    const startTime = Date.now();
    
    // Check if requestAnimationFrame is available (not in test environment)
    const hasRAF = typeof requestAnimationFrame !== 'undefined';
    
    if (!hasRAF) {
      // In test environment, just set the target directly
      this.viewport = { ...target };
      this.notifyViewportChange(this.viewport);
      this.checkZoomLevelChange();
      return;
    }
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = this.easeOutCubic(progress);
      
      this.viewport = {
        x: start.x + (target.x - start.x) * eased,
        y: start.y + (target.y - start.y) * eased,
        scale: start.scale + (target.scale - start.scale) * eased,
        rotation: start.rotation + (target.rotation - start.rotation) * eased,
      };
      
      this.notifyViewportChange(this.viewport);
      
      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(animate);
      } else {
        this.animationFrame = null;
        this.checkZoomLevelChange();
      }
    };
    
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    
    animate();
  }

  /**
   * Easing function
   */
  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  /**
   * Clamp value
   */
  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Check bounds reached
   */
  private checkBoundsReached(x: number, y: number): void {
    if (x <= this.bounds.minX) this.notifyBoundsReached('left');
    if (x >= this.bounds.maxX) this.notifyBoundsReached('right');
    if (y <= this.bounds.minY) this.notifyBoundsReached('top');
    if (y >= this.bounds.maxY) this.notifyBoundsReached('bottom');
  }

  /**
   * Check zoom level change
   */
  private checkZoomLevelChange(): void {
    const newLevel = this.getZoomLevel();
    this.notifyZoomLevelChange(newLevel);
  }

  /**
   * Add listener
   */
  addListener(listener: GestureListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify viewport change
   */
  private notifyViewportChange(viewport: MapViewport): void {
    this.listeners.forEach(l => l.onViewportChange?.(viewport));
  }

  /**
   * Notify zoom level change
   */
  private notifyZoomLevelChange(level: ZoomLevel): void {
    this.listeners.forEach(l => l.onZoomLevelChange?.(level));
  }

  /**
   * Notify gesture start
   */
  private notifyGestureStart(type: GestureType): void {
    this.listeners.forEach(l => l.onGestureStart?.(type));
  }

  /**
   * Notify gesture end
   */
  private notifyGestureEnd(): void {
    this.listeners.forEach(l => l.onGestureEnd?.());
  }

  /**
   * Notify bounds reached
   */
  private notifyBoundsReached(edge: 'top' | 'bottom' | 'left' | 'right'): void {
    this.listeners.forEach(l => l.onBoundsReached?.(edge));
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    this.listeners.clear();
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const mapGestureService = new MapGestureService();
export default mapGestureService;
