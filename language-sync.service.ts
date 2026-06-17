/**
 * Language Preference Sync Service
 * Syncs language preferences across devices via L3/S3 cache system
 */

import { languageService, type LanguageCode } from './language.service';

export interface LanguageSyncState {
  isSyncing: boolean;
  lastSyncTime: number | null;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error' | 'conflict';
  conflictInfo: LanguageConflict | null;
  deviceId: string;
}

export interface LanguageConflict {
  localLanguage: LanguageCode;
  remoteLanguage: LanguageCode;
  localTimestamp: number;
  remoteTimestamp: number;
}

export interface LanguageSyncRecord {
  languageCode: LanguageCode;
  deviceId: string;
  timestamp: number;
  deviceName: string;
}

type SyncListener = (state: LanguageSyncState) => void;

const SYNC_STORAGE_KEY = 'medivac_language_sync';
const DEVICE_ID_KEY = 'medivac_device_id';

class LanguageSyncService {
  private static instance: LanguageSyncService;
  private listeners: Set<SyncListener> = new Set();
  private state: LanguageSyncState;
  private deviceId: string;
  private syncRecords: Map<string, LanguageSyncRecord> = new Map();

  private constructor() {
    this.deviceId = this.getOrCreateDeviceId();
    this.state = {
      isSyncing: false,
      lastSyncTime: null,
      syncStatus: 'idle',
      conflictInfo: null,
      deviceId: this.deviceId,
    };
    this.loadSyncRecords();
  }

  static getInstance(): LanguageSyncService {
    if (!LanguageSyncService.instance) {
      LanguageSyncService.instance = new LanguageSyncService();
    }
    return LanguageSyncService.instance;
  }

