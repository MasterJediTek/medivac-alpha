/**
 * Email Recipients Configuration Service
 * Manage compliance report recipients and notification settings - MediVac One v5.2
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ==========================================
// Types
// ==========================================

export type RecipientGroup = 'compliance' | 'security' | 'executive' | 'clinical' | 'it' | 'custom';
export type NotificationFrequency = 'immediate' | 'daily_digest' | 'weekly_digest' | 'monthly_summary';
export type DeliveryFormat = 'html' | 'pdf' | 'both';

export interface EmailRecipient {
  id: string;
  email: string;
  name: string;
  title?: string;
  department?: string;
  groups: RecipientGroup[];
  verified: boolean;
  verifiedAt?: string;
  active: boolean;
  preferences: RecipientPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface RecipientPreferences {
  frequency: NotificationFrequency;
  format: DeliveryFormat;
  reportTypes: string[];
  frameworks: string[];
  severityThreshold: 'all' | 'high' | 'critical';
  timezone: string;
  language: string;
  includeExecutiveSummary: boolean;
  includeDetailedFindings: boolean;
  includeRemediation: boolean;
}

export interface RecipientGroupConfig {
  id: RecipientGroup;
  name: string;
  description: string;
  defaultPreferences: RecipientPreferences;
  members: string[];
  autoAdd: boolean;
  rolePattern?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  variables: string[];
  reportType: string;
  active: boolean;
}

export interface DeliveryTest {
  id: string;
  recipientId: string;
  email: string;
  sentAt: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';
  error?: string;
  deliveredAt?: string;
}

export interface EmailAuditLog {
  id: string;
  action: 'created' | 'updated' | 'deleted' | 'verified' | 'unsubscribed' | 'sent' | 'failed';
  recipientId?: string;
  email?: string;
  details: string;
  performedBy: string;
  timestamp: string;
}

// ==========================================
// Default Configuration
// ==========================================

const DEFAULT_PREFERENCES: RecipientPreferences = {
  frequency: 'weekly_digest',
  format: 'pdf',
  reportTypes: ['compliance', 'security', 'audit'],
  frameworks: ['HIPAA', 'AUSTRALIAN_PRIVACY', 'ISO_27001'],
  severityThreshold: 'all',
  timezone: 'Australia/Sydney',
  language: 'en',
  includeExecutiveSummary: true,
  includeDetailedFindings: true,
  includeRemediation: true,
};

const DEFAULT_GROUPS: RecipientGroupConfig[] = [
  {
    id: 'compliance',
    name: 'Compliance Team',
    description: 'Receives all compliance-related reports and alerts',
    defaultPreferences: { ...DEFAULT_PREFERENCES, frequency: 'immediate', severityThreshold: 'high' },
    members: [],
    autoAdd: false,
  },
  {
    id: 'security',
    name: 'Security Team',
    description: 'Receives security scan results and threat alerts',
    defaultPreferences: { ...DEFAULT_PREFERENCES, frequency: 'immediate', reportTypes: ['security', 'audit'] },
    members: [],
    autoAdd: false,
  },
  {
    id: 'executive',
    name: 'Executive Leadership',
    description: 'Receives executive summaries and high-level reports',
    defaultPreferences: { ...DEFAULT_PREFERENCES, frequency: 'weekly_digest', includeDetailedFindings: false },
    members: [],
    autoAdd: false,
  },
  {
    id: 'clinical',
    name: 'Clinical Leadership',
    description: 'Receives clinical quality and safety reports',
    defaultPreferences: { ...DEFAULT_PREFERENCES, frameworks: ['NSQHS'], reportTypes: ['compliance', 'quality'] },
    members: [],
    autoAdd: false,
  },
  {
    id: 'it',
    name: 'IT Department',
    description: 'Receives technical security and infrastructure reports',
    defaultPreferences: { ...DEFAULT_PREFERENCES, reportTypes: ['security', 'infrastructure'] },
    members: [],
    autoAdd: false,
  },
  {
    id: 'custom',
    name: 'Custom Group',
    description: 'User-defined recipient group',
    defaultPreferences: DEFAULT_PREFERENCES,
    members: [],
    autoAdd: false,
  },
];

const DEFAULT_RECIPIENTS: Omit<EmailRecipient, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    email: 'compliance@medivac.one',
    name: 'Compliance Officer',
    title: 'Chief Compliance Officer',
    department: 'Compliance',
    groups: ['compliance', 'executive'],
    verified: true,
    verifiedAt: new Date().toISOString(),
    active: true,
    preferences: { ...DEFAULT_PREFERENCES, frequency: 'immediate' },
  },
  {
    email: 'ciso@medivac.one',
    name: 'Security Officer',
    title: 'Chief Information Security Officer',
    department: 'IT Security',
    groups: ['security', 'executive'],
    verified: true,
    verifiedAt: new Date().toISOString(),
    active: true,
    preferences: { ...DEFAULT_PREFERENCES, frequency: 'immediate', reportTypes: ['security', 'audit'] },
  },
  {
    email: 'ceo@medivac.one',
    name: 'Chief Executive',
    title: 'Chief Executive Officer',
    department: 'Executive',
    groups: ['executive'],
    verified: true,
    verifiedAt: new Date().toISOString(),
    active: true,
    preferences: { ...DEFAULT_PREFERENCES, frequency: 'weekly_digest', includeDetailedFindings: false },
  },
  {
    email: 'privacy.officer@medivac.one',
    name: 'Privacy Officer',
    title: 'Privacy Officer',
    department: 'Compliance',
    groups: ['compliance'],
    verified: true,
    verifiedAt: new Date().toISOString(),
    active: true,
    preferences: { ...DEFAULT_PREFERENCES, frameworks: ['AUSTRALIAN_PRIVACY', 'HIPAA'] },
  },
  {
    email: 'quality.director@medivac.one',
    name: 'Quality Director',
    title: 'Director of Quality',
    department: 'Clinical Quality',
    groups: ['clinical'],
    verified: true,
    verifiedAt: new Date().toISOString(),
    active: true,
    preferences: { ...DEFAULT_PREFERENCES, frameworks: ['NSQHS'] },
  },
  {
    email: 'it.director@medivac.one',
    name: 'IT Director',
    title: 'Director of Information Technology',
    department: 'IT',
    groups: ['it', 'security'],
    verified: true,
    verifiedAt: new Date().toISOString(),
    active: true,
    preferences: { ...DEFAULT_PREFERENCES, reportTypes: ['security', 'infrastructure'] },
  },
];

// ==========================================
// Service Class
// ==========================================

class EmailRecipientsService {
  private static instance: EmailRecipientsService;
  private recipients: Map<string, EmailRecipient> = new Map();
  private groups: Map<RecipientGroup, RecipientGroupConfig> = new Map();
  private templates: Map<string, EmailTemplate> = new Map();
  private deliveryTests: DeliveryTest[] = [];
  private auditLogs: EmailAuditLog[] = [];
  private initialized: boolean = false;
  private listeners: Set<(event: string, data: unknown) => void> = new Set();

  private constructor() {
    this.loadData();
  }

  static getInstance(): EmailRecipientsService {
    if (!EmailRecipientsService.instance) {
      EmailRecipientsService.instance = new EmailRecipientsService();
    }
    return EmailRecipientsService.instance;
  }

  subscribe(callback: (event: string, data: unknown) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private emit(event: string, data: unknown): void {
    this.listeners.forEach(cb => cb(event, data));
  }

  // ==========================================
  // Data Persistence
  // ==========================================

  private async loadData(): Promise<void> {
    try {
      const [recipients, groups, templates, tests, logs] = await Promise.all([
        AsyncStorage.getItem('email_recipients'),
        AsyncStorage.getItem('recipient_groups'),
        AsyncStorage.getItem('email_templates'),
        AsyncStorage.getItem('delivery_tests'),
        AsyncStorage.getItem('email_audit_logs'),
      ]);

      if (recipients) {
        const parsed = JSON.parse(recipients) as EmailRecipient[];
        parsed.forEach(r => this.recipients.set(r.id, r));
      } else {
        await this.initializeDefaultRecipients();
      }

      if (groups) {
        const parsed = JSON.parse(groups) as RecipientGroupConfig[];
        parsed.forEach(g => this.groups.set(g.id, g));
      } else {
        DEFAULT_GROUPS.forEach(g => this.groups.set(g.id, g));
      }

      if (templates) {
        const parsed = JSON.parse(templates) as EmailTemplate[];
        parsed.forEach(t => this.templates.set(t.id, t));
      } else {
        this.initializeDefaultTemplates();
      }

      if (tests) {
        this.deliveryTests = JSON.parse(tests);
      }

      if (logs) {
        this.auditLogs = JSON.parse(logs);
      }

      this.initialized = true;
      this.emit('data_loaded', { recipients: this.recipients.size });
    } catch (error) {
      console.error('Failed to load email recipients data:', error);
      await this.initializeDefaultRecipients();
    }
  }

  private async initializeDefaultRecipients(): Promise<void> {
    const now = new Date().toISOString();

    for (const template of DEFAULT_RECIPIENTS) {
      const recipient: EmailRecipient = {
        ...template,
        id: `recipient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: now,
        updatedAt: now,
      };
      this.recipients.set(recipient.id, recipient);
    }

    DEFAULT_GROUPS.forEach(g => this.groups.set(g.id, g));
    this.initializeDefaultTemplates();

    await this.saveData();
    this.emit('recipients_initialized', { count: this.recipients.size });
  }

  private initializeDefaultTemplates(): void {
    const templates: EmailTemplate[] = [
      {
        id: 'compliance_report',
        name: 'Compliance Report',
        subject: '[MediVac One] {{framework}} Compliance Report - {{date}}',
        bodyHtml: '<h1>{{framework}} Compliance Report</h1><p>Score: {{score}}%</p>',
        bodyText: '{{framework}} Compliance Report\nScore: {{score}}%',
        variables: ['framework', 'date', 'score', 'findings', 'recommendations'],
        reportType: 'compliance',
        active: true,
      },
      {
        id: 'security_alert',
        name: 'Security Alert',
        subject: '[MediVac One] Security Alert - {{severity}} - {{title}}',
        bodyHtml: '<h1>Security Alert</h1><p>Severity: {{severity}}</p><p>{{description}}</p>',
        bodyText: 'Security Alert\nSeverity: {{severity}}\n{{description}}',
        variables: ['severity', 'title', 'description', 'timestamp', 'action_required'],
        reportType: 'security',
        active: true,
      },
      {
        id: 'executive_summary',
        name: 'Executive Summary',
        subject: '[MediVac One] Weekly Executive Summary - {{date}}',
        bodyHtml: '<h1>Executive Summary</h1><p>Overall Compliance: {{score}}%</p>',
        bodyText: 'Executive Summary\nOverall Compliance: {{score}}%',
        variables: ['date', 'score', 'highlights', 'concerns', 'next_steps'],
        reportType: 'executive',
        active: true,
      },
    ];

    templates.forEach(t => this.templates.set(t.id, t));
  }

  private async saveData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem('email_recipients', JSON.stringify(Array.from(this.recipients.values()))),
        AsyncStorage.setItem('recipient_groups', JSON.stringify(Array.from(this.groups.values()))),
        AsyncStorage.setItem('email_templates', JSON.stringify(Array.from(this.templates.values()))),
        AsyncStorage.setItem('delivery_tests', JSON.stringify(this.deliveryTests.slice(0, 100))),
        AsyncStorage.setItem('email_audit_logs', JSON.stringify(this.auditLogs.slice(0, 500))),
      ]);
    } catch (error) {
      console.error('Failed to save email recipients data:', error);
    }
  }

  private addAuditLog(
    action: EmailAuditLog['action'],
    details: string,
    recipientId?: string,
    email?: string
  ): void {
    const log: EmailAuditLog = {
      id: `log_${Date.now()}`,
      action,
      recipientId,
      email,
      details,
      performedBy: 'system',
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(log);
    this.emit('audit_log', log);
  }

  // ==========================================
  // Recipient Management
  // ==========================================

  async addRecipient(data: Omit<EmailRecipient, 'id' | 'createdAt' | 'updatedAt' | 'verified' | 'verifiedAt'>): Promise<EmailRecipient> {
    // Validate email
    if (!this.validateEmail(data.email)) {
      throw new Error('Invalid email address');
    }

    // Check for duplicate
    const existing = Array.from(this.recipients.values()).find(r => r.email === data.email);
    if (existing) {
      throw new Error('Email address already exists');
    }

    const now = new Date().toISOString();
    const recipient: EmailRecipient = {
      ...data,
      id: `recipient_${Date.now()}`,
      verified: false,
      createdAt: now,
      updatedAt: now,
    };

    this.recipients.set(recipient.id, recipient);
    this.addAuditLog('created', `Added recipient: ${data.email}`, recipient.id, data.email);
    await this.saveData();
    this.emit('recipient_added', recipient);

    return recipient;
  }

  async updateRecipient(id: string, updates: Partial<EmailRecipient>): Promise<EmailRecipient | null> {
    const recipient = this.recipients.get(id);
    if (!recipient) return null;

    const updated: EmailRecipient = {
      ...recipient,
      ...updates,
      id: recipient.id,
      createdAt: recipient.createdAt,
      updatedAt: new Date().toISOString(),
    };

    this.recipients.set(id, updated);
    this.addAuditLog('updated', `Updated recipient: ${updated.email}`, id, updated.email);
    await this.saveData();
    this.emit('recipient_updated', updated);

    return updated;
  }

  async deleteRecipient(id: string): Promise<boolean> {
    const recipient = this.recipients.get(id);
    if (!recipient) return false;

    this.recipients.delete(id);
    this.addAuditLog('deleted', `Deleted recipient: ${recipient.email}`, id, recipient.email);
    await this.saveData();
    this.emit('recipient_deleted', { id, email: recipient.email });

    return true;
  }

  async verifyRecipient(id: string): Promise<EmailRecipient | null> {
    const recipient = this.recipients.get(id);
    if (!recipient) return null;

    const updated: EmailRecipient = {
      ...recipient,
      verified: true,
      verifiedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.recipients.set(id, updated);
    this.addAuditLog('verified', `Verified recipient: ${updated.email}`, id, updated.email);
    await this.saveData();
    this.emit('recipient_verified', updated);

    return updated;
  }

  async unsubscribeRecipient(id: string): Promise<EmailRecipient | null> {
    const recipient = this.recipients.get(id);
    if (!recipient) return null;

    const updated: EmailRecipient = {
      ...recipient,
      active: false,
      updatedAt: new Date().toISOString(),
    };

    this.recipients.set(id, updated);
    this.addAuditLog('unsubscribed', `Unsubscribed recipient: ${updated.email}`, id, updated.email);
    await this.saveData();
    this.emit('recipient_unsubscribed', updated);

    return updated;
  }

  getRecipient(id: string): EmailRecipient | undefined {
    return this.recipients.get(id);
  }

  getRecipientByEmail(email: string): EmailRecipient | undefined {
    return Array.from(this.recipients.values()).find(r => r.email === email);
  }

  getAllRecipients(): EmailRecipient[] {
    return Array.from(this.recipients.values());
  }

  getActiveRecipients(): EmailRecipient[] {
    return Array.from(this.recipients.values()).filter(r => r.active);
  }

  getVerifiedRecipients(): EmailRecipient[] {
    return Array.from(this.recipients.values()).filter(r => r.verified && r.active);
  }

  getRecipientsByGroup(group: RecipientGroup): EmailRecipient[] {
    return Array.from(this.recipients.values()).filter(r => r.groups.includes(group) && r.active);
  }

  // ==========================================
  // Group Management
  // ==========================================

  getGroup(id: RecipientGroup): RecipientGroupConfig | undefined {
    return this.groups.get(id);
  }

  getAllGroups(): RecipientGroupConfig[] {
    return Array.from(this.groups.values());
  }

  async updateGroup(id: RecipientGroup, updates: Partial<RecipientGroupConfig>): Promise<RecipientGroupConfig | null> {
    const group = this.groups.get(id);
    if (!group) return null;

    const updated: RecipientGroupConfig = {
      ...group,
      ...updates,
      id: group.id,
    };

    this.groups.set(id, updated);
    await this.saveData();
    this.emit('group_updated', updated);

    return updated;
  }

  async addRecipientToGroup(recipientId: string, group: RecipientGroup): Promise<boolean> {
    const recipient = this.recipients.get(recipientId);
    if (!recipient) return false;

    if (!recipient.groups.includes(group)) {
      recipient.groups.push(group);
      recipient.updatedAt = new Date().toISOString();
      await this.saveData();
      this.emit('recipient_group_added', { recipientId, group });
    }

    return true;
  }

  async removeRecipientFromGroup(recipientId: string, group: RecipientGroup): Promise<boolean> {
    const recipient = this.recipients.get(recipientId);
    if (!recipient) return false;

    const index = recipient.groups.indexOf(group);
    if (index > -1) {
      recipient.groups.splice(index, 1);
      recipient.updatedAt = new Date().toISOString();
      await this.saveData();
      this.emit('recipient_group_removed', { recipientId, group });
    }

    return true;
  }

  // ==========================================
  // Preferences Management
  // ==========================================

  async updatePreferences(recipientId: string, preferences: Partial<RecipientPreferences>): Promise<EmailRecipient | null> {
    const recipient = this.recipients.get(recipientId);
    if (!recipient) return null;

    const updated: EmailRecipient = {
      ...recipient,
      preferences: { ...recipient.preferences, ...preferences },
      updatedAt: new Date().toISOString(),
    };

    this.recipients.set(recipientId, updated);
    await this.saveData();
    this.emit('preferences_updated', { recipientId, preferences: updated.preferences });

    return updated;
  }

  // ==========================================
  // Email Templates
  // ==========================================

  getTemplate(id: string): EmailTemplate | undefined {
    return this.templates.get(id);
  }

  getAllTemplates(): EmailTemplate[] {
    return Array.from(this.templates.values());
  }

  async updateTemplate(id: string, updates: Partial<EmailTemplate>): Promise<EmailTemplate | null> {
    const template = this.templates.get(id);
    if (!template) return null;

    const updated: EmailTemplate = {
      ...template,
      ...updates,
      id: template.id,
    };

    this.templates.set(id, updated);
    await this.saveData();
    this.emit('template_updated', updated);

    return updated;
  }

  // ==========================================
  // Delivery Testing
  // ==========================================

  async sendTestEmail(recipientId: string): Promise<DeliveryTest> {
    const recipient = this.recipients.get(recipientId);
    if (!recipient) {
      throw new Error('Recipient not found');
    }

    const test: DeliveryTest = {
      id: `test_${Date.now()}`,
      recipientId,
      email: recipient.email,
      sentAt: new Date().toISOString(),
      status: 'pending',
    };

    this.deliveryTests.unshift(test);

    // Simulate sending
    setTimeout(async () => {
      test.status = 'sent';
      setTimeout(() => {
        test.status = Math.random() > 0.1 ? 'delivered' : 'failed';
        test.deliveredAt = test.status === 'delivered' ? new Date().toISOString() : undefined;
        test.error = test.status === 'failed' ? 'Delivery failed - mailbox not found' : undefined;
        this.emit('test_completed', test);
        this.saveData();
      }, 2000);
    }, 1000);

    await this.saveData();
    this.emit('test_sent', test);

    return test;
  }

  getDeliveryTests(recipientId?: string): DeliveryTest[] {
    if (recipientId) {
      return this.deliveryTests.filter(t => t.recipientId === recipientId);
    }
    return this.deliveryTests;
  }

  // ==========================================
  // Import/Export
  // ==========================================

  exportRecipients(): string {
    const recipients = Array.from(this.recipients.values());
    return JSON.stringify(recipients, null, 2);
  }

  async importRecipients(jsonData: string): Promise<{ imported: number; skipped: number; errors: string[] }> {
    const result = { imported: 0, skipped: 0, errors: [] as string[] };

    try {
      const data = JSON.parse(jsonData) as EmailRecipient[];

      for (const item of data) {
        try {
          const existing = this.getRecipientByEmail(item.email);
          if (existing) {
            result.skipped++;
            continue;
          }

          await this.addRecipient({
            email: item.email,
            name: item.name,
            title: item.title,
            department: item.department,
            groups: item.groups || ['custom'],
            active: item.active ?? true,
            preferences: item.preferences || DEFAULT_PREFERENCES,
          });
          result.imported++;
        } catch (error) {
          result.errors.push(`Failed to import ${item.email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    } catch (error) {
      result.errors.push(`Invalid JSON data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  // ==========================================
  // Audit Logs
  // ==========================================

  getAuditLogs(limit: number = 100): EmailAuditLog[] {
    return this.auditLogs.slice(0, limit);
  }

  getAuditLogsForRecipient(recipientId: string): EmailAuditLog[] {
    return this.auditLogs.filter(l => l.recipientId === recipientId);
  }

  // ==========================================
  // Statistics
  // ==========================================

  getStatistics(): {
    totalRecipients: number;
    activeRecipients: number;
    verifiedRecipients: number;
    unverifiedRecipients: number;
    groupCounts: Record<RecipientGroup, number>;
    recentTests: number;
    deliveryRate: number;
  } {
    const recipients = Array.from(this.recipients.values());
    const recentTests = this.deliveryTests.filter(
      t => new Date(t.sentAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    const deliveredTests = recentTests.filter(t => t.status === 'delivered');

    const groupCounts: Record<RecipientGroup, number> = {
      compliance: 0,
      security: 0,
      executive: 0,
      clinical: 0,
      it: 0,
      custom: 0,
    };

    recipients.forEach(r => {
      r.groups.forEach(g => {
        groupCounts[g]++;
      });
    });

    return {
      totalRecipients: recipients.length,
      activeRecipients: recipients.filter(r => r.active).length,
      verifiedRecipients: recipients.filter(r => r.verified).length,
      unverifiedRecipients: recipients.filter(r => !r.verified).length,
      groupCounts,
      recentTests: recentTests.length,
      deliveryRate: recentTests.length > 0 ? (deliveredTests.length / recentTests.length) * 100 : 100,
    };
  }

  // ==========================================
  // Utilities
  // ==========================================

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

export const emailRecipientsService = EmailRecipientsService.getInstance();
