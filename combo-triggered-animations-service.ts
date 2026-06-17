/**
 * Combo-Triggered Animations Service
 * MediVac WACHS v9.0
 * 
 * Provides spectacular visual rewards and animations when users
 * successfully execute gesture combos, with particle effects,
 * screen-wide celebrations, and achievement unlocks.
 */

export type AnimationType = 
  | 'particle-burst' | 'force-lightning' | 'lightsaber-clash' | 'hyperspace-flash'
  | 'confetti-explosion' | 'fireworks' | 'shockwave' | 'rainbow-wave'
  | 'star-burst' | 'flame-burst' | 'ice-shatter' | 'electric-surge'
  | 'gravity-well' | 'time-warp' | 'hologram-glitch' | 'force-push-wave';

export type ParticleShape = 'circle' | 'star' | 'square' | 'triangle' | 'heart' | 'spark' | 'snowflake' | 'leaf';
export type AnimationTrigger = 'combo-success' | 'streak-milestone' | 'achievement-unlock' | 'perfect-combo' | 'manual';

export interface ComboAnimation {
  id: string;
  name: string;
  description: string;
  type: AnimationType;
  comboId?: string; // Specific combo that triggers this
  trigger: AnimationTrigger;
  minStreakRequired: number;
  particles: ParticleConfig;
  screenEffect: ScreenEffectConfig;
  sound: SoundConfig;
  haptic: HapticConfig;
  duration: number; // ms
  isUnlocked: boolean;
  unlockCondition?: string;
  playCount: number;
  lastPlayedAt?: number;
  createdAt: number;
}

export interface ParticleConfig {
  enabled: boolean;
  shape: ParticleShape;
  count: number;
  size: { min: number; max: number };
  speed: { min: number; max: number };
  colors: string[];
  gravity: number;
  spread: number; // degrees
  lifetime: number; // ms
  fadeOut: boolean;
  glow: number; // 0-1
  trail: { enabled: boolean; length: number; fade: number };
  rotation: { enabled: boolean; speed: number };
  physics: 'burst' | 'fountain' | 'spiral' | 'radial' | 'rain' | 'explosion';
}

export interface ScreenEffectConfig {
  enabled: boolean;
  type: 'flash' | 'shake' | 'pulse' | 'vignette' | 'blur' | 'color-shift' | 'ripple' | 'glitch';
  intensity: number; // 0-1
  duration: number; // ms
  color?: string;
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce';
}

export interface SoundConfig {
  enabled: boolean;
  soundId: string;
  volume: number;
  pitch: number;
  delay: number; // ms
}

export interface HapticConfig {
  enabled: boolean;
  pattern: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'double' | 'triple' | 'crescendo';
  duration: number;
  intensity: number;
}

export interface StreakMilestone {
  streak: number;
  animationId: string;
  multiplierBonus: number;
  achievementId?: string;
  celebrationLevel: 'minor' | 'moderate' | 'major' | 'epic' | 'legendary';
}

export interface ComboAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: AchievementRequirement;
  reward: AchievementReward;
  isUnlocked: boolean;
  unlockedAt?: number;
  progress: number; // 0-100
}

export interface AchievementRequirement {
  type: 'combo-count' | 'streak' | 'perfect-combos' | 'animation-plays' | 'unique-combos';
  target: number;
  comboId?: string;
}

export interface AchievementReward {
  type: 'animation-unlock' | 'particle-pack' | 'sound-pack' | 'title' | 'badge';
  itemId: string;
  description: string;
}

export interface AnimationPlaySession {
  id: string;
  animationId: string;
  trigger: AnimationTrigger;
  comboId?: string;
  streakCount: number;
  multiplier: number;
  startedAt: number;
  completedAt?: number;
  particlesEmitted: number;
  screenEffectsPlayed: number;
}

export interface ComboAnimationAnalytics {
  totalAnimationsPlayed: number;
  totalParticlesEmitted: number;
  favoriteAnimation: string;
  longestStreak: number;
  achievementsUnlocked: number;
  perfectCombos: number;
  avgAnimationDuration: number;
  mostTriggeredBy: { comboId: string; count: number }[];
}

