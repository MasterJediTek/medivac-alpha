import { useState, useEffect } from "react";
import { ScrollView, Text, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { screenshotABTestingService } from "@/lib/services/screenshot-ab-testing-service";

export default function ABTestingScreen() {
  const router = useRouter();
  const colors = useColors();
  const [experiments, setExperiments] = useState<Awaited<ReturnType<typeof screenshotABTestingService.getAllTests>>>([]);
  const [analytics, setAnalytics] = useState<Awaited<ReturnType<typeof screenshotABTestingService.getAnalyticsSummary>> | null>(null);

  useEffect(() => {
    loadData();
    const unsubscribe = screenshotABTestingService.subscribe(loadData);
    return unsubscribe;
  }, []);

  const loadData = async () => {
    const [exps, stats] = await Promise.all([
      screenshotABTestingService.getAllTests(),
      screenshotABTestingService.getAnalyticsSummary(),
    ]);
    setExperiments(exps);
    setAnalytics(stats);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running": return "#22C55E";
      case "completed": return "#3B82F6";
      case "paused": return "#F59E0B";
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
          <Text className="text-2xl font-bold text-foreground">A/B Testing</Text>
          <Text className="text-muted mt-1">Screenshot variant experiments</Text>
        </View>

        {/* Analytics Summary */}
        {analytics && (
          <View className="mx-4 mt-4 bg-surface rounded-xl p-4 border border-border">
            <Text className="text-lg font-semibold text-foreground mb-3">Testing Analytics</Text>
            <View className="flex-row justify-between">
              <View className="items-center">
                <Text className="text-2xl font-bold text-primary">{analytics.totalTests}</Text>
                <Text className="text-xs text-muted">Experiments</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold" style={{ color: "#22C55E" }}>{analytics.runningTests}</Text>
                <Text className="text-xs text-muted">Running</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold" style={{ color: "#3B82F6" }}>{analytics.completedTests}</Text>
                <Text className="text-xs text-muted">Completed</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-primary">{analytics.averageImprovement.toFixed(1)}%</Text>
                <Text className="text-xs text-muted">Avg Lift</Text>
              </View>
            </View>
          </View>
        )}

        {/* Experiments List */}
        <View className="px-4 mt-4 pb-8">
          <Text className="text-lg font-semibold text-foreground mb-3">Active Experiments</Text>
          {experiments.map((exp: any) => (
            <View key={exp.id} className="mb-3 bg-surface rounded-xl p-4 border border-border">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-foreground font-semibold flex-1">{exp.name}</Text>
                <View 
                  style={{ backgroundColor: getStatusColor(exp.status) }}
                  className="px-2 py-1 rounded-full"
                >
                  <Text className="text-white text-xs font-medium capitalize">{exp.status}</Text>
                </View>
              </View>
              <Text className="text-muted text-sm mb-3">{exp.description}</Text>
              
              {/* Variants */}
              <View className="border-t border-border pt-3">
                <Text className="text-xs text-muted mb-2">Variants ({exp.variants.length})</Text>
                {exp.variants.map((variant: any, idx: number) => (
                  <View key={variant.id} className="flex-row items-center justify-between py-1">
                    <View className="flex-row items-center">
                      <View 
                        style={{ backgroundColor: idx === 0 ? "#3B82F6" : "#8B5CF6", width: 8, height: 8, borderRadius: 4 }}
                        className="mr-2"
                      />
                      <Text className="text-foreground text-sm">{variant.name}</Text>
                    </View>
                    <View className="flex-row items-center">
                      <Text className="text-muted text-xs mr-3">{variant.impressions} views</Text>
                      <Text className="text-foreground text-sm font-medium">{variant.conversionRate.toFixed(1)}%</Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Winner Badge */}
              {exp.winner && (
                <View className="mt-3 bg-success/10 rounded-lg p-2">
                  <Text className="text-success text-sm font-medium text-center">
                    🏆 Winner: {exp.variants.find((v: any) => v.id === exp.winner)?.name}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
