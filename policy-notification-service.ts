/**
 * Policy Change Notification Service
 * Alerts department heads when access policies are modified
 * MediVac One v5.3
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  NOTIFICATION_CONFIG: 'medivac_policy_notification_config',
  NOTIFICATION_HISTORY: 'medivac_policy_notification_history',
  SUBSCRIBER_LIST: 'medivac_policy_subscribers',
  READ_RECEIPTS: 'medivac_notification_receipts',
};

// Types
export type NotificationChannel = 'email' | 'push' | 'sms' | 'in_app';
export type ChangeType = 'created' | 'modified' | 'deleted' | 'activated' | 'deactivated';
export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface PolicyChangeEvent {
  id: string;
  policyId: string;
  policyName: string;
  department: string;
  changeType: ChangeType;
  changedBy: string;
  changedAt: string;
  previousValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  changeSummary: string;
  affectedRoles: string[];
  requiresApproval: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
}

export interface NotificationSubscriber {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  department: string;
  channels: NotificationChannel[];
  preferences: NotificationPreferences;
  isActive: boolean;
  createdAt: string;
}

export interface NotificationPreferences {
  immediateAlerts: boolean;
  dailyDigest: boolean;
  digestTime?: string;
  changeTypes: ChangeType[];
  departments: string[];
  minSeverity: 'all' | 'medium' | 'high' | 'critical';
  quietHours?: { start: string; end: string };
}

export interface PolicyNotification {
  id: string;
  eventId: string;
  subscriberId: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  title: string;
  body: string;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  failureReason?: string;
  retryCount: number;
  createdAt: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  changeType: ChangeType;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  variables: string[];
}

export interface ApprovalWorkflow {
  id: string;
  eventId: string;
  requiredApprovers: string[];
  currentApprovers: string[];
  approvalThreshold: number;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  expiresAt: string;
  createdAt: string;
}

export interface NotificationStats {
  totalSent: number;
  totalDelivered: number;
  totalRead: number;
  totalFailed: number;
  deliveryRate: number;
  readRate: number;
  avgDeliveryTime: number;
  byChannel: Record<NotificationChannel, number>;
  byDepartment: Record<string, number>;
}

class PolicyNotificationService {
  private subscribers: NotificationSubscriber[] = [];
  private notifications: PolicyNotification[] = [];
  private templates: NotificationTemplate[] = [];

  async initialize(): Promise<void> {
    await this.loadSubscribers();
    await this.loadNotifications();
    this.initializeTemplates();
  }

  /**
   * Notify subscribers of policy change
   */
  async notifyPolicyChange(event: PolicyChangeEvent): Promise<PolicyNotification[]> {
    const sentNotifications: PolicyNotification[] = [];

    // Get relevant subscribers
    const relevantSubscribers = this.getRelevantSubscribers(event);

    for (const subscriber of relevantSubscribers) {
      // Check preferences
      if (!this.shouldNotify(subscriber, event)) continue;

      for (const channel of subscriber.channels) {
        const notification = await this.createNotification(event, subscriber, channel);
        sentNotifications.push(notification);

        // Send notification
        await this.sendNotification(notification);
      }
    }

    // Save notifications
    this.notifications.push(...sentNotifications);
    await this.saveNotifications();

    return sentNotifications;
  }

  /**
   * Get all subscribers
   */
  getSubscribers(): NotificationSubscriber[] {
    return [...this.subscribers];
  }

  /**
   * Add or update subscriber
   */
  async saveSubscriber(subscriber: Partial<NotificationSubscriber>): Promise<NotificationSubscriber> {
    const now = new Date().toISOString();

    if (subscriber.id) {
      const index = this.subscribers.findIndex(s => s.id === subscriber.id);
      if (index >= 0) {
        this.subscribers[index] = { ...this.subscribers[index], ...subscriber };
        await this.saveSubscribers();
        return this.subscribers[index];
      }
    }

    const newSubscriber: NotificationSubscriber = {
      id: `sub_${Date.now()}`,
      userId: subscriber.userId || '',
      name: subscriber.name || '',
      email: subscriber.email || '',
      phone: subscriber.phone,
      role: subscriber.role || '',
      department: subscriber.department || '',
      channels: subscriber.channels || ['email', 'in_app'],
      preferences: subscriber.preferences || {
        immediateAlerts: true,
        dailyDigest: false,
        changeTypes: ['created', 'modified', 'deleted'],
        departments: [],
        minSeverity: 'all',
      },
      isActive: subscriber.isActive ?? true,
      createdAt: now,
    };

    this.subscribers.push(newSubscriber);
    await this.saveSubscribers();
    return newSubscriber;
  }

  /**
   * Remove subscriber
   */
  async removeSubscriber(subscriberId: string): Promise<boolean> {
    const index = this.subscribers.findIndex(s => s.id === subscriberId);
    if (index >= 0) {
      this.subscribers.splice(index, 1);
      await this.saveSubscribers();
      return true;
    }
    return false;
  }

  /**
   * Get notification history
   */
  getNotificationHistory(filters?: {
    subscriberId?: string;
    department?: string;
    status?: NotificationStatus;
    startDate?: string;
    endDate?: string;
  }): PolicyNotification[] {
    let filtered = [...this.notifications];

    if (filters?.subscriberId) {
      filtered = filtered.filter(n => n.subscriberId === filters.subscriberId);
    }
    if (filters?.status) {
      filtered = filtered.filter(n => n.status === filters.status);
    }
    if (filters?.startDate) {
      filtered = filtered.filter(n => n.createdAt >= filters.startDate!);
    }
    if (filters?.endDate) {
      filtered = filtered.filter(n => n.createdAt <= filters.endDate!);
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification && notification.status !== 'read') {
      notification.status = 'read';
      notification.readAt = new Date().toISOString();
      await this.saveNotifications();
      await this.saveReadReceipt(notificationId);
    }
  }

  /**
   * Create approval workflow for policy change
   */
  async createApprovalWorkflow(event: PolicyChangeEvent, approvers: string[]): Promise<ApprovalWorkflow> {
    const workflow: ApprovalWorkflow = {
      id: `approval_${Date.now()}`,
      eventId: event.id,
      requiredApprovers: approvers,
      currentApprovers: [],
      approvalThreshold: Math.ceil(approvers.length / 2), // Majority approval
      status: 'pending',
      expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(), // 72 hours
      createdAt: new Date().toISOString(),
    };

    // Notify approvers
    for (const approverId of approvers) {
      const subscriber = this.subscribers.find(s => s.userId === approverId);
      if (subscriber) {
        await this.sendApprovalRequest(workflow, subscriber, event);
      }
    }

    return workflow;
  }

  /**
   * Process approval response
   */
  async processApproval(workflowId: string, approverId: string, approved: boolean): Promise<ApprovalWorkflow | null> {
    // This would be stored and managed - simplified for demo
    console.log(`[APPROVAL] Workflow ${workflowId}: ${approverId} ${approved ? 'approved' : 'rejected'}`);
    return null;
  }

  /**
   * Get notification statistics
   */
  async getStats(): Promise<NotificationStats> {
    const total = this.notifications.length;
    const delivered = this.notifications.filter(n => n.status === 'delivered' || n.status === 'read').length;
    const read = this.notifications.filter(n => n.status === 'read').length;
    const failed = this.notifications.filter(n => n.status === 'failed').length;

    const byChannel: Record<NotificationChannel, number> = {
      email: 0,
      push: 0,
      sms: 0,
      in_app: 0,
    };

    const byDepartment: Record<string, number> = {};

    for (const notification of this.notifications) {
      byChannel[notification.channel]++;
      
      const subscriber = this.subscribers.find(s => s.id === notification.subscriberId);
      if (subscriber) {
        byDepartment[subscriber.department] = (byDepartment[subscriber.department] || 0) + 1;
      }
    }

    return {
      totalSent: total,
      totalDelivered: delivered,
      totalRead: read,
      totalFailed: failed,
      deliveryRate: total > 0 ? (delivered / total) * 100 : 100,
      readRate: delivered > 0 ? (read / delivered) * 100 : 0,
      avgDeliveryTime: 2.5, // Mock average in seconds
      byChannel,
      byDepartment,
    };
  }

  /**
   * Send bulk notification to department
   */
  async notifyDepartment(department: string, message: { title: string; body: string }): Promise<number> {
    const departmentSubscribers = this.subscribers.filter(
      s => s.department === department && s.isActive
    );

    let sentCount = 0;
    for (const subscriber of departmentSubscribers) {
      for (const channel of subscriber.channels) {
        const notification: PolicyNotification = {
          id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          eventId: 'bulk_notification',
          subscriberId: subscriber.id,
          channel,
          status: 'pending',
          title: message.title,
          body: message.body,
          retryCount: 0,
          createdAt: new Date().toISOString(),
        };

        await this.sendNotification(notification);
        this.notifications.push(notification);
        sentCount++;
      }
    }

    await this.saveNotifications();
    return sentCount;
  }

  // Private methods

  private async loadSubscribers(): Promise<void> {
    const subscribersStr = await AsyncStorage.getItem(STORAGE_KEYS.SUBSCRIBER_LIST);
    this.subscribers = subscribersStr ? JSON.parse(subscribersStr) : this.getDefaultSubscribers();
  }

  private async saveSubscribers(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIBER_LIST, JSON.stringify(this.subscribers));
  }

  private async loadNotifications(): Promise<void> {
    const notificationsStr = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_HISTORY);
    this.notifications = notificationsStr ? JSON.parse(notificationsStr) : [];
  }

  private async saveNotifications(): Promise<void> {
    // Keep only last 1000 notifications
    const toSave = this.notifications.slice(-1000);
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_HISTORY, JSON.stringify(toSave));
  }

  private async saveReadReceipt(notificationId: string): Promise<void> {
    const receiptsStr = await AsyncStorage.getItem(STORAGE_KEYS.READ_RECEIPTS);
    const receipts = receiptsStr ? JSON.parse(receiptsStr) : {};
    receipts[notificationId] = new Date().toISOString();
    await AsyncStorage.setItem(STORAGE_KEYS.READ_RECEIPTS, JSON.stringify(receipts));
  }

  private getRelevantSubscribers(event: PolicyChangeEvent): NotificationSubscriber[] {
    return this.subscribers.filter(s => {
      if (!s.isActive) return false;
      
      // Department heads of affected department
      if (s.department === event.department) return true;
      
      // Subscribers who monitor all departments
      if (s.preferences.departments.length === 0) return true;
      
      // Subscribers who specifically monitor this department
      if (s.preferences.departments.includes(event.department)) return true;
      
      return false;
    });
  }

  private shouldNotify(subscriber: NotificationSubscriber, event: PolicyChangeEvent): boolean {
    const prefs = subscriber.preferences;

    // Check change type preference
    if (!prefs.changeTypes.includes(event.changeType)) return false;

    // Check quiet hours
    if (prefs.quietHours) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      if (currentTime >= prefs.quietHours.start && currentTime <= prefs.quietHours.end) {
        return false;
      }
    }

    return true;
  }

  private async createNotification(
    event: PolicyChangeEvent,
    subscriber: NotificationSubscriber,
    channel: NotificationChannel
  ): Promise<PolicyNotification> {
    const template = this.templates.find(t => t.changeType === event.changeType);
    
    const title = template 
      ? this.renderTemplate(template.subject, event)
      : `Policy ${event.changeType}: ${event.policyName}`;
    
    const body = template
      ? this.renderTemplate(template.bodyText, event)
      : event.changeSummary;

    return {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      eventId: event.id,
      subscriberId: subscriber.id,
      channel,
      status: 'pending',
      title,
      body,
      retryCount: 0,
      createdAt: new Date().toISOString(),
    };
  }

  private async sendNotification(notification: PolicyNotification): Promise<void> {
    try {
      // Simulate sending based on channel
      switch (notification.channel) {
        case 'email':
          console.log(`[EMAIL] Sending to subscriber ${notification.subscriberId}: ${notification.title}`);
          break;
        case 'push':
          console.log(`[PUSH] Sending to subscriber ${notification.subscriberId}: ${notification.title}`);
          break;
        case 'sms':
          console.log(`[SMS] Sending to subscriber ${notification.subscriberId}: ${notification.title}`);
          break;
        case 'in_app':
          console.log(`[IN_APP] Creating notification for ${notification.subscriberId}: ${notification.title}`);
          break;
      }

      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 100));

      notification.status = 'delivered';
      notification.sentAt = new Date().toISOString();
      notification.deliveredAt = new Date().toISOString();
    } catch (error) {
      notification.status = 'failed';
      notification.failureReason = error instanceof Error ? error.message : 'Unknown error';
      notification.retryCount++;
    }
  }

  private async sendApprovalRequest(
    workflow: ApprovalWorkflow,
    subscriber: NotificationSubscriber,
    event: PolicyChangeEvent
  ): Promise<void> {
    const notification: PolicyNotification = {
      id: `approval_notif_${Date.now()}`,
      eventId: event.id,
      subscriberId: subscriber.id,
      channel: 'email',
      status: 'pending',
      title: `Approval Required: ${event.policyName} Policy Change`,
      body: `A policy change requires your approval.\n\nPolicy: ${event.policyName}\nDepartment: ${event.department}\nChange: ${event.changeSummary}\n\nPlease review and approve/reject within 72 hours.`,
      retryCount: 0,
      createdAt: new Date().toISOString(),
    };

    await this.sendNotification(notification);
    this.notifications.push(notification);
  }

  private renderTemplate(template: string, event: PolicyChangeEvent): string {
    return template
      .replace(/{{policyName}}/g, event.policyName)
      .replace(/{{department}}/g, event.department)
      .replace(/{{changeType}}/g, event.changeType)
      .replace(/{{changedBy}}/g, event.changedBy)
      .replace(/{{changeSummary}}/g, event.changeSummary)
      .replace(/{{changedAt}}/g, new Date(event.changedAt).toLocaleString());
  }

  private initializeTemplates(): void {
    this.templates = [
      {
        id: 'template_created',
        name: 'Policy Created',
        changeType: 'created',
        subject: 'New Policy Created: {{policyName}}',
        bodyText: 'A new policy "{{policyName}}" has been created for {{department}} department by {{changedBy}}.\n\n{{changeSummary}}',
        bodyHtml: '<h2>New Policy Created</h2><p>Policy: {{policyName}}</p><p>Department: {{department}}</p>',
        variables: ['policyName', 'department', 'changedBy', 'changeSummary'],
      },
      {
        id: 'template_modified',
        name: 'Policy Modified',
        changeType: 'modified',
        subject: 'Policy Updated: {{policyName}}',
        bodyText: 'The policy "{{policyName}}" for {{department}} department has been modified by {{changedBy}}.\n\n{{changeSummary}}',
        bodyHtml: '<h2>Policy Updated</h2><p>Policy: {{policyName}}</p><p>Department: {{department}}</p>',
        variables: ['policyName', 'department', 'changedBy', 'changeSummary'],
      },
      {
        id: 'template_deleted',
        name: 'Policy Deleted',
        changeType: 'deleted',
        subject: 'Policy Removed: {{policyName}}',
        bodyText: 'The policy "{{policyName}}" for {{department}} department has been deleted by {{changedBy}}.',
        bodyHtml: '<h2>Policy Removed</h2><p>Policy: {{policyName}}</p><p>Department: {{department}}</p>',
        variables: ['policyName', 'department', 'changedBy'],
      },
    ];
  }

  private getDefaultSubscribers(): NotificationSubscriber[] {
    return [
      {
        id: 'sub_default_1',
        userId: 'user_admin',
        name: 'System Administrator',
        email: 'admin@medivac.one',
        role: 'administrator',
        department: 'IT',
        channels: ['email', 'in_app'],
        preferences: {
          immediateAlerts: true,
          dailyDigest: true,
          digestTime: '08:00',
          changeTypes: ['created', 'modified', 'deleted', 'activated', 'deactivated'],
          departments: [],
          minSeverity: 'all',
        },
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'sub_default_2',
        userId: 'user_security',
        name: 'Security Officer',
        email: 'security@medivac.one',
        role: 'security_officer',
        department: 'Security',
        channels: ['email', 'push', 'in_app'],
        preferences: {
          immediateAlerts: true,
          dailyDigest: false,
          changeTypes: ['created', 'modified', 'deleted'],
          departments: [],
          minSeverity: 'all',
        },
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    ];
  }
}

export const policyNotificationService = new PolicyNotificationService();
