/**
 * Achievement Showcase Service - Trophy Room
 * MediVac WACHS v9.1
 * 
 * Displays unlocked achievements with 3D rotating trophies,
 * particle effects, and interactive trophy inspection.
 */

export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
export type AchievementCategory = 'combo' | 'voice' | 'weather' | 'streak' | 'exploration' | 'mastery' | 'special' | 'jedi';
export type TrophyStyle = 'medal' | 'cup' | 'shield' | 'star' | 'crystal' | 'lightsaber' | 'holocron' | 'kyber';

export interface Trophy {
  id: string;
  achievementId: string;
  style: TrophyStyle;
  material: string;
  primaryColor: string;
  secondaryColor: string;
  glowColor: string;
  glowIntensity: number;
  rotationSpeed: number;
  particleEffect: string;
  unlockAnimation: string;
  displayScale: number;
  pedestal: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  icon: string;
  trophy: Trophy;
  requirement: string;
  progress: number;
  maxProgress: number;
  isUnlocked: boolean;
  unlockedAt: number | null;
  points: number;
  secretHint?: string;
  isSecret: boolean;
}

export interface TrophyRoom {
  id: string;
  name: string;
  theme: string;
  backgroundColor: string;
  ambientLight: string;
  spotlightColor: string;
  pedestalStyle: string;
  maxTrophies: number;
  trophyIds: string[];
  layout: 'grid' | 'circular' | 'showcase' | 'timeline';
  particleAmbience: string;
}

export interface TrophyInspection {
  trophyId: string;
  zoomLevel: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  isAutoRotating: boolean;
  showDetails: boolean;
  showParticles: boolean;
}

export interface AchievementProgress {
  category: AchievementCategory;
  total: number;
  unlocked: number;
  percentage: number;
  points: number;
  nextAchievement: Achievement | null;
}

export interface ShowcaseAnalytics {
  totalAchievements: number;
  unlockedAchievements: number;
  totalPoints: number;
  rarityCounts: Record<AchievementRarity, { total: number; unlocked: number }>;
  categoryCounts: Record<AchievementCategory, { total: number; unlocked: number }>;
  recentUnlocks: string[];
  favoriteCategory: AchievementCategory;
  completionPercentage: number;
}

// Rarity Colors and Effects
const RARITY_CONFIG: Record<AchievementRarity, { color: string; glow: string; particles: string; points: number }> = {
  common: { color: '#9e9e9e', glow: '#bdbdbd', particles: 'dust', points: 10 },
  uncommon: { color: '#4caf50', glow: '#81c784', particles: 'sparkle', points: 25 },
  rare: { color: '#2196f3', glow: '#64b5f6', particles: 'shimmer', points: 50 },
  epic: { color: '#9c27b0', glow: '#ba68c8', particles: 'magic', points: 100 },
  legendary: { color: '#ff9800', glow: '#ffb74d', particles: 'fire', points: 250 },
  mythic: { color: '#f44336', glow: '#ef5350', particles: 'cosmic', points: 500 },
};

// Trophy Styles
const TROPHY_STYLES: Record<TrophyStyle, { material: string; pedestal: string }> = {
  medal: { material: 'gold', pedestal: 'velvet' },
  cup: { material: 'silver', pedestal: 'marble' },
  shield: { material: 'bronze', pedestal: 'wood' },
  star: { material: 'crystal', pedestal: 'glass' },
  crystal: { material: 'diamond', pedestal: 'obsidian' },
  lightsaber: { material: 'kyber', pedestal: 'durasteel' },
  holocron: { material: 'holocron', pedestal: 'jedi-stone' },
  kyber: { material: 'kyber-crystal', pedestal: 'force-field' },
};

