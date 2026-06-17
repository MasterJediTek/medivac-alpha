/**
 * Quality Metrics Dashboard Screen
 * MediVac One v3.1 - Healthcare Quality Analytics
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { QualityMetricsService, HCAHPSScore, InfectionRate, ReadmissionData, MortalityData, PatientSafetyIndicator } from '../services/QualityMetricsService';

type TabType = 'overview' | 'hcahps' | 'infections' | 'readmissions' | 'mortality' | 'safety';

export default function QualityMetricsScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof QualityMetricsService.getDashboardSummary>> | null>(null);
  const [hcahps, setHcahps] = useState<HCAHPSScore | null>(null);
  const [infections, setInfections] = useState<InfectionRate[]>([]);
  const [readmissions, setReadmissions] = useState<ReadmissionData | null>(null);
  const [mortality, setMortality] = useState<MortalityData | null>(null);
  const [safety, setSafety] = useState<PatientSafetyIndicator[]>([]);
  const [compositeScore, setCompositeScore] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [summaryData, hcahpsData, infectionsData, readmissionsData, mortalityData, safetyData] = await Promise.all([
        QualityMetricsService.getDashboardSummary(),
        QualityMetricsService.getHCAHPSScores(),
        QualityMetricsService.getInfectionRates(),
        QualityMetricsService.getReadmissionData(),
        QualityMetricsService.getMortalityData(),
        QualityMetricsService.getPatientSafetyIndicators(),
      ]);
      setSummary(summaryData);
      setHcahps(hcahpsData);
      setInfections(infectionsData);
      setReadmissions(readmissionsData);
      setMortality(mortalityData);
      setSafety(safetyData);
      setCompositeScore(QualityMetricsService.calculateCompositeScore());
    } catch (error) {
      console.error('Failed to load quality metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number, target = 70) => {
    if (score >= target) return '#10B981';
    if (score >= target - 10) return '#F59E0B';
    return '#EF4444';
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'improving') return '📈';
    if (trend === 'declining') return '📉';
    return '➡️';
  };

  const renderOverview = () => {
    if (!summary) return null;

    return (
      <View style={styles.tabContent}>
        {/* Composite Score */}
        <View style={styles.compositeCard}>
          <Text style={styles.compositeLabel}>Overall Quality Score</Text>
          <Text style={[styles.compositeScore, { color: getScoreColor(compositeScore) }]}>
            {compositeScore}
          </Text>
          <Text style={styles.compositeSubtext}>Composite of all quality metrics</Text>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryIcon}>⭐</Text>
            <Text style={styles.summaryValue}>{summary.hcahps.overall}%</Text>
            <Text style={styles.summaryLabel}>HCAHPS</Text>
            <Text style={styles.summaryTrend}>{getTrendIcon(summary.hcahps.trend)}</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryIcon}>🦠</Text>
            <Text style={styles.summaryValue}>{summary.infections.total}</Text>
            <Text style={styles.summaryLabel}>Infections</Text>
            <Text style={styles.summarySubvalue}>{summary.infections.aboveBenchmark} above benchmark</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryIcon}>🔄</Text>
            <Text style={[styles.summaryValue, summary.readmissions.penaltyRisk && { color: '#EF4444' }]}>
              {summary.readmissions.rate}%
            </Text>
            <Text style={styles.summaryLabel}>Readmissions</Text>
            {summary.readmissions.penaltyRisk && <Text style={styles.penaltyBadge}>⚠️ Penalty Risk</Text>}
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryIcon}>📊</Text>
            <Text style={[styles.summaryValue, { color: summary.mortality.ratio <= 1 ? '#10B981' : '#EF4444' }]}>
              {summary.mortality.ratio.toFixed(2)}
            </Text>
            <Text style={styles.summaryLabel}>O/E Ratio</Text>
            <Text style={styles.summaryTrend}>{getTrendIcon(summary.mortality.trend)}</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryIcon}>🛡️</Text>
            <Text style={styles.summaryValue}>{summary.safety.incidents}</Text>
            <Text style={styles.summaryLabel}>Safety Events</Text>
            <Text style={styles.summaryTrend}>{getTrendIcon(summary.safety.trend)}</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryIcon}>🔔</Text>
            <Text style={[styles.summaryValue, summary.alerts.critical > 0 && { color: '#EF4444' }]}>
              {summary.alerts.total}
            </Text>
            <Text style={styles.summaryLabel}>Active Alerts</Text>
            {summary.alerts.critical > 0 && <Text style={styles.criticalBadge}>{summary.alerts.critical} Critical</Text>}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsCard}>
          <Text style={styles.sectionTitle}>Quality Improvement</Text>
          <View style={styles.actionRow}>
            <View style={styles.actionStat}>
              <Text style={styles.actionValue}>{summary.improvements.active}</Text>
              <Text style={styles.actionLabel}>Active Initiatives</Text>
            </View>
            <View style={styles.actionStat}>
              <Text style={styles.actionValue}>{summary.improvements.completed}</Text>
              <Text style={styles.actionLabel}>Completed</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderHCAHPS = () => {
    if (!hcahps) return null;

    const metrics = [
      { label: 'Overall Rating', value: hcahps.overallRating, target: 75 },
      { label: 'Recommend Hospital', value: hcahps.recommendHospital, target: 75 },
      { label: 'Nurse Communication', value: hcahps.nursesCommunication, target: 80 },
      { label: 'Doctor Communication', value: hcahps.doctorsCommunication, target: 80 },
      { label: 'Responsiveness', value: hcahps.responsiveness, target: 70 },
      { label: 'Pain Management', value: hcahps.painManagement, target: 70 },
      { label: 'Medication Communication', value: hcahps.medicationCommunication, target: 65 },
      { label: 'Discharge Information', value: hcahps.dischargeInformation, target: 85 },
      { label: 'Care Transition', value: hcahps.careTransition, target: 55 },
      { label: 'Cleanliness', value: hcahps.cleanliness, target: 75 },
      { label: 'Quietness', value: hcahps.quietness, target: 65 },
    ];

    return (
      <View style={styles.tabContent}>
        <View style={styles.hcahpsHeader}>
          <Text style={styles.sectionTitle}>HCAHPS Patient Experience</Text>
          <View style={styles.surveyInfo}>
            <Text style={styles.surveyText}>Surveys: {hcahps.surveyCount}</Text>
            <Text style={styles.surveyText}>Response Rate: {hcahps.responseRate}%</Text>
          </View>
        </View>

        {metrics.map((metric, index) => (
          <View key={index} style={styles.hcahpsMetric}>
            <View style={styles.hcahpsMetricHeader}>
              <Text style={styles.hcahpsLabel}>{metric.label}</Text>
              <Text style={[styles.hcahpsValue, { color: getScoreColor(metric.value, metric.target) }]}>
                {metric.value}%
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${metric.value}%`, backgroundColor: getScoreColor(metric.value, metric.target) }]} />
              <View style={[styles.targetMarker, { left: `${metric.target}%` }]} />
            </View>
            <Text style={styles.targetText}>Target: {metric.target}%</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderInfections = () => {
    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Healthcare-Associated Infections</Text>
        
        {infections.map((infection) => (
          <View key={infection.type} style={styles.infectionCard}>
            <View style={styles.infectionHeader}>
              <Text style={styles.infectionType}>{infection.type}</Text>
              <Text style={styles.infectionTrend}>{getTrendIcon(infection.trend)}</Text>
            </View>
            <Text style={styles.infectionName}>{infection.name}</Text>
            
            <View style={styles.infectionStats}>
              <View style={styles.infectionStat}>
                <Text style={[styles.infectionValue, { color: infection.currentRate <= infection.targetRate ? '#10B981' : '#EF4444' }]}>
                  {infection.currentRate.toFixed(2)}
                </Text>
                <Text style={styles.infectionStatLabel}>Current Rate</Text>
              </View>
              <View style={styles.infectionStat}>
                <Text style={styles.infectionValue}>{infection.targetRate.toFixed(2)}</Text>
                <Text style={styles.infectionStatLabel}>Target</Text>
              </View>
              <View style={styles.infectionStat}>
                <Text style={styles.infectionValue}>{infection.nationalBenchmark.toFixed(2)}</Text>
                <Text style={styles.infectionStatLabel}>National</Text>
              </View>
              <View style={styles.infectionStat}>
                <Text style={styles.infectionValue}>{infection.infections}</Text>
                <Text style={styles.infectionStatLabel}>Infections</Text>
              </View>
            </View>

            <View style={styles.infectionProgress}>
              <View style={[styles.progressBar, { height: 8 }]}>
                <View style={[styles.progressFill, { width: `${Math.min(100, (infection.currentRate / infection.targetRate) * 50)}%`, backgroundColor: infection.currentRate <= infection.targetRate ? '#10B981' : '#EF4444' }]} />
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderReadmissions = () => {
    if (!readmissions) return null;

    return (
      <View style={styles.tabContent}>
        <View style={styles.readmissionHeader}>
          <Text style={styles.sectionTitle}>30-Day Readmissions</Text>
          {readmissions.penaltyRisk && (
            <View style={styles.penaltyWarning}>
              <Text style={styles.penaltyWarningText}>⚠️ CMS Penalty Risk</Text>
            </View>
          )}
        </View>

        <View style={styles.overallReadmission}>
          <Text style={styles.overallLabel}>Overall Rate</Text>
          <Text style={[styles.overallValue, { color: readmissions.overall30Day > 15 ? '#EF4444' : '#10B981' }]}>
            {readmissions.overall30Day}%
          </Text>
          <Text style={styles.trendText}>{getTrendIcon(readmissions.trend)} {readmissions.trend}</Text>
        </View>

        <Text style={styles.subsectionTitle}>By Condition</Text>
        {readmissions.byCondition.map((item, index) => (
          <View key={index} style={styles.conditionCard}>
            <View style={styles.conditionHeader}>
              <Text style={styles.conditionName}>{item.condition}</Text>
              <Text style={[styles.conditionRate, { color: item.rate > item.target ? '#EF4444' : '#10B981' }]}>
                {item.rate}%
              </Text>
            </View>
            <View style={styles.conditionDetails}>
              <Text style={styles.conditionDetail}>Count: {item.count}</Text>
              <Text style={styles.conditionDetail}>Target: {item.target}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min(100, (item.rate / 25) * 100)}%`, backgroundColor: item.rate > item.target ? '#EF4444' : '#10B981' }]} />
            </View>
          </View>
        ))}

        <Text style={[styles.subsectionTitle, { marginTop: 24 }]}>By Payer</Text>
        {readmissions.byPayer.map((item, index) => (
          <View key={index} style={styles.payerRow}>
            <Text style={styles.payerName}>{item.payer}</Text>
            <Text style={styles.payerRate}>{item.rate}%</Text>
            <Text style={styles.payerCount}>({item.count})</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderMortality = () => {
    if (!mortality) return null;

    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Mortality Metrics</Text>

        <View style={styles.mortalityOverview}>
          <View style={styles.mortalityStat}>
            <Text style={styles.mortalityLabel}>Observed Rate</Text>
            <Text style={styles.mortalityValue}>{mortality.overallRate}%</Text>
          </View>
          <View style={styles.mortalityStat}>
            <Text style={styles.mortalityLabel}>Expected Rate</Text>
            <Text style={styles.mortalityValue}>{mortality.expectedRate}%</Text>
          </View>
          <View style={styles.mortalityStat}>
            <Text style={styles.mortalityLabel}>O/E Ratio</Text>
            <Text style={[styles.mortalityValue, { color: mortality.observedToExpected <= 1 ? '#10B981' : '#EF4444' }]}>
              {mortality.observedToExpected.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.ratioExplanation}>
          <Text style={styles.ratioText}>
            {mortality.observedToExpected <= 1 
              ? '✅ Performing better than expected (O/E < 1.0)'
              : '⚠️ Performing below expected (O/E > 1.0)'}
          </Text>
        </View>

        <Text style={styles.subsectionTitle}>By Condition</Text>
        {mortality.byCondition.map((item, index) => (
          <View key={index} style={styles.mortalityCondition}>
            <Text style={styles.mortalityConditionName}>{item.condition}</Text>
            <View style={styles.mortalityConditionStats}>
              <View style={styles.mortalityConditionStat}>
                <Text style={styles.statValue}>{item.observed}%</Text>
                <Text style={styles.statLabel}>Observed</Text>
              </View>
              <View style={styles.mortalityConditionStat}>
                <Text style={styles.statValue}>{item.expected}%</Text>
                <Text style={styles.statLabel}>Expected</Text>
              </View>
              <View style={styles.mortalityConditionStat}>
                <Text style={[styles.statValue, { color: item.ratio <= 1 ? '#10B981' : '#EF4444' }]}>
                  {item.ratio.toFixed(2)}
                </Text>
                <Text style={styles.statLabel}>Ratio</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderSafety = () => {
    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Patient Safety Indicators</Text>

        {safety.map((indicator) => (
          <View key={indicator.id} style={styles.safetyCard}>
            <View style={styles.safetyHeader}>
              <Text style={styles.safetyId}>{indicator.id}</Text>
              <Text style={styles.safetyTrend}>{getTrendIcon(indicator.trend)}</Text>
            </View>
            <Text style={styles.safetyName}>{indicator.name}</Text>
            <Text style={styles.safetyCategory}>{indicator.category}</Text>

            <View style={styles.safetyStats}>
              <View style={styles.safetyStat}>
                <Text style={[styles.safetyValue, { color: indicator.currentRate <= indicator.targetRate ? '#10B981' : '#EF4444' }]}>
                  {indicator.currentRate.toFixed(1)}
                </Text>
                <Text style={styles.safetyStatLabel}>Current</Text>
              </View>
              <View style={styles.safetyStat}>
                <Text style={styles.safetyValue}>{indicator.targetRate.toFixed(1)}</Text>
                <Text style={styles.safetyStatLabel}>Target</Text>
              </View>
              <View style={styles.safetyStat}>
                <Text style={styles.safetyValue}>{indicator.benchmark.toFixed(1)}</Text>
                <Text style={styles.safetyStatLabel}>Benchmark</Text>
              </View>
              <View style={styles.safetyStat}>
                <Text style={styles.safetyValue}>{indicator.incidents}</Text>
                <Text style={styles.safetyStatLabel}>Incidents</Text>
              </View>
            </View>

            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min(100, (indicator.currentRate / Math.max(indicator.targetRate * 2, 1)) * 100)}%`, backgroundColor: indicator.currentRate <= indicator.targetRate ? '#10B981' : '#EF4444' }]} />
            </View>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading quality metrics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📊 Quality Dashboard</Text>
        <Text style={styles.headerSubtitle}>Healthcare Quality Metrics & Analytics</Text>
      </View>

      <View style={styles.tabs}>
        {(['overview', 'hcahps', 'infections', 'readmissions', 'mortality', 'safety'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'hcahps' ? 'HCAHPS' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'hcahps' && renderHCAHPS()}
        {activeTab === 'infections' && renderInfections()}
        {activeTab === 'readmissions' && renderReadmissions()}
        {activeTab === 'mortality' && renderMortality()}
        {activeTab === 'safety' && renderSafety()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { padding: 20, backgroundColor: '#1E293B', borderBottomWidth: 1, borderBottomColor: '#334155' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#F8FAFC' },
  headerSubtitle: { fontSize: 14, color: '#94A3B8', marginTop: 4 },
  tabs: { flexDirection: 'row', backgroundColor: '#1E293B', borderBottomWidth: 1, borderBottomColor: '#334155', flexWrap: 'wrap' },
  tab: { paddingHorizontal: 16, paddingVertical: 12 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#3B82F6' },
  tabText: { fontSize: 13, color: '#94A3B8' },
  tabTextActive: { color: '#3B82F6', fontWeight: '600' },
  content: { flex: 1 },
  tabContent: { padding: 20 },
  compositeCard: { backgroundColor: '#1E293B', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20 },
  compositeLabel: { fontSize: 16, color: '#94A3B8' },
  compositeScore: { fontSize: 72, fontWeight: 'bold', marginVertical: 8 },
  compositeSubtext: { fontSize: 14, color: '#64748B' },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  summaryCard: { backgroundColor: '#1E293B', borderRadius: 12, padding: 16, width: '48%', alignItems: 'center' },
  summaryIcon: { fontSize: 24, marginBottom: 8 },
  summaryValue: { fontSize: 28, fontWeight: 'bold', color: '#F8FAFC' },
  summaryLabel: { fontSize: 12, color: '#94A3B8', marginTop: 4 },
  summarySubvalue: { fontSize: 10, color: '#64748B', marginTop: 4 },
  summaryTrend: { fontSize: 16, marginTop: 4 },
  penaltyBadge: { fontSize: 10, color: '#EF4444', marginTop: 4 },
  criticalBadge: { fontSize: 10, color: '#EF4444', marginTop: 4 },
  actionsCard: { backgroundColor: '#1E293B', borderRadius: 12, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#F8FAFC', marginBottom: 12 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-around' },
  actionStat: { alignItems: 'center' },
  actionValue: { fontSize: 24, fontWeight: 'bold', color: '#3B82F6' },
  actionLabel: { fontSize: 12, color: '#94A3B8', marginTop: 4 },
  hcahpsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  surveyInfo: { alignItems: 'flex-end' },
  surveyText: { fontSize: 12, color: '#64748B' },
  hcahpsMetric: { backgroundColor: '#1E293B', borderRadius: 12, padding: 16, marginBottom: 12 },
  hcahpsMetricHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  hcahpsLabel: { fontSize: 14, color: '#F8FAFC' },
  hcahpsValue: { fontSize: 18, fontWeight: 'bold' },
  progressBar: { height: 6, backgroundColor: '#334155', borderRadius: 3, overflow: 'hidden', position: 'relative' },
  progressFill: { height: '100%', borderRadius: 3 },
  targetMarker: { position: 'absolute', top: -2, width: 2, height: 10, backgroundColor: '#F8FAFC' },
  targetText: { fontSize: 10, color: '#64748B', marginTop: 4 },
  infectionCard: { backgroundColor: '#1E293B', borderRadius: 12, padding: 16, marginBottom: 12 },
  infectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infectionType: { fontSize: 16, fontWeight: 'bold', color: '#3B82F6' },
  infectionTrend: { fontSize: 16 },
  infectionName: { fontSize: 12, color: '#94A3B8', marginTop: 4, marginBottom: 12 },
  infectionStats: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  infectionStat: { alignItems: 'center' },
  infectionValue: { fontSize: 16, fontWeight: '600', color: '#F8FAFC' },
  infectionStatLabel: { fontSize: 10, color: '#64748B', marginTop: 2 },
  infectionProgress: { marginTop: 8 },
  readmissionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  penaltyWarning: { backgroundColor: '#7F1D1D', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  penaltyWarningText: { fontSize: 12, color: '#FCA5A5', fontWeight: '600' },
  overallReadmission: { backgroundColor: '#1E293B', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20 },
  overallLabel: { fontSize: 14, color: '#94A3B8' },
  overallValue: { fontSize: 48, fontWeight: 'bold', marginVertical: 8 },
  trendText: { fontSize: 14, color: '#64748B' },
  subsectionTitle: { fontSize: 14, fontWeight: '600', color: '#F8FAFC', marginBottom: 12 },
  conditionCard: { backgroundColor: '#1E293B', borderRadius: 12, padding: 16, marginBottom: 12 },
  conditionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  conditionName: { fontSize: 14, fontWeight: '600', color: '#F8FAFC' },
  conditionRate: { fontSize: 18, fontWeight: 'bold' },
  conditionDetails: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  conditionDetail: { fontSize: 12, color: '#64748B' },
  payerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#334155' },
  payerName: { flex: 1, fontSize: 14, color: '#F8FAFC' },
  payerRate: { fontSize: 14, fontWeight: '600', color: '#F8FAFC', marginRight: 8 },
  payerCount: { fontSize: 12, color: '#64748B' },
  mortalityOverview: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#1E293B', borderRadius: 16, padding: 20, marginBottom: 16 },
  mortalityStat: { alignItems: 'center' },
  mortalityLabel: { fontSize: 12, color: '#94A3B8', marginBottom: 4 },
  mortalityValue: { fontSize: 24, fontWeight: 'bold', color: '#F8FAFC' },
  ratioExplanation: { backgroundColor: '#1E3A5F', borderRadius: 8, padding: 12, marginBottom: 20 },
  ratioText: { fontSize: 14, color: '#93C5FD' },
  mortalityCondition: { backgroundColor: '#1E293B', borderRadius: 12, padding: 16, marginBottom: 12 },
  mortalityConditionName: { fontSize: 14, fontWeight: '600', color: '#F8FAFC', marginBottom: 12 },
  mortalityConditionStats: { flexDirection: 'row', justifyContent: 'space-around' },
  mortalityConditionStat: { alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '600', color: '#F8FAFC' },
  statLabel: { fontSize: 10, color: '#64748B', marginTop: 2 },
  safetyCard: { backgroundColor: '#1E293B', borderRadius: 12, padding: 16, marginBottom: 12 },
  safetyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  safetyId: { fontSize: 12, color: '#3B82F6', fontWeight: '600' },
  safetyTrend: { fontSize: 16 },
  safetyName: { fontSize: 14, fontWeight: '600', color: '#F8FAFC', marginTop: 4 },
  safetyCategory: { fontSize: 12, color: '#64748B', marginTop: 2, marginBottom: 12 },
  safetyStats: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  safetyStat: { alignItems: 'center' },
  safetyValue: { fontSize: 16, fontWeight: '600', color: '#F8FAFC' },
  safetyStatLabel: { fontSize: 10, color: '#64748B', marginTop: 2 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' },
  loadingText: { fontSize: 16, color: '#94A3B8' },
});
