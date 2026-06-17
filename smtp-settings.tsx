/**
 * SMTP Server Configuration Screen
 * Full settings UI for mail server setup
 * MediVac One v5.4
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { smtpConfigurationService, type SMTPConfig, type EncryptionType, type AuthMethod } from '@/lib/services/smtp-configuration-service';

export default function SMTPSettingsScreen() {
  const colors = useColors();
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Current config ID
  const [currentConfigId, setCurrentConfigId] = useState<string | null>(null);
  
  // SMTP Configuration State
  const [name, setName] = useState('Default SMTP');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('587');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [fromName, setFromName] = useState('MediVac One');
  const [encryption, setEncryption] = useState<EncryptionType>('tls');
  const [authMethod, setAuthMethod] = useState<AuthMethod>('plain');
  
  // Queue Stats
  const [queueStats, setQueueStats] = useState({ pending: 0, sending: 0, sent: 0, failed: 0 });
  
  // Test Results
  const [lastTestResult, setLastTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    loadConfiguration();
    loadQueueStats();
  }, []);

  const loadConfiguration = async () => {
    setIsLoading(true);
    try {
      await smtpConfigurationService.initialize();
      const configs = smtpConfigurationService.getConfigs();
      if (configs.length > 0) {
        const config = configs[0];
        setCurrentConfigId(config.id);
        setName(config.name);
        setHost(config.host);
        setPort(config.port.toString());
        setUsername(config.username || '');
        setPassword(config.password || '');
        setFromEmail(config.fromAddress);
        setFromName(config.fromName);
        setEncryption(config.encryption);
        setAuthMethod(config.authMethod);
        if (config.testResult) {
          setLastTestResult({ 
            success: config.testResult === 'success', 
            message: config.testResult === 'success' ? 'Connection successful' : 'Connection failed' 
          });
        }
      }
    } catch (error) {
      console.error('Failed to load SMTP config:', error);
    }
    setIsLoading(false);
  };

  const loadQueueStats = async () => {
    const stats = await smtpConfigurationService.getQueueStats();
    setQueueStats(stats);
  };

  const handleTestConnection = async () => {
    if (!currentConfigId) {
      Alert.alert('Error', 'Please save configuration first');
      return;
    }
    
    setIsTesting(true);
    setLastTestResult(null);
    
    try {
      const result = await smtpConfigurationService.testConnection(currentConfigId);
      setLastTestResult(result);
      
      if (result.success) {
        Alert.alert('Success', 'SMTP connection test passed!');
      } else {
        Alert.alert('Failed', result.message);
      }
    } catch (error) {
      setLastTestResult({ success: false, message: 'Connection test failed' });
      Alert.alert('Error', 'Failed to test connection');
    }
    
    setIsTesting(false);
  };

  const handleSaveConfiguration = async () => {
    if (!host || !port || !fromEmail) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }
    
    setIsSaving(true);
    
    try {
      const config: Partial<SMTPConfig> = {
        id: currentConfigId || undefined,
        name,
        host,
        port: parseInt(port, 10),
        encryption,
        authMethod,
        username: username || undefined,
        password: password || undefined,
        fromAddress: fromEmail,
        fromName,
        maxRetries: 3,
        retryDelaySeconds: 60,
        timeout: 30000,
        isDefault: true,
        isActive: true,
      };
      
      const saved = await smtpConfigurationService.saveConfig(config);
      setCurrentConfigId(saved.id);
      Alert.alert('Success', 'SMTP configuration saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save configuration');
    }
    
    setIsSaving(false);
  };

  const handleSendTestEmail = async () => {
    const testEmail = fromEmail || 'test@example.com';
    
    try {
      await smtpConfigurationService.queueEmail({
        to: [testEmail],
        subject: 'MediVac One - Test Email',
        body: 'This is a test email from MediVac One SMTP configuration.',
        priority: 'high',
        smtpConfigId: currentConfigId || undefined,
      });
      
      Alert.alert('Queued', 'Test email has been queued for delivery');
      loadQueueStats();
    } catch (error) {
      Alert.alert('Error', 'Failed to queue test email');
    }
  };

  const encryptionOptions: { value: EncryptionType; label: string }[] = [
    { value: 'none', label: 'None' },
    { value: 'tls', label: 'TLS' },
    { value: 'ssl', label: 'SSL' },
  ];

  const authMethods: { value: AuthMethod; label: string }[] = [
    { value: 'none', label: 'None' },
    { value: 'plain', label: 'PLAIN' },
    { value: 'login', label: 'LOGIN' },
    { value: 'oauth2', label: 'OAuth2' },
  ];

  if (isLoading) {
    return (
      <ScreenContainer>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-muted mt-4">Loading configuration...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 px-4 py-6">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-foreground mb-2">
            📧 SMTP Configuration
          </Text>
          <Text className="text-muted">
            Configure your mail server for email delivery
          </Text>
        </View>

        {/* Connection Status */}
        <View 
          className="rounded-2xl p-4 mb-4"
          style={{ 
            backgroundColor: lastTestResult 
              ? (lastTestResult.success ? '#10B98120' : '#EF444420')
              : colors.surface 
          }}
        >
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-foreground">Connection Status</Text>
            <View 
              className="px-3 py-1 rounded-full"
              style={{ 
                backgroundColor: lastTestResult 
                  ? (lastTestResult.success ? '#10B981' : '#EF4444')
                  : colors.border 
              }}
            >
              <Text className="text-white text-sm font-medium">
                {lastTestResult ? (lastTestResult.success ? 'CONNECTED' : 'FAILED') : 'NOT TESTED'}
              </Text>
            </View>
          </View>
          {lastTestResult && (
            <Text className="text-muted mt-2">{lastTestResult.message}</Text>
          )}
        </View>

        {/* Queue Statistics */}
        <View 
          className="rounded-2xl p-4 mb-6"
          style={{ backgroundColor: colors.surface }}
        >
          <Text className="text-lg font-semibold text-foreground mb-3">📊 Email Queue</Text>
          <View className="flex-row flex-wrap gap-2">
            <View className="flex-1 min-w-[70px] items-center p-2 rounded-lg" style={{ backgroundColor: '#F59E0B20' }}>
              <Text className="text-2xl font-bold text-warning">{queueStats.pending}</Text>
              <Text className="text-xs text-muted">Pending</Text>
            </View>
            <View className="flex-1 min-w-[70px] items-center p-2 rounded-lg" style={{ backgroundColor: '#3B82F620' }}>
              <Text className="text-2xl font-bold text-primary">{queueStats.sending}</Text>
              <Text className="text-xs text-muted">Sending</Text>
            </View>
            <View className="flex-1 min-w-[70px] items-center p-2 rounded-lg" style={{ backgroundColor: '#10B98120' }}>
              <Text className="text-2xl font-bold text-success">{queueStats.sent}</Text>
              <Text className="text-xs text-muted">Sent</Text>
            </View>
            <View className="flex-1 min-w-[70px] items-center p-2 rounded-lg" style={{ backgroundColor: '#EF444420' }}>
              <Text className="text-2xl font-bold text-error">{queueStats.failed}</Text>
              <Text className="text-xs text-muted">Failed</Text>
            </View>
          </View>
        </View>

        {/* Server Settings */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-foreground mb-3">🖥️ Server Settings</Text>
          
          <View className="mb-4">
            <Text className="text-muted mb-1">Configuration Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Default SMTP"
              placeholderTextColor={colors.muted}
              className="px-4 py-3 rounded-xl text-foreground"
              style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
            />
          </View>
          
          <View className="mb-4">
            <Text className="text-muted mb-1">SMTP Host *</Text>
            <TextInput
              value={host}
              onChangeText={setHost}
              placeholder="smtp.example.com"
              placeholderTextColor={colors.muted}
              className="px-4 py-3 rounded-xl text-foreground"
              style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
            />
          </View>
          
          <View className="mb-4">
            <Text className="text-muted mb-1">Port *</Text>
            <TextInput
              value={port}
              onChangeText={setPort}
              placeholder="587"
              placeholderTextColor={colors.muted}
              keyboardType="numeric"
              className="px-4 py-3 rounded-xl text-foreground"
              style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
            />
          </View>
          
          <View className="mb-4">
            <Text className="text-muted mb-2">Encryption</Text>
            <View className="flex-row gap-2">
              {encryptionOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => setEncryption(option.value)}
                  className="flex-1 py-3 rounded-xl items-center"
                  style={{ 
                    backgroundColor: encryption === option.value ? colors.primary : colors.surface,
                    borderWidth: 1,
                    borderColor: encryption === option.value ? colors.primary : colors.border,
                  }}
                >
                  <Text style={{ color: encryption === option.value ? '#fff' : colors.foreground }}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Authentication */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-foreground mb-3">🔑 Authentication</Text>
          
          <View className="mb-4">
            <Text className="text-muted mb-2">Auth Method</Text>
            <View className="flex-row flex-wrap gap-2">
              {authMethods.map((method) => (
                <TouchableOpacity
                  key={method.value}
                  onPress={() => setAuthMethod(method.value)}
                  className="flex-1 min-w-[70px] py-3 rounded-xl items-center"
                  style={{ 
                    backgroundColor: authMethod === method.value ? colors.primary : colors.surface,
                    borderWidth: 1,
                    borderColor: authMethod === method.value ? colors.primary : colors.border,
                  }}
                >
                  <Text style={{ color: authMethod === method.value ? '#fff' : colors.foreground }}>
                    {method.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {authMethod !== 'none' && (
            <>
              <View className="mb-4">
                <Text className="text-muted mb-1">Username</Text>
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  placeholder="your@email.com"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="none"
                  className="px-4 py-3 rounded-xl text-foreground"
                  style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
                />
              </View>
              
              <View className="mb-4">
                <Text className="text-muted mb-1">Password</Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.muted}
                  secureTextEntry
                  className="px-4 py-3 rounded-xl text-foreground"
                  style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
                />
              </View>
            </>
          )}
        </View>

        {/* Sender Settings */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-foreground mb-3">📬 Sender Settings</Text>
          
          <View className="mb-4">
            <Text className="text-muted mb-1">From Email *</Text>
            <TextInput
              value={fromEmail}
              onChangeText={setFromEmail}
              placeholder="noreply@medivac.one"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              keyboardType="email-address"
              className="px-4 py-3 rounded-xl text-foreground"
              style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
            />
          </View>
          
          <View className="mb-4">
            <Text className="text-muted mb-1">From Name</Text>
            <TextInput
              value={fromName}
              onChangeText={setFromName}
              placeholder="MediVac One"
              placeholderTextColor={colors.muted}
              className="px-4 py-3 rounded-xl text-foreground"
              style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View className="gap-3 mb-8">
          <TouchableOpacity
            onPress={handleSaveConfiguration}
            disabled={isSaving || !host || !fromEmail}
            className="py-4 rounded-xl items-center flex-row justify-center"
            style={{ 
              backgroundColor: '#10B981',
              opacity: (isSaving || !host || !fromEmail) ? 0.5 : 1
            }}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text className="text-white font-semibold">💾 Save Configuration</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={handleTestConnection}
            disabled={isTesting || !currentConfigId}
            className="py-4 rounded-xl items-center flex-row justify-center"
            style={{ 
              backgroundColor: '#3B82F6',
              opacity: (isTesting || !currentConfigId) ? 0.5 : 1
            }}
          >
            {isTesting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text className="text-white font-semibold">🔌 Test Connection</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={handleSendTestEmail}
            disabled={!currentConfigId || !fromEmail}
            className="py-4 rounded-xl items-center"
            style={{ 
              backgroundColor: '#8B5CF6',
              opacity: (!currentConfigId || !fromEmail) ? 0.5 : 1
            }}
          >
            <Text className="text-white font-semibold">📨 Send Test Email</Text>
          </TouchableOpacity>
        </View>

        {/* Common Providers */}
        <View 
          className="rounded-2xl p-4 mb-6"
          style={{ backgroundColor: colors.surface }}
        >
          <Text className="text-lg font-semibold text-foreground mb-3">📋 Common SMTP Providers</Text>
          
          {[
            { name: 'Gmail', host: 'smtp.gmail.com', port: '587' },
            { name: 'Outlook/Office 365', host: 'smtp.office365.com', port: '587' },
            { name: 'SendGrid', host: 'smtp.sendgrid.net', port: '587' },
            { name: 'Mailgun', host: 'smtp.mailgun.org', port: '587' },
            { name: 'Amazon SES', host: 'email-smtp.us-east-1.amazonaws.com', port: '587' },
          ].map((provider) => (
            <TouchableOpacity
              key={provider.name}
              onPress={() => {
                setHost(provider.host);
                setPort(provider.port);
              }}
              className="flex-row items-center justify-between py-3 border-b"
              style={{ borderColor: colors.border }}
            >
              <Text className="text-foreground">{provider.name}</Text>
              <Text className="text-muted text-sm">{provider.host}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
