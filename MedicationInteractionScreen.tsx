/**
 * Medication Interaction Checker Screen
 * Check drug interactions and view alerts
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import {
  medicationInteractionService,
  Drug,
  PrescriptionCheckResult,
  InteractionAlert,
  PatientMedicationProfile,
  DrugInteraction,
} from '../services/MedicationInteractionService';

export default function MedicationInteractionScreen() {
  const colors = useColors();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Drug[]>([]);
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);
  const [patientId, setPatientId] = useState('P-001');
  const [checkResult, setCheckResult] = useState<PrescriptionCheckResult | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<InteractionAlert[]>([]);
  const [showDrugPicker, setShowDrugPicker] = useState(false);
  const [showAlertDetail, setShowAlertDetail] = useState<InteractionAlert | null>(null);

  // Load active alerts
  const loadAlerts = useCallback(() => {
    setActiveAlerts(medicationInteractionService.getActiveAlerts());
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  // Subscribe to new alerts
  useEffect(() => {
    const unsubscribe = medicationInteractionService.subscribe((alert) => {
      loadAlerts();
    });
    return unsubscribe;
  }, [loadAlerts]);

  // Search drugs
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      setSearchResults(medicationInteractionService.searchDrugs(query));
    } else {
      setSearchResults([]);
    }
  };

  // Select drug
  const handleSelectDrug = (drug: Drug) => {
    setSelectedDrug(drug);
    setSearchQuery(drug.name);
    setSearchResults([]);
    setShowDrugPicker(false);
  };

  // Check prescription
  const handleCheckPrescription = async () => {
    if (!selectedDrug) {
      Alert.alert('Error', 'Please select a medication to check');
      return;
    }

    try {
      const result = await medicationInteractionService.checkPrescription(
        patientId,
        selectedDrug.id,
        'Current User'
      );
      setCheckResult(result);
      loadAlerts();
    } catch (error) {
      Alert.alert('Error', 'Failed to check prescription');
    }
  };

  // Acknowledge alert
  const handleAcknowledgeAlert = async (alert: InteractionAlert) => {
    try {
      await medicationInteractionService.acknowledgeAlert(
        alert.id,
        'Current User',
        'Reviewed and accepted risk'
      );
      loadAlerts();
      setShowAlertDetail(null);
      Alert.alert('Success', 'Alert acknowledged');
    } catch (error) {
      Alert.alert('Error', 'Failed to acknowledge alert');
    }
  };

  // Override alert
  const handleOverrideAlert = async (alert: InteractionAlert) => {
    Alert.prompt(
      'Override Alert',
      'Please provide clinical justification for override:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Override',
          onPress: async (reason: string | undefined) => {
            if (!reason) {
              Alert.alert('Error', 'Override reason is required');
              return;
            }
            try {
              await medicationInteractionService.overrideAlert(
                alert.id,
                'Current User',
                reason
              );
              loadAlerts();
              setShowAlertDetail(null);
              Alert.alert('Success', 'Alert overridden');
            } catch (error) {
              Alert.alert('Error', 'Failed to override alert');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  // Render interaction card
  const renderInteraction = (interaction: DrugInteraction, index: number) => (
    <View
      key={`interaction-${index}`}
      style={[
        styles.interactionCard,
        {
          backgroundColor: colors.surface,
          borderColor: medicationInteractionService.getSeverityColor(interaction.severity) + '50',
          borderLeftColor: medicationInteractionService.getSeverityColor(interaction.severity),
        },
      ]}
    >
      <View style={styles.interactionHeader}>
        <View
          style={[
            styles.severityBadge,
            { backgroundColor: medicationInteractionService.getSeverityColor(interaction.severity) },
          ]}
        >
          <Text style={styles.severityText}>
            {medicationInteractionService.getSeverityLabel(interaction.severity)}
          </Text>
        </View>
        <Text style={[styles.interactionType, { color: colors.muted }]}>
          {interaction.type.replace('_', ' ')}
        </Text>
      </View>

      <Text style={[styles.interactionDrugs, { color: colors.foreground }]}>
        {interaction.drug1Name} + {interaction.drug2Name}
      </Text>

      <Text style={[styles.interactionDescription, { color: colors.muted }]}>
        {interaction.description}
      </Text>

      <View style={[styles.managementBox, { backgroundColor: colors.primary + '10' }]}>
        <Text style={[styles.managementLabel, { color: colors.primary }]}>Management</Text>
        <Text style={[styles.managementText, { color: colors.foreground }]}>
          {interaction.management}
        </Text>
      </View>
    </View>
  );

  // Render alert item
  const renderAlertItem = ({ item }: { item: InteractionAlert }) => (
    <TouchableOpacity
      style={[
        styles.alertItem,
        {
          backgroundColor: colors.surface,
          borderColor: medicationInteractionService.getSeverityColor(item.severity) + '50',
        },
      ]}
      onPress={() => setShowAlertDetail(item)}
    >
      <View
        style={[
          styles.alertSeverity,
          { backgroundColor: medicationInteractionService.getSeverityColor(item.severity) },
        ]}
      />
      <View style={styles.alertContent}>
        <Text style={[styles.alertTitle, { color: colors.foreground }]}>
          {item.interaction.drug1Name} + {item.interaction.drug2Name}
        </Text>
        <Text style={[styles.alertSubtitle, { color: colors.muted }]}>
          {medicationInteractionService.getSeverityLabel(item.severity)} Interaction
        </Text>
      </View>
      <Text style={[styles.alertChevron, { color: colors.muted }]}>›</Text>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Medication Checker
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Check drug interactions before prescribing
          </Text>
        </View>

        {/* Active Alerts */}
        {activeAlerts.length > 0 && (
          <View style={styles.alertsSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.error }]}>
                ⚠️ Active Alerts ({activeAlerts.length})
              </Text>
            </View>
            <FlatList
              data={activeAlerts.slice(0, 3)}
              keyExtractor={(item) => item.id}
              renderItem={renderAlertItem}
              scrollEnabled={false}
            />
          </View>
        )}

        {/* Prescription Check */}
        <View style={[styles.checkCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.checkTitle, { color: colors.foreground }]}>
            Check New Prescription
          </Text>

          {/* Patient ID */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.muted }]}>Patient ID</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
              value={patientId}
              onChangeText={setPatientId}
              placeholder="Enter patient ID"
              placeholderTextColor={colors.muted}
            />
          </View>

          {/* Drug Selection */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.muted }]}>Medication</Text>
            <TouchableOpacity
              style={[styles.drugSelector, { borderColor: colors.border, backgroundColor: colors.background }]}
              onPress={() => setShowDrugPicker(true)}
            >
              <Text style={[styles.drugSelectorText, { color: selectedDrug ? colors.foreground : colors.muted }]}>
                {selectedDrug ? selectedDrug.name : 'Select medication...'}
              </Text>
              <Text style={[styles.chevron, { color: colors.muted }]}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Selected Drug Info */}
          {selectedDrug && (
            <View style={[styles.drugInfo, { backgroundColor: colors.primary + '10' }]}>
              <Text style={[styles.drugName, { color: colors.foreground }]}>{selectedDrug.name}</Text>
              <Text style={[styles.drugGeneric, { color: colors.muted }]}>{selectedDrug.genericName}</Text>
              <Text style={[styles.drugClass, { color: colors.primary }]}>{selectedDrug.drugClass}</Text>
            </View>
          )}

          {/* Check Button */}
          <TouchableOpacity
            style={[styles.checkButton, { backgroundColor: colors.primary }]}
            onPress={handleCheckPrescription}
          >
            <Text style={styles.checkButtonText}>Check Interactions</Text>
          </TouchableOpacity>
        </View>

        {/* Check Result */}
        {checkResult && (
          <View style={styles.resultSection}>
            {/* Overall Risk */}
            <View
              style={[
                styles.riskCard,
                {
                  backgroundColor: medicationInteractionService.getRiskColor(checkResult.overallRisk) + '15',
                  borderColor: medicationInteractionService.getRiskColor(checkResult.overallRisk),
                },
              ]}
            >
              <Text style={[styles.riskTitle, { color: medicationInteractionService.getRiskColor(checkResult.overallRisk) }]}>
                {checkResult.overallRisk.toUpperCase()} RISK
              </Text>
              <Text style={[styles.riskDrug, { color: colors.foreground }]}>
                {checkResult.drugName}
              </Text>
              <Text style={[styles.riskStatus, { color: checkResult.isAllowed ? colors.success : colors.error }]}>
                {checkResult.isAllowed ? '✓ May proceed with caution' : '✗ Not recommended'}
              </Text>
            </View>

            {/* Allergy Alerts */}
            {checkResult.allergyAlerts.length > 0 && (
              <View style={styles.alertSection}>
                <Text style={[styles.alertSectionTitle, { color: colors.error }]}>
                  🚨 Allergy Alerts
                </Text>
                {checkResult.allergyAlerts.map((alert, index) => (
                  <View key={`allergy-${index}`} style={[styles.allergyCard, { backgroundColor: colors.error + '15', borderColor: colors.error }]}>
                    <Text style={[styles.allergyTitle, { color: colors.error }]}>
                      Allergy to {alert.allergen}
                    </Text>
                    <Text style={[styles.allergyText, { color: colors.foreground }]}>
                      {alert.recommendation}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Drug Interactions */}
            {checkResult.interactions.length > 0 && (
              <View style={styles.interactionsSection}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  Drug Interactions ({checkResult.interactions.length})
                </Text>
                {checkResult.interactions.map(renderInteraction)}
              </View>
            )}

            {/* Duplicate Therapy */}
            {checkResult.duplicateTherapyAlerts.length > 0 && (
              <View style={styles.duplicateSection}>
                <Text style={[styles.sectionTitle, { color: colors.warning }]}>
                  Duplicate Therapy Alerts
                </Text>
                {checkResult.duplicateTherapyAlerts.map((alert, index) => (
                  <View key={`duplicate-${index}`} style={[styles.duplicateCard, { backgroundColor: colors.warning + '15', borderColor: colors.warning }]}>
                    <Text style={[styles.duplicateText, { color: colors.foreground }]}>
                      {alert.newDrug} duplicates {alert.existingDrug} ({alert.therapeuticClass})
                    </Text>
                    <Text style={[styles.duplicateRec, { color: colors.muted }]}>
                      {alert.recommendation}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Recommendations */}
            {checkResult.recommendations.length > 0 && (
              <View style={[styles.recommendationsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.recommendationsTitle, { color: colors.foreground }]}>
                  Clinical Recommendations
                </Text>
                {checkResult.recommendations.map((rec, index) => (
                  <View key={`rec-${index}`} style={styles.recommendationItem}>
                    <Text style={[styles.recommendationBullet, { color: colors.primary }]}>•</Text>
                    <Text style={[styles.recommendationText, { color: colors.muted }]}>{rec}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* No Issues */}
            {checkResult.interactions.length === 0 &&
              checkResult.allergyAlerts.length === 0 &&
              checkResult.duplicateTherapyAlerts.length === 0 && (
                <View style={[styles.noIssuesCard, { backgroundColor: colors.success + '15', borderColor: colors.success }]}>
                  <Text style={styles.noIssuesIcon}>✓</Text>
                  <Text style={[styles.noIssuesText, { color: colors.success }]}>
                    No significant interactions detected
                  </Text>
                </View>
              )}
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Drug Picker Modal */}
      <Modal
        visible={showDrugPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDrugPicker(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Select Medication
            </Text>
            <TouchableOpacity onPress={() => setShowDrugPicker(false)}>
              <Text style={[styles.closeButton, { color: colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              style={[styles.searchInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]}
              value={searchQuery}
              onChangeText={handleSearch}
              placeholder="Search medications..."
              placeholderTextColor={colors.muted}
              autoFocus
            />
          </View>

          <FlatList
            data={searchResults.length > 0 ? searchResults : medicationInteractionService.getAllDrugs()}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.drugOption, { borderBottomColor: colors.border }]}
                onPress={() => handleSelectDrug(item)}
              >
                <View style={styles.drugOptionInfo}>
                  <Text style={[styles.drugOptionName, { color: colors.foreground }]}>{item.name}</Text>
                  <Text style={[styles.drugOptionGeneric, { color: colors.muted }]}>{item.genericName}</Text>
                </View>
                <Text style={[styles.drugOptionClass, { color: colors.primary }]}>{item.drugClass}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      {/* Alert Detail Modal */}
      <Modal
        visible={!!showAlertDetail}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAlertDetail(null)}
      >
        {showAlertDetail && (
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                Interaction Alert
              </Text>
              <TouchableOpacity onPress={() => setShowAlertDetail(null)}>
                <Text style={[styles.closeButton, { color: colors.primary }]}>Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.alertDetailContent}>
              {renderInteraction(showAlertDetail.interaction, 0)}

              <View style={styles.alertActions}>
                <TouchableOpacity
                  style={[styles.acknowledgeButton, { backgroundColor: colors.success }]}
                  onPress={() => handleAcknowledgeAlert(showAlertDetail)}
                >
                  <Text style={styles.actionButtonText}>Acknowledge</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.overrideButton, { backgroundColor: colors.warning }]}
                  onPress={() => handleOverrideAlert(showAlertDetail)}
                >
                  <Text style={styles.actionButtonText}>Override with Reason</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        )}
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
  alertsSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    overflow: 'hidden',
  },
  alertSeverity: {
    width: 4,
    height: '100%',
  },
  alertContent: {
    flex: 1,
    padding: 12,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  alertSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  alertChevron: {
    fontSize: 24,
    paddingRight: 12,
  },
  checkCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  checkTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  drugSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  drugSelectorText: {
    fontSize: 16,
  },
  chevron: {
    fontSize: 20,
  },
  drugInfo: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  drugName: {
    fontSize: 16,
    fontWeight: '600',
  },
  drugGeneric: {
    fontSize: 14,
    marginTop: 2,
  },
  drugClass: {
    fontSize: 12,
    marginTop: 4,
  },
  checkButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultSection: {
    marginBottom: 20,
  },
  riskCard: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  riskTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  riskDrug: {
    fontSize: 16,
    marginTop: 8,
  },
  riskStatus: {
    fontSize: 14,
    marginTop: 8,
    fontWeight: '500',
  },
  alertSection: {
    marginBottom: 16,
  },
  alertSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  allergyCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  allergyTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  allergyText: {
    fontSize: 14,
  },
  interactionsSection: {
    marginBottom: 16,
  },
  interactionCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
    padding: 16,
    marginTop: 12,
  },
  interactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  severityBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginRight: 8,
  },
  severityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  interactionType: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  interactionDrugs: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  interactionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  managementBox: {
    borderRadius: 8,
    padding: 12,
  },
  managementLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  managementText: {
    fontSize: 14,
    lineHeight: 20,
  },
  duplicateSection: {
    marginBottom: 16,
  },
  duplicateCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    marginTop: 8,
  },
  duplicateText: {
    fontSize: 14,
    fontWeight: '500',
  },
  duplicateRec: {
    fontSize: 13,
    marginTop: 4,
  },
  recommendationsCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  recommendationItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  recommendationBullet: {
    fontSize: 16,
    marginRight: 8,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  noIssuesCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  noIssuesIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  noIssuesText: {
    fontSize: 16,
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
  searchContainer: {
    padding: 16,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  drugOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  drugOptionInfo: {
    flex: 1,
  },
  drugOptionName: {
    fontSize: 16,
    fontWeight: '500',
  },
  drugOptionGeneric: {
    fontSize: 14,
    marginTop: 2,
  },
  drugOptionClass: {
    fontSize: 12,
  },
  alertDetailContent: {
    padding: 16,
  },
  alertActions: {
    marginTop: 20,
    gap: 12,
  },
  acknowledgeButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  overrideButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 100,
  },
});
