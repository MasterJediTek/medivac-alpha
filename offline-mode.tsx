// Offline Mode UI Screen for MediVac WACHS v9.6
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { offlineModeService, ConnectionStatus, SyncStatus, CachedData, SyncQueueItem, SyncConflict, StorageQuota, OfflineCapability, SyncHistory } from '@/lib/services/offline-mode-service';

type TabType = 'status' | 'cache' | 'sync' | 'settings';

export default function OfflineModeScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('status');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('online');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [storageQuota, setStorageQuota] = useState<StorageQuota | null>(null);
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [syncHistory, setSyncHistory] = useState<SyncHistory[]>([]);
  const [capabilities, setCapabilities] = useState<OfflineCapability[]>([]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = () => {
    setConnectionStatus(offlineModeService.getConnectionStatus());
    setSyncStatus(offlineModeService.getSyncStatus());
    setStorageQuota(offlineModeService.getStorageQuota());
    setSyncQueue(offlineModeService.getSyncQueue());
    setConflicts(offlineModeService.getConflicts());
    setSyncHistory(offlineModeService.getSyncHistory(10));
    setCapabilities(offlineModeService.getAllCapabilities());
  };

  const triggerSync = () => {
    offlineModeService.startSync();
    loadData();
  };

  const toggleOffline = () => {
    const newStatus = connectionStatus === 'online' ? 'offline' : 'online';
    offlineModeService.setConnectionStatus(newStatus);
    loadData();
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      {(['status', 'cache', 'sync', 'settings'] as TabType[]).map((tab) => (
        <Pressable
          key={tab}
          style={[styles.tab, activeTab === tab && styles.activeTab]}
          onPress={() => setActiveTab(tab)}
        >
          <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  const renderStatus = () => (
    <ScrollView style={styles.content}>
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <View style={[styles.statusIndicator, styles[`status_${connectionStatus}`]]} />
          <Text style={styles.statusTitle}>
            {connectionStatus === 'online' ? 'Online' : connectionStatus === 'offline' ? 'Offline' : connectionStatus}
          </Text>
        </View>
        <Pressable style={styles.toggleButton} onPress={toggleOffline}>
          <Text style={styles.toggleButtonText}>
            {connectionStatus === 'online' ? 'Go Offline' : 'Go Online'}
          </Text>
        </Pressable>
      </View>

      {storageQuota && (
        <View style={styles.storageCard}>
          <Text style={styles.cardTitle}>Storage Usage</Text>
          <View style={styles.storageBar}>
            <View style={[styles.storageFill, { width: `${storageQuota.percentage}%` }, storageQuota.critical && styles.storageCritical, storageQuota.warning && !storageQuota.critical && styles.storageWarning]} />
          </View>
          <Text style={styles.storageText}>
            {formatBytes(storageQuota.used)} / {formatBytes(storageQuota.total)} ({storageQuota.percentage.toFixed(1)}%)
          </Text>
          {storageQuota.warning && (
            <View style={[styles.alertBadge, storageQuota.critical ? styles.alertCritical : styles.alertWarning]}>
              <Text style={styles.alertText}>
                {storageQuota.critical ? '⚠️ Critical: Storage almost full' : '⚠️ Warning: Storage running low'}
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.syncStatusCard}>
        <Text style={styles.cardTitle}>Sync Status</Text>
        <View style={styles.syncStatusRow}>
          <View style={[styles.syncIndicator, styles[`sync_${syncStatus}`]]} />
          <Text style={styles.syncStatusText}>{syncStatus.toUpperCase()}</Text>
        </View>
        <View style={styles.syncStats}>
          <View style={styles.syncStat}>
            <Text style={styles.syncStatValue}>{syncQueue.length}</Text>
            <Text style={styles.syncStatLabel}>Pending</Text>
          </View>
          <View style={styles.syncStat}>
            <Text style={styles.syncStatValue}>{conflicts.length}</Text>
            <Text style={styles.syncStatLabel}>Conflicts</Text>
          </View>
        </View>
        <Pressable style={[styles.syncButton, syncStatus === 'syncing' && styles.syncButtonDisabled]} onPress={triggerSync} disabled={syncStatus === 'syncing'}>
          <Text style={styles.syncButtonText}>
            {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.analyticsCard}>
        <Text style={styles.cardTitle}>Offline Analytics</Text>
        {(() => {
          const analytics = offlineModeService.getAnalytics();
          return (
            <View style={styles.analyticsGrid}>
              <View style={styles.analyticItem}>
                <Text style={styles.analyticValue}>{analytics.totalCachedItems}</Text>
                <Text style={styles.analyticLabel}>Cached Items</Text>
              </View>
              <View style={styles.analyticItem}>
                <Text style={styles.analyticValue}>{formatBytes(analytics.totalCacheSize)}</Text>
                <Text style={styles.analyticLabel}>Cache Size</Text>
              </View>
              <View style={styles.analyticItem}>
                <Text style={styles.analyticValue}>{analytics.syncSuccessRate.toFixed(0)}%</Text>
                <Text style={styles.analyticLabel}>Sync Rate</Text>
              </View>
              <View style={styles.analyticItem}>
                <Text style={styles.analyticValue}>{Math.round(analytics.offlineUsageTime / 60000)}m</Text>
                <Text style={styles.analyticLabel}>Offline Time</Text>
              </View>
            </View>
          );
        })()}
      </View>
    </ScrollView>
  );

  const renderCache = () => (
    <ScrollView style={styles.content}>
      <Text style={styles.sectionTitle}>Cached Data by Category</Text>
      {storageQuota && Object.entries(storageQuota.byCategory).map(([category, size]) => (
        <View key={category} style={styles.cacheCard}>
          <View style={styles.cacheHeader}>
            <Text style={styles.cacheName}>{category.replace(/_/g, ' ')}</Text>
            <Text style={styles.cacheSize}>{formatBytes(size)}</Text>
          </View>
          <View style={styles.cacheMiniBar}>
            <View style={[styles.cacheMiniBarFill, { width: `${(size / storageQuota.total) * 100}%` }]} />
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderSync = () => (
    <ScrollView style={styles.content}>
      {conflicts.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Conflicts ({conflicts.length})</Text>
          {conflicts.map((conflict) => (
            <View key={conflict.id} style={styles.conflictCard}>
              <View style={styles.conflictHeader}>
                <Text style={styles.conflictCategory}>{conflict.category}</Text>
                <Text style={styles.conflictKey}>{conflict.key}</Text>
              </View>
              <View style={styles.conflictVersions}>
                <Text style={styles.conflictVersion}>Local v{conflict.localVersion}</Text>
                <Text style={styles.conflictVs}>vs</Text>
                <Text style={styles.conflictVersion}>Server v{conflict.serverVersion}</Text>
              </View>
              <View style={styles.conflictActions}>
                <Pressable style={styles.conflictButton} onPress={() => offlineModeService.resolveConflict(conflict.id, 'local_wins')}>
                  <Text style={styles.conflictButtonText}>Keep Local</Text>
                </Pressable>
                <Pressable style={styles.conflictButton} onPress={() => offlineModeService.resolveConflict(conflict.id, 'server_wins')}>
                  <Text style={styles.conflictButtonText}>Keep Server</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </>
      )}

      <Text style={styles.sectionTitle}>Sync Queue ({syncQueue.length})</Text>
      {syncQueue.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>✓</Text>
          <Text style={styles.emptyText}>All synced!</Text>
        </View>
      ) : (
        syncQueue.map((item) => (
          <View key={item.id} style={styles.queueCard}>
            <View style={styles.queueHeader}>
              <Text style={styles.queueCategory}>{item.category}</Text>
              <View style={[styles.queueStatusBadge, styles[`queue_${item.status}`]]}>
                <Text style={styles.queueStatusText}>{item.status}</Text>
              </View>
            </View>
            <Text style={styles.queueAction}>{item.action.toUpperCase()}</Text>
            <Text style={styles.queuePriority}>Priority: {item.priority}</Text>
          </View>
        ))
      )}

      <Text style={styles.sectionTitle}>Sync History</Text>
      {syncHistory.map((history) => (
        <View key={history.id} style={styles.historyCard}>
          <View style={styles.historyHeader}>
            <View style={[styles.historyStatusDot, styles[`history_${history.status}`]]} />
            <Text style={styles.historyStatus}>{history.status}</Text>
            <Text style={styles.historyTime}>
              {new Date(history.startedAt).toLocaleTimeString()}
            </Text>
          </View>
          <View style={styles.historyStats}>
            <Text style={styles.historyStat}>✓ {history.itemsSynced} synced</Text>
            {history.itemsFailed > 0 && <Text style={styles.historyStatFailed}>✗ {history.itemsFailed} failed</Text>}
            <Text style={styles.historyStat}>{history.duration}ms</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderSettings = () => (
    <ScrollView style={styles.content}>
      <Text style={styles.sectionTitle}>Offline Capabilities</Text>
      {capabilities.map((cap) => (
        <View key={cap.category} style={styles.capabilityCard}>
          <View style={styles.capabilityHeader}>
            <Text style={styles.capabilityName}>{cap.category.replace(/_/g, ' ')}</Text>
            <View style={[styles.enabledBadge, cap.enabled ? styles.enabledTrue : styles.enabledFalse]}>
              <Text style={styles.enabledText}>{cap.enabled ? 'Enabled' : 'Disabled'}</Text>
            </View>
          </View>
          <View style={styles.capabilityDetails}>
            <Text style={styles.capabilityDetail}>Cache: {formatBytes(cap.cacheSize)}</Text>
            <Text style={styles.capabilityDetail}>Max Age: {Math.round(cap.maxAge / (24 * 60 * 60 * 1000))} days</Text>
            <Text style={styles.capabilityDetail}>Priority: {cap.syncPriority}</Text>
            <Text style={styles.capabilityDetail}>Conflict: {cap.conflictResolution}</Text>
            {cap.encryptionRequired && <Text style={styles.capabilityEncrypted}>🔒 Encrypted</Text>}
          </View>
        </View>
      ))}
    </ScrollView>
  );

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Offline Mode</Text>
        <Text style={styles.subtitle}>Manage offline data and sync</Text>
      </View>
      {renderTabs()}
      {activeTab === 'status' && renderStatus()}
      {activeTab === 'cache' && renderCache()}
      {activeTab === 'sync' && renderSync()}
      {activeTab === 'settings' && renderSettings()}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { padding: 20, backgroundColor: '#1E3A5F' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  subtitle: { fontSize: 14, color: '#94A3B8', marginTop: 4 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#F1F5F9', padding: 4 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#FFFFFF' },
  tabText: { fontSize: 14, color: '#64748B' },
  activeTabText: { color: '#1E3A5F', fontWeight: '600' },
  content: { flex: 1, padding: 16 },
  statusCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  statusHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  statusIndicator: { width: 16, height: 16, borderRadius: 8, marginRight: 12 },
  status_online: { backgroundColor: '#22C55E' },
  status_offline: { backgroundColor: '#EF4444' },
  status_slow: { backgroundColor: '#F59E0B' },
  status_unstable: { backgroundColor: '#F59E0B' },
  statusTitle: { fontSize: 20, fontWeight: '600', color: '#1E293B' },
  toggleButton: { backgroundColor: '#F1F5F9', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  toggleButtonText: { color: '#1E3A5F', fontWeight: '600' },
  storageCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#1E293B', marginBottom: 12 },
  storageBar: { height: 12, backgroundColor: '#E2E8F0', borderRadius: 6, overflow: 'hidden', marginBottom: 8 },
  storageFill: { height: '100%', backgroundColor: '#1E3A5F', borderRadius: 6 },
  storageWarning: { backgroundColor: '#F59E0B' },
  storageCritical: { backgroundColor: '#EF4444' },
  storageText: { fontSize: 14, color: '#64748B' },
  alertBadge: { marginTop: 12, padding: 12, borderRadius: 8 },
  alertWarning: { backgroundColor: '#FEF3C7' },
  alertCritical: { backgroundColor: '#FEE2E2' },
  alertText: { fontSize: 14, fontWeight: '500' },
  syncStatusCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  syncStatusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  syncIndicator: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  sync_idle: { backgroundColor: '#94A3B8' },
  sync_syncing: { backgroundColor: '#3B82F6' },
  sync_error: { backgroundColor: '#EF4444' },
  sync_pending: { backgroundColor: '#F59E0B' },
  syncStatusText: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  syncStats: { flexDirection: 'row', gap: 24, marginBottom: 16 },
  syncStat: { alignItems: 'center' },
  syncStatValue: { fontSize: 24, fontWeight: 'bold', color: '#1E3A5F' },
  syncStatLabel: { fontSize: 12, color: '#64748B' },
  syncButton: { backgroundColor: '#1E3A5F', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  syncButtonDisabled: { backgroundColor: '#94A3B8' },
  syncButtonText: { color: '#FFFFFF', fontWeight: '600' },
  analyticsCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  analyticsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  analyticItem: { width: '48%', alignItems: 'center', padding: 12, backgroundColor: '#F8FAFC', borderRadius: 8 },
  analyticValue: { fontSize: 18, fontWeight: 'bold', color: '#1E3A5F' },
  analyticLabel: { fontSize: 12, color: '#64748B', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1E293B', marginBottom: 16 },
  cacheCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  cacheHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cacheName: { fontSize: 14, fontWeight: '500', color: '#1E293B', textTransform: 'capitalize' },
  cacheSize: { fontSize: 14, color: '#64748B' },
  cacheMiniBar: { height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, overflow: 'hidden' },
  cacheMiniBarFill: { height: '100%', backgroundColor: '#1E3A5F' },
  conflictCard: { backgroundColor: '#FEF3C7', borderRadius: 12, padding: 16, marginBottom: 12 },
  conflictHeader: { marginBottom: 8 },
  conflictCategory: { fontSize: 14, fontWeight: '600', color: '#92400E', textTransform: 'capitalize' },
  conflictKey: { fontSize: 12, color: '#B45309' },
  conflictVersions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  conflictVersion: { fontSize: 12, color: '#92400E' },
  conflictVs: { fontSize: 12, color: '#B45309' },
  conflictActions: { flexDirection: 'row', gap: 8 },
  conflictButton: { flex: 1, backgroundColor: '#FFFFFF', paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  conflictButtonText: { fontSize: 12, fontWeight: '600', color: '#92400E' },
  emptyState: { alignItems: 'center', padding: 24 },
  emptyIcon: { fontSize: 32, color: '#22C55E', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#64748B' },
  queueCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  queueHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  queueCategory: { fontSize: 14, fontWeight: '500', color: '#1E293B', textTransform: 'capitalize' },
  queueStatusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  queue_pending: { backgroundColor: '#FEF3C7' },
  queue_processing: { backgroundColor: '#DBEAFE' },
  queue_completed: { backgroundColor: '#DCFCE7' },
  queue_failed: { backgroundColor: '#FEE2E2' },
  queueStatusText: { fontSize: 10, fontWeight: '600' },
  queueAction: { fontSize: 12, color: '#1E3A5F', fontWeight: '600' },
  queuePriority: { fontSize: 12, color: '#64748B' },
  historyCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  historyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  historyStatusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  history_success: { backgroundColor: '#22C55E' },
  history_partial: { backgroundColor: '#F59E0B' },
  history_failed: { backgroundColor: '#EF4444' },
  historyStatus: { fontSize: 14, fontWeight: '500', color: '#1E293B', flex: 1 },
  historyTime: { fontSize: 12, color: '#64748B' },
  historyStats: { flexDirection: 'row', gap: 16 },
  historyStat: { fontSize: 12, color: '#64748B' },
  historyStatFailed: { fontSize: 12, color: '#EF4444' },
  capabilityCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  capabilityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  capabilityName: { fontSize: 16, fontWeight: '600', color: '#1E293B', textTransform: 'capitalize' },
  enabledBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  enabledTrue: { backgroundColor: '#DCFCE7' },
  enabledFalse: { backgroundColor: '#FEE2E2' },
  enabledText: { fontSize: 12, fontWeight: '500' },
  capabilityDetails: { gap: 4 },
  capabilityDetail: { fontSize: 12, color: '#64748B' },
  capabilityEncrypted: { fontSize: 12, color: '#1E3A5F', fontWeight: '500', marginTop: 4 },
});
