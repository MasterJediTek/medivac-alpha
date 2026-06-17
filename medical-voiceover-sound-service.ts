// Medical Voiceover and Sound Service
// Professional audio system for WACHS Patient Portal with voiceovers, sounds, and accessibility

// Types
export type VoiceType = 'professional_female' | 'professional_male' | 'friendly_female' | 'friendly_male' | 'calm_female' | 'calm_male';
export type SoundCategory = 'notification' | 'navigation' | 'success' | 'error' | 'ambient' | 'medical' | 'accessibility';
export type AudioQuality = 'low' | 'medium' | 'high' | 'studio';

export interface VoiceProfile {
  id: string;
  name: string;
  type: VoiceType;
  language: string;
  accent: string;
  gender: 'male' | 'female';
  
  // Voice characteristics
  pitch: number; // 0.5 - 2.0
  speed: number; // 0.5 - 2.0
  volume: number; // 0 - 1
  
  // Quality
  quality: AudioQuality;
  sampleRate: number;
  
  // Usage
  isDefault: boolean;
  usageCount: number;
  
  // Preview
  previewUrl: string;
  previewText: string;
}

export interface SoundEffect {
  id: string;
  name: string;
  category: SoundCategory;
  description: string;
  
  // Audio
  url: string;
  duration: number; // ms
  volume: number; // 0 - 1
  
  // Settings
  loop: boolean;
  fadeIn: number; // ms
  fadeOut: number; // ms
  
  // Accessibility
  hasVisualAlternative: boolean;
  hapticPattern?: string;
  
  // Usage
  isEnabled: boolean;
  playCount: number;
}

export interface VoiceoverScript {
  id: string;
  name: string;
  category: 'onboarding' | 'appointment' | 'medication' | 'emergency' | 'education' | 'navigation';
  
  // Content
  text: string;
  language: string;
  
  // Audio
  audioUrl?: string;
  duration?: number;
  voiceProfileId: string;
  
  // Timing
  pauseAfter: number; // ms
  
  // Accessibility
  transcriptAvailable: boolean;
  signLanguageUrl?: string;
}

export interface AmbientSoundscape {
  id: string;
  name: string;
  description: string;
  
  // Audio layers
  layers: Array<{
    id: string;
    name: string;
    url: string;
    volume: number;
    pan: number; // -1 to 1
  }>;
  
  // Settings
  masterVolume: number;
  crossfadeDuration: number;
  
  // Usage
  isActive: boolean;
  totalPlayTime: number;
}

export interface AudioSettings {
  masterVolume: number;
  voiceoverVolume: number;
  soundEffectsVolume: number;
  ambientVolume: number;
  
  voiceoverEnabled: boolean;
  soundEffectsEnabled: boolean;
  ambientEnabled: boolean;
  
  preferredVoice: VoiceType;
  preferredLanguage: string;
  
  // Accessibility
  screenReaderMode: boolean;
  hapticFeedback: boolean;
  visualAlerts: boolean;
  
  // Quality
  audioQuality: AudioQuality;
  streamingEnabled: boolean;
}

export interface AudioAnalytics {
  totalVoiceoversPlayed: number;
  totalSoundsPlayed: number;
  averageVoiceoverCompletion: number;
  mostUsedVoice: VoiceType;
  mostPlayedSounds: Array<{ soundId: string; count: number }>;
  accessibilityUsage: {
    screenReader: number;
    haptic: number;
    visual: number;
  };
}