// Default Achievements
const DEFAULT_ACHIEVEMENTS: Omit<Achievement, 'id' | 'trophy'>[] = [
  // Combo Achievements
  { name: 'First Combo', description: 'Execute your first gesture combo', category: 'combo', rarity: 'common', icon: '👊', requirement: 'Execute 1 combo', progress: 0, maxProgress: 1, isUnlocked: false, unlockedAt: null, points: 10, isSecret: false },
  { name: 'Combo Apprentice', description: 'Execute 10 gesture combos', category: 'combo', rarity: 'uncommon', icon: '🥋', requirement: 'Execute 10 combos', progress: 0, maxProgress: 10, isUnlocked: false, unlockedAt: null, points: 25, isSecret: false },
  { name: 'Combo Master', description: 'Execute 100 gesture combos', category: 'combo', rarity: 'rare', icon: '🏆', requirement: 'Execute 100 combos', progress: 0, maxProgress: 100, isUnlocked: false, unlockedAt: null, points: 50, isSecret: false },
  { name: 'Combo Legend', description: 'Execute 1000 gesture combos', category: 'combo', rarity: 'epic', icon: '👑', requirement: 'Execute 1000 combos', progress: 0, maxProgress: 1000, isUnlocked: false, unlockedAt: null, points: 100, isSecret: false },
  { name: 'Perfect Execution', description: 'Execute 50 perfect combos in a row', category: 'combo', rarity: 'legendary', icon: '💎', requirement: '50 perfect combos streak', progress: 0, maxProgress: 50, isUnlocked: false, unlockedAt: null, points: 250, isSecret: false },

  // Voice Achievements
  { name: 'Voice Activated', description: 'Use your first voice command', category: 'voice', rarity: 'common', icon: '🎤', requirement: 'Use 1 voice command', progress: 0, maxProgress: 1, isUnlocked: false, unlockedAt: null, points: 10, isSecret: false },
  { name: 'Vocal Virtuoso', description: 'Use 50 voice commands', category: 'voice', rarity: 'uncommon', icon: '🎵', requirement: 'Use 50 voice commands', progress: 0, maxProgress: 50, isUnlocked: false, unlockedAt: null, points: 25, isSecret: false },
  { name: 'Voice Commander', description: 'Use all voice command types', category: 'voice', rarity: 'rare', icon: '📢', requirement: 'Use all command types', progress: 0, maxProgress: 12, isUnlocked: false, unlockedAt: null, points: 50, isSecret: false },
  { name: 'Whisper Master', description: 'Successfully use voice commands at low volume', category: 'voice', rarity: 'epic', icon: '🤫', requirement: 'Low volume commands', progress: 0, maxProgress: 10, isUnlocked: false, unlockedAt: null, points: 100, isSecret: false },

  // Weather Achievements
  { name: 'Weather Watcher', description: 'Experience 5 different weather conditions', category: 'weather', rarity: 'common', icon: '🌤️', requirement: '5 weather types', progress: 0, maxProgress: 5, isUnlocked: false, unlockedAt: null, points: 10, isSecret: false },
  { name: 'Storm Chaser', description: 'Use the app during a thunderstorm', category: 'weather', rarity: 'uncommon', icon: '⛈️', requirement: 'Use during storm', progress: 0, maxProgress: 1, isUnlocked: false, unlockedAt: null, points: 25, isSecret: false },
  { name: 'All Seasons', description: 'Experience all four seasons', category: 'weather', rarity: 'rare', icon: '🍂', requirement: 'All 4 seasons', progress: 0, maxProgress: 4, isUnlocked: false, unlockedAt: null, points: 50, isSecret: false },
  { name: 'Weather Prophet', description: 'Predict weather changes 10 times', category: 'weather', rarity: 'epic', icon: '🔮', requirement: '10 predictions', progress: 0, maxProgress: 10, isUnlocked: false, unlockedAt: null, points: 100, isSecret: false },

  // Streak Achievements
  { name: 'Getting Started', description: 'Achieve a 5 combo streak', category: 'streak', rarity: 'common', icon: '🔥', requirement: '5 streak', progress: 0, maxProgress: 5, isUnlocked: false, unlockedAt: null, points: 10, isSecret: false },
  { name: 'On Fire', description: 'Achieve a 25 combo streak', category: 'streak', rarity: 'uncommon', icon: '💥', requirement: '25 streak', progress: 0, maxProgress: 25, isUnlocked: false, unlockedAt: null, points: 25, isSecret: false },
  { name: 'Unstoppable', description: 'Achieve a 50 combo streak', category: 'streak', rarity: 'rare', icon: '⚡', requirement: '50 streak', progress: 0, maxProgress: 50, isUnlocked: false, unlockedAt: null, points: 50, isSecret: false },
  { name: 'Legendary Streak', description: 'Achieve a 100 combo streak', category: 'streak', rarity: 'legendary', icon: '🌟', requirement: '100 streak', progress: 0, maxProgress: 100, isUnlocked: false, unlockedAt: null, points: 250, isSecret: false },

  // Exploration Achievements
  { name: 'Explorer', description: 'Visit all app sections', category: 'exploration', rarity: 'common', icon: '🗺️', requirement: 'Visit all sections', progress: 0, maxProgress: 10, isUnlocked: false, unlockedAt: null, points: 10, isSecret: false },
  { name: 'Customizer', description: 'Customize 10 different settings', category: 'exploration', rarity: 'uncommon', icon: '⚙️', requirement: '10 customizations', progress: 0, maxProgress: 10, isUnlocked: false, unlockedAt: null, points: 25, isSecret: false },
  { name: 'Theme Collector', description: 'Try all available themes', category: 'exploration', rarity: 'rare', icon: '🎨', requirement: 'All themes', progress: 0, maxProgress: 15, isUnlocked: false, unlockedAt: null, points: 50, isSecret: false },

  // Mastery Achievements
  { name: 'Quick Learner', description: 'Complete the tutorial', category: 'mastery', rarity: 'common', icon: '📚', requirement: 'Complete tutorial', progress: 0, maxProgress: 1, isUnlocked: false, unlockedAt: null, points: 10, isSecret: false },
  { name: 'Dedicated User', description: 'Use the app for 7 consecutive days', category: 'mastery', rarity: 'uncommon', icon: '📅', requirement: '7 day streak', progress: 0, maxProgress: 7, isUnlocked: false, unlockedAt: null, points: 25, isSecret: false },
  { name: 'Power User', description: 'Use all features at least once', category: 'mastery', rarity: 'rare', icon: '💪', requirement: 'All features used', progress: 0, maxProgress: 20, isUnlocked: false, unlockedAt: null, points: 50, isSecret: false },
  { name: 'True Master', description: 'Unlock 50 achievements', category: 'mastery', rarity: 'legendary', icon: '🏅', requirement: '50 achievements', progress: 0, maxProgress: 50, isUnlocked: false, unlockedAt: null, points: 250, isSecret: false },

  // JEDI Achievements
  { name: 'Padawan', description: 'Begin your JEDI training', category: 'jedi', rarity: 'common', icon: '⚔️', requirement: 'Start JEDI mode', progress: 0, maxProgress: 1, isUnlocked: false, unlockedAt: null, points: 10, isSecret: false },
  { name: 'Jedi Knight', description: 'Complete basic JEDI training', category: 'jedi', rarity: 'uncommon', icon: '🗡️', requirement: 'Basic training', progress: 0, maxProgress: 10, isUnlocked: false, unlockedAt: null, points: 25, isSecret: false },
  { name: 'Jedi Master', description: 'Master all JEDI techniques', category: 'jedi', rarity: 'rare', icon: '✨', requirement: 'All techniques', progress: 0, maxProgress: 25, isUnlocked: false, unlockedAt: null, points: 50, isSecret: false },
  { name: 'Council Member', description: 'Achieve JEDI Council status', category: 'jedi', rarity: 'epic', icon: '🌌', requirement: 'Council status', progress: 0, maxProgress: 50, isUnlocked: false, unlockedAt: null, points: 100, isSecret: false },
  { name: 'Grand Master', description: 'Become a Grand Master of the Order', category: 'jedi', rarity: 'legendary', icon: '🌠', requirement: 'Grand Master', progress: 0, maxProgress: 100, isUnlocked: false, unlockedAt: null, points: 250, isSecret: false },
  { name: 'The Chosen One', description: 'Bring balance to the Force', category: 'jedi', rarity: 'mythic', icon: '☯️', requirement: 'Balance the Force', progress: 0, maxProgress: 1, isUnlocked: false, unlockedAt: null, points: 500, secretHint: 'Fulfill the prophecy...', isSecret: true },

  // Special/Secret Achievements
  { name: 'Night Owl', description: 'Use the app at midnight', category: 'special', rarity: 'uncommon', icon: '🦉', requirement: 'Use at midnight', progress: 0, maxProgress: 1, isUnlocked: false, unlockedAt: null, points: 25, isSecret: true, secretHint: 'When the clock strikes twelve...' },
  { name: 'Early Bird', description: 'Use the app at 5 AM', category: 'special', rarity: 'uncommon', icon: '🐦', requirement: 'Use at 5 AM', progress: 0, maxProgress: 1, isUnlocked: false, unlockedAt: null, points: 25, isSecret: true, secretHint: 'The early bird catches the worm...' },
  { name: 'Easter Egg Hunter', description: 'Find all hidden features', category: 'special', rarity: 'legendary', icon: '🥚', requirement: 'All easter eggs', progress: 0, maxProgress: 10, isUnlocked: false, unlockedAt: null, points: 250, isSecret: true, secretHint: 'Look in unexpected places...' },
];

