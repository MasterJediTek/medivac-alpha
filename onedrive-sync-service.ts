/**
 * OneDrive Personal File Sync Service
 * Sync personal compliance documents from OneDrive
 * MediVac One v5.9
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  CONFIG: 'medivac_onedrive_config',
  SYNCED_FILES: 'medivac_onedrive_files',
  SYNC_HISTORY: 'medivac_onedrive_history',
};

// Microsoft Graph endpoints
export const GRAPH_ENDPOINTS = {
  me: 'https://graph.microsoft.com/v1.0/me',
  drive: 'https://graph.microsoft.com/v1.0/me/drive',
  root: 'https://graph.microsoft.com/v1.0/me/drive/root',
  items: 'https://graph.microsoft.com/v1.0/me/drive/items',
  special: 'https://graph.microsoft.com/v1.0/me/drive/special',
};

// Types
export type SyncStatus = 'idle' | 'syncing' | 'error' | 'paused';
export type FileStatus = 'synced' | 'pending' | 'uploading' | 'downloading' | 'error' | 'conflict';
export type ConflictResolution = 'keep_local' | 'keep_remote' | 'keep_both' | 'manual';

export interface OneDriveConfig {
  connected: boolean;
  userEmail?: string;
  userName?: string;
  userPhoto?: string;
  driveId?: string;
  quotaUsed?: number;
  quotaTotal?: number;
  lastSync?: string;
  syncStatus: SyncStatus;
  autoSync: boolean;
  syncInterval: number; // minutes
  conflictResolution: ConflictResolution;
  offlineEnabled: boolean;
  syncFolders: SyncFolder[];
}

export interface SyncFolder {
  id: string;
  name: string;
  path: string;
  oneDriveId: string;
  localPath: string;
  enabled: boolean;
  syncDirection: 'upload' | 'download' | 'bidirectional';
  lastSync?: string;
  fileCount: number;
}

export interface OneDriveFile {
  id: string;
  name: string;
  path: string;
  oneDriveId: string;
  mimeType: string;
  size: number;
  createdAt: string;
  modifiedAt: string;
  syncedAt?: string;
  status: FileStatus;
  localPath?: string;
  downloadUrl?: string;
  thumbnailUrl?: string;
  isFolder: boolean;
  parentId?: string;
  version: number;
  checksum?: string;
}

export interface SyncHistoryEntry {
  id: string;
  timestamp: string;
  action: 'upload' | 'download' | 'delete' | 'conflict_resolved';
  fileName: string;
  filePath: string;
  status: 'success' | 'failed';
  error?: string;
  bytesTransferred?: number;
}

export interface FolderContents {
  folder: OneDriveFile;
  files: OneDriveFile[];
  subfolders: OneDriveFile[];
}

// Default configuration
const DEFAULT_CONFIG: OneDriveConfig = {
  connected: false,
  syncStatus: 'idle',
  autoSync: false,
  syncInterval: 30,
  conflictResolution: 'manual',
  offlineEnabled: true,
  syncFolders: [],
};

// Sample folders for demo
const SAMPLE_FOLDERS: SyncFolder[] = [
  {
    id: 'folder_documents',
    name: 'Documents',
    path: '/Documents',
    oneDriveId: 'od_doc_001',
    localPath: '/local/documents',
    enabled: true,
    syncDirection: 'bidirectional',
    fileCount: 24,
  },
  {
    id: 'folder_compliance',
    name: 'Compliance',
    path: '/Documents/Compliance',
    oneDriveId: 'od_comp_001',
    localPath: '/local/compliance',
    enabled: true,
    syncDirection: 'download',
    fileCount: 12,
  },
  {
    id: 'folder_training',
    name: 'Training Materials',
    path: '/Documents/Training',
    oneDriveId: 'od_train_001',
    localPath: '/local/training',
    enabled: false,
    syncDirection: 'download',
    fileCount: 8,
  },
];

// Sample files for demo
const SAMPLE_FILES: OneDriveFile[] = [
  {
    id: 'file_1',
    name: 'Compliance Policy 2025.pdf',
    path: '/Documents/Compliance/Compliance Policy 2025.pdf',
    oneDriveId: 'od_file_001',
    mimeType: 'application/pdf',
    size: 2457600,
    createdAt: '2025-01-15T10:00:00Z',
    modifiedAt: '2025-01-20T14:30:00Z',
    syncedAt: '2025-01-20T15:00:00Z',
    status: 'synced',
    isFolder: false,
    version: 3,
  },
  {
    id: 'file_2',
    name: 'Training Manual.docx',
    path: '/Documents/Training/Training Manual.docx',
    oneDriveId: 'od_file_002',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: 1843200,
    createdAt: '2025-01-10T09:00:00Z',
    modifiedAt: '2025-01-18T11:00:00Z',
    status: 'pending',
    isFolder: false,
    version: 2,
  },
  {
    id: 'file_3',
    name: 'Incident Report Template.xlsx',
    path: '/Documents/Compliance/Incident Report Template.xlsx',
    oneDriveId: 'od_file_003',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: 512000,
    createdAt: '2025-01-05T08:00:00Z',
    modifiedAt: '2025-01-22T16:45:00Z',
    status: 'conflict',
    isFolder: false,
    version: 5,
  },
  {
    id: 'file_4',
    name: 'Staff Directory.pdf',
    path: '/Documents/Staff Directory.pdf',
    oneDriveId: 'od_file_004',
    mimeType: 'application/pdf',
    size: 3145728,
    createdAt: '2024-12-01T10:00:00Z',
    modifiedAt: '2025-01-25T09:00:00Z',
    syncedAt: '2025-01-25T09:30:00Z',
    status: 'synced',
    isFolder: false,
    version: 8,
  },
  {
    id: 'file_5',
    name: 'Emergency Procedures.pdf',
    path: '/Documents/Compliance/Emergency Procedures.pdf',
    oneDriveId: 'od_file_005',
    mimeType: 'application/pdf',
    size: 1024000,
    createdAt: '2025-01-08T14:00:00Z',
    modifiedAt: '2025-01-08T14:00:00Z',
    status: 'downloading',
    isFolder: false,
    version: 1,
  },
];

class OneDriveSyncService {
  private config: OneDriveConfig = DEFAULT_CONFIG;
  private files: OneDriveFile[] = [];
  private history: SyncHistoryEntry[] = [];
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const [configData, filesData, historyData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.CONFIG),
        AsyncStorage.getItem(STORAGE_KEYS.SYNCED_FILES),
        AsyncStorage.getItem(STORAGE_KEYS.SYNC_HISTORY),
      ]);

      this.config = configData ? JSON.parse(configData) : { ...DEFAULT_CONFIG, syncFolders: SAMPLE_FOLDERS };
      this.files = filesData ? JSON.parse(filesData) : SAMPLE_FILES;
      this.history = historyData ? JSON.parse(historyData) : [];

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize OneDrive sync service:', error);
      this.config = { ...DEFAULT_CONFIG, syncFolders: SAMPLE_FOLDERS };
      this.files = SAMPLE_FILES;
      this.initialized = true;
    }
  }

  private async saveConfig(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save OneDrive config:', error);
    }
  }

  private async saveFiles(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SYNCED_FILES, JSON.stringify(this.files));
    } catch (error) {
      console.error('Failed to save OneDrive files:', error);
    }
  }

  private async saveHistory(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SYNC_HISTORY, JSON.stringify(this.history));
    } catch (error) {
      console.error('Failed to save sync history:', error);
    }
  }

  // Configuration
  getConfig(): OneDriveConfig {
    return { ...this.config };
  }

  async updateConfig(updates: Partial<OneDriveConfig>): Promise<OneDriveConfig> {
    this.config = { ...this.config, ...updates };
    await this.saveConfig();
    return this.config;
  }

  // Connection
  async connect(accessToken: string): Promise<boolean> {
    // Simulate Microsoft Graph API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    this.config = {
      ...this.config,
      connected: true,
      userEmail: 'user@medivac.health',
      userName: 'Current User',
      driveId: 'drive_' + Date.now(),
      quotaUsed: 5368709120, // 5GB
      quotaTotal: 107374182400, // 100GB
      lastSync: new Date().toISOString(),
      syncStatus: 'idle',
    };

    await this.saveConfig();
    return true;
  }

  async disconnect(): Promise<void> {
    this.config = { ...DEFAULT_CONFIG, syncFolders: [] };
    this.files = [];
    await Promise.all([this.saveConfig(), this.saveFiles()]);
  }

  // Folders
  getSyncFolders(): SyncFolder[] {
    return [...this.config.syncFolders];
  }

  async addSyncFolder(folder: Omit<SyncFolder, 'id'>): Promise<SyncFolder> {
    const newFolder: SyncFolder = {
      ...folder,
      id: `folder_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    };

    this.config.syncFolders.push(newFolder);
    await this.saveConfig();
    return newFolder;
  }

  async updateSyncFolder(id: string, updates: Partial<SyncFolder>): Promise<SyncFolder | null> {
    const index = this.config.syncFolders.findIndex(f => f.id === id);
    if (index === -1) return null;

    this.config.syncFolders[index] = { ...this.config.syncFolders[index], ...updates };
    await this.saveConfig();
    return this.config.syncFolders[index];
  }

  async removeSyncFolder(id: string): Promise<boolean> {
    const index = this.config.syncFolders.findIndex(f => f.id === id);
    if (index === -1) return false;

    this.config.syncFolders.splice(index, 1);
    await this.saveConfig();
    return true;
  }

  // Files
  getFiles(): OneDriveFile[] {
    return [...this.files];
  }

  getFilesByFolder(folderId: string): OneDriveFile[] {
    const folder = this.config.syncFolders.find(f => f.id === folderId);
    if (!folder) return [];
    return this.files.filter(f => f.path.startsWith(folder.path));
  }

  getFilesByStatus(status: FileStatus): OneDriveFile[] {
    return this.files.filter(f => f.status === status);
  }

  async syncFile(fileId: string): Promise<OneDriveFile | null> {
    const file = this.files.find(f => f.id === fileId);
    if (!file) return null;

    file.status = file.status === 'pending' ? 'downloading' : 'uploading';
    await this.saveFiles();

    // Simulate sync
    await new Promise(resolve => setTimeout(resolve, 1000));

    file.status = 'synced';
    file.syncedAt = new Date().toISOString();
    await this.saveFiles();

    // Add to history
    this.history.unshift({
      id: `hist_${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'download',
      fileName: file.name,
      filePath: file.path,
      status: 'success',
      bytesTransferred: file.size,
    });
    await this.saveHistory();

    return file;
  }

  async resolveConflict(fileId: string, resolution: ConflictResolution): Promise<OneDriveFile | null> {
    const file = this.files.find(f => f.id === fileId);
    if (!file || file.status !== 'conflict') return null;

    // Simulate conflict resolution
    await new Promise(resolve => setTimeout(resolve, 800));

    file.status = 'synced';
    file.syncedAt = new Date().toISOString();
    file.version += 1;
    await this.saveFiles();

    this.history.unshift({
      id: `hist_${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'conflict_resolved',
      fileName: file.name,
      filePath: file.path,
      status: 'success',
    });
    await this.saveHistory();

    return file;
  }

  // Sync operations
  async syncAll(): Promise<{ success: number; failed: number }> {
    this.config.syncStatus = 'syncing';
    await this.saveConfig();

    let success = 0;
    let failed = 0;

    for (const file of this.files) {
      if (file.status === 'pending' || file.status === 'error') {
        try {
          await this.syncFile(file.id);
          success++;
        } catch {
          failed++;
        }
      }
    }

    this.config.syncStatus = 'idle';
    this.config.lastSync = new Date().toISOString();
    await this.saveConfig();

    return { success, failed };
  }

  async pauseSync(): Promise<void> {
    this.config.syncStatus = 'paused';
    await this.saveConfig();
  }

  async resumeSync(): Promise<void> {
    this.config.syncStatus = 'idle';
    await this.saveConfig();
  }

  // History
  getSyncHistory(): SyncHistoryEntry[] {
    return [...this.history];
  }

  async clearHistory(): Promise<void> {
    this.history = [];
    await this.saveHistory();
  }

  // Statistics
  getStatistics(): {
    connected: boolean;
    totalFiles: number;
    syncedFiles: number;
    pendingFiles: number;
    conflictFiles: number;
    totalSize: number;
    quotaUsed: number;
    quotaTotal: number;
    lastSync?: string;
  } {
    const synced = this.files.filter(f => f.status === 'synced').length;
    const pending = this.files.filter(f => f.status === 'pending' || f.status === 'uploading' || f.status === 'downloading').length;
    const conflicts = this.files.filter(f => f.status === 'conflict').length;
    const totalSize = this.files.reduce((sum, f) => sum + f.size, 0);

    return {
      connected: this.config.connected,
      totalFiles: this.files.length,
      syncedFiles: synced,
      pendingFiles: pending,
      conflictFiles: conflicts,
      totalSize,
      quotaUsed: this.config.quotaUsed || 0,
      quotaTotal: this.config.quotaTotal || 0,
      lastSync: this.config.lastSync,
    };
  }

  // Export
  exportConfig(): string {
    return JSON.stringify({
      config: this.config,
      folders: this.config.syncFolders,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    }, null, 2);
  }
}

export const oneDriveSyncService = new OneDriveSyncService();
