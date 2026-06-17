/**
 * Alert Sound Customization Service
 * MediVac WACHS v8.6
 * 
 * Provides custom notification sounds for different alert severity levels
 * and correlation groups with volume, vibration, and per-category controls.
 */

// Types
export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type AlertCategory = 'emergency' | 'patient' | 'medication' | 'system' | 'communication' | 'schedule' | 'security' | 'maintenance';
export type VibrationPattern = 'none' | 'short' | 'long' | 'pulse' | 'urgent' | 'custom';

export interface SoundProfile {
  id: string;
  name: string;
  description: string;
  soundUrl: string;
  duration: number; // milliseconds
  isBuiltIn: boolean;
  category: 'medical' | 'standard' | 'custom' | 'silent';
  previewUrl?: string;
}

export interface AlertSoundConfig {
  id: string;
  severity: AlertSeverity;
  category: AlertCategory;
  soundProfileId: string;
  volume: number; // 0-100
  vibrationPattern: VibrationPattern;
  customVibrationMs?: number[];
  enabled: boolean;
  repeatCount: number;
  repeatInterval: number; // milliseconds
  quietHoursOverride: boolean;
  escalationEnabled: boolean;
  escalationDelay: number; // seconds
  escalationSoundProfileId?: string;
}

export interface QuietHoursConfig {
  enabled: boolean;
  startTime: string; // HH:MM format
  endTime: string;
  allowCritical: boolean;
  allowEmergency: boolean;
  reducedVolume: number; // percentage of normal volume
  daysOfWeek: number[]; // 0-6, Sunday = 0
}

export interface SoundTestResult {
  success: boolean;
  soundProfileId: string;
  playedAt: number;
  duration: number;
  volume: number;
  error?: string;
}

export interface AlertSoundAnalytics {
  totalSoundsPlayed: number;
  soundsByCategory: Record<AlertCategory, number>;
  soundsBySeverity: Record<AlertSeverity, number>;
  avgVolumeLevel: number;
  quietHoursTriggered: number;
  escalationsTriggered: number;
  customSoundsUsed: number;
  mostUsedSound: string;
  lastSoundPlayed: number;
}

export interface VolumePreset {
  id: string;
  name: string;
  description: string;
  volumes: Record<AlertSeverity, number>;
  vibrationEnabled: boolean;
}

type Listener = (configs: AlertSoundConfig[]) => void;

class AlertSoundCustomizationService {
  private soundProfiles: Map<string, SoundProfile> = new Map();
  private soundConfigs: Map<string, AlertSoundConfig> = new Map();
  private quietHoursConfig: QuietHoursConfig;
  private volumePresets: Map<string, VolumePreset> = new Map();
  private analytics: AlertSoundAnalytics;
  private listeners: Set<Listener> = new Set();
  private globalMute: boolean = false;
  private globalVolume: number = 100;

  constructor() {
    this.quietHoursConfig = this.getDefaultQuietHours();
    this.analytics = this.getDefaultAnalytics();
    this.initializeBuiltInSounds();
    this.initializeDefaultConfigs();
    this.initializeVolumePresets();
  }

  private getDefaultQuietHours(): QuietHoursConfig {
    return {
      enabled: false,
      startTime: '22:00',
      endTime: '07:00',
      allowCritical: true,
      allowEmergency: true,
      reducedVolume: 30,
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    };
  }

