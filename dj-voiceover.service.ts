/**
 * DJ Voiceover Service
 * 
 * Audio playback system for DJ announcements between songs:
 * - Text-to-speech simulation with DJ personality
 * - Voiceover queue management
 * - Audio transition effects (jingles, stingers)
 * - Integration with JediTek channel service
 */

// ============================================================================
// TYPES
// ============================================================================

export interface Voiceover {
  id: string;
  type: 'station_id' | 'song_intro' | 'time_check' | 'weather' | 'promo' | 'transition' | 'emergency';
  text: string;
  djName: string;
  duration: number; // milliseconds
  priority: number;
  soundEffect?: 'jingle' | 'stinger' | 'swoosh' | 'reverb' | 'echo';
}

export interface VoiceoverQueue {
  items: Voiceover[];
  currentIndex: number;
  isPlaying: boolean;
}

export interface DJVoice {
  id: string;
  name: string;
  pitch: number; // 0.5 - 2.0
  rate: number; // 0.5 - 2.0
  style: 'energetic' | 'smooth' | 'chill' | 'dramatic';
  catchphrases: string[];
}

export interface AudioEffect {
  id: string;
  name: string;
  type: 'jingle' | 'stinger' | 'swoosh' | 'reverb' | 'echo' | 'bass_drop';
  duration: number;
}

export interface VoiceoverState {
  isPlaying: boolean;
  currentVoiceover: Voiceover | null;
  queue: Voiceover[];
  volume: number;
  isMuted: boolean;
  currentDJ: DJVoice;
}

export interface VoiceoverListener {
  onVoiceoverStart?: (voiceover: Voiceover) => void;
  onVoiceoverEnd?: (voiceover: Voiceover) => void;
  onQueueUpdate?: (queue: Voiceover[]) => void;
  onVolumeChange?: (volume: number) => void;
}

// ============================================================================
// DJ VOICES
// ============================================================================

export const DJ_VOICES: DJVoice[] = [
  {
    id: 'jedi-master',
    name: 'DJ Jedi Master',
    pitch: 1.0,
    rate: 1.1,
    style: 'energetic',
    catchphrases: [
      "May the groove be with you!",
      "Feel the force of music!",
      "JediTek Radio - your galactic soundtrack!",
      "This is DJ Jedi Master, keeping you in the zone!",
    ],
  },
  {
    id: 'goldfields',
    name: 'DJ Goldfields',
    pitch: 0.9,
    rate: 1.0,
    style: 'smooth',
    catchphrases: [
      "Smooth sounds from the heart of the outback!",
      "DJ Goldfields here, bringing you the gold!",
      "Kalgoorlie's finest tunes, right here!",
      "Stay golden, stay groovy!",
    ],
  },
  {
    id: 'outback',
    name: 'DJ Outback',
    pitch: 1.1,
    rate: 0.95,
    style: 'chill',
    catchphrases: [
      "Chill vibes from the Australian outback!",
      "DJ Outback, keeping it real and relaxed!",
      "Unwind with the sounds of the desert!",
      "Easy listening, outback style!",
    ],
  },
  {
    id: 'midnight',
    name: 'DJ Midnight',
    pitch: 0.85,
    rate: 0.9,
    style: 'dramatic',
    catchphrases: [
      "The night belongs to the music...",
      "DJ Midnight, your companion in the dark hours...",
      "When the stars come out, so do the tunes...",
      "Embrace the night with JediTek Radio...",
    ],
  },
];

// ============================================================================
// AUDIO EFFECTS
// ============================================================================

export const AUDIO_EFFECTS: AudioEffect[] = [
  { id: 'jingle-main', name: 'JediTek Main Jingle', type: 'jingle', duration: 3000 },
  { id: 'jingle-short', name: 'JediTek Short Jingle', type: 'jingle', duration: 1500 },
  { id: 'stinger-hit', name: 'Hit Stinger', type: 'stinger', duration: 500 },
  { id: 'stinger-news', name: 'News Stinger', type: 'stinger', duration: 800 },
  { id: 'swoosh-fast', name: 'Fast Swoosh', type: 'swoosh', duration: 300 },
  { id: 'swoosh-slow', name: 'Slow Swoosh', type: 'swoosh', duration: 600 },
  { id: 'reverb-hall', name: 'Hall Reverb', type: 'reverb', duration: 1000 },
  { id: 'echo-triple', name: 'Triple Echo', type: 'echo', duration: 1200 },
  { id: 'bass-drop', name: 'Bass Drop', type: 'bass_drop', duration: 800 },
];

// ============================================================================
// VOICEOVER TEMPLATES
// ============================================================================