// JEDI Animation Sounds
const ANIMATION_SOUNDS = {
  'lightsaber-swing': '⚔️ Lightsaber Swing',
  'lightsaber-clash': '⚔️ Lightsaber Clash',
  'force-thunder': '⚡ Force Thunder',
  'hyperspace-whoosh': '🚀 Hyperspace Whoosh',
  'explosion-boom': '💥 Explosion Boom',
  'magic-sparkle': '✨ Magic Sparkle',
  'victory-fanfare': '🎺 Victory Fanfare',
  'level-up': '⬆️ Level Up',
  'combo-hit': '👊 Combo Hit',
  'perfect-chime': '🔔 Perfect Chime',
  'streak-fire': '🔥 Streak Fire',
  'achievement-unlock': '🏆 Achievement Unlock',
  'electric-zap': '⚡ Electric Zap',
  'ice-crack': '❄️ Ice Crack',
  'fire-roar': '🔥 Fire Roar',
  'time-slow': '⏱️ Time Slow',
};

// Default Animations
const DEFAULT_ANIMATIONS: Omit<ComboAnimation, 'id' | 'playCount' | 'createdAt'>[] = [
  {
    name: 'Force Lightning',
    description: 'Unleash the power of the dark side with electric fury',
    type: 'force-lightning',
    trigger: 'combo-success',
    minStreakRequired: 0,
    particles: {
      enabled: true,
      shape: 'spark',
      count: 150,
      size: { min: 2, max: 8 },
      speed: { min: 300, max: 600 },
      colors: ['#00bcd4', '#4dd0e1', '#80deea', '#b2ebf2', '#ffffff'],
      gravity: -0.5,
      spread: 360,
      lifetime: 800,
      fadeOut: true,
      glow: 0.9,
      trail: { enabled: true, length: 15, fade: 0.8 },
      rotation: { enabled: true, speed: 720 },
      physics: 'radial',
    },
    screenEffect: {
      enabled: true,
      type: 'flash',
      intensity: 0.8,
      duration: 200,
      color: '#00bcd4',
      easing: 'ease-out',
    },
    sound: { enabled: true, soundId: 'force-thunder', volume: 0.8, pitch: 1.0, delay: 0 },
    haptic: { enabled: true, pattern: 'heavy', duration: 300, intensity: 1.0 },
    duration: 1500,
    isUnlocked: true,
  },
  {
    name: 'Lightsaber Clash',
    description: 'Epic lightsaber duel sparks fly everywhere',
    type: 'lightsaber-clash',
    trigger: 'combo-success',
    minStreakRequired: 3,
    particles: {
      enabled: true,
      shape: 'spark',
      count: 200,
      size: { min: 3, max: 10 },
      speed: { min: 400, max: 800 },
      colors: ['#4caf50', '#f44336', '#ffffff', '#ffeb3b'],
      gravity: 0.3,
      spread: 180,
      lifetime: 1000,
      fadeOut: true,
      glow: 1.0,
      trail: { enabled: true, length: 20, fade: 0.9 },
      rotation: { enabled: true, speed: 1080 },
      physics: 'explosion',
    },
    screenEffect: {
      enabled: true,
      type: 'shake',
      intensity: 0.6,
      duration: 400,
      easing: 'bounce',
    },
    sound: { enabled: true, soundId: 'lightsaber-clash', volume: 0.9, pitch: 1.0, delay: 0 },
    haptic: { enabled: true, pattern: 'double', duration: 400, intensity: 0.9 },
    duration: 2000,
    isUnlocked: true,
  },
  {
    name: 'Hyperspace Flash',
    description: 'Jump to lightspeed with stunning star trails',
    type: 'hyperspace-flash',
    trigger: 'streak-milestone',
    minStreakRequired: 5,
    particles: {
      enabled: true,
      shape: 'star',
      count: 300,
      size: { min: 1, max: 4 },
      speed: { min: 800, max: 1500 },
      colors: ['#ffffff', '#e3f2fd', '#bbdefb', '#90caf9'],
      gravity: 0,
      spread: 30,
      lifetime: 600,
      fadeOut: false,
      glow: 0.8,
      trail: { enabled: true, length: 50, fade: 0.95 },
      rotation: { enabled: false, speed: 0 },
      physics: 'burst',
    },
    screenEffect: {
      enabled: true,
      type: 'blur',
      intensity: 0.7,
      duration: 800,
      easing: 'ease-in-out',
    },
    sound: { enabled: true, soundId: 'hyperspace-whoosh', volume: 0.85, pitch: 1.2, delay: 0 },
    haptic: { enabled: true, pattern: 'crescendo', duration: 600, intensity: 0.8 },
    duration: 1800,
    isUnlocked: true,
  },
  {
    name: 'Confetti Explosion',
    description: 'Celebrate your victory with colorful confetti',
    type: 'confetti-explosion',
    trigger: 'achievement-unlock',
    minStreakRequired: 0,
    particles: {
      enabled: true,
      shape: 'square',
      count: 250,
      size: { min: 5, max: 15 },
      speed: { min: 200, max: 500 },
      colors: ['#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#00bcd4', '#4caf50', '#ffeb3b', '#ff9800', '#f44336'],
      gravity: 0.8,
      spread: 120,
      lifetime: 3000,
      fadeOut: true,
      glow: 0.3,
      trail: { enabled: false, length: 0, fade: 0 },
      rotation: { enabled: true, speed: 360 },
      physics: 'fountain',
    },
    screenEffect: {
      enabled: true,
      type: 'pulse',
      intensity: 0.4,
      duration: 500,
      color: '#ffeb3b',
      easing: 'ease-out',
    },
    sound: { enabled: true, soundId: 'victory-fanfare', volume: 0.7, pitch: 1.0, delay: 0 },
    haptic: { enabled: true, pattern: 'success', duration: 500, intensity: 0.7 },
    duration: 3500,
    isUnlocked: true,
  },
  {
    name: 'Fireworks Display',
    description: 'Light up the sky with spectacular fireworks',
    type: 'fireworks',
    trigger: 'perfect-combo',
    minStreakRequired: 0,
    particles: {
      enabled: true,
      shape: 'circle',
      count: 400,
      size: { min: 2, max: 6 },
      speed: { min: 100, max: 400 },
      colors: ['#f44336', '#e91e63', '#9c27b0', '#2196f3', '#4caf50', '#ffeb3b', '#ff9800'],
      gravity: 0.5,
      spread: 360,
      lifetime: 2000,
      fadeOut: true,
      glow: 0.9,
      trail: { enabled: true, length: 10, fade: 0.7 },
      rotation: { enabled: false, speed: 0 },
      physics: 'explosion',
    },
    screenEffect: {
      enabled: true,
      type: 'flash',
      intensity: 0.5,
      duration: 150,
      color: '#ffffff',
      easing: 'ease-out',
    },
    sound: { enabled: true, soundId: 'explosion-boom', volume: 0.75, pitch: 0.9, delay: 100 },
    haptic: { enabled: true, pattern: 'triple', duration: 600, intensity: 0.8 },
    duration: 2500,
    isUnlocked: true,
  },
  {
    name: 'Shockwave Pulse',
    description: 'Send out a powerful shockwave from the center',
    type: 'shockwave',
    trigger: 'combo-success',
    minStreakRequired: 2,
    particles: {
      enabled: true,
      shape: 'circle',
      count: 100,
      size: { min: 5, max: 20 },
      speed: { min: 500, max: 800 },
      colors: ['#ffffff', '#e0e0e0', '#bdbdbd'],
      gravity: 0,
      spread: 360,
      lifetime: 500,
      fadeOut: true,
      glow: 0.6,
      trail: { enabled: false, length: 0, fade: 0 },
      rotation: { enabled: false, speed: 0 },
      physics: 'radial',
    },
    screenEffect: {
      enabled: true,
      type: 'ripple',
      intensity: 0.8,
      duration: 600,
      easing: 'ease-out',
    },
    sound: { enabled: true, soundId: 'combo-hit', volume: 0.7, pitch: 0.8, delay: 0 },
    haptic: { enabled: true, pattern: 'medium', duration: 200, intensity: 0.8 },
    duration: 1000,
    isUnlocked: true,
  },
  {
    name: 'Rainbow Wave',
    description: 'A beautiful rainbow sweeps across the screen',
    type: 'rainbow-wave',
    trigger: 'streak-milestone',
    minStreakRequired: 10,
    particles: {
      enabled: true,
      shape: 'circle',
      count: 200,
      size: { min: 8, max: 20 },
      speed: { min: 100, max: 200 },
      colors: ['#f44336', '#ff9800', '#ffeb3b', '#4caf50', '#2196f3', '#3f51b5', '#9c27b0'],
      gravity: 0,
      spread: 180,
      lifetime: 2000,
      fadeOut: true,
      glow: 0.7,
      trail: { enabled: true, length: 30, fade: 0.9 },
      rotation: { enabled: false, speed: 0 },
      physics: 'spiral',
    },
    screenEffect: {
      enabled: true,
      type: 'color-shift',
      intensity: 0.5,
      duration: 2000,
      easing: 'linear',
    },
    sound: { enabled: true, soundId: 'magic-sparkle', volume: 0.6, pitch: 1.2, delay: 0 },
    haptic: { enabled: true, pattern: 'light', duration: 1500, intensity: 0.5 },
    duration: 2500,
    isUnlocked: false,
    unlockCondition: 'Reach a 10-combo streak',
  },
  {
    name: 'Flame Burst',
    description: 'Erupt in flames with intense fire particles',
    type: 'flame-burst',
    trigger: 'combo-success',
    minStreakRequired: 4,
    particles: {
      enabled: true,
      shape: 'circle',
      count: 180,
      size: { min: 5, max: 15 },
      speed: { min: 200, max: 400 },
      colors: ['#ff5722', '#ff9800', '#ffc107', '#ffeb3b', '#fff176'],
      gravity: -0.8,
      spread: 90,
      lifetime: 1200,
      fadeOut: true,
      glow: 1.0,
      trail: { enabled: true, length: 12, fade: 0.85 },
      rotation: { enabled: true, speed: 180 },
      physics: 'fountain',
    },
    screenEffect: {
      enabled: true,
      type: 'vignette',
      intensity: 0.6,
      duration: 800,
      color: '#ff5722',
      easing: 'ease-in-out',
    },
    sound: { enabled: true, soundId: 'fire-roar', volume: 0.8, pitch: 1.0, delay: 0 },
    haptic: { enabled: true, pattern: 'heavy', duration: 400, intensity: 0.9 },
    duration: 1800,
    isUnlocked: true,
  },
  {
    name: 'Ice Shatter',
    description: 'Freeze and shatter with crystalline ice particles',
    type: 'ice-shatter',
    trigger: 'combo-success',
    minStreakRequired: 3,
    particles: {
      enabled: true,
      shape: 'triangle',
      count: 150,
      size: { min: 4, max: 12 },
      speed: { min: 300, max: 600 },
      colors: ['#e3f2fd', '#bbdefb', '#90caf9', '#64b5f6', '#42a5f5', '#ffffff'],
      gravity: 0.6,
      spread: 360,
      lifetime: 1500,
      fadeOut: true,
      glow: 0.8,
      trail: { enabled: false, length: 0, fade: 0 },
      rotation: { enabled: true, speed: 540 },
      physics: 'explosion',
    },
    screenEffect: {
      enabled: true,
      type: 'flash',
      intensity: 0.7,
      duration: 100,
      color: '#e3f2fd',
      easing: 'ease-out',
    },
    sound: { enabled: true, soundId: 'ice-crack', volume: 0.75, pitch: 1.1, delay: 0 },
    haptic: { enabled: true, pattern: 'double', duration: 300, intensity: 0.85 },
    duration: 1600,
    isUnlocked: true,
  },
  {
    name: 'Force Push Wave',
    description: 'Push everything away with the power of the Force',
    type: 'force-push-wave',
    trigger: 'perfect-combo',
    minStreakRequired: 0,
    particles: {
      enabled: true,
      shape: 'circle',
      count: 80,
      size: { min: 10, max: 30 },
      speed: { min: 600, max: 1000 },
      colors: ['#00bcd4', '#4dd0e1', '#80deea', '#b2ebf2'],
      gravity: 0,
      spread: 360,
      lifetime: 400,
      fadeOut: true,
      glow: 0.9,
      trail: { enabled: true, length: 25, fade: 0.9 },
      rotation: { enabled: false, speed: 0 },
      physics: 'radial',
    },
    screenEffect: {
      enabled: true,
      type: 'ripple',
      intensity: 1.0,
      duration: 500,
      easing: 'ease-out',
    },
    sound: { enabled: true, soundId: 'force-thunder', volume: 0.85, pitch: 0.7, delay: 0 },
    haptic: { enabled: true, pattern: 'heavy', duration: 350, intensity: 1.0 },
    duration: 1200,
    isUnlocked: true,
  },
];

