/**
 * Emergency Alert Broadcasting Screen
 * Initiate, manage, and respond to emergency alerts
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
  Vibration,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import {
  emergencyAlertService,
  EmergencyAlert,
  AlertTemplate,
  EmergencyCode,
  Location,
  StaffRole,
} from '../services/EmergencyAlertService';

export default function EmergencyAlertScreen() {
  const colors = useColors();
  const [activeAlerts, setActiveAlerts] = useState<EmergencyAlert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<EmergencyAlert | null>(null);
  const [showNewAlert, setShowNewAlert] = useState(false);
  const [showCodePicker, setShowCodePicker] = useState(false);
  const [selectedCode, setSelectedCode] = useState<EmergencyCode | null>(null);
  const [location, setLocation] = useState<Location>({
    building: 'Main Building',
    floor: '1',
    unit: 'General',
    room: '',
  });
  const [customDescription, setCustomDescription] = useState('');

  // Load alerts
  const loadAlerts = useCallback(() => {
    setActiveAlerts(emergencyAlertService.getActiveAlerts());
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  // Subscribe to updates
  useEffect(() => {
    const unsubscribe = emergencyAlertService.subscribe((alert) => {
      loadAlerts();
      if (selectedAlert?.id === alert.id) {
        setSelectedAlert(alert);
      }
      // Vibrate on new emergency alert
      if (alert.status === 'active' && alert.severity === 'emergency') {
        Vibration.vibrate([0, 500, 200, 500]);
      }
    });
    return unsubscribe;
  }, [loadAlerts, selectedAlert]);

  // Initiate alert
  const handleInitiateAlert = async () => {
    if (!selectedCode) {
      Alert.alert('Error', 'Please select an emergency code');
      return;
    }

    Alert.alert(
      'Confirm Emergency Alert',
      `Are you sure you want to initiate a ${emergencyAlertService.getTemplate(selectedCode)?.title}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Initiate Alert',
          style: 'destructive',
          onPress: async () => {
            try {
              const alert = await emergencyAlertService.initiateAlert(
                selectedCode,
                location,
                'Current User',
                undefined,
                customDescription || undefined
              );
              setShowNewAlert(false);
              setSelectedCode(null);
              setCustomDescription('');
              setSelectedAlert(alert);
              loadAlerts();
            } catch (error) {
              Alert.alert('Error', 'Failed to initiate alert');
            }
          },
        },
      ]
    );
  };

  // Acknowledge alert
  const handleAcknowledge = async (alert: EmergencyAlert) => {
    Alert.prompt(
      'Acknowledge Alert',
      'Enter your estimated arrival time (minutes):',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Acknowledge',
          onPress: async (eta: string | undefined) => {
            try {
              await emergencyAlertService.acknowledgeAlert(
                alert.id,
                'STAFF-001',
                'Current User',
                'nurse',
                eta ? parseInt(eta) : undefined
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to acknowledge alert');
            }
          },
        },
      ],
      'plain-text',
      '',
      'number-pad'
    );
  };

  // Add response
  const handleAddResponse = async (alert: EmergencyAlert) => {
    Alert.prompt(
      'Add Response',
      'Describe your action:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async (action: string | undefined) => {
            if (!action) return;
            try {
              await emergencyAlertService.addResponse(
                alert.id,
                'STAFF-001',
                'Current User',
                'nurse',
                action
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to add response');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  // Resolve alert
  const handleResolve = async (alert: EmergencyAlert) => {
    Alert.prompt(
      'Resolve Alert',
      'Enter resolution notes:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resolve',
          onPress: async (notes: string | undefined) => {
            if (!notes) {
              Alert.alert('Error', 'Resolution notes are required');
              return;
            }
            try {
              await emergencyAlertService.resolveAlert(alert.id, 'Current User', notes);
              setSelectedAlert(null);
            } catch (error) {
              Alert.alert('Error', 'Failed to resolve alert');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  // Cancel alert
  const handleCancel = async (alert: EmergencyAlert) => {
    Alert.prompt(
      'Cancel Alert',
      'Enter reason for cancellation:',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Cancel Alert',
          style: 'destructive',
          onPress: async (reason: string | undefined) => {
            if (!reason) {
              Alert.alert('Error', 'Cancellation reason is required');
              return;
            }
            try {
              await emergencyAlertService.cancelAlert(alert.id, 'Current User', reason);
              setSelectedAlert(null);
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel alert');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  // Render code option
  const renderCodeOption = (template: AlertTemplate) => (
    <TouchableOpacity
      key={template.code}
      style={[
        styles.codeOption,
        { borderColor: template.color },
        selectedCode === template.code && { backgroundColor: template.color + '20' },
      ]}
      onPress={() => {
        setSelectedCode(template.code);
        setShowCodePicker(false);
      }}
    >
      <Text style={styles.codeIcon}>{template.icon}</Text>
      <View style={styles.codeInfo}>
        <Text style={[styles.codeName, { color: colors.foreground }]}>{template.title}</Text>
        <Text style={[styles.codeDescription, { color: colors.muted }]} numberOfLines={1}>
          {template.description}
        </Text>
      </View>
      <View style={[styles.severityIndicator, { backgroundColor: emergencyAlertService.getSeverityColor(template.severity) }]}>
        <Text style={styles.severityText}>{template.severity.toUpperCase()}</Text>
      </View>
    </TouchableOpacity>
  );

  // Render active alert card
  const renderAlertCard = ({ item }: { item: EmergencyAlert }) => {
    const template = emergencyAlertService.getTemplate(item.code);
    
    return (
      <TouchableOpacity
        style={[
          styles.alertCard,
          { backgroundColor: colors.surface, borderColor: template?.color || colors.error },
          item.severity === 'emergency' && styles.emergencyCard,
        ]}
        onPress={() => setSelectedAlert(item)}
      >
        <View style={[styles.alertHeader, { borderBottomColor: colors.border }]}>
          <View style={styles.alertTitleRow}>
            <Text style={styles.alertIcon}>{template?.icon}</Text>
            <Text style={[styles.alertTitle, { color: colors.foreground }]}>{item.title}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: emergencyAlertService.getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status.replace('_', ' ').toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.alertBody}>
          <View style={styles.locationRow}>
            <Text style={[styles.locationLabel, { color: colors.muted }]}>📍</Text>
            <Text style={[styles.locationText, { color: colors.foreground }]}>
              {item.location.building} • Floor {item.location.floor} • {item.location.unit}
              {item.location.room && ` • Room ${item.location.room}`}
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{item.acknowledgments.length}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Acknowledged</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{item.responses.length}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Responses</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.muted }]}>
                {emergencyAlertService.formatTimeElapsed(item.initiatedAt)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Elapsed</Text>
            </View>
          </View>
        </View>

        <View style={styles.alertActions}>
          {!item.acknowledgments.some(a => a.staffId === 'STAFF-001') && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.success }]}
              onPress={() => handleAcknowledge(item)}
            >
              <Text style={styles.actionBtnText}>Acknowledge</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary }]}
            onPress={() => handleAddResponse(item)}
          >
            <Text style={styles.actionBtnText}>Add Response</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer>
      {!selectedAlert ? (
        <ScrollView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              Emergency Alerts
            </Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Facility-wide emergency broadcasting
            </Text>
          </View>

          {/* Emergency Button */}
          <TouchableOpacity
            style={[styles.emergencyButton, { backgroundColor: colors.error }]}
            onPress={() => setShowNewAlert(true)}
          >
            <Text style={styles.emergencyButtonIcon}>🚨</Text>
            <Text style={styles.emergencyButtonText}>Initiate Emergency Alert</Text>
          </TouchableOpacity>

          {/* Active Alerts */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Active Alerts ({activeAlerts.length})
            </Text>
            {activeAlerts.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: colors.success + '15', borderColor: colors.success }]}>
                <Text style={styles.emptyIcon}>✓</Text>
                <Text style={[styles.emptyText, { color: colors.success }]}>No active emergencies</Text>
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

          {/* Quick Stats */}
          <View style={[styles.statsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statsTitle, { color: colors.foreground }]}>Today's Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={[styles.statBoxValue, { color: colors.primary }]}>
                  {emergencyAlertService.getStatistics().totalAlerts}
                </Text>
                <Text style={[styles.statBoxLabel, { color: colors.muted }]}>Total Alerts</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statBoxValue, { color: colors.success }]}>
                  {emergencyAlertService.getStatistics().acknowledgmentRate}%
                </Text>
                <Text style={[styles.statBoxLabel, { color: colors.muted }]}>Ack Rate</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statBoxValue, { color: colors.warning }]}>
                  {emergencyAlertService.getStatistics().averageResponseTime}m
                </Text>
                <Text style={[styles.statBoxLabel, { color: colors.muted }]}>Avg Response</Text>
              </View>
            </View>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      ) : (
        <ScrollView style={styles.container}>
          {/* Alert Detail Header */}
          <View style={styles.detailHeader}>
            <TouchableOpacity onPress={() => setSelectedAlert(null)}>
              <Text style={[styles.backButton, { color: colors.primary }]}>← Back</Text>
            </TouchableOpacity>
            <View style={[styles.statusBadge, { backgroundColor: emergencyAlertService.getStatusColor(selectedAlert.status) }]}>
              <Text style={styles.statusText}>{selectedAlert.status.replace('_', ' ').toUpperCase()}</Text>
            </View>
          </View>

          {/* Alert Info */}
          <View style={[styles.detailCard, { backgroundColor: colors.surface, borderColor: emergencyAlertService.getTemplate(selectedAlert.code)?.color || colors.error }]}>
            <Text style={styles.detailIcon}>{emergencyAlertService.getTemplate(selectedAlert.code)?.icon}</Text>
            <Text style={[styles.detailTitle, { color: colors.foreground }]}>{selectedAlert.title}</Text>
            <Text style={[styles.detailDescription, { color: colors.muted }]}>{selectedAlert.description}</Text>
            
            <View style={[styles.locationBox, { backgroundColor: colors.background }]}>
              <Text style={[styles.locationTitle, { color: colors.foreground }]}>📍 Location</Text>
              <Text style={[styles.locationDetail, { color: colors.muted }]}>
                {selectedAlert.location.building} • Floor {selectedAlert.location.floor}
              </Text>
              <Text style={[styles.locationDetail, { color: colors.muted }]}>
                {selectedAlert.location.unit} {selectedAlert.location.room && `• Room ${selectedAlert.location.room}`}
              </Text>
            </View>

            <Text style={[styles.initiatedText, { color: colors.muted }]}>
              Initiated by {selectedAlert.initiatedBy} • {emergencyAlertService.formatTimeElapsed(selectedAlert.initiatedAt)}
            </Text>
          </View>

          {/* Instructions */}
          <View style={[styles.instructionsCard, { backgroundColor: colors.warning + '15', borderColor: colors.warning }]}>
            <Text style={[styles.instructionsTitle, { color: colors.warning }]}>⚠️ Instructions</Text>
            {selectedAlert.instructions.map((instruction, index) => (
              <View key={index} style={styles.instructionItem}>
                <Text style={[styles.instructionNumber, { color: colors.warning }]}>{index + 1}.</Text>
                <Text style={[styles.instructionText, { color: colors.foreground }]}>{instruction}</Text>
              </View>
            ))}
          </View>

          {/* Acknowledgments */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Acknowledgments ({selectedAlert.acknowledgments.length})
            </Text>
            {selectedAlert.acknowledgments.map((ack) => (
              <View key={ack.id} style={[styles.ackItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.ackInfo}>
                  <Text style={[styles.ackName, { color: colors.foreground }]}>{ack.staffName}</Text>
                  <Text style={[styles.ackRole, { color: colors.muted }]}>{ack.role}</Text>
                </View>
                <View style={styles.ackMeta}>
                  {ack.eta && <Text style={[styles.ackEta, { color: colors.primary }]}>ETA: {ack.eta}m</Text>}
                  <Text style={[styles.ackTime, { color: colors.muted }]}>
                    {emergencyAlertService.formatTimeElapsed(ack.acknowledgedAt)}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Responses */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Response Log ({selectedAlert.responses.length})
            </Text>
            {selectedAlert.responses.map((resp) => (
              <View key={resp.id} style={[styles.responseItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.responseHeader}>
                  <Text style={[styles.responseName, { color: colors.foreground }]}>{resp.staffName}</Text>
                  <Text style={[styles.responseTime, { color: colors.muted }]}>
                    {emergencyAlertService.formatTimeElapsed(resp.timestamp)}
                  </Text>
                </View>
                <Text style={[styles.responseAction, { color: colors.foreground }]}>{resp.action}</Text>
              </View>
            ))}
          </View>

          {/* Action Buttons */}
          {selectedAlert.status !== 'resolved' && selectedAlert.status !== 'cancelled' && (
            <View style={styles.detailActions}>
              <TouchableOpacity
                style={[styles.resolveButton, { backgroundColor: colors.success }]}
                onPress={() => handleResolve(selectedAlert)}
              >
                <Text style={styles.resolveButtonText}>Resolve Alert</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: colors.error }]}
                onPress={() => handleCancel(selectedAlert)}
              >
                <Text style={styles.cancelButtonText}>Cancel Alert</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.bottomPadding} />
        </ScrollView>
      )}

      {/* New Alert Modal */}
      <Modal
        visible={showNewAlert}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNewAlert(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Initiate Emergency</Text>
            <TouchableOpacity onPress={() => setShowNewAlert(false)}>
              <Text style={[styles.closeButton, { color: colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Code Selection */}
            <Text style={[styles.formLabel, { color: colors.foreground }]}>Emergency Code *</Text>
            <TouchableOpacity
              style={[styles.codeSelector, { borderColor: colors.border, backgroundColor: colors.surface }]}
              onPress={() => setShowCodePicker(true)}
            >
              {selectedCode ? (
                <View style={styles.selectedCode}>
                  <Text style={styles.selectedCodeIcon}>
                    {emergencyAlertService.getTemplate(selectedCode)?.icon}
                  </Text>
                  <Text style={[styles.selectedCodeText, { color: colors.foreground }]}>
                    {emergencyAlertService.getTemplate(selectedCode)?.title}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.codePlaceholder, { color: colors.muted }]}>Select emergency code...</Text>
              )}
              <Text style={[styles.chevron, { color: colors.muted }]}>›</Text>
            </TouchableOpacity>

            {/* Location */}
            <Text style={[styles.formLabel, { color: colors.foreground, marginTop: 20 }]}>Location *</Text>
            <View style={styles.locationInputs}>
              <View style={styles.locationInputRow}>
                <View style={styles.locationInputHalf}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Building</Text>
                  <TextInput
                    style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]}
                    value={location.building}
                    onChangeText={(text) => setLocation({ ...location, building: text })}
                    placeholder="Building"
                    placeholderTextColor={colors.muted}
                  />
                </View>
                <View style={styles.locationInputHalf}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Floor</Text>
                  <TextInput
                    style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]}
                    value={location.floor}
                    onChangeText={(text) => setLocation({ ...location, floor: text })}
                    placeholder="Floor"
                    placeholderTextColor={colors.muted}
                  />
                </View>
              </View>
              <View style={styles.locationInputRow}>
                <View style={styles.locationInputHalf}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Unit</Text>
                  <TextInput
                    style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]}
                    value={location.unit}
                    onChangeText={(text) => setLocation({ ...location, unit: text })}
                    placeholder="Unit"
                    placeholderTextColor={colors.muted}
                  />
                </View>
                <View style={styles.locationInputHalf}>
                  <Text style={[styles.inputLabel, { color: colors.muted }]}>Room (optional)</Text>
                  <TextInput
                    style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]}
                    value={location.room}
                    onChangeText={(text) => setLocation({ ...location, room: text })}
                    placeholder="Room"
                    placeholderTextColor={colors.muted}
                  />
                </View>
              </View>
            </View>

            {/* Additional Description */}
            <Text style={[styles.formLabel, { color: colors.foreground, marginTop: 20 }]}>Additional Details (optional)</Text>
            <TextInput
              style={[styles.textarea, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]}
              value={customDescription}
              onChangeText={setCustomDescription}
              placeholder="Add any additional details..."
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={3}
            />

            {/* Warning */}
            <View style={[styles.warningBox, { backgroundColor: colors.error + '15', borderColor: colors.error }]}>
              <Text style={[styles.warningText, { color: colors.error }]}>
                ⚠️ This will broadcast an emergency alert to all targeted staff members. Only use for genuine emergencies.
              </Text>
            </View>

            {/* Initiate Button */}
            <TouchableOpacity
              style={[styles.initiateButton, { backgroundColor: colors.error }]}
              onPress={handleInitiateAlert}
            >
              <Text style={styles.initiateButtonText}>🚨 Initiate Emergency Alert</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Code Picker Modal */}
      <Modal
        visible={showCodePicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCodePicker(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Select Emergency Code</Text>
            <TouchableOpacity onPress={() => setShowCodePicker(false)}>
              <Text style={[styles.closeButton, { color: colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {emergencyAlertService.getTemplates().map(renderCodeOption)}
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
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  emergencyButtonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  emergencyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
    fontSize: 16,
    fontWeight: '500',
  },
  alertCard: {
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 16,
    overflow: 'hidden',
  },
  emergencyCard: {
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  alertTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  alertIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  alertBody: {
    padding: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationLabel: {
    marginRight: 8,
  },
  locationText: {
    fontSize: 14,
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  alertActions: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  statsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
  },
  statBoxValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statBoxLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    fontSize: 16,
  },
  detailCard: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  detailIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  detailDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  locationBox: {
    width: '100%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  locationDetail: {
    fontSize: 14,
    marginBottom: 2,
  },
  initiatedText: {
    fontSize: 12,
  },
  instructionsCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  instructionNumber: {
    fontSize: 14,
    fontWeight: '600',
    width: 24,
  },
  instructionText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  ackItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  ackInfo: {
    flex: 1,
  },
  ackName: {
    fontSize: 14,
    fontWeight: '500',
  },
  ackRole: {
    fontSize: 12,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  ackMeta: {
    alignItems: 'flex-end',
  },
  ackEta: {
    fontSize: 14,
    fontWeight: '600',
  },
  ackTime: {
    fontSize: 12,
    marginTop: 2,
  },
  responseItem: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  responseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  responseName: {
    fontSize: 14,
    fontWeight: '500',
  },
  responseTime: {
    fontSize: 12,
  },
  responseAction: {
    fontSize: 14,
  },
  detailActions: {
    gap: 12,
    marginTop: 20,
  },
  resolveButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  resolveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
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
  codeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  selectedCode: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedCodeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  selectedCodeText: {
    fontSize: 16,
  },
  codePlaceholder: {
    fontSize: 16,
  },
  chevron: {
    fontSize: 24,
  },
  codeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  codeIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  codeInfo: {
    flex: 1,
  },
  codeName: {
    fontSize: 16,
    fontWeight: '500',
  },
  codeDescription: {
    fontSize: 13,
    marginTop: 4,
  },
  severityIndicator: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  severityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  locationInputs: {
    gap: 12,
  },
  locationInputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  locationInputHalf: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  warningBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginTop: 20,
  },
  warningText: {
    fontSize: 14,
    lineHeight: 20,
  },
  initiateButton: {
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  initiateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 100,
  },
});
