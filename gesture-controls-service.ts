/**
 * Gesture Controls Service
 * MediVac WACHS v8.8
 * 
 * Provides hand gesture recognition for hands-free navigation
 * using device camera with swipe, pinch, wave, and custom gestures.
 */

export type GestureType = 
  | 'swipe-up' | 'swipe-down' | 'swipe-left' | 'swipe-right'
  | 'pinch-in' | 'pinch-out' | 'rotate-cw' | 'rotate-ccw'
  | 'wave' | 'tap' | 'double-tap' | 'long-press'
  | 'fist' | 'open-palm' | 'thumbs-up' | 'thumbs-down' | 'peace-sign' | 'ok-sign'
  | 'point-up' | 'point-down' | 'point-left' | 'point-right'
  | 'grab' | 'release' | 'push' | 'pull'
  | 'circle-cw' | 'circle-ccw' | 'zigzag' | 'custom';

export type GestureState = 'idle' | 'detecting' | 'recognized' | 'executing' | 'error';
export type GestureSource = 'camera' | 'touch' | 'accelerometer' | 'combined';

export interface GestureAction {
  type: 'navigate' | 'scroll' | 'zoom' | 'select' | 'dismiss' | 'confirm' | 'cancel' | 'macro' | 'custom';
  target?: string;
  parameters?: Record<string, unknown>;
}

export interface GestureMapping {
  id: string;
  gesture: GestureType;
  action: GestureAction;
  isEnabled: boolean;
  isBuiltIn: boolean;
  sensitivity: number; // 1-10
  cooldown: number; // ms between triggers
  lastTriggeredAt?: number;
  triggerCount: number;
  feedback: GestureFeedback;
}

export interface GestureFeedback {
  haptic?: number[];
  sound?: string;
  visual?: {
    type: 'highlight' | 'ripple' | 'glow' | 'particle' | 'trail';
    color: string;
    duration: number;
  };
  voice?: string;
}

export interface GestureDetection {
  id: string;
  gesture: GestureType;
  confidence: number;
  timestamp: number;
  source: GestureSource;
  position?: { x: number; y: number };
  velocity?: { x: number; y: number };
  duration: number;
  handedness?: 'left' | 'right' | 'both';
  fingerCount?: number;
}

export interface GestureTrainingData {
  id: string;
  gesture: GestureType;
  samples: GestureSample[];
  accuracy: number;
  trainedAt: number;
  isCustom: boolean;
}

export interface GestureSample {
  id: string;
  points: { x: number; y: number; t: number }[];
  duration: number;
  recordedAt: number;
}

export interface GestureSettings {
  enabled: boolean;
  source: GestureSource;
  sensitivity: number;
  hapticFeedback: boolean;
  soundFeedback: boolean;
  visualFeedback: boolean;
  voiceFeedback: boolean;
  showGestureGuide: boolean;
  showDetectionOverlay: boolean;
  cameraPosition: 'front' | 'back';
  detectionArea: 'full' | 'upper' | 'lower' | 'center';
  handPreference: 'left' | 'right' | 'both';
  gestureTimeout: number;
  minConfidence: number;
  debugMode: boolean;
}

export interface GestureAnalytics {
  totalDetections: number;
  successfulDetections: number;
  failedDetections: number;
  avgConfidence: number;
  gestureUsage: Record<GestureType, number>;
  detectionsByHour: number[];
  avgResponseTime: number;
  mostUsedGestures: { gesture: GestureType; count: number }[];
  errorRate: number;
}

// Sound effects for gesture feedback
export const GESTURE_SOUNDS = {
  detected: 'jedi_gesture_detected.wav',
  executed: 'jedi_gesture_executed.wav',
  failed: 'jedi_gesture_failed.wav',
  swipe: 'jedi_swipe_whoosh.wav',
  pinch: 'jedi_pinch_zoom.wav',
  tap: 'jedi_tap_click.wav',
  wave: 'jedi_wave_greeting.wav',
  fist: 'jedi_force_grip.wav',
  openPalm: 'jedi_force_push.wav',
  thumbsUp: 'jedi_approval.wav',
  peace: 'jedi_peace.wav',
  training: 'jedi_training_beep.wav',
  trainingComplete: 'jedi_training_complete.wav',
} as const;

