/**
 * Analytics Export Screen
 * Extreme Disco Styled Analytics Dashboard
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Animated,
  Share,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import {
  analyticsExportService,
  ReportTemplate,
  GeneratedReport,
  MetricValue,
  TimeRange,
} from '@/src/services/AnalyticsExportService';
import { DISCO_COLORS, getGlowShadow, getNeonTextStyle } from '@/src/theme/DiscoTheme';

type ScreenMode = 'templates' | 'reports' | 'viewer';

export default function AnalyticsExportScreen() {
  const [mode, setMode] = useState<ScreenMode>('templates');
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [activeReport, setActiveReport] = useState<GeneratedReport | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('month');
  const [isGenerating, setIsGenerating] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [rotateAnim] = useState(new Animated.Value(0));

  const loadData = useCallback(() => {
    setTemplates(analyticsExportService.getReportTemplates());
    setReports(analyticsExportService.getGeneratedReports());
  }, []);

  useEffect(() => {
    analyticsExportService.initialize();
    loadData();
    const unsubscribe = analyticsExportService.subscribe(loadData);

    // Disco animations
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.03, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(rotateAnim, { toValue: 1, duration: 4000, useNativeDriver: true })
    ).start();

    return unsubscribe;
  }, [loadData, pulseAnim, rotateAnim]);

  const handleGenerateReport = async (template: ReportTemplate) => {
    setIsGenerating(true);
    try {
      const report = await analyticsExportService.generateReport(template.id, selectedTimeRange);
      setActiveReport(report);
      setMode('viewer');
    } catch (error) {
      Alert.alert('Error', 'Could not generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'excel' | 'csv' | 'json') => {
    if (!activeReport) return;

    try {
      const result = await analyticsExportService.exportReport(activeReport.id, format);
      Alert.alert(
        '🎉 Export Ready!',
        `${result.filename} has been generated with disco styling!`,
        [
          { text: 'Share', onPress: () => Share.share({ message: result.data, title: result.filename }) },
          { text: 'OK' },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Could not export report');
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'good': return DISCO_COLORS.neonGreen;
      case 'warning': return DISCO_COLORS.neonOrange;
      case 'critical': return DISCO_COLORS.neonRed;
      default: return DISCO_COLORS.neonCyan;
    }
  };

  const getChangeIcon = (direction?: string): string => {
    switch (direction) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '➡️';
    }
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const timeRanges: { key: TimeRange; label: string; icon: string }[] = [
    { key: 'today', label: 'Today', icon: '📅' },
    { key: 'week', label: 'Week', icon: '📆' },
    { key: 'month', label: 'Month', icon: '🗓️' },
    { key: 'quarter', label: 'Quarter', icon: '📊' },
    { key: 'year', label: 'Year', icon: '🎯' },
  ];

  const renderTemplates = () => (
    <ScrollView contentContainerStyle={styles.templatesContent}>
      {/* Time Range Selector */}
      <View style={styles.timeRangeContainer}>
        <Text style={styles.timeRangeLabel}>🕐 Select Time Range</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeRangeScroll}>
          {timeRanges.map((range) => (
            <TouchableOpacity
              key={range.key}
              style={[
                styles.timeRangeButton,
                selectedTimeRange === range.key && styles.timeRangeButtonActive,
                selectedTimeRange === range.key && getGlowShadow(DISCO_COLORS.neonPink, 0.5),
              ]}
              onPress={() => setSelectedTimeRange(range.key)}
            >
              <Text style={styles.timeRangeIcon}>{range.icon}</Text>
              <Text style={[styles.timeRangeText, selectedTimeRange === range.key && styles.timeRangeTextActive]}>
                {range.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <Text style={styles.sectionHeader}>🪩 Choose Your Report</Text>
      <Text style={styles.sectionSubheader}>Analytics with disco flair!</Text>

      <View style={styles.templateGrid}>
        {templates.map((template) => (
          <TouchableOpacity
            key={template.id}
            style={[styles.templateCard, { borderColor: template.discoColor }, getGlowShadow(template.discoColor)]}
            onPress={() => handleGenerateReport(template)}
            disabled={isGenerating}
          >
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Text style={styles.templateIcon}>{template.icon}</Text>
            </Animated.View>
            <Text style={[styles.templateName, { color: template.discoColor }]}>{template.name}</Text>
            <Text style={styles.templateDescription}>{template.description}</Text>
            <View style={styles.templateMeta}>
              <Text style={styles.templateMetrics}>📊 {template.metrics.length} metrics</Text>
              <Text style={styles.templateCharts}>📈 {template.charts.length} charts</Text>
            </View>
            {isGenerating && (
              <View style={styles.generatingOverlay}>
                <Text style={styles.generatingText}>🪩 Generating...</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderReports = () => (
    <FlatList
      data={reports}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.reportsContent}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📊</Text>
          <Text style={styles.emptyText}>No reports generated yet</Text>
          <Text style={styles.emptySubtext}>Generate your first disco analytics report!</Text>
        </View>
      }
      renderItem={({ item }) => {
        const template = analyticsExportService.getReportTemplate(item.templateId);
        const goodMetrics = item.data.metrics.filter(m => m.status === 'good').length;
        const totalMetrics = item.data.metrics.length;

        return (
          <TouchableOpacity
            style={[styles.reportCard, { borderColor: template?.discoColor || DISCO_COLORS.neonPink }, getGlowShadow(template?.discoColor || DISCO_COLORS.neonPink, 0.7)]}
            onPress={() => { setActiveReport(item); setMode('viewer'); }}
          >
            <View style={styles.reportHeader}>
              <View>
                <Text style={styles.reportTitle}>{item.templateName}</Text>
                <Text style={styles.reportDate}>📅 {formatDate(item.generatedAt)}</Text>
              </View>
              <View style={[styles.scoreBadge, { backgroundColor: goodMetrics === totalMetrics ? DISCO_COLORS.neonGreen + '40' : DISCO_COLORS.neonOrange + '40' }]}>
                <Text style={[styles.scoreText, { color: goodMetrics === totalMetrics ? DISCO_COLORS.neonGreen : DISCO_COLORS.neonOrange }]}>
                  {goodMetrics}/{totalMetrics}
                </Text>
              </View>
            </View>

            {/* Mini Metrics Preview */}
            <View style={styles.metricsPreview}>
              {item.data.metrics.slice(0, 3).map((metric, idx) => (
                <View key={idx} style={styles.miniMetric}>
                  <View style={[styles.miniMetricDot, { backgroundColor: getStatusColor(metric.status) }]} />
                  <Text style={styles.miniMetricName} numberOfLines={1}>{metric.name}</Text>
                </View>
              ))}
            </View>

            <View style={styles.reportFooter}>
              <Text style={styles.reportAuthor}>👨‍⚕️ {item.generatedBy}</Text>
              <View style={styles.exportBadges}>
                {item.exportFormats.slice(0, 3).map((format, idx) => (
                  <View key={idx} style={styles.formatBadge}>
                    <Text style={styles.formatText}>{format.toUpperCase()}</Text>
                  </View>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );

  const renderViewer = () => {
    if (!activeReport) return null;

    const template = analyticsExportService.getReportTemplate(activeReport.templateId);
    const goodMetrics = activeReport.data.metrics.filter(m => m.status === 'good').length;
    const warningMetrics = activeReport.data.metrics.filter(m => m.status === 'warning').length;
    const criticalMetrics = activeReport.data.metrics.filter(m => m.status === 'critical').length;

    return (
      <View style={styles.viewerContainer}>
        {/* Viewer Header */}
        <View style={styles.viewerHeader}>
          <TouchableOpacity onPress={() => setMode('templates')} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.viewerTitleContainer}>
            <Text style={styles.viewerTitle}>{activeReport.templateName}</Text>
            <Text style={styles.viewerDate}>{formatDate(activeReport.generatedAt)}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.viewerContent}>
          {/* Summary Card */}
          <Animated.View style={[styles.summaryCard, { transform: [{ scale: pulseAnim }] }, getGlowShadow(template?.discoColor || DISCO_COLORS.neonPink)]}>
            <Text style={styles.summaryTitle}>🪩 Report Summary</Text>
            <Text style={styles.summaryText}>{activeReport.data.summary}</Text>
            <View style={styles.summaryStats}>
              <View style={[styles.statItem, { backgroundColor: DISCO_COLORS.neonGreen + '30' }]}>
                <Text style={[styles.statValue, { color: DISCO_COLORS.neonGreen }]}>{goodMetrics}</Text>
                <Text style={styles.statLabel}>On Target</Text>
              </View>
              <View style={[styles.statItem, { backgroundColor: DISCO_COLORS.neonOrange + '30' }]}>
                <Text style={[styles.statValue, { color: DISCO_COLORS.neonOrange }]}>{warningMetrics}</Text>
                <Text style={styles.statLabel}>Warning</Text>
              </View>
              <View style={[styles.statItem, { backgroundColor: DISCO_COLORS.neonRed + '30' }]}>
                <Text style={[styles.statValue, { color: DISCO_COLORS.neonRed }]}>{criticalMetrics}</Text>
                <Text style={styles.statLabel}>Critical</Text>
              </View>
            </View>
          </Animated.View>

          {/* Metrics Grid */}
          <Text style={styles.sectionTitle}>📊 Key Metrics</Text>
          <View style={styles.metricsGrid}>
            {activeReport.data.metrics.map((metric, index) => (
              <View
                key={metric.metricId}
                style={[
                  styles.metricCard,
                  { borderColor: getStatusColor(metric.status) },
                  getGlowShadow(getStatusColor(metric.status), 0.6),
                ]}
              >
                <View style={styles.metricHeader}>
                  <Text style={styles.metricName} numberOfLines={2}>{metric.name}</Text>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(metric.status) }]} />
                </View>
                <Text style={[styles.metricValue, getNeonTextStyle(getStatusColor(metric.status))]}>
                  {metric.value}
                  {metric.target && <Text style={styles.metricUnit}>/{metric.target}</Text>}
                </Text>
                <View style={styles.metricChange}>
                  <Text style={styles.changeIcon}>{getChangeIcon(metric.changeDirection)}</Text>
                  <Text style={[styles.changeValue, { color: metric.changeDirection === 'up' ? DISCO_COLORS.neonGreen : metric.changeDirection === 'down' ? DISCO_COLORS.neonRed : '#888' }]}>
                    {metric.change}%
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Charts Section */}
          <Text style={styles.sectionTitle}>📈 Visualizations</Text>
          {activeReport.data.charts.map((chart, index) => (
            <View
              key={chart.chartId}
              style={[styles.chartCard, getGlowShadow(DISCO_COLORS.neonCyan, 0.5)]}
            >
              <Text style={styles.chartTitle}>{chart.title}</Text>
              <View style={styles.chartPlaceholder}>
                <Text style={styles.chartPlaceholderText}>📊</Text>
                <Text style={styles.chartType}>{chart.type.toUpperCase()} Chart</Text>
                <View style={styles.chartBars}>
                  {chart.datasets[0].data.map((value, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.chartBar,
                        {
                          height: `${value}%`,
                          backgroundColor: [DISCO_COLORS.neonPink, DISCO_COLORS.neonCyan, DISCO_COLORS.neonPurple, DISCO_COLORS.neonGreen, DISCO_COLORS.neonOrange, DISCO_COLORS.neonYellow][idx % 6],
                        },
                      ]}
                    />
                  ))}
                </View>
                <View style={styles.chartLabels}>
                  {chart.labels.map((label, idx) => (
                    <Text key={idx} style={styles.chartLabel}>{label}</Text>
                  ))}
                </View>
              </View>
            </View>
          ))}

          {/* Export Buttons */}
          <Text style={styles.sectionTitle}>📤 Export Options</Text>
          <View style={styles.exportGrid}>
            <TouchableOpacity
              style={[styles.exportButton, { backgroundColor: DISCO_COLORS.neonRed }, getGlowShadow(DISCO_COLORS.neonRed)]}
              onPress={() => handleExport('pdf')}
            >
              <Text style={styles.exportIcon}>📄</Text>
              <Text style={styles.exportLabel}>PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.exportButton, { backgroundColor: DISCO_COLORS.neonGreen }, getGlowShadow(DISCO_COLORS.neonGreen)]}
              onPress={() => handleExport('excel')}
            >
              <Text style={styles.exportIcon}>📊</Text>
              <Text style={styles.exportLabel}>Excel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.exportButton, { backgroundColor: DISCO_COLORS.neonCyan }, getGlowShadow(DISCO_COLORS.neonCyan)]}
              onPress={() => handleExport('csv')}
            >
              <Text style={styles.exportIcon}>📋</Text>
              <Text style={styles.exportLabel}>CSV</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.exportButton, { backgroundColor: DISCO_COLORS.neonPurple }, getGlowShadow(DISCO_COLORS.neonPurple)]}
              onPress={() => handleExport('json')}
            >
              <Text style={styles.exportIcon}>{ }</Text>
              <Text style={styles.exportLabel}>JSON</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  };

  return (
    <ScreenContainer containerClassName="bg-[#0D0D0D]">
      {/* Header */}
      <View style={styles.header}>
        <Animated.Text style={[styles.headerEmoji, { transform: [{ rotate: rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }]}>
          🪩
        </Animated.Text>
        <Text style={styles.headerTitle}>Analytics & Export</Text>
        <Text style={styles.headerSubtitle}>Disco Data Edition</Text>
      </View>

      {/* Tab Bar */}
      {mode !== 'viewer' && (
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, mode === 'templates' && styles.activeTab]}
            onPress={() => setMode('templates')}
          >
            <Text style={styles.tabIcon}>📊</Text>
            <Text style={[styles.tabLabel, mode === 'templates' && styles.activeTabLabel]}>Generate</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, mode === 'reports' && styles.activeTab]}
            onPress={() => setMode('reports')}
          >
            <Text style={styles.tabIcon}>📄</Text>
            <Text style={[styles.tabLabel, mode === 'reports' && styles.activeTabLabel]}>Reports</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      {mode === 'templates' && renderTemplates()}
      {mode === 'reports' && renderReports()}
      {mode === 'viewer' && renderViewer()}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', paddingVertical: 16, backgroundColor: DISCO_COLORS.midnightPurple },
  headerEmoji: { fontSize: 36 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#FFFFFF', letterSpacing: 2, textShadowColor: DISCO_COLORS.neonPurple, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 15 },
  headerSubtitle: { fontSize: 11, color: DISCO_COLORS.neonGreen, letterSpacing: 3, marginTop: 4 },
  tabBar: { flexDirection: 'row', backgroundColor: DISCO_COLORS.darkDisco, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: DISCO_COLORS.neonPurple + '40' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: DISCO_COLORS.neonPurple },
  tabIcon: { fontSize: 22 },
  tabLabel: { fontSize: 12, color: '#888', marginTop: 4 },
  activeTabLabel: { color: DISCO_COLORS.neonPurple },
  templatesContent: { padding: 16, paddingBottom: 100 },
  timeRangeContainer: { marginBottom: 24 },
  timeRangeLabel: { fontSize: 14, color: '#888', marginBottom: 12 },
  timeRangeScroll: { flexDirection: 'row' },
  timeRangeButton: { paddingHorizontal: 16, paddingVertical: 10, marginRight: 10, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', flexDirection: 'row', alignItems: 'center' },
  timeRangeButtonActive: { backgroundColor: DISCO_COLORS.neonPink + '30', borderColor: DISCO_COLORS.neonPink },
  timeRangeIcon: { fontSize: 14, marginRight: 6 },
  timeRangeText: { fontSize: 12, color: '#888' },
  timeRangeTextActive: { color: DISCO_COLORS.neonPink },
  sectionHeader: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center', marginBottom: 8 },
  sectionSubheader: { fontSize: 14, color: DISCO_COLORS.neonPurple, textAlign: 'center', marginBottom: 24 },
  templateGrid: { gap: 16 },
  templateCard: { backgroundColor: DISCO_COLORS.midnightPurple, borderRadius: 16, padding: 20, borderWidth: 2 },
  templateIcon: { fontSize: 40, marginBottom: 12 },
  templateName: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  templateDescription: { fontSize: 13, color: '#AAA', marginBottom: 12 },
  templateMeta: { flexDirection: 'row', gap: 16 },
  templateMetrics: { fontSize: 12, color: '#888' },
  templateCharts: { fontSize: 12, color: '#888' },
  generatingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  generatingText: { fontSize: 16, color: DISCO_COLORS.neonPink },
  reportsContent: { padding: 16, paddingBottom: 100 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 18, color: '#FFFFFF', fontWeight: '600' },
  emptySubtext: { fontSize: 14, color: '#888', marginTop: 8 },
  reportCard: { backgroundColor: DISCO_COLORS.midnightPurple, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 2 },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  reportTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
  reportDate: { fontSize: 12, color: '#888', marginTop: 4 },
  scoreBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  scoreText: { fontSize: 14, fontWeight: 'bold' },
  metricsPreview: { marginBottom: 12 },
  miniMetric: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  miniMetricDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  miniMetricName: { fontSize: 12, color: '#AAA', flex: 1 },
  reportFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reportAuthor: { fontSize: 12, color: '#666' },
  exportBadges: { flexDirection: 'row', gap: 6 },
  formatBadge: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  formatText: { fontSize: 10, color: '#888' },
  viewerContainer: { flex: 1 },
  viewerHeader: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: DISCO_COLORS.darkDisco, borderBottomWidth: 1, borderBottomColor: DISCO_COLORS.neonPurple + '40' },
  backButton: { paddingRight: 12 },
  backButtonText: { color: DISCO_COLORS.neonPurple, fontSize: 14 },
  viewerTitleContainer: { flex: 1 },
  viewerTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },
  viewerDate: { fontSize: 12, color: '#888' },
  viewerContent: { padding: 16, paddingBottom: 100 },
  summaryCard: { backgroundColor: DISCO_COLORS.midnightPurple, borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 2, borderColor: DISCO_COLORS.neonPink },
  summaryTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 12 },
  summaryText: { fontSize: 14, color: '#AAA', lineHeight: 22, marginBottom: 16 },
  summaryStats: { flexDirection: 'row', gap: 12 },
  statItem: { flex: 1, padding: 12, borderRadius: 12, alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: 'bold' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 16, marginTop: 8 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  metricCard: { width: '47%', backgroundColor: DISCO_COLORS.midnightPurple, borderRadius: 12, padding: 14, borderWidth: 2 },
  metricHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  metricName: { fontSize: 12, color: '#AAA', flex: 1, marginRight: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  metricValue: { fontSize: 24, fontWeight: 'bold' },
  metricUnit: { fontSize: 14, color: '#666' },
  metricChange: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  changeIcon: { fontSize: 12, marginRight: 4 },
  changeValue: { fontSize: 12 },
  chartCard: { backgroundColor: DISCO_COLORS.midnightPurple, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 2, borderColor: DISCO_COLORS.neonCyan },
  chartTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 16 },
  chartPlaceholder: { alignItems: 'center', paddingVertical: 20 },
  chartPlaceholderText: { fontSize: 40, marginBottom: 8 },
  chartType: { fontSize: 12, color: '#888', marginBottom: 16 },
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', height: 100, gap: 8, marginBottom: 8 },
  chartBar: { width: 30, borderRadius: 4 },
  chartLabels: { flexDirection: 'row', gap: 8 },
  chartLabel: { width: 30, fontSize: 10, color: '#666', textAlign: 'center' },
  exportGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 40 },
  exportButton: { width: '47%', paddingVertical: 20, borderRadius: 16, alignItems: 'center' },
  exportIcon: { fontSize: 28, marginBottom: 8 },
  exportLabel: { fontSize: 14, fontWeight: 'bold', color: '#000' },
});
