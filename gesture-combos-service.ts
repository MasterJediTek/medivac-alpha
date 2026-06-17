/**
 * Gesture Combos Service
 * MediVac WACHS v8.9
 * 
 * Provides gesture sequence detection for power users - chain multiple gestures
 * like swipe-up + fist to trigger special actions or macros.
 */

export type GestureType = 
  | 'swipe-up' | 'swipe-down' | 'swipe-left' | 'swipe-right'
  | 'tap' | 'double-tap' | 'long-press' | 'pinch-in' | 'pinch-out'
  | 'rotate-cw' | 'rotate-ccw' | 'fist' | 'open-palm' | 'thumbs-up'
  | 'thumbs-down' | 'peace' | 'wave' | 'circle' | 'zigzag' | 'custom';

export type ComboState = 'idle' | 'detecting' | 'partial' | 'complete' | 'failed' | 'timeout';
export type ComboDifficulty = 'easy' | 'medium' | 'hard' | 'expert' | 'master';

export interface GestureInput {
  type: GestureType;
  timestamp: number;
  confidence: number;
  duration: number;
  position?: { x: number; y: number };
  velocity?: { x: number; y: number };
}

export interface ComboGesture {
  type: GestureType;
  order: number;
  maxDelay: number; // Max ms after previous gesture
  minConfidence: number;
  holdDuration?: number; // For hold gestures
  direction?: 'any' | 'up' | 'down' | 'left' | 'right';
}

export interface GestureCombo {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  gestures: ComboGesture[];
  action: ComboAction;
  difficulty: ComboDifficulty;
  isBuiltIn: boolean;
  isEnabled: boolean;
  isFavorite: boolean;
  successCount: number;
  failCount: number;
  bestTime: number; // Fastest completion in ms
  avgTime: number;
  createdAt: number;
  lastUsedAt?: number;
  tags: string[];
}

export interface ComboAction {
  type: 'macro' | 'navigate' | 'toggle' | 'custom' | 'shortcut';
  target: string;
  parameters?: Record<string, unknown>;
  feedback: ComboFeedback;
}

export interface ComboFeedback {
  sound?: string;
  haptic?: number[];
  visual?: ComboVisualEffect;
  voice?: string;
}

export interface ComboVisualEffect {
  type: 'flash' | 'ripple' | 'glow' | 'particles' | 'lightning' | 'force-wave' | 'lightsaber-slash';
  color: string;
  duration: number;
  intensity: number;
}

export interface ComboDetectionSession {
  id: string;
  state: ComboState;
  targetCombo?: GestureCombo;
  inputGestures: GestureInput[];
  matchedGestures: number;
  startedAt: number;
  completedAt?: number;
  timeRemaining: number;
  feedback: DetectionFeedback;
}

export interface DetectionFeedback {
  progress: number; // 0-100
  currentGestureIndex: number;
  nextExpectedGesture?: GestureType;
  hints: string[];
  visualGuide: GestureGuideFrame[];
}

export interface GestureGuideFrame {
  gesture: GestureType;
  icon: string;
  isCompleted: boolean;
  isCurrent: boolean;
  timing: number;
}

export interface ComboExecution {
  id: string;
  comboId: string;
  success: boolean;
  executionTime: number;
  gestures: GestureInput[];
  accuracy: number;
  timestamp: number;
}

export interface ComboStreak {
  current: number;
  best: number;
  lastComboId?: string;
  lastUpdated: number;
  multiplier: number;
  rewards: ComboReward[];
}

export interface ComboReward {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: { type: 'streak' | 'total' | 'perfect' | 'speed'; value: number };
  unlockedAt?: number;
}

export interface ComboLeaderboard {
  comboId: string;
  entries: LeaderboardEntry[];
  lastUpdated: number;
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  time: number;
  accuracy: number;
  streak: number;
  rank: number;
  timestamp: number;
}

