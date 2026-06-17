/**
 * Health Analytics Service
 * Provides health metrics trending and analysis
 */

export interface HealthMetric {
  id: string;
  type: 'heart_rate' | 'blood_pressure' | 'temperature' | 'weight' | 'glucose' | 'oxygen';
  value: number | string;
  unit: string;
  timestamp: number;
  source: string;
}

export interface HealthTrend {
  metric: string;
  current: number;
  average: number;
  min: number;
  max: number;
  trend: 'up' | 'down' | 'stable';
  percentChange: number;
  dataPoints: HealthMetric[];
}

export interface HealthReport {
  id: string;
  patientId: string;
  generatedAt: number;
  period: 'week' | 'month' | 'quarter' | 'year';
  trends: HealthTrend[];
  summary: string;
  recommendations: string[];
  alerts: string[];
}

export class HealthAnalyticsService {
  private static instance: HealthAnalyticsService;
  private apiUrl = process.env.EXPO_PUBLIC_API_URL;
  private cachedMetrics: Map<string, HealthMetric[]> = new Map();

  private constructor() {}

  static getInstance(): HealthAnalyticsService {
    if (!HealthAnalyticsService.instance) {
      HealthAnalyticsService.instance = new HealthAnalyticsService();
    }
    return HealthAnalyticsService.instance;
  }

  /**
   * Get health metrics for period
   */
  async getMetrics(
    metricType: string,
    startDate: number,
    endDate: number
  ): Promise<HealthMetric[]> {
    try {
      const cacheKey = `${metricType}-${startDate}-${endDate}`;
      
      if (this.cachedMetrics.has(cacheKey)) {
        return this.cachedMetrics.get(cacheKey)!;
      }

      const response = await fetch(
        `${this.apiUrl}/health-analytics/metrics?type=${metricType}&start=${startDate}&end=${endDate}`,
        {
          headers: {
            'Authorization': `Bearer ${this.getAccessToken()}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch metrics');
      
      const metrics = await response.json();
      this.cachedMetrics.set(cacheKey, metrics);
      
      return metrics;
    } catch (error) {
      console.error('Failed to get metrics:', error);
      throw error;
    }
  }

  /**
   * Get health trends
   */
  async getTrends(period: 'week' | 'month' | 'quarter' | 'year'): Promise<HealthTrend[]> {
    try {
      const response = await fetch(`${this.apiUrl}/health-analytics/trends?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${this.getAccessToken()}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch trends');
      return await response.json();
    } catch (error) {
      console.error('Failed to get trends:', error);
      throw error;
    }
  }

  /**
   * Generate health report
   */
  async generateReport(
    period: 'week' | 'month' | 'quarter' | 'year'
  ): Promise<HealthReport> {
    try {
      const response = await fetch(`${this.apiUrl}/health-analytics/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAccessToken()}`,
        },
        body: JSON.stringify({ period }),
      });

      if (!response.ok) throw new Error('Failed to generate report');
      return await response.json();
    } catch (error) {
      console.error('Failed to generate report:', error);
      throw error;
    }
  }

  /**
   * Log health metric
   */
  async logMetric(metric: Omit<HealthMetric, 'id'>): Promise<HealthMetric> {
    try {
      const response = await fetch(`${this.apiUrl}/health-analytics/metrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAccessToken()}`,
        },
        body: JSON.stringify(metric),
      });

      if (!response.ok) throw new Error('Failed to log metric');
      
      // Clear cache
      this.cachedMetrics.clear();
      
      return await response.json();
    } catch (error) {
      console.error('Failed to log metric:', error);
      throw error;
    }
  }

  /**
   * Get health insights
   */
  async getInsights(): Promise<string[]> {
    try {
      const response = await fetch(`${this.apiUrl}/health-analytics/insights`, {
        headers: {
          'Authorization': `Bearer ${this.getAccessToken()}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch insights');
      const data = await response.json();
      return data.insights || [];
    } catch (error) {
      console.error('Failed to get insights:', error);
      throw error;
    }
  }

  /**
   * Get health score
   */
  async getHealthScore(): Promise<number> {
    try {
      const response = await fetch(`${this.apiUrl}/health-analytics/score`, {
        headers: {
          'Authorization': `Bearer ${this.getAccessToken()}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch health score');
      const data = await response.json();
      return data.score || 0;
    } catch (error) {
      console.error('Failed to get health score:', error);
      throw error;
    }
  }

  /**
   * Compare metrics with baseline
   */
  async compareWithBaseline(metricType: string): Promise<{
    current: number;
    baseline: number;
    percentDifference: number;
    status: 'normal' | 'warning' | 'critical';
  }> {
    try {
      const response = await fetch(
        `${this.apiUrl}/health-analytics/compare?metric=${metricType}`,
        {
          headers: {
            'Authorization': `Bearer ${this.getAccessToken()}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to compare metrics');
      return await response.json();
    } catch (error) {
      console.error('Failed to compare with baseline:', error);
      throw error;
    }
  }

  /**
   * Get access token
   */
  private getAccessToken(): string {
    // TODO: Get from auth service
    return '';
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cachedMetrics.clear();
  }
}
