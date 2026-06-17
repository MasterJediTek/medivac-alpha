/**
 * Wallpaper Weather Integration Service
 * MediVac WACHS v9.0
 * 
 * Automatically changes wallpapers based on real-time weather conditions,
 * time of day, and location with smooth transitions and ambient effects.
 */

export type WeatherCondition = 
  | 'clear' | 'partly-cloudy' | 'cloudy' | 'overcast'
  | 'rain' | 'heavy-rain' | 'thunderstorm' | 'drizzle'
  | 'snow' | 'heavy-snow' | 'sleet' | 'hail'
  | 'fog' | 'mist' | 'haze' | 'smoke'
  | 'wind' | 'tornado' | 'hurricane'
  | 'hot' | 'cold' | 'freezing';

export type TimeOfDay = 'dawn' | 'morning' | 'noon' | 'afternoon' | 'dusk' | 'evening' | 'night' | 'midnight';
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export interface WeatherData {
  condition: WeatherCondition;
  temperature: number; // Celsius
  feelsLike: number;
  humidity: number; // 0-100
  windSpeed: number; // km/h
  windDirection: number; // degrees
  visibility: number; // km
  uvIndex: number;
  pressure: number; // hPa
  precipitation: number; // mm
  cloudCover: number; // 0-100
  sunrise: number; // timestamp
  sunset: number; // timestamp
  moonPhase: number; // 0-1
  lastUpdated: number;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
  timezone: string;
  isAutoDetected: boolean;
}

export interface WeatherWallpaperMapping {
  id: string;
  condition: WeatherCondition;
  timeOfDay?: TimeOfDay;
  season?: Season;
  temperatureRange?: { min: number; max: number };
  wallpaperIds: string[];
  particleEffects: string[];
  colorOverlay?: string;
  overlayOpacity: number;
  ambientSound?: string;
  transitionDuration: number;
  priority: number;
  isEnabled: boolean;
}

export interface WeatherTransition {
  id: string;
  fromCondition: WeatherCondition;
  toCondition: WeatherCondition;
  transitionType: 'fade' | 'dissolve' | 'wipe' | 'morph' | 'particle-transform';
  duration: number;
  particleEffect?: string;
  soundEffect?: string;
}

export interface WeatherScheduleEntry {
  id: string;
  timeOfDay: TimeOfDay;
  wallpaperId: string;
  overrideWeather: boolean;
  isEnabled: boolean;
}

export interface WeatherAnalytics {
  totalWeatherChanges: number;
  totalWallpaperChanges: number;
  mostCommonCondition: WeatherCondition;
  avgTemperature: number;
  conditionCounts: Record<WeatherCondition, number>;
  timeOfDayCounts: Record<TimeOfDay, number>;
  lastWeatherUpdate: number;
}

export interface WeatherEffectConfig {
  condition: WeatherCondition;
  particles: {
    type: string;
    count: number;
    speed: number;
    opacity: number;
    size: number;
  };
  screenEffect?: {
    type: 'blur' | 'tint' | 'vignette' | 'noise';
    intensity: number;
    color?: string;
  };
  ambientSound: string;
  colorTemperature: number; // Kelvin, affects overall tint
}

