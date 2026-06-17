/**
 * Accessibility Audio Descriptions Service
 * Provides voice announcements for accessibility features on the hospital map
 */

export interface AccessibilityFeatureAudio {
  id: string;
  type: 'elevator' | 'ramp' | 'restroom' | 'parking' | 'entrance' | 'seating' | 'assistance';
  name: string;
  location: { x: number; y: number };
  description: string;
  shortAnnouncement: string;
  detailedAnnouncement: string;
  proximityRadius: number; // meters
  floor?: string;
  operatingHours?: string;
}

export interface AudioSettings {
  enabled: boolean;
  volume: number; // 0-1
  rate: number; // 0.5-2
  pitch: number; // 0.5-2
  language: string;
  announceOnApproach: boolean;
  announceDistance: number; // meters
  repeatInterval: number; // seconds, 0 = no repeat
  detailedMode: boolean;
}

export interface ProximityEvent {
  feature: AccessibilityFeatureAudio;
  distance: number;
  direction: string;
  isEntering: boolean;
}

type AudioListener = (event: ProximityEvent | null) => void;
type SettingsListener = (settings: AudioSettings) => void;

class AccessibilityAudioService {
  private static instance: AccessibilityAudioService;
  private settings: AudioSettings;
  private listeners: Set<AudioListener> = new Set();
  private settingsListeners: Set<SettingsListener> = new Set();
  private currentPosition: { x: number; y: number } | null = null;
  private announcedFeatures: Set<string> = new Set();
  private lastAnnouncementTime: Map<string, number> = new Map();
  private isSpeaking: boolean = false;
  private speechQueue: string[] = [];

  // Hospital accessibility features with audio descriptions
  private features: AccessibilityFeatureAudio[] = [
    // Elevators
    {
      id: 'elev_main',
      type: 'elevator',
      name: 'Main Building Elevator',
      location: { x: 200, y: 180 },
      description: 'Main elevator serving all floors',
      shortAnnouncement: 'Elevator ahead',
      detailedAnnouncement: 'Main building elevator on your right. Press call button at waist height. Braille floor indicators inside.',
      proximityRadius: 15,
      floor: 'All floors',
      operatingHours: '24/7'
    },
    {
      id: 'elev_emergency',
      type: 'elevator',
      name: 'Emergency Department Elevator',
      location: { x: 150, y: 220 },
      description: 'Elevator near Emergency Department',
      shortAnnouncement: 'Emergency elevator nearby',
      detailedAnnouncement: 'Emergency Department elevator 10 meters ahead. Priority access for patients and wheelchairs.',
      proximityRadius: 12,
      floor: 'Ground and Level 1',
      operatingHours: '24/7'
    },
    // Ramps
    {
      id: 'ramp_main',
      type: 'ramp',
      name: 'Main Entrance Ramp',
      location: { x: 200, y: 120 },
      description: 'Wheelchair accessible ramp at main entrance',
      shortAnnouncement: 'Accessible ramp ahead',
      detailedAnnouncement: 'Wheelchair accessible ramp to main entrance. Gentle slope with handrails on both sides. Non-slip surface.',
      proximityRadius: 10,
    },
    {
      id: 'ramp_emergency',
      type: 'ramp',
      name: 'Emergency Entrance Ramp',
      location: { x: 120, y: 200 },
      description: 'Ramp to Emergency Department',
      shortAnnouncement: 'Emergency ramp on left',
      detailedAnnouncement: 'Emergency Department ramp on your left. Wide access for stretchers and wheelchairs.',
      proximityRadius: 10,
    },
    // Accessible Restrooms
    {
      id: 'restroom_main',
      type: 'restroom',
      name: 'Main Accessible Restroom',
      location: { x: 220, y: 160 },
      description: 'Fully accessible restroom near reception',
      shortAnnouncement: 'Accessible restroom nearby',
      detailedAnnouncement: 'Accessible restroom 5 meters on your right. Features grab rails, lowered sink, and emergency call button.',
      proximityRadius: 8,
    },
    {
      id: 'restroom_maternity',
      type: 'restroom',
      name: 'Maternity Accessible Restroom',
      location: { x: 100, y: 280 },
      description: 'Accessible restroom in Maternity Ward',
      shortAnnouncement: 'Maternity restroom ahead',
      detailedAnnouncement: 'Maternity Ward accessible restroom ahead. Includes baby change facilities and privacy lock.',
      proximityRadius: 8,
    },
    // Accessible Parking
    {
      id: 'parking_main',
      type: 'parking',
      name: 'Main Accessible Parking',
      location: { x: 200, y: 80 },
      description: 'Accessible parking bays near main entrance',
      shortAnnouncement: 'Accessible parking area',
      detailedAnnouncement: '6 accessible parking bays located near main entrance. ACROD permit required. Direct path to entrance ramp.',
      proximityRadius: 20,
    },
    {
      id: 'parking_emergency',
      type: 'parking',
      name: 'Emergency Accessible Parking',
      location: { x: 80, y: 200 },
      description: 'Accessible parking near Emergency',
      shortAnnouncement: 'Emergency parking nearby',
      detailedAnnouncement: '4 accessible parking bays near Emergency Department. Short-term parking available for drop-off.',
      proximityRadius: 20,
    },
    // Accessible Entrances
    {
      id: 'entrance_main',
      type: 'entrance',
      name: 'Main Automatic Entrance',
      location: { x: 200, y: 100 },
      description: 'Automatic sliding doors at main entrance',
      shortAnnouncement: 'Automatic doors ahead',
      detailedAnnouncement: 'Main entrance with automatic sliding doors. Motion sensor activated. Assistance button on right pillar.',
      proximityRadius: 12,
    },
    {
      id: 'entrance_emergency',
      type: 'entrance',
      name: 'Emergency Entrance',
      location: { x: 100, y: 200 },
      description: 'Emergency Department entrance',
      shortAnnouncement: 'Emergency entrance',
      detailedAnnouncement: 'Emergency Department entrance with automatic doors. Triage desk immediately inside on the left.',
      proximityRadius: 12,
    },
    // Seating Areas
    {
      id: 'seating_reception',
      type: 'seating',
      name: 'Reception Waiting Area',
      location: { x: 210, y: 140 },
      description: 'Accessible seating in main reception',
      shortAnnouncement: 'Waiting area with accessible seating',
      detailedAnnouncement: 'Main reception waiting area. Wheelchair spaces available. Hearing loop installed. Priority seating marked.',
      proximityRadius: 10,
    },
    {
      id: 'seating_emergency',
      type: 'seating',
      name: 'Emergency Waiting Area',
      location: { x: 140, y: 210 },
      description: 'Emergency Department waiting area',
      shortAnnouncement: 'Emergency waiting area',
      detailedAnnouncement: 'Emergency Department waiting area on your left. Accessible seating and wheelchair spaces available.',
      proximityRadius: 10,
    },
    // Assistance Points
    {
      id: 'assist_reception',
      type: 'assistance',
      name: 'Reception Assistance',
      location: { x: 200, y: 130 },
      description: 'Staff assistance at main reception',
      shortAnnouncement: 'Assistance desk ahead',
      detailedAnnouncement: 'Main reception desk 5 meters ahead. Staff available to assist. Lowered counter section on the right.',
      proximityRadius: 8,
    },
    {
      id: 'assist_volunteer',
      type: 'assistance',
      name: 'Volunteer Assistance Point',
      location: { x: 180, y: 150 },
      description: 'Volunteer assistance station',
      shortAnnouncement: 'Volunteer assistance nearby',
      detailedAnnouncement: 'Volunteer assistance station. Volunteers can help with wayfinding, wheelchair assistance, and general inquiries.',
      proximityRadius: 8,
    }
  ];

