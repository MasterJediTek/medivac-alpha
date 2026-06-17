import { useState, useEffect, useCallback } from 'react';
import { ScrollView, Text, View, TouchableOpacity, TextInput, Alert, RefreshControl } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { approvalDelegationService, Delegation, DelegationStats, DelegationReason } from '@/lib/services/approval-delegation-service';

type TabType = 'active' | 'create' | 'history';

export default function DelegationScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [stats, setStats] = useState<DelegationStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Create form state
  const [selectedDelegate, setSelectedDelegate] = useState('');
  const [reason, setReason] = useState<DelegationReason>('annual_leave');
  const [reasonDetails, setReasonDetails] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadData = useCallback(async () => {
    try {
      await approvalDelegationService.initialize();
      setDelegations(approvalDelegationService.getDelegations());
      setStats(approvalDelegationService.getStats());
    } catch (error) {
      console.error('Failed to load delegations:', error);
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

  const handleRevoke = async (id: string) => {
    Alert.alert(
      'Revoke Delegation',
      'Are you sure you want to revoke this delegation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            await approvalDelegationService.revokeDelegation(id, 'Current User', 'Manual revocation');
            await loadData();
          },
        },
      ]
    );
  };

  const handleCreate = async () => {
    if (!selectedDelegate || !startDate || !endDate) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const delegates = approvalDelegationService.getAvailableDelegates();
      const delegate = delegates.find(d => d.id === selectedDelegate);
      if (!delegate) return;

      await approvalDelegationService.createDelegation({
        delegatorId: 'current_user',
        delegatorName: 'Current User',
        delegatorRole: 'Manager',
        delegateId: delegate.id,
        delegateName: delegate.name,
        delegateRole: delegate.role,
        reason,
        reasonDetails,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        scopes: [
          { type: 'environment', values: ['staging', 'production'] },
        ],
        maxApprovalLevel: 3,
        requireNotification: true,
        autoRevoke: true,
      });

      Alert.alert('Success', 'Delegation created successfully');
      setSelectedDelegate('');
      setReasonDetails('');
      setStartDate('');
      setEndDate('');
      setActiveTab('active');
      await loadData();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create delegation');
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return '#22C55E';
      case 'pending': return '#F59E0B';
      case 'expired': return '#6B7280';
      case 'revoked': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getReasonLabel = (r: DelegationReason): string => {
    const labels: Record<DelegationReason, string> = {
      annual_leave: 'Annual Leave',
      sick_leave: 'Sick Leave',
      training: 'Training',
      conference: 'Conference',
      emergency: 'Emergency',
      other: 'Other',
    };
    return labels[r];
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <ScreenContainer className="p-4">
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">Loading delegations...</Text>
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
        <Text className="text-2xl font-bold text-foreground mb-2">Approval Delegation</Text>
        <Text className="text-muted mb-4">Delegate approval authority during leave or unavailability</Text>

        {/* Stats */}
        {stats && (
          <View className="flex-row flex-wrap gap-2 mb-4">
            <View className="bg-green-500/20 rounded-lg p-3 flex-1 min-w-[100px]">
              <Text className="text-green-600 text-xl font-bold">{stats.activeDelegations}</Text>
              <Text className="text-green-600 text-xs">Active</Text>
            </View>
            <View className="bg-yellow-500/20 rounded-lg p-3 flex-1 min-w-[100px]">
              <Text className="text-yellow-600 text-xl font-bold">{stats.pendingDelegations}</Text>
              <Text className="text-yellow-600 text-xs">Pending</Text>
            </View>
            <View className="bg-blue-500/20 rounded-lg p-3 flex-1 min-w-[100px]">
              <Text className="text-blue-600 text-xl font-bold">{stats.usageCount}</Text>
              <Text className="text-blue-600 text-xs">Times Used</Text>
            </View>
          </View>
        )}

        {/* Tabs */}
        <View className="flex-row bg-surface rounded-lg p-1 mb-4">
          {(['active', 'create', 'history'] as TabType[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-md ${activeTab === tab ? 'bg-primary' : ''}`}
            >
              <Text className={`text-center font-medium ${activeTab === tab ? 'text-white' : 'text-muted'}`}>
                {tab === 'active' ? 'Active' : tab === 'create' ? 'Create' : 'History'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Active Delegations Tab */}
        {activeTab === 'active' && (
          <View className="gap-3">
            {delegations.filter(d => d.status === 'active' || d.status === 'pending').length === 0 ? (
              <View className="bg-surface rounded-lg p-6 items-center">
                <Text className="text-muted">No active delegations</Text>
                <TouchableOpacity
                  onPress={() => setActiveTab('create')}
                  className="mt-3 bg-primary px-4 py-2 rounded-lg"
                >
                  <Text className="text-white font-medium">Create Delegation</Text>
                </TouchableOpacity>
              </View>
            ) : (
              delegations
                .filter(d => d.status === 'active' || d.status === 'pending')
                .map((delegation) => (
                  <View key={delegation.id} className="bg-surface rounded-lg p-4 border border-border">
                    <View className="flex-row justify-between items-start mb-2">
                      <View className="flex-1">
                        <Text className="text-foreground font-semibold">{delegation.delegateName}</Text>
                        <Text className="text-muted text-sm">{delegation.delegateRole}</Text>
                      </View>
                      <View
                        className="px-2 py-1 rounded"
                        style={{ backgroundColor: getStatusColor(delegation.status) + '20' }}
                      >
                        <Text style={{ color: getStatusColor(delegation.status) }} className="text-xs font-medium capitalize">
                          {delegation.status}
                        </Text>
                      </View>
                    </View>

                    <View className="bg-background rounded p-2 mb-2">
                      <Text className="text-muted text-xs">Reason</Text>
                      <Text className="text-foreground text-sm">{getReasonLabel(delegation.reason)}</Text>
                      {delegation.reasonDetails && (
                        <Text className="text-muted text-xs mt-1">{delegation.reasonDetails}</Text>
                      )}
                    </View>

                    <View className="flex-row gap-2 mb-3">
                      <View className="flex-1 bg-background rounded p-2">
                        <Text className="text-muted text-xs">Start</Text>
                        <Text className="text-foreground text-sm">{formatDate(delegation.startDate)}</Text>
                      </View>
                      <View className="flex-1 bg-background rounded p-2">
                        <Text className="text-muted text-xs">End</Text>
                        <Text className="text-foreground text-sm">{formatDate(delegation.endDate)}</Text>
                      </View>
                    </View>

                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        onPress={() => handleRevoke(delegation.id)}
                        className="flex-1 bg-red-500/20 py-2 rounded-lg"
                      >
                        <Text className="text-red-500 text-center font-medium">Revoke</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
            )}
          </View>
        )}

        {/* Create Delegation Tab */}
        {activeTab === 'create' && (
          <View className="gap-4">
            <View className="bg-surface rounded-lg p-4 border border-border">
              <Text className="text-foreground font-semibold mb-4">Create New Delegation</Text>

              <View className="mb-4">
                <Text className="text-muted text-sm mb-2">Select Delegate</Text>
                <View className="gap-2">
                  {approvalDelegationService.getAvailableDelegates().map((delegate) => (
                    <TouchableOpacity
                      key={delegate.id}
                      onPress={() => setSelectedDelegate(delegate.id)}
                      className={`p-3 rounded-lg border ${
                        selectedDelegate === delegate.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-background'
                      }`}
                    >
                      <Text className={`font-medium ${selectedDelegate === delegate.id ? 'text-primary' : 'text-foreground'}`}>
                        {delegate.name}
                      </Text>
                      <Text className="text-muted text-sm">{delegate.role}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View className="mb-4">
                <Text className="text-muted text-sm mb-2">Reason</Text>
                <View className="flex-row flex-wrap gap-2">
                  {(['annual_leave', 'sick_leave', 'training', 'conference', 'emergency', 'other'] as DelegationReason[]).map((r) => (
                    <TouchableOpacity
                      key={r}
                      onPress={() => setReason(r)}
                      className={`px-3 py-2 rounded-lg ${
                        reason === r ? 'bg-primary' : 'bg-background border border-border'
                      }`}
                    >
                      <Text className={reason === r ? 'text-white' : 'text-foreground'}>
                        {getReasonLabel(r)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View className="mb-4">
                <Text className="text-muted text-sm mb-2">Details (Optional)</Text>
                <TextInput
                  value={reasonDetails}
                  onChangeText={setReasonDetails}
                  placeholder="Additional details..."
                  placeholderTextColor="#9BA1A6"
                  className="bg-background border border-border rounded-lg p-3 text-foreground"
                  multiline
                  numberOfLines={2}
                />
              </View>

              <View className="flex-row gap-2 mb-4">
                <View className="flex-1">
                  <Text className="text-muted text-sm mb-2">Start Date</Text>
                  <TextInput
                    value={startDate}
                    onChangeText={setStartDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#9BA1A6"
                    className="bg-background border border-border rounded-lg p-3 text-foreground"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-muted text-sm mb-2">End Date</Text>
                  <TextInput
                    value={endDate}
                    onChangeText={setEndDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#9BA1A6"
                    className="bg-background border border-border rounded-lg p-3 text-foreground"
                  />
                </View>
              </View>

              <TouchableOpacity
                onPress={handleCreate}
                className="bg-primary py-3 rounded-lg"
              >
                <Text className="text-white text-center font-semibold">Create Delegation</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <View className="gap-3">
            {delegations.filter(d => d.status === 'expired' || d.status === 'revoked').length === 0 ? (
              <View className="bg-surface rounded-lg p-6 items-center">
                <Text className="text-muted">No delegation history</Text>
              </View>
            ) : (
              delegations
                .filter(d => d.status === 'expired' || d.status === 'revoked')
                .map((delegation) => (
                  <View key={delegation.id} className="bg-surface rounded-lg p-4 border border-border opacity-75">
                    <View className="flex-row justify-between items-start mb-2">
                      <View className="flex-1">
                        <Text className="text-foreground font-semibold">{delegation.delegateName}</Text>
                        <Text className="text-muted text-sm">{delegation.delegateRole}</Text>
                      </View>
                      <View
                        className="px-2 py-1 rounded"
                        style={{ backgroundColor: getStatusColor(delegation.status) + '20' }}
                      >
                        <Text style={{ color: getStatusColor(delegation.status) }} className="text-xs font-medium capitalize">
                          {delegation.status}
                        </Text>
                      </View>
                    </View>

                    <Text className="text-muted text-sm">
                      {formatDate(delegation.startDate)} - {formatDate(delegation.endDate)}
                    </Text>
                    <Text className="text-muted text-sm mt-1">{getReasonLabel(delegation.reason)}</Text>

                    {delegation.revokeReason && (
                      <Text className="text-red-500 text-sm mt-2">
                        Revoked: {delegation.revokeReason}
                      </Text>
                    )}
                  </View>
                ))
            )}
          </View>
        )}

        <View className="h-20" />
      </ScrollView>
    </ScreenContainer>
  );
}
