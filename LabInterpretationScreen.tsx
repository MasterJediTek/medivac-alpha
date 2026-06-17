/**
 * Lab Result Auto-Interpretation Screen
 * AI-powered lab analysis dashboard
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import {
  labInterpretationService,
  LabDashboard,
  LabInterpretation,
  CriticalValueAlert,
  LabResult,
  LabTest,
} from '@/src/services/LabInterpretationService';

type ViewMode = 'dashboard' | 'results' | 'criticals' | 'tests';

export default function LabInterpretationScreen() {
  const colors = useColors();
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [dashboard, setDashboard] = useState<LabDashboard | null>(null);
  const [criticalAlerts, setCriticalAlerts] = useState<CriticalValueAlert[]>([]);
  const [availableTests, setAvailableTests] = useState<LabTest[]>([]);
  const [selectedInterpretation, setSelectedInterpretation] = useState<LabInterpretation | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(() => {
    setDashboard(labInterpretationService.getDashboard());
    setCriticalAlerts(labInterpretationService.getCriticalAlerts());
    setAvailableTests(labInterpretationService.getAvailableTests());
  }, []);

  useEffect(() => {
    labInterpretationService.initialize();
    loadData();
    const unsubscribe = labInterpretationService.subscribe(loadData);
    return unsubscribe;
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
    setTimeout(() => setRefreshing(false), 500);
  }, [loadData]);

  const handleAddSampleResult = async () => {
    const tests = ['HGB', 'K', 'GLU', 'CREAT', 'TROP', 'WBC', 'PLT', 'NA'];
    const testCode = tests[Math.floor(Math.random() * tests.length)];
    const test = availableTests.find(t => t.code === testCode);
    if (!test) return;

    // Generate a value that might be abnormal
    const range = test.referenceRange;
    const isAbnormal = Math.random() > 0.5;
    let value: number;

    if (isAbnormal) {
      const isCritical = Math.random() > 0.7;
      if (isCritical && range.criticalHigh) {
        value = range.criticalHigh + Math.random() * 10;
      } else if (isCritical && range.criticalLow) {
        value = range.criticalLow - Math.random() * 2;
      } else {
        value = Math.random() > 0.5 ? range.high + Math.random() * 5 : range.low - Math.random() * 2;
      }
    } else {
      value = range.low + Math.random() * (range.high - range.low);
    }

    value = Math.round(value * 100) / 100;

    try {
      const result = await labInterpretationService.addResult(
        'PAT-001',
        'John Smith',
        testCode,
        value,
        'Dr. Johnson'
      );

      if (result.criticalAlert) {
        Alert.alert('Critical Value', `${result.result.testName}: ${value} ${result.result.unit}\n\nThis is a critical value requiring immediate attention.`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add result');
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    await labInterpretationService.acknowledgeCriticalAlert(alertId, 'Current User');
  };

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const renderDashboard = () => {
    if (!dashboard) return null;

    return (
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.dashboardContent}
      >
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: '#EF4444' }]}>{dashboard.criticalAlerts}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Critical</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>{dashboard.deltaCheckAlerts}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Delta Alerts</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: '#22C55E' }]}>{dashboard.todayResulted}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Today</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{dashboard.abnormalRate}%</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Abnormal</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#3B82F6' }]}
              onPress={handleAddSampleResult}
            >
              <Text style={styles.actionIcon}>🧪</Text>
              <Text style={styles.actionText}>Add Result</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#EF4444' }]}
              onPress={() => setViewMode('criticals')}
            >
              <Text style={styles.actionIcon}>⚠️</Text>
              <Text style={styles.actionText}>Criticals</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#8B5CF6' }]}
              onPress={() => setViewMode('tests')}
            >
              <Text style={styles.actionIcon}>📋</Text>
              <Text style={styles.actionText}>Test List</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Criticals */}
        {dashboard.recentCriticals.length > 0 && (
          <View style={[styles.section, { backgroundColor: '#FEE2E2' }]}>
            <Text style={[styles.sectionTitle, { color: '#991B1B' }]}>Critical Values</Text>
            {dashboard.recentCriticals.map((alert) => (
              <TouchableOpacity
                key={alert.id}
                style={styles.criticalItem}
                onPress={() => handleAcknowledgeAlert(alert.id)}
              >
                <View style={styles.criticalInfo}>
                  <Text style={[styles.criticalPatient, { color: '#991B1B' }]}>{alert.patientName}</Text>
                  <Text style={[styles.criticalTest, { color: '#B91C1C' }]}>
                    {alert.testName}: {alert.value} {alert.unit}
                  </Text>
                </View>
                <View style={[styles.criticalBadge, { backgroundColor: '#EF4444' }]}>
                  <Text style={styles.criticalBadgeText}>{alert.direction.toUpperCase()}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Recent Interpretations */}
        {dashboard.recentInterpretations.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Interpretations</Text>
            {dashboard.recentInterpretations.map((interp) => (
              <TouchableOpacity
                key={interp.id}
                style={styles.interpItem}
                onPress={() => setSelectedInterpretation(interp)}
              >
                <View style={styles.interpHeader}>
                  <View
                    style={[
                      styles.flagDot,
                      { backgroundColor: labInterpretationService.getFlagColor(interp.flag) },
                    ]}
                  />
                  <Text style={[styles.interpTest, { color: colors.foreground }]}>{interp.testName}</Text>
                  <Text style={[styles.interpValue, { color: labInterpretationService.getFlagColor(interp.flag) }]}>
                    {interp.value} {interp.unit}
                  </Text>
                </View>
                <Text style={[styles.interpSummary, { color: colors.muted }]} numberOfLines={2}>
                  {interp.interpretation}
                </Text>
                <View style={styles.interpMeta}>
                  <View
                    style={[
                      styles.urgencyBadge,
                      { backgroundColor: labInterpretationService.getUrgencyColor(interp.urgency) + '20' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.urgencyText,
                        { color: labInterpretationService.getUrgencyColor(interp.urgency) },
                      ]}
                    >
                      {interp.urgency.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={[styles.interpTime, { color: colors.muted }]}>{formatTime(interp.generatedAt)}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* AI Confidence */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>AI Interpretation Engine</Text>
          <View style={styles.aiInfo}>
            <View style={styles.aiStat}>
              <Text style={[styles.aiValue, { color: '#22C55E' }]}>92%</Text>
              <Text style={[styles.aiLabel, { color: colors.muted }]}>Avg Confidence</Text>
            </View>
            <View style={styles.aiStat}>
              <Text style={[styles.aiValue, { color: colors.primary }]}>23</Text>
              <Text style={[styles.aiLabel, { color: colors.muted }]}>Tests Supported</Text>
            </View>
            <View style={styles.aiStat}>
              <Text style={[styles.aiValue, { color: '#8B5CF6' }]}>8</Text>
              <Text style={[styles.aiLabel, { color: colors.muted }]}>Panels</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderCriticals = () => (
    <FlatList
      data={criticalAlerts}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Text style={[styles.emptyIcon, { color: colors.muted }]}>✓</Text>
          <Text style={[styles.emptyText, { color: colors.muted }]}>No critical alerts</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={[styles.alertCard, { backgroundColor: '#FEE2E2' }]}>
          <View style={styles.alertHeader}>
            <Text style={[styles.alertPatient, { color: '#991B1B' }]}>{item.patientName}</Text>
            <View style={[styles.escalationBadge, { backgroundColor: '#EF4444' }]}>
              <Text style={styles.escalationText}>Level {item.escalationLevel}</Text>
            </View>
          </View>

          <View style={styles.alertBody}>
            <Text style={[styles.alertTest, { color: '#B91C1C' }]}>{item.testName}</Text>
            <View style={styles.alertValues}>
              <Text style={[styles.alertValue, { color: '#991B1B' }]}>
                {item.value} {item.unit}
              </Text>
              <Text style={[styles.alertThreshold, { color: '#B91C1C' }]}>
                Threshold: {item.direction === 'high' ? '>' : '<'} {item.criticalThreshold}
              </Text>
            </View>
          </View>

          <View style={styles.alertFooter}>
            <Text style={[styles.alertTime, { color: '#B91C1C' }]}>
              Notified: {formatTime(item.notifiedAt)}
            </Text>
            <TouchableOpacity
              style={[styles.ackBtn, { backgroundColor: '#22C55E' }]}
              onPress={() => handleAcknowledgeAlert(item.id)}
            >
              <Text style={styles.ackBtnText}>Acknowledge</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    />
  );

  const renderTests = () => (
    <FlatList
      data={availableTests}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => (
        <View style={[styles.testCard, { backgroundColor: colors.surface }]}>
          <View style={styles.testHeader}>
            <Text style={[styles.testCode, { color: colors.primary }]}>{item.code}</Text>
            <View style={[styles.categoryBadge, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.categoryText, { color: colors.primary }]}>{item.category}</Text>
            </View>
          </View>
          <Text style={[styles.testName, { color: colors.foreground }]}>{item.name}</Text>
          <Text style={[styles.testDesc, { color: colors.muted }]}>{item.description}</Text>
          <View style={styles.rangeRow}>
            <Text style={[styles.rangeLabel, { color: colors.muted }]}>Reference:</Text>
            <Text style={[styles.rangeValue, { color: colors.foreground }]}>
              {item.referenceRange.low} - {item.referenceRange.high} {item.referenceRange.unit}
            </Text>
          </View>
          {(item.referenceRange.criticalLow || item.referenceRange.criticalHigh) && (
            <View style={styles.rangeRow}>
              <Text style={[styles.rangeLabel, { color: '#EF4444' }]}>Critical:</Text>
              <Text style={[styles.rangeValue, { color: '#EF4444' }]}>
                {item.referenceRange.criticalLow !== undefined && `< ${item.referenceRange.criticalLow}`}
                {item.referenceRange.criticalLow !== undefined && item.referenceRange.criticalHigh !== undefined && ' or '}
                {item.referenceRange.criticalHigh !== undefined && `> ${item.referenceRange.criticalHigh}`}
              </Text>
            </View>
          )}
        </View>
      )}
    />
  );

  const renderInterpretationDetail = () => {
    if (!selectedInterpretation) return null;

    return (
      <View style={[styles.detailOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.detailCard, { backgroundColor: colors.background }]}>
          <ScrollView>
            <View style={styles.detailHeader}>
              <View>
                <Text style={[styles.detailTest, { color: colors.foreground }]}>
                  {selectedInterpretation.testName}
                </Text>
                <Text
                  style={[
                    styles.detailValue,
                    { color: labInterpretationService.getFlagColor(selectedInterpretation.flag) },
                  ]}
                >
                  {selectedInterpretation.value} {selectedInterpretation.unit}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedInterpretation(null)}>
                <Text style={[styles.closeBtn, { color: colors.primary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.urgencyBanner,
                { backgroundColor: labInterpretationService.getUrgencyColor(selectedInterpretation.urgency) + '20' },
              ]}
            >
              <Text
                style={[
                  styles.urgencyBannerText,
                  { color: labInterpretationService.getUrgencyColor(selectedInterpretation.urgency) },
                ]}
              >
                {selectedInterpretation.urgency.toUpperCase()} - Confidence: {selectedInterpretation.confidenceScore.toFixed(0)}%
              </Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={[styles.detailSectionTitle, { color: colors.foreground }]}>Interpretation</Text>
              <Text style={[styles.detailText, { color: colors.foreground }]}>
                {selectedInterpretation.interpretation}
              </Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={[styles.detailSectionTitle, { color: colors.foreground }]}>Clinical Significance</Text>
              <Text style={[styles.detailText, { color: colors.foreground }]}>
                {selectedInterpretation.clinicalSignificance}
              </Text>
            </View>

            {selectedInterpretation.possibleCauses.length > 0 && (
              <View style={styles.detailSection}>
                <Text style={[styles.detailSectionTitle, { color: colors.foreground }]}>Possible Causes</Text>
                {selectedInterpretation.possibleCauses.map((cause, idx) => (
                  <Text key={idx} style={[styles.listItem, { color: colors.foreground }]}>• {cause}</Text>
                ))}
              </View>
            )}

            {selectedInterpretation.recommendedActions.length > 0 && (
              <View style={styles.detailSection}>
                <Text style={[styles.detailSectionTitle, { color: colors.foreground }]}>Recommended Actions</Text>
                {selectedInterpretation.recommendedActions.map((action, idx) => (
                  <Text key={idx} style={[styles.listItem, { color: colors.primary }]}>→ {action}</Text>
                ))}
              </View>
            )}

            {selectedInterpretation.followUpTests.length > 0 && (
              <View style={styles.detailSection}>
                <Text style={[styles.detailSectionTitle, { color: colors.foreground }]}>Follow-up Tests</Text>
                {selectedInterpretation.followUpTests.map((test, idx) => (
                  <Text key={idx} style={[styles.listItem, { color: '#8B5CF6' }]}>🧪 {test}</Text>
                ))}
              </View>
            )}

            {selectedInterpretation.deltaChange !== undefined && (
              <View style={styles.trendSection}>
                <Text style={[styles.detailSectionTitle, { color: colors.foreground }]}>Trend</Text>
                <View style={styles.trendInfo}>
                  <Text
                    style={[
                      styles.trendValue,
                      { color: selectedInterpretation.trend === 'improving' ? '#22C55E' : selectedInterpretation.trend === 'worsening' ? '#EF4444' : colors.muted },
                    ]}
                  >
                    {selectedInterpretation.deltaChange > 0 ? '+' : ''}{selectedInterpretation.deltaChange.toFixed(1)}%
                  </Text>
                  <Text style={[styles.trendLabel, { color: colors.muted }]}>
                    {selectedInterpretation.trend.toUpperCase()}
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer>
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Lab Interpretation</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>AI-Powered Analysis</Text>
      </View>

      <View style={[styles.viewToggle, { backgroundColor: colors.surface }]}>
        {(['dashboard', 'criticals', 'tests'] as ViewMode[]).map((mode) => (
          <TouchableOpacity
            key={mode}
            style={[styles.toggleBtn, viewMode === mode && { backgroundColor: colors.primary }]}
            onPress={() => setViewMode(mode)}
          >
            <Text style={[styles.toggleText, { color: viewMode === mode ? '#FFFFFF' : colors.foreground }]}>
              {mode === 'dashboard' ? 'Dashboard' : mode === 'criticals' ? 'Criticals' : 'Tests'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {viewMode === 'dashboard' && renderDashboard()}
      {viewMode === 'criticals' && renderCriticals()}
      {viewMode === 'tests' && renderTests()}

      {selectedInterpretation && renderInterpretationDetail()}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { padding: 16, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { fontSize: 14, marginTop: 4 },
  viewToggle: { flexDirection: 'row', marginHorizontal: 16, borderRadius: 8, padding: 4, marginBottom: 12 },
  toggleBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  toggleText: { fontSize: 13, fontWeight: '600' },
  dashboardContent: { padding: 16, paddingBottom: 100 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  statCard: { width: '47%', padding: 16, borderRadius: 12, alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: 'bold' },
  statLabel: { fontSize: 12, marginTop: 4 },
  section: { padding: 16, borderRadius: 12, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  actionGrid: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  actionIcon: { fontSize: 24, marginBottom: 8 },
  actionText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  criticalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.1)' },
  criticalInfo: { flex: 1 },
  criticalPatient: { fontSize: 14, fontWeight: '600' },
  criticalTest: { fontSize: 13, marginTop: 2 },
  criticalBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  criticalBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '600' },
  interpItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  interpHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  flagDot: { width: 10, height: 10, borderRadius: 5 },
  interpTest: { flex: 1, fontSize: 14, fontWeight: '500' },
  interpValue: { fontSize: 14, fontWeight: '600' },
  interpSummary: { fontSize: 13, lineHeight: 18, marginBottom: 8 },
  interpMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  urgencyBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  urgencyText: { fontSize: 10, fontWeight: '600' },
  interpTime: { fontSize: 11 },
  aiInfo: { flexDirection: 'row', justifyContent: 'space-around' },
  aiStat: { alignItems: 'center' },
  aiValue: { fontSize: 24, fontWeight: 'bold' },
  aiLabel: { fontSize: 11, marginTop: 4 },
  listContent: { padding: 16, paddingBottom: 100 },
  emptyState: { alignItems: 'center', padding: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 16 },
  alertCard: { padding: 16, borderRadius: 12, marginBottom: 12 },
  alertHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  alertPatient: { fontSize: 16, fontWeight: '600' },
  escalationBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  escalationText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
  alertBody: { marginBottom: 12 },
  alertTest: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  alertValues: { flexDirection: 'row', gap: 16 },
  alertValue: { fontSize: 16, fontWeight: 'bold' },
  alertThreshold: { fontSize: 14 },
  alertFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  alertTime: { fontSize: 12 },
  ackBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  ackBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  testCard: { padding: 16, borderRadius: 12, marginBottom: 12 },
  testHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  testCode: { fontSize: 18, fontWeight: 'bold' },
  categoryBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  categoryText: { fontSize: 11, fontWeight: '600' },
  testName: { fontSize: 14, fontWeight: '500', marginBottom: 4 },
  testDesc: { fontSize: 13, marginBottom: 12 },
  rangeRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  rangeLabel: { fontSize: 12 },
  rangeValue: { fontSize: 12, fontWeight: '500' },
  detailOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', padding: 16 },
  detailCard: { width: '100%', maxHeight: '90%', borderRadius: 16, padding: 20 },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  detailTest: { fontSize: 20, fontWeight: 'bold' },
  detailValue: { fontSize: 24, fontWeight: 'bold', marginTop: 4 },
  closeBtn: { fontSize: 24, fontWeight: 'bold' },
  urgencyBanner: { padding: 12, borderRadius: 8, marginBottom: 16 },
  urgencyBannerText: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  detailSection: { marginBottom: 16 },
  detailSectionTitle: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  detailText: { fontSize: 14, lineHeight: 20 },
  listItem: { fontSize: 14, lineHeight: 22 },
  trendSection: { marginBottom: 16 },
  trendInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  trendValue: { fontSize: 24, fontWeight: 'bold' },
  trendLabel: { fontSize: 14 },
});
