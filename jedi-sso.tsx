import { useState } from 'react';
import { ScrollView, Text, View, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { JobRole, ROLE_CONFIGS, AuthorityLevel } from '@/lib/role-config';

// Auth Provider Types
type AuthProvider = 'microsoft' | 'google' | 'apple' | 'jedi' | 'email';

interface AuthProviderConfig {
  id: AuthProvider;
  name: string;
  icon: string;
  color: string;
  description: string;
}

const AUTH_PROVIDERS: AuthProviderConfig[] = [
  {
    id: 'jedi',
    name: 'JEDI SSO',
    icon: '⚡',
    color: '#8B5CF6',
    description: 'Sign in with JEDI Integrated Systems',
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    icon: '🪟',
    color: '#0078D4',
    description: 'Azure AD / Office 365',
  },
  {
    id: 'google',
    name: 'Google',
    icon: '🔵',
    color: '#4285F4',
    description: 'Google Workspace',
  },
  {
    id: 'apple',
    name: 'Apple',
    icon: '🍎',
    color: '#000000',
    description: 'Sign in with Apple',
  },
  {
    id: 'email',
    name: 'Email',
    icon: '📧',
    color: '#64748B',
    description: 'Email & Password',
  },
];

// JEDI Organizations
const JEDI_ORGS = [
  { id: 'jeditek', name: 'JediTek', domain: 'jeditek.com.au' },
  { id: 'wongi', name: 'WONGI Health', domain: 'wongi.com.au' },
  { id: 'smpo', name: 'SMPO.ink', domain: 'smpo.ink' },
  { id: 'nexus', name: 'Nexus Beacon', domain: 'nexus.jeditek.net' },
  { id: 'iskool', name: 'iSkoolEDU', domain: 'iskooledu.jeditek.com.au' },
];

export default function JediSSOScreen() {
  const colors = useColors();
  const router = useRouter();
  const [selectedProvider, setSelectedProvider] = useState<AuthProvider | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [showRoleSelect, setShowRoleSelect] = useState(false);
  const [selectedRole, setSelectedRole] = useState<JobRole>('doctor');

  const handleProviderSelect = (provider: AuthProvider) => {
    setSelectedProvider(provider);
    if (provider === 'jedi') {
      // Show org selector for JEDI SSO
      setSelectedOrg(null);
    }
  };

  const handleAuth = async () => {
    setIsLoading(true);
    
    try {
      // Simulate authentication delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create user session
      const roleConfig = ROLE_CONFIGS[selectedRole];
      const user = {
        id: Date.now().toString(),
        name: email.split('@')[0] || 'JEDI User',
        email: email || 'user@jeditek.com.au',
        role: selectedRole,
        department: roleConfig.department,
        authorityLevel: roleConfig.authorityLevel,
        provider: selectedProvider,
        organization: selectedOrg || 'jeditek',
        authenticatedAt: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem('medivac_user', JSON.stringify(user));
      await AsyncStorage.setItem('medivac_user_role', JSON.stringify(user));
      await AsyncStorage.setItem('medivac_auth_token', `jedi_${Date.now()}_${Math.random().toString(36)}`);
      
      Alert.alert(
        'Authentication Successful',
        `Welcome ${user.name}!\nRole: ${roleConfig.displayName}\nOrganization: ${selectedOrg || 'JediTek'}`,
        [
          {
            text: 'Continue',
            onPress: () => router.replace('/role-dashboard'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Authentication Failed', 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderProviderForm = () => {
    if (!selectedProvider) return null;

    if (selectedProvider === 'jedi') {
      return (
        <View className="mt-4">
          <Text className="text-foreground font-bold text-lg mb-3">Select Organization</Text>
          {JEDI_ORGS.map(org => (
            <TouchableOpacity
              key={org.id}
              className="mb-2"
              onPress={() => setSelectedOrg(org.id)}
            >
              <View 
                className="p-4 rounded-xl flex-row items-center"
                style={{
                  backgroundColor: selectedOrg === org.id ? colors.primary + '20' : colors.surface,
                  borderWidth: selectedOrg === org.id ? 2 : 1,
                  borderColor: selectedOrg === org.id ? colors.primary : colors.border,
                }}
              >
                <Text className="text-2xl mr-3">🏢</Text>
                <View className="flex-1">
                  <Text className="text-foreground font-semibold">{org.name}</Text>
                  <Text className="text-muted text-sm">{org.domain}</Text>
                </View>
                {selectedOrg === org.id && (
                  <Text className="text-primary text-xl">✓</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
          
          {selectedOrg && (
            <View className="mt-4">
              <TextInput
                className="bg-surface border border-border rounded-xl p-4 text-foreground mb-3"
                placeholder="Email"
                placeholderTextColor={colors.muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                className="bg-surface border border-border rounded-xl p-4 text-foreground mb-3"
                placeholder="Password"
                placeholderTextColor={colors.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              
              <TouchableOpacity
                className="mb-3"
                onPress={() => setShowRoleSelect(!showRoleSelect)}
              >
                <View className="bg-surface border border-border rounded-xl p-4 flex-row items-center">
                  <Text className="text-2xl mr-3">{ROLE_CONFIGS[selectedRole].icon}</Text>
                  <View className="flex-1">
                    <Text className="text-muted text-sm">Role</Text>
                    <Text className="text-foreground font-semibold">
                      {ROLE_CONFIGS[selectedRole].displayName}
                    </Text>
                  </View>
                  <Text className="text-muted">▼</Text>
                </View>
              </TouchableOpacity>
              
              {showRoleSelect && (
                <View className="bg-surface border border-border rounded-xl mb-3 max-h-60 overflow-hidden">
                  <ScrollView>
                    {Object.values(ROLE_CONFIGS).map(config => (
                      <TouchableOpacity
                        key={config.role}
                        className="flex-row items-center p-3 border-b border-border"
                        onPress={() => {
                          setSelectedRole(config.role);
                          setShowRoleSelect(false);
                        }}
                      >
                        <Text className="text-xl mr-2">{config.icon}</Text>
                        <Text className="text-foreground flex-1">{config.displayName}</Text>
                        {selectedRole === config.role && (
                          <Text className="text-primary">✓</Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          )}
        </View>
      );
    }

    // Other providers (Microsoft, Google, Apple, Email)
    return (
      <View className="mt-4">
        <TextInput
          className="bg-surface border border-border rounded-xl p-4 text-foreground mb-3"
          placeholder="Email"
          placeholderTextColor={colors.muted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        {selectedProvider === 'email' && (
          <TextInput
            className="bg-surface border border-border rounded-xl p-4 text-foreground mb-3"
            placeholder="Password"
            placeholderTextColor={colors.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        )}
        
        <TouchableOpacity
          className="mb-3"
          onPress={() => setShowRoleSelect(!showRoleSelect)}
        >
          <View className="bg-surface border border-border rounded-xl p-4 flex-row items-center">
            <Text className="text-2xl mr-3">{ROLE_CONFIGS[selectedRole].icon}</Text>
            <View className="flex-1">
              <Text className="text-muted text-sm">Role</Text>
              <Text className="text-foreground font-semibold">
                {ROLE_CONFIGS[selectedRole].displayName}
              </Text>
            </View>
            <Text className="text-muted">▼</Text>
          </View>
        </TouchableOpacity>
        
        {showRoleSelect && (
          <View className="bg-surface border border-border rounded-xl mb-3 max-h-60 overflow-hidden">
            <ScrollView>
              {Object.values(ROLE_CONFIGS).map(config => (
                <TouchableOpacity
                  key={config.role}
                  className="flex-row items-center p-3 border-b border-border"
                  onPress={() => {
                    setSelectedRole(config.role);
                    setShowRoleSelect(false);
                  }}
                >
                  <Text className="text-xl mr-2">{config.icon}</Text>
                  <Text className="text-foreground flex-1">{config.displayName}</Text>
                  {selectedRole === config.role && (
                    <Text className="text-primary">✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    );
  };

  const canSubmit = () => {
    if (!selectedProvider) return false;
    if (selectedProvider === 'jedi' && !selectedOrg) return false;
    if (selectedProvider === 'email' && (!email || !password)) return false;
    if (['microsoft', 'google', 'apple'].includes(selectedProvider) && !email) return false;
    return true;
  };

  return (
    <ScreenContainer>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-5 pt-6 pb-4 items-center">
          <View 
            className="w-20 h-20 rounded-2xl items-center justify-center mb-4"
            style={{ backgroundColor: '#8B5CF6' + '20' }}
          >
            <Text className="text-5xl">⚡</Text>
          </View>
          <Text className="text-foreground text-2xl font-bold text-center">JEDI Integrated SSO</Text>
          <Text className="text-muted text-center mt-1">Single Sign-On for MediVac One</Text>
        </View>

        {/* Provider Selection */}
        <View className="px-5 mb-4">
          <Text className="text-foreground font-bold text-lg mb-3">Choose Sign-In Method</Text>
          {AUTH_PROVIDERS.map(provider => (
            <TouchableOpacity
              key={provider.id}
              className="mb-2"
              onPress={() => handleProviderSelect(provider.id)}
            >
              <View 
                className="p-4 rounded-xl flex-row items-center"
                style={{
                  backgroundColor: selectedProvider === provider.id ? provider.color + '20' : colors.surface,
                  borderWidth: selectedProvider === provider.id ? 2 : 1,
                  borderColor: selectedProvider === provider.id ? provider.color : colors.border,
                }}
              >
                <View 
                  className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                  style={{ backgroundColor: provider.color + '20' }}
                >
                  <Text className="text-2xl">{provider.icon}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-foreground font-semibold">{provider.name}</Text>
                  <Text className="text-muted text-sm">{provider.description}</Text>
                </View>
                {selectedProvider === provider.id && (
                  <Text style={{ color: provider.color }} className="text-xl">✓</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Provider Form */}
        <View className="px-5">
          {renderProviderForm()}
        </View>

        {/* Submit Button */}
        {selectedProvider && (
          <View className="px-5 mt-4 mb-8">
            <TouchableOpacity
              className="p-4 rounded-xl flex-row items-center justify-center"
              style={{ 
                backgroundColor: canSubmit() ? colors.primary : colors.muted,
                opacity: canSubmit() ? 1 : 0.5,
              }}
              onPress={handleAuth}
              disabled={!canSubmit() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text className="text-white font-bold text-lg">
                    {selectedProvider === 'email' ? 'Sign In' : `Continue with ${AUTH_PROVIDERS.find(p => p.id === selectedProvider)?.name}`}
                  </Text>
                </>
              )}
            </TouchableOpacity>
            
            {/* Register Link */}
            <TouchableOpacity className="mt-4 items-center">
              <Text className="text-muted">
                Don't have an account? <Text className="text-primary font-semibold">Register</Text>
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Footer */}
        <View className="px-5 pb-8 items-center">
          <Text className="text-muted text-xs text-center">
            By signing in, you agree to the JEDI Systems Terms of Service and Privacy Policy.
          </Text>
          <Text className="text-muted text-xs mt-2">
            © 2024 SMPO.INK • JediTek.net
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
