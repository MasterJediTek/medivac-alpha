/**
 * FileMaker Database Synchronization Service
 * Handles syncing between local files, S3 JEDI folder, and FileMaker Server
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { FileMakerSyncConfig } from '../config/sync-config';

export interface FileMakerDatabase {
  name: string;
  path: string;
  size: number;
  hash: string;
  lastModified: Date;
  compatible: boolean;
  hasSecurity: boolean;
}

export interface SyncResult {
  database: string;
  status: 'success' | 'failed' | 'skipped' | 'conflict';
  message: string;
  timestamp: Date;
  duration: number;
  error?: string;
}

export interface ConflictInfo {
  database: string;
  localVersion: FileMakerDatabase;
  s3Version: FileMakerDatabase;
  serverVersion: FileMakerDatabase;
  resolution: 'local' | 's3' | 'server' | 'manual';
}

export class FileMakerSyncService {
  private config: FileMakerSyncConfig;
  private syncResults: SyncResult[] = [];
  private conflicts: ConflictInfo[] = [];
  private failureCount: number = 0;
  private successCount: number = 0;

  constructor(config: FileMakerSyncConfig) {
    this.config = config;
  }

  /**
   * Analyze FileMaker database for compatibility and security
   */
  async analyzeDatabase(filePath: string): Promise<FileMakerDatabase> {
    const stats = fs.statSync(filePath);
    const content = fs.readFileSync(filePath);
    const hash = crypto.createHash('sha256').update(content).digest('hex');

    // Check if file is valid FileMaker database
    const isCompatible = this.isValidFileMakerDatabase(content);
    const hasSecurity = this.hasSecuritySettings(content);

    return {
      name: path.basename(filePath),
      path: filePath,
      size: stats.size,
      hash,
      lastModified: stats.mtime,
      compatible: isCompatible,
      hasSecurity,
    };
  }

  /**
   * Validate FileMaker database file format
   */
  private isValidFileMakerDatabase(content: Buffer): boolean {
    // FileMaker files start with specific magic bytes
    const header = content.slice(0, 4).toString('hex');
    // FMP12 format signature
    return header === '0000000d' || header === '0000000e' || header === '00000010';
  }

  /**
   * Check if database has security settings
   */
  private hasSecuritySettings(content: Buffer): boolean {
    // Look for security-related markers in FileMaker database
    const securityMarkers = [
      'SECURITY',
      'PASSWORD',
      'PRIVILEGE',
      'ACCOUNT',
    ];

    const contentStr = content.toString('utf8', 0, Math.min(content.length, 10000));
    return securityMarkers.some(marker => contentStr.includes(marker));
  }

  /**
   * Detect conflicts between versions
   */
  async detectConflicts(
    local: FileMakerDatabase,
    s3: FileMakerDatabase | null,
    server: FileMakerDatabase | null
  ): Promise<ConflictInfo | null> {
    if (!s3 && !server) {
      return null; // No conflict if versions don't exist
    }

    // Check for hash conflicts
    if (s3 && local.hash !== s3.hash) {
      // Determine which version is newer
      const resolution = this.resolveConflict(local, s3, server);
      return {
        database: local.name,
        localVersion: local,
        s3Version: s3,
        serverVersion: server || local,
        resolution,
      };
    }

    return null;
  }

  /**
   * Resolve conflicts based on configured strategy
   */
  private resolveConflict(
    local: FileMakerDatabase,
    s3: FileMakerDatabase,
    server: FileMakerDatabase | null
  ): 'local' | 's3' | 'server' | 'manual' {
    if (this.config.sync.conflictResolution === 'manual') {
      return 'manual';
    }

    if (this.config.sync.conflictResolution === 'newest') {
      // Use the most recently modified version
      const times = [
        { version: 'local', time: local.lastModified },
        { version: 's3', time: s3.lastModified },
        ...(server ? [{ version: 'server', time: server.lastModified }] : []),
      ];

      const newest = times.reduce((a, b) => (a.time > b.time ? a : b));
      return newest.version as 'local' | 's3' | 'server';
    }

    return 'local'; // Default to local
  }

  /**
   * Create shadow backup before sync
   */
  async createShadowBackup(database: FileMakerDatabase): Promise<string> {
    if (!this.config.sync.createShadowBackup) {
      return '';
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${database.path}.backup.${timestamp}`;

    fs.copyFileSync(database.path, backupPath);
    return backupPath;
  }

  /**
   * Record sync result
   */
  recordResult(result: SyncResult): void {
    this.syncResults.push(result);

    if (result.status === 'success') {
      this.successCount++;
      this.failureCount = 0; // Reset failure counter on success
    } else if (result.status === 'failed') {
      this.failureCount++;
    }
  }

  /**
   * Get sync statistics
   */
  getStats() {
    return {
      totalProcessed: this.syncResults.length,
      successful: this.successCount,
      failed: this.failureCount,
      skipped: this.syncResults.filter(r => r.status === 'skipped').length,
      conflicts: this.conflicts.length,
      totalDuration: this.syncResults.reduce((sum, r) => sum + r.duration, 0),
    };
  }

  /**
   * Check if failure threshold exceeded
   */
  isFailureThresholdExceeded(): boolean {
    return this.failureCount >= this.config.jediCouncil.alertThreshold;
  }

  /**
   * Get all conflicts
   */
  getConflicts(): ConflictInfo[] {
    return this.conflicts;
  }

  /**
   * Add conflict to tracking
   */
  addConflict(conflict: ConflictInfo): void {
    this.conflicts.push(conflict);
  }

  /**
   * Get all sync results
   */
  getResults(): SyncResult[] {
    return this.syncResults;
  }
}

export default FileMakerSyncService;