export const VOICEOVER_TEMPLATES = {
  stationId: [
    "You're listening to JediTek Radio, 107.7 FM - We've got your groove!",
    "JediTek Radio - Feel the force of music!",
    "This is JediTek Radio, broadcasting live from Kalgoorlie Health Campus!",
    "107.7 JediTek Radio - Your soundtrack to the stars!",
    "JediTek Radio - Where every beat tells a story!",
  ],
  songIntro: [
    "Coming up next, a classic that never gets old...",
    "Here's one that'll get you moving...",
    "Time for a throwback hit...",
    "Let's turn it up with this one...",
    "Get ready for some good vibes...",
  ],
  timeCheck: [
    "It's {time} here at JediTek Radio...",
    "The time is {time}, and the music keeps flowing...",
    "{time} on JediTek Radio - time flies when you're grooving!",
  ],
  weather: [
    "Looking at {temp} degrees in Kalgoorlie today...",
    "Weather update: {conditions} with {temp} degrees...",
    "It's a beautiful {conditions} day in the Goldfields...",
  ],
  promo: [
    "JediTek Radio - Proudly supporting Kalgoorlie Health Campus!",
    "Stay tuned for more great music, only on JediTek Radio!",
    "Download the MediVac One app for the best hospital experience!",
    "JediTek Radio - Healing through music!",
  ],
  transition: [
    "And now, let's switch things up...",
    "Time for something different...",
    "Here's a change of pace...",
    "Let's keep the energy going with...",
  ],
  emergency: [
    "ATTENTION: This is an emergency broadcast...",
    "IMPORTANT ANNOUNCEMENT: Please listen carefully...",
    "EMERGENCY ALERT: {message}",
  ],
};

// ============================================================================
// SERVICE CLASS
// ============================================================================

class DJVoiceoverService {
  private queue: Voiceover[];
  private currentVoiceover: Voiceover | null;
  private isPlaying: boolean;
  private volume: number;
  private isMuted: boolean;
  private currentDJ: DJVoice;
  private listeners: Set<VoiceoverListener>;
  private playbackTimeout: NodeJS.Timeout | null;
  private autoPlayInterval: NodeJS.Timeout | null;

  constructor() {
    this.queue = [];
    this.currentVoiceover = null;
    this.isPlaying = false;
    this.volume = 0.8;
    this.isMuted = false;
    this.currentDJ = DJ_VOICES[0];
    this.listeners = new Set();
    this.playbackTimeout = null;
    this.autoPlayInterval = null;
  }

  /**
   * Get current state
   */
  getState(): VoiceoverState {
    return {
      isPlaying: this.isPlaying,
      currentVoiceover: this.currentVoiceover,
      queue: [...this.queue],
      volume: this.volume,
      isMuted: this.isMuted,
      currentDJ: { ...this.currentDJ },
    };
  }

  /**
   * Set current DJ voice
   */
  setDJ(djId: string): void {
    const dj = DJ_VOICES.find(d => d.id === djId);
    if (dj) {
      this.currentDJ = dj;
    }
  }

  /**
   * Get current DJ
   */
  getCurrentDJ(): DJVoice {
    return { ...this.currentDJ };
  }

  /**
   * Get all DJ voices
   */
  getDJVoices(): DJVoice[] {
    return [...DJ_VOICES];
  }

