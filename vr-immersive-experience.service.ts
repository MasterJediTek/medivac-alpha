/**
 * VR Immersive Experience Service
 * 
 * Prepares the virtual hospital map for VR viewing with:
 * - 360-degree view preparation
 * - Head tracking simulation
 * - Depth perception layers
 * - VR controller mapping
 * - Immersive audio positioning
 * - VR menu system
 * - Comfort mode options
 * - VR tutorial walkthrough
 */

// ============================================================================
// VR TYPES
// ============================================================================

export interface VRSession {
  id: string;
  userId: string;
  startTime: number;
  mode: VRMode;
  headset: VRHeadset;
  controllers: VRControllerState[];
  tracking: TrackingState;
  audio: VRAudioState;
  comfort: ComfortState;
  performance: PerformanceMetrics;
}

export type VRMode = 'immersive-vr' | 'immersive-ar' | 'inline' | '360-video';

export interface VRHeadset {
  type: HeadsetType;
  name: string;
  resolution: { width: number; height: number };
  refreshRate: number;
  fov: number;
  ipd: number;
  tracking: '3dof' | '6dof';
  controllers: 'none' | 'basic' | 'full';
}

export type HeadsetType = 
  | 'meta-quest-3'
  | 'meta-quest-pro'
  | 'apple-vision-pro'
  | 'pico-4'
  | 'htc-vive-pro'
  | 'valve-index'
  | 'playstation-vr2'
  | 'generic-cardboard'
  | 'web-xr';

export interface VRControllerState {
  id: string;
  hand: 'left' | 'right';
  connected: boolean;
  position: Vector3;
  rotation: Quaternion;
  buttons: ButtonState[];
  axes: AxisState[];
  haptics: HapticState;
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface ButtonState {
  id: string;
  pressed: boolean;
  touched: boolean;
  value: number;
}

export interface AxisState {
  id: string;
  x: number;
  y: number;
}

export interface HapticState {
  intensity: number;
  duration: number;
  pattern: 'pulse' | 'continuous' | 'ramp';
}

export interface TrackingState {
  headPosition: Vector3;
  headRotation: Quaternion;
  leftHandPosition?: Vector3;
  leftHandRotation?: Quaternion;
  rightHandPosition?: Vector3;
  rightHandRotation?: Quaternion;
  roomScale: boolean;
  boundaryVisible: boolean;
  floorLevel: number;
}

export interface VRAudioState {
  spatialEnabled: boolean;
  hrtfEnabled: boolean;
  ambisonicsEnabled: boolean;
  listenerPosition: Vector3;
  listenerRotation: Quaternion;
  masterVolume: number;
  sources: AudioSource[];
}

export interface AudioSource {
  id: string;
  type: 'ambient' | 'effect' | 'voice' | 'music';
  position: Vector3;
  volume: number;
  loop: boolean;
  playing: boolean;
  spatialBlend: number;
  minDistance: number;
  maxDistance: number;
}

export interface ComfortState {
  vignetteEnabled: boolean;
  vignetteIntensity: number;
  snapTurnEnabled: boolean;
  snapTurnAngle: number;
  teleportEnabled: boolean;
  smoothLocomotion: boolean;
  locomotionSpeed: number;
  seatedMode: boolean;
  heightAdjustment: number;
  motionSicknessLevel: 'none' | 'mild' | 'moderate' | 'severe';
}

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  gpuTime: number;
  cpuTime: number;
  droppedFrames: number;
  reprojectionActive: boolean;
  renderScale: number;
}

// ============================================================================
// VR MENU SYSTEM
// ============================================================================

export interface VRMenu {
  id: string;
  type: VRMenuType;
  title: string;
  items: VRMenuItem[];
  position: Vector3;
  rotation: Quaternion;
  scale: number;
  visible: boolean;
  interactable: boolean;
  attachedTo: 'world' | 'head' | 'left-hand' | 'right-hand';
}

export type VRMenuType = 'radial' | 'list' | 'grid' | 'floating' | 'wrist';

export interface VRMenuItem {
  id: string;
  label: string;
  icon: string;
  description?: string;
  action: string;
  enabled: boolean;
  selected: boolean;
  submenu?: VRMenuItem[];
  shortcut?: string;
}

// ============================================================================
// VR TUTORIAL
// ============================================================================

export interface VRTutorial {
  id: string;
  name: string;
  steps: TutorialStep[];
  currentStep: number;
  completed: boolean;
  skippable: boolean;
  duration: number;
}

export interface TutorialStep {
  id: string;
  title: string;
  instruction: string;
  voiceover: string;
  voiceId: string;
  action: TutorialAction;
  highlightTarget?: string;
  position?: Vector3;
  duration: number;
  completionCriteria: CompletionCriteria;
  hints: string[];
}

export interface TutorialAction {
  type: 'look' | 'point' | 'grab' | 'press' | 'move' | 'teleport' | 'speak' | 'wait';
  target?: string;
  button?: string;
  direction?: Vector3;
  distance?: number;
}

