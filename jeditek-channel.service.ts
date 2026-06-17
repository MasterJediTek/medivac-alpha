/**
 * JediTek Radio Channel Service
 * 
 * Custom branded JediTek Radio channel configuration with:
 * - Station branding and identity
 * - DJ voiceover announcements
 * - Station ID graphics
 * - Custom playlists and programming
 */

// ============================================================================
// TYPES
// ============================================================================

export interface JediTekChannel {
  id: string;
  name: string;
  tagline: string;
  description: string;
  genre: string;
  videoId: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  djName: string;
  frequency: string;
  isDefault: boolean;
}

export interface DJAnnouncement {
  id: string;
  type: 'station_id' | 'intro' | 'outro' | 'transition' | 'promo' | 'news' | 'weather';
  text: string;
  duration: number;
  priority: number;
  timeSlot?: string; // e.g., 'morning', 'afternoon', 'evening', 'night'
}

export interface StationBranding {
  stationName: string;
  slogan: string;
  frequency: string;
  logo: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  djPersonalities: DJPersonality[];
}

export interface DJPersonality {
  id: string;
  name: string;
  nickname: string;
  style: string;
  timeSlot: string;
  catchphrases: string[];
  avatar: string;
}

// ============================================================================
// JEDITEK RADIO BRANDING
// ============================================================================

export const JEDITEK_BRANDING: StationBranding = {
  stationName: 'JediTek Radio',
  slogan: "We've Got Your Groove!",
  frequency: '107.7 FM',
  logo: '📻',
  colors: {
    primary: '#00BFFF',
    secondary: '#1a1a2e',
    accent: '#FFD700',
    background: '#0a0a0a',
  },
  djPersonalities: [
    {
      id: 'dj-jedi',
      name: 'DJ Jedi Master',
      nickname: 'The Force',
      style: 'Disco / Funk',
      timeSlot: 'morning',
      catchphrases: [
        "May the beats be with you!",
        "Feel the force of music!",
        "JediTek Radio - We've got your groove!",
        "This is DJ Jedi Master, keeping you moving!",
      ],
      avatar: '🎧',
    },
    {
      id: 'dj-goldfields',
      name: 'DJ Goldfields',
      nickname: 'The Nugget',
      style: 'Classic Hits',
      timeSlot: 'afternoon',
      catchphrases: [
        "Broadcasting from the heart of the Goldfields!",
        "Golden hits for golden times!",
        "JediTek Radio - Your Kalgoorlie connection!",
        "This is DJ Goldfields, striking gold with every track!",
      ],
      avatar: '⛏️',
    },
    {
      id: 'dj-outback',
      name: 'DJ Outback',
      nickname: 'The Desert Rose',
      style: 'Chill / Ambient',
      timeSlot: 'evening',
      catchphrases: [
        "Relax under the outback stars with JediTek Radio!",
        "Smooth sounds from the red centre!",
        "JediTek Radio - Your evening escape!",
        "This is DJ Outback, winding down your day!",
      ],
      avatar: '🌵',
    },
    {
      id: 'dj-midnight',
      name: 'DJ Midnight',
      nickname: 'The Night Owl',
      style: 'Lo-Fi / Synthwave',
      timeSlot: 'night',
      catchphrases: [
        "Night shift never sounded so good!",
        "JediTek Radio - Keeping you company through the night!",
        "Midnight vibes on JediTek Radio!",
        "This is DJ Midnight, your nocturnal companion!",
      ],
      avatar: '🦉',
    },
  ],
};

// ============================================================================
// JEDITEK CHANNELS
// ============================================================================

