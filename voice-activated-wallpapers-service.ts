/**
 * Voice-Activated Live Wallpapers Service
 * MediVac WACHS v9.0
 * 
 * Enables voice commands to trigger wallpaper changes with natural language
 * processing, mood detection, and seamless transitions.
 */

export type WallpaperMood = 'calm' | 'energize' | 'focus' | 'relax' | 'adventure' | 'mystery' | 'celebration' | 'nature' | 'space' | 'jedi';
export type TransitionEffect = 'fade' | 'slide' | 'zoom' | 'dissolve' | 'wipe' | 'ripple' | 'shatter' | 'vortex' | 'hyperspace' | 'force-push';
export type VoiceFeedbackType = 'silent' | 'beep' | 'chime' | 'voice' | 'jedi-sound';

export interface VoiceWallpaperTrigger {
  id: string;
  phrases: string[]; // Multiple phrases can trigger same wallpaper
  wallpaperId: string;
  mood?: WallpaperMood;
  transition: TransitionEffect;
  transitionDuration: number; // ms
  ambientSound?: string;
  isEnabled: boolean;
  priority: number; // Higher priority triggers first on conflicts
  activationCount: number;
  lastActivatedAt?: number;
  createdAt: number;
}

export interface WallpaperPlaylist {
  id: string;
  name: string;
  description: string;
  wallpaperIds: string[];
  currentIndex: number;
  shuffleEnabled: boolean;
  repeatMode: 'none' | 'one' | 'all';
  intervalSeconds: number; // Auto-advance interval
  voiceTrigger?: string;
  isPlaying: boolean;
  createdAt: number;
}

export interface MoodMapping {
  mood: WallpaperMood;
  keywords: string[];
  wallpaperIds: string[];
  defaultTransition: TransitionEffect;
  ambientSounds: string[];
  colorPalette: string[];
  particleEffects: string[];
}

export interface VoiceActivationSession {
  id: string;
  state: 'listening' | 'processing' | 'activating' | 'complete' | 'error';
  recognizedPhrase?: string;
  confidence: number;
  matchedTrigger?: VoiceWallpaperTrigger;
  startedAt: number;
  completedAt?: number;
  error?: string;
}

export interface AmbientSoundConfig {
  id: string;
  name: string;
  soundUri: string;
  volume: number;
  fadeInDuration: number;
  fadeOutDuration: number;
  loopEnabled: boolean;
  matchingMoods: WallpaperMood[];
}

export interface VoiceWallpaperAnalytics {
  totalActivations: number;
  successfulActivations: number;
  failedActivations: number;
  avgConfidence: number;
  mostUsedTriggers: { triggerId: string; count: number }[];
  mostUsedMoods: { mood: WallpaperMood; count: number }[];
  avgTransitionTime: number;
  voiceRecognitionAccuracy: number;
}

// JEDI Sound Effects
const JEDI_SOUNDS = {
  'lightsaber-ignite': '🔊 Lightsaber Ignite',
  'lightsaber-hum': '🔊 Lightsaber Hum',
  'force-push': '🔊 Force Push',
  'force-pull': '🔊 Force Pull',
  'hyperspace-jump': '🔊 Hyperspace Jump',
  'droid-beep': '🔊 Droid Beep',
  'jedi-chime': '🔊 Jedi Chime',
  'dark-side-rumble': '🔊 Dark Side Rumble',
  'yoda-hmm': '🔊 Yoda Hmm',
  'mandalorian-whistle': '🔊 Mandalorian Whistle',
  'x-wing-flyby': '🔊 X-Wing Flyby',
  'death-star-alarm': '🔊 Death Star Alarm',
};