// Sound Library
const SOUND_LIBRARY: Record<string, SoundEffect> = {
  // Notifications
  notification_gentle: {
    id: 'notification_gentle',
    name: 'Gentle Notification',
    category: 'notification',
    description: 'Soft chime for general notifications',
    url: 'https://audio.wachs.health/sounds/notification_gentle.mp3',
    duration: 800,
    volume: 0.6,
    loop: false,
    fadeIn: 100,
    fadeOut: 200,
    hasVisualAlternative: true,
    hapticPattern: 'light',
    isEnabled: true,
    playCount: 0,
  },
  notification_appointment: {
    id: 'notification_appointment',
    name: 'Appointment Reminder',
    category: 'notification',
    description: 'Clear tone for appointment reminders',
    url: 'https://audio.wachs.health/sounds/appointment_reminder.mp3',
    duration: 1200,
    volume: 0.7,
    loop: false,
    fadeIn: 50,
    fadeOut: 300,
    hasVisualAlternative: true,
    hapticPattern: 'medium',
    isEnabled: true,
    playCount: 0,
  },
  notification_medication: {
    id: 'notification_medication',
    name: 'Medication Alert',
    category: 'medical',
    description: 'Distinct tone for medication reminders',
    url: 'https://audio.wachs.health/sounds/medication_alert.mp3',
    duration: 1500,
    volume: 0.8,
    loop: false,
    fadeIn: 100,
    fadeOut: 400,
    hasVisualAlternative: true,
    hapticPattern: 'strong',
    isEnabled: true,
    playCount: 0,
  },
  notification_emergency: {
    id: 'notification_emergency',
    name: 'Emergency Alert',
    category: 'medical',
    description: 'Urgent tone for emergency notifications',
    url: 'https://audio.wachs.health/sounds/emergency_alert.mp3',
    duration: 2000,
    volume: 1.0,
    loop: true,
    fadeIn: 0,
    fadeOut: 0,
    hasVisualAlternative: true,
    hapticPattern: 'alarm',
    isEnabled: true,
    playCount: 0,
  },
  
  // Navigation
  nav_tap: {
    id: 'nav_tap',
    name: 'Button Tap',
    category: 'navigation',
    description: 'Subtle tap sound for button presses',
    url: 'https://audio.wachs.health/sounds/tap.mp3',
    duration: 50,
    volume: 0.3,
    loop: false,
    fadeIn: 0,
    fadeOut: 0,
    hasVisualAlternative: false,
    hapticPattern: 'light',
    isEnabled: true,
    playCount: 0,
  },
  nav_swipe: {
    id: 'nav_swipe',
    name: 'Swipe Sound',
    category: 'navigation',
    description: 'Smooth swipe transition sound',
    url: 'https://audio.wachs.health/sounds/swipe.mp3',
    duration: 200,
    volume: 0.4,
    loop: false,
    fadeIn: 0,
    fadeOut: 50,
    hasVisualAlternative: false,
    hapticPattern: 'light',
    isEnabled: true,
    playCount: 0,
  },
  nav_page_turn: {
    id: 'nav_page_turn',
    name: 'Page Turn',
    category: 'navigation',
    description: 'Page transition sound',
    url: 'https://audio.wachs.health/sounds/page_turn.mp3',
    duration: 300,
    volume: 0.4,
    loop: false,
    fadeIn: 0,
    fadeOut: 100,
    hasVisualAlternative: false,
    hapticPattern: 'light',
    isEnabled: true,
    playCount: 0,
  },
  
  // Success/Error
  success_complete: {
    id: 'success_complete',
    name: 'Task Complete',
    category: 'success',
    description: 'Positive completion sound',
    url: 'https://audio.wachs.health/sounds/success.mp3',
    duration: 600,
    volume: 0.6,
    loop: false,
    fadeIn: 0,
    fadeOut: 200,
    hasVisualAlternative: true,
    hapticPattern: 'success',
    isEnabled: true,
    playCount: 0,
  },
  error_alert: {
    id: 'error_alert',
    name: 'Error Alert',
    category: 'error',
    description: 'Error notification sound',
    url: 'https://audio.wachs.health/sounds/error.mp3',
    duration: 400,
    volume: 0.7,
    loop: false,
    fadeIn: 0,
    fadeOut: 100,
    hasVisualAlternative: true,
    hapticPattern: 'error',
    isEnabled: true,
    playCount: 0,
  },
  
  // Ambient
  ambient_calm: {
    id: 'ambient_calm',
    name: 'Calm Atmosphere',
    category: 'ambient',
    description: 'Soothing background for waiting areas',
    url: 'https://audio.wachs.health/sounds/ambient_calm.mp3',
    duration: 180000,
    volume: 0.2,
    loop: true,
    fadeIn: 3000,
    fadeOut: 3000,
    hasVisualAlternative: false,
    isEnabled: true,
    playCount: 0,
  },
  ambient_nature: {
    id: 'ambient_nature',
    name: 'Nature Sounds',
    category: 'ambient',
    description: 'Gentle nature sounds for relaxation',
    url: 'https://audio.wachs.health/sounds/ambient_nature.mp3',
    duration: 300000,
    volume: 0.25,
    loop: true,
    fadeIn: 5000,
    fadeOut: 5000,
    hasVisualAlternative: false,
    isEnabled: true,
    playCount: 0,
  },
};

