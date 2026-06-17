import { useState, useEffect, useCallback } from 'react';
import { ScrollView, Text, View, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { autoDiscoveryService, DiscoveredConnection, DiscoveryRule, DiscoveryStats } from '@/lib/services/auto-discovery-service';

type TabType = 'discoveries' | 'rules' | 'history';

export default function AutoDiscoveryScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('discoveries');
  const [discoveries, setDiscoveries] = useState<DiscoveredConnection[]>([]);
  const [rules, setRules] = useState<DiscoveryRule[]>([]);
  const [stats, setStats] = useState<DiscoveryStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'validated'>('all');

  const loadData = useCallback(async () => {
    try {
      await autoDiscoveryService.initialize();
      setDiscoveries(autoDiscoveryService.getDiscoveries());
      setRules(autoDiscoveryService.getRules());
      setStats(autoDiscoveryService.getStats());
    } catch (error) {
      console.error('Failed to load auto-discovery data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleValidate = async (id: string) => {
    Alert.alert(
      'Validate Connection',
      'Confirm this is a legitimate service connection?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Validate',
          onPress: async () => {
            await autoDiscoveryService.validateDiscovery(id, 'Current User');
            await loadData();
          },
        },
      ]
    );
  };

  const handleReject = async (id: string) => {
    Alert.alert(
      'Mark as False Positive',
      'This connection will be marked as a false positive and ignored.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: async () => {
            await autoDiscoveryService.markAsFalsePositive(id, 'Marked by user');
            await loadData();
          },
        },
      ]
    );
  };

  const handleRunDiscovery = async (ruleId: string) => {
    try {
      await autoDiscoveryService.runDiscovery(ruleId);
      Alert.alert('Success', 'Discovery scan completed');
      await loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to run discovery');
    }
  };

  const handleToggleRule = async (id: string) => {
    await autoDiscoveryService.toggleRule(id);
    await loadData();
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${Math.round(bytes / 1024)} KB`;
    if (bytes < 1073741824) return `${Math.round(bytes / 1048576)} MB`;
    return `${(bytes / 1073741824).toFixed(1)} GB`;
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'validated': return '#22C55E';
      case 'rejected': return '#EF4444';
      case 'false_positive': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getConnectionTypeIcon = (type: string): string => {
    switch (type) {
      case 'api': return '🔌';
      case 'database': return '🗄️';
      case 'file_share': return '📁';
      case 'authentication': return '🔐';
      case 'messaging': return '💬';
      case 'monitoring': return '📊';
      case 'backup': return '💾';
      default: return '🔗';
    }
  };

  const filteredDiscoveries = discoveries.filter(d => {
    if (filter === 'pending') return d.status === 'pending';
    if (filter === 'validated') return d.status === 'validated';
    return true;
  });

  if (loading) {
    return (
      <ScreenContainer className="p-4">
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">Loading discoveries...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-2xl font-bold text-foreground mb-2">Auto-Discovery</Text>
        <Text className="text-muted mb-4">Detect new service connections via network analysis</Text>

        {/* Stats */}
        {stats && (
          <View className="flex-row flex-wrap gap-2 mb-4">
            <View className="bg-yellow-500/20 rounded-lg p-3 flex-1 min-w-[100px]">
              <Text className="text-yellow-600 text-xl font-bold">{stats.pendingValidation}</Text>
              <Text className="text-yellow-600 text-xs">Pending</Text>
            </View>
            <View className="bg-green-500/20 rounded-lg p-3 flex-1 min-w-[100px]">
              <Text className="text-green-600 text-xl font-bold">{stats.validatedConnections}</Text>
              <Text className="text-green-600 text-xs">Validated</Text>
            </View>
            <View className="bg-blue-500/20 rounded-lg p-3 flex-1 min-w-[100px]">
              <Text className="text-blue-600 text-xl font-bold">{stats.activeRules}</Text>
              <Text className="text-blue-600 text-xs">Active Rules</Text>
            </View>
          </View>
        )}

        {/* Tabs */}
        <View className="flex-row bg-surface rounded-lg p-1 mb-4">
          {(['discoveries', 'rules', 'history'] as TabType[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-md ${activeTab === tab ? 'bg-primary' : ''}`}
            >
              <Text className={`text-center font-medium capitalize ${activeTab === tab ? 'text-white' : 'text-muted'}`}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Discoveries Tab */}
        {activeTab === 'discoveries' && (
          <View className="gap-3">
            {/* Filter */}
            <View className="flex-row gap-2 mb-2">
              {(['all', 'pending', 'validated'] as const).map((f) => (
                <TouchableOpacity
                  key={f}
                  onPress={() => setFilter(f)}
                  className={`px-3 py-2 rounded-lg ${
                    filter === f ? 'bg-primary' : 'bg-surface border border-border'
                  }`}
                >
                  <Text className={filter === f ? 'text-white' : 'text-foreground'}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {filteredDiscoveries.length === 0 ? (
              <View className="bg-surface rounded-lg p-6 items-center">
                <Text className="text-muted">No discoveries found</Text>
              </View>
            ) : (
              filteredDiscoveries.map((discovery) => (
                <View key={discovery.id} className="bg-surface rounded-lg p-4 border border-border">
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-row items-center flex-1">
                      <Text className="text-2xl mr-2">{getConnectionTypeIcon(discovery.connectionType)}</Text>
                      <View className="flex-1">
                        <Text className="text-foreground font-semibold">
                          {discovery.serviceName || `${discovery.protocol} Connection`}
                        </Text>
                        <Text className="text-muted text-sm">
                          {discovery.sourceSiteName} → {discovery.targetSiteName}
                        </Text>
                      </View>
                    </View>
                    <View
                      className="px-2 py-1 rounded"
                      style={{ backgroundColor: getStatusColor(discovery.status) + '20' }}
                    >
                      <Text style={{ color: getStatusColor(discovery.status) }} className="text-xs font-medium capitalize">
                        {discovery.status.replace('_', ' ')}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row flex-wrap gap-2 mb-3">
                    <View className="bg-background rounded px-2 py-1">
                      <Text className="text-muted text-xs">{discovery.protocol}:{discovery.port}</Text>
                    </View>
                    <View className="bg-background rounded px-2 py-1">
                      <Text className="text-muted text-xs">{formatBytes(discovery.trafficVolume)}</Text>
                    </View>
                    <View className="bg-background rounded px-2 py-1">
                      <Text className="text-muted text-xs">{discovery.latency}ms</Text>
                    </View>
                    {discovery.isEncrypted && (
                      <View className="bg-green-500/20 rounded px-2 py-1">
                        <Text className="text-green-600 text-xs">🔒 Encrypted</Text>
                      </View>
                    )}
                  </View>

                  <Text className="text-muted text-xs mb-2">
                    First seen: {formatDate(discovery.firstSeen)}
                  </Text>

                  {discovery.description && (
                    <Text className="text-foreground text-sm mb-3">{discovery.description}</Text>
                  )}

                  {discovery.status === 'pending' && (
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        onPress={() => handleValidate(discovery.id)}
                        className="flex-1 bg-green-500 py-2 rounded-lg"
                      >
                        <Text className="text-white text-center font-medium">Validate</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleReject(discovery.id)}
                        className="flex-1 bg-gray-500 py-2 rounded-lg"
                      >
                        <Text className="text-white text-center font-medium">False Positive</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {discovery.validatedBy && (
                    <Text className="text-green-600 text-xs mt-2">
                      ✓ Validated by {discovery.validatedBy}
                    </Text>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {/* Rules Tab */}
        {activeTab === 'rules' && (
          <View className="gap-3">
            {rules.map((rule) => (
              <View key={rule.id} className="bg-surface rounded-lg p-4 border border-border">
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1">
                    <Text className="text-foreground font-semibold">{rule.name}</Text>
                    <Text className="text-muted text-sm">{rule.description}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleToggleRule(rule.id)}
                    className={`px-3 py-1 rounded-full ${rule.isEnabled ? 'bg-green-500' : 'bg-gray-500'}`}
                  >
                    <Text className="text-white text-xs font-medium">
                      {rule.isEnabled ? 'ON' : 'OFF'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View className="flex-row flex-wrap gap-2 mb-3">
                  <View className="bg-background rounded px-2 py-1">
                    <Text className="text-muted text-xs capitalize">{rule.method.replace('_', ' ')}</Text>
                  </View>
                  <View className="bg-background rounded px-2 py-1">
                    <Text className="text-muted text-xs">{rule.schedule}</Text>
                  </View>
                  {rule.autoValidate && (
                    <View className="bg-blue-500/20 rounded px-2 py-1">
                      <Text className="text-blue-600 text-xs">Auto-validate</Text>
                    </View>
                  )}
                </View>

                {rule.lastRun && (
                  <Text className="text-muted text-xs mb-2">
                    Last run: {formatDate(rule.lastRun)}
                  </Text>
                )}

                <TouchableOpacity
                  onPress={() => handleRunDiscovery(rule.id)}
                  className="bg-primary py-2 rounded-lg"
                >
                  <Text className="text-white text-center font-medium">Run Now</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <View className="gap-3">
            {autoDiscoveryService.getRuns().map((run) => (
              <View key={run.id} className="bg-surface rounded-lg p-4 border border-border">
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1">
                    <Text className="text-foreground font-semibold">{run.ruleName}</Text>
                    <Text className="text-muted text-sm">{formatDate(run.startedAt)}</Text>
                  </View>
                  <View
                    className="px-2 py-1 rounded"
                    style={{ backgroundColor: run.status === 'completed' ? '#22C55E20' : run.status === 'running' ? '#3B82F620' : '#EF444420' }}
                  >
                    <Text 
                      style={{ color: run.status === 'completed' ? '#22C55E' : run.status === 'running' ? '#3B82F6' : '#EF4444' }} 
                      className="text-xs font-medium capitalize"
                    >
                      {run.status}
                    </Text>
                  </View>
                </View>

                <View className="flex-row gap-2">
                  <View className="flex-1 bg-background rounded p-2">
                    <Text className="text-muted text-xs">Sites</Text>
                    <Text className="text-foreground font-medium">{run.sitesScanned}</Text>
                  </View>
                  <View className="flex-1 bg-background rounded p-2">
                    <Text className="text-muted text-xs">Found</Text>
                    <Text className="text-foreground font-medium">{run.connectionsFound}</Text>
                  </View>
                  <View className="flex-1 bg-background rounded p-2">
                    <Text className="text-muted text-xs">New</Text>
                    <Text className="text-foreground font-medium">{run.newConnections}</Text>
                  </View>
                  <View className="flex-1 bg-background rounded p-2">
                    <Text className="text-muted text-xs">Duration</Text>
                    <Text className="text-foreground font-medium">{run.duration}s</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        <View className="h-20" />
      </ScrollView>
    </ScreenContainer>
  );
}