export interface CompletionCriteria {
  type: 'button-press' | 'gaze-target' | 'reach-position' | 'grab-object' | 'time-elapsed' | 'voice-command';
  target?: string;
  duration?: number;
  tolerance?: number;
}

// ============================================================================
// 360 VIEW SYSTEM
// ============================================================================

export interface View360 {
  id: string;
  name: string;
  type: '360-photo' | '360-video' | '360-render';
  source: string;
  position: Vector3;
  hotspots: Hotspot360[];
  transitions: Transition360[];
  audio?: AudioSource;
  metadata: View360Metadata;
}

export interface Hotspot360 {
  id: string;
  type: 'info' | 'navigation' | 'action' | 'media';
  position: { pitch: number; yaw: number };
  icon: string;
  label: string;
  content?: string;
  targetView?: string;
  action?: string;
  animation: string;
}

export interface Transition360 {
  id: string;
  fromView: string;
  toView: string;
  type: 'fade' | 'dissolve' | 'wipe' | 'zoom' | 'portal';
  duration: number;
  easing: string;
}

export interface View360Metadata {
  location: string;
  captureDate: string;
  photographer?: string;
  description: string;
  tags: string[];
}

// ============================================================================
// DEPTH PERCEPTION
// ============================================================================

export interface DepthLayer {
  id: string;
  name: string;
  depth: number;
  parallaxFactor: number;
  elements: DepthElement[];
  blurAmount: number;
  opacity: number;
}

export interface DepthElement {
  id: string;
  type: 'building' | 'character' | 'prop' | 'effect' | 'ui';
  position: Vector3;
  scale: Vector3;
  rotation: Quaternion;
  model?: string;
  texture?: string;
  animation?: string;
  interactable: boolean;
}

// ============================================================================
// VR IMMERSIVE EXPERIENCE SERVICE
// ============================================================================

