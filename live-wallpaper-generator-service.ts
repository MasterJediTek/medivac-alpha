/**
 * Live Wallpaper Generator Service
 * MediVac WACHS v8.9
 * 
 * Converts static images into animated live wallpapers with particle effects,
 * parallax scrolling, motion blur, color cycling, and interactive touch effects.
 */

export type ParticleType = 
  | 'stars' | 'snow' | 'rain' | 'fire' | 'magic' | 'bubbles' | 'leaves' | 'petals'
  | 'confetti' | 'dust' | 'sparks' | 'fireflies' | 'aurora' | 'nebula' | 'matrix'
  | 'force-particles' | 'lightsaber-sparks' | 'hyperspace-stars' | 'hologram-scan';

export type MotionType = 'float' | 'fall' | 'rise' | 'swirl' | 'pulse' | 'wave' | 'orbit' | 'random' | 'flow';
export type BlendMode = 'normal' | 'add' | 'multiply' | 'screen' | 'overlay' | 'soft-light' | 'hard-light';
export type InteractionType = 'ripple' | 'attract' | 'repel' | 'explode' | 'trail' | 'glow' | 'vortex';

export interface ParticleConfig {
  type: ParticleType;
  count: number;
  size: { min: number; max: number };
  speed: { min: number; max: number };
  opacity: { min: number; max: number };
  color: string | string[]; // Single color or gradient
  motion: MotionType;
  lifetime: number; // ms, 0 = infinite
  spawnRate: number; // particles per second
  gravity: number;
  wind: { x: number; y: number };
  rotation: boolean;
  glow: number; // 0-1
  trail: { enabled: boolean; length: number; fade: number };
  collision: boolean;
  interactive: boolean;
}

export interface ParallaxLayer {
  id: string;
  imageUri: string;
  depth: number; // 0 = background, 1 = foreground
  speed: number; // Movement multiplier
  opacity: number;
  blendMode: BlendMode;
  scale: number;
  offset: { x: number; y: number };
  animation?: LayerAnimation;
}

export interface LayerAnimation {
  type: 'float' | 'pulse' | 'rotate' | 'scale' | 'shake' | 'breathe';
  duration: number;
  amplitude: number;
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce';
}

export interface ColorCycle {
  enabled: boolean;
  colors: string[];
  duration: number; // Full cycle duration in ms
  mode: 'gradient' | 'step' | 'pulse' | 'wave';
  affectsParticles: boolean;
  affectsBackground: boolean;
}

export interface TouchInteraction {
  enabled: boolean;
  type: InteractionType;
  radius: number;
  strength: number;
  duration: number;
  color?: string;
  sound?: string;
  haptic?: number[];
}

export interface LiveWallpaper {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  baseImage?: string;
  particles: ParticleConfig[];
  parallaxLayers: ParallaxLayer[];
  colorCycle: ColorCycle;
  touchInteraction: TouchInteraction;
  backgroundColor: string;
  fps: number;
  batteryMode: BatteryMode;
  schedule?: WallpaperSchedule;
  isBuiltIn: boolean;
  isActive: boolean;
  isFavorite: boolean;
  createdAt: number;
  updatedAt: number;
  usageTime: number; // Total ms active
  tags: string[];
}

export interface BatteryMode {
  enabled: boolean;
  threshold: number; // Battery % to activate
  reducedFps: number;
  reducedParticles: number; // Percentage to keep
  disableInteraction: boolean;
  disableColorCycle: boolean;
}

export interface WallpaperSchedule {
  enabled: boolean;
  entries: ScheduleEntry[];
}

export interface ScheduleEntry {
  id: string;
  wallpaperId: string;
  startTime: string; // HH:MM
  endTime: string;
  days: number[]; // 0-6, Sunday = 0
  isEnabled: boolean;
}

export interface WallpaperPreview {
  id: string;
  wallpaperId: string;
  frames: string[]; // Base64 encoded frames
  duration: number;
  fps: number;
  generatedAt: number;
}

export interface WallpaperAnalytics {
  totalWallpapers: number;
  activeWallpaper?: string;
  totalUsageTime: number;
  avgFps: number;
  batteryImpact: number; // Estimated % per hour
  mostUsedWallpapers: { id: string; name: string; time: number }[];
  particleStats: { type: ParticleType; count: number }[];
}