  private constructor() {
    this.settings = {
      enabled: true,
      volume: 0.8,
      rate: 1.0,
      pitch: 1.0,
      language: 'en-AU',
      announceOnApproach: true,
      announceDistance: 10,
      repeatInterval: 30,
      detailedMode: false
    };
    this.loadSettings();
  }

  static getInstance(): AccessibilityAudioService {
    if (!AccessibilityAudioService.instance) {
      AccessibilityAudioService.instance = new AccessibilityAudioService();
    }
    return AccessibilityAudioService.instance;
  }

  private loadSettings(): void {
    // Load from storage in production
  }

  private saveSettings(): void {
    // Save to storage in production
  }

  subscribe(listener: AudioListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  subscribeToSettings(listener: SettingsListener): () => void {
    this.settingsListeners.add(listener);
    listener(this.settings);
    return () => this.settingsListeners.delete(listener);
  }

  private notifyListeners(event: ProximityEvent | null): void {
    this.listeners.forEach(listener => listener(event));
  }

  private notifySettingsListeners(): void {
    this.settingsListeners.forEach(listener => listener(this.settings));
  }

  // Update user position and check for nearby features
  updatePosition(x: number, y: number): void {
    this.currentPosition = { x, y };
    
    if (!this.settings.enabled || !this.settings.announceOnApproach) {
      return;
    }

    this.checkProximity();
  }

  private checkProximity(): void {
    if (!this.currentPosition) return;

    for (const feature of this.features) {
      const distance = this.calculateDistance(
        this.currentPosition,
        feature.location
      );

      // Check if within announcement distance
      if (distance <= this.settings.announceDistance) {
        const now = Date.now();
        const lastAnnounced = this.lastAnnouncementTime.get(feature.id) || 0;
        const repeatMs = this.settings.repeatInterval * 1000;

        // Check if we should announce (first time or repeat interval passed)
        if (!this.announcedFeatures.has(feature.id) || 
            (repeatMs > 0 && now - lastAnnounced > repeatMs)) {
          
          const direction = this.calculateDirection(
            this.currentPosition,
            feature.location
          );

          const event: ProximityEvent = {
            feature,
            distance,
            direction,
            isEntering: !this.announcedFeatures.has(feature.id)
          };

          this.announceFeature(feature, distance);
          this.announcedFeatures.add(feature.id);
          this.lastAnnouncementTime.set(feature.id, now);
          this.notifyListeners(event);
        }
      } else if (distance > feature.proximityRadius * 2) {
        // Reset when user moves away
        this.announcedFeatures.delete(feature.id);
      }
    }
  }

  private calculateDistance(pos1: { x: number; y: number }, pos2: { x: number; y: number }): number {
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private calculateDirection(from: { x: number; y: number }, to: { x: number; y: number }): string {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    if (angle >= -22.5 && angle < 22.5) return 'right';
    if (angle >= 22.5 && angle < 67.5) return 'front-right';
    if (angle >= 67.5 && angle < 112.5) return 'ahead';
    if (angle >= 112.5 && angle < 157.5) return 'front-left';
    if (angle >= 157.5 || angle < -157.5) return 'left';
    if (angle >= -157.5 && angle < -112.5) return 'back-left';
    if (angle >= -112.5 && angle < -67.5) return 'behind';
    return 'back-right';
  }

  private announceFeature(feature: AccessibilityFeatureAudio, distance: number): void {
    const announcement = this.settings.detailedMode 
      ? feature.detailedAnnouncement 
      : feature.shortAnnouncement;

    const distanceText = distance < 5 
      ? 'nearby' 
      : `${Math.round(distance)} meters away`;

    const fullAnnouncement = `${announcement}. ${distanceText}.`;
    this.speak(fullAnnouncement);
  }

  // Text-to-speech functionality
  speak(text: string): void {
    if (!this.settings.enabled) return;

    this.speechQueue.push(text);
    this.processQueue();
  }

  private processQueue(): void {
    if (this.isSpeaking || this.speechQueue.length === 0) return;

    const text = this.speechQueue.shift();
    if (!text) return;

    this.isSpeaking = true;

    // Use Web Speech API or expo-speech in production
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = this.settings.volume;
      utterance.rate = this.settings.rate;
      utterance.pitch = this.settings.pitch;
      utterance.lang = this.settings.language;

      utterance.onend = () => {
        this.isSpeaking = false;
        this.processQueue();
      };

      utterance.onerror = () => {
        this.isSpeaking = false;
        this.processQueue();
      };

      window.speechSynthesis.speak(utterance);
    } else {
      // Fallback for non-web environments
      console.log('[TTS]:', text);
      setTimeout(() => {
        this.isSpeaking = false;
        this.processQueue();
      }, 2000);
    }
  }

  stopSpeaking(): void {
    this.speechQueue = [];
    this.isSpeaking = false;
    
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  // Settings management
  getSettings(): AudioSettings {
    return { ...this.settings };
  }

  updateSettings(updates: Partial<AudioSettings>): void {
    this.settings = { ...this.settings, ...updates };
    this.saveSettings();
    this.notifySettingsListeners();
  }

  setEnabled(enabled: boolean): void {
    this.updateSettings({ enabled });
    if (!enabled) {
      this.stopSpeaking();
    }
  }

  setVolume(volume: number): void {
    this.updateSettings({ volume: Math.max(0, Math.min(1, volume)) });
  }

  setRate(rate: number): void {
    this.updateSettings({ rate: Math.max(0.5, Math.min(2, rate)) });
  }

  setDetailedMode(detailed: boolean): void {
    this.updateSettings({ detailedMode: detailed });
  }

  // Get all features
  getFeatures(): AccessibilityFeatureAudio[] {
    return [...this.features];
  }

  // Get features by type
  getFeaturesByType(type: AccessibilityFeatureAudio['type']): AccessibilityFeatureAudio[] {
    return this.features.filter(f => f.type === type);
  }

  // Manually announce a specific feature
  announceFeatureById(featureId: string): void {
    const feature = this.features.find(f => f.id === featureId);
    if (feature) {
      const announcement = this.settings.detailedMode 
        ? feature.detailedAnnouncement 
        : feature.shortAnnouncement;
      this.speak(announcement);
    }
  }

  // Announce current location summary
  announceLocationSummary(): void {
    if (!this.currentPosition) {
      this.speak('Position not available. Please enable location services.');
      return;
    }

    const nearbyFeatures = this.features.filter(f => {
      const distance = this.calculateDistance(this.currentPosition!, f.location);
      return distance <= 20;
    });

    if (nearbyFeatures.length === 0) {
      this.speak('No accessibility features nearby.');
    } else {
      const summary = nearbyFeatures.map(f => f.name).join(', ');
      this.speak(`Nearby accessibility features: ${summary}.`);
    }
  }

  // Get available voices
  getAvailableVoices(): string[] {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      return window.speechSynthesis.getVoices().map(v => v.name);
    }
    return ['Default'];
  }
}

export const accessibilityAudioService = AccessibilityAudioService.getInstance();