export class VRImmersiveExperienceService {
  private activeSession: VRSession | null = null;
  private menus: Map<string, VRMenu> = new Map();
  private tutorials: Map<string, VRTutorial> = new Map();
  private views360: Map<string, View360> = new Map();
  private depthLayers: Map<string, DepthLayer> = new Map();
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    this.initializeDefaultMenus();
    this.initializeTutorials();
    this.initializeHospital360Views();
    this.initializeDepthLayers();
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  private initializeDefaultMenus(): void {
    // Main VR Menu
    this.menus.set('main-menu', {
      id: 'main-menu',
      type: 'radial',
      title: 'Main Menu',
      items: [
        { id: 'navigate', label: 'Navigate', icon: '🧭', action: 'open-navigation', enabled: true, selected: false },
        { id: 'departments', label: 'Departments', icon: '🏥', action: 'open-departments', enabled: true, selected: false },
        { id: 'help', label: 'Help', icon: '❓', action: 'open-help', enabled: true, selected: false },
        { id: 'settings', label: 'Settings', icon: '⚙️', action: 'open-settings', enabled: true, selected: false },
        { id: 'comfort', label: 'Comfort', icon: '🛋️', action: 'open-comfort', enabled: true, selected: false },
        { id: 'exit', label: 'Exit VR', icon: '🚪', action: 'exit-vr', enabled: true, selected: false }
      ],
      position: { x: 0, y: 1.5, z: -1 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: 1,
      visible: false,
      interactable: true,
      attachedTo: 'world'
    });

    // Wrist Menu
    this.menus.set('wrist-menu', {
      id: 'wrist-menu',
      type: 'wrist',
      title: 'Quick Actions',
      items: [
        { id: 'teleport', label: 'Teleport', icon: '✨', action: 'toggle-teleport', enabled: true, selected: false },
        { id: 'map', label: 'Map', icon: '🗺️', action: 'show-map', enabled: true, selected: false },
        { id: 'recenter', label: 'Recenter', icon: '🎯', action: 'recenter-view', enabled: true, selected: false },
        { id: 'volume', label: 'Volume', icon: '🔊', action: 'adjust-volume', enabled: true, selected: false }
      ],
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: 0.5,
      visible: false,
      interactable: true,
      attachedTo: 'left-hand'
    });

    // Department Selection Menu
    this.menus.set('department-menu', {
      id: 'department-menu',
      type: 'grid',
      title: 'Select Department',
      items: [
        { id: 'emergency', label: 'Emergency', icon: '🚨', action: 'goto-emergency', enabled: true, selected: false },
        { id: 'maternity', label: 'Maternity', icon: '👶', action: 'goto-maternity', enabled: true, selected: false },
        { id: 'paediatrics', label: 'Paediatrics', icon: '🧸', action: 'goto-paediatrics', enabled: true, selected: false },
        { id: 'mental-health', label: 'Mental Health', icon: '🧠', action: 'goto-mental-health', enabled: true, selected: false },
        { id: 'pathology', label: 'Pathology', icon: '🔬', action: 'goto-pathology', enabled: true, selected: false },
        { id: 'physiotherapy', label: 'Physiotherapy', icon: '🏃', action: 'goto-physiotherapy', enabled: true, selected: false },
        { id: 'radiology', label: 'Radiology', icon: '📷', action: 'goto-radiology', enabled: true, selected: false },
        { id: 'pharmacy', label: 'Pharmacy', icon: '💊', action: 'goto-pharmacy', enabled: true, selected: false },
        { id: 'surgical', label: 'Surgical', icon: '🏥', action: 'goto-surgical', enabled: true, selected: false },
        { id: 'medical', label: 'Medical', icon: '🩺', action: 'goto-medical', enabled: true, selected: false },
        { id: 'cafeteria', label: 'Cafeteria', icon: '☕', action: 'goto-cafeteria', enabled: true, selected: false },
        { id: 'chapel', label: 'Chapel', icon: '🕊️', action: 'goto-chapel', enabled: true, selected: false }
      ],
      position: { x: 0, y: 1.6, z: -1.5 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: 1.2,
      visible: false,
      interactable: true,
      attachedTo: 'world'
    });
  }

  private initializeTutorials(): void {
    // VR Controls Tutorial
    this.tutorials.set('vr-controls', {
      id: 'vr-controls',
      name: 'VR Controls Tutorial',
      steps: [
        {
          id: 'welcome',
          title: 'Welcome to VR',
          instruction: 'Welcome to the Kalgoorlie Health Campus virtual tour! Let\'s learn how to navigate.',
          voiceover: 'Welcome to the Kalgoorlie Health Campus virtual tour. I\'ll guide you through the controls.',
          voiceId: 'friendly-female',
          action: { type: 'wait' },
          duration: 5000,
          completionCriteria: { type: 'time-elapsed', duration: 5000 },
          hints: ['Just relax and look around']
        },
        {
          id: 'look-around',
          title: 'Look Around',
          instruction: 'Turn your head to look around the hospital entrance.',
          voiceover: 'Try turning your head to look around. You can see the hospital entrance and surrounding buildings.',
          voiceId: 'friendly-female',
          action: { type: 'look', direction: { x: 0, y: 1, z: 0 } },
          highlightTarget: 'main-hospital',
          duration: 8000,
          completionCriteria: { type: 'gaze-target', target: 'main-hospital', duration: 2000 },
          hints: ['Look towards the main building', 'Turn your head slowly']
        },
        {
          id: 'point-controller',
          title: 'Point with Controller',
          instruction: 'Point your controller at the information sign.',
          voiceover: 'Now try pointing your controller at objects. Point at the information sign to highlight it.',
          voiceId: 'friendly-female',
          action: { type: 'point', target: 'info-kiosk-1' },
          highlightTarget: 'info-kiosk-1',
          duration: 10000,
          completionCriteria: { type: 'gaze-target', target: 'info-kiosk-1', duration: 1500 },
          hints: ['Extend your arm and point', 'Look for the glowing sign']
        },
        {
          id: 'trigger-select',
          title: 'Select with Trigger',
          instruction: 'Press the trigger button to select the highlighted object.',
          voiceover: 'When pointing at an object, press the trigger button on your controller to select it.',
          voiceId: 'friendly-female',
          action: { type: 'press', button: 'trigger' },
          duration: 10000,
          completionCriteria: { type: 'button-press', target: 'trigger' },
          hints: ['The trigger is under your index finger', 'Squeeze gently']
        },
        {
          id: 'teleport',
          title: 'Teleport Movement',
          instruction: 'Press the thumbstick to show teleport arc, then release to teleport.',
          voiceover: 'To move around, press and hold the thumbstick to show a teleport arc. Release to teleport to that location.',
          voiceId: 'friendly-female',
          action: { type: 'teleport', distance: 5 },
          duration: 15000,
          completionCriteria: { type: 'reach-position', tolerance: 3 },
          hints: ['Press the thumbstick forward', 'Aim at the ground', 'Release to teleport']
        },
        {
          id: 'open-menu',
          title: 'Open Menu',
          instruction: 'Press the menu button to open the main menu.',
          voiceover: 'Press the menu button on your controller to access navigation, settings, and more.',
          voiceId: 'friendly-female',
          action: { type: 'press', button: 'menu' },
          duration: 10000,
          completionCriteria: { type: 'button-press', target: 'menu' },
          hints: ['The menu button is usually on the left controller', 'Look for the three lines icon']
        },
        {
          id: 'complete',
          title: 'Tutorial Complete',
          instruction: 'Great job! You\'re ready to explore the hospital.',
          voiceover: 'Excellent! You\'ve learned the basics. Feel free to explore the hospital at your own pace.',
          voiceId: 'friendly-female',
          action: { type: 'wait' },
          duration: 5000,
          completionCriteria: { type: 'time-elapsed', duration: 5000 },
          hints: ['Enjoy your tour!']
        }
      ],
      currentStep: 0,
      completed: false,
      skippable: true,
      duration: 63000
    });

    // Accessibility Tutorial
    this.tutorials.set('accessibility-tutorial', {
      id: 'accessibility-tutorial',
      name: 'Accessibility Features',
      steps: [
        {
          id: 'intro',
          title: 'Accessibility Options',
          instruction: 'Learn about accessibility features available in VR.',
          voiceover: 'Kalgoorlie Health Campus VR includes several accessibility features to ensure everyone can enjoy the experience.',
          voiceId: 'calm-male',
          action: { type: 'wait' },
          duration: 6000,
          completionCriteria: { type: 'time-elapsed', duration: 6000 },
          hints: []
        },
        {
          id: 'comfort-options',
          title: 'Comfort Settings',
          instruction: 'Access comfort settings for motion sensitivity.',
          voiceover: 'If you experience motion discomfort, you can enable snap turning, teleport-only movement, and vignette effects.',
          voiceId: 'calm-male',
          action: { type: 'wait' },
          duration: 8000,
          completionCriteria: { type: 'time-elapsed', duration: 8000 },
          hints: ['Open settings menu', 'Select Comfort']
        },
        {
          id: 'seated-mode',
          title: 'Seated Mode',
          instruction: 'Enable seated mode for comfortable viewing.',
          voiceover: 'Seated mode adjusts the view height and movement speed for those who prefer to sit during the experience.',
          voiceId: 'calm-male',
          action: { type: 'wait' },
          duration: 6000,
          completionCriteria: { type: 'time-elapsed', duration: 6000 },
          hints: []
        }
      ],
      currentStep: 0,
      completed: false,
      skippable: true,
      duration: 20000
    });
  }

  private initializeHospital360Views(): void {
    // Main Entrance 360 View
    this.views360.set('main-entrance', {
      id: 'main-entrance',
      name: 'Main Entrance',
      type: '360-render',
      source: 'hospital-entrance-360',
      position: { x: 50, y: 1.6, z: 42 },
      hotspots: [
        {
          id: 'reception-hotspot',
          type: 'navigation',
          position: { pitch: 0, yaw: 0 },
          icon: '🚪',
          label: 'Enter Reception',
          targetView: 'reception-area',
          animation: 'pulse'
        },
        {
          id: 'parking-hotspot',
          type: 'navigation',
          position: { pitch: -10, yaw: 180 },
          icon: '🅿️',
          label: 'Visitor Parking',
          targetView: 'parking-area',
          animation: 'pulse'
        },
        {
          id: 'emergency-hotspot',
          type: 'navigation',
          position: { pitch: 0, yaw: -60 },
          icon: '🚨',
          label: 'Emergency Department',
          targetView: 'emergency-entrance',
          animation: 'pulse'
        },
        {
          id: 'info-hotspot',
          type: 'info',
          position: { pitch: 10, yaw: 30 },
          icon: 'ℹ️',
          label: 'Hospital Information',
          content: 'Kalgoorlie Health Campus - 106 bed regional hospital serving the Goldfields community.',
          animation: 'bounce'
        }
      ],
      transitions: [
        { id: 't1', fromView: 'main-entrance', toView: 'reception-area', type: 'fade', duration: 1000, easing: 'ease-in-out' },
        { id: 't2', fromView: 'main-entrance', toView: 'parking-area', type: 'dissolve', duration: 1500, easing: 'ease-out' },
        { id: 't3', fromView: 'main-entrance', toView: 'emergency-entrance', type: 'wipe', duration: 1200, easing: 'ease-in' }
      ],
      audio: {
        id: 'entrance-ambient',
        type: 'ambient',
        position: { x: 50, y: 1.6, z: 42 },
        volume: 0.3,
        loop: true,
        playing: true,
        spatialBlend: 0.5,
        minDistance: 1,
        maxDistance: 20
      },
      metadata: {
        location: 'Main Entrance, 15 Piccadilly Street',
        captureDate: '2026-01-15',
        description: 'The main entrance to Kalgoorlie Health Campus',
        tags: ['entrance', 'main', 'reception']
      }
    });

    // Emergency Department 360 View
    this.views360.set('emergency-entrance', {
      id: 'emergency-entrance',
      name: 'Emergency Department',
      type: '360-render',
      source: 'emergency-360',
      position: { x: 35, y: 1.6, z: 40 },
      hotspots: [
        {
          id: 'ed-triage',
          type: 'info',
          position: { pitch: 0, yaw: 0 },
          icon: '👨‍⚕️',
          label: 'Triage Area',
          content: '24/7 emergency triage - please report to the triage nurse on arrival.',
          animation: 'pulse'
        },
        {
          id: 'ambulance-bay-view',
          type: 'navigation',
          position: { pitch: 0, yaw: -90 },
          icon: '🚑',
          label: 'Ambulance Bay',
          targetView: 'ambulance-bay',
          animation: 'pulse'
        },
        {
          id: 'back-to-main',
          type: 'navigation',
          position: { pitch: 0, yaw: 120 },
          icon: '🏥',
          label: 'Main Hospital',
          targetView: 'main-entrance',
          animation: 'pulse'
        }
      ],
      transitions: [
        { id: 't4', fromView: 'emergency-entrance', toView: 'ambulance-bay', type: 'fade', duration: 1000, easing: 'ease-in-out' },
        { id: 't5', fromView: 'emergency-entrance', toView: 'main-entrance', type: 'dissolve', duration: 1200, easing: 'ease-out' }
      ],
      metadata: {
        location: 'Emergency Department Entrance',
        captureDate: '2026-01-15',
        description: 'Emergency Department entrance with 24/7 access',
        tags: ['emergency', 'ed', 'urgent']
      }
    });

    // Mental Health - Maritana Street 360 View
    this.views360.set('mental-health-entrance', {
      id: 'mental-health-entrance',
      name: 'Community Mental Health',
      type: '360-render',
      source: 'mental-health-360',
      position: { x: 25, y: 1.6, z: 65 },
      hotspots: [
        {
          id: 'mh-reception',
          type: 'navigation',
          position: { pitch: 0, yaw: 0 },
          icon: '🚪',
          label: 'Enter Reception',
          targetView: 'mh-reception',
          animation: 'pulse'
        },
        {
          id: 'therapy-garden-view',
          type: 'navigation',
          position: { pitch: -5, yaw: -90 },
          icon: '🌿',
          label: 'Therapy Garden',
          targetView: 'therapy-garden',
          animation: 'pulse'
        },
        {
          id: 'mh-info',
          type: 'info',
          position: { pitch: 10, yaw: 45 },
          icon: 'ℹ️',
          label: 'About Mental Health Services',
          content: 'Community Mental Health provides counseling, psychiatric care, and support programs for the Goldfields region.',
          animation: 'bounce'
        }
      ],
      transitions: [
        { id: 't6', fromView: 'mental-health-entrance', toView: 'mh-reception', type: 'fade', duration: 1000, easing: 'ease-in-out' },
        { id: 't7', fromView: 'mental-health-entrance', toView: 'therapy-garden', type: 'dissolve', duration: 1500, easing: 'ease-out' }
      ],
      audio: {
        id: 'mh-ambient',
        type: 'ambient',
        position: { x: 25, y: 1.6, z: 65 },
        volume: 0.2,
        loop: true,
        playing: true,
        spatialBlend: 0.3,
        minDistance: 1,
        maxDistance: 15
      },
      metadata: {
        location: 'Maritana Street, Kalgoorlie',
        captureDate: '2026-01-15',
        description: 'Community Mental Health building on Maritana Street',
        tags: ['mental-health', 'maritana', 'community']
      }
    });
  }

  private initializeDepthLayers(): void {
    // Background layer (sky, distant buildings)
    this.depthLayers.set('background', {
      id: 'background',
      name: 'Background',
      depth: 100,
      parallaxFactor: 0.1,
      elements: [
        {
          id: 'sky-dome',
          type: 'effect',
          position: { x: 50, y: 50, z: -100 },
          scale: { x: 200, y: 200, z: 200 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          texture: 'goldfields-sky',
          interactable: false
        }
      ],
      blurAmount: 0,
      opacity: 1
    });

    // Mid-ground layer (hospital buildings)
    this.depthLayers.set('buildings', {
      id: 'buildings',
      name: 'Hospital Buildings',
      depth: 20,
      parallaxFactor: 0.5,
      elements: [],
      blurAmount: 0,
      opacity: 1
    });

    // Foreground layer (characters, props)
    this.depthLayers.set('foreground', {
      id: 'foreground',
      name: 'Foreground',
      depth: 5,
      parallaxFactor: 1.0,
      elements: [],
      blurAmount: 0,
      opacity: 1
    });

    // UI layer (menus, tooltips)
    this.depthLayers.set('ui', {
      id: 'ui',
      name: 'User Interface',
      depth: 1,
      parallaxFactor: 0,
      elements: [],
      blurAmount: 0,
      opacity: 1
    });
  }

  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================

  /**
   * Start VR session
   */
  startVRSession(userId: string, headsetType: HeadsetType = 'web-xr'): VRSession {
    const headset = this.getHeadsetConfig(headsetType);
    
    this.activeSession = {
      id: `vr-session-${Date.now()}`,
      userId,
      startTime: Date.now(),
      mode: 'immersive-vr',
      headset,
      controllers: [
        this.createControllerState('left'),
        this.createControllerState('right')
      ],
      tracking: {
        headPosition: { x: 50, y: 1.6, z: 42 },
        headRotation: { x: 0, y: 0, z: 0, w: 1 },
        roomScale: headset.tracking === '6dof',
        boundaryVisible: false,
        floorLevel: 0
      },
      audio: {
        spatialEnabled: true,
        hrtfEnabled: true,
        ambisonicsEnabled: false,
        listenerPosition: { x: 50, y: 1.6, z: 42 },
        listenerRotation: { x: 0, y: 0, z: 0, w: 1 },
        masterVolume: 0.8,
        sources: []
      },
      comfort: {
        vignetteEnabled: true,
        vignetteIntensity: 0.3,
        snapTurnEnabled: true,
        snapTurnAngle: 45,
        teleportEnabled: true,
        smoothLocomotion: false,
        locomotionSpeed: 2,
        seatedMode: false,
        heightAdjustment: 0,
        motionSicknessLevel: 'none'
      },
      performance: {
        fps: 90,
        frameTime: 11.1,
        gpuTime: 8,
        cpuTime: 5,
        droppedFrames: 0,
        reprojectionActive: false,
        renderScale: 1.0
      }
    };

    this.emit('vr-session-started', this.activeSession);
    return this.activeSession;
  }

  /**
   * End VR session
   */
  endVRSession(): void {
    if (this.activeSession) {
      this.emit('vr-session-ended', {
        sessionId: this.activeSession.id,
        duration: Date.now() - this.activeSession.startTime
      });
      this.activeSession = null;
    }
  }

  /**
   * Get active session
   */
  getActiveSession(): VRSession | null {
    return this.activeSession;
  }

  private getHeadsetConfig(type: HeadsetType): VRHeadset {
    const configs: Record<HeadsetType, VRHeadset> = {
      'meta-quest-3': {
        type: 'meta-quest-3',
        name: 'Meta Quest 3',
        resolution: { width: 2064, height: 2208 },
        refreshRate: 120,
        fov: 110,
        ipd: 64,
        tracking: '6dof',
        controllers: 'full'
      },
      'meta-quest-pro': {
        type: 'meta-quest-pro',
        name: 'Meta Quest Pro',
        resolution: { width: 1800, height: 1920 },
        refreshRate: 90,
        fov: 106,
        ipd: 64,
        tracking: '6dof',
        controllers: 'full'
      },
      'apple-vision-pro': {
        type: 'apple-vision-pro',
        name: 'Apple Vision Pro',
        resolution: { width: 3660, height: 3200 },
        refreshRate: 90,
        fov: 120,
        ipd: 64,
        tracking: '6dof',
        controllers: 'none'
      },
      'pico-4': {
        type: 'pico-4',
        name: 'Pico 4',
        resolution: { width: 2160, height: 2160 },
        refreshRate: 90,
        fov: 105,
        ipd: 64,
        tracking: '6dof',
        controllers: 'full'
      },
      'htc-vive-pro': {
        type: 'htc-vive-pro',
        name: 'HTC Vive Pro',
        resolution: { width: 1440, height: 1600 },
        refreshRate: 90,
        fov: 110,
        ipd: 64,
        tracking: '6dof',
        controllers: 'full'
      },
      'valve-index': {
        type: 'valve-index',
        name: 'Valve Index',
        resolution: { width: 1440, height: 1600 },
        refreshRate: 144,
        fov: 130,
        ipd: 64,
        tracking: '6dof',
        controllers: 'full'
      },
      'playstation-vr2': {
        type: 'playstation-vr2',
        name: 'PlayStation VR2',
        resolution: { width: 2000, height: 2040 },
        refreshRate: 120,
        fov: 110,
        ipd: 64,
        tracking: '6dof',
        controllers: 'full'
      },
      'generic-cardboard': {
        type: 'generic-cardboard',
        name: 'Google Cardboard',
        resolution: { width: 1080, height: 1920 },
        refreshRate: 60,
        fov: 90,
        ipd: 64,
        tracking: '3dof',
        controllers: 'none'
      },
      'web-xr': {
        type: 'web-xr',
        name: 'WebXR Device',
        resolution: { width: 1920, height: 1080 },
        refreshRate: 60,
        fov: 100,
        ipd: 64,
        tracking: '6dof',
        controllers: 'basic'
      }
    };

    return configs[type] || configs['web-xr'];
  }

  private createControllerState(hand: 'left' | 'right'): VRControllerState {
    return {
      id: `controller-${hand}`,
      hand,
      connected: true,
      position: { x: hand === 'left' ? 49.5 : 50.5, y: 1.2, z: 42.3 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      buttons: [
        { id: 'trigger', pressed: false, touched: false, value: 0 },
        { id: 'grip', pressed: false, touched: false, value: 0 },
        { id: 'thumbstick', pressed: false, touched: false, value: 0 },
        { id: 'button-a', pressed: false, touched: false, value: 0 },
        { id: 'button-b', pressed: false, touched: false, value: 0 },
        { id: 'menu', pressed: false, touched: false, value: 0 }
      ],
      axes: [
        { id: 'thumbstick', x: 0, y: 0 }
      ],
      haptics: { intensity: 0, duration: 0, pattern: 'pulse' }
    };
  }

  // ============================================================================
  // TRACKING
  // ============================================================================

  /**
   * Update head tracking
   */
  updateHeadTracking(position: Vector3, rotation: Quaternion): void {
    if (this.activeSession) {
      this.activeSession.tracking.headPosition = position;
      this.activeSession.tracking.headRotation = rotation;
      this.activeSession.audio.listenerPosition = position;
      this.activeSession.audio.listenerRotation = rotation;
      this.emit('head-tracking-updated', { position, rotation });
    }
  }

  /**
   * Update controller tracking
   */
  updateControllerTracking(hand: 'left' | 'right', position: Vector3, rotation: Quaternion): void {
    if (this.activeSession) {
      const controller = this.activeSession.controllers.find(c => c.hand === hand);
      if (controller) {
        controller.position = position;
        controller.rotation = rotation;
        this.emit('controller-tracking-updated', { hand, position, rotation });
      }
    }
  }

  /**
   * Process controller input
   */
  processControllerInput(hand: 'left' | 'right', buttonId: string, pressed: boolean, value: number = pressed ? 1 : 0): void {
    if (this.activeSession) {
      const controller = this.activeSession.controllers.find(c => c.hand === hand);
      if (controller) {
        const button = controller.buttons.find(b => b.id === buttonId);
        if (button) {
          button.pressed = pressed;
          button.value = value;
          this.emit('controller-input', { hand, buttonId, pressed, value });
        }
      }
    }
  }

  // ============================================================================
  // COMFORT SETTINGS
  // ============================================================================

  /**
   * Update comfort settings
   */
  updateComfortSettings(settings: Partial<ComfortState>): ComfortState | null {
    if (this.activeSession) {
      this.activeSession.comfort = { ...this.activeSession.comfort, ...settings };
      this.emit('comfort-settings-updated', this.activeSession.comfort);
      return this.activeSession.comfort;
    }
    return null;
  }

  /**
   * Apply motion sickness preset
   */
  applyMotionSicknessPreset(level: ComfortState['motionSicknessLevel']): ComfortState | null {
    const presets: Record<ComfortState['motionSicknessLevel'], Partial<ComfortState>> = {
      'none': {
        vignetteEnabled: false,
        snapTurnEnabled: false,
        teleportEnabled: false,
        smoothLocomotion: true,
        locomotionSpeed: 3
      },
      'mild': {
        vignetteEnabled: true,
        vignetteIntensity: 0.2,
        snapTurnEnabled: false,
        teleportEnabled: true,
        smoothLocomotion: true,
        locomotionSpeed: 2
      },
      'moderate': {
        vignetteEnabled: true,
        vignetteIntensity: 0.4,
        snapTurnEnabled: true,
        snapTurnAngle: 45,
        teleportEnabled: true,
        smoothLocomotion: false,
        locomotionSpeed: 1.5
      },
      'severe': {
        vignetteEnabled: true,
        vignetteIntensity: 0.6,
        snapTurnEnabled: true,
        snapTurnAngle: 30,
        teleportEnabled: true,
        smoothLocomotion: false,
        locomotionSpeed: 1,
        seatedMode: true
      }
    };

    return this.updateComfortSettings({ ...presets[level], motionSicknessLevel: level });
  }

  // ============================================================================
  // MENU SYSTEM
  // ============================================================================

  /**
   * Show menu
   */
  showMenu(menuId: string): VRMenu | null {
    const menu = this.menus.get(menuId);
    if (menu) {
      menu.visible = true;
      this.emit('menu-shown', menu);
      return menu;
    }
    return null;
  }

  /**
   * Hide menu
   */
  hideMenu(menuId: string): void {
    const menu = this.menus.get(menuId);
    if (menu) {
      menu.visible = false;
      this.emit('menu-hidden', menu);
    }
  }

  /**
   * Select menu item
   */
  selectMenuItem(menuId: string, itemId: string): VRMenuItem | null {
    const menu = this.menus.get(menuId);
    if (menu) {
      const item = menu.items.find(i => i.id === itemId);
      if (item && item.enabled) {
        // Deselect all items
        menu.items.forEach(i => i.selected = false);
        item.selected = true;
        this.emit('menu-item-selected', { menuId, item });
        return item;
      }
    }
    return null;
  }

  /**
   * Get all menus
   */
  getAllMenus(): VRMenu[] {
    return Array.from(this.menus.values());
  }

  // ============================================================================
  // TUTORIAL SYSTEM
  // ============================================================================

  /**
   * Start tutorial
   */
  startTutorial(tutorialId: string): VRTutorial | null {
    const tutorial = this.tutorials.get(tutorialId);
    if (tutorial) {
      tutorial.currentStep = 0;
      tutorial.completed = false;
      this.emit('tutorial-started', tutorial);
      return tutorial;
    }
    return null;
  }

  /**
   * Advance tutorial step
   */
  advanceTutorialStep(tutorialId: string): TutorialStep | null {
    const tutorial = this.tutorials.get(tutorialId);
    if (tutorial && tutorial.currentStep < tutorial.steps.length - 1) {
      tutorial.currentStep++;
      const step = tutorial.steps[tutorial.currentStep];
      this.emit('tutorial-step-advanced', { tutorialId, step });
      return step;
    } else if (tutorial && tutorial.currentStep === tutorial.steps.length - 1) {
      tutorial.completed = true;
      this.emit('tutorial-completed', tutorial);
    }
    return null;
  }

  /**
   * Skip tutorial
   */
  skipTutorial(tutorialId: string): void {
    const tutorial = this.tutorials.get(tutorialId);
    if (tutorial && tutorial.skippable) {
      tutorial.completed = true;
      this.emit('tutorial-skipped', tutorial);
    }
  }

  /**
   * Get current tutorial step
   */
  getCurrentTutorialStep(tutorialId: string): TutorialStep | null {
    const tutorial = this.tutorials.get(tutorialId);
    if (tutorial && !tutorial.completed) {
      return tutorial.steps[tutorial.currentStep];
    }
    return null;
  }

  // ============================================================================
  // 360 VIEW SYSTEM
  // ============================================================================

  /**
   * Load 360 view
   */
  load360View(viewId: string): View360 | null {
    const view = this.views360.get(viewId);
    if (view) {
      this.emit('360-view-loaded', view);
      return view;
    }
    return null;
  }

  /**
   * Navigate to hotspot
   */
  navigateToHotspot(viewId: string, hotspotId: string): View360 | null {
    const currentView = this.views360.get(viewId);
    if (currentView) {
      const hotspot = currentView.hotspots.find(h => h.id === hotspotId);
      if (hotspot && hotspot.type === 'navigation' && hotspot.targetView) {
        const targetView = this.views360.get(hotspot.targetView);
        if (targetView) {
          // Find transition
          const transition = currentView.transitions.find(
            t => t.fromView === viewId && t.toView === hotspot.targetView
          );
          this.emit('360-view-transition', { from: viewId, to: hotspot.targetView, transition });
          return targetView;
        }
      }
    }
    return null;
  }

  /**
   * Get all 360 views
   */
  getAll360Views(): View360[] {
    return Array.from(this.views360.values());
  }

  // ============================================================================
  // DEPTH LAYERS
  // ============================================================================

  /**
   * Get depth layers for rendering
   */
  getDepthLayers(): DepthLayer[] {
    return Array.from(this.depthLayers.values()).sort((a, b) => b.depth - a.depth);
  }

  /**
   * Add element to depth layer
   */
  addElementToLayer(layerId: string, element: DepthElement): boolean {
    const layer = this.depthLayers.get(layerId);
    if (layer) {
      layer.elements.push(element);
      this.emit('depth-element-added', { layerId, element });
      return true;
    }
    return false;
  }

  // ============================================================================
  // HAPTIC FEEDBACK
  // ============================================================================

  /**
   * Trigger haptic feedback
   */
  triggerHaptic(hand: 'left' | 'right' | 'both', intensity: number, duration: number, pattern: HapticState['pattern'] = 'pulse'): void {
    if (this.activeSession) {
      const hands = hand === 'both' ? ['left', 'right'] : [hand];
      for (const h of hands) {
        const controller = this.activeSession.controllers.find(c => c.hand === h);
        if (controller) {
          controller.haptics = { intensity, duration, pattern };
          this.emit('haptic-triggered', { hand: h, intensity, duration, pattern });
        }
      }
    }
  }

  // ============================================================================
  // AUDIO
  // ============================================================================

  /**
   * Add spatial audio source
   */
  addAudioSource(source: AudioSource): void {
    if (this.activeSession) {
      this.activeSession.audio.sources.push(source);
      this.emit('audio-source-added', source);
    }
  }

  /**
   * Update audio listener position
   */
  updateAudioListener(position: Vector3, rotation: Quaternion): void {
    if (this.activeSession) {
      this.activeSession.audio.listenerPosition = position;
      this.activeSession.audio.listenerRotation = rotation;
    }
  }

  // ============================================================================
  // PERFORMANCE
  // ============================================================================

  /**
   * Update performance metrics
   */
  updatePerformanceMetrics(metrics: Partial<PerformanceMetrics>): void {
    if (this.activeSession) {
      this.activeSession.performance = { ...this.activeSession.performance, ...metrics };
      
      // Auto-adjust render scale if performance is poor
      if (metrics.fps && metrics.fps < 72 && this.activeSession.performance.renderScale > 0.7) {
        this.activeSession.performance.renderScale -= 0.1;
        this.emit('render-scale-adjusted', this.activeSession.performance.renderScale);
      }
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics | null {
    return this.activeSession?.performance || null;
  }

  // ============================================================================
  // EVENT SYSTEM
  // ============================================================================

  private emit(event: string, data: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(data));
    }
  }

  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }
}

// Export singleton instance
export const vrImmersiveExperienceService = new VRImmersiveExperienceService();