// Ambient Sound Library
const AMBIENT_SOUNDS: AmbientSoundConfig[] = [
  { id: 'rain', name: 'Gentle Rain', soundUri: 'rain.mp3', volume: 0.5, fadeInDuration: 2000, fadeOutDuration: 2000, loopEnabled: true, matchingMoods: ['calm', 'relax', 'focus'] },
  { id: 'ocean', name: 'Ocean Waves', soundUri: 'ocean.mp3', volume: 0.4, fadeInDuration: 3000, fadeOutDuration: 3000, loopEnabled: true, matchingMoods: ['calm', 'relax', 'nature'] },
  { id: 'forest', name: 'Forest Ambience', soundUri: 'forest.mp3', volume: 0.5, fadeInDuration: 2000, fadeOutDuration: 2000, loopEnabled: true, matchingMoods: ['nature', 'relax', 'focus'] },
  { id: 'fireplace', name: 'Crackling Fire', soundUri: 'fire.mp3', volume: 0.4, fadeInDuration: 1500, fadeOutDuration: 1500, loopEnabled: true, matchingMoods: ['calm', 'relax'] },
  { id: 'space', name: 'Space Ambience', soundUri: 'space.mp3', volume: 0.3, fadeInDuration: 3000, fadeOutDuration: 3000, loopEnabled: true, matchingMoods: ['space', 'mystery', 'focus'] },
  { id: 'cantina', name: 'Cantina Music', soundUri: 'cantina.mp3', volume: 0.5, fadeInDuration: 1000, fadeOutDuration: 1000, loopEnabled: true, matchingMoods: ['celebration', 'adventure', 'jedi'] },
  { id: 'meditation', name: 'Jedi Meditation', soundUri: 'meditation.mp3', volume: 0.4, fadeInDuration: 4000, fadeOutDuration: 4000, loopEnabled: true, matchingMoods: ['calm', 'focus', 'jedi'] },
  { id: 'battle', name: 'Epic Battle', soundUri: 'battle.mp3', volume: 0.6, fadeInDuration: 500, fadeOutDuration: 1000, loopEnabled: true, matchingMoods: ['energize', 'adventure', 'jedi'] },
  { id: 'thunderstorm', name: 'Thunderstorm', soundUri: 'thunder.mp3', volume: 0.5, fadeInDuration: 2000, fadeOutDuration: 2000, loopEnabled: true, matchingMoods: ['mystery', 'energize'] },
  { id: 'wind', name: 'Desert Wind', soundUri: 'wind.mp3', volume: 0.4, fadeInDuration: 2500, fadeOutDuration: 2500, loopEnabled: true, matchingMoods: ['nature', 'adventure', 'mystery'] },
];

