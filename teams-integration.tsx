/**
 * Microsoft Teams Integration Screen
 * Configure Azure AD OAuth and Teams channel notifications
 * MediVac One v5.7
 */

import { useState, useEffect, useCallback } from "react";
import { ScrollView, Text, View, TouchableOpacity, TextInput, Alert, Linking } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { 
  teamsIntegrationService, 
  TeamsConfig, 
  TeamsChannel,
  TeamsNotification,
  NotificationType,
  NOTIFICATION_TEMPLATES,
  AZURE_AD_CONFIG
} from "@/lib/services/teams-integration-service";

type TabType = 'config' | 'channels' | 'notifications';

export default function TeamsIntegrationScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<TabType>('config');
  const [config, setConfig] = useState<TeamsConfig | null>(null);
  const [channels, setChannels] = useState<TeamsChannel[]>([]);
  const [notifications, setNotifications] = useState<TeamsNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);

  // Form state
  const [tenantId, setTenantId] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');

  // Add channel form
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [channelTeamName, setChannelTeamName] = useState('');
  const [channelName, setChannelName] = useState('');
  const [channelWebhook, setChannelWebhook] = useState('');
  const [channelNotifications, setChannelNotifications] = useState<NotificationType[]>(['incident', 'system']);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await teamsIntegrationService.initialize();
      const cfg = teamsIntegrationService.getConfig();
      setConfig(cfg);
      setTenantId(cfg.tenantId);
      setClientId(cfg.clientId);
      setClientSecret(cfg.clientSecret || '');
      setChannels(teamsIntegrationService.getChannels());
      setNotifications(teamsIntegrationService.getNotifications());
    } catch (error) {
      console.error('Failed to load Teams config:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveConfig = async () => {
    try {
      await teamsIntegrationService.updateConfig({
        tenantId,
        clientId,
        clientSecret: clientSecret || undefined,
      });
      Alert.alert('Success', 'Configuration saved');
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to save configuration');
    }
  };

  const handleConnect = async () => {
    if (!tenantId || !clientId) {
      Alert.alert('Error', 'Please enter Tenant ID and Client ID');
      return;
    }

    try {
      const authUrl = teamsIntegrationService.getAuthorizationUrl();
      // In a real app, this would open the OAuth flow
      // For demo, we simulate successful auth
      Alert.alert(
        'OAuth Flow',
        'In production, this would redirect to Microsoft login. Simulating successful authentication...',
        [
          {
            text: 'Simulate Login',
            onPress: async () => {
              const success = await teamsIntegrationService.handleAuthCallback('mock_auth_code');
              if (success) {
                Alert.alert('Connected', 'Successfully connected to Microsoft Teams');
              } else {
                Alert.alert('Failed', 'Failed to connect to Microsoft Teams');
              }
              loadData();
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to start OAuth flow');
    }
  };

  const handleDisconnect = async () => {
    Alert.alert(
      'Disconnect',
      'Are you sure you want to disconnect from Microsoft Teams?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            await teamsIntegrationService.disconnect();
            loadData();
          },
        },
      ]
    );
  };

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const result = await teamsIntegrationService.testConnection();
      Alert.alert(result.success ? 'Success' : 'Failed', result.message);
    } catch (error) {
      Alert.alert('Error', 'Failed to test connection');
    } finally {
      setTesting(false);
    }
  };

  const handleAddChannel = async () => {
    if (!channelTeamName || !channelName) {
      Alert.alert('Error', 'Please fill in team and channel names');
      return;
    }

    try {
      await teamsIntegrationService.addChannel({
        teamId: `team_${Date.now()}`,
        teamName: channelTeamName,
        channelId: `channel_${Date.now()}`,
        channelName,
        webhookUrl: channelWebhook || undefined,
        isDefault: channels.length === 0,
        enabledNotifications: channelNotifications,
      });

      setChannelTeamName('');
      setChannelName('');
      setChannelWebhook('');
      setChannelNotifications(['incident', 'system']);
      setShowAddChannel(false);
      loadData();
      Alert.alert('Success', 'Channel added');
    } catch (error) {
      Alert.alert('Error', 'Failed to add channel');
    }
  };

  const handleRemoveChannel = async (channel: TeamsChannel) => {
    Alert.alert(
      'Remove Channel',
      `Remove "${channel.channelName}" from "${channel.teamName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await teamsIntegrationService.removeChannel(channel.id);
            loadData();
          },
        },
      ]
    );
  };

  const handleSendTestNotification = async (channel: TeamsChannel) => {
    try {
      const notification = await teamsIntegrationService.sendNotification(
        channel.id,
        'system',
        'Test Notification',
        'This is a test notification from MediVac One.',
        'info'
      );
      
      if (notification.status === 'sent') {
        Alert.alert('Success', 'Test notification sent');
      } else {
        Alert.alert('Failed', notification.error || 'Failed to send notification');
      }
      loadData();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to send notification');
    }
  };

  const stats = teamsIntegrationService.getStatistics();

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'connected': return colors.success;
      case 'connecting': return colors.warning;
      case 'error':
      case 'disconnected': return colors.error;
      default: return colors.muted;
    }
  };

  const getNotificationColor = (type: NotificationType): string => {
    return NOTIFICATION_TEMPLATES[type].color;
  };

  const renderTabs = () => (
    <View className="flex-row mb-4 bg-surface rounded-xl p-1">
      {(['config', 'channels', 'notifications'] as TabType[]).map((tab) => (
        <TouchableOpacity
          key={tab}
          onPress={() => setActiveTab(tab)}
          className={`flex-1 py-3 rounded-lg ${activeTab === tab ? 'bg-primary' : ''}`}
        >
          <Text className={`text-center text-sm font-medium ${activeTab === tab ? 'text-white' : 'text-muted'}`}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderConfigTab = () => (
    <View>
      {/* Connection Status */}
      <View className="bg-surface rounded-xl p-4 mb-4">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-3">
            <View className="bg-[#6264A7] p-3 rounded-xl">
              <IconSymbol name="person.2.fill" size={24} color="#FFFFFF" />
            </View>
            <View>
              <Text className="text-foreground font-semibold">Microsoft Teams</Text>
              <Text style={{ color: getStatusColor(config?.status || 'disconnected') }} className="text-sm capitalize">
                {config?.status || 'Disconnected'}
              </Text>
            </View>
          </View>
          {config?.status === 'connected' && (
            <TouchableOpacity
              onPress={handleTestConnection}
              disabled={testing}
              className="bg-primary/10 px-4 py-2 rounded-lg"
            >
              <Text style={{ color: colors.primary }} className="font-medium">
                {testing ? 'Testing...' : 'Test'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {config?.lastConnected && (
          <Text className="text-muted text-sm">
            Last connected: {new Date(config.lastConnected).toLocaleString()}
          </Text>
        )}
        {config?.lastError && (
          <Text style={{ color: colors.error }} className="text-sm mt-1">
            Error: {config.lastError}
          </Text>
        )}
      </View>

      {/* Azure AD Configuration */}
      <View className="bg-surface rounded-xl p-4 mb-4">
        <Text className="text-foreground font-semibold mb-3">Azure AD Configuration</Text>
        
        <View className="mb-3">
          <Text className="text-muted text-sm mb-1">Tenant ID *</Text>
          <TextInput
            value={tenantId}
            onChangeText={setTenantId}
            placeholder="e.g., 12345678-1234-1234-1234-123456789abc"
            placeholderTextColor={colors.muted}
            className="bg-background text-foreground p-3 rounded-lg"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text className="text-muted text-xs mt-1">
            Found in Azure Portal → Azure Active Directory → Overview
          </Text>
        </View>

        <View className="mb-3">
          <Text className="text-muted text-sm mb-1">Client ID (Application ID) *</Text>
          <TextInput
            value={clientId}
            onChangeText={setClientId}
            placeholder="e.g., 87654321-4321-4321-4321-cba987654321"
            placeholderTextColor={colors.muted}
            className="bg-background text-foreground p-3 rounded-lg"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text className="text-muted text-xs mt-1">
            Found in Azure Portal → App Registrations → Your App
          </Text>
        </View>

        <View className="mb-3">
          <Text className="text-muted text-sm mb-1">Client Secret (Optional)</Text>
          <TextInput
            value={clientSecret}
            onChangeText={setClientSecret}
            placeholder="Enter client secret"
            placeholderTextColor={colors.muted}
            className="bg-background text-foreground p-3 rounded-lg"
            secureTextEntry
          />
          <Text className="text-muted text-xs mt-1">
            Required for server-to-server authentication
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleSaveConfig}
          className="bg-primary/10 py-3 rounded-lg mb-3"
        >
          <Text style={{ color: colors.primary }} className="text-center font-medium">Save Configuration</Text>
        </TouchableOpacity>
      </View>

      {/* Required Permissions */}
      <View className="bg-surface rounded-xl p-4 mb-4">
        <Text className="text-foreground font-semibold mb-3">Required API Permissions</Text>
        
        {AZURE_AD_CONFIG.defaultScopes.map((scope, index) => (
          <View key={index} className="flex-row items-center gap-2 mb-2">
            <IconSymbol name="checkmark.circle.fill" size={16} color={colors.success} />
            <Text className="text-muted text-sm">{scope.split('/').pop()}</Text>
          </View>
        ))}
        
        <Text className="text-muted text-xs mt-2">
          Add these permissions in Azure Portal → API Permissions
        </Text>
      </View>

      {/* Connect/Disconnect Button */}
      {config?.status === 'connected' ? (
        <TouchableOpacity
          onPress={handleDisconnect}
          className="py-4 rounded-xl"
          style={{ backgroundColor: colors.error + '20' }}
        >
          <Text style={{ color: colors.error }} className="text-center font-semibold">Disconnect from Teams</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={handleConnect}
          className="bg-[#6264A7] py-4 rounded-xl"
        >
          <Text className="text-white text-center font-semibold">Connect to Microsoft Teams</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderChannelsTab = () => (
    <View>
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-foreground text-lg font-bold">Teams Channels</Text>
        <TouchableOpacity
          onPress={() => setShowAddChannel(true)}
          className="bg-primary px-4 py-2 rounded-lg"
        >
          <Text className="text-white font-medium">+ Add Channel</Text>
        </TouchableOpacity>
      </View>

      {showAddChannel && (
        <View className="bg-surface rounded-xl p-4 mb-4">
          <Text className="text-foreground font-semibold mb-3">Add Channel</Text>
          
          <View className="mb-3">
            <Text className="text-muted text-sm mb-1">Team Name *</Text>
            <TextInput
              value={channelTeamName}
              onChangeText={setChannelTeamName}
              placeholder="e.g., IT Security Team"
              placeholderTextColor={colors.muted}
              className="bg-background text-foreground p-3 rounded-lg"
            />
          </View>

          <View className="mb-3">
            <Text className="text-muted text-sm mb-1">Channel Name *</Text>
            <TextInput
              value={channelName}
              onChangeText={setChannelName}
              placeholder="e.g., Alerts"
              placeholderTextColor={colors.muted}
              className="bg-background text-foreground p-3 rounded-lg"
            />
          </View>

          <View className="mb-3">
            <Text className="text-muted text-sm mb-1">Webhook URL (Optional)</Text>
            <TextInput
              value={channelWebhook}
              onChangeText={setChannelWebhook}
              placeholder="https://outlook.office.com/webhook/..."
              placeholderTextColor={colors.muted}
              className="bg-background text-foreground p-3 rounded-lg"
              autoCapitalize="none"
            />
          </View>

          <View className="mb-3">
            <Text className="text-muted text-sm mb-2">Notification Types</Text>
            <View className="flex-row flex-wrap gap-2">
              {(Object.keys(NOTIFICATION_TEMPLATES) as NotificationType[]).map((type) => {
                const template = NOTIFICATION_TEMPLATES[type];
                const isSelected = channelNotifications.includes(type);
                
                return (
                  <TouchableOpacity
                    key={type}
                    onPress={() => {
                      if (isSelected) {
                        setChannelNotifications(channelNotifications.filter(t => t !== type));
                      } else {
                        setChannelNotifications([...channelNotifications, type]);
                      }
                    }}
                    style={isSelected ? { backgroundColor: template.color } : undefined}
                    className={`px-3 py-2 rounded-lg ${!isSelected ? 'bg-background' : ''}`}
                  >
                    <Text className={isSelected ? 'text-white font-medium' : 'text-muted'}>
                      {template.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setShowAddChannel(false)}
              className="flex-1 bg-background py-3 rounded-lg"
            >
              <Text className="text-foreground text-center font-medium">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleAddChannel}
              className="flex-1 bg-primary py-3 rounded-lg"
            >
              <Text className="text-white text-center font-medium">Add Channel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {channels.length === 0 ? (
        <View className="bg-surface rounded-xl p-8 items-center">
          <IconSymbol name="person.2.fill" size={48} color={colors.muted} />
          <Text className="text-muted mt-4 text-center">No channels configured</Text>
          <Text className="text-muted text-sm text-center mt-1">
            Add Teams channels to receive notifications
          </Text>
        </View>
      ) : (
        channels.map((channel) => (
          <View key={channel.id} className="bg-surface rounded-xl p-4 mb-3">
            <View className="flex-row items-start justify-between mb-2">
              <View className="flex-1">
                <Text className="text-foreground font-semibold">{channel.channelName}</Text>
                <Text className="text-muted text-sm">{channel.teamName}</Text>
              </View>
              {channel.isDefault && (
                <View className="bg-primary/20 px-2 py-1 rounded">
                  <Text style={{ color: colors.primary }} className="text-xs">Default</Text>
                </View>
              )}
            </View>

            <View className="flex-row flex-wrap gap-1 mb-3">
              {channel.enabledNotifications.map((type) => (
                <View 
                  key={type}
                  style={{ backgroundColor: getNotificationColor(type) + '20' }}
                  className="px-2 py-0.5 rounded"
                >
                  <Text style={{ color: getNotificationColor(type) }} className="text-xs">
                    {NOTIFICATION_TEMPLATES[type].label}
                  </Text>
                </View>
              ))}
            </View>

            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => handleSendTestNotification(channel)}
                className="flex-1 bg-primary/10 py-2 rounded-lg"
              >
                <Text style={{ color: colors.primary }} className="text-center font-medium">Test</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleRemoveChannel(channel)}
                className="px-4 py-2 rounded-lg"
                style={{ backgroundColor: colors.error + '20' }}
              >
                <IconSymbol name="chevron.right" size={16} color={colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </View>
  );

  const renderNotificationsTab = () => (
    <View>
      <View className="flex-row flex-wrap gap-2 mb-4">
        <View className="flex-1 min-w-[100px] bg-surface rounded-xl p-3">
          <Text className="text-muted text-xs">Total</Text>
          <Text className="text-foreground text-xl font-bold">{stats.totalNotifications}</Text>
        </View>
        <View className="flex-1 min-w-[100px] bg-surface rounded-xl p-3">
          <Text className="text-muted text-xs">Sent</Text>
          <Text style={{ color: colors.success }} className="text-xl font-bold">{stats.sentNotifications}</Text>
        </View>
        <View className="flex-1 min-w-[100px] bg-surface rounded-xl p-3">
          <Text className="text-muted text-xs">Failed</Text>
          <Text style={{ color: colors.error }} className="text-xl font-bold">{stats.failedNotifications}</Text>
        </View>
      </View>

      <Text className="text-foreground text-lg font-bold mb-3">Recent Notifications</Text>

      {notifications.length === 0 ? (
        <View className="bg-surface rounded-xl p-8 items-center">
          <IconSymbol name="bell.fill" size={48} color={colors.muted} />
          <Text className="text-muted mt-4 text-center">No notifications sent yet</Text>
        </View>
      ) : (
        notifications.slice(0, 20).map((notification) => (
          <View key={notification.id} className="bg-surface rounded-xl p-3 mb-2">
            <View className="flex-row items-center justify-between mb-1">
              <View className="flex-row items-center gap-2">
                <View 
                  style={{ backgroundColor: getNotificationColor(notification.type) }}
                  className="w-6 h-6 rounded items-center justify-center"
                >
                  <IconSymbol 
                    name={NOTIFICATION_TEMPLATES[notification.type].icon as any} 
                    size={12} 
                    color="#FFFFFF" 
                  />
                </View>
                <Text className="text-foreground font-medium">{notification.title}</Text>
              </View>
              <View 
                style={{ 
                  backgroundColor: notification.status === 'sent' ? colors.success + '20' : colors.error + '20' 
                }}
                className="px-2 py-0.5 rounded"
              >
                <Text 
                  style={{ color: notification.status === 'sent' ? colors.success : colors.error }}
                  className="text-xs capitalize"
                >
                  {notification.status}
                </Text>
              </View>
            </View>
            <Text className="text-muted text-sm" numberOfLines={1}>{notification.message}</Text>
            <Text className="text-muted text-xs mt-1">
              {new Date(notification.createdAt).toLocaleString()}
            </Text>
          </View>
        ))
      )}
    </View>
  );

  if (loading) {
    return (
      <ScreenContainer className="p-4">
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">Loading Teams integration...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-foreground text-2xl font-bold">Microsoft Teams</Text>
            <Text className="text-muted">Integration & notifications</Text>
          </View>
          <View className="bg-[#6264A7] p-3 rounded-full">
            <IconSymbol name="person.2.fill" size={24} color="#FFFFFF" />
          </View>
        </View>

        {renderTabs()}

        {activeTab === 'config' && renderConfigTab()}
        {activeTab === 'channels' && renderChannelsTab()}
        {activeTab === 'notifications' && renderNotificationsTab()}

        <View className="h-20" />
      </ScrollView>
    </ScreenContainer>
  );
}
