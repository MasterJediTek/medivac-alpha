/**
 * CI/CD Teams Notification Service
 * Microsoft Teams integration for build status notifications
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export type BuildStatus = 'queued' | 'building' | 'testing' | 'uploading' | 'ready' | 'failed' | 'cancelled';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';
export type CardTheme = 'default' | 'success' | 'warning' | 'error' | 'info';

export interface TeamsChannel {
  id: string;
  name: string;
  webhookUrl: string;
  teamId: string;
  teamName: string;
  isActive: boolean;
  notifyOn: BuildStatus[];
  mentionOnFailure: boolean;
  mentionUsers: string[];
  createdAt: string;
  createdBy: string;
}

export interface TeamsNotification {
  id: string;
  channelId: string;
  buildId: string;
  status: BuildStatus;
  title: string;
  message: string;
  cardTheme: CardTheme;
  facts: { name: string; value: string }[];
  actions: { type: string; name: string; url: string }[];
  mentions: string[];
  sentAt: string;
  deliveryStatus: 'pending' | 'sent' | 'failed' | 'retrying';
  retryCount: number;
  errorMessage?: string;
  threadId?: string;
}

export interface NotificationPreference {
  odId: string;
  odName: string;
  email: string;
  receiveNotifications: boolean;
  notifyOnSuccess: boolean;
  notifyOnFailure: boolean;
  notifyOnStart: boolean;
  mentionOnFailure: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart?: string; // HH:mm
  quietHoursEnd?: string; // HH:mm
  preferredChannels: string[];
}

export interface NotificationThread {
  id: string;
  buildId: string;
  channelId: string;
  startedAt: string;
  lastUpdated: string;
  notificationIds: string[];
  status: 'active' | 'completed' | 'failed';
}

export interface TeamsAnalytics {
  totalNotifications: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  deliveryRate: number;
  averageDeliveryTime: number;
  byChannel: Record<string, { sent: number; failed: number }>;
  byStatus: Record<BuildStatus, number>;
  mostActiveChannels: { channelId: string; name: string; count: number }[];
}

// Storage keys
const STORAGE_KEYS = {
  CHANNELS: '@medivac_teams_channels',
  NOTIFICATIONS: '@medivac_teams_notifications',
  PREFERENCES: '@medivac_teams_preferences',
  THREADS: '@medivac_teams_threads',
};

// Default channel configurations
const DEFAULT_CHANNELS: Omit<TeamsChannel, 'id' | 'createdAt'>[] = [
  {
    name: 'Build Notifications',
    webhookUrl: 'https://outlook.office.com/webhook/medivac-builds',
    teamId: 'team_dev',
    teamName: 'MediVac Development',
    isActive: true,
    notifyOn: ['queued', 'building', 'ready', 'failed'],
    mentionOnFailure: true,
    mentionUsers: ['dev-lead@medivac.one', 'qa-lead@medivac.one'],
    createdBy: 'system',
  },
  {
    name: 'Release Channel',
    webhookUrl: 'https://outlook.office.com/webhook/medivac-releases',
    teamId: 'team_release',
    teamName: 'MediVac Releases',
    isActive: true,
    notifyOn: ['ready', 'failed'],
    mentionOnFailure: true,
    mentionUsers: ['release-manager@medivac.one'],
    createdBy: 'system',
  },
  {
    name: 'QA Testing',
    webhookUrl: 'https://outlook.office.com/webhook/medivac-qa',
    teamId: 'team_qa',
    teamName: 'MediVac QA',
    isActive: true,
    notifyOn: ['testing', 'ready', 'failed'],
    mentionOnFailure: false,
    mentionUsers: [],
    createdBy: 'system',
  },
  {
    name: 'JEDI Masters',
    webhookUrl: 'https://outlook.office.com/webhook/jedi-masters',
    teamId: 'team_jedi',
    teamName: 'JEDI Masters Council',
    isActive: true,
    notifyOn: ['ready', 'failed'],
    mentionOnFailure: true,
    mentionUsers: ['master.yoda@jeditek.com', 'master.windu@jeditek.com'],
    createdBy: 'system',
  },
];

// Event types
type TeamsEventType = 
  | 'notification_sent'
  | 'notification_failed'
  | 'channel_created'
  | 'channel_updated'
  | 'channel_deleted'
  | 'preference_updated';

type TeamsEventCallback = (data: any) => void;

class CICDTeamsNotificationService {
  private channels: TeamsChannel[] = [];
  private notifications: TeamsNotification[] = [];
  private preferences: NotificationPreference[] = [];
  private threads: NotificationThread[] = [];
  private listeners: Map<TeamsEventType, Set<TeamsEventCallback>> = new Map();
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    await this.loadData();
    this.initializeDefaultChannels();
    this.initialized = true;
  }

  private async loadData(): Promise<void> {
    try {
      const [channelsData, notificationsData, preferencesData, threadsData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.CHANNELS),
        AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS),
        AsyncStorage.getItem(STORAGE_KEYS.PREFERENCES),
        AsyncStorage.getItem(STORAGE_KEYS.THREADS),
      ]);

      if (channelsData) this.channels = JSON.parse(channelsData);
      if (notificationsData) this.notifications = JSON.parse(notificationsData);
      if (preferencesData) this.preferences = JSON.parse(preferencesData);
      if (threadsData) this.threads = JSON.parse(threadsData);
    } catch (error) {
      console.error('Failed to load Teams notification data:', error);
    }
  }

  private async saveData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.CHANNELS, JSON.stringify(this.channels)),
        AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(this.notifications)),
        AsyncStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(this.preferences)),
        AsyncStorage.setItem(STORAGE_KEYS.THREADS, JSON.stringify(this.threads)),
      ]);
    } catch (error) {
      console.error('Failed to save Teams notification data:', error);
    }
  }

  private initializeDefaultChannels(): void {
    if (this.channels.length === 0) {
      const now = new Date().toISOString();
      this.channels = DEFAULT_CHANNELS.map((c, index) => ({
        ...c,
        id: `channel_teams_${index + 1}`,
        createdAt: now,
      }));
      this.saveData();
    }
  }

  // Event handling
  on(event: TeamsEventType, callback: TeamsEventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: TeamsEventType, callback: TeamsEventCallback): void {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: TeamsEventType, data: any): void {
    this.listeners.get(event)?.forEach(callback => callback(data));
  }

  // Channel management
  async getChannels(filter?: { isActive?: boolean; teamId?: string }): Promise<TeamsChannel[]> {
    let result = [...this.channels];

    if (filter?.isActive !== undefined) {
      result = result.filter(c => c.isActive === filter.isActive);
    }
    if (filter?.teamId) {
      result = result.filter(c => c.teamId === filter.teamId);
    }

    return result;
  }

  async getChannel(channelId: string): Promise<TeamsChannel | null> {
    return this.channels.find(c => c.id === channelId) || null;
  }

  async createChannel(channel: Omit<TeamsChannel, 'id' | 'createdAt'>): Promise<TeamsChannel> {
    const newChannel: TeamsChannel = {
      ...channel,
      id: `channel_teams_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };

    this.channels.push(newChannel);
    await this.saveData();
    this.emit('channel_created', newChannel);

    return newChannel;
  }

  async updateChannel(channelId: string, updates: Partial<TeamsChannel>): Promise<TeamsChannel | null> {
    const channel = this.channels.find(c => c.id === channelId);
    if (!channel) return null;

    Object.assign(channel, updates);
    await this.saveData();
    this.emit('channel_updated', channel);

    return channel;
  }

  async deleteChannel(channelId: string): Promise<boolean> {
    const index = this.channels.findIndex(c => c.id === channelId);
    if (index === -1) return false;

    this.channels.splice(index, 1);
    await this.saveData();
    this.emit('channel_deleted', { channelId });

    return true;
  }

  async testChannel(channelId: string): Promise<{ success: boolean; error?: string }> {
    const channel = this.channels.find(c => c.id === channelId);
    if (!channel) {
      return { success: false, error: 'Channel not found' };
    }

    // Simulate webhook test
    await new Promise(resolve => setTimeout(resolve, 500));

    // In a real implementation, this would send a test message to the webhook
    console.log(`[TEAMS] Testing webhook for channel: ${channel.name}`);

    return { success: true };
  }

  // Notification sending
  async sendBuildNotification(
    buildId: string,
    status: BuildStatus,
    buildInfo: {
      version: string;
      buildNumber: number;
      platform: 'ios' | 'android' | 'web';
      environment: string;
      branch: string;
      commitMessage?: string;
      duration?: number;
      artifactUrl?: string;
      testResults?: { passed: number; failed: number; total: number };
    }
  ): Promise<TeamsNotification[]> {
    const sentNotifications: TeamsNotification[] = [];

    // Find channels that should receive this notification
    const activeChannels = this.channels.filter(
      c => c.isActive && c.notifyOn.includes(status)
    );

    for (const channel of activeChannels) {
      const notification = await this.createAndSendNotification(
        channel,
        buildId,
        status,
        buildInfo
      );
      sentNotifications.push(notification);
    }

    return sentNotifications;
  }

  private async createAndSendNotification(
    channel: TeamsChannel,
    buildId: string,
    status: BuildStatus,
    buildInfo: {
      version: string;
      buildNumber: number;
      platform: 'ios' | 'android' | 'web';
      environment: string;
      branch: string;
      commitMessage?: string;
      duration?: number;
      artifactUrl?: string;
      testResults?: { passed: number; failed: number; total: number };
    }
  ): Promise<TeamsNotification> {
    const { title, message, cardTheme } = this.generateNotificationContent(status, buildInfo);
    const facts = this.generateFacts(status, buildInfo);
    const actions = this.generateActions(status, buildInfo);
    const mentions = this.getMentions(channel, status);

    const notification: TeamsNotification = {
      id: `notif_teams_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      channelId: channel.id,
      buildId,
      status,
      title,
      message,
      cardTheme,
      facts,
      actions,
      mentions,
      sentAt: new Date().toISOString(),
      deliveryStatus: 'pending',
      retryCount: 0,
    };

    // Update or create thread
    await this.updateThread(buildId, channel.id, notification.id);

    // Simulate sending to Teams webhook
    const result = await this.sendToWebhook(channel, notification);
    
    notification.deliveryStatus = result.success ? 'sent' : 'failed';
    notification.errorMessage = result.error;

    this.notifications.push(notification);
    await this.saveData();

    if (result.success) {
      this.emit('notification_sent', notification);
    } else {
      this.emit('notification_failed', notification);
    }

    return notification;
  }

  private generateNotificationContent(
    status: BuildStatus,
    buildInfo: { version: string; buildNumber: number; platform: string; environment: string }
  ): { title: string; message: string; cardTheme: CardTheme } {
    const platformEmoji = buildInfo.platform === 'ios' ? '🍎' : buildInfo.platform === 'android' ? '🤖' : '🌐';
    const versionStr = `v${buildInfo.version} (${buildInfo.buildNumber})`;

    switch (status) {
      case 'queued':
        return {
          title: `${platformEmoji} Build Queued`,
          message: `Build ${versionStr} for ${buildInfo.platform.toUpperCase()} has been queued.`,
          cardTheme: 'info',
        };
      case 'building':
        return {
          title: `${platformEmoji} Build Started`,
          message: `Building ${versionStr} for ${buildInfo.platform.toUpperCase()}...`,
          cardTheme: 'info',
        };
      case 'testing':
        return {
          title: `${platformEmoji} Running Tests`,
          message: `Running tests for ${versionStr} on ${buildInfo.platform.toUpperCase()}...`,
          cardTheme: 'info',
        };
      case 'uploading':
        return {
          title: `${platformEmoji} Uploading Build`,
          message: `Uploading ${versionStr} to ${buildInfo.platform === 'ios' ? 'TestFlight' : 'Google Play'}...`,
          cardTheme: 'info',
        };
      case 'ready':
        return {
          title: `✅ ${platformEmoji} Build Ready`,
          message: `Build ${versionStr} for ${buildInfo.platform.toUpperCase()} is ready for testing!`,
          cardTheme: 'success',
        };
      case 'failed':
        return {
          title: `❌ ${platformEmoji} Build Failed`,
          message: `Build ${versionStr} for ${buildInfo.platform.toUpperCase()} has failed.`,
          cardTheme: 'error',
        };
      case 'cancelled':
        return {
          title: `⚠️ ${platformEmoji} Build Cancelled`,
          message: `Build ${versionStr} for ${buildInfo.platform.toUpperCase()} was cancelled.`,
          cardTheme: 'warning',
        };
      default:
        return {
          title: `${platformEmoji} Build Update`,
          message: `Build ${versionStr} status: ${status}`,
          cardTheme: 'default',
        };
    }
  }

  private generateFacts(
    status: BuildStatus,
    buildInfo: {
      version: string;
      buildNumber: number;
      platform: string;
      environment: string;
      branch: string;
      commitMessage?: string;
      duration?: number;
      testResults?: { passed: number; failed: number; total: number };
    }
  ): { name: string; value: string }[] {
    const facts: { name: string; value: string }[] = [
      { name: 'Version', value: `${buildInfo.version} (${buildInfo.buildNumber})` },
      { name: 'Platform', value: buildInfo.platform.toUpperCase() },
      { name: 'Environment', value: buildInfo.environment },
      { name: 'Branch', value: buildInfo.branch },
    ];

    if (buildInfo.commitMessage) {
      facts.push({ name: 'Commit', value: buildInfo.commitMessage.substring(0, 50) });
    }

    if (buildInfo.duration) {
      const minutes = Math.floor(buildInfo.duration / 60);
      const seconds = buildInfo.duration % 60;
      facts.push({ name: 'Duration', value: `${minutes}m ${seconds}s` });
    }

    if (buildInfo.testResults) {
      const { passed, failed, total } = buildInfo.testResults;
      facts.push({ 
        name: 'Tests', 
        value: `${passed}/${total} passed${failed > 0 ? ` (${failed} failed)` : ''}` 
      });
    }

    return facts;
  }

  private generateActions(
    status: BuildStatus,
    buildInfo: { artifactUrl?: string }
  ): { type: string; name: string; url: string }[] {
    const actions: { type: string; name: string; url: string }[] = [];

    if (status === 'ready' && buildInfo.artifactUrl) {
      actions.push({
        type: 'OpenUri',
        name: 'Download Build',
        url: buildInfo.artifactUrl,
      });
    }

    actions.push({
      type: 'OpenUri',
      name: 'View in Dashboard',
      url: 'https://medivac.one/builds',
    });

    if (status === 'failed') {
      actions.push({
        type: 'OpenUri',
        name: 'View Logs',
        url: 'https://medivac.one/builds/logs',
      });
    }

    return actions;
  }

  private getMentions(channel: TeamsChannel, status: BuildStatus): string[] {
    if (status === 'failed' && channel.mentionOnFailure) {
      return channel.mentionUsers;
    }
    return [];
  }

  private async sendToWebhook(
    channel: TeamsChannel,
    notification: TeamsNotification
  ): Promise<{ success: boolean; error?: string }> {
    // Simulate webhook call
    await new Promise(resolve => setTimeout(resolve, 200));

    // In a real implementation, this would make an HTTP POST to the webhook URL
    console.log(`[TEAMS] Sending notification to ${channel.name}: ${notification.title}`);

    // Simulate occasional failures for testing
    if (Math.random() < 0.05) {
      return { success: false, error: 'Webhook temporarily unavailable' };
    }

    return { success: true };
  }

  private async updateThread(buildId: string, channelId: string, notificationId: string): Promise<void> {
    let thread = this.threads.find(t => t.buildId === buildId && t.channelId === channelId);

    if (thread) {
      thread.lastUpdated = new Date().toISOString();
      thread.notificationIds.push(notificationId);
    } else {
      thread = {
        id: `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        buildId,
        channelId,
        startedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        notificationIds: [notificationId],
        status: 'active',
      };
      this.threads.push(thread);
    }
  }

  // Retry failed notifications
  async retryFailedNotifications(): Promise<{ retried: number; succeeded: number; failed: number }> {
    const failedNotifications = this.notifications.filter(
      n => n.deliveryStatus === 'failed' && n.retryCount < 3
    );

    let succeeded = 0;
    let failed = 0;

    for (const notification of failedNotifications) {
      const channel = this.channels.find(c => c.id === notification.channelId);
      if (!channel) continue;

      notification.retryCount++;
      notification.deliveryStatus = 'retrying';

      const result = await this.sendToWebhook(channel, notification);
      
      if (result.success) {
        notification.deliveryStatus = 'sent';
        succeeded++;
      } else {
        notification.deliveryStatus = 'failed';
        notification.errorMessage = result.error;
        failed++;
      }
    }

    await this.saveData();

    return { retried: failedNotifications.length, succeeded, failed };
  }

  // Notification preferences
  async getPreferences(odId?: string): Promise<NotificationPreference[]> {
    if (odId) {
      return this.preferences.filter(p => p.odId === odId);
    }
    return [...this.preferences];
  }

  async updatePreference(
    odId: string,
    odName: string,
    email: string,
    updates: Partial<NotificationPreference>
  ): Promise<NotificationPreference> {
    let preference = this.preferences.find(p => p.odId === odId);

    if (preference) {
      Object.assign(preference, updates);
    } else {
      preference = {
        odId,
        odName,
        email,
        receiveNotifications: true,
        notifyOnSuccess: true,
        notifyOnFailure: true,
        notifyOnStart: false,
        mentionOnFailure: true,
        quietHoursEnabled: false,
        preferredChannels: [],
        ...updates,
      };
      this.preferences.push(preference);
    }

    await this.saveData();
    this.emit('preference_updated', preference);

    return preference;
  }

  // Notification history
  async getNotifications(filter?: {
    channelId?: string;
    buildId?: string;
    status?: BuildStatus;
    deliveryStatus?: 'pending' | 'sent' | 'failed' | 'retrying';
  }): Promise<TeamsNotification[]> {
    let result = [...this.notifications];

    if (filter?.channelId) {
      result = result.filter(n => n.channelId === filter.channelId);
    }
    if (filter?.buildId) {
      result = result.filter(n => n.buildId === filter.buildId);
    }
    if (filter?.status) {
      result = result.filter(n => n.status === filter.status);
    }
    if (filter?.deliveryStatus) {
      result = result.filter(n => n.deliveryStatus === filter.deliveryStatus);
    }

    return result.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
  }

  async getThreads(filter?: { buildId?: string; channelId?: string }): Promise<NotificationThread[]> {
    let result = [...this.threads];

    if (filter?.buildId) {
      result = result.filter(t => t.buildId === filter.buildId);
    }
    if (filter?.channelId) {
      result = result.filter(t => t.channelId === filter.channelId);
    }

    return result.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
  }

  // Analytics
  async getAnalytics(): Promise<TeamsAnalytics> {
    const totalNotifications = this.notifications.length;
    const successfulDeliveries = this.notifications.filter(n => n.deliveryStatus === 'sent').length;
    const failedDeliveries = this.notifications.filter(n => n.deliveryStatus === 'failed').length;

    const byChannel: Record<string, { sent: number; failed: number }> = {};
    const byStatus: Record<BuildStatus, number> = {
      queued: 0,
      building: 0,
      testing: 0,
      uploading: 0,
      ready: 0,
      failed: 0,
      cancelled: 0,
    };

    for (const notification of this.notifications) {
      // By channel
      if (!byChannel[notification.channelId]) {
        byChannel[notification.channelId] = { sent: 0, failed: 0 };
      }
      if (notification.deliveryStatus === 'sent') {
        byChannel[notification.channelId].sent++;
      } else if (notification.deliveryStatus === 'failed') {
        byChannel[notification.channelId].failed++;
      }

      // By status
      byStatus[notification.status]++;
    }

    const mostActiveChannels = Object.entries(byChannel)
      .map(([channelId, stats]) => {
        const channel = this.channels.find(c => c.id === channelId);
        return {
          channelId,
          name: channel?.name || 'Unknown',
          count: stats.sent + stats.failed,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalNotifications,
      successfulDeliveries,
      failedDeliveries,
      deliveryRate: totalNotifications > 0 ? (successfulDeliveries / totalNotifications) * 100 : 0,
      averageDeliveryTime: 250, // Simulated average in ms
      byChannel,
      byStatus,
      mostActiveChannels,
    };
  }

  // Generate Adaptive Card JSON for Teams
  generateAdaptiveCard(notification: TeamsNotification): object {
    const themeColors: Record<CardTheme, string> = {
      default: '#0078D4',
      success: '#107C10',
      warning: '#FFB900',
      error: '#D13438',
      info: '#0078D4',
    };

    return {
      '@type': 'MessageCard',
      '@context': 'http://schema.org/extensions',
      themeColor: themeColors[notification.cardTheme],
      summary: notification.title,
      sections: [
        {
          activityTitle: notification.title,
          activitySubtitle: new Date(notification.sentAt).toLocaleString(),
          activityImage: 'https://medivac.one/logo.png',
          facts: notification.facts,
          markdown: true,
          text: notification.message,
        },
      ],
      potentialAction: notification.actions.map(action => ({
        '@type': action.type,
        name: action.name,
        targets: [{ os: 'default', uri: action.url }],
      })),
    };
  }
}

export const cicdTeamsNotificationService = new CICDTeamsNotificationService();
export default cicdTeamsNotificationService;
