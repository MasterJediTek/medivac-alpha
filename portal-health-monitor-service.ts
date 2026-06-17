/**
 * Portal Health Monitor Service
 * 
 * Monitors uptime and status of all JediTek portal links,
 * providing real-time health dashboards and alerting for
 * service disruptions.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

// All JediTek Portal URLs
export const JEDITEK_PORTALS = {
  // Primary Portals
  main: { name: "JediTek Main", url: "https://jeditek.com.au", category: "primary" },
  wongi: { name: "WONGI Platform", url: "https://jeditek.net", category: "primary" },
  nexusBeacon: { name: "Nexus Beacon", url: "https://nexus.jeditek.net", category: "primary" },
  alphaPrime: { name: "AlphaPrime", url: "https://alphaprime.jeditek.com.au", category: "primary" },
  iSkoolEDU: { name: "iSkoolEDU", url: "https://iskooledu.jeditek.com.au", category: "primary" },
  mediVacOne: { name: "MediVac One", url: "https://wongi.com.au", category: "primary" },
  masterClass: { name: "Master Class", url: "https://master.jeditek.com.au", category: "primary" },

  // Manus-Hosted Applications
  jediChurch: { name: "JEDI.church Resource Hub", url: "https://jedi-church.manus.space", category: "manus" },
  jediVPN: { name: "JEDI VPN Browser", url: "https://jeditek-bro.manus.space", category: "manus" },
  jediPokie: { name: "Jedi Knights Pokie", url: "https://jedipokie.com", category: "manus" },
  alphaPrimeDownloads: { name: "AlphaPrime Downloads", url: "https://jeditek.xyz", category: "manus" },
  wongiComms: { name: "WONGI Communications", url: "https://wongi.manus.space", category: "manus" },
  wongiIntegrated: { name: "WONGI Integrated", url: "https://jeditek.org", category: "manus" },
  knowledgeBase: { name: "Knowledge Base", url: "https://jedi.church", category: "manus" },
  evidencePortal: { name: "JEDI Evidence Portal", url: "https://smpo-evidance-port.manus.space", category: "manus" },
  portfolio: { name: "Stephen Orazi Portfolio", url: "https://smpo-port.manus.space", category: "manus" },
  falcon: { name: "Project Falcon", url: "https://falcon.manus.space", category: "manus" },
  jediBackend: { name: "JEDI Backend", url: "https://jedi.click", category: "manus" },
  deathStar: { name: "JEDI Platform", url: "https://death-star.vip", category: "manus" },
  smpoInk: { name: "JEDI Knowledge Base", url: "https://smpo-ink.manus.space", category: "manus" },
  schoolZone: { name: "SchoolZone Master Class", url: "https://schoolzone.pro", category: "manus" },
  nexusPrime: { name: "Nexus Beacon Prime", url: "https://nexusbp-jrzfy3zp.manus.space", category: "manus" },
  jediPlatformV3: { name: "JEDI Platform v3", url: "https://jedi-system.manus.space", category: "manus" },
  jediStations: { name: "JEDI Space Stations", url: "https://jedi-station.manus.space", category: "manus" },
  jediInstaller: { name: "JEDI Installer", url: "https://jediinstal-krne8jes.manus.space", category: "manus" },
} as const;

export type PortalId = keyof typeof JEDITEK_PORTALS;

export interface HealthStatus {
  portalId: PortalId;
  name: string;
  url: string;
  category: string;
  status: "healthy" | "degraded" | "down" | "unknown";
  responseTime: number; // ms
  statusCode: number;
  lastChecked: string;
  uptime: number; // percentage
  consecutiveFailures: number;
  sslValid: boolean;
  sslExpiresAt?: string;
}

export interface HealthCheck {
  id: string;
  portalId: PortalId;
  timestamp: string;
  status: "healthy" | "degraded" | "down" | "error";
  responseTime: number;
  statusCode: number;
  error?: string;
}

export interface HealthAlert {
  id: string;
  portalId: PortalId;
  alertType: "down" | "degraded" | "recovered" | "ssl_expiring" | "high_latency";
  severity: "critical" | "warning" | "info";
  message: string;
  timestamp: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

export interface MonitoringConfig {
  enabled: boolean;
  checkInterval: number; // minutes
  timeoutMs: number;
  degradedThresholdMs: number;
  alertOnDown: boolean;
  alertOnDegraded: boolean;
  alertOnRecovery: boolean;
  sslExpiryWarningDays: number;
  consecutiveFailuresBeforeAlert: number;
}

export interface HealthAnalytics {
  totalChecks: number;
  healthyChecks: number;
  degradedChecks: number;
  downChecks: number;
  averageResponseTime: number;
  uptimeByPortal: Record<PortalId, number>;
  incidentCount: number;
  lastIncidentTimestamp: string;
}

const STORAGE_KEYS = {
  healthStatuses: "portal_health_statuses",
  healthChecks: "portal_health_checks",
  healthAlerts: "portal_health_alerts",
  monitoringConfig: "portal_monitoring_config",
  healthAnalytics: "portal_health_analytics",
};

const DEFAULT_CONFIG: MonitoringConfig = {
  enabled: true,
  checkInterval: 5,
  timeoutMs: 10000,
  degradedThresholdMs: 3000,
  alertOnDown: true,
  alertOnDegraded: true,
  alertOnRecovery: true,
  sslExpiryWarningDays: 30,
  consecutiveFailuresBeforeAlert: 3,
};

class PortalHealthMonitorService {
  private healthStatuses: Map<PortalId, HealthStatus> = new Map();
  private healthChecks: HealthCheck[] = [];
  private alerts: HealthAlert[] = [];
  private config: MonitoringConfig = DEFAULT_CONFIG;
  private analytics: HealthAnalytics = {
    totalChecks: 0,
    healthyChecks: 0,
    degradedChecks: 0,
    downChecks: 0,
    averageResponseTime: 0,
    uptimeByPortal: {} as Record<PortalId, number>,
    incidentCount: 0,
    lastIncidentTimestamp: "",
  };
  private initialized = false;
  private monitoringInterval: ReturnType<typeof setInterval> | null = null;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const [statusesData, checksData, alertsData, configData, analyticsData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.healthStatuses),
        AsyncStorage.getItem(STORAGE_KEYS.healthChecks),
        AsyncStorage.getItem(STORAGE_KEYS.healthAlerts),
        AsyncStorage.getItem(STORAGE_KEYS.monitoringConfig),
        AsyncStorage.getItem(STORAGE_KEYS.healthAnalytics),
      ]);

      if (statusesData) {
        const parsed = JSON.parse(statusesData);
        Object.entries(parsed).forEach(([key, value]) => {
          this.healthStatuses.set(key as PortalId, value as HealthStatus);
        });
      } else {
        this.initializeDefaultStatuses();
      }

      if (checksData) {
        this.healthChecks = JSON.parse(checksData);
      }

      if (alertsData) {
        this.alerts = JSON.parse(alertsData);
      }

      if (configData) {
        this.config = JSON.parse(configData);
      }

      if (analyticsData) {
        this.analytics = JSON.parse(analyticsData);
      }

      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize portal health monitor:", error);
      this.initializeDefaultStatuses();
      this.initialized = true;
    }
  }

  private initializeDefaultStatuses(): void {
    const now = new Date().toISOString();

    Object.entries(JEDITEK_PORTALS).forEach(([id, portal]) => {
      this.healthStatuses.set(id as PortalId, {
        portalId: id as PortalId,
        name: portal.name,
        url: portal.url,
        category: portal.category,
        status: "unknown",
        responseTime: 0,
        statusCode: 0,
        lastChecked: now,
        uptime: 100,
        consecutiveFailures: 0,
        sslValid: true,
      });
    });
  }

  private async saveState(): Promise<void> {
    try {
      const statusesObj: Record<string, HealthStatus> = {};
      this.healthStatuses.forEach((value, key) => {
        statusesObj[key] = value;
      });

      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.healthStatuses, JSON.stringify(statusesObj)),
        AsyncStorage.setItem(STORAGE_KEYS.healthChecks, JSON.stringify(this.healthChecks.slice(-1000))),
        AsyncStorage.setItem(STORAGE_KEYS.healthAlerts, JSON.stringify(this.alerts.slice(-200))),
        AsyncStorage.setItem(STORAGE_KEYS.monitoringConfig, JSON.stringify(this.config)),
        AsyncStorage.setItem(STORAGE_KEYS.healthAnalytics, JSON.stringify(this.analytics)),
      ]);
    } catch (error) {
      console.error("Failed to save health monitor state:", error);
    }
  }

  async checkPortal(portalId: PortalId): Promise<HealthCheck> {
    await this.initialize();

    const portal = JEDITEK_PORTALS[portalId];
    if (!portal) {
      throw new Error(`Unknown portal: ${portalId}`);
    }

    const startTime = Date.now();
    const checkId = `check-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    let status: HealthCheck["status"] = "healthy";
    let statusCode = 200;
    let error: string | undefined;

    try {
      // Simulate health check (in production, this would make actual HTTP requests)
      const result = await this.simulateHealthCheck(portal.url);
      statusCode = result.statusCode;

      const responseTime = Date.now() - startTime;

      if (statusCode >= 500) {
        status = "down";
      } else if (statusCode >= 400) {
        status = "error";
      } else if (responseTime > this.config.degradedThresholdMs) {
        status = "degraded";
      }

      const check: HealthCheck = {
        id: checkId,
        portalId,
        timestamp: new Date().toISOString(),
        status,
        responseTime,
        statusCode,
        error,
      };

      this.healthChecks.push(check);
      await this.updateHealthStatus(portalId, check);
      await this.saveState();

      return check;
    } catch (err) {
      const responseTime = Date.now() - startTime;
      error = err instanceof Error ? err.message : "Unknown error";

      const check: HealthCheck = {
        id: checkId,
        portalId,
        timestamp: new Date().toISOString(),
        status: "down",
        responseTime,
        statusCode: 0,
        error,
      };

      this.healthChecks.push(check);
      await this.updateHealthStatus(portalId, check);
      await this.saveState();

      return check;
    }
  }

  private async simulateHealthCheck(url: string): Promise<{ statusCode: number; responseTime: number }> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 100));

    // Simulate different response scenarios
    const random = Math.random();
    if (random < 0.02) {
      // 2% chance of being down
      throw new Error("Connection timeout");
    } else if (random < 0.05) {
      // 3% chance of server error
      return { statusCode: 500, responseTime: Math.random() * 1000 + 500 };
    } else if (random < 0.1) {
      // 5% chance of slow response
      return { statusCode: 200, responseTime: Math.random() * 3000 + 3000 };
    }

    // Normal response
    return { statusCode: 200, responseTime: Math.random() * 500 + 100 };
  }

  private async updateHealthStatus(portalId: PortalId, check: HealthCheck): Promise<void> {
    const currentStatus = this.healthStatuses.get(portalId);
    if (!currentStatus) return;

    const previousStatus = currentStatus.status;

    // Update status
    currentStatus.status = check.status === "error" ? "down" : check.status;
    currentStatus.responseTime = check.responseTime;
    currentStatus.statusCode = check.statusCode;
    currentStatus.lastChecked = check.timestamp;

    // Update consecutive failures
    if (check.status === "down" || check.status === "error") {
      currentStatus.consecutiveFailures++;
    } else {
      currentStatus.consecutiveFailures = 0;
    }

    // Calculate uptime
    const recentChecks = this.healthChecks
      .filter(c => c.portalId === portalId)
      .slice(-100);
    
    if (recentChecks.length > 0) {
      const healthyCount = recentChecks.filter(c => c.status === "healthy").length;
      currentStatus.uptime = (healthyCount / recentChecks.length) * 100;
    }

    this.healthStatuses.set(portalId, currentStatus);

    // Update analytics
    this.analytics.totalChecks++;
    if (check.status === "healthy") {
      this.analytics.healthyChecks++;
    } else if (check.status === "degraded") {
      this.analytics.degradedChecks++;
    } else {
      this.analytics.downChecks++;
    }

    this.analytics.averageResponseTime = 
      (this.analytics.averageResponseTime * (this.analytics.totalChecks - 1) + check.responseTime) / 
      this.analytics.totalChecks;

    this.analytics.uptimeByPortal[portalId] = currentStatus.uptime;

    // Generate alerts
    await this.checkForAlerts(portalId, previousStatus, currentStatus.status);
  }

  private async checkForAlerts(
    portalId: PortalId,
    previousStatus: HealthStatus["status"],
    currentStatus: HealthStatus["status"]
  ): Promise<void> {
    const status = this.healthStatuses.get(portalId);
    if (!status) return;

    // Alert on status change to down
    if (
      this.config.alertOnDown &&
      currentStatus === "down" &&
      previousStatus !== "down" &&
      status.consecutiveFailures >= this.config.consecutiveFailuresBeforeAlert
    ) {
      await this.createAlert(portalId, "down", "critical", `${status.name} is DOWN`);
      this.analytics.incidentCount++;
      this.analytics.lastIncidentTimestamp = new Date().toISOString();
    }

    // Alert on degraded performance
    if (
      this.config.alertOnDegraded &&
      currentStatus === "degraded" &&
      previousStatus === "healthy"
    ) {
      await this.createAlert(portalId, "degraded", "warning", `${status.name} is experiencing degraded performance`);
    }

    // Alert on recovery
    if (
      this.config.alertOnRecovery &&
      currentStatus === "healthy" &&
      (previousStatus === "down" || previousStatus === "degraded")
    ) {
      await this.createAlert(portalId, "recovered", "info", `${status.name} has recovered`);
    }
  }

  private async createAlert(
    portalId: PortalId,
    alertType: HealthAlert["alertType"],
    severity: HealthAlert["severity"],
    message: string
  ): Promise<HealthAlert> {
    const alert: HealthAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      portalId,
      alertType,
      severity,
      message,
      timestamp: new Date().toISOString(),
      acknowledged: false,
    };

    this.alerts.push(alert);
    await this.saveState();

    return alert;
  }

  async checkAllPortals(): Promise<HealthCheck[]> {
    await this.initialize();

    const checks: HealthCheck[] = [];
    const portalIds = Object.keys(JEDITEK_PORTALS) as PortalId[];

    for (const portalId of portalIds) {
      try {
        const check = await this.checkPortal(portalId);
        checks.push(check);
      } catch (error) {
        console.error(`Failed to check portal ${portalId}:`, error);
      }

      // Small delay between checks to avoid overwhelming
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return checks;
  }

  async getHealthStatus(portalId: PortalId): Promise<HealthStatus | null> {
    await this.initialize();
    return this.healthStatuses.get(portalId) || null;
  }

  async getAllHealthStatuses(): Promise<HealthStatus[]> {
    await this.initialize();
    return Array.from(this.healthStatuses.values());
  }

  async getHealthStatusesByCategory(category: string): Promise<HealthStatus[]> {
    await this.initialize();
    return Array.from(this.healthStatuses.values()).filter(s => s.category === category);
  }

  async getRecentChecks(portalId?: PortalId, limit = 50): Promise<HealthCheck[]> {
    await this.initialize();

    let checks = [...this.healthChecks];
    
    if (portalId) {
      checks = checks.filter(c => c.portalId === portalId);
    }

    return checks.slice(-limit).reverse();
  }

  async getAlerts(unacknowledgedOnly = false): Promise<HealthAlert[]> {
    await this.initialize();

    let alerts = [...this.alerts];
    
    if (unacknowledgedOnly) {
      alerts = alerts.filter(a => !a.acknowledged);
    }

    return alerts.reverse();
  }

  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<HealthAlert | null> {
    await this.initialize();

    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) return null;

    alert.acknowledged = true;
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = new Date().toISOString();

    await this.saveState();
    return alert;
  }

  async getConfig(): Promise<MonitoringConfig> {
    await this.initialize();
    return { ...this.config };
  }

  async updateConfig(updates: Partial<MonitoringConfig>): Promise<MonitoringConfig> {
    await this.initialize();

    this.config = { ...this.config, ...updates };
    await this.saveState();

    // Restart monitoring if interval changed
    if (updates.checkInterval !== undefined || updates.enabled !== undefined) {
      this.stopMonitoring();
      if (this.config.enabled) {
        this.startMonitoring();
      }
    }

    return this.config;
  }

  async getAnalytics(): Promise<HealthAnalytics> {
    await this.initialize();
    return { ...this.analytics };
  }

  startMonitoring(): void {
    if (this.monitoringInterval) return;

    this.monitoringInterval = setInterval(
      () => this.checkAllPortals(),
      this.config.checkInterval * 60 * 1000
    );

    // Run initial check
    this.checkAllPortals();
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  getPortalInfo(portalId: PortalId): typeof JEDITEK_PORTALS[PortalId] | null {
    return JEDITEK_PORTALS[portalId] || null;
  }

  getAllPortals(): typeof JEDITEK_PORTALS {
    return { ...JEDITEK_PORTALS };
  }

  async getOverallHealth(): Promise<{
    status: "healthy" | "degraded" | "critical";
    healthyCount: number;
    degradedCount: number;
    downCount: number;
    totalCount: number;
    averageUptime: number;
  }> {
    await this.initialize();

    const statuses = Array.from(this.healthStatuses.values());
    const healthyCount = statuses.filter(s => s.status === "healthy").length;
    const degradedCount = statuses.filter(s => s.status === "degraded").length;
    const downCount = statuses.filter(s => s.status === "down").length;
    const totalCount = statuses.length;

    const averageUptime = statuses.reduce((sum, s) => sum + s.uptime, 0) / totalCount;

    let status: "healthy" | "degraded" | "critical" = "healthy";
    if (downCount > 0) {
      status = "critical";
    } else if (degradedCount > totalCount * 0.2) {
      status = "degraded";
    }

    return {
      status,
      healthyCount,
      degradedCount,
      downCount,
      totalCount,
      averageUptime,
    };
  }
}

export const portalHealthMonitorService = new PortalHealthMonitorService();
