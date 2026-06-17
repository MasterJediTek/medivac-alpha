import React, { useState, useEffect } from 'react';
import { ScrollView, Text, View, TouchableOpacity, TextInput, Alert, Platform } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { mfaEnforcement, type MFAMethod, type UserMFAConfig, type ClinicalRole } from '@/lib/services/mfa-enforcement-service';

type SetupStep = 'overview' | 'totp' | 'biometric' | 'sms' | 'email' | 'backup' | 'complete';

export default function MFASetupScreen() {
  const colors = useColors();
  const [currentStep, setCurrentStep] = useState<SetupStep>('overview');
  const [userConfig, setUserConfig] = useState<UserMFAConfig | null>(null);
  const [totpSecret, setTotpSecret] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMethods, setSelectedMethods] = useState<MFAMethod[]>([]);

  const mockUserId = 'user_001';
  const mockRole: ClinicalRole = 'doctor';

  useEffect(() => {
    loadUserConfig();
  }, []);

  const loadUserConfig = async () => {
    let config = mfaEnforcement.getUserMFA(mockUserId);
    if (!config) {
      config = await mfaEnforcement.setupUserMFA(mockUserId, mockRole);
    }
    setUserConfig(config);
    setSelectedMethods(config.enabledMethods);
  };

  const handleSetupTOTP = async () => {
    setIsLoading(true);
    try {
      const result = await mfaEnforcement.setupTOTP(mockUserId);
      setTotpSecret(result.secret);
      setCurrentStep('totp');
    } catch (error) {
      Alert.alert('Error', 'Failed to set up TOTP');
    }
    setIsLoading(false);
  };

  const handleVerifyTOTP = async () => {
    if (verificationCode.length !== 6) {
      Alert.alert('Error', 'Please enter a 6-digit code');
      return;
    }
    setIsLoading(true);
    try {
      const success = await mfaEnforcement.verifyTOTPSetup(mockUserId, verificationCode);
      if (success) {
        Alert.alert('Success', 'TOTP verified successfully');
        await loadUserConfig();
        setCurrentStep('overview');
      } else {
        Alert.alert('Error', 'Invalid code. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Verification failed');
    }
    setIsLoading(false);
    setVerificationCode('');
  };

  const handleEnableBiometric = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'Biometric authentication is not available on web');
      return;
    }
    setIsLoading(true);
    try {
      await mfaEnforcement.enableBiometric(mockUserId);
      Alert.alert('Success', 'Biometric authentication enabled');
      await loadUserConfig();
    } catch (error) {
      Alert.alert('Error', 'Failed to enable biometric authentication');
    }
    setIsLoading(false);
  };

  const handleRegenerateBackupCodes = async () => {
    Alert.alert(
      'Regenerate Backup Codes',
      'This will invalidate all existing backup codes. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Regenerate',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await mfaEnforcement.regenerateBackupCodes(mockUserId);
              await loadUserConfig();
              Alert.alert('Success', 'New backup codes generated');
            } catch (error) {
              Alert.alert('Error', 'Failed to regenerate backup codes');
            }
            setIsLoading(false);
          },
        },
      ]
    );
  };

  const getMethodIcon = (method: MFAMethod): string => {
    switch (method) {
      case 'totp': return 'lock.fill';
      case 'biometric': return 'faceid';
      case 'sms': return 'message.fill';
      case 'email': return 'envelope.fill';
      case 'hardware_key': return 'key.fill';
      case 'push': return 'bell.fill';
      default: return 'shield.fill';
    }
  };

  const getMethodName = (method: MFAMethod): string => {
    switch (method) {
      case 'totp': return 'Authenticator App';
      case 'biometric': return 'Face ID / Touch ID';
      case 'sms': return 'SMS Verification';
      case 'email': return 'Email Verification';
      case 'hardware_key': return 'Hardware Security Key';
      case 'push': return 'Push Notification';
      default: return method;
    }
  };

  const renderOverview = () => (
    <View className="gap-6">
      {/* Status Card */}
      <View className="bg-surface rounded-2xl p-5 border border-border">
        <View className="flex-row items-center gap-3 mb-4">
          <View className="w-12 h-12 rounded-full bg-primary/20 items-center justify-center">
            <IconSymbol name="shield.fill" size={24} color={colors.primary} />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-semibold text-foreground">MFA Status</Text>
            <Text className="text-sm text-muted">
              {userConfig?.enabledMethods.length || 0} method(s) enabled
            </Text>
          </View>
          <View className={`px-3 py-1 rounded-full ${(userConfig?.enabledMethods.length || 0) >= 2 ? 'bg-success/20' : 'bg-warning/20'}`}>
            <Text className={`text-xs font-medium ${(userConfig?.enabledMethods.length || 0) >= 2 ? 'text-success' : 'text-warning'}`}>
              {(userConfig?.enabledMethods.length || 0) >= 2 ? 'Compliant' : 'Setup Required'}
            </Text>
          </View>
        </View>
        <Text className="text-sm text-muted">
          Clinical staff require at least 2 MFA methods for compliance with healthcare security standards.
        </Text>
      </View>

      {/* MFA Methods */}
      <View>
        <Text className="text-lg font-semibold text-foreground mb-4">Authentication Methods</Text>
        
        {/* TOTP */}
        <TouchableOpacity
          className="bg-surface rounded-xl p-4 border border-border mb-3 flex-row items-center"
          onPress={userConfig?.totpVerified ? undefined : handleSetupTOTP}
          disabled={isLoading}
        >
          <View className="w-10 h-10 rounded-full bg-blue-500/20 items-center justify-center">
            <IconSymbol name="lock.fill" size={20} color="#3B82F6" />
          </View>
          <View className="flex-1 ml-3">
            <Text className="text-base font-medium text-foreground">Authenticator App</Text>
            <Text className="text-sm text-muted">Google Authenticator, Authy, etc.</Text>
          </View>
          {userConfig?.totpVerified ? (
            <View className="bg-success/20 px-3 py-1 rounded-full">
              <Text className="text-xs font-medium text-success">Enabled</Text>
            </View>
          ) : (
            <IconSymbol name="chevron.right" size={20} color={colors.muted} />
          )}
        </TouchableOpacity>

        {/* Biometric */}
        <TouchableOpacity
          className="bg-surface rounded-xl p-4 border border-border mb-3 flex-row items-center"
          onPress={userConfig?.biometricEnabled ? undefined : handleEnableBiometric}
          disabled={isLoading || Platform.OS === 'web'}
        >
          <View className="w-10 h-10 rounded-full bg-purple-500/20 items-center justify-center">
            <IconSymbol name="faceid" size={20} color="#8B5CF6" />
          </View>
          <View className="flex-1 ml-3">
            <Text className="text-base font-medium text-foreground">
              {Platform.OS === 'ios' ? 'Face ID / Touch ID' : 'Fingerprint'}
            </Text>
            <Text className="text-sm text-muted">
              {Platform.OS === 'web' ? 'Not available on web' : 'Use device biometrics'}
            </Text>
          </View>
          {userConfig?.biometricEnabled ? (
            <View className="bg-success/20 px-3 py-1 rounded-full">
              <Text className="text-xs font-medium text-success">Enabled</Text>
            </View>
          ) : Platform.OS !== 'web' ? (
            <IconSymbol name="chevron.right" size={20} color={colors.muted} />
          ) : null}
        </TouchableOpacity>

        {/* SMS */}
        <TouchableOpacity
          className="bg-surface rounded-xl p-4 border border-border mb-3 flex-row items-center"
          onPress={() => setCurrentStep('sms')}
          disabled={isLoading}
        >
          <View className="w-10 h-10 rounded-full bg-green-500/20 items-center justify-center">
            <IconSymbol name="message.fill" size={20} color="#22C55E" />
          </View>
          <View className="flex-1 ml-3">
            <Text className="text-base font-medium text-foreground">SMS Verification</Text>
            <Text className="text-sm text-muted">Receive codes via text message</Text>
          </View>
          {userConfig?.phoneVerified ? (
            <View className="bg-success/20 px-3 py-1 rounded-full">
              <Text className="text-xs font-medium text-success">Enabled</Text>
            </View>
          ) : (
            <IconSymbol name="chevron.right" size={20} color={colors.muted} />
          )}
        </TouchableOpacity>

        {/* Email */}
        <TouchableOpacity
          className="bg-surface rounded-xl p-4 border border-border mb-3 flex-row items-center"
          onPress={() => setCurrentStep('email')}
          disabled={isLoading}
        >
          <View className="w-10 h-10 rounded-full bg-orange-500/20 items-center justify-center">
            <IconSymbol name="envelope.fill" size={20} color="#F97316" />
          </View>
          <View className="flex-1 ml-3">
            <Text className="text-base font-medium text-foreground">Email Verification</Text>
            <Text className="text-sm text-muted">Receive codes via email</Text>
          </View>
          {userConfig?.emailVerified ? (
            <View className="bg-success/20 px-3 py-1 rounded-full">
              <Text className="text-xs font-medium text-success">Enabled</Text>
            </View>
          ) : (
            <IconSymbol name="chevron.right" size={20} color={colors.muted} />
          )}
        </TouchableOpacity>
      </View>

      {/* Backup Codes */}
      <View className="bg-surface rounded-2xl p-5 border border-border">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-full bg-gray-500/20 items-center justify-center">
              <IconSymbol name="key.fill" size={20} color={colors.muted} />
            </View>
            <View>
              <Text className="text-base font-medium text-foreground">Backup Codes</Text>
              <Text className="text-sm text-muted">
                {userConfig ? `${userConfig.backupCodes.length - userConfig.backupCodesUsed.length} remaining` : '0 remaining'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            className="bg-primary/10 px-4 py-2 rounded-lg"
            onPress={handleRegenerateBackupCodes}
            disabled={isLoading}
          >
            <Text className="text-primary font-medium">Regenerate</Text>
          </TouchableOpacity>
        </View>
        <Text className="text-sm text-muted">
          Use backup codes to access your account if you lose access to your MFA devices.
        </Text>
      </View>
    </View>
  );

  const renderTOTPSetup = () => (
    <View className="gap-6">
      <TouchableOpacity
        className="flex-row items-center gap-2"
        onPress={() => setCurrentStep('overview')}
      >
        <IconSymbol name="chevron.left.forwardslash.chevron.right" size={20} color={colors.primary} />
        <Text className="text-primary font-medium">Back</Text>
      </TouchableOpacity>

      <View className="bg-surface rounded-2xl p-5 border border-border">
        <Text className="text-xl font-bold text-foreground mb-2">Set Up Authenticator</Text>
        <Text className="text-sm text-muted mb-6">
          Scan the QR code or enter the secret key in your authenticator app.
        </Text>

        {/* QR Code Placeholder */}
        <View className="bg-white rounded-xl p-4 items-center mb-4">
          <View className="w-48 h-48 bg-gray-200 rounded-lg items-center justify-center">
            <Text className="text-gray-500 text-center">QR Code{'\n'}(Scan with app)</Text>
          </View>
        </View>

        {/* Secret Key */}
        <View className="bg-background rounded-lg p-3 mb-6">
          <Text className="text-xs text-muted mb-1">Secret Key (manual entry)</Text>
          <Text className="text-sm font-mono text-foreground" selectable>{totpSecret}</Text>
        </View>

        {/* Verification */}
        <Text className="text-sm font-medium text-foreground mb-2">Enter verification code</Text>
        <TextInput
          className="bg-background border border-border rounded-lg px-4 py-3 text-foreground text-lg text-center tracking-widest mb-4"
          placeholder="000000"
          placeholderTextColor={colors.muted}
          value={verificationCode}
          onChangeText={setVerificationCode}
          keyboardType="number-pad"
          maxLength={6}
        />

        <TouchableOpacity
          className="bg-primary rounded-xl py-4 items-center"
          onPress={handleVerifyTOTP}
          disabled={isLoading || verificationCode.length !== 6}
          style={{ opacity: isLoading || verificationCode.length !== 6 ? 0.5 : 1 }}
        >
          <Text className="text-white font-semibold text-base">
            {isLoading ? 'Verifying...' : 'Verify & Enable'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSMSSetup = () => (
    <View className="gap-6">
      <TouchableOpacity
        className="flex-row items-center gap-2"
        onPress={() => setCurrentStep('overview')}
      >
        <IconSymbol name="chevron.left.forwardslash.chevron.right" size={20} color={colors.primary} />
        <Text className="text-primary font-medium">Back</Text>
      </TouchableOpacity>

      <View className="bg-surface rounded-2xl p-5 border border-border">
        <Text className="text-xl font-bold text-foreground mb-2">SMS Verification</Text>
        <Text className="text-sm text-muted mb-6">
          Enter your mobile number to receive verification codes via SMS.
        </Text>

        <Text className="text-sm font-medium text-foreground mb-2">Mobile Number</Text>
        <TextInput
          className="bg-background border border-border rounded-lg px-4 py-3 text-foreground mb-4"
          placeholder="+61 400 000 000"
          placeholderTextColor={colors.muted}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
        />

        <TouchableOpacity
          className="bg-primary rounded-xl py-4 items-center"
          onPress={() => {
            Alert.alert('SMS Sent', 'A verification code has been sent to your phone.');
          }}
          disabled={isLoading || !phoneNumber}
          style={{ opacity: isLoading || !phoneNumber ? 0.5 : 1 }}
        >
          <Text className="text-white font-semibold text-base">Send Verification Code</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmailSetup = () => (
    <View className="gap-6">
      <TouchableOpacity
        className="flex-row items-center gap-2"
        onPress={() => setCurrentStep('overview')}
      >
        <IconSymbol name="chevron.left.forwardslash.chevron.right" size={20} color={colors.primary} />
        <Text className="text-primary font-medium">Back</Text>
      </TouchableOpacity>

      <View className="bg-surface rounded-2xl p-5 border border-border">
        <Text className="text-xl font-bold text-foreground mb-2">Email Verification</Text>
        <Text className="text-sm text-muted mb-6">
          Enter your email address to receive verification codes.
        </Text>

        <Text className="text-sm font-medium text-foreground mb-2">Email Address</Text>
        <TextInput
          className="bg-background border border-border rounded-lg px-4 py-3 text-foreground mb-4"
          placeholder="doctor@hospital.com"
          placeholderTextColor={colors.muted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TouchableOpacity
          className="bg-primary rounded-xl py-4 items-center"
          onPress={() => {
            Alert.alert('Email Sent', 'A verification code has been sent to your email.');
          }}
          disabled={isLoading || !email}
          style={{ opacity: isLoading || !email ? 0.5 : 1 }}
        >
          <Text className="text-white font-semibold text-base">Send Verification Code</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScreenContainer>
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-foreground">MFA Setup</Text>
          <Text className="text-base text-muted mt-1">
            Secure your account with multi-factor authentication
          </Text>
        </View>

        {currentStep === 'overview' && renderOverview()}
        {currentStep === 'totp' && renderTOTPSetup()}
        {currentStep === 'sms' && renderSMSSetup()}
        {currentStep === 'email' && renderEmailSetup()}
      </ScrollView>
    </ScreenContainer>
  );
}
