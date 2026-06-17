/**
 * Discharge Planning Screen
 * MediVac One v3.1 - Patient Discharge Workflow Management
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { DischargePlanningService, DischargePlan, DischargeReadinessAssessment } from '../services/DischargePlanningService';

export default function DischargePlanningScreen() {
  const [plans, setPlans] = useState<DischargePlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<DischargePlan | null>(null);
  const [readiness, setReadiness] = useState<DischargeReadinessAssessment | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'checklist' | 'medications' | 'education' | 'followup'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlans();
    const unsubscribe = DischargePlanningService.subscribe(() => loadPlans());
    return unsubscribe;
  }, []);

  const loadPlans = async () => {
    try {
      const allPlans = await DischargePlanningService.getAllPlans();
      setPlans(allPlans);
      if (allPlans.length > 0 && !selectedPlan) {
        selectPlan(allPlans[0]);
      }
    } catch (error) {
      console.error('Failed to load plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectPlan = (plan: DischargePlan) => {
    setSelectedPlan(plan);
    const assessment = DischargePlanningService.assessDischargeReadiness(plan);
    setReadiness(assessment);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      not_started: '#6B7280',
      in_progress: '#3B82F6',
      pending_approval: '#F59E0B',
      approved: '#10B981',
      completed: '#059669',
      cancelled: '#EF4444',
    };
    return colors[status] || '#6B7280';
  };

  const getReadinessColor = (score: number) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const handleChecklistToggle = async (itemId: string, isCompleted: boolean) => {
    if (!selectedPlan) return;
    await DischargePlanningService.updateChecklistItem(
      selectedPlan.id,
      itemId,
      isCompleted,
      'Current User'
    );
    const updated = await DischargePlanningService.getDischargePlan(selectedPlan.id);
    if (updated) selectPlan(updated);
  };

  const handleGenerateSummary = async () => {
    if (!selectedPlan) return;
    await DischargePlanningService.generateDischargeSummary(selectedPlan.id, 'Current User');
    const updated = await DischargePlanningService.getDischargePlan(selectedPlan.id);
    if (updated) selectPlan(updated);
  };

  const handleCompleteDischarge = async () => {
    if (!selectedPlan) return;
    try {
      await DischargePlanningService.completeDischarge(selectedPlan.id);
      const updated = await DischargePlanningService.getDischargePlan(selectedPlan.id);
      if (updated) selectPlan(updated);
    } catch (error) {
      console.error('Cannot complete discharge:', error);
    }
  };

  const renderOverview = () => {
    if (!selectedPlan || !readiness) return null;

    return (
      <View style={styles.tabContent}>
        {/* Readiness Score Card */}
        <View style={styles.readinessCard}>
          <Text style={styles.readinessTitle}>Discharge Readiness</Text>
          <View style={styles.readinessScoreContainer}>
            <Text style={[styles.readinessScore, { color: getReadinessColor(readiness.overallScore) }]}>
              {readiness.overallScore}%
            </Text>
          </View>
          
          {/* Readiness Breakdown */}
          <View style={styles.readinessBreakdown}>
            {[
              { label: 'Clinical', value: readiness.clinicalReadiness },
              { label: 'Medications', value: readiness.medicationReadiness },
              { label: 'Education', value: readiness.educationReadiness },
              { label: 'Social', value: readiness.socialReadiness },
              { label: 'Transport', value: readiness.transportationReadiness },
              { label: 'Follow-up', value: readiness.followUpReadiness },
            ].map((item) => (
              <View key={item.label} style={styles.readinessItem}>
                <Text style={styles.readinessLabel}>{item.label}</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${item.value}%`, backgroundColor: getReadinessColor(item.value) }]} />
                </View>
                <Text style={styles.readinessValue}>{item.value}%</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Barriers */}
        {readiness.barriers.length > 0 && (
          <View style={styles.barriersCard}>
            <Text style={styles.sectionTitle}>⚠️ Barriers to Discharge</Text>
            {readiness.barriers.map((barrier, index) => (
              <Text key={index} style={styles.barrierItem}>• {barrier}</Text>
            ))}
          </View>
        )}

        {/* Recommendations */}
        {readiness.recommendations.length > 0 && (
          <View style={styles.recommendationsCard}>
            <Text style={styles.sectionTitle}>💡 Recommendations</Text>
            {readiness.recommendations.map((rec, index) => (
              <Text key={index} style={styles.recommendationItem}>• {rec}</Text>
            ))}
          </View>
        )}

        {/* Patient Info */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Patient Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Primary Diagnosis:</Text>
            <Text style={styles.infoValue}>{selectedPlan.primaryDiagnosis}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Admission Date:</Text>
            <Text style={styles.infoValue}>{selectedPlan.admissionDate.toLocaleDateString()}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Expected Discharge:</Text>
            <Text style={styles.infoValue}>{selectedPlan.expectedDischargeDate.toLocaleDateString()}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Disposition:</Text>
            <Text style={styles.infoValue}>{selectedPlan.dischargeDisposition}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.summaryButton]}
            onPress={handleGenerateSummary}
          >
            <Text style={styles.actionButtonText}>📄 Generate Summary</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.actionButton, 
              styles.dischargeButton,
              readiness.overallScore < 80 && styles.disabledButton
            ]}
            onPress={handleCompleteDischarge}
            disabled={readiness.overallScore < 80}
          >
            <Text style={styles.actionButtonText}>✅ Complete Discharge</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderChecklist = () => {
    if (!selectedPlan) return null;

    const categories = [...new Set(selectedPlan.checklist.map(c => c.category))];

    return (
      <View style={styles.tabContent}>
        {categories.map((category) => (
          <View key={category} style={styles.checklistCategory}>
            <Text style={styles.categoryTitle}>{category}</Text>
            {selectedPlan.checklist
              .filter(c => c.category === category)
              .sort((a, b) => a.order - b.order)
              .map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.checklistItem}
                  onPress={() => handleChecklistToggle(item.id, !item.isCompleted)}
                >
                  <View style={[styles.checkbox, item.isCompleted && styles.checkboxChecked]}>
                    {item.isCompleted && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <View style={styles.checklistContent}>
                    <Text style={[styles.checklistText, item.isCompleted && styles.checklistTextCompleted]}>
                      {item.item}
                    </Text>
                    {item.isRequired && <Text style={styles.requiredBadge}>Required</Text>}
                    {item.completedBy && (
                      <Text style={styles.completedInfo}>
                        Completed by {item.completedBy} at {item.completedAt?.toLocaleTimeString()}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
          </View>
        ))}
      </View>
    );
  };

  const renderMedications = () => {
    if (!selectedPlan) return null;
    const medRec = selectedPlan.medicationReconciliation;

    return (
      <View style={styles.tabContent}>
        <View style={styles.medStatusCard}>
          <Text style={styles.sectionTitle}>Reconciliation Status</Text>
          <View style={[styles.statusBadge, { backgroundColor: medRec.status === 'completed' ? '#10B981' : '#F59E0B' }]}>
            <Text style={styles.statusBadgeText}>{medRec.status.replace('_', ' ').toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.medSection}>
          <Text style={styles.medSectionTitle}>📥 Admission Medications ({medRec.admissionMedications.length})</Text>
          {medRec.admissionMedications.map((med) => (
            <View key={med.id} style={styles.medCard}>
              <Text style={styles.medName}>{med.name}</Text>
              <Text style={styles.medDetails}>{med.dosage} - {med.frequency}</Text>
              {med.isHighRisk && <Text style={styles.highRiskBadge}>⚠️ High Risk</Text>}
            </View>
          ))}
        </View>

        <View style={styles.medSection}>
          <Text style={styles.medSectionTitle}>📤 Discharge Medications ({medRec.dischargeMedications.length})</Text>
          {medRec.dischargeMedications.map((med) => (
            <View key={med.id} style={styles.medCard}>
              <Text style={styles.medName}>{med.name}</Text>
              <Text style={styles.medDetails}>{med.dosage} - {med.frequency}</Text>
              <Text style={styles.medInstructions}>{med.instructions}</Text>
            </View>
          ))}
        </View>

        {medRec.changedMedications.length > 0 && (
          <View style={styles.medSection}>
            <Text style={styles.medSectionTitle}>🔄 Changed Medications</Text>
            {medRec.changedMedications.map((change, index) => (
              <View key={index} style={styles.changeCard}>
                <Text style={styles.changeMedName}>{change.medicationName}</Text>
                <Text style={styles.changeDetails}>
                  {change.changeType}: {change.previousValue} → {change.newValue}
                </Text>
                <Text style={styles.changeReason}>Reason: {change.reason}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderEducation = () => {
    if (!selectedPlan) return null;

    return (
      <View style={styles.tabContent}>
        {selectedPlan.educationMaterials.map((edu) => (
          <View key={edu.id} style={styles.educationCard}>
            <View style={styles.educationHeader}>
              <Text style={styles.educationTitle}>{edu.title}</Text>
              <View style={[styles.eduStatusBadge, { backgroundColor: edu.status === 'acknowledged' ? '#10B981' : edu.status === 'completed' ? '#3B82F6' : '#6B7280' }]}>
                <Text style={styles.eduStatusText}>{edu.status.replace('_', ' ')}</Text>
              </View>
            </View>
            <Text style={styles.educationCategory}>{edu.category.replace('_', ' ')}</Text>
            <Text style={styles.educationFormat}>Format: {edu.format}</Text>
            {edu.providedBy && (
              <Text style={styles.educationProvider}>Provided by: {edu.providedBy}</Text>
            )}
            {edu.comprehensionVerified && (
              <Text style={styles.comprehensionBadge}>✓ Comprehension Verified</Text>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderFollowUp = () => {
    if (!selectedPlan) return null;

    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Follow-Up Appointments</Text>
        {selectedPlan.followUpAppointments.length === 0 ? (
          <Text style={styles.emptyText}>No follow-up appointments scheduled</Text>
        ) : (
          selectedPlan.followUpAppointments.map((apt) => (
            <View key={apt.id} style={styles.appointmentCard}>
              <View style={styles.appointmentHeader}>
                <Text style={styles.appointmentType}>{apt.type.replace('_', ' ')}</Text>
                <View style={[styles.scheduledBadge, { backgroundColor: apt.isScheduled ? '#10B981' : '#F59E0B' }]}>
                  <Text style={styles.scheduledText}>{apt.isScheduled ? 'Scheduled' : 'Pending'}</Text>
                </View>
              </View>
              <Text style={styles.appointmentProvider}>{apt.providerName}</Text>
              <Text style={styles.appointmentSpecialty}>{apt.providerSpecialty}</Text>
              <Text style={styles.appointmentDateTime}>
                📅 {apt.scheduledDate.toLocaleDateString()} at {apt.scheduledTime}
              </Text>
              <Text style={styles.appointmentLocation}>📍 {apt.location}</Text>
              <Text style={styles.appointmentPhone}>📞 {apt.phone}</Text>
              <Text style={styles.appointmentPurpose}>Purpose: {apt.purpose}</Text>
            </View>
          ))
        )}

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Home Care Referrals</Text>
        {selectedPlan.homeCareReferrals.length === 0 ? (
          <Text style={styles.emptyText}>No home care referrals</Text>
        ) : (
          selectedPlan.homeCareReferrals.map((ref) => (
            <View key={ref.id} style={styles.referralCard}>
              <Text style={styles.referralType}>{ref.serviceType.replace('_', ' ')}</Text>
              <Text style={styles.referralAgency}>{ref.agencyName}</Text>
              <Text style={styles.referralDetails}>
                {ref.frequency} for {ref.duration}
              </Text>
              <View style={[styles.referralStatus, { backgroundColor: ref.status === 'authorized' ? '#10B981' : '#F59E0B' }]}>
                <Text style={styles.referralStatusText}>{ref.status}</Text>
              </View>
            </View>
          ))
        )}

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Transportation</Text>
        <View style={styles.transportCard}>
          <Text style={styles.transportType}>🚗 {selectedPlan.transportation.type.replace('_', ' ')}</Text>
          <Text style={styles.transportDetails}>
            From: {selectedPlan.transportation.pickupLocation}
          </Text>
          <Text style={styles.transportDetails}>
            To: {selectedPlan.transportation.destination || 'Not specified'}
          </Text>
          <Text style={styles.transportContact}>
            Contact: {selectedPlan.transportation.contactName} - {selectedPlan.transportation.contactPhone}
          </Text>
          <View style={[styles.transportStatus, { backgroundColor: selectedPlan.transportation.isConfirmed ? '#10B981' : '#F59E0B' }]}>
            <Text style={styles.transportStatusText}>
              {selectedPlan.transportation.isConfirmed ? '✓ Confirmed' : 'Pending Confirmation'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading discharge plans...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📋 Discharge Planning</Text>
        <Text style={styles.headerSubtitle}>{plans.length} Active Plans</Text>
      </View>

      <View style={styles.content}>
        {/* Plan List Sidebar */}
        <View style={styles.sidebar}>
          <Text style={styles.sidebarTitle}>Patients</Text>
          <ScrollView style={styles.planList}>
            {plans.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                style={[styles.planItem, selectedPlan?.id === plan.id && styles.planItemSelected]}
                onPress={() => selectPlan(plan)}
              >
                <Text style={styles.planPatientName}>{plan.patientName}</Text>
                <Text style={styles.planDiagnosis} numberOfLines={1}>{plan.primaryDiagnosis}</Text>
                <View style={[styles.planStatus, { backgroundColor: getStatusColor(plan.status) }]}>
                  <Text style={styles.planStatusText}>{plan.status.replace('_', ' ')}</Text>
                </View>
                <Text style={styles.planReadiness}>Readiness: {plan.readinessScore}%</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {selectedPlan ? (
            <>
              {/* Patient Header */}
              <View style={styles.patientHeader}>
                <Text style={styles.patientName}>{selectedPlan.patientName}</Text>
                <View style={[styles.statusBadgeLarge, { backgroundColor: getStatusColor(selectedPlan.status) }]}>
                  <Text style={styles.statusBadgeLargeText}>{selectedPlan.status.replace('_', ' ')}</Text>
                </View>
              </View>

              {/* Tabs */}
              <View style={styles.tabs}>
                {(['overview', 'checklist', 'medications', 'education', 'followup'] as const).map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    style={[styles.tab, activeTab === tab && styles.tabActive]}
                    onPress={() => setActiveTab(tab)}
                  >
                    <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Tab Content */}
              <ScrollView style={styles.tabContentContainer}>
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'checklist' && renderChecklist()}
                {activeTab === 'medications' && renderMedications()}
                {activeTab === 'education' && renderEducation()}
                {activeTab === 'followup' && renderFollowUp()}
              </ScrollView>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Select a patient to view discharge plan</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { padding: 20, backgroundColor: '#1E293B', borderBottomWidth: 1, borderBottomColor: '#334155' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#F8FAFC' },
  headerSubtitle: { fontSize: 14, color: '#94A3B8', marginTop: 4 },
  content: { flex: 1, flexDirection: 'row' },
  sidebar: { width: 280, backgroundColor: '#1E293B', borderRightWidth: 1, borderRightColor: '#334155' },
  sidebarTitle: { fontSize: 16, fontWeight: '600', color: '#F8FAFC', padding: 16, borderBottomWidth: 1, borderBottomColor: '#334155' },
  planList: { flex: 1 },
  planItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#334155' },
  planItemSelected: { backgroundColor: '#334155' },
  planPatientName: { fontSize: 16, fontWeight: '600', color: '#F8FAFC' },
  planDiagnosis: { fontSize: 12, color: '#94A3B8', marginTop: 4 },
  planStatus: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginTop: 8, alignSelf: 'flex-start' },
  planStatusText: { fontSize: 10, fontWeight: '600', color: '#FFFFFF', textTransform: 'uppercase' },
  planReadiness: { fontSize: 12, color: '#94A3B8', marginTop: 8 },
  mainContent: { flex: 1, backgroundColor: '#0F172A' },
  patientHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#1E293B' },
  patientName: { fontSize: 20, fontWeight: 'bold', color: '#F8FAFC' },
  statusBadgeLarge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  statusBadgeLargeText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF', textTransform: 'uppercase' },
  tabs: { flexDirection: 'row', backgroundColor: '#1E293B', borderBottomWidth: 1, borderBottomColor: '#334155' },
  tab: { paddingHorizontal: 20, paddingVertical: 14 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#3B82F6' },
  tabText: { fontSize: 14, color: '#94A3B8' },
  tabTextActive: { color: '#3B82F6', fontWeight: '600' },
  tabContentContainer: { flex: 1 },
  tabContent: { padding: 20 },
  readinessCard: { backgroundColor: '#1E293B', borderRadius: 12, padding: 20, marginBottom: 16 },
  readinessTitle: { fontSize: 18, fontWeight: '600', color: '#F8FAFC', marginBottom: 16 },
  readinessScoreContainer: { alignItems: 'center', marginBottom: 20 },
  readinessScore: { fontSize: 48, fontWeight: 'bold' },
  readinessBreakdown: { gap: 12 },
  readinessItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  readinessLabel: { width: 100, fontSize: 14, color: '#94A3B8' },
  progressBar: { flex: 1, height: 8, backgroundColor: '#334155', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  readinessValue: { width: 50, fontSize: 14, color: '#F8FAFC', textAlign: 'right' },
  barriersCard: { backgroundColor: '#7F1D1D', borderRadius: 12, padding: 16, marginBottom: 16 },
  barrierItem: { fontSize: 14, color: '#FCA5A5', marginTop: 8 },
  recommendationsCard: { backgroundColor: '#1E3A5F', borderRadius: 12, padding: 16, marginBottom: 16 },
  recommendationItem: { fontSize: 14, color: '#93C5FD', marginTop: 8 },
  infoCard: { backgroundColor: '#1E293B', borderRadius: 12, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#F8FAFC', marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#334155' },
  infoLabel: { fontSize: 14, color: '#94A3B8' },
  infoValue: { fontSize: 14, color: '#F8FAFC', fontWeight: '500' },
  actionButtons: { flexDirection: 'row', gap: 12, marginTop: 16 },
  actionButton: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  summaryButton: { backgroundColor: '#3B82F6' },
  dischargeButton: { backgroundColor: '#10B981' },
  disabledButton: { backgroundColor: '#4B5563', opacity: 0.5 },
  actionButtonText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  checklistCategory: { marginBottom: 24 },
  categoryTitle: { fontSize: 16, fontWeight: '600', color: '#F8FAFC', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#334155' },
  checklistItem: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#64748B', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  checkboxChecked: { backgroundColor: '#10B981', borderColor: '#10B981' },
  checkmark: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
  checklistContent: { flex: 1 },
  checklistText: { fontSize: 14, color: '#F8FAFC' },
  checklistTextCompleted: { color: '#94A3B8', textDecorationLine: 'line-through' },
  requiredBadge: { fontSize: 10, color: '#F59E0B', marginTop: 4 },
  completedInfo: { fontSize: 12, color: '#64748B', marginTop: 4 },
  medStatusCard: { backgroundColor: '#1E293B', borderRadius: 12, padding: 16, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  statusBadgeText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },
  medSection: { marginBottom: 20 },
  medSectionTitle: { fontSize: 16, fontWeight: '600', color: '#F8FAFC', marginBottom: 12 },
  medCard: { backgroundColor: '#1E293B', borderRadius: 8, padding: 12, marginBottom: 8 },
  medName: { fontSize: 14, fontWeight: '600', color: '#F8FAFC' },
  medDetails: { fontSize: 12, color: '#94A3B8', marginTop: 4 },
  medInstructions: { fontSize: 12, color: '#3B82F6', marginTop: 4, fontStyle: 'italic' },
  highRiskBadge: { fontSize: 12, color: '#F59E0B', marginTop: 4 },
  changeCard: { backgroundColor: '#1E3A5F', borderRadius: 8, padding: 12, marginBottom: 8 },
  changeMedName: { fontSize: 14, fontWeight: '600', color: '#F8FAFC' },
  changeDetails: { fontSize: 12, color: '#93C5FD', marginTop: 4 },
  changeReason: { fontSize: 12, color: '#94A3B8', marginTop: 4 },
  educationCard: { backgroundColor: '#1E293B', borderRadius: 12, padding: 16, marginBottom: 12 },
  educationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  educationTitle: { fontSize: 14, fontWeight: '600', color: '#F8FAFC', flex: 1 },
  eduStatusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  eduStatusText: { fontSize: 10, fontWeight: '600', color: '#FFFFFF', textTransform: 'capitalize' },
  educationCategory: { fontSize: 12, color: '#94A3B8', marginTop: 8, textTransform: 'capitalize' },
  educationFormat: { fontSize: 12, color: '#64748B', marginTop: 4 },
  educationProvider: { fontSize: 12, color: '#3B82F6', marginTop: 4 },
  comprehensionBadge: { fontSize: 12, color: '#10B981', marginTop: 8 },
  appointmentCard: { backgroundColor: '#1E293B', borderRadius: 12, padding: 16, marginBottom: 12 },
  appointmentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  appointmentType: { fontSize: 12, color: '#94A3B8', textTransform: 'uppercase' },
  scheduledBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  scheduledText: { fontSize: 10, fontWeight: '600', color: '#FFFFFF' },
  appointmentProvider: { fontSize: 16, fontWeight: '600', color: '#F8FAFC' },
  appointmentSpecialty: { fontSize: 14, color: '#94A3B8' },
  appointmentDateTime: { fontSize: 14, color: '#3B82F6', marginTop: 8 },
  appointmentLocation: { fontSize: 14, color: '#94A3B8', marginTop: 4 },
  appointmentPhone: { fontSize: 14, color: '#94A3B8', marginTop: 4 },
  appointmentPurpose: { fontSize: 12, color: '#64748B', marginTop: 8, fontStyle: 'italic' },
  referralCard: { backgroundColor: '#1E293B', borderRadius: 12, padding: 16, marginBottom: 12 },
  referralType: { fontSize: 14, fontWeight: '600', color: '#F8FAFC', textTransform: 'capitalize' },
  referralAgency: { fontSize: 14, color: '#94A3B8', marginTop: 4 },
  referralDetails: { fontSize: 12, color: '#64748B', marginTop: 4 },
  referralStatus: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginTop: 8, alignSelf: 'flex-start' },
  referralStatusText: { fontSize: 10, fontWeight: '600', color: '#FFFFFF', textTransform: 'uppercase' },
  transportCard: { backgroundColor: '#1E293B', borderRadius: 12, padding: 16 },
  transportType: { fontSize: 16, fontWeight: '600', color: '#F8FAFC', textTransform: 'capitalize' },
  transportDetails: { fontSize: 14, color: '#94A3B8', marginTop: 8 },
  transportContact: { fontSize: 14, color: '#94A3B8', marginTop: 8 },
  transportStatus: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, marginTop: 12, alignSelf: 'flex-start' },
  transportStatusText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },
  emptyText: { fontSize: 14, color: '#64748B', fontStyle: 'italic' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' },
  loadingText: { fontSize: 16, color: '#94A3B8' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyStateText: { fontSize: 16, color: '#64748B' },
});