// Default Mood Mappings
const DEFAULT_MOOD_MAPPINGS: MoodMapping[] = [
  {
    mood: 'calm',
    keywords: ['calm', 'peaceful', 'serene', 'quiet', 'tranquil', 'soothing', 'gentle'],
    wallpaperIds: ['starfield-night', 'ocean-sunset', 'forest-mist'],
    defaultTransition: 'fade',
    ambientSounds: ['rain', 'ocean', 'fireplace'],
    colorPalette: ['#1a237e', '#283593', '#3949ab', '#5c6bc0'],
    particleEffects: ['stars', 'fireflies', 'dust'],
  },
  {
    mood: 'energize',
    keywords: ['energize', 'energy', 'power', 'boost', 'awaken', 'activate', 'pump'],
    wallpaperIds: ['neon-city', 'lightning-storm', 'fire-dance'],
    defaultTransition: 'shatter',
    ambientSounds: ['battle', 'thunderstorm'],
    colorPalette: ['#ff5722', '#ff9800', '#ffc107', '#ffeb3b'],
    particleEffects: ['sparks', 'fire', 'lightning'],
  },
  {
    mood: 'focus',
    keywords: ['focus', 'concentrate', 'work', 'study', 'productive', 'deep work'],
    wallpaperIds: ['minimal-gradient', 'abstract-flow', 'zen-garden'],
    defaultTransition: 'dissolve',
    ambientSounds: ['forest', 'space', 'meditation'],
    colorPalette: ['#37474f', '#455a64', '#546e7a', '#607d8b'],
    particleEffects: ['dust', 'geometric'],
  },
  {
    mood: 'relax',
    keywords: ['relax', 'chill', 'unwind', 'rest', 'sleep', 'night', 'bedtime'],
    wallpaperIds: ['aurora-borealis', 'moonlit-lake', 'starry-sky'],
    defaultTransition: 'fade',
    ambientSounds: ['rain', 'ocean', 'fireplace'],
    colorPalette: ['#311b92', '#4527a0', '#512da8', '#673ab7'],
    particleEffects: ['stars', 'snow', 'fireflies'],
  },
  {
    mood: 'adventure',
    keywords: ['adventure', 'explore', 'journey', 'quest', 'travel', 'discover'],
    wallpaperIds: ['mountain-peak', 'desert-dunes', 'jungle-temple'],
    defaultTransition: 'wipe',
    ambientSounds: ['wind', 'forest'],
    colorPalette: ['#1b5e20', '#2e7d32', '#388e3c', '#43a047'],
    particleEffects: ['leaves', 'dust', 'birds'],
  },
  {
    mood: 'mystery',
    keywords: ['mystery', 'dark', 'enigma', 'shadow', 'noir', 'gothic'],
    wallpaperIds: ['dark-forest', 'foggy-castle', 'midnight-city'],
    defaultTransition: 'dissolve',
    ambientSounds: ['thunderstorm', 'wind'],
    colorPalette: ['#212121', '#424242', '#616161', '#757575'],
    particleEffects: ['fog', 'smoke', 'embers'],
  },
  {
    mood: 'celebration',
    keywords: ['celebrate', 'party', 'happy', 'joy', 'festive', 'birthday', 'win'],
    wallpaperIds: ['confetti-blast', 'disco-lights', 'fireworks'],
    defaultTransition: 'shatter',
    ambientSounds: ['cantina'],
    colorPalette: ['#e91e63', '#9c27b0', '#673ab7', '#3f51b5'],
    particleEffects: ['confetti', 'sparkles', 'bubbles'],
  },
  {
    mood: 'nature',
    keywords: ['nature', 'outdoor', 'garden', 'green', 'earth', 'organic'],
    wallpaperIds: ['forest-stream', 'flower-meadow', 'waterfall'],
    defaultTransition: 'ripple',
    ambientSounds: ['forest', 'ocean', 'rain'],
    colorPalette: ['#4caf50', '#8bc34a', '#cddc39', '#ffeb3b'],
    particleEffects: ['leaves', 'petals', 'butterflies'],
  },
  {
    mood: 'space',
    keywords: ['space', 'galaxy', 'cosmos', 'universe', 'stars', 'nebula', 'orbit'],
    wallpaperIds: ['nebula-drift', 'galaxy-spiral', 'asteroid-field'],
    defaultTransition: 'hyperspace',
    ambientSounds: ['space'],
    colorPalette: ['#0d47a1', '#1565c0', '#1976d2', '#1e88e5'],
    particleEffects: ['stars', 'cosmic-dust', 'shooting-stars'],
  },
  {
    mood: 'jedi',
    keywords: ['jedi', 'force', 'lightsaber', 'star wars', 'sith', 'mandalorian', 'yoda', 'skywalker'],
    wallpaperIds: ['jedi-temple', 'lightsaber-duel', 'death-star-approach', 'tatooine-sunset', 'coruscant-night'],
    defaultTransition: 'force-push',
    ambientSounds: ['meditation', 'battle', 'cantina'],
    colorPalette: ['#00bcd4', '#4dd0e1', '#80deea', '#b2ebf2'],
    particleEffects: ['force-particles', 'lightsaber-sparks', 'hyperspace-stars'],
  },
];

