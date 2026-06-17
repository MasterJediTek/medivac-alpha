import { ScrollView, Text, View, TouchableOpacity, Dimensions } from "react-native";
import { useState, useEffect } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { 
  reportDashboardWidgetService, 
  type DashboardWidget,
  type DashboardLayout,
  type WidgetType,
  type WidgetSize,
  type DashboardAnalytics,
  type ABTestSummary,
  type ReportItem,
  type KeyMetric,
  type ChartDataPoint,
  type WinnerShowcase,
  type TrendData,
} from "@/lib/services/report-dashboard-widget-service";

type TabType = 'dashboard' | 'widgets' | 'layouts' | 'analytics';

const { width: screenWidth } = Dimensions.get('window');

export default function ReportDashboardScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [layouts, setLayouts] = useState<DashboardLayout[]>([]);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadData();
    const unsubscribe = reportDashboardWidgetService.subscribe(handleWidgetsUpdate);
    return () => unsubscribe();
  }, []);

  const loadData = () => {
    setWidgets(reportDashboardWidgetService.getVisibleWidgets());
    setLayouts(reportDashboardWidgetService.getAllLayouts());
    setAnalytics(reportDashboardWidgetService.getAnalytics());
  };

  const handleWidgetsUpdate = (updatedWidgets: DashboardWidget[]) => {
    setWidgets(updatedWidgets);
    setAnalytics(reportDashboardWidgetService.getAnalytics());
  };

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    await reportDashboardWidgetService.refreshAllWidgets();
    setIsRefreshing(false);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '↑';
      case 'down': return '↓';
      default: return '→';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-success';
      case 'down': return 'text-error';
      default: return 'text-muted';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-primary';
      case 'completed': return 'bg-success';
      case 'paused': return 'bg-warning';
      case 'archived': return 'bg-muted';
      default: return 'bg-muted';
    }
  };

  const getSizeWidth = (size: WidgetSize) => {
    switch (size) {
      case 'small': return (screenWidth - 48) / 2;
      case 'medium': return (screenWidth - 48) / 2;
      case 'large': return screenWidth - 32;
      case 'full': return screenWidth - 32;
      default: return screenWidth - 32;
    }
  };

  const tabs: { key: TabType; label: string }[] = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'widgets', label: 'Widgets' },
    { key: 'layouts', label: 'Layouts' },
    { key: 'analytics', label: 'Analytics' },
  ];

  // Widget Renderers
  const renderABTestSummary = (data: ABTestSummary) => (
    <View className="gap-3">
      <View className="flex-row justify-between">
        <View className="flex-1">
          <Text className="text-muted text-xs">Total Tests</Text>
          <Text className="text-foreground text-xl font-bold">{data.totalTests}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-muted text-xs">Active</Text>
          <Text className="text-primary text-xl font-bold">{data.activeTests}</Text>
        </View>
      </View>
      <View className="flex-row justify-between">
        <View className="flex-1">
          <Text className="text-muted text-xs">Winners Found</Text>
          <Text className="text-success text-xl font-bold">{data.winnersIdentified}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-muted text-xs">Avg Lift</Text>
          <Text className="text-foreground text-xl font-bold">{data.avgLiftPercentage.toFixed(1)}%</Text>
        </View>
      </View>
    </View>
  );

  const renderRecentReports = (reports: ReportItem[]) => (
    <View className="gap-2">
      {reports.map((report) => (
        <View key={report.id} className="flex-row items-center py-2 border-b border-border">
          <View className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(report.status)}`} />
          <View className="flex-1">
            <Text className="text-foreground font-medium" numberOfLines={1}>{report.testName}</Text>
            <Text className="text-muted text-xs">
              {report.impressions.toLocaleString()} impressions
              {report.liftPercentage && ` • ${report.liftPercentage.toFixed(1)}% lift`}
            </Text>
          </View>
          {report.winningVariant && (
            <View className="bg-success/10 rounded px-2 py-0.5">
              <Text className="text-success text-xs">{report.winningVariant}</Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );

  const renderKeyMetrics = (metrics: KeyMetric[]) => (
    <View className="gap-3">
      {metrics.map((metric) => (
        <View key={metric.id} className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-muted text-xs">{metric.name}</Text>
            <View className="flex-row items-baseline">
              <Text className="text-foreground text-lg font-bold">
                {typeof metric.value === 'number' && metric.value >= 1000 
                  ? `${(metric.value / 1000).toFixed(1)}K` 
                  : metric.value}
              </Text>
              {metric.unit && <Text className="text-muted text-xs ml-1">{metric.unit}</Text>}
            </View>
          </View>
          <View className="flex-row items-center">
            <Text className={`font-medium ${getTrendColor(metric.trend)}`}>
              {getTrendIcon(metric.trend)} {Math.abs(metric.changePercentage).toFixed(1)}%
            </Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderPerformanceChart = (chartData: ChartDataPoint[]) => {
    const maxValue = Math.max(...chartData.map(d => d.value));
    
    return (
      <View className="gap-2">
        <View className="flex-row items-end justify-between h-24">
          {chartData.map((point, idx) => (
            <View key={idx} className="items-center flex-1">
              <View 
                className="w-6 bg-primary rounded-t"
                style={{ height: `${(point.value / maxValue) * 100}%` }}
              />
              <Text className="text-muted text-xs mt-1">{point.label}</Text>
            </View>
          ))}
        </View>
        <View className="flex-row justify-between pt-2 border-t border-border">
          <Text className="text-muted text-xs">Min: {Math.min(...chartData.map(d => d.value)).toFixed(1)}%</Text>
          <Text className="text-muted text-xs">Max: {maxValue.toFixed(1)}%</Text>
        </View>
      </View>
    );
  };

  const renderWinnerShowcase = (winner: WinnerShowcase) => (
    <View className="items-center">
      <View className="bg-success/10 rounded-full px-3 py-1 mb-2">
        <Text className="text-success font-medium">{winner.winningVariant}</Text>
      </View>
      <Text className="text-foreground font-semibold text-center" numberOfLines={2}>{winner.testName}</Text>
      <View className="flex-row items-center mt-2">
        <Text className="text-success text-2xl font-bold">+{winner.liftPercentage.toFixed(1)}%</Text>
      </View>
      <Text className="text-muted text-xs mt-1">{winner.confidence.toFixed(1)}% confidence</Text>
    </View>
  );

  const renderTrendIndicators = (trends: TrendData[]) => (
    <View className="gap-3">
      {trends.map((trend, idx) => (
        <View key={idx} className="flex-row items-center justify-between">
          <Text className="text-foreground text-sm">{trend.metricName}</Text>
          <View className="flex-row items-center">
            <Text className={`font-medium ${getTrendColor(trend.trend)}`}>
              {getTrendIcon(trend.trend)} {Math.abs(trend.changePercentage).toFixed(1)}%
            </Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderWidget = (widget: DashboardWidget) => {
    const { data } = widget;
    if (!data) return null;

    switch (widget.type) {
      case 'ab-test-summary':
        return data.summary ? renderABTestSummary(data.summary) : null;
      case 'recent-reports':
        return data.reports ? renderRecentReports(data.reports) : null;
      case 'key-metrics':
        return data.metrics ? renderKeyMetrics(data.metrics) : null;
      case 'performance-chart':
        return data.chartData ? renderPerformanceChart(data.chartData) : null;
      case 'winner-showcase':
        return data.winner ? renderWinnerShowcase(data.winner) : null;
      case 'trend-indicator':
        return data.trends ? renderTrendIndicators(data.trends) : null;
      default:
        return null;
    }
  };

  const renderDashboardTab = () => (
    <View className="flex-1">
      {/* Refresh Button */}
      <TouchableOpacity
        onPress={handleRefreshAll}
        disabled={isRefreshing}
        className={`bg-primary rounded-xl p-3 mb-4 ${isRefreshing ? 'opacity-50' : ''}`}
      >
        <Text className="text-background text-center font-semibold">
          {isRefreshing ? 'Refreshing...' : 'Refresh All Widgets'}
        </Text>
      </TouchableOpacity>

      {/* Widgets Grid */}
      <View className="flex-row flex-wrap gap-3">
        {widgets.map((widget) => (
          <View 
            key={widget.id} 
            className="bg-surface rounded-xl p-4"
            style={{ 
              width: widget.size === 'small' || widget.size === 'medium' 
                ? (screenWidth - 48) / 2 
                : screenWidth - 32 
            }}
          >
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-foreground font-semibold" numberOfLines={1}>{widget.title}</Text>
              <TouchableOpacity
                onPress={() => reportDashboardWidgetService.refreshWidget(widget.id)}
                className="p-1"
              >
                <Text className="text-primary text-xs">↻</Text>
              </TouchableOpacity>
            </View>
            {renderWidget(widget)}
            <Text className="text-muted text-xs mt-2">
              Updated {new Date(widget.lastUpdated).toLocaleTimeString()}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderWidgetsTab = () => (
    <View className="flex-1 gap-3">
      <Text className="text-muted mb-2">
        Manage which widgets appear on your dashboard.
      </Text>

      {reportDashboardWidgetService.getAllWidgets().map((widget) => (
        <View key={widget.id} className="bg-surface rounded-xl p-4">
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-1">
              <Text className="text-foreground font-semibold">{widget.title}</Text>
              <Text className="text-muted text-sm capitalize">{widget.type.replace(/-/g, ' ')}</Text>
            </View>
            <TouchableOpacity
              onPress={() => reportDashboardWidgetService.toggleWidgetVisibility(widget.id)}
              className={`px-3 py-1 rounded-full ${widget.isVisible ? 'bg-success/10' : 'bg-muted/10'}`}
            >
              <Text className={`text-sm font-medium ${widget.isVisible ? 'text-success' : 'text-muted'}`}>
                {widget.isVisible ? 'Visible' : 'Hidden'}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row flex-wrap gap-2 mt-2">
            <View className="bg-primary/10 rounded-lg px-2 py-1">
              <Text className="text-primary text-xs capitalize">{widget.size}</Text>
            </View>
            <View className="bg-muted/10 rounded-lg px-2 py-1">
              <Text className="text-muted text-xs">Refresh: {widget.refreshInterval}s</Text>
            </View>
            <View className="bg-muted/10 rounded-lg px-2 py-1">
              <Text className="text-muted text-xs">Row {widget.position.row}, Col {widget.position.col}</Text>
            </View>
          </View>

          {/* Size Controls */}
          <View className="flex-row gap-2 mt-3">
            {(['small', 'medium', 'large', 'full'] as WidgetSize[]).map((size) => (
              <TouchableOpacity
                key={size}
                onPress={() => reportDashboardWidgetService.resizeWidget(widget.id, size)}
                className={`flex-1 py-1 rounded ${widget.size === size ? 'bg-primary' : 'bg-muted/10'}`}
              >
                <Text className={`text-center text-xs capitalize ${widget.size === size ? 'text-background' : 'text-muted'}`}>
                  {size}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </View>
  );

  const renderLayoutsTab = () => (
    <View className="flex-1 gap-3">
      <Text className="text-muted mb-2">
        Save and switch between different dashboard layouts.
      </Text>

      {layouts.map((layout) => (
        <View key={layout.id} className="bg-surface rounded-xl p-4">
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-1">
              <View className="flex-row items-center">
                <Text className="text-foreground font-semibold">{layout.name}</Text>
                {layout.isDefault && (
                  <View className="bg-primary/10 rounded px-2 py-0.5 ml-2">
                    <Text className="text-primary text-xs">Default</Text>
                  </View>
                )}
              </View>
              <Text className="text-muted text-sm">{layout.description}</Text>
            </View>
          </View>

          <View className="flex-row gap-2 mt-2">
            <View className="bg-muted/10 rounded-lg px-2 py-1">
              <Text className="text-muted text-xs">{layout.widgets.length} widgets</Text>
            </View>
            <View className="bg-muted/10 rounded-lg px-2 py-1">
              <Text className="text-muted text-xs">{layout.columns}x{layout.rows} grid</Text>
            </View>
          </View>

          {!layout.isDefault && (
            <TouchableOpacity
              onPress={() => reportDashboardWidgetService.setDefaultLayout(layout.id)}
              className="bg-primary/10 rounded-lg py-2 mt-3"
            >
              <Text className="text-primary text-center font-medium">Set as Default</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      {/* Export/Import */}
      <View className="bg-surface rounded-xl p-4 mt-4">
        <Text className="text-lg font-semibold text-foreground mb-3">Export/Import</Text>
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => {
              const json = reportDashboardWidgetService.exportDashboard();
              console.log('Exported:', json);
            }}
            className="flex-1 bg-primary/10 rounded-lg py-2"
          >
            <Text className="text-primary text-center font-medium">Export Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderAnalyticsTab = () => (
    <View className="flex-1 gap-4">
      {analytics && (
        <>
          {/* Summary Cards */}
          <View className="flex-row gap-3">
            <View className="flex-1 bg-surface rounded-xl p-4">
              <Text className="text-muted text-sm">Total Widgets</Text>
              <Text className="text-foreground text-2xl font-bold">{analytics.totalWidgets}</Text>
            </View>
            <View className="flex-1 bg-surface rounded-xl p-4">
              <Text className="text-muted text-sm">Total Refreshes</Text>
              <Text className="text-foreground text-2xl font-bold">{analytics.totalRefreshes}</Text>
            </View>
          </View>

          {/* Performance Metrics */}
          <View className="bg-surface rounded-xl p-4">
            <Text className="text-lg font-semibold text-foreground mb-3">Performance</Text>
            <View className="gap-2">
              <View className="flex-row justify-between">
                <Text className="text-muted">Avg Refresh Time</Text>
                <Text className="text-foreground font-medium">{analytics.avgRefreshTime}ms</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-muted">Error Rate</Text>
                <Text className={`font-medium ${analytics.errorRate > 5 ? 'text-error' : 'text-success'}`}>
                  {analytics.errorRate.toFixed(2)}%
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-muted">Most Viewed</Text>
                <Text className="text-foreground font-medium">{analytics.mostViewedWidget}</Text>
              </View>
            </View>
          </View>

          {/* Widgets by Type */}
          <View className="bg-surface rounded-xl p-4">
            <Text className="text-lg font-semibold text-foreground mb-3">Widgets by Type</Text>
            <View className="gap-2">
              {Object.entries(analytics.widgetsByType).map(([type, count]) => (
                <View key={type} className="flex-row items-center justify-between">
                  <Text className="text-foreground capitalize">{type.replace(/-/g, ' ')}</Text>
                  <View className="bg-primary/10 rounded px-2 py-0.5">
                    <Text className="text-primary">{count}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Last Refresh */}
          <View className="bg-primary/10 rounded-xl p-4">
            <Text className="text-muted text-sm">Last Full Refresh</Text>
            <Text className="text-primary text-lg font-semibold">
              {new Date(analytics.lastFullRefresh).toLocaleString()}
            </Text>
          </View>
        </>
      )}
    </View>
  );

  return (
    <ScreenContainer className="p-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-foreground">Report Dashboard</Text>
          <Text className="text-muted mt-1">
            A/B test reports and key metrics at a glance
          </Text>
        </View>

        {/* Tab Navigation */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          <View className="flex-row gap-2">
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-full ${activeTab === tab.key ? 'bg-primary' : 'bg-surface'}`}
              >
                <Text className={`font-medium ${activeTab === tab.key ? 'text-background' : 'text-foreground'}`}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Tab Content */}
        {activeTab === 'dashboard' && renderDashboardTab()}
        {activeTab === 'widgets' && renderWidgetsTab()}
        {activeTab === 'layouts' && renderLayoutsTab()}
        {activeTab === 'analytics' && renderAnalyticsTab()}
      </ScrollView>
    </ScreenContainer>
  );
}
