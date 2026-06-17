/**
 * Biometric Activity Log Service
 * Tracks authentication events and biometric usage for audit trails
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface BiometricEvent {
  id: string;
  timestamp: string;
  eventType: 'unlock' | 'failed_attempt' | 'timeout_lock' | 'manual_lock' | 'enrollment' | 're_enrollment' | 'disabled';
  biometricType: 'face_id' | 'touch_id' | 'fingerprint' | 'none';
  success: boolean;
  userId?: string;
  staffId?: string;
  deviceId: string;
  ipAddress?: string;
  location?: string;
  notes?: string;
  duration?: number; // in seconds
}

export interface BiometricAuditReport {
  generatedAt: string;
  period: {
    startDate: string;
    endDate: string;
  };
  totalEvents: number;
  successfulUnlocks: number;
  failedAttempts: number;
  timeoutLocks: number;
  enrollmentEvents: number;
  averageUnlockTime: number;
  peakHours: Array<{ hour: number; count: number }>;
  biometricTypeUsage: Record<string, number>;
  eventsByDay: Array<{ date: string; count: number }>;
}

class BiometricActivityLogService {
  private readonly LOG_KEY = 'biometric_activity_log';
  private readonly MAX_LOG_ENTRIES = 10000;
  private activityLog: BiometricEvent[] = [];

  async initialize(): Promise<void> {
    await this.loadActivityLog();
  }

  /**
   * Log a biometric event
   */
  async logEvent(event: Omit<BiometricEvent, 'id'>): Promise<BiometricEvent> {
    const biometricEvent: BiometricEvent = {
      ...event,
      id: 'event_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    };

    this.activityLog.push(biometricEvent);

    // Trim log if it exceeds max entries
    if (this.activityLog.length > this.MAX_LOG_ENTRIES) {
      this.activityLog = this.activityLog.slice(-this.MAX_LOG_ENTRIES);
    }

    await this.saveActivityLog();
    return biometricEvent;
  }

  /**
   * Get activity log entries
   */
  getActivityLog(limit?: number): BiometricEvent[] {
    const log = this.activityLog.slice().reverse();
    return limit ? log.slice(0, limit) : log;
  }

  /**
   * Get events for a specific date range
   */
  getEventsByDateRange(startDate: string, endDate: string): BiometricEvent[] {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    return this.activityLog.filter(event => {
      const eventTime = new Date(event.timestamp).getTime();
      return eventTime >= start && eventTime <= end;
    });
  }

  /**
   * Get events by type
   */
  getEventsByType(eventType: BiometricEvent['eventType']): BiometricEvent[] {
    return this.activityLog.filter(event => event.eventType === eventType);
  }

  /**
   * Get failed authentication attempts
   */
  getFailedAttempts(limit?: number): BiometricEvent[] {
    const failed = this.activityLog.filter(event => event.eventType === 'failed_attempt' && !event.success);
    return limit ? failed.slice(-limit) : failed;
  }

  /**
   * Generate audit report
   */
  generateAuditReport(startDate: string, endDate: string): BiometricAuditReport {
    const events = this.getEventsByDateRange(startDate, endDate);
    
    const successfulUnlocks = events.filter(e => e.eventType === 'unlock' && e.success).length;
    const failedAttempts = events.filter(e => e.eventType === 'failed_attempt' || !e.success).length;
    const timeoutLocks = events.filter(e => e.eventType === 'timeout_lock').length;
    const enrollmentEvents = events.filter(e => e.eventType === 'enrollment' || e.eventType === 're_enrollment').length;

    // Calculate average unlock time
    const unlockEvents = events.filter(e => e.eventType === 'unlock' && e.duration);
    const avgUnlockTime = unlockEvents.length > 0
      ? unlockEvents.reduce((sum, e) => sum + (e.duration || 0), 0) / unlockEvents.length
      : 0;

    // Peak hours analysis
    const hourCounts: Record<number, number> = {};
    events.forEach(event => {
      const hour = new Date(event.timestamp).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const peakHours = Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Biometric type usage
    const biometricUsage: Record<string, number> = {};
    events.forEach(event => {
      biometricUsage[event.biometricType] = (biometricUsage[event.biometricType] || 0) + 1;
    });

    // Events by day
    const dayMap: Record<string, number> = {};
    events.forEach(event => {
      const date = new Date(event.timestamp).toISOString().split('T')[0];
      dayMap[date] = (dayMap[date] || 0) + 1;
    });

    const eventsByDay = Object.entries(dayMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      generatedAt: new Date().toISOString(),
      period: { startDate, endDate },
      totalEvents: events.length,
      successfulUnlocks,
      failedAttempts,
      timeoutLocks,
      enrollmentEvents,
      averageUnlockTime: Math.round(avgUnlockTime * 100) / 100,
      peakHours,
      biometricTypeUsage: biometricUsage,
      eventsByDay,
    };
  }

  /**
   * Get security summary
   */
  getSecuritySummary(days: number = 7): {
    totalAttempts: number;
    successRate: number;
    failedAttempts: number;
    timeoutLocks: number;
    lastUnlock?: BiometricEvent;
    suspiciousActivity: BiometricEvent[];
  } {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const events = this.getEventsByDateRange(startDate.toISOString(), new Date().toISOString());

    const totalAttempts = events.filter(e => e.eventType === 'unlock' || e.eventType === 'failed_attempt').length;
    const successfulUnlocks = events.filter(e => e.eventType === 'unlock' && e.success).length;
    const successRate = totalAttempts > 0 ? Math.round((successfulUnlocks / totalAttempts) * 100) : 0;
    const failedAttempts = events.filter(e => e.eventType === 'failed_attempt' || !e.success).length;
    const timeoutLocks = events.filter(e => e.eventType === 'timeout_lock').length;

    // Detect suspicious activity (3+ failed attempts in 5 minutes)
    const suspiciousActivity: BiometricEvent[] = [];
    const failedEvents = events.filter(e => !e.success);
    
    for (let i = 0; i < failedEvents.length - 2; i++) {
      const time1 = new Date(failedEvents[i].timestamp).getTime();
      const time2 = new Date(failedEvents[i + 2].timestamp).getTime();
      
      if ((time2 - time1) < 5 * 60 * 1000) { // 5 minutes
        suspiciousActivity.push(failedEvents[i]);
      }
    }

    const lastUnlock = events
      .filter(e => e.eventType === 'unlock' && e.success)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

    return {
      totalAttempts,
      successRate,
      failedAttempts,
      timeoutLocks,
      lastUnlock,
      suspiciousActivity,
    };
  }

  /**
   * Export activity log as JSON
   */
  exportActivityLog(): string {
    return JSON.stringify(this.activityLog, null, 2);
  }

  /**
   * Clear activity log
   */
  async clearActivityLog(): Promise<void> {
    this.activityLog = [];
    await AsyncStorage.removeItem(this.LOG_KEY);
  }

  /**
   * Delete events older than specified days
   */
  async deleteOldEvents(days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffTime = cutoffDate.getTime();

    const initialLength = this.activityLog.length;
    this.activityLog = this.activityLog.filter(event => {
      return new Date(event.timestamp).getTime() >= cutoffTime;
    });

    const deletedCount = initialLength - this.activityLog.length;
    
    if (deletedCount > 0) {
      await this.saveActivityLog();
    }

    return deletedCount;
  }

  private async loadActivityLog(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.LOG_KEY);
      if (data) {
        this.activityLog = JSON.parse(data);
      }
    } catch (error) {
      console.error('[Biometric Activity Log] Failed to load log:', error);
    }
  }

  private async saveActivityLog(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.LOG_KEY, JSON.stringify(this.activityLog));
    } catch (error) {
      console.error('[Biometric Activity Log] Failed to save log:', error);
    }
  }
}

export const biometricActivityLogService = new BiometricActivityLogService();
