import { ScrollView, Text, View, TouchableOpacity, FlatList } from "react-native";
import { useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useRouter } from "expo-router";

interface HealthOutcome {
  id: string;
  patientName: string;
  patientId: string;
  condition: string;
  startDate: string;
  currentStatus: "improving" | "stable" | "declining" | "resolved";
  lastUpdate: string;
  metrics: OutcomeMetric[];
}

interface OutcomeMetric {
  name: string;
  baseline: number;
  current: number;
  target: number;
  unit: string;
  trend: "up" | "down" | "stable";
}

interface TrackerStat {
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
}

export default function WongiScreen() {
  const colors = useColors();
  const router = useRouter();
  const [expandedOutcome, setExpandedOutcome] = useState<string | null>(null);

  const outcomes: HealthOutcome[] = [
    {
      id: "1",
      patientName: "John Doe",
      patientId: "P001",
      condition: "Type 2 Diabetes",
      startDate: "Jan 10, 2026",
      currentStatus: "improving",
      lastUpdate: "2 hours ago",
      metrics: [
        { name: "HbA1c", baseline: 9.5, current: 7.8, target: 7.0, unit: "%", trend: "down" },
        { name: "Fasting Glucose", baseline: 180, current: 130, target: 100, unit: "mg/dL", trend: "down" },
        { name: "Weight", baseline: 95, current: 90, target: 85, unit: "kg", trend: "down" },
      ]
    },
    {
      id: "2",
      patientName: "Sarah Johnson",
      patientId: "P002",
      condition: "Hypertension",
      startDate: "Dec 15, 2025",
      currentStatus: "stable",
      lastUpdate: "1 day ago",
      metrics: [
        { name: "Systolic BP", baseline: 160, current: 135, target: 120, unit: "mmHg", trend: "down" },
        { name: "Diastolic BP", baseline: 100, current: 85, target: 80, unit: "mmHg", trend: "stable" },
        { name: "Heart Rate", baseline: 88, current: 75, target: 70, unit: "bpm", trend: "down" },
      ]
    },
    {
      id: "3",
      patientName: "Mike Wilson",
      patientId: "P003",
      condition: "Cardiac Arrhythmia",
      startDate: "Jan 20, 2026",
      currentStatus: "declining",
      lastUpdate: "30 min ago",
      metrics: [
        { name: "Heart Rate Variability", baseline: 45, current: 38, target: 50, unit: "ms", trend: "down" },
        { name: "Irregular Beats", baseline: 15, current: 22, target: 5, unit: "/hr", trend: "up" },
      ]
    },
    {
      id: "4",
      patientName: "Emily Chen",
      patientId: "P004",
      condition: "Asthma",
      startDate: "Nov 1, 2025",
      currentStatus: "resolved",
      lastUpdate: "1 week ago",
      metrics: [
        { name: "Peak Flow", baseline: 350, current: 480, target: 450, unit: "L/min", trend: "up" },
        { name: "Rescue Inhaler Use", baseline: 4, current: 0, target: 0, unit: "/week", trend: "down" },
      ]
    },
  ];

  const stats: TrackerStat[] = [
    { label: "Active Tracking", value: "156", change: "+12", isPositive: true },
    { label: "Improving", value: "89", change: "+8", isPositive: true },
    { label: "Stable", value: "45", change: "+2", isPositive: true },
    { label: "Needs Attention", value: "22", change: "-3", isPositive: true },
  ];

  const getStatusColor = (status: HealthOutcome["currentStatus"]) => {
    switch (status) {
      case "improving": return colors.success;
      case "stable": return colors.primary;
      case "declining": return colors.error;
      case "resolved": return colors.muted;
    }
  };

  const getTrendIcon = (trend: OutcomeMetric["trend"]) => {
    switch (trend) {
      case "up": return "arrow.up.right";
      case "down": return "arrow.up.right"; // Will rotate
      case "stable": return "arrow.up.right"; // Will show as horizontal
    }
  };

  const getProgressPercentage = (baseline: number, current: number, target: number) => {
    const totalChange = Math.abs(target - baseline);
    const currentChange = Math.abs(current - baseline);
    return Math.min(100, Math.round((currentChange / totalChange) * 100));
  };

  const renderOutcome = ({ item }: { item: HealthOutcome }) => {
    const isExpanded = expandedOutcome === item.id;
    
    return (
      <TouchableOpacity 
        className="bg-surface rounded-2xl mb-3 overflow-hidden"
        onPress={() => setExpandedOutcome(isExpanded ? null : item.id)}
        activeOpacity={0.7}
      >
        <View className="p-4">
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-1">
              <Text className="text-foreground font-semibold text-base">{item.patientName}</Text>
              <Text className="text-muted text-sm">{item.condition}</Text>
            </View>
            <View 
              className="px-2 py-1 rounded-full"
              style={{ backgroundColor: getStatusColor(item.currentStatus) + '20' }}
            >
              <Text style={{ color: getStatusColor(item.currentStatus), fontSize: 11, fontWeight: '600', textTransform: 'capitalize' }}>
                {item.currentStatus}
              </Text>
            </View>
          </View>
          
          <View className="flex-row items-center justify-between">
            <Text className="text-muted text-xs">Started: {item.startDate}</Text>
            <Text className="text-muted text-xs">Updated: {item.lastUpdate}</Text>
          </View>
        </View>
        
        {isExpanded && (
          <View className="border-t px-4 py-3" style={{ borderTopColor: colors.border, backgroundColor: colors.background }}>
            <Text className="text-foreground font-semibold mb-3">Outcome Metrics</Text>
            {item.metrics.map((metric, index) => {
              const progress = getProgressPercentage(metric.baseline, metric.current, metric.target);
              const isImproving = (metric.trend === "down" && metric.target < metric.baseline) || 
                                 (metric.trend === "up" && metric.target > metric.baseline);
              
              return (
                <View 
                  key={index}
                  className="mb-4"
                >
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-foreground font-medium">{metric.name}</Text>
                    <View className="flex-row items-center gap-1">
                      <Text 
                        className="font-bold"
                        style={{ color: isImproving ? colors.success : colors.warning }}
                      >
                        {metric.current} {metric.unit}
                      </Text>
                      <View style={{ transform: [{ rotate: metric.trend === "down" ? "90deg" : metric.trend === "up" ? "-45deg" : "0deg" }] }}>
                        <IconSymbol 
                          name="arrow.up.right" 
                          size={14} 
                          color={isImproving ? colors.success : colors.warning} 
                        />
                      </View>
                    </View>
                  </View>
                  
                  <View className="h-2 bg-border rounded-full overflow-hidden mb-1">
                    <View 
                      className="h-full rounded-full"
                      style={{ 
                        width: `${progress}%`,
                        backgroundColor: isImproving ? colors.success : colors.warning,
                      }}
                    />
                  </View>
                  
                  <View className="flex-row justify-between">
                    <Text className="text-muted text-xs">Baseline: {metric.baseline}</Text>
                    <Text className="text-muted text-xs">Target: {metric.target}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer className="flex-1">
      {/* Header */}
      <View className="px-5 pt-4 pb-2">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
              <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <View>
              <Text className="text-foreground text-2xl font-bold">WONGI Tracker</Text>
              <Text className="text-muted text-sm">Health Outcomes Monitoring</Text>
            </View>
          </View>
          <TouchableOpacity 
            className="w-10 h-10 rounded-full bg-primary items-center justify-center"
            activeOpacity={0.7}
          >
            <IconSymbol name="plus" size={24} color={colors.background} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Grid */}
        <View className="px-5 mb-6">
          <View className="flex-row flex-wrap gap-3">
            {stats.map((stat, index) => (
              <View 
                key={index}
                className="bg-surface rounded-2xl p-4 flex-1 min-w-[45%]"
              >
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-foreground text-2xl font-bold">{stat.value}</Text>
                  <View 
                    className="px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: stat.isPositive ? colors.success + '20' : colors.error + '20' }}
                  >
                    <Text style={{ color: stat.isPositive ? colors.success : colors.error, fontSize: 11, fontWeight: '600' }}>
                      {stat.change}
                    </Text>
                  </View>
                </View>
                <Text className="text-muted text-sm">{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Connection Status */}
        <View className="px-5 mb-6">
          <View 
            className="rounded-2xl p-4 flex-row items-center justify-between"
            style={{ backgroundColor: colors.success + '15' }}
          >
            <View className="flex-row items-center gap-3">
              <View 
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.success + '30' }}
              >
                <IconSymbol name="globe" size={22} color={colors.success} />
              </View>
              <View>
                <Text className="text-foreground font-semibold">WONGI System</Text>
                <Text className="text-success text-sm">Connected • Real-time sync</Text>
              </View>
            </View>
            <TouchableOpacity 
              className="px-3 py-2 rounded-full"
              style={{ backgroundColor: colors.success }}
              activeOpacity={0.7}
            >
              <Text className="text-background text-sm font-semibold">Sync</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Outcomes List */}
        <View className="px-5">
          <Text className="text-foreground text-lg font-semibold mb-3">Active Outcomes</Text>
          <FlatList
            data={outcomes}
            renderItem={renderOutcome}
            keyExtractor={item => item.id}
            scrollEnabled={false}
            ListEmptyComponent={
              <View className="items-center py-10">
                <IconSymbol name="heart.fill" size={48} color={colors.muted} />
                <Text className="text-muted text-base mt-3">No outcomes being tracked</Text>
              </View>
            }
          />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