// Default Streak Milestones
const DEFAULT_MILESTONES: StreakMilestone[] = [
  { streak: 3, animationId: 'shockwave', multiplierBonus: 0.1, celebrationLevel: 'minor' },
  { streak: 5, animationId: 'hyperspace-flash', multiplierBonus: 0.2, celebrationLevel: 'moderate' },
  { streak: 10, animationId: 'rainbow-wave', multiplierBonus: 0.5, achievementId: 'streak-10', celebrationLevel: 'major' },
  { streak: 15, animationId: 'fireworks', multiplierBonus: 0.75, achievementId: 'streak-15', celebrationLevel: 'epic' },
  { streak: 25, animationId: 'force-lightning', multiplierBonus: 1.0, achievementId: 'streak-25', celebrationLevel: 'legendary' },
  { streak: 50, animationId: 'force-push-wave', multiplierBonus: 1.5, achievementId: 'streak-50', celebrationLevel: 'legendary' },
];

// Default Achievements
const DEFAULT_ACHIEVEMENTS: Omit<ComboAchievement, 'isUnlocked' | 'unlockedAt' | 'progress'>[] = [
  { id: 'first-combo', name: 'First Steps', description: 'Complete your first gesture combo', icon: '👶', requirement: { type: 'combo-count', target: 1 }, reward: { type: 'animation-unlock', itemId: 'confetti-explosion', description: 'Confetti Explosion animation' } },
  { id: 'combo-master', name: 'Combo Master', description: 'Complete 100 gesture combos', icon: '🎯', requirement: { type: 'combo-count', target: 100 }, reward: { type: 'particle-pack', itemId: 'premium-particles', description: 'Premium particle effects' } },
  { id: 'streak-10', name: 'On Fire', description: 'Reach a 10-combo streak', icon: '🔥', requirement: { type: 'streak', target: 10 }, reward: { type: 'animation-unlock', itemId: 'rainbow-wave', description: 'Rainbow Wave animation' } },
  { id: 'streak-25', name: 'Unstoppable', description: 'Reach a 25-combo streak', icon: '⚡', requirement: { type: 'streak', target: 25 }, reward: { type: 'title', itemId: 'jedi-master', description: 'JEDI Master title' } },
  { id: 'streak-50', name: 'Legendary', description: 'Reach a 50-combo streak', icon: '👑', requirement: { type: 'streak', target: 50 }, reward: { type: 'badge', itemId: 'legendary-badge', description: 'Legendary badge' } },
  { id: 'perfect-10', name: 'Perfectionist', description: 'Execute 10 perfect combos', icon: '💎', requirement: { type: 'perfect-combos', target: 10 }, reward: { type: 'sound-pack', itemId: 'jedi-sounds', description: 'JEDI sound effects pack' } },
  { id: 'animation-fan', name: 'Animation Fan', description: 'Play 50 animations', icon: '🎬', requirement: { type: 'animation-plays', target: 50 }, reward: { type: 'animation-unlock', itemId: 'hologram-glitch', description: 'Hologram Glitch animation' } },
  { id: 'variety', name: 'Variety Show', description: 'Use 10 different combo types', icon: '🎭', requirement: { type: 'unique-combos', target: 10 }, reward: { type: 'particle-pack', itemId: 'jedi-particles', description: 'JEDI particle effects' } },
];

