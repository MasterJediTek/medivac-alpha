/**
 * Report Dashboard Widget Service
 * Home screen widget showing recent A/B test reports and key metrics
 */

export type WidgetSize = 'small' | 'medium' | 'large' | 'full';
export type WidgetType = 'ab-test-summary' | 'recent-reports' | 'key-metrics' | 'performance-chart' | 'winner-showcase' | 'trend-indicator';
export type MetricTrend = 'up' | 'down' | 'stable';

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  size: WidgetSize;
  position: { row: number; col: number };
  config: WidgetConfig;
  data?: WidgetData;
  lastUpdated: Date;
  refreshInterval: number; // seconds
  isVisible: boolean;
}

export interface WidgetConfig {
  maxItems?: number;
  showTrend?: boolean;
  showChart?: boolean;
  chartType?: 'line' | 'bar' | 'pie' | 'donut';
  timeRange?: 'day' | 'week' | 'month' | 'quarter';
  metrics?: string[];
  colorScheme?: 'default' | 'medical' | 'jedi';
}

export interface WidgetData {
  summary?: ABTestSummary;
  reports?: ReportItem[];
  metrics?: KeyMetric[];
  chartData?: ChartDataPoint[];
  winner?: WinnerShowcase;
  trends?: TrendData[];
}

export interface ABTestSummary {
  totalTests: number;
  activeTests: number;
  completedTests: number;
  winnersIdentified: number;
  avgLiftPercentage: number;
  totalImpressions: number;
}

export interface ReportItem {
  id: string;
  testName: string;
  status: 'running' | 'completed' | 'paused' | 'archived';
  createdAt: Date;
  completedAt?: Date;
  winningVariant?: string;
  liftPercentage?: number;
  confidence?: number;
  impressions: number;
}

export interface KeyMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  trend: MetricTrend;
  changePercentage: number;
  target?: number;
  color: string;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  timestamp?: Date;
  variant?: string;
  color?: string;
}

export interface WinnerShowcase {
  testId: string;
  testName: string;
  winningVariant: string;
  liftPercentage: number;
  confidence: number;
  impressions: number;
  conversions: number;
  identifiedAt: Date;
  screenshotUrl?: string;
}

export interface TrendData {
  metricName: string;
  currentValue: number;
  previousValue: number;
  trend: MetricTrend;
  changePercentage: number;
  sparklineData: number[];
}

export interface DashboardLayout {
  id: string;
  name: string;
  description: string;
  widgets: DashboardWidget[];
  columns: number;
  rows: number;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WidgetRefreshEvent {
  widgetId: string;
  timestamp: Date;
  success: boolean;
  duration: number;
  error?: string;
}

export interface DashboardAnalytics {
  totalWidgets: number;
  widgetsByType: Record<WidgetType, number>;
  avgRefreshTime: number;
  totalRefreshes: number;
  errorRate: number;
  mostViewedWidget: string;
  lastFullRefresh: Date;
}

// Default widget configurations
const DEFAULT_WIDGETS: Omit<DashboardWidget, 'id' | 'lastUpdated'>[] = [
  {
    type: 'ab-test-summary',
    title: 'A/B Test Overview',
    size: 'medium',
    position: { row: 0, col: 0 },
    config: { showTrend: true, colorScheme: 'medical' },
    refreshInterval: 300,
    isVisible: true,
  },
  {
    type: 'recent-reports',
    title: 'Recent Reports',
    size: 'large',
    position: { row: 0, col: 1 },
    config: { maxItems: 5, showChart: false },
    refreshInterval: 60,
    isVisible: true,
  },
  {
    type: 'key-metrics',
    title: 'Key Metrics',
    size: 'medium',
    position: { row: 1, col: 0 },
    config: { 
      metrics: ['conversion_rate', 'avg_lift', 'confidence', 'impressions'],
      showTrend: true,
    },
    refreshInterval: 120,
    isVisible: true,
  },
  {
    type: 'performance-chart',
    title: 'Performance Trends',
    size: 'large',
    position: { row: 1, col: 1 },
    config: { chartType: 'line', timeRange: 'week' },
    refreshInterval: 300,
    isVisible: true,
  },
  {
    type: 'winner-showcase',
    title: 'Latest Winner',
    size: 'small',
    position: { row: 2, col: 0 },
    config: { colorScheme: 'jedi' },
    refreshInterval: 600,
    isVisible: true,
  },
  {
    type: 'trend-indicator',
    title: 'Trend Indicators',
    size: 'small',
    position: { row: 2, col: 1 },
    config: { showChart: true, chartType: 'bar' },
    refreshInterval: 180,
    isVisible: true,
  },
];

// Color schemes
const COLOR_SCHEMES = {
  default: {
    primary: '#0A7EA4',
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    neutral: '#6B7280',
  },
  medical: {
    primary: '#0A7EA4',
    success: '#10B981',
    warning: '#F97316',
    error: '#DC2626',
    neutral: '#64748B',
  },
  jedi: {
    primary: '#FFD700',
    success: '#4ADE80',
    warning: '#FBBF24',
    error: '#F87171',
    neutral: '#9CA3AF',
  },
};

class ReportDashboardWidgetService {
  private widgets: Map<string, DashboardWidget> = new Map();
  private layouts: Map<string, DashboardLayout> = new Map();
  private refreshEvents: WidgetRefreshEvent[] = [];
  private listeners: Set<(widgets: DashboardWidget[]) => void> = new Set();
  private refreshTimers: Map<string, ReturnType<typeof setInterval>> = new Map();

