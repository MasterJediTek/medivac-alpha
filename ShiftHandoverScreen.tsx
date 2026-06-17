/**
 * Shift Handover Screen
 * Guided handover workflow with checklist and acknowledgment
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
  shiftHandoverService,
  ShiftHandover,
  HandoverTemplate,
  HandoverChecklistItem,
  PatientHandoverInfo,
  StaffInfo,
} from '../services/ShiftHandoverService';

export default function ShiftHandoverScreen() {
  const colors = useColors();
  const [handovers, setHandovers] = useState<ShiftHandover[]>([]);
  const [activeHandover, setActiveHandover] = useState<ShiftHandover | null>(null);
  const [showNewHandover, setShowNewHandover] = useState(false);
  const [showPatientAdd, setShowPatientAdd] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<HandoverTemplate | null>(null);
  const [shiftType, setShiftType] = useState<'day' | 'evening' | 'night'>('day');

  // New patient form state
  const [newPatient, setNewPatient] = useState<Partial<PatientHandoverInfo>>({
    priority: 'medium',
    keyUpdates: [],
    pendingTasks: [],
    medications: [],
    alerts: [],
  });

  // Load handovers
  const loadHandovers = useCallback(() => {
    setHandovers(shiftHandoverService.getAllHandovers());
  }, []);

  useEffect(() => {
    loadHandovers();
  }, [loadHandovers]);

  // Subscribe to updates
  useEffect(() => {
    const unsubscribe = shiftHandoverService.subscribe((handover) => {
      loadHandovers();
      if (activeHandover?.id === handover.id) {
        setActiveHandover(handover);
      }
    });
    return unsubscribe;
  }, [loadHandovers, activeHandover]);

  // Create new handover
  const handleCreateHandover = async () => {
    if (!selectedTemplate) {
      Alert.alert('Error', 'Please select a template');
      return;
    }

    try {
      const outgoingStaff: StaffInfo = {
        id: 'STAFF-001',
        name: 'Current User',
        role: 'Nurse',
        department: selectedTemplate.department,
      };

      const handover = await shiftHandoverService.createHandover(
        selectedTemplate.id,
        shiftType,
        selectedTemplate.department,
        outgoingStaff
      );

      setActiveHandover(handover);
      setShowNewHandover(false);
      loadHandovers();
    } catch (error) {
      Alert.alert('Error', 'Failed to create handover');
    }
  };

  // Update checklist item
  const handleChecklistItem = async (item: HandoverChecklistItem, status: 'completed' | 'skipped' | 'na') => {
    if (!activeHandover) return;

    try {
      await shiftHandoverService.updateChecklistItem(
        activeHandover.id,
        item.id,
        status,
        'Current User'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update checklist item');
    }
  };

  // Add patient
  const handleAddPatient = async () => {
    if (!activeHandover || !newPatient.patientId || !newPatient.patientName) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }

    try {
      await shiftHandoverService.addPatient(activeHandover.id, {
        patientId: newPatient.patientId || '',
        patientName: newPatient.patientName || '',
        roomNumber: newPatient.roomNumber || '',
        diagnosis: newPatient.diagnosis || '',
        priority: newPatient.priority || 'medium',
        keyUpdates: newPatient.keyUpdates || [],
        pendingTasks: [],
        medications: [],
        vitalsStatus: newPatient.vitalsStatus || 'Stable',
        alerts: newPatient.alerts || [],
        specialInstructions: newPatient.specialInstructions || '',
      });

      setShowPatientAdd(false);
      setNewPatient({ priority: 'medium', keyUpdates: [], pendingTasks: [], medications: [], alerts: [] });
    } catch (error) {
      Alert.alert('Error', 'Failed to add patient');
    }
  };

  // Start handover
  const handleStartHandover = async () => {
    if (!activeHandover) return;

    Alert.prompt(
      'Start Handover',
      'Enter incoming staff name:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: async (name: string | undefined) => {
            if (!name) return;
            try {
              await shiftHandoverService.startHandover(activeHandover.id, {
                id: 'STAFF-002',
                name,
                role: 'Nurse',
                department: activeHandover.department,
              });
            } catch (error) {
              Alert.alert('Error', 'Failed to start handover');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  // Submit for acknowledgment
  const handleSubmitForAcknowledgment = async () => {
    if (!activeHandover) return;

    try {
      await shiftHandoverService.submitForAcknowledgment(activeHandover.id);
      Alert.alert('Success', 'Handover submitted for acknowledgment');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit handover');
    }
  };

  // Acknowledge handover
  const handleAcknowledge = async () => {
    if (!activeHandover) return;

    Alert.prompt(
      'Acknowledge Handover',
      'Add any comments (optional):',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Acknowledge',
          onPress: async (comments: string | undefined) => {
            try {
              await shiftHandoverService.acknowledgeHandover(
                activeHandover.id,
                activeHandover.incomingStaff.name,
                comments
              );
              Alert.alert('Success', 'Handover acknowledged and completed');
              setActiveHandover(null);
            } catch (error) {
              Alert.alert('Error', 'Failed to acknowledge handover');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  // Render checklist item
  const renderChecklistItem = (item: HandoverChecklistItem) => (
    <View
      key={item.id}
      style={[
        styles.checklistItem,
        { backgroundColor: colors.surface, borderColor: colors.border },
        item.status === 'completed' && { borderLeftColor: colors.success, borderLeftWidth: 3 },
        item.status === 'skipped' && { borderLeftColor: colors.warning, borderLeftWidth: 3 },
      ]}
    >
      <View style={styles.checklistContent}>
        <View style={styles.checklistHeader}>
          <Text style={[styles.checklistCategory, { color: colors.primary }]}>{item.category}</Text>
          {item.required && (
            <View style={[styles.requiredBadge, { backgroundColor: colors.error + '20' }]}>
              <Text style={[styles.requiredText, { color: colors.error }]}>Required</Text>
            </View>
          )}
        </View>
        <Text style={[styles.checklistTitle, { color: colors.foreground }]}>{item.title}</Text>
        <Text style={[styles.checklistDescription, { color: colors.muted }]}>{item.description}</Text>
        
        {item.status === 'pending' ? (
          <View style={styles.checklistActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.success }]}
              onPress={() => handleChecklistItem(item, 'completed')}
            >
              <Text style={styles.actionButtonText}>Complete</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.warning }]}
              onPress={() => handleChecklistItem(item, 'skipped')}
            >
              <Text style={styles.actionButtonText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.muted }]}
              onPress={() => handleChecklistItem(item, 'na')}
            >
              <Text style={styles.actionButtonText}>N/A</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.checklistStatus}>
            <Text style={[styles.statusText, { color: item.status === 'completed' ? colors.success : colors.warning }]}>
              {item.status === 'completed' ? '✓ Completed' : item.status === 'skipped' ? '⏭ Skipped' : '— N/A'}
            </Text>
            {item.completedBy && (
              <Text style={[styles.completedBy, { color: colors.muted }]}>
                by {item.completedBy}
              </Text>
            )}
          </View>
        )}
      </View>
    </View>
  );

  // Render patient card
  const renderPatientCard = (patient: PatientHandoverInfo) => (
    <View
      key={patient.patientId}
      style={[
        styles.patientCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
        { borderLeftColor: shiftHandoverService.getPriorityColor(patient.priority), borderLeftWidth: 4 },
      ]}
    >
      <View style={styles.patientHeader}>
        <View>
          <Text style={[styles.patientName, { color: colors.foreground }]}>{patient.patientName}</Text>
          <Text style={[styles.patientRoom, { color: colors.muted }]}>Room {patient.roomNumber}</Text>
        </View>
        <View style={[styles.priorityBadge, { backgroundColor: shiftHandoverService.getPriorityColor(patient.priority) }]}>
          <Text style={styles.priorityText}>{patient.priority.toUpperCase()}</Text>
        </View>
      </View>
      
      <Text style={[styles.patientDiagnosis, { color: colors.foreground }]}>{patient.diagnosis}</Text>
      <Text style={[styles.patientVitals, { color: colors.muted }]}>Vitals: {patient.vitalsStatus}</Text>

      {patient.alerts.length > 0 && (
        <View style={[styles.alertsBox, { backgroundColor: colors.error + '15' }]}>
          {patient.alerts.map((alert, index) => (
            <Text key={index} style={[styles.alertText, { color: colors.error }]}>⚠️ {alert}</Text>
          ))}
        </View>
      )}

      {patient.specialInstructions && (
        <View style={[styles.instructionsBox, { backgroundColor: colors.primary + '15' }]}>
          <Text style={[styles.instructionsText, { color: colors.foreground }]}>
            📋 {patient.specialInstructions}
          </Text>
        </View>
      )}
    </View>
  );

  // Render handover list item
  const renderHandoverItem = ({ item }: { item: ShiftHandover }) => (
    <TouchableOpacity
      style={[styles.handoverItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => setActiveHandover(item)}
    >
      <View style={[styles.handoverStatus, { backgroundColor: shiftHandoverService.getStatusColor(item.status) }]} />
      <View style={styles.handoverContent}>
        <Text style={[styles.handoverTitle, { color: colors.foreground }]}>
          {item.department} - {item.shiftType.charAt(0).toUpperCase() + item.shiftType.slice(1)} Shift
        </Text>
        <Text style={[styles.handoverMeta, { color: colors.muted }]}>
          {shiftHandoverService.getStatusLabel(item.status)} • {item.patients.length} patients
        </Text>
        <Text style={[styles.handoverDate, { color: colors.muted }]}>
          {shiftHandoverService.formatDate(item.createdAt)}
        </Text>
      </View>
      <View style={styles.handoverProgress}>
        <Text style={[styles.progressText, { color: colors.primary }]}>
          {shiftHandoverService.getCompletionPercentage(item)}%
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer>
      {!activeHandover ? (
        <ScrollView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              Shift Handover
            </Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Manage shift transitions safely
            </Text>
          </View>

          {/* New Handover Button */}
          <TouchableOpacity
            style={[styles.newButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowNewHandover(true)}
          >
            <Text style={styles.newButtonText}>+ Start New Handover</Text>
          </TouchableOpacity>

          {/* Pending Handovers */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Active Handovers
            </Text>
            {handovers.filter(h => h.status !== 'completed').length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={[styles.emptyText, { color: colors.muted }]}>No active handovers</Text>
              </View>
            ) : (
              <FlatList
                data={handovers.filter(h => h.status !== 'completed')}
                keyExtractor={(item) => item.id}
                renderItem={renderHandoverItem}
                scrollEnabled={false}
              />
            )}
          </View>

          {/* Completed Handovers */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Recent Completed
            </Text>
            <FlatList
              data={handovers.filter(h => h.status === 'completed').slice(0, 5)}
              keyExtractor={(item) => item.id}
              renderItem={renderHandoverItem}
              scrollEnabled={false}
              ListEmptyComponent={
                <Text style={[styles.emptyText, { color: colors.muted }]}>No completed handovers</Text>
              }
            />
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      ) : (
        <ScrollView style={styles.container}>
          {/* Active Handover Header */}
          <View style={styles.activeHeader}>
            <TouchableOpacity onPress={() => setActiveHandover(null)}>
              <Text style={[styles.backButton, { color: colors.primary }]}>← Back</Text>
            </TouchableOpacity>
            <View style={[styles.statusBadge, { backgroundColor: shiftHandoverService.getStatusColor(activeHandover.status) }]}>
              <Text style={styles.statusBadgeText}>
                {shiftHandoverService.getStatusLabel(activeHandover.status)}
              </Text>
            </View>
          </View>

          <Text style={[styles.activeTitle, { color: colors.foreground }]}>
            {activeHandover.department} - {activeHandover.shiftType.charAt(0).toUpperCase() + activeHandover.shiftType.slice(1)} Shift
          </Text>

          {/* Staff Info */}
          <View style={[styles.staffCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.staffRow}>
              <Text style={[styles.staffLabel, { color: colors.muted }]}>Outgoing:</Text>
              <Text style={[styles.staffName, { color: colors.foreground }]}>{activeHandover.outgoingStaff.name}</Text>
            </View>
            <View style={styles.staffRow}>
              <Text style={[styles.staffLabel, { color: colors.muted }]}>Incoming:</Text>
              <Text style={[styles.staffName, { color: colors.foreground }]}>
                {activeHandover.incomingStaff.name || 'Not assigned'}
              </Text>
            </View>
          </View>

          {/* Progress */}
          <View style={[styles.progressCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.progressLabel, { color: colors.foreground }]}>Checklist Progress</Text>
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressFill,
                  { backgroundColor: colors.primary, width: `${shiftHandoverService.getCompletionPercentage(activeHandover)}%` },
                ]}
              />
            </View>
            <Text style={[styles.progressPercent, { color: colors.primary }]}>
              {shiftHandoverService.getCompletionPercentage(activeHandover)}% Complete
            </Text>
          </View>

          {/* Patients */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Patients ({activeHandover.patients.length})
              </Text>
              <TouchableOpacity onPress={() => setShowPatientAdd(true)}>
                <Text style={[styles.addLink, { color: colors.primary }]}>+ Add</Text>
              </TouchableOpacity>
            </View>
            {activeHandover.patients.map(renderPatientCard)}
          </View>

          {/* Checklist */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Handover Checklist
            </Text>
            {activeHandover.checklist.map(renderChecklistItem)}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {activeHandover.status === 'draft' && (
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                onPress={handleStartHandover}
              >
                <Text style={styles.primaryButtonText}>Start Handover Session</Text>
              </TouchableOpacity>
            )}

            {activeHandover.status === 'in_progress' && (
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: colors.success }]}
                onPress={handleSubmitForAcknowledgment}
              >
                <Text style={styles.primaryButtonText}>Submit for Acknowledgment</Text>
              </TouchableOpacity>
            )}

            {activeHandover.status === 'awaiting_acknowledgment' && (
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: colors.success }]}
                onPress={handleAcknowledge}
              >
                <Text style={styles.primaryButtonText}>Acknowledge & Complete</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      )}

      {/* New Handover Modal */}
      <Modal
        visible={showNewHandover}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNewHandover(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Handover</Text>
            <TouchableOpacity onPress={() => setShowNewHandover(false)}>
              <Text style={[styles.closeButton, { color: colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Template Selection */}
            <Text style={[styles.formLabel, { color: colors.foreground }]}>Select Template</Text>
            {shiftHandoverService.getTemplates().map((template) => (
              <TouchableOpacity
                key={template.id}
                style={[
                  styles.templateOption,
                  { borderColor: colors.border },
                  selectedTemplate?.id === template.id && { borderColor: colors.primary, backgroundColor: colors.primary + '15' },
                ]}
                onPress={() => setSelectedTemplate(template)}
              >
                <Text style={[styles.templateName, { color: colors.foreground }]}>{template.name}</Text>
                <Text style={[styles.templateDept, { color: colors.muted }]}>{template.department}</Text>
              </TouchableOpacity>
            ))}

            {/* Shift Type */}
            <Text style={[styles.formLabel, { color: colors.foreground, marginTop: 20 }]}>Shift Type</Text>
            <View style={styles.shiftOptions}>
              {(['day', 'evening', 'night'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.shiftOption,
                    { borderColor: colors.border },
                    shiftType === type && { borderColor: colors.primary, backgroundColor: colors.primary + '15' },
                  ]}
                  onPress={() => setShiftType(type)}
                >
                  <Text style={[styles.shiftText, { color: shiftType === type ? colors.primary : colors.foreground }]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: colors.primary }]}
              onPress={handleCreateHandover}
            >
              <Text style={styles.createButtonText}>Create Handover</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Add Patient Modal */}
      <Modal
        visible={showPatientAdd}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPatientAdd(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Add Patient</Text>
            <TouchableOpacity onPress={() => setShowPatientAdd(false)}>
              <Text style={[styles.closeButton, { color: colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.foreground }]}>Patient ID *</Text>
              <TextInput
                style={[styles.formInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]}
                value={newPatient.patientId}
                onChangeText={(text) => setNewPatient({ ...newPatient, patientId: text })}
                placeholder="Enter patient ID"
                placeholderTextColor={colors.muted}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.foreground }]}>Patient Name *</Text>
              <TextInput
                style={[styles.formInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]}
                value={newPatient.patientName}
                onChangeText={(text) => setNewPatient({ ...newPatient, patientName: text })}
                placeholder="Enter patient name"
                placeholderTextColor={colors.muted}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.foreground }]}>Room Number</Text>
              <TextInput
                style={[styles.formInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]}
                value={newPatient.roomNumber}
                onChangeText={(text) => setNewPatient({ ...newPatient, roomNumber: text })}
                placeholder="Enter room number"
                placeholderTextColor={colors.muted}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.foreground }]}>Diagnosis</Text>
              <TextInput
                style={[styles.formInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]}
                value={newPatient.diagnosis}
                onChangeText={(text) => setNewPatient({ ...newPatient, diagnosis: text })}
                placeholder="Enter diagnosis"
                placeholderTextColor={colors.muted}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.foreground }]}>Special Instructions</Text>
              <TextInput
                style={[styles.formTextarea, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]}
                value={newPatient.specialInstructions}
                onChangeText={(text) => setNewPatient({ ...newPatient, specialInstructions: text })}
                placeholder="Enter special instructions"
                placeholderTextColor={colors.muted}
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: colors.primary }]}
              onPress={handleAddPatient}
            >
              <Text style={styles.createButtonText}>Add Patient</Text>
            </TouchableOpacity>
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
  newButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  newButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  addLink: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
  },
  handoverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  handoverStatus: {
    width: 4,
    height: '100%',
  },
  handoverContent: {
    flex: 1,
    padding: 16,
  },
  handoverTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  handoverMeta: {
    fontSize: 13,
    marginTop: 4,
  },
  handoverDate: {
    fontSize: 12,
    marginTop: 2,
  },
  handoverProgress: {
    paddingRight: 16,
  },
  progressText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  activeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    fontSize: 16,
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  activeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  staffCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  staffRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  staffLabel: {
    width: 80,
    fontSize: 14,
  },
  staffName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  progressCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
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
  patientName: {
    fontSize: 16,
    fontWeight: '600',
  },
  patientRoom: {
    fontSize: 13,
    marginTop: 2,
  },
  priorityBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  priorityText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  patientDiagnosis: {
    fontSize: 14,
    marginBottom: 4,
  },
  patientVitals: {
    fontSize: 13,
    marginBottom: 8,
  },
  alertsBox: {
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },
  alertText: {
    fontSize: 13,
    marginBottom: 4,
  },
  instructionsBox: {
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },
  instructionsText: {
    fontSize: 13,
  },
  checklistItem: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  checklistContent: {
    padding: 16,
  },
  checklistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checklistCategory: {
    fontSize: 12,
    fontWeight: '600',
  },
  requiredBadge: {
    marginLeft: 8,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  requiredText: {
    fontSize: 10,
    fontWeight: '600',
  },
  checklistTitle: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  checklistDescription: {
    fontSize: 13,
    marginBottom: 12,
  },
  checklistActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  checklistStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  completedBy: {
    fontSize: 12,
    marginLeft: 8,
  },
  actionButtons: {
    marginTop: 20,
    marginBottom: 32,
  },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  templateOption: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '500',
  },
  templateDept: {
    fontSize: 13,
    marginTop: 4,
  },
  shiftOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  shiftOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  shiftText: {
    fontSize: 14,
    fontWeight: '500',
  },
  createButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: 16,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  formTextarea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  bottomPadding: {
    height: 100,
  },
});
