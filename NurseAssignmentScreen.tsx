/**
 * Nurse Assignment Optimization Screen
 * AI-powered nurse-to-patient assignment with workload balancing
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
  nurseAssignmentService,
  Nurse,
  Patient,
  WorkloadAnalysis,
  UnitStaffingStatus,
  AssignmentRecommendation,
  FairnessMetrics,
} from '../services/NurseAssignmentService';

type UnitType = 'ICU' | 'ED' | 'MedSurg' | 'Surgical' | 'Pediatric' | 'Maternity' | 'Psych' | 'Rehab';

export default function NurseAssignmentScreen() {
  const colors = useColors();
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [workloads, setWorkloads] = useState<WorkloadAnalysis[]>([]);
  const [staffingStatus, setStaffingStatus] = useState<UnitStaffingStatus[]>([]);
  const [recommendations, setRecommendations] = useState<AssignmentRecommendation[]>([]);
  const [fairnessMetrics, setFairnessMetrics] = useState<FairnessMetrics[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<UnitType>('MedSurg');
  const [activeTab, setActiveTab] = useState<'assignments' | 'workload' | 'staffing' | 'fairness'>('assignments');
  const [showNurseModal, setShowNurseModal] = useState(false);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [selectedNurse, setSelectedNurse] = useState<Nurse | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showRecommendationsModal, setShowRecommendationsModal] = useState(false);

  // Load data
  const loadData = useCallback(() => {
    setNurses(nurseAssignmentService.getNurses());
    setPatients(nurseAssignmentService.getPatients());
    setWorkloads(nurseAssignmentService.analyzeWorkloads());
    setStaffingStatus(nurseAssignmentService.getUnitStaffingStatus());
    setRecommendations(nurseAssignmentService.generateOptimalAssignments(selectedUnit, 'day'));
    setFairnessMetrics(nurseAssignmentService.calculateFairnessMetrics());
  }, [selectedUnit]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const unsubscribe = nurseAssignmentService.subscribe(loadData);
    return unsubscribe;
  }, [loadData]);

  // Handle assignment
  const handleAssignPatient = (patientId: string, nurseId: string) => {
    const success = nurseAssignmentService.assignPatientToNurse(patientId, nurseId);
    if (success) {
      Alert.alert('Success', 'Patient assigned successfully');
      loadData();
    } else {
      Alert.alert('Error', 'Failed to assign patient');
    }
  };

  // Get unit nurses and patients
  const unitNurses = nurses.filter(n => n.primaryUnit === selectedUnit);
  const unitPatients = patients.filter(p => p.unit === selectedUnit);

  // Render nurse card
  const renderNurseCard = (nurse: Nurse) => {
    const workload = workloads.find(w => w.nurseId === nurse.id);
    const workloadColor = workload?.status === 'over' ? colors.error : workload?.status === 'optimal' ? colors.success : colors.warning;
    const nursePatients = nurseAssignmentService.getPatientsByNurse(nurse.id);

    return (
      <TouchableOpacity
        key={nurse.id}
        style={[styles.nurseCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => { setSelectedNurse(nurse); setShowNurseModal(true); }}
      >
        <View style={styles.nurseHeader}>
          <View>
            <Text style={[styles.nurseName, { color: colors.foreground }]}>{nurse.name}</Text>
            <Text style={[styles.nurseRole, { color: colors.muted }]}>{nurse.role} • {nurse.skillLevel}</Text>
          </View>
          <View style={[styles.workloadBadge, { backgroundColor: workloadColor }]}>
            <Text style={styles.workloadText}>{workload?.workloadPercentage || 0}%</Text>
          </View>
        </View>
        
        <View style={styles.nurseStats}>
          <View style={styles.nurseStat}>
            <Text style={[styles.nurseStatValue, { color: colors.primary }]}>{nurse.currentPatients.length}</Text>
            <Text style={[styles.nurseStatLabel, { color: colors.muted }]}>Patients</Text>
          </View>
          <View style={styles.nurseStat}>
            <Text style={[styles.nurseStatValue, { color: colors.foreground }]}>{nurse.maxPatients}</Text>
            <Text style={[styles.nurseStatLabel, { color: colors.muted }]}>Max</Text>
          </View>
          <View style={styles.nurseStat}>
            <Text style={[styles.nurseStatValue, { color: colors.warning }]}>
              {nursePatients.reduce((sum, p) => sum + p.acuityScore, 0)}
            </Text>
            <Text style={[styles.nurseStatLabel, { color: colors.muted }]}>Acuity</Text>
          </View>
        </View>

        {/* Patient chips */}
        <View style={styles.patientChips}>
          {nursePatients.slice(0, 3).map(p => (
            <View key={p.id} style={[styles.patientChip, { backgroundColor: nurseAssignmentService.getAcuityColor(p.acuityScore) + '20' }]}>
              <Text style={[styles.patientChipText, { color: nurseAssignmentService.getAcuityColor(p.acuityScore) }]}>
                {p.bedId}
              </Text>
            </View>
          ))}
          {nursePatients.length > 3 && (
            <View style={[styles.patientChip, { backgroundColor: colors.muted + '20' }]}>
              <Text style={[styles.patientChipText, { color: colors.muted }]}>+{nursePatients.length - 3}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Render patient card
  const renderPatientCard = (patient: Patient) => {
    const acuityColor = nurseAssignmentService.getAcuityColor(patient.acuityScore);
    const assignedNurse = nurses.find(n => n.id === patient.assignedNurse);

    return (
      <TouchableOpacity
        key={patient.id}
        style={[styles.patientCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => { setSelectedPatient(patient); setShowPatientModal(true); }}
      >
        <View style={styles.patientHeader}>
          <View style={styles.patientInfo}>
            <Text style={[styles.patientName, { color: colors.foreground }]}>{patient.name}</Text>
            <Text style={[styles.patientBed, { color: colors.muted }]}>{patient.bedId} • {patient.mrn}</Text>
          </View>
          <View style={[styles.acuityBadge, { backgroundColor: acuityColor }]}>
            <Text style={styles.acuityText}>{patient.acuityScore}</Text>
          </View>
        </View>
        
        <Text style={[styles.patientDiagnosis, { color: colors.muted }]} numberOfLines={1}>
          {patient.diagnosis}
        </Text>

        <View style={styles.patientFooter}>
          {assignedNurse ? (
            <View style={[styles.assignedBadge, { backgroundColor: colors.success + '20' }]}>
              <Text style={[styles.assignedText, { color: colors.success }]}>
                {assignedNurse.name}
              </Text>
            </View>
          ) : (
            <View style={[styles.assignedBadge, { backgroundColor: colors.error + '20' }]}>
              <Text style={[styles.assignedText, { color: colors.error }]}>Unassigned</Text>
            </View>
          )}
          {patient.isolationPrecautions && patient.isolationPrecautions.length > 0 && (
            <View style={[styles.isolationBadge, { backgroundColor: colors.warning + '20' }]}>
              <Text style={[styles.isolationText, { color: colors.warning }]}>ISO</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Render workload row
  const renderWorkloadRow = (workload: WorkloadAnalysis) => {
    const statusColors: Record<string, string> = {
      under: colors.warning,
      optimal: colors.success,
      over: colors.error,
    };

    return (
      <View key={workload.nurseId} style={[styles.workloadRow, { borderBottomColor: colors.border }]}>
        <View style={styles.workloadInfo}>
          <Text style={[styles.workloadName, { color: colors.foreground }]}>{workload.nurseName}</Text>
          <Text style={[styles.workloadRecommendation, { color: colors.muted }]}>{workload.recommendation}</Text>
        </View>
        <View style={styles.workloadStats}>
          <Text style={[styles.workloadPatients, { color: colors.foreground }]}>
            {workload.currentPatients}/{workload.maxPatients}
          </Text>
          <View style={[styles.workloadBar, { backgroundColor: colors.border }]}>
            <View style={[
              styles.workloadBarFill,
              { width: `${Math.min(100, workload.workloadPercentage)}%`, backgroundColor: statusColors[workload.status] }
            ]} />
          </View>
          <Text style={[styles.workloadPercent, { color: statusColors[workload.status] }]}>
            {workload.workloadPercentage}%
          </Text>
        </View>
      </View>
    );
  };

  // Render staffing card
  const renderStaffingCard = (status: UnitStaffingStatus) => {
    const levelColors: Record<string, string> = {
      critical: colors.error,
      short: colors.warning,
      adequate: colors.success,
      over: colors.primary,
    };

    return (
      <View key={status.unit} style={[styles.staffingCard, { backgroundColor: colors.surface, borderColor: levelColors[status.staffingLevel] }]}>
        <View style={styles.staffingHeader}>
          <Text style={[styles.staffingUnit, { color: colors.foreground }]}>{status.unit}</Text>
          <View style={[styles.staffingLevelBadge, { backgroundColor: levelColors[status.staffingLevel] }]}>
            <Text style={styles.staffingLevelText}>{status.staffingLevel.toUpperCase()}</Text>
          </View>
        </View>
        <View style={styles.staffingStats}>
          <View style={styles.staffingStat}>
            <Text style={[styles.staffingStatValue, { color: colors.primary }]}>{status.totalNurses}</Text>
            <Text style={[styles.staffingStatLabel, { color: colors.muted }]}>Nurses</Text>
          </View>
          <View style={styles.staffingStat}>
            <Text style={[styles.staffingStatValue, { color: colors.foreground }]}>{status.totalPatients}</Text>
            <Text style={[styles.staffingStatLabel, { color: colors.muted }]}>Patients</Text>
          </View>
          <View style={styles.staffingStat}>
            <Text style={[styles.staffingStatValue, { color: status.averageRatio > status.targetRatio ? colors.error : colors.success }]}>
              1:{status.averageRatio}
            </Text>
            <Text style={[styles.staffingStatLabel, { color: colors.muted }]}>Ratio</Text>
          </View>
          <View style={styles.staffingStat}>
            <Text style={[styles.staffingStatValue, { color: colors.warning }]}>{status.averageAcuity}</Text>
            <Text style={[styles.staffingStatLabel, { color: colors.muted }]}>Avg Acuity</Text>
          </View>
        </View>
        {status.floatNeeded > 0 && (
          <Text style={[styles.floatNeeded, { color: colors.error }]}>
            ⚠️ {status.floatNeeded} float nurse(s) needed
          </Text>
        )}
      </View>
    );
  };

  // Render fairness row
  const renderFairnessRow = (metrics: FairnessMetrics) => {
    const fairnessColor = metrics.fairnessScore >= 60 ? colors.success : metrics.fairnessScore >= 40 ? colors.warning : colors.error;

    return (
      <View key={metrics.nurseId} style={[styles.fairnessRow, { borderBottomColor: colors.border }]}>
        <View style={styles.fairnessInfo}>
          <Text style={[styles.fairnessName, { color: colors.foreground }]}>{metrics.nurseName}</Text>
          <View style={[styles.fairnessScoreBadge, { backgroundColor: fairnessColor }]}>
            <Text style={styles.fairnessScoreText}>{metrics.fairnessScore}</Text>
          </View>
        </View>
        <View style={styles.fairnessStats}>
          <View style={styles.fairnessStat}>
            <Text style={[styles.fairnessStatValue, { color: colors.foreground }]}>{metrics.weeklyPatientCount}</Text>
            <Text style={[styles.fairnessStatLabel, { color: colors.muted }]}>Patients</Text>
          </View>
          <View style={styles.fairnessStat}>
            <Text style={[styles.fairnessStatValue, { color: colors.warning }]}>{metrics.weeklyHighAcuityCount}</Text>
            <Text style={[styles.fairnessStatLabel, { color: colors.muted }]}>High Acuity</Text>
          </View>
          <View style={styles.fairnessStat}>
            <Text style={[styles.fairnessStatValue, { color: colors.success }]}>{metrics.weeklyAdmissions}</Text>
            <Text style={[styles.fairnessStatLabel, { color: colors.muted }]}>Admits</Text>
          </View>
          <View style={styles.fairnessStat}>
            <Text style={[styles.fairnessStatValue, { color: colors.primary }]}>{metrics.weeklyDischarges}</Text>
            <Text style={[styles.fairnessStatLabel, { color: colors.muted }]}>DC</Text>
          </View>
        </View>
      </View>
    );
  };

  // Render recommendation card
  const renderRecommendationCard = ({ item }: { item: AssignmentRecommendation }) => (
    <View style={[styles.recommendationCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.recommendationHeader}>
        <View>
          <Text style={[styles.recommendationPatient, { color: colors.foreground }]}>{item.patientName}</Text>
          <Text style={[styles.recommendationNurse, { color: colors.primary }]}>→ {item.nurseName}</Text>
        </View>
        <View style={[styles.scoreBadge, { backgroundColor: item.score >= 100 ? colors.success : item.score >= 80 ? colors.warning : colors.error }]}>
          <Text style={styles.scoreText}>{item.score}</Text>
        </View>
      </View>
      
      {item.reasons.length > 0 && (
        <View style={styles.reasonsList}>
          {item.reasons.map((reason, idx) => (
            <Text key={idx} style={[styles.reasonText, { color: colors.success }]}>✓ {reason}</Text>
          ))}
        </View>
      )}
      
      {item.concerns.length > 0 && (
        <View style={styles.concernsList}>
          {item.concerns.map((concern, idx) => (
            <Text key={idx} style={[styles.concernText, { color: colors.error }]}>⚠ {concern}</Text>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={[styles.assignButton, { backgroundColor: colors.primary }]}
        onPress={() => handleAssignPatient(item.patientId, item.nurseId)}
      >
        <Text style={styles.assignButtonText}>Confirm Assignment</Text>
      </TouchableOpacity>
    </View>
  );

  // Unit selector
  const units: UnitType[] = ['ICU', 'ED', 'MedSurg', 'Surgical'];

  // Tab buttons
  const tabs = [
    { id: 'assignments', label: 'Assignments' },
    { id: 'workload', label: 'Workload' },
    { id: 'staffing', label: 'Staffing' },
    { id: 'fairness', label: 'Fairness' },
  ] as const;

  return (
    <ScreenContainer>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Nurse Assignments</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            AI-optimized patient assignments
          </Text>
        </View>

        {/* Unit Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitSelector}>
          {units.map(unit => (
            <TouchableOpacity
              key={unit}
              style={[
                styles.unitButton,
                { backgroundColor: selectedUnit === unit ? colors.primary : colors.surface, borderColor: colors.border }
              ]}
              onPress={() => setSelectedUnit(unit)}
            >
              <Text style={[
                styles.unitButtonText,
                { color: selectedUnit === unit ? '#fff' : colors.foreground }
              ]}>
                {unit}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                { backgroundColor: activeTab === tab.id ? colors.primary : colors.surface }
              ]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={[
                styles.tabText,
                { color: activeTab === tab.id ? '#fff' : colors.foreground }
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions */}
        {activeTab === 'assignments' && recommendations.length > 0 && (
          <TouchableOpacity
            style={[styles.recommendationsButton, { backgroundColor: colors.success }]}
            onPress={() => setShowRecommendationsModal(true)}
          >
            <Text style={styles.recommendationsButtonText}>
              🤖 {recommendations.length} AI Recommendations Available
            </Text>
          </TouchableOpacity>
        )}

        {/* Assignments Tab */}
        {activeTab === 'assignments' && (
          <>
            {/* Nurses Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Nurses ({unitNurses.length})
              </Text>
              {unitNurses.map(renderNurseCard)}
            </View>

            {/* Patients Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Patients ({unitPatients.length})
              </Text>
              {unitPatients.map(renderPatientCard)}
            </View>
          </>
        )}

        {/* Workload Tab */}
        {activeTab === 'workload' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Workload Analysis</Text>
            <View style={[styles.workloadContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {workloads.map(renderWorkloadRow)}
            </View>
          </View>
        )}

        {/* Staffing Tab */}
        {activeTab === 'staffing' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Unit Staffing Status</Text>
            {staffingStatus.map(renderStaffingCard)}
          </View>
        )}

        {/* Fairness Tab */}
        {activeTab === 'fairness' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Weekly Fairness Metrics</Text>
            <View style={[styles.fairnessContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {fairnessMetrics.map(renderFairnessRow)}
            </View>
            <Text style={[styles.fairnessNote, { color: colors.muted }]}>
              Score of 50 = perfectly fair distribution. Higher scores indicate more favorable assignments.
            </Text>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Nurse Detail Modal */}
      <Modal
        visible={showNurseModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNurseModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Nurse Details</Text>
            <TouchableOpacity onPress={() => setShowNurseModal(false)}>
              <Text style={[styles.closeButton, { color: colors.primary }]}>Close</Text>
            </TouchableOpacity>
          </View>
          {selectedNurse && (
            <ScrollView style={styles.modalContent}>
              <View style={[styles.detailCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.detailName, { color: colors.foreground }]}>{selectedNurse.name}</Text>
                <Text style={[styles.detailRole, { color: colors.muted }]}>
                  {selectedNurse.role} • {selectedNurse.primaryUnit} • {selectedNurse.yearsExperience} years
                </Text>
                
                <View style={styles.detailSection}>
                  <Text style={[styles.detailLabel, { color: colors.foreground }]}>Skills</Text>
                  <View style={styles.skillsList}>
                    {selectedNurse.skills.map((skill, idx) => (
                      <View key={idx} style={[styles.skillTag, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={[styles.skillText, { color: colors.primary }]}>{skill.name} ({skill.level})</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={[styles.detailLabel, { color: colors.foreground }]}>Certifications</Text>
                  <View style={styles.certsList}>
                    {selectedNurse.certifications.map((cert, idx) => (
                      <View key={idx} style={[styles.certTag, { backgroundColor: colors.success + '20' }]}>
                        <Text style={[styles.certText, { color: colors.success }]}>{cert}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={[styles.detailLabel, { color: colors.foreground }]}>Performance Metrics</Text>
                  <View style={styles.metricsGrid}>
                    <View style={styles.metricItem}>
                      <Text style={[styles.metricValue, { color: colors.success }]}>
                        {selectedNurse.performanceMetrics.patientSatisfaction}%
                      </Text>
                      <Text style={[styles.metricLabel, { color: colors.muted }]}>Satisfaction</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Text style={[styles.metricValue, { color: colors.foreground }]}>
                        {selectedNurse.performanceMetrics.documentationCompliance}%
                      </Text>
                      <Text style={[styles.metricLabel, { color: colors.muted }]}>Documentation</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Text style={[styles.metricValue, { color: colors.warning }]}>
                        {selectedNurse.performanceMetrics.overtimeHours}h
                      </Text>
                      <Text style={[styles.metricLabel, { color: colors.muted }]}>OT (30d)</Text>
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Patient Detail Modal */}
      <Modal
        visible={showPatientModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPatientModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Patient Details</Text>
            <TouchableOpacity onPress={() => setShowPatientModal(false)}>
              <Text style={[styles.closeButton, { color: colors.primary }]}>Close</Text>
            </TouchableOpacity>
          </View>
          {selectedPatient && (
            <ScrollView style={styles.modalContent}>
              <View style={[styles.detailCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.patientDetailHeader}>
                  <View>
                    <Text style={[styles.detailName, { color: colors.foreground }]}>{selectedPatient.name}</Text>
                    <Text style={[styles.detailRole, { color: colors.muted }]}>
                      {selectedPatient.bedId} • {selectedPatient.mrn}
                    </Text>
                  </View>
                  <View style={[styles.acuityLargeBadge, { backgroundColor: nurseAssignmentService.getAcuityColor(selectedPatient.acuityScore) }]}>
                    <Text style={styles.acuityLargeText}>{selectedPatient.acuityScore}</Text>
                    <Text style={styles.acuityLargeLabel}>
                      {nurseAssignmentService.getAcuityLabel(selectedPatient.acuityScore)}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={[styles.detailLabel, { color: colors.foreground }]}>Diagnosis</Text>
                  <Text style={[styles.diagnosisText, { color: colors.muted }]}>{selectedPatient.diagnosis}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={[styles.detailLabel, { color: colors.foreground }]}>Acuity Factors</Text>
                  {selectedPatient.acuityFactors.map((factor, idx) => (
                    <View key={idx} style={[styles.factorRow, { borderBottomColor: colors.border }]}>
                      <View>
                        <Text style={[styles.factorName, { color: colors.foreground }]}>{factor.factor}</Text>
                        <Text style={[styles.factorDesc, { color: colors.muted }]}>{factor.description}</Text>
                      </View>
                      <View style={[styles.factorPoints, { backgroundColor: colors.warning + '20' }]}>
                        <Text style={[styles.factorPointsText, { color: colors.warning }]}>+{factor.points}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                {selectedPatient.specialNeeds.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={[styles.detailLabel, { color: colors.foreground }]}>Special Needs</Text>
                    <View style={styles.needsList}>
                      {selectedPatient.specialNeeds.map((need, idx) => (
                        <View key={idx} style={[styles.needTag, { backgroundColor: colors.primary + '20' }]}>
                          <Text style={[styles.needText, { color: colors.primary }]}>{need}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Recommendations Modal */}
      <Modal
        visible={showRecommendationsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRecommendationsModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>AI Recommendations</Text>
            <TouchableOpacity onPress={() => setShowRecommendationsModal(false)}>
              <Text style={[styles.closeButton, { color: colors.primary }]}>Close</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={recommendations}
            keyExtractor={(item) => `${item.patientId}-${item.nurseId}`}
            renderItem={renderRecommendationCard}
            contentContainerStyle={styles.modalContent}
          />
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
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  unitSelector: {
    marginBottom: 16,
  },
  unitButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  unitButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  recommendationsButton: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  recommendationsButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  nurseCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  nurseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  nurseName: {
    fontSize: 16,
    fontWeight: '600',
  },
  nurseRole: {
    fontSize: 12,
    marginTop: 2,
  },
  workloadBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  workloadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  nurseStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  nurseStat: {
    alignItems: 'center',
  },
  nurseStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  nurseStatLabel: {
    fontSize: 10,
  },
  patientChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  patientChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  patientChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  patientCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  patientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
  },
  patientBed: {
    fontSize: 12,
    marginTop: 2,
  },
  acuityBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acuityText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  patientDiagnosis: {
    fontSize: 13,
    marginBottom: 8,
  },
  patientFooter: {
    flexDirection: 'row',
    gap: 8,
  },
  assignedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  assignedText: {
    fontSize: 11,
    fontWeight: '500',
  },
  isolationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  isolationText: {
    fontSize: 11,
    fontWeight: '600',
  },
  workloadContainer: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  workloadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  workloadInfo: {
    flex: 1,
  },
  workloadName: {
    fontSize: 14,
    fontWeight: '600',
  },
  workloadRecommendation: {
    fontSize: 11,
    marginTop: 2,
  },
  workloadStats: {
    alignItems: 'flex-end',
  },
  workloadPatients: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  workloadBar: {
    width: 80,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  workloadBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  workloadPercent: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  staffingCard: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
    marginBottom: 12,
  },
  staffingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  staffingUnit: {
    fontSize: 18,
    fontWeight: '600',
  },
  staffingLevelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  staffingLevelText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  staffingStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  staffingStat: {
    alignItems: 'center',
  },
  staffingStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  staffingStatLabel: {
    fontSize: 10,
  },
  floatNeeded: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 12,
    textAlign: 'center',
  },
  fairnessContainer: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  fairnessRow: {
    padding: 16,
    borderBottomWidth: 1,
  },
  fairnessInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fairnessName: {
    fontSize: 14,
    fontWeight: '600',
  },
  fairnessScoreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  fairnessScoreText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  fairnessStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  fairnessStat: {
    alignItems: 'center',
  },
  fairnessStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  fairnessStatLabel: {
    fontSize: 9,
  },
  fairnessNote: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 12,
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
    padding: 16,
  },
  detailCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  detailName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  detailRole: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 16,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  skillsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillTag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  skillText: {
    fontSize: 12,
    fontWeight: '500',
  },
  certsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  certTag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  certText: {
    fontSize: 12,
    fontWeight: '500',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  metricLabel: {
    fontSize: 10,
  },
  patientDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  acuityLargeBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  acuityLargeText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  acuityLargeLabel: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '500',
  },
  diagnosisText: {
    fontSize: 14,
    lineHeight: 20,
  },
  factorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  factorName: {
    fontSize: 13,
    fontWeight: '500',
  },
  factorDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  factorPoints: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  factorPointsText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  needsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  needTag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  needText: {
    fontSize: 12,
    fontWeight: '500',
  },
  recommendationCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recommendationPatient: {
    fontSize: 16,
    fontWeight: '600',
  },
  recommendationNurse: {
    fontSize: 14,
    marginTop: 4,
  },
  scoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  scoreText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  reasonsList: {
    marginBottom: 8,
  },
  reasonText: {
    fontSize: 12,
    marginBottom: 2,
  },
  concernsList: {
    marginBottom: 12,
  },
  concernText: {
    fontSize: 12,
    marginBottom: 2,
  },
  assignButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  assignButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 100,
  },
});
