/**
 * Playbook Analytics Dashboard Screen
 * Track execution metrics, response times, and success rates
 * MediVac One v5.5
 */

import { useState, useEffect } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import {
  playbookAnalyticsService,
  type AnalyticsSummary,
  type PlaybookExecution,
  type ThreatType,
  type Severity,
  THREAT_TYPE_CONFIG,
  SEVERITY_CONFIG,
} from "@/lib/services/playbook-analytics-service";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type TimeRange = "7d" | "30d" | "90d" | "all";

export default function PlaybookAnalyticsScreen() {
  const colors = useColors();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [selectedTab, setSelectedTab] = useState<"overview" | "threats" | "history">("overview");

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      await playbookAnalyticsService.initialize();
      
      const filters: { startDate?: string } = {};
      if (timeRange !== "all") {
        const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        filters.startDate = startDate.toISOString();
      }
      
      setSummary(playbookAnalyticsService.getAnalyticsSummary(filters));
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  const renderStatCard = (
    title: string,
    value: string,
    subtitle?: string,
    color?: string,
    icon?: string
  ) => (
    <View className="bg-surface rounded-xl p-4 border border-border flex-1 min-w-[140px]">
      <View className="flex-row items-center gap-2 mb-2">
        {icon && <Text style={{ fontSize: 16 }}>{icon}</Text>}
        <Text className="text-muted text-xs">{title}</Text>
      </View>
      <Text
        className="text-2xl font-bold"
        style={{ color: color || colors.foreground }}
      >
        {value}
      </Text>
      {subtitle && (
        <Text className="text-muted text-xs mt-1">{subtitle}</Text>
      )}
    </View>
  );

  const renderBarChart = (
    data: { label: string; value: number; color: string }[],
    maxValue: number
  ) => {
    if (maxValue === 0) maxValue = 1;
    return (
      <View className="gap-2">
        {data.map((item, index) => (
          <View key={index} className="flex-row items-center gap-3">
            <Text className="text-muted text-xs w-24" numberOfLines={1}>
              {item.label}
            </Text>
            <View className="flex-1 h-6 bg-background rounded-full overflow-hidden">
              <View
                className="h-full rounded-full"
                style={{
                  width: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: item.color,
                }}
              />
            </View>
            <Text className="text-foreground text-xs w-8 text-right">{item.value}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderTrendChart = () => {
    if (!summary || summary.trendsDaily.length === 0) return null;

    const maxExec = Math.max(...summary.trendsDaily.map(t => t.executions), 1);
    const chartHeight = 100;

    return (
      <View className="bg-surface rounded-xl p-4 border border-border">
        <Text className="text-foreground font-semibold mb-4">Daily Trend (7 Days)</Text>
        <View className="flex-row items-end justify-between" style={{ height: chartHeight }}>
          {summary.trendsDaily.map((point, index) => {
            const height = (point.executions / maxExec) * chartHeight;
            const date = new Date(point.date);
            const dayLabel = date.toLocaleDateString("en", { weekday: "short" });
            
            return (
              <View key={index} className="items-center flex-1">
                <View
                  className="w-6 rounded-t"
                  style={{
                    height: Math.max(height, 4),
                    backgroundColor: point.successRate >= 80 ? colors.success : 
                      point.successRate >= 50 ? colors.warning : colors.error,
                  }}
                />
                <Text className="text-muted text-[10px] mt-1">{dayLabel}</Text>
                <Text className="text-foreground text-[10px] font-medium">{point.executions}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderExecutionItem = (execution: PlaybookExecution) => {
    const threatConfig = THREAT_TYPE_CONFIG[execution.threatType];
    const severityConfig = SEVERITY_CONFIG[execution.severity];
    
    const statusColors: Record<string, string> = {
      completed: colors.success,
      failed: colors.error,
      running: colors.primary,
      cancelled: colors.muted,
      partial: colors.warning,
    };

    return (
      <View
        key={execution.id}
        className="bg-surface rounded-xl p-4 mb-3 border border-border"
      >
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Text style={{ fontSize: 14 }}>{threatConfig.icon}</Text>
              <Text className="text-foreground font-medium flex-1" numberOfLines={1}>
                {execution.playbookName}
              </Text>
            </View>
            <Text className="text-muted text-xs mt-1">
              {new Date(execution.startedAt).toLocaleString()}
            </Text>
          </View>
          <View
            className="px-2 py-1 rounded-full"
            style={{ backgroundColor: statusColors[execution.status] + "20" }}
          >
            <Text
              style={{
                color: statusColors[execution.status],
                fontSize: 10,
                fontWeight: "600",
                textTransform: "uppercase",
              }}
            >
              {execution.status}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-4">
          <View className="flex-row items-center gap-1">
            <View
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: severityConfig.color }}
            />
            <Text className="text-muted text-xs">{severityConfig.label}</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <IconSymbol name="clock.fill" size={10} color={colors.muted} />
            <Text className="text-muted text-xs">
              {execution.duration ? formatDuration(execution.duration) : "N/A"}
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <IconSymbol name="checkmark.circle.fill" size={10} color={colors.muted} />
            <Text className="text-muted text-xs">
              {execution.actionsCompleted}/{execution.actionsTotal} actions
            </Text>
          </View>
          <View
            className="px-2 py-0.5 rounded"
            style={{ backgroundColor: colors.muted + "20" }}
          >
            <Text className="text-muted text-[10px]">{execution.triggeredBy}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderOverviewTab = () => {
    if (!summary) return null;

    return (
      <>
        {/* Key Metrics */}
        <View className="flex-row gap-3 mb-4">
          {renderStatCard(
            "Total Executions",
            summary.totalExecutions.toString(),
            undefined,
            colors.primary,
            "📊"
          )}
          {renderStatCard(
            "Success Rate",
            formatPercentage(summary.successRate),
            undefined,
            summary.successRate >= 80 ? colors.success : colors.warning,
            "✓"
          )}
        </View>

        <View className="flex-row gap-3 mb-4">
          {renderStatCard(
            "Avg Response",
            formatDuration(summary.averageResponseTime),
            undefined,
            colors.primary,
            "⏱️"
          )}
          {renderStatCard(
            "Active Now",
            summary.executionsByStatus.running.toString(),
            undefined,
            colors.warning,
            "🔄"
          )}
        </View>

        {/* Trend Chart */}
        {renderTrendChart()}

        {/* Execution by Status */}
        <View className="bg-surface rounded-xl p-4 border border-border mt-4">
          <Text className="text-foreground font-semibold mb-4">Execution Status</Text>
          {renderBarChart(
            [
              { label: "Completed", value: summary.executionsByStatus.completed, color: colors.success },
              { label: "Failed", value: summary.executionsByStatus.failed, color: colors.error },
              { label: "Running", value: summary.executionsByStatus.running, color: colors.primary },
              { label: "Partial", value: summary.executionsByStatus.partial, color: colors.warning },
              { label: "Cancelled", value: summary.executionsByStatus.cancelled, color: colors.muted },
            ],
            Math.max(...Object.values(summary.executionsByStatus))
          )}
        </View>

        {/* Trigger Distribution */}
        <View className="bg-surface rounded-xl p-4 border border-border mt-4">
          <Text className="text-foreground font-semibold mb-4">Trigger Type</Text>
          <View className="flex-row gap-4">
            {Object.entries(summary.executionsByTrigger).map(([trigger, count]) => (
              <View key={trigger} className="items-center flex-1">
                <Text className="text-2xl font-bold text-foreground">{count}</Text>
                <Text className="text-muted text-xs capitalize">{trigger}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Top Playbooks */}
        <View className="bg-surface rounded-xl p-4 border border-border mt-4">
          <Text className="text-foreground font-semibold mb-4">Top Playbooks</Text>
          {summary.topPlaybooks.length === 0 ? (
            <Text className="text-muted text-center py-4">No playbook data</Text>
          ) : (
            summary.topPlaybooks.map((playbook, index) => (
              <View
                key={playbook.playbookId}
                className="flex-row items-center py-2 border-b border-border"
                style={{ borderBottomWidth: index === summary.topPlaybooks.length - 1 ? 0 : 1 }}
              >
                <Text className="text-muted w-6">{index + 1}.</Text>
                <Text className="flex-1 text-foreground">{playbook.playbookName}</Text>
                <Text className="text-muted text-sm">{playbook.totalExecutions} runs</Text>
                <Text
                  className="ml-3 text-sm font-medium"
                  style={{
                    color: playbook.successRate >= 80 ? colors.success : colors.warning,
                  }}
                >
                  {formatPercentage(playbook.successRate)}
                </Text>
              </View>
            ))
          )}
        </View>
      </>
    );
  };

  const renderThreatsTab = () => {
    if (!summary) return null;

    const threatData = Object.entries(summary.executionsByThreatType)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({
        type: type as ThreatType,
        count,
        config: THREAT_TYPE_CONFIG[type as ThreatType],
      }));

    const severityData = Object.entries(summary.executionsBySeverity)
      .filter(([_, count]) => count > 0)
      .map(([severity, count]) => ({
        severity: severity as Severity,
        count,
        config: SEVERITY_CONFIG[severity as Severity],
      }));

    return (
      <>
        {/* Severity Distribution */}
        <View className="bg-surface rounded-xl p-4 border border-border mb-4">
          <Text className="text-foreground font-semibold mb-4">By Severity</Text>
          <View className="flex-row gap-3">
            {severityData.map(({ severity, count, config }) => (
              <View
                key={severity}
                className="flex-1 items-center p-3 rounded-xl"
                style={{ backgroundColor: config.color + "15" }}
              >
                <Text className="text-2xl font-bold" style={{ color: config.color }}>
                  {count}
                </Text>
                <Text className="text-xs mt-1" style={{ color: config.color }}>
                  {config.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Threat Type Breakdown */}
        <View className="bg-surface rounded-xl p-4 border border-border">
          <Text className="text-foreground font-semibold mb-4">By Threat Type</Text>
          {threatData.length === 0 ? (
            <Text className="text-muted text-center py-4">No threat data</Text>
          ) : (
            threatData.map(({ type, count, config }) => (
              <View
                key={type}
                className="flex-row items-center py-3 border-b border-border"
              >
                <Text style={{ fontSize: 20, marginRight: 12 }}>{config.icon}</Text>
                <View className="flex-1">
                  <Text className="text-foreground font-medium">{config.label}</Text>
                  <View className="h-2 bg-background rounded-full mt-2 overflow-hidden">
                    <View
                      className="h-full rounded-full"
                      style={{
                        width: `${(count / summary.totalExecutions) * 100}%`,
                        backgroundColor: config.color,
                      }}
                    />
                  </View>
                </View>
                <View className="items-end ml-4">
                  <Text className="text-foreground font-bold">{count}</Text>
                  <Text className="text-muted text-xs">
                    {formatPercentage((count / summary.totalExecutions) * 100)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </>
    );
  };

  const renderHistoryTab = () => {
    if (!summary) return null;

    return (
      <>
        <Text className="text-muted text-sm mb-4">
          Showing {summary.recentExecutions.length} recent executions
        </Text>
        {summary.recentExecutions.length === 0 ? (
          <View className="py-12 items-center">
            <Text style={{ fontSize: 48, marginBottom: 12 }}>📋</Text>
            <Text className="text-foreground font-semibold">No Executions</Text>
            <Text className="text-muted text-center mt-2">
              No playbook executions recorded yet
            </Text>
          </View>
        ) : (
          summary.recentExecutions.map(renderExecutionItem)
        )}
      </>
    );
  };

  return (
    <ScreenContainer className="flex-1">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-5 pt-4 pb-4">
          <Text className="text-foreground text-2xl font-bold">Playbook Analytics</Text>
          <Text className="text-muted text-sm mt-1">
            Track execution metrics and response times
          </Text>
        </View>

        {/* Time Range Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-5 mb-4"
          contentContainerStyle={{ gap: 8 }}
        >
          {(["7d", "30d", "90d", "all"] as TimeRange[]).map((range) => (
            <TouchableOpacity
              key={range}
              className="px-4 py-2 rounded-full"
              style={{
                backgroundColor: timeRange === range ? colors.primary : colors.surface,
                borderWidth: 1,
                borderColor: timeRange === range ? colors.primary : colors.border,
              }}
              onPress={() => setTimeRange(range)}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  color: timeRange === range ? "#FFFFFF" : colors.foreground,
                  fontWeight: "600",
                  fontSize: 13,
                }}
              >
                {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : range === "90d" ? "90 Days" : "All Time"}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Tab Selector */}
        <View className="flex-row px-5 mb-4 gap-2">
          {(["overview", "threats", "history"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              className="flex-1 py-3 rounded-xl items-center"
              style={{
                backgroundColor: selectedTab === tab ? colors.primary + "20" : colors.surface,
                borderWidth: 1,
                borderColor: selectedTab === tab ? colors.primary : colors.border,
              }}
              onPress={() => setSelectedTab(tab)}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  color: selectedTab === tab ? colors.primary : colors.foreground,
                  fontWeight: "600",
                  fontSize: 13,
                  textTransform: "capitalize",
                }}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        <View className="px-5 pb-8">
          {loading ? (
            <View className="py-12 items-center">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="text-muted mt-4">Loading analytics...</Text>
            </View>
          ) : (
            <>
              {selectedTab === "overview" && renderOverviewTab()}
              {selectedTab === "threats" && renderThreatsTab()}
              {selectedTab === "history" && renderHistoryTab()}
            </>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