class ComboTriggeredAnimationsService {
  private animations: Map<string, ComboAnimation> = new Map();
  private achievements: Map<string, ComboAchievement> = new Map();
  private milestones: StreakMilestone[] = [];
  private currentSession: AnimationPlaySession | null = null;
  private currentStreak: number = 0;
  private currentMultiplier: number = 1.0;
  private analytics: ComboAnimationAnalytics;
  private listeners: Set<() => void> = new Set();
  private uniqueCombosUsed: Set<string> = new Set();

  constructor() {
    this.analytics = {
      totalAnimationsPlayed: 0,
      totalParticlesEmitted: 0,
      favoriteAnimation: '',
      longestStreak: 0,
      achievementsUnlocked: 0,
      perfectCombos: 0,
      avgAnimationDuration: 0,
      mostTriggeredBy: [],
    };
    this.initializeDefaults();
  }

  private initializeDefaults(): void {
    // Initialize default animations
    DEFAULT_ANIMATIONS.forEach((anim, index) => {
      const id = `anim-${index + 1}`;
      this.animations.set(id, {
        ...anim,
        id,
        playCount: 0,
        createdAt: Date.now(),
      });
    });

    // Initialize milestones
    this.milestones = [...DEFAULT_MILESTONES];

    // Initialize achievements
    DEFAULT_ACHIEVEMENTS.forEach(achievement => {
      this.achievements.set(achievement.id, {
        ...achievement,
        isUnlocked: false,
        progress: 0,
      });
    });
  }

