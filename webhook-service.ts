/**
 * Health Monitoring Webhooks Service
 * Send SMTP health alerts to external systems (Slack, PagerDuty, Microsoft Teams)
 * MediVac One v5.7
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  WEBHOOKS: 'medivac_webhooks',
  DELIVERY_LOG: 'medivac_webhook_delivery_log',
  TEMPLATES: 'medivac_webhook_templates',
};

// Types
export type WebhookProvider = 'slack' | 'pagerduty' | 'teams' | 'discord' | 'generic';
export type WebhookStatus = 'active' | 'paused' | 'error' | 'disabled';
export type AlertSeverity = 'info' | 'warning' | 'critical' | 'resolved';
export type DeliveryStatus = 'pending' | 'sent' | 'failed' | 'retrying';

export interface WebhookConfig {
  id: string;
  name: string;
  description: string;
  provider: WebhookProvider;
  url: string;
  status: WebhookStatus;
  secret?: string;
  headers?: Record<string, string>;
  enabledAlerts: AlertSeverity[];
  enabledSources: string[];
  retryEnabled: boolean;
  maxRetries: number;
  retryDelaySeconds: number;
  rateLimitPerMinute: number;
  lastDelivery?: string;
  lastError?: string;
  successCount: number;
  failureCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  webhookName: string;
  provider: WebhookProvider;
  alertType: string;
  severity: AlertSeverity;
  source: string;
  payload: Record<string, unknown>;
  status: DeliveryStatus;
  attempts: number;
  maxAttempts: number;
  responseCode?: number;
  responseBody?: string;
  error?: string;
  sentAt?: string;
  createdAt: string;
  nextRetryAt?: string;
}

export interface WebhookTemplate {
  id: string;
  name: string;
  provider: WebhookProvider;
  alertType: string;
  severity: AlertSeverity;
  template: Record<string, unknown>;
  createdAt: string;
}

export interface AlertPayload {
  alertType: string;
  severity: AlertSeverity;
  source: string;
  title: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// Provider configurations
export const PROVIDER_CONFIG: Record<WebhookProvider, {
  label: string;
  icon: string;
  color: string;
  description: string;
  urlPattern: string;
  urlPlaceholder: string;
  supportsSecret: boolean;
}> = {
  slack: {
    label: 'Slack',
    icon: 'message.fill',
    color: '#4A154B',
    description: 'Send alerts to Slack channels via incoming webhooks',
    urlPattern: 'https://hooks.slack.com/services/',
    urlPlaceholder: 'https://hooks.slack.com/services/YOUR_TEAM_ID/YOUR_CHANNEL_ID/YOUR_WEBHOOK_TOKEN',
    supportsSecret: false,
  },
  pagerduty: {
    label: 'PagerDuty',
    icon: 'bell.fill',
    color: '#06AC38',
    description: 'Trigger incidents in PagerDuty for on-call alerting',
    urlPattern: 'https://events.pagerduty.com/',
    urlPlaceholder: 'https://events.pagerduty.com/v2/enqueue',
    supportsSecret: true,
  },
  teams: {
    label: 'Microsoft Teams',
    icon: 'person.2.fill',
    color: '#6264A7',
    description: 'Post alerts to Microsoft Teams channels',
    urlPattern: 'https://outlook.office.com/webhook/',
    urlPlaceholder: 'https://outlook.office.com/webhook/...',
    supportsSecret: false,
  },
  discord: {
    label: 'Discord',
    icon: 'bubble.left.fill',
    color: '#5865F2',
    description: 'Send alerts to Discord channels via webhooks',
    urlPattern: 'https://discord.com/api/webhooks/',
    urlPlaceholder: 'https://discord.com/api/webhooks/...',
    supportsSecret: false,
  },
  generic: {
    label: 'Generic Webhook',
    icon: 'network',
    color: '#6B7280',
    description: 'Send alerts to any HTTP endpoint',
    urlPattern: 'https://',
    urlPlaceholder: 'https://your-endpoint.com/webhook',
    supportsSecret: true,
  },
};

// Alert type configurations
export const ALERT_TYPES: Record<string, { label: string; description: string }> = {
  smtp_health: { label: 'SMTP Health', description: 'SMTP server health status changes' },
  smtp_failure: { label: 'SMTP Failure', description: 'SMTP connection or delivery failures' },
  incident_created: { label: 'Incident Created', description: 'New security incident detected' },
  incident_resolved: { label: 'Incident Resolved', description: 'Security incident resolved' },
  drill_completed: { label: 'Drill Completed', description: 'Security drill completed' },
  policy_violation: { label: 'Policy Violation', description: 'Security policy violation detected' },
  system_alert: { label: 'System Alert', description: 'General system alerts' },
};

class WebhookService {
  private webhooks: WebhookConfig[] = [];
  private deliveryLog: WebhookDelivery[] = [];
  private templates: WebhookTemplate[] = [];
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const [webhooksData, logData, templatesData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.WEBHOOKS),
        AsyncStorage.getItem(STORAGE_KEYS.DELIVERY_LOG),
        AsyncStorage.getItem(STORAGE_KEYS.TEMPLATES),
      ]);

      this.webhooks = webhooksData ? JSON.parse(webhooksData) : [];
      this.deliveryLog = logData ? JSON.parse(logData) : [];
      this.templates = templatesData ? JSON.parse(templatesData) : this.getDefaultTemplates();

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize webhook service:', error);
      this.webhooks = [];
      this.deliveryLog = [];
      this.templates = this.getDefaultTemplates();
      this.initialized = true;
    }
  }

  private getDefaultTemplates(): WebhookTemplate[] {
    return [
      {
        id: 'tpl_slack_critical',
        name: 'Slack Critical Alert',
        provider: 'slack',
        alertType: 'smtp_failure',
        severity: 'critical',
        template: {
          blocks: [
            {
              type: 'header',
              text: { type: 'plain_text', text: '🚨 {{title}}' }
            },
            {
              type: 'section',
              text: { type: 'mrkdwn', text: '{{message}}' }
            },
            {
              type: 'context',
              elements: [
                { type: 'mrkdwn', text: '*Source:* {{source}} | *Time:* {{timestamp}}' }
              ]
            }
          ]
        },
        createdAt: new Date().toISOString(),
      },
      {
        id: 'tpl_teams_alert',
        name: 'Teams Alert Card',
        provider: 'teams',
        alertType: 'smtp_health',
        severity: 'warning',
        template: {
          '@type': 'MessageCard',
          '@context': 'http://schema.org/extensions',
          themeColor: '{{themeColor}}',
          summary: '{{title}}',
          sections: [{
            activityTitle: '{{title}}',
            activitySubtitle: '{{source}}',
            facts: [
              { name: 'Severity', value: '{{severity}}' },
              { name: 'Time', value: '{{timestamp}}' }
            ],
            text: '{{message}}'
          }]
        },
        createdAt: new Date().toISOString(),
      },
      {
        id: 'tpl_pagerduty_incident',
        name: 'PagerDuty Incident',
        provider: 'pagerduty',
        alertType: 'incident_created',
        severity: 'critical',
        template: {
          routing_key: '{{routingKey}}',
          event_action: 'trigger',
          dedup_key: '{{dedupKey}}',
          payload: {
            summary: '{{title}}',
            severity: '{{severity}}',
            source: '{{source}}',
            timestamp: '{{timestamp}}',
            custom_details: '{{metadata}}'
          }
        },
        createdAt: new Date().toISOString(),
      },
    ];
  }

  private async saveWebhooks(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.WEBHOOKS, JSON.stringify(this.webhooks));
    } catch (error) {
      console.error('Failed to save webhooks:', error);
    }
  }

  private async saveDeliveryLog(): Promise<void> {
    try {
      // Keep only last 500 deliveries
      if (this.deliveryLog.length > 500) {
        this.deliveryLog = this.deliveryLog.slice(-500);
      }
      await AsyncStorage.setItem(STORAGE_KEYS.DELIVERY_LOG, JSON.stringify(this.deliveryLog));
    } catch (error) {
      console.error('Failed to save delivery log:', error);
    }
  }

  private async saveTemplates(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(this.templates));
    } catch (error) {
      console.error('Failed to save templates:', error);
    }
  }

  // Build payload based on provider
  private buildPayload(webhook: WebhookConfig, alert: AlertPayload): Record<string, unknown> {
    const severityColors: Record<AlertSeverity, string> = {
      info: '#3B82F6',
      warning: '#F59E0B',
      critical: '#EF4444',
      resolved: '#10B981',
    };

    switch (webhook.provider) {
      case 'slack':
        return {
          blocks: [
            {
              type: 'header',
              text: { 
                type: 'plain_text', 
                text: `${alert.severity === 'critical' ? '🚨' : alert.severity === 'warning' ? '⚠️' : 'ℹ️'} ${alert.title}` 
              }
            },
            {
              type: 'section',
              text: { type: 'mrkdwn', text: alert.message }
            },
            {
              type: 'context',
              elements: [
                { type: 'mrkdwn', text: `*Source:* ${alert.source} | *Severity:* ${alert.severity} | *Time:* ${alert.timestamp}` }
              ]
            }
          ],
          attachments: [{
            color: severityColors[alert.severity],
          }]
        };

      case 'teams':
        return {
          '@type': 'MessageCard',
          '@context': 'http://schema.org/extensions',
          themeColor: severityColors[alert.severity].replace('#', ''),
          summary: alert.title,
          sections: [{
            activityTitle: alert.title,
            activitySubtitle: alert.source,
            facts: [
              { name: 'Severity', value: alert.severity.toUpperCase() },
              { name: 'Alert Type', value: alert.alertType },
              { name: 'Time', value: new Date(alert.timestamp).toLocaleString() }
            ],
            text: alert.message
          }]
        };

      case 'pagerduty':
        return {
          routing_key: webhook.secret,
          event_action: alert.severity === 'resolved' ? 'resolve' : 'trigger',
          dedup_key: `${alert.source}-${alert.alertType}`,
          payload: {
            summary: alert.title,
            severity: alert.severity === 'critical' ? 'critical' : alert.severity === 'warning' ? 'warning' : 'info',
            source: alert.source,
            timestamp: alert.timestamp,
            custom_details: alert.metadata
          }
        };

      case 'discord':
        return {
          embeds: [{
            title: alert.title,
            description: alert.message,
            color: parseInt(severityColors[alert.severity].replace('#', ''), 16),
            fields: [
              { name: 'Source', value: alert.source, inline: true },
              { name: 'Severity', value: alert.severity.toUpperCase(), inline: true },
              { name: 'Type', value: alert.alertType, inline: true }
            ],
            timestamp: alert.timestamp
          }]
        };

      default:
        return {
          alert: {
            ...alert,
            webhookId: webhook.id,
            webhookName: webhook.name,
          }
        };
    }
  }

  // Sign payload for security
  private signPayload(payload: string, secret: string): string {
    // Simple HMAC-like signature (in production, use proper crypto)
    const hash = Array.from(payload + secret)
      .reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0)
      .toString(16);
    return `sha256=${hash}`;
  }

  // Send webhook
  async sendWebhook(webhookId: string, alert: AlertPayload): Promise<WebhookDelivery> {
    await this.initialize();

    const webhook = this.webhooks.find(w => w.id === webhookId);
    if (!webhook) {
      throw new Error('Webhook not found');
    }

    if (webhook.status !== 'active') {
      throw new Error('Webhook is not active');
    }

    // Check if alert severity is enabled
    if (!webhook.enabledAlerts.includes(alert.severity)) {
      throw new Error('Alert severity not enabled for this webhook');
    }

    const payload = this.buildPayload(webhook, alert);

    const delivery: WebhookDelivery = {
      id: `del_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      webhookId: webhook.id,
      webhookName: webhook.name,
      provider: webhook.provider,
      alertType: alert.alertType,
      severity: alert.severity,
      source: alert.source,
      payload,
      status: 'pending',
      attempts: 0,
      maxAttempts: webhook.retryEnabled ? webhook.maxRetries + 1 : 1,
      createdAt: new Date().toISOString(),
    };

    // Simulate sending (in production, use fetch)
    try {
      delivery.attempts++;
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));

      // Simulate success/failure (90% success rate)
      if (Math.random() > 0.1) {
        delivery.status = 'sent';
        delivery.responseCode = 200;
        delivery.sentAt = new Date().toISOString();
        webhook.successCount++;
        webhook.lastDelivery = delivery.sentAt;
        webhook.lastError = undefined;
      } else {
        throw new Error('Simulated network error');
      }
    } catch (error) {
      delivery.status = delivery.attempts < delivery.maxAttempts ? 'retrying' : 'failed';
      delivery.error = error instanceof Error ? error.message : 'Unknown error';
      delivery.responseCode = 500;
      
      if (delivery.status === 'retrying') {
        const retryDelay = webhook.retryDelaySeconds * Math.pow(2, delivery.attempts - 1);
        delivery.nextRetryAt = new Date(Date.now() + retryDelay * 1000).toISOString();
      } else {
        webhook.failureCount++;
        webhook.lastError = delivery.error;
      }
    }

    this.deliveryLog.push(delivery);
    webhook.updatedAt = new Date().toISOString();

    await Promise.all([
      this.saveWebhooks(),
      this.saveDeliveryLog(),
    ]);

    return delivery;
  }

  // Send alert to all matching webhooks
  async broadcastAlert(alert: AlertPayload): Promise<WebhookDelivery[]> {
    await this.initialize();

    const activeWebhooks = this.webhooks.filter(w => 
      w.status === 'active' && 
      w.enabledAlerts.includes(alert.severity) &&
      (w.enabledSources.length === 0 || w.enabledSources.includes(alert.source))
    );

    const deliveries: WebhookDelivery[] = [];
    for (const webhook of activeWebhooks) {
      try {
        const delivery = await this.sendWebhook(webhook.id, alert);
        deliveries.push(delivery);
      } catch (error) {
        console.error(`Failed to send to webhook ${webhook.id}:`, error);
      }
    }

    return deliveries;
  }

  // CRUD operations
  getWebhooks(): WebhookConfig[] {
    return [...this.webhooks];
  }

  getWebhook(id: string): WebhookConfig | undefined {
    return this.webhooks.find(w => w.id === id);
  }

  async createWebhook(config: Omit<WebhookConfig, 'id' | 'successCount' | 'failureCount' | 'createdAt' | 'updatedAt'>): Promise<WebhookConfig> {
    await this.initialize();

    const webhook: WebhookConfig = {
      ...config,
      id: `wh_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      successCount: 0,
      failureCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.webhooks.push(webhook);
    await this.saveWebhooks();

    return webhook;
  }

  async updateWebhook(id: string, updates: Partial<WebhookConfig>): Promise<WebhookConfig | null> {
    const index = this.webhooks.findIndex(w => w.id === id);
    if (index === -1) return null;

    this.webhooks[index] = {
      ...this.webhooks[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await this.saveWebhooks();
    return this.webhooks[index];
  }

  async deleteWebhook(id: string): Promise<boolean> {
    const index = this.webhooks.findIndex(w => w.id === id);
    if (index === -1) return false;

    this.webhooks.splice(index, 1);
    await this.saveWebhooks();

    return true;
  }

  // Test webhook
  async testWebhook(id: string): Promise<WebhookDelivery> {
    const testAlert: AlertPayload = {
      alertType: 'system_alert',
      severity: 'info',
      source: 'MediVac One',
      title: 'Webhook Test',
      message: 'This is a test message to verify webhook connectivity.',
      timestamp: new Date().toISOString(),
      metadata: { test: true },
    };

    return this.sendWebhook(id, testAlert);
  }

  // Delivery log
  getDeliveryLog(webhookId?: string): WebhookDelivery[] {
    let log = [...this.deliveryLog];
    if (webhookId) {
      log = log.filter(d => d.webhookId === webhookId);
    }
    return log.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async clearDeliveryLog(webhookId?: string): Promise<void> {
    if (webhookId) {
      this.deliveryLog = this.deliveryLog.filter(d => d.webhookId !== webhookId);
    } else {
      this.deliveryLog = [];
    }
    await this.saveDeliveryLog();
  }

  // Templates
  getTemplates(): WebhookTemplate[] {
    return [...this.templates];
  }

  async createTemplate(template: Omit<WebhookTemplate, 'id' | 'createdAt'>): Promise<WebhookTemplate> {
    const newTemplate: WebhookTemplate = {
      ...template,
      id: `tpl_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    this.templates.push(newTemplate);
    await this.saveTemplates();

    return newTemplate;
  }

  // Statistics
  getStatistics(): {
    totalWebhooks: number;
    activeWebhooks: number;
    totalDeliveries: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    successRate: number;
    byProvider: Record<WebhookProvider, number>;
    bySeverity: Record<AlertSeverity, number>;
  } {
    const stats = {
      totalWebhooks: this.webhooks.length,
      activeWebhooks: this.webhooks.filter(w => w.status === 'active').length,
      totalDeliveries: this.deliveryLog.length,
      successfulDeliveries: this.deliveryLog.filter(d => d.status === 'sent').length,
      failedDeliveries: this.deliveryLog.filter(d => d.status === 'failed').length,
      successRate: 0,
      byProvider: { slack: 0, pagerduty: 0, teams: 0, discord: 0, generic: 0 } as Record<WebhookProvider, number>,
      bySeverity: { info: 0, warning: 0, critical: 0, resolved: 0 } as Record<AlertSeverity, number>,
    };

    for (const webhook of this.webhooks) {
      stats.byProvider[webhook.provider]++;
    }

    for (const delivery of this.deliveryLog) {
      stats.bySeverity[delivery.severity]++;
    }

    if (stats.totalDeliveries > 0) {
      stats.successRate = Math.round((stats.successfulDeliveries / stats.totalDeliveries) * 100);
    }

    return stats;
  }

  // Export configuration
  exportConfig(): string {
    return JSON.stringify({
      webhooks: this.webhooks.map(w => ({ ...w, secret: undefined })), // Remove secrets
      templates: this.templates,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    }, null, 2);
  }
}

export const webhookService = new WebhookService();
