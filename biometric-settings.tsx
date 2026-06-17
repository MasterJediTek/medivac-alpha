import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { BiometricUnlockService, type BiometricType } from '@/lib/services/biometric-unlock.service';
import { StaffPinAuthService } from '@/lib/services/staff-pin-auth.service';
import { PinEntryScreen } from '@/components/pin-entry-screen';
import { biometricTimeoutService, type TimeoutDuration, type TimeoutConfig } from '@/lib/services/biometric-timeout.service';

// Lazy initialization to avoid SSR issues
let biometricService: BiometricUnlockService | null = null;
let authService: StaffPinAuthService | null = null;

const getBiometricService = () => {
  if (!biometricService) {
    biometricService = BiometricUnlockService.getInstance();
  }
  return biometricService;
};

const getAuthService = () => {
  if (!authService) {
    authService = StaffPinAuthService.getInstance();
  }
  return authService;
};

export default function BiometricSettingsScreen() {
  const colors = useColors();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [biometricType, setBiometricType] = useState<BiometricType | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [enrollmentDate, setEnrollmentDate] = useState<Date | null>(null);
  const [timeoutDuration, setTimeoutDuration] = useState<TimeoutDuration>(900);
  const [timeoutOptions, setTimeoutOptions] = useState<TimeoutConfig[]>([]);

  useEffect(() => {
    checkBiometricAvailability();
    loadTimeoutSettings();
  }, []);

  useEffect(() => {
    if (staffId) {
      loadEnrollmentStatus();
    }
  }, [staffId]);

  const checkBiometricAvailability = async () => {
    const service = getBiometricService();
    const available = await service.isAvailable();
    setIsAvailable(available);
    
    if (available) {
      const types = await service.getSupportedTypes();
      if (types.length > 0) {
        setBiometricType(types[0]);
      }
    }
  };

  const loadEnrollmentStatus = () => {
    if (!staffId) return;
    
    const service = getBiometricService();
    const enrolled = service.isEnrolled(staffId);
    setIsEnrolled(enrolled);
    setIsEnabled(enrolled);
    
    if (enrolled) {
      const enrollment = service.getEnrollment(staffId);
      if (enrollment) {
        setEnrollmentDate(new Date(enrollment.enrolledAt));
        setBiometricType(enrollment.biometricType);
      }
    }
  };

  const handlePinSuccess = (id: string) => {
    setIsAuthenticated(true);
    setStaffId(id);
  };

  const handleEnableBiometric = async (value: boolean) => {
    if (!staffId || !biometricType) return;

    if (value) {
      // Enroll
      const service = getBiometricService();
      const success = await service.enroll(staffId, biometricType);
      if (success) {
        setIsEnrolled(true);
        setIsEnabled(true);
        setEnrollmentDate(new Date());
        Alert.alert(
          'Biometric Enabled',
          `${getBiometricName(biometricType)} has been enabled for quick unlock.`
        );
      } else {
        Alert.alert('Enrollment Failed', 'Could not enable biometric authentication.');
      }
    } else {
      // Unenroll
      Alert.alert(
        'Disable Biometric',
        'Are you sure you want to disable biometric authentication?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: () => {
              getBiometricService().unenroll(staffId);
              setIsEnrolled(false);
              setIsEnabled(false);
              setEnrollmentDate(null);
            },
          },
        ]
      );
    }
  };

  const handleReEnroll = async () => {
    if (!staffId || !biometricType) return;

    Alert.alert(
      'Re-enroll Biometric',
      'This will reset your biometric enrollment. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Re-enroll',
          onPress: async () => {
            const service = getBiometricService();
            service.unenroll(staffId);
            const success = await service.enroll(staffId, biometricType);
            if (success) {
              setEnrollmentDate(new Date());
              Alert.alert('Success', 'Biometric re-enrollment complete.');
            }
          },
        },
      ]
    );
  };

  const handleTestBiometric = async () => {
    if (!staffId) return;

    const result = await getBiometricService().authenticate(staffId);
    if (result.success) {
      Alert.alert('Success', 'Biometric authentication successful!');
    } else {
      Alert.alert('Failed', result.error || 'Biometric authentication failed.');
    }
  };

  const getBiometricName = (type: BiometricType): string => {
    switch (type) {
      case 'face_id': return 'Face ID';
      case 'touch_id': return 'Touch ID';
      case 'fingerprint': return 'Fingerprint';
      case 'iris': return 'Iris Scan';
      default: return 'Biometric';
    }
  };

  const getBiometricIcon = (type: BiometricType): string => {
    switch (type) {
      case 'face_id': return '👤';
      case 'touch_id': return '👆';
      case 'fingerprint': return '🔐';
      case 'iris': return '👁️';
      default: return '🔒';
    }
  };

  const loadTimeoutSettings = () => {
    try {
      const options = biometricTimeoutService.getTimeoutOptions();
      setTimeoutOptions(options);
      setTimeoutDuration(biometricTimeoutService.getTimeoutDuration());
    } catch {
      // Use defaults
    }
  };

  const handleTimeoutChange = (duration: TimeoutDuration) => {
    biometricTimeoutService.setTimeoutDuration(duration);
    setTimeoutDuration(duration);
    const config = timeoutOptions.find(opt => opt.duration === duration);
    Alert.alert('Timeout Updated', `Auto-lock set to ${config?.label || 'unknown'}.`);
  };

  const handleLogout = () => {
    getAuthService().logout();
    setIsAuthenticated(false);
    setStaffId(null);
  };

  if (!isAuthenticated) {
    return (
      <PinEntryScreen
        onSuccess={handlePinSuccess}
        onCancel={() => {}}
        title="Staff Authentication"
        subtitle="Enter your PIN to access biometric settings"
      />
    );
  }

  return (
    <ScreenContainer>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Biometric Settings
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.muted }]}>
            Manage your biometric authentication
          </Text>
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: colors.error }]}
            onPress={handleLogout}
          >
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Availability Status */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              Device Support
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: colors.muted }]}>
              Biometric Available
            </Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: isAvailable ? colors.success : colors.error }
            ]}>
              <Text style={styles.statusBadgeText}>
                {isAvailable ? 'Yes' : 'No'}
              </Text>
            </View>
          </View>
          {biometricType && (
            <View style={styles.statusRow}>
              <Text style={[styles.statusLabel, { color: colors.muted }]}>
                Type
              </Text>
              <Text style={[styles.statusValue, { color: colors.foreground }]}>
                {getBiometricIcon(biometricType)} {getBiometricName(biometricType)}
              </Text>
            </View>
          )}
        </View>

        {/* Enable/Disable Toggle */}
        {isAvailable && (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                Quick Unlock
              </Text>
            </View>
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={[styles.toggleLabel, { color: colors.foreground }]}>
                  Enable {biometricType ? getBiometricName(biometricType) : 'Biometric'}
                </Text>
                <Text style={[styles.toggleDescription, { color: colors.muted }]}>
                  Use biometric authentication instead of PIN for quick access
                </Text>
              </View>
              <Switch
                value={isEnabled}
                onValueChange={handleEnableBiometric}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={isEnabled ? '#fff' : '#f4f3f4'}
              />
            </View>
          </View>
        )}

        {/* Enrollment Status */}
        {isEnrolled && (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                Enrollment Status
              </Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={[styles.statusLabel, { color: colors.muted }]}>
                Status
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: colors.success }]}>
                <Text style={styles.statusBadgeText}>Enrolled</Text>
              </View>
            </View>
            {enrollmentDate && (
              <View style={styles.statusRow}>
                <Text style={[styles.statusLabel, { color: colors.muted }]}>
                  Enrolled On
                </Text>
                <Text style={[styles.statusValue, { color: colors.foreground }]}>
                  {enrollmentDate.toLocaleDateString()}
                </Text>
              </View>
            )}
            <View style={styles.statusRow}>
              <Text style={[styles.statusLabel, { color: colors.muted }]}>
                Staff ID
              </Text>
              <Text style={[styles.statusValue, { color: colors.foreground }]}>
                {staffId}
              </Text>
            </View>
          </View>
        )}

        {/* Actions */}
        {isEnrolled && (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                Actions
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={handleTestBiometric}
            >
              <Text style={styles.actionButtonText}>
                🔐 Test Biometric Authentication
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.warning }]}
              onPress={handleReEnroll}
            >
              <Text style={styles.actionButtonText}>
                🔄 Re-enroll Biometric
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Not Available Message */}
        {!isAvailable && (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.notAvailable}>
              <Text style={styles.notAvailableIcon}>🔒</Text>
              <Text style={[styles.notAvailableTitle, { color: colors.foreground }]}>
                Biometric Not Available
              </Text>
              <Text style={[styles.notAvailableText, { color: colors.muted }]}>
                Your device does not support biometric authentication, or it has not been set up in your device settings.
              </Text>
            </View>
          </View>
        )}

        {/* Auto-Lock Timeout */}
        {isEnrolled && (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                Auto-Lock Timeout
              </Text>
              <Text style={[styles.toggleDescription, { color: colors.muted, marginTop: 4 }]}>
                Automatically lock after inactivity period
              </Text>
            </View>
            {timeoutOptions.map((option) => (
              <TouchableOpacity
                key={option.duration}
                style={[
                  styles.timeoutOption,
                  {
                    backgroundColor: timeoutDuration === option.duration ? colors.primary + '15' : 'transparent',
                    borderColor: timeoutDuration === option.duration ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => handleTimeoutChange(option.duration)}
              >
                <View style={styles.timeoutOptionContent}>
                  <Text style={[
                    styles.timeoutOptionLabel,
                    { color: timeoutDuration === option.duration ? colors.primary : colors.foreground },
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={[styles.timeoutOptionDesc, { color: colors.muted }]}>
                    {option.description}
                  </Text>
                </View>
                {timeoutDuration === option.duration && (
                  <Text style={{ color: colors.primary, fontSize: 18 }}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Security Notice */}
        <View style={[styles.notice, { backgroundColor: colors.primary + '20' }]}>
          <Text style={[styles.noticeText, { color: colors.primary }]}>
            🛡️ Your biometric data is stored securely on your device and is never transmitted to our servers.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    position: 'relative',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  logoutButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statusLabel: {
    fontSize: 14,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 12,
  },
  actionButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  notAvailable: {
    alignItems: 'center',
    padding: 20,
  },
  notAvailableIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  notAvailableTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  notAvailableText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  notice: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  noticeText: {
    fontSize: 13,
    lineHeight: 18,
  },
  timeoutOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  timeoutOptionContent: {
    flex: 1,
  },
  timeoutOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  timeoutOptionDesc: {
    fontSize: 12,
    marginTop: 2,
  },
});
