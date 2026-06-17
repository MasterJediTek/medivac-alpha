/**
 * Department Capacity Alerts Service
 * Monitors bed occupancy and sends alerts when departments reach capacity thresholds
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { livePushService } from './live-push.service';

export interface DepartmentCapacity {
  departmentId: string;
  departmentName: string;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  occupancyPercentage: number;
  lastUpdated: string;
  status: 'available' | 'warning' | 'critical' | 'full';
  trend: 'increasing' | 'decreasing' | 'stable';
  estimatedWaitTime: number; // in minutes
}

export interface CapacityAlert {
  id: string;
  departmentId: string;
  departmentName: string;
  alertType: 'threshold_80' | 'threshold_90' | 'threshold_100' | 'critical_change';
  occupancyPercentage: number;
  timestamp: string;
  isRead: boolean;
  actionTaken?: string;
}

export interface CapacityThreshold {
  departmentId: string;
  threshold80Enabled: boolean;
  threshold90Enabled: boolean;
  threshold100Enabled: boolean;
  notifyVia: ('push' | 'email' | 'in_app')[];
}

class CapacityAlertsService {
  private readonly CAPACITY_KEY = 'department_capacity';
  private readonly ALERTS_KEY = 'capacity_alerts';
  private readonly THRESHOLDS_KEY = 'capacity_thresholds';
  private readonly UPDATE_INTERVAL = 60000; // 1 minute
  private capacities: Map<string, DepartmentCapacity> = new Map();
  private alerts: CapacityAlert[] = [];
  private thresholds: Map<string, CapacityThreshold> = new Map();
  private updateTimer: NodeJS.Timeout | null = null;

  async initialize(): Promise<void> {
    await this.loadCapacities();
    await this.loadAlerts();
    await this.loadThresholds();
    this.startMonitoring();
  }

  /**
   * Start monitoring capacity changes
   */
  private startMonitoring(): void {
    this.updateTimer = setInterval(() => {
      this.updateCapacities();
    }, this.UPDATE_INTERVAL);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
  }

  /**
   * Update department capacities with simulated data
   */
  private async updateCapacities(): Promise<void> {
    const departments = Array.from(this.capacities.values());

    for (const dept of departments) {
      const previousOccupancy = dept.occupancyPercentage;

      // Simulate capacity changes
      const change = (Math.random() - 0.5) * 10; // -5 to +5 percentage points
      const newOccupancy = Math.max(0, Math.min(100, dept.occupancyPercentage + change));

      dept.occupiedBeds = Math.round((newOccupancy / 100) * dept.totalBeds);
      dept.availableBeds = dept.totalBeds - dept.occupiedBeds;
      dept.occupancyPercentage = newOccupancy;
      dept.lastUpdated = new Date().toISOString();

      // Determine status
      if (newOccupancy >= 100) {
        dept.status = 'full';
      } else if (newOccupancy >= 90) {
        dept.status = 'critical';
      } else if (newOccupancy >= 80) {
        dept.status = 'warning';
      } else {
        dept.status = 'available';
      }

      // Determine trend
      if (newOccupancy > previousOccupancy + 2) {
        dept.trend = 'increasing';
      } else if (newOccupancy < previousOccupancy - 2) {
        dept.trend = 'decreasing';
      } else {
        dept.trend = 'stable';
      }

      // Estimate wait time based on occupancy
      dept.estimatedWaitTime = Math.round(newOccupancy * 0.3); // 0-30 minutes

      // Check thresholds and send alerts
      await this.checkThresholdsAndAlert(dept, previousOccupancy);
    }

    await this.saveCapacities();
  }

  /**
   * Check if capacity crossed thresholds and send alerts
   */
  private async checkThresholdsAndAlert(
    dept: DepartmentCapacity,
    previousOccupancy: number
  ): Promise<void> {
    const threshold = this.thresholds.get(dept.departmentId);
    if (!threshold) return;

    const current = dept.occupancyPercentage;

    // Check 80% threshold
    if (threshold.threshold80Enabled && previousOccupancy < 80 && current >= 80) {
      await this.createAlert(dept, 'threshold_80');
    }

    // Check 90% threshold
    if (threshold.threshold90Enabled && previousOccupancy < 90 && current >= 90) {
      await this.createAlert(dept, 'threshold_90');
    }

    // Check 100% threshold
    if (threshold.threshold100Enabled && previousOccupancy < 100 && current >= 100) {
      await this.createAlert(dept, 'threshold_100');
    }

    // Check for critical changes (>15% change in 1 minute)
    if (Math.abs(current - previousOccupancy) > 15) {
      await this.createAlert(dept, 'critical_change');
    }
  }

  /**
   * Create and send a capacity alert
   */
  private async createAlert(dept: DepartmentCapacity, alertType: CapacityAlert['alertType']): Promise<void> {
    const alert: CapacityAlert = {
      id: 'alert_' + Date.now(),
      departmentId: dept.departmentId,
      departmentName: dept.departmentName,
      alertType,
      occupancyPercentage: dept.occupancyPercentage,
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    this.alerts.push(alert);

    // Send push notification
    const threshold = this.thresholds.get(dept.departmentId);
    if (threshold?.notifyVia.includes('push')) {
      const messages: Record<string, string> = {
        threshold_80: `${dept.departmentName} is 80% full`,
        threshold_90: `${dept.departmentName} is 90% full - CRITICAL`,
        threshold_100: `${dept.departmentName} is at full capacity`,
        critical_change: `${dept.departmentName} capacity changed significantly`,
      };

      try {
        await livePushService.sendNotification({
          title: 'Department Capacity Alert',
          body: messages[alertType],
          data: {
            type: 'capacity_alert',
            departmentId: dept.departmentId,
            occupancy: dept.occupancyPercentage.toString(),
          },
        });
      } catch (error) {
        console.error('[Capacity Alerts] Failed to send notification:', error);
      }
    }

    await this.saveAlerts();
  }

  /**
   * Get all department capacities
   */
  getCapacities(): DepartmentCapacity[] {
    return Array.from(this.capacities.values());
  }

  /**
   * Get capacity for a specific department
   */
  getCapacity(departmentId: string): DepartmentCapacity | null {
    return this.capacities.get(departmentId) || null;
  }

  /**
   * Get departments at critical capacity (>90%)
   */
  getCriticalDepartments(): DepartmentCapacity[] {
    return Array.from(this.capacities.values()).filter(d => d.occupancyPercentage > 90);
  }

  /**
   * Get all capacity alerts
   */
  getAlerts(): CapacityAlert[] {
    return this.alerts.slice().reverse();
  }

  /**
   * Get unread alerts count
   */
  getUnreadAlertCount(): number {
    return this.alerts.filter(a => !a.isRead).length;
  }

  /**
   * Mark alert as read
   */
  async markAlertAsRead(alertId: string): Promise<void> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.isRead = true;
      await this.saveAlerts();
    }
  }

  /**
   * Set capacity thresholds for a department
   */
  async setThresholds(departmentId: string, thresholds: CapacityThreshold): Promise<void> {
    this.thresholds.set(departmentId, thresholds);
    await this.saveThresholds();
  }

  /**
   * Initialize department capacities (call once on app start)
   */
  async initializeDepartments(departments: Array<{ id: string; name: string; beds: number }>): Promise<void> {
    for (const dept of departments) {
      const capacity: DepartmentCapacity = {
        departmentId: dept.id,
        departmentName: dept.name,
        totalBeds: dept.beds,
        occupiedBeds: Math.floor(Math.random() * dept.beds),
        availableBeds: 0,
        occupancyPercentage: 0,
        lastUpdated: new Date().toISOString(),
        status: 'available',
        trend: 'stable',
        estimatedWaitTime: 0,
      };

      capacity.availableBeds = capacity.totalBeds - capacity.occupiedBeds;
      capacity.occupancyPercentage = Math.round((capacity.occupiedBeds / capacity.totalBeds) * 100);

      this.capacities.set(dept.id, capacity);

      // Set default thresholds
      this.thresholds.set(dept.id, {
        departmentId: dept.id,
        threshold80Enabled: true,
        threshold90Enabled: true,
        threshold100Enabled: true,
        notifyVia: ['push', 'in_app'],
      });
    }

    await this.saveCapacities();
    await this.saveThresholds();
  }

  /**
   * Get capacity statistics
   */
  getCapacityStats() {
    const capacities = Array.from(this.capacities.values());
    const avgOccupancy = capacities.length > 0
      ? capacities.reduce((sum, c) => sum + c.occupancyPercentage, 0) / capacities.length
      : 0;

    const critical = capacities.filter(c => c.occupancyPercentage > 90).length;
    const full = capacities.filter(c => c.occupancyPercentage >= 100).length;

    return {
      totalDepartments: capacities.length,
      averageOccupancy: Math.round(avgOccupancy),
      criticalDepartments: critical,
      fullDepartments: full,
      totalBeds: capacities.reduce((sum, c) => sum + c.totalBeds, 0),
      totalOccupied: capacities.reduce((sum, c) => sum + c.occupiedBeds, 0),
      totalAvailable: capacities.reduce((sum, c) => sum + c.availableBeds, 0),
    };
  }

  private async loadCapacities(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.CAPACITY_KEY);
      if (data) {
        const capacities = JSON.parse(data);
        this.capacities = new Map(capacities.map((c: DepartmentCapacity) => [c.departmentId, c]));
      }
    } catch (error) {
      console.error('[Capacity Alerts] Failed to load capacities:', error);
    }
  }

  private async saveCapacities(): Promise<void> {
    try {
      const capacities = Array.from(this.capacities.values());
      await AsyncStorage.setItem(this.CAPACITY_KEY, JSON.stringify(capacities));
    } catch (error) {
      console.error('[Capacity Alerts] Failed to save capacities:', error);
    }
  }

  private async loadAlerts(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.ALERTS_KEY);
      if (data) {
        this.alerts = JSON.parse(data);
      }
    } catch (error) {
      console.error('[Capacity Alerts] Failed to load alerts:', error);
    }
  }

  private async saveAlerts(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.ALERTS_KEY, JSON.stringify(this.alerts));
    } catch (error) {
      console.error('[Capacity Alerts] Failed to save alerts:', error);
    }
  }

  private async loadThresholds(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.THRESHOLDS_KEY);
      if (data) {
        const thresholds = JSON.parse(data);
        this.thresholds = new Map(thresholds.map((t: CapacityThreshold) => [t.departmentId, t]));
      }
    } catch (error) {
      console.error('[Capacity Alerts] Failed to load thresholds:', error);
    }
  }

  private async saveThresholds(): Promise<void> {
    try {
      const thresholds = Array.from(this.thresholds.values());
      await AsyncStorage.setItem(this.THRESHOLDS_KEY, JSON.stringify(thresholds));
    } catch (error) {
      console.error('[Capacity Alerts] Failed to save thresholds:', error);
    }
  }
}

export const capacityAlertsService = new CapacityAlertsService();
