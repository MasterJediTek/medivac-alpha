/**
 * Weather Forecast Wallpapers Service
 * MediVac WACHS v9.1
 * 
 * Pre-loads wallpapers based on weather forecasts and smoothly
 * transitions before weather changes occur.
 */

export type ForecastPeriod = 'hourly' | 'daily' | 'weekly';
export type TransitionTiming = 'before' | 'during' | 'after';

export interface WeatherForecast {
  id: string;
  timestamp: number;
  condition: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  confidence: number;
  source: string;
}

export interface ForecastWallpaper {
  id: string;
  forecastId: string;
  wallpaperId: string;
  condition: string;
  scheduledTime: number;
  transitionDuration: number;
  transitionEffect: string;
  particleEffects: string[];
  isPreloaded: boolean;
  preloadedAt: number | null;
  isActive: boolean;
  activatedAt: number | null;
}

export interface WallpaperQueue {
  id: string;
  name: string;
  wallpapers: ForecastWallpaper[];
  currentIndex: number;
  isPlaying: boolean;
  autoAdvance: boolean;
  transitionMode: 'smooth' | 'instant' | 'dramatic';
}

export interface ForecastAccuracy {
  forecastId: string;
  predictedCondition: string;
  actualCondition: string;
  predictedTime: number;
  actualTime: number;
  wasAccurate: boolean;
  confidenceScore: number;
}

export interface CountdownTimer {
  id: string;
  forecastId: string;
  targetTime: number;
  remainingSeconds: number;
  condition: string;
  wallpaperId: string;
  showNotification: boolean;
  notificationSent: boolean;
}

export interface ForecastAnalytics {
  totalForecasts: number;
  accurateForecasts: number;
  accuracyPercentage: number;
  totalPreloads: number;
  successfulPreloads: number;
  avgPreloadTime: number;
  totalTransitions: number;
  smoothTransitions: number;
  conditionAccuracy: Record<string, { predicted: number; accurate: number }>;
}

// Condition to Wallpaper Mappings
const CONDITION_WALLPAPERS: Record<string, { wallpaperIds: string[]; particles: string[]; transition: string }> = {
  'clear': { wallpaperIds: ['sunny-sky', 'blue-horizon', 'golden-sun'], particles: ['sun-rays'], transition: 'sun-burst' },
  'partly-cloudy': { wallpaperIds: ['scattered-clouds', 'partly-sunny'], particles: ['clouds'], transition: 'cloud-drift' },
  'cloudy': { wallpaperIds: ['overcast-sky', 'grey-clouds'], particles: ['heavy-clouds'], transition: 'cloud-cover' },
  'rain': { wallpaperIds: ['rainy-day', 'rain-window', 'wet-streets'], particles: ['rain', 'ripples'], transition: 'rain-fade' },
  'heavy-rain': { wallpaperIds: ['downpour', 'storm-rain'], particles: ['heavy-rain', 'splashes'], transition: 'storm-build' },
  'thunderstorm': { wallpaperIds: ['lightning-sky', 'thunder-clouds'], particles: ['lightning', 'rain'], transition: 'lightning-flash' },
  'snow': { wallpaperIds: ['snowy-landscape', 'winter-scene'], particles: ['snow'], transition: 'snow-drift' },
  'heavy-snow': { wallpaperIds: ['blizzard', 'heavy-snowfall'], particles: ['heavy-snow', 'wind'], transition: 'blizzard-build' },
  'fog': { wallpaperIds: ['foggy-morning', 'mist-valley'], particles: ['fog', 'mist'], transition: 'fog-roll' },
  'wind': { wallpaperIds: ['windy-day', 'windswept'], particles: ['leaves', 'dust'], transition: 'wind-sweep' },
  'hot': { wallpaperIds: ['summer-heat', 'desert-sun'], particles: ['heat-shimmer'], transition: 'heat-wave' },
  'cold': { wallpaperIds: ['frozen-morning', 'winter-cold'], particles: ['frost'], transition: 'frost-spread' },
};

