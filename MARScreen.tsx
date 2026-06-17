/**
 * Medication Administration Record (MAR) Screen
 * View and administer medications with five-rights verification
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import {
  marService,
  ScheduledAdmin,
  MedicationOrder,
  MARSummary,
  FiveRightsVerification,
  AdminStatus,
} from '../services/MARService';

// Demo patient
const DEMO_PATIENT = { id: 'P-001', name: 'John Smith', barcode: 'PAT001SMITH' };

export default function MARScreen() {
  const colors = useColors();
  const [scheduledMeds, setScheduledMeds] = useState<ScheduledAdmin[]>([]);
  const [prnOrders, setPrnOrders] = useState<MedicationOrder[]>([]);
  const [summary, setSummary] = useState<MARSummary | null>(null);
  const [selectedMed, setSelectedMed] = useState<ScheduledAdmin | null>(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showPRNModal, setShowPRNModal] = useState(false);
  const [selectedPRN, setSelectedPRN] = useState<MedicationOrder | null>(null);
  const [verification, setVerification] = useState<FiveRightsVerification | null>(null);
  const [notes, setNotes] = useState('');
  const [prnIndication, setPrnIndication] = useState('');
  const [prnDose, setPrnDose] = useState('');
  const [activeTab, setActiveTab] = useState<'scheduled' | 'prn' | 'history'>('scheduled');

  // Load data
  const loadData = useCallback(() => {
    setScheduledMeds(marService.getScheduledAdmins(DEMO_PATIENT.id));
    setPrnOrders(marService.getPRNOrders(DEMO_PATIENT.id));
    setSummary(marService.getMARSummary(DEMO_PATIENT.id));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Subscribe to updates
  useEffect(() => {
    const unsubscribe = marService.subscribe(() => {
      loadData();
    });
    return unsubscribe;
  }, [loadData]);

  // Start administration
  const handleStartAdmin = (med: ScheduledAdmin) => {
    setSelectedMed(med);
    
    // Simulate barcode scanning verification
    const ver = marService.performFiveRightsVerification(
      med,
      DEMO_PATIENT.barcode,
      med.barcode,
      DEMO_PATIENT.barcode
    );
    setVerification(ver);
    setShowAdminModal(true);
  };

  // Complete administration
  const handleCompleteAdmin = async () => {
    if (!selectedMed || !verification) return;

    if (!marService.isFullyVerified(verification)) {
      Alert.alert(
        'Verification Failed',
        'Not all five rights have been verified. Do you want to override?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Override',
            style: 'destructive',
            onPress: async () => {
              const overrideVer = { ...verification };
              if (overrideVer.rightTime === 'failed') {
                overrideVer.rightTime = 'override';
              }
              await completeAdministration(overrideVer);
            },
          },
        ]
      );
      return;
    }

    await completeAdministration(verification);
  };

  const completeAdministration = async (ver: FiveRightsVerification) => {
    try {
      await marService.administerMedication(
        selectedMed!.id,
        DEMO_PATIENT.name,
        'Current User',
        ver,
        undefined,
        notes || undefined
      );
      setShowAdminModal(false);
      setSelectedMed(null);
      setVerification(null);
      setNotes('');
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to record administration');
    }
  };

  // Hold medication
  const handleHold = async () => {
    if (!selectedMed) return;

    Alert.prompt(
      'Hold Medication',
      'Enter reason for holding:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Hold',
          onPress: async (reason: string | undefined) => {
            if (!reason) return;
            try {
              await marService.holdMedication(selectedMed.id, reason, 'Current User');
              setShowAdminModal(false);
              setSelectedMed(null);
              loadData();
            } catch (error) {
              Alert.alert('Error', 'Failed to hold medication');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  // Refuse medication
  const handleRefuse = async () => {
    if (!selectedMed) return;

    Alert.prompt(
      'Patient Refused',
      'Enter reason for refusal:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Document',
          onPress: async (reason: string | undefined) => {
            if (!reason) return;
            try {
              await marService.refuseMedication(selectedMed.id, reason, 'Current User');
              setShowAdminModal(false);
              setSelectedMed(null);
              loadData();
            } catch (error) {
              Alert.alert('Error', 'Failed to document refusal');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  // Administer PRN
  const handleAdministerPRN = async () => {
    if (!selectedPRN || !prnIndication || !prnDose) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      await marService.administerPRN(
        selectedPRN.id,
        DEMO_PATIENT.id,
        prnIndication,
        prnDose,
        'Current User',
        notes || undefined
      );
      setShowPRNModal(false);
      setSelectedPRN(null);
      setPrnIndication('');
      setPrnDose('');
      setNotes('');
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to administer PRN medication');
    }
  };

  // Get verification icon
  const getVerificationIcon = (status: string) => {
    switch (status) {
      case 'verified': return '✓';
      case 'failed': return '✗';
      case 'override': return '⚠';
      default: return '○';
    }
  };

  // Get verification color
  const getVerificationColor = (status: string) => {
    switch (status) {
      case 'verified': return colors.success;
      case 'failed': return colors.error;
      case 'override': return colors.warning;
      default: return colors.muted;
    }
  };

  // Render scheduled medication card
  const renderScheduledMed = ({ item }: { item: ScheduledAdmin }) => {
    const isActionable = item.status === 'due' || item.status === 'overdue' || item.status === 'scheduled';
    
    return (
      <TouchableOpacity
        style={[
          styles.medCard,
          { backgroundColor: colors.surface, borderColor: marService.getStatusColor(item.status) },
        ]}
        onPress={() => isActionable && handleStartAdmin(item)}
        disabled={!isActionable}
      >
        <View style={styles.medHeader}>
          <View style={styles.medInfo}>
            <Text style={[styles.medName, { color: colors.foreground }]}>{item.medicationName}</Text>
            <Text style={[styles.medDose, { color: colors.muted }]}>
              {item.dose} {item.unit} • {marService.getRouteDisplayName(item.route)}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: marService.getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
        
        <View style={styles.medFooter}>
          <Text style={[styles.scheduledTime, { color: colors.muted }]}>
            Scheduled: {new Date(item.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {isActionable && (
            <Text style={[styles.tapHint, { color: colors.primary }]}>Tap to administer</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Render PRN order card
  const renderPRNOrder = ({ item }: { item: MedicationOrder }) => (
    <TouchableOpacity
      style={[styles.medCard, { backgroundColor: colors.surface, borderColor: colors.primary }]}
      onPress={() => {
        setSelectedPRN(item);
        setPrnDose(item.dose);
        setShowPRNModal(true);
      }}
    >
      <View style={styles.medHeader}>
        <View style={styles.medInfo}>
          <Text style={[styles.medName, { color: colors.foreground }]}>{item.medicationName}</Text>
          <Text style={[styles.medDose, { color: colors.muted }]}>
            {item.dose} {item.unit} • {marService.getRouteDisplayName(item.route)}
          </Text>
        </View>
        <View style={[styles.prnBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.prnText}>PRN</Text>
        </View>
      </View>
      
      <Text style={[styles.instructions, { color: colors.muted }]}>
        {item.instructions || item.frequency}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>MAR</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Patient: {DEMO_PATIENT.name}
          </Text>
        </View>

        {/* Summary Card */}
        {summary && (
          <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: colors.primary }]}>{summary.totalScheduled}</Text>
                <Text style={[styles.summaryLabel, { color: colors.muted }]}>Scheduled</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: colors.success }]}>{summary.administered}</Text>
                <Text style={[styles.summaryLabel, { color: colors.muted }]}>Given</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: colors.warning }]}>{summary.held}</Text>
                <Text style={[styles.summaryLabel, { color: colors.muted }]}>Held</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: colors.error }]}>{summary.missed}</Text>
                <Text style={[styles.summaryLabel, { color: colors.muted }]}>Missed</Text>
              </View>
            </View>
            <View style={[styles.complianceBar, { backgroundColor: colors.border }]}>
              <View style={[styles.complianceFill, { width: `${summary.complianceRate}%`, backgroundColor: colors.success }]} />
            </View>
            <Text style={[styles.complianceText, { color: colors.muted }]}>
              {summary.complianceRate}% Compliance Rate
            </Text>
          </View>
        )}

        {/* Tabs */}
        <View style={[styles.tabs, { borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'scheduled' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab('scheduled')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'scheduled' ? colors.primary : colors.muted }]}>
              Scheduled
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'prn' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab('prn')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'prn' ? colors.primary : colors.muted }]}>
              PRN
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'history' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab('history')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'history' ? colors.primary : colors.muted }]}>
              History
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {activeTab === 'scheduled' && (
          <FlatList
            data={scheduledMeds}
            keyExtractor={(item) => item.id}
            renderItem={renderScheduledMed}
            scrollEnabled={false}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: colors.muted }]}>No scheduled medications</Text>
            }
          />
        )}

        {activeTab === 'prn' && (
          <FlatList
            data={prnOrders}
            keyExtractor={(item) => item.id}
            renderItem={renderPRNOrder}
            scrollEnabled={false}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: colors.muted }]}>No PRN medications ordered</Text>
            }
          />
        )}

        {activeTab === 'history' && (
          <View style={styles.historySection}>
            {marService.getAdministrationHistory(DEMO_PATIENT.id).map((record) => (
              <View key={record.id} style={[styles.historyItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.historyHeader}>
                  <Text style={[styles.historyMed, { color: colors.foreground }]}>{record.medicationName}</Text>
                  <Text style={[styles.historyTime, { color: colors.muted }]}>
                    {new Date(record.administeredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <Text style={[styles.historyDose, { color: colors.muted }]}>
                  {record.actualDose || record.dose} {record.unit} • {record.administeredBy}
                </Text>
              </View>
            ))}
            {marService.getAdministrationHistory(DEMO_PATIENT.id).length === 0 && (
              <Text style={[styles.emptyText, { color: colors.muted }]}>No administration history for today</Text>
            )}
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Administration Modal */}
      <Modal
        visible={showAdminModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAdminModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Administer Medication</Text>
            <TouchableOpacity onPress={() => setShowAdminModal(false)}>
              <Text style={[styles.closeButton, { color: colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedMed && (
              <>
                {/* Medication Info */}
                <View style={[styles.medInfoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.medInfoName, { color: colors.foreground }]}>{selectedMed.medicationName}</Text>
                  <Text style={[styles.medInfoDose, { color: colors.primary }]}>
                    {selectedMed.dose} {selectedMed.unit}
                  </Text>
                  <Text style={[styles.medInfoRoute, { color: colors.muted }]}>
                    {marService.getRouteDisplayName(selectedMed.route)}
                  </Text>
                </View>

                {/* Five Rights Verification */}
                <View style={[styles.verificationCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.verificationTitle, { color: colors.foreground }]}>Five Rights Verification</Text>
                  
                  {verification && (
                    <View style={styles.verificationList}>
                      <View style={styles.verificationItem}>
                        <Text style={[styles.verificationIcon, { color: getVerificationColor(verification.rightPatient) }]}>
                          {getVerificationIcon(verification.rightPatient)}
                        </Text>
                        <Text style={[styles.verificationLabel, { color: colors.foreground }]}>Right Patient</Text>
                      </View>
                      <View style={styles.verificationItem}>
                        <Text style={[styles.verificationIcon, { color: getVerificationColor(verification.rightMedication) }]}>
                          {getVerificationIcon(verification.rightMedication)}
                        </Text>
                        <Text style={[styles.verificationLabel, { color: colors.foreground }]}>Right Medication</Text>
                      </View>
                      <View style={styles.verificationItem}>
                        <Text style={[styles.verificationIcon, { color: getVerificationColor(verification.rightDose) }]}>
                          {getVerificationIcon(verification.rightDose)}
                        </Text>
                        <Text style={[styles.verificationLabel, { color: colors.foreground }]}>Right Dose</Text>
                      </View>
                      <View style={styles.verificationItem}>
                        <Text style={[styles.verificationIcon, { color: getVerificationColor(verification.rightRoute) }]}>
                          {getVerificationIcon(verification.rightRoute)}
                        </Text>
                        <Text style={[styles.verificationLabel, { color: colors.foreground }]}>Right Route</Text>
                      </View>
                      <View style={styles.verificationItem}>
                        <Text style={[styles.verificationIcon, { color: getVerificationColor(verification.rightTime) }]}>
                          {getVerificationIcon(verification.rightTime)}
                        </Text>
                        <Text style={[styles.verificationLabel, { color: colors.foreground }]}>Right Time</Text>
                      </View>
                    </View>
                  )}
                </View>

                {/* Notes */}
                <Text style={[styles.inputLabel, { color: colors.foreground }]}>Notes (optional)</Text>
                <TextInput
                  style={[styles.notesInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Add administration notes..."
                  placeholderTextColor={colors.muted}
                  multiline
                />

                {/* Action Buttons */}
                <TouchableOpacity
                  style={[styles.adminButton, { backgroundColor: colors.success }]}
                  onPress={handleCompleteAdmin}
                >
                  <Text style={styles.adminButtonText}>Complete Administration</Text>
                </TouchableOpacity>

                <View style={styles.secondaryActions}>
                  <TouchableOpacity
                    style={[styles.secondaryButton, { backgroundColor: colors.warning }]}
                    onPress={handleHold}
                  >
                    <Text style={styles.secondaryButtonText}>Hold</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.secondaryButton, { backgroundColor: colors.error }]}
                    onPress={handleRefuse}
                  >
                    <Text style={styles.secondaryButtonText}>Refused</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* PRN Modal */}
      <Modal
        visible={showPRNModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPRNModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Administer PRN</Text>
            <TouchableOpacity onPress={() => setShowPRNModal(false)}>
              <Text style={[styles.closeButton, { color: colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedPRN && (
              <>
                <View style={[styles.medInfoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.medInfoName, { color: colors.foreground }]}>{selectedPRN.medicationName}</Text>
                  <Text style={[styles.medInfoDose, { color: colors.primary }]}>
                    {selectedPRN.dose} {selectedPRN.unit}
                  </Text>
                  <Text style={[styles.medInfoRoute, { color: colors.muted }]}>
                    {marService.getRouteDisplayName(selectedPRN.route)}
                  </Text>
                  {selectedPRN.instructions && (
                    <Text style={[styles.medInstructions, { color: colors.muted }]}>
                      {selectedPRN.instructions}
                    </Text>
                  )}
                </View>

                <Text style={[styles.inputLabel, { color: colors.foreground }]}>Indication *</Text>
                <TextInput
                  style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]}
                  value={prnIndication}
                  onChangeText={setPrnIndication}
                  placeholder="Reason for administration..."
                  placeholderTextColor={colors.muted}
                />

                <Text style={[styles.inputLabel, { color: colors.foreground }]}>Dose *</Text>
                <TextInput
                  style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]}
                  value={prnDose}
                  onChangeText={setPrnDose}
                  placeholder="Actual dose given"
                  placeholderTextColor={colors.muted}
                />

                <Text style={[styles.inputLabel, { color: colors.foreground }]}>Notes (optional)</Text>
                <TextInput
                  style={[styles.notesInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Additional notes..."
                  placeholderTextColor={colors.muted}
                  multiline
                />

                <TouchableOpacity
                  style={[styles.adminButton, { backgroundColor: colors.success }]}
                  onPress={handleAdministerPRN}
                >
                  <Text style={styles.adminButtonText}>Administer PRN</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
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
  summaryCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  summaryLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  complianceBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  complianceFill: {
    height: '100%',
    borderRadius: 4,
  },
  complianceText: {
    fontSize: 12,
    textAlign: 'center',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginBottom: 16,
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
  medCard: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
    marginBottom: 12,
  },
  medHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  medInfo: {
    flex: 1,
  },
  medName: {
    fontSize: 16,
    fontWeight: '600',
  },
  medDose: {
    fontSize: 14,
    marginTop: 4,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  prnBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  prnText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  medFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scheduledTime: {
    fontSize: 12,
  },
  tapHint: {
    fontSize: 12,
    fontWeight: '500',
  },
  instructions: {
    fontSize: 12,
    marginTop: 4,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 32,
  },
  historySection: {
    gap: 8,
  },
  historyItem: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  historyMed: {
    fontSize: 14,
    fontWeight: '600',
  },
  historyTime: {
    fontSize: 12,
  },
  historyDose: {
    fontSize: 12,
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
  medInfoCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  medInfoName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  medInfoDose: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  medInfoRoute: {
    fontSize: 14,
  },
  medInstructions: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  verificationCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  verificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  verificationList: {
    gap: 12,
  },
  verificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verificationIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    width: 32,
  },
  verificationLabel: {
    fontSize: 14,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  adminButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  adminButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 100,
  },
});