  // Animation Management
  getAllAnimations(): ComboAnimation[] {
    return Array.from(this.animations.values());
  }

  getAnimation(id: string): ComboAnimation | undefined {
    return this.animations.get(id);
  }

  getUnlockedAnimations(): ComboAnimation[] {
    return Array.from(this.animations.values()).filter(a => a.isUnlocked);
  }

  getLockedAnimations(): ComboAnimation[] {
    return Array.from(this.animations.values()).filter(a => !a.isUnlocked);
  }

  unlockAnimation(id: string): boolean {
    const animation = this.animations.get(id);
    if (!animation || animation.isUnlocked) return false;

    animation.isUnlocked = true;
    this.notifyListeners();
    return true;
  }

  // Trigger Animations
  triggerComboAnimation(comboId: string, isPerfect: boolean = false): AnimationPlaySession | null {
    this.currentStreak++;
    this.uniqueCombosUsed.add(comboId);

    // Update longest streak
    if (this.currentStreak > this.analytics.longestStreak) {
      this.analytics.longestStreak = this.currentStreak;
    }

    // Check for streak milestone
    const milestone = this.checkStreakMilestone();
    
    // Determine which animation to play
    let animation: ComboAnimation | undefined;
    
    if (isPerfect) {
      this.analytics.perfectCombos++;
      animation = this.getAnimationForTrigger('perfect-combo');
    } else if (milestone) {
      animation = this.animations.get(milestone.animationId);
      this.currentMultiplier += milestone.multiplierBonus;
    } else {
      animation = this.getAnimationForCombo(comboId);
    }

    if (!animation || !animation.isUnlocked) {
      animation = this.getDefaultAnimation();
    }

    if (!animation) return null;

    // Create play session
    const session = this.playAnimation(animation, 'combo-success', comboId);

    // Update achievements
    this.updateAchievementProgress('combo-count', 1);
    this.updateAchievementProgress('streak', this.currentStreak);
    if (isPerfect) {
      this.updateAchievementProgress('perfect-combos', 1);
    }
    this.updateAchievementProgress('unique-combos', this.uniqueCombosUsed.size);

    return session;
  }

