// Offline Mode Support Service for MediVac WACHS v9.6
// Local data caching with sync queue and conflict resolution

// Sound effects
const SOUNDS = {
  OFFLINE_MODE: 'offline_mode',
  ONLINE_MODE: 'online_mode',
  SYNC_START: 'sync_start',
  SYNC_COMPLETE: 'sync_complete',
  SYNC_ERROR: 'sync_error',
  DATA_CACHED: 'data_cached',
  CONFLICT_DETECTED: 'conflict_detected',
  CONFLICT_RESOLVED: 'conflict_resolved',
  STORAGE_WARNING: 'storage_warning',
};

// Haptic patterns
const HAPTICS = {
  OFFLINE: 'warning',
  ONLINE: 'success',
  SYNC: 'medium',
  ERROR: 'error',
  CACHE: 'light',
  CONFLICT: 'heavy',
};

function playSound(sound: string): void {
  console.log(`Playing: ${sound}`);
}

function triggerHaptic(type: string): void {
  console.log(`Haptic: ${type}`);
}

// Types
export type ConnectionStatus = 'online' | 'offline' | 'slow' | 'unstable';
export type SyncStatus = 'idle' | 'syncing' | 'error' | 'pending';
export type DataCategory = 'medications' | 'appointments' | 'ahd' | 'health_records' | 'messages' | 'settings' | 'notifications';
export type ConflictResolution = 'local_wins' | 'server_wins' | 'merge' | 'manual';
export type ActionType = 'create' | 'update' | 'delete' | 'read';

export interface CachedData {
  id: string;
  category: DataCategory;
  key: string;
  data: unknown;
  version: number;
  cachedAt: number;
  expiresAt: number;
  size: number;
  checksum: string;
  isEncrypted: boolean;
  lastAccessed: number;
  accessCount: number;
}

export interface SyncQueueItem {
  id: string;
  category: DataCategory;
  action: ActionType;
  data: unknown;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  conflictData?: unknown;
}

export interface SyncConflict {
  id: string;
  category: DataCategory;
  key: string;
  localData: unknown;
  serverData: unknown;
  localVersion: number;
  serverVersion: number;
  detectedAt: number;
  resolution?: ConflictResolution;
  resolvedAt?: number;
  resolvedData?: unknown;
}

export interface StorageQuota {
  used: number;
  total: number;
  percentage: number;
  byCategory: Record<DataCategory, number>;
  warning: boolean;
  critical: boolean;
}

export interface OfflineCapability {
  category: DataCategory;
  enabled: boolean;
  cacheSize: number;
  maxAge: number;
  syncPriority: number;
  encryptionRequired: boolean;
  conflictResolution: ConflictResolution;
}

export interface SyncHistory {
  id: string;
  startedAt: number;
  completedAt?: number;
  status: 'success' | 'partial' | 'failed';
  itemsSynced: number;
  itemsFailed: number;
  conflicts: number;
  dataTransferred: number;
  duration: number;
  error?: string;
}

export interface OfflineAnalytics {
  totalCacheSize: number;
  totalCachedItems: number;
  syncQueueLength: number;
  pendingConflicts: number;
  lastSyncTime: number;
  averageSyncDuration: number;
  syncSuccessRate: number;
  offlineUsageTime: number;
  mostAccessedCategory: DataCategory;
}

// Default offline capabilities
const DEFAULT_CAPABILITIES: OfflineCapability[] = [
  {
    category: 'medications',
    enabled: true,
    cacheSize: 5 * 1024 * 1024, // 5MB
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    syncPriority: 1,
    encryptionRequired: true,
    conflictResolution: 'server_wins',
  },
  {
    category: 'appointments',
    enabled: true,
    cacheSize: 2 * 1024 * 1024, // 2MB
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    syncPriority: 2,
    encryptionRequired: false,
    conflictResolution: 'server_wins',
  },
  {
    category: 'ahd',
    enabled: true,
    cacheSize: 10 * 1024 * 1024, // 10MB
    maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
    syncPriority: 3,
    encryptionRequired: true,
    conflictResolution: 'local_wins',
  },
  {
    category: 'health_records',
    enabled: true,
    cacheSize: 20 * 1024 * 1024, // 20MB
    maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
    syncPriority: 4,
    encryptionRequired: true,
    conflictResolution: 'server_wins',
  },
  {
    category: 'messages',
    enabled: true,
    cacheSize: 5 * 1024 * 1024, // 5MB
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    syncPriority: 5,
    encryptionRequired: true,
    conflictResolution: 'merge',
  },
  {
    category: 'settings',
    enabled: true,
    cacheSize: 1 * 1024 * 1024, // 1MB
    maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
    syncPriority: 6,
    encryptionRequired: false,
    conflictResolution: 'local_wins',
  },
  {
    category: 'notifications',
    enabled: true,
    cacheSize: 2 * 1024 * 1024, // 2MB
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    syncPriority: 7,
    encryptionRequired: false,
    conflictResolution: 'server_wins',
  },
];

