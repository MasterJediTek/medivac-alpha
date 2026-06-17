import { useState, useEffect } from 'react';
import { ScrollView, Text, View, TouchableOpacity, TextInput, Alert, ActivityIndicator, Linking } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useRouter } from 'expo-router';
import {
  OAuthProvider,
  OAuthCredentials,
  OAUTH_PROVIDERS,
  getOAuthCredentials,
  saveOAuthCredentials,
  validateOAuthCredentials,
  setOAuthProviderEnabled,
  testOAuthConnection,
  exportOAuthConfig,
} from '@/lib/oauth-config';

export default function OAuthConfigScreen() {
  const colors = useColors();
  const router = useRouter();
  const [credentials, setCredentials] = useState<Record<OAuthProvider, OAuthCredentials> | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<OAuthProvider | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [testResults, setTestResults] = useState<Record<OAuthProvider, { success: boolean; latency?: number } | null>>({
    microsoft: null,
    google: null,
    apple: null,
    jedi: null,
  });

  // Form state for editing
  const [editForm, setEditForm] = useState<Partial<OAuthCredentials>>({});

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    setIsLoading(true);
    try {
      const creds = await getOAuthCredentials();
      setCredentials(creds);
    } catch (error) {
      Alert.alert('Error', 'Failed to load OAuth credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProviderSelect = (provider: OAuthProvider) => {
    setSelectedProvider(provider);
    if (credentials) {
      setEditForm({ ...credentials[provider] });
    }
  };

  const handleSave = async () => {
    if (!selectedProvider) return;
    
    setIsSaving(true);
    try {
      await saveOAuthCredentials(selectedProvider, editForm);
      await loadCredentials();
      Alert.alert('Success', 'OAuth credentials saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save credentials');
    } finally {
      setIsSaving(false);
    }
  };

  const handleValidate = async (provider: OAuthProvider) => {
    setIsSaving(true);
    try {
      const result = await validateOAuthCredentials(provider);
      if (result.valid) {
        Alert.alert('Valid', 'OAuth credentials are valid');
        await loadCredentials();
      } else {
        Alert.alert('Invalid', result.error || 'Credentials validation failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Validation failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async (provider: OAuthProvider) => {
    setTestResults(prev => ({ ...prev, [provider]: null }));
    const result = await testOAuthConnection(provider);
    setTestResults(prev => ({ ...prev, [provider]: result }));
  };

  const handleToggleEnabled = async (provider: OAuthProvider) => {
    if (!credentials) return;
    const newEnabled = !credentials[provider].enabled;
    await setOAuthProviderEnabled(provider, newEnabled);
    await loadCredentials();
  };

  const handleExport = async () => {
    try {
      const config = await exportOAuthConfig();
      Alert.alert('Export', 'Configuration copied to clipboard (in production, this would be saved to a file)');
      console.log('OAuth Config Export:', config);
    } catch (error) {
      Alert.alert('Error', 'Failed to export configuration');
    }
  };

  const openHelp = (provider: OAuthProvider) => {
    const config = OAUTH_PROVIDERS[provider];
    Linking.openURL(config.helpUrl);
  };

  if (isLoading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-muted mt-4">Loading OAuth Configuration...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-5 pt-6 pb-4">
          <Text className="text-foreground text-2xl font-bold">OAuth Configuration</Text>
          <Text className="text-muted mt-1">Configure authentication providers for JEDI SSO</Text>
        </View>

        {/* Provider Cards */}
        <View className="px-5 mb-4">
          {(Object.keys(OAUTH_PROVIDERS) as OAuthProvider[]).map(provider => {
            const config = OAUTH_PROVIDERS[provider];
            const creds = credentials?.[provider];
            const testResult = testResults[provider];
            
            return (
              <View key={provider} className="mb-4">
                <TouchableOpacity
                  onPress={() => handleProviderSelect(provider)}
                  activeOpacity={0.7}
                >
                  <View 
                    className="rounded-xl p-4 border"
                    style={{
                      backgroundColor: selectedProvider === provider ? config.color + '10' : colors.surface,
                      borderColor: selectedProvider === provider ? config.color : colors.border,
                      borderWidth: selectedProvider === provider ? 2 : 1,
                    }}
                  >
                    <View className="flex-row items-center justify-between mb-3">
                      <View className="flex-row items-center">
                        <View 
                          className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                          style={{ backgroundColor: config.color + '20' }}
                        >
                          <Text className="text-2xl">{config.icon}</Text>
                        </View>
                        <View>
                          <Text className="text-foreground font-bold text-lg">{config.displayName}</Text>
                          <View className="flex-row items-center gap-2 mt-1">
                            <View 
                              className="px-2 py-0.5 rounded-full"
                              style={{ 
                                backgroundColor: creds?.enabled ? colors.success + '20' : colors.muted + '20' 
                              }}
                            >
                              <Text 
                                style={{ 
                                  color: creds?.enabled ? colors.success : colors.muted,
                                  fontSize: 10,
                                  fontWeight: '600',
                                }}
                              >
                                {creds?.enabled ? 'ENABLED' : 'DISABLED'}
                              </Text>
                            </View>
                            {creds?.validated && (
                              <View 
                                className="px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: colors.primary + '20' }}
                              >
                                <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '600' }}>
                                  VALIDATED
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </View>
                      
                      {/* Toggle Switch */}
                      <TouchableOpacity
                        onPress={() => handleToggleEnabled(provider)}
                        className="p-2"
                      >
                        <View 
                          className="w-12 h-7 rounded-full justify-center"
                          style={{ 
                            backgroundColor: creds?.enabled ? colors.success : colors.muted + '40',
                            paddingHorizontal: 2,
                          }}
                        >
                          <View 
                            className="w-6 h-6 rounded-full bg-white"
                            style={{ 
                              alignSelf: creds?.enabled ? 'flex-end' : 'flex-start',
                            }}
                          />
                        </View>
                      </TouchableOpacity>
                    </View>

                    {/* Quick Actions */}
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        className="flex-1 py-2 rounded-lg items-center"
                        style={{ backgroundColor: colors.primary + '20' }}
                        onPress={() => handleTest(provider)}
                      >
                        <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 12 }}>
                          {testResult === null ? 'Test' : testResult.success ? `✓ ${testResult.latency}ms` : '✗ Failed'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="flex-1 py-2 rounded-lg items-center"
                        style={{ backgroundColor: colors.muted + '20' }}
                        onPress={() => openHelp(provider)}
                      >
                        <Text style={{ color: colors.muted, fontWeight: '600', fontSize: 12 }}>
                          Setup Guide
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Expanded Configuration Form */}
                {selectedProvider === provider && (
                  <View 
                    className="mt-2 p-4 rounded-xl border"
                    style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                  >
                    <Text className="text-foreground font-bold mb-3">Configuration</Text>
                    
                    {/* Client ID */}
                    <View className="mb-3">
                      <Text className="text-muted text-sm mb-1">Client ID *</Text>
                      <TextInput
                        className="bg-background border border-border rounded-lg p-3 text-foreground"
                        placeholder="Enter client ID"
                        placeholderTextColor={colors.muted}
                        value={editForm.clientId || ''}
                        onChangeText={(text) => setEditForm(prev => ({ ...prev, clientId: text }))}
                        autoCapitalize="none"
                      />
                    </View>

                    {/* Client Secret (optional for some providers) */}
                    {provider !== 'apple' && (
                      <View className="mb-3">
                        <Text className="text-muted text-sm mb-1">Client Secret</Text>
                        <TextInput
                          className="bg-background border border-border rounded-lg p-3 text-foreground"
                          placeholder="Enter client secret (optional)"
                          placeholderTextColor={colors.muted}
                          value={editForm.clientSecret || ''}
                          onChangeText={(text) => setEditForm(prev => ({ ...prev, clientSecret: text }))}
                          secureTextEntry
                          autoCapitalize="none"
                        />
                      </View>
                    )}

                    {/* Tenant ID (Microsoft only) */}
                    {provider === 'microsoft' && (
                      <View className="mb-3">
                        <Text className="text-muted text-sm mb-1">Tenant ID</Text>
                        <TextInput
                          className="bg-background border border-border rounded-lg p-3 text-foreground"
                          placeholder="common, organizations, or tenant GUID"
                          placeholderTextColor={colors.muted}
                          value={editForm.tenantId || 'common'}
                          onChangeText={(text) => setEditForm(prev => ({ ...prev, tenantId: text }))}
                          autoCapitalize="none"
                        />
                      </View>
                    )}

                    {/* Redirect URI */}
                    <View className="mb-3">
                      <Text className="text-muted text-sm mb-1">Redirect URI</Text>
                      <TextInput
                        className="bg-background border border-border rounded-lg p-3 text-foreground"
                        placeholder="medivac://auth/callback"
                        placeholderTextColor={colors.muted}
                        value={editForm.redirectUri || ''}
                        onChangeText={(text) => setEditForm(prev => ({ ...prev, redirectUri: text }))}
                        autoCapitalize="none"
                      />
                    </View>

                    {/* Scopes */}
                    <View className="mb-4">
                      <Text className="text-muted text-sm mb-1">Scopes</Text>
                      <View className="flex-row flex-wrap gap-1">
                        {(editForm.scopes || config.defaultScopes).map((scope, idx) => (
                          <View 
                            key={idx}
                            className="px-2 py-1 rounded-full"
                            style={{ backgroundColor: colors.primary + '20' }}
                          >
                            <Text style={{ color: colors.primary, fontSize: 11 }}>{scope}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Action Buttons */}
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        className="flex-1 py-3 rounded-lg items-center"
                        style={{ backgroundColor: colors.primary }}
                        onPress={handleSave}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <ActivityIndicator color="white" size="small" />
                        ) : (
                          <Text className="text-white font-bold">Save</Text>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="flex-1 py-3 rounded-lg items-center"
                        style={{ backgroundColor: colors.success + '20' }}
                        onPress={() => handleValidate(provider)}
                        disabled={isSaving}
                      >
                        <Text style={{ color: colors.success, fontWeight: '600' }}>Validate</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Export/Import Section */}
        <View className="px-5 mb-8">
          <View 
            className="p-4 rounded-xl border"
            style={{ backgroundColor: colors.surface, borderColor: colors.border }}
          >
            <Text className="text-foreground font-bold mb-3">Backup & Restore</Text>
            <View className="flex-row gap-2">
              <TouchableOpacity
                className="flex-1 py-3 rounded-lg items-center"
                style={{ backgroundColor: colors.muted + '20' }}
                onPress={handleExport}
              >
                <Text style={{ color: colors.foreground, fontWeight: '600' }}>Export Config</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-3 rounded-lg items-center"
                style={{ backgroundColor: colors.muted + '20' }}
                onPress={() => Alert.alert('Import', 'Import functionality would open file picker')}
              >
                <Text style={{ color: colors.foreground, fontWeight: '600' }}>Import Config</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Help Section */}
        <View className="px-5 pb-8">
          <View 
            className="p-4 rounded-xl"
            style={{ backgroundColor: colors.primary + '10' }}
          >
            <Text className="text-foreground font-bold mb-2">Setup Instructions</Text>
            <Text className="text-muted text-sm leading-5">
              1. Create an OAuth application in your provider's developer console{'\n'}
              2. Copy the Client ID and Client Secret (if applicable){'\n'}
              3. Set the Redirect URI to: medivac://auth/callback{'\n'}
              4. Enable the required scopes for your organization{'\n'}
              5. Test the connection and validate credentials
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
