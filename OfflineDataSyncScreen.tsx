/**
 * Offline Data Sync Screen
 * Manage offline sync queue and resolve conflicts
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { cn } from '@/lib/utils';
import { offlineDataSyncService, SyncQueueItem, SyncConflict } from '@/lib/services/offline-data-sync.service';

type TabMode = 'queue' | 'conflicts' | 'history';

export default function OfflineDataSyncScreen() {
  const colors = useColors();
  const [tab, setTab] = useState<TabMode>('queue');
  const [syncStatus, setSyncStatus] = useState(offlineDataSyncService.getSyncStatus());
  const [pendingItems, setPendingItems] = useState<SyncQueueItem[]>([]);
  const [failedItems, setFailedItems] = useState<SyncQueueItem[]>([]);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      await offlineDataSyncService.initialize();
      setSyncStatus(offlineDataSyncService.getSyncStatus());
      setPendingItems(offlineDataSyncService.getPendingItems());
      setFailedItems(offlineDataSyncService.getFailedItems());
      setConflicts(offlineDataSyncService.getConflicts());
    } catch (error) {
      console.error('[Offline Sync] Error loading data:', error);
    }
  };

  const handleStartSync = async () => {
    setSyncing(true);
    try {
      await offlineDataSyncService.startSync();
      await loadData();
    } catch (error) {
      console.error('[Offline Sync] Error starting sync:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleRetryFailed = async () => {
    setSyncing(true);
    try {
      await offlineDataSyncService.retryFailedItems();
      await loadData();
    } catch (error) {
      console.error('[Offline Sync] Error retrying:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleResolveConflict = async (conflictId: string, resolution: 'local' | 'remote' | 'merge') => {
    try {
      await offlineDataSyncService.resolveConflict(conflictId, resolution);
      await loadData();
    } catch (error) {
      console.error('[Offline Sync] Error resolving conflict:', error);
    }
  };

  const handleClearResolved = async () => {
    try {
      await offlineDataSyncService.clearResolvedItems();
      await loadData();
    } catch (error) {
      console.error('[Offline Sync] Error clearing resolved:', error);
    }
  };

  const getTypeIcon = (type: SyncQueueItem['type']) => {
    const icons: Record<SyncQueueItem['type'], string> = {
      patient_record: '👤',
      staff_assignment: '👨‍⚕️',
      route_update: '🗺️',
      appointment: '📅',
      directive: '📋',
    };
    return icons[type];
  };

  const getTypeLabel = (type: SyncQueueItem['type']) => {
    return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const getStatusColor = (status: SyncQueueItem['status']) => {
    switch (status) {
      case 'pending':
        return '#eab308'; // Yellow
      case 'syncing':
        return '#3b82f6'; // Blue
      case 'synced':
        return '#22c55e'; // Green
      case 'failed':
        return '#ef4444'; // Red
      default:
        return '#6b7280'; // Gray
    }
  };

  const stats = offlineDataSyncService.getSyncStats();

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground mb-2">
            Offline Data Sync
          </Text>
          <Text className="text-muted">
            Manage offline synchronization and conflicts
          </Text>
        </View>

        {/* Sync Status */}
        <View className="bg-surface rounded-2xl p-4 mb-4 border border-border">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-foreground font-semibold">Sync Status</Text>
            {syncStatus.isSyncing && <ActivityIndicator color={colors.primary} />}
          </View>

          <View className="grid grid-cols-2 gap-3 mb-4">
            <View className="bg-background rounded-lg p-3">
              <Text className="text-muted text-xs mb-1">Pending Items</Text>
              <Text className="text-2xl font-bold text-warning">{syncStatus.pendingItems}</Text>
            </View>
            <View className="bg-background rounded-lg p-3">
              <Text className="text-muted text-xs mb-1">Failed Items</Text>
              <Text className="text-2xl font-bold text-error">{syncStatus.failedItems}</Text>
            </View>
            <View className="bg-background rounded-lg p-3">
              <Text className="text-muted text-xs mb-1">Conflicts</Text>
              <Text className="text-2xl font-bold text-primary">{syncStatus.conflicts}</Text>
            </View>
            <View className="bg-background rounded-lg p-3">
              <Text className="text-muted text-xs mb-1">Progress</Text>
              <Text className="text-2xl font-bold text-foreground">{syncStatus.progress}%</Text>
            </View>
          </View>

          {syncStatus.lastSyncAt && (
            <Text className="text-muted text-xs">
              Last sync: {new Date(syncStatus.lastSyncAt).toLocaleTimeString()}
            </Text>
          )}
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-2 mb-4">
          <Pressable
            onPress={handleStartSync}
            disabled={syncing || syncStatus.pendingItems === 0}
            className={cn(
              'flex-1 py-3 rounded-lg items-center',
              syncing || syncStatus.pendingItems === 0 ? 'bg-muted opacity-50' : 'bg-primary'
            )}
          >
            {syncing ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold">Start Sync</Text>
            )}
          </Pressable>
          {syncStatus.failedItems > 0 && (
            <Pressable
              onPress={handleRetryFailed}
              disabled={syncing}
              className="flex-1 bg-warning py-3 rounded-lg items-center"
            >
              <Text className="text-white font-semibold">Retry Failed</Text>
            </Pressable>
          )}
        </View>

        {/* Tabs */}
        <View className="flex-row gap-2 mb-4">
          {(['queue', 'conflicts', 'history'] as const).map(t => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              className={cn(
                'flex-1 py-2 rounded-lg',
                tab === t ? 'bg-primary' : 'bg-surface border border-border'
              )}
            >
              <Text
                className={cn(
                  'text-center font-semibold text-sm',
                  tab === t ? 'text-white' : 'text-foreground'
                )}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Queue Tab */}
        {tab === 'queue' && (
          <View>
            {pendingItems.length > 0 ? (
              <View>
                {pendingItems.map(item => (
                  <View key={item.id} className="bg-surface rounded-2xl p-4 mb-3 border border-border">
                    <View className="flex-row items-start justify-between mb-2">
                      <View className="flex-1 flex-row items-center gap-2">
                        <Text className="text-2xl">{getTypeIcon(item.type)}</Text>
                        <View>
                          <Text className="text-foreground font-semibold">{getTypeLabel(item.type)}</Text>
                          <Text className="text-muted text-xs">{item.operation.toUpperCase()}</Text>
                        </View>
                      </View>
                      <View
                        className="rounded-full px-2 py-1"
                        style={{ backgroundColor: getStatusColor(item.status) }}
                      >
                        <Text className="text-white text-xs font-semibold">
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-muted text-xs">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View className="bg-surface rounded-2xl p-8 items-center border border-border">
                <Text className="text-muted text-center">No pending items</Text>
              </View>
            )}
          </View>
        )}

        {/* Conflicts Tab */}
        {tab === 'conflicts' && (
          <View>
            {conflicts.length > 0 ? (
              <View>
                {conflicts.map(conflict => (
                  <View key={conflict.id} className="bg-surface rounded-2xl p-4 mb-3 border border-warning/50">
                    <Text className="text-foreground font-semibold mb-3">
                      {getTypeLabel(conflict.type)} Conflict
                    </Text>
                    <View className="bg-background rounded-lg p-3 mb-3">
                      <Text className="text-muted text-xs mb-1">Local Version</Text>
                      <Text className="text-foreground text-sm font-mono">
                        {JSON.stringify(conflict.localVersion).substring(0, 100)}...
                      </Text>
                    </View>
                    <View className="bg-background rounded-lg p-3 mb-3">
                      <Text className="text-muted text-xs mb-1">Remote Version</Text>
                      <Text className="text-foreground text-sm font-mono">
                        {JSON.stringify(conflict.remoteVersion).substring(0, 100)}...
                      </Text>
                    </View>
                    <View className="flex-row gap-2">
                      <Pressable
                        onPress={() => handleResolveConflict(conflict.id, 'local')}
                        className="flex-1 bg-primary/10 py-2 rounded-lg items-center border border-primary/30"
                      >
                        <Text className="text-primary font-semibold text-xs">Keep Local</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleResolveConflict(conflict.id, 'remote')}
                        className="flex-1 bg-primary/10 py-2 rounded-lg items-center border border-primary/30"
                      >
                        <Text className="text-primary font-semibold text-xs">Use Remote</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleResolveConflict(conflict.id, 'merge')}
                        className="flex-1 bg-primary py-2 rounded-lg items-center"
                      >
                        <Text className="text-white font-semibold text-xs">Merge</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View className="bg-surface rounded-2xl p-8 items-center border border-border">
                <Text className="text-muted text-center">No conflicts detected</Text>
              </View>
            )}
          </View>
        )}

        {/* History Tab */}
        {tab === 'history' && (
          <View>
            <View className="bg-surface rounded-2xl p-4 mb-4 border border-border">
              <Text className="text-foreground font-semibold mb-3">Sync Statistics</Text>
              <View className="space-y-2">
                <View className="flex-row justify-between">
                  <Text className="text-muted">Total Items</Text>
                  <Text className="text-foreground font-semibold">{stats.totalItems}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-muted">Last Sync</Text>
                  <Text className="text-foreground font-semibold">
                    {stats.lastSync ? new Date(stats.lastSync).toLocaleTimeString() : 'Never'}
                  </Text>
                </View>
              </View>
            </View>

            {failedItems.length > 0 && (
              <View>
                <Text className="text-foreground font-semibold mb-3">Failed Items</Text>
                {failedItems.map(item => (
                  <View key={item.id} className="bg-error/10 rounded-2xl p-4 mb-3 border border-error/30">
                    <Text className="text-foreground font-semibold mb-1">{getTypeLabel(item.type)}</Text>
                    <Text className="text-error text-sm">{item.errorMessage}</Text>
                  </View>
                ))}
              </View>
            )}

            {failedItems.length > 0 && (
              <Pressable
                onPress={handleClearResolved}
                className="bg-surface py-3 rounded-lg items-center border border-border"
              >
                <Text className="text-foreground font-semibold">Clear Resolved Items</Text>
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