// Voice Profiles
const VOICE_PROFILES: VoiceProfile[] = [
  {
    id: 'voice_prof_female_au',
    name: 'Dr. Sarah (Australian)',
    type: 'professional_female',
    language: 'en-AU',
    accent: 'Australian',
    gender: 'female',
    pitch: 1.0,
    speed: 1.0,
    volume: 0.9,
    quality: 'high',
    sampleRate: 44100,
    isDefault: true,
    usageCount: 0,
    previewUrl: 'https://audio.wachs.health/voices/prof_female_au_preview.mp3',
    previewText: 'Welcome to WACHS Patient Portal. I\'m here to guide you through your health journey.',
  },
  {
    id: 'voice_prof_male_au',
    name: 'Dr. James (Australian)',
    type: 'professional_male',
    language: 'en-AU',
    accent: 'Australian',
    gender: 'male',
    pitch: 0.9,
    speed: 1.0,
    volume: 0.9,
    quality: 'high',
    sampleRate: 44100,
    isDefault: false,
    usageCount: 0,
    previewUrl: 'https://audio.wachs.health/voices/prof_male_au_preview.mp3',
    previewText: 'Welcome to WACHS Patient Portal. I\'m here to guide you through your health journey.',
  },
  {
    id: 'voice_friendly_female',
    name: 'Emma (Friendly)',
    type: 'friendly_female',
    language: 'en-AU',
    accent: 'Australian',
    gender: 'female',
    pitch: 1.1,
    speed: 1.05,
    volume: 0.85,
    quality: 'high',
    sampleRate: 44100,
    isDefault: false,
    usageCount: 0,
    previewUrl: 'https://audio.wachs.health/voices/friendly_female_preview.mp3',
    previewText: 'Hi there! Welcome to your health portal. Let me show you around!',
  },
  {
    id: 'voice_calm_female',
    name: 'Grace (Calming)',
    type: 'calm_female',
    language: 'en-AU',
    accent: 'Australian',
    gender: 'female',
    pitch: 0.95,
    speed: 0.9,
    volume: 0.8,
    quality: 'studio',
    sampleRate: 48000,
    isDefault: false,
    usageCount: 0,
    previewUrl: 'https://audio.wachs.health/voices/calm_female_preview.mp3',
    previewText: 'Take a deep breath. You\'re in good hands. Let\'s take this one step at a time.',
  },
];

const triggerHaptic = (type: string) => console.log(`Haptic: ${type}`);

class MedicalVoiceoverSoundService {
  private sounds: Map<string, SoundEffect> = new Map();
  private voiceProfiles: Map<string, VoiceProfile> = new Map();
  private scripts: Map<string, VoiceoverScript> = new Map();
  private soundscapes: Map<string, AmbientSoundscape> = new Map();
  private settings: AudioSettings;
  
  private currentlyPlaying: Set<string> = new Set();
  private activeAmbient: string | null = null;

  constructor() {
    this.settings = {
      masterVolume: 0.8,
      voiceoverVolume: 0.9,
      soundEffectsVolume: 0.7,
      ambientVolume: 0.3,
      voiceoverEnabled: true,
      soundEffectsEnabled: true,
      ambientEnabled: true,
      preferredVoice: 'professional_female',
      preferredLanguage: 'en-AU',
      screenReaderMode: false,
      hapticFeedback: true,
      visualAlerts: true,
      audioQuality: 'high',
      streamingEnabled: true,
    };

    this.initializeSounds();
    this.initializeVoices();
    this.initializeSoundscapes();
    this.initializeScripts();
  }