// JEDI-themed particle presets
export const JEDI_PARTICLE_PRESETS: Record<string, ParticleConfig> = {
  forceParticles: {
    type: 'force-particles',
    count: 100,
    size: { min: 2, max: 8 },
    speed: { min: 0.5, max: 2 },
    opacity: { min: 0.3, max: 0.8 },
    color: ['#00BFFF', '#00FF88', '#FFFFFF'],
    motion: 'swirl',
    lifetime: 3000,
    spawnRate: 30,
    gravity: 0,
    wind: { x: 0, y: 0 },
    rotation: true,
    glow: 0.8,
    trail: { enabled: true, length: 10, fade: 0.9 },
    collision: false,
    interactive: true,
  },
  lightsaberSparks: {
    type: 'lightsaber-sparks',
    count: 50,
    size: { min: 1, max: 4 },
    speed: { min: 2, max: 5 },
    opacity: { min: 0.6, max: 1 },
    color: ['#00FF00', '#FFFFFF', '#90EE90'],
    motion: 'random',
    lifetime: 500,
    spawnRate: 50,
    gravity: 0.5,
    wind: { x: 0, y: 0 },
    rotation: false,
    glow: 1,
    trail: { enabled: true, length: 5, fade: 0.95 },
    collision: false,
    interactive: false,
  },
  hyperspaceStars: {
    type: 'hyperspace-stars',
    count: 200,
    size: { min: 1, max: 3 },
    speed: { min: 5, max: 20 },
    opacity: { min: 0.5, max: 1 },
    color: '#FFFFFF',
    motion: 'flow',
    lifetime: 2000,
    spawnRate: 100,
    gravity: 0,
    wind: { x: 0, y: 0 },
    rotation: false,
    glow: 0.5,
    trail: { enabled: true, length: 50, fade: 0.98 },
    collision: false,
    interactive: false,
  },
  hologramScan: {
    type: 'hologram-scan',
    count: 30,
    size: { min: 100, max: 100 },
    speed: { min: 1, max: 2 },
    opacity: { min: 0.1, max: 0.3 },
    color: '#00BFFF',
    motion: 'wave',
    lifetime: 0,
    spawnRate: 5,
    gravity: 0,
    wind: { x: 0, y: 0 },
    rotation: false,
    glow: 0.3,
    trail: { enabled: false, length: 0, fade: 0 },
    collision: false,
    interactive: false,
  },
};