class OfflineModeService {
  private cache: Map<string, CachedData> = new Map();
  private syncQueue: Map<string, SyncQueueItem> = new Map();
  private conflicts: Map<string, SyncConflict> = new Map();
  private syncHistory: Map<string, SyncHistory> = new Map();
  private capabilities: Map<DataCategory, OfflineCapability> = new Map();
  
  private connectionStatus: ConnectionStatus = 'online';
  private syncStatus: SyncStatus = 'idle';
  private isOfflineMode: boolean = false;
  private offlineStartTime: number | null = null;
  private totalOfflineTime: number = 0;
  private lastSyncTime: number = 0;
  private syncInterval: ReturnType<typeof setInterval> | null = null;

  private totalStorageQuota: number = 100 * 1024 * 1024; // 100MB

  constructor() {
    this.initializeCapabilities();
    this.startConnectionMonitoring();
  }

  private initializeCapabilities(): void {
    DEFAULT_CAPABILITIES.forEach(cap => {
      this.capabilities.set(cap.category, cap);
    });
  }

  private startConnectionMonitoring(): void {
    // Simulated connection monitoring
    this.syncInterval = setInterval(() => {
      if (this.connectionStatus === 'online' && this.syncQueue.size > 0) {
        this.processSyncQueue();
      }
    }, 30000); // Check every 30 seconds
  }

  private generateChecksum(data: unknown): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  private calculateSize(data: unknown): number {
    return new Blob([JSON.stringify(data)]).size;
  }

  // Connection Management
  setConnectionStatus(status: ConnectionStatus): void {
    const previousStatus = this.connectionStatus;
    this.connectionStatus = status;

    if (status === 'offline' && previousStatus !== 'offline') {
      this.enterOfflineMode();
    } else if (status === 'online' && previousStatus === 'offline') {
      this.exitOfflineMode();
    }
  }

  private enterOfflineMode(): void {
    this.isOfflineMode = true;
    this.offlineStartTime = Date.now();

    playSound(SOUNDS.OFFLINE_MODE);
    triggerHaptic(HAPTICS.OFFLINE);

    console.log('Entered offline mode');
  }

  private exitOfflineMode(): void {
    if (this.offlineStartTime) {
      this.totalOfflineTime += Date.now() - this.offlineStartTime;
    }
    this.isOfflineMode = false;
    this.offlineStartTime = null;

    playSound(SOUNDS.ONLINE_MODE);
    triggerHaptic(HAPTICS.ONLINE);

    // Trigger sync
    this.startSync();

    console.log('Exited offline mode, starting sync');
  }

  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  isOffline(): boolean {
    return this.isOfflineMode;
  }

  // Cache Management
  cacheData(
    category: DataCategory,
    key: string,
    data: unknown,
    options?: {
      version?: number;
      expiresIn?: number;
      encrypt?: boolean;
    }
  ): CachedData | null {
    const capability = this.capabilities.get(category);
    if (!capability || !capability.enabled) return null;

    const id = `cache_${category}_${key}`;
    const now = Date.now();
    const size = this.calculateSize(data);

    // Check storage quota
    const quota = this.getStorageQuota();
    if (quota.used + size > this.totalStorageQuota) {
      this.cleanupCache(size);
    }

    const cached: CachedData = {
      id,
      category,
      key,
      data,
      version: options?.version || 1,
      cachedAt: now,
      expiresAt: now + (options?.expiresIn || capability.maxAge),
      size,
      checksum: this.generateChecksum(data),
      isEncrypted: options?.encrypt || capability.encryptionRequired,
      lastAccessed: now,
      accessCount: 0,
    };

    this.cache.set(id, cached);

    playSound(SOUNDS.DATA_CACHED);
    triggerHaptic(HAPTICS.CACHE);

    return cached;
  }

  getCachedData(category: DataCategory, key: string): unknown | null {
    const id = `cache_${category}_${key}`;
    const cached = this.cache.get(id);

    if (!cached) return null;

    // Check expiration
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(id);
      return null;
    }

    // Update access stats
    cached.lastAccessed = Date.now();
    cached.accessCount++;

