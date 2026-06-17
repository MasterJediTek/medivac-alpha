/**
 * Sync Status Screen
 * Displays real-time sync status, progress, and conflict resolution UI
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { 
  realTimeSyncService, 
  SyncStatus, 
  SyncStats, 
  SyncConflict,
  ConflictStrategy,
  SyncEvent,
} from '../services/RealTimeSyncService';

export default function SyncStatusScreen() {
  const colors = useColors();
  const [status, setStatus] = useState<SyncStatus>('disconnected');
  const [stats, setStats] = useState<SyncStats | null>(null);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [events, setEvents] = useState<SyncEvent[]>([]);

  // Load sync data
  const loadData = useCallback(() => {
    setStatus(realTimeSyncService.getStatus());
    setStats(realTimeSyncService.getStats());
    setConflicts(realTimeSyncService.getPendingConflicts());
  }, []);

  // Subscribe to sync events
  useEffect(() => {
    loadData();

    const unsubscribe = realTimeSyncService.addListener((event: SyncEvent) => {
      setEvents(prev => [event, ...prev].slice(0, 50));
      loadData();

      if (event.type === 'sync_started') {
        setSyncing(true);
      } else if (event.type === 'sync_completed' || event.type === 'sync_error') {
        setSyncing(false);
      }
    });

    return unsubscribe;
  }, [loadData]);

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  }, [loadData]);

  // Handle force sync
  const handleForceSync = async () => {
    try {
      setSyncing(true);
      await realTimeSyncService.forceSync();
    } catch (error) {
      Alert.alert('Sync Error', 'Failed to sync. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  // Handle connect/disconnect
  const handleToggleConnection = async () => {
    if (status === 'connected' || status === 'syncing') {
      realTimeSyncService.disconnect();
    } else {
      await realTimeSyncService.initialize();
    }
    loadData();
  };

  // Handle conflict resolution
  const handleResolveConflict = (conflict: SyncConflict, strategy: ConflictStrategy) => {
    Alert.alert(
      'Resolve Conflict',
      `Use ${strategy.replace('-', ' ')} strategy?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resolve',
          onPress: async () => {
            await realTimeSyncService.resolveConflict(conflict, strategy);
            loadData();
          },
        },
      ]
    );
  };

  // Get status color
  const getStatusColor = (s: SyncStatus): string => {
    switch (s) {
      case 'connected': return colors.success;
      case 'connecting': return colors.warning;
      case 'syncing': return colors.primary;
      case 'conflict': return colors.warning;
      case 'error': return colors.error;
      default: return colors.muted;
    }
  };

  // Format timestamp
  const formatTime = (timestamp: number): string => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  // Format bytes
  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Format duration
  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <ScreenContainer>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Real-Time Sync
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            JEDI/SMPO.ink Data Synchronization
          </Text>
        </View>

        {/* Connection Status */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.statusRow}>
            <View style={styles.statusInfo}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(status) }]} />
              <Text style={[styles.statusText, { color: colors.foreground }]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: status === 'connected' ? colors.error : colors.primary }]}
              onPress={handleToggleConnection}
            >
              <Text style={styles.buttonText}>
                {status === 'connected' || status === 'syncing' ? 'Disconnect' : 'Connect'}
              </Text>
            </TouchableOpacity>
          </View>

          {(status === 'connected' || status === 'syncing') && (
            <TouchableOpacity
              style={[styles.syncButton, { backgroundColor: colors.primary, opacity: syncing ? 0.7 : 1 }]}
              onPress={handleForceSync}
              disabled={syncing}
            >
              {syncing ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Force Sync Now</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Sync Statistics */}
        {stats && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              Sync Statistics
            </Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {stats.successfulSyncs}
                </Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>
                  Successful
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.error }]}>
                  {stats.failedSyncs}
                </Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>
                  Failed
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.warning }]}>
                  {stats.conflictsDetected}
                </Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>
                  Conflicts
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.success }]}>
                  {stats.conflictsResolved}
                </Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>
                  Resolved
                </Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.statsDetails}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.muted }]}>
                  Records Synced
                </Text>
                <Text style={[styles.detailValue, { color: colors.foreground }]}>
                  {stats.recordsSynced.toLocaleString()}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.muted }]}>
                  Data Transferred
                </Text>
                <Text style={[styles.detailValue, { color: colors.foreground }]}>
                  {formatBytes(stats.bytesTransferred)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.muted }]}>
                  Avg Sync Duration
                </Text>
                <Text style={[styles.detailValue, { color: colors.foreground }]}>
                  {formatDuration(stats.averageSyncDuration)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.muted }]}>
                  Last Sync
                </Text>
                <Text style={[styles.detailValue, { color: colors.foreground }]}>
                  {formatTime(stats.lastSyncTime)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Pending Conflicts */}
        {conflicts.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              Pending Conflicts ({conflicts.length})
            </Text>
            
            {conflicts.map((conflict) => (
              <View 
                key={conflict.id} 
                style={[styles.conflictItem, { borderColor: colors.warning }]}
              >
                <View style={styles.conflictHeader}>
                  <Text style={[styles.conflictType, { color: colors.foreground }]}>
                    {conflict.recordType}
                  </Text>
                  <Text style={[styles.conflictId, { color: colors.muted }]}>
                    ID: {conflict.recordId}
                  </Text>
                </View>
                
                <View style={styles.conflictDetails}>
                  <View style={styles.conflictVersion}>
                    <Text style={[styles.versionLabel, { color: colors.muted }]}>
                      Local v{conflict.localRecord.version}
                    </Text>
                    <Text style={[styles.versionTime, { color: colors.muted }]}>
                      {formatTime(conflict.localRecord.timestamp)}
                    </Text>
                  </View>
                  <View style={styles.conflictVersion}>
                    <Text style={[styles.versionLabel, { color: colors.muted }]}>
                      Remote v{conflict.remoteRecord.version}
                    </Text>
                    <Text style={[styles.versionTime, { color: colors.muted }]}>
                      {formatTime(conflict.remoteRecord.timestamp)}
                    </Text>
                  </View>
                </View>

                <View style={styles.conflictActions}>
                  <TouchableOpacity
                    style={[styles.resolveButton, { backgroundColor: colors.primary }]}
                    onPress={() => handleResolveConflict(conflict, 'merge')}
                  >
                    <Text style={styles.resolveButtonText}>Merge</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.resolveButton, { backgroundColor: colors.success }]}
                    onPress={() => handleResolveConflict(conflict, 'client-wins')}
                  >
                    <Text style={styles.resolveButtonText}>Keep Local</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.resolveButton, { backgroundColor: colors.warning }]}
                    onPress={() => handleResolveConflict(conflict, 'server-wins')}
                  >
                    <Text style={styles.resolveButtonText}>Use Server</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Recent Events */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            Recent Events
          </Text>
          
          {events.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              No sync events yet
            </Text>
          ) : (
            events.slice(0, 10).map((event, index) => (
              <View 
                key={`${event.timestamp}-${index}`}
                style={[styles.eventItem, { borderBottomColor: colors.border }]}
              >
                <View style={[
                  styles.eventDot, 
                  { backgroundColor: event.type.includes('error') ? colors.error : 
                    event.type.includes('conflict') ? colors.warning : colors.success }
                ]} />
                <View style={styles.eventInfo}>
                  <Text style={[styles.eventType, { color: colors.foreground }]}>
                    {event.type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </Text>
                  <Text style={[styles.eventTime, { color: colors.muted }]}>
                    {formatTime(event.timestamp)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Sync Configuration */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            Configuration
          </Text>
          
          <View style={styles.configItem}>
            <Text style={[styles.configLabel, { color: colors.muted }]}>
              Server URL
            </Text>
            <Text style={[styles.configValue, { color: colors.foreground }]}>
              {realTimeSyncService.getConfig().serverUrl}
            </Text>
          </View>
          <View style={styles.configItem}>
            <Text style={[styles.configLabel, { color: colors.muted }]}>
              Sync Interval
            </Text>
            <Text style={[styles.configValue, { color: colors.foreground }]}>
              {realTimeSyncService.getConfig().syncInterval / 1000}s
            </Text>
          </View>
          <View style={styles.configItem}>
            <Text style={[styles.configLabel, { color: colors.muted }]}>
              Conflict Strategy
            </Text>
            <Text style={[styles.configValue, { color: colors.foreground }]}>
              {realTimeSyncService.getConfig().conflictStrategy}
            </Text>
          </View>
          <View style={styles.configItem}>
            <Text style={[styles.configLabel, { color: colors.muted }]}>
              Delta Sync
            </Text>
            <Text style={[styles.configValue, { color: colors.foreground }]}>
              {realTimeSyncService.getConfig().deltaSync ? 'Enabled' : 'Disabled'}
            </Text>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  syncButton: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  statsDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  conflictItem: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  conflictHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  conflictType: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  conflictId: {
    fontSize: 12,
  },
  conflictDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  conflictVersion: {
    flex: 1,
  },
  versionLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  versionTime: {
    fontSize: 10,
  },
  conflictActions: {
    flexDirection: 'row',
    gap: 8,
  },
  resolveButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  resolveButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  eventDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  eventInfo: {
    flex: 1,
  },
  eventType: {
    fontSize: 14,
    fontWeight: '500',
  },
  eventTime: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 20,
  },
  configItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  configLabel: {
    fontSize: 14,
  },
  configValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  bottomPadding: {
    height: 100,
  },
});