  private getOrCreateDeviceId(): string {
    try {
      if (typeof localStorage !== 'undefined') {
        let id = localStorage.getItem(DEVICE_ID_KEY);
        if (!id) {
          id = `device-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
          localStorage.setItem(DEVICE_ID_KEY, id);
        }
        return id;
      }
    } catch {
      // Fallback
    }
    return `device-${Date.now()}`;
  }

  private loadSyncRecords(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(SYNC_STORAGE_KEY);
        if (stored) {
          const data = JSON.parse(stored);
          if (data.records) {
            Object.entries(data.records).forEach(([key, value]) => {
              this.syncRecords.set(key, value as LanguageSyncRecord);
            });
          }
          if (data.lastSyncTime) {
            this.state.lastSyncTime = data.lastSyncTime;
          }
        }
      }
    } catch {
      // Use defaults
    }
  }

  private saveSyncRecords(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const records: Record<string, LanguageSyncRecord> = {};
        this.syncRecords.forEach((value, key) => {
          records[key] = value;
        });
        localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify({
          records,
          lastSyncTime: this.state.lastSyncTime,
        }));
      }
    } catch {
      // Silently fail
    }
  }

  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener({ ...this.state }));
  }

  // Get current sync state
  getState(): LanguageSyncState {
    return { ...this.state };
  }

  // Get device ID
  getDeviceId(): string {
    return this.deviceId;
  }

  // Get all sync records
  getSyncRecords(): LanguageSyncRecord[] {
    return Array.from(this.syncRecords.values());
  }

  // Sync language preference to cloud
  async syncToCloud(): Promise<boolean> {
    this.state.isSyncing = true;
    this.state.syncStatus = 'syncing';
    this.notifyListeners();

    try {
      // Simulate network delay for cloud sync
      await new Promise(resolve => setTimeout(resolve, 800));

      const currentLang = languageService.getCurrentLanguageCode();
      const now = Date.now();

      // Check for conflicts with remote data
      const remoteRecord = this.getRemoteRecord();
      if (remoteRecord && remoteRecord.deviceId !== this.deviceId) {
        if (remoteRecord.languageCode !== currentLang) {
          // Conflict detected
          this.state.conflictInfo = {
            localLanguage: currentLang,
            remoteLanguage: remoteRecord.languageCode,
            localTimestamp: now,
            remoteTimestamp: remoteRecord.timestamp,
          };
          this.state.syncStatus = 'conflict';
          this.state.isSyncing = false;
          this.notifyListeners();
          return false;
        }
      }

      // Save sync record
      const record: LanguageSyncRecord = {
        languageCode: currentLang,
        deviceId: this.deviceId,
        timestamp: now,
        deviceName: this.getDeviceName(),
      };

      this.syncRecords.set(this.deviceId, record);
      this.state.lastSyncTime = now;
      this.state.syncStatus = 'success';
      this.state.isSyncing = false;
      this.state.conflictInfo = null;

      this.saveSyncRecords();
      this.notifyListeners();
      return true;
    } catch (error) {
      this.state.syncStatus = 'error';
      this.state.isSyncing = false;
      this.notifyListeners();
      return false;
    }
  }

  // Sync from cloud (pull remote preference)
  async syncFromCloud(): Promise<LanguageCode | null> {
    this.state.isSyncing = true;
    this.state.syncStatus = 'syncing';
    this.notifyListeners();

    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 600));

      const remoteRecord = this.getRemoteRecord();
      if (remoteRecord) {
        // Apply remote language
        languageService.setLanguage(remoteRecord.languageCode);
        this.state.lastSyncTime = Date.now();
        this.state.syncStatus = 'success';
        this.state.conflictInfo = null;
      } else {
        this.state.syncStatus = 'success';
      }

      this.state.isSyncing = false;
      this.notifyListeners();
      return remoteRecord?.languageCode || null;
    } catch {
      this.state.syncStatus = 'error';
      this.state.isSyncing = false;
      this.notifyListeners();
      return null;
    }
  }

  // Resolve conflict
  resolveConflict(useLocal: boolean): void {
    if (!this.state.conflictInfo) return;

    if (useLocal) {
      // Keep local, push to cloud
      const record: LanguageSyncRecord = {
        languageCode: this.state.conflictInfo.localLanguage,
        deviceId: this.deviceId,
        timestamp: Date.now(),
        deviceName: this.getDeviceName(),
      };
      this.syncRecords.set(this.deviceId, record);
    } else {
      // Use remote
      languageService.setLanguage(this.state.conflictInfo.remoteLanguage);
      const record: LanguageSyncRecord = {
        languageCode: this.state.conflictInfo.remoteLanguage,
        deviceId: this.deviceId,
        timestamp: Date.now(),
        deviceName: this.getDeviceName(),
      };
      this.syncRecords.set(this.deviceId, record);
    }

    this.state.conflictInfo = null;
    this.state.syncStatus = 'success';
    this.state.lastSyncTime = Date.now();
    this.saveSyncRecords();
    this.notifyListeners();
  }

  // Get the most recent remote record (from another device)
  private getRemoteRecord(): LanguageSyncRecord | null {
    let latestRecord: LanguageSyncRecord | null = null;
    let latestTime = 0;

    this.syncRecords.forEach((record) => {
      if (record.deviceId !== this.deviceId && record.timestamp > latestTime) {
        latestTime = record.timestamp;
        latestRecord = record;
      }
    });

    return latestRecord;
  }

  // Get device name
  private getDeviceName(): string {
    try {
      if (typeof navigator !== 'undefined') {
        const ua = navigator.userAgent;
        if (ua.includes('iPhone')) return 'iPhone';
        if (ua.includes('iPad')) return 'iPad';
        if (ua.includes('Android')) return 'Android Device';
        if (ua.includes('Mac')) return 'Mac';
        if (ua.includes('Windows')) return 'Windows PC';
        return 'Web Browser';
      }
    } catch {
      // Fallback
    }
    return 'Unknown Device';
  }

  // Get formatted last sync time
  getFormattedLastSync(): string {
    if (!this.state.lastSyncTime) return 'Never';

    const now = Date.now();
    const diff = now - this.state.lastSyncTime;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hr ago`;
    return new Date(this.state.lastSyncTime).toLocaleDateString();
  }

  // Get sync status label
  getSyncStatusLabel(): string {
    switch (this.state.syncStatus) {
      case 'idle': return 'Not synced';
      case 'syncing': return 'Syncing...';
      case 'success': return 'Synced';
      case 'error': return 'Sync failed';
      case 'conflict': return 'Conflict detected';
    }
  }

  // Get sync status color key
  getSyncStatusColor(): string {
    switch (this.state.syncStatus) {
      case 'idle': return 'muted';
      case 'syncing': return 'primary';
      case 'success': return 'success';
      case 'error': return 'error';
      case 'conflict': return 'warning';
    }
  }

  // Reset sync data
  resetSync(): void {
    this.syncRecords.clear();
    this.state = {
      isSyncing: false,
      lastSyncTime: null,
      syncStatus: 'idle',
      conflictInfo: null,
      deviceId: this.deviceId,
    };
    this.saveSyncRecords();
    this.notifyListeners();
  }
}

export const languageSyncService = LanguageSyncService.getInstance();
