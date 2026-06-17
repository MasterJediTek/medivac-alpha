import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { beaconCalibrationService, type HospitalBeacon, type CalibrationSession } from '@/lib/services/beacon-calibration.service';
import { PinEntryScreen } from '@/components/pin-entry-screen';
import { staffPinAuthService, AuthSession } from '@/lib/services/staff-pin-auth.service';

export default function BeaconCalibrationScreen() {
  const colors = useColors();
  const [beacons, setBeacons] = useState<HospitalBeacon[]>([]);
  const [selectedBeacon, setSelectedBeacon] = useState<HospitalBeacon | null>(null);
  const [activeSession, setActiveSession] = useState<CalibrationSession | null>(null);
  const [systemHealth, setSystemHealth] = useState<{
    active: number;
    inactive: number;
    maintenance: number;
    avgAccuracy: number;
  } | null>(null);
  const [showCalibrationModal, setShowCalibrationModal] = useState(false);
  const [calibrationDistance, setCalibrationDistance] = useState('');
  const [calibrationRssi, setCalibrationRssi] = useState('');
  const [staffId, setStaffId] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'maintenance'>('all');
  const [showPinEntry, setShowPinEntry] = useState(true);
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    // Check if already authenticated
    const session = staffPinAuthService.getCurrentSession();
    if (session && staffPinAuthService.hasPermission('beacon_calibration')) {
      setAuthSession(session);
      setShowPinEntry(false);
      setStaffId(session.staffId);
    }
    
    // Subscribe to auth changes
    const unsubscribe = staffPinAuthService.subscribe((session) => {
      setAuthSession(session);
      if (!session) {
        setShowPinEntry(true);
      }
    });
    
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!showPinEntry) {
      loadBeacons();
      loadSystemHealth();
    }
  }, [filterStatus, showPinEntry]);

  const handleAuthSuccess = () => {
    const session = staffPinAuthService.getCurrentSession();
    if (session) {
      setAuthSession(session);
      setStaffId(session.staffId);
      setShowPinEntry(false);
    }
  };

  const handleLogout = () => {
    staffPinAuthService.logout();
    setShowPinEntry(true);
  };

  const loadBeacons = () => {
    if (filterStatus === 'all') {
      setBeacons(beaconCalibrationService.getAllBeacons());
    } else {
      setBeacons(beaconCalibrationService.getBeaconsByStatus(filterStatus));
    }
  };

  const loadSystemHealth = () => {
    setSystemHealth(beaconCalibrationService.getSystemHealth());
  };

  const handleSelectBeacon = (beacon: HospitalBeacon) => {
    setSelectedBeacon(beacon);
  };

  const handleStartCalibration = () => {
    if (!selectedBeacon) {
      Alert.alert('Error', 'Please select a beacon first');
      return;
    }
    if (!staffId.trim()) {
      Alert.alert('Error', 'Please enter your staff ID');
      return;
    }
    
    const session = beaconCalibrationService.startCalibrationSession(selectedBeacon.beaconId, staffId);
    setActiveSession(session);
    setShowCalibrationModal(true);
  };

  const handleAddCalibrationPoint = () => {
    const rssi = parseInt(calibrationRssi);
    const distance = parseFloat(calibrationDistance);
    
    if (isNaN(rssi) || isNaN(distance)) {
      Alert.alert('Error', 'Please enter valid RSSI and distance values');
      return;
    }
    
    beaconCalibrationService.addCalibrationPoint(rssi, distance);
    setCalibrationRssi('');
    setCalibrationDistance('');
    Alert.alert('Success', 'Calibration point added');
  };

  const handleCompleteCalibration = () => {
    beaconCalibrationService.completeCalibrationSession('Calibration completed via app');
    setActiveSession(null);
    setShowCalibrationModal(false);
    loadBeacons();
    loadSystemHealth();
    Alert.alert('Success', 'Calibration session completed');
  };

  const handleUpdateSignalStrength = (beaconId: string, delta: number) => {
    const beacon = beacons.find(b => b.beaconId === beaconId);
    if (beacon) {
      const newStrength = Math.max(-100, Math.min(-30, beacon.signalStrength + delta));
      beaconCalibrationService.updateSignalStrength(beaconId, newStrength);
      loadBeacons();
    }
  };

  const handleToggleStatus = (beaconId: string) => {
    const beacon = beacons.find(b => b.beaconId === beaconId);
    if (beacon) {
      const newStatus = beacon.status === 'active' ? 'inactive' : 'active';
      beaconCalibrationService.updateBeaconStatus(beaconId, newStatus);
      loadBeacons();
      loadSystemHealth();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#22C55E';
      case 'inactive': return '#6B7280';
      case 'maintenance': return '#F59E0B';
      default: return colors.muted;
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.foreground,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      color: colors.muted,
    },
    healthCard: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      margin: 16,
      gap: 16,
    },
    healthItem: {
      flex: 1,
      alignItems: 'center',
    },
    healthValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.foreground,
    },
    healthLabel: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 4,
    },
    filterRow: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      gap: 8,
      marginBottom: 16,
    },
    filterButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.surface,
    },
    filterButtonActive: {
      backgroundColor: colors.primary,
    },
    filterButtonText: {
      fontSize: 14,
      color: colors.muted,
    },
    filterButtonTextActive: {
      color: '#FFFFFF',
    },
    beaconList: {
      paddingHorizontal: 16,
    },
    beaconCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    beaconCardSelected: {
      borderColor: colors.primary,
    },
    beaconHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    beaconName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.foreground,
    },
    beaconId: {
      fontSize: 12,
      color: colors.muted,
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '500',
      color: '#FFFFFF',
    },
    beaconDetails: {
      flexDirection: 'row',
      gap: 16,
    },
    detailItem: {
      flex: 1,
    },
    detailLabel: {
      fontSize: 12,
      color: colors.muted,
      marginBottom: 4,
    },
    detailValue: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.foreground,
    },
    signalControl: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 12,
    },
    signalButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    signalButtonText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: 'bold',
    },
    signalValue: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.foreground,
      minWidth: 60,
      textAlign: 'center',
    },
    actionButtons: {
      flexDirection: 'row',
      padding: 16,
      gap: 12,
    },
    actionButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
    },
    primaryButton: {
      backgroundColor: colors.primary,
    },
    secondaryButton: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    secondaryButtonText: {
      color: colors.foreground,
      fontSize: 16,
      fontWeight: '600',
    },
    staffIdInput: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginHorizontal: 16,
      marginBottom: 16,
      fontSize: 16,
      color: colors.foreground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderRadius: 16,
      padding: 24,
      width: '90%',
      maxWidth: 400,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.foreground,
      marginBottom: 8,
    },
    modalSubtitle: {
      fontSize: 14,
      color: colors.muted,
      marginBottom: 24,
    },
    inputRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    inputGroup: {
      flex: 1,
    },
    inputLabel: {
      fontSize: 12,
      color: colors.muted,
      marginBottom: 4,
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.foreground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalButtons: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 16,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
  });

  // Show PIN entry if not authenticated
  if (showPinEntry) {
    return (
      <PinEntryScreen
        requiredPermission="beacon_calibration"
        onSuccess={handleAuthSuccess}
        onCancel={() => {}}
        title="Staff Authentication Required"
        subtitle="Enter your PIN to access Beacon Calibration"
      />
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={styles.title}>🔧 Beacon Calibration</Text>
              <Text style={styles.subtitle}>Staff-only tool for fine-tuning indoor positioning</Text>
            </View>
            <TouchableOpacity
              style={{ backgroundColor: colors.error, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
              onPress={handleLogout}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>Logout</Text>
            </TouchableOpacity>
          </View>
          {authSession && (
            <Text style={[styles.subtitle, { marginTop: 8 }]}>
              Logged in as: {authSession.staffId} ({authSession.role})
            </Text>
          )}
        </View>

        {systemHealth && (
          <View style={styles.healthCard}>
            <View style={styles.healthItem}>
              <Text style={[styles.healthValue, { color: '#22C55E' }]}>{systemHealth.active}</Text>
              <Text style={styles.healthLabel}>Active</Text>
            </View>
            <View style={styles.healthItem}>
              <Text style={[styles.healthValue, { color: '#6B7280' }]}>{systemHealth.inactive}</Text>
              <Text style={styles.healthLabel}>Inactive</Text>
            </View>
            <View style={styles.healthItem}>
              <Text style={[styles.healthValue, { color: '#F59E0B' }]}>{systemHealth.maintenance}</Text>
              <Text style={styles.healthLabel}>Maintenance</Text>
            </View>
            <View style={styles.healthItem}>
              <Text style={[styles.healthValue, { color: colors.primary }]}>{systemHealth.avgAccuracy.toFixed(1)}m</Text>
              <Text style={styles.healthLabel}>Avg Accuracy</Text>
            </View>
          </View>
        )}

        <TextInput
          style={styles.staffIdInput}
          placeholder="Enter your Staff ID"
          placeholderTextColor={colors.muted}
          value={staffId}
          onChangeText={setStaffId}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 50 }}>
          <View style={styles.filterRow}>
            {(['all', 'active', 'inactive', 'maintenance'] as const).map((status) => (
              <TouchableOpacity
                key={status}
                style={[styles.filterButton, filterStatus === status && styles.filterButtonActive]}
                onPress={() => setFilterStatus(status)}
              >
                <Text style={[styles.filterButtonText, filterStatus === status && styles.filterButtonTextActive]}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <ScrollView style={styles.beaconList}>
          {beacons.map((beacon) => (
            <TouchableOpacity
              key={beacon.beaconId}
              style={[
                styles.beaconCard,
                selectedBeacon?.beaconId === beacon.beaconId && styles.beaconCardSelected,
              ]}
              onPress={() => handleSelectBeacon(beacon)}
            >
              <View style={styles.beaconHeader}>
                <View>
                  <Text style={styles.beaconName}>{beacon.name}</Text>
                  <Text style={styles.beaconId}>{beacon.beaconId}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.statusBadge, { backgroundColor: getStatusColor(beacon.status) }]}
                  onPress={() => handleToggleStatus(beacon.beaconId)}
                >
                  <Text style={styles.statusText}>{beacon.status}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.beaconDetails}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Department</Text>
                  <Text style={styles.detailValue}>{beacon.department}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Position</Text>
                  <Text style={styles.detailValue}>({beacon.position.x}, {beacon.position.y})</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Accuracy</Text>
                  <Text style={styles.detailValue}>{beacon.accuracy.toFixed(1)}m</Text>
                </View>
              </View>

              <View style={styles.signalControl}>
                <Text style={styles.detailLabel}>Signal Strength:</Text>
                <TouchableOpacity
                  style={styles.signalButton}
                  onPress={() => handleUpdateSignalStrength(beacon.beaconId, -5)}
                >
                  <Text style={styles.signalButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.signalValue}>{beacon.signalStrength} dBm</Text>
                <TouchableOpacity
                  style={styles.signalButton}
                  onPress={() => handleUpdateSignalStrength(beacon.beaconId, 5)}
                >
                  <Text style={styles.signalButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={loadBeacons}
          >
            <Text style={styles.secondaryButtonText}>Refresh</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={handleStartCalibration}
          >
            <Text style={styles.primaryButtonText}>Start Calibration</Text>
          </TouchableOpacity>
        </View>

        <Modal visible={showCalibrationModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Calibration Session</Text>
              <Text style={styles.modalSubtitle}>
                Beacon: {selectedBeacon?.name}
              </Text>

              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>RSSI (dBm)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="-70"
                    placeholderTextColor={colors.muted}
                    value={calibrationRssi}
                    onChangeText={setCalibrationRssi}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Distance (m)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="3.0"
                    placeholderTextColor={colors.muted}
                    value={calibrationDistance}
                    onChangeText={setCalibrationDistance}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.modalButton, styles.secondaryButton]}
                onPress={handleAddCalibrationPoint}
              >
                <Text style={styles.secondaryButtonText}>Add Point</Text>
              </TouchableOpacity>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.secondaryButton]}
                  onPress={() => setShowCalibrationModal(false)}
                >
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.primaryButton]}
                  onPress={handleCompleteCalibration}
                >
                  <Text style={styles.primaryButtonText}>Complete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </ScreenContainer>
  );
}
