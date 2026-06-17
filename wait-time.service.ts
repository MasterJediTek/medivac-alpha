/**
 * Wait Time Service - v9.19
 * Simulates real-time department wait times with realistic hospital patterns.
 * Provides color-coded urgency levels and trend indicators.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UrgencyLevel = 'low' | 'moderate' | 'high' | 'critical';
export type TrendDirection = 'increasing' | 'decreasing' | 'stable';

export interface DepartmentWaitTime {
  departmentId: string;
  waitMinutes: number;
  urgencyLevel: UrgencyLevel;
  urgencyColor: string;
  trend: TrendDirection;
  trendIcon: string;
  lastUpdated: number;
  patientsWaiting: number;
  label: string;
}

interface WaitTimeConfig {
  baseWait: number;
  peakMultiplier: number;
  variance: number;
  maxPatients: number;
}

const DEPARTMENT_CONFIGS: Record<string, WaitTimeConfig> = {
  'emergency': { baseWait: 35, peakMultiplier: 2.5, variance: 20, maxPatients: 18 },
  'radiology': { baseWait: 25, peakMultiplier: 1.8, variance: 15, maxPatients: 8 },
  'pathology': { baseWait: 15, peakMultiplier: 1.5, variance: 10, maxPatients: 12 },
  'pharmacy': { baseWait: 12, peakMultiplier: 1.6, variance: 8, maxPatients: 10 },
  'maternity': { baseWait: 10, peakMultiplier: 1.3, variance: 5, maxPatients: 6 },
  'icu': { baseWait: 5, peakMultiplier: 1.2, variance: 3, maxPatients: 4 },
  'mental-health': { baseWait: 20, peakMultiplier: 1.4, variance: 10, maxPatients: 6 },
  'physiotherapy': { baseWait: 18, peakMultiplier: 1.5, variance: 8, maxPatients: 5 },
  'surgical': { baseWait: 8, peakMultiplier: 1.3, variance: 5, maxPatients: 3 },
  'paediatrics': { baseWait: 15, peakMultiplier: 1.6, variance: 10, maxPatients: 7 },
  'main-hospital': { baseWait: 10, peakMultiplier: 1.4, variance: 5, maxPatients: 8 },
  'cafeteria': { baseWait: 5, peakMultiplier: 2.0, variance: 5, maxPatients: 15 },
};

const STORAGE_KEY = 'medivac_wait_times_history';

export class WaitTimeService {
  private static instance: WaitTimeService | null = null;
  private currentTimes: Map<string, DepartmentWaitTime> = new Map();
  private history: Map<string, number[]> = new Map();
  private refreshInterval: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<(times: DepartmentWaitTime[]) => void> = new Set();

  static getInstance(): WaitTimeService {
    if (!WaitTimeService.instance) {
      WaitTimeService.instance = new WaitTimeService();
    }
    return WaitTimeService.instance;
  }

  static resetInstance(): void {
    if (WaitTimeService.instance) {
      WaitTimeService.instance.stopAutoRefresh();
      WaitTimeService.instance = null;
    }
  }

  /**
   * Get the current hour-of-day peak multiplier.
   * Hospitals are busiest 9am-12pm and 2pm-5pm.
   */
  private getPeakFactor(): number {
    const hour = new Date().getHours();
    if (hour >= 9 && hour <= 11) return 1.0;
    if (hour >= 14 && hour <= 16) return 0.85;
    if (hour >= 7 && hour <= 8) return 0.7;
    if (hour >= 17 && hour <= 19) return 0.6;
    if (hour >= 20 || hour <= 5) return 0.3;
    return 0.5;
  }

  /**
   * Simulate a wait time for a department based on config and time-of-day.
   */
  private simulateWaitTime(departmentId: string): DepartmentWaitTime {
    const config = DEPARTMENT_CONFIGS[departmentId];
    if (!config) {
      return {
        departmentId,
        waitMinutes: 0,
        urgencyLevel: 'low',
        urgencyColor: '#22C55E',
        trend: 'stable',
        trendIcon: '→',
        lastUpdated: Date.now(),
        patientsWaiting: 0,
        label: '0 min',
      };
    }

    const peakFactor = this.getPeakFactor();
    const randomVariance = (Math.random() - 0.5) * 2 * config.variance;
    const waitMinutes = Math.max(0, Math.round(
      config.baseWait * (1 + (config.peakMultiplier - 1) * peakFactor) + randomVariance
    ));

    const patientsWaiting = Math.max(0, Math.round(
      (waitMinutes / config.baseWait) * (config.maxPatients * 0.6) + (Math.random() - 0.5) * 4
    ));

    // Determine urgency
    let urgencyLevel: UrgencyLevel;
    let urgencyColor: string;
    const ratio = waitMinutes / config.baseWait;
    if (ratio <= 0.8) {
      urgencyLevel = 'low';
      urgencyColor = '#22C55E';
    } else if (ratio <= 1.3) {
      urgencyLevel = 'moderate';
      urgencyColor = '#F59E0B';
    } else if (ratio <= 2.0) {
      urgencyLevel = 'high';
      urgencyColor = '#F97316';
    } else {
      urgencyLevel = 'critical';
      urgencyColor = '#EF4444';
    }

    // Determine trend from history
    const prevHistory = this.history.get(departmentId) || [];
    let trend: TrendDirection = 'stable';
    let trendIcon = '→';
    if (prevHistory.length >= 2) {
      const recent = prevHistory.slice(-3);
      const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
      if (waitMinutes > avg + 3) {
        trend = 'increasing';
        trendIcon = '↑';
      } else if (waitMinutes < avg - 3) {
        trend = 'decreasing';
        trendIcon = '↓';
      }
    }

    // Update history
    const newHistory = [...prevHistory, waitMinutes].slice(-10);
    this.history.set(departmentId, newHistory);

    return {
      departmentId,
      waitMinutes,
      urgencyLevel,
      urgencyColor,
      trend,
      trendIcon,
      lastUpdated: Date.now(),
      patientsWaiting,
      label: waitMinutes === 0 ? 'No wait' : `${waitMinutes} min`,
    };
  }

  /**
   * Refresh all department wait times.
   */
  refreshAll(): DepartmentWaitTime[] {
    const times: DepartmentWaitTime[] = [];
    for (const deptId of Object.keys(DEPARTMENT_CONFIGS)) {
      const wt = this.simulateWaitTime(deptId);
      this.currentTimes.set(deptId, wt);
      times.push(wt);
    }
    this.notifyListeners(times);
    return times;
  }

  /**
   * Get current wait time for a specific department.
   */
  getWaitTime(departmentId: string): DepartmentWaitTime | null {
    if (!this.currentTimes.has(departmentId)) {
      const wt = this.simulateWaitTime(departmentId);
      this.currentTimes.set(departmentId, wt);
      return wt;
    }
    return this.currentTimes.get(departmentId) || null;
  }

  /**
   * Get all current wait times.
   */
  getAllWaitTimes(): DepartmentWaitTime[] {
    if (this.currentTimes.size === 0) {
      return this.refreshAll();
    }
    return Array.from(this.currentTimes.values());
  }

  /**
   * Start auto-refresh every 30 seconds.
   */
  startAutoRefresh(intervalMs: number = 30000): void {
    this.stopAutoRefresh();
    this.refreshAll();
    this.refreshInterval = setInterval(() => {
      this.refreshAll();
    }, intervalMs);
  }

  /**
   * Stop auto-refresh.
   */
  stopAutoRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  /**
   * Subscribe to wait time updates.
   */
  subscribe(listener: (times: DepartmentWaitTime[]) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(times: DepartmentWaitTime[]): void {
    this.listeners.forEach(listener => listener(times));
  }

  /**
   * Get urgency summary across all departments.
   */
  getUrgencySummary(): { low: number; moderate: number; high: number; critical: number } {
    const times = this.getAllWaitTimes();
    return {
      low: times.filter(t => t.urgencyLevel === 'low').length,
      moderate: times.filter(t => t.urgencyLevel === 'moderate').length,
      high: times.filter(t => t.urgencyLevel === 'high').length,
      critical: times.filter(t => t.urgencyLevel === 'critical').length,
    };
  }

  /**
   * Get the department with the longest wait.
   */
  getLongestWait(): DepartmentWaitTime | null {
    const times = this.getAllWaitTimes();
    if (times.length === 0) return null;
    return times.reduce((max, t) => t.waitMinutes > max.waitMinutes ? t : max, times[0]);
  }

  /**
   * Get the department with the shortest wait.
   */
  getShortestWait(): DepartmentWaitTime | null {
    const times = this.getAllWaitTimes();
    if (times.length === 0) return null;
    return times.reduce((min, t) => t.waitMinutes < min.waitMinutes ? t : min, times[0]);
  }

  /**
   * Persist current state for offline access.
   */
  async saveToStorage(): Promise<void> {
    try {
      const data = {
        times: Array.from(this.currentTimes.entries()),
        history: Array.from(this.history.entries()),
        savedAt: Date.now(),
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      // silent
    }
  }

  /**
   * Load persisted state.
   */
  async loadFromStorage(): Promise<void> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.times) {
          this.currentTimes = new Map(data.times);
        }
        if (data.history) {
          this.history = new Map(data.history);
        }
      }
    } catch (e) {
      // silent
    }
  }
}
