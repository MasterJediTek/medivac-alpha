/**
 * Clinical Decision Support Screen
 * Advanced alert dashboard with sepsis detection, deterioration scoring, and rule management
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import {
  clinicalDecisionSupportService,
  ClinicalAlert,
  AlertCategory,
  AlertSeverity,
  AlertStatistics,
  SepsisScreening,
  DeteriorationScore,
} from '../services/ClinicalDecisionSupportService';

export default function ClinicalDecisionSupportScreen() {
  const colors = useColors();
  const [activeAlerts, setActiveAlerts] = useState<ClinicalAlert[]>([]);
  const [statistics, setStatistics] = useState<AlertStatistics | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<ClinicalAlert | null>(null);
  const [showAlertDetail, setShowAlertDetail] = useState(false);
  const [showSepsisScreen, setShowSepsisScreen] = useState(false);
  const [showNEWS2Screen, setShowNEWS2Screen] = useState(false);
  const [sepsisResult, setSepsisResult] = useState<SepsisScreening | null>(null);
  const [news2Result, setNews2Result] = useState<DeteriorationScore | null>(null);
  const [filterCategory, setFilterCategory] = useState<AlertCategory | 'all'>('all');

  // Load data
  const loadData = useCallback(() => {
    const alerts = filterCategory === 'all'
      ? clinicalDecisionSupportService.getActiveAlerts()
      : clinicalDecisionSupportService.getAlertsByCategory(filterCategory);
    setActiveAlerts(alerts);
    setStatistics(clinicalDecisionSupportService.getAlertStatistics());
  }, [filterCategory]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Subscribe to updates
  useEffect(() => {
    const unsubscribe = clinicalDecisionSupportService.subscribe(() => {
      loadData();
    });
    return unsubscribe;
  }, [loadData]);

  // Handle alert actions
  const handleAcknowledge = (alertId: string) => {
    clinicalDecisionSupportService.acknowledgeAlert(alertId, 'Current User');
    loadData();
  };

  const handleResolve = (alertId: string) => {
    Alert.alert(
      'Resolve Alert',
      'Are you sure you want to resolve this alert?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resolve',
          onPress: () => {
            clinicalDecisionSupportService.resolveAlert(alertId, 'Current User');
            setShowAlertDetail(false);
            loadData();
          },
        },
      ]
    );
  };

  const handleSuppress = (alertId: string, minutes: number) => {
    clinicalDecisionSupportService.suppressAlert(alertId, minutes);
    loadData();
  };

  const handleEscalate = (alertId: string) => {
    clinicalDecisionSupportService.escalateAlert(alertId);
    loadData();
  };

  // Demo sepsis screening
  const runSepsisScreening = () => {
    const result = clinicalDecisionSupportService.performSepsisScreening(
      'PAT-DEMO-001',
      {
        temperature: 38.9,
        heartRate: 112,
        respiratoryRate: 24,
        systolicBP: 95,
        glasgowComaScale: 14,
      },
      {
        wbc: 15000,
        lactate: 2.8,
      },
      true
    );
    setSepsisResult(result);
    loadData();
  };

  // Demo NEWS2 calculation
  const runNEWS2Calculation = () => {
    const result = clinicalDecisionSupportService.calculateNEWS2(
      22, // respiratory rate
      94, // SpO2
      true, // on supplemental O2
      38.2, // temperature
      105, // systolic BP
      98, // heart rate
      'alert' // consciousness
    );
    setNews2Result(result);
  };

  // Render severity badge
  const renderSeverityBadge = (severity: AlertSeverity) => (
    <View style={[styles.severityBadge, { backgroundColor: clinicalDecisionSupportService.getSeverityColor(severity) }]}>
      <Text style={styles.severityText}>{severity.toUpperCase()}</Text>
    </View>
  );

  // Render alert card
  const renderAlertCard = ({ item }: { item: ClinicalAlert }) => (
    <TouchableOpacity
      style={[
        styles.alertCard,
        { 
          backgroundColor: colors.surface, 
          borderColor: clinicalDecisionSupportService.getSeverityColor(item.severity),
          borderLeftWidth: 4,
        }
      ]}
      onPress={() => {
        setSelectedAlert(item);
        setShowAlertDetail(true);
      }}
    >
      <View style={styles.alertHeader}>
        <View style={styles.alertTitleRow}>
          <Text style={styles.alertIcon}>
            {clinicalDecisionSupportService.getCategoryIcon(item.category)}
          </Text>
          <Text style={[styles.alertTitle, { color: colors.foreground }]} numberOfLines={1}>
            {item.title}
          </Text>
        </View>
        {renderSeverityBadge(item.severity)}
      </View>

      <Text style={[styles.alertPatient, { color: colors.primary }]}>
        {item.patientName}
      </Text>

      <Text style={[styles.alertDescription, { color: colors.muted }]} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.alertFooter}>
        <Text style={[styles.alertTime, { color: colors.muted }]}>
          {new Date(item.createdAt).toLocaleTimeString()}
        </Text>
        {!item.acknowledgedAt && (
          <TouchableOpacity
            style={[styles.ackButton, { backgroundColor: colors.primary }]}
            onPress={() => handleAcknowledge(item.id)}
          >
            <Text style={styles.ackButtonText}>Acknowledge</Text>
          </TouchableOpacity>
        )}
        {item.acknowledgedAt && !item.resolvedAt && (
          <Text style={[styles.ackStatus, { color: colors.success }]}>✓ Acknowledged</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  // Render category filter
  const categories: (AlertCategory | 'all')[] = [
    'all', 'sepsis', 'deterioration', 'lab_critical', 'cardiac', 'fall_risk', 'drug_interaction'
  ];

  return (
    <ScreenContainer>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Clinical Decision Support</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            AI-powered alerts and clinical guidance
          </Text>
        </View>

        {/* Statistics Cards */}
        {statistics && (
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: colors.error }]}>
              <Text style={styles.statValue}>{statistics.bySeverity.critical}</Text>
              <Text style={styles.statLabel}>Critical</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#F97316' }]}>
              <Text style={styles.statValue}>{statistics.bySeverity.high}</Text>
              <Text style={styles.statLabel}>High</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.warning }]}>
              <Text style={styles.statValue}>{statistics.bySeverity.moderate}</Text>
              <Text style={styles.statLabel}>Moderate</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.success }]}>
              <Text style={styles.statValue}>{statistics.acknowledgedRate}%</Text>
              <Text style={styles.statLabel}>Ack Rate</Text>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#DC2626' }]}
            onPress={() => {
              runSepsisScreening();
              setShowSepsisScreen(true);
            }}
          >
            <Text style={styles.actionIcon}>🦠</Text>
            <Text style={styles.actionText}>Sepsis Screen</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#7C3AED' }]}
            onPress={() => {
              runNEWS2Calculation();
              setShowNEWS2Screen(true);
            }}
          >
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionText}>NEWS2 Score</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#0891B2' }]}
            onPress={() => {
              const fallRisk = clinicalDecisionSupportService.calculateMorseFallRisk(
                true, true, 'crutches_cane_walker', true, 'weak', 'forgets_limitations'
              );
              Alert.alert(
                'Fall Risk Assessment',
                `Morse Score: ${fallRisk.morseScore}\nRisk Level: ${fallRisk.riskLevel.toUpperCase()}\n\nInterventions:\n${fallRisk.interventions.slice(0, 3).join('\n')}`
              );
            }}
          >
            <Text style={styles.actionIcon}>⚠️</Text>
            <Text style={styles.actionText}>Fall Risk</Text>
          </TouchableOpacity>
        </View>

        {/* Category Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.filterChip,
                { 
                  backgroundColor: filterCategory === cat ? colors.primary : colors.surface,
                  borderColor: colors.border,
                }
              ]}
              onPress={() => setFilterCategory(cat)}
            >
              <Text style={[
                styles.filterText,
                { color: filterCategory === cat ? '#fff' : colors.foreground }
              ]}>
                {cat === 'all' ? 'All Alerts' : clinicalDecisionSupportService.getCategoryDisplayName(cat as AlertCategory)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Active Alerts */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Active Alerts ({activeAlerts.length})
          </Text>
          {activeAlerts.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={styles.emptyIcon}>✓</Text>
              <Text style={[styles.emptyText, { color: colors.muted }]}>No active alerts</Text>
            </View>
          ) : (
            <FlatList
              data={activeAlerts}
              keyExtractor={(item) => item.id}
              renderItem={renderAlertCard}
              scrollEnabled={false}
            />
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Alert Detail Modal */}
      <Modal
        visible={showAlertDetail}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAlertDetail(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Alert Details</Text>
            <TouchableOpacity onPress={() => setShowAlertDetail(false)}>
              <Text style={[styles.closeButton, { color: colors.primary }]}>Close</Text>
            </TouchableOpacity>
          </View>

          {selectedAlert && (
            <ScrollView style={styles.modalContent}>
              <View style={[styles.detailCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.detailHeader}>
                  <Text style={styles.detailIcon}>
                    {clinicalDecisionSupportService.getCategoryIcon(selectedAlert.category)}
                  </Text>
                  <View style={styles.detailTitleContainer}>
                    <Text style={[styles.detailTitle, { color: colors.foreground }]}>
                      {selectedAlert.title}
                    </Text>
                    {renderSeverityBadge(selectedAlert.severity)}
                  </View>
                </View>

                <Text style={[styles.detailPatient, { color: colors.primary }]}>
                  Patient: {selectedAlert.patientName}
                </Text>

                <Text style={[styles.detailDescription, { color: colors.foreground }]}>
                  {selectedAlert.description}
                </Text>

                <View style={[styles.recommendationBox, { backgroundColor: colors.background }]}>
                  <Text style={[styles.recommendationLabel, { color: colors.muted }]}>
                    Recommended Action:
                  </Text>
                  <Text style={[styles.recommendationText, { color: colors.foreground }]}>
                    {selectedAlert.recommendation}
                  </Text>
                </View>

                {/* Evidence */}
                {selectedAlert.evidence.length > 0 && (
                  <View style={styles.evidenceSection}>
                    <Text style={[styles.evidenceTitle, { color: colors.foreground }]}>
                      Supporting Evidence
                    </Text>
                    {selectedAlert.evidence.map((ev, idx) => (
                      <View key={idx} style={[styles.evidenceItem, { borderColor: colors.border }]}>
                        <Text style={[styles.evidenceName, { color: colors.muted }]}>{ev.name}</Text>
                        <Text style={[
                          styles.evidenceValue,
                          { color: ev.isAbnormal ? colors.error : colors.success }
                        ]}>
                          {ev.value} {ev.unit}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Actions */}
                <View style={styles.actionButtons}>
                  {!selectedAlert.acknowledgedAt && (
                    <TouchableOpacity
                      style={[styles.modalActionButton, { backgroundColor: colors.primary }]}
                      onPress={() => handleAcknowledge(selectedAlert.id)}
                    >
                      <Text style={styles.modalActionText}>Acknowledge</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.modalActionButton, { backgroundColor: colors.warning }]}
                    onPress={() => handleEscalate(selectedAlert.id)}
                  >
                    <Text style={styles.modalActionText}>Escalate</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalActionButton, { backgroundColor: colors.success }]}
                    onPress={() => handleResolve(selectedAlert.id)}
                  >
                    <Text style={styles.modalActionText}>Resolve</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.suppressButtons}>
                  <Text style={[styles.suppressLabel, { color: colors.muted }]}>Suppress for:</Text>
                  {[15, 60, 240].map(mins => (
                    <TouchableOpacity
                      key={mins}
                      style={[styles.suppressButton, { borderColor: colors.border }]}
                      onPress={() => handleSuppress(selectedAlert.id, mins)}
                    >
                      <Text style={[styles.suppressButtonText, { color: colors.foreground }]}>
                        {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Sepsis Screening Modal */}
      <Modal
        visible={showSepsisScreen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSepsisScreen(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Sepsis Screening</Text>
            <TouchableOpacity onPress={() => setShowSepsisScreen(false)}>
              <Text style={[styles.closeButton, { color: colors.primary }]}>Close</Text>
            </TouchableOpacity>
          </View>

          {sepsisResult && (
            <ScrollView style={styles.modalContent}>
              <View style={[
                styles.sepsisResultCard,
                { 
                  backgroundColor: colors.surface,
                  borderColor: sepsisResult.sepsisLikelihood === 'septic_shock' ? colors.error :
                    sepsisResult.sepsisLikelihood === 'high' ? '#F97316' :
                    sepsisResult.sepsisLikelihood === 'moderate' ? colors.warning : colors.success,
                }
              ]}>
                <Text style={[styles.sepsisLikelihood, { 
                  color: sepsisResult.sepsisLikelihood === 'low' ? colors.success : colors.error 
                }]}>
                  {sepsisResult.sepsisLikelihood.replace('_', ' ').toUpperCase()} RISK
                </Text>

                <View style={styles.scoreRow}>
                  <View style={styles.scoreBox}>
                    <Text style={[styles.scoreValue, { color: colors.foreground }]}>
                      {sepsisResult.qSOFA.totalScore}/3
                    </Text>
                    <Text style={[styles.scoreLabel, { color: colors.muted }]}>qSOFA</Text>
                  </View>
                  <View style={styles.scoreBox}>
                    <Text style={[styles.scoreValue, { color: colors.foreground }]}>
                      {sepsisResult.SIRS.criteriaMet}/4
                    </Text>
                    <Text style={[styles.scoreLabel, { color: colors.muted }]}>SIRS</Text>
                  </View>
                  {sepsisResult.lactate && (
                    <View style={styles.scoreBox}>
                      <Text style={[styles.scoreValue, { color: sepsisResult.lactate > 2 ? colors.error : colors.foreground }]}>
                        {sepsisResult.lactate}
                      </Text>
                      <Text style={[styles.scoreLabel, { color: colors.muted }]}>Lactate</Text>
                    </View>
                  )}
                </View>

                <View style={styles.criteriaSection}>
                  <Text style={[styles.criteriaTitle, { color: colors.foreground }]}>qSOFA Criteria</Text>
                  <View style={styles.criteriaItem}>
                    <Text style={[styles.criteriaCheck, { color: sepsisResult.qSOFA.respiratoryRate ? colors.error : colors.success }]}>
                      {sepsisResult.qSOFA.respiratoryRate ? '✓' : '✗'}
                    </Text>
                    <Text style={[styles.criteriaText, { color: colors.foreground }]}>RR ≥22/min</Text>
                  </View>
                  <View style={styles.criteriaItem}>
                    <Text style={[styles.criteriaCheck, { color: sepsisResult.qSOFA.systolicBP ? colors.error : colors.success }]}>
                      {sepsisResult.qSOFA.systolicBP ? '✓' : '✗'}
                    </Text>
                    <Text style={[styles.criteriaText, { color: colors.foreground }]}>SBP ≤100 mmHg</Text>
                  </View>
                  <View style={styles.criteriaItem}>
                    <Text style={[styles.criteriaCheck, { color: sepsisResult.qSOFA.alteredMentation ? colors.error : colors.success }]}>
                      {sepsisResult.qSOFA.alteredMentation ? '✓' : '✗'}
                    </Text>
                    <Text style={[styles.criteriaText, { color: colors.foreground }]}>Altered mentation (GCS {'<'}15)</Text>
                  </View>
                </View>

                <View style={[styles.recommendationsBox, { backgroundColor: colors.background }]}>
                  <Text style={[styles.recommendationsTitle, { color: colors.foreground }]}>
                    Recommendations
                  </Text>
                  {sepsisResult.recommendations.map((rec, idx) => (
                    <Text key={idx} style={[styles.recommendationItem, { color: colors.foreground }]}>
                      • {rec}
                    </Text>
                  ))}
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* NEWS2 Modal */}
      <Modal
        visible={showNEWS2Screen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNEWS2Screen(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>NEWS2 Score</Text>
            <TouchableOpacity onPress={() => setShowNEWS2Screen(false)}>
              <Text style={[styles.closeButton, { color: colors.primary }]}>Close</Text>
            </TouchableOpacity>
          </View>

          {news2Result && (
            <ScrollView style={styles.modalContent}>
              <View style={[
                styles.news2Card,
                { 
                  backgroundColor: colors.surface,
                  borderColor: news2Result.riskLevel === 'high' ? colors.error :
                    news2Result.riskLevel === 'medium' ? colors.warning : colors.success,
                }
              ]}>
                <View style={[
                  styles.news2ScoreCircle,
                  { 
                    backgroundColor: news2Result.riskLevel === 'high' ? colors.error :
                      news2Result.riskLevel === 'medium' ? colors.warning : colors.success,
                  }
                ]}>
                  <Text style={styles.news2ScoreValue}>{news2Result.totalScore}</Text>
                  <Text style={styles.news2ScoreLabel}>NEWS2</Text>
                </View>

                <Text style={[styles.news2RiskLevel, { 
                  color: news2Result.riskLevel === 'high' ? colors.error :
                    news2Result.riskLevel === 'medium' ? colors.warning : colors.success,
                }]}>
                  {news2Result.riskLevel.replace('_', '-').toUpperCase()} RISK
                </Text>

                <Text style={[styles.news2Response, { color: colors.foreground }]}>
                  {news2Result.clinicalResponse}
                </Text>

                <View style={styles.componentsSection}>
                  <Text style={[styles.componentsTitle, { color: colors.foreground }]}>
                    Score Breakdown
                  </Text>
                  {news2Result.components.map((comp, idx) => (
                    <View key={idx} style={[styles.componentRow, { borderBottomColor: colors.border }]}>
                      <Text style={[styles.componentName, { color: colors.foreground }]}>
                        {comp.parameter}
                      </Text>
                      <Text style={[styles.componentValue, { color: colors.muted }]}>
                        {comp.value} {comp.unit}
                      </Text>
                      <View style={[
                        styles.componentScore,
                        { backgroundColor: comp.score >= 2 ? colors.error : comp.score >= 1 ? colors.warning : colors.success }
                      ]}>
                        <Text style={styles.componentScoreText}>{comp.score}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                {news2Result.escalationRequired && (
                  <View style={[styles.escalationWarning, { backgroundColor: colors.error + '20' }]}>
                    <Text style={[styles.escalationText, { color: colors.error }]}>
                      ⚠️ ESCALATION REQUIRED
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 10,
    color: '#fff',
    opacity: 0.9,
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  filterScroll: {
    marginBottom: 16,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  emptyState: {
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
  },
  alertCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  alertIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  severityBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  severityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  alertPatient: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  alertDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertTime: {
    fontSize: 12,
  },
  ackButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  ackButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  ackStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  detailCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  detailHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  detailIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  detailTitleContainer: {
    flex: 1,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  detailPatient: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  detailDescription: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  recommendationBox: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  recommendationLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 15,
    lineHeight: 22,
  },
  evidenceSection: {
    marginBottom: 16,
  },
  evidenceTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  evidenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  evidenceName: {
    fontSize: 14,
  },
  evidenceValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  modalActionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  suppressButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  suppressLabel: {
    fontSize: 12,
  },
  suppressButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  suppressButtonText: {
    fontSize: 12,
  },
  sepsisResultCard: {
    borderRadius: 16,
    borderWidth: 3,
    padding: 20,
  },
  sepsisLikelihood: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  scoreBox: {
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  criteriaSection: {
    marginBottom: 20,
  },
  criteriaTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  criteriaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  criteriaCheck: {
    fontSize: 18,
    fontWeight: 'bold',
    width: 24,
  },
  criteriaText: {
    fontSize: 14,
  },
  recommendationsBox: {
    padding: 16,
    borderRadius: 12,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  recommendationItem: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 4,
  },
  news2Card: {
    borderRadius: 16,
    borderWidth: 3,
    padding: 20,
    alignItems: 'center',
  },
  news2ScoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  news2ScoreValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  news2ScoreLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
  },
  news2RiskLevel: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  news2Response: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  componentsSection: {
    width: '100%',
  },
  componentsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  componentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  componentName: {
    flex: 1,
    fontSize: 14,
  },
  componentValue: {
    fontSize: 14,
    marginRight: 12,
  },
  componentScore: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  componentScoreText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  escalationWarning: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  escalationText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 100,
  },
});
