/**
 * Scheduled Report Delivery Screen
 * Configure automatic email delivery of compliance and analytics reports
 * MediVac One v5.6
 */

import { useState, useEffect } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Switch,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import {
  scheduledReportService,
  type ReportSchedule,
  type ReportType,
  type ScheduleFrequency,
  type ReportRecipient,
  type DeliveryRecord,
  REPORT_TYPE_CONFIG,
  FREQUENCY_CONFIG,
} from "@/lib/services/scheduled-report-service";

export default function ScheduledReportsScreen() {
  const colors = useColors();
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState<ReportSchedule[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ReportSchedule | null>(null);
  const [deliveryHistory, setDeliveryHistory] = useState<DeliveryRecord[]>([]);
  const [running, setRunning] = useState<string | null>(null);

  // Editor state
  const [editorName, setEditorName] = useState("");
  const [editorDescription, setEditorDescription] = useState("");
  const [editorReportType, setEditorReportType] = useState<ReportType>("compliance_summary");
  const [editorFrequency, setEditorFrequency] = useState<ScheduleFrequency>("daily");
  const [editorRecipients, setEditorRecipients] = useState<ReportRecipient[]>([]);
  const [editorFormat, setEditorFormat] = useState<"pdf" | "html" | "csv" | "excel">("pdf");
  const [newRecipientEmail, setNewRecipientEmail] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await scheduledReportService.initialize();
      setSchedules(scheduledReportService.getSchedules());
      setDeliveryHistory(scheduledReportService.getDeliveryHistory());
    } catch (error) {
      console.error("Failed to load schedules:", error);
    } finally {
      setLoading(false);
    }
  };

  const openEditor = (schedule?: ReportSchedule) => {
    if (schedule) {
      setEditingSchedule(schedule);
      setEditorName(schedule.name);
      setEditorDescription(schedule.description);
      setEditorReportType(schedule.reportType);
      setEditorFrequency(schedule.frequency);
      setEditorRecipients([...schedule.recipients]);
      setEditorFormat(schedule.format);
    } else {
      setEditingSchedule(null);
      setEditorName("");
      setEditorDescription("");
      setEditorReportType("compliance_summary");
      setEditorFrequency("daily");
      setEditorRecipients([]);
      setEditorFormat("pdf");
    }
    setNewRecipientEmail("");
    setShowEditor(true);
  };

  const saveSchedule = async () => {
    if (!editorName) {
      Alert.alert("Error", "Schedule name is required");
      return;
    }
    if (editorRecipients.length === 0) {
      Alert.alert("Error", "At least one recipient is required");
      return;
    }

    setSaving(true);
    try {
      const scheduleData = {
        name: editorName,
        description: editorDescription,
        reportType: editorReportType,
        frequency: editorFrequency,
        cronExpression: FREQUENCY_CONFIG[editorFrequency].defaultCron,
        recipients: editorRecipients,
        filters: {
          dateRange: "last_7_days" as const,
          includeCharts: true,
          includeSummary: true,
          includeDetails: false,
        },
        format: editorFormat,
        status: "active" as const,
        timezone: "Australia/Sydney",
        retryOnFailure: true,
        maxRetries: 3,
        createdBy: "user",
      };

      if (editingSchedule) {
        await scheduledReportService.updateSchedule(editingSchedule.id, scheduleData);
      } else {
        await scheduledReportService.createSchedule(scheduleData);
      }

      setSchedules(scheduledReportService.getSchedules());
      setShowEditor(false);
      Alert.alert("Success", editingSchedule ? "Schedule updated" : "Schedule created");
    } catch (error) {
      Alert.alert("Error", `Failed to save: ${error}`);
    } finally {
      setSaving(false);
    }
  };

  const deleteSchedule = async (id: string) => {
    Alert.alert(
      "Delete Schedule",
      "Are you sure you want to delete this schedule?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await scheduledReportService.deleteSchedule(id);
            setSchedules(scheduledReportService.getSchedules());
          },
        },
      ]
    );
  };

  const toggleSchedule = async (schedule: ReportSchedule) => {
    if (schedule.status === "active") {
      await scheduledReportService.pauseSchedule(schedule.id);
    } else {
      await scheduledReportService.resumeSchedule(schedule.id);
    }
    setSchedules(scheduledReportService.getSchedules());
  };

  const runNow = async (id: string) => {
    setRunning(id);
    try {
      const delivery = await scheduledReportService.runScheduleNow(id);
      setSchedules(scheduledReportService.getSchedules());
      setDeliveryHistory(scheduledReportService.getDeliveryHistory());
      Alert.alert(
        delivery.status === "delivered" ? "Success" : "Failed",
        delivery.status === "delivered" 
          ? `Report delivered to ${delivery.recipients.length} recipients`
          : delivery.errorMessage || "Delivery failed"
      );
    } catch (error) {
      Alert.alert("Error", `Failed to run: ${error}`);
    } finally {
      setRunning(null);
    }
  };

  const addRecipient = () => {
    if (!newRecipientEmail || !newRecipientEmail.includes("@")) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    setEditorRecipients([
      ...editorRecipients,
      {
        id: `r_${Date.now()}`,
        email: newRecipientEmail,
        name: newRecipientEmail.split("@")[0],
        type: "to",
        active: true,
      },
    ]);
    setNewRecipientEmail("");
  };

  const removeRecipient = (id: string) => {
    setEditorRecipients(editorRecipients.filter(r => r.id !== id));
  };

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleString();
  };

  const renderScheduleCard = (schedule: ReportSchedule) => {
    const config = REPORT_TYPE_CONFIG[schedule.reportType];
    const isRunning = running === schedule.id;

    return (
      <View
        key={schedule.id}
        className="bg-surface rounded-xl p-4 mb-3 border border-border"
      >
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Text style={{ fontSize: 16 }}>{config.icon}</Text>
              <Text className="text-foreground font-semibold flex-1" numberOfLines={1}>
                {schedule.name}
              </Text>
            </View>
            <Text className="text-muted text-xs mt-1" numberOfLines={1}>
              {schedule.description || config.description}
            </Text>
          </View>
          <Switch
            value={schedule.status === "active"}
            onValueChange={() => toggleSchedule(schedule)}
            trackColor={{ false: colors.border, true: colors.success + "80" }}
            thumbColor={schedule.status === "active" ? colors.success : colors.muted}
          />
        </View>

        <View className="flex-row flex-wrap gap-2 mb-3">
          <View
            className="px-2 py-1 rounded-full"
            style={{ backgroundColor: config.color + "20" }}
          >
            <Text style={{ color: config.color, fontSize: 10, fontWeight: "600" }}>
              {config.label}
            </Text>
          </View>
          <View className="px-2 py-1 rounded-full bg-background">
            <Text className="text-muted text-[10px]">
              {FREQUENCY_CONFIG[schedule.frequency].label}
            </Text>
          </View>
          <View className="px-2 py-1 rounded-full bg-background">
            <Text className="text-muted text-[10px]">
              {schedule.format.toUpperCase()}
            </Text>
          </View>
          <View className="px-2 py-1 rounded-full bg-background">
            <Text className="text-muted text-[10px]">
              {schedule.recipients.filter(r => r.active).length} recipients
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-4 mb-3">
          <Text className="text-muted text-xs">Next: {formatDate(schedule.nextRun)}</Text>
        </View>

        <View className="flex-row items-center gap-3 mb-3">
          <Text className="text-muted text-xs">{schedule.successCount} sent</Text>
          {schedule.failureCount > 0 && (
            <Text style={{ color: colors.error, fontSize: 12 }}>{schedule.failureCount} failed</Text>
          )}
        </View>

        <View className="flex-row gap-2">
          <TouchableOpacity
            className="flex-1 py-2 rounded-lg items-center"
            style={{ backgroundColor: colors.primary + "20" }}
            onPress={() => openEditor(schedule)}
            activeOpacity={0.7}
          >
            <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 12 }}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 py-2 rounded-lg items-center"
            style={{ backgroundColor: colors.success + "20" }}
            onPress={() => runNow(schedule.id)}
            disabled={isRunning}
            activeOpacity={0.7}
          >
            {isRunning ? (
              <ActivityIndicator size="small" color={colors.success} />
            ) : (
              <Text style={{ color: colors.success, fontWeight: "600", fontSize: 12 }}>Run Now</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            className="py-2 px-3 rounded-lg items-center"
            style={{ backgroundColor: colors.error + "20" }}
            onPress={() => deleteSchedule(schedule.id)}
            activeOpacity={0.7}
          >
            <Text style={{ color: colors.error, fontWeight: "600", fontSize: 12 }}>X</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderDeliveryItem = (delivery: DeliveryRecord) => {
    const statusColors: Record<string, string> = {
      delivered: colors.success,
      failed: colors.error,
      pending: colors.warning,
      sending: colors.primary,
      bounced: colors.error,
    };

    return (
      <View
        key={delivery.id}
        className="bg-surface rounded-xl p-4 mb-2 border border-border"
      >
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-foreground font-medium flex-1" numberOfLines={1}>
            {delivery.scheduleName}
          </Text>
          <View
            className="px-2 py-1 rounded-full"
            style={{ backgroundColor: statusColors[delivery.status] + "20" }}
          >
            <Text
              style={{
                color: statusColors[delivery.status],
                fontSize: 10,
                fontWeight: "600",
                textTransform: "uppercase",
              }}
            >
              {delivery.status}
            </Text>
          </View>
        </View>
        <Text className="text-muted text-xs">
          {formatDate(delivery.sentAt)} - {delivery.recipients.length} recipients
        </Text>
        {delivery.errorMessage && (
          <Text style={{ color: colors.error, fontSize: 12, marginTop: 4 }}>{delivery.errorMessage}</Text>
        )}
      </View>
    );
  };

  return (
    <ScreenContainer className="flex-1">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-5 pt-4 pb-4">
          <View className="flex-row items-center justify-between mb-2">
            <View>
              <Text className="text-foreground text-2xl font-bold">Scheduled Reports</Text>
              <Text className="text-muted text-sm mt-1">
                Automatic report delivery
              </Text>
            </View>
            <TouchableOpacity
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.primary }}
              onPress={() => openEditor()}
              activeOpacity={0.7}
            >
              <Text style={{ color: "#FFFFFF", fontSize: 20, fontWeight: "bold" }}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View className="px-5 mb-4">
          <View className="flex-row gap-3">
            <View className="flex-1 bg-surface rounded-xl p-4 border border-border items-center">
              <Text className="text-2xl font-bold text-foreground">
                {schedules.filter(s => s.status === "active").length}
              </Text>
              <Text className="text-muted text-xs">Active</Text>
            </View>
            <View className="flex-1 bg-surface rounded-xl p-4 border border-border items-center">
              <Text className="text-2xl font-bold" style={{ color: colors.success }}>
                {schedules.reduce((sum, s) => sum + s.successCount, 0)}
              </Text>
              <Text className="text-muted text-xs">Delivered</Text>
            </View>
            <TouchableOpacity
              className="flex-1 bg-surface rounded-xl p-4 border border-border items-center"
              onPress={() => setShowHistory(true)}
              activeOpacity={0.7}
            >
              <Text className="text-2xl font-bold" style={{ color: colors.primary }}>
                {deliveryHistory.length}
              </Text>
              <Text className="text-muted text-xs">History</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Schedules List */}
        <View className="px-5 pb-8">
          {loading ? (
            <View className="py-12 items-center">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="text-muted mt-4">Loading schedules...</Text>
            </View>
          ) : schedules.length === 0 ? (
            <View className="py-12 items-center">
              <Text style={{ fontSize: 48, marginBottom: 12 }}>📅</Text>
              <Text className="text-foreground font-semibold text-lg">No Schedules</Text>
              <Text className="text-muted text-center mt-2">
                Create your first scheduled report
              </Text>
              <TouchableOpacity
                className="mt-4 px-6 py-3 rounded-xl"
                style={{ backgroundColor: colors.primary }}
                onPress={() => openEditor()}
                activeOpacity={0.7}
              >
                <Text className="text-white font-semibold">Create Schedule</Text>
              </TouchableOpacity>
            </View>
          ) : (
            schedules.map(renderScheduleCard)
          )}
        </View>
      </ScrollView>

      {/* Editor Modal */}
      <Modal visible={showEditor} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-background">
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-border">
            <TouchableOpacity onPress={() => setShowEditor(false)}>
              <Text style={{ color: colors.primary, fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
            <Text className="text-foreground font-semibold text-lg">
              {editingSchedule ? "Edit Schedule" : "New Schedule"}
            </Text>
            <TouchableOpacity onPress={saveSchedule} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={{ color: colors.primary, fontSize: 16, fontWeight: "600" }}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-5 py-4" showsVerticalScrollIndicator={false}>
            <Text className="text-foreground font-semibold mb-2">Schedule Name *</Text>
            <TextInput
              className="bg-surface rounded-xl px-4 py-3 text-foreground mb-4 border border-border"
              placeholder="Enter schedule name"
              placeholderTextColor={colors.muted}
              value={editorName}
              onChangeText={setEditorName}
            />

            <Text className="text-foreground font-semibold mb-2">Description</Text>
            <TextInput
              className="bg-surface rounded-xl px-4 py-3 text-foreground mb-4 border border-border"
              placeholder="Enter description"
              placeholderTextColor={colors.muted}
              value={editorDescription}
              onChangeText={setEditorDescription}
            />

            <Text className="text-foreground font-semibold mb-2">Report Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              {(Object.keys(REPORT_TYPE_CONFIG) as ReportType[]).slice(0, 6).map(type => {
                const config = REPORT_TYPE_CONFIG[type];
                return (
                  <TouchableOpacity
                    key={type}
                    className="mr-2 px-4 py-2 rounded-full flex-row items-center gap-1"
                    style={{
                      backgroundColor: editorReportType === type ? config.color : colors.surface,
                      borderWidth: 1,
                      borderColor: editorReportType === type ? config.color : colors.border,
                    }}
                    onPress={() => setEditorReportType(type)}
                    activeOpacity={0.7}
                  >
                    <Text style={{ fontSize: 12 }}>{config.icon}</Text>
                    <Text
                      style={{
                        color: editorReportType === type ? "#FFFFFF" : colors.foreground,
                        fontWeight: "600",
                        fontSize: 12,
                      }}
                      numberOfLines={1}
                    >
                      {config.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text className="text-foreground font-semibold mb-2">Frequency</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {(Object.keys(FREQUENCY_CONFIG) as ScheduleFrequency[]).map(freq => (
                <TouchableOpacity
                  key={freq}
                  className="px-4 py-2 rounded-full"
                  style={{
                    backgroundColor: editorFrequency === freq ? colors.primary : colors.surface,
                    borderWidth: 1,
                    borderColor: editorFrequency === freq ? colors.primary : colors.border,
                  }}
                  onPress={() => setEditorFrequency(freq)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={{
                      color: editorFrequency === freq ? "#FFFFFF" : colors.foreground,
                      fontWeight: "600",
                      fontSize: 13,
                    }}
                  >
                    {FREQUENCY_CONFIG[freq].label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="text-foreground font-semibold mb-2">Format</Text>
            <View className="flex-row gap-2 mb-4">
              {(["pdf", "html", "csv", "excel"] as const).map(fmt => (
                <TouchableOpacity
                  key={fmt}
                  className="flex-1 py-2 rounded-xl items-center"
                  style={{
                    backgroundColor: editorFormat === fmt ? colors.primary + "20" : colors.surface,
                    borderWidth: 1,
                    borderColor: editorFormat === fmt ? colors.primary : colors.border,
                  }}
                  onPress={() => setEditorFormat(fmt)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={{
                      color: editorFormat === fmt ? colors.primary : colors.foreground,
                      fontWeight: "600",
                      fontSize: 12,
                      textTransform: "uppercase",
                    }}
                  >
                    {fmt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="text-foreground font-semibold mb-2">Recipients *</Text>
            <View className="flex-row gap-2 mb-2">
              <TextInput
                className="flex-1 bg-surface rounded-xl px-4 py-3 text-foreground border border-border"
                placeholder="Enter email address"
                placeholderTextColor={colors.muted}
                value={newRecipientEmail}
                onChangeText={setNewRecipientEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TouchableOpacity
                className="px-4 rounded-xl items-center justify-center"
                style={{ backgroundColor: colors.primary }}
                onPress={addRecipient}
                activeOpacity={0.7}
              >
                <Text style={{ color: "#FFFFFF", fontSize: 20, fontWeight: "bold" }}>+</Text>
              </TouchableOpacity>
            </View>

            {editorRecipients.map(recipient => (
              <View
                key={recipient.id}
                className="flex-row items-center justify-between bg-surface rounded-xl px-4 py-3 mb-2 border border-border"
              >
                <View className="flex-1">
                  <Text className="text-foreground">{recipient.email}</Text>
                  <Text className="text-muted text-xs">{recipient.type.toUpperCase()}</Text>
                </View>
                <TouchableOpacity onPress={() => removeRecipient(recipient.id)}>
                  <Text style={{ color: colors.error, fontSize: 16, fontWeight: "bold" }}>X</Text>
                </TouchableOpacity>
              </View>
            ))}

            <View className="h-8" />
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
            <Text className="text-foreground font-semibold text-lg">Delivery History</Text>
            <View style={{ width: 50 }} />
          </View>

          <ScrollView className="flex-1 px-5 py-4" showsVerticalScrollIndicator={false}>
            {deliveryHistory.length === 0 ? (
              <View className="py-12 items-center">
                <Text style={{ fontSize: 48, marginBottom: 12 }}>📬</Text>
                <Text className="text-foreground font-semibold">No Deliveries Yet</Text>
                <Text className="text-muted text-center mt-2">
                  Delivery history will appear here
                </Text>
              </View>
            ) : (
              deliveryHistory.map(renderDeliveryItem)
            )}
          </ScrollView>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
