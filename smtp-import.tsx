/**
 * Bulk SMTP Configuration Import Screen
 * Import multiple SMTP profiles from JSON/CSV
 * MediVac One v5.5
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
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import {
  bulkSMTPImportService,
  type ImportFormat,
  type ConflictResolution,
  type ImportPreview,
  type ImportResult,
  type ImportHistoryEntry,
  type ImportProgress,
} from "@/lib/services/bulk-smtp-import-service";

export default function SMTPImportScreen() {
  const colors = useColors();
  const [loading, setLoading] = useState(false);
  const [importData, setImportData] = useState("");
  const [format, setFormat] = useState<ImportFormat>("json");
  const [conflictResolution, setConflictResolution] = useState<ConflictResolution>("skip");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [history, setHistory] = useState<ImportHistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    await bulkSMTPImportService.initialize();
    setHistory(bulkSMTPImportService.getHistory());
  };

  const handlePreview = async () => {
    if (!importData.trim()) {
      Alert.alert("Error", "Please enter import data");
      return;
    }

    setLoading(true);
    try {
      const previewResult = await bulkSMTPImportService.previewImport(importData, format);
      setPreview(previewResult);
      setShowPreview(true);
    } catch (error) {
      Alert.alert("Parse Error", `Failed to parse ${format.toUpperCase()} data: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!preview) return;

    setImporting(true);
    setResult(null);

    // Subscribe to progress updates
    const unsubscribe = bulkSMTPImportService.onProgress((p) => {
      setProgress({ ...p });
    });

    try {
      const importResult = await bulkSMTPImportService.executeImport(
        importData,
        format,
        conflictResolution
      );
      setResult(importResult);
      setHistory(bulkSMTPImportService.getHistory());
      
      if (importResult.success) {
        Alert.alert("Success", `Successfully imported ${importResult.imported} configurations`);
        setShowPreview(false);
        setImportData("");
        setPreview(null);
      }
    } catch (error) {
      Alert.alert("Import Error", `Failed to import: ${error}`);
    } finally {
      setImporting(false);
      unsubscribe();
    }
  };

  const handleExport = (exportFormat: ImportFormat) => {
    try {
      const data = bulkSMTPImportService.exportConfigs(exportFormat);
      setImportData(data);
      setFormat(exportFormat);
      Alert.alert("Exported", `${exportFormat.toUpperCase()} data copied to input field`);
    } catch (error) {
      Alert.alert("Error", `Failed to export: ${error}`);
    }
  };

  const loadTemplate = (templateFormat: ImportFormat) => {
    if (templateFormat === "json") {
      setImportData(bulkSMTPImportService.getJSONTemplate());
    } else {
      setImportData(bulkSMTPImportService.getCSVTemplate());
    }
    setFormat(templateFormat);
    setShowTemplates(false);
  };

  const clearHistory = async () => {
    Alert.alert(
      "Clear History",
      "Are you sure you want to clear all import history?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            await bulkSMTPImportService.clearHistory();
            setHistory([]);
          },
        },
      ]
    );
  };

  const renderHistoryItem = (item: ImportHistoryEntry) => {
    const statusColors: Record<string, string> = {
      completed: colors.success,
      failed: colors.error,
      partial: colors.warning,
      pending: colors.muted,
    };

    return (
      <View
        key={item.id}
        className="bg-surface rounded-xl p-4 mb-3 border border-border"
      >
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center gap-2">
            <Text style={{ fontSize: 16 }}>{item.format === "json" ? "📋" : "📊"}</Text>
            <Text className="text-foreground font-medium">
              {item.fileName || `${item.format.toUpperCase()} Import`}
            </Text>
          </View>
          <View
            className="px-2 py-1 rounded-full"
            style={{ backgroundColor: statusColors[item.status] + "20" }}
          >
            <Text
              style={{
                color: statusColors[item.status],
                fontSize: 10,
                fontWeight: "600",
                textTransform: "uppercase",
              }}
            >
              {item.status}
            </Text>
          </View>
        </View>

        <Text className="text-muted text-xs mb-2">
          {new Date(item.timestamp).toLocaleString()}
        </Text>

        <View className="flex-row gap-4">
          <View className="flex-row items-center gap-1">
            <IconSymbol name="doc.fill" size={12} color={colors.muted} />
            <Text className="text-muted text-xs">{item.totalConfigs} total</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <IconSymbol name="checkmark.circle.fill" size={12} color={colors.success} />
            <Text className="text-muted text-xs">{item.imported} imported</Text>
          </View>
          {item.failed > 0 && (
            <View className="flex-row items-center gap-1">
              <IconSymbol name="xmark.circle.fill" size={12} color={colors.error} />
              <Text className="text-muted text-xs">{item.failed} failed</Text>
            </View>
          )}
          {item.skipped > 0 && (
            <View className="flex-row items-center gap-1">
              <IconSymbol name="arrow.right.circle.fill" size={12} color={colors.warning} />
              <Text className="text-muted text-xs">{item.skipped} skipped</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer className="flex-1">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-5 pt-4 pb-4">
          <Text className="text-foreground text-2xl font-bold">SMTP Import</Text>
          <Text className="text-muted text-sm mt-1">
            Bulk import SMTP configurations from JSON or CSV
          </Text>
        </View>

        {/* Quick Actions */}
        <View className="px-5 mb-4">
          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 bg-surface rounded-xl p-4 border border-border items-center"
              onPress={() => setShowTemplates(true)}
              activeOpacity={0.7}
            >
              <IconSymbol name="doc.fill" size={24} color={colors.primary} />
              <Text className="text-foreground font-medium mt-2">Templates</Text>
              <Text className="text-muted text-xs mt-1">Load sample data</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-surface rounded-xl p-4 border border-border items-center"
              onPress={() => handleExport("json")}
              activeOpacity={0.7}
            >
              <IconSymbol name="arrow.down.circle.fill" size={24} color={colors.success} />
              <Text className="text-foreground font-medium mt-2">Export</Text>
              <Text className="text-muted text-xs mt-1">Current configs</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-surface rounded-xl p-4 border border-border items-center"
              onPress={() => setShowHistory(true)}
              activeOpacity={0.7}
            >
              <IconSymbol name="clock.fill" size={24} color={colors.warning} />
              <Text className="text-foreground font-medium mt-2">History</Text>
              <Text className="text-muted text-xs mt-1">{history.length} imports</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Format Selection */}
        <View className="px-5 mb-4">
          <Text className="text-foreground font-semibold mb-2">Import Format</Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 py-3 rounded-xl items-center"
              style={{
                backgroundColor: format === "json" ? colors.primary : colors.surface,
                borderWidth: 1,
                borderColor: format === "json" ? colors.primary : colors.border,
              }}
              onPress={() => setFormat("json")}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  color: format === "json" ? "#FFFFFF" : colors.foreground,
                  fontWeight: "600",
                }}
              >
                JSON
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 py-3 rounded-xl items-center"
              style={{
                backgroundColor: format === "csv" ? colors.primary : colors.surface,
                borderWidth: 1,
                borderColor: format === "csv" ? colors.primary : colors.border,
              }}
              onPress={() => setFormat("csv")}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  color: format === "csv" ? "#FFFFFF" : colors.foreground,
                  fontWeight: "600",
                }}
              >
                CSV
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Import Data Input */}
        <View className="px-5 mb-4">
          <Text className="text-foreground font-semibold mb-2">Import Data</Text>
          <TextInput
            className="bg-surface rounded-xl px-4 py-3 text-foreground border border-border"
            placeholder={`Paste your ${format.toUpperCase()} data here...`}
            placeholderTextColor={colors.muted}
            value={importData}
            onChangeText={setImportData}
            multiline
            numberOfLines={10}
            style={{ minHeight: 200, textAlignVertical: "top", fontFamily: "monospace" }}
          />
        </View>

        {/* Conflict Resolution */}
        <View className="px-5 mb-4">
          <Text className="text-foreground font-semibold mb-2">Conflict Resolution</Text>
          <View className="flex-row gap-2">
            {(["skip", "overwrite", "rename"] as ConflictResolution[]).map((option) => (
              <TouchableOpacity
                key={option}
                className="flex-1 py-3 rounded-xl items-center"
                style={{
                  backgroundColor: conflictResolution === option ? colors.primary + "20" : colors.surface,
                  borderWidth: 1,
                  borderColor: conflictResolution === option ? colors.primary : colors.border,
                }}
                onPress={() => setConflictResolution(option)}
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    color: conflictResolution === option ? colors.primary : colors.foreground,
                    fontWeight: "600",
                    fontSize: 13,
                    textTransform: "capitalize",
                  }}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text className="text-muted text-xs mt-2">
            {conflictResolution === "skip" && "Skip configurations that already exist"}
            {conflictResolution === "overwrite" && "Replace existing configurations with imported ones"}
            {conflictResolution === "rename" && "Add suffix to imported configurations if name exists"}
          </Text>
        </View>

        {/* Preview Button */}
        <View className="px-5 pb-8">
          <TouchableOpacity
            className="py-4 rounded-xl items-center"
            style={{ backgroundColor: colors.primary }}
            onPress={handlePreview}
            disabled={loading || !importData.trim()}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white font-semibold text-lg">Preview Import</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Preview Modal */}
      <Modal visible={showPreview} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-background">
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-border">
            <TouchableOpacity onPress={() => setShowPreview(false)}>
              <Text style={{ color: colors.primary, fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
            <Text className="text-foreground font-semibold text-lg">Import Preview</Text>
            <TouchableOpacity onPress={handleImport} disabled={importing || (preview?.validConfigs || 0) === 0}>
              {importing ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text
                  style={{
                    color: (preview?.validConfigs || 0) > 0 ? colors.primary : colors.muted,
                    fontSize: 16,
                    fontWeight: "600",
                  }}
                >
                  Import
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-5 py-4" showsVerticalScrollIndicator={false}>
            {preview && (
              <>
                {/* Summary */}
                <View className="flex-row gap-3 mb-4">
                  <View className="flex-1 bg-surface rounded-xl p-4 border border-border items-center">
                    <Text className="text-2xl font-bold text-foreground">{preview.totalConfigs}</Text>
                    <Text className="text-muted text-xs">Total</Text>
                  </View>
                  <View className="flex-1 bg-surface rounded-xl p-4 border border-border items-center">
                    <Text className="text-2xl font-bold" style={{ color: colors.success }}>
                      {preview.validConfigs}
                    </Text>
                    <Text className="text-muted text-xs">Valid</Text>
                  </View>
                  <View className="flex-1 bg-surface rounded-xl p-4 border border-border items-center">
                    <Text className="text-2xl font-bold" style={{ color: colors.error }}>
                      {preview.invalidConfigs}
                    </Text>
                    <Text className="text-muted text-xs">Invalid</Text>
                  </View>
                  <View className="flex-1 bg-surface rounded-xl p-4 border border-border items-center">
                    <Text className="text-2xl font-bold" style={{ color: colors.warning }}>
                      {preview.conflicts.length}
                    </Text>
                    <Text className="text-muted text-xs">Conflicts</Text>
                  </View>
                </View>

                {/* Progress */}
                {importing && progress && (
                  <View className="bg-surface rounded-xl p-4 border border-border mb-4">
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-foreground font-medium">Importing...</Text>
                      <Text className="text-muted text-sm">
                        {progress.processed}/{progress.total}
                      </Text>
                    </View>
                    <View className="h-2 bg-background rounded-full overflow-hidden">
                      <View
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(progress.processed / progress.total) * 100}%` }}
                      />
                    </View>
                    {progress.currentItem && (
                      <Text className="text-muted text-xs mt-2">{progress.currentItem}</Text>
                    )}
                  </View>
                )}

                {/* Result */}
                {result && (
                  <View
                    className="rounded-xl p-4 mb-4"
                    style={{
                      backgroundColor: result.success ? colors.success + "20" : colors.error + "20",
                    }}
                  >
                    <Text
                      className="font-semibold mb-2"
                      style={{ color: result.success ? colors.success : colors.error }}
                    >
                      {result.success ? "Import Completed" : "Import Completed with Errors"}
                    </Text>
                    <Text className="text-foreground text-sm">
                      Imported: {result.imported} | Failed: {result.failed} | Skipped: {result.skipped}
                    </Text>
                    {result.errors.length > 0 && (
                      <View className="mt-2">
                        {result.errors.slice(0, 5).map((error, i) => (
                          <Text key={i} className="text-error text-xs">• {error}</Text>
                        ))}
                        {result.errors.length > 5 && (
                          <Text className="text-muted text-xs">
                            ...and {result.errors.length - 5} more errors
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                )}

                {/* Conflicts */}
                {preview.conflicts.length > 0 && (
                  <View className="mb-4">
                    <Text className="text-foreground font-semibold mb-2">Conflicts</Text>
                    {preview.conflicts.map((conflict, index) => (
                      <View
                        key={index}
                        className="bg-warning/10 rounded-xl p-3 mb-2 border border-warning/30"
                      >
                        <Text className="text-foreground font-medium">{conflict.importedName}</Text>
                        <Text className="text-muted text-xs mt-1">
                          Conflicts with existing "{conflict.existingName}" ({conflict.conflictType})
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Validation Results */}
                <Text className="text-foreground font-semibold mb-2">Configurations</Text>
                {preview.validationResults.map((result, index) => (
                  <View
                    key={index}
                    className="bg-surface rounded-xl p-4 mb-2 border border-border"
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-foreground font-medium flex-1" numberOfLines={1}>
                        {result.config.name || "Unnamed"}
                      </Text>
                      <View
                        className="px-2 py-1 rounded-full"
                        style={{
                          backgroundColor: result.isValid ? colors.success + "20" : colors.error + "20",
                        }}
                      >
                        <Text
                          style={{
                            color: result.isValid ? colors.success : colors.error,
                            fontSize: 10,
                            fontWeight: "600",
                          }}
                        >
                          {result.isValid ? "VALID" : "INVALID"}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-muted text-xs">
                      {result.config.host}:{result.config.port} • {result.config.encryption} • {result.config.authMethod}
                    </Text>
                    {result.errors.length > 0 && (
                      <View className="mt-2">
                        {result.errors.map((error, i) => (
                          <Text key={i} className="text-error text-xs">• {error}</Text>
                        ))}
                      </View>
                    )}
                    {result.warnings.length > 0 && (
                      <View className="mt-2">
                        {result.warnings.map((warning, i) => (
                          <Text key={i} className="text-warning text-xs">⚠ {warning}</Text>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </>
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
            <Text className="text-foreground font-semibold text-lg">Import History</Text>
            <TouchableOpacity onPress={clearHistory}>
              <Text style={{ color: colors.error, fontSize: 16 }}>Clear</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-5 py-4" showsVerticalScrollIndicator={false}>
            {history.length === 0 ? (
              <View className="py-12 items-center">
                <Text style={{ fontSize: 48, marginBottom: 12 }}>📋</Text>
                <Text className="text-foreground font-semibold">No Import History</Text>
                <Text className="text-muted text-center mt-2">
                  Your import history will appear here
                </Text>
              </View>
            ) : (
              history.map(renderHistoryItem)
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Templates Modal */}
      <Modal visible={showTemplates} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-background">
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-border">
            <TouchableOpacity onPress={() => setShowTemplates(false)}>
              <Text style={{ color: colors.primary, fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
            <Text className="text-foreground font-semibold text-lg">Templates</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView className="flex-1 px-5 py-4" showsVerticalScrollIndicator={false}>
            <Text className="text-muted text-sm mb-4">
              Load a template to see the expected format for importing SMTP configurations.
            </Text>

            <TouchableOpacity
              className="bg-surface rounded-xl p-4 mb-3 border border-border"
              onPress={() => loadTemplate("json")}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center gap-3 mb-2">
                <Text style={{ fontSize: 24 }}>📋</Text>
                <View className="flex-1">
                  <Text className="text-foreground font-semibold">JSON Template</Text>
                  <Text className="text-muted text-xs">Structured format with full options</Text>
                </View>
                <IconSymbol name="chevron.right" size={16} color={colors.muted} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-surface rounded-xl p-4 mb-3 border border-border"
              onPress={() => loadTemplate("csv")}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center gap-3 mb-2">
                <Text style={{ fontSize: 24 }}>📊</Text>
                <View className="flex-1">
                  <Text className="text-foreground font-semibold">CSV Template</Text>
                  <Text className="text-muted text-xs">Spreadsheet-compatible format</Text>
                </View>
                <IconSymbol name="chevron.right" size={16} color={colors.muted} />
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