  /**
   * Create a voiceover from template
   */
  createVoiceover(
    type: Voiceover['type'],
    customText?: string,
    priority: number = 5
  ): Voiceover {
    let text = customText || '';
    
    if (!customText) {
      const templates = VOICEOVER_TEMPLATES[type] || VOICEOVER_TEMPLATES.stationId;
      text = templates[Math.floor(Math.random() * templates.length)];
      
      // Replace placeholders
      const now = new Date();
      text = text
        .replace('{time}', now.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' }))
        .replace('{temp}', String(Math.floor(Math.random() * 15) + 25))
        .replace('{conditions}', ['sunny', 'clear', 'warm'][Math.floor(Math.random() * 3)]);
    }

    // Calculate duration based on text length (approx 150 words per minute)
    const wordCount = text.split(' ').length;
    const baseDuration = (wordCount / 150) * 60 * 1000;
    const duration = Math.max(2000, baseDuration + 1000); // Minimum 2 seconds

    return {
      id: `vo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      text,
      djName: this.currentDJ.name,
      duration,
      priority,
      soundEffect: this.getSoundEffectForType(type),
    };
  }

  /**
   * Get appropriate sound effect for voiceover type
   */
  private getSoundEffectForType(type: Voiceover['type']): Voiceover['soundEffect'] {
    switch (type) {
      case 'station_id':
        return 'jingle';
      case 'song_intro':
        return 'swoosh';
      case 'time_check':
        return 'stinger';
      case 'emergency':
        return 'reverb';
      default:
        return undefined;
    }
  }

  /**
   * Add voiceover to queue
   */
  queueVoiceover(voiceover: Voiceover): void {
    // Insert based on priority (higher priority = earlier in queue)
    const insertIndex = this.queue.findIndex(v => v.priority < voiceover.priority);
    if (insertIndex === -1) {
      this.queue.push(voiceover);
    } else {
      this.queue.splice(insertIndex, 0, voiceover);
    }
    this.notifyQueueUpdate();
  }

  /**
   * Queue a station ID announcement
   */
  queueStationId(): void {
    const voiceover = this.createVoiceover('station_id', undefined, 3);
    this.queueVoiceover(voiceover);
  }

  /**
   * Queue a song intro
   */
  queueSongIntro(songTitle?: string): void {
    const text = songTitle 
      ? `Coming up next... ${songTitle}!`
      : undefined;
    const voiceover = this.createVoiceover('song_intro', text, 5);
    this.queueVoiceover(voiceover);
  }

  /**
   * Queue a time check
   */
  queueTimeCheck(): void {
    const voiceover = this.createVoiceover('time_check', undefined, 2);
    this.queueVoiceover(voiceover);
  }

  /**
   * Queue an emergency announcement
   */
  queueEmergency(message: string): void {
    const voiceover = this.createVoiceover('emergency', `EMERGENCY ALERT: ${message}`, 10);
    this.queueVoiceover(voiceover);
    // Play immediately
    this.playNext();
  }

  /**
   * Queue a DJ catchphrase
   */
  queueCatchphrase(): void {
    const catchphrase = this.currentDJ.catchphrases[
      Math.floor(Math.random() * this.currentDJ.catchphrases.length)
    ];
    const voiceover = this.createVoiceover('promo', catchphrase, 4);
    this.queueVoiceover(voiceover);
  }

  /**
   * Play next voiceover in queue
   */
  playNext(): void {
    if (this.queue.length === 0 || this.isPlaying) return;

    const voiceover = this.queue.shift()!;
    this.currentVoiceover = voiceover;
    this.isPlaying = true;

    this.notifyVoiceoverStart(voiceover);
    this.notifyQueueUpdate();

    // Simulate playback duration
    this.playbackTimeout = setTimeout(() => {
      this.notifyVoiceoverEnd(voiceover);
      this.currentVoiceover = null;
      this.isPlaying = false;
      
      // Auto-play next if queue has items
      if (this.queue.length > 0) {
        setTimeout(() => this.playNext(), 500);
      }
    }, voiceover.duration);
  }

  /**
   * Stop current playback
   */
  stop(): void {
    if (this.playbackTimeout) {
      clearTimeout(this.playbackTimeout);
      this.playbackTimeout = null;
    }
    
    if (this.currentVoiceover) {
      this.notifyVoiceoverEnd(this.currentVoiceover);
    }
    
    this.currentVoiceover = null;
    this.isPlaying = false;
  }

  /**
   * Clear the queue
   */
  clearQueue(): void {
    this.queue = [];
    this.notifyQueueUpdate();
  }

  /**
   * Start auto-play mode (periodic announcements)
   */
  startAutoPlay(intervalMs: number = 300000): void {
    if (this.autoPlayInterval) return;

    // Initial station ID
    this.queueStationId();
    this.playNext();

    this.autoPlayInterval = setInterval(() => {
      // Rotate between different announcement types
      const types: Array<() => void> = [
        () => this.queueStationId(),
        () => this.queueTimeCheck(),
        () => this.queueCatchphrase(),
        () => this.queueSongIntro(),
      ];
      
      const randomType = types[Math.floor(Math.random() * types.length)];
      randomType();
      
      if (!this.isPlaying) {
        this.playNext();
      }
    }, intervalMs);
  }

  /**
   * Stop auto-play mode
   */
  stopAutoPlay(): void {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
      this.autoPlayInterval = null;
    }
  }

  /**
   * Set volume
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    this.notifyVolumeChange();
  }

  /**
   * Toggle mute
   */
  toggleMute(): void {
    this.isMuted = !this.isMuted;
    this.notifyVolumeChange();
  }

  /**
   * Get audio effect by ID
   */
  getAudioEffect(effectId: string): AudioEffect | undefined {
    return AUDIO_EFFECTS.find(e => e.id === effectId);
  }

  /**
   * Get all audio effects
   */
  getAudioEffects(): AudioEffect[] {
    return [...AUDIO_EFFECTS];
  }

  /**
   * Add listener
   */
  addListener(listener: VoiceoverListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify voiceover start
   */
  private notifyVoiceoverStart(voiceover: Voiceover): void {
    this.listeners.forEach(l => l.onVoiceoverStart?.(voiceover));
  }

  /**
   * Notify voiceover end
   */
  private notifyVoiceoverEnd(voiceover: Voiceover): void {
    this.listeners.forEach(l => l.onVoiceoverEnd?.(voiceover));
  }

  /**
   * Notify queue update
   */
  private notifyQueueUpdate(): void {
    this.listeners.forEach(l => l.onQueueUpdate?.([...this.queue]));
  }

  /**
   * Notify volume change
   */
  private notifyVolumeChange(): void {
    this.listeners.forEach(l => l.onVolumeChange?.(this.volume));
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stop();
    this.stopAutoPlay();
    this.clearQueue();
    this.listeners.clear();
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const djVoiceoverService = new DJVoiceoverService();
export default djVoiceoverService;
