/**
 * SharePoint Document Sync Service
 * Microsoft 365 integration for compliance documents and policies
 * MediVac One v5.8
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  CONFIG: 'medivac_sharepoint_config',
  LIBRARIES: 'medivac_sharepoint_libraries',
  SYNC_MAPPINGS: 'medivac_sharepoint_mappings',
  SYNC_HISTORY: 'medivac_sharepoint_history',
  DOCUMENTS: 'medivac_sharepoint_documents',
};

// Types
export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'conflict';
export type SyncDirection = 'upload' | 'download' | 'bidirectional';
export type ConflictResolution = 'local_wins' | 'remote_wins' | 'newest_wins' | 'manual';
export type DocumentCategory = 'compliance' | 'policy' | 'procedure' | 'form' | 'report' | 'training' | 'other';

export interface SharePointConfig {
  tenantId: string;
  clientId: string;
  clientSecret?: string;
  siteUrl: string;
  siteName: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: string;
  lastSync?: string;
  lastError?: string;
  autoSync: boolean;
  syncIntervalMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentLibrary {
  id: string;
  name: string;
  description: string;
  webUrl: string;
  itemCount: number;
  lastModified: string;
  isDefault: boolean;
  syncEnabled: boolean;
}

export interface SyncMapping {
  id: string;
  libraryId: string;
  libraryName: string;
  localFolder: string;
  category: DocumentCategory;
  direction: SyncDirection;
  conflictResolution: ConflictResolution;
  includeSubfolders: boolean;
  fileTypes: string[];
  excludePatterns: string[];
  status: SyncStatus;
  lastSync?: string;
  itemsSynced: number;
  errors: string[];
  createdAt: string;
}

export interface SyncedDocument {
  id: string;
  mappingId: string;
  name: string;
  path: string;
  localPath: string;
  remotePath: string;
  size: number;
  mimeType: string;
  category: DocumentCategory;
  version: string;
  localModified: string;
  remoteModified: string;
  syncStatus: SyncStatus;
  lastSynced?: string;
  checksum?: string;
}

export interface SyncHistoryEntry {
  id: string;
  mappingId: string;
  mappingName: string;
  direction: SyncDirection;
  status: 'success' | 'partial' | 'failed';
  itemsUploaded: number;
  itemsDownloaded: number;
  itemsSkipped: number;
  itemsFailed: number;
  conflicts: number;
  duration: number;
  startedAt: string;
  completedAt: string;
  errors: string[];
}

// Microsoft Graph API endpoints
export const GRAPH_ENDPOINTS = {
  sites: 'https://graph.microsoft.com/v1.0/sites',
  drives: 'https://graph.microsoft.com/v1.0/drives',
  me: 'https://graph.microsoft.com/v1.0/me',
  authorize: 'https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize',
  token: 'https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token',
};

// Document categories
export const DOCUMENT_CATEGORIES: Record<DocumentCategory, { label: string; color: string; icon: string }> = {
  compliance: { label: 'Compliance', color: '#3B82F6', icon: 'shield.fill' },
  policy: { label: 'Policy', color: '#8B5CF6', icon: 'doc.text.fill' },
  procedure: { label: 'Procedure', color: '#10B981', icon: 'list.clipboard.fill' },
  form: { label: 'Form', color: '#F59E0B', icon: 'doc.fill' },
  report: { label: 'Report', color: '#EF4444', icon: 'chart.bar.fill' },
  training: { label: 'Training', color: '#EC4899', icon: 'book.fill' },
  other: { label: 'Other', color: '#6B7280', icon: 'folder.fill' },
};

// Default configuration
const DEFAULT_CONFIG: SharePointConfig = {
  tenantId: '',
  clientId: '',
  siteUrl: '',
  siteName: '',
  status: 'disconnected',
  autoSync: false,
  syncIntervalMinutes: 60,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Sample libraries for demo
const SAMPLE_LIBRARIES: DocumentLibrary[] = [
  {
    id: 'lib_compliance',
    name: 'Compliance Documents',
    description: 'Healthcare compliance and regulatory documents',
    webUrl: 'https://contoso.sharepoint.com/sites/medivac/Compliance',
    itemCount: 45,
    lastModified: new Date().toISOString(),
    isDefault: true,
    syncEnabled: true,
  },
  {
    id: 'lib_policies',
    name: 'Hospital Policies',
    description: 'Official hospital policies and procedures',
    webUrl: 'https://contoso.sharepoint.com/sites/medivac/Policies',
    itemCount: 128,
    lastModified: new Date().toISOString(),
    isDefault: false,
    syncEnabled: true,
  },
  {
    id: 'lib_training',
    name: 'Training Materials',
    description: 'Staff training documents and resources',
    webUrl: 'https://contoso.sharepoint.com/sites/medivac/Training',
    itemCount: 67,
    lastModified: new Date().toISOString(),
    isDefault: false,
    syncEnabled: false,
  },
];

class SharePointSyncService {
  private config: SharePointConfig = DEFAULT_CONFIG;
  private libraries: DocumentLibrary[] = [];
  private mappings: SyncMapping[] = [];
  private history: SyncHistoryEntry[] = [];
  private documents: SyncedDocument[] = [];
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const [configData, librariesData, mappingsData, historyData, documentsData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.CONFIG),
        AsyncStorage.getItem(STORAGE_KEYS.LIBRARIES),
        AsyncStorage.getItem(STORAGE_KEYS.SYNC_MAPPINGS),
        AsyncStorage.getItem(STORAGE_KEYS.SYNC_HISTORY),
        AsyncStorage.getItem(STORAGE_KEYS.DOCUMENTS),
      ]);

      this.config = configData ? JSON.parse(configData) : DEFAULT_CONFIG;
      this.libraries = librariesData ? JSON.parse(librariesData) : SAMPLE_LIBRARIES;
      this.mappings = mappingsData ? JSON.parse(mappingsData) : [];
      this.history = historyData ? JSON.parse(historyData) : [];
      this.documents = documentsData ? JSON.parse(documentsData) : [];

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize SharePoint sync service:', error);
      this.config = DEFAULT_CONFIG;
      this.libraries = SAMPLE_LIBRARIES;
      this.initialized = true;
    }
  }

  private async saveConfig(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save SharePoint config:', error);
    }
  }

  private async saveLibraries(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LIBRARIES, JSON.stringify(this.libraries));
    } catch (error) {
      console.error('Failed to save SharePoint libraries:', error);
    }
  }

  private async saveMappings(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SYNC_MAPPINGS, JSON.stringify(this.mappings));
    } catch (error) {
      console.error('Failed to save sync mappings:', error);
    }
  }

  private async saveHistory(): Promise<void> {
    try {
      // Keep only last 100 entries
      if (this.history.length > 100) {
        this.history = this.history.slice(-100);
      }
      await AsyncStorage.setItem(STORAGE_KEYS.SYNC_HISTORY, JSON.stringify(this.history));
    } catch (error) {
      console.error('Failed to save sync history:', error);
    }
  }

  private async saveDocuments(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(this.documents));
    } catch (error) {
      console.error('Failed to save documents:', error);
    }
  }

  // Configuration
  getConfig(): SharePointConfig {
    return { ...this.config };
  }

  async updateConfig(updates: Partial<SharePointConfig>): Promise<SharePointConfig> {
    await this.initialize();

    this.config = {
      ...this.config,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await this.saveConfig();
    return this.config;
  }

  // Connection
  async connect(): Promise<{ success: boolean; message: string }> {
    await this.initialize();

    if (!this.config.tenantId || !this.config.clientId) {
      return { success: false, message: 'Missing tenant ID or client ID' };
    }

    this.config.status = 'connecting';
    await this.saveConfig();

    // Simulate OAuth flow
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (Math.random() > 0.1) {
      this.config.status = 'connected';
      this.config.accessToken = 'mock_access_token_' + Date.now();
      this.config.tokenExpiry = new Date(Date.now() + 3600000).toISOString();
      this.config.lastError = undefined;
      await this.saveConfig();

      return { success: true, message: 'Successfully connected to SharePoint' };
    } else {
      this.config.status = 'error';
      this.config.lastError = 'Authentication failed';
      await this.saveConfig();

      return { success: false, message: 'Authentication failed' };
    }
  }

  async disconnect(): Promise<void> {
    this.config.status = 'disconnected';
    this.config.accessToken = undefined;
    this.config.refreshToken = undefined;
    this.config.tokenExpiry = undefined;
    await this.saveConfig();
  }

  // Libraries
  getLibraries(): DocumentLibrary[] {
    return [...this.libraries];
  }

  async refreshLibraries(): Promise<DocumentLibrary[]> {
    if (this.config.status !== 'connected') {
      throw new Error('Not connected to SharePoint');
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));

    // Update item counts randomly
    this.libraries = this.libraries.map(lib => ({
      ...lib,
      itemCount: lib.itemCount + Math.floor(Math.random() * 5),
      lastModified: new Date().toISOString(),
    }));

    await this.saveLibraries();
    return this.libraries;
  }

  // Sync Mappings
  getMappings(): SyncMapping[] {
    return [...this.mappings];
  }

  async createMapping(input: Omit<SyncMapping, 'id' | 'status' | 'itemsSynced' | 'errors' | 'createdAt'>): Promise<SyncMapping> {
    await this.initialize();

    const mapping: SyncMapping = {
      ...input,
      id: `mapping_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      status: 'idle',
      itemsSynced: 0,
      errors: [],
      createdAt: new Date().toISOString(),
    };

    this.mappings.push(mapping);
    await this.saveMappings();

    return mapping;
  }

  async updateMapping(id: string, updates: Partial<SyncMapping>): Promise<SyncMapping | null> {
    const index = this.mappings.findIndex(m => m.id === id);
    if (index === -1) return null;

    this.mappings[index] = {
      ...this.mappings[index],
      ...updates,
    };

    await this.saveMappings();
    return this.mappings[index];
  }

  async deleteMapping(id: string): Promise<boolean> {
    const index = this.mappings.findIndex(m => m.id === id);
    if (index === -1) return false;

    this.mappings.splice(index, 1);
    this.documents = this.documents.filter(d => d.mappingId !== id);

    await Promise.all([
      this.saveMappings(),
      this.saveDocuments(),
    ]);

    return true;
  }

  // Sync Operations
  async syncMapping(mappingId: string): Promise<SyncHistoryEntry> {
    const mapping = this.mappings.find(m => m.id === mappingId);
    if (!mapping) {
      throw new Error('Mapping not found');
    }

    if (this.config.status !== 'connected') {
      throw new Error('Not connected to SharePoint');
    }

    // Update mapping status
    mapping.status = 'syncing';
    await this.saveMappings();

    const startTime = Date.now();

    // Simulate sync operation
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));

    const itemsUploaded = Math.floor(Math.random() * 10);
    const itemsDownloaded = Math.floor(Math.random() * 15);
    const itemsSkipped = Math.floor(Math.random() * 5);
    const itemsFailed = Math.random() > 0.9 ? Math.floor(Math.random() * 3) : 0;
    const conflicts = Math.random() > 0.95 ? 1 : 0;

    const historyEntry: SyncHistoryEntry = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      mappingId: mapping.id,
      mappingName: mapping.libraryName,
      direction: mapping.direction,
      status: itemsFailed > 0 ? 'partial' : 'success',
      itemsUploaded,
      itemsDownloaded,
      itemsSkipped,
      itemsFailed,
      conflicts,
      duration: Date.now() - startTime,
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      errors: itemsFailed > 0 ? ['Some files failed to sync'] : [],
    };

    // Update mapping
    mapping.status = itemsFailed > 0 ? 'error' : 'success';
    mapping.lastSync = new Date().toISOString();
    mapping.itemsSynced += itemsUploaded + itemsDownloaded;
    if (itemsFailed > 0) {
      mapping.errors.push(`${itemsFailed} files failed at ${new Date().toLocaleString()}`);
    }

    // Update config
    this.config.lastSync = new Date().toISOString();

    // Add to history
    this.history.push(historyEntry);

    await Promise.all([
      this.saveMappings(),
      this.saveConfig(),
      this.saveHistory(),
    ]);

    return historyEntry;
  }

  async syncAll(): Promise<SyncHistoryEntry[]> {
    const results: SyncHistoryEntry[] = [];

    for (const mapping of this.mappings) {
      try {
        const result = await this.syncMapping(mapping.id);
        results.push(result);
      } catch (error) {
        console.error(`Failed to sync mapping ${mapping.id}:`, error);
      }
    }

    return results;
  }

  // History
  getHistory(mappingId?: string): SyncHistoryEntry[] {
    let history = [...this.history];
    if (mappingId) {
      history = history.filter(h => h.mappingId === mappingId);
    }
    return history.sort((a, b) => 
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );
  }

  async clearHistory(mappingId?: string): Promise<void> {
    if (mappingId) {
      this.history = this.history.filter(h => h.mappingId !== mappingId);
    } else {
      this.history = [];
    }
    await this.saveHistory();
  }

  // Documents
  getDocuments(mappingId?: string): SyncedDocument[] {
    let docs = [...this.documents];
    if (mappingId) {
      docs = docs.filter(d => d.mappingId === mappingId);
    }
    return docs;
  }

  // Statistics
  getStatistics(): {
    isConnected: boolean;
    totalLibraries: number;
    syncedLibraries: number;
    totalMappings: number;
    activeMappings: number;
    totalDocuments: number;
    lastSync?: string;
    totalSyncs: number;
    successRate: number;
  } {
    const successfulSyncs = this.history.filter(h => h.status === 'success').length;
    
    return {
      isConnected: this.config.status === 'connected',
      totalLibraries: this.libraries.length,
      syncedLibraries: this.libraries.filter(l => l.syncEnabled).length,
      totalMappings: this.mappings.length,
      activeMappings: this.mappings.filter(m => m.status !== 'error').length,
      totalDocuments: this.documents.length,
      lastSync: this.config.lastSync,
      totalSyncs: this.history.length,
      successRate: this.history.length > 0 ? Math.round((successfulSyncs / this.history.length) * 100) : 100,
    };
  }

  // Export configuration
  exportConfig(): string {
    return JSON.stringify({
      config: {
        ...this.config,
        clientSecret: undefined,
        accessToken: undefined,
        refreshToken: undefined,
      },
      mappings: this.mappings,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    }, null, 2);
  }
}

export const sharePointSyncService = new SharePointSyncService();
