/**
 * Pathway Alert Notification Service for MediVac WACHS v8.4
 * Push notifications for bottleneck detection and pathway issues
 */

// Types
export type AlertSeverity = 'info' | 'warning' | 'critical' | 'emergency';
export type AlertType = 'bottleneck' | 'latency' | 'throughput' | 'node_failure' | 'connection_lost' | 'capacity';
export type PathwayType = 'l1_cache' | 'l2_storage' | 'l3_cloud' | 'websocket' | 'api' | 'jedi_sync' | 'offline_queue';

export interface PathwayAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  pathwayType: PathwayType;
  title: string;
  message: string;
  details: Record<string, unknown>;
  threshold: number;
  currentValue: number;
  createdAt: Date;
  acknowledgedAt: Date | null;
  acknowledgedBy: string | null;
  resolvedAt: Date | null;
  resolvedBy: string | null;
  notificationSent: boolean;
  escalated: boolean;
}

export interface AlertThreshold {
  id: string;
  pathwayType: PathwayType;
  alertType: AlertType;
  warningThreshold: number;
  criticalThreshold: number;
  emergencyThreshold: number;
  unit: string;
  isEnabled: boolean;
}

export interface EscalationRule {
  id: string;
  name: string;
  pathwayTypes: PathwayType[];
  severities: AlertSeverity[];
  escalateAfterMinutes: number;
  notifyRoles: string[];
  notifyUsers: string[];
  isEnabled: boolean;
}

export interface AlertPreference {
  userId: string;
  pathwayTypes: PathwayType[];
  severities: AlertSeverity[];
  alertTypes: AlertType[];
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
}

export interface AlertAnalytics {
  totalAlerts: number;
  alertsToday: number;
  alertsByType: Record<AlertType, number>;
  alertsBySeverity: Record<AlertSeverity, number>;
  alertsByPathway: Record<PathwayType, number>;
  averageAcknowledgeTime: number; // minutes
  averageResolveTime: number; // minutes
  escalationRate: number; // percentage
  topPathwayIssues: { pathway: PathwayType; count: number }[];
}

// Default thresholds
const defaultThresholds: AlertThreshold[] = [
  {
    id: 'l1-latency',
    pathwayType: 'l1_cache',
    alertType: 'latency',
    warningThreshold: 10,
    criticalThreshold: 50,
    emergencyThreshold: 100,
    unit: 'ms',
    isEnabled: true,
  },
  {
    id: 'l2-latency',
    pathwayType: 'l2_storage',
    alertType: 'latency',
    warningThreshold: 50,
    criticalThreshold: 200,
    emergencyThreshold: 500,
    unit: 'ms',
    isEnabled: true,
  },
  {
    id: 'l3-latency',
    pathwayType: 'l3_cloud',
    alertType: 'latency',
    warningThreshold: 200,
    criticalThreshold: 1000,
    emergencyThreshold: 3000,
    unit: 'ms',
    isEnabled: true,
  },
  {
    id: 'websocket-latency',
    pathwayType: 'websocket',
    alertType: 'latency',
    warningThreshold: 100,
    criticalThreshold: 500,
    emergencyThreshold: 1000,
    unit: 'ms',
    isEnabled: true,
  },
  {
    id: 'api-latency',
    pathwayType: 'api',
    alertType: 'latency',
    warningThreshold: 500,
    criticalThreshold: 2000,
    emergencyThreshold: 5000,
    unit: 'ms',
    isEnabled: true,
  },
  {
    id: 'jedi-latency',
    pathwayType: 'jedi_sync',
    alertType: 'latency',
    warningThreshold: 300,
    criticalThreshold: 1500,
    emergencyThreshold: 5000,
    unit: 'ms',
    isEnabled: true,
  },
  {
    id: 'l1-throughput',
    pathwayType: 'l1_cache',
    alertType: 'throughput',
    warningThreshold: 80,
    criticalThreshold: 50,
    emergencyThreshold: 20,
    unit: '%',
    isEnabled: true,
  },
  {
    id: 'l3-throughput',
    pathwayType: 'l3_cloud',
    alertType: 'throughput',
    warningThreshold: 70,
    criticalThreshold: 40,
    emergencyThreshold: 10,
    unit: '%',
    isEnabled: true,
  },
  {
    id: 'offline-capacity',
    pathwayType: 'offline_queue',
    alertType: 'capacity',
    warningThreshold: 70,
    criticalThreshold: 85,
    emergencyThreshold: 95,
    unit: '%',
    isEnabled: true,
  },
];