// Weather Particle Effects
const WEATHER_PARTICLES: Record<WeatherCondition, WeatherEffectConfig['particles']> = {
  'clear': { type: 'none', count: 0, speed: 0, opacity: 0, size: 0 },
  'partly-cloudy': { type: 'clouds', count: 5, speed: 20, opacity: 0.3, size: 100 },
  'cloudy': { type: 'clouds', count: 10, speed: 15, opacity: 0.5, size: 120 },
  'overcast': { type: 'clouds', count: 15, speed: 10, opacity: 0.7, size: 150 },
  'rain': { type: 'rain', count: 200, speed: 400, opacity: 0.6, size: 3 },
  'heavy-rain': { type: 'rain', count: 400, speed: 600, opacity: 0.8, size: 4 },
  'thunderstorm': { type: 'rain', count: 350, speed: 500, opacity: 0.7, size: 4 },
  'drizzle': { type: 'rain', count: 100, speed: 200, opacity: 0.4, size: 2 },
  'snow': { type: 'snow', count: 150, speed: 50, opacity: 0.8, size: 5 },
  'heavy-snow': { type: 'snow', count: 300, speed: 80, opacity: 0.9, size: 7 },
  'sleet': { type: 'sleet', count: 200, speed: 300, opacity: 0.6, size: 4 },
  'hail': { type: 'hail', count: 100, speed: 500, opacity: 0.8, size: 8 },
  'fog': { type: 'fog', count: 20, speed: 5, opacity: 0.6, size: 200 },
  'mist': { type: 'mist', count: 15, speed: 3, opacity: 0.4, size: 150 },
  'haze': { type: 'haze', count: 10, speed: 2, opacity: 0.3, size: 180 },
  'smoke': { type: 'smoke', count: 25, speed: 8, opacity: 0.5, size: 100 },
  'wind': { type: 'leaves', count: 50, speed: 300, opacity: 0.7, size: 15 },
  'tornado': { type: 'debris', count: 100, speed: 500, opacity: 0.8, size: 20 },
  'hurricane': { type: 'debris', count: 150, speed: 600, opacity: 0.9, size: 25 },
  'hot': { type: 'heat-shimmer', count: 30, speed: 10, opacity: 0.3, size: 50 },
  'cold': { type: 'frost', count: 20, speed: 5, opacity: 0.4, size: 30 },
  'freezing': { type: 'ice-crystals', count: 80, speed: 30, opacity: 0.6, size: 10 },
};

// Weather Ambient Sounds
const WEATHER_SOUNDS: Record<WeatherCondition, string> = {
  'clear': 'birds-chirping',
  'partly-cloudy': 'light-breeze',
  'cloudy': 'wind-soft',
  'overcast': 'wind-medium',
  'rain': 'rain-medium',
  'heavy-rain': 'rain-heavy',
  'thunderstorm': 'thunder-storm',
  'drizzle': 'rain-light',
  'snow': 'snow-falling',
  'heavy-snow': 'blizzard',
  'sleet': 'sleet-falling',
  'hail': 'hail-storm',
  'fog': 'fog-ambience',
  'mist': 'mist-ambience',
  'haze': 'city-distant',
  'smoke': 'fire-crackling',
  'wind': 'wind-strong',
  'tornado': 'tornado-roar',
  'hurricane': 'hurricane-winds',
  'hot': 'cicadas',
  'cold': 'wind-cold',
  'freezing': 'ice-cracking',
};

