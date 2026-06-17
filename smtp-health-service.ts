/**
 * SMTP Health Monitoring Service
 * Periodic connection tests with failure alerts
 * MediVac One v5.6
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  HEALTH_RECORDS: 'medivac_smtp_health_records',
  HEALTH_CONFIG: 'medivac_smtp_health_config',
  ALERTS: 'medivac_smtp_health_alerts',
};

// Types
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

export interface SMTPServer {
  id: string;
  name: string;
  host: string;
  port: number;
  encryption: 'none' | 'tls' | 'ssl';
  isDefault: boolean;
  isActive: boolean;
}

export interface HealthCheck {
  id: string;
  serverId: string;
  serverName: string;
  status: HealthStatus;
  responseTime: number; // milliseconds
  checkedAt: string;
  errorMessage?: string;
  details: {
    connectionSuccess: boolean;
    authSuccess: boolean;
    tlsSuccess: boolean;
    dnsResolution: number; // ms
    tcpConnection: number; // ms
    smtpHandshake: number; // ms
  };
}

export interface HealthRecord {
  serverId: string;
  serverName: string;
  currentStatus: HealthStatus;
  lastCheck?: HealthCheck;
  uptime: number; // percentage
  averageResponseTime: number;
  checksTotal: number;
  checksSuccessful: number;
  checksFailed: number;
  lastSuccessAt?: string;
  lastFailureAt?: string;
  consecutiveFailures: number;
  history: HealthCheck[];
}

export interface HealthAlert {
  id: string;
  serverId: string;
  serverName: string;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  message: string;
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  acknowledgedBy?: string;
}

export interface HealthConfig {
  checkInterval: number; // minutes
  timeoutSeconds: number;
  failureThreshold: number;
  degradedThreshold: number; // response time in ms
  alertOnFailure: boolean;
  alertOnDegraded: boolean;
  alertRecipients: string[];
  autoFailover: boolean;
  retryCount: number;
}

export interface HealthSummary {
  totalServers: number;
  healthyServers: number;
  degradedServers: number;
  unhealthyServers: number;
  overallStatus: HealthStatus;
  averageUptime: number;
  averageResponseTime: number;
  activeAlerts: number;
  lastCheckAt?: string;
}

// Default servers for demo
const DEFAULT_SERVERS: SMTPServer[] = [
  { id: 'smtp_1', name: 'Primary SMTP', host: 'smtp.medivac.local', port: 587, encryption: 'tls', isDefault: true, isActive: true },
  { id: 'smtp_2', name: 'Backup SMTP', host: 'smtp-backup.medivac.local', port: 587, encryption: 'tls', isDefault: false, isActive: true },
  { id: 'smtp_3', name: 'Emergency SMTP', host: 'smtp-emergency.medivac.local', port: 465, encryption: 'ssl', isDefault: false, isActive: true },
];

const DEFAULT_CONFIG: HealthConfig = {
  checkInterval: 5,
  timeoutSeconds: 30,
  failureThreshold: 3,
  degradedThreshold: 2000,
  alertOnFailure: true,
  alertOnDegraded: true,
  alertRecipients: ['admin@medivac.local'],
  autoFailover: true,
  retryCount: 2,
};

class SMTPHealthService {
  private records: Map<string, HealthRecord> = new Map();
  private alerts: HealthAlert[] = [];
  private config: HealthConfig = DEFAULT_CONFIG;
  private servers: SMTPServer[] = DEFAULT_SERVERS;

  async initialize(): Promise<void> {
    await this.loadRecords();
    await this.loadAlerts();
    await this.loadConfig();
    
    // Initialize records for servers without history
    for (const server of this.servers) {
      if (!this.records.has(server.id)) {
        this.records.set(server.id, {
          serverId: server.id,
          serverName: server.name,
          currentStatus: 'unknown',
          uptime: 100,
          averageResponseTime: 0,
          checksTotal: 0,
          checksSuccessful: 0,
          checksFailed: 0,
          consecutiveFailures: 0,
          history: [],
        });
      }
    }
  }

  private async loadRecords(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.HEALTH_RECORDS);
      if (data) {
        const parsed = JSON.parse(data);
        this.records = new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.error('Failed to load health records:', error);
    }
  }

  private async saveRecords(): Promise<void> {
    const obj = Object.fromEntries(this.records);
    await AsyncStorage.setItem(STORAGE_KEYS.HEALTH_RECORDS, JSON.stringify(obj));
  }

  private async loadAlerts(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ALERTS);
      if (data) {
        this.alerts = JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load alerts:', error);
    }
  }

  private async saveAlerts(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(this.alerts));
  }

  private async loadConfig(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.HEALTH_CONFIG);
      if (data) {
        this.config = { ...DEFAULT_CONFIG, ...JSON.parse(data) };
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  }

  private async saveConfig(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.HEALTH_CONFIG, JSON.stringify(this.config));
  }

  /**
   * Get all servers
   */
  getServers(): SMTPServer[] {
    return [...this.servers];
  }

  /**
   * Get health record for a server
   */
  getHealthRecord(serverId: string): HealthRecord | null {
    return this.records.get(serverId) || null;
  }

  /**
   * Get all health records
   */
  getAllHealthRecords(): HealthRecord[] {
    return Array.from(this.records.values());
  }

  /**
   * Run health check for a server
   */
  async checkServer(serverId: string): Promise<HealthCheck> {
    const server = this.servers.find(s => s.id === serverId);
    if (!server) throw new Error('Server not found');

    const startTime = Date.now();
    
    // Simulate health check with random results for demo
    const dnsTime = 10 + Math.floor(Math.random() * 50);
    const tcpTime = 20 + Math.floor(Math.random() * 100);
    const smtpTime = 50 + Math.floor(Math.random() * 200);
    
    // Simulate occasional failures (10% chance)
    const isFailure = Math.random() < 0.1;
    // Simulate degraded performance (20% chance when not failed)
    const isDegraded = !isFailure && Math.random() < 0.2;
    
    const totalResponseTime = isFailure ? 30000 : (dnsTime + tcpTime + smtpTime + (isDegraded ? 2000 : 0));
    
    const check: HealthCheck = {
      id: `check_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      serverId: server.id,
      serverName: server.name,
      status: isFailure ? 'unhealthy' : (isDegraded || totalResponseTime > this.config.degradedThreshold ? 'degraded' : 'healthy'),
      responseTime: totalResponseTime,
      checkedAt: new Date().toISOString(),
      errorMessage: isFailure ? 'Connection timeout: Unable to establish SMTP connection' : undefined,
      details: {
        connectionSuccess: !isFailure,
        authSuccess: !isFailure,
        tlsSuccess: !isFailure && server.encryption !== 'none',
        dnsResolution: dnsTime,
        tcpConnection: isFailure ? 30000 : tcpTime,
        smtpHandshake: isFailure ? 0 : smtpTime,
      },
    };

    // Update record
    await this.updateRecord(server.id, check);

    return check;
  }

  /**
   * Run health checks for all active servers
   */
  async checkAllServers(): Promise<HealthCheck[]> {
    const checks: HealthCheck[] = [];
    
    for (const server of this.servers.filter(s => s.isActive)) {
      const check = await this.checkServer(server.id);
      checks.push(check);
    }

    return checks;
  }

  /**
   * Update health record with new check
   */
  private async updateRecord(serverId: string, check: HealthCheck): Promise<void> {
    const record = this.records.get(serverId) || {
      serverId,
      serverName: check.serverName,
      currentStatus: 'unknown',
      uptime: 100,
      averageResponseTime: 0,
      checksTotal: 0,
      checksSuccessful: 0,
      checksFailed: 0,
      consecutiveFailures: 0,
      history: [],
    };

    // Update stats
    record.checksTotal++;
    record.lastCheck = check;
    record.currentStatus = check.status;

    if (check.status === 'healthy' || check.status === 'degraded') {
      record.checksSuccessful++;
      record.lastSuccessAt = check.checkedAt;
      record.consecutiveFailures = 0;
    } else {
      record.checksFailed++;
      record.lastFailureAt = check.checkedAt;
      record.consecutiveFailures++;

      // Create alert if threshold reached
      if (record.consecutiveFailures >= this.config.failureThreshold && this.config.alertOnFailure) {
        await this.createAlert(serverId, check.serverName, 'critical', 
          `SMTP Server Unhealthy: ${check.serverName}`,
          `Server has failed ${record.consecutiveFailures} consecutive health checks. Last error: ${check.errorMessage || 'Unknown error'}`
        );
      }
    }

    // Create degraded alert
    if (check.status === 'degraded' && this.config.alertOnDegraded) {
      await this.createAlert(serverId, check.serverName, 'warning',
        `SMTP Server Degraded: ${check.serverName}`,
        `Response time (${check.responseTime}ms) exceeds threshold (${this.config.degradedThreshold}ms)`
      );
    }

    // Calculate uptime
    record.uptime = record.checksTotal > 0 
      ? Math.round((record.checksSuccessful / record.checksTotal) * 100) 
      : 100;

    // Calculate average response time (only successful checks)
    if (check.status !== 'unhealthy') {
      const successfulChecks = record.history.filter(h => h.status !== 'unhealthy');
      const totalTime = successfulChecks.reduce((sum, h) => sum + h.responseTime, 0) + check.responseTime;
      record.averageResponseTime = Math.round(totalTime / (successfulChecks.length + 1));
    }

    // Add to history (keep last 100)
    record.history.unshift(check);
    if (record.history.length > 100) {
      record.history = record.history.slice(0, 100);
    }

    this.records.set(serverId, record);
    await this.saveRecords();
  }

  /**
   * Create a health alert
   */
  private async createAlert(serverId: string, serverName: string, severity: AlertSeverity, title: string, message: string): Promise<void> {
    // Check if similar active alert exists
    const existingAlert = this.alerts.find(
      a => a.serverId === serverId && a.status === 'active' && a.severity === severity
    );
    if (existingAlert) return;

    const alert: HealthAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      serverId,
      serverName,
      severity,
      status: 'active',
      title,
      message,
      createdAt: new Date().toISOString(),
    };

    this.alerts.unshift(alert);
    await this.saveAlerts();
  }

  /**
   * Get all alerts
   */
  getAlerts(status?: AlertStatus): HealthAlert[] {
    if (status) {
      return this.alerts.filter(a => a.status === status);
    }
    return [...this.alerts];
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<boolean> {
    const index = this.alerts.findIndex(a => a.id === alertId);
    if (index < 0) return false;

    this.alerts[index].status = 'acknowledged';
    this.alerts[index].acknowledgedAt = new Date().toISOString();
    this.alerts[index].acknowledgedBy = acknowledgedBy;
    await this.saveAlerts();
    return true;
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string): Promise<boolean> {
    const index = this.alerts.findIndex(a => a.id === alertId);
    if (index < 0) return false;

    this.alerts[index].status = 'resolved';
    this.alerts[index].resolvedAt = new Date().toISOString();
    await this.saveAlerts();
    return true;
  }

  /**
   * Get health summary
   */
  getSummary(): HealthSummary {
    const records = Array.from(this.records.values());
    const activeServers = this.servers.filter(s => s.isActive);
    
    const healthy = records.filter(r => r.currentStatus === 'healthy').length;
    const degraded = records.filter(r => r.currentStatus === 'degraded').length;
    const unhealthy = records.filter(r => r.currentStatus === 'unhealthy').length;

    let overallStatus: HealthStatus = 'healthy';
    if (unhealthy > 0) overallStatus = 'unhealthy';
    else if (degraded > 0) overallStatus = 'degraded';
    else if (records.every(r => r.currentStatus === 'unknown')) overallStatus = 'unknown';

    const avgUptime = records.length > 0 
      ? Math.round(records.reduce((sum, r) => sum + r.uptime, 0) / records.length)
      : 100;

    const avgResponseTime = records.length > 0
      ? Math.round(records.reduce((sum, r) => sum + r.averageResponseTime, 0) / records.length)
      : 0;

    const lastChecks = records.map(r => r.lastCheck?.checkedAt).filter(Boolean).sort().reverse();

    return {
      totalServers: activeServers.length,
      healthyServers: healthy,
      degradedServers: degraded,
      unhealthyServers: unhealthy,
      overallStatus,
      averageUptime: avgUptime,
      averageResponseTime: avgResponseTime,
      activeAlerts: this.alerts.filter(a => a.status === 'active').length,
      lastCheckAt: lastChecks[0],
    };
  }

  /**
   * Get configuration
   */
  getConfig(): HealthConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  async updateConfig(updates: Partial<HealthConfig>): Promise<HealthConfig> {
    this.config = { ...this.config, ...updates };
    await this.saveConfig();
    return this.config;
  }

  /**
   * Get failover recommendation
   */
  getFailoverRecommendation(): SMTPServer | null {
    if (!this.config.autoFailover) return null;

    const defaultServer = this.servers.find(s => s.isDefault);
    if (!defaultServer) return null;

    const defaultRecord = this.records.get(defaultServer.id);
    if (!defaultRecord || defaultRecord.currentStatus === 'healthy') return null;

    // Find healthy backup
    for (const server of this.servers.filter(s => !s.isDefault && s.isActive)) {
      const record = this.records.get(server.id);
      if (record && record.currentStatus === 'healthy') {
        return server;
      }
    }

    return null;
  }

  /**
   * Export health report
   */
  exportReport(): string {
    const summary = this.getSummary();
    const records = this.getAllHealthRecords();
    const alerts = this.getAlerts('active');

    return JSON.stringify({
      generatedAt: new Date().toISOString(),
      summary,
      servers: records.map(r => ({
        name: r.serverName,
        status: r.currentStatus,
        uptime: r.uptime,
        avgResponseTime: r.averageResponseTime,
        lastCheck: r.lastCheck?.checkedAt,
        consecutiveFailures: r.consecutiveFailures,
      })),
      activeAlerts: alerts,
    }, null, 2);
  }

  /**
   * Clear all data
   */
  async clearData(): Promise<void> {
    this.records = new Map();
    this.alerts = [];
    this.config = DEFAULT_CONFIG;
    await AsyncStorage.removeItem(STORAGE_KEYS.HEALTH_RECORDS);
    await AsyncStorage.removeItem(STORAGE_KEYS.ALERTS);
    await AsyncStorage.removeItem(STORAGE_KEYS.HEALTH_CONFIG);
  }
}

export const smtpHealthService = new SMTPHealthService();
