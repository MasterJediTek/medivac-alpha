/**
 * SMTP Health Monitoring Screen
 * Periodic connection tests with failure alerts
 * MediVac One v5.6
 */

import { useState, useEffect } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import {
  smtpHealthService,
  type HealthRecord,
  type HealthSummary,
  type HealthAlert,
  type HealthCheck,
  type SMTPServer,
} from "@/lib/services/smtp-health-service";

export default function SMTPHealthScreen() {
  const colors = useColors();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checking, setChecking] = useState<string | null>(null);
  const [summary, setSummary] = useState<HealthSummary | null>(null);
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [servers, setServers] = useState<SMTPServer[]>([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<HealthRecord | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await smtpHealthService.initialize();
      setServers(smtpHealthService.getServers());
      setRecords(smtpHealthService.getAllHealthRecords());
      setSummary(smtpHealthService.getSummary());
      setAlerts(smtpHealthService.getAlerts());
    } catch (error) {
      console.error("Failed to load health data:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const checkServer = async (serverId: string) => {
    setChecking(serverId);
    try {
      await smtpHealthService.checkServer(serverId);
      setRecords(smtpHealthService.getAllHealthRecords());
      setSummary(smtpHealthService.getSummary());
      setAlerts(smtpHealthService.getAlerts());
    } catch (error) {
      Alert.alert("Error", `Health check failed: ${error}`);
    } finally {
      setChecking(null);
    }
  };

  const checkAllServers = async () => {
    setChecking("all");
    try {
      await smtpHealthService.checkAllServers();
      setRecords(smtpHealthService.getAllHealthRecords());
      setSummary(smtpHealthService.getSummary());
      setAlerts(smtpHealthService.getAlerts());
      Alert.alert("Complete", "All servers have been checked");
    } catch (error) {
      Alert.alert("Error", `Health check failed: ${error}`);
    } finally {
      setChecking(null);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    await smtpHealthService.acknowledgeAlert(alertId, "Current User");
    setAlerts(smtpHealthService.getAlerts());
  };

  const resolveAlert = async (alertId: string) => {
    await smtpHealthService.resolveAlert(alertId);
    setAlerts(smtpHealthService.getAlerts());
  };

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleString();
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "healthy": return colors.success;
      case "degraded": return colors.warning;
      case "unhealthy": return colors.error;
      default: return colors.muted;
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case "healthy": return "✓";
      case "degraded": return "⚠";
      case "unhealthy": return "✗";
      default: return "?";
    }
  };

  const renderServerCard = (record: HealthRecord) => {
    const server = servers.find(s => s.id === record.serverId);
    const isChecking = checking === record.serverId || checking === "all";
    const statusColor = getStatusColor(record.currentStatus);

    return (
      <View
        key={record.serverId}
        className="bg-surface rounded-xl p-4 mb-3 border border-border"
      >
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2 flex-1">
            <View
              className="w-8 h-8 rounded-full items-center justify-center"
              style={{ backgroundColor: statusColor + "20" }}
            >
              <Text style={{ color: statusColor, fontWeight: "bold" }}>
                {getStatusIcon(record.currentStatus)}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-foreground font-semibold">{record.serverName}</Text>
              <Text className="text-muted text-xs">
                {server?.host}:{server?.port}
              </Text>
            </View>
          </View>
          <View
            className="px-3 py-1 rounded-full"
            style={{ backgroundColor: statusColor + "20" }}
          >
            <Text
              style={{
                color: statusColor,
                fontSize: 11,
                fontWeight: "600",
                textTransform: "uppercase",
              }}
            >
              {record.currentStatus}
            </Text>
          </View>
        </View>

        <View className="flex-row gap-4 mb-3">
          <View className="flex-1">
            <Text className="text-muted text-xs">Uptime</Text>
            <Text className="text-foreground font-semibold">{record.uptime}%</Text>
          </View>
          <View className="flex-1">
            <Text className="text-muted text-xs">Avg Response</Text>
            <Text className="text-foreground font-semibold">{record.averageResponseTime}ms</Text>
          </View>
          <View className="flex-1">
            <Text className="text-muted text-xs">Checks</Text>
            <Text className="text-foreground font-semibold">
              {record.checksSuccessful}/{record.checksTotal}
            </Text>
          </View>
        </View>

        {record.lastCheck && (
          <Text className="text-muted text-xs mb-3">
            Last check: {formatDate(record.lastCheck.checkedAt)}
            {record.lastCheck.responseTime && ` (${record.lastCheck.responseTime}ms)`}
          </Text>
        )}

        {record.consecutiveFailures > 0 && (
          <View
            className="px-3 py-2 rounded-lg mb-3"
            style={{ backgroundColor: colors.error + "10" }}
          >
            <Text style={{ color: colors.error, fontSize: 12 }}>
              {record.consecutiveFailures} consecutive failure(s)
            </Text>
          </View>
        )}

        <View className="flex-row gap-2">
          <TouchableOpacity
            className="flex-1 py-2 rounded-lg items-center"
            style={{ backgroundColor: colors.primary + "20" }}
            onPress={() => checkServer(record.serverId)}
            disabled={isChecking}
            activeOpacity={0.7}
          >
            {isChecking ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 12 }}>
                Check Now
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 py-2 rounded-lg items-center"
            style={{ backgroundColor: colors.surface }}
            onPress={() => {
              setSelectedRecord(record);
              setShowHistory(true);
            }}
            activeOpacity={0.7}
          >
            <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 12 }}>
              History
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderAlertItem = (alert: HealthAlert) => {
    const severityColors: Record<string, string> = {
      critical: colors.error,
      warning: colors.warning,
      info: colors.primary,
    };
    const severityColor = severityColors[alert.severity] || colors.muted;

    return (
      <View
        key={alert.id}
        className="bg-surface rounded-xl p-4 mb-2 border border-border"
      >
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <View
                className="px-2 py-0.5 rounded"
                style={{ backgroundColor: severityColor + "20" }}
              >
                <Text
                  style={{
                    color: severityColor,
                    fontSize: 10,
                    fontWeight: "600",
                    textTransform: "uppercase",
                  }}
                >
                  {alert.severity}
                </Text>
              </View>
              <Text className="text-foreground font-semibold flex-1" numberOfLines={1}>
                {alert.title}
              </Text>
            </View>
            <Text className="text-muted text-sm mt-1">{alert.message}</Text>
          </View>
        </View>
        <Text className="text-muted text-xs mb-3">{formatDate(alert.createdAt)}</Text>
        
        {alert.status === "active" && (
          <View className="flex-row gap-2">
            <TouchableOpacity
              className="flex-1 py-2 rounded-lg items-center"
              style={{ backgroundColor: colors.warning + "20" }}
              onPress={() => acknowledgeAlert(alert.id)}
              activeOpacity={0.7}
            >
              <Text style={{ color: colors.warning, fontWeight: "600", fontSize: 12 }}>
                Acknowledge
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 py-2 rounded-lg items-center"
              style={{ backgroundColor: colors.success + "20" }}
              onPress={() => resolveAlert(alert.id)}
              activeOpacity={0.7}
            >
              <Text style={{ color: colors.success, fontWeight: "600", fontSize: 12 }}>
                Resolve
              </Text>
            </TouchableOpacity>
          </View>
        )}
        {alert.status === "acknowledged" && (
          <View className="flex-row items-center justify-between">
            <Text className="text-muted text-xs">
              Acknowledged by {alert.acknowledgedBy}
            </Text>
            <TouchableOpacity
              className="px-4 py-2 rounded-lg"
              style={{ backgroundColor: colors.success + "20" }}
              onPress={() => resolveAlert(alert.id)}
              activeOpacity={0.7}
            >
              <Text style={{ color: colors.success, fontWeight: "600", fontSize: 12 }}>
                Resolve
              </Text>
            </TouchableOpacity>
          </View>
        )}
        {alert.status === "resolved" && (
          <Text className="text-muted text-xs">
            Resolved at {formatDate(alert.resolvedAt)}
          </Text>
        )}
      </View>
    );
  };

  const renderHistoryItem = (check: HealthCheck) => {
    const statusColor = getStatusColor(check.status);

    return (
      <View
        key={check.id}
        className="bg-surface rounded-xl p-4 mb-2 border border-border"
      >
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center gap-2">
            <View
              className="w-6 h-6 rounded-full items-center justify-center"
              style={{ backgroundColor: statusColor + "20" }}
            >
              <Text style={{ color: statusColor, fontSize: 10, fontWeight: "bold" }}>
                {getStatusIcon(check.status)}
              </Text>
            </View>
            <Text
              style={{
                color: statusColor,
                fontWeight: "600",
                textTransform: "uppercase",
                fontSize: 12,
              }}
            >
              {check.status}
            </Text>
          </View>
          <Text className="text-muted text-xs">{check.responseTime}ms</Text>
        </View>
        <Text className="text-muted text-xs">{formatDate(check.checkedAt)}</Text>
        {check.errorMessage && (
          <Text style={{ color: colors.error, fontSize: 12, marginTop: 4 }}>
            {check.errorMessage}
          </Text>
        )}
      </View>
    );
  };

  return (
    <ScreenContainer className="flex-1">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View className="px-5 pt-4 pb-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-foreground text-2xl font-bold">SMTP Health</Text>
              <Text className="text-muted text-sm mt-1">
                Server monitoring & alerts
              </Text>
            </View>
            <TouchableOpacity
              className="px-4 py-2 rounded-full"
              style={{ backgroundColor: colors.primary }}
              onPress={checkAllServers}
              disabled={checking === "all"}
              activeOpacity={0.7}
            >
              {checking === "all" ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={{ color: "#FFFFFF", fontWeight: "600", fontSize: 12 }}>
                  Check All
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Overall Status */}
        {summary && (
          <View className="px-5 mb-4">
            <View
              className="rounded-xl p-4 border"
              style={{
                backgroundColor: getStatusColor(summary.overallStatus) + "10",
                borderColor: getStatusColor(summary.overallStatus) + "30",
              }}
            >
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-2">
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center"
                    style={{ backgroundColor: getStatusColor(summary.overallStatus) + "20" }}
                  >
                    <Text
                      style={{
                        color: getStatusColor(summary.overallStatus),
                        fontSize: 18,
                        fontWeight: "bold",
                      }}
                    >
                      {getStatusIcon(summary.overallStatus)}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-foreground font-semibold">Overall Status</Text>
                    <Text
                      style={{
                        color: getStatusColor(summary.overallStatus),
                        fontWeight: "600",
                        textTransform: "uppercase",
                        fontSize: 12,
                      }}
                    >
                      {summary.overallStatus}
                    </Text>
                  </View>
                </View>
                {summary.activeAlerts > 0 && (
                  <TouchableOpacity
                    className="px-3 py-2 rounded-lg"
                    style={{ backgroundColor: colors.error + "20" }}
                    onPress={() => setShowAlerts(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={{ color: colors.error, fontWeight: "600", fontSize: 12 }}>
                      {summary.activeAlerts} Alert{summary.activeAlerts > 1 ? "s" : ""}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              <View className="flex-row gap-4">
                <View className="flex-1">
                  <Text className="text-muted text-xs">Servers</Text>
                  <Text className="text-foreground font-semibold">
                    {summary.healthyServers}/{summary.totalServers} healthy
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-muted text-xs">Avg Uptime</Text>
                  <Text className="text-foreground font-semibold">{summary.averageUptime}%</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-muted text-xs">Avg Response</Text>
                  <Text className="text-foreground font-semibold">{summary.averageResponseTime}ms</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Server List */}
        <View className="px-5 pb-8">
          <Text className="text-foreground font-semibold text-lg mb-3">SMTP Servers</Text>
          {loading ? (
            <View className="py-8 items-center">
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : records.length === 0 ? (
            <View className="py-8 items-center bg-surface rounded-xl border border-border">
              <Text style={{ fontSize: 48, marginBottom: 12 }}>📧</Text>
              <Text className="text-foreground font-semibold">No Servers Configured</Text>
              <Text className="text-muted text-center mt-2 px-4">
                Add SMTP servers to monitor their health
              </Text>
            </View>
          ) : (
            records.map(renderServerCard)
          )}
        </View>
      </ScrollView>

      {/* Alerts Modal */}
      <Modal visible={showAlerts} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-background">
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-border">
            <TouchableOpacity onPress={() => setShowAlerts(false)}>
              <Text style={{ color: colors.primary, fontSize: 16 }}>Close</Text>
            </TouchableOpacity>
            <Text className="text-foreground font-semibold text-lg">Health Alerts</Text>
            <View style={{ width: 50 }} />
          </View>
          <ScrollView className="flex-1 px-5 py-4" showsVerticalScrollIndicator={false}>
            {alerts.length === 0 ? (
              <View className="py-12 items-center">
                <Text style={{ fontSize: 48, marginBottom: 12 }}>🔔</Text>
                <Text className="text-foreground font-semibold">No Alerts</Text>
                <Text className="text-muted text-center mt-2">
                  All systems are operating normally
                </Text>
              </View>
            ) : (
              alerts.map(renderAlertItem)
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* History Modal */}
      <Modal visible={showHistory} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-background">
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-border">
            <TouchableOpacity onPress={() => setShowHistory(false)}>
              <Text style={{ color: colors.primary, fontSize: 16 }}>Close</Text>
            </TouchableOpacity>
            <Text className="text-foreground font-semibold text-lg">
              {selectedRecord?.serverName || "History"}
            </Text>
            <View style={{ width: 50 }} />
          </View>
          <ScrollView className="flex-1 px-5 py-4" showsVerticalScrollIndicator={false}>
            {selectedRecord?.history.length === 0 ? (
              <View className="py-12 items-center">
                <Text style={{ fontSize: 48, marginBottom: 12 }}>📊</Text>
                <Text className="text-foreground font-semibold">No History</Text>
                <Text className="text-muted text-center mt-2">
                  Run a health check to see history
                </Text>
              </View>
            ) : (
              selectedRecord?.history.map(renderHistoryItem)
            )}
          </ScrollView>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