// Default Voice Triggers
const DEFAULT_TRIGGERS: Omit<VoiceWallpaperTrigger, 'id' | 'activationCount' | 'createdAt'>[] = [
  { phrases: ['hyperspace', 'jump to hyperspace', 'punch it'], wallpaperId: 'hyperspace-tunnel', mood: 'jedi', transition: 'hyperspace', transitionDuration: 1500, ambientSound: 'hyperspace-jump', isEnabled: true, priority: 10 },
  { phrases: ['calm', 'peaceful', 'serenity now'], wallpaperId: 'starfield-night', mood: 'calm', transition: 'fade', transitionDuration: 2000, ambientSound: 'rain', isEnabled: true, priority: 5 },
  { phrases: ['energize', 'power up', 'lets go'], wallpaperId: 'neon-city', mood: 'energize', transition: 'shatter', transitionDuration: 800, ambientSound: 'battle', isEnabled: true, priority: 5 },
  { phrases: ['focus', 'concentrate', 'deep work'], wallpaperId: 'minimal-gradient', mood: 'focus', transition: 'dissolve', transitionDuration: 1500, ambientSound: 'meditation', isEnabled: true, priority: 5 },
  { phrases: ['relax', 'chill', 'unwind'], wallpaperId: 'aurora-borealis', mood: 'relax', transition: 'fade', transitionDuration: 2500, ambientSound: 'ocean', isEnabled: true, priority: 5 },
  { phrases: ['jedi', 'may the force', 'use the force'], wallpaperId: 'jedi-temple', mood: 'jedi', transition: 'force-push', transitionDuration: 1000, ambientSound: 'meditation', isEnabled: true, priority: 8 },
  { phrases: ['dark side', 'sith', 'embrace darkness'], wallpaperId: 'sith-temple', mood: 'mystery', transition: 'dissolve', transitionDuration: 1200, ambientSound: 'dark-side-rumble', isEnabled: true, priority: 8 },
  { phrases: ['party', 'celebrate', 'disco'], wallpaperId: 'disco-lights', mood: 'celebration', transition: 'shatter', transitionDuration: 500, ambientSound: 'cantina', isEnabled: true, priority: 6 },
  { phrases: ['nature', 'forest', 'outdoors'], wallpaperId: 'forest-stream', mood: 'nature', transition: 'ripple', transitionDuration: 1800, ambientSound: 'forest', isEnabled: true, priority: 5 },
  { phrases: ['space', 'galaxy', 'cosmos'], wallpaperId: 'nebula-drift', mood: 'space', transition: 'zoom', transitionDuration: 2000, ambientSound: 'space', isEnabled: true, priority: 5 },
  { phrases: ['rain', 'rainy day', 'storm'], wallpaperId: 'rain-window', mood: 'calm', transition: 'fade', transitionDuration: 1500, ambientSound: 'rain', isEnabled: true, priority: 6 },
  { phrases: ['sunrise', 'morning', 'good morning'], wallpaperId: 'mountain-sunrise', mood: 'energize', transition: 'wipe', transitionDuration: 2000, ambientSound: 'forest', isEnabled: true, priority: 7 },
  { phrases: ['sunset', 'evening', 'dusk'], wallpaperId: 'ocean-sunset', mood: 'relax', transition: 'fade', transitionDuration: 2500, ambientSound: 'ocean', isEnabled: true, priority: 7 },
  { phrases: ['night', 'bedtime', 'sleep'], wallpaperId: 'starry-sky', mood: 'relax', transition: 'fade', transitionDuration: 3000, ambientSound: 'fireplace', isEnabled: true, priority: 7 },
  { phrases: ['tatooine', 'desert', 'twin suns'], wallpaperId: 'tatooine-sunset', mood: 'jedi', transition: 'wipe', transitionDuration: 1500, ambientSound: 'wind', isEnabled: true, priority: 8 },
];

class VoiceActivatedWallpapersService {
  private triggers: Map<string, VoiceWallpaperTrigger> = new Map();
  private playlists: Map<string, WallpaperPlaylist> = new Map();
  private moodMappings: Map<WallpaperMood, MoodMapping> = new Map();
  private currentSession: VoiceActivationSession | null = null;
  private activeWallpaperId: string | null = null;
  private activePlaylist: WallpaperPlaylist | null = null;
  private playlistTimer: ReturnType<typeof setTimeout> | null = null;
  private analytics: VoiceWallpaperAnalytics;
  private listeners: Set<() => void> = new Set();
  private feedbackMode: VoiceFeedbackType = 'jedi-sound';

  constructor() {
    this.analytics = {
      totalActivations: 0,
      successfulActivations: 0,
      failedActivations: 0,
      avgConfidence: 0,
      mostUsedTriggers: [],
      mostUsedMoods: [],
      avgTransitionTime: 0,
      voiceRecognitionAccuracy: 0.85,
    };
    this.initializeDefaults();
  }