  constructor() {
    this.initializeDefaultWidgets();
    this.initializeDefaultLayout();
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeDefaultWidgets(): void {
    DEFAULT_WIDGETS.forEach(widgetConfig => {
      const widget: DashboardWidget = {
        id: this.generateId('widget'),
        ...widgetConfig,
        lastUpdated: new Date(),
        data: this.generateMockData(widgetConfig.type),
      };
      this.widgets.set(widget.id, widget);
    });
  }

  private initializeDefaultLayout(): void {
    const layout: DashboardLayout = {
      id: 'default_layout',
      name: 'Default Dashboard',
      description: 'Standard A/B test reporting dashboard',
      widgets: Array.from(this.widgets.values()),
      columns: 2,
      rows: 3,
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.layouts.set(layout.id, layout);
  }

  private generateMockData(type: WidgetType): WidgetData {
    switch (type) {
      case 'ab-test-summary':
        return {
          summary: {
            totalTests: 24,
            activeTests: 8,
            completedTests: 14,
            winnersIdentified: 12,
            avgLiftPercentage: 15.3,
            totalImpressions: 1250000,
          },
        };
      case 'recent-reports':
        return {
          reports: [
            {
              id: 'report_1',
              testName: 'Homepage Hero Banner',
              status: 'completed',
              createdAt: new Date(Date.now() - 86400000),
              completedAt: new Date(),
              winningVariant: 'Variant B',
              liftPercentage: 23.5,
              confidence: 98.2,
              impressions: 45000,
            },
            {
              id: 'report_2',
              testName: 'CTA Button Color',
              status: 'running',
              createdAt: new Date(Date.now() - 172800000),
              impressions: 32000,
            },
            {
              id: 'report_3',
              testName: 'Patient Dashboard Layout',
              status: 'completed',
              createdAt: new Date(Date.now() - 259200000),
              completedAt: new Date(Date.now() - 86400000),
              winningVariant: 'Variant A',
              liftPercentage: 18.7,
              confidence: 95.5,
              impressions: 28000,
            },
          ],
        };
      case 'key-metrics':
        return {
          metrics: [
            { id: 'm1', name: 'Conversion Rate', value: 4.2, unit: '%', trend: 'up', changePercentage: 12.5, target: 5.0, color: '#22C55E' },
            { id: 'm2', name: 'Avg Lift', value: 15.3, unit: '%', trend: 'up', changePercentage: 8.2, color: '#0A7EA4' },
            { id: 'm3', name: 'Confidence', value: 96.8, unit: '%', trend: 'stable', changePercentage: 0.5, target: 95.0, color: '#F59E0B' },
            { id: 'm4', name: 'Impressions', value: 125000, unit: '', trend: 'up', changePercentage: 25.0, color: '#6B7280' },
          ],
        };
      case 'performance-chart':
        return {
          chartData: [
            { label: 'Mon', value: 12.5, timestamp: new Date(Date.now() - 518400000) },
            { label: 'Tue', value: 14.2, timestamp: new Date(Date.now() - 432000000) },
            { label: 'Wed', value: 13.8, timestamp: new Date(Date.now() - 345600000) },
            { label: 'Thu', value: 16.1, timestamp: new Date(Date.now() - 259200000) },
            { label: 'Fri', value: 15.5, timestamp: new Date(Date.now() - 172800000) },
            { label: 'Sat', value: 17.2, timestamp: new Date(Date.now() - 86400000) },
            { label: 'Sun', value: 18.5, timestamp: new Date() },
          ],
        };
      case 'winner-showcase':
        return {
          winner: {
            testId: 'test_winner_1',
            testName: 'Homepage Hero Banner',
            winningVariant: 'Variant B',
            liftPercentage: 23.5,
            confidence: 98.2,
            impressions: 45000,
            conversions: 1890,
            identifiedAt: new Date(),
          },
        };
      case 'trend-indicator':
        return {
          trends: [
            { metricName: 'Conversion', currentValue: 4.2, previousValue: 3.7, trend: 'up', changePercentage: 13.5, sparklineData: [3.2, 3.5, 3.7, 3.9, 4.0, 4.2] },
            { metricName: 'Engagement', currentValue: 68, previousValue: 62, trend: 'up', changePercentage: 9.7, sparklineData: [58, 60, 62, 64, 66, 68] },
            { metricName: 'Bounce Rate', currentValue: 32, previousValue: 35, trend: 'down', changePercentage: -8.6, sparklineData: [38, 36, 35, 34, 33, 32] },
          ],
        };
      default:
        return {};
    }
  }

  // Widget Management
  addWidget(config: Omit<DashboardWidget, 'id' | 'lastUpdated' | 'data'>): DashboardWidget {
    const widget: DashboardWidget = {
      id: this.generateId('widget'),
      ...config,
      lastUpdated: new Date(),
      data: this.generateMockData(config.type),
    };

    this.widgets.set(widget.id, widget);
    this.startAutoRefresh(widget);
    this.notifyListeners();

    return widget;
  }

  updateWidget(widgetId: string, updates: Partial<Omit<DashboardWidget, 'id'>>): DashboardWidget | null {
    const widget = this.widgets.get(widgetId);
    if (!widget) return null;

    const updated = { ...widget, ...updates, lastUpdated: new Date() };
    this.widgets.set(widgetId, updated);

    if (updates.refreshInterval) {
      this.stopAutoRefresh(widgetId);
      this.startAutoRefresh(updated);
    }

    this.notifyListeners();
    return updated;
  }

  removeWidget(widgetId: string): boolean {
    this.stopAutoRefresh(widgetId);
    const result = this.widgets.delete(widgetId);
    if (result) {
      this.notifyListeners();
    }
    return result;
  }

  getWidget(widgetId: string): DashboardWidget | undefined {
    return this.widgets.get(widgetId);
  }

  getAllWidgets(): DashboardWidget[] {
    return Array.from(this.widgets.values());
  }

  getVisibleWidgets(): DashboardWidget[] {
    return this.getAllWidgets().filter(w => w.isVisible);
  }

  getWidgetsByType(type: WidgetType): DashboardWidget[] {
    return this.getAllWidgets().filter(w => w.type === type);
  }

  toggleWidgetVisibility(widgetId: string): boolean {
    const widget = this.widgets.get(widgetId);
    if (!widget) return false;

    widget.isVisible = !widget.isVisible;
    this.notifyListeners();
    return widget.isVisible;
  }

  // Widget Refresh
  async refreshWidget(widgetId: string): Promise<boolean> {
    const widget = this.widgets.get(widgetId);
    if (!widget) return false;

    const startTime = Date.now();
    
    try {
      // Simulate data refresh
      widget.data = this.generateMockData(widget.type);
      widget.lastUpdated = new Date();

      const event: WidgetRefreshEvent = {
        widgetId,
        timestamp: new Date(),
        success: true,
        duration: Date.now() - startTime,
      };
      this.refreshEvents.push(event);

      this.notifyListeners();
      return true;
    } catch (error) {
      const event: WidgetRefreshEvent = {
        widgetId,
        timestamp: new Date(),
        success: false,
        duration: Date.now() - startTime,
        error: String(error),
      };
      this.refreshEvents.push(event);
      return false;
    }
  }

  async refreshAllWidgets(): Promise<{ success: number; failed: number }> {
    const results = await Promise.all(
      Array.from(this.widgets.keys()).map(id => this.refreshWidget(id))
    );

    return {
      success: results.filter(r => r).length,
      failed: results.filter(r => !r).length,
    };
  }

  private startAutoRefresh(widget: DashboardWidget): void {
    if (widget.refreshInterval <= 0) return;

    const timer = setInterval(() => {
      this.refreshWidget(widget.id);
    }, widget.refreshInterval * 1000);

    this.refreshTimers.set(widget.id, timer);
  }

  private stopAutoRefresh(widgetId: string): void {
    const timer = this.refreshTimers.get(widgetId);
    if (timer) {
      clearInterval(timer);
      this.refreshTimers.delete(widgetId);
    }
  }

  // Layout Management
  createLayout(config: Omit<DashboardLayout, 'id' | 'createdAt' | 'updatedAt'>): DashboardLayout {
    const layout: DashboardLayout = {
      id: this.generateId('layout'),
      ...config,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.layouts.set(layout.id, layout);
    return layout;
  }

  updateLayout(layoutId: string, updates: Partial<Omit<DashboardLayout, 'id' | 'createdAt'>>): DashboardLayout | null {
    const layout = this.layouts.get(layoutId);
    if (!layout) return null;

    const updated = { ...layout, ...updates, updatedAt: new Date() };
    this.layouts.set(layoutId, updated);
    return updated;
  }

  deleteLayout(layoutId: string): boolean {
    const layout = this.layouts.get(layoutId);
    if (layout?.isDefault) return false;
    return this.layouts.delete(layoutId);
  }

  getLayout(layoutId: string): DashboardLayout | undefined {
    return this.layouts.get(layoutId);
  }

  getAllLayouts(): DashboardLayout[] {
    return Array.from(this.layouts.values());
  }

  getDefaultLayout(): DashboardLayout | undefined {
    return Array.from(this.layouts.values()).find(l => l.isDefault);
  }

  setDefaultLayout(layoutId: string): boolean {
    const layout = this.layouts.get(layoutId);
    if (!layout) return false;

    // Remove default from all layouts
    this.layouts.forEach(l => { l.isDefault = false; });
    
    layout.isDefault = true;
    return true;
  }

  // Widget Position Management
  moveWidget(widgetId: string, newPosition: { row: number; col: number }): boolean {
    const widget = this.widgets.get(widgetId);
    if (!widget) return false;

    widget.position = newPosition;
    this.notifyListeners();
    return true;
  }

  resizeWidget(widgetId: string, newSize: WidgetSize): boolean {
    const widget = this.widgets.get(widgetId);
    if (!widget) return false;

    widget.size = newSize;
    this.notifyListeners();
    return true;
  }

  reorderWidgets(widgetIds: string[]): void {
    widgetIds.forEach((id, index) => {
      const widget = this.widgets.get(id);
      if (widget) {
        widget.position = {
          row: Math.floor(index / 2),
          col: index % 2,
        };
      }
    });
    this.notifyListeners();
  }

  // Color Schemes
  getColorScheme(scheme: 'default' | 'medical' | 'jedi'): typeof COLOR_SCHEMES.default {
    return COLOR_SCHEMES[scheme];
  }

  getAllColorSchemes(): typeof COLOR_SCHEMES {
    return { ...COLOR_SCHEMES };
  }

  // Analytics
  getAnalytics(): DashboardAnalytics {
    const widgets = this.getAllWidgets();
    const widgetsByType: Record<WidgetType, number> = {
      'ab-test-summary': 0,
      'recent-reports': 0,
      'key-metrics': 0,
      'performance-chart': 0,
      'winner-showcase': 0,
      'trend-indicator': 0,
    };

    widgets.forEach(w => {
      widgetsByType[w.type]++;
    });

    const successfulRefreshes = this.refreshEvents.filter(e => e.success);
    const avgRefreshTime = successfulRefreshes.length > 0
      ? successfulRefreshes.reduce((sum, e) => sum + e.duration, 0) / successfulRefreshes.length
      : 0;

    const errorRate = this.refreshEvents.length > 0
      ? (this.refreshEvents.filter(e => !e.success).length / this.refreshEvents.length) * 100
      : 0;

    // Find most viewed widget (simulated)
    const mostViewedWidget = widgets.length > 0 ? widgets[0].title : 'N/A';

    return {
      totalWidgets: widgets.length,
      widgetsByType,
      avgRefreshTime: Math.round(avgRefreshTime),
      totalRefreshes: this.refreshEvents.length,
      errorRate: Math.round(errorRate * 100) / 100,
      mostViewedWidget,
      lastFullRefresh: new Date(),
    };
  }

  getRefreshHistory(widgetId?: string): WidgetRefreshEvent[] {
    if (widgetId) {
      return this.refreshEvents.filter(e => e.widgetId === widgetId);
    }
    return [...this.refreshEvents];
  }

  // Export Dashboard
  exportDashboard(): string {
    const data = {
      widgets: this.getAllWidgets(),
      layouts: this.getAllLayouts(),
      exportedAt: new Date(),
    };
    return JSON.stringify(data, null, 2);
  }

  importDashboard(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.widgets) {
        data.widgets.forEach((w: DashboardWidget) => {
          this.widgets.set(w.id, w);
        });
      }

      if (data.layouts) {
        data.layouts.forEach((l: DashboardLayout) => {
          this.layouts.set(l.id, l);
        });
      }

      this.notifyListeners();
      return true;
    } catch {
      return false;
    }
  }

  // Event Listeners
  subscribe(listener: (widgets: DashboardWidget[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const widgets = this.getVisibleWidgets();
    this.listeners.forEach(listener => listener(widgets));
  }

  // Reset
  reset(): void {
    // Stop all auto-refresh timers
    this.refreshTimers.forEach(timer => clearInterval(timer));
    this.refreshTimers.clear();

    this.widgets.clear();
    this.layouts.clear();
    this.refreshEvents = [];

    this.initializeDefaultWidgets();
    this.initializeDefaultLayout();
    this.notifyListeners();
  }
}

export const reportDashboardWidgetService = new ReportDashboardWidgetService();
