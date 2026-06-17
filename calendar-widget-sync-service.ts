/**
 * Calendar Widget Sync Service
 * MediVac WACHS v8.7
 * 
 * Real-time calendar event synchronization to dashboard widgets
 * with animated transitions, countdown timers, and visual effects.
 */

export type WidgetType = 
  | 'upcoming-events' | 'today-agenda' | 'mini-calendar' | 'countdown-timer'
  | 'medication-tracker' | 'task-progress' | 'weekly-overview' | 'event-stream';

export type SyncStatus = 'synced' | 'syncing' | 'pending' | 'error' | 'offline';
export type AnimationType = 'fade' | 'slide' | 'scale' | 'bounce' | 'pulse' | 'glow' | 'shake' | 'flip';
export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low' | 'none';

export interface CalendarWidget {
  id: string;
  type: WidgetType;
  title: string;
  position: { row: number; col: number };
  size: 'small' | 'medium' | 'large' | 'full';
  events: SyncedEvent[];
  syncStatus: SyncStatus;
  lastSynced: number;
  refreshInterval: number;
  animations: WidgetAnimations;
  style: WidgetStyle;
  notifications: WidgetNotification[];
  countdown?: CountdownConfig;
}

export interface SyncedEvent {
  id: string;
  calendarEventId: string;
  title: string;
  startTime: number;
  endTime: number;
  type: string;
  color: string;
  icon: string;
  priority: PriorityLevel;
  isAllDay: boolean;
  location?: string;
  description?: string;
  reminders: number[];
  syncedAt: number;
  animation?: EventAnimation;
}

export interface EventAnimation {
  type: AnimationType;
  duration: number;
  delay: number;
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce' | 'elastic';
  repeat: boolean;
  intensity: number;
}

export interface WidgetAnimations {
  onSync: AnimationType;
  onNewEvent: AnimationType;
  onEventStart: AnimationType;
  onEventEnd: AnimationType;
  onCountdown: AnimationType;
  pulseInterval: number;
  glowColor: string;
  particleEffects: boolean;
}

export interface WidgetStyle {
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  shadowColor: string;
  shadowBlur: number;
  shadowOffset: { x: number; y: number };
  gradientColors?: string[];
  gradientDirection?: 'horizontal' | 'vertical' | 'diagonal';
  opacity: number;
  blur: number;
}

export interface WidgetNotification {
  id: string;
  eventId: string;
  type: 'badge' | 'banner' | 'toast' | 'pulse' | 'glow';
  message: string;
  timestamp: number;
  read: boolean;
  animation: AnimationType;
  sound?: string;
  haptic?: number[];
}

export interface CountdownConfig {
  targetEventId: string;
  showDays: boolean;
  showHours: boolean;
  showMinutes: boolean;
  showSeconds: boolean;
  urgentThreshold: number;
  criticalThreshold: number;
  completedAction: 'hide' | 'celebrate' | 'next-event';
  celebrationAnimation: AnimationType;
}

export interface MiniCalendarDay {
  date: Date;
  dayOfMonth: number;
  isToday: boolean;
  isCurrentMonth: boolean;
  isWeekend: boolean;
  eventCount: number;
  eventDots: { color: string; priority: PriorityLevel }[];
  hasUrgent: boolean;
}

export interface SyncConfig {
  autoSync: boolean;
  syncInterval: number;
  syncOnAppFocus: boolean;
  syncOnNetworkRestore: boolean;
  conflictResolution: 'local' | 'remote' | 'newest' | 'ask';
  offlineQueueSize: number;
  compressionEnabled: boolean;
  deltaSync: boolean;
}

export interface SyncAnalytics {
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  avgSyncTime: number;
  lastSyncTime: number;
  eventsAdded: number;
  eventsUpdated: number;
  eventsRemoved: number;
  bytesTransferred: number;
  offlineQueueLength: number;
}

// JEDI Widget Effects
export const WIDGET_EFFECTS = {
  syncPulse: { type: 'pulse' as AnimationType, duration: 500, color: '#1ABC9C' },
  newEventGlow: { type: 'glow' as AnimationType, duration: 1000, color: '#3498DB' },
  urgentShake: { type: 'shake' as AnimationType, duration: 300, color: '#E74C3C' },
  countdownBounce: { type: 'bounce' as AnimationType, duration: 200, color: '#F39C12' },
  completedCelebrate: { type: 'scale' as AnimationType, duration: 500, color: '#27AE60' },
  errorFlash: { type: 'fade' as AnimationType, duration: 150, color: '#E74C3C' },
} as const;