// Transition Effects
const TRANSITION_EFFECTS: Record<string, { duration: number; easing: string; particles: boolean }> = {
  'sun-burst': { duration: 2000, easing: 'ease-out', particles: true },
  'cloud-drift': { duration: 3000, easing: 'ease-in-out', particles: true },
  'cloud-cover': { duration: 2500, easing: 'ease-in', particles: true },
  'rain-fade': { duration: 1500, easing: 'ease-in', particles: true },
  'storm-build': { duration: 1000, easing: 'ease-in', particles: true },
  'lightning-flash': { duration: 500, easing: 'linear', particles: true },
  'snow-drift': { duration: 3000, easing: 'ease-in-out', particles: true },
  'blizzard-build': { duration: 2000, easing: 'ease-in', particles: true },
  'fog-roll': { duration: 4000, easing: 'ease-in-out', particles: true },
  'wind-sweep': { duration: 1500, easing: 'ease-out', particles: true },
  'heat-wave': { duration: 2500, easing: 'ease-in-out', particles: true },
  'frost-spread': { duration: 3000, easing: 'ease-out', particles: true },
};

class WeatherForecastWallpapersService {
  private forecasts: Map<string, WeatherForecast> = new Map();
  private forecastWallpapers: Map<string, ForecastWallpaper> = new Map();
  private wallpaperQueue: WallpaperQueue | null = null;
  private countdownTimers: Map<string, CountdownTimer> = new Map();
  private accuracyHistory: ForecastAccuracy[] = [];
  private analytics: ForecastAnalytics;
  private preloadInterval: ReturnType<typeof setInterval> | null = null;
  private countdownInterval: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.analytics = {
      totalForecasts: 0,
      accurateForecasts: 0,
      accuracyPercentage: 0,
      totalPreloads: 0,
      successfulPreloads: 0,
      avgPreloadTime: 0,
      totalTransitions: 0,
      smoothTransitions: 0,
      conditionAccuracy: {},
    };
    this.initializeDefaults();
  }

  private initializeDefaults(): void {
    // Generate sample forecast for next 24 hours
    const conditions = ['clear', 'partly-cloudy', 'cloudy', 'rain', 'clear', 'partly-cloudy'];
    const now = Date.now();

    conditions.forEach((condition, index) => {
      const forecastTime = now + (index + 1) * 3600000; // Each hour
      const forecastId = `forecast-${index + 1}`;
      
      this.forecasts.set(forecastId, {
        id: forecastId,
        timestamp: forecastTime,
        condition,
        temperature: 20 + Math.random() * 10,
        humidity: 40 + Math.random() * 40,
        windSpeed: 5 + Math.random() * 20,
        precipitation: condition.includes('rain') ? 50 + Math.random() * 50 : Math.random() * 20,
        confidence: 0.7 + Math.random() * 0.25,
        source: 'weather-api',
      });

      // Create forecast wallpaper
      this.createForecastWallpaper(forecastId);
    });

    // Initialize wallpaper queue
    this.wallpaperQueue = {
      id: 'main-queue',
      name: 'Forecast Queue',
      wallpapers: Array.from(this.forecastWallpapers.values()),
      currentIndex: 0,
      isPlaying: false,
      autoAdvance: true,
      transitionMode: 'smooth',
    };
  }

  // Forecast Management
  getAllForecasts(): WeatherForecast[] {
    return Array.from(this.forecasts.values()).sort((a, b) => a.timestamp - b.timestamp);
  }

  getForecast(id: string): WeatherForecast | undefined {
    return this.forecasts.get(id);
  }

  addForecast(data: Omit<WeatherForecast, 'id'>): WeatherForecast {
    const id = `forecast-${Date.now()}`;
    const forecast: WeatherForecast = { ...data, id };
    this.forecasts.set(id, forecast);
    
    this.analytics.totalForecasts++;
    this.createForecastWallpaper(id);
    this.notifyListeners();
    
    return forecast;
  }

  updateForecast(id: string, updates: Partial<WeatherForecast>): WeatherForecast | null {
    const forecast = this.forecasts.get(id);
    if (!forecast) return null;

    Object.assign(forecast, updates);
    this.notifyListeners();
    return forecast;
  }

  // Forecast Wallpaper Management
  private createForecastWallpaper(forecastId: string): ForecastWallpaper | null {
    const forecast = this.forecasts.get(forecastId);
    if (!forecast) return null;

    const conditionConfig = CONDITION_WALLPAPERS[forecast.condition] || CONDITION_WALLPAPERS['clear'];
    const transitionConfig = TRANSITION_EFFECTS[conditionConfig.transition] || TRANSITION_EFFECTS['sun-burst'];
    const wallpaperId = conditionConfig.wallpaperIds[Math.floor(Math.random() * conditionConfig.wallpaperIds.length)];

    const forecastWallpaper: ForecastWallpaper = {
      id: `fw-${forecastId}`,
      forecastId,
      wallpaperId,
      condition: forecast.condition,
      scheduledTime: forecast.timestamp,
      transitionDuration: transitionConfig.duration,
      transitionEffect: conditionConfig.transition,
      particleEffects: conditionConfig.particles,
      isPreloaded: false,
      preloadedAt: null,
      isActive: false,
      activatedAt: null,
    };

    this.forecastWallpapers.set(forecastWallpaper.id, forecastWallpaper);
    return forecastWallpaper;
  }

  getAllForecastWallpapers(): ForecastWallpaper[] {
    return Array.from(this.forecastWallpapers.values()).sort((a, b) => a.scheduledTime - b.scheduledTime);
  }

  getForecastWallpaper(id: string): ForecastWallpaper | undefined {
    return this.forecastWallpapers.get(id);
  }

  // Preloading
  preloadWallpaper(forecastWallpaperId: string): boolean {
    const fw = this.forecastWallpapers.get(forecastWallpaperId);
    if (!fw || fw.isPreloaded) return false;

    const startTime = Date.now();
    
    // Simulate preloading (in real app, this would load the actual image)
    fw.isPreloaded = true;
    fw.preloadedAt = Date.now();

    this.analytics.totalPreloads++;
    this.analytics.successfulPreloads++;
    
    const preloadTime = Date.now() - startTime;
    this.analytics.avgPreloadTime = 
      (this.analytics.avgPreloadTime * (this.analytics.totalPreloads - 1) + preloadTime) / this.analytics.totalPreloads;

    this.notifyListeners();
    return true;
  }

  preloadUpcoming(hoursAhead: number = 3): number {
    const now = Date.now();
    const cutoff = now + hoursAhead * 3600000;
    let preloaded = 0;

    for (const fw of this.forecastWallpapers.values()) {
      if (fw.scheduledTime <= cutoff && !fw.isPreloaded) {
        if (this.preloadWallpaper(fw.id)) {
          preloaded++;
        }
      }
    }

    return preloaded;
  }

  startAutoPreload(intervalMinutes: number = 30): void {
    if (this.preloadInterval) return;

    this.preloadInterval = setInterval(() => {
      this.preloadUpcoming(3);
    }, intervalMinutes * 60000);

    // Initial preload
    this.preloadUpcoming(3);
    this.notifyListeners();
  }

  stopAutoPreload(): void {
    if (this.preloadInterval) {
      clearInterval(this.preloadInterval);
      this.preloadInterval = null;
    }
    this.notifyListeners();
  }

  // Wallpaper Queue
  getWallpaperQueue(): WallpaperQueue | null {
    return this.wallpaperQueue;
  }

  startQueue(): void {
    if (!this.wallpaperQueue) return;
    
    this.wallpaperQueue.isPlaying = true;
    this.notifyListeners();
  }

  stopQueue(): void {
    if (!this.wallpaperQueue) return;
    
    this.wallpaperQueue.isPlaying = false;
    this.notifyListeners();
  }

  advanceQueue(): ForecastWallpaper | null {
    if (!this.wallpaperQueue || this.wallpaperQueue.wallpapers.length === 0) return null;

    // Deactivate current
    const current = this.wallpaperQueue.wallpapers[this.wallpaperQueue.currentIndex];
    if (current) {
      current.isActive = false;
    }

    // Advance to next
    this.wallpaperQueue.currentIndex = 
      (this.wallpaperQueue.currentIndex + 1) % this.wallpaperQueue.wallpapers.length;

    // Activate new current
    const next = this.wallpaperQueue.wallpapers[this.wallpaperQueue.currentIndex];
    if (next) {
      next.isActive = true;
      next.activatedAt = Date.now();
      this.analytics.totalTransitions++;
      this.analytics.smoothTransitions++;
    }

    this.notifyListeners();
    return next;
  }

  setQueueTransitionMode(mode: 'smooth' | 'instant' | 'dramatic'): void {
    if (!this.wallpaperQueue) return;
    
    this.wallpaperQueue.transitionMode = mode;
    this.notifyListeners();
  }

  // Countdown Timers
  createCountdown(forecastId: string): CountdownTimer | null {
    const forecast = this.forecasts.get(forecastId);
    const fw = Array.from(this.forecastWallpapers.values()).find(w => w.forecastId === forecastId);
    
    if (!forecast || !fw) return null;

    const timer: CountdownTimer = {
      id: `countdown-${forecastId}`,
      forecastId,
      targetTime: forecast.timestamp,
      remainingSeconds: Math.max(0, Math.floor((forecast.timestamp - Date.now()) / 1000)),
      condition: forecast.condition,
      wallpaperId: fw.wallpaperId,
      showNotification: true,
      notificationSent: false,
    };

    this.countdownTimers.set(timer.id, timer);
    this.notifyListeners();
    return timer;
  }

  getAllCountdowns(): CountdownTimer[] {
    return Array.from(this.countdownTimers.values()).sort((a, b) => a.targetTime - b.targetTime);
  }

  getCountdown(id: string): CountdownTimer | undefined {
    return this.countdownTimers.get(id);
  }

  updateCountdowns(): void {
    const now = Date.now();
    
    for (const timer of this.countdownTimers.values()) {
      timer.remainingSeconds = Math.max(0, Math.floor((timer.targetTime - now) / 1000));
      
      // Check if countdown reached zero
      if (timer.remainingSeconds === 0 && !timer.notificationSent && timer.showNotification) {
        timer.notificationSent = true;
        // Trigger wallpaper change
        this.activateWallpaperForForecast(timer.forecastId);
      }
    }

    this.notifyListeners();
  }

  startCountdownUpdates(): void {
    if (this.countdownInterval) return;

    this.countdownInterval = setInterval(() => {
      this.updateCountdowns();
    }, 1000);

    this.notifyListeners();
  }

  stopCountdownUpdates(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
    this.notifyListeners();
  }

  // Activate Wallpaper
  activateWallpaperForForecast(forecastId: string): ForecastWallpaper | null {
    const fw = Array.from(this.forecastWallpapers.values()).find(w => w.forecastId === forecastId);
    if (!fw) return null;

    // Deactivate all others
    for (const wallpaper of this.forecastWallpapers.values()) {
      wallpaper.isActive = false;
    }

    // Activate this one
    fw.isActive = true;
    fw.activatedAt = Date.now();
    this.analytics.totalTransitions++;

    this.notifyListeners();
    return fw;
  }

  getActiveWallpaper(): ForecastWallpaper | null {
    return Array.from(this.forecastWallpapers.values()).find(fw => fw.isActive) || null;
  }

  // Forecast Accuracy
  recordAccuracy(forecastId: string, actualCondition: string): ForecastAccuracy | null {
    const forecast = this.forecasts.get(forecastId);
    if (!forecast) return null;

    const wasAccurate = forecast.condition === actualCondition;
    const accuracy: ForecastAccuracy = {
      forecastId,
      predictedCondition: forecast.condition,
      actualCondition,
      predictedTime: forecast.timestamp,
      actualTime: Date.now(),
      wasAccurate,
      confidenceScore: forecast.confidence,
    };

    this.accuracyHistory.push(accuracy);
    
    // Update analytics
    if (wasAccurate) {
      this.analytics.accurateForecasts++;
    }
    this.analytics.accuracyPercentage = 
      this.analytics.totalForecasts > 0 
        ? (this.analytics.accurateForecasts / this.analytics.totalForecasts) * 100 
        : 0;

    // Update condition accuracy
    if (!this.analytics.conditionAccuracy[forecast.condition]) {
      this.analytics.conditionAccuracy[forecast.condition] = { predicted: 0, accurate: 0 };
    }
    this.analytics.conditionAccuracy[forecast.condition].predicted++;
    if (wasAccurate) {
      this.analytics.conditionAccuracy[forecast.condition].accurate++;
    }

    this.notifyListeners();
    return accuracy;
  }

  getAccuracyHistory(): ForecastAccuracy[] {
    return [...this.accuracyHistory];
  }

  // Manual Override
  overrideForecast(forecastId: string, newCondition: string): WeatherForecast | null {
    const forecast = this.forecasts.get(forecastId);
    if (!forecast) return null;

    forecast.condition = newCondition;
    forecast.source = 'manual-override';

    // Update associated wallpaper
    const fw = Array.from(this.forecastWallpapers.values()).find(w => w.forecastId === forecastId);
    if (fw) {
      const conditionConfig = CONDITION_WALLPAPERS[newCondition] || CONDITION_WALLPAPERS['clear'];
      fw.condition = newCondition;
      fw.wallpaperId = conditionConfig.wallpaperIds[0];
      fw.particleEffects = conditionConfig.particles;
      fw.transitionEffect = conditionConfig.transition;
      fw.isPreloaded = false;
    }

    this.notifyListeners();
    return forecast;
  }

  // Analytics
  getAnalytics(): ForecastAnalytics {
    return { ...this.analytics };
  }

  // Transition Effects
  getTransitionEffect(effectName: string): typeof TRANSITION_EFFECTS[string] | null {
    return TRANSITION_EFFECTS[effectName] || null;
  }

  getAllTransitionEffects(): Record<string, typeof TRANSITION_EFFECTS[string]> {
    return { ...TRANSITION_EFFECTS };
  }

  // Export/Import
  exportConfiguration(): string {
    return JSON.stringify({
      forecasts: Array.from(this.forecasts.values()),
      forecastWallpapers: Array.from(this.forecastWallpapers.values()),
      accuracyHistory: this.accuracyHistory,
      analytics: this.analytics,
      exportedAt: Date.now(),
    }, null, 2);
  }

  importConfiguration(json: string): { success: boolean; imported: { forecasts: number; wallpapers: number } } {
    try {
      const data = JSON.parse(json);
      let forecastsImported = 0;
      let wallpapersImported = 0;

      if (data.forecasts) {
        data.forecasts.forEach((forecast: WeatherForecast) => {
          const newId = `forecast-imported-${Date.now()}-${forecastsImported}`;
          this.forecasts.set(newId, { ...forecast, id: newId });
          forecastsImported++;
        });
      }

      if (data.forecastWallpapers) {
        data.forecastWallpapers.forEach((fw: ForecastWallpaper) => {
          const newId = `fw-imported-${Date.now()}-${wallpapersImported}`;
          this.forecastWallpapers.set(newId, { ...fw, id: newId });
          wallpapersImported++;
        });
      }

      this.notifyListeners();
      return { success: true, imported: { forecasts: forecastsImported, wallpapers: wallpapersImported } };
    } catch {
      return { success: false, imported: { forecasts: 0, wallpapers: 0 } };
    }
  }

  // Listeners
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  // Reset
  reset(): void {
    this.forecasts.clear();
    this.forecastWallpapers.clear();
    this.wallpaperQueue = null;
    this.countdownTimers.clear();
    this.accuracyHistory = [];
    
    if (this.preloadInterval) {
      clearInterval(this.preloadInterval);
      this.preloadInterval = null;
    }
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }

    this.analytics = {
      totalForecasts: 0,
      accurateForecasts: 0,
      accuracyPercentage: 0,
      totalPreloads: 0,
      successfulPreloads: 0,
      avgPreloadTime: 0,
      totalTransitions: 0,
      smoothTransitions: 0,
      conditionAccuracy: {},
    };

    this.initializeDefaults();
    this.notifyListeners();
  }
}

export const weatherForecastWallpapersService = new WeatherForecastWallpapersService();