// Default Weather Wallpaper Mappings
const DEFAULT_MAPPINGS: Omit<WeatherWallpaperMapping, 'id'>[] = [
  // Clear weather
  { condition: 'clear', timeOfDay: 'dawn', wallpaperIds: ['sunrise-mountains', 'dawn-sky'], particleEffects: ['sun-rays'], overlayOpacity: 0, ambientSound: 'birds-chirping', transitionDuration: 2000, priority: 5, isEnabled: true },
  { condition: 'clear', timeOfDay: 'morning', wallpaperIds: ['sunny-meadow', 'blue-sky'], particleEffects: ['butterflies'], overlayOpacity: 0, ambientSound: 'birds-chirping', transitionDuration: 1500, priority: 5, isEnabled: true },
  { condition: 'clear', timeOfDay: 'noon', wallpaperIds: ['bright-day', 'sunny-beach'], particleEffects: ['sun-flare'], overlayOpacity: 0, ambientSound: 'cicadas', transitionDuration: 1500, priority: 5, isEnabled: true },
  { condition: 'clear', timeOfDay: 'afternoon', wallpaperIds: ['golden-hour', 'afternoon-park'], particleEffects: ['dust-motes'], overlayOpacity: 0, ambientSound: 'light-breeze', transitionDuration: 1500, priority: 5, isEnabled: true },
  { condition: 'clear', timeOfDay: 'dusk', wallpaperIds: ['sunset-ocean', 'dusk-city'], particleEffects: ['sun-rays'], colorOverlay: '#ff6b35', overlayOpacity: 0.1, ambientSound: 'evening-crickets', transitionDuration: 2000, priority: 5, isEnabled: true },
  { condition: 'clear', timeOfDay: 'evening', wallpaperIds: ['twilight-sky', 'evening-stars'], particleEffects: ['fireflies'], colorOverlay: '#1a237e', overlayOpacity: 0.15, ambientSound: 'night-crickets', transitionDuration: 2000, priority: 5, isEnabled: true },
  { condition: 'clear', timeOfDay: 'night', wallpaperIds: ['starry-night', 'moonlit-landscape'], particleEffects: ['stars-twinkle'], colorOverlay: '#0d1b2a', overlayOpacity: 0.2, ambientSound: 'night-ambience', transitionDuration: 2500, priority: 5, isEnabled: true },
  { condition: 'clear', timeOfDay: 'midnight', wallpaperIds: ['deep-night', 'galaxy-view'], particleEffects: ['shooting-stars'], colorOverlay: '#000814', overlayOpacity: 0.25, ambientSound: 'deep-night', transitionDuration: 3000, priority: 5, isEnabled: true },

  // Rain
  { condition: 'rain', wallpaperIds: ['rainy-window', 'rain-city', 'rain-forest'], particleEffects: ['rain'], colorOverlay: '#37474f', overlayOpacity: 0.2, ambientSound: 'rain-medium', transitionDuration: 1500, priority: 8, isEnabled: true },
  { condition: 'heavy-rain', wallpaperIds: ['storm-clouds', 'heavy-rain-street'], particleEffects: ['heavy-rain', 'splashes'], colorOverlay: '#263238', overlayOpacity: 0.3, ambientSound: 'rain-heavy', transitionDuration: 1000, priority: 9, isEnabled: true },
  { condition: 'thunderstorm', wallpaperIds: ['lightning-storm', 'thunder-clouds'], particleEffects: ['rain', 'lightning'], colorOverlay: '#1a237e', overlayOpacity: 0.25, ambientSound: 'thunder-storm', transitionDuration: 800, priority: 10, isEnabled: true },
  { condition: 'drizzle', wallpaperIds: ['misty-morning', 'light-rain'], particleEffects: ['drizzle'], colorOverlay: '#546e7a', overlayOpacity: 0.1, ambientSound: 'rain-light', transitionDuration: 2000, priority: 7, isEnabled: true },

  // Snow
  { condition: 'snow', wallpaperIds: ['winter-wonderland', 'snowy-forest', 'snow-village'], particleEffects: ['snow'], colorOverlay: '#eceff1', overlayOpacity: 0.1, ambientSound: 'snow-falling', transitionDuration: 2000, priority: 8, isEnabled: true },
  { condition: 'heavy-snow', wallpaperIds: ['blizzard', 'heavy-snow-landscape'], particleEffects: ['heavy-snow', 'wind-snow'], colorOverlay: '#cfd8dc', overlayOpacity: 0.2, ambientSound: 'blizzard', transitionDuration: 1500, priority: 9, isEnabled: true },

  // Fog and Mist
  { condition: 'fog', wallpaperIds: ['foggy-forest', 'fog-city', 'mysterious-fog'], particleEffects: ['fog'], colorOverlay: '#90a4ae', overlayOpacity: 0.3, ambientSound: 'fog-ambience', transitionDuration: 3000, priority: 7, isEnabled: true },
  { condition: 'mist', wallpaperIds: ['misty-lake', 'morning-mist'], particleEffects: ['mist'], colorOverlay: '#b0bec5', overlayOpacity: 0.2, ambientSound: 'mist-ambience', transitionDuration: 2500, priority: 6, isEnabled: true },

  // Cloudy
  { condition: 'cloudy', wallpaperIds: ['cloudy-sky', 'overcast-city'], particleEffects: ['clouds'], colorOverlay: '#78909c', overlayOpacity: 0.1, ambientSound: 'wind-soft', transitionDuration: 2000, priority: 4, isEnabled: true },
  { condition: 'overcast', wallpaperIds: ['gray-sky', 'moody-landscape'], particleEffects: ['heavy-clouds'], colorOverlay: '#607d8b', overlayOpacity: 0.15, ambientSound: 'wind-medium', transitionDuration: 2000, priority: 5, isEnabled: true },

  // Temperature extremes
  { condition: 'hot', temperatureRange: { min: 35, max: 50 }, wallpaperIds: ['desert-heat', 'summer-sun'], particleEffects: ['heat-shimmer'], colorOverlay: '#ff8f00', overlayOpacity: 0.1, ambientSound: 'cicadas', transitionDuration: 2000, priority: 6, isEnabled: true },
  { condition: 'cold', temperatureRange: { min: -10, max: 5 }, wallpaperIds: ['frozen-landscape', 'winter-cold'], particleEffects: ['frost'], colorOverlay: '#b3e5fc', overlayOpacity: 0.1, ambientSound: 'wind-cold', transitionDuration: 2000, priority: 6, isEnabled: true },
  { condition: 'freezing', temperatureRange: { min: -40, max: -10 }, wallpaperIds: ['arctic-freeze', 'ice-world'], particleEffects: ['ice-crystals', 'frost'], colorOverlay: '#81d4fa', overlayOpacity: 0.15, ambientSound: 'ice-cracking', transitionDuration: 2000, priority: 7, isEnabled: true },

  // JEDI Weather (special)
  { condition: 'clear', timeOfDay: 'night', season: 'winter', wallpaperIds: ['tatooine-twin-moons', 'jedi-temple-night'], particleEffects: ['force-particles'], colorOverlay: '#00bcd4', overlayOpacity: 0.05, ambientSound: 'jedi-meditation', transitionDuration: 3000, priority: 3, isEnabled: true },
];