// JEDI Widget Sounds
export const WIDGET_SOUNDS = {
  sync: 'jedi-widget-sync',
  newEvent: 'jedi-widget-new',
  urgent: 'jedi-widget-urgent',
  countdown: 'jedi-widget-tick',
  complete: 'jedi-widget-complete',
  error: 'jedi-widget-error',
  notification: 'jedi-widget-notify',
} as const;

// JEDI Widget Haptics
export const WIDGET_HAPTICS = {
  sync: [50, 50, 100],
  newEvent: [100, 50, 100],
  urgent: [200, 100, 200, 100, 200],
  countdown: [30],
  complete: [150, 50, 200],
  error: [100, 50, 100, 50, 100],
} as const;

// Priority Colors
export const PRIORITY_COLORS: Record<PriorityLevel, { bg: string; border: string; text: string; glow: string }> = {
  critical: { bg: '#FEE2E2', border: '#EF4444', text: '#991B1B', glow: '#EF4444' },
  high: { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E', glow: '#F59E0B' },
  medium: { bg: '#DBEAFE', border: '#3B82F6', text: '#1E40AF', glow: '#3B82F6' },
  low: { bg: '#D1FAE5', border: '#10B981', text: '#065F46', glow: '#10B981' },
  none: { bg: '#F3F4F6', border: '#9CA3AF', text: '#374151', glow: '#9CA3AF' },
};

type Listener = () => void;

class CalendarWidgetSyncService {
  private widgets: Map<string, CalendarWidget> = new Map();
  private syncConfig: SyncConfig;
  private analytics: SyncAnalytics;
  private offlineQueue: SyncedEvent[] = [];
  private syncTimers: Map<string, ReturnType<typeof setInterval>> = new Map();
  private listeners: Set<Listener> = new Set();

  constructor() {
    this.syncConfig = this.getDefaultSyncConfig();
    this.analytics = this.getDefaultAnalytics();
    this.initializeDefaultWidgets();
  }

  private getDefaultSyncConfig(): SyncConfig {
    return {
      autoSync: true,
      syncInterval: 30000,
      syncOnAppFocus: true,
      syncOnNetworkRestore: true,
      conflictResolution: 'newest',
      offlineQueueSize: 100,
      compressionEnabled: true,
      deltaSync: true,
    };
  }

  private getDefaultAnalytics(): SyncAnalytics {
    return {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      avgSyncTime: 0,
      lastSyncTime: 0,
      eventsAdded: 0,
      eventsUpdated: 0,
      eventsRemoved: 0,
      bytesTransferred: 0,
      offlineQueueLength: 0,
    };
  }

  private getDefaultWidgetAnimations(): WidgetAnimations {
    return {
      onSync: 'pulse',
      onNewEvent: 'glow',
      onEventStart: 'bounce',
      onEventEnd: 'fade',
      onCountdown: 'pulse',
      pulseInterval: 2000,
      glowColor: '#1ABC9C',
      particleEffects: true,
    };
  }

  private getDefaultWidgetStyle(): WidgetStyle {
    return {
      backgroundColor: '#FFFFFF',
      borderColor: '#E5E7EB',
      borderWidth: 1,
      borderRadius: 16,
      shadowColor: '#000000',
      shadowBlur: 10,
      shadowOffset: { x: 0, y: 4 },
      gradientColors: ['#FFFFFF', '#F9FAFB'],
      gradientDirection: 'vertical',
      opacity: 1,
      blur: 0,
    };
  }

  private initializeDefaultWidgets(): void {
    const now = Date.now();
    const defaultWidgets: Omit<CalendarWidget, 'id'>[] = [
      {
        type: 'upcoming-events',
        title: 'Upcoming Events',
        position: { row: 0, col: 0 },
        size: 'medium',
        events: this.generateSampleEvents(5),
        syncStatus: 'synced',
        lastSynced: now,
        refreshInterval: 60000,
        animations: this.getDefaultWidgetAnimations(),
        style: { ...this.getDefaultWidgetStyle(), gradientColors: ['#EBF8FF', '#DBEAFE'] },
        notifications: [],
      },
      {
        type: 'today-agenda',
        title: "Today's Agenda",
        position: { row: 0, col: 1 },
        size: 'large',
        events: this.generateSampleEvents(8),
        syncStatus: 'synced',
        lastSynced: now,
        refreshInterval: 30000,
        animations: { ...this.getDefaultWidgetAnimations(), glowColor: '#3498DB' },
        style: { ...this.getDefaultWidgetStyle(), gradientColors: ['#F0FDF4', '#DCFCE7'] },
        notifications: [],
      },
      {
        type: 'mini-calendar',
        title: 'Calendar',
        position: { row: 1, col: 0 },
        size: 'small',
        events: [],
        syncStatus: 'synced',
        lastSynced: now,
        refreshInterval: 300000,
        animations: this.getDefaultWidgetAnimations(),
        style: { ...this.getDefaultWidgetStyle(), gradientColors: ['#FEF3C7', '#FDE68A'] },
        notifications: [],
      },
      {
        type: 'countdown-timer',
        title: 'Next Event',
        position: { row: 1, col: 1 },
        size: 'medium',
        events: this.generateSampleEvents(1),
        syncStatus: 'synced',
        lastSynced: now,
        refreshInterval: 1000,
        animations: { ...this.getDefaultWidgetAnimations(), onCountdown: 'bounce' },
        style: { ...this.getDefaultWidgetStyle(), gradientColors: ['#FDF2F8', '#FCE7F3'] },
        notifications: [],
        countdown: {
          targetEventId: '',
          showDays: true,
          showHours: true,
          showMinutes: true,
          showSeconds: true,
          urgentThreshold: 3600000,
          criticalThreshold: 900000,
          completedAction: 'celebrate',
          celebrationAnimation: 'scale',
        },
      },
      {
        type: 'medication-tracker',
        title: 'Medications',
        position: { row: 2, col: 0 },
        size: 'medium',
        events: this.generateMedicationEvents(4),
        syncStatus: 'synced',
        lastSynced: now,
        refreshInterval: 60000,
        animations: { ...this.getDefaultWidgetAnimations(), glowColor: '#E74C3C' },
        style: { ...this.getDefaultWidgetStyle(), gradientColors: ['#FEE2E2', '#FECACA'] },
        notifications: [],
      },
      {
        type: 'task-progress',
        title: 'Tasks',
        position: { row: 2, col: 1 },
        size: 'medium',
        events: this.generateTaskEvents(6),
        syncStatus: 'synced',
        lastSynced: now,
        refreshInterval: 120000,
        animations: this.getDefaultWidgetAnimations(),
        style: { ...this.getDefaultWidgetStyle(), gradientColors: ['#EDE9FE', '#DDD6FE'] },
        notifications: [],
      },
    ];

    defaultWidgets.forEach((widget, idx) => {
      const id = `widget-${idx}`;
      this.widgets.set(id, { ...widget, id });
    });
  }

  private generateSampleEvents(count: number): SyncedEvent[] {
    const types = ['meeting', 'appointment', 'event', 'reminder'];
    const colors = ['#3498DB', '#E74C3C', '#27AE60', '#F39C12', '#9B59B6'];
    const icons = ['📅', '🗓️', '⏰', '📌', '🎯'];
    const priorities: PriorityLevel[] = ['critical', 'high', 'medium', 'low', 'none'];
    const now = Date.now();

    return Array.from({ length: count }, (_, i) => ({
      id: `event-${Date.now()}-${i}`,
      calendarEventId: `cal-event-${i}`,
      title: `Sample Event ${i + 1}`,
      startTime: now + (i + 1) * 3600000,
      endTime: now + (i + 1) * 3600000 + 1800000,
      type: types[i % types.length],
      color: colors[i % colors.length],
      icon: icons[i % icons.length],
      priority: priorities[i % priorities.length],
      isAllDay: false,
      syncedAt: now,
      animation: {
        type: 'fade' as AnimationType,
        duration: 300,
        delay: i * 50,
        easing: 'ease-out',
        repeat: false,
        intensity: 1,
      },
    }));
  }

  private generateMedicationEvents(count: number): SyncedEvent[] {
    const medications = ['Aspirin', 'Metformin', 'Lisinopril', 'Vitamin D'];
    const now = Date.now();

    return Array.from({ length: count }, (_, i) => ({
      id: `med-${Date.now()}-${i}`,
      calendarEventId: `cal-med-${i}`,
      title: medications[i % medications.length],
      startTime: now + (i * 4 + 2) * 3600000,
      endTime: now + (i * 4 + 2) * 3600000 + 900000,
      type: 'medication',
      color: '#E74C3C',
      icon: '💊',
      priority: 'high' as PriorityLevel,
      isAllDay: false,
      description: `Take ${medications[i % medications.length]} with water`,
      syncedAt: now,
    }));
  }

  private generateTaskEvents(count: number): SyncedEvent[] {
    const tasks = ['Review documents', 'Call client', 'Submit report', 'Team meeting prep', 'Update records', 'Follow up'];
    const now = Date.now();

    return Array.from({ length: count }, (_, i) => ({
      id: `task-${Date.now()}-${i}`,
      calendarEventId: `cal-task-${i}`,
      title: tasks[i % tasks.length],
      startTime: now + i * 7200000,
      endTime: now + i * 7200000 + 3600000,
      type: 'task',
      color: '#9B59B6',
      icon: '✅',
      priority: (['high', 'medium', 'low'] as PriorityLevel[])[i % 3],
      isAllDay: false,
      syncedAt: now,
    }));
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getAllWidgets(): CalendarWidget[] {
    return Array.from(this.widgets.values());
  }

  getWidget(id: string): CalendarWidget | undefined {
    return this.widgets.get(id);
  }

  getWidgetsByType(type: WidgetType): CalendarWidget[] {
    return this.getAllWidgets().filter(w => w.type === type);
  }

  addWidget(widget: Omit<CalendarWidget, 'id' | 'syncStatus' | 'lastSynced' | 'notifications'>): CalendarWidget {
    const id = `widget-${Date.now()}`;
    const newWidget: CalendarWidget = {
      ...widget,
      id,
      syncStatus: 'pending',
      lastSynced: 0,
      notifications: [],
    };
    this.widgets.set(id, newWidget);
    this.notifyListeners();
    return newWidget;
  }

  updateWidget(id: string, updates: Partial<Omit<CalendarWidget, 'id'>>): CalendarWidget | undefined {
    const widget = this.widgets.get(id);
    if (widget) {
      const updated = { ...widget, ...updates };
      this.widgets.set(id, updated);
      this.notifyListeners();
      return updated;
    }
    return undefined;
  }

  removeWidget(id: string): boolean {
    const result = this.widgets.delete(id);
    if (result) {
      this.stopWidgetSync(id);
      this.notifyListeners();
    }
    return result;
  }

  moveWidget(id: string, position: { row: number; col: number }): boolean {
    const widget = this.widgets.get(id);
    if (widget) {
      widget.position = position;
      this.widgets.set(id, widget);
      this.notifyListeners();
      return true;
    }
    return false;
  }

  resizeWidget(id: string, size: CalendarWidget['size']): boolean {
    const widget = this.widgets.get(id);
    if (widget) {
      widget.size = size;
      this.widgets.set(id, widget);
      this.notifyListeners();
      return true;
    }
    return false;
  }

  syncWidget(id: string): { success: boolean; effect: typeof WIDGET_EFFECTS.syncPulse; sound: string; haptic: number[] } {
    const widget = this.widgets.get(id);
    if (!widget) {
      return { success: false, effect: WIDGET_EFFECTS.errorFlash, sound: WIDGET_SOUNDS.error, haptic: [...WIDGET_HAPTICS.error] };
    }

    const startTime = Date.now();
    widget.syncStatus = 'syncing';
    this.notifyListeners();

    // Simulate sync
    setTimeout(() => {
      widget.syncStatus = 'synced';
      widget.lastSynced = Date.now();
      this.analytics.totalSyncs++;
      this.analytics.successfulSyncs++;
      this.analytics.lastSyncTime = Date.now() - startTime;
      this.analytics.avgSyncTime = (this.analytics.avgSyncTime * (this.analytics.totalSyncs - 1) + this.analytics.lastSyncTime) / this.analytics.totalSyncs;
      this.widgets.set(id, widget);
      this.notifyListeners();
    }, 500);

    return {
      success: true,
      effect: WIDGET_EFFECTS.syncPulse,
      sound: WIDGET_SOUNDS.sync,
      haptic: [...WIDGET_HAPTICS.sync],
    };
  }

  syncAllWidgets(): { synced: number; effect: typeof WIDGET_EFFECTS.syncPulse } {
    let synced = 0;
    this.widgets.forEach((widget, id) => {
      this.syncWidget(id);
      synced++;
    });
    return { synced, effect: WIDGET_EFFECTS.syncPulse };
  }

  startWidgetSync(id: string): boolean {
    const widget = this.widgets.get(id);
    if (!widget) return false;

    if (this.syncTimers.has(id)) {
      clearInterval(this.syncTimers.get(id)!);
    }

    const timer = setInterval(() => {
      this.syncWidget(id);
    }, widget.refreshInterval);

    this.syncTimers.set(id, timer);
    return true;
  }

  stopWidgetSync(id: string): boolean {
    const timer = this.syncTimers.get(id);
    if (timer) {
      clearInterval(timer);
      this.syncTimers.delete(id);
      return true;
    }
    return false;
  }

  addEventToWidget(widgetId: string, event: Omit<SyncedEvent, 'id' | 'syncedAt'>): { event: SyncedEvent; effect: typeof WIDGET_EFFECTS.newEventGlow; sound: string; haptic: number[] } | null {
    const widget = this.widgets.get(widgetId);
    if (!widget) return null;

    const newEvent: SyncedEvent = {
      ...event,
      id: `event-${Date.now()}`,
      syncedAt: Date.now(),
      animation: {
        type: 'glow',
        duration: 1000,
        delay: 0,
        easing: 'ease-out',
        repeat: false,
        intensity: 1,
      },
    };

    widget.events.push(newEvent);
    this.analytics.eventsAdded++;
    this.widgets.set(widgetId, widget);
    this.notifyListeners();

    return {
      event: newEvent,
      effect: WIDGET_EFFECTS.newEventGlow,
      sound: WIDGET_SOUNDS.newEvent,
      haptic: [...WIDGET_HAPTICS.newEvent],
    };
  }

  removeEventFromWidget(widgetId: string, eventId: string): boolean {
    const widget = this.widgets.get(widgetId);
    if (!widget) return false;

    const idx = widget.events.findIndex(e => e.id === eventId);
    if (idx >= 0) {
      widget.events.splice(idx, 1);
      this.analytics.eventsRemoved++;
      this.widgets.set(widgetId, widget);
      this.notifyListeners();
      return true;
    }
    return false;
  }

  updateEventInWidget(widgetId: string, eventId: string, updates: Partial<SyncedEvent>): SyncedEvent | undefined {
    const widget = this.widgets.get(widgetId);
    if (!widget) return undefined;

    const event = widget.events.find(e => e.id === eventId);
    if (event) {
      Object.assign(event, updates, { syncedAt: Date.now() });
      this.analytics.eventsUpdated++;
      this.widgets.set(widgetId, widget);
      this.notifyListeners();
      return event;
    }
    return undefined;
  }

  getCountdown(widgetId: string): { days: number; hours: number; minutes: number; seconds: number; isUrgent: boolean; isCritical: boolean; effect: typeof WIDGET_EFFECTS.countdownBounce } | null {
    const widget = this.widgets.get(widgetId);
    if (!widget || widget.type !== 'countdown-timer' || widget.events.length === 0) return null;

    const nextEvent = widget.events.sort((a, b) => a.startTime - b.startTime)[0];
    const remaining = Math.max(0, nextEvent.startTime - Date.now());

    const days = Math.floor(remaining / 86400000);
    const hours = Math.floor((remaining % 86400000) / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);

    const isUrgent = remaining <= (widget.countdown?.urgentThreshold || 3600000);
    const isCritical = remaining <= (widget.countdown?.criticalThreshold || 900000);

    return {
      days,
      hours,
      minutes,
      seconds,
      isUrgent,
      isCritical,
      effect: isCritical ? WIDGET_EFFECTS.urgentShake : isUrgent ? WIDGET_EFFECTS.countdownBounce : WIDGET_EFFECTS.syncPulse,
    };
  }

  generateMiniCalendar(year: number, month: number): MiniCalendarDay[] {
    const days: MiniCalendarDay[] = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date();

    // Add days from previous month
    const startPadding = firstDay.getDay();
    for (let i = startPadding - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push(this.createMiniCalendarDay(date, false, today));
    }

    // Add days of current month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      days.push(this.createMiniCalendarDay(date, true, today));
    }

    // Add days from next month
    const endPadding = 42 - days.length;
    for (let i = 1; i <= endPadding; i++) {
      const date = new Date(year, month + 1, i);
      days.push(this.createMiniCalendarDay(date, false, today));
    }

    return days;
  }

  private createMiniCalendarDay(date: Date, isCurrentMonth: boolean, today: Date): MiniCalendarDay {
    const eventCount = Math.floor(Math.random() * 4);
    const priorities: PriorityLevel[] = ['critical', 'high', 'medium', 'low'];
    const colors = ['#E74C3C', '#F39C12', '#3498DB', '#27AE60'];

    return {
      date,
      dayOfMonth: date.getDate(),
      isToday: date.toDateString() === today.toDateString(),
      isCurrentMonth,
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
      eventCount,
      eventDots: Array.from({ length: Math.min(eventCount, 3) }, (_, i) => ({
        color: colors[i % colors.length],
        priority: priorities[i % priorities.length],
      })),
      hasUrgent: eventCount > 0 && Math.random() > 0.7,
    };
  }

  addNotification(widgetId: string, notification: Omit<WidgetNotification, 'id' | 'timestamp' | 'read'>): WidgetNotification | null {
    const widget = this.widgets.get(widgetId);
    if (!widget) return null;

    const newNotification: WidgetNotification = {
      ...notification,
      id: `notif-${Date.now()}`,
      timestamp: Date.now(),
      read: false,
    };

    widget.notifications.push(newNotification);
    this.widgets.set(widgetId, widget);
    this.notifyListeners();

    return newNotification;
  }

  markNotificationRead(widgetId: string, notificationId: string): boolean {
    const widget = this.widgets.get(widgetId);
    if (!widget) return false;

    const notification = widget.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.widgets.set(widgetId, widget);
      this.notifyListeners();
      return true;
    }
    return false;
  }

  getUnreadNotificationCount(widgetId?: string): number {
    if (widgetId) {
      const widget = this.widgets.get(widgetId);
      return widget?.notifications.filter(n => !n.read).length || 0;
    }
    return this.getAllWidgets().reduce((sum, w) => sum + w.notifications.filter(n => !n.read).length, 0);
  }

  updateWidgetStyle(id: string, style: Partial<WidgetStyle>): boolean {
    const widget = this.widgets.get(id);
    if (widget) {
      widget.style = { ...widget.style, ...style };
      this.widgets.set(id, widget);
      this.notifyListeners();
      return true;
    }
    return false;
  }

  updateWidgetAnimations(id: string, animations: Partial<WidgetAnimations>): boolean {
    const widget = this.widgets.get(id);
    if (widget) {
      widget.animations = { ...widget.animations, ...animations };
      this.widgets.set(id, widget);
      this.notifyListeners();
      return true;
    }
    return false;
  }

  getSyncConfig(): SyncConfig {
    return { ...this.syncConfig };
  }

  updateSyncConfig(updates: Partial<SyncConfig>): SyncConfig {
    this.syncConfig = { ...this.syncConfig, ...updates };
    this.notifyListeners();
    return this.syncConfig;
  }

  getAnalytics(): SyncAnalytics {
    this.analytics.offlineQueueLength = this.offlineQueue.length;
    return { ...this.analytics };
  }

  exportWidgetLayout(): string {
    const layout = {
      widgets: this.getAllWidgets().map(w => ({
        type: w.type,
        title: w.title,
        position: w.position,
        size: w.size,
        style: w.style,
        animations: w.animations,
        refreshInterval: w.refreshInterval,
        countdown: w.countdown,
      })),
      syncConfig: this.syncConfig,
      exportedAt: Date.now(),
    };
    return JSON.stringify(layout, null, 2);
  }

  importWidgetLayout(json: string): { success: boolean; widgetsImported: number } {
    try {
      const layout = JSON.parse(json);
      let imported = 0;

      this.widgets.clear();
      layout.widgets.forEach((w: Partial<CalendarWidget>, idx: number) => {
        const id = `widget-${Date.now()}-${idx}`;
        this.widgets.set(id, {
          id,
          type: w.type || 'upcoming-events',
          title: w.title || 'Widget',
          position: w.position || { row: 0, col: 0 },
          size: w.size || 'medium',
          events: [],
          syncStatus: 'pending',
          lastSynced: 0,
          refreshInterval: w.refreshInterval || 60000,
          animations: w.animations || this.getDefaultWidgetAnimations(),
          style: w.style || this.getDefaultWidgetStyle(),
          notifications: [],
          countdown: w.countdown,
        });
        imported++;
      });

      if (layout.syncConfig) {
        this.syncConfig = { ...this.syncConfig, ...layout.syncConfig };
      }

      this.notifyListeners();
      return { success: true, widgetsImported: imported };
    } catch {
      return { success: false, widgetsImported: 0 };
    }
  }

  reset(): void {
    this.syncTimers.forEach(timer => clearInterval(timer));
    this.syncTimers.clear();
    this.widgets.clear();
    this.offlineQueue = [];
    this.syncConfig = this.getDefaultSyncConfig();
    this.analytics = this.getDefaultAnalytics();
    this.initializeDefaultWidgets();
    this.notifyListeners();
  }
}

export const calendarWidgetSyncService = new CalendarWidgetSyncService();
