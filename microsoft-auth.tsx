/**
 * Microsoft Account Authorization Screen
 * Centralized OAuth management for all Microsoft services
 * MediVac One v6.0
 */

import { useState, useEffect } from "react";
import { ScrollView, Text, View, TouchableOpacity, TextInput, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { 
  microsoftAuthService, 
  MicrosoftAccount, 
  MicrosoftService,
  MICROSOFT_SERVICES,
  ConnectionStatus
} from "@/lib/services/microsoft-auth-service";

type TabType = 'accounts' | 'services' | 'config';

const STATUS_COLORS: Record<ConnectionStatus, string> = {
  connected: '#10B981',
  disconnected: '#6B7280',
  expired: '#F59E0B',
  error: '#EF4444',
};

export default function MicrosoftAuthScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<TabType>('accounts');
  const [accounts, setAccounts] = useState<MicrosoftAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<MicrosoftAccount | null>(null);
  const [showAddAccount, setShowAddAccount] = useState(false);
  
  // Add account state
  const [newAccount, setNewAccount] = useState({
    email: '',
    displayName: '',
    accountType: 'work' as 'work' | 'school' | 'personal',
    tenantName: '',
  });

  // Config state
  const [config, setConfig] = useState({
    clientId: '',
    tenantId: 'common',
    redirectUri: 'medivac://auth/callback',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await microsoftAuthService.initialize();
    setAccounts(microsoftAuthService.getAccounts());
    const authConfig = microsoftAuthService.getConfig();
    setConfig({
      clientId: authConfig.clientId,
      tenantId: authConfig.tenantId,
      redirectUri: authConfig.redirectUri,
    });
    setLoading(false);
  };

  const handleAddAccount = async () => {
    if (!newAccount.email.trim() || !newAccount.displayName.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    await microsoftAuthService.addAccount({
      email: newAccount.email,
      displayName: newAccount.displayName,
      accountType: newAccount.accountType,
      tenantName: newAccount.tenantName || undefined,
    });

    setNewAccount({ email: '', displayName: '', accountType: 'work', tenantName: '' });
    setShowAddAccount(false);
    loadData();
    Alert.alert('Success', 'Account added. Connect services to complete setup.');
  };

  const handleRemoveAccount = async (id: string) => {
    Alert.alert('Remove Account', 'This will disconnect all services. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Remove', 
        style: 'destructive',
        onPress: async () => {
          await microsoftAuthService.removeAccount(id);
          setSelectedAccount(null);
          loadData();
        }
      },
    ]);
  };

  const handleSetPrimary = async (id: string) => {
    await microsoftAuthService.setPrimaryAccount(id);
    loadData();
    Alert.alert('Success', 'Primary account updated');
  };

  const handleConnectService = async (accountId: string, service: MicrosoftService) => {
    const result = await microsoftAuthService.connectService(accountId, service);
    if (result.success) {
      loadData();
      if (selectedAccount) {
        setSelectedAccount(microsoftAuthService.getAccount(selectedAccount.id) || null);
      }
      Alert.alert('Success', `Connected to ${MICROSOFT_SERVICES[service].label}`);
    } else {
      Alert.alert('Error', result.error || 'Failed to connect');
    }
  };

  const handleDisconnectService = async (accountId: string, service: MicrosoftService) => {
    Alert.alert('Disconnect Service', `Disconnect from ${MICROSOFT_SERVICES[service].label}?`, [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Disconnect', 
        style: 'destructive',
        onPress: async () => {
          await microsoftAuthService.disconnectService(accountId, service);
          loadData();
          if (selectedAccount) {
            setSelectedAccount(microsoftAuthService.getAccount(selectedAccount.id) || null);
          }
        }
      },
    ]);
  };

  const handleRefreshService = async (accountId: string, service: MicrosoftService) => {
    const result = await microsoftAuthService.refreshService(accountId, service);
    if (result.success) {
      loadData();
      if (selectedAccount) {
        setSelectedAccount(microsoftAuthService.getAccount(selectedAccount.id) || null);
      }
      Alert.alert('Success', 'Token refreshed');
    } else {
      Alert.alert('Error', result.error || 'Failed to refresh');
    }
  };

  const handleSaveConfig = async () => {
    await microsoftAuthService.updateConfig({
      clientId: config.clientId,
      tenantId: config.tenantId,
      redirectUri: config.redirectUri,
    });
    Alert.alert('Success', 'Configuration saved');
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderAccounts = () => (
    <View className="gap-4">
      {selectedAccount ? (
        <View className="gap-4">
          <TouchableOpacity
            onPress={() => setSelectedAccount(null)}
            className="flex-row items-center gap-2"
          >
            <IconSymbol name="chevron.left" size={20} color={colors.primary} />
            <Text className="text-primary">Back to Accounts</Text>
          </TouchableOpacity>

          <View className="bg-surface rounded-xl p-4 border border-border">
            <View className="flex-row items-center gap-4 mb-4">
              <View className="w-16 h-16 rounded-full bg-primary items-center justify-center">
                <Text className="text-white text-2xl font-bold">
                  {selectedAccount.displayName.charAt(0)}
                </Text>
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text className="text-xl font-bold text-foreground">{selectedAccount.displayName}</Text>
                  {selectedAccount.isPrimary && (
                    <View className="px-2 py-0.5 rounded bg-primary">
                      <Text className="text-white text-xs">Primary</Text>
                    </View>
                  )}
                </View>
                <Text className="text-muted">{selectedAccount.email}</Text>
                {selectedAccount.tenantName && (
                  <Text className="text-muted text-sm">{selectedAccount.tenantName}</Text>
                )}
              </View>
            </View>

            <View className="flex-row gap-2">
              <View className="px-2 py-1 rounded bg-background">
                <Text className="text-muted text-sm capitalize">{selectedAccount.accountType}</Text>
              </View>
              <View className="px-2 py-1 rounded bg-background">
                <Text className="text-muted text-sm">Added {formatDate(selectedAccount.addedAt)}</Text>
              </View>
            </View>
          </View>

          <View className="bg-surface rounded-xl p-4 border border-border">
            <Text className="font-semibold text-foreground mb-3">Connected Services</Text>
            {selectedAccount.connections.map(conn => {
              const serviceConfig = MICROSOFT_SERVICES[conn.service];
              return (
                <View key={conn.service} className="flex-row items-center justify-between py-3 border-b border-border">
                  <View className="flex-row items-center gap-3">
                    <View 
                      className="w-10 h-10 rounded-lg items-center justify-center"
                      style={{ backgroundColor: serviceConfig.color + '20' }}
                    >
                      <IconSymbol name={serviceConfig.icon as any} size={20} color={serviceConfig.color} />
                    </View>
                    <View>
                      <Text className="text-foreground font-medium">{serviceConfig.label}</Text>
                      <Text className="text-muted text-xs">{serviceConfig.description}</Text>
                    </View>
                  </View>
                  <View className="items-end gap-1">
                    <View 
                      className="px-2 py-0.5 rounded"
                      style={{ backgroundColor: STATUS_COLORS[conn.status] + '20' }}
                    >
                      <Text style={{ color: STATUS_COLORS[conn.status], fontSize: 11 }}>
                        {conn.status.toUpperCase()}
                      </Text>
                    </View>
                    {conn.status === 'connected' ? (
                      <View className="flex-row gap-2">
                        <TouchableOpacity onPress={() => handleRefreshService(selectedAccount.id, conn.service)}>
                          <Text className="text-primary text-xs">Refresh</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDisconnectService(selectedAccount.id, conn.service)}>
                          <Text className="text-error text-xs">Disconnect</Text>
                        </TouchableOpacity>
                      </View>
                    ) : conn.status === 'expired' ? (
                      <TouchableOpacity onPress={() => handleRefreshService(selectedAccount.id, conn.service)}>
                        <Text className="text-warning text-xs">Reconnect</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity onPress={() => handleConnectService(selectedAccount.id, conn.service)}>
                        <Text className="text-primary text-xs">Connect</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          <View className="flex-row gap-2">
            {!selectedAccount.isPrimary && (
              <TouchableOpacity
                onPress={() => handleSetPrimary(selectedAccount.id)}
                className="flex-1 bg-primary py-3 rounded-lg"
              >
                <Text className="text-center text-white font-medium">Set as Primary</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => handleRemoveAccount(selectedAccount.id)}
              className="flex-1 py-3 rounded-lg border border-error"
            >
              <Text className="text-center text-error font-medium">Remove Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : showAddAccount ? (
        <View className="gap-4">
          <TouchableOpacity
            onPress={() => setShowAddAccount(false)}
            className="flex-row items-center gap-2"
          >
            <IconSymbol name="chevron.left" size={20} color={colors.primary} />
            <Text className="text-primary">Cancel</Text>
          </TouchableOpacity>

          <Text className="text-lg font-semibold text-foreground">Add Microsoft Account</Text>

          <View className="bg-surface rounded-xl p-4 border border-border gap-4">
            <View>
              <Text className="text-muted text-sm mb-1">Email Address *</Text>
              <TextInput
                value={newAccount.email}
                onChangeText={(text) => setNewAccount(prev => ({ ...prev, email: text }))}
                placeholder="user@organization.com"
                placeholderTextColor={colors.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                className="bg-background rounded-lg px-4 py-3 text-foreground border border-border"
              />
            </View>

            <View>
              <Text className="text-muted text-sm mb-1">Display Name *</Text>
              <TextInput
                value={newAccount.displayName}
                onChangeText={(text) => setNewAccount(prev => ({ ...prev, displayName: text }))}
                placeholder="John Smith"
                placeholderTextColor={colors.muted}
                className="bg-background rounded-lg px-4 py-3 text-foreground border border-border"
              />
            </View>

            <View>
              <Text className="text-muted text-sm mb-2">Account Type</Text>
              <View className="flex-row gap-2">
                {(['work', 'school', 'personal'] as const).map(type => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setNewAccount(prev => ({ ...prev, accountType: type }))}
                    className={`flex-1 py-2 rounded-lg border ${newAccount.accountType === type ? 'border-primary bg-primary' : 'border-border bg-background'}`}
                  >
                    <Text className={`text-center capitalize ${newAccount.accountType === type ? 'text-white' : 'text-foreground'}`}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View>
              <Text className="text-muted text-sm mb-1">Organization Name (optional)</Text>
              <TextInput
                value={newAccount.tenantName}
                onChangeText={(text) => setNewAccount(prev => ({ ...prev, tenantName: text }))}
                placeholder="WA Country Health Service"
                placeholderTextColor={colors.muted}
                className="bg-background rounded-lg px-4 py-3 text-foreground border border-border"
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleAddAccount}
            className="bg-primary py-3 rounded-lg"
          >
            <Text className="text-center text-white font-semibold">Add Account</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View className="flex-row justify-between items-center">
            <Text className="text-lg font-semibold text-foreground">Microsoft Accounts</Text>
            <TouchableOpacity
              onPress={() => setShowAddAccount(true)}
              className="bg-primary px-4 py-2 rounded-lg"
            >
              <Text className="text-white font-medium">+ Add</Text>
            </TouchableOpacity>
          </View>

          {accounts.length === 0 ? (
            <View className="bg-surface rounded-xl p-6 border border-border items-center">
              <IconSymbol name="person.fill" size={40} color={colors.muted} />
              <Text className="text-foreground font-medium mt-2">No Accounts</Text>
              <Text className="text-muted text-sm text-center">Add a Microsoft account to connect services</Text>
            </View>
          ) : (
            accounts.map(account => {
              const connectedCount = account.connections.filter(c => c.status === 'connected').length;
              const expiredCount = account.connections.filter(c => c.status === 'expired').length;

              return (
                <TouchableOpacity
                  key={account.id}
                  onPress={() => setSelectedAccount(account)}
                  className="bg-surface rounded-xl p-4 border border-border"
                >
                  <View className="flex-row items-center gap-3">
                    <View className="w-12 h-12 rounded-full bg-primary items-center justify-center">
                      <Text className="text-white text-lg font-bold">
                        {account.displayName.charAt(0)}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2">
                        <Text className="font-semibold text-foreground">{account.displayName}</Text>
                        {account.isPrimary && (
                          <View className="px-2 py-0.5 rounded bg-primary">
                            <Text className="text-white text-xs">Primary</Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-muted text-sm">{account.email}</Text>
                    </View>
                    <IconSymbol name="chevron.right" size={20} color={colors.muted} />
                  </View>

                  <View className="flex-row items-center gap-4 mt-3 pt-3 border-t border-border">
                    <View className="flex-row items-center gap-1">
                      <View className="w-2 h-2 rounded-full bg-success" />
                      <Text className="text-muted text-sm">{connectedCount} connected</Text>
                    </View>
                    {expiredCount > 0 && (
                      <View className="flex-row items-center gap-1">
                        <View className="w-2 h-2 rounded-full bg-warning" />
                        <Text className="text-warning text-sm">{expiredCount} expired</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </>
      )}
    </View>
  );

  const renderServices = () => {
    const analytics = microsoftAuthService.getAnalytics();

    return (
      <View className="gap-4">
        <Text className="text-lg font-semibold text-foreground">Service Overview</Text>

        {Object.entries(MICROSOFT_SERVICES).map(([service, config]) => {
          const stats = analytics.byService[service as MicrosoftService];
          return (
            <View key={service} className="bg-surface rounded-xl p-4 border border-border">
              <View className="flex-row items-center gap-3 mb-3">
                <View 
                  className="w-12 h-12 rounded-xl items-center justify-center"
                  style={{ backgroundColor: config.color + '20' }}
                >
                  <IconSymbol name={config.icon as any} size={24} color={config.color} />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-foreground">{config.label}</Text>
                  <Text className="text-muted text-sm">{config.description}</Text>
                </View>
              </View>

              <View className="flex-row justify-around py-3 border-t border-border">
                <View className="items-center">
                  <Text className="text-xl font-bold" style={{ color: '#10B981' }}>{stats.connected}</Text>
                  <Text className="text-muted text-sm">Connected</Text>
                </View>
                <View className="items-center">
                  <Text className="text-xl font-bold text-foreground">{stats.total}</Text>
                  <Text className="text-muted text-sm">Total Accounts</Text>
                </View>
              </View>

              <View className="mt-3 pt-3 border-t border-border">
                <Text className="text-muted text-xs">Required Scopes:</Text>
                <Text className="text-foreground text-xs mt-1">{config.requiredScopes.join(', ')}</Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderConfig = () => (
    <View className="gap-4">
      <Text className="text-lg font-semibold text-foreground">Azure AD Configuration</Text>

      <View className="bg-surface rounded-xl p-4 border border-border gap-4">
        <View>
          <Text className="text-muted text-sm mb-1">Client ID (Application ID)</Text>
          <TextInput
            value={config.clientId}
            onChangeText={(text) => setConfig(prev => ({ ...prev, clientId: text }))}
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            placeholderTextColor={colors.muted}
            className="bg-background rounded-lg px-4 py-3 text-foreground border border-border font-mono"
          />
          <Text className="text-muted text-xs mt-1">From Azure Portal → App Registrations</Text>
        </View>

        <View>
          <Text className="text-muted text-sm mb-1">Tenant ID</Text>
          <TextInput
            value={config.tenantId}
            onChangeText={(text) => setConfig(prev => ({ ...prev, tenantId: text }))}
            placeholder="common"
            placeholderTextColor={colors.muted}
            className="bg-background rounded-lg px-4 py-3 text-foreground border border-border font-mono"
          />
          <Text className="text-muted text-xs mt-1">Use "common" for multi-tenant or specific tenant ID</Text>
        </View>

        <View>
          <Text className="text-muted text-sm mb-1">Redirect URI</Text>
          <TextInput
            value={config.redirectUri}
            onChangeText={(text) => setConfig(prev => ({ ...prev, redirectUri: text }))}
            placeholder="medivac://auth/callback"
            placeholderTextColor={colors.muted}
            className="bg-background rounded-lg px-4 py-3 text-foreground border border-border font-mono"
          />
          <Text className="text-muted text-xs mt-1">Must match Azure Portal configuration</Text>
        </View>
      </View>

      <View className="bg-surface rounded-xl p-4 border border-border">
        <Text className="font-semibold text-foreground mb-3">Setup Instructions</Text>
        <View className="gap-2">
          <Text className="text-foreground">1. Go to Azure Portal → Azure Active Directory</Text>
          <Text className="text-foreground">2. Navigate to App Registrations → New Registration</Text>
          <Text className="text-foreground">3. Set redirect URI to: {config.redirectUri}</Text>
          <Text className="text-foreground">4. Copy the Application (Client) ID above</Text>
          <Text className="text-foreground">5. Configure API permissions for required services</Text>
          <Text className="text-foreground">6. Grant admin consent for your organization</Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={handleSaveConfig}
        className="bg-primary py-3 rounded-lg"
      >
        <Text className="text-center text-white font-semibold">Save Configuration</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <ScreenContainer className="p-6">
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">Loading...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-6">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-6 pb-8">
          <View>
            <Text className="text-2xl font-bold text-foreground">Microsoft Authorization</Text>
            <Text className="text-muted mt-1">Manage Microsoft 365 accounts and services</Text>
          </View>

          <View className="flex-row bg-surface rounded-xl p-1">
            {(['accounts', 'services', 'config'] as TabType[]).map(tab => (
              <TouchableOpacity
                key={tab}
                onPress={() => { setActiveTab(tab); setSelectedAccount(null); setShowAddAccount(false); }}
                className={`flex-1 py-3 rounded-lg ${activeTab === tab ? 'bg-primary' : ''}`}
              >
                <Text className={`text-center font-medium ${activeTab === tab ? 'text-white' : 'text-muted'}`}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === 'accounts' && renderAccounts()}
          {activeTab === 'services' && renderServices()}
          {activeTab === 'config' && renderConfig()}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