  private getDefaultAnalytics(): AlertSoundAnalytics {
    return {
      totalSoundsPlayed: 0,
      soundsByCategory: {
        emergency: 0,
        patient: 0,
        medication: 0,
        system: 0,
        communication: 0,
        schedule: 0,
        security: 0,
        maintenance: 0,
      },
      soundsBySeverity: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        info: 0,
      },
      avgVolumeLevel: 75,
      quietHoursTriggered: 0,
      escalationsTriggered: 0,
      customSoundsUsed: 0,
      mostUsedSound: 'medical-alert-1',
      lastSoundPlayed: Date.now(),
    };
  }

  private initializeBuiltInSounds(): void {
    const builtInSounds: Omit<SoundProfile, 'id'>[] = [
      // Medical Alert Sounds
      {
        name: 'Code Blue Alert',
        description: 'Urgent cardiac arrest alert tone',
        soundUrl: 'builtin://code-blue',
        duration: 2000,
        isBuiltIn: true,
        category: 'medical',
      },
      {
        name: 'Code Red Alert',
        description: 'Fire emergency alert tone',
        soundUrl: 'builtin://code-red',
        duration: 2500,
        isBuiltIn: true,
        category: 'medical',
      },
      {
        name: 'Rapid Response',
        description: 'Rapid response team activation',
        soundUrl: 'builtin://rapid-response',
        duration: 1500,
        isBuiltIn: true,
        category: 'medical',
      },
      {
        name: 'Patient Monitor',
        description: 'Standard patient monitoring alert',
        soundUrl: 'builtin://patient-monitor',
        duration: 1000,
        isBuiltIn: true,
        category: 'medical',
      },
      {
        name: 'Medication Due',
        description: 'Medication administration reminder',
        soundUrl: 'builtin://medication-due',
        duration: 800,
        isBuiltIn: true,
        category: 'medical',
      },
      {
        name: 'IV Pump Alert',
        description: 'IV pump attention required',
        soundUrl: 'builtin://iv-pump',
        duration: 1200,
        isBuiltIn: true,
        category: 'medical',
      },
      // Standard Alert Sounds
      {
        name: 'Chime',
        description: 'Pleasant notification chime',
        soundUrl: 'builtin://chime',
        duration: 500,
        isBuiltIn: true,
        category: 'standard',
      },
      {
        name: 'Bell',
        description: 'Classic bell notification',
        soundUrl: 'builtin://bell',
        duration: 600,
        isBuiltIn: true,
        category: 'standard',
      },
      {
        name: 'Ping',
        description: 'Short ping notification',
        soundUrl: 'builtin://ping',
        duration: 300,
        isBuiltIn: true,
        category: 'standard',
      },
      {
        name: 'Alert Tone',
        description: 'Standard alert tone',
        soundUrl: 'builtin://alert-tone',
        duration: 700,
        isBuiltIn: true,
        category: 'standard',
      },
      {
        name: 'Urgent Beep',
        description: 'Urgent attention beep',
        soundUrl: 'builtin://urgent-beep',
        duration: 400,
        isBuiltIn: true,
        category: 'standard',
      },
      // Silent Option
      {
        name: 'Silent',
        description: 'No sound (vibration only)',
        soundUrl: 'builtin://silent',
        duration: 0,
        isBuiltIn: true,
        category: 'silent',
      },
    ];

    builtInSounds.forEach((sound, index) => {
      const id = `builtin-${index + 1}`;
      this.soundProfiles.set(id, { ...sound, id });
    });
  }

  private initializeDefaultConfigs(): void {
    const severities: AlertSeverity[] = ['critical', 'high', 'medium', 'low', 'info'];
    const categories: AlertCategory[] = ['emergency', 'patient', 'medication', 'system', 'communication', 'schedule', 'security', 'maintenance'];

    // Create default configs for each severity-category combination
    severities.forEach((severity) => {
      categories.forEach((category) => {
        const id = `${severity}-${category}`;
        const config: AlertSoundConfig = {
          id,
          severity,
          category,
          soundProfileId: this.getDefaultSoundForSeverity(severity),
          volume: this.getDefaultVolumeForSeverity(severity),
          vibrationPattern: this.getDefaultVibrationForSeverity(severity),
          enabled: true,
          repeatCount: severity === 'critical' ? 3 : severity === 'high' ? 2 : 1,
          repeatInterval: 2000,
          quietHoursOverride: severity === 'critical' || category === 'emergency',
          escalationEnabled: severity === 'critical' || severity === 'high',
          escalationDelay: severity === 'critical' ? 30 : 60,
          escalationSoundProfileId: 'builtin-1', // Code Blue
        };
        this.soundConfigs.set(id, config);
      });
    });
  }

  private getDefaultSoundForSeverity(severity: AlertSeverity): string {
    switch (severity) {
      case 'critical': return 'builtin-1'; // Code Blue
      case 'high': return 'builtin-3'; // Rapid Response
      case 'medium': return 'builtin-4'; // Patient Monitor
      case 'low': return 'builtin-7'; // Chime
      case 'info': return 'builtin-9'; // Ping
      default: return 'builtin-10'; // Alert Tone
    }
  }

  private getDefaultVolumeForSeverity(severity: AlertSeverity): number {
    switch (severity) {
      case 'critical': return 100;
      case 'high': return 90;
      case 'medium': return 75;
      case 'low': return 60;
      case 'info': return 50;
      default: return 70;
    }
  }

  private getDefaultVibrationForSeverity(severity: AlertSeverity): VibrationPattern {
    switch (severity) {
      case 'critical': return 'urgent';
      case 'high': return 'pulse';
      case 'medium': return 'long';
      case 'low': return 'short';
      case 'info': return 'none';
      default: return 'short';
    }
  }

  private initializeVolumePresets(): void {
    const presets: Omit<VolumePreset, 'id'>[] = [
      {
        name: 'Maximum Alert',
        description: 'All alerts at maximum volume',
        volumes: { critical: 100, high: 100, medium: 100, low: 100, info: 100 },
        vibrationEnabled: true,
      },
      {
        name: 'Standard',
        description: 'Balanced volume levels',
        volumes: { critical: 100, high: 90, medium: 75, low: 60, info: 50 },
        vibrationEnabled: true,
      },
      {
        name: 'Quiet Mode',
        description: 'Reduced volume for quiet environments',
        volumes: { critical: 70, high: 50, medium: 40, low: 30, info: 20 },
        vibrationEnabled: true,
      },
      {
        name: 'Vibrate Only',
        description: 'No sound, vibration only',
        volumes: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
        vibrationEnabled: true,
      },
      {
        name: 'Critical Only',
        description: 'Only critical alerts audible',
        volumes: { critical: 100, high: 0, medium: 0, low: 0, info: 0 },
        vibrationEnabled: true,
      },
    ];

    presets.forEach((preset, index) => {
      const id = `preset-${index + 1}`;
      this.volumePresets.set(id, { ...preset, id });
    });
  }

  // Sound Profile Management
  getAllSoundProfiles(): SoundProfile[] {
    return Array.from(this.soundProfiles.values());
  }

  getSoundProfile(id: string): SoundProfile | undefined {
    return this.soundProfiles.get(id);
  }

  getBuiltInSounds(): SoundProfile[] {
    return this.getAllSoundProfiles().filter(s => s.isBuiltIn);
  }

  getCustomSounds(): SoundProfile[] {
    return this.getAllSoundProfiles().filter(s => !s.isBuiltIn);
  }

  getSoundsByCategory(category: SoundProfile['category']): SoundProfile[] {
    return this.getAllSoundProfiles().filter(s => s.category === category);
  }

  addCustomSound(sound: Omit<SoundProfile, 'id' | 'isBuiltIn'>): SoundProfile {
    const id = `custom-${Date.now()}`;
    const newSound: SoundProfile = {
      ...sound,
      id,
      isBuiltIn: false,
      category: 'custom',
    };
    this.soundProfiles.set(id, newSound);
    return newSound;
  }

  removeCustomSound(id: string): boolean {
    const sound = this.soundProfiles.get(id);
    if (sound && !sound.isBuiltIn) {
      this.soundProfiles.delete(id);
      return true;
    }
    return false;
  }

  updateCustomSound(id: string, updates: Partial<Omit<SoundProfile, 'id' | 'isBuiltIn'>>): SoundProfile | undefined {
    const sound = this.soundProfiles.get(id);
    if (sound && !sound.isBuiltIn) {
      const updated = { ...sound, ...updates };
      this.soundProfiles.set(id, updated);
      return updated;
    }
    return undefined;
  }

  // Alert Sound Configuration
  getAllConfigs(): AlertSoundConfig[] {
    return Array.from(this.soundConfigs.values());
  }

  getConfig(severity: AlertSeverity, category: AlertCategory): AlertSoundConfig | undefined {
    return this.soundConfigs.get(`${severity}-${category}`);
  }

  getConfigById(id: string): AlertSoundConfig | undefined {
    return this.soundConfigs.get(id);
  }

  getConfigsBySeverity(severity: AlertSeverity): AlertSoundConfig[] {
    return this.getAllConfigs().filter(c => c.severity === severity);
  }

  getConfigsByCategory(category: AlertCategory): AlertSoundConfig[] {
    return this.getAllConfigs().filter(c => c.category === category);
  }

  updateConfig(id: string, updates: Partial<Omit<AlertSoundConfig, 'id' | 'severity' | 'category'>>): AlertSoundConfig | undefined {
    const config = this.soundConfigs.get(id);
    if (config) {
      const updated = { ...config, ...updates };
      this.soundConfigs.set(id, updated);
      this.notifyListeners();
      return updated;
    }
    return undefined;
  }

  setSoundForConfig(id: string, soundProfileId: string): boolean {
    const config = this.soundConfigs.get(id);
    const sound = this.soundProfiles.get(soundProfileId);
    if (config && sound) {
      config.soundProfileId = soundProfileId;
      this.soundConfigs.set(id, config);
      this.notifyListeners();
      return true;
    }
    return false;
  }

  setVolumeForConfig(id: string, volume: number): boolean {
    const config = this.soundConfigs.get(id);
    if (config) {
      config.volume = Math.max(0, Math.min(100, volume));
      this.soundConfigs.set(id, config);
      this.notifyListeners();
      return true;
    }
    return false;
  }

  setVibrationForConfig(id: string, pattern: VibrationPattern, customMs?: number[]): boolean {
    const config = this.soundConfigs.get(id);
    if (config) {
      config.vibrationPattern = pattern;
      if (pattern === 'custom' && customMs) {
        config.customVibrationMs = customMs;
      }
      this.soundConfigs.set(id, config);
      this.notifyListeners();
      return true;
    }
    return false;
  }

  toggleConfig(id: string): boolean {
    const config = this.soundConfigs.get(id);
    if (config) {
      config.enabled = !config.enabled;
      this.soundConfigs.set(id, config);
      this.notifyListeners();
      return config.enabled;
    }
    return false;
  }

  // Quiet Hours
  getQuietHoursConfig(): QuietHoursConfig {
    return { ...this.quietHoursConfig };
  }

  updateQuietHours(updates: Partial<QuietHoursConfig>): QuietHoursConfig {
    this.quietHoursConfig = { ...this.quietHoursConfig, ...updates };
    return this.quietHoursConfig;
  }

  isQuietHoursActive(): boolean {
    if (!this.quietHoursConfig.enabled) return false;

    const now = new Date();
    const currentDay = now.getDay();
    
    if (!this.quietHoursConfig.daysOfWeek.includes(currentDay)) return false;

    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const { startTime, endTime } = this.quietHoursConfig;

    // Handle overnight quiet hours (e.g., 22:00 - 07:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime < endTime;
    }
    return currentTime >= startTime && currentTime < endTime;
  }

  // Volume Presets
  getAllVolumePresets(): VolumePreset[] {
    return Array.from(this.volumePresets.values());
  }

  getVolumePreset(id: string): VolumePreset | undefined {
    return this.volumePresets.get(id);
  }

  applyVolumePreset(presetId: string): boolean {
    const preset = this.volumePresets.get(presetId);
    if (!preset) return false;

    this.getAllConfigs().forEach(config => {
      config.volume = preset.volumes[config.severity];
      if (!preset.vibrationEnabled) {
        config.vibrationPattern = 'none';
      }
      this.soundConfigs.set(config.id, config);
    });

    this.notifyListeners();
    return true;
  }

  createVolumePreset(preset: Omit<VolumePreset, 'id'>): VolumePreset {
    const id = `preset-custom-${Date.now()}`;
    const newPreset = { ...preset, id };
    this.volumePresets.set(id, newPreset);
    return newPreset;
  }

  // Global Controls
  setGlobalMute(muted: boolean): void {
    this.globalMute = muted;
    this.notifyListeners();
  }

  isGlobalMuted(): boolean {
    return this.globalMute;
  }

  setGlobalVolume(volume: number): void {
    this.globalVolume = Math.max(0, Math.min(100, volume));
    this.notifyListeners();
  }

  getGlobalVolume(): number {
    return this.globalVolume;
  }

  // Sound Playback (simulated)
  async playSound(severity: AlertSeverity, category: AlertCategory): Promise<SoundTestResult> {
    const config = this.getConfig(severity, category);
    if (!config || !config.enabled || this.globalMute) {
      return {
        success: false,
        soundProfileId: config?.soundProfileId || '',
        playedAt: Date.now(),
        duration: 0,
        volume: 0,
        error: this.globalMute ? 'Global mute enabled' : 'Config disabled or not found',
      };
    }

    const sound = this.soundProfiles.get(config.soundProfileId);
    if (!sound) {
      return {
        success: false,
        soundProfileId: config.soundProfileId,
        playedAt: Date.now(),
        duration: 0,
        volume: 0,
        error: 'Sound profile not found',
      };
    }

    // Calculate effective volume
    let effectiveVolume = (config.volume * this.globalVolume) / 100;
    if (this.isQuietHoursActive() && !config.quietHoursOverride) {
      effectiveVolume = (effectiveVolume * this.quietHoursConfig.reducedVolume) / 100;
      this.analytics.quietHoursTriggered++;
    }

    // Update analytics
    this.analytics.totalSoundsPlayed++;
    this.analytics.soundsByCategory[category]++;
    this.analytics.soundsBySeverity[severity]++;
    this.analytics.lastSoundPlayed = Date.now();
    if (!sound.isBuiltIn) {
      this.analytics.customSoundsUsed++;
    }

    // Simulate sound playback
    return {
      success: true,
      soundProfileId: config.soundProfileId,
      playedAt: Date.now(),
      duration: sound.duration,
      volume: effectiveVolume,
    };
  }

  async testSound(soundProfileId: string, volume?: number): Promise<SoundTestResult> {
    const sound = this.soundProfiles.get(soundProfileId);
    if (!sound) {
      return {
        success: false,
        soundProfileId,
        playedAt: Date.now(),
        duration: 0,
        volume: 0,
        error: 'Sound profile not found',
      };
    }

    const testVolume = volume ?? 70;
    
    // Simulate sound test
    return {
      success: true,
      soundProfileId,
      playedAt: Date.now(),
      duration: sound.duration,
      volume: testVolume,
    };
  }

  // Vibration Patterns
  getVibrationPatternMs(pattern: VibrationPattern, customMs?: number[]): number[] {
    switch (pattern) {
      case 'none': return [];
      case 'short': return [100];
      case 'long': return [500];
      case 'pulse': return [100, 100, 100, 100, 100];
      case 'urgent': return [200, 100, 200, 100, 200, 100, 500];
      case 'custom': return customMs || [200];
      default: return [200];
    }
  }

  // Analytics
  getAnalytics(): AlertSoundAnalytics {
    // Calculate most used sound
    const soundUsage: Record<string, number> = {};
    this.getAllConfigs().forEach(config => {
      soundUsage[config.soundProfileId] = (soundUsage[config.soundProfileId] || 0) + 1;
    });
    
    let mostUsed = '';
    let maxUsage = 0;
    Object.entries(soundUsage).forEach(([id, count]) => {
      if (count > maxUsage) {
        maxUsage = count;
        mostUsed = id;
      }
    });

    const sound = this.soundProfiles.get(mostUsed);
    this.analytics.mostUsedSound = sound?.name || 'Unknown';

    // Calculate average volume
    const configs = this.getAllConfigs();
    const totalVolume = configs.reduce((sum, c) => sum + c.volume, 0);
    this.analytics.avgVolumeLevel = Math.round(totalVolume / configs.length);

    return { ...this.analytics };
  }

  // Bulk Operations
  setAllVolumes(severity: AlertSeverity, volume: number): void {
    this.getConfigsBySeverity(severity).forEach(config => {
      config.volume = Math.max(0, Math.min(100, volume));
      this.soundConfigs.set(config.id, config);
    });
    this.notifyListeners();
  }

  setAllSounds(severity: AlertSeverity, soundProfileId: string): void {
    if (!this.soundProfiles.has(soundProfileId)) return;
    
    this.getConfigsBySeverity(severity).forEach(config => {
      config.soundProfileId = soundProfileId;
      this.soundConfigs.set(config.id, config);
    });
    this.notifyListeners();
  }

  enableAllForCategory(category: AlertCategory, enabled: boolean): void {
    this.getConfigsByCategory(category).forEach(config => {
      config.enabled = enabled;
      this.soundConfigs.set(config.id, config);
    });
    this.notifyListeners();
  }

  // Export/Import
  exportSettings(): string {
    return JSON.stringify({
      soundConfigs: Array.from(this.soundConfigs.entries()),
      customSounds: this.getCustomSounds(),
      quietHours: this.quietHoursConfig,
      globalVolume: this.globalVolume,
      globalMute: this.globalMute,
      exportedAt: Date.now(),
    });
  }

  importSettings(json: string): boolean {
    try {
      const data = JSON.parse(json);
      
      if (data.soundConfigs) {
        data.soundConfigs.forEach(([id, config]: [string, AlertSoundConfig]) => {
          this.soundConfigs.set(id, config);
        });
      }
      
      if (data.customSounds) {
        data.customSounds.forEach((sound: SoundProfile) => {
          this.soundProfiles.set(sound.id, sound);
        });
      }
      
      if (data.quietHours) {
        this.quietHoursConfig = data.quietHours;
      }
      
      if (typeof data.globalVolume === 'number') {
        this.globalVolume = data.globalVolume;
      }
      
      if (typeof data.globalMute === 'boolean') {
        this.globalMute = data.globalMute;
      }

      this.notifyListeners();
      return true;
    } catch {
      return false;
    }
  }

  // Subscription
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const configs = this.getAllConfigs();
    this.listeners.forEach(listener => listener(configs));
  }

  // Reset
  reset(): void {
    this.soundConfigs.clear();
    this.quietHoursConfig = this.getDefaultQuietHours();
    this.analytics = this.getDefaultAnalytics();
    this.globalMute = false;
    this.globalVolume = 100;
    
    // Keep built-in sounds, remove custom
    const customIds = this.getCustomSounds().map(s => s.id);
    customIds.forEach(id => this.soundProfiles.delete(id));
    
    this.initializeDefaultConfigs();
    this.notifyListeners();
  }
}

export const alertSoundCustomizationService = new AlertSoundCustomizationService();
