/**
 * VR Mode Service
 * 
 * Provides immersive VR experience for the hospital map:
 * - 360-degree panoramic view
 * - Gyroscope-based head tracking
 * - Depth layers for 3D effect
 * - Comfort mode with vignette
 * - VR controller simulation
 */

// Platform-agnostic dimensions
const getScreenDimensions = () => {
  if (typeof window !== 'undefined') {
    return { width: window.innerWidth || 375, height: window.innerHeight || 812 };
  }
  return { width: 375, height: 812 };
};

// ============================================================================
// TYPES
// ============================================================================

export interface VRPosition {
  x: number;
  y: number;
  z: number;
}

export interface VRRotation {
  pitch: number; // Up/down (-90 to 90)
  yaw: number;   // Left/right (0 to 360)
  roll: number;  // Tilt (-180 to 180)
}

export interface VRViewport {
  fov: number;           // Field of view in degrees
  nearClip: number;      // Near clipping plane
  farClip: number;       // Far clipping plane
  aspectRatio: number;
}

export interface VRLayer {
  id: string;
  name: string;
  depth: number;         // Distance from camera (0-100)
  opacity: number;       // 0-1
  scale: number;         // Scale factor
  parallaxFactor: number; // How much this layer moves with head tracking
  visible: boolean;
}

export interface VRControllerState {
  isConnected: boolean;
  position: VRPosition;
  rotation: VRRotation;
  buttons: {
    trigger: boolean;
    grip: boolean;
    menu: boolean;
    thumbstick: { x: number; y: number };
  };
}

export interface VRState {
  isEnabled: boolean;
  isCalibrating: boolean;
  headPosition: VRPosition;
  headRotation: VRRotation;
  viewport: VRViewport;
  layers: VRLayer[];
  comfortMode: {
    enabled: boolean;
    vignetteIntensity: number;
    tunnelVision: boolean;
    snapTurning: boolean;
    snapAngle: number;
  };
  controllers: {
    left: VRControllerState;
    right: VRControllerState;
  };
  performance: {
    fps: number;
    latency: number;
    quality: 'low' | 'medium' | 'high' | 'ultra';
  };
}

export interface VREventListener {
  onModeChange?: (enabled: boolean) => void;
  onHeadMove?: (rotation: VRRotation) => void;
  onControllerInput?: (controller: 'left' | 'right', state: VRControllerState) => void;
  onLayerChange?: (layers: VRLayer[]) => void;
  onCalibrationComplete?: () => void;
  onError?: (error: string) => void;
}

// ============================================================================
// DEFAULT VR LAYERS FOR HOSPITAL MAP
// ============================================================================

export const DEFAULT_VR_LAYERS: VRLayer[] = [
  // Sky/Background layer
  {
    id: 'sky',
    name: 'Sky',
    depth: 100,
    opacity: 1,
    scale: 5,
    parallaxFactor: 0.1,
    visible: true,
  },
  // Far buildings/environment
  {
    id: 'environment',
    name: 'Environment',
    depth: 80,
    opacity: 1,
    scale: 3,
    parallaxFactor: 0.2,
    visible: true,
  },
  // Hospital buildings
  {
    id: 'buildings',
    name: 'Hospital Buildings',
    depth: 50,
    opacity: 1,
    scale: 1.5,
    parallaxFactor: 0.5,
    visible: true,
  },
  // Walkways and roads
  {
    id: 'walkways',
    name: 'Walkways',
    depth: 30,
    opacity: 1,
    scale: 1.2,
    parallaxFactor: 0.7,
    visible: true,
  },
  // Avatars and characters
  {
    id: 'avatars',
    name: 'Avatars',
    depth: 20,
    opacity: 1,
    scale: 1,
    parallaxFactor: 0.8,
    visible: true,
  },
  // UI elements
  {
    id: 'ui',
    name: 'UI Overlay',
    depth: 5,
    opacity: 0.9,
    scale: 1,
    parallaxFactor: 0,
    visible: true,
  },
  // Vignette/comfort overlay
  {
    id: 'vignette',
    name: 'Comfort Vignette',
    depth: 1,
    opacity: 0.3,
    scale: 1,
    parallaxFactor: 0,
    visible: false,
  },
];

// ============================================================================
// VR MODE SERVICE CLASS
// ============================================================================

class VRModeService {
  private state: VRState;
  private listeners: Set<VREventListener>;
  private gyroscopeSubscription: any;
  private updateInterval: NodeJS.Timeout | null;
  private fpsCounter: number;
  private lastFrameTime: number;