// Haptic patterns for gesture feedback
export const GESTURE_HAPTICS = {
  detected: [30, 20, 30],
  executed: [50, 30, 100],
  failed: [100, 50, 100],
  swipe: [20, 10, 20, 10, 20],
  pinch: [40, 20, 40],
  tap: [20],
  doubleTap: [20, 30, 20],
  longPress: [100, 50, 100, 50, 100],
  wave: [30, 20, 30, 20, 30],
  fist: [200],
  openPalm: [50, 100, 50],
  thumbsUp: [100, 50, 200],
  emergency: [500, 200, 500],
} as const;

// Visual effects for gesture UI
export const GESTURE_EFFECTS = {
  swipe: { type: 'trail', color: '#3498DB', duration: 300 },
  pinch: { type: 'ripple', color: '#9B59B6', duration: 400 },
  tap: { type: 'ripple', color: '#2ECC71', duration: 200 },
  wave: { type: 'particle', color: '#F39C12', duration: 500 },
  fist: { type: 'glow', color: '#E74C3C', duration: 400 },
  openPalm: { type: 'particle', color: '#1ABC9C', duration: 600 },
  thumbsUp: { type: 'highlight', color: '#2ECC71', duration: 300 },
  peace: { type: 'particle', color: '#3498DB', duration: 400 },
  detected: { type: 'highlight', color: '#FFFFFF', duration: 150 },
  error: { type: 'glow', color: '#E74C3C', duration: 200 },
} as const;

// Gesture icons for UI
export const GESTURE_ICONS: Record<GestureType, string> = {
  'swipe-up': '👆',
  'swipe-down': '👇',
  'swipe-left': '👈',
  'swipe-right': '👉',
  'pinch-in': '🤏',
  'pinch-out': '🤲',
  'rotate-cw': '🔄',
  'rotate-ccw': '🔃',
  'wave': '👋',
  'tap': '👆',
  'double-tap': '✌️',
  'long-press': '✊',
  'fist': '✊',
  'open-palm': '🖐️',
  'thumbs-up': '👍',
  'thumbs-down': '👎',
  'peace-sign': '✌️',
  'ok-sign': '👌',
  'point-up': '☝️',
  'point-down': '👇',
  'point-left': '👈',
  'point-right': '👉',
  'grab': '🤜',
  'release': '🤛',
  'push': '🫸',
  'pull': '🫷',
  'circle-cw': '⭕',
  'circle-ccw': '⭕',
  'zigzag': '〰️',
  'custom': '⚙️',
};

type Listener = () => void;

class GestureControlsService {
  private state: GestureState = 'idle';
  private settings: GestureSettings;
  private mappings: Map<string, GestureMapping> = new Map();
  private detections: Map<string, GestureDetection> = new Map();
  private trainingData: Map<string, GestureTrainingData> = new Map();
  private analytics: GestureAnalytics;
  private listeners: Set<Listener> = new Set();
  private currentDetection: GestureDetection | null = null;

  constructor() {
    this.settings = this.getDefaultSettings();
    this.analytics = this.initializeAnalytics();
    this.initializeDefaultMappings();
  }

  private getDefaultSettings(): GestureSettings {
    return {
      enabled: true,
      source: 'camera',
      sensitivity: 7,
      hapticFeedback: true,
      soundFeedback: true,
      visualFeedback: true,
      voiceFeedback: false,
      showGestureGuide: true,
      showDetectionOverlay: false,
      cameraPosition: 'front',
      detectionArea: 'full',
      handPreference: 'both',
      gestureTimeout: 2000,
      minConfidence: 0.7,
      debugMode: false,
    };
  }

  private initializeAnalytics(): GestureAnalytics {
    return {
      totalDetections: 0,
      successfulDetections: 0,
      failedDetections: 0,
      avgConfidence: 0,
      gestureUsage: {} as Record<GestureType, number>,
      detectionsByHour: new Array(24).fill(0),
      avgResponseTime: 0,
      mostUsedGestures: [],
      errorRate: 0,
    };
  }

