/**
 * Pathway Flow Animations Screen
 * MediVac WACHS v8.3
 */

import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import {
  pathwayAnimationService,
  PathwayNode,
  FlowAnimation,
  BottleneckAlert,
  PATHWAY_COLORS,
} from "@/lib/services/pathway-animation-service";

export default function PathwayAnimationsScreen() {
  const colors = useColors();
  const router = useRouter();
  const [nodes, setNodes] = useState<PathwayNode[]>([]);
  const [animations, setAnimations] = useState<FlowAnimation[]>([]);
  const [alerts, setAlerts] = useState<BottleneckAlert[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 500);
    return () => clearInterval(interval);
  }, []);

  const loadData = () => {
    setNodes(pathwayAnimationService.getNodes());
    setAnimations(pathwayAnimationService.getActiveAnimations());
    setAlerts(pathwayAnimationService.getBottleneckAlerts());
  };

  const startSimulation = () => {
    setIsSimulating(true);
    pathwayAnimationService.startAnimationLoop();
    
    // Simulate data flow every 2 seconds
    const interval = setInterval(() => {
      pathwayAnimationService.simulateDataFlow();
    }, 2000);

    setTimeout(() => {
      clearInterval(interval);
      pathwayAnimationService.stopAnimationLoop();
      setIsSimulating(false);
    }, 30000); // Run for 30 seconds
  };

  const renderNode = (node: PathwayNode) => {
    const stateColors: Record<string, string> = {
      idle: colors.muted,
      active: colors.success,
      busy: colors.warning,
      error: colors.error,
      blocked: colors.error,
    };

    return (
      <View
        key={node.id}
        style={[
          styles.nodeCard,
          {
            backgroundColor: colors.surface,
            borderColor: node.color,
            borderWidth: 2,
          },
        ]}
      >
        <View style={styles.nodeHeader}>
          <View style={[styles.nodeIndicator, { backgroundColor: node.color }]} />
          <Text style={[styles.nodeName, { color: colors.foreground }]}>
            {node.name}
          </Text>
        </View>

        <View style={styles.nodeStats}>
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: colors.muted }]}>State</Text>
            <View style={[styles.stateBadge, { backgroundColor: stateColors[node.state] }]}>
              <Text style={styles.stateBadgeText}>{node.state.toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Latency</Text>
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {node.latency}ms
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Processed</Text>
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {node.totalProcessed}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Error Rate</Text>
            <Text
              style={[
                styles.statValue,
                { color: node.errorRate > 5 ? colors.error : colors.foreground },
              ]}
            >
              {node.errorRate.toFixed(1)}%
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderAnimation = (animation: FlowAnimation) => (
    <View
      key={animation.id}
      style={[styles.animationCard, { backgroundColor: colors.surface }]}
    >
      <View style={styles.animationHeader}>
        <Text style={[styles.animationType, { color: colors.primary }]}>
          {animation.packet.type.toUpperCase()}
        </Text>
        <Text style={[styles.animationProgress, { color: colors.foreground }]}>
          {animation.packet.progress}%
        </Text>
      </View>
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: colors.primary,
              width: `${animation.packet.progress}%`,
            },
          ]}
        />
      </View>
      <Text style={[styles.animationPath, { color: colors.muted }]}>
        {animation.packet.sourcePathway} → {animation.packet.targetPathway}
      </Text>
    </View>
  );

  const renderAlert = (alert: BottleneckAlert) => (
    <View
      key={alert.id}
      style={[
        styles.alertCard,
        {
          backgroundColor: alert.severity === "critical" ? colors.error + "20" : colors.warning + "20",
          borderColor: alert.severity === "critical" ? colors.error : colors.warning,
        },
      ]}
    >
      <Text
        style={[
          styles.alertSeverity,
          { color: alert.severity === "critical" ? colors.error : colors.warning },
        ]}
      >
        {alert.severity.toUpperCase()}
      </Text>
      <Text style={[styles.alertMessage, { color: colors.foreground }]}>
        {alert.message}
      </Text>
      <TouchableOpacity
        style={[styles.resolveButton, { backgroundColor: colors.primary }]}
        onPress={() => pathwayAnimationService.resolveAlert(alert.id)}
      >
        <Text style={styles.resolveButtonText}>Resolve</Text>
      </TouchableOpacity>
    </View>
  );

  const analytics = pathwayAnimationService.getAnalytics();

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
            Pathway Animations
          </Text>
        </View>

        {/* Controls */}
        <View style={[styles.controlsCard, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={[
              styles.simulateButton,
              { backgroundColor: isSimulating ? colors.error : colors.primary },
            ]}
            onPress={startSimulation}
            disabled={isSimulating}
          >
            <Text style={styles.simulateButtonText}>
              {isSimulating ? "Simulating..." : "Start Simulation"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Color Legend */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Pathway Color Legend
        </Text>
        <View style={[styles.legendCard, { backgroundColor: colors.surface }]}>
          {Object.entries(PATHWAY_COLORS).map(([key, color]) => (
            <View key={key} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: color }]} />
              <Text style={[styles.legendLabel, { color: colors.foreground }]}>
                {key.replace(/_/g, " ").toUpperCase()}
              </Text>
            </View>
          ))}
        </View>

        {/* Analytics */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Flow Analytics
        </Text>
        <View style={[styles.analyticsCard, { backgroundColor: colors.surface }]}>
          <View style={styles.analyticsGrid}>
            <View style={styles.analyticsItem}>
              <Text style={[styles.analyticsValue, { color: colors.primary }]}>
                {analytics.totalNodes}
              </Text>
              <Text style={[styles.analyticsLabel, { color: colors.muted }]}>
                Nodes
              </Text>
            </View>
            <View style={styles.analyticsItem}>
              <Text style={[styles.analyticsValue, { color: colors.success }]}>
                {analytics.activeNodes}
              </Text>
              <Text style={[styles.analyticsLabel, { color: colors.muted }]}>
                Active
              </Text>
            </View>
            <View style={styles.analyticsItem}>
              <Text style={[styles.analyticsValue, { color: colors.warning }]}>
                {analytics.activeAnimations}
              </Text>
              <Text style={[styles.analyticsLabel, { color: colors.muted }]}>
                In Flight
              </Text>
            </View>
            <View style={styles.analyticsItem}>
              <Text style={[styles.analyticsValue, { color: colors.foreground }]}>
                {analytics.totalPacketsProcessed}
              </Text>
              <Text style={[styles.analyticsLabel, { color: colors.muted }]}>
                Processed
              </Text>
            </View>
          </View>
        </View>

        {/* Bottleneck Alerts */}
        {alerts.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.error }]}>
              Bottleneck Alerts ({alerts.length})
            </Text>
            {alerts.map(renderAlert)}
          </>
        )}

        {/* Active Animations */}
        {animations.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Active Data Flows ({animations.length})
            </Text>
            {animations.map(renderAnimation)}
          </>
        )}

        {/* Pathway Nodes */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Pathway Nodes
        </Text>
        <View style={styles.nodesGrid}>
          {nodes.map(renderNode)}
        </View>
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
  controlsCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  simulateButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  simulateButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  legendCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "45%",
    gap: 8,
  },
  legendColor: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 11,
    flex: 1,
  },
  analyticsCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  analyticsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
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
  alertCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  alertSeverity: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 14,
    marginBottom: 12,
  },
  resolveButton: {
    padding: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  resolveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  animationCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  animationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  animationType: {
    fontSize: 14,
    fontWeight: "600",
  },
  animationProgress: {
    fontSize: 14,
    fontWeight: "600",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    marginBottom: 8,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  animationPath: {
    fontSize: 12,
  },
  nodesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  nodeCard: {
    width: "48%",
    borderRadius: 12,
    padding: 12,
  },
  nodeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  nodeIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  nodeName: {
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  nodeStats: {
    gap: 6,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statLabel: {
    fontSize: 11,
  },
  statValue: {
    fontSize: 11,
    fontWeight: "600",
  },
  stateBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stateBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "600",
  },
});