// Standard particle presets
export const PARTICLE_PRESETS: Record<string, ParticleConfig> = {
  stars: {
    type: 'stars',
    count: 150,
    size: { min: 1, max: 3 },
    speed: { min: 0.1, max: 0.5 },
    opacity: { min: 0.3, max: 1 },
    color: '#FFFFFF',
    motion: 'pulse',
    lifetime: 0,
    spawnRate: 0,
    gravity: 0,
    wind: { x: 0, y: 0 },
    rotation: false,
    glow: 0.5,
    trail: { enabled: false, length: 0, fade: 0 },
    collision: false,
    interactive: true,
  },
  snow: {
    type: 'snow',
    count: 100,
    size: { min: 2, max: 6 },
    speed: { min: 0.5, max: 2 },
    opacity: { min: 0.5, max: 1 },
    color: '#FFFFFF',
    motion: 'fall',
    lifetime: 0,
    spawnRate: 20,
    gravity: 0.3,
    wind: { x: 0.2, y: 0 },
    rotation: true,
    glow: 0,
    trail: { enabled: false, length: 0, fade: 0 },
    collision: false,
    interactive: true,
  },
  rain: {
    type: 'rain',
    count: 200,
    size: { min: 1, max: 2 },
    speed: { min: 5, max: 10 },
    opacity: { min: 0.3, max: 0.6 },
    color: '#87CEEB',
    motion: 'fall',
    lifetime: 0,
    spawnRate: 50,
    gravity: 1,
    wind: { x: 0.5, y: 0 },
    rotation: false,
    glow: 0,
    trail: { enabled: true, length: 10, fade: 0.9 },
    collision: false,
    interactive: false,
  },
  fire: {
    type: 'fire',
    count: 80,
    size: { min: 5, max: 15 },
    speed: { min: 1, max: 3 },
    opacity: { min: 0.5, max: 1 },
    color: ['#FF4500', '#FF6347', '#FFD700', '#FFA500'],
    motion: 'rise',
    lifetime: 2000,
    spawnRate: 40,
    gravity: -0.5,
    wind: { x: 0, y: 0 },
    rotation: true,
    glow: 0.8,
    trail: { enabled: false, length: 0, fade: 0 },
    collision: false,
    interactive: true,
  },
  magic: {
    type: 'magic',
    count: 60,
    size: { min: 3, max: 8 },
    speed: { min: 0.5, max: 2 },
    opacity: { min: 0.4, max: 1 },
    color: ['#FF69B4', '#9B59B6', '#3498DB', '#2ECC71', '#F1C40F'],
    motion: 'swirl',
    lifetime: 4000,
    spawnRate: 15,
    gravity: 0,
    wind: { x: 0, y: 0 },
    rotation: true,
    glow: 0.9,
    trail: { enabled: true, length: 15, fade: 0.95 },
    collision: false,
    interactive: true,
  },
  fireflies: {
    type: 'fireflies',
    count: 30,
    size: { min: 3, max: 6 },
    speed: { min: 0.3, max: 1 },
    opacity: { min: 0.2, max: 1 },
    color: '#FFFF00',
    motion: 'random',
    lifetime: 0,
    spawnRate: 0,
    gravity: 0,
    wind: { x: 0, y: 0 },
    rotation: false,
    glow: 1,
    trail: { enabled: true, length: 5, fade: 0.8 },
    collision: false,
    interactive: true,
  },
  aurora: {
    type: 'aurora',
    count: 5,
    size: { min: 200, max: 400 },
    speed: { min: 0.1, max: 0.3 },
    opacity: { min: 0.2, max: 0.5 },
    color: ['#00FF00', '#00BFFF', '#FF69B4', '#9B59B6'],
    motion: 'wave',
    lifetime: 0,
    spawnRate: 0,
    gravity: 0,
    wind: { x: 0.1, y: 0 },
    rotation: false,
    glow: 0.6,
    trail: { enabled: false, length: 0, fade: 0 },
    collision: false,
    interactive: false,
  },
  matrix: {
    type: 'matrix',
    count: 100,
    size: { min: 10, max: 14 },
    speed: { min: 2, max: 5 },
    opacity: { min: 0.3, max: 1 },
    color: '#00FF00',
    motion: 'fall',
    lifetime: 0,
    spawnRate: 30,
    gravity: 0,
    wind: { x: 0, y: 0 },
    rotation: false,
    glow: 0.5,
    trail: { enabled: true, length: 20, fade: 0.95 },
    collision: false,
    interactive: false,
  },
};

// Touch interaction presets
export const TOUCH_PRESETS: Record<string, TouchInteraction> = {
  ripple: { enabled: true, type: 'ripple', radius: 100, strength: 1, duration: 500, color: '#FFFFFF' },
  attract: { enabled: true, type: 'attract', radius: 150, strength: 0.8, duration: 0, color: '#3498DB' },
  repel: { enabled: true, type: 'repel', radius: 150, strength: 0.8, duration: 0, color: '#E74C3C' },
  explode: { enabled: true, type: 'explode', radius: 80, strength: 1, duration: 300, color: '#F39C12' },
  trail: { enabled: true, type: 'trail', radius: 30, strength: 1, duration: 1000, color: '#9B59B6' },
  glow: { enabled: true, type: 'glow', radius: 60, strength: 1, duration: 200, color: '#2ECC71' },
  vortex: { enabled: true, type: 'vortex', radius: 200, strength: 0.5, duration: 0, color: '#00BFFF' },
};

type Listener = () => void;

class LiveWallpaperGeneratorService {
  private wallpapers: Map<string, LiveWallpaper> = new Map();
  private previews: Map<string, WallpaperPreview> = new Map();
  private scheduleEntries: Map<string, ScheduleEntry> = new Map();
  private analytics: WallpaperAnalytics;
  private listeners: Set<Listener> = new Set();

  constructor() {
    this.analytics = this.initializeAnalytics();
    this.initializeBuiltInWallpapers();
  }

  private initializeAnalytics(): WallpaperAnalytics {
    return {
      totalWallpapers: 0,
      totalUsageTime: 0,
      avgFps: 30,
      batteryImpact: 2,
      mostUsedWallpapers: [],
      particleStats: [],
    };
  }