class AchievementShowcaseService {
  private achievements: Map<string, Achievement> = new Map();
  private trophyRooms: Map<string, TrophyRoom> = new Map();
  private currentInspection: TrophyInspection | null = null;
  private analytics: ShowcaseAnalytics;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.analytics = {
      totalAchievements: 0,
      unlockedAchievements: 0,
      totalPoints: 0,
      rarityCounts: {} as Record<AchievementRarity, { total: number; unlocked: number }>,
      categoryCounts: {} as Record<AchievementCategory, { total: number; unlocked: number }>,
      recentUnlocks: [],
      favoriteCategory: 'combo',
      completionPercentage: 0,
    };
    this.initializeDefaults();
  }

  private initializeDefaults(): void {
    // Initialize achievements with trophies
    DEFAULT_ACHIEVEMENTS.forEach((achievement, index) => {
      const id = `achievement-${index + 1}`;
      const rarityConfig = RARITY_CONFIG[achievement.rarity];
      const trophyStyle = this.getTrophyStyleForCategory(achievement.category);
      const styleConfig = TROPHY_STYLES[trophyStyle];

      const trophy: Trophy = {
        id: `trophy-${id}`,
        achievementId: id,
        style: trophyStyle,
        material: styleConfig.material,
        primaryColor: rarityConfig.color,
        secondaryColor: rarityConfig.glow,
        glowColor: rarityConfig.glow,
        glowIntensity: achievement.rarity === 'mythic' ? 1.0 : achievement.rarity === 'legendary' ? 0.8 : 0.5,
        rotationSpeed: 30,
        particleEffect: rarityConfig.particles,
        unlockAnimation: `unlock-${achievement.rarity}`,
        displayScale: 1.0,
        pedestal: styleConfig.pedestal,
      };

      this.achievements.set(id, { ...achievement, id, trophy, points: rarityConfig.points });
    });

    // Initialize default trophy room
    this.trophyRooms.set('main', {
      id: 'main',
      name: 'Main Trophy Room',
      theme: 'jedi-temple',
      backgroundColor: '#0d1b2a',
      ambientLight: '#1b263b',
      spotlightColor: '#00bcd4',
      pedestalStyle: 'marble',
      maxTrophies: 50,
      trophyIds: [],
      layout: 'showcase',
      particleAmbience: 'dust-motes',
    });

    this.updateAnalytics();
  }

  private getTrophyStyleForCategory(category: AchievementCategory): TrophyStyle {
    const categoryStyles: Record<AchievementCategory, TrophyStyle> = {
      combo: 'medal',
      voice: 'cup',
      weather: 'crystal',
      streak: 'star',
      exploration: 'shield',
      mastery: 'cup',
      special: 'crystal',
      jedi: 'lightsaber',
    };
    return categoryStyles[category];
  }

  // Achievement Management
  getAllAchievements(): Achievement[] {
    return Array.from(this.achievements.values());
  }

  getAchievement(id: string): Achievement | undefined {
    return this.achievements.get(id);
  }

  getAchievementsByCategory(category: AchievementCategory): Achievement[] {
    return Array.from(this.achievements.values()).filter(a => a.category === category);
  }

  getAchievementsByRarity(rarity: AchievementRarity): Achievement[] {
    return Array.from(this.achievements.values()).filter(a => a.rarity === rarity);
  }

  getUnlockedAchievements(): Achievement[] {
    return Array.from(this.achievements.values()).filter(a => a.isUnlocked);
  }

  getLockedAchievements(): Achievement[] {
    return Array.from(this.achievements.values()).filter(a => !a.isUnlocked);
  }

  getSecretAchievements(): Achievement[] {
    return Array.from(this.achievements.values()).filter(a => a.isSecret);
  }

  // Progress & Unlocking
  updateProgress(achievementId: string, progress: number): Achievement | null {
    const achievement = this.achievements.get(achievementId);
    if (!achievement) return null;

    achievement.progress = Math.min(progress, achievement.maxProgress);

    if (achievement.progress >= achievement.maxProgress && !achievement.isUnlocked) {
      this.unlockAchievement(achievementId);
    }

    this.notifyListeners();
    return achievement;
  }

  incrementProgress(achievementId: string, amount: number = 1): Achievement | null {
    const achievement = this.achievements.get(achievementId);
    if (!achievement) return null;

    return this.updateProgress(achievementId, achievement.progress + amount);
  }

  unlockAchievement(achievementId: string): Achievement | null {
    const achievement = this.achievements.get(achievementId);
    if (!achievement || achievement.isUnlocked) return null;

    achievement.isUnlocked = true;
    achievement.unlockedAt = Date.now();
    achievement.progress = achievement.maxProgress;

    // Add trophy to main room
    const mainRoom = this.trophyRooms.get('main');
    if (mainRoom && !mainRoom.trophyIds.includes(achievement.trophy.id)) {
      mainRoom.trophyIds.push(achievement.trophy.id);
    }

    // Update analytics
    this.analytics.recentUnlocks.unshift(achievementId);
    if (this.analytics.recentUnlocks.length > 10) {
      this.analytics.recentUnlocks.pop();
    }

    this.updateAnalytics();
    this.notifyListeners();
    return achievement;
  }

  // Trophy Room Management
  getAllTrophyRooms(): TrophyRoom[] {
    return Array.from(this.trophyRooms.values());
  }

  getTrophyRoom(id: string): TrophyRoom | undefined {
    return this.trophyRooms.get(id);
  }

  createTrophyRoom(data: Omit<TrophyRoom, 'id'>): TrophyRoom {
    const id = `room-${Date.now()}`;
    const room: TrophyRoom = { ...data, id };
    this.trophyRooms.set(id, room);
    this.notifyListeners();
    return room;
  }

  updateTrophyRoom(id: string, updates: Partial<TrophyRoom>): TrophyRoom | null {
    const room = this.trophyRooms.get(id);
    if (!room) return null;

    Object.assign(room, updates);
    this.notifyListeners();
    return room;
  }

  // Trophy Inspection
  startInspection(trophyId: string): TrophyInspection {
    this.currentInspection = {
      trophyId,
      zoomLevel: 1.0,
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0,
      isAutoRotating: true,
      showDetails: true,
      showParticles: true,
    };
    this.notifyListeners();
    return this.currentInspection;
  }

  updateInspection(updates: Partial<TrophyInspection>): TrophyInspection | null {
    if (!this.currentInspection) return null;

    Object.assign(this.currentInspection, updates);
    this.notifyListeners();
    return this.currentInspection;
  }

  endInspection(): void {
    this.currentInspection = null;
    this.notifyListeners();
  }

  getCurrentInspection(): TrophyInspection | null {
    return this.currentInspection;
  }

  // Category Progress
  getCategoryProgress(category: AchievementCategory): AchievementProgress {
    const categoryAchievements = this.getAchievementsByCategory(category);
    const unlocked = categoryAchievements.filter(a => a.isUnlocked);
    const points = unlocked.reduce((sum, a) => sum + a.points, 0);
    const nextAchievement = categoryAchievements.find(a => !a.isUnlocked) || null;

    return {
      category,
      total: categoryAchievements.length,
      unlocked: unlocked.length,
      percentage: categoryAchievements.length > 0 
        ? (unlocked.length / categoryAchievements.length) * 100 
        : 0,
      points,
      nextAchievement,
    };
  }

  getAllCategoryProgress(): AchievementProgress[] {
    const categories: AchievementCategory[] = ['combo', 'voice', 'weather', 'streak', 'exploration', 'mastery', 'special', 'jedi'];
    return categories.map(cat => this.getCategoryProgress(cat));
  }

  // Analytics
  private updateAnalytics(): void {
    const all = Array.from(this.achievements.values());
    const unlocked = all.filter(a => a.isUnlocked);

    this.analytics.totalAchievements = all.length;
    this.analytics.unlockedAchievements = unlocked.length;
    this.analytics.totalPoints = unlocked.reduce((sum, a) => sum + a.points, 0);
    this.analytics.completionPercentage = all.length > 0 
      ? (unlocked.length / all.length) * 100 
      : 0;

    // Rarity counts
    const rarities: AchievementRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
    rarities.forEach(rarity => {
      const rarityAchievements = all.filter(a => a.rarity === rarity);
      this.analytics.rarityCounts[rarity] = {
        total: rarityAchievements.length,
        unlocked: rarityAchievements.filter(a => a.isUnlocked).length,
      };
    });

    // Category counts
    const categories: AchievementCategory[] = ['combo', 'voice', 'weather', 'streak', 'exploration', 'mastery', 'special', 'jedi'];
    let maxCategoryUnlocked = 0;
    categories.forEach(category => {
      const categoryAchievements = all.filter(a => a.category === category);
      const categoryUnlocked = categoryAchievements.filter(a => a.isUnlocked).length;
      this.analytics.categoryCounts[category] = {
        total: categoryAchievements.length,
        unlocked: categoryUnlocked,
      };
      if (categoryUnlocked > maxCategoryUnlocked) {
        maxCategoryUnlocked = categoryUnlocked;
        this.analytics.favoriteCategory = category;
      }
    });
  }

  getAnalytics(): ShowcaseAnalytics {
    return { ...this.analytics };
  }

  // Trophy Details
  getTrophy(achievementId: string): Trophy | null {
    const achievement = this.achievements.get(achievementId);
    return achievement?.trophy || null;
  }

  getAllTrophies(): Trophy[] {
    return Array.from(this.achievements.values())
      .filter(a => a.isUnlocked)
      .map(a => a.trophy);
  }

  // Rarity Config
  getRarityConfig(rarity: AchievementRarity): typeof RARITY_CONFIG[AchievementRarity] {
    return RARITY_CONFIG[rarity];
  }

  // Export/Import
  exportProgress(): string {
    const progress: Record<string, { progress: number; isUnlocked: boolean; unlockedAt: number | null }> = {};
    
    this.achievements.forEach((achievement, id) => {
      progress[id] = {
        progress: achievement.progress,
        isUnlocked: achievement.isUnlocked,
        unlockedAt: achievement.unlockedAt,
      };
    });

    return JSON.stringify({
      progress,
      analytics: this.analytics,
      exportedAt: Date.now(),
    }, null, 2);
  }

  importProgress(json: string): { success: boolean; restored: number } {
    try {
      const data = JSON.parse(json);
      let restored = 0;

      if (data.progress) {
        Object.entries(data.progress).forEach(([id, state]: [string, any]) => {
          const achievement = this.achievements.get(id);
          if (achievement) {
            achievement.progress = state.progress;
            achievement.isUnlocked = state.isUnlocked;
            achievement.unlockedAt = state.unlockedAt;
            restored++;
          }
        });
      }

      this.updateAnalytics();
      this.notifyListeners();
      return { success: true, restored };
    } catch {
      return { success: false, restored: 0 };
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
    this.achievements.clear();
    this.trophyRooms.clear();
    this.currentInspection = null;
    this.analytics = {
      totalAchievements: 0,
      unlockedAchievements: 0,
      totalPoints: 0,
      rarityCounts: {} as Record<AchievementRarity, { total: number; unlocked: number }>,
      categoryCounts: {} as Record<AchievementCategory, { total: number; unlocked: number }>,
      recentUnlocks: [],
      favoriteCategory: 'combo',
      completionPercentage: 0,
    };
    this.initializeDefaults();
    this.notifyListeners();
  }
}

export const achievementShowcaseService = new AchievementShowcaseService();