  private initializeDefaults(): void {
    // Initialize mood mappings
    DEFAULT_MOOD_MAPPINGS.forEach(mapping => {
      this.moodMappings.set(mapping.mood, mapping);
    });

    // Initialize default triggers
    DEFAULT_TRIGGERS.forEach((trigger, index) => {
      const id = `trigger-${index + 1}`;
      this.triggers.set(id, {
        ...trigger,
        id,
        activationCount: 0,
        createdAt: Date.now(),
      });
    });

    // Initialize default playlists
    this.createPlaylist({
      name: 'JEDI Meditation',
      description: 'Calming JEDI-themed wallpapers for meditation',
      wallpaperIds: ['jedi-temple', 'starfield-night', 'tatooine-sunset', 'nebula-drift'],
      shuffleEnabled: false,
      repeatMode: 'all',
      intervalSeconds: 300,
      voiceTrigger: 'meditation playlist',
    });

    this.createPlaylist({
      name: 'Energy Boost',
      description: 'High-energy wallpapers to get you pumped',
      wallpaperIds: ['neon-city', 'lightning-storm', 'fire-dance', 'disco-lights'],
      shuffleEnabled: true,
      repeatMode: 'all',
      intervalSeconds: 180,
      voiceTrigger: 'energy playlist',
    });

    this.createPlaylist({
      name: 'Nature Escape',
      description: 'Peaceful nature scenes for relaxation',
      wallpaperIds: ['forest-stream', 'ocean-sunset', 'mountain-sunrise', 'waterfall'],
      shuffleEnabled: false,
      repeatMode: 'all',
      intervalSeconds: 600,
      voiceTrigger: 'nature playlist',
    });
  }

  // Trigger Management
  getAllTriggers(): VoiceWallpaperTrigger[] {
    return Array.from(this.triggers.values());
  }

  getTrigger(id: string): VoiceWallpaperTrigger | undefined {
    return this.triggers.get(id);
  }

  createTrigger(data: Omit<VoiceWallpaperTrigger, 'id' | 'activationCount' | 'createdAt'>): VoiceWallpaperTrigger {
    const id = `trigger-${Date.now()}`;
    const trigger: VoiceWallpaperTrigger = {
      ...data,
      id,
      activationCount: 0,
      createdAt: Date.now(),
    };
    this.triggers.set(id, trigger);
    this.notifyListeners();
    return trigger;
  }

  updateTrigger(id: string, updates: Partial<VoiceWallpaperTrigger>): VoiceWallpaperTrigger | null {
    const trigger = this.triggers.get(id);
    if (!trigger) return null;

    const updated = { ...trigger, ...updates };
    this.triggers.set(id, updated);
    this.notifyListeners();
    return updated;
  }

  deleteTrigger(id: string): boolean {
    const result = this.triggers.delete(id);
    if (result) this.notifyListeners();
    return result;
  }

  toggleTrigger(id: string): boolean {
    const trigger = this.triggers.get(id);
    if (!trigger) return false;

    trigger.isEnabled = !trigger.isEnabled;
    this.notifyListeners();
    return trigger.isEnabled;
  }

  // Playlist Management
  getAllPlaylists(): WallpaperPlaylist[] {
    return Array.from(this.playlists.values());
  }

  getPlaylist(id: string): WallpaperPlaylist | undefined {
    return this.playlists.get(id);
  }

  createPlaylist(data: Omit<WallpaperPlaylist, 'id' | 'currentIndex' | 'isPlaying' | 'createdAt'>): WallpaperPlaylist {
    const id = `playlist-${Date.now()}`;
    const playlist: WallpaperPlaylist = {
      ...data,
      id,
      currentIndex: 0,
      isPlaying: false,
      createdAt: Date.now(),
    };
    this.playlists.set(id, playlist);
    this.notifyListeners();
    return playlist;
  }

  startPlaylist(id: string): boolean {
    const playlist = this.playlists.get(id);
    if (!playlist) return false;

    // Stop any currently playing playlist
    if (this.activePlaylist) {
      this.stopPlaylist(this.activePlaylist.id);
    }

    playlist.isPlaying = true;
    this.activePlaylist = playlist;

    // Activate first wallpaper
    this.activateWallpaperFromPlaylist(playlist);

    // Set up auto-advance timer
    this.playlistTimer = setInterval(() => {
      this.advancePlaylist(id);
    }, playlist.intervalSeconds * 1000);

    this.notifyListeners();
    return true;
  }

  stopPlaylist(id: string): boolean {
    const playlist = this.playlists.get(id);
    if (!playlist) return false;

    playlist.isPlaying = false;
    if (this.activePlaylist?.id === id) {
      this.activePlaylist = null;
    }

    if (this.playlistTimer) {
      clearInterval(this.playlistTimer);
      this.playlistTimer = null;
    }

    this.notifyListeners();
    return true;
  }