  private initializeDefaultMappings(): void {
    const defaultMappings: Omit<GestureMapping, 'id'>[] = [
      // Navigation gestures
      {
        gesture: 'swipe-left',
        action: { type: 'navigate', target: 'back' },
        isEnabled: true,
        isBuiltIn: true,
        sensitivity: 7,
        cooldown: 300,
        triggerCount: 0,
        feedback: {
          haptic: GESTURE_HAPTICS.swipe,
          sound: GESTURE_SOUNDS.swipe,
          visual: { type: 'trail', color: '#3498DB', duration: 300 },
        },
      },
      {
        gesture: 'swipe-right',
        action: { type: 'navigate', target: 'forward' },
        isEnabled: true,
        isBuiltIn: true,
        sensitivity: 7,
        cooldown: 300,
        triggerCount: 0,
        feedback: {
          haptic: GESTURE_HAPTICS.swipe,
          sound: GESTURE_SOUNDS.swipe,
          visual: { type: 'trail', color: '#3498DB', duration: 300 },
        },
      },
      {
        gesture: 'swipe-up',
        action: { type: 'scroll', target: 'up', parameters: { amount: 300 } },
        isEnabled: true,
        isBuiltIn: true,
        sensitivity: 7,
        cooldown: 200,
        triggerCount: 0,
        feedback: {
          haptic: GESTURE_HAPTICS.swipe,
          sound: GESTURE_SOUNDS.swipe,
          visual: { type: 'trail', color: '#2ECC71', duration: 300 },
        },
      },
      {
        gesture: 'swipe-down',
        action: { type: 'scroll', target: 'down', parameters: { amount: 300 } },
        isEnabled: true,
        isBuiltIn: true,
        sensitivity: 7,
        cooldown: 200,
        triggerCount: 0,
        feedback: {
          haptic: GESTURE_HAPTICS.swipe,
          sound: GESTURE_SOUNDS.swipe,
          visual: { type: 'trail', color: '#2ECC71', duration: 300 },
        },
      },
      // Zoom gestures
      {
        gesture: 'pinch-in',
        action: { type: 'zoom', target: 'out', parameters: { factor: 0.8 } },
        isEnabled: true,
        isBuiltIn: true,
        sensitivity: 6,
        cooldown: 300,
        triggerCount: 0,
        feedback: {
          haptic: GESTURE_HAPTICS.pinch,
          sound: GESTURE_SOUNDS.pinch,
          visual: { type: 'ripple', color: '#9B59B6', duration: 400 },
        },
      },
      {
        gesture: 'pinch-out',
        action: { type: 'zoom', target: 'in', parameters: { factor: 1.2 } },
        isEnabled: true,
        isBuiltIn: true,
        sensitivity: 6,
        cooldown: 300,
        triggerCount: 0,
        feedback: {
          haptic: GESTURE_HAPTICS.pinch,
          sound: GESTURE_SOUNDS.pinch,
          visual: { type: 'ripple', color: '#9B59B6', duration: 400 },
        },
      },
      // Selection gestures
      {
        gesture: 'tap',
        action: { type: 'select' },
        isEnabled: true,
        isBuiltIn: true,
        sensitivity: 8,
        cooldown: 150,
        triggerCount: 0,
        feedback: {
          haptic: GESTURE_HAPTICS.tap,
          sound: GESTURE_SOUNDS.tap,
          visual: { type: 'ripple', color: '#2ECC71', duration: 200 },
        },
      },
      {
        gesture: 'double-tap',
        action: { type: 'confirm' },
        isEnabled: true,
        isBuiltIn: true,
        sensitivity: 7,
        cooldown: 300,
        triggerCount: 0,
        feedback: {
          haptic: GESTURE_HAPTICS.doubleTap,
          sound: GESTURE_SOUNDS.tap,
          visual: { type: 'ripple', color: '#3498DB', duration: 300 },
        },
      },
      {
        gesture: 'long-press',
        action: { type: 'custom', target: 'context-menu' },
        isEnabled: true,
        isBuiltIn: true,
        sensitivity: 6,
        cooldown: 500,
        triggerCount: 0,
        feedback: {
          haptic: GESTURE_HAPTICS.longPress,
          sound: GESTURE_SOUNDS.detected,
          visual: { type: 'glow', color: '#F39C12', duration: 500 },
        },
      },
      // Hand gestures
      {
        gesture: 'wave',
        action: { type: 'custom', target: 'wake-screen' },
        isEnabled: true,
        isBuiltIn: true,
        sensitivity: 6,
        cooldown: 1000,
        triggerCount: 0,
        feedback: {
          haptic: GESTURE_HAPTICS.wave,
          sound: GESTURE_SOUNDS.wave,
          visual: { type: 'particle', color: '#F39C12', duration: 500 },
          voice: 'Hello! How can I help?',
        },
      },
      {
        gesture: 'fist',
        action: { type: 'dismiss' },
        isEnabled: true,
        isBuiltIn: true,
        sensitivity: 7,
        cooldown: 500,
        triggerCount: 0,
        feedback: {
          haptic: GESTURE_HAPTICS.fist,
          sound: GESTURE_SOUNDS.fist,
          visual: { type: 'glow', color: '#E74C3C', duration: 400 },
        },
      },
      {
        gesture: 'open-palm',
        action: { type: 'cancel' },
        isEnabled: true,
        isBuiltIn: true,
        sensitivity: 7,
        cooldown: 500,
        triggerCount: 0,
        feedback: {
          haptic: GESTURE_HAPTICS.openPalm,
          sound: GESTURE_SOUNDS.openPalm,
          visual: { type: 'particle', color: '#1ABC9C', duration: 600 },
        },
      },
      {
        gesture: 'thumbs-up',
        action: { type: 'confirm' },
        isEnabled: true,
        isBuiltIn: true,
        sensitivity: 8,
        cooldown: 500,
        triggerCount: 0,
        feedback: {
          haptic: GESTURE_HAPTICS.thumbsUp,
          sound: GESTURE_SOUNDS.thumbsUp,
          visual: { type: 'highlight', color: '#2ECC71', duration: 300 },
          voice: 'Confirmed!',
        },
      },
      {
        gesture: 'thumbs-down',
        action: { type: 'cancel' },
        isEnabled: true,
        isBuiltIn: true,
        sensitivity: 8,
        cooldown: 500,
        triggerCount: 0,
        feedback: {
          haptic: GESTURE_HAPTICS.thumbsUp,
          sound: GESTURE_SOUNDS.failed,
          visual: { type: 'highlight', color: '#E74C3C', duration: 300 },
          voice: 'Cancelled.',
        },
      },
      {
        gesture: 'peace-sign',
        action: { type: 'macro', target: 'emergency-protocol' },
        isEnabled: true,
        isBuiltIn: true,
        sensitivity: 9,
        cooldown: 2000,
        triggerCount: 0,
        feedback: {
          haptic: GESTURE_HAPTICS.emergency,
          sound: GESTURE_SOUNDS.peace,
          visual: { type: 'particle', color: '#3498DB', duration: 400 },
        },
      },
      // Pointing gestures
      {
        gesture: 'point-up',
        action: { type: 'navigate', target: 'home' },
        isEnabled: true,
        isBuiltIn: true,
        sensitivity: 7,
        cooldown: 500,
        triggerCount: 0,
        feedback: {
          haptic: GESTURE_HAPTICS.tap,
          sound: GESTURE_SOUNDS.detected,
          visual: { type: 'trail', color: '#9B59B6', duration: 300 },
        },
      },
      {
        gesture: 'circle-cw',
        action: { type: 'custom', target: 'volume-up', parameters: { amount: 10 } },
        isEnabled: true,
        isBuiltIn: true,
        sensitivity: 6,
        cooldown: 300,
        triggerCount: 0,
        feedback: {
          haptic: GESTURE_HAPTICS.pinch,
          sound: GESTURE_SOUNDS.detected,
          visual: { type: 'ripple', color: '#3498DB', duration: 400 },
        },
      },
      {
        gesture: 'circle-ccw',
        action: { type: 'custom', target: 'volume-down', parameters: { amount: 10 } },
        isEnabled: true,
        isBuiltIn: true,
        sensitivity: 6,
        cooldown: 300,
        triggerCount: 0,
        feedback: {
          haptic: GESTURE_HAPTICS.pinch,
          sound: GESTURE_SOUNDS.detected,
          visual: { type: 'ripple', color: '#3498DB', duration: 400 },
        },
      },
    ];

    defaultMappings.forEach((mapping, idx) => {
      const id = `gesture-${idx}`;
      this.mappings.set(id, { ...mapping, id });
    });
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // State management
  getState(): GestureState {
    return this.state;
  }

  setState(state: GestureState): void {
    this.state = state;
    this.notifyListeners();
  }

  // Settings
  getSettings(): GestureSettings {
    return { ...this.settings };
  }

  updateSettings(updates: Partial<GestureSettings>): GestureSettings {
    this.settings = { ...this.settings, ...updates };
    this.notifyListeners();
    return this.settings;
  }

  // Detection control
  startDetection(): { success: boolean; sound: string; haptic: number[] } {
    if (this.state === 'detecting') {
      return { success: false, sound: '', haptic: [] };
    }

    this.state = 'detecting';
    this.notifyListeners();

    return {
      success: true,
      sound: GESTURE_SOUNDS.detected,
      haptic: [...GESTURE_HAPTICS.detected],
    };
  }

  stopDetection(): { success: boolean; sound: string } {
    if (this.state !== 'detecting') {
      return { success: false, sound: '' };
    }

    this.state = 'idle';
    this.currentDetection = null;
    this.notifyListeners();

    return {
      success: true,
      sound: GESTURE_SOUNDS.executed,
    };
  }

  // Gesture detection (simulated)
  detectGesture(gesture: GestureType, confidence: number = 0.9, source: GestureSource = 'camera'): GestureDetection | null {
    if (!this.settings.enabled || this.state !== 'detecting') return null;
    if (confidence < this.settings.minConfidence) return null;

    const detection: GestureDetection = {
      id: `det-${Date.now()}`,
      gesture,
      confidence,
      timestamp: Date.now(),
      source,
      duration: Math.random() * 500 + 100,
      handedness: Math.random() > 0.5 ? 'right' : 'left',
      fingerCount: this.getFingerCountForGesture(gesture),
    };

    this.detections.set(detection.id, detection);
    this.currentDetection = detection;
    this.state = 'recognized';

    // Update analytics
    this.analytics.totalDetections++;
    this.analytics.successfulDetections++;
    this.analytics.gestureUsage[gesture] = (this.analytics.gestureUsage[gesture] || 0) + 1;
    this.analytics.avgConfidence = (this.analytics.avgConfidence * (this.analytics.totalDetections - 1) + confidence) / this.analytics.totalDetections;

    this.notifyListeners();
    return detection;
  }

  private getFingerCountForGesture(gesture: GestureType): number {
    const fingerCounts: Partial<Record<GestureType, number>> = {
      'fist': 0,
      'open-palm': 5,
      'thumbs-up': 1,
      'thumbs-down': 1,
      'peace-sign': 2,
      'ok-sign': 3,
      'point-up': 1,
      'point-down': 1,
      'point-left': 1,
      'point-right': 1,
      'pinch-in': 2,
      'pinch-out': 2,
    };
    return fingerCounts[gesture] ?? 5;
  }

  getCurrentDetection(): GestureDetection | null {
    return this.currentDetection;
  }

  getDetectionHistory(): GestureDetection[] {
    return Array.from(this.detections.values()).sort((a, b) => b.timestamp - a.timestamp);
  }

  // Execute gesture action
  executeGesture(detectionId: string): { success: boolean; action: GestureAction | null; feedback: GestureFeedback | null } {
    const detection = this.detections.get(detectionId);
    if (!detection) {
      return { success: false, action: null, feedback: null };
    }

    // Find mapping for this gesture
    const mapping = Array.from(this.mappings.values()).find(m => m.gesture === detection.gesture && m.isEnabled);
    if (!mapping) {
      return { success: false, action: null, feedback: null };
    }

    // Check cooldown
    if (mapping.lastTriggeredAt && Date.now() - mapping.lastTriggeredAt < mapping.cooldown) {
      return { success: false, action: null, feedback: null };
    }

    mapping.lastTriggeredAt = Date.now();
    mapping.triggerCount++;
    this.state = 'executing';
    this.notifyListeners();

    // Simulate execution
    setTimeout(() => {
      this.state = 'idle';
      this.notifyListeners();
    }, 200);

    return {
      success: true,
      action: mapping.action,
      feedback: mapping.feedback,
    };
  }

  // Mapping management
  getAllMappings(): GestureMapping[] {
    return Array.from(this.mappings.values());
  }

  getMapping(id: string): GestureMapping | undefined {
    return this.mappings.get(id);
  }

  getMappingByGesture(gesture: GestureType): GestureMapping | undefined {
    return Array.from(this.mappings.values()).find(m => m.gesture === gesture);
  }

  createMapping(data: Omit<GestureMapping, 'id' | 'isBuiltIn' | 'triggerCount'>): GestureMapping {
    const id = `gesture-custom-${Date.now()}`;
    const mapping: GestureMapping = {
      ...data,
      id,
      isBuiltIn: false,
      triggerCount: 0,
    };
    this.mappings.set(id, mapping);
    this.notifyListeners();
    return mapping;
  }

  updateMapping(id: string, updates: Partial<GestureMapping>): GestureMapping | null {
    const mapping = this.mappings.get(id);
    if (!mapping) return null;

    const updated = { ...mapping, ...updates };
    this.mappings.set(id, updated);
    this.notifyListeners();
    return updated;
  }

  deleteMapping(id: string): boolean {
    const mapping = this.mappings.get(id);
    if (!mapping || mapping.isBuiltIn) return false;

    this.mappings.delete(id);
    this.notifyListeners();
    return true;
  }

  toggleMapping(id: string): boolean {
    const mapping = this.mappings.get(id);
    if (!mapping) return false;

    mapping.isEnabled = !mapping.isEnabled;
    this.notifyListeners();
    return mapping.isEnabled;
  }

  // Training
  startTraining(gesture: GestureType): GestureTrainingData {
    const id = `training-${Date.now()}`;
    const training: GestureTrainingData = {
      id,
      gesture,
      samples: [],
      accuracy: 0,
      trainedAt: Date.now(),
      isCustom: true,
    };
    this.trainingData.set(id, training);
    this.notifyListeners();
    return training;
  }

  addTrainingSample(trainingId: string, points: { x: number; y: number; t: number }[]): GestureSample | null {
    const training = this.trainingData.get(trainingId);
    if (!training) return null;

    const sample: GestureSample = {
      id: `sample-${Date.now()}`,
      points,
      duration: points.length > 0 ? points[points.length - 1].t - points[0].t : 0,
      recordedAt: Date.now(),
    };

    training.samples.push(sample);
    training.accuracy = Math.min(100, training.samples.length * 10); // Simulated accuracy
    this.notifyListeners();
    return sample;
  }

  completeTraining(trainingId: string): { success: boolean; accuracy: number } {
    const training = this.trainingData.get(trainingId);
    if (!training || training.samples.length < 3) {
      return { success: false, accuracy: 0 };
    }

    training.trainedAt = Date.now();
    this.notifyListeners();
    return { success: true, accuracy: training.accuracy };
  }

  getTrainingData(): GestureTrainingData[] {
    return Array.from(this.trainingData.values());
  }

  // Analytics
  getAnalytics(): GestureAnalytics {
    // Update most used gestures
    const gestureEntries = Object.entries(this.analytics.gestureUsage) as [GestureType, number][];
    this.analytics.mostUsedGestures = gestureEntries
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([gesture, count]) => ({ gesture, count }));

    this.analytics.errorRate = this.analytics.totalDetections > 0
      ? (this.analytics.failedDetections / this.analytics.totalDetections) * 100
      : 0;

    return { ...this.analytics };
  }

