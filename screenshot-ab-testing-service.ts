/**
 * MediVac WACHS A/B Testing Service for App Store Screenshots
 * Test different screenshot variants to optimize store conversion
 */

// ============================================================================
// TYPES
// ============================================================================
export type VariantType = "annotation" | "color_scheme" | "text_overlay" | "device_frame" | "layout" | "background";
export type TestStatus = "draft" | "running" | "paused" | "completed" | "archived";
export type StoreType = "google_play" | "apple_app_store" | "microsoft_store";

export interface ScreenshotVariant {
  id: string;
  testId: string;
  name: string;
  type: VariantType;
  screenshotUrl: string;
  thumbnailUrl: string;
  configuration: VariantConfiguration;
  metrics: VariantMetrics;
  createdAt: Date;
  isControl: boolean;
}

export interface VariantConfiguration {
  annotationStyle?: "minimal" | "detailed" | "badge" | "callout" | "none";
  colorScheme?: "light" | "dark" | "brand" | "vibrant" | "muted";
  textOverlay?: {
    headline: string;
    subheadline?: string;
    position: "top" | "bottom" | "center";
    fontSize: "small" | "medium" | "large";
  };
  deviceFrame?: "iphone_15_pro_max" | "pixel_8_pro" | "surface_pro" | "none";
  layout?: "portrait" | "landscape" | "split" | "grid";
  background?: {
    type: "solid" | "gradient" | "image" | "transparent";
    color?: string;
    gradientColors?: string[];
    imageUrl?: string;
  };
}

export interface VariantMetrics {
  impressions: number;
  clicks: number;
  installs: number;
  ctr: number; // click-through rate
  conversionRate: number;
  avgTimeOnPage: number; // seconds
  bounceRate: number;
}

export interface ABTest {
  id: string;
  name: string;
  description: string;
  store: StoreType;
  status: TestStatus;
  variants: ScreenshotVariant[];
  winnerId: string | null;
  startDate: Date | null;
  endDate: Date | null;
  targetSampleSize: number;
  currentSampleSize: number;
  confidenceLevel: number; // 0-100
  statisticalSignificance: number; // 0-100
  createdAt: Date;
  updatedAt: Date;
}

export interface TestResult {
  testId: string;
  winnerId: string;
  winnerName: string;
  improvement: number; // percentage improvement over control
  confidence: number;
  recommendation: string;
  metrics: {
    control: VariantMetrics;
    winner: VariantMetrics;
  };
}

// ============================================================================
// A/B TESTING SERVICE
// ============================================================================
class ScreenshotABTestingService {
  private tests: ABTest[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.initializeSampleTests();
  }

  private initializeSampleTests(): void {
    // Sample test for Google Play
    const googleTest: ABTest = {
      id: "test_google_1",
      name: "Dashboard Screenshot Optimization",
      description: "Testing different annotation styles for the main dashboard screenshot",
      store: "google_play",
      status: "running",
      variants: [
        {
          id: "var_1_control",
          testId: "test_google_1",
          name: "Control - Minimal Annotations",
          type: "annotation",
          screenshotUrl: "https://example.com/screenshot_control.png",
          thumbnailUrl: "https://example.com/thumb_control.png",
          configuration: { annotationStyle: "minimal", colorScheme: "brand" },
          metrics: { impressions: 15000, clicks: 750, installs: 225, ctr: 5.0, conversionRate: 1.5, avgTimeOnPage: 12, bounceRate: 45 },
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          isControl: true,
        },
        {
          id: "var_1_a",
          testId: "test_google_1",
          name: "Variant A - Detailed Callouts",
          type: "annotation",
          screenshotUrl: "https://example.com/screenshot_a.png",
          thumbnailUrl: "https://example.com/thumb_a.png",
          configuration: { annotationStyle: "callout", colorScheme: "brand" },
          metrics: { impressions: 14800, clicks: 888, installs: 296, ctr: 6.0, conversionRate: 2.0, avgTimeOnPage: 15, bounceRate: 38 },
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          isControl: false,
        },
        {
          id: "var_1_b",
          testId: "test_google_1",
          name: "Variant B - Badge Style",
          type: "annotation",
          screenshotUrl: "https://example.com/screenshot_b.png",
          thumbnailUrl: "https://example.com/thumb_b.png",
          configuration: { annotationStyle: "badge", colorScheme: "vibrant" },
          metrics: { impressions: 15200, clicks: 912, installs: 319, ctr: 6.0, conversionRate: 2.1, avgTimeOnPage: 14, bounceRate: 40 },
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          isControl: false,
        },
      ],
      winnerId: null,
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate: null,
      targetSampleSize: 50000,
      currentSampleSize: 45000,
      confidenceLevel: 95,
      statisticalSignificance: 87,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    };

    // Sample test for Apple App Store
    const appleTest: ABTest = {
      id: "test_apple_1",
      name: "Color Scheme Comparison",
      description: "Testing light vs dark mode screenshots for App Store",
      store: "apple_app_store",
      status: "completed",
      variants: [
        {
          id: "var_2_control",
          testId: "test_apple_1",
          name: "Control - Light Mode",
          type: "color_scheme",
          screenshotUrl: "https://example.com/apple_light.png",
          thumbnailUrl: "https://example.com/thumb_light.png",
          configuration: { colorScheme: "light", annotationStyle: "minimal" },
          metrics: { impressions: 25000, clicks: 1250, installs: 375, ctr: 5.0, conversionRate: 1.5, avgTimeOnPage: 10, bounceRate: 50 },
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          isControl: true,
        },
        {
          id: "var_2_a",
          testId: "test_apple_1",
          name: "Variant A - Dark Mode",
          type: "color_scheme",
          screenshotUrl: "https://example.com/apple_dark.png",
          thumbnailUrl: "https://example.com/thumb_dark.png",
          configuration: { colorScheme: "dark", annotationStyle: "minimal" },
          metrics: { impressions: 24500, clicks: 1470, installs: 490, ctr: 6.0, conversionRate: 2.0, avgTimeOnPage: 13, bounceRate: 42 },
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          isControl: false,
        },
      ],
      winnerId: "var_2_a",
      startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      targetSampleSize: 50000,
      currentSampleSize: 49500,
      confidenceLevel: 95,
      statisticalSignificance: 96,
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    };

    this.tests = [googleTest, appleTest];
  }