// Default escalation rules
const defaultEscalationRules: EscalationRule[] = [
  {
    id: 'critical-escalation',
    name: 'Critical Alert Escalation',
    pathwayTypes: ['l1_cache', 'l2_storage', 'l3_cloud', 'jedi_sync'],
    severities: ['critical', 'emergency'],
    escalateAfterMinutes: 15,
    notifyRoles: ['JEDI_MASTER', 'IT_SUPPORT'],
    notifyUsers: [],
    isEnabled: true,
  },
  {
    id: 'jedi-sync-escalation',
    name: 'JEDI Sync Emergency',
    pathwayTypes: ['jedi_sync'],
    severities: ['emergency'],
    escalateAfterMinutes: 5,
    notifyRoles: ['JEDI_COMMANDER', 'MASTER_JEDI'],
    notifyUsers: [],
    isEnabled: true,
  },
  {
    id: 'node-failure-escalation',
    name: 'Node Failure Immediate',
    pathwayTypes: ['l1_cache', 'l2_storage', 'l3_cloud', 'websocket', 'api', 'jedi_sync'],
    severities: ['critical', 'emergency'],
    escalateAfterMinutes: 2,
    notifyRoles: ['IT_SUPPORT', 'ADMIN'],
    notifyUsers: [],
    isEnabled: true,
  },
];

