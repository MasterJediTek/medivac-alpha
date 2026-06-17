/**
 * Wait Time Alert Subscription Service
 * Allows users to subscribe to department wait time thresholds
 * and receive notifications when wait drops below target.
 */

export interface WaitAlertSubscription {
  id: string;
  departmentId: string;
  departmentName: string;
  thresholdMinutes: number;
  createdAt: number;
  isActive: boolean;
  lastTriggeredAt: number | null;
  triggerCount: number;
}

export interface WaitAlertNotification {
  id: string;
  subscriptionId: string;
  departmentId: string;
  departmentName: string;
  thresholdMinutes: number;
  actualWaitMinutes: number;
  triggeredAt: number;
  isRead: boolean;
}

type AlertCallback = (notification: WaitAlertNotification) => void;
type SubscriptionChangeCallback = (subscriptions: WaitAlertSubscription[]) => void;

const STORAGE_KEY = 'medivac_wait_alert_subscriptions';
const HISTORY_KEY = 'medivac_wait_alert_history';

const THRESHOLD_PRESETS = [5, 10, 15, 20, 30, 45, 60];

export class WaitAlertService {
  private static instance: WaitAlertService | null = null;
  private subscriptions: Map<string, WaitAlertSubscription> = new Map();
  private alertHistory: WaitAlertNotification[] = [];
  private alertCallbacks: Set<AlertCallback> = new Set();
  private subscriptionCallbacks: Set<SubscriptionChangeCallback> = new Set();
  private monitoringInterval: ReturnType<typeof setInterval> | null = null;
  private lastKnownWaits: Map<string, number> = new Map();

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): WaitAlertService {
    if (!WaitAlertService.instance) {
      WaitAlertService.instance = new WaitAlertService();
    }
    return WaitAlertService.instance;
  }

  static resetInstance(): void {
    if (WaitAlertService.instance) {
      WaitAlertService.instance.stopMonitoring();
      WaitAlertService.instance.subscriptions.clear();
      WaitAlertService.instance.alertHistory = [];
      WaitAlertService.instance.alertCallbacks.clear();
      WaitAlertService.instance.subscriptionCallbacks.clear();
      WaitAlertService.instance.lastKnownWaits.clear();
    }
    WaitAlertService.instance = null;
  }

  // ── Storage ──────────────────────────────────────────────────────────
  private loadFromStorage(): void {
    try {
      if (typeof window === 'undefined') return;
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const arr: WaitAlertSubscription[] = JSON.parse(raw);
        arr.forEach(s => this.subscriptions.set(s.id, s));
      }
      const histRaw = localStorage.getItem(HISTORY_KEY);
      if (histRaw) {
        this.alertHistory = JSON.parse(histRaw);
      }
    } catch {
      // ignore
    }
  }

  private saveToStorage(): void {
    try {
      if (typeof window === 'undefined') return;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(this.subscriptions.values())));
      localStorage.setItem(HISTORY_KEY, JSON.stringify(this.alertHistory.slice(0, 200)));
    } catch {
      // ignore
    }
  }

  // ── Subscribe to a department ────────────────────────────────────────
  subscribe(departmentId: string, departmentName: string, thresholdMinutes: number): WaitAlertSubscription {
    // Check if already subscribed to this department
    const existing = this.getSubscriptionForDepartment(departmentId);
    if (existing) {
      // Update threshold
      existing.thresholdMinutes = thresholdMinutes;
      existing.isActive = true;
      this.subscriptions.set(existing.id, existing);
      this.saveToStorage();
      this.notifySubscriptionChange();
      return existing;
    }

    const sub: WaitAlertSubscription = {
      id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      departmentId,
      departmentName,
      thresholdMinutes,
      createdAt: Date.now(),
      isActive: true,
      lastTriggeredAt: null,
      triggerCount: 0,
    };
    this.subscriptions.set(sub.id, sub);
    this.saveToStorage();
    this.notifySubscriptionChange();
    return sub;
  }

  unsubscribe(subscriptionId: string): boolean {
    const sub = this.subscriptions.get(subscriptionId);
    if (!sub) return false;
    sub.isActive = false;
    this.subscriptions.set(subscriptionId, sub);
    this.saveToStorage();
    this.notifySubscriptionChange();
    return true;
  }

  removeSubscription(subscriptionId: string): boolean {
    const result = this.subscriptions.delete(subscriptionId);
    if (result) {
      this.saveToStorage();
      this.notifySubscriptionChange();
    }
    return result;
  }

  reactivate(subscriptionId: string): boolean {
    const sub = this.subscriptions.get(subscriptionId);
    if (!sub) return false;
    sub.isActive = true;
    this.subscriptions.set(subscriptionId, sub);
    this.saveToStorage();
    this.notifySubscriptionChange();
    return true;
  }

  // ── Query ────────────────────────────────────────────────────────────
  getSubscriptionForDepartment(departmentId: string): WaitAlertSubscription | null {
    for (const sub of this.subscriptions.values()) {
      if (sub.departmentId === departmentId) return sub;
    }
    return null;
  }

  getAllSubscriptions(): WaitAlertSubscription[] {
    return Array.from(this.subscriptions.values());
  }

  getActiveSubscriptions(): WaitAlertSubscription[] {
    return Array.from(this.subscriptions.values()).filter(s => s.isActive);
  }

  getAlertHistory(): WaitAlertNotification[] {
    return [...this.alertHistory];
  }

  getUnreadAlerts(): WaitAlertNotification[] {
    return this.alertHistory.filter(a => !a.isRead);
  }

  getUnreadCount(): number {
    return this.alertHistory.filter(a => !a.isRead).length;
  }

  markAlertRead(alertId: string): void {
    const alert = this.alertHistory.find(a => a.id === alertId);
    if (alert) {
      alert.isRead = true;
      this.saveToStorage();
    }
  }

  markAllRead(): void {
    this.alertHistory.forEach(a => { a.isRead = true; });
    this.saveToStorage();
  }

  clearHistory(): void {
    this.alertHistory = [];
    this.saveToStorage();
  }

  // ── Monitoring ───────────────────────────────────────────────────────
  checkWaitTimes(currentWaits: Map<string, number>): WaitAlertNotification[] {
    const triggered: WaitAlertNotification[] = [];
    const now = Date.now();
    const COOLDOWN = 5 * 60 * 1000; // 5 min cooldown between alerts

    for (const sub of this.subscriptions.values()) {
      if (!sub.isActive) continue;

      const currentWait = currentWaits.get(sub.departmentId);
      if (currentWait === undefined) continue;

      const previousWait = this.lastKnownWaits.get(sub.departmentId);

      // Trigger if wait dropped below threshold
      // Only trigger if it was previously above (or first check)
      if (currentWait <= sub.thresholdMinutes) {
        if (previousWait === undefined || previousWait > sub.thresholdMinutes) {
          // Check cooldown
          if (sub.lastTriggeredAt && (now - sub.lastTriggeredAt) < COOLDOWN) continue;

          const notification: WaitAlertNotification = {
            id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            subscriptionId: sub.id,
            departmentId: sub.departmentId,
            departmentName: sub.departmentName,
            thresholdMinutes: sub.thresholdMinutes,
            actualWaitMinutes: currentWait,
            triggeredAt: now,
            isRead: false,
          };

          this.alertHistory.unshift(notification);
          sub.lastTriggeredAt = now;
          sub.triggerCount++;
          this.subscriptions.set(sub.id, sub);
          triggered.push(notification);

          // Notify listeners
          this.alertCallbacks.forEach(cb => cb(notification));
        }
      }
    }

    // Update last known waits
    currentWaits.forEach((wait, deptId) => {
      this.lastKnownWaits.set(deptId, wait);
    });

    if (triggered.length > 0) {
      this.saveToStorage();
    }

    return triggered;
  }

  startMonitoring(getWaitsFn: () => Map<string, number>, intervalMs: number = 30000): void {
    this.stopMonitoring();
    // Initial check
    this.checkWaitTimes(getWaitsFn());
    this.monitoringInterval = setInterval(() => {
      this.checkWaitTimes(getWaitsFn());
    }, intervalMs);
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  // ── Listeners ────────────────────────────────────────────────────────
  onAlert(callback: AlertCallback): () => void {
    this.alertCallbacks.add(callback);
    return () => { this.alertCallbacks.delete(callback); };
  }

  onSubscriptionChange(callback: SubscriptionChangeCallback): () => void {
    this.subscriptionCallbacks.add(callback);
    return () => { this.subscriptionCallbacks.delete(callback); };
  }

  private notifySubscriptionChange(): void {
    const subs = this.getAllSubscriptions();
    this.subscriptionCallbacks.forEach(cb => cb(subs));
  }

  // ── Helpers ──────────────────────────────────────────────────────────
  getThresholdPresets(): number[] {
    return [...THRESHOLD_PRESETS];
  }

  formatThreshold(minutes: number): string {
    if (minutes < 60) return `Under ${minutes} min`;
    return `Under ${Math.round(minutes / 60)} hr`;
  }

  getSubscriptionSummary(): { total: number; active: number; triggered: number; unread: number } {
    const all = this.getAllSubscriptions();
    return {
      total: all.length,
      active: all.filter(s => s.isActive).length,
      triggered: this.alertHistory.length,
      unread: this.getUnreadCount(),
    };
  }
}
