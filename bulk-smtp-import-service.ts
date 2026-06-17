/**
 * Bulk SMTP Configuration Import Service
 * Import multiple SMTP profiles from JSON/CSV for multi-environment deployments
 * MediVac One v5.5
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { smtpConfigurationService, type SMTPConfig } from './smtp-configuration-service';

// Storage keys
const STORAGE_KEYS = {
  IMPORT_HISTORY: 'medivac_smtp_import_history',
};

// Types
export type ImportFormat = 'json' | 'csv';
export type ImportStatus = 'pending' | 'validating' | 'importing' | 'completed' | 'failed' | 'partial';
export type ConflictResolution = 'skip' | 'overwrite' | 'rename';

export interface ImportedConfig {
  name: string;
  host: string;
  port: number;
  encryption: 'none' | 'tls' | 'ssl';
  authMethod: 'none' | 'plain' | 'login' | 'oauth2';
  username?: string;
  password?: string;
  fromAddress: string;
  fromName?: string;
  maxRetries?: number;
  retryDelaySeconds?: number;
  timeout?: number;
  isDefault?: boolean;
  isActive?: boolean;
  environment?: string;
  tags?: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  config: ImportedConfig;
}

export interface ImportPreview {
  totalConfigs: number;
  validConfigs: number;
  invalidConfigs: number;
  conflicts: ConflictInfo[];
  validationResults: ValidationResult[];
}

export interface ConflictInfo {
  importedName: string;
  existingId: string;
  existingName: string;
  conflictType: 'name' | 'host_port';
}

export interface ImportProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  skipped: number;
  currentItem?: string;
  status: ImportStatus;
}

export interface ImportResult {
  success: boolean;
  totalProcessed: number;
  imported: number;
  failed: number;
  skipped: number;
  errors: string[];
  importedIds: string[];
}

export interface ImportHistoryEntry {
  id: string;
  timestamp: string;
  format: ImportFormat;
  fileName?: string;
  totalConfigs: number;
  imported: number;
  failed: number;
  skipped: number;
  status: ImportStatus;
  errors: string[];
}

// CSV Template
export const CSV_TEMPLATE = `name,host,port,encryption,authMethod,username,password,fromAddress,fromName,isDefault,isActive,environment
Production SMTP,smtp.example.com,587,tls,plain,user@example.com,password123,noreply@example.com,Example Sender,true,true,production
Staging SMTP,smtp.staging.example.com,587,tls,plain,staging@example.com,stagingpass,noreply@staging.example.com,Staging Sender,false,true,staging`;

// JSON Template
export const JSON_TEMPLATE = JSON.stringify([
  {
    name: "Production SMTP",
    host: "smtp.example.com",
    port: 587,
    encryption: "tls",
    authMethod: "plain",
    username: "user@example.com",
    password: "password123",
    fromAddress: "noreply@example.com",
    fromName: "Example Sender",
    isDefault: true,
    isActive: true,
    environment: "production",
    tags: ["production", "primary"]
  },
  {
    name: "Staging SMTP",
    host: "smtp.staging.example.com",
    port: 587,
    encryption: "tls",
    authMethod: "plain",
    username: "staging@example.com",
    password: "stagingpass",
    fromAddress: "noreply@staging.example.com",
    fromName: "Staging Sender",
    isDefault: false,
    isActive: true,
    environment: "staging",
    tags: ["staging", "test"]
  }
], null, 2);

class BulkSMTPImportService {
  private importHistory: ImportHistoryEntry[] = [];
  private currentProgress: ImportProgress | null = null;
  private progressListeners: ((progress: ImportProgress) => void)[] = [];

  async initialize(): Promise<void> {
    await this.loadHistory();
  }

  private async loadHistory(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.IMPORT_HISTORY);
      if (data) {
        this.importHistory = JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load import history:', error);
    }
  }

  private async saveHistory(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.IMPORT_HISTORY, JSON.stringify(this.importHistory));
  }

  /**
   * Parse JSON data into configs
   */
  parseJSON(data: string): ImportedConfig[] {
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      // Single config
      return [parsed];
    } catch (error) {
      throw new Error(`Invalid JSON format: ${error}`);
    }
  }

  /**
   * Parse CSV data into configs
   */
  parseCSV(data: string): ImportedConfig[] {
    const lines = data.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV must have at least a header row and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const configs: ImportedConfig[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length !== headers.length) {
        throw new Error(`Row ${i + 1} has ${values.length} columns, expected ${headers.length}`);
      }

      const config: Record<string, string | number | boolean | string[]> = {};
      headers.forEach((header, index) => {
        const value = values[index].trim();
        
        // Type conversion based on field
        if (header === 'port' || header === 'maxretries' || header === 'retrydelayseconds' || header === 'timeout') {
          config[this.normalizeHeader(header)] = parseInt(value, 10) || 0;
        } else if (header === 'isdefault' || header === 'isactive') {
          config[this.normalizeHeader(header)] = value.toLowerCase() === 'true';
        } else if (header === 'tags') {
          config.tags = value ? value.split(';').map(t => t.trim()) : [];
        } else {
          config[this.normalizeHeader(header)] = value;
        }
      });

      configs.push(config as unknown as ImportedConfig);
    }

    return configs;
  }

  private parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);

    return values;
  }

  private normalizeHeader(header: string): string {
    const mapping: Record<string, string> = {
      'name': 'name',
      'host': 'host',
      'port': 'port',
      'encryption': 'encryption',
      'authmethod': 'authMethod',
      'username': 'username',
      'password': 'password',
      'fromaddress': 'fromAddress',
      'fromname': 'fromName',
      'maxretries': 'maxRetries',
      'retrydelayseconds': 'retryDelaySeconds',
      'timeout': 'timeout',
      'isdefault': 'isDefault',
      'isactive': 'isActive',
      'environment': 'environment',
      'tags': 'tags',
    };
    return mapping[header] || header;
  }

  /**
   * Validate a single config
   */
  validateConfig(config: ImportedConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!config.name || config.name.trim() === '') {
      errors.push('Name is required');
    }
    if (!config.host || config.host.trim() === '') {
      errors.push('Host is required');
    }
    if (!config.port || config.port < 1 || config.port > 65535) {
      errors.push('Port must be between 1 and 65535');
    }
    if (!config.fromAddress || !this.isValidEmail(config.fromAddress)) {
      errors.push('Valid from address is required');
    }

    // Encryption validation
    if (config.encryption && !['none', 'tls', 'ssl'].includes(config.encryption)) {
      errors.push('Encryption must be none, tls, or ssl');
    }

    // Auth method validation
    if (config.authMethod && !['none', 'plain', 'login', 'oauth2'].includes(config.authMethod)) {
      errors.push('Auth method must be none, plain, login, or oauth2');
    }

    // Auth credentials
    if (config.authMethod && config.authMethod !== 'none') {
      if (!config.username) {
        warnings.push('Username is recommended for authenticated connections');
      }
      if (!config.password) {
        warnings.push('Password is recommended for authenticated connections');
      }
    }

    // Port/encryption mismatch warnings
    if (config.port === 465 && config.encryption !== 'ssl') {
      warnings.push('Port 465 typically uses SSL encryption');
    }
    if (config.port === 587 && config.encryption !== 'tls') {
      warnings.push('Port 587 typically uses TLS encryption');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      config,
    };
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /**
   * Preview import without making changes
   */
  async previewImport(data: string, format: ImportFormat): Promise<ImportPreview> {
    // Parse data
    const configs = format === 'json' ? this.parseJSON(data) : this.parseCSV(data);
    
    // Validate each config
    const validationResults = configs.map(config => this.validateConfig(config));
    
    // Check for conflicts with existing configs
    const existingConfigs = smtpConfigurationService.getConfigs();
    const conflicts: ConflictInfo[] = [];

    for (const result of validationResults) {
      if (!result.isValid) continue;

      // Check name conflict
      const nameConflict = existingConfigs.find(
        e => e.name.toLowerCase() === result.config.name.toLowerCase()
      );
      if (nameConflict) {
        conflicts.push({
          importedName: result.config.name,
          existingId: nameConflict.id,
          existingName: nameConflict.name,
          conflictType: 'name',
        });
      }

      // Check host:port conflict
      const hostPortConflict = existingConfigs.find(
        e => e.host === result.config.host && e.port === result.config.port
      );
      if (hostPortConflict && !nameConflict) {
        conflicts.push({
          importedName: result.config.name,
          existingId: hostPortConflict.id,
          existingName: hostPortConflict.name,
          conflictType: 'host_port',
        });
      }
    }

    return {
      totalConfigs: configs.length,
      validConfigs: validationResults.filter(r => r.isValid).length,
      invalidConfigs: validationResults.filter(r => !r.isValid).length,
      conflicts,
      validationResults,
    };
  }

  /**
   * Execute import
   */
  async executeImport(
    data: string,
    format: ImportFormat,
    conflictResolution: ConflictResolution = 'skip',
    fileName?: string
  ): Promise<ImportResult> {
    const preview = await this.previewImport(data, format);
    const errors: string[] = [];
    const importedIds: string[] = [];
    let imported = 0;
    let failed = 0;
    let skipped = 0;

    // Initialize progress
    this.currentProgress = {
      total: preview.validConfigs,
      processed: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      status: 'importing',
    };
    this.notifyProgress();

    const existingConfigs = smtpConfigurationService.getConfigs();

    for (const result of preview.validationResults) {
      this.currentProgress.currentItem = result.config.name;
      this.notifyProgress();

      if (!result.isValid) {
        failed++;
        errors.push(`${result.config.name}: ${result.errors.join(', ')}`);
        this.currentProgress.failed++;
        this.currentProgress.processed++;
        this.notifyProgress();
        continue;
      }

      // Check for conflicts
      const conflict = preview.conflicts.find(c => c.importedName === result.config.name);
      
      if (conflict) {
        if (conflictResolution === 'skip') {
          skipped++;
          this.currentProgress.skipped++;
          this.currentProgress.processed++;
          this.notifyProgress();
          continue;
        } else if (conflictResolution === 'overwrite') {
          // Delete existing config first
          await smtpConfigurationService.deleteConfig(conflict.existingId);
        } else if (conflictResolution === 'rename') {
          // Rename the imported config
          result.config.name = `${result.config.name} (Imported)`;
        }
      }

      try {
        const savedConfig = await smtpConfigurationService.saveConfig({
          name: result.config.name,
          host: result.config.host,
          port: result.config.port,
          encryption: result.config.encryption || 'tls',
          authMethod: result.config.authMethod || 'plain',
          username: result.config.username,
          password: result.config.password,
          fromAddress: result.config.fromAddress,
          fromName: result.config.fromName || '',
          maxRetries: result.config.maxRetries || 3,
          retryDelaySeconds: result.config.retryDelaySeconds || 60,
          timeout: result.config.timeout || 30000,
          isDefault: result.config.isDefault || false,
          isActive: result.config.isActive !== false,
        });

        imported++;
        importedIds.push(savedConfig.id);
        this.currentProgress.successful++;
      } catch (error) {
        failed++;
        errors.push(`${result.config.name}: ${error}`);
        this.currentProgress.failed++;
      }

      this.currentProgress.processed++;
      this.notifyProgress();
    }

    // Update final status
    this.currentProgress.status = failed === preview.validConfigs ? 'failed' : 
      failed > 0 ? 'partial' : 'completed';
    this.notifyProgress();

    // Record in history
    const historyEntry: ImportHistoryEntry = {
      id: `import_${Date.now()}`,
      timestamp: new Date().toISOString(),
      format,
      fileName,
      totalConfigs: preview.totalConfigs,
      imported,
      failed,
      skipped,
      status: this.currentProgress.status,
      errors,
    };

    this.importHistory.unshift(historyEntry);
    await this.saveHistory();

    return {
      success: failed === 0,
      totalProcessed: preview.validConfigs,
      imported,
      failed,
      skipped,
      errors,
      importedIds,
    };
  }

  /**
   * Export all configs
   */
  exportConfigs(format: ImportFormat): string {
    const configs = smtpConfigurationService.getConfigs();
    
    if (format === 'json') {
      const exportData = configs.map(c => ({
        name: c.name,
        host: c.host,
        port: c.port,
        encryption: c.encryption,
        authMethod: c.authMethod,
        username: c.username,
        password: c.password,
        fromAddress: c.fromAddress,
        fromName: c.fromName,
        maxRetries: c.maxRetries,
        retryDelaySeconds: c.retryDelaySeconds,
        timeout: c.timeout,
        isDefault: c.isDefault,
        isActive: c.isActive,
      }));
      return JSON.stringify(exportData, null, 2);
    }

    // CSV format
    const headers = ['name', 'host', 'port', 'encryption', 'authMethod', 'username', 'password', 'fromAddress', 'fromName', 'maxRetries', 'retryDelaySeconds', 'timeout', 'isDefault', 'isActive'];
    const rows = configs.map(c => [
      c.name,
      c.host,
      c.port.toString(),
      c.encryption,
      c.authMethod,
      c.username || '',
      c.password || '',
      c.fromAddress,
      c.fromName || '',
      (c.maxRetries || 3).toString(),
      (c.retryDelaySeconds || 60).toString(),
      (c.timeout || 30000).toString(),
      c.isDefault.toString(),
      c.isActive.toString(),
    ].map(v => v.includes(',') ? `"${v}"` : v).join(','));

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Get import history
   */
  getHistory(): ImportHistoryEntry[] {
    return [...this.importHistory];
  }

  /**
   * Clear import history
   */
  async clearHistory(): Promise<void> {
    this.importHistory = [];
    await this.saveHistory();
  }

  /**
   * Get current progress
   */
  getProgress(): ImportProgress | null {
    return this.currentProgress;
  }

  /**
   * Subscribe to progress updates
   */
  onProgress(listener: (progress: ImportProgress) => void): () => void {
    this.progressListeners.push(listener);
    return () => {
      this.progressListeners = this.progressListeners.filter(l => l !== listener);
    };
  }

  private notifyProgress(): void {
    if (this.currentProgress) {
      this.progressListeners.forEach(l => l(this.currentProgress!));
    }
  }

  /**
   * Get templates
   */
  getCSVTemplate(): string {
    return CSV_TEMPLATE;
  }

  getJSONTemplate(): string {
    return JSON_TEMPLATE;
  }
}

export const bulkSMTPImportService = new BulkSMTPImportService();
