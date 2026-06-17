import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

/**
 * Cloud Data Synchronization Service
 * Handles real-time sync between local cache and cloud backend
 */

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: number;
  pendingChanges: number;
  syncErrors: string[];
}

export interface SyncConflict {
  key: string;
  localVersion: any;
  remoteVersion: any;
  timestamp: number;
}

export interface SyncEvent {
  type: 'sync-start' | 'sync-complete' | 'sync-error' | 'conflict' | 'online' | 'offline';
  status: SyncStatus;
  data?: any;
}

export class CloudSyncService {
  private static instance: CloudSyncService;
  private isOnline = true;
  private isSyncing = false;
  private pendingChanges: Map<string, any> = new Map();
  private syncListeners: Set<(event: SyncEvent) => void> = new Set();
  private syncInterval: NodeJS.Timeout | null = null;
  private conflictResolutionStrategy: 'server-wins' | 'client-wins' | 'merge' = 'server-wins';

  private constructor() {
    this.initializeNetworkListener();
  }

  static getInstance(): CloudSyncService {
    if (!CloudSyncService.instance) {
      CloudSyncService.instance = new CloudSyncService();
    }
    return CloudSyncService.instance;
  }

  /**
   * Initialize network connectivity listener
   */
  private initializeNetworkListener(): void {
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected ?? false;

      if (!wasOnline && this.isOnline) {
        // Went online - trigger sync
        this.notifyListeners({
          type: 'online',
          status: this.getStatus(),
        });
        this.syncNow();
      } else if (wasOnline && !this.isOnline) {
        // Went offline
        this.notifyListeners({
          type: 'offline',
          status: this.getStatus(),
        });
      }
    });
  }

  /**
   * Start automatic sync
   */
  startAutoSync(intervalMs: number = 30000): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.syncNow();
      }
    }, intervalMs);
  }

  /**
   * Stop automatic sync
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Sync now
   */
  async syncNow(): Promise<void> {
    if (this.isSyncing || !this.isOnline) {
      return;
    }

    this.isSyncing = true;
    const status = this.getStatus();

    this.notifyListeners({
      type: 'sync-start',
      status,
    });

    try {
      // Upload pending changes
      await this.uploadPendingChanges();

      // Download remote changes
      await this.downloadRemoteChanges();

      // Clear pending changes
      this.pendingChanges.clear();

      this.notifyListeners({
        type: 'sync-complete',
        status: this.getStatus(),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.notifyListeners({
        type: 'sync-error',
        status: {
          ...this.getStatus(),
          syncErrors: [errorMessage],
        },
      });
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Upload pending changes to cloud
   */
  private async uploadPendingChanges(): Promise<void> {
    if (this.pendingChanges.size === 0) {
      return;
    }

    try {
      const changes = Array.from(this.pendingChanges.entries()).map(([key, value]) => ({
        key,
        value,
        timestamp: Date.now(),
      }));

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/sync/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAccessToken()}`,
        },
        body: JSON.stringify({ changes }),
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      // Update local cache with server timestamps
      if (result.synced) {
        result.synced.forEach((item: any) => {
          this.pendingChanges.delete(item.key);
        });
      }
    } catch (error) {
      console.error('Failed to upload pending changes:', error);
      throw error;
    }
  }

  /**
   * Download remote changes from cloud
   */
  private async downloadRemoteChanges(): Promise<void> {
    try {
      const lastSyncTime = await this.getLastSyncTime();

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/sync/download?since=${lastSyncTime}`,
        {
          headers: {
            'Authorization': `Bearer ${this.getAccessToken()}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const data = await response.json();
      
      // Merge remote changes with local cache
      for (const change of data.changes || []) {
        await this.mergeRemoteChange(change);
      }

      // Update last sync time
      await AsyncStorage.setItem('last_sync_time', Date.now().toString());
    } catch (error) {
      console.error('Failed to download remote changes:', error);
      throw error;
    }
  }

  /**
   * Merge remote change with local cache
   */
  private async mergeRemoteChange(change: any): Promise<void> {
    try {
      const localData = await AsyncStorage.getItem(change.key);
      const localValue = localData ? JSON.parse(localData) : null;

      if (!localValue) {
        // No local version, just use remote
        await AsyncStorage.setItem(change.key, JSON.stringify(change.value));
        return;
      }

      // Check for conflicts
      const hasConflict = this.detectConflict(localValue, change.value);

      if (hasConflict) {
        const resolved = await this.resolveConflict(change.key, localValue, change.value);
        await AsyncStorage.setItem(change.key, JSON.stringify(resolved));
      } else {
        // No conflict, use remote version
        await AsyncStorage.setItem(change.key, JSON.stringify(change.value));
      }
    } catch (error) {
      console.error('Failed to merge remote change:', error);
      throw error;
    }
  }

  /**
   * Detect conflicts between local and remote versions
   */
  private detectConflict(local: any, remote: any): boolean {
    // Simple conflict detection - check if both have been modified
    return local.modifiedAt && remote.modifiedAt && local.modifiedAt !== remote.modifiedAt;
  }

  /**
   * Resolve conflicts based on strategy
   */
  private async resolveConflict(key: string, local: any, remote: any): Promise<any> {
    switch (this.conflictResolutionStrategy) {
      case 'server-wins':
        return remote;
      
      case 'client-wins':
        return local;
      
      case 'merge':
        return this.mergeVersions(local, remote);
      
      default:
        return remote;
    }
  }

  /**
   * Merge two versions intelligently
   */
  private mergeVersions(local: any, remote: any): any {
    if (typeof local !== 'object' || typeof remote !== 'object') {
      return remote;
    }

    const merged = { ...remote };
    
    for (const key in local) {
      if (key === 'modifiedAt') {
        merged[key] = Math.max(local[key] || 0, remote[key] || 0);
      } else if (typeof local[key] === 'object' && typeof remote[key] === 'object') {
        merged[key] = this.mergeVersions(local[key], remote[key]);
      }
    }

    return merged;
  }

  /**
   * Track a local change
   */
  async trackChange(key: string, value: any): Promise<void> {
    this.pendingChanges.set(key, {
      ...value,
      modifiedAt: Date.now(),
    });

    // Save to local cache immediately
    await AsyncStorage.setItem(key, JSON.stringify(value));

    // Trigger sync if online
    if (this.isOnline && !this.isSyncing) {
      // Debounce sync - wait a bit before syncing
      setTimeout(() => this.syncNow(), 1000);
    }
  }

  /**
   * Get sync status
   */
  getStatus(): SyncStatus {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      lastSyncTime: 0, // TODO: Get from storage
      pendingChanges: this.pendingChanges.size,
      syncErrors: [],
    };
  }

  /**
   * Get last sync time
   */
  private async getLastSyncTime(): Promise<number> {
    try {
      const time = await AsyncStorage.getItem('last_sync_time');
      return time ? parseInt(time, 10) : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Get access token
   */
  private getAccessToken(): string {
    // TODO: Get from auth service
    return '';
  }

  /**
   * Set conflict resolution strategy
   */
  setConflictResolutionStrategy(strategy: 'server-wins' | 'client-wins' | 'merge'): void {
    this.conflictResolutionStrategy = strategy;
  }

  /**
   * Subscribe to sync events
   */
  subscribe(listener: (event: SyncEvent) => void): () => void {
    this.syncListeners.add(listener);
    return () => this.syncListeners.delete(listener);
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(event: SyncEvent): void {
    this.syncListeners.forEach(listener => listener(event));
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stopAutoSync();
    this.syncListeners.clear();
    this.pendingChanges.clear();
  }
}