class PathwayAlertNotificationService {
  private alerts: PathwayAlert[] = [];
  private thresholds: AlertThreshold[] = [...defaultThresholds];
  private escalationRules: EscalationRule[] = [...defaultEscalationRules];
  private userPreferences: Map<string, AlertPreference> = new Map();
  private listeners: ((alert: PathwayAlert) => void)[] = [];
  private monitoringInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Initialize with sample historical alerts
    this.generateSampleAlerts();
  }

  private generateSampleAlerts(): void {
    const now = new Date();
    const alertTypes: AlertType[] = ['bottleneck', 'latency', 'throughput', 'node_failure'];
    const pathways: PathwayType[] = ['l1_cache', 'l2_storage', 'l3_cloud', 'jedi_sync', 'api'];
    const severities: AlertSeverity[] = ['info', 'warning', 'critical'];

    for (let i = 0; i < 20; i++) {
      const createdAt = new Date(now);
      createdAt.setHours(createdAt.getHours() - Math.floor(Math.random() * 72));
      
      const type = alertTypes[Math.floor(Math.random() * alertTypes.length)];
      const pathway = pathways[Math.floor(Math.random() * pathways.length)];
      const severity = severities[Math.floor(Math.random() * severities.length)];
      
      const alert: PathwayAlert = {
        id: `alert-${i}`,
        type,
        severity,
        pathwayType: pathway,
        title: this.getAlertTitle(type, pathway),
        message: this.getAlertMessage(type, pathway, severity),
        details: { source: 'monitoring', autoDetected: true },
        threshold: 100,
        currentValue: 100 + Math.floor(Math.random() * 200),
        createdAt,
        acknowledgedAt: Math.random() > 0.3 ? new Date(createdAt.getTime() + Math.random() * 600000) : null,
        acknowledgedBy: Math.random() > 0.3 ? 'system' : null,
        resolvedAt: Math.random() > 0.5 ? new Date(createdAt.getTime() + Math.random() * 3600000) : null,
        resolvedBy: Math.random() > 0.5 ? 'auto-recovery' : null,
        notificationSent: true,
        escalated: severity === 'critical' && Math.random() > 0.5,
      };
      
      this.alerts.push(alert);
    }
  }

  private getAlertTitle(type: AlertType, pathway: PathwayType): string {
    const pathwayNames: Record<PathwayType, string> = {
      l1_cache: 'L1 Cache',
      l2_storage: 'L2 Storage',
      l3_cloud: 'L3 Cloud',
      websocket: 'WebSocket',
      api: 'API',
      jedi_sync: 'JEDI Sync',
      offline_queue: 'Offline Queue',
    };
    
    const typeNames: Record<AlertType, string> = {
      bottleneck: 'Bottleneck Detected',
      latency: 'High Latency',
      throughput: 'Low Throughput',
      node_failure: 'Node Failure',
      connection_lost: 'Connection Lost',
      capacity: 'Capacity Warning',
    };
    
    return `${pathwayNames[pathway]} - ${typeNames[type]}`;
  }

  private getAlertMessage(type: AlertType, pathway: PathwayType, severity: AlertSeverity): string {
    const messages: Record<AlertType, string> = {
      bottleneck: `Data flow bottleneck detected in ${pathway} pathway. Performance may be degraded.`,
      latency: `Response time exceeds ${severity} threshold in ${pathway} pathway.`,
      throughput: `Data throughput has dropped below acceptable levels in ${pathway} pathway.`,
      node_failure: `A node in the ${pathway} pathway has failed and requires attention.`,
      connection_lost: `Connection to ${pathway} pathway has been lost. Attempting reconnection.`,
      capacity: `Storage capacity in ${pathway} pathway is approaching limits.`,
    };
    return messages[type];
  }

  // Alert Management
  getAllAlerts(): PathwayAlert[] {
    return [...this.alerts].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getActiveAlerts(): PathwayAlert[] {
    return this.alerts.filter(a => !a.resolvedAt).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getAlert(alertId: string): PathwayAlert | null {
    return this.alerts.find(a => a.id === alertId) || null;
  }

  createAlert(data: Omit<PathwayAlert, 'id' | 'createdAt' | 'acknowledgedAt' | 'acknowledgedBy' | 'resolvedAt' | 'resolvedBy' | 'notificationSent' | 'escalated'>): PathwayAlert {
    const alert: PathwayAlert = {
      ...data,
      id: `alert-${Date.now()}`,
      createdAt: new Date(),
      acknowledgedAt: null,
      acknowledgedBy: null,
      resolvedAt: null,
      resolvedBy: null,
      notificationSent: false,
      escalated: false,
    };
    
    this.alerts.push(alert);
    this.sendNotification(alert);
    this.checkEscalation(alert);
    this.notifyListeners(alert);
    
    return alert;
  }

  acknowledgeAlert(alertId: string, userId: string): PathwayAlert | null {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) return null;
    
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = userId;
    return alert;
  }

  resolveAlert(alertId: string, userId: string): PathwayAlert | null {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) return null;
    
    alert.resolvedAt = new Date();
    alert.resolvedBy = userId;
    return alert;
  }

  // Threshold Management
  getAllThresholds(): AlertThreshold[] {
    return [...this.thresholds];
  }

  getThreshold(thresholdId: string): AlertThreshold | null {
    return this.thresholds.find(t => t.id === thresholdId) || null;
  }

  updateThreshold(thresholdId: string, updates: Partial<AlertThreshold>): AlertThreshold | null {
    const index = this.thresholds.findIndex(t => t.id === thresholdId);
    if (index === -1) return null;
    
    this.thresholds[index] = { ...this.thresholds[index], ...updates };
    return this.thresholds[index];
  }

  checkThreshold(pathwayType: PathwayType, alertType: AlertType, value: number): AlertSeverity | null {
    const threshold = this.thresholds.find(t => t.pathwayType === pathwayType && t.alertType === alertType && t.isEnabled);
    if (!threshold) return null;
    
    // For throughput, lower is worse
    if (alertType === 'throughput') {
      if (value <= threshold.emergencyThreshold) return 'emergency';
      if (value <= threshold.criticalThreshold) return 'critical';
      if (value <= threshold.warningThreshold) return 'warning';
    } else {
      // For latency/capacity, higher is worse
      if (value >= threshold.emergencyThreshold) return 'emergency';
      if (value >= threshold.criticalThreshold) return 'critical';
      if (value >= threshold.warningThreshold) return 'warning';
    }
    
    return null;
  }

  // Escalation Rules
  getAllEscalationRules(): EscalationRule[] {
    return [...this.escalationRules];
  }

  createEscalationRule(rule: Omit<EscalationRule, 'id'>): EscalationRule {
    const newRule: EscalationRule = {
      ...rule,
      id: `escalation-${Date.now()}`,
    };
    this.escalationRules.push(newRule);
    return newRule;
  }

  updateEscalationRule(ruleId: string, updates: Partial<EscalationRule>): EscalationRule | null {
    const index = this.escalationRules.findIndex(r => r.id === ruleId);
    if (index === -1) return null;
    
    this.escalationRules[index] = { ...this.escalationRules[index], ...updates };
    return this.escalationRules[index];
  }

  deleteEscalationRule(ruleId: string): boolean {
    const initialLength = this.escalationRules.length;
    this.escalationRules = this.escalationRules.filter(r => r.id !== ruleId);
    return this.escalationRules.length < initialLength;
  }

  private checkEscalation(alert: PathwayAlert): void {
    const applicableRules = this.escalationRules.filter(r => 
      r.isEnabled &&
      r.pathwayTypes.includes(alert.pathwayType) &&
      r.severities.includes(alert.severity)
    );
    
    if (applicableRules.length > 0) {
      // Schedule escalation check
      setTimeout(() => {
        if (!alert.acknowledgedAt) {
          alert.escalated = true;
          this.sendEscalationNotification(alert, applicableRules[0]);
        }
      }, applicableRules[0].escalateAfterMinutes * 60 * 1000);
    }
  }

  // User Preferences
  getUserPreferences(userId: string): AlertPreference | null {
    return this.userPreferences.get(userId) || null;
  }

  setUserPreferences(preferences: AlertPreference): void {
    this.userPreferences.set(preferences.userId, preferences);
  }

  getDefaultPreferences(userId: string): AlertPreference {
    return {
      userId,
      pathwayTypes: ['l1_cache', 'l2_storage', 'l3_cloud', 'jedi_sync'],
      severities: ['critical', 'emergency'],
      alertTypes: ['bottleneck', 'latency', 'throughput', 'node_failure'],
      pushEnabled: true,
      emailEnabled: false,
      smsEnabled: false,
      quietHoursStart: null,
      quietHoursEnd: null,
    };
  }

  // Notifications
  private sendNotification(alert: PathwayAlert): void {
    // In production, would integrate with push notification service
    alert.notificationSent = true;
    console.log(`[PathwayAlert] Notification sent: ${alert.title}`);
  }

  private sendEscalationNotification(alert: PathwayAlert, rule: EscalationRule): void {
    console.log(`[PathwayAlert] Escalation notification sent for: ${alert.title} to roles: ${rule.notifyRoles.join(', ')}`);
  }

  // Monitoring
  startMonitoring(): void {
    if (this.monitoringInterval) return;
    
    this.monitoringInterval = setInterval(() => {
      this.checkPathwayHealth();
    }, 30000); // Check every 30 seconds
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  isMonitoringActive(): boolean {
    return this.monitoringInterval !== null;
  }

  private checkPathwayHealth(): void {
    // Simulate pathway health checks
    const pathways: PathwayType[] = ['l1_cache', 'l2_storage', 'l3_cloud', 'websocket', 'api', 'jedi_sync'];
    
    for (const pathway of pathways) {
      // Simulate random latency values
      const latency = Math.floor(Math.random() * 500);
      const severity = this.checkThreshold(pathway, 'latency', latency);
      
      if (severity && Math.random() > 0.95) { // Only create alert 5% of the time when threshold exceeded
        this.createAlert({
          type: 'latency',
          severity,
          pathwayType: pathway,
          title: this.getAlertTitle('latency', pathway),
          message: this.getAlertMessage('latency', pathway, severity),
          details: { measuredLatency: latency },
          threshold: this.thresholds.find(t => t.pathwayType === pathway && t.alertType === 'latency')?.warningThreshold || 100,
          currentValue: latency,
        });
      }
    }
  }

  // Event Listeners
  onAlert(callback: (alert: PathwayAlert) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notifyListeners(alert: PathwayAlert): void {
    this.listeners.forEach(listener => listener(alert));
  }

  // Analytics
  getAnalytics(): AlertAnalytics {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const alertsToday = this.alerts.filter(a => a.createdAt >= today).length;
    
    const alertsByType: Record<AlertType, number> = {
      bottleneck: 0,
      latency: 0,
      throughput: 0,
      node_failure: 0,
      connection_lost: 0,
      capacity: 0,
    };
    
    const alertsBySeverity: Record<AlertSeverity, number> = {
      info: 0,
      warning: 0,
      critical: 0,
      emergency: 0,
    };
    
    const alertsByPathway: Record<PathwayType, number> = {
      l1_cache: 0,
      l2_storage: 0,
      l3_cloud: 0,
      websocket: 0,
      api: 0,
      jedi_sync: 0,
      offline_queue: 0,
    };
    
    let totalAcknowledgeTime = 0;
    let acknowledgedCount = 0;
    let totalResolveTime = 0;
    let resolvedCount = 0;
    let escalatedCount = 0;
    
    for (const alert of this.alerts) {
      alertsByType[alert.type]++;
      alertsBySeverity[alert.severity]++;
      alertsByPathway[alert.pathwayType]++;
      
      if (alert.acknowledgedAt) {
        totalAcknowledgeTime += (alert.acknowledgedAt.getTime() - alert.createdAt.getTime()) / 60000;
        acknowledgedCount++;
      }
      
      if (alert.resolvedAt) {
        totalResolveTime += (alert.resolvedAt.getTime() - alert.createdAt.getTime()) / 60000;
        resolvedCount++;
      }
      
      if (alert.escalated) {
        escalatedCount++;
      }
    }
    
    const topPathwayIssues = Object.entries(alertsByPathway)
      .map(([pathway, count]) => ({ pathway: pathway as PathwayType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    return {
      totalAlerts: this.alerts.length,
      alertsToday,
      alertsByType,
      alertsBySeverity,
      alertsByPathway,
      averageAcknowledgeTime: acknowledgedCount > 0 ? Math.round(totalAcknowledgeTime / acknowledgedCount) : 0,
      averageResolveTime: resolvedCount > 0 ? Math.round(totalResolveTime / resolvedCount) : 0,
      escalationRate: this.alerts.length > 0 ? Math.round((escalatedCount / this.alerts.length) * 100) : 0,
      topPathwayIssues,
    };
  }
}

export const pathwayAlertNotificationService = new PathwayAlertNotificationService();