  private initializeSounds(): void {
    Object.values(SOUND_LIBRARY).forEach(sound => {
      this.sounds.set(sound.id, { ...sound });
    });
  }

  private initializeVoices(): void {
    VOICE_PROFILES.forEach(profile => {
      this.voiceProfiles.set(profile.id, { ...profile });
    });
  }

  private initializeSoundscapes(): void {
    const soundscapes: AmbientSoundscape[] = [
      {
        id: 'soundscape_waiting_room',
        name: 'Waiting Room',
        description: 'Calming atmosphere for waiting areas',
        layers: [
          { id: 'base', name: 'Soft Pad', url: 'https://audio.wachs.health/ambient/soft_pad.mp3', volume: 0.3, pan: 0 },
          { id: 'nature', name: 'Gentle Rain', url: 'https://audio.wachs.health/ambient/gentle_rain.mp3', volume: 0.2, pan: -0.3 },
          { id: 'chimes', name: 'Wind Chimes', url: 'https://audio.wachs.health/ambient/wind_chimes.mp3', volume: 0.1, pan: 0.3 },
        ],
        masterVolume: 0.25,
        crossfadeDuration: 5000,
        isActive: false,
        totalPlayTime: 0,
      },
      {
        id: 'soundscape_meditation',
        name: 'Meditation',
        description: 'Deep relaxation soundscape',
        layers: [
          { id: 'drone', name: 'Healing Drone', url: 'https://audio.wachs.health/ambient/healing_drone.mp3', volume: 0.4, pan: 0 },
          { id: 'bells', name: 'Tibetan Bells', url: 'https://audio.wachs.health/ambient/tibetan_bells.mp3', volume: 0.15, pan: 0 },
        ],
        masterVolume: 0.3,
        crossfadeDuration: 8000,
        isActive: false,
        totalPlayTime: 0,
      },
    ];

    soundscapes.forEach(s => this.soundscapes.set(s.id, s));
  }

  private initializeScripts(): void {
    const scripts: VoiceoverScript[] = [
      // Onboarding
      {
        id: 'script_welcome',
        name: 'Welcome Message',
        category: 'onboarding',
        text: 'Welcome to the Western Australia Country Health Service Patient Portal. We\'re here to support your health journey every step of the way.',
        language: 'en-AU',
        voiceProfileId: 'voice_prof_female_au',
        pauseAfter: 1000,
        transcriptAvailable: true,
      },
      {
        id: 'script_dashboard_intro',
        name: 'Dashboard Introduction',
        category: 'onboarding',
        text: 'This is your personal health dashboard. Here you can view your appointments, track medications, access test results, and communicate with your healthcare team.',
        language: 'en-AU',
        voiceProfileId: 'voice_prof_female_au',
        pauseAfter: 800,
        transcriptAvailable: true,
      },
      // Appointments
      {
        id: 'script_appointment_reminder',
        name: 'Appointment Reminder',
        category: 'appointment',
        text: 'You have an upcoming appointment. Please arrive 15 minutes early to complete any necessary paperwork.',
        language: 'en-AU',
        voiceProfileId: 'voice_prof_female_au',
        pauseAfter: 500,
        transcriptAvailable: true,
      },
      // Medication
      {
        id: 'script_medication_reminder',
        name: 'Medication Reminder',
        category: 'medication',
        text: 'It\'s time to take your medication. Please confirm once you\'ve taken your dose.',
        language: 'en-AU',
        voiceProfileId: 'voice_prof_female_au',
        pauseAfter: 500,
        transcriptAvailable: true,
      },
      // Emergency
      {
        id: 'script_emergency_intro',
        name: 'Emergency Introduction',
        category: 'emergency',
        text: 'If you are experiencing a medical emergency, please call triple zero immediately. For non-urgent assistance, our team is available to help.',
        language: 'en-AU',
        voiceProfileId: 'voice_prof_female_au',
        pauseAfter: 1000,
        transcriptAvailable: true,
      },
    ];

    scripts.forEach(s => this.scripts.set(s.id, s));
  }

