/**
 * TV Schedule Service
 * 
 * Time-based content scheduling for hospital TV terminals:
 * - Morning: News and health tips
 * - Afternoon: Music and entertainment
 * - Evening: Relaxation and calm content
 * - Night: Ambient and sleep-friendly content
 * - Emergency override capability
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ScheduleSlot {
  id: string;
  name: string;
  description: string;
  startHour: number;
  endHour: number;
  channelId: string;
  contentType: 'news' | 'music' | 'relaxation' | 'ambient' | 'emergency' | 'announcement';
  priority: number;
  icon: string;
  color: string;
}

export interface ScheduleOverride {
  id: string;
  type: 'emergency' | 'announcement' | 'special';
  message: string;
  channelId?: string;
  startTime: Date;
  endTime: Date;
  priority: number;
}

export interface CurrentProgram {
  slot: ScheduleSlot;
  timeRemaining: number;
  nextProgram: ScheduleSlot | null;
  isOverridden: boolean;
  override?: ScheduleOverride;
}

export interface ScheduleState {
  currentSlot: ScheduleSlot;
  currentProgram: CurrentProgram;
  schedule: ScheduleSlot[];
  overrides: ScheduleOverride[];
  isEmergencyMode: boolean;
}

export interface ScheduleListener {
  onSlotChange?: (slot: ScheduleSlot) => void;
  onOverrideStart?: (override: ScheduleOverride) => void;
  onOverrideEnd?: () => void;
  onEmergencyMode?: (active: boolean) => void;
}

// ============================================================================
// SCHEDULE DATA
// ============================================================================

export const TV_SCHEDULE: ScheduleSlot[] = [
  // Early Morning (5am - 7am)
  {
    id: 'early-morning',
    name: 'Early Morning Calm',
    description: 'Gentle wake-up music and ambient sounds',
    startHour: 5,
    endHour: 7,
    channelId: 'jeditek-classical',
    contentType: 'ambient',
    priority: 1,
    icon: '🌅',
    color: '#FCD34D',
  },
  // Morning (7am - 12pm)
  {
    id: 'morning-show',
    name: 'JediTek Morning Show',
    description: 'News, weather, and health tips to start your day',
    startHour: 7,
    endHour: 12,
    channelId: 'jeditek-main',
    contentType: 'news',
    priority: 1,
    icon: '☀️',
    color: '#F59E0B',
  },
  // Lunch (12pm - 2pm)
  {
    id: 'lunch-break',
    name: 'Lunch Break Hits',
    description: 'Upbeat music for the midday break',
    startHour: 12,
    endHour: 14,
    channelId: 'jeditek-main',
    contentType: 'music',
    priority: 1,
    icon: '🍽️',
    color: '#10B981',
  },
  // Afternoon (2pm - 5pm)
  {
    id: 'afternoon-vibes',
    name: 'Afternoon Vibes',
    description: 'Easy listening and classic hits',
    startHour: 14,
    endHour: 17,
    channelId: 'jeditek-jazz',
    contentType: 'music',
    priority: 1,
    icon: '🎵',
    color: '#3B82F6',
  },
  // Evening (5pm - 8pm)
  {
    id: 'evening-wind-down',
    name: 'Evening Wind Down',
    description: 'Relaxing music as the day ends',
    startHour: 17,
    endHour: 20,
    channelId: 'jeditek-chill',
    contentType: 'relaxation',
    priority: 1,
    icon: '🌆',
    color: '#8B5CF6',
  },
  // Night (8pm - 11pm)
  {
    id: 'night-lounge',
    name: 'Night Lounge',
    description: 'Smooth jazz and lounge music',
    startHour: 20,
    endHour: 23,
    channelId: 'jeditek-jazz',
    contentType: 'relaxation',
    priority: 1,
    icon: '🌙',
    color: '#6366F1',
  },
  // Late Night (11pm - 5am)
  {
    id: 'late-night-ambient',
    name: 'Late Night Ambient',
    description: 'Peaceful ambient sounds for rest',
    startHour: 23,
    endHour: 5,
    channelId: 'jeditek-chill',
    contentType: 'ambient',
    priority: 1,
    icon: '✨',
    color: '#1E3A8A',
  },
];

// Hospital-specific announcement slots
export const HOSPITAL_ANNOUNCEMENTS: ScheduleOverride[] = [
  {
    id: 'visiting-hours-start',
    type: 'announcement',
    message: 'Visiting hours have now begun. Welcome to Kalgoorlie Health Campus.',
    startTime: new Date(0, 0, 0, 10, 0), // 10:00 AM
    endTime: new Date(0, 0, 0, 10, 5), // 10:05 AM
    priority: 5,
  },
  {
    id: 'visiting-hours-end',
    type: 'announcement',
    message: 'Visiting hours will end in 15 minutes. Thank you for visiting.',
    startTime: new Date(0, 0, 0, 19, 45), // 7:45 PM
    endTime: new Date(0, 0, 0, 19, 50), // 7:50 PM
    priority: 5,
  },
  {
    id: 'meal-time-breakfast',
    type: 'announcement',
    message: 'Breakfast service is now available.',
    startTime: new Date(0, 0, 0, 7, 30), // 7:30 AM
    endTime: new Date(0, 0, 0, 7, 32), // 7:32 AM
    priority: 3,
  },
  {
    id: 'meal-time-lunch',
    type: 'announcement',
    message: 'Lunch service is now available.',
    startTime: new Date(0, 0, 0, 12, 0), // 12:00 PM
    endTime: new Date(0, 0, 0, 12, 2), // 12:02 PM
    priority: 3,
  },
  {
    id: 'meal-time-dinner',
    type: 'announcement',
    message: 'Dinner service is now available.',
    startTime: new Date(0, 0, 0, 17, 30), // 5:30 PM
    endTime: new Date(0, 0, 0, 17, 32), // 5:32 PM
    priority: 3,
  },
];

// ============================================================================
// SERVICE CLASS
// ============================================================================

class TVScheduleService {
  private schedule: ScheduleSlot[];
  private overrides: ScheduleOverride[];
  private currentSlot: ScheduleSlot;
  private activeOverride: ScheduleOverride | null;
  private isEmergencyMode: boolean;
  private listeners: Set<ScheduleListener>;
  private updateInterval: NodeJS.Timeout | null;

  constructor() {
    this.schedule = [...TV_SCHEDULE];
    this.overrides = [];
    this.currentSlot = this.getSlotForTime(new Date());
    this.activeOverride = null;
    this.isEmergencyMode = false;
    this.listeners = new Set();
    this.updateInterval = null;
  }

  /**
   * Get schedule slot for a given time
   */
  private getSlotForTime(time: Date): ScheduleSlot {
    const hour = time.getHours();
    
    // Handle late night slot that spans midnight
    const lateNightSlot = this.schedule.find(s => s.id === 'late-night-ambient');
    if (lateNightSlot && (hour >= 23 || hour < 5)) {
      return lateNightSlot;
    }
    
    // Find matching slot
    const slot = this.schedule.find(s => hour >= s.startHour && hour < s.endHour);
    return slot || this.schedule[0];
  }

  /**
   * Get next schedule slot
   */
  private getNextSlot(currentSlot: ScheduleSlot): ScheduleSlot {
    const currentIndex = this.schedule.findIndex(s => s.id === currentSlot.id);
    const nextIndex = (currentIndex + 1) % this.schedule.length;
    return this.schedule[nextIndex];
  }

  /**
   * Calculate time remaining in current slot
   */
  private getTimeRemaining(slot: ScheduleSlot): number {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    let endHour = slot.endHour;
    if (slot.endHour < slot.startHour) {
      // Handles overnight slots
      if (currentHour >= slot.startHour) {
        endHour = 24 + slot.endHour;
      }
    }
    
    const remainingMinutes = (endHour - currentHour) * 60 - currentMinute;
    return Math.max(0, remainingMinutes);
  }

  /**
   * Check for active overrides
   */
  private checkOverrides(): ScheduleOverride | null {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Check emergency mode first
    if (this.isEmergencyMode) {
      const emergencyOverride = this.overrides.find(o => o.type === 'emergency');
      if (emergencyOverride) return emergencyOverride;
    }
    
    // Check time-based overrides
    for (const override of this.overrides) {
      const startHour = override.startTime.getHours();
      const startMinute = override.startTime.getMinutes();
      const endHour = override.endTime.getHours();
      const endMinute = override.endTime.getMinutes();
      
      const currentTime = currentHour * 60 + currentMinute;
      const startTime = startHour * 60 + startMinute;
      const endTime = endHour * 60 + endMinute;
      
      if (currentTime >= startTime && currentTime < endTime) {
        return override;
      }
    }
    
    return null;
  }

  /**
   * Start schedule monitoring
   */
  start(): void {
    if (this.updateInterval) return;
    
    // Update every minute
    this.updateInterval = setInterval(() => {
      this.update();
    }, 60000);
    
    // Initial update
    this.update();
  }

  /**
   * Stop schedule monitoring
   */
  stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Update current state
   */
  private update(): void {
    const newSlot = this.getSlotForTime(new Date());
    const newOverride = this.checkOverrides();
    
    // Check for slot change
    if (newSlot.id !== this.currentSlot.id) {
      this.currentSlot = newSlot;
      this.notifySlotChange(newSlot);
    }
    
    // Check for override change
    if (newOverride?.id !== this.activeOverride?.id) {
      if (newOverride) {
        this.activeOverride = newOverride;
        this.notifyOverrideStart(newOverride);
      } else if (this.activeOverride) {
        this.activeOverride = null;
        this.notifyOverrideEnd();
      }
    }
  }

  /**
   * Get current state
   */
  getState(): ScheduleState {
    const override = this.checkOverrides();
    
    return {
      currentSlot: this.currentSlot,
      currentProgram: {
        slot: this.currentSlot,
        timeRemaining: this.getTimeRemaining(this.currentSlot),
        nextProgram: this.getNextSlot(this.currentSlot),
        isOverridden: !!override,
        override: override || undefined,
      },
      schedule: [...this.schedule],
      overrides: [...this.overrides],
      isEmergencyMode: this.isEmergencyMode,
    };
  }

  /**
   * Get current slot
   */
  getCurrentSlot(): ScheduleSlot {
    return { ...this.currentSlot };
  }

  /**
   * Get current program info
   */
  getCurrentProgram(): CurrentProgram {
    const override = this.checkOverrides();
    
    return {
      slot: this.currentSlot,
      timeRemaining: this.getTimeRemaining(this.currentSlot),
      nextProgram: this.getNextSlot(this.currentSlot),
      isOverridden: !!override,
      override: override || undefined,
    };
  }

  /**
   * Get full schedule
   */
  getSchedule(): ScheduleSlot[] {
    return [...this.schedule];
  }

  /**
   * Add a schedule override
   */
  addOverride(override: Omit<ScheduleOverride, 'id'>): string {
    const id = `override-${Date.now()}`;
    const newOverride: ScheduleOverride = { ...override, id };
    this.overrides.push(newOverride);
    this.update();
    return id;
  }

  /**
   * Remove a schedule override
   */
  removeOverride(overrideId: string): void {
    this.overrides = this.overrides.filter(o => o.id !== overrideId);
    this.update();
  }

  /**
   * Activate emergency mode
   */
  activateEmergencyMode(message: string): void {
    this.isEmergencyMode = true;
    
    const emergencyOverride: ScheduleOverride = {
      id: 'emergency-mode',
      type: 'emergency',
      message,
      startTime: new Date(),
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      priority: 10,
    };
    
    this.overrides = this.overrides.filter(o => o.type !== 'emergency');
    this.overrides.push(emergencyOverride);
    
    this.notifyEmergencyMode(true);
    this.update();
  }

  /**
   * Deactivate emergency mode
   */
  deactivateEmergencyMode(): void {
    this.isEmergencyMode = false;
    this.overrides = this.overrides.filter(o => o.type !== 'emergency');
    this.notifyEmergencyMode(false);
    this.update();
  }

  /**
   * Add hospital announcements
   */
  addHospitalAnnouncements(): void {
    HOSPITAL_ANNOUNCEMENTS.forEach(announcement => {
      if (!this.overrides.find(o => o.id === announcement.id)) {
        this.overrides.push(announcement);
      }
    });
  }

  /**
   * Get channel for current time
   */
  getCurrentChannelId(): string {
    const override = this.checkOverrides();
    if (override?.channelId) {
      return override.channelId;
    }
    return this.currentSlot.channelId;
  }

  /**
   * Add listener
   */
  addListener(listener: ScheduleListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify slot change
   */
  private notifySlotChange(slot: ScheduleSlot): void {
    this.listeners.forEach(l => l.onSlotChange?.(slot));
  }

  /**
   * Notify override start
   */
  private notifyOverrideStart(override: ScheduleOverride): void {
    this.listeners.forEach(l => l.onOverrideStart?.(override));
  }

  /**
   * Notify override end
   */
  private notifyOverrideEnd(): void {
    this.listeners.forEach(l => l.onOverrideEnd?.());
  }

  /**
   * Notify emergency mode change
   */
  private notifyEmergencyMode(active: boolean): void {
    this.listeners.forEach(l => l.onEmergencyMode?.(active));
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stop();
    this.listeners.clear();
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const tvScheduleService = new TVScheduleService();
export default tvScheduleService;
