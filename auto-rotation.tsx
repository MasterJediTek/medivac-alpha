/**
 * A/B Test Auto-Rotation Screen
 * MediVac WACHS v8.3
 */

import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import {
  abTestRotationService,
  RotationSchedule,
  RotationVariant,
  RotationEvent,
  RotationAnalytics,
} from "@/lib/services/ab-test-rotation-service";

export default function AutoRotationScreen() {
  const colors = useColors();
  const router = useRouter();
  const [schedules, setSchedules] = useState<RotationSchedule[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<string | null>(null);
  const [variants, setVariants] = useState<RotationVariant[]>([]);
  const [history, setHistory] = useState<RotationEvent[]>([]);
  const [analytics, setAnalytics] = useState<RotationAnalytics | null>(null);

  useEffect(() => {
    loadSchedules();
  }, []);

  useEffect(() => {
    if (selectedSchedule) {
      loadScheduleDetails(selectedSchedule);
    }
  }, [selectedSchedule]);

  const loadSchedules = () => {
    const allSchedules = abTestRotationService.getAllSchedules();
    setSchedules(allSchedules);
    if (allSchedules.length > 0 && !selectedSchedule) {
      setSelectedSchedule(allSchedules[0].id);
    }
  };

  const loadScheduleDetails = (scheduleId: string) => {
    setVariants(abTestRotationService.getVariants(scheduleId));
    setHistory(abTestRotationService.getRotationHistory(scheduleId));
    setAnalytics(abTestRotationService.getAnalytics(scheduleId));
  };

  const toggleSchedule = (scheduleId: string, enabled: boolean) => {
    abTestRotationService.updateSchedule(scheduleId, { isEnabled: enabled });
    loadSchedules();
  };

  const triggerRotation = (scheduleId: string) => {
    abTestRotationService.performRotation(scheduleId);
    loadScheduleDetails(scheduleId);
  };

  const renderScheduleCard = (schedule: RotationSchedule) => {
    const isSelected = selectedSchedule === schedule.id;

    return (
      <TouchableOpacity
        key={schedule.id}
        style={[
          styles.scheduleCard,
          {
            backgroundColor: colors.surface,
            borderColor: isSelected ? colors.primary : colors.border,
            borderWidth: isSelected ? 2 : 1,
          },
        ]}
        onPress={() => setSelectedSchedule(schedule.id)}
      >
        <View style={styles.scheduleHeader}>
          <Text style={[styles.scheduleName, { color: colors.foreground }]}>
            {schedule.name}
          </Text>
          <Switch
            value={schedule.isEnabled}
            onValueChange={(value) => toggleSchedule(schedule.id, value)}
            trackColor={{ true: colors.primary }}
          />
        </View>
        <View style={styles.scheduleDetails}>
          <Text style={[styles.scheduleStrategy, { color: colors.primary }]}>
            {schedule.strategy.replace("_", " ").toUpperCase()}
          </Text>
          <Text style={[styles.scheduleInterval, { color: colors.muted }]}>
            Interval: {Math.round(schedule.rotationInterval / 3600000)}h
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderVariantCard = (variant: RotationVariant) => (
    <View
      key={variant.id}
      style={[
        styles.variantCard,
        {
          backgroundColor: colors.surface,
          borderColor: variant.isActive ? colors.success : colors.border,
          borderWidth: variant.isActive ? 2 : 1,
        },
      ]}
    >
      <View style={styles.variantHeader}>
        <Text style={[styles.variantName, { color: colors.foreground }]}>
          {variant.name}
        </Text>
        {variant.isActive && (
          <View style={[styles.activeBadge, { backgroundColor: colors.success }]}>
            <Text style={styles.activeBadgeText}>ACTIVE</Text>
          </View>
        )}
      </View>

      <View style={styles.variantStats}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {variant.impressions.toLocaleString()}
          </Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>
            Impressions
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.success }]}>
            {variant.installs.toLocaleString()}
          </Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>
            Installs
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.warning }]}>
            {variant.conversionRate.toFixed(2)}%
          </Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>
            Conversion
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.foreground }]}>
            {variant.performanceScore}
          </Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>
            Score
          </Text>
        </View>
      </View>

      <View style={styles.weightBar}>
        <View
          style={[
            styles.weightFill,
            { backgroundColor: colors.primary, width: `${variant.weight}%` },
          ]}
        />
      </View>
      <Text style={[styles.weightLabel, { color: colors.muted }]}>
        Weight: {variant.weight}%
      </Text>
    </View>
  );

  const renderHistoryItem = (event: RotationEvent, index: number) => (
    <View
      key={event.id}
      style={[styles.historyItem, { backgroundColor: colors.surface }]}
    >
      <View style={styles.historyHeader}>
        <Text style={[styles.historyStrategy, { color: colors.primary }]}>
          {event.strategy.toUpperCase()}
        </Text>
        <Text style={[styles.historyTime, { color: colors.muted }]}>
          {new Date(event.timestamp).toLocaleTimeString()}
        </Text>
      </View>
      <Text style={[styles.historyReason, { color: colors.foreground }]}>
        {event.reason}
      </Text>
      <Text style={[styles.historyPath, { color: colors.muted }]}>
        {event.fromVariantId || "None"} → {event.toVariantId}
      </Text>
    </View>
  );

  return (
    <ScreenContainer>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.backButton, { color: colors.primary }]}>
              ← Back
            </Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Auto-Rotation
          </Text>
        </View>

        {/* Schedules */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Rotation Schedules
        </Text>
        {schedules.map(renderScheduleCard)}

        {/* Manual Rotation */}
        {selectedSchedule && (
          <TouchableOpacity
            style={[styles.rotateButton, { backgroundColor: colors.primary }]}
            onPress={() => triggerRotation(selectedSchedule)}
          >
            <Text style={styles.rotateButtonText}>Trigger Manual Rotation</Text>
          </TouchableOpacity>
        )}

        {/* Analytics */}
        {analytics && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Rotation Analytics
            </Text>
            <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
              <View style={styles.analyticsGrid}>
                <View style={styles.analyticsItem}>
                  <Text style={[styles.analyticsValue, { color: colors.primary }]}>
                    {analytics.totalRotations}
                  </Text>
                  <Text style={[styles.analyticsLabel, { color: colors.muted }]}>
                    Rotations
                  </Text>
                </View>
                <View style={styles.analyticsItem}>
                  <Text style={[styles.analyticsValue, { color: colors.success }]}>
                    {analytics.overallConversionRate.toFixed(2)}%
                  </Text>
                  <Text style={[styles.analyticsLabel, { color: colors.muted }]}>
                    Conversion
                  </Text>
                </View>
              </View>
              <View style={styles.analyticsDivider} />
              <View style={styles.analyticsRow}>
                <Text style={[styles.analyticsRowLabel, { color: colors.muted }]}>
                  Best Performer
                </Text>
                <Text style={[styles.analyticsRowValue, { color: colors.success }]}>
                  {analytics.bestPerformingVariant}
                </Text>
              </View>
              <View style={styles.analyticsRow}>
                <Text style={[styles.analyticsRowLabel, { color: colors.muted }]}>
                  Needs Improvement
                </Text>
                <Text style={[styles.analyticsRowValue, { color: colors.warning }]}>
                  {analytics.worstPerformingVariant}
                </Text>
              </View>
            </View>
          </>
        )}

        {/* Variants */}
        {variants.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Variants ({variants.length})
            </Text>
            {variants.map(renderVariantCard)}
          </>
        )}

        {/* History */}
        {history.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Rotation History
            </Text>
            {history.slice(0, 10).map(renderHistoryItem)}
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 16,
  },
  backButton: {
    fontSize: 16,
    fontWeight: "600",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    marginTop: 8,
  },
  scheduleCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  scheduleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  scheduleName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  scheduleDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  scheduleStrategy: {
    fontSize: 12,
    fontWeight: "600",
  },
  scheduleInterval: {
    fontSize: 12,
  },
  rotateButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 24,
  },
  rotateButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  analyticsCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  analyticsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  analyticsItem: {
    alignItems: "center",
  },
  analyticsValue: {
    fontSize: 24,
    fontWeight: "bold",
  },
  analyticsLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  analyticsDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginBottom: 16,
  },
  analyticsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  analyticsRowLabel: {
    fontSize: 14,
  },
  analyticsRowValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  variantCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  variantHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  variantName: {
    fontSize: 16,
    fontWeight: "600",
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  activeBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  variantStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  weightBar: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    marginBottom: 4,
    overflow: "hidden",
  },
  weightFill: {
    height: "100%",
    borderRadius: 4,
  },
  weightLabel: {
    fontSize: 11,
    textAlign: "right",
  },
  historyItem: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  historyStrategy: {
    fontSize: 12,
    fontWeight: "600",
  },
  historyTime: {
    fontSize: 11,
  },
  historyReason: {
    fontSize: 13,
    marginBottom: 4,
  },
  historyPath: {
    fontSize: 11,
  },
});
