/**
 * Theme Scheduling Service for MediVac WACHS v8.4
 * Automatic time-based theme switching with shift profiles
 */

// Types
export type ThemeId = 'light' | 'dark' | 'high-contrast' | 'jedi' | 'medical-blue';

export interface ScheduleRule {
  id: string;
  name: string;
  themeId: ThemeId;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  daysOfWeek: number[]; // 0-6, Sunday = 0
  isEnabled: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShiftProfile {
  id: string;
  name: string;
  description: string;
  rules: ScheduleRule[];
  isActive: boolean;
  createdAt: Date;
}

export interface SunriseSunsetData {
  sunrise: string; // HH:mm
  sunset: string; // HH:mm
  latitude: number;
  longitude: number;
  lastUpdated: Date;
}

export interface ScheduleOverride {
  id: string;
  themeId: ThemeId;
  reason: string;
  expiresAt: Date | null;
  createdBy: string;
  createdAt: Date;
}

export interface TransitionNotification {
  id: string;
  fromTheme: ThemeId;
  toTheme: ThemeId;
  scheduledAt: Date;
  notifiedAt: Date | null;
  acknowledged: boolean;
}

export interface ScheduleAnalytics {
  totalRules: number;
  activeRules: number;
  totalTransitions: number;
  transitionsToday: number;
  mostUsedTheme: ThemeId;
  averageTransitionsPerDay: number;
  overrideCount: number;
  upcomingTransitions: TransitionNotification[];
}

// Default shift profiles
const defaultShiftProfiles: ShiftProfile[] = [
  {
    id: 'day-shift',
    name: 'Day Shift',
    description: 'Standard daytime hours with light theme',
    rules: [
      {
        id: 'day-shift-light',
        name: 'Day Light Theme',
        themeId: 'light',
        startTime: '06:00',
        endTime: '18:00',
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        isEnabled: true,
        priority: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: 'night-shift',
    name: 'Night Shift',
    description: 'Nighttime hours with dark theme to reduce eye strain',
    rules: [
      {
        id: 'night-shift-dark',
        name: 'Night Dark Theme',
        themeId: 'dark',
        startTime: '18:00',
        endTime: '06:00',
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        isEnabled: true,
        priority: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    isActive: false,
    createdAt: new Date(),
  },
  {
    id: 'jedi-command',
    name: 'JEDI Command',
    description: 'JEDI theme during command operations',
    rules: [
      {
        id: 'jedi-command-theme',
        name: 'JEDI Operations Theme',
        themeId: 'jedi',
        startTime: '00:00',
        endTime: '23:59',
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        isEnabled: true,
        priority: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    isActive: false,
    createdAt: new Date(),
  },
  {
    id: 'accessibility',
    name: 'Accessibility Mode',
    description: 'High contrast theme for accessibility needs',
    rules: [
      {
        id: 'accessibility-high-contrast',
        name: 'High Contrast Always',
        themeId: 'high-contrast',
        startTime: '00:00',
        endTime: '23:59',
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        isEnabled: true,
        priority: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    isActive: false,
    createdAt: new Date(),
  },
];

class ThemeSchedulingService {
  private profiles: ShiftProfile[] = [...defaultShiftProfiles];
  private customRules: ScheduleRule[] = [];
  private override: ScheduleOverride | null = null;
  private sunriseSunset: SunriseSunsetData | null = null;
  private notifications: TransitionNotification[] = [];
  private transitionHistory: { date: Date; fromTheme: ThemeId; toTheme: ThemeId }[] = [];
  private listeners: ((themeId: ThemeId) => void)[] = [];
  private checkInterval: ReturnType<typeof setInterval> | null = null;
  private currentTheme: ThemeId = 'light';

  constructor() {
    // Initialize with some sample transition history
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(6, 0, 0, 0);
      this.transitionHistory.push({
        date,
        fromTheme: 'dark',
        toTheme: 'light',
      });
      
      const eveningDate = new Date(date);
      eveningDate.setHours(18, 0, 0, 0);
      this.transitionHistory.push({
        date: eveningDate,
        fromTheme: 'light',
        toTheme: 'dark',
      });
    }
  }

  // Profile Management
  getAllProfiles(): ShiftProfile[] {
    return [...this.profiles];
  }

  getProfile(profileId: string): ShiftProfile | null {
    return this.profiles.find(p => p.id === profileId) || null;
  }

  getActiveProfile(): ShiftProfile | null {
    return this.profiles.find(p => p.isActive) || null;
  }

  activateProfile(profileId: string): void {
    this.profiles = this.profiles.map(p => ({
      ...p,
      isActive: p.id === profileId,
    }));
    this.checkAndApplyTheme();
  }

  deactivateAllProfiles(): void {
    this.profiles = this.profiles.map(p => ({
      ...p,
      isActive: false,
    }));
  }

  createProfile(profile: Omit<ShiftProfile, 'id' | 'createdAt'>): ShiftProfile {
    const newProfile: ShiftProfile = {
      ...profile,
      id: `profile-${Date.now()}`,
      createdAt: new Date(),
    };
    this.profiles.push(newProfile);
    return newProfile;
  }

  updateProfile(profileId: string, updates: Partial<ShiftProfile>): ShiftProfile | null {
    const index = this.profiles.findIndex(p => p.id === profileId);
    if (index === -1) return null;
    
    this.profiles[index] = {
      ...this.profiles[index],
      ...updates,
    };
    return this.profiles[index];
  }

  deleteProfile(profileId: string): boolean {
    const initialLength = this.profiles.length;
    this.profiles = this.profiles.filter(p => p.id !== profileId);
    return this.profiles.length < initialLength;
  }

  // Rule Management
  getAllRules(): ScheduleRule[] {
    const profileRules = this.profiles.flatMap(p => p.rules);
    return [...profileRules, ...this.customRules];
  }

  getActiveRules(): ScheduleRule[] {
    const activeProfile = this.getActiveProfile();
    const profileRules = activeProfile ? activeProfile.rules.filter(r => r.isEnabled) : [];
    const customActiveRules = this.customRules.filter(r => r.isEnabled);
    return [...profileRules, ...customActiveRules];
  }

  createRule(rule: Omit<ScheduleRule, 'id' | 'createdAt' | 'updatedAt'>): ScheduleRule {
    const newRule: ScheduleRule = {
      ...rule,
      id: `rule-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.customRules.push(newRule);
    return newRule;
  }

  updateRule(ruleId: string, updates: Partial<ScheduleRule>): ScheduleRule | null {
    // Check custom rules
    let index = this.customRules.findIndex(r => r.id === ruleId);
    if (index !== -1) {
      this.customRules[index] = {
        ...this.customRules[index],
        ...updates,
        updatedAt: new Date(),
      };
      return this.customRules[index];
    }
    
    // Check profile rules
    for (const profile of this.profiles) {
      index = profile.rules.findIndex(r => r.id === ruleId);
      if (index !== -1) {
        profile.rules[index] = {
          ...profile.rules[index],
          ...updates,
          updatedAt: new Date(),
        };
        return profile.rules[index];
      }
    }
    
    return null;
  }

  deleteRule(ruleId: string): boolean {
    const initialLength = this.customRules.length;
    this.customRules = this.customRules.filter(r => r.id !== ruleId);
    return this.customRules.length < initialLength;
  }

  // Sunrise/Sunset Detection
  setSunriseSunsetData(data: Omit<SunriseSunsetData, 'lastUpdated'>): void {
    this.sunriseSunset = {
      ...data,
      lastUpdated: new Date(),
    };
  }

  getSunriseSunsetData(): SunriseSunsetData | null {
    return this.sunriseSunset;
  }

  async fetchSunriseSunset(latitude: number, longitude: number): Promise<SunriseSunsetData> {
    // Simulate API call - in production would call sunrise-sunset.org API
    const now = new Date();
    const sunrise = new Date(now);
    sunrise.setHours(6, 30, 0, 0);
    const sunset = new Date(now);
    sunset.setHours(18, 30, 0, 0);
    
    const data: SunriseSunsetData = {
      sunrise: `${sunrise.getHours().toString().padStart(2, '0')}:${sunrise.getMinutes().toString().padStart(2, '0')}`,
      sunset: `${sunset.getHours().toString().padStart(2, '0')}:${sunset.getMinutes().toString().padStart(2, '0')}`,
      latitude,
      longitude,
      lastUpdated: new Date(),
    };
    
    this.sunriseSunset = data;
    return data;
  }

  // Override Management
  setOverride(themeId: ThemeId, reason: string, expiresAt: Date | null, createdBy: string): ScheduleOverride {
    this.override = {
      id: `override-${Date.now()}`,
      themeId,
      reason,
      expiresAt,
      createdBy,
      createdAt: new Date(),
    };
    this.applyTheme(themeId);
    return this.override;
  }

  getOverride(): ScheduleOverride | null {
    if (this.override && this.override.expiresAt && new Date() > this.override.expiresAt) {
      this.clearOverride();
      return null;
    }
    return this.override;
  }

  clearOverride(): void {
    this.override = null;
    this.checkAndApplyTheme();
  }

  // Theme Application
  private parseTime(timeStr: string): { hours: number; minutes: number } {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return { hours, minutes };
  }

  private isTimeInRange(startTime: string, endTime: string): boolean {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    const start = this.parseTime(startTime);
    const end = this.parseTime(endTime);
    const startMinutes = start.hours * 60 + start.minutes;
    const endMinutes = end.hours * 60 + end.minutes;
    
    if (startMinutes <= endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    } else {
      // Overnight range (e.g., 22:00 - 06:00)
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }
  }

  private isDayOfWeekActive(daysOfWeek: number[]): boolean {
    const today = new Date().getDay();
    return daysOfWeek.includes(today);
  }

  getScheduledTheme(): ThemeId {
    // Check override first
    const override = this.getOverride();
    if (override) {
      return override.themeId;
    }
    
    // Get active rules sorted by priority
    const activeRules = this.getActiveRules().sort((a, b) => b.priority - a.priority);
    
    for (const rule of activeRules) {
      if (this.isDayOfWeekActive(rule.daysOfWeek) && this.isTimeInRange(rule.startTime, rule.endTime)) {
        return rule.themeId;
      }
    }
    
    // Default to light theme
    return 'light';
  }

  private applyTheme(themeId: ThemeId): void {
    const previousTheme = this.currentTheme;
    this.currentTheme = themeId;
    
    if (previousTheme !== themeId) {
      this.transitionHistory.push({
        date: new Date(),
        fromTheme: previousTheme,
        toTheme: themeId,
      });
      
      // Notify listeners
      this.listeners.forEach(listener => listener(themeId));
    }
  }

  checkAndApplyTheme(): ThemeId {
    const scheduledTheme = this.getScheduledTheme();
    this.applyTheme(scheduledTheme);
    return scheduledTheme;
  }

  getCurrentTheme(): ThemeId {
    return this.currentTheme;
  }

  // Scheduling Control
  startScheduler(): void {
    if (this.checkInterval) return;
    
    this.checkAndApplyTheme();
    this.checkInterval = setInterval(() => {
      this.checkAndApplyTheme();
    }, 60000); // Check every minute
  }

  stopScheduler(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  isSchedulerRunning(): boolean {
    return this.checkInterval !== null;
  }

  // Notifications
  getUpcomingTransitions(hours: number = 24): TransitionNotification[] {
    const now = new Date();
    const upcoming: TransitionNotification[] = [];
    const activeRules = this.getActiveRules().sort((a, b) => a.priority - b.priority);
    
    for (let i = 0; i < hours; i++) {
      const checkTime = new Date(now);
      checkTime.setHours(checkTime.getHours() + i);
      
      for (const rule of activeRules) {
        const start = this.parseTime(rule.startTime);
        if (checkTime.getHours() === start.hours && checkTime.getMinutes() === start.minutes) {
          if (this.isDayOfWeekActive(rule.daysOfWeek)) {
            upcoming.push({
              id: `notification-${Date.now()}-${i}`,
              fromTheme: this.currentTheme,
              toTheme: rule.themeId,
              scheduledAt: checkTime,
              notifiedAt: null,
              acknowledged: false,
            });
          }
        }
      }
    }
    
    return upcoming;
  }

  acknowledgeNotification(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.acknowledged = true;
    }
  }

  // Event Listeners
  onThemeChange(callback: (themeId: ThemeId) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  // Preview and Testing
  previewThemeAtTime(time: string, dayOfWeek: number): ThemeId {
    const activeRules = this.getActiveRules().sort((a, b) => b.priority - a.priority);
    
    for (const rule of activeRules) {
      if (rule.daysOfWeek.includes(dayOfWeek)) {
        const { hours: startH, minutes: startM } = this.parseTime(rule.startTime);
        const { hours: endH, minutes: endM } = this.parseTime(rule.endTime);
        const { hours: checkH, minutes: checkM } = this.parseTime(time);
        
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;
        const checkMinutes = checkH * 60 + checkM;
        
        if (startMinutes <= endMinutes) {
          if (checkMinutes >= startMinutes && checkMinutes < endMinutes) {
            return rule.themeId;
          }
        } else {
          if (checkMinutes >= startMinutes || checkMinutes < endMinutes) {
            return rule.themeId;
          }
        }
      }
    }
    
    return 'light';
  }

  getSchedulePreview(dayOfWeek: number): { time: string; theme: ThemeId }[] {
    const preview: { time: string; theme: ThemeId }[] = [];
    
    for (let hour = 0; hour < 24; hour++) {
      const time = `${hour.toString().padStart(2, '0')}:00`;
      const theme = this.previewThemeAtTime(time, dayOfWeek);
      preview.push({ time, theme });
    }
    
    return preview;
  }

  // Analytics
  getAnalytics(): ScheduleAnalytics {
    const allRules = this.getAllRules();
    const activeRules = this.getActiveRules();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const transitionsToday = this.transitionHistory.filter(t => t.date >= today).length;
    
    // Calculate most used theme
    const themeCounts: Record<ThemeId, number> = {
      'light': 0,
      'dark': 0,
      'high-contrast': 0,
      'jedi': 0,
      'medical-blue': 0,
    };
    
    this.transitionHistory.forEach(t => {
      themeCounts[t.toTheme]++;
    });
    
    const mostUsedTheme = (Object.entries(themeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'light') as ThemeId;
    
    // Calculate average transitions per day
    const uniqueDays = new Set(this.transitionHistory.map(t => t.date.toDateString())).size;
    const averageTransitionsPerDay = uniqueDays > 0 ? this.transitionHistory.length / uniqueDays : 0;
    
    return {
      totalRules: allRules.length,
      activeRules: activeRules.length,
      totalTransitions: this.transitionHistory.length,
      transitionsToday,
      mostUsedTheme,
      averageTransitionsPerDay: Math.round(averageTransitionsPerDay * 10) / 10,
      overrideCount: this.override ? 1 : 0,
      upcomingTransitions: this.getUpcomingTransitions(12),
    };
  }

  getTransitionHistory(days: number = 7): { date: Date; fromTheme: ThemeId; toTheme: ThemeId }[] {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return this.transitionHistory.filter(t => t.date >= cutoff);
  }
}

export const themeSchedulingService = new ThemeSchedulingService();