export interface ComboAnalytics {
  totalCombos: number;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  avgAccuracy: number;
  avgExecutionTime: number;
  currentStreak: number;
  bestStreak: number;
  favoriteCombo?: string;
  executionsByHour: number[];
  difficultyDistribution: Record<ComboDifficulty, number>;
}

// Sound effects for combos
export const COMBO_SOUNDS = {
  gestureDetected: 'jedi_gesture_detect.wav',
  comboStart: 'jedi_combo_start.wav',
  comboProgress: 'jedi_combo_progress.wav',
  comboComplete: 'jedi_combo_complete.wav',
  comboFail: 'jedi_combo_fail.wav',
  comboTimeout: 'jedi_combo_timeout.wav',
  streakBonus: 'jedi_streak_bonus.wav',
  perfectCombo: 'jedi_perfect_combo.wav',
  newRecord: 'jedi_new_record.wav',
  rewardUnlock: 'jedi_reward_unlock.wav',
  lightsaberSlash: 'jedi_lightsaber_slash.wav',
  forceWave: 'jedi_force_wave.wav',
} as const;

// Haptic patterns for combos
export const COMBO_HAPTICS = {
  gestureDetected: [30],
  comboStart: [50, 30, 50],
  comboProgress: [20, 10, 20],
  comboComplete: [100, 50, 100, 50, 200],
  comboFail: [200, 100, 200],
  comboTimeout: [100, 50, 100],
  streakBonus: [50, 30, 50, 30, 100],
  perfectCombo: [50, 20, 50, 20, 50, 20, 200],
  newRecord: [100, 50, 100, 50, 100, 50, 300],
  rewardUnlock: [200, 100, 200, 100, 400],
} as const;

// Visual effects for combos
export const COMBO_VISUAL_EFFECTS = {
  flash: { type: 'flash' as const, color: '#FFFFFF', duration: 200, intensity: 1 },
  ripple: { type: 'ripple' as const, color: '#3498DB', duration: 500, intensity: 0.8 },
  glow: { type: 'glow' as const, color: '#2ECC71', duration: 300, intensity: 0.9 },
  particles: { type: 'particles' as const, color: '#F39C12', duration: 800, intensity: 1 },
  lightning: { type: 'lightning' as const, color: '#9B59B6', duration: 400, intensity: 1 },
  forceWave: { type: 'force-wave' as const, color: '#00BFFF', duration: 600, intensity: 1 },
  lightsaberSlash: { type: 'lightsaber-slash' as const, color: '#00FF00', duration: 350, intensity: 1 },
} as const;

// Gesture icons
export const GESTURE_ICONS: Record<GestureType, string> = {
  'swipe-up': '⬆️',
  'swipe-down': '⬇️',
  'swipe-left': '⬅️',
  'swipe-right': '➡️',
  'tap': '👆',
  'double-tap': '👆👆',
  'long-press': '👇',
  'pinch-in': '🤏',
  'pinch-out': '🤲',
  'rotate-cw': '🔄',
  'rotate-ccw': '🔃',
  'fist': '✊',
  'open-palm': '🖐️',
  'thumbs-up': '👍',
  'thumbs-down': '👎',
  'peace': '✌️',
  'wave': '👋',
  'circle': '⭕',
  'zigzag': '⚡',
  'custom': '✨',
};

type Listener = () => void;

