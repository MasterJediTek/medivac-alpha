/**
 * Voice-Guided Navigation Service
 * 
 * Provides text-to-speech navigation announcements for turn-by-turn
 * directions, distance countdowns, and landmark-based guidance.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface VoiceSettings {
  enabled: boolean;
  volume: number; // 0-1
  rate: number; // 0.5-2 (speech rate)
  pitch: number; // 0.5-2
  language: VoiceLanguage;
  announceDistance: boolean;
  announceLandmarks: boolean;
  announceArrival: boolean;
}

export type VoiceLanguage = 
  | 'en-AU' // Australian English
  | 'en-US' // American English
  | 'en-GB' // British English
  | 'zh-CN' // Chinese
  | 'es-ES' // Spanish
  | 'ar-SA'; // Arabic

export interface VoiceAnnouncement {
  id: string;
  text: string;
  type: AnnouncementType;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: number;
  spoken: boolean;
}

export type AnnouncementType = 
  | 'direction'
  | 'distance'
  | 'landmark'
  | 'arrival'
  | 'warning'
  | 'recalculating';

export interface NavigationStep {
  instruction: string;
  direction: 'straight' | 'left' | 'right' | 'up' | 'down' | 'arrive';
  distance: number;
  landmark?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_SETTINGS: VoiceSettings = {
  enabled: true,
  volume: 0.8,
  rate: 1.0,
  pitch: 1.0,
  language: 'en-AU',
  announceDistance: true,
  announceLandmarks: true,
  announceArrival: true,
};

const LANGUAGE_VOICES: Record<VoiceLanguage, { name: string; greeting: string }> = {
  'en-AU': { name: 'Australian English', greeting: "G'day! Navigation started." },
  'en-US': { name: 'American English', greeting: 'Hello! Navigation started.' },
  'en-GB': { name: 'British English', greeting: 'Hello! Navigation has begun.' },
  'zh-CN': { name: 'Chinese', greeting: '你好！导航已开始。' },
  'es-ES': { name: 'Spanish', greeting: '¡Hola! Navegación iniciada.' },
  'ar-SA': { name: 'Arabic', greeting: 'مرحبا! بدأ التنقل.' },
};

const DIRECTION_PHRASES: Record<string, Record<VoiceLanguage, string>> = {
  straight: {
    'en-AU': 'Continue straight ahead',
    'en-US': 'Continue straight',
    'en-GB': 'Carry on straight',
    'zh-CN': '继续直行',
    'es-ES': 'Continúe recto',
    'ar-SA': 'استمر للأمام',
  },
  left: {
    'en-AU': 'Turn left',
    'en-US': 'Turn left',
    'en-GB': 'Turn left',
    'zh-CN': '左转',
    'es-ES': 'Gire a la izquierda',
    'ar-SA': 'انعطف يسارا',
  },
  right: {
    'en-AU': 'Turn right',
    'en-US': 'Turn right',
    'en-GB': 'Turn right',
    'zh-CN': '右转',
    'es-ES': 'Gire a la derecha',
    'ar-SA': 'انعطف يمينا',
  },
  up: {
    'en-AU': 'Go up the stairs or take the lift',
    'en-US': 'Go up the stairs or take the elevator',
    'en-GB': 'Go up the stairs or take the lift',
    'zh-CN': '上楼或乘电梯',
    'es-ES': 'Suba las escaleras o tome el ascensor',
    'ar-SA': 'اصعد الدرج أو استخدم المصعد',
  },
  down: {
    'en-AU': 'Go down the stairs or take the lift',
    'en-US': 'Go down the stairs or take the elevator',
    'en-GB': 'Go down the stairs or take the lift',
    'zh-CN': '下楼或乘电梯',
    'es-ES': 'Baje las escaleras o tome el ascensor',
    'ar-SA': 'انزل الدرج أو استخدم المصعد',
  },
  arrive: {
    'en-AU': 'You have arrived at your destination',
    'en-US': 'You have arrived at your destination',
    'en-GB': 'You have reached your destination',
    'zh-CN': '您已到达目的地',
    'es-ES': 'Ha llegado a su destino',
    'ar-SA': 'لقد وصلت إلى وجهتك',
  },
};

// ============================================================================
// VOICE NAVIGATION SERVICE
// ============================================================================

class VoiceNavigationService {
  private settings: VoiceSettings = { ...DEFAULT_SETTINGS };
  private announcementQueue: VoiceAnnouncement[] = [];
  private isPlaying: boolean = false;
  private currentAnnouncement: VoiceAnnouncement | null = null;
  private listeners: Set<(announcement: VoiceAnnouncement) => void> = new Set();
  private settingsListeners: Set<(settings: VoiceSettings) => void> = new Set();

  // ============================================================================
  // SETTINGS MANAGEMENT
  // ============================================================================

  /**
   * Get current voice settings
   */
  getSettings(): VoiceSettings {
    return { ...this.settings };
  }

  /**
   * Update voice settings
   */
  updateSettings(updates: Partial<VoiceSettings>): void {
    this.settings = { ...this.settings, ...updates };
    this.notifySettingsListeners();
  }

  /**
   * Enable/disable voice navigation
   */
  setEnabled(enabled: boolean): void {
    this.settings.enabled = enabled;
    this.notifySettingsListeners();
    
    if (!enabled) {
      this.clearQueue();
    }
  }

  /**
   * Set volume (0-1)
   */
  setVolume(volume: number): void {
    this.settings.volume = Math.max(0, Math.min(1, volume));
    this.notifySettingsListeners();
  }

  /**
   * Set speech rate (0.5-2)
   */
  setRate(rate: number): void {
    this.settings.rate = Math.max(0.5, Math.min(2, rate));
    this.notifySettingsListeners();
  }

  /**
   * Set language
   */
  setLanguage(language: VoiceLanguage): void {
    this.settings.language = language;
    this.notifySettingsListeners();
  }

  /**
   * Get available languages
   */
  getAvailableLanguages(): { code: VoiceLanguage; name: string }[] {
    return Object.entries(LANGUAGE_VOICES).map(([code, info]) => ({
      code: code as VoiceLanguage,
      name: info.name,
    }));
  }

  // ============================================================================
  // ANNOUNCEMENT GENERATION
  // ============================================================================

  /**
   * Announce navigation start
   */
  announceNavigationStart(destinationName: string): void {
    if (!this.settings.enabled) return;

    const greeting = LANGUAGE_VOICES[this.settings.language].greeting;
    const text = `${greeting} Navigating to ${destinationName}.`;
    
    this.queueAnnouncement({
      text,
      type: 'direction',
      priority: 'high',
    });
  }

  /**
   * Announce a navigation step
   */
  announceStep(step: NavigationStep): void {
    if (!this.settings.enabled) return;

    const directionPhrase = DIRECTION_PHRASES[step.direction]?.[this.settings.language] 
      || DIRECTION_PHRASES[step.direction]?.['en-AU'] 
      || step.instruction;

    let text = directionPhrase;

    // Add distance if enabled and available
    if (this.settings.announceDistance && step.distance > 0) {
      const distanceText = this.formatDistance(step.distance);
      text += ` for ${distanceText}`;
    }

    // Add landmark if enabled and available
    if (this.settings.announceLandmarks && step.landmark) {
      text += `. Look for ${step.landmark}`;
    }

    this.queueAnnouncement({
      text,
      type: 'direction',
      priority: step.direction === 'arrive' ? 'high' : 'medium',
    });
  }

  /**
   * Announce distance countdown
   */
  announceDistance(meters: number, nextDirection: string): void {
    if (!this.settings.enabled || !this.settings.announceDistance) return;

    const distanceText = this.formatDistance(meters);
    const directionPhrase = DIRECTION_PHRASES[nextDirection]?.[this.settings.language] 
      || nextDirection;

    let text: string;
    if (meters <= 10) {
      text = `${directionPhrase} now`;
    } else if (meters <= 30) {
      text = `In ${distanceText}, ${directionPhrase.toLowerCase()}`;
    } else {
      text = `${distanceText} until next turn`;
    }

    this.queueAnnouncement({
      text,
      type: 'distance',
      priority: meters <= 10 ? 'high' : 'low',
    });
  }

  /**
   * Announce landmark
   */
  announceLandmark(landmark: string): void {
    if (!this.settings.enabled || !this.settings.announceLandmarks) return;

    this.queueAnnouncement({
      text: `You are passing ${landmark}`,
      type: 'landmark',
      priority: 'low',
    });
  }

  /**
   * Announce arrival
   */
  announceArrival(destinationName: string): void {
    if (!this.settings.enabled || !this.settings.announceArrival) return;

    const arrivalPhrase = DIRECTION_PHRASES.arrive[this.settings.language];
    
    this.queueAnnouncement({
      text: `${arrivalPhrase}. Welcome to ${destinationName}.`,
      type: 'arrival',
      priority: 'urgent',
    });
  }

  /**
   * Announce recalculating route
   */
  announceRecalculating(): void {
    if (!this.settings.enabled) return;

    this.queueAnnouncement({
      text: 'Recalculating route',
      type: 'recalculating',
      priority: 'medium',
    });
  }

  /**
   * Announce warning
   */
  announceWarning(message: string): void {
    if (!this.settings.enabled) return;

    this.queueAnnouncement({
      text: message,
      type: 'warning',
      priority: 'urgent',
    });
  }

  // ============================================================================
  // QUEUE MANAGEMENT
  // ============================================================================

  /**
   * Queue an announcement
   */
  private queueAnnouncement(params: Omit<VoiceAnnouncement, 'id' | 'timestamp' | 'spoken'>): void {
    const announcement: VoiceAnnouncement = {
      id: `ann-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...params,
      timestamp: Date.now(),
      spoken: false,
    };

    // Insert based on priority
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const insertIndex = this.announcementQueue.findIndex(
      a => priorityOrder[a.priority] > priorityOrder[announcement.priority]
    );

    if (insertIndex === -1) {
      this.announcementQueue.push(announcement);
    } else {
      this.announcementQueue.splice(insertIndex, 0, announcement);
    }

    this.processQueue();
  }

  /**
   * Process the announcement queue
   */
  private processQueue(): void {
    if (this.isPlaying || this.announcementQueue.length === 0) return;

    const announcement = this.announcementQueue.shift();
    if (!announcement) return;

    this.isPlaying = true;
    this.currentAnnouncement = announcement;
    this.notifyListeners(announcement);

    // Simulate speech duration based on text length
    const duration = Math.max(1000, announcement.text.length * 50 / this.settings.rate);

    setTimeout(() => {
      announcement.spoken = true;
      this.isPlaying = false;
      this.currentAnnouncement = null;
      this.processQueue();
    }, duration);
  }

  /**
   * Clear the announcement queue
   */
  clearQueue(): void {
    this.announcementQueue = [];
    this.isPlaying = false;
    this.currentAnnouncement = null;
  }

  /**
   * Get current announcement
   */
  getCurrentAnnouncement(): VoiceAnnouncement | null {
    return this.currentAnnouncement;
  }

  /**
   * Get queue length
   */
  getQueueLength(): number {
    return this.announcementQueue.length;
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  /**
   * Format distance for speech
   */
  private formatDistance(meters: number): string {
    if (meters < 10) {
      return `${Math.round(meters)} meters`;
    } else if (meters < 100) {
      return `${Math.round(meters / 5) * 5} meters`;
    } else {
      return `${Math.round(meters / 10) * 10} meters`;
    }
  }

  // ============================================================================
  // LISTENERS
  // ============================================================================

  /**
   * Subscribe to announcements
   */
  onAnnouncement(callback: (announcement: VoiceAnnouncement) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Subscribe to settings changes
   */
  onSettingsChange(callback: (settings: VoiceSettings) => void): () => void {
    this.settingsListeners.add(callback);
    return () => this.settingsListeners.delete(callback);
  }

  /**
   * Notify announcement listeners
   */
  private notifyListeners(announcement: VoiceAnnouncement): void {
    this.listeners.forEach(listener => listener(announcement));
  }

  /**
   * Notify settings listeners
   */
  private notifySettingsListeners(): void {
    const settings = this.getSettings();
    this.settingsListeners.forEach(listener => listener(settings));
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  /**
   * Clean up the service
   */
  destroy(): void {
    this.clearQueue();
    this.listeners.clear();
    this.settingsListeners.clear();
  }
}

// Singleton instance
export const voiceNavigationService = new VoiceNavigationService();

export default voiceNavigationService;
