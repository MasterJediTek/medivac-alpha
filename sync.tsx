import { useState, useEffect, useCallback } from "react";
import { ScrollView, Text, View, TouchableOpacity, RefreshControl, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useRouter } from "expo-router";
import {
  getOfflineState,
  getActionQueue,
  getSyncLog,
  triggerSync,
  clearAllActions,
  getConflicts,
  resolveConflict,
  onNetworkChange,
  onSyncProgress,
  onSyncComplete,
  OfflineState,
  QueuedAction,
  SyncResult,
} from "@/lib/offline";

export default function SyncScreen() {
  const colors = useColors();
  const router = useRouter();
  const [offlineState, setOfflineState] = useState<OfflineState | null>(null);
  const [actionQueue, setActionQueue] = useState<QueuedAction[]>([]);
  const [syncLog, setSyncLog] = useState<Array<SyncResult & { timestamp: string }>>([]);
  const [conflicts, setConflicts] = useState<QueuedAction[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);

  useEffect(() => {
    loadData();

    // Subscribe to events
    const unsubNetwork = onNetworkChange(setOfflineState);
    const unsubProgress = onSyncProgress(setSyncProgress);
    const unsubComplete = onSyncComplete(() => loadData());

    return () => {
      unsubNetwork();
      unsubProgress();
      unsubComplete();
    };
  }, []);

  const loadData = async () => {
    try {
      const state = getOfflineState();
      setOfflineState(state);
      
      const queue = await getActionQueue();
      setActionQueue(queue);
      
      const log = await getSyncLog();
      setSyncLog(log);
      
      const conflictList = await getConflicts();
      setConflicts(conflictList);
    } catch (error) {
      console.error('Error loading sync data:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  }, []);

  const handleSync = async () => {
    await triggerSync();
    await loadData();
  };

  const handleClearQueue = async () => {
    await clearAllActions();
    await loadData();
  };

  const handleResolveConflict = async (actionId: string, resolution: 'local' | 'remote') => {
    await resolveConflict({ actionId, resolution });
    await loadData();
  };

  const getStatusColor = (status: QueuedAction['status']): string => {
    switch (status) {
      case 'pending': return colors.warning;
      case 'syncing': return colors.primary;
      case 'completed': return colors.success;
      case 'failed': return colors.error;
      case 'conflict': return '#8B5CF6';
      default: return colors.muted;
    }
  };

  const getActionTypeLabel = (type: string): string => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const pendingCount = actionQueue.filter(a => a.status === 'pending').length;
  const failedCount = actionQueue.filter(a => a.status === 'failed').length;

  return (
    <ScreenContainer className="flex-1">
      {/* Header */}
      <View className="px-5 pt-4 pb-4 flex-row items-center gap-3">
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-foreground text-2xl font-bold">Sync Status</Text>
          <Text className="text-muted text-sm">Offline queue and sync management</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {/* Connection Status */}
        <View className="bg-surface rounded-2xl p-4 mb-6">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View
                className="w-12 h-12 rounded-full items-center justify-center"
                style={{
                  backgroundColor: offlineState?.isOnline
                    ? colors.success + '20'
                    : colors.error + '20',
                }}
              >
                <IconSymbol
                  name={offlineState?.isOnline ? 'wifi' : 'wifi'}
                  size={24}
                  color={offlineState?.isOnline ? colors.success : colors.error}
                />
              </View>
              <View>
                <Text className="text-foreground font-semibold text-lg">
                  {offlineState?.isOnline ? 'Online' : 'Offline'}
                </Text>
                <Text className="text-muted text-sm">
                  {offlineState?.connectionType || 'Unknown connection'}
                </Text>
              </View>
            </View>
            <View
              className="w-4 h-4 rounded-full"
              style={{
                backgroundColor: offlineState?.isOnline ? colors.success : colors.error,
              }}
            />
          </View>
          
          {offlineState?.lastOnlineAt && !offlineState.isOnline && (
            <Text className="text-muted text-xs mt-3">
              Last online: {new Date(offlineState.lastOnlineAt).toLocaleString()}
            </Text>
          )}
        </View>

        {/* Sync Progress */}
        {offlineState?.isSyncing && (
          <View className="bg-surface rounded-2xl p-4 mb-6">
            <View className="flex-row items-center gap-3 mb-3">
              <ActivityIndicator color={colors.primary} />
              <Text className="text-foreground font-semibold">Syncing...</Text>
            </View>
            <View className="h-2 bg-border rounded-full overflow-hidden">
              <View
                className="h-full rounded-full"
                style={{
                  width: `${syncProgress}%`,
                  backgroundColor: colors.primary,
                }}
              />
            </View>
            <Text className="text-muted text-xs mt-2 text-center">{syncProgress}%</Text>
          </View>
        )}

        {/* Quick Stats */}
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 bg-surface rounded-2xl p-4">
            <Text className="text-muted text-sm">Pending</Text>
            <Text className="text-foreground text-2xl font-bold">{pendingCount}</Text>
          </View>
          <View className="flex-1 bg-surface rounded-2xl p-4">
            <Text className="text-muted text-sm">Failed</Text>
            <Text style={{ color: colors.error }} className="text-2xl font-bold">
              {failedCount}
            </Text>
          </View>
          <View className="flex-1 bg-surface rounded-2xl p-4">
            <Text className="text-muted text-sm">Conflicts</Text>
            <Text style={{ color: '#8B5CF6' }} className="text-2xl font-bold">
              {conflicts.length}
            </Text>
          </View>
        </View>

        {/* Sync Button */}
        <TouchableOpacity
          className="py-4 rounded-xl items-center mb-6"
          style={{
            backgroundColor: offlineState?.isOnline ? colors.primary : colors.muted,
            opacity: offlineState?.isSyncing ? 0.5 : 1,
          }}
          onPress={handleSync}
          disabled={!offlineState?.isOnline || offlineState?.isSyncing}
          activeOpacity={0.8}
        >
          <View className="flex-row items-center gap-2">
            <IconSymbol name="arrow.triangle.2.circlepath" size={20} color="#FFFFFF" />
            <Text className="text-background font-semibold text-base">
              {offlineState?.isSyncing ? 'Syncing...' : 'Sync Now'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Conflicts */}
        {conflicts.length > 0 && (
          <>
            <Text className="text-muted text-sm font-semibold uppercase tracking-wide mb-3">
              Conflicts ({conflicts.length})
            </Text>
            <View className="bg-surface rounded-2xl p-4 mb-6">
              {conflicts.map((conflict) => (
                <View
                  key={conflict.id}
                  className="py-3 border-b border-border last:border-b-0"
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-foreground font-medium">
                      {getActionTypeLabel(conflict.type)}
                    </Text>
                    <View
                      className="px-2 py-1 rounded-full"
                      style={{ backgroundColor: '#8B5CF6' + '20' }}
                    >
                      <Text style={{ color: '#8B5CF6', fontSize: 10, fontWeight: '600' }}>
                        CONFLICT
                      </Text>
                    </View>
                  </View>
                  <Text className="text-muted text-sm mb-3">
                    {new Date(conflict.timestamp).toLocaleString()}
                  </Text>
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      className="flex-1 py-2 rounded-lg items-center"
                      style={{ backgroundColor: colors.primary }}
                      onPress={() => handleResolveConflict(conflict.id, 'local')}
                      activeOpacity={0.8}
                    >
                      <Text className="text-background text-sm font-semibold">Keep Local</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="flex-1 py-2 rounded-lg items-center border"
                      style={{ borderColor: colors.border }}
                      onPress={() => handleResolveConflict(conflict.id, 'remote')}
                      activeOpacity={0.8}
                    >
                      <Text className="text-foreground text-sm font-semibold">Use Remote</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Action Queue */}
        {actionQueue.length > 0 && (
          <>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-muted text-sm font-semibold uppercase tracking-wide">
                Queue ({actionQueue.length})
              </Text>
              <TouchableOpacity onPress={handleClearQueue} activeOpacity={0.7}>
                <Text style={{ color: colors.error, fontSize: 12, fontWeight: '600' }}>
                  Clear All
                </Text>
              </TouchableOpacity>
            </View>
            <View className="bg-surface rounded-2xl px-4 mb-6">
              {actionQueue.slice(0, 10).map((action, index) => (
                <View
                  key={action.id}
                  className="py-3 flex-row items-center gap-3"
                  style={{
                    borderBottomWidth: index < Math.min(actionQueue.length, 10) - 1 ? 1 : 0,
                    borderBottomColor: colors.border,
                  }}
                >
                  <View
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getStatusColor(action.status) }}
                  />
                  <View className="flex-1">
                    <Text className="text-foreground text-sm font-medium">
                      {getActionTypeLabel(action.type)}
                    </Text>
                    <Text className="text-muted text-xs">
                      {new Date(action.timestamp).toLocaleString()}
                    </Text>
                  </View>
                  <View
                    className="px-2 py-1 rounded-full"
                    style={{ backgroundColor: getStatusColor(action.status) + '20' }}
                  >
                    <Text
                      style={{
                        color: getStatusColor(action.status),
                        fontSize: 10,
                        fontWeight: '600',
                        textTransform: 'uppercase',
                      }}
                    >
                      {action.status}
                    </Text>
                  </View>
                </View>
              ))}
              {actionQueue.length > 10 && (
                <Text className="text-muted text-sm text-center py-3">
                  +{actionQueue.length - 10} more actions
                </Text>
              )}
            </View>
          </>
        )}

        {/* Sync History */}
        {syncLog.length > 0 && (
          <>
            <Text className="text-muted text-sm font-semibold uppercase tracking-wide mb-3">
              Sync History
            </Text>
            <View className="bg-surface rounded-2xl px-4 mb-6">
              {syncLog.slice(0, 5).map((log, index) => (
                <View
                  key={index}
                  className="py-3"
                  style={{
                    borderBottomWidth: index < Math.min(syncLog.length, 5) - 1 ? 1 : 0,
                    borderBottomColor: colors.border,
                  }}
                >
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-foreground text-sm font-medium">
                      {new Date(log.timestamp).toLocaleString()}
                    </Text>
                    <View
                      className="px-2 py-1 rounded-full"
                      style={{
                        backgroundColor:
                          log.failed > 0 ? colors.error + '20' : colors.success + '20',
                      }}
                    >
                      <Text
                        style={{
                          color: log.failed > 0 ? colors.error : colors.success,
                          fontSize: 10,
                          fontWeight: '600',
                        }}
                      >
                        {log.failed > 0 ? 'PARTIAL' : 'SUCCESS'}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-muted text-xs">
                    {log.synced}/{log.total} synced
                    {log.failed > 0 && ` • ${log.failed} failed`}
                    {log.conflicts > 0 && ` • ${log.conflicts} conflicts`}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Empty State */}
        {actionQueue.length === 0 && syncLog.length === 0 && (
          <View className="items-center py-10">
            <View
              className="w-20 h-20 rounded-full items-center justify-center mb-4"
              style={{ backgroundColor: colors.success + '20' }}
            >
              <IconSymbol name="checkmark.circle.fill" size={40} color={colors.success} />
            </View>
            <Text className="text-foreground font-semibold text-lg mb-2">All Synced</Text>
            <Text className="text-muted text-center">
              No pending actions. All data is up to date.
            </Text>
          </View>
        )}

        <View className="h-8" />
      </ScrollView>
    </ScreenContainer>
  );
}