class GestureCombosService {
  private combos: Map<string, GestureCombo> = new Map();
  private currentSession: ComboDetectionSession | null = null;
  private executionHistory: ComboExecution[] = [];
  private streak: ComboStreak;
  private rewards: ComboReward[] = [];
  private leaderboards: Map<string, ComboLeaderboard> = new Map();
  private analytics: ComboAnalytics;
  private listeners: Set<Listener> = new Set();
  private detectionTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.analytics = this.initializeAnalytics();
    this.streak = this.initializeStreak();
    this.initializeRewards();
    this.initializeBuiltInCombos();
  }

  private initializeAnalytics(): ComboAnalytics {
    return {
      totalCombos: 0,
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      avgAccuracy: 0,
      avgExecutionTime: 0,
      currentStreak: 0,
      bestStreak: 0,
      executionsByHour: new Array(24).fill(0),
      difficultyDistribution: { easy: 0, medium: 0, hard: 0, expert: 0, master: 0 },
    };
  }

  private initializeStreak(): ComboStreak {
    return {
      current: 0,
      best: 0,
      lastUpdated: Date.now(),
      multiplier: 1,
      rewards: [],
    };
  }

  private initializeRewards(): void {
    this.rewards = [
      { id: 'reward-streak-5', name: 'Padawan', description: 'Complete 5 combos in a row', icon: '🌟', requirement: { type: 'streak', value: 5 } },
      { id: 'reward-streak-10', name: 'Knight', description: 'Complete 10 combos in a row', icon: '⭐', requirement: { type: 'streak', value: 10 } },
      { id: 'reward-streak-25', name: 'Master', description: 'Complete 25 combos in a row', icon: '🌠', requirement: { type: 'streak', value: 25 } },
      { id: 'reward-total-50', name: 'Combo Apprentice', description: 'Execute 50 total combos', icon: '🎯', requirement: { type: 'total', value: 50 } },
      { id: 'reward-total-100', name: 'Combo Expert', description: 'Execute 100 total combos', icon: '🏆', requirement: { type: 'total', value: 100 } },
      { id: 'reward-perfect-10', name: 'Perfectionist', description: 'Execute 10 perfect combos', icon: '💎', requirement: { type: 'perfect', value: 10 } },
      { id: 'reward-speed-500', name: 'Lightning Fast', description: 'Complete a combo under 500ms', icon: '⚡', requirement: { type: 'speed', value: 500 } },
    ];
  }

  private initializeBuiltInCombos(): void {
    const builtInCombos: Omit<GestureCombo, 'id' | 'successCount' | 'failCount' | 'bestTime' | 'avgTime' | 'createdAt'>[] = [
      {
        name: 'Quick Menu',
        description: 'Open quick action menu',
        icon: '📱',
        color: '#3498DB',
        gestures: [
          { type: 'swipe-up', order: 0, maxDelay: 500, minConfidence: 0.7 },
          { type: 'tap', order: 1, maxDelay: 300, minConfidence: 0.7 },
        ],
        action: { type: 'navigate', target: 'quick-menu', feedback: { sound: COMBO_SOUNDS.comboComplete, haptic: COMBO_HAPTICS.comboComplete } },
        difficulty: 'easy',
        isBuiltIn: true,
        isEnabled: true,
        isFavorite: false,
        tags: ['navigation', 'quick'],
      },
      {
        name: 'Emergency SOS',
        description: 'Trigger emergency alert',
        icon: '🆘',
        color: '#E74C3C',
        gestures: [
          { type: 'fist', order: 0, maxDelay: 500, minConfidence: 0.8, holdDuration: 500 },
          { type: 'open-palm', order: 1, maxDelay: 300, minConfidence: 0.8 },
          { type: 'fist', order: 2, maxDelay: 300, minConfidence: 0.8 },
        ],
        action: { type: 'macro', target: 'sos-trigger', feedback: { sound: COMBO_SOUNDS.forceWave, haptic: COMBO_HAPTICS.comboComplete, visual: COMBO_VISUAL_EFFECTS.forceWave } },
        difficulty: 'medium',
        isBuiltIn: true,
        isEnabled: true,
        isFavorite: true,
        tags: ['emergency', 'safety'],
      },
      {
        name: 'Force Push',
        description: 'Clear all notifications',
        icon: '💨',
        color: '#9B59B6',
        gestures: [
          { type: 'open-palm', order: 0, maxDelay: 500, minConfidence: 0.8 },
          { type: 'swipe-right', order: 1, maxDelay: 200, minConfidence: 0.8 },
        ],
        action: { type: 'shortcut', target: 'clear-notifications', feedback: { sound: COMBO_SOUNDS.forceWave, haptic: COMBO_HAPTICS.comboComplete, visual: COMBO_VISUAL_EFFECTS.forceWave, voice: 'Notifications cleared' } },
        difficulty: 'easy',
        isBuiltIn: true,
        isEnabled: true,
        isFavorite: false,
        tags: ['jedi', 'notifications'],
      },
      {
        name: 'Lightsaber Strike',
        description: 'Toggle dark/light mode',
        icon: '⚔️',
        color: '#2ECC71',
        gestures: [
          { type: 'swipe-down', order: 0, maxDelay: 500, minConfidence: 0.7 },
          { type: 'swipe-up', order: 1, maxDelay: 200, minConfidence: 0.7 },
          { type: 'swipe-down', order: 2, maxDelay: 200, minConfidence: 0.7 },
        ],
        action: { type: 'toggle', target: 'theme-mode', feedback: { sound: COMBO_SOUNDS.lightsaberSlash, haptic: COMBO_HAPTICS.perfectCombo, visual: COMBO_VISUAL_EFFECTS.lightsaberSlash } },
        difficulty: 'medium',
        isBuiltIn: true,
        isEnabled: true,
        isFavorite: true,
        tags: ['jedi', 'theme'],
      },
      {
        name: 'Mind Trick',
        description: 'Enable do not disturb',
        icon: '🧠',
        color: '#F39C12',
        gestures: [
          { type: 'wave', order: 0, maxDelay: 500, minConfidence: 0.7 },
          { type: 'wave', order: 1, maxDelay: 400, minConfidence: 0.7 },
        ],
        action: { type: 'toggle', target: 'dnd-mode', feedback: { sound: COMBO_SOUNDS.comboComplete, haptic: COMBO_HAPTICS.comboComplete, voice: 'Do not disturb enabled' } },
        difficulty: 'easy',
        isBuiltIn: true,
        isEnabled: true,
        isFavorite: false,
        tags: ['jedi', 'focus'],
      },
      {
        name: 'Hyperspace Jump',
        description: 'Quick switch to home screen',
        icon: '🚀',
        color: '#00BFFF',
        gestures: [
          { type: 'pinch-in', order: 0, maxDelay: 500, minConfidence: 0.7 },
          { type: 'pinch-out', order: 1, maxDelay: 300, minConfidence: 0.7 },
        ],
        action: { type: 'navigate', target: 'home', feedback: { sound: COMBO_SOUNDS.comboComplete, haptic: COMBO_HAPTICS.comboComplete, visual: COMBO_VISUAL_EFFECTS.particles } },
        difficulty: 'easy',
        isBuiltIn: true,
        isEnabled: true,
        isFavorite: false,
        tags: ['navigation'],
      },
      {
        name: 'Force Lightning',
        description: 'Quick capture screenshot',
        icon: '⚡',
        color: '#8E44AD',
        gestures: [
          { type: 'thumbs-down', order: 0, maxDelay: 500, minConfidence: 0.8 },
          { type: 'zigzag', order: 1, maxDelay: 400, minConfidence: 0.7 },
        ],
        action: { type: 'shortcut', target: 'screenshot', feedback: { sound: COMBO_SOUNDS.lightning, haptic: COMBO_HAPTICS.perfectCombo, visual: COMBO_VISUAL_EFFECTS.lightning } },
        difficulty: 'hard',
        isBuiltIn: true,
        isEnabled: true,
        isFavorite: false,
        tags: ['jedi', 'utility'],
      },
      {
        name: 'Meditation Mode',
        description: 'Start breathing exercise',
        icon: '🧘',
        color: '#1ABC9C',
        gestures: [
          { type: 'open-palm', order: 0, maxDelay: 500, minConfidence: 0.7, holdDuration: 1000 },
          { type: 'fist', order: 1, maxDelay: 500, minConfidence: 0.7, holdDuration: 1000 },
          { type: 'open-palm', order: 2, maxDelay: 500, minConfidence: 0.7 },
        ],
        action: { type: 'macro', target: 'meditation-start', feedback: { sound: COMBO_SOUNDS.comboComplete, haptic: COMBO_HAPTICS.comboComplete, visual: COMBO_VISUAL_EFFECTS.glow, voice: 'Beginning meditation' } },
        difficulty: 'hard',
        isBuiltIn: true,
        isEnabled: true,
        isFavorite: false,
        tags: ['health', 'wellness'],
      },
      {
        name: 'Council Summon',
        description: 'Open JEDI command center',
        icon: '🏛️',
        color: '#D4AF37',
        gestures: [
          { type: 'circle', order: 0, maxDelay: 800, minConfidence: 0.7 },
          { type: 'thumbs-up', order: 1, maxDelay: 400, minConfidence: 0.8 },
        ],
        action: { type: 'navigate', target: 'jedi-command', feedback: { sound: COMBO_SOUNDS.comboComplete, haptic: COMBO_HAPTICS.perfectCombo, visual: COMBO_VISUAL_EFFECTS.glow } },
        difficulty: 'medium',
        isBuiltIn: true,
        isEnabled: true,
        isFavorite: true,
        tags: ['jedi', 'navigation'],
      },
      {
        name: 'Master Combo',
        description: 'Execute all macros in sequence',
        icon: '🌟',
        color: '#FFD700',
        gestures: [
          { type: 'swipe-up', order: 0, maxDelay: 500, minConfidence: 0.8 },
          { type: 'swipe-right', order: 1, maxDelay: 300, minConfidence: 0.8 },
          { type: 'swipe-down', order: 2, maxDelay: 300, minConfidence: 0.8 },
          { type: 'swipe-left', order: 3, maxDelay: 300, minConfidence: 0.8 },
          { type: 'tap', order: 4, maxDelay: 200, minConfidence: 0.8 },
        ],
        action: { type: 'macro', target: 'master-sequence', feedback: { sound: COMBO_SOUNDS.perfectCombo, haptic: COMBO_HAPTICS.perfectCombo, visual: COMBO_VISUAL_EFFECTS.particles, voice: 'Master combo executed' } },
        difficulty: 'master',
        isBuiltIn: true,
        isEnabled: true,
        isFavorite: true,
        tags: ['jedi', 'master'],
      },
    ];

    builtInCombos.forEach((combo, idx) => {
      const id = `combo-${idx}`;
      this.combos.set(id, {
        ...combo,
        id,
        successCount: 0,
        failCount: 0,
        bestTime: Infinity,
        avgTime: 0,
        createdAt: Date.now(),
      });
    });

    this.analytics.totalCombos = builtInCombos.length;
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Combo management
  getCombo(id: string): GestureCombo | undefined {
    return this.combos.get(id);
  }

  getAllCombos(): GestureCombo[] {
    return Array.from(this.combos.values());
  }

  getCombosByDifficulty(difficulty: ComboDifficulty): GestureCombo[] {
    return Array.from(this.combos.values()).filter(c => c.difficulty === difficulty);
  }

  getFavoriteCombos(): GestureCombo[] {
    return Array.from(this.combos.values()).filter(c => c.isFavorite);
  }

  getEnabledCombos(): GestureCombo[] {
    return Array.from(this.combos.values()).filter(c => c.isEnabled);
  }

  createCombo(data: Omit<GestureCombo, 'id' | 'isBuiltIn' | 'successCount' | 'failCount' | 'bestTime' | 'avgTime' | 'createdAt'>): GestureCombo {
    const id = `combo-${Date.now()}`;
    const combo: GestureCombo = {
      ...data,
      id,
      isBuiltIn: false,
      successCount: 0,
      failCount: 0,
      bestTime: Infinity,
      avgTime: 0,
      createdAt: Date.now(),
    };
    this.combos.set(id, combo);
    this.analytics.totalCombos++;
    this.notifyListeners();
    return combo;
  }

  updateCombo(id: string, updates: Partial<GestureCombo>): GestureCombo | null {
    const combo = this.combos.get(id);
    if (!combo || combo.isBuiltIn) return null;

    Object.assign(combo, updates);
    this.notifyListeners();
    return combo;
  }

  deleteCombo(id: string): boolean {
    const combo = this.combos.get(id);
    if (!combo || combo.isBuiltIn) return false;

    this.combos.delete(id);
    this.analytics.totalCombos--;
    this.notifyListeners();
    return true;
  }

  toggleCombo(id: string): boolean {
    const combo = this.combos.get(id);
    if (!combo) return false;

    combo.isEnabled = !combo.isEnabled;
    this.notifyListeners();
    return combo.isEnabled;
  }

  toggleFavorite(id: string): boolean {
    const combo = this.combos.get(id);
    if (!combo) return false;

    combo.isFavorite = !combo.isFavorite;
    this.notifyListeners();
    return combo.isFavorite;
  }

  // Detection session management
  startDetection(comboId?: string): ComboDetectionSession {
    if (this.detectionTimer) {
      clearTimeout(this.detectionTimer);
    }

    const targetCombo = comboId ? this.combos.get(comboId) : undefined;
    const session: ComboDetectionSession = {
      id: `session-${Date.now()}`,
      state: 'detecting',
      targetCombo,
      inputGestures: [],
      matchedGestures: 0,
      startedAt: Date.now(),
      timeRemaining: 5000,
      feedback: {
        progress: 0,
        currentGestureIndex: 0,
        nextExpectedGesture: targetCombo?.gestures[0]?.type,
        hints: targetCombo ? [`Start with ${GESTURE_ICONS[targetCombo.gestures[0].type]}`] : ['Perform any combo gesture'],
        visualGuide: targetCombo?.gestures.map((g, i) => ({
          gesture: g.type,
          icon: GESTURE_ICONS[g.type],
          isCompleted: false,
          isCurrent: i === 0,
          timing: g.maxDelay,
        })) || [],
      },
    };

    this.currentSession = session;
    this.notifyListeners();

    // Set timeout
    this.detectionTimer = setTimeout(() => {
      if (this.currentSession?.id === session.id && this.currentSession.state === 'detecting') {
        this.currentSession.state = 'timeout';
        this.notifyListeners();
      }
    }, 5000);

    return session;
  }

  getCurrentSession(): ComboDetectionSession | null {
    return this.currentSession;
  }

  inputGesture(gesture: GestureInput): { matched: boolean; combo?: GestureCombo; execution?: ComboExecution } {
    if (!this.currentSession || this.currentSession.state !== 'detecting') {
      return { matched: false };
    }

    this.currentSession.inputGestures.push(gesture);

    // Check against target combo or all enabled combos
    const combosToCheck = this.currentSession.targetCombo 
      ? [this.currentSession.targetCombo]
      : this.getEnabledCombos();

    for (const combo of combosToCheck) {
      const matchResult = this.checkComboMatch(combo, this.currentSession.inputGestures);
      
      if (matchResult.complete) {
        return this.completeCombo(combo, this.currentSession.inputGestures);
      } else if (matchResult.partial) {
        this.currentSession.state = 'partial';
        this.currentSession.matchedGestures = matchResult.matchedCount;
        this.currentSession.feedback.progress = (matchResult.matchedCount / combo.gestures.length) * 100;
        this.currentSession.feedback.currentGestureIndex = matchResult.matchedCount;
        this.currentSession.feedback.nextExpectedGesture = combo.gestures[matchResult.matchedCount]?.type;
        
        // Update visual guide
        this.currentSession.feedback.visualGuide = combo.gestures.map((g, i) => ({
          gesture: g.type,
          icon: GESTURE_ICONS[g.type],
          isCompleted: i < matchResult.matchedCount,
          isCurrent: i === matchResult.matchedCount,
          timing: g.maxDelay,
        }));

        this.notifyListeners();
        return { matched: true };
      }
    }

    // No match found
    if (this.currentSession.inputGestures.length > 10) {
      this.currentSession.state = 'failed';
      this.notifyListeners();
    }

    return { matched: false };
  }

  private checkComboMatch(combo: GestureCombo, inputs: GestureInput[]): { complete: boolean; partial: boolean; matchedCount: number } {
    let matchedCount = 0;

    for (let i = 0; i < combo.gestures.length; i++) {
      const expected = combo.gestures[i];
      const input = inputs[i];

      if (!input) {
        return { complete: false, partial: matchedCount > 0, matchedCount };
      }

      if (input.type !== expected.type || input.confidence < expected.minConfidence) {
        return { complete: false, partial: false, matchedCount: 0 };
      }

      // Check timing
      if (i > 0) {
        const prevInput = inputs[i - 1];
        const delay = input.timestamp - prevInput.timestamp;
        if (delay > expected.maxDelay) {
          return { complete: false, partial: false, matchedCount: 0 };
        }
      }

      matchedCount++;
    }

    return { complete: matchedCount === combo.gestures.length, partial: false, matchedCount };
  }

  private completeCombo(combo: GestureCombo, gestures: GestureInput[]): { matched: boolean; combo: GestureCombo; execution: ComboExecution } {
    const executionTime = gestures[gestures.length - 1].timestamp - gestures[0].timestamp;
    const accuracy = gestures.reduce((sum, g) => sum + g.confidence, 0) / gestures.length;

    const execution: ComboExecution = {
      id: `exec-${Date.now()}`,
      comboId: combo.id,
      success: true,
      executionTime,
      gestures,
      accuracy,
      timestamp: Date.now(),
    };

    // Update combo stats
    combo.successCount++;
    combo.lastUsedAt = Date.now();
    if (executionTime < combo.bestTime) {
      combo.bestTime = executionTime;
    }
    combo.avgTime = (combo.avgTime * (combo.successCount - 1) + executionTime) / combo.successCount;

    // Update streak
    this.streak.current++;
    if (this.streak.current > this.streak.best) {
      this.streak.best = this.streak.current;
    }
    this.streak.lastComboId = combo.id;
    this.streak.lastUpdated = Date.now();
    this.streak.multiplier = Math.min(5, 1 + Math.floor(this.streak.current / 5) * 0.5);

    // Check rewards
    this.checkRewards(execution);

    // Update analytics
    this.analytics.totalExecutions++;
    this.analytics.successfulExecutions++;
    this.analytics.avgAccuracy = (this.analytics.avgAccuracy * (this.analytics.totalExecutions - 1) + accuracy) / this.analytics.totalExecutions;
    this.analytics.avgExecutionTime = (this.analytics.avgExecutionTime * (this.analytics.totalExecutions - 1) + executionTime) / this.analytics.totalExecutions;
    this.analytics.currentStreak = this.streak.current;
    this.analytics.bestStreak = this.streak.best;
    this.analytics.difficultyDistribution[combo.difficulty]++;

    // Add to history
    this.executionHistory.unshift(execution);
    if (this.executionHistory.length > 100) {
      this.executionHistory.pop();
    }

    // Complete session
    if (this.currentSession) {
      this.currentSession.state = 'complete';
      this.currentSession.completedAt = Date.now();
      this.currentSession.feedback.progress = 100;
    }

    if (this.detectionTimer) {
      clearTimeout(this.detectionTimer);
      this.detectionTimer = null;
    }

    this.notifyListeners();
    return { matched: true, combo, execution };
  }

  cancelDetection(): void {
    if (this.detectionTimer) {
      clearTimeout(this.detectionTimer);
      this.detectionTimer = null;
    }
    this.currentSession = null;
    this.notifyListeners();
  }

  failCombo(): void {
    if (this.currentSession) {
      this.currentSession.state = 'failed';
      
      // Reset streak
      this.streak.current = 0;
      this.streak.multiplier = 1;
      
      // Update analytics
      this.analytics.failedExecutions++;
      this.analytics.currentStreak = 0;
    }

    if (this.detectionTimer) {
      clearTimeout(this.detectionTimer);
      this.detectionTimer = null;
    }

    this.notifyListeners();
  }

  // Rewards
  private checkRewards(execution: ComboExecution): void {
    this.rewards.forEach(reward => {
      if (reward.unlockedAt) return; // Already unlocked

      let unlocked = false;
      switch (reward.requirement.type) {
        case 'streak':
          unlocked = this.streak.current >= reward.requirement.value;
          break;
        case 'total':
          unlocked = this.analytics.totalExecutions >= reward.requirement.value;
          break;
        case 'perfect':
          const perfectCount = this.executionHistory.filter(e => e.accuracy >= 0.95).length;
          unlocked = perfectCount >= reward.requirement.value;
          break;
        case 'speed':
          unlocked = execution.executionTime <= reward.requirement.value;
          break;
      }

      if (unlocked) {
        reward.unlockedAt = Date.now();
        this.streak.rewards.push(reward);
      }
    });
  }

  getRewards(): ComboReward[] {
    return [...this.rewards];
  }

  getUnlockedRewards(): ComboReward[] {
    return this.rewards.filter(r => r.unlockedAt);
  }

  // Streak
  getStreak(): ComboStreak {
    return { ...this.streak };
  }

  // History
  getExecutionHistory(): ComboExecution[] {
    return [...this.executionHistory];
  }

  // Analytics
  getAnalytics(): ComboAnalytics {
    return { ...this.analytics };
  }

  // Leaderboard
  getLeaderboard(comboId: string): ComboLeaderboard | undefined {
    return this.leaderboards.get(comboId);
  }

  // Training mode
  getComboGuide(comboId: string): GestureGuideFrame[] {
    const combo = this.combos.get(comboId);
    if (!combo) return [];

    return combo.gestures.map((g, i) => ({
      gesture: g.type,
      icon: GESTURE_ICONS[g.type],
      isCompleted: false,
      isCurrent: i === 0,
      timing: g.maxDelay,
    }));
  }

  // Export/Import
  exportConfiguration(): string {
    return JSON.stringify({
      combos: Array.from(this.combos.values()).filter(c => !c.isBuiltIn),
      streak: this.streak,
      rewards: this.rewards,
      exportedAt: Date.now(),
    }, null, 2);
  }

  importConfiguration(json: string): { success: boolean; imported: number } {
    try {
      const data = JSON.parse(json);
      let imported = 0;

      if (data.combos) {
        data.combos.forEach((combo: GestureCombo) => {
          const newCombo = { ...combo, id: `combo-${Date.now()}-${Math.random()}`, isBuiltIn: false };
          this.combos.set(newCombo.id, newCombo);
          imported++;
        });
      }

      this.notifyListeners();
      return { success: true, imported };
    } catch {
      return { success: false, imported: 0 };
    }
  }

  // Reset
  reset(): void {
    this.combos.clear();
    this.currentSession = null;
    this.executionHistory = [];
    this.streak = this.initializeStreak();
    this.leaderboards.clear();
    this.analytics = this.initializeAnalytics();
    if (this.detectionTimer) {
      clearTimeout(this.detectionTimer);
      this.detectionTimer = null;
    }
    this.initializeRewards();
    this.initializeBuiltInCombos();
    this.notifyListeners();
  }
}

export const gestureCombosService = new GestureCombosService();