  private getAnimationForTrigger(trigger: AnimationTrigger): ComboAnimation | undefined {
    const eligible = Array.from(this.animations.values())
      .filter(a => a.isUnlocked && a.trigger === trigger && a.minStreakRequired <= this.currentStreak);
    
    if (eligible.length === 0) return undefined;
    return eligible[Math.floor(Math.random() * eligible.length)];
  }

  private getAnimationForCombo(comboId: string): ComboAnimation | undefined {
    // First try to find animation specific to this combo
    const specific = Array.from(this.animations.values())
      .find(a => a.isUnlocked && a.comboId === comboId);
    
    if (specific) return specific;

    // Otherwise get a random eligible animation
    return this.getAnimationForTrigger('combo-success');
  }

  private getDefaultAnimation(): ComboAnimation | undefined {
    return Array.from(this.animations.values()).find(a => a.isUnlocked);
  }

  private playAnimation(animation: ComboAnimation, trigger: AnimationTrigger, comboId?: string): AnimationPlaySession {
    const session: AnimationPlaySession = {
      id: `session-${Date.now()}`,
      animationId: animation.id,
      trigger,
      comboId,
      streakCount: this.currentStreak,
      multiplier: this.currentMultiplier,
      startedAt: Date.now(),
      particlesEmitted: animation.particles.enabled ? animation.particles.count : 0,
      screenEffectsPlayed: animation.screenEffect.enabled ? 1 : 0,
    };

    this.currentSession = session;
    animation.playCount++;
    animation.lastPlayedAt = Date.now();

    // Update analytics
    this.analytics.totalAnimationsPlayed++;
    this.analytics.totalParticlesEmitted += session.particlesEmitted;
    this.updateAnimationAnalytics(animation.id);
    if (comboId) {
      this.updateComboTriggerAnalytics(comboId);
    }
    this.updateAchievementProgress('animation-plays', 1);

    // Calculate average duration
    this.analytics.avgAnimationDuration = 
      (this.analytics.avgAnimationDuration * (this.analytics.totalAnimationsPlayed - 1) + animation.duration) / 
      this.analytics.totalAnimationsPlayed;

    // Complete session after duration
    setTimeout(() => {
      if (this.currentSession?.id === session.id) {
        this.currentSession.completedAt = Date.now();
        this.notifyListeners();
      }
    }, animation.duration);

    this.notifyListeners();
    return session;
  }