  advancePlaylist(id: string): void {
    const playlist = this.playlists.get(id);
    if (!playlist || !playlist.isPlaying) return;

    if (playlist.shuffleEnabled) {
      playlist.currentIndex = Math.floor(Math.random() * playlist.wallpaperIds.length);
    } else {
      playlist.currentIndex = (playlist.currentIndex + 1) % playlist.wallpaperIds.length;
    }

    this.activateWallpaperFromPlaylist(playlist);
    this.notifyListeners();
  }

  private activateWallpaperFromPlaylist(playlist: WallpaperPlaylist): void {
    const wallpaperId = playlist.wallpaperIds[playlist.currentIndex];
    this.activeWallpaperId = wallpaperId;
    // Transition would be triggered here
  }

  // Voice Activation
  startListening(): VoiceActivationSession {
    const session: VoiceActivationSession = {
      id: `session-${Date.now()}`,
      state: 'listening',
      confidence: 0,
      startedAt: Date.now(),
    };
    this.currentSession = session;
    this.analytics.totalActivations++;
    this.notifyListeners();
    return session;
  }

  processVoiceInput(phrase: string, confidence: number): VoiceActivationSession | null {
    if (!this.currentSession) return null;

    this.currentSession.state = 'processing';
    this.currentSession.recognizedPhrase = phrase;
    this.currentSession.confidence = confidence;

    // Find matching trigger
    const matchedTrigger = this.findMatchingTrigger(phrase);

    if (matchedTrigger) {
      this.currentSession.matchedTrigger = matchedTrigger;
      this.currentSession.state = 'activating';
      this.activateTrigger(matchedTrigger);
    } else {
      // Try mood-based matching
      const moodMatch = this.findMoodMatch(phrase);
      if (moodMatch) {
        const wallpaperId = moodMatch.wallpaperIds[Math.floor(Math.random() * moodMatch.wallpaperIds.length)];
        this.activeWallpaperId = wallpaperId;
        this.currentSession.state = 'complete';
        this.analytics.successfulActivations++;
      } else {
        this.currentSession.state = 'error';
        this.currentSession.error = 'No matching wallpaper found';
        this.analytics.failedActivations++;
      }
    }

    // Update average confidence
    this.analytics.avgConfidence = (this.analytics.avgConfidence * (this.analytics.totalActivations - 1) + confidence) / this.analytics.totalActivations;

    this.currentSession.completedAt = Date.now();
    this.notifyListeners();
    return this.currentSession;
  }

  private findMatchingTrigger(phrase: string): VoiceWallpaperTrigger | null {
    const normalizedPhrase = phrase.toLowerCase().trim();
    let bestMatch: VoiceWallpaperTrigger | null = null;
    let highestPriority = -1;

    for (const trigger of this.triggers.values()) {
      if (!trigger.isEnabled) continue;

      for (const triggerPhrase of trigger.phrases) {
        if (normalizedPhrase.includes(triggerPhrase.toLowerCase()) || 
            triggerPhrase.toLowerCase().includes(normalizedPhrase)) {
          if (trigger.priority > highestPriority) {
            bestMatch = trigger;
            highestPriority = trigger.priority;
          }
        }
      }
    }

    return bestMatch;
  }

  private findMoodMatch(phrase: string): MoodMapping | null {
    const normalizedPhrase = phrase.toLowerCase();

    for (const mapping of this.moodMappings.values()) {
      for (const keyword of mapping.keywords) {
        if (normalizedPhrase.includes(keyword)) {
          return mapping;
        }
      }
    }

    return null;
  }

  private activateTrigger(trigger: VoiceWallpaperTrigger): void {
    trigger.activationCount++;
    trigger.lastActivatedAt = Date.now();
    this.activeWallpaperId = trigger.wallpaperId;

    // Update analytics
    this.analytics.successfulActivations++;
    this.updateTriggerAnalytics(trigger.id);
    if (trigger.mood) {
      this.updateMoodAnalytics(trigger.mood);
    }

    // Play feedback sound
    this.playFeedbackSound(trigger);

    if (this.currentSession) {
      this.currentSession.state = 'complete';
    }
  }

  private playFeedbackSound(trigger: VoiceWallpaperTrigger): void {
    // Sound would be played here based on feedbackMode
    console.log(`Playing feedback: ${this.feedbackMode} for trigger ${trigger.id}`);
  }

