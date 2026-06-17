/**
 * JEDI Central Folder Synchronization Service
 * Syncs FileMaker databases to central root JEDI folder (NON-DESTRUCTIVE)
 * Never overwrites or deletes existing files
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { FileMakerSyncConfig } from '../config/sync-config';

export interface JediFolderSyncResult {
  file: string;
  status: 'synced' | 'skipped' | 'versioned' | 'failed';
  message: string;
  jediPath: string;
  timestamp: Date;
  error?: string;
}

export class JediFolderSyncService {
  private config: FileMakerSyncConfig;
  private syncResults: JediFolderSyncResult[] = [];

  constructor(config: FileMakerSyncConfig) {
    this.config = config;
    this.ensureJediFolderStructure();
  }

  /**
   * Ensure JEDI folder structure exists
   */
  private ensureJediFolderStructure(): void {
    const paths = [
      this.config.jediFolder.rootPath,
      this.config.jediFolder.syncPath,
      this.config.jediFolder.backupPath,
      this.config.jediFolder.metadataPath,
    ];

    for (const dirPath of paths) {
      if (!fs.existsSync(dirPath)) {
        try {
          fs.mkdirSync(dirPath, { recursive: true });
        } catch (error) {
          // Directory may already exist or permission denied
        }
      }
    }
  }

  /**
   * Sync FileMaker database to central JEDI folder (NON-DESTRUCTIVE)
   * Never overwrites or deletes existing files
   */
  async syncToJediFolder(
    localPath: string,
    fileName: string,
    fileHash: string
  ): Promise<JediFolderSyncResult> {
    try {
      const jediPath = path.join(this.config.jediFolder.syncPath, fileName);

      // Check if file exists in JEDI folder
      const existsInJedi = fs.existsSync(jediPath);

      if (existsInJedi) {
        // Get JEDI file hash
        const jediHash = this.getFileHash(jediPath);

        if (jediHash === fileHash) {
          // File already exists with same content
          return {
            file: fileName,
            status: 'skipped',
            message: 'File already exists in JEDI folder with identical content (non-destructive)',
            jediPath,
            timestamp: new Date(),
          };
        } else {
          // File exists but is different
          if (this.config.sync.skipExistingFiles) {
            // NON-DESTRUCTIVE: Skip without modifying original
            return {
              file: fileName,
              status: 'skipped',
              message: 'File exists in JEDI folder with different content - SKIPPED (non-destructive mode)',
              jediPath,
              timestamp: new Date(),
            };
          } else {
            // Create versioned copy instead of overwriting
            const versionedPath = this.createVersionedFilePath(jediPath, fileHash);
            fs.copyFileSync(localPath, versionedPath);

            // Update metadata
            await this.updateMetadata(fileName, fileHash, 'versioned', versionedPath);

            return {
              file: fileName,
              status: 'versioned',
              message: `File saved as new version at ${versionedPath} (original preserved)`,
              jediPath: versionedPath,
              timestamp: new Date(),
            };
          }
        }
      } else {
        // File doesn't exist in JEDI folder - sync it
        fs.copyFileSync(localPath, jediPath);

        // Update metadata
        await this.updateMetadata(fileName, fileHash, 'synced', '');

        return {
          file: fileName,
          status: 'synced',
          message: 'File successfully synced to central JEDI folder (non-destructive)',
          jediPath,
          timestamp: new Date(),
        };
      }
    } catch (error) {
      return {
        file: fileName,
        status: 'failed',
        message: `Failed to sync to JEDI folder: ${error instanceof Error ? error.message : String(error)}`,
        jediPath: path.join(this.config.jediFolder.syncPath, fileName),
        timestamp: new Date(),
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Create versioned file path to preserve original
   */
  private createVersionedFilePath(originalPath: string, fileHash: string): string {
    const dir = path.dirname(originalPath);
    const ext = path.extname(originalPath);
    const name = path.basename(originalPath, ext);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const shortHash = fileHash.substring(0, 8);
    return path.join(dir, `${name}.v${timestamp}.${shortHash}${ext}`);
  }

  /**
   * Calculate file hash
   */
  private getFileHash(filePath: string): string {
    try {
      const content = fs.readFileSync(filePath);
      return crypto.createHash('sha256').update(content).digest('hex');
    } catch (error) {
      return '';
    }
  }

  /**
   * Create shadow backup in JEDI backup folder (non-destructive)
   */
  private async createJediBackup(jediPath: string, fileName: string): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `${fileName}.backup.${timestamp}`;
      const backupPath = path.join(this.config.jediFolder.backupPath, backupFileName);

      fs.copyFileSync(jediPath, backupPath);
      return backupPath;
    } catch (error) {
      throw new Error(`Failed to create JEDI backup: ${error}`);
    }
  }

  /**
   * Update metadata file for synced database
   */
  private async updateMetadata(
    fileName: string,
    fileHash: string,
    status: string,
    backupPath: string
  ): Promise<void> {
    try {
      const metadataFile = path.join(
        this.config.jediFolder.metadataPath,
        `${fileName}.metadata.json`
      );

      const metadata = {
        fileName,
        fileHash,
        status,
        syncedAt: new Date().toISOString(),
        backupPath: backupPath || null,
        nonDestructive: true,
      };

      fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));
    } catch (error) {
      throw new Error(`Failed to update metadata: ${error}`);
    }
  }

  /**
   * Get metadata for file
   */
  getMetadata(fileName: string): any {
    try {
      const metadataFile = path.join(
        this.config.jediFolder.metadataPath,
        `${fileName}.metadata.json`
      );

      if (fs.existsSync(metadataFile)) {
        const content = fs.readFileSync(metadataFile, 'utf-8');
        return JSON.parse(content);
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * List all files in JEDI sync folder
   */
  listJediFolderFiles(): string[] {
    try {
      if (!fs.existsSync(this.config.jediFolder.syncPath)) {
        return [];
      }

      return fs.readdirSync(this.config.jediFolder.syncPath).filter(file => {
        return file.endsWith('.fmp12') || file.endsWith('.jedi');
      });
    } catch (error) {
      return [];
    }
  }

  /**
   * Get JEDI folder statistics
   */
  getJediFolderStats() {
    try {
      const files = this.listJediFolderFiles();
      let totalSize = 0;

      for (const file of files) {
        const filePath = path.join(this.config.jediFolder.syncPath, file);
        try {
          const stats = fs.statSync(filePath);
          totalSize += stats.size;
        } catch (error) {
          // File may have been deleted
        }
      }

      return {
        totalFiles: files.length,
        totalSize,
        backupFiles: fs.readdirSync(this.config.jediFolder.backupPath).length,
        metadataFiles: fs.readdirSync(this.config.jediFolder.metadataPath).length,
      };
    } catch (error) {
      return {
        totalFiles: 0,
        totalSize: 0,
        backupFiles: 0,
        metadataFiles: 0,
      };
    }
  }

  /**
   * Record sync result
   */
  recordResult(result: JediFolderSyncResult): void {
    this.syncResults.push(result);
  }

  /**
   * Get all sync results
   */
  getResults(): JediFolderSyncResult[] {
    return this.syncResults;
  }

  /**
   * Get sync statistics
   */
  getStats() {
    return {
      total: this.syncResults.length,
      synced: this.syncResults.filter(r => r.status === 'synced').length,
      versioned: this.syncResults.filter(r => r.status === 'versioned').length,
      skipped: this.syncResults.filter(r => r.status === 'skipped').length,
      failed: this.syncResults.filter(r => r.status === 'failed').length,
    };
  }
}

export default JediFolderSyncService;
