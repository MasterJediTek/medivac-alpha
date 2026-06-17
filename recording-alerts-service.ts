/**
 * Recording Alerts Service
 * Manages notifications and alerts for voice chat recordings
 * Notifies participants when JEDI Master starts recording
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export type AlertType = 'recording_started' | 'recording_stopped' | 'recording_paused' | 'recording_resumed' | 'consent_required' | 'opt_out_confirmed';
export type AlertPriority = 'low' | 'normal' | 'high' | 'critical';
export type ConsentStatus = 'pending' | 'granted' | 'denied' | 'withdrawn';

export interface RecordingAlert {
  id: string;
  type: AlertType;
  recordingId: string;
  channelId: string;
  channelName: string;
  missionId?: string;
  missionName?: string;
  requestedBy: string;
  requestedByName: string;
  requestedByRank: string;
  priority: AlertPriority;
  message: string;
  timestamp: string;
  recipients: AlertRecipient[];
  deliveryStatus: 'pending' | 'sent' | 'delivered' | 'failed';
  readBy: string[];
  acknowledgedBy: string[];
}

export interface AlertRecipient {
  odId: string;
  name: string;
  channel: 'push' | 'in_app' | 'both' | 'none';
  delivered: boolean;
  deliveredAt?: string;
  read: boolean;
  readAt?: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
}

export interface UserAlertPreferences {
  odId: string;
  name: string;
  enableRecordingAlerts: boolean;
  alertChannel: 'push' | 'in_app' | 'both' | 'none';
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  showInLockScreen: boolean;
  optOutOfRecording: boolean;
  optOutReason?: string;
  optOutAt?: string;
  consentGiven: boolean;
  consentGivenAt?: string;
  muteUntil?: string;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  allowCriticalAlerts: boolean;
}

export interface RecordingConsent {
  id: string;
  recordingId: string;
  odId: string;
  name: string;
  status: ConsentStatus;
  requestedAt: string;
  respondedAt?: string;
  reason?: string;
  ipAddress?: string;
  deviceInfo?: string;
  expiresAt?: string;
}

export interface AlertHistory {
  id: string;
  alertId: string;
  action: 'created' | 'sent' | 'delivered' | 'read' | 'acknowledged' | 'failed' | 'retried';
  timestamp: string;
  details?: string;
  recipientId?: string;
}

export interface AlertAnalytics {
  totalAlerts: number;
  alertsByType: Record<AlertType, number>;
  alertsByPriority: Record<AlertPriority, number>;
  deliveryRate: number;
  readRate: number;
  acknowledgeRate: number;
  averageDeliveryTime: number;
  optOutCount: number;
  consentStats: {
    granted: number;
    denied: number;
    pending: number;
    withdrawn: number;
  };
}

// Storage keys
const STORAGE_KEYS = {
  ALERTS: '@medivac_recording_alerts',
  PREFERENCES: '@medivac_alert_preferences',
  CONSENTS: '@medivac_recording_consents',
  HISTORY: '@medivac_alert_history',
};

// Default preferences
const DEFAULT_PREFERENCES: Omit<UserAlertPreferences, 'odId' | 'name'> = {
  enableRecordingAlerts: true,
  alertChannel: 'both',
  soundEnabled: true,
  vibrationEnabled: true,
  showInLockScreen: true,
  optOutOfRecording: false,
  consentGiven: false,
  allowCriticalAlerts: true,
};

class RecordingAlertsService {
  private alerts: RecordingAlert[] = [];
  private preferences: Map<string, UserAlertPreferences> = new Map();
  private consents: RecordingConsent[] = [];
  private history: AlertHistory[] = [];
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    await this.loadData();
    this.initialized = true;
  }

  private async loadData(): Promise<void> {
    try {
      const [alertsData, prefsData, consentsData, historyData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.ALERTS),
        AsyncStorage.getItem(STORAGE_KEYS.PREFERENCES),
        AsyncStorage.getItem(STORAGE_KEYS.CONSENTS),
        AsyncStorage.getItem(STORAGE_KEYS.HISTORY),
      ]);

      if (alertsData) this.alerts = JSON.parse(alertsData);
      if (prefsData) {
        const prefsArray: UserAlertPreferences[] = JSON.parse(prefsData);
        prefsArray.forEach(p => this.preferences.set(p.odId, p));
      }
      if (consentsData) this.consents = JSON.parse(consentsData);
      if (historyData) this.history = JSON.parse(historyData);
    } catch (error) {
      console.error('Failed to load recording alerts data:', error);
    }
  }

  private async saveData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(this.alerts)),
        AsyncStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(Array.from(this.preferences.values()))),
        AsyncStorage.setItem(STORAGE_KEYS.CONSENTS, JSON.stringify(this.consents)),
        AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(this.history)),
      ]);
    } catch (error) {
      console.error('Failed to save recording alerts data:', error);
    }
  }

  // Alert Management
  async sendRecordingStartedAlert(
    recordingId: string,
    channelId: string,
    channelName: string,
    requestedBy: string,
    requestedByName: string,
    requestedByRank: string,
    participantIds: string[],
    options?: {
      missionId?: string;
      missionName?: string;
      priority?: AlertPriority;
    }
  ): Promise<RecordingAlert> {
    const recipients: AlertRecipient[] = participantIds.map(odId => {
      const prefs = this.preferences.get(odId);
      return {
        odId,
        name: prefs?.name || 'Unknown',
        channel: prefs?.alertChannel || 'both',
        delivered: false,
        read: false,
        acknowledged: false,
      };
    }).filter(r => {
      const prefs = this.preferences.get(r.odId);
      return prefs?.enableRecordingAlerts !== false && prefs?.alertChannel !== 'none';
    });

    const alert: RecordingAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'recording_started',
      recordingId,
      channelId,
      channelName,
      missionId: options?.missionId,
      missionName: options?.missionName,
      requestedBy,
      requestedByName,
      requestedByRank,
      priority: options?.priority || 'high',
      message: `🎙️ Recording started by ${requestedByName} in ${channelName}`,
      timestamp: new Date().toISOString(),
      recipients,
      deliveryStatus: 'pending',
      readBy: [],
      acknowledgedBy: [],
    };

    this.alerts.unshift(alert);
    this.addHistory(alert.id, 'created');

    // Simulate sending alerts
    await this.deliverAlert(alert);

    await this.saveData();
    return alert;
  }

  async sendRecordingStoppedAlert(recordingId: string): Promise<RecordingAlert | null> {
    const startAlert = this.alerts.find(a => a.recordingId === recordingId && a.type === 'recording_started');
    if (!startAlert) return null;

    const alert: RecordingAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'recording_stopped',
      recordingId,
      channelId: startAlert.channelId,
      channelName: startAlert.channelName,
      missionId: startAlert.missionId,
      missionName: startAlert.missionName,
      requestedBy: startAlert.requestedBy,
      requestedByName: startAlert.requestedByName,
      requestedByRank: startAlert.requestedByRank,
      priority: 'normal',
      message: `⏹️ Recording stopped in ${startAlert.channelName}`,
      timestamp: new Date().toISOString(),
      recipients: startAlert.recipients.map(r => ({ ...r, delivered: false, read: false, acknowledged: false })),
      deliveryStatus: 'pending',
      readBy: [],
      acknowledgedBy: [],
    };

    this.alerts.unshift(alert);
    this.addHistory(alert.id, 'created');
    await this.deliverAlert(alert);
    await this.saveData();
    return alert;
  }

  private async deliverAlert(alert: RecordingAlert): Promise<void> {
    // Simulate delivery to each recipient
    for (const recipient of alert.recipients) {
      const prefs = this.preferences.get(recipient.odId);
      
      // Check if user has opted out or disabled alerts
      if (prefs?.optOutOfRecording || prefs?.alertChannel === 'none') {
        continue;
      }

      // Check quiet hours
      if (prefs?.quietHoursStart && prefs?.quietHoursEnd) {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        if (currentTime >= prefs.quietHoursStart && currentTime <= prefs.quietHoursEnd) {
          if (!prefs.allowCriticalAlerts || alert.priority !== 'critical') {
            continue;
          }
        }
      }

      // Simulate successful delivery
      recipient.delivered = true;
      recipient.deliveredAt = new Date().toISOString();
      this.addHistory(alert.id, 'delivered', undefined, recipient.odId);
    }

    alert.deliveryStatus = alert.recipients.some(r => r.delivered) ? 'sent' : 'failed';
    this.addHistory(alert.id, alert.deliveryStatus === 'sent' ? 'sent' : 'failed');
  }

  async markAlertRead(alertId: string, odId: string): Promise<boolean> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) return false;

    const recipient = alert.recipients.find(r => r.odId === odId);
    if (recipient && !recipient.read) {
      recipient.read = true;
      recipient.readAt = new Date().toISOString();
      if (!alert.readBy.includes(odId)) {
        alert.readBy.push(odId);
      }
      this.addHistory(alertId, 'read', undefined, odId);
      await this.saveData();
    }
    return true;
  }

  async acknowledgeAlert(alertId: string, odId: string): Promise<boolean> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) return false;

    const recipient = alert.recipients.find(r => r.odId === odId);
    if (recipient && !recipient.acknowledged) {
      recipient.acknowledged = true;
      recipient.acknowledgedAt = new Date().toISOString();
      if (!alert.acknowledgedBy.includes(odId)) {
        alert.acknowledgedBy.push(odId);
      }
      this.addHistory(alertId, 'acknowledged', undefined, odId);
      await this.saveData();
    }
    return true;
  }

  // User Preferences
  async getUserPreferences(odId: string): Promise<UserAlertPreferences> {
    let prefs = this.preferences.get(odId);
    if (!prefs) {
      prefs = {
        odId,
        name: 'Unknown User',
        ...DEFAULT_PREFERENCES,
      };
      this.preferences.set(odId, prefs);
      await this.saveData();
    }
    return prefs;
  }

  async updateUserPreferences(
    odId: string,
    updates: Partial<UserAlertPreferences>
  ): Promise<UserAlertPreferences> {
    let prefs = this.preferences.get(odId);
    if (!prefs) {
      prefs = {
        odId,
        name: updates.name || 'Unknown User',
        ...DEFAULT_PREFERENCES,
      };
    }

    const updated = { ...prefs, ...updates };
    this.preferences.set(odId, updated);
    await this.saveData();
    return updated;
  }

  async optOutOfRecording(odId: string, name: string, reason?: string): Promise<boolean> {
    const prefs = await this.getUserPreferences(odId);
    prefs.name = name;
    prefs.optOutOfRecording = true;
    prefs.optOutReason = reason;
    prefs.optOutAt = new Date().toISOString();
    this.preferences.set(odId, prefs);
    await this.saveData();
    return true;
  }

  async optInToRecording(odId: string): Promise<boolean> {
    const prefs = await this.getUserPreferences(odId);
    prefs.optOutOfRecording = false;
    prefs.optOutReason = undefined;
    prefs.optOutAt = undefined;
    this.preferences.set(odId, prefs);
    await this.saveData();
    return true;
  }

  // Consent Management
  async requestConsent(
    recordingId: string,
    odId: string,
    name: string
  ): Promise<RecordingConsent> {
    const consent: RecordingConsent = {
      id: `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      recordingId,
      odId,
      name,
      status: 'pending',
      requestedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    };

    this.consents.push(consent);
    await this.saveData();
    return consent;
  }

  async respondToConsent(
    consentId: string,
    status: 'granted' | 'denied',
    reason?: string
  ): Promise<RecordingConsent | null> {
    const consent = this.consents.find(c => c.id === consentId);
    if (!consent || consent.status !== 'pending') return null;

    consent.status = status;
    consent.respondedAt = new Date().toISOString();
    consent.reason = reason;

    // Update user preferences if consent granted
    if (status === 'granted') {
      const prefs = await this.getUserPreferences(consent.odId);
      prefs.consentGiven = true;
      prefs.consentGivenAt = new Date().toISOString();
      this.preferences.set(consent.odId, prefs);
    }

    await this.saveData();
    return consent;
  }

  async withdrawConsent(odId: string, recordingId: string, reason?: string): Promise<boolean> {
    const consent = this.consents.find(c => c.odId === odId && c.recordingId === recordingId);
    if (consent) {
      consent.status = 'withdrawn';
      consent.reason = reason;
    }

    const prefs = await this.getUserPreferences(odId);
    prefs.consentGiven = false;
    this.preferences.set(odId, prefs);

    await this.saveData();
    return true;
  }

  getConsentStatus(odId: string, recordingId: string): ConsentStatus | null {
    const consent = this.consents.find(c => c.odId === odId && c.recordingId === recordingId);
    return consent?.status || null;
  }

  // Query Methods
  getAlerts(filters?: {
    type?: AlertType;
    recordingId?: string;
    channelId?: string;
    priority?: AlertPriority;
    recipientId?: string;
    unreadOnly?: boolean;
    limit?: number;
  }): RecordingAlert[] {
    let filtered = [...this.alerts];

    if (filters?.type) {
      filtered = filtered.filter(a => a.type === filters.type);
    }
    if (filters?.recordingId) {
      filtered = filtered.filter(a => a.recordingId === filters.recordingId);
    }
    if (filters?.channelId) {
      filtered = filtered.filter(a => a.channelId === filters.channelId);
    }
    if (filters?.priority) {
      filtered = filtered.filter(a => a.priority === filters.priority);
    }
    if (filters?.recipientId) {
      filtered = filtered.filter(a => a.recipients.some(r => r.odId === filters.recipientId));
    }
    if (filters?.unreadOnly) {
      filtered = filtered.filter(a => 
        filters.recipientId 
          ? !a.readBy.includes(filters.recipientId)
          : a.readBy.length < a.recipients.length
      );
    }
    if (filters?.limit) {
      filtered = filtered.slice(0, filters.limit);
    }

    return filtered;
  }

  getAlertsForUser(odId: string, unreadOnly = false): RecordingAlert[] {
    return this.getAlerts({ recipientId: odId, unreadOnly });
  }

  getConsents(filters?: {
    recordingId?: string;
    odId?: string;
    status?: ConsentStatus;
  }): RecordingConsent[] {
    let filtered = [...this.consents];

    if (filters?.recordingId) {
      filtered = filtered.filter(c => c.recordingId === filters.recordingId);
    }
    if (filters?.odId) {
      filtered = filtered.filter(c => c.odId === filters.odId);
    }
    if (filters?.status) {
      filtered = filtered.filter(c => c.status === filters.status);
    }

    return filtered;
  }

  getOptedOutUsers(): UserAlertPreferences[] {
    return Array.from(this.preferences.values()).filter(p => p.optOutOfRecording);
  }

  // History
  private addHistory(alertId: string, action: AlertHistory['action'], details?: string, recipientId?: string): void {
    this.history.push({
      id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      alertId,
      action,
      timestamp: new Date().toISOString(),
      details,
      recipientId,
    });
  }

  getAlertHistory(alertId: string): AlertHistory[] {
    return this.history.filter(h => h.alertId === alertId);
  }

  // Analytics
  getAnalytics(): AlertAnalytics {
    const alertsByType: Record<AlertType, number> = {
      recording_started: 0,
      recording_stopped: 0,
      recording_paused: 0,
      recording_resumed: 0,
      consent_required: 0,
      opt_out_confirmed: 0,
    };

    const alertsByPriority: Record<AlertPriority, number> = {
      low: 0,
      normal: 0,
      high: 0,
      critical: 0,
    };

    let totalDelivered = 0;
    let totalRead = 0;
    let totalAcknowledged = 0;
    let totalRecipients = 0;
    let totalDeliveryTime = 0;
    let deliveryCount = 0;

    this.alerts.forEach(alert => {
      alertsByType[alert.type]++;
      alertsByPriority[alert.priority]++;

      alert.recipients.forEach(r => {
        totalRecipients++;
        if (r.delivered) {
          totalDelivered++;
          if (r.deliveredAt) {
            const deliveryTime = new Date(r.deliveredAt).getTime() - new Date(alert.timestamp).getTime();
            totalDeliveryTime += deliveryTime;
            deliveryCount++;
          }
        }
        if (r.read) totalRead++;
        if (r.acknowledged) totalAcknowledged++;
      });
    });

    const consentStats = {
      granted: this.consents.filter(c => c.status === 'granted').length,
      denied: this.consents.filter(c => c.status === 'denied').length,
      pending: this.consents.filter(c => c.status === 'pending').length,
      withdrawn: this.consents.filter(c => c.status === 'withdrawn').length,
    };

    return {
      totalAlerts: this.alerts.length,
      alertsByType,
      alertsByPriority,
      deliveryRate: totalRecipients > 0 ? (totalDelivered / totalRecipients) * 100 : 0,
      readRate: totalDelivered > 0 ? (totalRead / totalDelivered) * 100 : 0,
      acknowledgeRate: totalRead > 0 ? (totalAcknowledged / totalRead) * 100 : 0,
      averageDeliveryTime: deliveryCount > 0 ? totalDeliveryTime / deliveryCount : 0,
      optOutCount: this.getOptedOutUsers().length,
      consentStats,
    };
  }

  // Cleanup
  async clearOldAlerts(daysOld: number): Promise<number> {
    const cutoff = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString();
    const originalCount = this.alerts.length;
    this.alerts = this.alerts.filter(a => a.timestamp > cutoff);
    await this.saveData();
    return originalCount - this.alerts.length;
  }
}

export const recordingAlertsService = new RecordingAlertsService();
export default recordingAlertsService;