  // Sound Playback
  playSound(soundId: string): boolean {
    if (!this.settings.soundEffectsEnabled) return false;

    const sound = this.sounds.get(soundId);
    if (!sound || !sound.isEnabled) return false;

    const effectiveVolume = sound.volume * this.settings.soundEffectsVolume * this.settings.masterVolume;
    
    console.log(`Playing sound: ${sound.name} at volume ${effectiveVolume.toFixed(2)}`);
    
    sound.playCount++;
    this.currentlyPlaying.add(soundId);

    // Simulate playback completion
    setTimeout(() => {
      this.currentlyPlaying.delete(soundId);
    }, sound.duration);

    // Trigger haptic if enabled
    if (this.settings.hapticFeedback && sound.hapticPattern) {
      triggerHaptic(sound.hapticPattern);
    }

    return true;
  }

  stopSound(soundId: string): boolean {
    if (!this.currentlyPlaying.has(soundId)) return false;
    
    this.currentlyPlaying.delete(soundId);
    console.log(`Stopped sound: ${soundId}`);
    return true;
  }

  stopAllSounds(): void {
    this.currentlyPlaying.clear();
    console.log('Stopped all sounds');
  }

  // Voiceover Playback
  playVoiceover(scriptId: string): boolean {
    if (!this.settings.voiceoverEnabled) return false;

    const script = this.scripts.get(scriptId);
    if (!script) return false;

    const profile = this.voiceProfiles.get(script.voiceProfileId);
    if (!profile) return false;

    const effectiveVolume = this.settings.voiceoverVolume * this.settings.masterVolume;

    console.log(`Playing voiceover: "${script.text}" with voice ${profile.name} at volume ${effectiveVolume.toFixed(2)}`);
    
    profile.usageCount++;

    // Estimate duration based on text length and speed
    const estimatedDuration = (script.text.length * 60) / profile.speed;

    return true;
  }

  playVoiceoverText(text: string, voiceType?: VoiceType): boolean {
    if (!this.settings.voiceoverEnabled) return false;

    const profile = Array.from(this.voiceProfiles.values()).find(
      p => p.type === (voiceType || this.settings.preferredVoice)
    );
    
    if (!profile) return false;

    const effectiveVolume = this.settings.voiceoverVolume * this.settings.masterVolume;

    console.log(`Playing TTS: "${text}" with voice ${profile.name} at volume ${effectiveVolume.toFixed(2)}`);
    
    profile.usageCount++;

    return true;
  }

  // Ambient Soundscapes
  startSoundscape(soundscapeId: string): boolean {
    if (!this.settings.ambientEnabled) return false;

    const soundscape = this.soundscapes.get(soundscapeId);
    if (!soundscape) return false;

    // Stop current ambient if playing
    if (this.activeAmbient) {
      this.stopSoundscape(this.activeAmbient);
    }

    soundscape.isActive = true;
    this.activeAmbient = soundscapeId;

    const effectiveVolume = soundscape.masterVolume * this.settings.ambientVolume * this.settings.masterVolume;

    console.log(`Starting soundscape: ${soundscape.name} with ${soundscape.layers.length} layers at volume ${effectiveVolume.toFixed(2)}`);

    return true;
  }

  stopSoundscape(soundscapeId: string): boolean {
    const soundscape = this.soundscapes.get(soundscapeId);
    if (!soundscape || !soundscape.isActive) return false;

    soundscape.isActive = false;
    if (this.activeAmbient === soundscapeId) {
      this.activeAmbient = null;
    }

    console.log(`Stopped soundscape: ${soundscape.name}`);
    return true;
  }

  // Settings
  updateSettings(newSettings: Partial<AudioSettings>): AudioSettings {
    this.settings = { ...this.settings, ...newSettings };
    return this.settings;
  }

  getSettings(): AudioSettings {
    return { ...this.settings };
  }

  setMasterVolume(volume: number): void {
    this.settings.masterVolume = Math.max(0, Math.min(1, volume));
  }

  toggleVoiceover(enabled?: boolean): boolean {
    this.settings.voiceoverEnabled = enabled ?? !this.settings.voiceoverEnabled;
    return this.settings.voiceoverEnabled;
  }

