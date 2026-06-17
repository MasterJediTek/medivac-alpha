/**
 * Password Protection Testing Screen
 * Interactive test for "obewon" verification system
 * MediVac One v5.4
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { secureImportExportService } from '@/lib/services/secure-import-export-service';

interface TestResult {
  id: string;
  action: string;
  result: 'success' | 'failed' | 'locked';
  timestamp: string;
  details: string;
}

export default function PasswordTestScreen() {
  const colors = useColors();
  const [password, setPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(0);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutEndTime, setLockoutEndTime] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showFailure, setShowFailure] = useState(false);

  useEffect(() => {
    checkSessionStatus();
    const interval = setInterval(checkSessionStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  const checkSessionStatus = async () => {
    const isValid = await secureImportExportService.isSessionValid();
    setIsSessionActive(isValid);
    if (isValid) {
      const remaining = secureImportExportService.getRemainingSessionTime();
      setSessionTimeRemaining(remaining);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleActionRequest = (action: string) => {
    setPendingAction(action);
    setShowPasswordModal(true);
    setPassword('');
  };

  const handlePasswordSubmit = async () => {
    const result = await secureImportExportService.verifyPassword(password);
    
    const testResult: TestResult = {
      id: `test_${Date.now()}`,
      action: pendingAction || 'verify',
      result: result.success ? 'success' : (result.lockedUntil ? 'locked' : 'failed'),
      timestamp: new Date().toISOString(),
      details: result.message,
    };
    
    setTestResults(prev => [testResult, ...prev].slice(0, 20));
    
    if (result.success) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      setShowPasswordModal(false);
      setFailedAttempts(0);
      setIsLockedOut(false);
      
      // Execute the pending action
      if (pendingAction === 'export') {
        await performExport();
      } else if (pendingAction === 'import') {
        await performImport();
      }
    } else {
      setShowFailure(true);
      setTimeout(() => setShowFailure(false), 1500);
      
      if (result.remainingAttempts !== undefined) {
        setFailedAttempts(5 - result.remainingAttempts);
      }
      
      if (result.lockedUntil) {
        setIsLockedOut(true);
        setLockoutEndTime(result.lockedUntil);
        setShowPasswordModal(false);
        Alert.alert('Account Locked', `Too many failed attempts. Try again after ${new Date(result.lockedUntil).toLocaleTimeString()}`);
      }
    }
    
    setPassword('');
  };

  const performExport = async () => {
    try {
      const result = await secureImportExportService.exportData({
        categories: ['patients', 'staff'],
        format: 'json',
        includeMetadata: true,
      });
      
      if (result.success) {
        Alert.alert('Export Successful', `Exported ${result.record?.recordCount || 0} records`);
      }
    } catch (error) {
      Alert.alert('Export Failed', 'An error occurred during export');
    }
  };

  const performImport = async () => {
    Alert.alert('Import Test', 'Import functionality would be triggered here with file picker');
  };

  const handleEndSession = async () => {
    await secureImportExportService.endSession();
    setIsSessionActive(false);
    setSessionTimeRemaining(0);
    
    const testResult: TestResult = {
      id: `test_${Date.now()}`,
      action: 'end_session',
      result: 'success',
      timestamp: new Date().toISOString(),
      details: 'Session ended manually',
    };
    setTestResults(prev => [testResult, ...prev].slice(0, 20));
  };

  const securityTips = [
    'Password "obewon" is required for all import/export operations',
    'Sessions expire after 60 minutes of inactivity',
    '5 failed attempts will lock you out for 30 minutes',
    'All password attempts are logged for security audit',
    'Export data is encrypted with AES-256 when using encrypted format',
  ];

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 px-4 py-6">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-foreground mb-2">
            🔐 Password Protection Test
          </Text>
          <Text className="text-muted">
            Test the secure import/export password verification system
          </Text>
        </View>

        {/* Session Status Card */}
        <View 
          className="rounded-2xl p-4 mb-4"
          style={{ backgroundColor: isSessionActive ? '#10B98120' : colors.surface }}
        >
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-lg font-semibold text-foreground">Session Status</Text>
            <View 
              className="px-3 py-1 rounded-full"
              style={{ backgroundColor: isSessionActive ? '#10B981' : colors.error }}
            >
              <Text className="text-white text-sm font-medium">
                {isSessionActive ? 'ACTIVE' : 'INACTIVE'}
              </Text>
            </View>
          </View>
          
          {isSessionActive && (
            <View className="flex-row items-center justify-between">
              <Text className="text-muted">Time Remaining:</Text>
              <Text className="text-foreground font-mono text-lg">
                {formatTime(sessionTimeRemaining)}
              </Text>
            </View>
          )}
          
          {isSessionActive && (
            <TouchableOpacity
              onPress={handleEndSession}
              className="mt-3 py-2 rounded-lg items-center"
              style={{ backgroundColor: colors.error }}
            >
              <Text className="text-white font-semibold">End Session</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Lockout Status */}
        {isLockedOut && lockoutEndTime && (
          <View 
            className="rounded-2xl p-4 mb-4"
            style={{ backgroundColor: '#EF444420' }}
          >
            <Text className="text-lg font-semibold text-error mb-2">⚠️ Account Locked</Text>
            <Text className="text-muted">
              Too many failed password attempts. Access will be restored at:
            </Text>
            <Text className="text-foreground font-mono mt-1">
              {new Date(lockoutEndTime).toLocaleString()}
            </Text>
          </View>
        )}

        {/* Failed Attempts Counter */}
        {failedAttempts > 0 && !isLockedOut && (
          <View 
            className="rounded-2xl p-4 mb-4"
            style={{ backgroundColor: '#F59E0B20' }}
          >
            <Text className="text-lg font-semibold text-warning mb-2">⚠️ Warning</Text>
            <Text className="text-muted">
              {failedAttempts} failed attempt(s). {5 - failedAttempts} remaining before lockout.
            </Text>
            <View className="flex-row mt-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <View
                  key={i}
                  className="w-8 h-2 rounded-full mr-1"
                  style={{ 
                    backgroundColor: i <= failedAttempts ? colors.error : colors.border 
                  }}
                />
              ))}
            </View>
          </View>
        )}

        {/* Test Actions */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-foreground mb-3">Test Actions</Text>
          
          <View className="flex-row flex-wrap gap-3">
            <TouchableOpacity
              onPress={() => handleActionRequest('verify')}
              disabled={isLockedOut}
              className="flex-1 min-w-[140px] py-4 rounded-xl items-center"
              style={{ 
                backgroundColor: isLockedOut ? colors.border : '#3B82F6',
                opacity: isLockedOut ? 0.5 : 1
              }}
            >
              <Text className="text-white text-2xl mb-1">🔑</Text>
              <Text className="text-white font-semibold">Verify Password</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => handleActionRequest('export')}
              disabled={isLockedOut}
              className="flex-1 min-w-[140px] py-4 rounded-xl items-center"
              style={{ 
                backgroundColor: isLockedOut ? colors.border : '#10B981',
                opacity: isLockedOut ? 0.5 : 1
              }}
            >
              <Text className="text-white text-2xl mb-1">📤</Text>
              <Text className="text-white font-semibold">Test Export</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => handleActionRequest('import')}
              disabled={isLockedOut}
              className="flex-1 min-w-[140px] py-4 rounded-xl items-center"
              style={{ 
                backgroundColor: isLockedOut ? colors.border : '#8B5CF6',
                opacity: isLockedOut ? 0.5 : 1
              }}
            >
              <Text className="text-white text-2xl mb-1">📥</Text>
              <Text className="text-white font-semibold">Test Import</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Security Tips */}
        <View 
          className="rounded-2xl p-4 mb-6"
          style={{ backgroundColor: colors.surface }}
        >
          <Text className="text-lg font-semibold text-foreground mb-3">🛡️ Security Tips</Text>
          {securityTips.map((tip, index) => (
            <View key={index} className="flex-row items-start mb-2">
              <Text className="text-primary mr-2">•</Text>
              <Text className="text-muted flex-1">{tip}</Text>
            </View>
          ))}
        </View>

        {/* Test Results Log */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-foreground mb-3">📋 Test Results</Text>
          
          {testResults.length === 0 ? (
            <View 
              className="rounded-xl p-4 items-center"
              style={{ backgroundColor: colors.surface }}
            >
              <Text className="text-muted">No tests performed yet</Text>
            </View>
          ) : (
            testResults.map((result) => (
              <View
                key={result.id}
                className="rounded-xl p-3 mb-2"
                style={{ 
                  backgroundColor: result.result === 'success' 
                    ? '#10B98120' 
                    : result.result === 'locked' 
                      ? '#EF444420' 
                      : '#F59E0B20' 
                }}
              >
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="font-semibold text-foreground capitalize">
                    {result.action.replace('_', ' ')}
                  </Text>
                  <View 
                    className="px-2 py-0.5 rounded"
                    style={{ 
                      backgroundColor: result.result === 'success' 
                        ? '#10B981' 
                        : result.result === 'locked' 
                          ? '#EF4444' 
                          : '#F59E0B' 
                    }}
                  >
                    <Text className="text-white text-xs font-medium uppercase">
                      {result.result}
                    </Text>
                  </View>
                </View>
                <Text className="text-muted text-sm">{result.details}</Text>
                <Text className="text-muted text-xs mt-1">
                  {new Date(result.timestamp).toLocaleString()}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Password Modal */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-6">
          <View 
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ backgroundColor: colors.background }}
          >
            {/* Success Animation */}
            {showSuccess && (
              <View className="absolute inset-0 justify-center items-center bg-green-500/90 rounded-2xl z-10">
                <Text className="text-6xl">✓</Text>
                <Text className="text-white text-xl font-bold mt-2">Access Granted</Text>
              </View>
            )}
            
            {/* Failure Animation */}
            {showFailure && (
              <View className="absolute inset-0 justify-center items-center bg-red-500/90 rounded-2xl z-10">
                <Text className="text-6xl">✗</Text>
                <Text className="text-white text-xl font-bold mt-2">Access Denied</Text>
              </View>
            )}
            
            <View className="items-center mb-4">
              <Text className="text-4xl mb-2">🔐</Text>
              <Text className="text-xl font-bold text-foreground">Enter Password</Text>
              <Text className="text-muted text-center mt-1">
                Password required for {pendingAction} operation
              </Text>
            </View>
            
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password..."
              placeholderTextColor={colors.muted}
              secureTextEntry
              autoFocus
              className="w-full px-4 py-3 rounded-xl mb-4 text-foreground"
              style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
            />
            
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowPasswordModal(false)}
                className="flex-1 py-3 rounded-xl items-center"
                style={{ backgroundColor: colors.surface }}
              >
                <Text className="text-foreground font-semibold">Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handlePasswordSubmit}
                className="flex-1 py-3 rounded-xl items-center"
                style={{ backgroundColor: colors.primary }}
              >
                <Text className="text-white font-semibold">Verify</Text>
              </TouchableOpacity>
            </View>
            
            <Text className="text-muted text-xs text-center mt-4">
              Hint: The password is a Star Wars reference 🌟
            </Text>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
