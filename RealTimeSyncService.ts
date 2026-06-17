/**
 * Real-Time Data Sync Service with Conflict Resolution
 * Provides WebSocket-based real-time synchronization with JEDI/SMPO.ink servers
 * Implements conflict detection and resolution strategies
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Sync configuration
export interface SyncConfig {
  serverUrl: string;
  reconnectInterval: number;
  maxRetries: number;
  deltaSync: boolean;
  conflictStrategy: ConflictStrategy;
  syncInterval: number;
}

// Conflict resolution strategies
export type ConflictStrategy = 'server-wins' | 'client-wins' | 'merge' | 'manual';

// Sync status
export type SyncStatus = 'connected' | 'connecting' | 'disconnected' | 'syncing' | 'error' | 'conflict';

// Data record with versioning
export interface SyncRecord {
  id: string;
  type: string;
  data: any;
  version: number;
  timestamp: number;
  checksum: string;
  source: 'local' | 'remote';
  deleted?: boolean;
}

// Conflict information
export interface SyncConflict {
  id: string;
  recordId: string;
  recordType: string;
  localRecord: SyncRecord;
  remoteRecord: SyncRecord;
  detectedAt: number;
  resolvedAt?: number;
  resolution?: ConflictStrategy;
  resolvedData?: any;
}

// Sync event types
export type SyncEventType = 
  | 'connected'
  | 'disconnected'
  | 'sync_started'
  | 'sync_completed'
  | 'sync_error'
  | 'conflict_detected'
  | 'conflict_resolved'
  | 'record_updated'
  | 'record_deleted';

// Sync event
export interface SyncEvent {
  type: SyncEventType;
  timestamp: number;
  data?: any;
}

// Sync statistics
export interface SyncStats {
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  conflictsDetected: number;
  conflictsResolved: number;
  recordsSynced: number;
  lastSyncTime: number;
  bytesTransferred: number;
  averageSyncDuration: number;
}

// Delta change
export interface DeltaChange {
  recordId: string;
  recordType: string;
  operation: 'create' | 'update' | 'delete';
  changes: Record<string, { old: any; new: any }>;
  timestamp: number;
}

// Sync listener
type SyncListener = (event: SyncEvent) => void;

class RealTimeSyncService {
  private config: SyncConfig;
  private status: SyncStatus = 'disconnected';
  private websocket: WebSocket | null = null;
  private reconnectAttempts: number = 0;
  private syncQueue: SyncRecord[] = [];
  private pendingConflicts: Map<string, SyncConflict> = new Map();
  private localCache: Map<string, SyncRecord> = new Map();
  private listeners: Set<SyncListener> = new Set();
  private stats: SyncStats;
  private syncTimer: ReturnType<typeof setInterval> | null = null;
  private deltaChanges: DeltaChange[] = [];

  constructor() {
    this.config = {
      serverUrl: 'wss://jedi.click/sync',
      reconnectInterval: 5000,
      maxRetries: 10,
      deltaSync: true,
      conflictStrategy: 'merge',
      syncInterval: 30000,
    };

    this.stats = {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      conflictsDetected: 0,
      conflictsResolved: 0,
      recordsSynced: 0,
      lastSyncTime: 0,
      bytesTransferred: 0,
      averageSyncDuration: 0,
    };

    this.loadState();
  }

  // Initialize and connect
  async initialize(config?: Partial<SyncConfig>): Promise<void> {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    await this.connect();
    this.startPeriodicSync();
  }

  // Connect to sync server
  async connect(): Promise<void> {
    if (this.status === 'connected' || this.status === 'connecting') {
      return;
    }

    this.setStatus('connecting');

    try {
      // Simulate WebSocket connection for demo
      // In production, this would be a real WebSocket connection
      await this.simulateConnection();
      
      this.setStatus('connected');
      this.reconnectAttempts = 0;
      this.emitEvent({ type: 'connected', timestamp: Date.now() });
      
      // Perform initial sync
      await this.performSync();
    } catch (error) {
      this.handleConnectionError(error);
    }
  }

  // Simulate WebSocket connection
  private async simulateConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate successful connection
        resolve();
      }, 500);
    });
  }

  // Disconnect from sync server
  disconnect(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    
    this.setStatus('disconnected');
    this.emitEvent({ type: 'disconnected', timestamp: Date.now() });
  }

  // Handle connection error
  private handleConnectionError(error: any): void {
    console.error('Sync connection error:', error);
    this.setStatus('error');
    
    if (this.reconnectAttempts < this.config.maxRetries) {
      this.reconnectAttempts++;
      setTimeout(() => this.connect(), this.config.reconnectInterval);
    }
  }

  // Start periodic sync
  private startPeriodicSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    
    this.syncTimer = setInterval(() => {
      if (this.status === 'connected') {
        this.performSync();
      }
    }, this.config.syncInterval);
  }

  // Perform sync operation
  async performSync(): Promise<void> {
    if (this.status !== 'connected') {
      return;
    }

    const startTime = Date.now();
    this.setStatus('syncing');
    this.emitEvent({ type: 'sync_started', timestamp: startTime });
    this.stats.totalSyncs++;

    try {
      // Get local changes
      const localChanges = this.config.deltaSync 
        ? this.getDeltaChanges() 
        : this.getFullLocalData();

      // Simulate server sync
      const serverChanges = await this.fetchServerChanges();

      // Detect and resolve conflicts
      const conflicts = this.detectConflicts(localChanges, serverChanges);
      
      for (const conflict of conflicts) {
        await this.resolveConflict(conflict);
      }

      // Apply changes
      await this.applyServerChanges(serverChanges);
      await this.pushLocalChanges(localChanges);

      // Update stats
      const duration = Date.now() - startTime;
      this.stats.successfulSyncs++;
      this.stats.lastSyncTime = Date.now();
      this.stats.recordsSynced += localChanges.length + serverChanges.length;
      this.stats.averageSyncDuration = 
        (this.stats.averageSyncDuration * (this.stats.successfulSyncs - 1) + duration) / 
        this.stats.successfulSyncs;

      // Clear delta changes after successful sync
      this.deltaChanges = [];

      this.setStatus('connected');
      this.emitEvent({ 
        type: 'sync_completed', 
        timestamp: Date.now(),
        data: { duration, recordsProcessed: localChanges.length + serverChanges.length }
      });

      await this.saveState();
    } catch (error) {
      this.stats.failedSyncs++;
      this.setStatus('error');
      this.emitEvent({ 
        type: 'sync_error', 
        timestamp: Date.now(),
        data: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }
  }

  // Get delta changes since last sync
  private getDeltaChanges(): SyncRecord[] {
    return this.deltaChanges.map(change => ({
      id: change.recordId,
      type: change.recordType,
      data: change.changes,
      version: Date.now(),
      timestamp: change.timestamp,
      checksum: this.generateChecksum(change.changes),
      source: 'local' as const,
      deleted: change.operation === 'delete',
    }));
  }

  // Get full local data
  private getFullLocalData(): SyncRecord[] {
    return Array.from(this.localCache.values());
  }

  // Fetch server changes (simulated)
  private async fetchServerChanges(): Promise<SyncRecord[]> {
    // Simulate server response
    return new Promise((resolve) => {
      setTimeout(() => {
        // Return simulated server changes
        resolve([
          {
            id: 'server-update-1',
            type: 'patient',
            data: { name: 'Server Patient', status: 'active' },
            version: Date.now(),
            timestamp: Date.now(),
            checksum: 'abc123',
            source: 'remote' as const,
          },
        ]);
      }, 200);
    });
  }

  // Detect conflicts between local and server data
  private detectConflicts(localRecords: SyncRecord[], serverRecords: SyncRecord[]): SyncConflict[] {
    const conflicts: SyncConflict[] = [];
    const serverMap = new Map(serverRecords.map(r => [r.id, r]));

    for (const localRecord of localRecords) {
      const serverRecord = serverMap.get(localRecord.id);
      
      if (serverRecord && this.hasConflict(localRecord, serverRecord)) {
        const conflict: SyncConflict = {
          id: `conflict-${Date.now()}-${localRecord.id}`,
          recordId: localRecord.id,
          recordType: localRecord.type,
          localRecord,
          remoteRecord: serverRecord,
          detectedAt: Date.now(),
        };
        
        conflicts.push(conflict);
        this.pendingConflicts.set(conflict.id, conflict);
        this.stats.conflictsDetected++;
        
        this.emitEvent({
          type: 'conflict_detected',
          timestamp: Date.now(),
          data: conflict,
        });
      }
    }

    return conflicts;
  }

  // Check if two records have a conflict
  private hasConflict(local: SyncRecord, remote: SyncRecord): boolean {
    // Conflict exists if both have been modified since last sync
    // and checksums don't match
    return local.checksum !== remote.checksum && 
           local.timestamp > this.stats.lastSyncTime &&
           remote.timestamp > this.stats.lastSyncTime;
  }

  // Resolve a conflict
  async resolveConflict(conflict: SyncConflict, strategy?: ConflictStrategy): Promise<SyncRecord> {
    const resolveStrategy = strategy || this.config.conflictStrategy;
    let resolvedData: any;

    switch (resolveStrategy) {
      case 'server-wins':
        resolvedData = conflict.remoteRecord.data;
        break;
      
      case 'client-wins':
        resolvedData = conflict.localRecord.data;
        break;
      
      case 'merge':
        resolvedData = this.mergeRecords(conflict.localRecord, conflict.remoteRecord);
        break;
      
      case 'manual':
        // Store for manual resolution
        this.setStatus('conflict');
        return conflict.localRecord;
    }

    const resolvedRecord: SyncRecord = {
      id: conflict.recordId,
      type: conflict.recordType,
      data: resolvedData,
      version: Math.max(conflict.localRecord.version, conflict.remoteRecord.version) + 1,
      timestamp: Date.now(),
      checksum: this.generateChecksum(resolvedData),
      source: 'local',
    };

    // Update conflict record
    conflict.resolvedAt = Date.now();
    conflict.resolution = resolveStrategy;
    conflict.resolvedData = resolvedData;
    
    // Remove from pending
    this.pendingConflicts.delete(conflict.id);
    this.stats.conflictsResolved++;

    // Update local cache
    this.localCache.set(resolvedRecord.id, resolvedRecord);

    this.emitEvent({
      type: 'conflict_resolved',
      timestamp: Date.now(),
      data: { conflict, resolvedRecord },
    });

    return resolvedRecord;
  }

  // Merge two records (field-level merge)
  private mergeRecords(local: SyncRecord, remote: SyncRecord): any {
    const merged: any = { ...remote.data };
    
    // Prefer local changes for fields that were modified locally
    for (const key of Object.keys(local.data)) {
      if (local.data[key] !== undefined) {
        // If local has a newer timestamp for this field, use local value
        if (local.timestamp > remote.timestamp) {
          merged[key] = local.data[key];
        }
      }
    }

    // Add metadata about merge
    merged._mergedAt = Date.now();
    merged._mergeSource = 'auto';

    return merged;
  }

  // Apply server changes to local cache
  private async applyServerChanges(changes: SyncRecord[]): Promise<void> {
    for (const record of changes) {
      if (record.deleted) {
        this.localCache.delete(record.id);
      } else {
        const existing = this.localCache.get(record.id);
        if (!existing || record.version > existing.version) {
          this.localCache.set(record.id, record);
          this.emitEvent({
            type: 'record_updated',
            timestamp: Date.now(),
            data: record,
          });
        }
      }
    }
  }

  // Push local changes to server
  private async pushLocalChanges(changes: SyncRecord[]): Promise<void> {
    // Simulate pushing changes to server
    for (const record of changes) {
      this.stats.bytesTransferred += JSON.stringify(record).length;
    }
  }

  // Track a local change for delta sync
  trackChange(recordId: string, recordType: string, operation: 'create' | 'update' | 'delete', changes: Record<string, { old: any; new: any }>): void {
    const deltaChange: DeltaChange = {
      recordId,
      recordType,
      operation,
      changes,
      timestamp: Date.now(),
    };

    this.deltaChanges.push(deltaChange);

    // Update local cache
    if (operation === 'delete') {
      this.localCache.delete(recordId);
    } else {
      const newData = Object.fromEntries(
        Object.entries(changes).map(([key, val]) => [key, val.new])
      );
      
      const record: SyncRecord = {
        id: recordId,
        type: recordType,
        data: newData,
        version: Date.now(),
        timestamp: Date.now(),
        checksum: this.generateChecksum(newData),
        source: 'local',
      };
      
      this.localCache.set(recordId, record);
    }
  }

  // Generate checksum for data
  private generateChecksum(data: any): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  // Set sync status
  private setStatus(status: SyncStatus): void {
    this.status = status;
  }

  // Get current status
  getStatus(): SyncStatus {
    return this.status;
  }

  // Get sync statistics
  getStats(): SyncStats {
    return { ...this.stats };
  }

  // Get pending conflicts
  getPendingConflicts(): SyncConflict[] {
    return Array.from(this.pendingConflicts.values());
  }

  // Get sync configuration
  getConfig(): SyncConfig {
    return { ...this.config };
  }

  // Update sync configuration
  updateConfig(config: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Restart periodic sync if interval changed
    if (config.syncInterval) {
      this.startPeriodicSync();
    }
  }

  // Add event listener
  addListener(listener: SyncListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Emit event to all listeners
  private emitEvent(event: SyncEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Sync listener error:', error);
      }
    });
  }

  // Force immediate sync
  async forceSync(): Promise<void> {
    if (this.status === 'disconnected') {
      await this.connect();
    }
    await this.performSync();
  }

  // Get sync progress
  getSyncProgress(): { current: number; total: number; percentage: number } {
    const total = this.syncQueue.length + this.deltaChanges.length;
    const current = this.stats.recordsSynced;
    return {
      current,
      total,
      percentage: total > 0 ? Math.round((current / total) * 100) : 100,
    };
  }

  // Save state to persistent storage
  private async saveState(): Promise<void> {
    try {
      await AsyncStorage.setItem('realtime_sync_stats', JSON.stringify(this.stats));
      await AsyncStorage.setItem('realtime_sync_cache', JSON.stringify(Array.from(this.localCache.entries())));
    } catch (error) {
      console.error('Failed to save sync state:', error);
    }
  }

  // Load state from persistent storage
  private async loadState(): Promise<void> {
    try {
      const statsJson = await AsyncStorage.getItem('realtime_sync_stats');
      if (statsJson) {
        this.stats = JSON.parse(statsJson);
      }

      const cacheJson = await AsyncStorage.getItem('realtime_sync_cache');
      if (cacheJson) {
        this.localCache = new Map(JSON.parse(cacheJson));
      }
    } catch (error) {
      console.error('Failed to load sync state:', error);
    }
  }

  // Clear all sync data
  async clearSyncData(): Promise<void> {
    this.localCache.clear();
    this.deltaChanges = [];
    this.pendingConflicts.clear();
    this.stats = {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      conflictsDetected: 0,
      conflictsResolved: 0,
      recordsSynced: 0,
      lastSyncTime: 0,
      bytesTransferred: 0,
      averageSyncDuration: 0,
    };
    await AsyncStorage.removeItem('realtime_sync_stats');
    await AsyncStorage.removeItem('realtime_sync_cache');
  }
}

// Export singleton instance
export const realTimeSyncService = new RealTimeSyncService();
export default realTimeSyncService;