  toggleSoundEffects(enabled?: boolean): boolean {
    this.settings.soundEffectsEnabled = enabled ?? !this.settings.soundEffectsEnabled;
    return this.settings.soundEffectsEnabled;
  }

  toggleAmbient(enabled?: boolean): boolean {
    this.settings.ambientEnabled = enabled ?? !this.settings.ambientEnabled;
    if (!this.settings.ambientEnabled && this.activeAmbient) {
      this.stopSoundscape(this.activeAmbient);
    }
    return this.settings.ambientEnabled;
  }

  // Queries
  getSound(soundId: string): SoundEffect | null {
    return this.sounds.get(soundId) || null;
  }

  getAllSounds(): SoundEffect[] {
    return Array.from(this.sounds.values());
  }

  getSoundsByCategory(category: SoundCategory): SoundEffect[] {
    return Array.from(this.sounds.values()).filter(s => s.category === category);
  }

  getVoiceProfile(profileId: string): VoiceProfile | null {
    return this.voiceProfiles.get(profileId) || null;
  }

  getAllVoiceProfiles(): VoiceProfile[] {
    return Array.from(this.voiceProfiles.values());
  }

  getDefaultVoice(): VoiceProfile | null {
    return Array.from(this.voiceProfiles.values()).find(p => p.isDefault) || null;
  }

  getScript(scriptId: string): VoiceoverScript | null {
    return this.scripts.get(scriptId) || null;
  }

  getAllScripts(): VoiceoverScript[] {
    return Array.from(this.scripts.values());
  }

  getScriptsByCategory(category: VoiceoverScript['category']): VoiceoverScript[] {
    return Array.from(this.scripts.values()).filter(s => s.category === category);
  }

  getSoundscape(soundscapeId: string): AmbientSoundscape | null {
    return this.soundscapes.get(soundscapeId) || null;
  }

  getAllSoundscapes(): AmbientSoundscape[] {
    return Array.from(this.soundscapes.values());
  }

  getActiveSoundscape(): AmbientSoundscape | null {
    if (!this.activeAmbient) return null;
    return this.soundscapes.get(this.activeAmbient) || null;
  }

  // Accessibility
  enableScreenReaderMode(): void {
    this.settings.screenReaderMode = true;
    this.settings.voiceoverEnabled = true;
    this.settings.hapticFeedback = true;
    this.settings.visualAlerts = true;
  }

  disableScreenReaderMode(): void {
    this.settings.screenReaderMode = false;
  }

  // Analytics
  getAnalytics(): AudioAnalytics {
    const sounds = Array.from(this.sounds.values());
    const voices = Array.from(this.voiceProfiles.values());

    const totalSoundsPlayed = sounds.reduce((sum, s) => sum + s.playCount, 0);
    const totalVoiceoversPlayed = voices.reduce((sum, v) => sum + v.usageCount, 0);

    const mostPlayedSounds = sounds
      .filter(s => s.playCount > 0)
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, 5)
      .map(s => ({ soundId: s.id, count: s.playCount }));

    const mostUsedVoice = voices.reduce((max, v) => 
      v.usageCount > (max?.usageCount || 0) ? v : max, voices[0]
    );

    return {
      totalVoiceoversPlayed,
      totalSoundsPlayed,
      averageVoiceoverCompletion: 0.85, // Simulated
      mostUsedVoice: mostUsedVoice?.type || 'professional_female',
      mostPlayedSounds,
      accessibilityUsage: {
        screenReader: this.settings.screenReaderMode ? 1 : 0,
        haptic: this.settings.hapticFeedback ? 1 : 0,
        visual: this.settings.visualAlerts ? 1 : 0,
      },
    };
  }

  // Reset
  reset(): void {
    this.stopAllSounds();
    if (this.activeAmbient) {
      this.stopSoundscape(this.activeAmbient);
    }
    this.initializeSounds();
    this.initializeVoices();
    this.initializeSoundscapes();
    this.initializeScripts();
  }
}

export const medicalVoiceoverSoundService = new MedicalVoiceoverSoundService();
