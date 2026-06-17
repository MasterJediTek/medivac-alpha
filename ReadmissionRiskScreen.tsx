/**
 * Readmission Risk Dashboard Screen
 * Displays patient risk stratification with ML-powered predictions
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
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import {
  readmissionRiskService,
  PatientRiskProfile,
  RiskLevel,
  RiskDashboardSummary,
} from '@/src/services/ReadmissionRiskService';

type TabType = 'dashboard' | 'high_risk' | 'interventions';

export default function ReadmissionRiskScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [summary, setSummary] = useState<RiskDashboardSummary | null>(null);
  const [highRiskPatients, setHighRiskPatients] = useState<PatientRiskProfile[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientRiskProfile | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(() => {
    setSummary(readmissionRiskService.getDashboardSummary());
    setHighRiskPatients(readmissionRiskService.getHighRiskPatients());
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = readmissionRiskService.subscribe(loadData);
    return unsubscribe;
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
    setTimeout(() => setRefreshing(false), 500);
  }, [loadData]);

  const getRiskColor = (level: RiskLevel): string => {
    return readmissionRiskService.getRiskColor(level);
  };

  const renderDashboard = () => {
    if (!summary) return null;

    return (
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Risk Overview Cards */}
        <View style={styles.overviewGrid}>
          <View style={[styles.overviewCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.overviewValue, { color: colors.foreground }]}>
              {summary.totalPatients}
            </Text>
            <Text style={[styles.overviewLabel, { color: colors.muted }]}>Total Patients</Text>
          </View>
          <View style={[styles.overviewCard, { backgroundColor: '#FEF3C7' }]}>
            <Text style={[styles.overviewValue, { color: '#F59E0B' }]}>
              {summary.highRiskCount}
            </Text>
            <Text style={[styles.overviewLabel, { color: '#92400E' }]}>High Risk</Text>
          </View>
          <View style={[styles.overviewCard, { backgroundColor: '#FEE2E2' }]}>
            <Text style={[styles.overviewValue, { color: '#EF4444' }]}>
              {summary.veryHighRiskCount}
            </Text>
            <Text style={[styles.overviewLabel, { color: '#991B1B' }]}>Very High Risk</Text>
          </View>
          <View style={[styles.overviewCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.overviewValue, { color: colors.primary }]}>
              {summary.averageRiskScore}%
            </Text>
            <Text style={[styles.overviewLabel, { color: colors.muted }]}>Avg Risk Score</Text>
          </View>
        </View>

        {/* Risk Distribution */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Risk Distribution
          </Text>
          <View style={styles.distributionBar}>
            {summary.riskDistribution.map((dist) => (
              <View
                key={dist.level}
                style={[
                  styles.distributionSegment,
                  {
                    backgroundColor: getRiskColor(dist.level),
                    flex: dist.percentage || 1,
                  },
                ]}
              />
            ))}
          </View>
          <View style={styles.distributionLegend}>
            {summary.riskDistribution.map((dist) => (
              <View key={dist.level} style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: getRiskColor(dist.level) }]}
                />
                <Text style={[styles.legendText, { color: colors.muted }]}>
                  {readmissionRiskService.getRiskLabel(dist.level)}: {dist.count} ({dist.percentage}%)
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Action Items */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Action Items
          </Text>
          <View style={styles.actionGrid}>
            <View style={[styles.actionCard, { backgroundColor: '#FEF3C7' }]}>
              <Text style={[styles.actionValue, { color: '#F59E0B' }]}>
                {summary.pendingInterventions}
              </Text>
              <Text style={[styles.actionLabel, { color: '#92400E' }]}>
                Pending Interventions
              </Text>
            </View>
            <View style={[styles.actionCard, { backgroundColor: '#DCFCE7' }]}>
              <Text style={[styles.actionValue, { color: '#22C55E' }]}>
                {summary.scheduledFollowUps}
              </Text>
              <Text style={[styles.actionLabel, { color: '#166534' }]}>
                Scheduled Follow-ups
              </Text>
            </View>
          </View>
        </View>

        {/* Top Risk Factors */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Top Risk Factors
          </Text>
          {summary.topRiskFactors.map((factor, index) => (
            <View key={factor.factor} style={styles.factorRow}>
              <View style={styles.factorRank}>
                <Text style={[styles.factorRankText, { color: colors.primary }]}>
                  #{index + 1}
                </Text>
              </View>
              <Text style={[styles.factorName, { color: colors.foreground }]}>
                {factor.factor}
              </Text>
              <Text style={[styles.factorCount, { color: colors.muted }]}>
                {factor.count} patients
              </Text>
            </View>
          ))}
        </View>

        {/* LACE Score Guide */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            LACE Score Guide
          </Text>
          <View style={styles.scoreGuide}>
            <View style={styles.scoreRow}>
              <Text style={[styles.scoreLabel, { color: colors.primary }]}>L</Text>
              <Text style={[styles.scoreDesc, { color: colors.foreground }]}>
                Length of Stay (0-7 pts)
              </Text>
            </View>
            <View style={styles.scoreRow}>
              <Text style={[styles.scoreLabel, { color: colors.primary }]}>A</Text>
              <Text style={[styles.scoreDesc, { color: colors.foreground }]}>
                Acuity of Admission (0-3 pts)
              </Text>
            </View>
            <View style={styles.scoreRow}>
              <Text style={[styles.scoreLabel, { color: colors.primary }]}>C</Text>
              <Text style={[styles.scoreDesc, { color: colors.foreground }]}>
                Comorbidities (0-5 pts)
              </Text>
            </View>
            <View style={styles.scoreRow}>
              <Text style={[styles.scoreLabel, { color: colors.primary }]}>E</Text>
              <Text style={[styles.scoreDesc, { color: colors.foreground }]}>
                ED Visits in 6 months (0-4 pts)
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderHighRiskList = () => (
    <FlatList
      data={highRiskPatients}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.patientCard, { backgroundColor: colors.surface }]}
          onPress={() => setSelectedPatient(item)}
        >
          <View style={styles.patientHeader}>
            <View>
              <Text style={[styles.patientName, { color: colors.foreground }]}>
                {item.patientName}
              </Text>
              <Text style={[styles.patientMrn, { color: colors.muted }]}>
                MRN: {item.mrn}
              </Text>
            </View>
            <View
              style={[
                styles.riskBadge,
                { backgroundColor: getRiskColor(item.riskLevel) + '20' },
              ]}
            >
              <Text style={[styles.riskBadgeText, { color: getRiskColor(item.riskLevel) }]}>
                {item.overallRiskScore}%
              </Text>
            </View>
          </View>

          <View style={styles.patientDetails}>
            <Text style={[styles.diagnosis, { color: colors.foreground }]}>
              {item.primaryDiagnosis}
            </Text>
            <View style={styles.scoresRow}>
              <View style={styles.scoreItem}>
                <Text style={[styles.scoreItemLabel, { color: colors.muted }]}>LACE</Text>
                <Text style={[styles.scoreItemValue, { color: colors.foreground }]}>
                  {item.laceScore.totalScore}
                </Text>
              </View>
              <View style={styles.scoreItem}>
                <Text style={[styles.scoreItemLabel, { color: colors.muted }]}>HOSPITAL</Text>
                <Text style={[styles.scoreItemValue, { color: colors.foreground }]}>
                  {item.hospitalScore.totalScore}
                </Text>
              </View>
              <View style={styles.scoreItem}>
                <Text style={[styles.scoreItemLabel, { color: colors.muted }]}>Social</Text>
                <Text style={[styles.scoreItemValue, { color: colors.foreground }]}>
                  {item.socialFactors.socialRiskScore}%
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.interventionSummary}>
            <Text style={[styles.interventionCount, { color: colors.primary }]}>
              {item.interventions.filter((i) => i.status === 'pending').length} pending interventions
            </Text>
          </View>
        </TouchableOpacity>
      )}
    />
  );

  const renderInterventions = () => {
    const allInterventions = highRiskPatients.flatMap((p) =>
      p.interventions
        .filter((i) => i.status === 'pending' || i.status === 'in_progress')
        .map((i) => ({ ...i, patientName: p.patientName, patientId: p.id }))
    );

    return (
      <FlatList
        data={allInterventions}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={[styles.interventionCard, { backgroundColor: colors.surface }]}>
            <View style={styles.interventionHeader}>
              <View
                style={[
                  styles.priorityBadge,
                  {
                    backgroundColor:
                      item.priority === 'high'
                        ? '#FEE2E2'
                        : item.priority === 'medium'
                        ? '#FEF3C7'
                        : '#DCFCE7',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.priorityText,
                    {
                      color:
                        item.priority === 'high'
                          ? '#EF4444'
                          : item.priority === 'medium'
                          ? '#F59E0B'
                          : '#22C55E',
                    },
                  ]}
                >
                  {item.priority.toUpperCase()}
                </Text>
              </View>
              <Text style={[styles.categoryText, { color: colors.muted }]}>
                {item.category.replace('_', ' ').toUpperCase()}
              </Text>
            </View>

            <Text style={[styles.interventionTitle, { color: colors.foreground }]}>
              {item.title}
            </Text>
            <Text style={[styles.interventionPatient, { color: colors.primary }]}>
              Patient: {item.patientName}
            </Text>
            <Text style={[styles.interventionDesc, { color: colors.muted }]}>
              {item.description}
            </Text>

            <View style={styles.evidenceBox}>
              <Text style={[styles.evidenceLabel, { color: colors.muted }]}>Evidence:</Text>
              <Text style={[styles.evidenceText, { color: colors.foreground }]}>
                {item.evidence}
              </Text>
            </View>

            <View style={styles.interventionActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={() =>
                  readmissionRiskService.updateInterventionStatus(
                    item.patientId,
                    item.id,
                    'in_progress'
                  )
                }
              >
                <Text style={styles.actionButtonText}>Start</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#22C55E' }]}
                onPress={() =>
                  readmissionRiskService.updateInterventionStatus(
                    item.patientId,
                    item.id,
                    'completed'
                  )
                }
              >
                <Text style={styles.actionButtonText}>Complete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    );
  };

  const renderPatientDetail = () => {
    if (!selectedPatient) return null;

    return (
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setSelectedPatient(null)}
        >
          <Text style={[styles.backButtonText, { color: colors.primary }]}>
            ← Back to List
          </Text>
        </TouchableOpacity>

        {/* Patient Header */}
        <View style={[styles.detailHeader, { backgroundColor: colors.surface }]}>
          <View style={styles.detailHeaderTop}>
            <View>
              <Text style={[styles.detailName, { color: colors.foreground }]}>
                {selectedPatient.patientName}
              </Text>
              <Text style={[styles.detailMrn, { color: colors.muted }]}>
                MRN: {selectedPatient.mrn}
              </Text>
            </View>
            <View
              style={[
                styles.riskGauge,
                { borderColor: getRiskColor(selectedPatient.riskLevel) },
              ]}
            >
              <Text
                style={[
                  styles.riskGaugeValue,
                  { color: getRiskColor(selectedPatient.riskLevel) },
                ]}
              >
                {selectedPatient.overallRiskScore}%
              </Text>
              <Text style={[styles.riskGaugeLabel, { color: colors.muted }]}>
                {readmissionRiskService.getRiskLabel(selectedPatient.riskLevel)}
              </Text>
            </View>
          </View>
          <Text style={[styles.detailDiagnosis, { color: colors.foreground }]}>
            {selectedPatient.primaryDiagnosis}
          </Text>
        </View>

        {/* LACE Score Breakdown */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            LACE Score: {selectedPatient.laceScore.totalScore}/19
          </Text>
          <View style={styles.scoreBreakdown}>
            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: colors.muted }]}>
                Length of Stay
              </Text>
              <Text style={[styles.breakdownValue, { color: colors.foreground }]}>
                {selectedPatient.laceScore.lengthOfStay} pts
              </Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: colors.muted }]}>
                Acuity of Admission
              </Text>
              <Text style={[styles.breakdownValue, { color: colors.foreground }]}>
                {selectedPatient.laceScore.acuityOfAdmission} pts
              </Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: colors.muted }]}>
                Comorbidities
              </Text>
              <Text style={[styles.breakdownValue, { color: colors.foreground }]}>
                {selectedPatient.laceScore.comorbidities} pts
              </Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: colors.muted }]}>
                ED Visits (6mo)
              </Text>
              <Text style={[styles.breakdownValue, { color: colors.foreground }]}>
                {selectedPatient.laceScore.edVisits} pts
              </Text>
            </View>
          </View>
          <Text style={[styles.riskPercentage, { color: colors.primary }]}>
            Predicted Risk: {selectedPatient.laceScore.riskPercentage}%
          </Text>
        </View>

        {/* Social Factors */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Social Determinants Score: {selectedPatient.socialFactors.socialRiskScore}%
          </Text>
          <View style={styles.socialGrid}>
            {[
              { label: 'Lives Alone', value: selectedPatient.socialFactors.livesAlone },
              { label: 'Has Caregiver', value: selectedPatient.socialFactors.hasCaregiver },
              { label: 'Transportation', value: selectedPatient.socialFactors.transportationAccess },
              { label: 'Med Affordability', value: selectedPatient.socialFactors.medicationAffordability },
              { label: 'Food Security', value: selectedPatient.socialFactors.foodSecurity },
              { label: 'Housing Stable', value: selectedPatient.socialFactors.housingStability },
            ].map((item) => (
              <View key={item.label} style={styles.socialItem}>
                <View
                  style={[
                    styles.socialIndicator,
                    { backgroundColor: item.value ? '#22C55E' : '#EF4444' },
                  ]}
                />
                <Text style={[styles.socialLabel, { color: colors.foreground }]}>
                  {item.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Risk Trend */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Risk Trend
          </Text>
          {selectedPatient.riskTrend.map((trend, index) => (
            <View key={index} style={styles.trendRow}>
              <Text style={[styles.trendDate, { color: colors.muted }]}>
                {new Date(trend.timestamp).toLocaleDateString()}
              </Text>
              <View style={styles.trendBar}>
                <View
                  style={[
                    styles.trendFill,
                    {
                      width: `${trend.riskScore}%`,
                      backgroundColor: getRiskColor(
                        trend.riskScore >= 60
                          ? 'very_high'
                          : trend.riskScore >= 40
                          ? 'high'
                          : trend.riskScore >= 20
                          ? 'moderate'
                          : 'low'
                      ),
                    },
                  ]}
                />
              </View>
              <Text style={[styles.trendScore, { color: colors.foreground }]}>
                {trend.riskScore}%
              </Text>
            </View>
          ))}
        </View>

        {/* Follow-up Plan */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Follow-up Plan
          </Text>
          <View style={styles.followUpItem}>
            <View
              style={[
                styles.followUpStatus,
                {
                  backgroundColor: selectedPatient.followUpPlan.primaryCareVisit.scheduled
                    ? '#DCFCE7'
                    : '#FEE2E2',
                },
              ]}
            />
            <View style={styles.followUpDetails}>
              <Text style={[styles.followUpTitle, { color: colors.foreground }]}>
                Primary Care Visit
              </Text>
              {selectedPatient.followUpPlan.primaryCareVisit.scheduled && (
                <Text style={[styles.followUpDate, { color: colors.muted }]}>
                  {selectedPatient.followUpPlan.primaryCareVisit.date
                    ? new Date(selectedPatient.followUpPlan.primaryCareVisit.date).toLocaleDateString()
                    : 'Date TBD'}{' '}
                  - {selectedPatient.followUpPlan.primaryCareVisit.provider}
                </Text>
              )}
            </View>
          </View>
          {selectedPatient.followUpPlan.homeHealth.ordered && (
            <View style={styles.followUpItem}>
              <View style={[styles.followUpStatus, { backgroundColor: '#DCFCE7' }]} />
              <View style={styles.followUpDetails}>
                <Text style={[styles.followUpTitle, { color: colors.foreground }]}>
                  Home Health
                </Text>
                <Text style={[styles.followUpDate, { color: colors.muted }]}>
                  Services: {selectedPatient.followUpPlan.homeHealth.services.join(', ')}
                </Text>
              </View>
            </View>
          )}
          {selectedPatient.followUpPlan.telehealth.enrolled && (
            <View style={styles.followUpItem}>
              <View style={[styles.followUpStatus, { backgroundColor: '#DCFCE7' }]} />
              <View style={styles.followUpDetails}>
                <Text style={[styles.followUpTitle, { color: colors.foreground }]}>
                  Telehealth
                </Text>
                <Text style={[styles.followUpDate, { color: colors.muted }]}>
                  Frequency: {selectedPatient.followUpPlan.telehealth.frequency}
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  return (
    <ScreenContainer>
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Readmission Risk
        </Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          30-Day Prediction Dashboard
        </Text>
      </View>

      {selectedPatient ? (
        renderPatientDetail()
      ) : (
        <>
          <View style={[styles.tabBar, { backgroundColor: colors.surface }]}>
            {(['dashboard', 'high_risk', 'interventions'] as TabType[]).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tab,
                  activeTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
                ]}
                onPress={() => setActiveTab(tab)}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: activeTab === tab ? colors.primary : colors.muted },
                  ]}
                >
                  {tab === 'dashboard'
                    ? 'Dashboard'
                    : tab === 'high_risk'
                    ? 'High Risk'
                    : 'Interventions'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'high_risk' && renderHighRiskList()}
          {activeTab === 'interventions' && renderInterventions()}
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  overviewCard: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  overviewValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  overviewLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  distributionBar: {
    flexDirection: 'row',
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  distributionSegment: {
    height: '100%',
  },
  distributionLegend: {
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  actionLabel: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  factorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  factorRank: {
    width: 32,
  },
  factorRankText: {
    fontSize: 14,
    fontWeight: '600',
  },
  factorName: {
    flex: 1,
    fontSize: 14,
  },
  factorCount: {
    fontSize: 12,
  },
  scoreGuide: {
    gap: 8,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scoreLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    width: 24,
  },
  scoreDesc: {
    fontSize: 14,
  },
  patientCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  patientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
  },
  patientMrn: {
    fontSize: 12,
    marginTop: 2,
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  riskBadgeText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  patientDetails: {
    marginBottom: 12,
  },
  diagnosis: {
    fontSize: 14,
    marginBottom: 8,
  },
  scoresRow: {
    flexDirection: 'row',
    gap: 16,
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoreItemLabel: {
    fontSize: 10,
  },
  scoreItemValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  interventionSummary: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  interventionCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  interventionCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  interventionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  categoryText: {
    fontSize: 10,
  },
  interventionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  interventionPatient: {
    fontSize: 12,
    marginBottom: 8,
  },
  interventionDesc: {
    fontSize: 14,
    marginBottom: 12,
  },
  evidenceBox: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  evidenceLabel: {
    fontSize: 10,
    marginBottom: 4,
  },
  evidenceText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  interventionActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
  },
  detailHeader: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  detailHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  detailMrn: {
    fontSize: 14,
    marginTop: 4,
  },
  riskGauge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  riskGaugeValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  riskGaugeLabel: {
    fontSize: 10,
  },
  detailDiagnosis: {
    fontSize: 16,
  },
  scoreBreakdown: {
    gap: 8,
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakdownLabel: {
    fontSize: 14,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  riskPercentage: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  socialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  socialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '45%',
    gap: 8,
  },
  socialIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  socialLabel: {
    fontSize: 12,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  trendDate: {
    fontSize: 10,
    width: 60,
  },
  trendBar: {
    flex: 1,
    height: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
  },
  trendFill: {
    height: '100%',
    borderRadius: 8,
  },
  trendScore: {
    fontSize: 12,
    fontWeight: '600',
    width: 36,
    textAlign: 'right',
  },
  followUpItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  followUpStatus: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  followUpDetails: {
    flex: 1,
  },
  followUpTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  followUpDate: {
    fontSize: 12,
    marginTop: 2,
  },
});
