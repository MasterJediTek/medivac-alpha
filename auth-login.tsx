/**
 * MediVac One - Authentication Login Screen
 * Unified login with multiple providers
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Image } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { unifiedAuth, type AuthProvider, type ProviderStatus } from '@/lib/services/unified-auth-service';

interface ProviderButton {
  provider: AuthProvider;
  name: string;
  icon: string;
  color: string;
  textColor: string;
}

const PROVIDER_BUTTONS: ProviderButton[] = [
  { provider: 'jeditek', name: 'JEDITek SSO', icon: '⚔️', color: '#1a1a2e', textColor: '#00d4ff' },
  { provider: 'azure', name: 'Microsoft 365', icon: '🪟', color: '#0078d4', textColor: '#ffffff' },
  { provider: 'google', name: 'Google', icon: '🔍', color: '#ffffff', textColor: '#4285f4' },
  { provider: 'apple', name: 'Apple', icon: '🍎', color: '#000000', textColor: '#ffffff' },
  { provider: 'claris', name: 'Claris Connect', icon: '📁', color: '#6366f1', textColor: '#ffffff' },
];

export default function AuthLoginScreen() {
  const colors = useColors();
  const [loading, setLoading] = useState<AuthProvider | null>(null);
  const [providerStatus, setProviderStatus] = useState<ProviderStatus[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    loadProviderStatus();
    setIsAuthenticated(unifiedAuth.isAuthenticated());
  }, []);

  const loadProviderStatus = async () => {
    const status = await unifiedAuth.getProviderStatus();
    setProviderStatus(status);
  };

  const handleLogin = async (provider: AuthProvider) => {
    setLoading(provider);
    setError(null);

    try {
      await unifiedAuth.loginWithProvider(provider);
      setIsAuthenticated(true);
      await loadProviderStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(null);
    }
  };

  const handleLogout = async () => {
    setLoading('jeditek'); // Use any provider as loading indicator
    try {
      await unifiedAuth.logout({ globalLogout: true });
      setIsAuthenticated(false);
      await loadProviderStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed');
    } finally {
      setLoading(null);
    }
  };

  const currentUser = unifiedAuth.getCurrentUser();
  const analytics = unifiedAuth.getAnalytics();

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16 }}>
        {/* Header */}
        <View className="items-center mb-8">
          <View className="w-20 h-20 rounded-full bg-primary/20 items-center justify-center mb-4">
            <Text style={{ fontSize: 40 }}>🔐</Text>
          </View>
          <Text className="text-2xl font-bold text-foreground">Authentication</Text>
          <Text className="text-muted text-center mt-2">
            Sign in with your preferred provider
          </Text>
        </View>

        {/* Current User Card */}
        {isAuthenticated && currentUser && (
          <View className="bg-surface rounded-2xl p-4 mb-6 border border-border">
            <View className="flex-row items-center mb-4">
              <View className="w-12 h-12 rounded-full bg-primary/20 items-center justify-center mr-3">
                <Text style={{ fontSize: 24 }}>👤</Text>
              </View>
              <View className="flex-1">
                <Text className="text-lg font-semibold text-foreground">{currentUser.displayName}</Text>
                <Text className="text-sm text-muted">{currentUser.email}</Text>
              </View>
              <View className="bg-success/20 px-3 py-1 rounded-full">
                <Text className="text-success text-xs font-medium">Connected</Text>
              </View>
            </View>

            <View className="flex-row flex-wrap gap-2 mb-4">
              <View className="bg-primary/10 px-3 py-1 rounded-full">
                <Text className="text-primary text-xs">{unifiedAuth.getProviderName(currentUser.provider)}</Text>
              </View>
              {currentUser.roles.slice(0, 3).map((role, i) => (
                <View key={i} className="bg-muted/20 px-3 py-1 rounded-full">
                  <Text className="text-muted text-xs">{role}</Text>
                </View>
              ))}
            </View>

            <Pressable
              onPress={handleLogout}
              disabled={loading !== null}
              style={({ pressed }) => [
                { opacity: pressed ? 0.7 : 1 },
              ]}
              className="bg-error/10 rounded-xl py-3 items-center"
            >
              {loading ? (
                <ActivityIndicator color={colors.error} size="small" />
              ) : (
                <Text className="text-error font-semibold">Sign Out</Text>
              )}
            </Pressable>
          </View>
        )}

        {/* Error Message */}
        {error && (
          <View className="bg-error/10 rounded-xl p-4 mb-6">
            <Text className="text-error text-center">{error}</Text>
          </View>
        )}

        {/* Provider Buttons */}
        {!isAuthenticated && (
          <View className="gap-3 mb-8">
            {PROVIDER_BUTTONS.map((btn) => {
              const status = providerStatus.find(s => s.provider === btn.provider);
              const isLoading = loading === btn.provider;

              return (
                <Pressable
                  key={btn.provider}
                  onPress={() => handleLogin(btn.provider)}
                  disabled={loading !== null}
                  style={({ pressed }) => [
                    {
                      backgroundColor: btn.color,
                      opacity: pressed ? 0.8 : loading !== null && !isLoading ? 0.5 : 1,
                      borderWidth: btn.provider === 'google' ? 1 : 0,
                      borderColor: '#e5e7eb',
                    },
                  ]}
                  className="rounded-xl py-4 px-6 flex-row items-center"
                >
                  <Text style={{ fontSize: 24, marginRight: 12 }}>{btn.icon}</Text>
                  <Text style={{ color: btn.textColor, fontWeight: '600', flex: 1 }}>
                    Continue with {btn.name}
                  </Text>
                  {isLoading && <ActivityIndicator color={btn.textColor} size="small" />}
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Linked Accounts */}
        {isAuthenticated && (
          <View className="mb-8">
            <Text className="text-lg font-semibold text-foreground mb-4">Linked Accounts</Text>
            
            {currentUser?.linkedAccounts.length === 0 ? (
              <Text className="text-muted text-center py-4">No linked accounts</Text>
            ) : (
              currentUser?.linkedAccounts.map((account, i) => (
                <View key={i} className="bg-surface rounded-xl p-4 mb-2 flex-row items-center border border-border">
                  <Text style={{ fontSize: 20, marginRight: 12 }}>
                    {PROVIDER_BUTTONS.find(b => b.provider === account.provider)?.icon || '🔗'}
                  </Text>
                  <View className="flex-1">
                    <Text className="text-foreground font-medium">
                      {unifiedAuth.getProviderName(account.provider)}
                    </Text>
                    <Text className="text-muted text-xs">{account.email}</Text>
                  </View>
                  <Text className="text-muted text-xs">
                    {new Date(account.linkedAt).toLocaleDateString()}
                  </Text>
                </View>
              ))
            )}

            <Pressable
              onPress={() => {/* Open link account modal */}}
              className="bg-primary/10 rounded-xl py-3 items-center mt-2"
            >
              <Text className="text-primary font-semibold">+ Link Another Account</Text>
            </Pressable>
          </View>
        )}

        {/* Analytics */}
        {isAuthenticated && (
          <View className="bg-surface rounded-2xl p-4 border border-border">
            <Text className="text-lg font-semibold text-foreground mb-4">Login Analytics</Text>
            
            <View className="flex-row flex-wrap gap-4">
              <View className="flex-1 min-w-[120px] bg-background rounded-xl p-3">
                <Text className="text-2xl font-bold text-primary">{analytics.totalLogins}</Text>
                <Text className="text-muted text-xs">Total Logins</Text>
              </View>
              <View className="flex-1 min-w-[120px] bg-background rounded-xl p-3">
                <Text className="text-2xl font-bold text-success">{analytics.deviceCount}</Text>
                <Text className="text-muted text-xs">Devices</Text>
              </View>
              <View className="flex-1 min-w-[120px] bg-background rounded-xl p-3">
                <Text className="text-2xl font-bold text-warning">{analytics.failedAttempts}</Text>
                <Text className="text-muted text-xs">Failed Attempts</Text>
              </View>
            </View>

            <View className="mt-4">
              <Text className="text-sm font-medium text-foreground mb-2">Logins by Provider</Text>
              {Object.entries(analytics.loginsByProvider).map(([provider, count]) => (
                <View key={provider} className="flex-row items-center mb-2">
                  <Text className="text-muted text-sm flex-1 capitalize">{provider}</Text>
                  <View className="flex-1 h-2 bg-background rounded-full overflow-hidden">
                    <View 
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${Math.min(100, (count / Math.max(1, analytics.totalLogins)) * 100)}%` }}
                    />
                  </View>
                  <Text className="text-muted text-sm w-8 text-right">{count}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* SMPO Compliance Badge */}
        <View className="items-center mt-8 mb-4">
          <View className="flex-row items-center bg-success/10 px-4 py-2 rounded-full">
            <Text style={{ fontSize: 16, marginRight: 8 }}>✓</Text>
            <Text className="text-success text-sm font-medium">SMPO.ink Compliant</Text>
          </View>
          <Text className="text-muted text-xs mt-2 text-center">
            Enterprise-grade security with JEDI Master authentication
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