    return cached.data;
  }

  invalidateCache(category: DataCategory, key?: string): number {
    let count = 0;

    if (key) {
      const id = `cache_${category}_${key}`;
      if (this.cache.delete(id)) count++;
    } else {
      this.cache.forEach((cached, id) => {
        if (cached.category === category) {
          this.cache.delete(id);
          count++;
        }
      });
    }

    return count;
  }

  private cleanupCache(requiredSpace: number): void {
    // Sort by last accessed (oldest first) and access count (lowest first)
    const sortedCache = Array.from(this.cache.values())
      .sort((a, b) => {
        if (a.lastAccessed !== b.lastAccessed) {
          return a.lastAccessed - b.lastAccessed;
        }
        return a.accessCount - b.accessCount;
      });

    let freedSpace = 0;
    for (const cached of sortedCache) {
      if (freedSpace >= requiredSpace) break;

      this.cache.delete(cached.id);
      freedSpace += cached.size;
    }

    playSound(SOUNDS.STORAGE_WARNING);
    triggerHaptic(HAPTICS.CONFLICT);
  }

  // Sync Queue Management
  queueAction(
    category: DataCategory,
    action: ActionType,
    data: unknown,
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): SyncQueueItem {
    const id = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const item: SyncQueueItem = {
      id,
      category,
      action,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 3,
      priority,
      status: 'pending',
    };

    this.syncQueue.set(id, item);

    // If online, process immediately
    if (this.connectionStatus === 'online') {
      this.processSyncQueue();
    }

    return item;
  }

  private async processSyncQueue(): Promise<void> {
    if (this.syncStatus === 'syncing') return;

    this.syncStatus = 'syncing';
    playSound(SOUNDS.SYNC_START);
    triggerHaptic(HAPTICS.SYNC);

    const syncId = `history_${Date.now()}`;
    const startTime = Date.now();
    let itemsSynced = 0;
    let itemsFailed = 0;
    let conflictsDetected = 0;
    let dataTransferred = 0;

    // Sort by priority and timestamp
    const sortedQueue = Array.from(this.syncQueue.values())
      .filter(item => item.status === 'pending')
      .sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return a.timestamp - b.timestamp;
      });

    for (const item of sortedQueue) {
      item.status = 'processing';

      try {
        // Simulate sync operation
        const success = await this.simulateSyncOperation(item);

        if (success) {
          item.status = 'completed';
          itemsSynced++;
          dataTransferred += this.calculateSize(item.data);
          this.syncQueue.delete(item.id);
        } else {
          throw new Error('Sync failed');
        }
      } catch (error) {
        item.retryCount++;
        
        if (item.retryCount >= item.maxRetries) {
          item.status = 'failed';
          item.error = error instanceof Error ? error.message : 'Unknown error';
          itemsFailed++;
        } else {
          item.status = 'pending';
        }
      }
    }

    // Record sync history
    const history: SyncHistory = {
      id: syncId,
      startedAt: startTime,
      completedAt: Date.now(),
      status: itemsFailed === 0 ? 'success' : itemsSynced > 0 ? 'partial' : 'failed',
      itemsSynced,
      itemsFailed,
      conflicts: conflictsDetected,
      dataTransferred,
      duration: Date.now() - startTime,
    };

    this.syncHistory.set(syncId, history);
    this.lastSyncTime = Date.now();
    this.syncStatus = 'idle';

    if (itemsFailed === 0) {
      playSound(SOUNDS.SYNC_COMPLETE);
      triggerHaptic(HAPTICS.ONLINE);
    } else {
      playSound(SOUNDS.SYNC_ERROR);
      triggerHaptic(HAPTICS.ERROR);
    }
  }

  private async simulateSyncOperation(item: SyncQueueItem): Promise<boolean> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // 95% success rate simulation
    return Math.random() > 0.05;
  }

  // Conflict Management
  detectConflict(
    category: DataCategory,
    key: string,
    localData: unknown,
    serverData: unknown,
    localVersion: number,
    serverVersion: number
  ): SyncConflict {
    const id = `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const conflict: SyncConflict = {
      id,
      category,
      key,
      localData,
      serverData,
      localVersion,
      serverVersion,
      detectedAt: Date.now(),
    };

    this.conflicts.set(id, conflict);

    playSound(SOUNDS.CONFLICT_DETECTED);
    triggerHaptic(HAPTICS.CONFLICT);

    return conflict;
  }

  resolveConflict(
    conflictId: string,
    resolution: ConflictResolution,
    manualData?: unknown
  ): SyncConflict | null {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) return null;

    conflict.resolution = resolution;
    conflict.resolvedAt = Date.now();

    switch (resolution) {
      case 'local_wins':
        conflict.resolvedData = conflict.localData;
        break;
      case 'server_wins':
        conflict.resolvedData = conflict.serverData;
        break;
      case 'merge':
        conflict.resolvedData = this.mergeData(conflict.localData, conflict.serverData);
        break;
      case 'manual':
        conflict.resolvedData = manualData;
        break;
    }

    // Update cache with resolved data
    this.cacheData(conflict.category, conflict.key, conflict.resolvedData, {
      version: Math.max(conflict.localVersion, conflict.serverVersion) + 1,
    });

    playSound(SOUNDS.CONFLICT_RESOLVED);
    triggerHaptic(HAPTICS.ONLINE);

    return conflict;
  }

  private mergeData(local: unknown, server: unknown): unknown {
    // Simple merge strategy - combine objects, prefer server for conflicts
    if (typeof local === 'object' && typeof server === 'object' && local && server) {
      return { ...local as object, ...server as object };
    }
    return server;
  }

  // Manual Sync
  startSync(): void {
    if (this.connectionStatus !== 'online') {
      console.log('Cannot sync while offline');
      return;
    }

    this.processSyncQueue();
  }

  // Getters
  getStorageQuota(): StorageQuota {
    let totalUsed = 0;
    const byCategory: Record<DataCategory, number> = {
      medications: 0,
      appointments: 0,
      ahd: 0,
      health_records: 0,
      messages: 0,
      settings: 0,
      notifications: 0,
    };

    this.cache.forEach(cached => {
      totalUsed += cached.size;
      byCategory[cached.category] += cached.size;
    });

    const percentage = (totalUsed / this.totalStorageQuota) * 100;

    return {
      used: totalUsed,
      total: this.totalStorageQuota,
      percentage,
      byCategory,
      warning: percentage > 80,
      critical: percentage > 95,
    };
  }

  getSyncStatus(): SyncStatus {
    return this.syncStatus;
  }

  getSyncQueue(): SyncQueueItem[] {
    return Array.from(this.syncQueue.values());
  }

  getPendingSync(): SyncQueueItem[] {
    return Array.from(this.syncQueue.values()).filter(item => item.status === 'pending');
  }

  getConflicts(): SyncConflict[] {
    return Array.from(this.conflicts.values()).filter(c => !c.resolvedAt);
  }

  getSyncHistory(limit?: number): SyncHistory[] {
    const history = Array.from(this.syncHistory.values())
      .sort((a, b) => b.startedAt - a.startedAt);

    return limit ? history.slice(0, limit) : history;
  }

  getCapability(category: DataCategory): OfflineCapability | null {
    return this.capabilities.get(category) || null;
  }

  getAllCapabilities(): OfflineCapability[] {
    return Array.from(this.capabilities.values());
  }

  updateCapability(category: DataCategory, updates: Partial<OfflineCapability>): OfflineCapability | null {
    const capability = this.capabilities.get(category);
    if (!capability) return null;

    const updated = { ...capability, ...updates };
    this.capabilities.set(category, updated);

    return updated;
  }

  getAnalytics(): OfflineAnalytics {
    const cachedItems = Array.from(this.cache.values());
    const syncHistoryItems = Array.from(this.syncHistory.values());

    // Calculate most accessed category
    const categoryAccess: Record<DataCategory, number> = {
      medications: 0,
      appointments: 0,
      ahd: 0,
      health_records: 0,
      messages: 0,
      settings: 0,
      notifications: 0,
    };
    cachedItems.forEach(item => {
      categoryAccess[item.category] += item.accessCount;
    });
    const mostAccessedCategory = Object.entries(categoryAccess)
      .sort(([, a], [, b]) => b - a)[0]?.[0] as DataCategory || 'medications';

    // Calculate sync success rate
    const completedSyncs = syncHistoryItems.filter(h => h.status === 'success').length;
    const syncSuccessRate = syncHistoryItems.length > 0
      ? (completedSyncs / syncHistoryItems.length) * 100
      : 100;

    // Calculate average sync duration
    const avgSyncDuration = syncHistoryItems.length > 0
      ? syncHistoryItems.reduce((sum, h) => sum + h.duration, 0) / syncHistoryItems.length
      : 0;

    return {
      totalCacheSize: cachedItems.reduce((sum, item) => sum + item.size, 0),
      totalCachedItems: cachedItems.length,
      syncQueueLength: this.syncQueue.size,
      pendingConflicts: this.getConflicts().length,
      lastSyncTime: this.lastSyncTime,
      averageSyncDuration: avgSyncDuration,
      syncSuccessRate,
      offlineUsageTime: this.totalOfflineTime + (this.offlineStartTime ? Date.now() - this.offlineStartTime : 0),
      mostAccessedCategory,
    };
  }

  // Cleanup
  cleanup(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  reset(): void {
    this.cache.clear();
    this.syncQueue.clear();
    this.conflicts.clear();
    this.syncHistory.clear();
    this.connectionStatus = 'online';
    this.syncStatus = 'idle';
    this.isOfflineMode = false;
    this.offlineStartTime = null;
    this.totalOfflineTime = 0;
    this.lastSyncTime = 0;
    this.initializeCapabilities();
  }
}

export const offlineModeService = new OfflineModeService();