  constructor() {
    const { width, height } = getScreenDimensions();
    
    this.state = {
      isEnabled: false,
      isCalibrating: false,
      headPosition: { x: 0, y: 1.6, z: 0 }, // Default standing height
      headRotation: { pitch: 0, yaw: 0, roll: 0 },
      viewport: {
        fov: 90,
        nearClip: 0.1,
        farClip: 1000,
        aspectRatio: width / height,
      },
      layers: [...DEFAULT_VR_LAYERS],
      comfortMode: {
        enabled: true,
        vignetteIntensity: 0.3,
        tunnelVision: false,
        snapTurning: true,
        snapAngle: 45,
      },
      controllers: {
        left: this.createDefaultControllerState(),
        right: this.createDefaultControllerState(),
      },
      performance: {
        fps: 60,
        latency: 0,
        quality: 'high',
      },
    };
    
    this.listeners = new Set();
    this.gyroscopeSubscription = null;
    this.updateInterval = null;
    this.fpsCounter = 0;
    this.lastFrameTime = Date.now();
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Enable VR mode
   */
  async enable(): Promise<void> {
    if (this.state.isEnabled) return;

    this.state.isEnabled = true;
    this.state.isCalibrating = true;

    // Start gyroscope tracking (simulated for now)
    this.startHeadTracking();
    
    // Start performance monitoring
    this.startPerformanceMonitoring();

    // Enable vignette layer for comfort
    this.updateLayerVisibility('vignette', this.state.comfortMode.enabled);

    // Simulate calibration
    setTimeout(() => {
      this.state.isCalibrating = false;
      this.notifyCalibrationComplete();
    }, 2000);

    this.notifyModeChange(true);
  }

  /**
   * Disable VR mode
   */
  disable(): void {
    if (!this.state.isEnabled) return;

    this.state.isEnabled = false;
    this.stopHeadTracking();
    this.stopPerformanceMonitoring();
    this.notifyModeChange(false);
  }

  /**
   * Toggle VR mode
   */
  toggle(): void {
    if (this.state.isEnabled) {
      this.disable();
    } else {
      this.enable();
    }
  }

  /**
   * Get current state
   */
  getState(): VRState {
    return { ...this.state };
  }

  /**
   * Set head rotation (for manual control)
   */
  setHeadRotation(rotation: Partial<VRRotation>): void {
    this.state.headRotation = {
      ...this.state.headRotation,
      ...rotation,
    };
    
    // Clamp values
    this.state.headRotation.pitch = Math.max(-90, Math.min(90, this.state.headRotation.pitch));
    this.state.headRotation.yaw = ((this.state.headRotation.yaw % 360) + 360) % 360;
    this.state.headRotation.roll = Math.max(-180, Math.min(180, this.state.headRotation.roll));

    this.notifyHeadMove(this.state.headRotation);
  }

  /**
   * Look at a specific point
   */
  lookAt(target: VRPosition): void {
    const dx = target.x - this.state.headPosition.x;
    const dy = target.y - this.state.headPosition.y;
    const dz = target.z - this.state.headPosition.z;

    const yaw = Math.atan2(dx, dz) * (180 / Math.PI);
    const pitch = Math.atan2(dy, Math.sqrt(dx * dx + dz * dz)) * (180 / Math.PI);

    this.setHeadRotation({ yaw, pitch });
  }

  /**
   * Move head position
   */
  moveHead(delta: Partial<VRPosition>): void {
    this.state.headPosition = {
      x: this.state.headPosition.x + (delta.x || 0),
      y: this.state.headPosition.y + (delta.y || 0),
      z: this.state.headPosition.z + (delta.z || 0),
    };
  }

  /**
   * Teleport to position
   */
  teleportTo(position: VRPosition): void {
    this.state.headPosition = { ...position };
  }

  /**
   * Set comfort mode settings
   */
  setComfortMode(settings: Partial<VRState['comfortMode']>): void {
    this.state.comfortMode = {
      ...this.state.comfortMode,
      ...settings,
    };

    this.updateLayerVisibility('vignette', this.state.comfortMode.enabled);
    
    const vignetteLayer = this.state.layers.find(l => l.id === 'vignette');
    if (vignetteLayer) {
      vignetteLayer.opacity = this.state.comfortMode.vignetteIntensity;
    }
  }

  /**
   * Set quality level
   */
  setQuality(quality: VRState['performance']['quality']): void {
    this.state.performance.quality = quality;
    
    // Adjust layers based on quality
    switch (quality) {
      case 'low':
        this.state.viewport.fov = 80;
        break;
      case 'medium':
        this.state.viewport.fov = 90;
        break;
      case 'high':
        this.state.viewport.fov = 100;
        break;
      case 'ultra':
        this.state.viewport.fov = 110;
        break;
    }
  }

  /**
   * Update layer visibility
   */
  updateLayerVisibility(layerId: string, visible: boolean): void {
    const layer = this.state.layers.find(l => l.id === layerId);
    if (layer) {
      layer.visible = visible;
      this.notifyLayerChange();
    }
  }

  /**
   * Update layer properties
   */
  updateLayer(layerId: string, updates: Partial<VRLayer>): void {
    const layer = this.state.layers.find(l => l.id === layerId);
    if (layer) {
      Object.assign(layer, updates);
      this.notifyLayerChange();
    }
  }

  /**
   * Get parallax offset for a layer based on head rotation
   */
  getParallaxOffset(layerId: string): { x: number; y: number } {
    const layer = this.state.layers.find(l => l.id === layerId);
    if (!layer) return { x: 0, y: 0 };

    return {
      x: -this.state.headRotation.yaw * layer.parallaxFactor * 0.5,
      y: this.state.headRotation.pitch * layer.parallaxFactor * 0.3,
    };
  }

  /**
   * Simulate controller input
   */
  simulateControllerInput(
    controller: 'left' | 'right',
    input: Partial<VRControllerState['buttons']>
  ): void {
    const ctrl = this.state.controllers[controller];
    ctrl.buttons = { ...ctrl.buttons, ...input };
    this.notifyControllerInput(controller, ctrl);
  }

  /**
   * Add event listener
   */
  addListener(listener: VREventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Recenter view
   */
  recenter(): void {
    this.state.headRotation = { pitch: 0, yaw: 0, roll: 0 };
    this.notifyHeadMove(this.state.headRotation);
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private createDefaultControllerState(): VRControllerState {
    return {
      isConnected: false,
      position: { x: 0, y: 0, z: 0 },
      rotation: { pitch: 0, yaw: 0, roll: 0 },
      buttons: {
        trigger: false,
        grip: false,
        menu: false,
        thumbstick: { x: 0, y: 0 },
      },
    };
  }

  private startHeadTracking(): void {
    // Simulated head tracking using interval
    // In a real implementation, this would use DeviceMotion or gyroscope
    this.updateInterval = setInterval(() => {
      if (!this.state.isEnabled) return;

      // Simulate slight head movement for demo
      const time = Date.now() / 1000;
      const wobble = {
        pitch: Math.sin(time * 0.5) * 0.5,
        yaw: Math.sin(time * 0.3) * 0.3,
        roll: Math.sin(time * 0.7) * 0.2,
      };

      // Only apply wobble if not actively controlled
      // In real implementation, this would be gyroscope data
    }, 16); // ~60fps
  }

  private stopHeadTracking(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  private startPerformanceMonitoring(): void {
    setInterval(() => {
      const now = Date.now();
      const delta = now - this.lastFrameTime;
      this.state.performance.fps = Math.round(1000 / delta);
      this.state.performance.latency = delta;
      this.lastFrameTime = now;
    }, 1000);
  }

  private stopPerformanceMonitoring(): void {
    // Performance monitoring cleanup
  }

  // ============================================================================
  // NOTIFICATION METHODS
  // ============================================================================

  private notifyModeChange(enabled: boolean): void {
    this.listeners.forEach(l => l.onModeChange?.(enabled));
  }

  private notifyHeadMove(rotation: VRRotation): void {
    this.listeners.forEach(l => l.onHeadMove?.(rotation));
  }

  private notifyControllerInput(controller: 'left' | 'right', state: VRControllerState): void {
    this.listeners.forEach(l => l.onControllerInput?.(controller, state));
  }

  private notifyLayerChange(): void {
    this.listeners.forEach(l => l.onLayerChange?.(this.state.layers));
  }

  private notifyCalibrationComplete(): void {
    this.listeners.forEach(l => l.onCalibrationComplete?.());
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  destroy(): void {
    this.disable();
    this.listeners.clear();
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const vrModeService = new VRModeService();
export default vrModeService;
