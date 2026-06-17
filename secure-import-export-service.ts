 * Secure Import/Export Service
 * Password-protected data import/export with "obewon" verification
 * MediVac One v5.3
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// The master password for import/export operations
const MASTER_PASSWORD = 'obewon';

// Storage keys
const STORAGE_KEYS = {
  EXPORT_HISTORY: 'medivac_export_history',
  IMPORT_HISTORY: 'medivac_import_history',
  FAILED_ATTEMPTS: 'medivac_failed_password_attempts',
  LOCKOUT_UNTIL: 'medivac_password_lockout',
  SESSION_TOKEN: 'medivac_export_session',
};

// Types
export type ExportFormat = 'json' | 'csv' | 'encrypted';
export type DataCategory = 
  | 'patients'
  | 'staff'
  | 'policies'
  | 'audit_logs'
  | 'compliance_reports'
  | 'security_events'
  | 'email_recipients'
  | 'system_config'
  | 'all';

export interface ExportOptions {
  format: ExportFormat;
  categories: DataCategory[];
  includeMetadata: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  encryptionKey?: string;
}

export interface ImportOptions {
  validateBeforeImport: boolean;
  overwriteExisting: boolean;
  skipInvalid: boolean;
  dryRun: boolean;
}

export interface ExportRecord {
  id: string;
  timestamp: string;
  categories: DataCategory[];
  format: ExportFormat;
  fileSize: number;
  recordCount: number;
  exportedBy: string;
  checksum: string;
}

export interface ImportRecord {
  id: string;
  timestamp: string;
  fileName: string;
  categories: DataCategory[];
  recordCount: number;
  successCount: number;
  failedCount: number;
  importedBy: string;
  status: 'success' | 'partial' | 'failed';
}

export interface PasswordVerificationResult {
  success: boolean;
  sessionToken?: string;
  remainingAttempts?: number;
  lockedUntil?: string;
  message: string;
}

export interface ExportResult {
  success: boolean;
  data?: string;
  fileName?: string;
  record?: ExportRecord;
  error?: string;
}

export interface ImportResult {
  success: boolean;
  record?: ImportRecord;
  preview?: ImportPreview;
  error?: string;
}

export interface ImportPreview {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  categories: DataCategory[];
  conflicts: ConflictRecord[];
}

export interface ConflictRecord {
  id: string;
  category: DataCategory;
  existingValue: string;
  newValue: string;
  resolution: 'overwrite' | 'skip' | 'merge';
}

// Constants
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 30;
const SESSION_DURATION_MINUTES = 60;

class SecureImportExportService {
  private sessionToken: string | null = null;
  private sessionExpiry: Date | null = null;

  /**
   * Verify password for import/export operations
   * Password must be "obewon"
   */
  async verifyPassword(password: string): Promise<PasswordVerificationResult> {
    // Check if currently locked out
    const lockoutUntil = await AsyncStorage.getItem(STORAGE_KEYS.LOCKOUT_UNTIL);
    if (lockoutUntil) {