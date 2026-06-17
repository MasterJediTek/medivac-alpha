/**
 * Color-Coded Alerts Dashboard Service
 * Manages alerts with severity-based color coding
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'medivac_alerts_dashboard';

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved' | 'expired';
export type AlertCategory = 'security' | 'clinical' | 'system' | 'compliance' | 'integration' | 'communication';

export interface Alert {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  status: AlertStatus;
  category: AlertCategory;
  source: string;
  createdAt: string;
  updatedAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  expiresAt?: string;
  metadata?: Record<string, any>;
  actions?: AlertAction[];
}

export interface AlertAction {
  id: string;
  label: string;
  type: 'link' | 'action' | 'dismiss';
  target?: string;
}

export interface AlertStats {
  total: number;
  bySeverity: Record<AlertSeverity, number>;
  byStatus: Record<AlertStatus, number>;
  byCategory: Record<AlertCategory, number>;
  criticalActive: number;
  avgResolutionTime: number;
}

export interface AlertFilter {
  severity?: AlertSeverity[];
  status?: AlertStatus[];
  category?: AlertCategory[];
  dateRange?: { start: string; end: string };
  search?: string;
}

class AlertsDashboardService {
  private alerts: Alert[] = [];
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.alerts = JSON.parse(stored);
      } else {
        this.generateSampleAlerts();
        await this.save();
      }
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize alerts dashboard:', error);
      this.generateSampleAlerts();
      this.initialized = true;
    }
  }

  private generateSampleAlerts(): void {
    const now = new Date();
    
    this.alerts = [
      {
        id: 'alert_1',
        title: 'Unauthorized Access Attempt',
        message: 'Multiple failed login attempts detected from IP 192.168.1.100',
        severity: 'critical',
        status: 'active',
        category: 'security',
        source: 'Security Monitor',
        createdAt: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
        actions: [
          { id: 'a1', label: 'Block IP', type: 'action' },
          { id: 'a2', label: 'View Details', type: 'link', target: '/security-monitor' },
        ],
      },
      {
        id: 'alert_2',
        title: 'WACHS Site Connectivity Issue',
        message: 'Broome Regional Hospital connection degraded - latency 450ms',
        severity: 'high',
        status: 'active',
        category: 'integration',
        source: 'WACHS Health Monitor',
        createdAt: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
        actions: [
          { id: 'a3', label: 'View Site Health', type: 'link', target: '/wachs-health' },
        ],
      },
      {
        id: 'alert_3',
        title: 'Compliance Report Overdue',
        message: 'Monthly HIPAA compliance report due in 2 hours',
        severity: 'medium',
        status: 'active',
        category: 'compliance',
        source: 'Compliance Engine',
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
        actions: [
          { id: 'a4', label: 'Generate Report', type: 'action' },
        ],
      },
      {
        id: 'alert_4',
        title: 'SMTP Server Health Warning',
        message: 'Primary SMTP server response time elevated',
        severity: 'medium',
        status: 'acknowledged',
        category: 'system',
        source: 'SMTP Health Monitor',
        createdAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 20 * 60 * 1000).toISOString(),
        acknowledgedAt: new Date(now.getTime() - 20 * 60 * 1000).toISOString(),
        acknowledgedBy: 'Admin User',
      },
      {
        id: 'alert_5',
        title: 'New Staff Pending Verification',
        message: '3 new staff members awaiting WACHS credential verification',
        severity: 'low',
        status: 'active',
        category: 'clinical',
        source: 'User Onboarding',
        createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
        actions: [
          { id: 'a5', label: 'Review Staff', type: 'link', target: '/user-onboarding' },
        ],
      },
      {
        id: 'alert_6',
        title: 'Scheduled Maintenance Tonight',
        message: 'System maintenance scheduled for 2:00 AM - 4:00 AM AWST',
        severity: 'info',
        status: 'active',
        category: 'system',
        source: 'System Admin',
        createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'alert_7',
        title: 'Beacon Assignment Complete',
        message: 'All new patients assigned green code beacons successfully',
        severity: 'info',
        status: 'resolved',
        category: 'clinical',
        source: 'Homing Beacon System',
        createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
        resolvedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
        resolvedBy: 'System',
      },
      {
        id: 'alert_8',
        title: 'Teams Integration Token Expiring',
        message: 'Microsoft Teams OAuth token expires in 7 days',
        severity: 'low',
        status: 'active',
        category: 'integration',
        source: 'Microsoft Auth Service',
        createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        actions: [
          { id: 'a6', label: 'Refresh Token', type: 'action' },
        ],
      },
    ];
  }

  private async save(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.alerts));
    } catch (error) {
      console.error('Failed to save alerts:', error);
    }
  }

  getAlerts(filter?: AlertFilter): Alert[] {
    let filtered = [...this.alerts];
    
    if (filter?.severity?.length) {
      filtered = filtered.filter(a => filter.severity!.includes(a.severity));
    }
    if (filter?.status?.length) {
      filtered = filtered.filter(a => filter.status!.includes(a.status));
    }
    if (filter?.category?.length) {
      filtered = filtered.filter(a => filter.category!.includes(a.category));
    }
    if (filter?.search) {
      const search = filter.search.toLowerCase();
      filtered = filtered.filter(a => 
        a.title.toLowerCase().includes(search) || 
        a.message.toLowerCase().includes(search)
      );
    }
    if (filter?.dateRange) {
      const start = new Date(filter.dateRange.start);
      const end = new Date(filter.dateRange.end);
      filtered = filtered.filter(a => {
        const created = new Date(a.createdAt);
        return created >= start && created <= end;
      });
    }
    
    // Sort by severity (critical first) then by date
    const severityOrder: Record<AlertSeverity, number> = {
      critical: 0, high: 1, medium: 2, low: 3, info: 4
    };
    
    return filtered.sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  getActiveAlerts(): Alert[] {
    return this.getAlerts({ status: ['active'] });
  }

  getCriticalAlerts(): Alert[] {
    return this.getAlerts({ severity: ['critical'], status: ['active'] });
  }

  getStats(): AlertStats {
    const bySeverity: Record<AlertSeverity, number> = {
      critical: 0, high: 0, medium: 0, low: 0, info: 0
    };
    const byStatus: Record<AlertStatus, number> = {
      active: 0, acknowledged: 0, resolved: 0, expired: 0
    };
    const byCategory: Record<AlertCategory, number> = {
      security: 0, clinical: 0, system: 0, compliance: 0, integration: 0, communication: 0
    };

    this.alerts.forEach(alert => {
      bySeverity[alert.severity]++;
      byStatus[alert.status]++;
      byCategory[alert.category]++;
    });

    const resolved = this.alerts.filter(a => a.resolvedAt);
    const avgResolutionTime = resolved.length > 0
      ? resolved.reduce((sum, a) => {
          const created = new Date(a.createdAt).getTime();
          const resolvedTime = new Date(a.resolvedAt!).getTime();
          return sum + (resolvedTime - created);
        }, 0) / resolved.length / (60 * 1000) // in minutes
      : 0;

    return {
      total: this.alerts.length,
      bySeverity,
      byStatus,
      byCategory,
      criticalActive: this.alerts.filter(a => a.severity === 'critical' && a.status === 'active').length,
      avgResolutionTime: Math.round(avgResolutionTime),
    };
  }

  async acknowledgeAlert(alertId: string, userId: string): Promise<boolean> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert || alert.status !== 'active') return false;
    
    alert.status = 'acknowledged';
    alert.acknowledgedAt = new Date().toISOString();
    alert.acknowledgedBy = userId;
    alert.updatedAt = new Date().toISOString();
    
    await this.save();
    return true;
  }

  async resolveAlert(alertId: string, userId: string): Promise<boolean> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert || alert.status === 'resolved') return false;
    
    alert.status = 'resolved';
    alert.resolvedAt = new Date().toISOString();
    alert.resolvedBy = userId;
    alert.updatedAt = new Date().toISOString();
    
    await this.save();
    return true;
  }

  async createAlert(alert: Omit<Alert, 'id' | 'createdAt' | 'updatedAt'>): Promise<Alert> {
    const now = new Date().toISOString();
    const newAlert: Alert = {
      ...alert,
      id: `alert_${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    
    this.alerts.unshift(newAlert);
    await this.save();
    return newAlert;
  }
}

export const alertsDashboardService = new AlertsDashboardService();
