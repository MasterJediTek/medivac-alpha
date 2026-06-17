/**
 * Offline Data Sync Service
 * Handles background synchronization of patient records and staff assignments
 * when connection is restored
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SyncQueueItem {
  id: string;
  type: 'patient_record' | 'staff_assignment' | 'route_update' | 'appointment' | 'directive';
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: string;
  retryCount: number;
  lastRetryAt?: string;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  errorMessage?: string;
}

export interface SyncConflict {
  id: string;
  itemId: string;
  type: 'patient_record' | 'staff_assignment' | 'route_update' | 'appointment' | 'directive';
  localVersion: any;
  remoteVersion: any;
  localTimestamp: string;
  remoteTimestamp: string;
  resolution: 'local' | 'remote' | 'merge' | 'pending';
}

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncAt?: string;
  pendingItems: number;
  failedItems: number;
  conflicts: number;
  progress: number; // 0-100
}

class OfflineDataSyncService {
  private readonly SYNC_QUEUE_KEY = 'offline_sync_queue';
  private readonly CONFLICTS_KEY = 'sync_conflicts';
  private readonly SYNC_STATUS_KEY = 'sync_status';
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 5000; // 5 seconds

  private syncQueue: Map<string, SyncQueueItem> = new Map();
  private conflicts: Map<string, SyncConflict> = new Map();
  private syncStatus: SyncStatus = {
    isSyncing: false,
    pendingItems: 0,
    failedItems: 0,
    conflicts: 0,
    progress: 0,
  };

  async initialize(): Promise<void> {
    await this.loadSyncQueue();
    await this.loadConflicts();
    await this.loadSyncStatus();
  }

  /**
   * Queue a data item for offline sync
   */
  async queueItem(
    type: SyncQueueItem['type'],
    operation: SyncQueueItem['operation'],
    data: any
  ): Promise<SyncQueueItem> {
    const item: SyncQueueItem = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      type,
      operation,
      data,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      status: 'pending',
    };

    this.syncQueue.set(item.id, item);
    this.syncStatus.pendingItems = this.syncQueue.size;

    await this.saveSyncQueue();
    return item;
  }

  /**
   * Start syncing queued items
   */
  async startSync(): Promise<void> {
    if (this.syncStatus.isSyncing) {
      console.log('[Offline Sync] Sync already in progress');
      return;
    }

    this.syncStatus.isSyncing = true;
    this.syncStatus.progress = 0;

    const items = Array.from(this.syncQueue.values()).filter(item => item.status === 'pending');
    const totalItems = items.length;

    console.log(`[Offline Sync] Starting sync of ${totalItems} items`);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      try {
        item.status = 'syncing';
        await this.syncItem(item);
        item.status = 'synced';
        item.lastRetryAt = new Date().toISOString();
      } catch (error) {
        item.retryCount++;
        item.errorMessage = error instanceof Error ? error.message : 'Unknown error';

        if (item.retryCount >= this.MAX_RETRIES) {
          item.status = 'failed';
          this.syncStatus.failedItems++;
        } else {
          item.status = 'pending';
          // Schedule retry
          await this.scheduleRetry(item);
        }
      }

      // Update progress
      this.syncStatus.progress = Math.round(((i + 1) / totalItems) * 100);
      await this.saveSyncStatus();
    }

    this.syncStatus.isSyncing = false;
    this.syncStatus.lastSyncAt = new Date().toISOString();
    this.syncStatus.pendingItems = Array.from(this.syncQueue.values()).filter(
      item => item.status === 'pending'
    ).length;

    await this.saveSyncQueue();
    await this.saveSyncStatus();

    console.log('[Offline Sync] Sync completed');
  }

  /**
   * Sync a single item
   */
  private async syncItem(item: SyncQueueItem): Promise<void> {
    // Simulate network request
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate occasional failures for testing
        if (Math.random() < 0.1) {
          reject(new Error('Network error'));
        } else {
          console.log(`[Offline Sync] Synced ${item.type} (${item.operation})`);
          resolve();
        }
      }, 500);
    });
  }

  /**
   * Schedule retry for failed item
   */
  private async scheduleRetry(item: SyncQueueItem): Promise<void> {
    const delay = this.RETRY_DELAY * Math.pow(2, item.retryCount); // Exponential backoff
    setTimeout(() => {
      item.status = 'pending';
      this.saveSyncQueue();
    }, delay);
  }

  /**
   * Detect and handle sync conflicts
   */
  async detectConflicts(
    itemId: string,
    type: SyncQueueItem['type'],
    localVersion: any,
    remoteVersion: any
  ): Promise<SyncConflict> {
    const conflict: SyncConflict = {
      id: `conflict_${Date.now()}`,
      itemId,
      type,
      localVersion,
      remoteVersion,
      localTimestamp: new Date().toISOString(),
      remoteTimestamp: new Date().toISOString(),
      resolution: 'pending',
    };

    this.conflicts.set(conflict.id, conflict);
    this.syncStatus.conflicts = this.conflicts.size;

    await this.saveConflicts();
    return conflict;
  }

  /**
   * Resolve conflict using strategy
   */
  async resolveConflict(
    conflictId: string,
    resolution: 'local' | 'remote' | 'merge'
  ): Promise<SyncConflict | null> {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) return null;

    conflict.resolution = resolution;

    // Merge strategy: combine both versions intelligently
    if (resolution === 'merge') {
      conflict.localVersion = this.mergeVersions(conflict.localVersion, conflict.remoteVersion);
    }

    await this.saveConflicts();
    return conflict;
  }

  /**
   * Merge two versions intelligently
   */
  private mergeVersions(local: any, remote: any): any {
    if (typeof local !== 'object' || typeof remote !== 'object') {
      // For primitives, prefer the most recent
      return local;
    }

    const merged = { ...remote };

    for (const key in local) {
      if (local.hasOwnProperty(key)) {
        if (typeof local[key] === 'object' && typeof remote[key] === 'object') {
          merged[key] = this.mergeVersions(local[key], remote[key]);
        } else if (local[key] !== remote[key]) {
          // Keep local if different
          merged[key] = local[key];
        }
      }
    }

    return merged;
  }

  /**
   * Get sync status
   */
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  /**
   * Get pending items
   */
  getPendingItems(): SyncQueueItem[] {
    return Array.from(this.syncQueue.values()).filter(item => item.status === 'pending');
  }

  /**
   * Get failed items
   */
  getFailedItems(): SyncQueueItem[] {
    return Array.from(this.syncQueue.values()).filter(item => item.status === 'failed');
  }

  /**
   * Get conflicts
   */
  getConflicts(): SyncConflict[] {
    return Array.from(this.conflicts.values());
  }

  /**
   * Clear resolved items
   */
  async clearResolvedItems(): Promise<void> {
    // Remove synced items
    for (const [id, item] of this.syncQueue.entries()) {
      if (item.status === 'synced') {
        this.syncQueue.delete(id);
      }
    }

    // Remove resolved conflicts
    for (const [id, conflict] of this.conflicts.entries()) {
      if (conflict.resolution !== 'pending') {
        this.conflicts.delete(id);
      }
    }

    this.syncStatus.pendingItems = Array.from(this.syncQueue.values()).filter(
      item => item.status === 'pending'
    ).length;
    this.syncStatus.failedItems = Array.from(this.syncQueue.values()).filter(
      item => item.status === 'failed'
    ).length;
    this.syncStatus.conflicts = this.conflicts.size;

    await this.saveSyncQueue();
    await this.saveConflicts();
    await this.saveSyncStatus();
  }

  /**
   * Retry failed items
   */
  async retryFailedItems(): Promise<void> {
    const failedItems = Array.from(this.syncQueue.values()).filter(item => item.status === 'failed');

    for (const item of failedItems) {
      item.status = 'pending';
      item.retryCount = 0;
    }

    await this.saveSyncQueue();
    await this.startSync();
  }

  /**
   * Get sync statistics
   */
  getSyncStats() {
    const items = Array.from(this.syncQueue.values());
    const byType = new Map<string, number>();
    const byOperation = new Map<string, number>();
    const byStatus = new Map<string, number>();

    for (const item of items) {
      byType.set(item.type, (byType.get(item.type) || 0) + 1);
      byOperation.set(item.operation, (byOperation.get(item.operation) || 0) + 1);
      byStatus.set(item.status, (byStatus.get(item.status) || 0) + 1);
    }

    return {
      totalItems: items.length,
      byType: Object.fromEntries(byType),
      byOperation: Object.fromEntries(byOperation),
      byStatus: Object.fromEntries(byStatus),
      conflicts: this.conflicts.size,
      lastSync: this.syncStatus.lastSyncAt,
    };
  }

  private async loadSyncQueue(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.SYNC_QUEUE_KEY);
      if (data) {
        const items = JSON.parse(data);
        this.syncQueue = new Map(items.map((item: SyncQueueItem) => [item.id, item]));
      }
    } catch (error) {
      console.error('[Offline Sync] Failed to load sync queue:', error);
    }
  }

  private async saveSyncQueue(): Promise<void> {
    try {
      const items = Array.from(this.syncQueue.values());
      await AsyncStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('[Offline Sync] Failed to save sync queue:', error);
    }
  }

  private async loadConflicts(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.CONFLICTS_KEY);
      if (data) {
        const conflicts = JSON.parse(data);
        this.conflicts = new Map(conflicts.map((c: SyncConflict) => [c.id, c]));
      }
    } catch (error) {
      console.error('[Offline Sync] Failed to load conflicts:', error);
    }
  }

  private async saveConflicts(): Promise<void> {
    try {
      const conflicts = Array.from(this.conflicts.values());
      await AsyncStorage.setItem(this.CONFLICTS_KEY, JSON.stringify(conflicts));
    } catch (error) {
      console.error('[Offline Sync] Failed to save conflicts:', error);
    }
  }

  private async loadSyncStatus(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.SYNC_STATUS_KEY);
      if (data) {
        this.syncStatus = JSON.parse(data);
      }
    } catch (error) {
      console.error('[Offline Sync] Failed to load sync status:', error);
    }
  }

  private async saveSyncStatus(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.SYNC_STATUS_KEY, JSON.stringify(this.syncStatus));
    } catch (error) {
      console.error('[Offline Sync] Failed to save sync status:', error);
    }
  }
}

export const offlineDataSyncService = new OfflineDataSyncService();