export const JEDITEK_CHANNELS: JediTekChannel[] = [
  {
    id: 'jeditek-main',
    name: 'JediTek Radio Main',
    tagline: "We've Got Your Groove!",
    description: 'The flagship JediTek Radio station - Top hits and feel-good music',
    genre: 'Top 40 / Pop',
    videoId: 'jfKfPfyJRdk', // Lofi Girl as placeholder
    logo: '📻',
    primaryColor: '#00BFFF',
    secondaryColor: '#1a1a2e',
    djName: 'DJ Jedi Master',
    frequency: '107.7 FM',
    isDefault: true,
  },
  {
    id: 'jeditek-chill',
    name: 'JediTek Chill',
    tagline: 'Relax and Unwind',
    description: 'Lo-fi beats and ambient sounds for relaxation',
    genre: 'Lo-Fi / Chill',
    videoId: 'jfKfPfyJRdk',
    logo: '🎵',
    primaryColor: '#8B5CF6',
    secondaryColor: '#1e1b4b',
    djName: 'DJ Outback',
    frequency: '107.7-2 FM',
    isDefault: false,
  },
  {
    id: 'jeditek-retro',
    name: 'JediTek Retro',
    tagline: 'Back to the Future',
    description: 'Synthwave and 80s classics',
    genre: 'Synthwave / Retro',
    videoId: '4xDzrJKXOOY',
    logo: '🕹️',
    primaryColor: '#FF6B6B',
    secondaryColor: '#2d1b4e',
    djName: 'DJ Midnight',
    frequency: '107.7-3 FM',
    isDefault: false,
  },
  {
    id: 'jeditek-jazz',
    name: 'JediTek Jazz Lounge',
    tagline: 'Smooth and Sophisticated',
    description: 'Jazz and lounge music for a refined atmosphere',
    genre: 'Jazz / Lounge',
    videoId: 'Dx5qFachd3A',
    logo: '🎷',
    primaryColor: '#F59E0B',
    secondaryColor: '#1c1917',
    djName: 'DJ Goldfields',
    frequency: '107.7-4 FM',
    isDefault: false,
  },
  {
    id: 'jeditek-classical',
    name: 'JediTek Classical',
    tagline: 'Timeless Elegance',
    description: 'Classical masterpieces for focus and calm',
    genre: 'Classical',
    videoId: 'mIYzp5rcTvU',
    logo: '🎻',
    primaryColor: '#10B981',
    secondaryColor: '#0f172a',
    djName: 'DJ Outback',
    frequency: '107.7-5 FM',
    isDefault: false,
  },
  {
    id: 'jeditek-hospital',
    name: 'JediTek Hospital Radio',
    tagline: 'Your Health, Our Music',
    description: 'Specially curated for patients and staff at Kalgoorlie Health Campus',
    genre: 'Easy Listening',
    videoId: 'lTRiuFIWV54',
    logo: '🏥',
    primaryColor: '#0077B6',
    secondaryColor: '#0c4a6e',
    djName: 'DJ Jedi Master',
    frequency: '107.7-H FM',
    isDefault: false,
  },
];

// ============================================================================
// DJ ANNOUNCEMENTS
// ============================================================================

export const DJ_ANNOUNCEMENTS: DJAnnouncement[] = [
  // Station IDs
  {
    id: 'station-id-1',
    type: 'station_id',
    text: "You're listening to JediTek Radio, 107.7 FM - We've got your groove!",
    duration: 5,
    priority: 1,
  },
  {
    id: 'station-id-2',
    type: 'station_id',
    text: "JediTek Radio - Broadcasting from the heart of the Goldfields!",
    duration: 4,
    priority: 1,
  },
  {
    id: 'station-id-3',
    type: 'station_id',
    text: "This is JediTek Radio - May the beats be with you!",
    duration: 4,
    priority: 1,
  },
  {
    id: 'station-id-4',
    type: 'station_id',
    text: "JediTek Radio 107.7 - Your galactic groove station!",
    duration: 4,
    priority: 1,
  },
  
  // Morning announcements
  {
    id: 'morning-1',
    type: 'intro',
    text: "Good morning Kalgoorlie! This is DJ Jedi Master starting your day right on JediTek Radio!",
    duration: 6,
    priority: 2,
    timeSlot: 'morning',
  },
  {
    id: 'morning-2',
    type: 'promo',
    text: "Rise and shine with JediTek Radio - Your morning energy boost!",
    duration: 4,
    priority: 3,
    timeSlot: 'morning',
  },
  
  // Afternoon announcements
  {
    id: 'afternoon-1',
    type: 'intro',
    text: "Good afternoon! DJ Goldfields here, bringing you golden hits on JediTek Radio!",
    duration: 5,
    priority: 2,
    timeSlot: 'afternoon',
  },
  {
    id: 'afternoon-2',
    type: 'transition',
    text: "Keep it locked on JediTek Radio - The hits keep coming!",
    duration: 3,
    priority: 3,
    timeSlot: 'afternoon',
  },
  
  // Evening announcements
  {
    id: 'evening-1',
    type: 'intro',
    text: "Good evening Goldfields! DJ Outback here to wind down your day on JediTek Radio!",
    duration: 5,
    priority: 2,
    timeSlot: 'evening',
  },
  {
    id: 'evening-2',
    type: 'transition',
    text: "Relax and unwind with JediTek Radio - Smooth sounds for your evening!",
    duration: 4,
    priority: 3,
    timeSlot: 'evening',
  },
  
  // Night announcements
  {
    id: 'night-1',
    type: 'intro',
    text: "Night owls unite! DJ Midnight keeping you company on JediTek Radio!",
    duration: 5,
    priority: 2,
    timeSlot: 'night',
  },
  {
    id: 'night-2',
    type: 'transition',
    text: "JediTek Radio - Your nocturnal companion through the night shift!",
    duration: 4,
    priority: 3,
    timeSlot: 'night',
  },
  
  // Hospital specific
  {
    id: 'hospital-1',
    type: 'promo',
    text: "JediTek Hospital Radio - Bringing comfort and music to Kalgoorlie Health Campus!",
    duration: 5,
    priority: 2,
  },
  {
    id: 'hospital-2',
    type: 'news',
    text: "Remember to stay hydrated and take your medications on time. JediTek Radio cares about your health!",
    duration: 6,
    priority: 4,
  },
  
  // Transitions
  {
    id: 'transition-1',
    type: 'transition',
    text: "More music coming up on JediTek Radio!",
    duration: 3,
    priority: 5,
  },
  {
    id: 'transition-2',
    type: 'transition',
    text: "Stay tuned to JediTek Radio!",
    duration: 2,
    priority: 5,
  },
  {
    id: 'transition-3',
    type: 'transition',
    text: "JediTek Radio - Non-stop music!",
    duration: 2,
    priority: 5,
  },
];

