/**
 * A/B Test Auto-Rotation Service
 * MediVac WACHS v8.3
 * 
 * Automatically cycles screenshot variants in store listings based on
 * performance metrics, time-of-day optimization, and geographic rules.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

// Types
export type RotationStrategy = "performance" | "time_based" | "geographic" | "seasonal" | "random" | "weighted";
export type DayPeriod = "morning" | "afternoon" | "evening" | "night";
export type Season = "spring" | "summer" | "autumn" | "winter";

export interface RotationVariant {
  id: string;
  name: string;
  screenshotUrl: string;
  weight: number; // 0-100, used for weighted rotation
  performanceScore: number; // calculated from metrics
  impressions: number;
  installs: number;
  conversionRate: number;
  isActive: boolean;
  lastActiveAt: Date | null;
  totalActiveTime: number; // milliseconds
}

export interface RotationSchedule {
  id: string;
  name: string;
  testId: string;
  strategy: RotationStrategy;
  isEnabled: boolean;
  startDate: Date;
  endDate: Date | null;
  rotationInterval: number; // milliseconds
  minimumImpressions: number;
  autoPromoteWinner: boolean;
  winnerThreshold: number; // statistical significance threshold
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeBasedRule {
  id: string;
  scheduleId: string;
  dayPeriod: DayPeriod;
  variantId: string;
  priority: number;
  isEnabled: boolean;
}

export interface GeographicRule {
  id: string;
  scheduleId: string;
  region: string; // ISO country code or region
  variantId: string;
  priority: number;
  isEnabled: boolean;
}

export interface SeasonalRule {
  id: string;
  scheduleId: string;
  season: Season;
  variantId: string;
  priority: number;
  isEnabled: boolean;
}

export interface RotationEvent {
  id: string;
  scheduleId: string;
  fromVariantId: string | null;
  toVariantId: string;
  reason: string;
  strategy: RotationStrategy;
  timestamp: Date;
  metrics: {
    impressionsBefore: number;
    installsBefore: number;
    conversionRateBefore: number;
  };
}

export interface RotationAnalytics {
  scheduleId: string;
  totalRotations: number;
  averageRotationInterval: number;
  bestPerformingVariant: string;
  worstPerformingVariant: string;
  overallConversionRate: number;
  conversionRateImprovement: number; // percentage improvement since start
  winnerDetermined: boolean;
  winnerId: string | null;
}

// A/B Test Auto-Rotation Service
class ABTestRotationService {
  private schedules: Map<string, RotationSchedule> = new Map();
  private variants: Map<string, Map<string, RotationVariant>> = new Map(); // scheduleId -> variantId -> variant
  private timeBasedRules: Map<string, TimeBasedRule[]> = new Map();
  private geographicRules: Map<string, GeographicRule[]> = new Map();
  private seasonalRules: Map<string, SeasonalRule[]> = new Map();
  private rotationHistory: Map<string, RotationEvent[]> = new Map();
  private activeTimers: Map<string, ReturnType<typeof setInterval>> = new Map();
  private listeners: Set<(event: RotationEvent) => void> = new Set();

  constructor() {
    this.initializeSampleData();
  }

  private initializeSampleData(): void {
    // Create sample schedule
    const sampleSchedule: RotationSchedule = {
      id: "schedule_1",
      name: "Google Play Screenshot Rotation",
      testId: "test_google_play_1",
      strategy: "performance",
      isEnabled: true,
      startDate: new Date(),
      endDate: null,
      rotationInterval: 24 * 60 * 60 * 1000, // 24 hours
      minimumImpressions: 1000,
      autoPromoteWinner: true,
      winnerThreshold: 0.95,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.schedules.set(sampleSchedule.id, sampleSchedule);

    // Create sample variants
    const sampleVariants: RotationVariant[] = [
      {
        id: "variant_a",
        name: "Control - Original",
        screenshotUrl: "https://example.com/screenshot_a.png",
        weight: 50,
        performanceScore: 75,
        impressions: 5000,
        installs: 250,
        conversionRate: 5.0,
        isActive: true,
        lastActiveAt: new Date(),
        totalActiveTime: 86400000,
      },
      {
        id: "variant_b",
        name: "Variant B - Blue Theme",
        screenshotUrl: "https://example.com/screenshot_b.png",
        weight: 25,
        performanceScore: 82,
        impressions: 3000,
        installs: 180,
        conversionRate: 6.0,
        isActive: false,
        lastActiveAt: new Date(Date.now() - 86400000),
        totalActiveTime: 43200000,
      },
      {
        id: "variant_c",
        name: "Variant C - Feature Focus",
        screenshotUrl: "https://example.com/screenshot_c.png",
        weight: 25,
        performanceScore: 68,
        impressions: 2000,
        installs: 100,
        conversionRate: 5.0,
        isActive: false,
        lastActiveAt: new Date(Date.now() - 172800000),
        totalActiveTime: 21600000,
      },
    ];

    const variantMap = new Map<string, RotationVariant>();
    sampleVariants.forEach((v) => variantMap.set(v.id, v));
    this.variants.set(sampleSchedule.id, variantMap);

    this.rotationHistory.set(sampleSchedule.id, []);
  }

  // Get all schedules
  getAllSchedules(): RotationSchedule[] {
    return Array.from(this.schedules.values());
  }

  // Get schedule by ID
  getSchedule(scheduleId: string): RotationSchedule | null {
    return this.schedules.get(scheduleId) || null;
  }

  // Create new rotation schedule
  createSchedule(
    data: Omit<RotationSchedule, "id" | "createdAt" | "updatedAt">
  ): RotationSchedule {
    const schedule: RotationSchedule = {
      ...data,
      id: `schedule_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.schedules.set(schedule.id, schedule);
    this.variants.set(schedule.id, new Map());
    this.rotationHistory.set(schedule.id, []);

    if (schedule.isEnabled) {
      this.startRotation(schedule.id);
    }

    return schedule;
  }

  // Update schedule
  updateSchedule(
    scheduleId: string,
    updates: Partial<RotationSchedule>
  ): RotationSchedule | null {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) return null;

    const updated = { ...schedule, ...updates, updatedAt: new Date() };
    this.schedules.set(scheduleId, updated);

    // Handle enable/disable
    if (updates.isEnabled !== undefined) {
      if (updates.isEnabled) {
        this.startRotation(scheduleId);
      } else {
        this.stopRotation(scheduleId);
      }
    }

    return updated;
  }

  // Delete schedule
  deleteSchedule(scheduleId: string): boolean {
    this.stopRotation(scheduleId);
    this.schedules.delete(scheduleId);
    this.variants.delete(scheduleId);
    this.rotationHistory.delete(scheduleId);
    return true;
  }

  // Get variants for a schedule
  getVariants(scheduleId: string): RotationVariant[] {
    const variantMap = this.variants.get(scheduleId);
    return variantMap ? Array.from(variantMap.values()) : [];
  }

  // Add variant to schedule
  addVariant(
    scheduleId: string,
    data: Omit<RotationVariant, "id" | "performanceScore" | "impressions" | "installs" | "conversionRate" | "lastActiveAt" | "totalActiveTime">
  ): RotationVariant | null {
    const variantMap = this.variants.get(scheduleId);
    if (!variantMap) return null;

    const variant: RotationVariant = {
      ...data,
      id: `variant_${Date.now()}`,
      performanceScore: 0,
      impressions: 0,
      installs: 0,
      conversionRate: 0,
      lastActiveAt: null,
      totalActiveTime: 0,
    };

    variantMap.set(variant.id, variant);
    return variant;
  }

  // Update variant metrics
  updateVariantMetrics(
    scheduleId: string,
    variantId: string,
    metrics: { impressions: number; installs: number }
  ): RotationVariant | null {
    const variantMap = this.variants.get(scheduleId);
    if (!variantMap) return null;

    const variant = variantMap.get(variantId);
    if (!variant) return null;

    variant.impressions += metrics.impressions;
    variant.installs += metrics.installs;
    variant.conversionRate =
      variant.impressions > 0
        ? (variant.installs / variant.impressions) * 100
        : 0;
    variant.performanceScore = this.calculatePerformanceScore(variant);

    variantMap.set(variantId, variant);
    return variant;
  }

  // Calculate performance score
  private calculatePerformanceScore(variant: RotationVariant): number {
    // Weighted score based on conversion rate and sample size
    const conversionWeight = 0.7;
    const sampleSizeWeight = 0.3;

    const normalizedConversion = Math.min(variant.conversionRate / 10, 1) * 100;
    const normalizedSampleSize = Math.min(variant.impressions / 10000, 1) * 100;

    return Math.round(
      normalizedConversion * conversionWeight +
        normalizedSampleSize * sampleSizeWeight
    );
  }

  // Start automatic rotation
  startRotation(scheduleId: string): void {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule || !schedule.isEnabled) return;

    // Clear existing timer
    this.stopRotation(scheduleId);

    // Set up rotation timer
    const timer = setInterval(() => {
      this.performRotation(scheduleId);
    }, schedule.rotationInterval);

    this.activeTimers.set(scheduleId, timer);

    // Perform initial rotation
    this.performRotation(scheduleId);
  }

  // Stop automatic rotation
  stopRotation(scheduleId: string): void {
    const timer = this.activeTimers.get(scheduleId);
    if (timer) {
      clearInterval(timer);
      this.activeTimers.delete(scheduleId);
    }
  }

  // Perform rotation based on strategy
  performRotation(scheduleId: string): RotationEvent | null {
    const schedule = this.schedules.get(scheduleId);
    const variantMap = this.variants.get(scheduleId);
    if (!schedule || !variantMap) return null;

    const variants = Array.from(variantMap.values());
    if (variants.length === 0) return null;

    const currentActive = variants.find((v) => v.isActive);
    let nextVariant: RotationVariant | null = null;
    let reason = "";

    switch (schedule.strategy) {
      case "performance":
        nextVariant = this.selectByPerformance(variants, schedule);
        reason = "Selected based on performance score";
        break;
      case "time_based":
        nextVariant = this.selectByTimeOfDay(scheduleId, variants);
        reason = `Selected for ${this.getCurrentDayPeriod()} period`;
        break;
      case "geographic":
        nextVariant = this.selectByGeography(scheduleId, variants);
        reason = "Selected based on geographic rules";
        break;
      case "seasonal":
        nextVariant = this.selectBySeason(scheduleId, variants);
        reason = `Selected for ${this.getCurrentSeason()} season`;
        break;
      case "weighted":
        nextVariant = this.selectByWeight(variants);
        reason = "Selected by weighted random";
        break;
      case "random":
      default:
        nextVariant = variants[Math.floor(Math.random() * variants.length)];
        reason = "Random selection";
        break;
    }

    if (!nextVariant || (currentActive && nextVariant.id === currentActive.id)) {
      return null;
    }

    // Deactivate current
    if (currentActive) {
      currentActive.isActive = false;
      currentActive.totalActiveTime +=
        Date.now() - (currentActive.lastActiveAt?.getTime() || Date.now());
      variantMap.set(currentActive.id, currentActive);
    }

    // Activate next
    nextVariant.isActive = true;
    nextVariant.lastActiveAt = new Date();
    variantMap.set(nextVariant.id, nextVariant);

    // Record event
    const event: RotationEvent = {
      id: `event_${Date.now()}`,
      scheduleId,
      fromVariantId: currentActive?.id || null,
      toVariantId: nextVariant.id,
      reason,
      strategy: schedule.strategy,
      timestamp: new Date(),
      metrics: {
        impressionsBefore: currentActive?.impressions || 0,
        installsBefore: currentActive?.installs || 0,
        conversionRateBefore: currentActive?.conversionRate || 0,
      },
    };

    const history = this.rotationHistory.get(scheduleId) || [];
    history.push(event);
    this.rotationHistory.set(scheduleId, history);

    // Notify listeners
    this.notifyListeners(event);

    // Check for winner
    if (schedule.autoPromoteWinner) {
      this.checkForWinner(scheduleId);
    }

    return event;
  }

  // Selection strategies
  private selectByPerformance(
    variants: RotationVariant[],
    schedule: RotationSchedule
  ): RotationVariant {
    // Filter variants with minimum impressions
    const eligible = variants.filter(
      (v) => v.impressions >= schedule.minimumImpressions || v.impressions === 0
    );

    if (eligible.length === 0) {
      // If none eligible, pick one with fewest impressions to gather data
      return variants.reduce((a, b) =>
        a.impressions < b.impressions ? a : b
      );
    }

    // Sort by performance score descending
    eligible.sort((a, b) => b.performanceScore - a.performanceScore);

    // Use epsilon-greedy: 80% best performer, 20% explore
    if (Math.random() < 0.8) {
      return eligible[0];
    } else {
      return eligible[Math.floor(Math.random() * eligible.length)];
    }
  }

  private selectByTimeOfDay(
    scheduleId: string,
    variants: RotationVariant[]
  ): RotationVariant {
    const rules = this.timeBasedRules.get(scheduleId) || [];
    const currentPeriod = this.getCurrentDayPeriod();

    const matchingRule = rules
      .filter((r) => r.isEnabled && r.dayPeriod === currentPeriod)
      .sort((a, b) => b.priority - a.priority)[0];

    if (matchingRule) {
      const variant = variants.find((v) => v.id === matchingRule.variantId);
      if (variant) return variant;
    }

    // Fallback to random
    return variants[Math.floor(Math.random() * variants.length)];
  }

  private selectByGeography(
    scheduleId: string,
    variants: RotationVariant[]
  ): RotationVariant {
    const rules = this.geographicRules.get(scheduleId) || [];
    // In real implementation, would detect user's region
    const userRegion = "AU"; // Default to Australia

    const matchingRule = rules
      .filter((r) => r.isEnabled && r.region === userRegion)
      .sort((a, b) => b.priority - a.priority)[0];

    if (matchingRule) {
      const variant = variants.find((v) => v.id === matchingRule.variantId);
      if (variant) return variant;
    }

    return variants[Math.floor(Math.random() * variants.length)];
  }

  private selectBySeason(
    scheduleId: string,
    variants: RotationVariant[]
  ): RotationVariant {
    const rules = this.seasonalRules.get(scheduleId) || [];
    const currentSeason = this.getCurrentSeason();

    const matchingRule = rules
      .filter((r) => r.isEnabled && r.season === currentSeason)
      .sort((a, b) => b.priority - a.priority)[0];

    if (matchingRule) {
      const variant = variants.find((v) => v.id === matchingRule.variantId);
      if (variant) return variant;
    }

    return variants[Math.floor(Math.random() * variants.length)];
  }

  private selectByWeight(variants: RotationVariant[]): RotationVariant {
    const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
    let random = Math.random() * totalWeight;

    for (const variant of variants) {
      random -= variant.weight;
      if (random <= 0) {
        return variant;
      }
    }

    return variants[variants.length - 1];
  }

  // Helper methods
  private getCurrentDayPeriod(): DayPeriod {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return "morning";
    if (hour >= 12 && hour < 18) return "afternoon";
    if (hour >= 18 && hour < 22) return "evening";
    return "night";
  }

  private getCurrentSeason(): Season {
    const month = new Date().getMonth();
    // Southern hemisphere (Australia)
    if (month >= 2 && month <= 4) return "autumn";
    if (month >= 5 && month <= 7) return "winter";
    if (month >= 8 && month <= 10) return "spring";
    return "summer";
  }

  // Check for statistical winner
  private checkForWinner(scheduleId: string): void {
    const schedule = this.schedules.get(scheduleId);
    const variantMap = this.variants.get(scheduleId);
    if (!schedule || !variantMap) return;

    const variants = Array.from(variantMap.values());
    if (variants.length < 2) return;

    // Check if all variants have minimum impressions
    const allHaveMinimum = variants.every(
      (v) => v.impressions >= schedule.minimumImpressions
    );
    if (!allHaveMinimum) return;

    // Sort by conversion rate
    variants.sort((a, b) => b.conversionRate - a.conversionRate);
    const best = variants[0];
    const secondBest = variants[1];

    // Simple significance check (would use proper statistical test in production)
    const difference = best.conversionRate - secondBest.conversionRate;
    const threshold = 1.0; // 1% difference threshold

    if (difference >= threshold && best.impressions >= 5000) {
      // We have a winner
      console.log(`Winner determined: ${best.name} with ${best.conversionRate}% conversion`);

      if (schedule.autoPromoteWinner) {
        // Disable other variants
        variants.forEach((v) => {
          if (v.id !== best.id) {
            v.weight = 0;
            variantMap.set(v.id, v);
          }
        });
        best.weight = 100;
        variantMap.set(best.id, best);
      }
    }
  }

  // Add time-based rule
  addTimeBasedRule(rule: Omit<TimeBasedRule, "id">): TimeBasedRule {
    const newRule: TimeBasedRule = {
      ...rule,
      id: `time_rule_${Date.now()}`,
    };

    const rules = this.timeBasedRules.get(rule.scheduleId) || [];
    rules.push(newRule);
    this.timeBasedRules.set(rule.scheduleId, rules);

    return newRule;
  }

  // Add geographic rule
  addGeographicRule(rule: Omit<GeographicRule, "id">): GeographicRule {
    const newRule: GeographicRule = {
      ...rule,
      id: `geo_rule_${Date.now()}`,
    };

    const rules = this.geographicRules.get(rule.scheduleId) || [];
    rules.push(newRule);
    this.geographicRules.set(rule.scheduleId, rules);

    return newRule;
  }

  // Add seasonal rule
  addSeasonalRule(rule: Omit<SeasonalRule, "id">): SeasonalRule {
    const newRule: SeasonalRule = {
      ...rule,
      id: `seasonal_rule_${Date.now()}`,
    };

    const rules = this.seasonalRules.get(rule.scheduleId) || [];
    rules.push(newRule);
    this.seasonalRules.set(rule.scheduleId, rules);

    return newRule;
  }

  // Get rotation history
  getRotationHistory(scheduleId: string): RotationEvent[] {
    return this.rotationHistory.get(scheduleId) || [];
  }

  // Get analytics
  getAnalytics(scheduleId: string): RotationAnalytics | null {
    const schedule = this.schedules.get(scheduleId);
    const variantMap = this.variants.get(scheduleId);
    const history = this.rotationHistory.get(scheduleId);

    if (!schedule || !variantMap) return null;

    const variants = Array.from(variantMap.values());
    const sortedByPerformance = [...variants].sort(
      (a, b) => b.performanceScore - a.performanceScore
    );

    const totalImpressions = variants.reduce((sum, v) => sum + v.impressions, 0);
    const totalInstalls = variants.reduce((sum, v) => sum + v.installs, 0);

    // Calculate average rotation interval from history
    let avgInterval = schedule.rotationInterval;
    if (history && history.length > 1) {
      const intervals: number[] = [];
      for (let i = 1; i < history.length; i++) {
        intervals.push(
          history[i].timestamp.getTime() - history[i - 1].timestamp.getTime()
        );
      }
      avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    }

    return {
      scheduleId,
      totalRotations: history?.length || 0,
      averageRotationInterval: avgInterval,
      bestPerformingVariant: sortedByPerformance[0]?.name || "N/A",
      worstPerformingVariant:
        sortedByPerformance[sortedByPerformance.length - 1]?.name || "N/A",
      overallConversionRate:
        totalImpressions > 0 ? (totalInstalls / totalImpressions) * 100 : 0,
      conversionRateImprovement: 0, // Would calculate from baseline
      winnerDetermined: false,
      winnerId: null,
    };
  }

  // Subscribe to rotation events
  subscribe(listener: (event: RotationEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(event: RotationEvent): void {
    this.listeners.forEach((listener) => listener(event));
  }

  // Persist schedules
  async persistSchedules(): Promise<void> {
    try {
      const data = {
        schedules: Array.from(this.schedules.entries()),
        variants: Array.from(this.variants.entries()).map(([k, v]) => [
          k,
          Array.from(v.entries()),
        ]),
      };
      await AsyncStorage.setItem("@ab_rotation_data", JSON.stringify(data));
    } catch (error) {
      console.error("Failed to persist rotation data:", error);
    }
  }

  // Load persisted schedules
  async loadPersistedSchedules(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem("@ab_rotation_data");
      if (data) {
        const parsed = JSON.parse(data);
        this.schedules = new Map(parsed.schedules);
        parsed.variants.forEach(([scheduleId, variants]: [string, [string, RotationVariant][]]) => {
          this.variants.set(scheduleId, new Map(variants));
        });
      }
    } catch (error) {
      console.error("Failed to load rotation data:", error);
    }
  }
}

// Export singleton instance
export const abTestRotationService = new ABTestRotationService();
