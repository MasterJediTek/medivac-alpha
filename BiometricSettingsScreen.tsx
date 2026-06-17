/**
 * Biometric Settings Screen
 * Configure Face ID, Touch ID, and PIN authentication settings
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import {
  biometricAuthService,
  BiometricCapability,
  BiometricSettings,
  AuthAttempt,
  BiometricEvent,
} from '../services/BiometricAuthService';

export default function BiometricSettingsScreen() {
  const colors = useColors();
  const [capability, setCapability] = useState<BiometricCapability | null>(null);
  const [settings, setSettings] = useState<BiometricSettings | null>(null);
  const [authHistory, setAuthHistory] = useState<AuthAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [showPINSetup, setShowPINSetup] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [recommendations, setRecommendations] = useState<string[]>([]);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const cap = await biometricAuthService.checkCapability();
      setCapability(cap);
      setSettings(biometricAuthService.getSettings());
      setAuthHistory(biometricAuthService.getAuthHistory(20));
      setRecommendations(biometricAuthService.getSecurityRecommendations());
    } finally {
      setLoading(false);
    }
  }, []);

  // Subscribe to events
  useEffect(() => {
    loadData();

    const unsubscribe = biometricAuthService.addListener((event: BiometricEvent) => {
      if (event.type === 'settings_changed') {
        setSettings(biometricAuthService.getSettings());
        setRecommendations(biometricAuthService.getSecurityRecommendations());
      } else if (event.type === 'auth_success' || event.type === 'auth_failure') {
        setAuthHistory(biometricAuthService.getAuthHistory(20));
      }
    });

    return unsubscribe;
  }, [loadData]);

  // Toggle biometric enabled
  const toggleBiometric = async (enabled: boolean) => {
    if (enabled) {
      const success = await biometricAuthService.enable();
      if (!success) {
        Alert.alert(
          'Cannot Enable',
          'Biometric authentication is not available or not enrolled on this device.'
        );
      }
    } else {
      await biometricAuthService.disable();
    }
    setSettings(biometricAuthService.getSettings());
  };

  // Update setting
  const updateSetting = async (key: keyof BiometricSettings, value: any) => {
    await biometricAuthService.updateSettings({ [key]: value });
    setSettings(biometricAuthService.getSettings());
  };

  // Test biometric authentication
  const testBiometric = async () => {
    setTesting(true);
    try {
      const result = await biometricAuthService.authenticate('Test authentication');
      Alert.alert(
        result.success ? 'Success' : 'Failed',
        result.success 
          ? `${biometricAuthService.getBiometricTypeName()} authentication successful!`
          : result.error || 'Authentication failed'
      );
    } finally {
      setTesting(false);
      setAuthHistory(biometricAuthService.getAuthHistory(20));
    }
  };

  // Setup PIN
  const handleSetupPIN = async () => {
    if (pinInput.length < 4) {
      Alert.alert('Invalid PIN', 'PIN must be at least 4 digits');
      return;
    }

    if (pinInput !== confirmPinInput) {
      Alert.alert('PIN Mismatch', 'PINs do not match. Please try again.');
      return;
    }

    const success = await biometricAuthService.setupPIN(pinInput);
    if (success) {
      Alert.alert('Success', 'PIN has been set up successfully');
      setShowPINSetup(false);
      setPinInput('');
      setConfirmPinInput('');
      setSettings(biometricAuthService.getSettings());
    } else {
      Alert.alert('Error', 'Failed to set up PIN');
    }
  };

  // Clear auth history
  const handleClearHistory = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear authentication history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await biometricAuthService.clearAuthHistory();
            setAuthHistory([]);
          },
        },
      ]
    );
  };

  // Format timestamp
  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  // Format duration
  const formatDuration = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  };

  if (loading) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>
            Loading biometric settings...
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Biometric Security
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            {biometricAuthService.getBiometricTypeName()} & PIN Authentication
          </Text>
        </View>

        {/* Capability Status */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.capabilityHeader}>
            <View style={[
              styles.capabilityIcon,
              { backgroundColor: capability?.available ? colors.success + '20' : colors.error + '20' }
            ]}>
              <Text style={styles.capabilityIconText}>
                {capability?.biometricType === 'face_id' ? '👤' : '👆'}
              </Text>
            </View>
            <View style={styles.capabilityInfo}>
              <Text style={[styles.capabilityTitle, { color: colors.foreground }]}>
                {biometricAuthService.getBiometricTypeName()}
              </Text>
              <Text style={[styles.capabilityStatus, { 
                color: capability?.available ? colors.success : colors.error 
              }]}>
                {capability?.available 
                  ? (capability.enrolled ? 'Available & Enrolled' : 'Available - Not Enrolled')
                  : 'Not Available'}
              </Text>
            </View>
          </View>

          {capability?.available && capability.enrolled && (
            <TouchableOpacity
              style={[styles.testButton, { backgroundColor: colors.primary, opacity: testing ? 0.7 : 1 }]}
              onPress={testBiometric}
              disabled={testing}
            >
              {testing ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.testButtonText}>
                  Test {biometricAuthService.getBiometricTypeName()}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Main Settings */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            Authentication Settings
          </Text>

          <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.foreground }]}>
                Enable Biometric Auth
              </Text>
              <Text style={[styles.settingDescription, { color: colors.muted }]}>
                Use {biometricAuthService.getBiometricTypeName()} to secure the app
              </Text>
            </View>
            <Switch
              value={settings?.enabled ?? false}
              onValueChange={toggleBiometric}
              trackColor={{ false: colors.border, true: colors.primary }}
              disabled={!capability?.available || !capability?.enrolled}
            />
          </View>

          <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.foreground }]}>
                Require for Login
              </Text>
              <Text style={[styles.settingDescription, { color: colors.muted }]}>
                Verify identity when opening the app
              </Text>
            </View>
            <Switch
              value={settings?.requireForLogin ?? true}
              onValueChange={(value) => updateSetting('requireForLogin', value)}
              trackColor={{ false: colors.border, true: colors.primary }}
              disabled={!settings?.enabled}
            />
          </View>

          <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.foreground }]}>
                Require for Sensitive Data
              </Text>
              <Text style={[styles.settingDescription, { color: colors.muted }]}>
                Verify when accessing patient records, labs, medications
              </Text>
            </View>
            <Switch
              value={settings?.requireForSensitiveData ?? true}
              onValueChange={(value) => updateSetting('requireForSensitiveData', value)}
              trackColor={{ false: colors.border, true: colors.primary }}
              disabled={!settings?.enabled}
            />
          </View>

          <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.foreground }]}>
                Require for Transactions
              </Text>
              <Text style={[styles.settingDescription, { color: colors.muted }]}>
                Verify when accessing financial data
              </Text>
            </View>
            <Switch
              value={settings?.requireForTransactions ?? true}
              onValueChange={(value) => updateSetting('requireForTransactions', value)}
              trackColor={{ false: colors.border, true: colors.primary }}
              disabled={!settings?.enabled}
            />
          </View>
        </View>

        {/* PIN Settings */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            PIN Backup
          </Text>

          <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: colors.foreground }]}>
                Enable PIN Fallback
              </Text>
              <Text style={[styles.settingDescription, { color: colors.muted }]}>
                Use PIN when biometric fails
              </Text>
            </View>
            <Switch
              value={settings?.fallbackToPIN ?? true}
              onValueChange={(value) => updateSetting('fallbackToPIN', value)}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>

          {settings?.fallbackToPIN && (
            <TouchableOpacity
              style={[styles.setupPINButton, { borderColor: colors.primary }]}
              onPress={() => setShowPINSetup(!showPINSetup)}
            >
              <Text style={[styles.setupPINButtonText, { color: colors.primary }]}>
                {showPINSetup ? 'Cancel' : 'Set Up / Change PIN'}
              </Text>
            </TouchableOpacity>
          )}

          {showPINSetup && (
            <View style={styles.pinSetupContainer}>
              <TextInput
                style={[styles.pinInput, { 
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.foreground,
                }]}
                placeholder="Enter PIN (4-8 digits)"
                placeholderTextColor={colors.muted}
                value={pinInput}
                onChangeText={setPinInput}
                keyboardType="numeric"
                secureTextEntry
                maxLength={8}
              />
              <TextInput
                style={[styles.pinInput, { 
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.foreground,
                }]}
                placeholder="Confirm PIN"
                placeholderTextColor={colors.muted}
                value={confirmPinInput}
                onChangeText={setConfirmPinInput}
                keyboardType="numeric"
                secureTextEntry
                maxLength={8}
              />
              <TouchableOpacity
                style={[styles.savePINButton, { backgroundColor: colors.primary }]}
                onPress={handleSetupPIN}
              >
                <Text style={styles.savePINButtonText}>Save PIN</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Security Timeouts */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            Security Timeouts
          </Text>

          <View style={styles.timeoutItem}>
            <Text style={[styles.timeoutLabel, { color: colors.foreground }]}>
              Auto-Lock Timeout
            </Text>
            <Text style={[styles.timeoutValue, { color: colors.muted }]}>
              {formatDuration(settings?.autoLockTimeout ?? 300000)}
            </Text>
          </View>

          <View style={styles.timeoutOptions}>
            {[60000, 300000, 600000, 1800000].map((timeout) => (
              <TouchableOpacity
                key={timeout}
                style={[
                  styles.timeoutOption,
                  { 
                    backgroundColor: settings?.autoLockTimeout === timeout 
                      ? colors.primary 
                      : colors.background,
                    borderColor: colors.border,
                  }
                ]}
                onPress={() => updateSetting('autoLockTimeout', timeout)}
              >
                <Text style={[
                  styles.timeoutOptionText,
                  { color: settings?.autoLockTimeout === timeout ? '#fff' : colors.foreground }
                ]}>
                  {formatDuration(timeout)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.timeoutItem}>
            <Text style={[styles.timeoutLabel, { color: colors.foreground }]}>
              Lockout Duration
            </Text>
            <Text style={[styles.timeoutValue, { color: colors.muted }]}>
              {formatDuration(settings?.lockoutDuration ?? 300000)} after {settings?.maxAttempts ?? 5} failed attempts
            </Text>
          </View>
        </View>

        {/* Security Recommendations */}
        {recommendations.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.warning + '10', borderColor: colors.warning }]}>
            <Text style={[styles.cardTitle, { color: colors.warning }]}>
              Security Recommendations
            </Text>
            {recommendations.map((rec, index) => (
              <View key={index} style={styles.recommendationItem}>
                <Text style={styles.recommendationIcon}>⚠️</Text>
                <Text style={[styles.recommendationText, { color: colors.foreground }]}>
                  {rec}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Authentication History */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.historyHeader}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              Recent Authentication
            </Text>
            {authHistory.length > 0 && (
              <TouchableOpacity onPress={handleClearHistory}>
                <Text style={[styles.clearButton, { color: colors.error }]}>
                  Clear
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {authHistory.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              No authentication history
            </Text>
          ) : (
            authHistory.slice(0, 10).map((attempt) => (
              <View 
                key={attempt.id}
                style={[styles.historyItem, { borderBottomColor: colors.border }]}
              >
                <View style={[
                  styles.historyDot,
                  { backgroundColor: attempt.success ? colors.success : colors.error }
                ]} />
                <View style={styles.historyInfo}>
                  <Text style={[styles.historyReason, { color: colors.foreground }]}>
                    {attempt.reason}
                  </Text>
                  <Text style={[styles.historyTime, { color: colors.muted }]}>
                    {formatTime(attempt.timestamp)} • {attempt.biometricType.replace('_', ' ')}
                  </Text>
                </View>
                <Text style={[
                  styles.historyStatus,
                  { color: attempt.success ? colors.success : colors.error }
                ]}>
                  {attempt.success ? '✓' : '✗'}
                </Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
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
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  capabilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  capabilityIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  capabilityIconText: {
    fontSize: 28,
  },
  capabilityInfo: {
    flex: 1,
  },
  capabilityTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  capabilityStatus: {
    fontSize: 14,
    marginTop: 4,
  },
  testButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  setupPINButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  setupPINButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  pinSetupContainer: {
    marginTop: 16,
    gap: 12,
  },
  pinInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 8,
  },
  savePINButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  savePINButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  timeoutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeoutLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  timeoutValue: {
    fontSize: 14,
  },
  timeoutOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeoutOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  timeoutOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recommendationIcon: {
    marginRight: 8,
    fontSize: 16,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  clearButton: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 20,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  historyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  historyInfo: {
    flex: 1,
  },
  historyReason: {
    fontSize: 14,
    fontWeight: '500',
  },
  historyTime: {
    fontSize: 12,
    marginTop: 2,
  },
  historyStatus: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 100,
  },
});
