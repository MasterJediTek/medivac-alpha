/**
 * MediVac One - Push Notification Service
 * APNs (Apple) and FCM (Firebase) configuration and management
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ==========================================
// Types and Interfaces
// ==========================================

export interface NotificationChannel {
  id: string;
  name: string;
  description: string;
  importance: 'none' | 'min' | 'low' | 'default' | 'high' | 'max';
  sound?: string;
  vibration?: boolean;
  badge?: boolean;
  lightColor?: string;
  lockscreenVisibility?: 'public' | 'private' | 'secret';
}

export interface NotificationCategory {
  id: string;
  name: string;
  actions: NotificationAction[];
  intentIdentifiers?: string[];
  hiddenPreviewsBodyPlaceholder?: string;
  categorySummaryFormat?: string;
}

export interface NotificationAction {
  id: string;
  title: string;
  options?: {
    foreground?: boolean;
    destructive?: boolean;
    authenticationRequired?: boolean;
  };
  textInput?: {
    buttonTitle: string;
    placeholder: string;
  };
}

export interface NotificationPreferences {
  enabled: boolean;
  channels: Record<string, boolean>;
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string;
  };
  urgentOverride: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  badgeEnabled: boolean;
  previewsEnabled: boolean;
}

export interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  trigger: {
    type: 'date' | 'interval' | 'calendar';
    value: string | number;
    repeats?: boolean;
  };
  channelId?: string;
  categoryId?: string;
}

export interface NotificationPayload {
  id: string;
  title: string;
  body: string;
  subtitle?: string;
  data?: Record<string, unknown>;
  badge?: number;
  sound?: string;
  channelId?: string;
  categoryId?: string;
  threadId?: string;
  priority?: 'default' | 'high';
  ttl?: number;
  expiration?: number;
}

export interface APNsConfig {
  keyId: string;
  teamId: string;
  bundleId: string;
  environment: 'development' | 'production';
  topic: string;
  pushType: 'alert' | 'background' | 'voip' | 'complication' | 'fileprovider' | 'mdm';
}

export interface FCMConfig {
  projectId: string;
  apiKey: string;
  appId: string;
  messagingSenderId: string;
  measurementId?: string;
}

export interface PushNotificationConfig {
  apns: APNsConfig;
  fcm: FCMConfig;
  defaultChannel: string;
  channels: NotificationChannel[];
  categories: NotificationCategory[];
}

// ==========================================
// Default Configuration
// ==========================================

const DEFAULT_CHANNELS: NotificationChannel[] = [
  {
    id: 'critical_alerts',
    name: 'Critical Alerts',
    description: 'Emergency and critical patient alerts',
    importance: 'max',
    sound: 'critical_alert.wav',
    vibration: true,
    badge: true,
    lightColor: '#FF0000',
    lockscreenVisibility: 'public',
  },
  {
    id: 'patient_updates',
    name: 'Patient Updates',
    description: 'Patient status changes and updates',
    importance: 'high',
    sound: 'patient_update.wav',
    vibration: true,
    badge: true,
    lockscreenVisibility: 'private',
  },
  {
    id: 'lab_results',
    name: 'Lab Results',
    description: 'Laboratory and pathology results',
    importance: 'high',
    sound: 'lab_result.wav',
    vibration: true,
    badge: true,
    lockscreenVisibility: 'private',
  },
  {
    id: 'medication_reminders',
    name: 'Medication Reminders',
    description: 'Medication administration reminders',
    importance: 'high',
    sound: 'medication_reminder.wav',
    vibration: true,
    badge: true,
    lockscreenVisibility: 'private',
  },
  {
    id: 'appointments',
    name: 'Appointments',
    description: 'Appointment reminders and updates',
    importance: 'default',
    sound: 'appointment.wav',
    vibration: true,
    badge: true,
    lockscreenVisibility: 'private',
  },
  {
    id: 'messages',
    name: 'Messages',
    description: 'Direct messages and communications',
    importance: 'default',
    sound: 'message.wav',
    vibration: true,
    badge: true,
    lockscreenVisibility: 'private',
  },
  {
    id: 'gp_integration',
    name: 'GP Integration',
    description: 'GP record transfers and updates',
    importance: 'default',
    sound: 'gp_transfer.wav',
    vibration: true,
    badge: true,
    lockscreenVisibility: 'private',
  },
  {
    id: 'system',
    name: 'System',
    description: 'System updates and maintenance',
    importance: 'low',
    vibration: false,
    badge: false,
    lockscreenVisibility: 'public',
  },
];

const DEFAULT_CATEGORIES: NotificationCategory[] = [
  {
    id: 'critical_alert',
    name: 'Critical Alert',
    actions: [
      { id: 'acknowledge', title: 'Acknowledge', options: { foreground: true, authenticationRequired: true } },
      { id: 'view_patient', title: 'View Patient', options: { foreground: true } },
      { id: 'call_code', title: 'Call Code', options: { foreground: true, destructive: true } },
    ],
  },
  {
    id: 'patient_update',
    name: 'Patient Update',
    actions: [
      { id: 'view', title: 'View', options: { foreground: true } },
      { id: 'dismiss', title: 'Dismiss' },
    ],
  },
  {
    id: 'lab_result',
    name: 'Lab Result',
    actions: [
      { id: 'view_results', title: 'View Results', options: { foreground: true } },
      { id: 'mark_reviewed', title: 'Mark Reviewed' },
      { id: 'add_note', title: 'Add Note', textInput: { buttonTitle: 'Send', placeholder: 'Enter note...' } },
    ],
  },
  {
    id: 'medication_due',
    name: 'Medication Due',
    actions: [
      { id: 'administer', title: 'Administered', options: { foreground: true, authenticationRequired: true } },
      { id: 'delay_15', title: 'Delay 15 min' },
      { id: 'skip', title: 'Skip', options: { destructive: true } },
    ],
  },
  {
    id: 'appointment_reminder',
    name: 'Appointment Reminder',
    actions: [
      { id: 'view', title: 'View', options: { foreground: true } },
      { id: 'check_in', title: 'Check In' },
      { id: 'reschedule', title: 'Reschedule', options: { foreground: true } },
    ],
  },
  {
    id: 'message',
    name: 'Message',
    actions: [
      { id: 'reply', title: 'Reply', textInput: { buttonTitle: 'Send', placeholder: 'Type a message...' } },
      { id: 'view', title: 'View', options: { foreground: true } },
      { id: 'mark_read', title: 'Mark Read' },
    ],
  },
  {
    id: 'gp_transfer',
    name: 'GP Transfer',
    actions: [
      { id: 'view_transfer', title: 'View Transfer', options: { foreground: true } },
      { id: 'approve', title: 'Approve', options: { authenticationRequired: true } },
      { id: 'reject', title: 'Reject', options: { destructive: true } },
    ],
  },
];

// ==========================================
// Push Notification Service
// ==========================================

class PushNotificationService {
  private config: PushNotificationConfig = {
    apns: {
      keyId: 'XXXXXXXXXX',
      teamId: 'XXXXXXXXXX',
      bundleId: 'space.manus.medivac.one',
      environment: 'production',
      topic: 'space.manus.medivac.one',
      pushType: 'alert',
    },
    fcm: {
      projectId: 'medivac-one',
      apiKey: 'AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      appId: '1:000000000000:android:0000000000000000000000',
      messagingSenderId: '000000000000',
      measurementId: 'G-XXXXXXXXXX',
    },
    defaultChannel: 'patient_updates',
    channels: DEFAULT_CHANNELS,
    categories: DEFAULT_CATEGORIES,
  };

  private preferences: NotificationPreferences = {
    enabled: true,
    channels: Object.fromEntries(DEFAULT_CHANNELS.map(c => [c.id, true])),
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '07:00',
    },
    urgentOverride: true,
    soundEnabled: true,
    vibrationEnabled: true,
    badgeEnabled: true,
    previewsEnabled: true,
  };

  private deviceToken: string | null = null;
  private scheduledNotifications: ScheduledNotification[] = [];
  private notificationHistory: NotificationPayload[] = [];

  constructor() {
    this.loadState();
  }

  private async loadState(): Promise<void> {
    try {
      const [prefsData, tokenData, scheduledData] = await Promise.all([
        AsyncStorage.getItem('notification_preferences'),
        AsyncStorage.getItem('device_push_token'),
        AsyncStorage.getItem('scheduled_notifications'),
      ]);

      if (prefsData) this.preferences = { ...this.preferences, ...JSON.parse(prefsData) };
      if (tokenData) this.deviceToken = tokenData;
      if (scheduledData) this.scheduledNotifications = JSON.parse(scheduledData);
    } catch (error) {
      console.error('Failed to load notification state:', error);
    }
  }

  private async saveState(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem('notification_preferences', JSON.stringify(this.preferences)),
        AsyncStorage.setItem('scheduled_notifications', JSON.stringify(this.scheduledNotifications)),
      ]);
    } catch (error) {
      console.error('Failed to save notification state:', error);
    }
  }

  // ==========================================
  // Configuration
  // ==========================================

  getConfig(): PushNotificationConfig {
    return { ...this.config };
  }

  getAPNsConfig(): APNsConfig {
    return { ...this.config.apns };
  }

  getFCMConfig(): FCMConfig {
    return { ...this.config.fcm };
  }

  async updateAPNsConfig(updates: Partial<APNsConfig>): Promise<void> {
    this.config.apns = { ...this.config.apns, ...updates };
  }

  async updateFCMConfig(updates: Partial<FCMConfig>): Promise<void> {
    this.config.fcm = { ...this.config.fcm, ...updates };
  }

  // ==========================================
  // Channels
  // ==========================================

  getChannels(): NotificationChannel[] {
    return [...this.config.channels];
  }

  getChannel(id: string): NotificationChannel | undefined {
    return this.config.channels.find(c => c.id === id);
  }

  async createChannel(channel: NotificationChannel): Promise<void> {
    const existing = this.config.channels.findIndex(c => c.id === channel.id);
    if (existing >= 0) {
      this.config.channels[existing] = channel;
    } else {
      this.config.channels.push(channel);
    }
    this.preferences.channels[channel.id] = true;
    await this.saveState();
  }

  async deleteChannel(id: string): Promise<boolean> {
    const index = this.config.channels.findIndex(c => c.id === id);
    if (index < 0) return false;

    this.config.channels.splice(index, 1);
    delete this.preferences.channels[id];
    await this.saveState();
    return true;
  }

  // ==========================================
  // Categories
  // ==========================================

  getCategories(): NotificationCategory[] {
    return [...this.config.categories];
  }

  getCategory(id: string): NotificationCategory | undefined {
    return this.config.categories.find(c => c.id === id);
  }

  async createCategory(category: NotificationCategory): Promise<void> {
    const existing = this.config.categories.findIndex(c => c.id === category.id);
    if (existing >= 0) {
      this.config.categories[existing] = category;
    } else {
      this.config.categories.push(category);
    }
  }

  // ==========================================
  // Preferences
  // ==========================================

  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  async updatePreferences(updates: Partial<NotificationPreferences>): Promise<void> {
    this.preferences = { ...this.preferences, ...updates };
    await this.saveState();
  }

  async setChannelEnabled(channelId: string, enabled: boolean): Promise<void> {
    this.preferences.channels[channelId] = enabled;
    await this.saveState();
  }

  isChannelEnabled(channelId: string): boolean {
    return this.preferences.channels[channelId] ?? true;
  }

  // ==========================================
  // Device Token Management
  // ==========================================

  async registerDeviceToken(token: string): Promise<boolean> {
    this.deviceToken = token;
    await AsyncStorage.setItem('device_push_token', token);

    // In real implementation, send token to server
    console.log(`Device token registered: ${token.substring(0, 20)}...`);
    return true;
  }

  async unregisterDeviceToken(): Promise<void> {
    this.deviceToken = null;
    await AsyncStorage.removeItem('device_push_token');
  }

  getDeviceToken(): string | null {
    return this.deviceToken;
  }

  // ==========================================
  // Notification Scheduling
  // ==========================================

  async scheduleNotification(notification: Omit<ScheduledNotification, 'id'>): Promise<string> {
    const scheduled: ScheduledNotification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    this.scheduledNotifications.push(scheduled);
    await this.saveState();

    return scheduled.id;
  }

  async cancelScheduledNotification(id: string): Promise<boolean> {
    const index = this.scheduledNotifications.findIndex(n => n.id === id);
    if (index < 0) return false;

    this.scheduledNotifications.splice(index, 1);
    await this.saveState();
    return true;
  }

  async cancelAllScheduledNotifications(): Promise<void> {
    this.scheduledNotifications = [];
    await this.saveState();
  }

  getScheduledNotifications(): ScheduledNotification[] {
    return [...this.scheduledNotifications];
  }

  // ==========================================
  // Notification Display
  // ==========================================

  shouldShowNotification(channelId: string): boolean {
    if (!this.preferences.enabled) return false;
    if (!this.preferences.channels[channelId]) return false;

    // Check quiet hours
    if (this.preferences.quietHours.enabled) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const { start, end } = this.preferences.quietHours;

      const isInQuietHours = start < end
        ? currentTime >= start && currentTime < end
        : currentTime >= start || currentTime < end;

      if (isInQuietHours) {
        // Check if urgent override applies
        const channel = this.getChannel(channelId);
        if (!this.preferences.urgentOverride || channel?.importance !== 'max') {
          return false;
        }
      }
    }

    return true;
  }

  async displayLocalNotification(payload: Omit<NotificationPayload, 'id'>): Promise<string> {
    const notification: NotificationPayload = {
      ...payload,
      id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      channelId: payload.channelId || this.config.defaultChannel,
    };

    if (!this.shouldShowNotification(notification.channelId!)) {
      return notification.id;
    }

    // Store in history
    this.notificationHistory.unshift(notification);
    if (this.notificationHistory.length > 100) {
      this.notificationHistory = this.notificationHistory.slice(0, 100);
    }

    console.log(`Local notification displayed: ${notification.title}`);
    return notification.id;
  }

  // ==========================================
  // Notification History
  // ==========================================

  getNotificationHistory(): NotificationPayload[] {
    return [...this.notificationHistory];
  }

  async clearNotificationHistory(): Promise<void> {
    this.notificationHistory = [];
  }

  // ==========================================
  // Platform-specific Configuration
  // ==========================================

  getPlatformConfig(): {
    platform: string;
    provider: 'apns' | 'fcm';
    config: APNsConfig | FCMConfig;
  } {
    const platform = Platform.OS;
    if (platform === 'ios') {
      return {
        platform: 'ios',
        provider: 'apns',
        config: this.config.apns,
      };
    }
    return {
      platform: platform === 'android' ? 'android' : 'web',
      provider: 'fcm',
      config: this.config.fcm,
    };
  }

  // ==========================================
  // Badge Management
  // ==========================================

  async setBadgeCount(count: number): Promise<void> {
    if (!this.preferences.badgeEnabled) return;
    // In real implementation, this would set the app badge
    console.log(`Badge count set to: ${count}`);
  }

  async clearBadge(): Promise<void> {
    await this.setBadgeCount(0);
  }

  // ==========================================
  // TestFlight / Beta Configuration
  // ==========================================

  getBetaTestingConfig(): {
    testFlight: {
      enabled: boolean;
      betaAppReviewInfo: {
        contactEmail: string;
        contactPhone: string;
        contactFirstName: string;
        contactLastName: string;
        demoAccountName?: string;
        demoAccountPassword?: string;
        notes?: string;
      };
      betaGroups: Array<{
        name: string;
        isInternal: boolean;
        maxTesters: number;
      }>;
    };
    playStore: {
      internalTesting: {
        enabled: boolean;
        maxTesters: number;
      };
      closedTesting: {
        enabled: boolean;
        tracks: string[];
      };
      openTesting: {
        enabled: boolean;
        maxTesters: number;
      };
    };
  } {
    return {
      testFlight: {
        enabled: true,
        betaAppReviewInfo: {
          contactEmail: 'beta@medivac.one',
          contactPhone: '+61 7 3000 0000',
          contactFirstName: 'MediVac',
          contactLastName: 'Support',
          demoAccountName: 'demo@medivac.one',
          demoAccountPassword: 'BetaTest2024!',
          notes: 'MediVac One is a virtual hospital management system. Use the demo account to test all features including patient management, CPOE, and GP integration.',
        },
        betaGroups: [
          { name: 'Internal Testers', isInternal: true, maxTesters: 100 },
          { name: 'Hospital Staff', isInternal: false, maxTesters: 1000 },
          { name: 'GP Partners', isInternal: false, maxTesters: 500 },
          { name: 'Public Beta', isInternal: false, maxTesters: 10000 },
        ],
      },
      playStore: {
        internalTesting: {
          enabled: true,
          maxTesters: 100,
        },
        closedTesting: {
          enabled: true,
          tracks: ['alpha', 'beta'],
        },
        openTesting: {
          enabled: true,
          maxTesters: 10000,
        },
      },
    };
  }

  // ==========================================
  // Crash Reporting Integration
  // ==========================================

  getCrashReportingConfig(): {
    enabled: boolean;
    providers: Array<{
      name: string;
      enabled: boolean;
      config: Record<string, unknown>;
    }>;
  } {
    return {
      enabled: true,
      providers: [
        {
          name: 'Sentry',
          enabled: true,
          config: {
            dsn: 'https://xxxxx@sentry.io/xxxxx',
            environment: 'production',
            tracesSampleRate: 0.1,
            attachStacktrace: true,
            enableAutoSessionTracking: true,
          },
        },
        {
          name: 'Firebase Crashlytics',
          enabled: true,
          config: {
            enabled: true,
            nativeExceptionReporting: true,
            jsExceptionReporting: true,
          },
        },
      ],
    };
  }

  // ==========================================
  // Analytics Configuration
  // ==========================================

  getAnalyticsConfig(): {
    enabled: boolean;
    providers: Array<{
      name: string;
      enabled: boolean;
      events: string[];
    }>;
  } {
    return {
      enabled: true,
      providers: [
        {
          name: 'Firebase Analytics',
          enabled: true,
          events: [
            'app_open',
            'screen_view',
            'login',
            'patient_view',
            'order_created',
            'lab_result_viewed',
            'gp_transfer_initiated',
            'notification_received',
            'notification_opened',
          ],
        },
        {
          name: 'Mixpanel',
          enabled: true,
          events: [
            'user_action',
            'feature_usage',
            'error_occurred',
            'performance_metric',
          ],
        },
      ],
    };
  }

  // ==========================================
  // Statistics
  // ==========================================

  getStatistics(): {
    totalScheduled: number;
    totalHistory: number;
    enabledChannels: number;
    totalChannels: number;
    deviceRegistered: boolean;
  } {
    return {
      totalScheduled: this.scheduledNotifications.length,
      totalHistory: this.notificationHistory.length,
      enabledChannels: Object.values(this.preferences.channels).filter(Boolean).length,
      totalChannels: this.config.channels.length,
      deviceRegistered: !!this.deviceToken,
    };
  }
}

export const pushNotifications = new PushNotificationService();
