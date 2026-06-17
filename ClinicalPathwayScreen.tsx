/**
 * Clinical Pathway Tracking Screen
 * Care pathway management with milestone tracking
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
  clinicalPathwayService,
  PatientPathway,
  PatientMilestone,
  PathwayTemplate,
  PathwayDashboardSummary,
  MilestoneStatus,
} from '@/src/services/ClinicalPathwayService';

type ViewMode = 'dashboard' | 'active' | 'templates';

export default function ClinicalPathwayScreen() {
  const colors = useColors();
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [summary, setSummary] = useState<PathwayDashboardSummary | null>(null);
  const [pathways, setPathways] = useState<PatientPathway[]>([]);
  const [templates, setTemplates] = useState<PathwayTemplate[]>([]);
  const [selectedPathway, setSelectedPathway] = useState<PatientPathway | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(() => {
    setSummary(clinicalPathwayService.getDashboardSummary());
    setPathways(clinicalPathwayService.getActivePathways());
    setTemplates(clinicalPathwayService.getTemplates());
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = clinicalPathwayService.subscribe(loadData);
    return unsubscribe;
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
    setTimeout(() => setRefreshing(false), 500);
  }, [loadData]);

  const handleMilestonePress = (pathway: PatientPathway, milestone: PatientMilestone) => {
    if (milestone.status === 'completed') {
      Alert.alert('Milestone Completed', `Completed by ${milestone.completedBy} on ${new Date(milestone.actualDate!).toLocaleDateString()}`);
      return;
    }

    Alert.alert(
      milestone.name,
      `Expected: ${new Date(milestone.expectedDate).toLocaleDateString()}\n\nCriteria:\n${milestone.criteria.map(c => `${c.met ? '✓' : '○'} ${c.description}`).join('\n')}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Complete',
          onPress: () => {
            clinicalPathwayService.updateMilestoneStatus(pathway.id, milestone.id, 'completed', 'Current User');
          },
        },
        {
          text: 'Report Variance',
          style: 'destructive',
          onPress: () => {
            Alert.prompt(
              'Report Variance',
              'Describe the variance:',
              (reason) => {
                if (reason) {
                  clinicalPathwayService.reportVariance(
                    pathway.id,
                    milestone.id,
                    'delay',
                    'minor',
                    `Variance reported for ${milestone.name}`,
                    reason,
                    'May affect pathway completion',
                    'Current User'
                  );
                }
              }
            );
          },
        },
      ]
    );
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatDaysFromNow = (timestamp: number): string => {
    const days = Math.round((timestamp - Date.now()) / (24 * 60 * 60 * 1000));
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days === -1) return 'Yesterday';
    if (days > 0) return `In ${days} days`;
    return `${Math.abs(days)} days ago`;
  };

  const renderDashboard = () => {
    if (!summary) return null;

    return (
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.dashboardContent}
      >
        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>{summary.activePathways}</Text>
            <Text style={[styles.summaryLabel, { color: colors.muted }]}>Active Pathways</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.summaryValue, { color: '#22C55E' }]}>{summary.avgComplianceScore}%</Text>
            <Text style={[styles.summaryLabel, { color: colors.muted }]}>Avg Compliance</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>{summary.variancesReported}</Text>
            <Text style={[styles.summaryLabel, { color: colors.muted }]}>Variances</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.summaryValue, { color: summary.avgLOSVariance > 0 ? '#EF4444' : '#22C55E' }]}>
              {summary.avgLOSVariance > 0 ? '+' : ''}{summary.avgLOSVariance}d
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.muted }]}>LOS Variance</Text>
          </View>
        </View>

        {/* Pathways by Category */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Active by Category</Text>
          <View style={styles.categoryGrid}>
            {summary.pathwaysByCategory.map((cat) => (
              <View key={cat.category} style={styles.categoryItem}>
                <View
                  style={[
                    styles.categoryDot,
                    { backgroundColor: clinicalPathwayService.getCategoryColor(cat.category) },
                  ]}
                />
                <Text style={[styles.categoryName, { color: colors.foreground }]}>
                  {cat.category.replace('_', ' ')}
                </Text>
                <Text style={[styles.categoryCount, { color: colors.muted }]}>{cat.count}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Upcoming Milestones */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Upcoming Milestones</Text>
          {summary.upcomingMilestones.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.muted }]}>No upcoming milestones</Text>
          ) : (
            summary.upcomingMilestones.map((item, idx) => (
              <View key={idx} style={styles.upcomingItem}>
                <View style={styles.upcomingInfo}>
                  <Text style={[styles.upcomingPatient, { color: colors.foreground }]}>{item.patientName}</Text>
                  <Text style={[styles.upcomingMilestone, { color: colors.muted }]}>{item.milestone}</Text>
                </View>
                <Text
                  style={[
                    styles.upcomingDate,
                    { color: item.dueDate < Date.now() ? '#EF4444' : colors.primary },
                  ]}
                >
                  {formatDaysFromNow(item.dueDate)}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Recent Variances */}
        {summary.recentVariances.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Variances</Text>
            {summary.recentVariances.map((variance) => (
              <View key={variance.id} style={styles.varianceItem}>
                <View
                  style={[
                    styles.severityBadge,
                    {
                      backgroundColor:
                        variance.severity === 'major'
                          ? '#FEE2E2'
                          : variance.severity === 'moderate'
                          ? '#FEF3C7'
                          : '#DCFCE7',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.severityText,
                      {
                        color:
                          variance.severity === 'major'
                            ? '#EF4444'
                            : variance.severity === 'moderate'
                            ? '#F59E0B'
                            : '#22C55E',
                      },
                    ]}
                  >
                    {variance.severity.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.varianceInfo}>
                  <Text style={[styles.varianceMilestone, { color: colors.foreground }]}>
                    {variance.milestoneName}
                  </Text>
                  <Text style={[styles.varianceDesc, { color: colors.muted }]} numberOfLines={1}>
                    {variance.reason}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    );
  };

  const renderActivePathways = () => (
    <FlatList
      data={pathways}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.muted }]}>No active pathways</Text>
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.pathwayCard, { backgroundColor: colors.surface }]}
          onPress={() => setSelectedPathway(item)}
        >
          <View style={styles.pathwayHeader}>
            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: clinicalPathwayService.getCategoryColor(item.category) + '20' },
              ]}
            >
              <Text
                style={[
                  styles.categoryBadgeText,
                  { color: clinicalPathwayService.getCategoryColor(item.category) },
                ]}
              >
                {item.category.replace('_', ' ')}
              </Text>
            </View>
            <View style={[styles.complianceBadge, { backgroundColor: item.complianceScore >= 80 ? '#DCFCE7' : '#FEF3C7' }]}>
              <Text style={[styles.complianceText, { color: item.complianceScore >= 80 ? '#22C55E' : '#F59E0B' }]}>
                {item.complianceScore}%
              </Text>
            </View>
          </View>

          <Text style={[styles.patientName, { color: colors.foreground }]}>{item.patientName}</Text>
          <Text style={[styles.pathwayName, { color: colors.muted }]}>{item.templateName}</Text>

          <View style={styles.dateRow}>
            <View style={styles.dateItem}>
              <Text style={[styles.dateLabel, { color: colors.muted }]}>Started</Text>
              <Text style={[styles.dateValue, { color: colors.foreground }]}>{formatDate(item.startDate)}</Text>
            </View>
            <View style={styles.dateItem}>
              <Text style={[styles.dateLabel, { color: colors.muted }]}>Expected</Text>
              <Text style={[styles.dateValue, { color: colors.foreground }]}>{formatDate(item.expectedEndDate)}</Text>
            </View>
            <View style={styles.dateItem}>
              <Text style={[styles.dateLabel, { color: colors.muted }]}>Day</Text>
              <Text style={[styles.dateValue, { color: colors.foreground }]}>
                {Math.ceil((Date.now() - item.startDate) / (24 * 60 * 60 * 1000))}
              </Text>
            </View>
          </View>

          {/* Milestone Progress */}
          <View style={styles.milestoneProgress}>
            {item.milestones.map((m, idx) => (
              <View
                key={m.id}
                style={[
                  styles.milestoneDot,
                  { backgroundColor: clinicalPathwayService.getStatusColor(m.status) },
                ]}
              />
            ))}
          </View>

          {item.variances.length > 0 && (
            <View style={styles.varianceWarning}>
              <Text style={styles.varianceWarningText}>⚠️ {item.variances.length} variance(s) reported</Text>
            </View>
          )}
        </TouchableOpacity>
      )}
    />
  );

  const renderTemplates = () => (
    <FlatList
      data={templates}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => (
        <View style={[styles.templateCard, { backgroundColor: colors.surface }]}>
          <View style={styles.templateHeader}>
            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: clinicalPathwayService.getCategoryColor(item.category) + '20' },
              ]}
            >
              <Text
                style={[
                  styles.categoryBadgeText,
                  { color: clinicalPathwayService.getCategoryColor(item.category) },
                ]}
              >
                {item.category.replace('_', ' ')}
              </Text>
            </View>
            <View style={[styles.evidenceBadge, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.evidenceText, { color: colors.primary }]}>Level {item.evidenceLevel}</Text>
            </View>
          </View>

          <Text style={[styles.templateName, { color: colors.foreground }]}>{item.name}</Text>
          <Text style={[styles.templateDesc, { color: colors.muted }]}>{item.description}</Text>

          <View style={styles.templateMeta}>
            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: colors.muted }]}>Expected LOS</Text>
              <Text style={[styles.metaValue, { color: colors.foreground }]}>{item.expectedLOS} days</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: colors.muted }]}>Milestones</Text>
              <Text style={[styles.metaValue, { color: colors.foreground }]}>{item.milestones.length}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: colors.muted }]}>Order Sets</Text>
              <Text style={[styles.metaValue, { color: colors.foreground }]}>{item.orderSets.length}</Text>
            </View>
          </View>

          <View style={styles.outcomeSection}>
            <Text style={[styles.outcomeTitle, { color: colors.foreground }]}>Outcome Targets</Text>
            {item.outcomeMetrics.map((metric) => (
              <View key={metric.id} style={styles.outcomeItem}>
                <Text style={[styles.outcomeName, { color: colors.foreground }]}>{metric.name}</Text>
                <Text style={[styles.outcomeTarget, { color: '#22C55E' }]}>{metric.target}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    />
  );

  const renderPathwayDetail = () => {
    if (!selectedPathway) return null;

    return (
      <View style={[styles.detailOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.detailCard, { backgroundColor: colors.background }]}>
          <ScrollView>
            <View style={styles.detailHeader}>
              <View>
                <Text style={[styles.detailPatient, { color: colors.foreground }]}>
                  {selectedPathway.patientName}
                </Text>
                <Text style={[styles.detailMrn, { color: colors.muted }]}>
                  MRN: {selectedPathway.mrn}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedPathway(null)}>
                <Text style={[styles.closeButton, { color: colors.primary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.detailPathwayName, { color: colors.foreground }]}>
              {selectedPathway.templateName}
            </Text>

            <View style={styles.detailStats}>
              <View style={styles.detailStat}>
                <Text style={[styles.detailStatValue, { color: colors.primary }]}>
                  Day {Math.ceil((Date.now() - selectedPathway.startDate) / (24 * 60 * 60 * 1000))}
                </Text>
                <Text style={[styles.detailStatLabel, { color: colors.muted }]}>of {Math.ceil((selectedPathway.expectedEndDate - selectedPathway.startDate) / (24 * 60 * 60 * 1000))}</Text>
              </View>
              <View style={styles.detailStat}>
                <Text style={[styles.detailStatValue, { color: selectedPathway.complianceScore >= 80 ? '#22C55E' : '#F59E0B' }]}>
                  {selectedPathway.complianceScore}%
                </Text>
                <Text style={[styles.detailStatLabel, { color: colors.muted }]}>Compliance</Text>
              </View>
            </View>

            <Text style={[styles.milestonesTitle, { color: colors.foreground }]}>Milestones</Text>

            {selectedPathway.milestones.map((milestone, idx) => (
              <TouchableOpacity
                key={milestone.id}
                style={[styles.milestoneCard, { backgroundColor: colors.surface }]}
                onPress={() => handleMilestonePress(selectedPathway, milestone)}
              >
                <View style={styles.milestoneHeader}>
                  <View
                    style={[
                      styles.milestoneStatus,
                      { backgroundColor: clinicalPathwayService.getStatusColor(milestone.status) },
                    ]}
                  />
                  <View style={styles.milestoneInfo}>
                    <Text style={[styles.milestoneName, { color: colors.foreground }]}>
                      {milestone.name}
                    </Text>
                    <Text style={[styles.milestoneDate, { color: colors.muted }]}>
                      {milestone.status === 'completed'
                        ? `Completed ${formatDate(milestone.actualDate!)}`
                        : `Due ${formatDate(milestone.expectedDate)}`}
                    </Text>
                  </View>
                  <Text style={[styles.milestoneStatusText, { color: clinicalPathwayService.getStatusColor(milestone.status) }]}>
                    {milestone.status.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>

                <View style={styles.criteriaList}>
                  {milestone.criteria.map((c) => (
                    <View key={c.id} style={styles.criteriaItem}>
                      <Text style={[styles.criteriaCheck, { color: c.met ? '#22C55E' : colors.muted }]}>
                        {c.met ? '✓' : '○'}
                      </Text>
                      <Text
                        style={[
                          styles.criteriaText,
                          { color: c.met ? colors.foreground : colors.muted },
                        ]}
                      >
                        {c.description}
                      </Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            ))}

            {selectedPathway.variances.length > 0 && (
              <>
                <Text style={[styles.variancesTitle, { color: colors.foreground }]}>Variances</Text>
                {selectedPathway.variances.map((v) => (
                  <View key={v.id} style={[styles.varianceCard, { backgroundColor: '#FEF3C7' }]}>
                    <Text style={[styles.varianceTitle, { color: '#92400E' }]}>{v.milestoneName}</Text>
                    <Text style={[styles.varianceReason, { color: '#78350F' }]}>{v.reason}</Text>
                    {v.actionTaken && (
                      <Text style={[styles.varianceAction, { color: '#92400E' }]}>
                        Action: {v.actionTaken}
                      </Text>
                    )}
                  </View>
                ))}
              </>
            )}

            <View style={styles.detailActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#22C55E' }]}
                onPress={() => {
                  clinicalPathwayService.completePathway(selectedPathway.id);
                  setSelectedPathway(null);
                }}
              >
                <Text style={styles.actionButtonText}>Complete Pathway</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#EF4444' }]}
                onPress={() => {
                  Alert.alert(
                    'Discontinue Pathway',
                    'Are you sure you want to discontinue this pathway?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Discontinue',
                        style: 'destructive',
                        onPress: () => {
                          clinicalPathwayService.discontinuePathway(selectedPathway.id, 'User discontinued');
                          setSelectedPathway(null);
                        },
                      },
                    ]
                  );
                }}
              >
                <Text style={styles.actionButtonText}>Discontinue</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer>
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Clinical Pathways</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Care Pathway Tracking</Text>
      </View>

      <View style={[styles.viewToggle, { backgroundColor: colors.surface }]}>
        {(['dashboard', 'active', 'templates'] as ViewMode[]).map((mode) => (
          <TouchableOpacity
            key={mode}
            style={[
              styles.toggleBtn,
              viewMode === mode && { backgroundColor: colors.primary },
            ]}
            onPress={() => setViewMode(mode)}
          >
            <Text
              style={[
                styles.toggleText,
                { color: viewMode === mode ? '#FFFFFF' : colors.foreground },
              ]}
            >
              {mode === 'dashboard' ? 'Dashboard' : mode === 'active' ? 'Active' : 'Templates'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {viewMode === 'dashboard' && renderDashboard()}
      {viewMode === 'active' && renderActivePathways()}
      {viewMode === 'templates' && renderTemplates()}

      {selectedPathway && renderPathwayDetail()}
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
  viewToggle: {
    flexDirection: 'row',
    marginHorizontal: 16,
    borderRadius: 8,
    padding: 4,
    marginBottom: 12,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dashboardContent: {
    padding: 16,
    paddingBottom: 100,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  summaryLabel: {
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
  categoryGrid: {
    gap: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  categoryName: {
    flex: 1,
    fontSize: 14,
  },
  categoryCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  upcomingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  upcomingInfo: {
    flex: 1,
  },
  upcomingPatient: {
    fontSize: 14,
    fontWeight: '500',
  },
  upcomingMilestone: {
    fontSize: 12,
    marginTop: 2,
  },
  upcomingDate: {
    fontSize: 12,
    fontWeight: '600',
  },
  varianceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  varianceInfo: {
    flex: 1,
  },
  varianceMilestone: {
    fontSize: 14,
    fontWeight: '500',
  },
  varianceDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
  },
  pathwayCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  pathwayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  complianceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  complianceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  patientName: {
    fontSize: 18,
    fontWeight: '600',
  },
  pathwayName: {
    fontSize: 14,
    marginTop: 4,
  },
  dateRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 24,
  },
  dateItem: {
    gap: 4,
  },
  dateLabel: {
    fontSize: 11,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  milestoneProgress: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 16,
  },
  milestoneDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  varianceWarning: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
  },
  varianceWarningText: {
    fontSize: 12,
    color: '#92400E',
  },
  templateCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  templateHeader: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  evidenceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  evidenceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
  },
  templateDesc: {
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
  templateMeta: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 24,
  },
  metaItem: {
    gap: 4,
  },
  metaLabel: {
    fontSize: 11,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  outcomeSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  outcomeTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  outcomeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  outcomeName: {
    fontSize: 13,
  },
  outcomeTarget: {
    fontSize: 13,
    fontWeight: '600',
  },
  detailOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  detailCard: {
    width: '100%',
    maxHeight: '90%',
    borderRadius: 16,
    padding: 20,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  detailPatient: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  detailMrn: {
    fontSize: 14,
    marginTop: 4,
  },
  closeButton: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  detailPathwayName: {
    fontSize: 16,
    marginBottom: 16,
  },
  detailStats: {
    flexDirection: 'row',
    gap: 32,
    marginBottom: 24,
  },
  detailStat: {
    alignItems: 'center',
  },
  detailStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  detailStatLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  milestonesTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  milestoneCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  milestoneStatus: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneName: {
    fontSize: 14,
    fontWeight: '500',
  },
  milestoneDate: {
    fontSize: 12,
    marginTop: 2,
  },
  milestoneStatusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  criteriaList: {
    marginTop: 12,
    marginLeft: 24,
    gap: 6,
  },
  criteriaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  criteriaCheck: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  criteriaText: {
    fontSize: 13,
  },
  variancesTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 12,
  },
  varianceCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  varianceTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  varianceReason: {
    fontSize: 13,
    marginTop: 4,
  },
  varianceAction: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
  detailActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
