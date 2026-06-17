/**
 * Biometric Timeout Service
 * Manages configurable auto-lock duration for biometric authentication
 */

export type TimeoutDuration = 300 | 900 | 1800 | 3600 | -1;
// 300 = 5 min, 900 = 15 min, 1800 = 30 min, 3600 = 1 hr, -1 = never

export interface TimeoutConfig {
  duration: TimeoutDuration;
  label: string;
  description: string;
}

export interface TimeoutState {
  isLocked: boolean;
  lastActivity: number;
  timeoutDuration: TimeoutDuration;
  remainingTime: number; // seconds until lock, -1 if never
}

type TimeoutListener = (state: TimeoutState) => void;

const TIMEOUT_OPTIONS: TimeoutConfig[] = [
  { duration: 300, label: '5 minutes', description: 'Lock after 5 minutes of inactivity' },
  { duration: 900, label: '15 minutes', description: 'Lock after 15 minutes of inactivity' },
  { duration: 1800, label: '30 minutes', description: 'Lock after 30 minutes of inactivity' },
  { duration: 3600, label: '1 hour', description: 'Lock after 1 hour of inactivity' },
  { duration: -1, label: 'Never', description: 'Stay unlocked until manual lock' },
];

const STORAGE_KEY = 'medivac_biometric_timeout';

class BiometricTimeoutService {
  private static instance: BiometricTimeoutService;
  private listeners: Set<TimeoutListener> = new Set();
  private timeoutDuration: TimeoutDuration = 900; // default 15 min
  private lastActivity: number = Date.now();
  private isLocked: boolean = true;
  private checkInterval: ReturnType<typeof setInterval> | null = null;
  private staffId: string | null = null;

  private constructor() {
    this.loadSettings();
  }

  static getInstance(): BiometricTimeoutService {
    if (!BiometricTimeoutService.instance) {
      BiometricTimeoutService.instance = new BiometricTimeoutService();
    }
    return BiometricTimeoutService.instance;
  }

  subscribe(listener: TimeoutListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach(listener => listener(state));
  }

  private loadSettings(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const data = JSON.parse(stored);
          this.timeoutDuration = data.duration ?? 900;
        }
      }
    } catch {
      // Use default
    }
  }

  private saveSettings(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          duration: this.timeoutDuration,
          staffId: this.staffId,
        }));
      }
    } catch {
      // Silently fail
    }
  }

  // Get all timeout options
  getTimeoutOptions(): TimeoutConfig[] {
    return [...TIMEOUT_OPTIONS];
  }

  // Get current timeout duration
  getTimeoutDuration(): TimeoutDuration {
    return this.timeoutDuration;
  }

  // Get current timeout config
  getCurrentConfig(): TimeoutConfig {
    return TIMEOUT_OPTIONS.find(opt => opt.duration === this.timeoutDuration) || TIMEOUT_OPTIONS[1];
  }

  // Set timeout duration
  setTimeoutDuration(duration: TimeoutDuration): void {
    this.timeoutDuration = duration;
    this.saveSettings();
    this.notifyListeners();
  }

  // Get current state
  getState(): TimeoutState {
    const now = Date.now();
    const elapsed = Math.floor((now - this.lastActivity) / 1000);
    let remainingTime = -1;

    if (this.timeoutDuration > 0) {
      remainingTime = Math.max(0, this.timeoutDuration - elapsed);
    }

    return {
      isLocked: this.isLocked,
      lastActivity: this.lastActivity,
      timeoutDuration: this.timeoutDuration,
      remainingTime,
    };
  }

  // Record user activity (resets timeout)
  recordActivity(): void {
    this.lastActivity = Date.now();
    if (this.isLocked) return; // Don't notify if locked
    this.notifyListeners();
  }

  // Unlock (after successful biometric/PIN auth)
  unlock(staffId: string): void {
    this.isLocked = false;
    this.staffId = staffId;
    this.lastActivity = Date.now();
    this.startMonitoring();
    this.notifyListeners();
  }

  // Lock manually
  lock(): void {
    this.isLocked = true;
    this.stopMonitoring();
    this.notifyListeners();
  }

  // Check if timed out
  isTimedOut(): boolean {
    if (this.timeoutDuration === -1) return false;
    const elapsed = Math.floor((Date.now() - this.lastActivity) / 1000);
    return elapsed >= this.timeoutDuration;
  }

  // Start monitoring for timeout
  private startMonitoring(): void {
    this.stopMonitoring();

    if (this.timeoutDuration === -1) return; // Never timeout

    this.checkInterval = setInterval(() => {
      if (this.isTimedOut() && !this.isLocked) {
        this.lock();
      } else {
        this.notifyListeners();
      }
    }, 10000); // Check every 10 seconds
  }

  // Stop monitoring
  private stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  // Get formatted remaining time
  getFormattedRemainingTime(): string {
    const state = this.getState();
    if (state.remainingTime === -1) return 'Never';
    if (state.remainingTime === 0) return 'Locked';

    const minutes = Math.floor(state.remainingTime / 60);
    const seconds = state.remainingTime % 60;

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }

  // Get timeout label for a duration
  getTimeoutLabel(duration: TimeoutDuration): string {
    const config = TIMEOUT_OPTIONS.find(opt => opt.duration === duration);
    return config?.label || 'Unknown';
  }

  // Reset to defaults
  resetToDefaults(): void {
    this.timeoutDuration = 900;
    this.isLocked = true;
    this.stopMonitoring();
    this.saveSettings();
    this.notifyListeners();
  }

  // Cleanup
  destroy(): void {
    this.stopMonitoring();
    this.listeners.clear();
  }
}

export const biometricTimeoutService = BiometricTimeoutService.getInstance();