  private checkStreakMilestone(): StreakMilestone | null {
    for (const milestone of this.milestones) {
      if (this.currentStreak === milestone.streak) {
        if (milestone.achievementId) {
          this.unlockAchievement(milestone.achievementId);
        }
        return milestone;
      }
    }
    return null;
  }

  // Manual Animation Trigger
  playAnimationManually(animationId: string): AnimationPlaySession | null {
    const animation = this.animations.get(animationId);
    if (!animation || !animation.isUnlocked) return null;

    return this.playAnimation(animation, 'manual');
  }

  // Streak Management
  resetStreak(): void {
    this.currentStreak = 0;
    this.currentMultiplier = 1.0;
    this.notifyListeners();
  }

  getStreak(): { current: number; multiplier: number; longest: number } {
    return {
      current: this.currentStreak,
      multiplier: this.currentMultiplier,
      longest: this.analytics.longestStreak,
    };
  }

  getMilestones(): StreakMilestone[] {
    return [...this.milestones];
  }

  getNextMilestone(): StreakMilestone | null {
    for (const milestone of this.milestones) {
      if (milestone.streak > this.currentStreak) {
        return milestone;
      }
    }
    return null;
  }

  // Achievement Management
  getAllAchievements(): ComboAchievement[] {
    return Array.from(this.achievements.values());
  }

  getAchievement(id: string): ComboAchievement | undefined {
    return this.achievements.get(id);
  }

  getUnlockedAchievements(): ComboAchievement[] {
    return Array.from(this.achievements.values()).filter(a => a.isUnlocked);
  }

  private updateAchievementProgress(type: AchievementRequirement['type'], value: number): void {
    for (const achievement of this.achievements.values()) {
      if (achievement.isUnlocked) continue;
      if (achievement.requirement.type !== type) continue;

      if (type === 'streak' || type === 'unique-combos') {
        achievement.progress = Math.min(100, (value / achievement.requirement.target) * 100);
      } else {
        const currentValue = (achievement.progress / 100) * achievement.requirement.target;
        achievement.progress = Math.min(100, ((currentValue + value) / achievement.requirement.target) * 100);
      }

      if (achievement.progress >= 100) {
        this.unlockAchievement(achievement.id);
      }
    }
  }

  private unlockAchievement(id: string): void {
    const achievement = this.achievements.get(id);
    if (!achievement || achievement.isUnlocked) return;

    achievement.isUnlocked = true;
    achievement.unlockedAt = Date.now();
    achievement.progress = 100;
    this.analytics.achievementsUnlocked++;

    // Apply reward
    if (achievement.reward.type === 'animation-unlock') {
      this.unlockAnimation(achievement.reward.itemId);
    }

    // Play achievement animation
    const achievementAnim = this.getAnimationForTrigger('achievement-unlock');
    if (achievementAnim) {
      this.playAnimation(achievementAnim, 'achievement-unlock');
    }

    this.notifyListeners();
  }