  // Generate gesture guide
  getGestureGuide(): { gesture: GestureType; icon: string; action: string; description: string }[] {
    return Array.from(this.mappings.values())
      .filter(m => m.isEnabled)
      .map(m => ({
        gesture: m.gesture,
        icon: GESTURE_ICONS[m.gesture],
        action: m.action.type,
        description: this.getGestureDescription(m),
      }));
  }

  private getGestureDescription(mapping: GestureMapping): string {
    const descriptions: Record<string, string> = {
      'navigate-back': 'Go back to previous screen',
      'navigate-forward': 'Go forward',
      'navigate-home': 'Go to home screen',
      'scroll-up': 'Scroll content up',
      'scroll-down': 'Scroll content down',
      'zoom-in': 'Zoom in',
      'zoom-out': 'Zoom out',
      'select': 'Select item',
      'confirm': 'Confirm action',
      'cancel': 'Cancel action',
      'dismiss': 'Dismiss notification',
      'custom-wake-screen': 'Wake up screen',
      'custom-context-menu': 'Open context menu',
      'custom-volume-up': 'Increase volume',
      'custom-volume-down': 'Decrease volume',
      'macro-emergency-protocol': 'Trigger emergency protocol',
    };

    const key = `${mapping.action.type}-${mapping.action.target || ''}`;
    return descriptions[key] || `${mapping.action.type} ${mapping.action.target || ''}`;
  }

  // Reset
  reset(): void {
    this.state = 'idle';
    this.settings = this.getDefaultSettings();
    this.mappings.clear();
    this.detections.clear();
    this.trainingData.clear();
    this.analytics = this.initializeAnalytics();
    this.currentDetection = null;
    this.initializeDefaultMappings();
    this.notifyListeners();
  }
}

export const gestureControlsService = new GestureControlsService();