// ============================================================================
// SERVICE CLASS
// ============================================================================

class JediTekChannelService {
  private currentChannel: JediTekChannel;
  private currentDJ: DJPersonality;
  private listeners: Set<(channel: JediTekChannel) => void>;
  private announcementQueue: DJAnnouncement[];
  private announcementInterval: NodeJS.Timeout | null;

  constructor() {
    this.currentChannel = JEDITEK_CHANNELS.find(c => c.isDefault) || JEDITEK_CHANNELS[0];
    this.currentDJ = this.getDJForTimeSlot();
    this.listeners = new Set();
    this.announcementQueue = [];
    this.announcementInterval = null;
  }

  /**
   * Get current time slot based on hour
   */
  private getTimeSlot(): string {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  /**
   * Get DJ personality for current time slot
   */
  private getDJForTimeSlot(): DJPersonality {
    const timeSlot = this.getTimeSlot();
    return JEDITEK_BRANDING.djPersonalities.find(dj => dj.timeSlot === timeSlot) 
      || JEDITEK_BRANDING.djPersonalities[0];
  }

  /**
   * Get current channel
   */
  getCurrentChannel(): JediTekChannel {
    return { ...this.currentChannel };
  }

  /**
   * Get current DJ
   */
  getCurrentDJ(): DJPersonality {
    return { ...this.currentDJ };
  }

  /**
   * Get all channels
   */
  getChannels(): JediTekChannel[] {
    return [...JEDITEK_CHANNELS];
  }

  /**
   * Get branding info
   */
  getBranding(): StationBranding {
    return { ...JEDITEK_BRANDING };
  }

  /**
   * Switch channel
   */
  switchChannel(channelId: string): void {
    const channel = JEDITEK_CHANNELS.find(c => c.id === channelId);
    if (channel) {
      this.currentChannel = channel;
      this.notifyListeners();
    }
  }

  /**
   * Get next channel
   */
  nextChannel(): void {
    const currentIndex = JEDITEK_CHANNELS.findIndex(c => c.id === this.currentChannel.id);
    const nextIndex = (currentIndex + 1) % JEDITEK_CHANNELS.length;
    this.currentChannel = JEDITEK_CHANNELS[nextIndex];
    this.notifyListeners();
  }

  /**
   * Get previous channel
   */
  previousChannel(): void {
    const currentIndex = JEDITEK_CHANNELS.findIndex(c => c.id === this.currentChannel.id);
    const prevIndex = (currentIndex - 1 + JEDITEK_CHANNELS.length) % JEDITEK_CHANNELS.length;
    this.currentChannel = JEDITEK_CHANNELS[prevIndex];
    this.notifyListeners();
  }

  /**
   * Get random announcement for current time slot
   */
  getRandomAnnouncement(): DJAnnouncement {
    const timeSlot = this.getTimeSlot();
    const relevantAnnouncements = DJ_ANNOUNCEMENTS.filter(
      a => !a.timeSlot || a.timeSlot === timeSlot
    );
    return relevantAnnouncements[Math.floor(Math.random() * relevantAnnouncements.length)];
  }

  /**
   * Get DJ catchphrase
   */
  getDJCatchphrase(): string {
    const catchphrases = this.currentDJ.catchphrases;
    return catchphrases[Math.floor(Math.random() * catchphrases.length)];
  }

  /**
   * Start announcement rotation
   */
  startAnnouncements(intervalMs: number = 60000): void {
    if (this.announcementInterval) return;
    
    this.announcementInterval = setInterval(() => {
      const announcement = this.getRandomAnnouncement();
      this.announcementQueue.push(announcement);
    }, intervalMs);
  }

  /**
   * Stop announcement rotation
   */
  stopAnnouncements(): void {
    if (this.announcementInterval) {
      clearInterval(this.announcementInterval);
      this.announcementInterval = null;
    }
  }

  /**
   * Get next queued announcement
   */
  getNextAnnouncement(): DJAnnouncement | null {
    return this.announcementQueue.shift() || null;
  }

  /**
   * Add listener
   */
  addListener(listener: (channel: JediTekChannel) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach(l => l(this.currentChannel));
  }

  /**
   * Update DJ based on time
   */
  updateDJ(): void {
    this.currentDJ = this.getDJForTimeSlot();
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stopAnnouncements();
    this.listeners.clear();
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const jediTekChannelService = new JediTekChannelService();
export default jediTekChannelService;