  // Create new A/B test
  async createTest(test: Omit<ABTest, "id" | "createdAt" | "updatedAt" | "currentSampleSize" | "statisticalSignificance">): Promise<ABTest> {
    const newTest: ABTest = {
      ...test,
      id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      currentSampleSize: 0,
      statisticalSignificance: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.tests.push(newTest);
    this.notify();
    return newTest;
  }

  // Get all tests
  async getAllTests(): Promise<ABTest[]> {
    return this.tests;
  }

  // Get test by ID
  async getTestById(testId: string): Promise<ABTest | null> {
    return this.tests.find(t => t.id === testId) || null;
  }

  // Get tests by store
  async getTestsByStore(store: StoreType): Promise<ABTest[]> {
    return this.tests.filter(t => t.store === store);
  }

  // Get tests by status
  async getTestsByStatus(status: TestStatus): Promise<ABTest[]> {
    return this.tests.filter(t => t.status === status);
  }

  // Add variant to test
  async addVariant(testId: string, variant: Omit<ScreenshotVariant, "id" | "testId" | "createdAt" | "metrics">): Promise<ScreenshotVariant | null> {
    const test = this.tests.find(t => t.id === testId);
    if (!test) return null;

    const newVariant: ScreenshotVariant = {
      ...variant,
      id: `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      testId,
      createdAt: new Date(),
      metrics: { impressions: 0, clicks: 0, installs: 0, ctr: 0, conversionRate: 0, avgTimeOnPage: 0, bounceRate: 0 },
    };
    test.variants.push(newVariant);
    test.updatedAt = new Date();
    this.notify();
    return newVariant;
  }

  // Update variant metrics
  async updateVariantMetrics(testId: string, variantId: string, metrics: Partial<VariantMetrics>): Promise<ScreenshotVariant | null> {
    const test = this.tests.find(t => t.id === testId);
    if (!test) return null;

    const variant = test.variants.find(v => v.id === variantId);
    if (!variant) return null;

    variant.metrics = { ...variant.metrics, ...metrics };
    
    // Recalculate derived metrics
    if (variant.metrics.impressions > 0) {
      variant.metrics.ctr = (variant.metrics.clicks / variant.metrics.impressions) * 100;
      variant.metrics.conversionRate = (variant.metrics.installs / variant.metrics.impressions) * 100;
    }

    test.updatedAt = new Date();
    this.notify();
    return variant;
  }

  // Start test
  async startTest(testId: string): Promise<ABTest | null> {
    const test = this.tests.find(t => t.id === testId);
    if (!test || test.status !== "draft") return null;

    test.status = "running";
    test.startDate = new Date();
    test.updatedAt = new Date();
    this.notify();
    return test;
  }

  // Pause test
  async pauseTest(testId: string): Promise<ABTest | null> {
    const test = this.tests.find(t => t.id === testId);
    if (!test || test.status !== "running") return null;

    test.status = "paused";
    test.updatedAt = new Date();
    this.notify();
    return test;
  }

  // Complete test
  async completeTest(testId: string): Promise<ABTest | null> {
    const test = this.tests.find(t => t.id === testId);
    if (!test) return null;

    test.status = "completed";
    test.endDate = new Date();
    
    // Determine winner
    const winner = this.determineWinner(test);
    test.winnerId = winner?.id || null;
    
    test.updatedAt = new Date();
    this.notify();
    return test;
  }

  // Determine winner based on conversion rate
  private determineWinner(test: ABTest): ScreenshotVariant | null {
    if (test.variants.length === 0) return null;
    
    return test.variants.reduce((best, current) => {
      if (current.metrics.conversionRate > best.metrics.conversionRate) {
        return current;
      }
      return best;
    });
  }

  // Calculate statistical significance
  calculateStatisticalSignificance(test: ABTest): number {
    if (test.variants.length < 2) return 0;

    const control = test.variants.find(v => v.isControl);
    const variants = test.variants.filter(v => !v.isControl);

    if (!control || variants.length === 0) return 0;

    // Simplified z-test calculation
    const controlRate = control.metrics.conversionRate / 100;
    const controlN = control.metrics.impressions;

    let maxSignificance = 0;

    variants.forEach(variant => {
      const variantRate = variant.metrics.conversionRate / 100;
      const variantN = variant.metrics.impressions;

      if (controlN > 0 && variantN > 0) {
        const pooledRate = (controlRate * controlN + variantRate * variantN) / (controlN + variantN);
        const se = Math.sqrt(pooledRate * (1 - pooledRate) * (1/controlN + 1/variantN));
        
        if (se > 0) {
          const z = Math.abs(variantRate - controlRate) / se;
          // Convert z-score to significance (simplified)
          const significance = Math.min(99.9, (1 - Math.exp(-z * z / 2)) * 100);
          maxSignificance = Math.max(maxSignificance, significance);
        }
      }
    });

    return Math.round(maxSignificance * 10) / 10;
  }

  // Get test results
  async getTestResults(testId: string): Promise<TestResult | null> {
    const test = this.tests.find(t => t.id === testId);
    if (!test || test.status !== "completed" || !test.winnerId) return null;

    const control = test.variants.find(v => v.isControl);
    const winner = test.variants.find(v => v.id === test.winnerId);

    if (!control || !winner) return null;

    const improvement = control.metrics.conversionRate > 0
      ? ((winner.metrics.conversionRate - control.metrics.conversionRate) / control.metrics.conversionRate) * 100
      : 0;

    return {
      testId: test.id,
      winnerId: winner.id,
      winnerName: winner.name,
      improvement: Math.round(improvement * 10) / 10,
      confidence: test.statisticalSignificance,
      recommendation: improvement > 0
        ? `Implement ${winner.name} for a ${improvement.toFixed(1)}% improvement in conversions`
        : `Keep current control variant`,
      metrics: {
        control: control.metrics,
        winner: winner.metrics,
      },
    };
  }

  // Get analytics summary
  async getAnalyticsSummary(): Promise<{
    totalTests: number;
    runningTests: number;
    completedTests: number;
    averageImprovement: number;
    totalImpressions: number;
    totalInstalls: number;
  }> {
    const completedTests = this.tests.filter(t => t.status === "completed" && t.winnerId);
    let totalImprovement = 0;
    let improvementCount = 0;

    for (const test of completedTests) {
      const result = await this.getTestResults(test.id);
      if (result && result.improvement > 0) {
        totalImprovement += result.improvement;
        improvementCount++;
      }
    }

    const allVariants = this.tests.flatMap(t => t.variants);
    const totalImpressions = allVariants.reduce((sum, v) => sum + v.metrics.impressions, 0);
    const totalInstalls = allVariants.reduce((sum, v) => sum + v.metrics.installs, 0);

    return {
      totalTests: this.tests.length,
      runningTests: this.tests.filter(t => t.status === "running").length,
      completedTests: completedTests.length,
      averageImprovement: improvementCount > 0 ? totalImprovement / improvementCount : 0,
      totalImpressions,
      totalInstalls,
    };
  }

  // Subscribe to changes
  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify listeners
  private notify(): void {
    this.listeners.forEach(callback => callback());
  }
}

export const screenshotABTestingService = new ScreenshotABTestingService();