  // Analytics
  private updateAnimationAnalytics(animationId: string): void {
    const animation = this.animations.get(animationId);
    if (!animation) return;

    // Update favorite animation
    let maxPlays = 0;
    for (const anim of this.animations.values()) {
      if (anim.playCount > maxPlays) {
        maxPlays = anim.playCount;
        this.analytics.favoriteAnimation = anim.name;
      }
    }
  }

  private updateComboTriggerAnalytics(comboId: string): void {
    const existing = this.analytics.mostTriggeredBy.find(t => t.comboId === comboId);
    if (existing) {
      existing.count++;
    } else {
      this.analytics.mostTriggeredBy.push({ comboId, count: 1 });
    }
    this.analytics.mostTriggeredBy.sort((a, b) => b.count - a.count);
  }

  getAnalytics(): ComboAnimationAnalytics {
    return { ...this.analytics };
  }

  // Session
  getCurrentSession(): AnimationPlaySession | null {
    return this.currentSession;
  }

  // Particle Presets
  getParticlePresets(): Record<string, Partial<ParticleConfig>> {
    return {
      'jedi-sparks': { shape: 'spark', colors: ['#00bcd4', '#4dd0e1', '#ffffff'], glow: 0.9 },
      'sith-flames': { shape: 'circle', colors: ['#f44336', '#ff5722', '#ff9800'], glow: 1.0 },
      'rainbow': { shape: 'circle', colors: ['#f44336', '#ff9800', '#ffeb3b', '#4caf50', '#2196f3', '#9c27b0'], glow: 0.7 },
      'gold-sparkle': { shape: 'star', colors: ['#ffc107', '#ffeb3b', '#fff176', '#ffffff'], glow: 0.8 },
      'ice-crystals': { shape: 'triangle', colors: ['#e3f2fd', '#bbdefb', '#90caf9', '#ffffff'], glow: 0.6 },
      'nature-leaves': { shape: 'leaf', colors: ['#4caf50', '#8bc34a', '#cddc39', '#795548'], glow: 0.3 },
    };
  }

  // Export/Import
  exportConfiguration(): string {
    return JSON.stringify({
      animations: Array.from(this.animations.values()),
      achievements: Array.from(this.achievements.values()),
      milestones: this.milestones,
      analytics: this.analytics,
      exportedAt: Date.now(),
    }, null, 2);
  }

  importConfiguration(json: string): { success: boolean; imported: { animations: number; achievements: number } } {
    try {
      const data = JSON.parse(json);
      let animationsImported = 0;
      let achievementsImported = 0;

      if (data.animations) {
        data.animations.forEach((anim: ComboAnimation) => {
          if (!anim.id.startsWith('anim-')) {
            const newId = `anim-imported-${Date.now()}-${animationsImported}`;
            this.animations.set(newId, { ...anim, id: newId });
            animationsImported++;
          }
        });
      }

      if (data.achievements) {
        data.achievements.forEach((achievement: ComboAchievement) => {
          if (!this.achievements.has(achievement.id)) {
            this.achievements.set(achievement.id, achievement);
            achievementsImported++;
          }
        });
      }

      this.notifyListeners();
      return { success: true, imported: { animations: animationsImported, achievements: achievementsImported } };
    } catch {
      return { success: false, imported: { animations: 0, achievements: 0 } };
    }
  }

  // Listeners
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  // Reset
  reset(): void {
    this.animations.clear();
    this.achievements.clear();
    this.milestones = [];
    this.currentSession = null;
    this.currentStreak = 0;
    this.currentMultiplier = 1.0;
    this.uniqueCombosUsed.clear();
    this.analytics = {
      totalAnimationsPlayed: 0,
      totalParticlesEmitted: 0,
      favoriteAnimation: '',
      longestStreak: 0,
      achievementsUnlocked: 0,
      perfectCombos: 0,
      avgAnimationDuration: 0,
      mostTriggeredBy: [],
    };
    this.initializeDefaults();
    this.notifyListeners();
  }
}

export const comboTriggeredAnimationsService = new ComboTriggeredAnimationsService();
