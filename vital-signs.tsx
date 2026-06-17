/**
 * MediVac One - Vital Signs Monitoring Screen
 * Real-time patient vital signs monitoring dashboard
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import {
  vitalSignsMonitoring,
  type VitalSignReading,
  type VitalSignAlert,
  type PatientMonitoringSession,
  type MedicalDevice,
  type VitalSignType,
} from '@/lib/services/vital-signs-monitoring-service';

// ==========================================
// Types
// ==========================================

interface VitalCardData {
  type: VitalSignType;
  label: string;
  icon: string;
  color: string;
  value: number | null;
  unit: string;
  trend?: 'up' | 'down' | 'stable';
  isAbnormal: boolean;
}

// ==========================================
// Vital Signs Screen
// ==========================================

export default function VitalSignsScreen() {
  const colors = useColors();
  const router = useRouter();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [activeSession, setActiveSession] = useState<PatientMonitoringSession | null>(null);
  const [latestReadings, setLatestReadings] = useState<Map<VitalSignType, VitalSignReading>>(new Map());
  const [alerts, setAlerts] = useState<VitalSignAlert[]>([]);
  const [devices, setDevices] = useState<MedicalDevice[]>([]);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<VitalSignAlert | null>(null);
  const [stats, setStats] = useState(vitalSignsMonitoring.getStatistics());

  // Initialize and subscribe to updates
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Pulse animation for alerts
  useEffect(() => {
    if (alerts.some(a => !a.acknowledged && (a.severity === 'critical' || a.severity === 'emergency'))) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [alerts, pulseAnim]);

  const loadData = () => {
    const sessions = vitalSignsMonitoring.getActiveSessions();
    if (sessions.length > 0) {
      setActiveSession(sessions[0]);
      
      // Get latest readings by type
      const readingsMap = new Map<VitalSignType, VitalSignReading>();
      sessions[0].readings.slice(-50).forEach(reading => {
        const existing = readingsMap.get(reading.type);
        if (!existing || reading.timestamp > existing.timestamp) {
          readingsMap.set(reading.type, reading);
        }
      });
      setLatestReadings(readingsMap);
      setAlerts(sessions[0].alerts.filter(a => !a.acknowledged).slice(-10));
    }
    
    setDevices(vitalSignsMonitoring.getConnectedDevices());
    setStats(vitalSignsMonitoring.getStatistics());
  };

  const startDemoSession = async () => {
    // Pair some demo devices first
    const supportedDevices = vitalSignsMonitoring.getSupportedDevices();
    for (const profile of supportedDevices.slice(0, 3)) {
      await vitalSignsMonitoring.pairDevice(profile);
    }

    const devices = vitalSignsMonitoring.getConnectedDevices();
    const deviceIds = devices.map(d => d.id);

    const session = await vitalSignsMonitoring.startMonitoringSession(
      'patient_demo_001',
      'John Smith',
      'MRN-123456',
      { ward: 'ICU', room: '101', bed: 'A' },
      deviceIds,
      'continuous'
    );

    // Subscribe to updates
    vitalSignsMonitoring.subscribeToSession(session.id, {
      onReading: (reading) => {
        setLatestReadings(prev => {
          const newMap = new Map(prev);
          newMap.set(reading.type, reading);
          return newMap;
        });
      },
      onAlert: (alert) => {
        setAlerts(prev => [alert, ...prev].slice(0, 10));
      },
      onDeviceStatus: (device) => {
        setDevices(prev => prev.map(d => d.id === device.id ? device : d));
      },
      onError: (error) => console.error('Monitoring error:', error),
    });

    setActiveSession(session);
    loadData();
  };

  const acknowledgeAlert = async (alert: VitalSignAlert) => {
    await vitalSignsMonitoring.acknowledgeAlert(alert.id, 'current_user');
    setAlerts(prev => prev.filter(a => a.id !== alert.id));
    setSelectedAlert(null);
    setShowAlertModal(false);
  };

  const getVitalCards = (): VitalCardData[] => {
    const cards: VitalCardData[] = [
      { type: 'heart_rate', label: 'Heart Rate', icon: '❤️', color: '#EF4444', value: null, unit: 'bpm', isAbnormal: false },
      { type: 'blood_pressure_systolic', label: 'BP Systolic', icon: '🩸', color: '#3B82F6', value: null, unit: 'mmHg', isAbnormal: false },
      { type: 'blood_pressure_diastolic', label: 'BP Diastolic', icon: '🩸', color: '#6366F1', value: null, unit: 'mmHg', isAbnormal: false },
      { type: 'oxygen_saturation', label: 'SpO2', icon: '💨', color: '#10B981', value: null, unit: '%', isAbnormal: false },
      { type: 'respiratory_rate', label: 'Resp Rate', icon: '🫁', color: '#8B5CF6', value: null, unit: '/min', isAbnormal: false },
      { type: 'temperature', label: 'Temperature', icon: '🌡️', color: '#F59E0B', value: null, unit: '°C', isAbnormal: false },
      { type: 'blood_glucose', label: 'Glucose', icon: '🍬', color: '#EC4899', value: null, unit: 'mmol/L', isAbnormal: false },
    ];

    cards.forEach(card => {
      const reading = latestReadings.get(card.type);
      if (reading) {
        card.value = reading.value;
        card.isAbnormal = reading.isAbnormal;
      }
    });

    return cards;
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'emergency': return '#DC2626';
      case 'critical': return '#EF4444';
      case 'warning': return '#F59E0B';
      default: return '#3B82F6';
    }
  };

  const renderVitalCard = (card: VitalCardData) => (
    <View
      key={card.type}
      style={[
        styles.vitalCard,
        { 
          backgroundColor: colors.surface,
          borderColor: card.isAbnormal ? '#EF4444' : colors.border,
          borderWidth: card.isAbnormal ? 2 : 1,
        }
      ]}
    >
      <View style={styles.vitalCardHeader}>
        <Text style={styles.vitalIcon}>{card.icon}</Text>
        <Text style={[styles.vitalLabel, { color: colors.muted }]}>{card.label}</Text>
      </View>
      <View style={styles.vitalCardValue}>
        <Text style={[
          styles.vitalValue,
          { color: card.isAbnormal ? '#EF4444' : colors.foreground }
        ]}>
          {card.value !== null ? card.value : '--'}
        </Text>
        <Text style={[styles.vitalUnit, { color: colors.muted }]}>{card.unit}</Text>
      </View>
      {card.isAbnormal && (
        <View style={[styles.abnormalBadge, { backgroundColor: '#EF4444' + '20' }]}>
          <Text style={styles.abnormalText}>⚠️ Abnormal</Text>
        </View>
      )}
    </View>
  );

  const renderAlertItem = ({ item }: { item: VitalSignAlert }) => (
    <TouchableOpacity
      style={[
        styles.alertItem,
        { backgroundColor: getSeverityColor(item.severity) + '15', borderLeftColor: getSeverityColor(item.severity) }
      ]}
      onPress={() => {
        setSelectedAlert(item);
        setShowAlertModal(true);
      }}
    >
      <View style={styles.alertContent}>
        <Text style={[styles.alertSeverity, { color: getSeverityColor(item.severity) }]}>
          {item.severity.toUpperCase()}
        </Text>
        <Text style={[styles.alertMessage, { color: colors.foreground }]}>{item.message}</Text>
        <Text style={[styles.alertTime, { color: colors.muted }]}>
          {new Date(item.timestamp).toLocaleTimeString()}
        </Text>
      </View>
      <IconSymbol name="chevron.right" size={20} color={colors.muted} />
    </TouchableOpacity>
  );

  const renderDeviceItem = ({ item }: { item: MedicalDevice }) => (
    <View style={[styles.deviceItem, { backgroundColor: colors.surface }]}>
      <View style={[
        styles.deviceStatus,
        { backgroundColor: item.connectionStatus === 'connected' ? '#10B981' : '#EF4444' }
      ]} />
      <View style={styles.deviceInfo}>
        <Text style={[styles.deviceName, { color: colors.foreground }]}>{item.name}</Text>
        <Text style={[styles.deviceType, { color: colors.muted }]}>
          {item.type.replace(/_/g, ' ')} • {item.connectionStatus}
        </Text>
      </View>
      {item.batteryLevel && (
        <View style={styles.batteryContainer}>
          <Text style={[styles.batteryText, { color: item.batteryLevel < 20 ? '#EF4444' : colors.muted }]}>
            🔋 {item.batteryLevel}%
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <ScreenContainer>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={[styles.title, { color: colors.foreground }]}>Vital Signs Monitor</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>Real-time patient monitoring</Text>
          </View>
          <TouchableOpacity
            style={[styles.deviceButton, { backgroundColor: colors.surface }]}
            onPress={() => setShowDeviceModal(true)}
          >
            <IconSymbol name="stethoscope" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Patient Info */}
        {activeSession ? (
          <View style={[styles.patientCard, { backgroundColor: '#3B82F6' + '15' }]}>
            <View style={styles.patientInfo}>
              <Text style={[styles.patientName, { color: colors.foreground }]}>
                {activeSession.patientName}
              </Text>
              <Text style={[styles.patientDetails, { color: colors.muted }]}>
                MRN: {activeSession.mrn} • {activeSession.ward} - Room {activeSession.room}, Bed {activeSession.bed}
              </Text>
            </View>
            <View style={[styles.monitoringBadge, { backgroundColor: '#10B981' }]}>
              <Text style={styles.monitoringText}>{activeSession.monitoringLevel.toUpperCase()}</Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.startButton, { backgroundColor: colors.primary }]}
            onPress={startDemoSession}
          >
            <IconSymbol name="play.fill" size={24} color="#FFFFFF" />
            <Text style={styles.startButtonText}>Start Demo Monitoring</Text>
          </TouchableOpacity>
        )}

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <Animated.View style={[styles.alertsSection, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: '#EF4444' }]}>⚠️ Active Alerts</Text>
              <Text style={[styles.alertCount, { color: '#EF4444' }]}>{alerts.length}</Text>
            </View>
            <FlatList
              data={alerts}
              renderItem={renderAlertItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
          </Animated.View>
        )}

        {/* Vital Signs Grid */}
        <View style={styles.vitalsSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Current Readings</Text>
          <View style={styles.vitalsGrid}>
            {getVitalCards().map(renderVitalCard)}
          </View>
        </View>

        {/* Statistics */}
        <View style={[styles.statsCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Monitoring Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{stats.connectedDevices}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Devices</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{stats.activeSessions}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Sessions</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{stats.totalReadings}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Readings</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: stats.unacknowledgedAlerts > 0 ? '#EF4444' : colors.primary }]}>
                {stats.unacknowledgedAlerts}
              </Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Alerts</Text>
            </View>
          </View>
        </View>

        {/* Connected Devices */}
        {devices.length > 0 && (
          <View style={styles.devicesSection}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Connected Devices</Text>
            <FlatList
              data={devices.slice(0, 5)}
              renderItem={renderDeviceItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
          </View>
        )}
      </ScrollView>

      {/* Alert Detail Modal */}
      <Modal
        visible={showAlertModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAlertModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            {selectedAlert && (
              <>
                <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.modalTitle, { color: getSeverityColor(selectedAlert.severity) }]}>
                    {selectedAlert.severity.toUpperCase()} ALERT
                  </Text>
                  <TouchableOpacity onPress={() => setShowAlertModal(false)}>
                    <IconSymbol name="xmark.circle.fill" size={28} color={colors.muted} />
                  </TouchableOpacity>
                </View>
                <View style={styles.modalBody}>
                  <Text style={[styles.alertDetailMessage, { color: colors.foreground }]}>
                    {selectedAlert.message}
                  </Text>
                  <View style={styles.alertDetailRow}>
                    <Text style={[styles.alertDetailLabel, { color: colors.muted }]}>Value:</Text>
                    <Text style={[styles.alertDetailValue, { color: colors.foreground }]}>
                      {selectedAlert.value} (Threshold: {selectedAlert.threshold})
                    </Text>
                  </View>
                  <View style={styles.alertDetailRow}>
                    <Text style={[styles.alertDetailLabel, { color: colors.muted }]}>Time:</Text>
                    <Text style={[styles.alertDetailValue, { color: colors.foreground }]}>
                      {new Date(selectedAlert.timestamp).toLocaleString()}
                    </Text>
                  </View>
                  {selectedAlert.escalated && (
                    <View style={[styles.escalatedBadge, { backgroundColor: '#EF4444' + '20' }]}>
                      <Text style={[styles.escalatedText, { color: '#EF4444' }]}>
                        ⚡ Escalated to: {selectedAlert.escalatedTo}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.acknowledgeButton, { backgroundColor: '#10B981' }]}
                    onPress={() => acknowledgeAlert(selectedAlert)}
                  >
                    <IconSymbol name="checkmark.circle.fill" size={20} color="#FFFFFF" />
                    <Text style={styles.acknowledgeText}>Acknowledge</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Device Modal */}
      <Modal
        visible={showDeviceModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDeviceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Medical Devices</Text>
              <TouchableOpacity onPress={() => setShowDeviceModal(false)}>
                <IconSymbol name="xmark.circle.fill" size={28} color={colors.muted} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={devices}
              renderItem={renderDeviceItem}
              keyExtractor={item => item.id}
              style={styles.deviceList}
              ListEmptyComponent={
                <Text style={[styles.emptyText, { color: colors.muted }]}>
                  No devices connected
                </Text>
              }
            />
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

// ==========================================
// Styles
// ==========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  deviceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '600',
  },
  patientDetails: {
    fontSize: 13,
    marginTop: 4,
  },
  monitoringBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  monitoringText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    gap: 12,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  alertsSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  alertCount: {
    fontSize: 16,
    fontWeight: '700',
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  alertContent: {
    flex: 1,
  },
  alertSeverity: {
    fontSize: 11,
    fontWeight: '700',
  },
  alertMessage: {
    fontSize: 14,
    marginTop: 4,
  },
  alertTime: {
    fontSize: 11,
    marginTop: 4,
  },
  vitalsSection: {
    marginBottom: 20,
  },
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  vitalCard: {
    width: '47%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  vitalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  vitalIcon: {
    fontSize: 20,
  },
  vitalLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  vitalCardValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  vitalValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  vitalUnit: {
    fontSize: 14,
  },
  abnormalBadge: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  abnormalText: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '600',
  },
  statsCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  devicesSection: {
    marginBottom: 20,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  deviceStatus: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 14,
    fontWeight: '600',
  },
  deviceType: {
    fontSize: 12,
    marginTop: 2,
  },
  batteryContainer: {
    marginLeft: 12,
  },
  batteryText: {
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalBody: {
    padding: 20,
  },
  alertDetailMessage: {
    fontSize: 16,
    marginBottom: 16,
  },
  alertDetailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  alertDetailLabel: {
    fontSize: 14,
    width: 80,
  },
  alertDetailValue: {
    fontSize: 14,
    flex: 1,
  },
  escalatedBadge: {
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  escalatedText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalActions: {
    padding: 20,
    paddingTop: 0,
  },
  acknowledgeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  acknowledgeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  deviceList: {
    padding: 16,
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
  },
});