// Time of Day Ranges (hours)
const TIME_RANGES: Record<TimeOfDay, { start: number; end: number }> = {
  'dawn': { start: 5, end: 7 },
  'morning': { start: 7, end: 11 },
  'noon': { start: 11, end: 13 },
  'afternoon': { start: 13, end: 17 },
  'dusk': { start: 17, end: 19 },
  'evening': { start: 19, end: 21 },
  'night': { start: 21, end: 24 },
  'midnight': { start: 0, end: 5 },
};

class WallpaperWeatherIntegrationService {
  private mappings: Map<string, WeatherWallpaperMapping> = new Map();
  private transitions: Map<string, WeatherTransition> = new Map();
  private scheduleEntries: Map<string, WeatherScheduleEntry> = new Map();
  private currentWeather: WeatherData | null = null;
  private currentLocation: LocationData | null = null;
  private activeWallpaperId: string | null = null;
  private activeParticleEffects: string[] = [];
  private isAutoSyncEnabled: boolean = true;
  private syncIntervalMs: number = 900000; // 15 minutes
  private syncTimer: ReturnType<typeof setInterval> | null = null;
  private analytics: WeatherAnalytics;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.analytics = {
      totalWeatherChanges: 0,
      totalWallpaperChanges: 0,
      mostCommonCondition: 'clear',
      avgTemperature: 20,
      conditionCounts: {} as Record<WeatherCondition, number>,
      timeOfDayCounts: {} as Record<TimeOfDay, number>,
      lastWeatherUpdate: 0,
    };
    this.initializeDefaults();
  }

  private initializeDefaults(): void {
    // Initialize default mappings
    DEFAULT_MAPPINGS.forEach((mapping, index) => {
      const id = `mapping-${index + 1}`;
      this.mappings.set(id, { ...mapping, id });
    });

    // Initialize default transitions
    const transitionPairs: [WeatherCondition, WeatherCondition, WeatherTransition['transitionType']][] = [
      ['clear', 'cloudy', 'fade'],
      ['cloudy', 'rain', 'dissolve'],
      ['rain', 'thunderstorm', 'particle-transform'],
      ['clear', 'snow', 'morph'],
      ['snow', 'heavy-snow', 'fade'],
      ['fog', 'clear', 'dissolve'],
    ];

    transitionPairs.forEach(([from, to, type], index) => {
      const id = `transition-${index + 1}`;
      this.transitions.set(id, {
        id,
        fromCondition: from,
        toCondition: to,
        transitionType: type,
        duration: 2000,
        particleEffect: type === 'particle-transform' ? 'morph-particles' : undefined,
      });
    });

    // Initialize mock weather data
    this.currentWeather = {
      condition: 'clear',
      temperature: 22,
      feelsLike: 23,
      humidity: 45,
      windSpeed: 12,
      windDirection: 180,
      visibility: 10,
      uvIndex: 5,
      pressure: 1013,
      precipitation: 0,
      cloudCover: 10,
      sunrise: Date.now() - 3600000 * 6,
      sunset: Date.now() + 3600000 * 6,
      moonPhase: 0.5,
      lastUpdated: Date.now(),
    };

    this.currentLocation = {
      latitude: -31.9505,
      longitude: 115.8605,
      city: 'Perth',
      country: 'Australia',
      timezone: 'Australia/Perth',
      isAutoDetected: true,
    };
  }

  // Weather Data Management
  getCurrentWeather(): WeatherData | null {
    return this.currentWeather;
  }

  updateWeather(weather: Partial<WeatherData>): void {
    if (!this.currentWeather) {
      this.currentWeather = {
        condition: 'clear',
        temperature: 20,
        feelsLike: 20,
        humidity: 50,
        windSpeed: 0,
        windDirection: 0,
        visibility: 10,
        uvIndex: 0,
        pressure: 1013,
        precipitation: 0,
        cloudCover: 0,
        sunrise: Date.now(),
        sunset: Date.now(),
        moonPhase: 0,
        lastUpdated: Date.now(),
      };
    }

    const previousCondition = this.currentWeather.condition;
    this.currentWeather = { ...this.currentWeather, ...weather, lastUpdated: Date.now() };

    // Update analytics
    this.analytics.totalWeatherChanges++;
    this.analytics.lastWeatherUpdate = Date.now();
    this.updateConditionCount(this.currentWeather.condition);
    this.updateAvgTemperature(this.currentWeather.temperature);

    // Trigger wallpaper change if condition changed
    if (previousCondition !== this.currentWeather.condition) {
      this.applyWeatherWallpaper();
    }

    this.notifyListeners();
  }

  simulateWeatherChange(condition: WeatherCondition): void {
    this.updateWeather({ condition });
  }

  // Location Management
  getCurrentLocation(): LocationData | null {
    return this.currentLocation;
  }

  setLocation(location: Partial<LocationData>): void {
    this.currentLocation = { ...this.currentLocation!, ...location };
    this.notifyListeners();
  }

  // Time of Day
  getCurrentTimeOfDay(): TimeOfDay {
    const hour = new Date().getHours();
    
    for (const [timeOfDay, range] of Object.entries(TIME_RANGES)) {
      if (range.start <= range.end) {
        if (hour >= range.start && hour < range.end) {
          return timeOfDay as TimeOfDay;
        }
      } else {
        // Handle overnight ranges (e.g., night: 21-24 and midnight: 0-5)
        if (hour >= range.start || hour < range.end) {
          return timeOfDay as TimeOfDay;
        }
      }
    }
    
    return 'day' as TimeOfDay;
  }

  getCurrentSeason(): Season {
    const month = new Date().getMonth();
    // Southern hemisphere (Australia)
    if (this.currentLocation?.latitude && this.currentLocation.latitude < 0) {
      if (month >= 2 && month <= 4) return 'autumn';
      if (month >= 5 && month <= 7) return 'winter';
      if (month >= 8 && month <= 10) return 'spring';
      return 'summer';
    }
    // Northern hemisphere
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }

  // Wallpaper Application
  applyWeatherWallpaper(): string | null {
    if (!this.currentWeather) return null;

    const timeOfDay = this.getCurrentTimeOfDay();
    const season = this.getCurrentSeason();
    const mapping = this.findBestMapping(this.currentWeather.condition, timeOfDay, season);

    if (!mapping) return null;

    // Select random wallpaper from mapping
    const wallpaperId = mapping.wallpaperIds[Math.floor(Math.random() * mapping.wallpaperIds.length)];
    
    this.activeWallpaperId = wallpaperId;
    this.activeParticleEffects = mapping.particleEffects;
    this.analytics.totalWallpaperChanges++;
    this.updateTimeOfDayCount(timeOfDay);

    this.notifyListeners();
    return wallpaperId;
  }

  private findBestMapping(condition: WeatherCondition, timeOfDay: TimeOfDay, season: Season): WeatherWallpaperMapping | null {
    let bestMapping: WeatherWallpaperMapping | null = null;
    let highestPriority = -1;

    for (const mapping of this.mappings.values()) {
      if (!mapping.isEnabled) continue;
      if (mapping.condition !== condition) continue;

      let score = mapping.priority;

      // Bonus for matching time of day
      if (mapping.timeOfDay === timeOfDay) {
        score += 3;
      } else if (mapping.timeOfDay) {
        continue; // Skip if time of day specified but doesn't match
      }

      // Bonus for matching season
      if (mapping.season === season) {
        score += 2;
      } else if (mapping.season) {
        continue; // Skip if season specified but doesn't match
      }

      // Check temperature range
      if (mapping.temperatureRange && this.currentWeather) {
        const temp = this.currentWeather.temperature;
        if (temp < mapping.temperatureRange.min || temp > mapping.temperatureRange.max) {
          continue;
        }
        score += 1;
      }

      if (score > highestPriority) {
        highestPriority = score;
        bestMapping = mapping;
      }
    }

    return bestMapping;
  }

  // Mapping Management
  getAllMappings(): WeatherWallpaperMapping[] {
    return Array.from(this.mappings.values());
  }

  getMapping(id: string): WeatherWallpaperMapping | undefined {
    return this.mappings.get(id);
  }

  getMappingsForCondition(condition: WeatherCondition): WeatherWallpaperMapping[] {
    return Array.from(this.mappings.values()).filter(m => m.condition === condition);
  }

  createMapping(data: Omit<WeatherWallpaperMapping, 'id'>): WeatherWallpaperMapping {
    const id = `mapping-${Date.now()}`;
    const mapping: WeatherWallpaperMapping = { ...data, id };
    this.mappings.set(id, mapping);
    this.notifyListeners();
    return mapping;
  }

  updateMapping(id: string, updates: Partial<WeatherWallpaperMapping>): WeatherWallpaperMapping | null {
    const mapping = this.mappings.get(id);
    if (!mapping) return null;

    const updated = { ...mapping, ...updates };
    this.mappings.set(id, updated);
    this.notifyListeners();
    return updated;
  }

  deleteMapping(id: string): boolean {
    const result = this.mappings.delete(id);
    if (result) this.notifyListeners();
    return result;
  }

  toggleMapping(id: string): boolean {
    const mapping = this.mappings.get(id);
    if (!mapping) return false;

    mapping.isEnabled = !mapping.isEnabled;
    this.notifyListeners();
    return mapping.isEnabled;
  }

  // Weather Effects
  getWeatherParticles(condition: WeatherCondition): WeatherEffectConfig['particles'] {
    return WEATHER_PARTICLES[condition] || WEATHER_PARTICLES['clear'];
  }

  getWeatherSound(condition: WeatherCondition): string {
    return WEATHER_SOUNDS[condition] || WEATHER_SOUNDS['clear'];
  }

  getActiveParticleEffects(): string[] {
    return [...this.activeParticleEffects];
  }

  // Auto Sync
  startAutoSync(): void {
    if (this.syncTimer) return;

    this.isAutoSyncEnabled = true;
    this.syncTimer = setInterval(() => {
      this.refreshWeather();
    }, this.syncIntervalMs);

    this.notifyListeners();
  }

  stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    this.isAutoSyncEnabled = false;
    this.notifyListeners();
  }

  isAutoSyncActive(): boolean {
    return this.isAutoSyncEnabled;
  }

  setSyncInterval(intervalMs: number): void {
    this.syncIntervalMs = Math.max(60000, intervalMs); // Minimum 1 minute
    if (this.isAutoSyncEnabled) {
      this.stopAutoSync();
      this.startAutoSync();
    }
  }

  refreshWeather(): void {
    // In real implementation, this would fetch from weather API
    // For now, simulate minor variations
    if (this.currentWeather) {
      const tempVariation = (Math.random() - 0.5) * 2;
      this.updateWeather({
        temperature: this.currentWeather.temperature + tempVariation,
        humidity: Math.max(0, Math.min(100, this.currentWeather.humidity + (Math.random() - 0.5) * 5)),
        lastUpdated: Date.now(),
      });
    }
  }

  // Schedule Management
  getAllScheduleEntries(): WeatherScheduleEntry[] {
    return Array.from(this.scheduleEntries.values());
  }

  createScheduleEntry(data: Omit<WeatherScheduleEntry, 'id'>): WeatherScheduleEntry {
    const id = `schedule-${Date.now()}`;
    const entry: WeatherScheduleEntry = { ...data, id };
    this.scheduleEntries.set(id, entry);
    this.notifyListeners();
    return entry;
  }

  deleteScheduleEntry(id: string): boolean {
    const result = this.scheduleEntries.delete(id);
    if (result) this.notifyListeners();
    return result;
  }

  // Analytics
  private updateConditionCount(condition: WeatherCondition): void {
    this.analytics.conditionCounts[condition] = (this.analytics.conditionCounts[condition] || 0) + 1;
    
    // Update most common condition
    let maxCount = 0;
    for (const [cond, count] of Object.entries(this.analytics.conditionCounts)) {
      if (count > maxCount) {
        maxCount = count;
        this.analytics.mostCommonCondition = cond as WeatherCondition;
      }
    }
  }

  private updateTimeOfDayCount(timeOfDay: TimeOfDay): void {
    this.analytics.timeOfDayCounts[timeOfDay] = (this.analytics.timeOfDayCounts[timeOfDay] || 0) + 1;
  }

  private updateAvgTemperature(temperature: number): void {
    const total = this.analytics.totalWeatherChanges;
    this.analytics.avgTemperature = (this.analytics.avgTemperature * (total - 1) + temperature) / total;
  }

  getAnalytics(): WeatherAnalytics {
    return { ...this.analytics };
  }

  // State
  getActiveWallpaperId(): string | null {
    return this.activeWallpaperId;
  }

  // Export/Import
  exportConfiguration(): string {
    return JSON.stringify({
      mappings: Array.from(this.mappings.values()),
      scheduleEntries: Array.from(this.scheduleEntries.values()),
      syncIntervalMs: this.syncIntervalMs,
      isAutoSyncEnabled: this.isAutoSyncEnabled,
      exportedAt: Date.now(),
    }, null, 2);
  }

  importConfiguration(json: string): { success: boolean; imported: { mappings: number; schedules: number } } {
    try {
      const data = JSON.parse(json);
      let mappingsImported = 0;
      let schedulesImported = 0;

      if (data.mappings) {
        data.mappings.forEach((mapping: WeatherWallpaperMapping) => {
          const newId = `mapping-imported-${Date.now()}-${mappingsImported}`;
          this.mappings.set(newId, { ...mapping, id: newId });
          mappingsImported++;
        });
      }

      if (data.scheduleEntries) {
        data.scheduleEntries.forEach((entry: WeatherScheduleEntry) => {
          const newId = `schedule-imported-${Date.now()}-${schedulesImported}`;
          this.scheduleEntries.set(newId, { ...entry, id: newId });
          schedulesImported++;
        });
      }

      if (data.syncIntervalMs) {
        this.syncIntervalMs = data.syncIntervalMs;
      }

      this.notifyListeners();
      return { success: true, imported: { mappings: mappingsImported, schedules: schedulesImported } };
    } catch {
      return { success: false, imported: { mappings: 0, schedules: 0 } };
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
    this.mappings.clear();
    this.transitions.clear();
    this.scheduleEntries.clear();
    this.currentWeather = null;
    this.currentLocation = null;
    this.activeWallpaperId = null;
    this.activeParticleEffects = [];
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    this.isAutoSyncEnabled = true;
    this.analytics = {
      totalWeatherChanges: 0,
      totalWallpaperChanges: 0,
      mostCommonCondition: 'clear',
      avgTemperature: 20,
      conditionCounts: {} as Record<WeatherCondition, number>,
      timeOfDayCounts: {} as Record<TimeOfDay, number>,
      lastWeatherUpdate: 0,
    };
    this.initializeDefaults();
    this.notifyListeners();
  }
}

export const wallpaperWeatherIntegrationService = new WallpaperWeatherIntegrationService();