  private initializeBuiltInWallpapers(): void {
    const builtInWallpapers: Omit<LiveWallpaper, 'id' | 'createdAt' | 'updatedAt' | 'usageTime'>[] = [
      {
        name: 'JEDI Force Field',
        description: 'Swirling force particles with holographic effects',
        thumbnail: 'jedi_force_field_thumb.png',
        particles: [JEDI_PARTICLE_PRESETS.forceParticles, JEDI_PARTICLE_PRESETS.hologramScan],
        parallaxLayers: [],
        colorCycle: { enabled: true, colors: ['#00BFFF', '#00FF88', '#9B59B6'], duration: 10000, mode: 'gradient', affectsParticles: true, affectsBackground: false },
        touchInteraction: { ...TOUCH_PRESETS.vortex, color: '#00BFFF' },
        backgroundColor: '#0A0A1A',
        fps: 60,
        batteryMode: { enabled: true, threshold: 20, reducedFps: 30, reducedParticles: 50, disableInteraction: true, disableColorCycle: false },
        isBuiltIn: true,
        isActive: false,
        isFavorite: true,
        tags: ['jedi', 'force', 'animated'],
      },
      {
        name: 'Hyperspace Jump',
        description: 'Stars streaking past at lightspeed',
        thumbnail: 'hyperspace_thumb.png',
        particles: [JEDI_PARTICLE_PRESETS.hyperspaceStars],
        parallaxLayers: [],
        colorCycle: { enabled: false, colors: [], duration: 0, mode: 'gradient', affectsParticles: false, affectsBackground: false },
        touchInteraction: { ...TOUCH_PRESETS.explode, color: '#FFFFFF' },
        backgroundColor: '#000000',
        fps: 60,
        batteryMode: { enabled: true, threshold: 20, reducedFps: 30, reducedParticles: 30, disableInteraction: true, disableColorCycle: false },
        isBuiltIn: true,
        isActive: false,
        isFavorite: true,
        tags: ['jedi', 'space', 'hyperspace'],
      },
      {
        name: 'Lightsaber Duel',
        description: 'Sparks flying from clashing lightsabers',
        thumbnail: 'lightsaber_duel_thumb.png',
        particles: [JEDI_PARTICLE_PRESETS.lightsaberSparks],
        parallaxLayers: [],
        colorCycle: { enabled: true, colors: ['#00FF00', '#FF0000', '#0000FF'], duration: 5000, mode: 'step', affectsParticles: true, affectsBackground: false },
        touchInteraction: { ...TOUCH_PRESETS.explode, color: '#00FF00', sound: 'lightsaber_clash.wav' },
        backgroundColor: '#1A1A2E',
        fps: 60,
        batteryMode: { enabled: true, threshold: 20, reducedFps: 30, reducedParticles: 40, disableInteraction: false, disableColorCycle: false },
        isBuiltIn: true,
        isActive: false,
        isFavorite: false,
        tags: ['jedi', 'lightsaber', 'action'],
      },
      {
        name: 'Starfield Night',
        description: 'Peaceful twinkling stars with occasional shooting stars',
        thumbnail: 'starfield_thumb.png',
        particles: [PARTICLE_PRESETS.stars],
        parallaxLayers: [],
        colorCycle: { enabled: false, colors: [], duration: 0, mode: 'gradient', affectsParticles: false, affectsBackground: false },
        touchInteraction: { ...TOUCH_PRESETS.glow, color: '#FFFFFF' },
        backgroundColor: '#0D1B2A',
        fps: 30,
        batteryMode: { enabled: true, threshold: 30, reducedFps: 15, reducedParticles: 70, disableInteraction: true, disableColorCycle: false },
        isBuiltIn: true,
        isActive: false,
        isFavorite: false,
        tags: ['nature', 'night', 'calm'],
      },
      {
        name: 'Winter Snowfall',
        description: 'Gentle snow falling with wind effects',
        thumbnail: 'snowfall_thumb.png',
        particles: [PARTICLE_PRESETS.snow],
        parallaxLayers: [],
        colorCycle: { enabled: false, colors: [], duration: 0, mode: 'gradient', affectsParticles: false, affectsBackground: false },
        touchInteraction: { ...TOUCH_PRESETS.repel, color: '#FFFFFF' },
        backgroundColor: '#2C3E50',
        fps: 30,
        batteryMode: { enabled: true, threshold: 30, reducedFps: 15, reducedParticles: 50, disableInteraction: true, disableColorCycle: false },
        isBuiltIn: true,
        isActive: false,
        isFavorite: false,
        tags: ['nature', 'winter', 'snow'],
      },
      {
        name: 'Fireplace Warmth',
        description: 'Cozy fire particles rising gently',
        thumbnail: 'fireplace_thumb.png',
        particles: [PARTICLE_PRESETS.fire],
        parallaxLayers: [],
        colorCycle: { enabled: true, colors: ['#FF4500', '#FF6347', '#FFD700'], duration: 3000, mode: 'pulse', affectsParticles: true, affectsBackground: true },
        touchInteraction: { ...TOUCH_PRESETS.attract, color: '#FF4500' },
        backgroundColor: '#1A0A00',
        fps: 45,
        batteryMode: { enabled: true, threshold: 25, reducedFps: 20, reducedParticles: 50, disableInteraction: true, disableColorCycle: false },
        isBuiltIn: true,
        isActive: false,
        isFavorite: false,
        tags: ['nature', 'fire', 'warm'],
      },
      {
        name: 'Enchanted Forest',
        description: 'Magical fireflies dancing in the night',
        thumbnail: 'enchanted_thumb.png',
        particles: [PARTICLE_PRESETS.fireflies, PARTICLE_PRESETS.magic],
        parallaxLayers: [],
        colorCycle: { enabled: true, colors: ['#FFFF00', '#00FF00', '#FF69B4'], duration: 8000, mode: 'gradient', affectsParticles: true, affectsBackground: false },
        touchInteraction: { ...TOUCH_PRESETS.attract, color: '#FFFF00' },
        backgroundColor: '#0A1A0A',
        fps: 45,
        batteryMode: { enabled: true, threshold: 25, reducedFps: 20, reducedParticles: 40, disableInteraction: true, disableColorCycle: false },
        isBuiltIn: true,
        isActive: false,
        isFavorite: false,
        tags: ['nature', 'magic', 'forest'],
      },
      {
        name: 'Aurora Borealis',
        description: 'Northern lights dancing across the sky',
        thumbnail: 'aurora_thumb.png',
        particles: [PARTICLE_PRESETS.aurora, PARTICLE_PRESETS.stars],
        parallaxLayers: [],
        colorCycle: { enabled: true, colors: ['#00FF00', '#00BFFF', '#FF69B4', '#9B59B6'], duration: 15000, mode: 'wave', affectsParticles: true, affectsBackground: true },
        touchInteraction: { ...TOUCH_PRESETS.ripple, color: '#00FF00' },
        backgroundColor: '#0A0A2A',
        fps: 30,
        batteryMode: { enabled: true, threshold: 30, reducedFps: 15, reducedParticles: 80, disableInteraction: true, disableColorCycle: false },
        isBuiltIn: true,
        isActive: false,
        isFavorite: true,
        tags: ['nature', 'aurora', 'beautiful'],
      },
      {
        name: 'Matrix Code',
        description: 'Digital rain of green characters',
        thumbnail: 'matrix_thumb.png',
        particles: [PARTICLE_PRESETS.matrix],
        parallaxLayers: [],
        colorCycle: { enabled: false, colors: [], duration: 0, mode: 'gradient', affectsParticles: false, affectsBackground: false },
        touchInteraction: { ...TOUCH_PRESETS.trail, color: '#00FF00' },
        backgroundColor: '#000000',
        fps: 30,
        batteryMode: { enabled: true, threshold: 25, reducedFps: 15, reducedParticles: 50, disableInteraction: true, disableColorCycle: false },
        isBuiltIn: true,
        isActive: false,
        isFavorite: false,
        tags: ['tech', 'matrix', 'code'],
      },
      {
        name: 'Rainy Day',
        description: 'Relaxing rain with subtle lightning',
        thumbnail: 'rainy_thumb.png',
        particles: [PARTICLE_PRESETS.rain],
        parallaxLayers: [],
        colorCycle: { enabled: false, colors: [], duration: 0, mode: 'gradient', affectsParticles: false, affectsBackground: false },
        touchInteraction: { ...TOUCH_PRESETS.ripple, color: '#87CEEB' },
        backgroundColor: '#2C3E50',
        fps: 45,
        batteryMode: { enabled: true, threshold: 25, reducedFps: 20, reducedParticles: 50, disableInteraction: true, disableColorCycle: false },
        isBuiltIn: true,
        isActive: false,
        isFavorite: false,
        tags: ['nature', 'rain', 'relaxing'],
      },
    ];

    builtInWallpapers.forEach((wallpaper, idx) => {
      const id = `wallpaper-${idx}`;
      this.wallpapers.set(id, {
        ...wallpaper,
        id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usageTime: 0,
      });
    });

    this.analytics.totalWallpapers = builtInWallpapers.length;
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Wallpaper management
  getWallpaper(id: string): LiveWallpaper | undefined {
    return this.wallpapers.get(id);
  }

  getAllWallpapers(): LiveWallpaper[] {
    return Array.from(this.wallpapers.values());
  }

  getActiveWallpaper(): LiveWallpaper | undefined {
    return Array.from(this.wallpapers.values()).find(w => w.isActive);
  }

  getFavoriteWallpapers(): LiveWallpaper[] {
    return Array.from(this.wallpapers.values()).filter(w => w.isFavorite);
  }

  getWallpapersByTag(tag: string): LiveWallpaper[] {
    return Array.from(this.wallpapers.values()).filter(w => w.tags.includes(tag));
  }

  createWallpaper(data: Omit<LiveWallpaper, 'id' | 'isBuiltIn' | 'createdAt' | 'updatedAt' | 'usageTime'>): LiveWallpaper {
    const id = `wallpaper-${Date.now()}`;
    const wallpaper: LiveWallpaper = {
      ...data,
      id,
      isBuiltIn: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      usageTime: 0,
    };
    this.wallpapers.set(id, wallpaper);
    this.analytics.totalWallpapers++;
    this.notifyListeners();
    return wallpaper;
  }

  updateWallpaper(id: string, updates: Partial<LiveWallpaper>): LiveWallpaper | null {
    const wallpaper = this.wallpapers.get(id);
    if (!wallpaper) return null;

    Object.assign(wallpaper, updates, { updatedAt: Date.now() });
    this.notifyListeners();
    return wallpaper;
  }

  deleteWallpaper(id: string): boolean {
    const wallpaper = this.wallpapers.get(id);
    if (!wallpaper || wallpaper.isBuiltIn) return false;

    this.wallpapers.delete(id);
    this.previews.delete(id);
    this.analytics.totalWallpapers--;
    this.notifyListeners();
    return true;
  }

  setActiveWallpaper(id: string): boolean {
    const wallpaper = this.wallpapers.get(id);
    if (!wallpaper) return false;

    this.wallpapers.forEach(w => { w.isActive = false; });
    wallpaper.isActive = true;
    this.analytics.activeWallpaper = id;
    this.notifyListeners();
    return true;
  }

  toggleFavorite(id: string): boolean {
    const wallpaper = this.wallpapers.get(id);
    if (!wallpaper) return false;

    wallpaper.isFavorite = !wallpaper.isFavorite;
    wallpaper.updatedAt = Date.now();
    this.notifyListeners();
    return wallpaper.isFavorite;
  }

  // Particle management
  addParticleLayer(wallpaperId: string, config: ParticleConfig): boolean {
    const wallpaper = this.wallpapers.get(wallpaperId);
    if (!wallpaper) return false;

    wallpaper.particles.push(config);
    wallpaper.updatedAt = Date.now();
    this.notifyListeners();
    return true;
  }

  removeParticleLayer(wallpaperId: string, index: number): boolean {
    const wallpaper = this.wallpapers.get(wallpaperId);
    if (!wallpaper || index < 0 || index >= wallpaper.particles.length) return false;

    wallpaper.particles.splice(index, 1);
    wallpaper.updatedAt = Date.now();
    this.notifyListeners();
    return true;
  }

  updateParticleLayer(wallpaperId: string, index: number, updates: Partial<ParticleConfig>): boolean {
    const wallpaper = this.wallpapers.get(wallpaperId);
    if (!wallpaper || index < 0 || index >= wallpaper.particles.length) return false;

    Object.assign(wallpaper.particles[index], updates);
    wallpaper.updatedAt = Date.now();
    this.notifyListeners();
    return true;
  }

  // Parallax management
  addParallaxLayer(wallpaperId: string, layer: Omit<ParallaxLayer, 'id'>): ParallaxLayer | null {
    const wallpaper = this.wallpapers.get(wallpaperId);
    if (!wallpaper) return null;

    const newLayer: ParallaxLayer = {
      ...layer,
      id: `layer-${Date.now()}`,
    };
    wallpaper.parallaxLayers.push(newLayer);
    wallpaper.parallaxLayers.sort((a, b) => a.depth - b.depth);
    wallpaper.updatedAt = Date.now();
    this.notifyListeners();
    return newLayer;
  }

  removeParallaxLayer(wallpaperId: string, layerId: string): boolean {
    const wallpaper = this.wallpapers.get(wallpaperId);
    if (!wallpaper) return false;

    const index = wallpaper.parallaxLayers.findIndex(l => l.id === layerId);
    if (index === -1) return false;

    wallpaper.parallaxLayers.splice(index, 1);
    wallpaper.updatedAt = Date.now();
    this.notifyListeners();
    return true;
  }

  updateParallaxLayer(wallpaperId: string, layerId: string, updates: Partial<ParallaxLayer>): boolean {
    const wallpaper = this.wallpapers.get(wallpaperId);
    if (!wallpaper) return false;

    const layer = wallpaper.parallaxLayers.find(l => l.id === layerId);
    if (!layer) return false;

    Object.assign(layer, updates);
    wallpaper.updatedAt = Date.now();
    this.notifyListeners();
    return true;
  }

  // Color cycle
  updateColorCycle(wallpaperId: string, colorCycle: Partial<ColorCycle>): boolean {
    const wallpaper = this.wallpapers.get(wallpaperId);
    if (!wallpaper) return false;

    Object.assign(wallpaper.colorCycle, colorCycle);
    wallpaper.updatedAt = Date.now();
    this.notifyListeners();
    return true;
  }

  // Touch interaction
  updateTouchInteraction(wallpaperId: string, interaction: Partial<TouchInteraction>): boolean {
    const wallpaper = this.wallpapers.get(wallpaperId);
    if (!wallpaper) return false;

    Object.assign(wallpaper.touchInteraction, interaction);
    wallpaper.updatedAt = Date.now();
    this.notifyListeners();
    return true;
  }

  // Battery mode
  updateBatteryMode(wallpaperId: string, batteryMode: Partial<BatteryMode>): boolean {
    const wallpaper = this.wallpapers.get(wallpaperId);
    if (!wallpaper) return false;

    Object.assign(wallpaper.batteryMode, batteryMode);
    wallpaper.updatedAt = Date.now();
    this.notifyListeners();
    return true;
  }

  // Schedule management
  getScheduleEntries(): ScheduleEntry[] {
    return Array.from(this.scheduleEntries.values());
  }

  addScheduleEntry(entry: Omit<ScheduleEntry, 'id'>): ScheduleEntry {
    const id = `schedule-${Date.now()}`;
    const newEntry: ScheduleEntry = { ...entry, id };
    this.scheduleEntries.set(id, newEntry);

    // Update wallpaper schedule
    const wallpaper = this.wallpapers.get(entry.wallpaperId);
    if (wallpaper) {
      if (!wallpaper.schedule) {
        wallpaper.schedule = { enabled: true, entries: [] };
      }
      wallpaper.schedule.entries.push(newEntry);
    }

    this.notifyListeners();
    return newEntry;
  }

  removeScheduleEntry(id: string): boolean {
    const entry = this.scheduleEntries.get(id);
    if (!entry) return false;

    this.scheduleEntries.delete(id);

    // Update wallpaper schedule
    const wallpaper = this.wallpapers.get(entry.wallpaperId);
    if (wallpaper?.schedule) {
      wallpaper.schedule.entries = wallpaper.schedule.entries.filter(e => e.id !== id);
    }

    this.notifyListeners();
    return true;
  }

  toggleScheduleEntry(id: string): boolean {
    const entry = this.scheduleEntries.get(id);
    if (!entry) return false;

    entry.isEnabled = !entry.isEnabled;
    this.notifyListeners();
    return entry.isEnabled;
  }

  // Preview generation
  generatePreview(wallpaperId: string, frames: number = 30): WallpaperPreview | null {
    const wallpaper = this.wallpapers.get(wallpaperId);
    if (!wallpaper) return null;

    // Simulate preview generation
    const preview: WallpaperPreview = {
      id: `preview-${Date.now()}`,
      wallpaperId,
      frames: Array.from({ length: frames }, (_, i) => `frame_${i}_base64_data`),
      duration: (frames / wallpaper.fps) * 1000,
      fps: wallpaper.fps,
      generatedAt: Date.now(),
    };

    this.previews.set(wallpaperId, preview);
    return preview;
  }

  getPreview(wallpaperId: string): WallpaperPreview | undefined {
    return this.previews.get(wallpaperId);
  }

  // Presets
  getParticlePresets(): Record<string, ParticleConfig> {
    return { ...PARTICLE_PRESETS, ...JEDI_PARTICLE_PRESETS };
  }

  getTouchPresets(): Record<string, TouchInteraction> {
    return { ...TOUCH_PRESETS };
  }

  // Convert static image to live wallpaper
  convertToLiveWallpaper(
    imageUri: string,
    name: string,
    particleTypes: ParticleType[] = ['stars'],
    options?: {
      colorCycle?: ColorCycle;
      touchInteraction?: TouchInteraction;
      fps?: number;
    }
  ): LiveWallpaper {
    const particles = particleTypes.map(type => {
      const preset = PARTICLE_PRESETS[type] || JEDI_PARTICLE_PRESETS[type];
      return preset || PARTICLE_PRESETS.stars;
    });

    return this.createWallpaper({
      name,
      description: `Live wallpaper created from ${imageUri}`,
      thumbnail: imageUri,
      baseImage: imageUri,
      particles,
      parallaxLayers: [{
        id: 'base-layer',
        imageUri,
        depth: 0,
        speed: 0.5,
        opacity: 1,
        blendMode: 'normal',
        scale: 1,
        offset: { x: 0, y: 0 },
      }],
      colorCycle: options?.colorCycle || { enabled: false, colors: [], duration: 0, mode: 'gradient', affectsParticles: false, affectsBackground: false },
      touchInteraction: options?.touchInteraction || TOUCH_PRESETS.ripple,
      backgroundColor: '#000000',
      fps: options?.fps || 30,
      batteryMode: { enabled: true, threshold: 25, reducedFps: 15, reducedParticles: 50, disableInteraction: true, disableColorCycle: false },
      isActive: false,
      isFavorite: false,
      tags: ['custom', 'converted'],
    });
  }

  // Analytics
  getAnalytics(): WallpaperAnalytics {
    // Update most used wallpapers
    this.analytics.mostUsedWallpapers = Array.from(this.wallpapers.values())
      .sort((a, b) => b.usageTime - a.usageTime)
      .slice(0, 5)
      .map(w => ({ id: w.id, name: w.name, time: w.usageTime }));

    // Update particle stats
    const particleCounts: Record<ParticleType, number> = {} as Record<ParticleType, number>;
    this.wallpapers.forEach(w => {
      w.particles.forEach(p => {
        particleCounts[p.type] = (particleCounts[p.type] || 0) + p.count;
      });
    });
    this.analytics.particleStats = Object.entries(particleCounts)
      .map(([type, count]) => ({ type: type as ParticleType, count }))
      .sort((a, b) => b.count - a.count);

    return { ...this.analytics };
  }

  recordUsageTime(wallpaperId: string, duration: number): void {
    const wallpaper = this.wallpapers.get(wallpaperId);
    if (wallpaper) {
      wallpaper.usageTime += duration;
      this.analytics.totalUsageTime += duration;
    }
  }

  // Export/Import
  exportConfiguration(): string {
    return JSON.stringify({
      wallpapers: Array.from(this.wallpapers.values()).filter(w => !w.isBuiltIn),
      scheduleEntries: Array.from(this.scheduleEntries.values()),
      exportedAt: Date.now(),
    }, null, 2);
  }

  importConfiguration(json: string): { success: boolean; imported: { wallpapers: number; schedules: number } } {
    try {
      const data = JSON.parse(json);
      let wallpapersImported = 0;
      let schedulesImported = 0;

      if (data.wallpapers) {
        data.wallpapers.forEach((wallpaper: LiveWallpaper) => {
          const newWallpaper = { ...wallpaper, id: `wallpaper-${Date.now()}-${Math.random()}`, isBuiltIn: false, isActive: false };
          this.wallpapers.set(newWallpaper.id, newWallpaper);
          wallpapersImported++;
        });
      }

      if (data.scheduleEntries) {
        data.scheduleEntries.forEach((entry: ScheduleEntry) => {
          const newEntry = { ...entry, id: `schedule-${Date.now()}-${Math.random()}` };
          this.scheduleEntries.set(newEntry.id, newEntry);
          schedulesImported++;
        });
      }

      this.notifyListeners();
      return { success: true, imported: { wallpapers: wallpapersImported, schedules: schedulesImported } };
    } catch {
      return { success: false, imported: { wallpapers: 0, schedules: 0 } };
    }
  }

  // Reset
  reset(): void {
    this.wallpapers.clear();
    this.previews.clear();
    this.scheduleEntries.clear();
    this.analytics = this.initializeAnalytics();
    this.initializeBuiltInWallpapers();
    this.notifyListeners();
  }
}

export const liveWallpaperGeneratorService = new LiveWallpaperGeneratorService();
