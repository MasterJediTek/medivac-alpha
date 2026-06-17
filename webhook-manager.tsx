import { useState, useEffect } from 'react';
import { ScrollView, Text, View, TouchableOpacity, TextInput, Alert, ActivityIndicator, FlatList } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import {
  WebhookEndpoint,
  WebhookDelivery,
  WebhookEventType,
  getWebhookEndpoints,
  initializeWebhookEndpoints,
  setEndpointEnabled,
  testWebhookEndpoint,
  getDeliveryLogs,
  getWebhookStats,
  enableSystemEndpoints,
  createCustomEndpoint,
  saveWebhookEndpoint,
} from '@/lib/webhook-endpoints';

type TabType = 'endpoints' | 'logs' | 'stats';

export default function WebhookManagerScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<TabType>('endpoints');
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getWebhookStats>> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [testingEndpoint, setTestingEndpoint] = useState<string | null>(null);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customForm, setCustomForm] = useState({ name: '', url: '', secret: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await initializeWebhookEndpoints();
      const [eps, logs, st] = await Promise.all([
        getWebhookEndpoints(),
        getDeliveryLogs(50),
        getWebhookStats(),
      ]);
      setEndpoints(eps);
      setDeliveries(logs);
      setStats(st);
    } catch (error) {
      console.error('Error loading webhook data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleEndpoint = async (endpointId: string, enabled: boolean) => {
    await setEndpointEnabled(endpointId, enabled);
    await loadData();
  };

  const handleTestEndpoint = async (endpointId: string) => {
    setTestingEndpoint(endpointId);
    try {
      const result = await testWebhookEndpoint(endpointId);
      if (result.success) {
        Alert.alert('Success', `Connection successful (${result.latency}ms)`);
      } else {
        Alert.alert('Failed', result.error || `HTTP ${result.statusCode}`);
      }
      await loadData();
    } catch (error) {
      Alert.alert('Error', 'Test failed');
    } finally {
      setTestingEndpoint(null);
    }
  };

  const handleEnableSystem = async (system: 'jedi' | 'smpo' | 'wongi') => {
    Alert.alert(
      'Enable All',
      `Enable all ${system.toUpperCase()} endpoints?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Enable',
          onPress: async () => {
            await enableSystemEndpoints(system);
            await loadData();
          },
        },
      ]
    );
  };

  const handleAddCustomEndpoint = async () => {
    if (!customForm.name || !customForm.url) {
      Alert.alert('Error', 'Name and URL are required');
      return;
    }
    
    try {
      const allEvents: WebhookEventType[] = [
        'patient.created', 'patient.updated', 'sync.requested', 'sync.completed'
      ];
      await createCustomEndpoint(customForm.name, customForm.url, allEvents, customForm.secret);
      setCustomForm({ name: '', url: '', secret: '' });
      setShowAddCustom(false);
      await loadData();
      Alert.alert('Success', 'Custom endpoint created');
    } catch (error) {
      Alert.alert('Error', 'Failed to create endpoint');
    }
  };

  const getSystemColor = (system: string) => {
    switch (system) {
      case 'jedi': return '#8B5CF6';
      case 'smpo': return '#3B82F6';
      case 'wongi': return '#10B981';
      default: return colors.muted;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return colors.success;
      case 'error': return colors.error;
      default: return colors.muted;
    }
  };

  const renderEndpoint = ({ item }: { item: WebhookEndpoint }) => (
    <View 
      className="mb-3 p-4 rounded-xl border"
      style={{ backgroundColor: colors.surface, borderColor: colors.border }}
    >
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center flex-1">
          <View 
            className="w-3 h-3 rounded-full mr-2"
            style={{ backgroundColor: getStatusColor(item.status) }}
          />
          <View className="flex-1">
            <Text className="text-foreground font-bold" numberOfLines={1}>{item.name}</Text>
            <Text className="text-muted text-xs" numberOfLines={1}>{item.url}</Text>
          </View>
        </View>
        <View 
          className="px-2 py-1 rounded-full ml-2"
          style={{ backgroundColor: getSystemColor(item.system) + '20' }}
        >
          <Text style={{ color: getSystemColor(item.system), fontSize: 10, fontWeight: '600' }}>
            {item.system.toUpperCase()}
          </Text>
        </View>
      </View>
      
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-muted text-xs">
          {item.events.length} events • {item.successCount} sent • {item.errorCount} errors
        </Text>
        {item.lastPing && (
          <Text className="text-muted text-xs">
            Last: {new Date(item.lastPing).toLocaleTimeString()}
          </Text>
        )}
      </View>
      
      <View className="flex-row gap-2">
        <TouchableOpacity
          className="flex-1 py-2 rounded-lg items-center"
          style={{ backgroundColor: item.enabled ? colors.error + '20' : colors.success + '20' }}
          onPress={() => handleToggleEndpoint(item.id, !item.enabled)}
        >
          <Text style={{ color: item.enabled ? colors.error : colors.success, fontWeight: '600', fontSize: 12 }}>
            {item.enabled ? 'Disable' : 'Enable'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 py-2 rounded-lg items-center"
          style={{ backgroundColor: colors.primary + '20' }}
          onPress={() => handleTestEndpoint(item.id)}
          disabled={testingEndpoint === item.id}
        >
          {testingEndpoint === item.id ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 12 }}>Test</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDelivery = ({ item }: { item: WebhookDelivery }) => (
    <View 
      className="mb-2 p-3 rounded-lg border"
      style={{ backgroundColor: colors.surface, borderColor: colors.border }}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View 
            className="w-2 h-2 rounded-full mr-2"
            style={{ 
              backgroundColor: item.status === 'success' ? colors.success : 
                              item.status === 'failed' ? colors.error : colors.warning 
            }}
          />
          <Text className="text-foreground font-medium text-sm">{item.event}</Text>
        </View>
        <Text className="text-muted text-xs">
          {new Date(item.createdAt).toLocaleTimeString()}
        </Text>
      </View>
      <View className="flex-row items-center mt-1">
        <Text className="text-muted text-xs">
          {item.attempts} attempt{item.attempts > 1 ? 's' : ''} • 
          {item.responseCode ? ` HTTP ${item.responseCode}` : item.error || 'Pending'}
        </Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-muted mt-4">Loading Webhook Configuration...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      {/* Header */}
      <View className="px-5 pt-6 pb-4">
        <Text className="text-foreground text-2xl font-bold">Webhook Manager</Text>
        <Text className="text-muted mt-1">Connect to JEDI, SMPO.ink & WONGI systems</Text>
      </View>

      {/* Tabs */}
      <View className="flex-row px-5 mb-4">
        {(['endpoints', 'logs', 'stats'] as TabType[]).map(tab => (
          <TouchableOpacity
            key={tab}
            className="flex-1 py-2 items-center rounded-lg mr-2"
            style={{ 
              backgroundColor: activeTab === tab ? colors.primary : colors.surface,
            }}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={{ 
              color: activeTab === tab ? 'white' : colors.foreground,
              fontWeight: '600',
              textTransform: 'capitalize',
            }}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {activeTab === 'endpoints' && (
        <View className="flex-1">
          {/* Quick Enable Buttons */}
          <View className="flex-row px-5 mb-4 gap-2">
            <TouchableOpacity
              className="flex-1 py-2 rounded-lg items-center"
              style={{ backgroundColor: '#8B5CF6' + '20' }}
              onPress={() => handleEnableSystem('jedi')}
            >
              <Text style={{ color: '#8B5CF6', fontWeight: '600', fontSize: 12 }}>Enable JEDI</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 py-2 rounded-lg items-center"
              style={{ backgroundColor: '#3B82F6' + '20' }}
              onPress={() => handleEnableSystem('smpo')}
            >
              <Text style={{ color: '#3B82F6', fontWeight: '600', fontSize: 12 }}>Enable SMPO</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 py-2 rounded-lg items-center"
              style={{ backgroundColor: '#10B981' + '20' }}
              onPress={() => handleEnableSystem('wongi')}
            >
              <Text style={{ color: '#10B981', fontWeight: '600', fontSize: 12 }}>Enable WONGI</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={endpoints}
            renderItem={renderEndpoint}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
            ListFooterComponent={
              <View className="mt-4">
                {!showAddCustom ? (
                  <TouchableOpacity
                    className="py-3 rounded-xl items-center border border-dashed"
                    style={{ borderColor: colors.border }}
                    onPress={() => setShowAddCustom(true)}
                  >
                    <Text style={{ color: colors.muted }}>+ Add Custom Endpoint</Text>
                  </TouchableOpacity>
                ) : (
                  <View 
                    className="p-4 rounded-xl border"
                    style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                  >
                    <Text className="text-foreground font-bold mb-3">Add Custom Endpoint</Text>
                    <TextInput
                      className="bg-background border border-border rounded-lg p-3 text-foreground mb-2"
                      placeholder="Endpoint Name"
                      placeholderTextColor={colors.muted}
                      value={customForm.name}
                      onChangeText={(text) => setCustomForm(prev => ({ ...prev, name: text }))}
                    />
                    <TextInput
                      className="bg-background border border-border rounded-lg p-3 text-foreground mb-2"
                      placeholder="Webhook URL"
                      placeholderTextColor={colors.muted}
                      value={customForm.url}
                      onChangeText={(text) => setCustomForm(prev => ({ ...prev, url: text }))}
                      autoCapitalize="none"
                    />
                    <TextInput
                      className="bg-background border border-border rounded-lg p-3 text-foreground mb-3"
                      placeholder="Secret (optional)"
                      placeholderTextColor={colors.muted}
                      value={customForm.secret}
                      onChangeText={(text) => setCustomForm(prev => ({ ...prev, secret: text }))}
                      secureTextEntry
                    />
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        className="flex-1 py-2 rounded-lg items-center"
                        style={{ backgroundColor: colors.muted + '20' }}
                        onPress={() => setShowAddCustom(false)}
                      >
                        <Text style={{ color: colors.foreground }}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="flex-1 py-2 rounded-lg items-center"
                        style={{ backgroundColor: colors.primary }}
                        onPress={handleAddCustomEndpoint}
                      >
                        <Text className="text-white font-bold">Add</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            }
          />
        </View>
      )}

      {activeTab === 'logs' && (
        <FlatList
          data={deliveries}
          renderItem={renderDelivery}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          ListEmptyComponent={
            <View className="items-center py-8">
              <Text className="text-muted">No delivery logs yet</Text>
            </View>
          }
        />
      )}

      {activeTab === 'stats' && stats && (
        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          {/* Overview Stats */}
          <View className="flex-row gap-3 mb-4">
            <View 
              className="flex-1 p-4 rounded-xl"
              style={{ backgroundColor: colors.primary + '20' }}
            >
              <Text style={{ color: colors.primary, fontSize: 24, fontWeight: 'bold' }}>
                {stats.totalEndpoints}
              </Text>
              <Text className="text-muted text-sm">Total Endpoints</Text>
            </View>
            <View 
              className="flex-1 p-4 rounded-xl"
              style={{ backgroundColor: colors.success + '20' }}
            >
              <Text style={{ color: colors.success, fontSize: 24, fontWeight: 'bold' }}>
                {stats.activeEndpoints}
              </Text>
              <Text className="text-muted text-sm">Active</Text>
            </View>
          </View>

          {/* Delivery Stats */}
          <View 
            className="p-4 rounded-xl mb-4"
            style={{ backgroundColor: colors.surface }}
          >
            <Text className="text-foreground font-bold mb-3">Delivery Statistics</Text>
            <View className="flex-row justify-between mb-2">
              <Text className="text-muted">Total Deliveries</Text>
              <Text className="text-foreground font-medium">{stats.totalDeliveries}</Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-muted">Successful</Text>
              <Text style={{ color: colors.success, fontWeight: '600' }}>{stats.successfulDeliveries}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-muted">Failed</Text>
              <Text style={{ color: colors.error, fontWeight: '600' }}>{stats.failedDeliveries}</Text>
            </View>
          </View>

          {/* By System */}
          <View 
            className="p-4 rounded-xl mb-8"
            style={{ backgroundColor: colors.surface }}
          >
            <Text className="text-foreground font-bold mb-3">By System</Text>
            {Object.entries(stats.bySystem).map(([system, data]) => (
              <View key={system} className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center">
                  <View 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: getSystemColor(system) }}
                  />
                  <Text className="text-foreground font-medium">{system.toUpperCase()}</Text>
                </View>
                <Text className="text-muted">
                  {data.active}/{data.count} active
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </ScreenContainer>
  );
}
