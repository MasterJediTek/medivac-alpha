/**
 * Microsoft Teams Integration Service
 * Azure AD OAuth authentication and Teams channel integration
 * MediVac One v5.7
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  CONFIG: 'medivac_teams_config',
  CHANNELS: 'medivac_teams_channels',
  NOTIFICATIONS: 'medivac_teams_notifications',
  AUTH: 'medivac_teams_auth',
};

// Types
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
export type NotificationType = 'incident' | 'compliance' | 'drill' | 'system' | 'alert';

export interface TeamsConfig {
  tenantId: string;
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  scopes: string[];
  webhookUrl?: string;
  botId?: string;
  status: ConnectionStatus;
  lastConnected?: string;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamsChannel {
  id: string;
  teamId: string;
  teamName: string;
  channelId: string;
  channelName: string;
  webhookUrl?: string;
  isDefault: boolean;
  enabledNotifications: NotificationType[];
  createdAt: string;
}

export interface TeamsNotification {
  id: string;
  channelId: string;
  type: NotificationType;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  status: 'pending' | 'sent' | 'failed';
  sentAt?: string;
  error?: string;
  adaptiveCard?: Record<string, unknown>;
  createdAt: string;
}

export interface AzureADToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt: string;
  tokenType: string;
  scope: string;
}

// Azure AD OAuth configuration
export const AZURE_AD_CONFIG = {
  authorizeEndpoint: 'https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/authorize',
  tokenEndpoint: 'https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token',
  graphEndpoint: 'https://graph.microsoft.com/v1.0',
  defaultScopes: [
    'https://graph.microsoft.com/Team.ReadBasic.All',
    'https://graph.microsoft.com/Channel.ReadBasic.All',
    'https://graph.microsoft.com/ChannelMessage.Send',
    'offline_access',
  ],
};

// Teams notification templates
export const NOTIFICATION_TEMPLATES: Record<NotificationType, {
  label: string;
  icon: string;
  color: string;
  description: string;
}> = {
  incident: {
    label: 'Security Incidents',
    icon: 'shield.fill',
    color: '#EF4444',
    description: 'Alerts for new security incidents and status changes',
  },
  compliance: {
    label: 'Compliance Updates',
    icon: 'checkmark.circle.fill',
    color: '#10B981',
    description: 'Compliance report summaries and policy changes',
  },
  drill: {
    label: 'Drill Notifications',
    icon: 'person.2.fill',
    color: '#F59E0B',
    description: 'Drill completions and certification updates',
  },
  system: {
    label: 'System Alerts',
    icon: 'server.rack',
    color: '#3B82F6',
    description: 'System health and maintenance notifications',
  },
  alert: {
    label: 'General Alerts',
    icon: 'bell.fill',
    color: '#8B5CF6',
    description: 'General notifications and announcements',
  },
};

// Default configuration
const DEFAULT_CONFIG: TeamsConfig = {
  tenantId: '',
  clientId: '',
  redirectUri: 'medivac://auth/teams/callback',
  scopes: AZURE_AD_CONFIG.defaultScopes,
  status: 'disconnected',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

class TeamsIntegrationService {
  private config: TeamsConfig = DEFAULT_CONFIG;
  private channels: TeamsChannel[] = [];
  private notifications: TeamsNotification[] = [];
  private authToken: AzureADToken | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const [configData, channelsData, notificationsData, authData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.CONFIG),
        AsyncStorage.getItem(STORAGE_KEYS.CHANNELS),
        AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS),
        AsyncStorage.getItem(STORAGE_KEYS.AUTH),
      ]);

      this.config = configData ? JSON.parse(configData) : DEFAULT_CONFIG;
      this.channels = channelsData ? JSON.parse(channelsData) : [];
      this.notifications = notificationsData ? JSON.parse(notificationsData) : [];
      this.authToken = authData ? JSON.parse(authData) : null;

      // Check if token is expired
      if (this.authToken && new Date(this.authToken.expiresAt) < new Date()) {
        this.authToken = null;
        this.config.status = 'disconnected';
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize Teams integration:', error);
      this.config = DEFAULT_CONFIG;
      this.channels = [];
      this.notifications = [];
      this.initialized = true;
    }
  }

  private async saveConfig(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save Teams config:', error);
    }
  }

  private async saveChannels(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CHANNELS, JSON.stringify(this.channels));
    } catch (error) {
      console.error('Failed to save Teams channels:', error);
    }
  }

  private async saveNotifications(): Promise<void> {
    try {
      // Keep only last 200 notifications
      if (this.notifications.length > 200) {
        this.notifications = this.notifications.slice(-200);
      }
      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Failed to save Teams notifications:', error);
    }
  }

  private async saveAuth(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(this.authToken));
    } catch (error) {
      console.error('Failed to save Teams auth:', error);
    }
  }

  // Configuration
  getConfig(): TeamsConfig {
    return { ...this.config };
  }

  async updateConfig(updates: Partial<TeamsConfig>): Promise<TeamsConfig> {
    await this.initialize();

    this.config = {
      ...this.config,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await this.saveConfig();
    return this.config;
  }

  // OAuth flow
  getAuthorizationUrl(): string {
    if (!this.config.tenantId || !this.config.clientId) {
      throw new Error('Teams configuration incomplete. Please set Tenant ID and Client ID.');
    }

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: 'code',
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(' '),
      response_mode: 'query',
      state: Math.random().toString(36).substring(2),
    });

    return AZURE_AD_CONFIG.authorizeEndpoint
      .replace('{tenantId}', this.config.tenantId) + '?' + params.toString();
  }

  async handleAuthCallback(code: string): Promise<boolean> {
    await this.initialize();

    try {
      // Simulate token exchange (in production, use fetch to token endpoint)
      this.config.status = 'connecting';
      await this.saveConfig();

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create mock token
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      this.authToken = {
        accessToken: `mock_access_token_${Date.now()}`,
        refreshToken: `mock_refresh_token_${Date.now()}`,
        expiresAt: expiresAt.toISOString(),
        tokenType: 'Bearer',
        scope: this.config.scopes.join(' '),
      };

      this.config.status = 'connected';
      this.config.lastConnected = new Date().toISOString();
      this.config.lastError = undefined;

      await Promise.all([
        this.saveConfig(),
        this.saveAuth(),
      ]);

      return true;
    } catch (error) {
      this.config.status = 'error';
      this.config.lastError = error instanceof Error ? error.message : 'Authentication failed';
      await this.saveConfig();
      return false;
    }
  }

  async disconnect(): Promise<void> {
    this.authToken = null;
    this.config.status = 'disconnected';
    this.config.lastConnected = undefined;
    
    await Promise.all([
      this.saveConfig(),
      AsyncStorage.removeItem(STORAGE_KEYS.AUTH),
    ]);
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    await this.initialize();

    if (!this.authToken) {
      return { success: false, message: 'Not authenticated. Please connect to Microsoft Teams first.' };
    }

    if (new Date(this.authToken.expiresAt) < new Date()) {
      return { success: false, message: 'Token expired. Please reconnect to Microsoft Teams.' };
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    return { success: true, message: 'Successfully connected to Microsoft Teams.' };
  }

  // Channels
  getChannels(): TeamsChannel[] {
    return [...this.channels];
  }

  async addChannel(channel: Omit<TeamsChannel, 'id' | 'createdAt'>): Promise<TeamsChannel> {
    await this.initialize();

    const newChannel: TeamsChannel = {
      ...channel,
      id: `ch_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date().toISOString(),
    };

    this.channels.push(newChannel);
    await this.saveChannels();

    return newChannel;
  }

  async updateChannel(id: string, updates: Partial<TeamsChannel>): Promise<TeamsChannel | null> {
    const index = this.channels.findIndex(c => c.id === id);
    if (index === -1) return null;

    this.channels[index] = {
      ...this.channels[index],
      ...updates,
    };

    await this.saveChannels();
    return this.channels[index];
  }

  async removeChannel(id: string): Promise<boolean> {
    const index = this.channels.findIndex(c => c.id === id);
    if (index === -1) return false;

    this.channels.splice(index, 1);
    await this.saveChannels();

    return true;
  }

  // Notifications
  async sendNotification(
    channelId: string,
    type: NotificationType,
    title: string,
    message: string,
    severity: 'info' | 'warning' | 'critical' = 'info'
  ): Promise<TeamsNotification> {
    await this.initialize();

    const channel = this.channels.find(c => c.id === channelId);
    if (!channel) {
      throw new Error('Channel not found');
    }

    if (!channel.enabledNotifications.includes(type)) {
      throw new Error(`Notification type "${type}" is not enabled for this channel`);
    }

    const notification: TeamsNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      channelId,
      type,
      title,
      message,
      severity,
      status: 'pending',
      adaptiveCard: this.buildAdaptiveCard(type, title, message, severity),
      createdAt: new Date().toISOString(),
    };

    // Simulate sending
    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      if (Math.random() > 0.1) {
        notification.status = 'sent';
        notification.sentAt = new Date().toISOString();
      } else {
        throw new Error('Simulated send failure');
      }
    } catch (error) {
      notification.status = 'failed';
      notification.error = error instanceof Error ? error.message : 'Send failed';
    }

    this.notifications.push(notification);
    await this.saveNotifications();

    return notification;
  }

  async broadcastNotification(
    type: NotificationType,
    title: string,
    message: string,
    severity: 'info' | 'warning' | 'critical' = 'info'
  ): Promise<TeamsNotification[]> {
    const enabledChannels = this.channels.filter(c => c.enabledNotifications.includes(type));
    const results: TeamsNotification[] = [];

    for (const channel of enabledChannels) {
      try {
        const notification = await this.sendNotification(channel.id, type, title, message, severity);
        results.push(notification);
      } catch (error) {
        console.error(`Failed to send to channel ${channel.id}:`, error);
      }
    }

    return results;
  }

  getNotifications(channelId?: string): TeamsNotification[] {
    let notifications = [...this.notifications];
    if (channelId) {
      notifications = notifications.filter(n => n.channelId === channelId);
    }
    return notifications.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // Build Teams Adaptive Card
  private buildAdaptiveCard(
    type: NotificationType,
    title: string,
    message: string,
    severity: 'info' | 'warning' | 'critical'
  ): Record<string, unknown> {
    const template = NOTIFICATION_TEMPLATES[type];
    const severityColors = {
      info: '#3B82F6',
      warning: '#F59E0B',
      critical: '#EF4444',
    };

    return {
      type: 'AdaptiveCard',
      $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
      version: '1.4',
      body: [
        {
          type: 'Container',
          style: 'emphasis',
          items: [
            {
              type: 'ColumnSet',
              columns: [
                {
                  type: 'Column',
                  width: 'auto',
                  items: [
                    {
                      type: 'Image',
                      url: `https://via.placeholder.com/32/${template.color.replace('#', '')}`,
                      size: 'Small',
                    },
                  ],
                },
                {
                  type: 'Column',
                  width: 'stretch',
                  items: [
                    {
                      type: 'TextBlock',
                      text: title,
                      weight: 'Bolder',
                      size: 'Medium',
                      wrap: true,
                    },
                    {
                      type: 'TextBlock',
                      text: template.label,
                      spacing: 'None',
                      isSubtle: true,
                      size: 'Small',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: 'Container',
          items: [
            {
              type: 'TextBlock',
              text: message,
              wrap: true,
            },
          ],
        },
        {
          type: 'FactSet',
          facts: [
            { title: 'Severity', value: severity.toUpperCase() },
            { title: 'Time', value: new Date().toLocaleString() },
            { title: 'Source', value: 'MediVac One' },
          ],
        },
      ],
      actions: [
        {
          type: 'Action.OpenUrl',
          title: 'View Details',
          url: 'https://medivac.one/dashboard',
        },
      ],
    };
  }

  // Statistics
  getStatistics(): {
    isConnected: boolean;
    channelCount: number;
    totalNotifications: number;
    sentNotifications: number;
    failedNotifications: number;
    byType: Record<NotificationType, number>;
  } {
    const stats = {
      isConnected: this.config.status === 'connected',
      channelCount: this.channels.length,
      totalNotifications: this.notifications.length,
      sentNotifications: this.notifications.filter(n => n.status === 'sent').length,
      failedNotifications: this.notifications.filter(n => n.status === 'failed').length,
      byType: {
        incident: 0,
        compliance: 0,
        drill: 0,
        system: 0,
        alert: 0,
      } as Record<NotificationType, number>,
    };

    for (const notification of this.notifications) {
      stats.byType[notification.type]++;
    }

    return stats;
  }

  // Export configuration
  exportConfig(): string {
    return JSON.stringify({
      config: { ...this.config, clientSecret: undefined },
      channels: this.channels,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    }, null, 2);
  }
}

export const teamsIntegrationService = new TeamsIntegrationService();
