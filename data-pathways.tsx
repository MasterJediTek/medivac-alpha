import { useState, useEffect } from "react";
import { ScrollView, Text, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { dataPathwayService, PathwayType } from "@/lib/services/data-pathway-service";
import { DATA_PATHWAY_COLORS } from "@/lib/services/color-chart-service";

export default function DataPathwaysScreen() {
  const router = useRouter();
  const colors = useColors();
  const [systemHealth, setSystemHealth] = useState(dataPathwayService.getSystemHealth());
  const [pathwayHealth, setPathwayHealth] = useState(dataPathwayService.getAllPathwayHealth());
  const [summaryStats, setSummaryStats] = useState(dataPathwayService.getSummaryStats());

  useEffect(() => {
    const unsubscribe = dataPathwayService.subscribe(() => {
      setSystemHealth(dataPathwayService.getSystemHealth());
      setPathwayHealth(dataPathwayService.getAllPathwayHealth());
      setSummaryStats(dataPathwayService.getSummaryStats());
    });
    return unsubscribe;
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy": return "#22C55E";
      case "degraded": return "#F59E0B";
      case "offline": return "#DC2626";
      default: return "#6B7280";
    }
  };

  return (
    <ScreenContainer>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-4 pt-4 pb-2">
          <Pressable onPress={() => router.back()} className="mb-4">
            <Text className="text-primary text-base">← Back</Text>
          </Pressable>
          <Text className="text-2xl font-bold text-foreground">Data Pathways</Text>
          <Text className="text-muted mt-1">Real-time data flow visualization</Text>
        </View>

        {/* System Health Overview */}
        <View className="mx-4 mt-4 bg-surface rounded-xl p-4 border border-border">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-semibold text-foreground">System Health</Text>
            <View className="flex-row items-center">
              <View 
                style={{ backgroundColor: getStatusColor(systemHealth.overallStatus), width: 12, height: 12, borderRadius: 6 }} 
                className="mr-2"
              />
              <Text className="text-foreground font-medium capitalize">{systemHealth.overallStatus}</Text>
            </View>
          </View>
          <View className="flex-row justify-between">
            <View className="items-center">
              <Text className="text-xl font-bold" style={{ color: "#22C55E" }}>{systemHealth.healthyPathways}</Text>
              <Text className="text-xs text-muted">Healthy</Text>
            </View>
            <View className="items-center">
              <Text className="text-xl font-bold" style={{ color: "#F59E0B" }}>{systemHealth.degradedPathways}</Text>
              <Text className="text-xs text-muted">Degraded</Text>
            </View>
            <View className="items-center">
              <Text className="text-xl font-bold" style={{ color: "#DC2626" }}>{systemHealth.offlinePathways}</Text>
              <Text className="text-xs text-muted">Offline</Text>
            </View>
            <View className="items-center">
              <Text className="text-xl font-bold text-primary">{summaryStats.averageLatency}</Text>
              <Text className="text-xs text-muted">Avg Latency</Text>
            </View>
          </View>
        </View>

        {/* Summary Stats */}
        <View className="mx-4 mt-4 bg-surface rounded-xl p-4 border border-border">
          <Text className="text-lg font-semibold text-foreground mb-3">Flow Statistics</Text>
          <View className="flex-row justify-between">
            <View className="items-center flex-1">
              <Text className="text-2xl font-bold text-primary">{summaryStats.totalFlowEvents}</Text>
              <Text className="text-xs text-muted text-center">Total Events</Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-2xl font-bold text-primary">{summaryStats.totalDataTransferred}</Text>
              <Text className="text-xs text-muted text-center">Data Transferred</Text>
            </View>
            <View className="items-center flex-1">
              <Text className="text-2xl font-bold" style={{ color: "#22C55E" }}>{summaryStats.systemUptime}</Text>
              <Text className="text-xs text-muted text-center">Uptime</Text>
            </View>
          </View>
        </View>

        {/* Pathway List */}
        <View className="px-4 mt-4 pb-8">
          <Text className="text-lg font-semibold text-foreground mb-3">Active Pathways</Text>
          {pathwayHealth.map((health) => {
            const pathwayInfo = DATA_PATHWAY_COLORS[health.pathway];
            return (
              <View key={health.pathway} className="mb-3">
                <View 
                  style={{ borderLeftColor: pathwayInfo.hex, borderLeftWidth: 4 }}
                  className="bg-surface rounded-xl p-4 border border-border"
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center">
                      <View 
                        style={{ backgroundColor: pathwayInfo.hex, width: 32, height: 32, borderRadius: 8 }} 
                        className="mr-3 items-center justify-center"
                      >
                        <Text className="text-white text-xs font-bold">
                          {health.pathway.substring(0, 2).toUpperCase()}
                        </Text>
                      </View>
                      <View>
                        <Text className="text-foreground font-semibold">{pathwayInfo.name}</Text>
                        <Text className="text-muted text-xs">{pathwayInfo.description}</Text>
                      </View>
                    </View>
                    <View 
                      style={{ backgroundColor: getStatusColor(health.status), width: 10, height: 10, borderRadius: 5 }} 
                    />
                  </View>
                  <View className="flex-row justify-between mt-2 pt-2 border-t border-border">
                    <View>
                      <Text className="text-xs text-muted">Latency</Text>
                      <Text className="text-sm font-medium text-foreground">{health.latency.toFixed(1)}ms</Text>
                    </View>
                    <View>
                      <Text className="text-xs text-muted">Error Rate</Text>
                      <Text className="text-sm font-medium text-foreground">{health.errorRate.toFixed(2)}%</Text>
                    </View>
                    <View>
                      <Text className="text-xs text-muted">Uptime</Text>
                      <Text className="text-sm font-medium" style={{ color: "#22C55E" }}>{health.uptime.toFixed(2)}%</Text>
                    </View>
                    <View>
                      <Text className="text-xs text-muted">Speed</Text>
                      <Text className="text-sm font-medium text-foreground">{pathwayInfo.speed}</Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