  private updateTriggerAnalytics(triggerId: string): void {
    const existing = this.analytics.mostUsedTriggers.find(t => t.triggerId === triggerId);
    if (existing) {
      existing.count++;
    } else {
      this.analytics.mostUsedTriggers.push({ triggerId, count: 1 });
    }
    this.analytics.mostUsedTriggers.sort((a, b) => b.count - a.count);
  }

  private updateMoodAnalytics(mood: WallpaperMood): void {
    const existing = this.analytics.mostUsedMoods.find(m => m.mood === mood);
    if (existing) {
      existing.count++;
    } else {
      this.analytics.mostUsedMoods.push({ mood, count: 1 });
    }
    this.analytics.mostUsedMoods.sort((a, b) => b.count - a.count);
  }

  cancelListening(): void {
    if (this.currentSession) {
      this.currentSession.state = 'error';
      this.currentSession.error = 'Cancelled by user';
      this.currentSession.completedAt = Date.now();
    }
    this.currentSession = null;
    this.notifyListeners();
  }

  // Mood and Ambient
  getMoodMapping(mood: WallpaperMood): MoodMapping | undefined {
    return this.moodMappings.get(mood);
  }

  getAllMoodMappings(): MoodMapping[] {
    return Array.from(this.moodMappings.values());
  }

  getAmbientSounds(): AmbientSoundConfig[] {
    return AMBIENT_SOUNDS;
  }

  getAmbientSoundsForMood(mood: WallpaperMood): AmbientSoundConfig[] {
    return AMBIENT_SOUNDS.filter(sound => sound.matchingMoods.includes(mood));
  }

  // Settings
  setFeedbackMode(mode: VoiceFeedbackType): void {
    this.feedbackMode = mode;
    this.notifyListeners();
  }

  getFeedbackMode(): VoiceFeedbackType {
    return this.feedbackMode;
  }

  // State
  getCurrentSession(): VoiceActivationSession | null {
    return this.currentSession;
  }

  getActiveWallpaperId(): string | null {
    return this.activeWallpaperId;
  }

  getActivePlaylist(): WallpaperPlaylist | null {
    return this.activePlaylist;
  }

  // Analytics
  getAnalytics(): VoiceWallpaperAnalytics {
    return { ...this.analytics };
  }

  // Export/Import
  exportConfiguration(): string {
    return JSON.stringify({
      triggers: Array.from(this.triggers.values()),
      playlists: Array.from(this.playlists.values()),
      feedbackMode: this.feedbackMode,
      exportedAt: Date.now(),
    }, null, 2);
  }

  importConfiguration(json: string): { success: boolean; imported: { triggers: number; playlists: number } } {
    try {
      const data = JSON.parse(json);
      let triggersImported = 0;
      let playlistsImported = 0;

      if (data.triggers) {
        data.triggers.forEach((trigger: VoiceWallpaperTrigger) => {
          const newId = `trigger-imported-${Date.now()}-${triggersImported}`;
          this.triggers.set(newId, { ...trigger, id: newId });
          triggersImported++;
        });
      }

      if (data.playlists) {
        data.playlists.forEach((playlist: WallpaperPlaylist) => {
          const newId = `playlist-imported-${Date.now()}-${playlistsImported}`;
          this.playlists.set(newId, { ...playlist, id: newId, isPlaying: false });
          playlistsImported++;
        });
      }

      if (data.feedbackMode) {
        this.feedbackMode = data.feedbackMode;
      }

      this.notifyListeners();
      return { success: true, imported: { triggers: triggersImported, playlists: playlistsImported } };
    } catch {
      return { success: false, imported: { triggers: 0, playlists: 0 } };
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
    this.triggers.clear();
    this.playlists.clear();
    this.moodMappings.clear();
    this.currentSession = null;
    this.activeWallpaperId = null;
    this.activePlaylist = null;
    if (this.playlistTimer) {
      clearInterval(this.playlistTimer);
      this.playlistTimer = null;
    }
    this.analytics = {
      totalActivations: 0,
      successfulActivations: 0,
      failedActivations: 0,
      avgConfidence: 0,
      mostUsedTriggers: [],
      mostUsedMoods: [],
      avgTransitionTime: 0,
      voiceRecognitionAccuracy: 0.85,
    };
    this.initializeDefaults();
    this.notifyListeners();
  }
}

export const voiceActivatedWallpapersService = new VoiceActivatedWallpapersService();
