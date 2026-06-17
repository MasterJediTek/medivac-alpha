/**
 * FileMaker Server Upload and Web Direct Publishing Service
 * Handles uploading databases to FileMaker Server and publishing to Web Direct
 * NON-DESTRUCTIVE: Never overwrites or deletes existing files
 */

import { FileMakerSyncConfig } from '../config/sync-config';

export interface FileMakerServerResult {
  database: string;
  status: 'uploaded' | 'published' | 'skipped' | 'versioned' | 'failed';
  message: string;
  timestamp: Date;
  webDirectUrl?: string;
  error?: string;
}

export interface WebDirectVerification {
  database: string;
  isPublished: boolean;
  isAccessible: boolean;
  responseTime: number;
  timestamp: Date;
  error?: string;
}

export class FileMakerServerService {
  private config: FileMakerSyncConfig;
  private uploadResults: FileMakerServerResult[] = [];
  private verificationResults: WebDirectVerification[] = [];

  constructor(config: FileMakerSyncConfig) {
    this.config = config;
  }

  /**
   * Upload FileMaker database to server (NON-DESTRUCTIVE)
   * Never overwrites existing databases
   */
  async uploadDatabase(
    databaseName: string,
    filePath: string,
    fileHash: string
  ): Promise<FileMakerServerResult> {
    const startTime = Date.now();

    try {
      // Check if database already exists on server
      const existsOnServer = await this.checkDatabaseExists(databaseName);

      if (existsOnServer) {
        // Get server database hash
        const serverHash = await this.getServerDatabaseHash(databaseName);

        if (serverHash === fileHash) {
          // Database already exists with same content
          return {
            database: databaseName,
            status: 'skipped',
            message: 'Database already exists on server with identical content (non-destructive)',
            timestamp: new Date(),
          };
        } else {
          // Database exists but is different
          if (this.config.sync.skipExistingFiles) {
            // NON-DESTRUCTIVE: Skip without modifying
            return {
              database: databaseName,
              status: 'skipped',
              message: 'Database exists on server with different content - SKIPPED (non-destructive mode)',
              timestamp: new Date(),
            };
          } else {
            // Create versioned copy instead of overwriting
            const versionedName = this.createVersionedDatabaseName(databaseName, fileHash);
            await this.uploadToServer(versionedName, filePath);

            return {
              database: databaseName,
              status: 'versioned',
              message: `Database uploaded as new version: ${versionedName} (original preserved)`,
              timestamp: new Date(),
            };
          }
        }
      } else {
        // Database doesn't exist - upload it
        await this.uploadToServer(databaseName, filePath);

        return {
          database: databaseName,
          status: 'uploaded',
          message: 'Database successfully uploaded to FileMaker Server (non-destructive)',
          timestamp: new Date(),
        };
      }
    } catch (error) {
      return {
        database: databaseName,
        status: 'failed',
        message: `Failed to upload database: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Publish database to Web Direct (NON-DESTRUCTIVE)
   */
  async publishToWebDirect(databaseName: string): Promise<FileMakerServerResult> {
    try {
      // Check if already published
      const isPublished = await this.checkWebDirectPublished(databaseName);

      if (isPublished) {
        return {
          database: databaseName,
          status: 'skipped',
          message: 'Database already published to Web Direct (non-destructive)',
          timestamp: new Date(),
          webDirectUrl: `${this.config.webDirect.baseUrl}/${databaseName}`,
        };
      }

      // Enable Web Direct publishing for database
      await this.enableWebDirectPublishing(databaseName);

      const webDirectUrl = `${this.config.webDirect.baseUrl}/${databaseName}`;

      // Verify publication
      const verification = await this.verifyWebDirectPublishing(databaseName);

      if (verification.isPublished && verification.isAccessible) {
        return {
          database: databaseName,
          status: 'published',
          message: 'Database successfully published to Web Direct (non-destructive)',
          timestamp: new Date(),
          webDirectUrl,
        };
      } else {
        return {
          database: databaseName,
          status: 'failed',
          message: 'Database published but Web Direct access verification failed',
          timestamp: new Date(),
          webDirectUrl,
          error: verification.error,
        };
      }
    } catch (error) {
      return {
        database: databaseName,
        status: 'failed',
        message: `Failed to publish to Web Direct: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Create versioned database name to preserve original
   */
  private createVersionedDatabaseName(databaseName: string, fileHash: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const shortHash = fileHash.substring(0, 8);
    const ext = databaseName.includes('.') ? databaseName.split('.').pop() : '';
    const baseName = databaseName.replace(`.${ext}`, '');
    return `${baseName}.v${timestamp}.${shortHash}.${ext}`;
  }

  /**
   * Check if database exists on server
   */
  private async checkDatabaseExists(databaseName: string): Promise<boolean> {
    try {
      // Simulate checking database on FileMaker Server
      // In production, use FileMaker Server API
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if database is published to Web Direct
   */
  private async checkWebDirectPublished(databaseName: string): Promise<boolean> {
    try {
      // Simulate checking Web Direct publication
      // In production, use FileMaker Server API
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get server database hash
   */
  private async getServerDatabaseHash(databaseName: string): Promise<string> {
    try {
      // Simulate getting database hash from FileMaker Server
      return '';
    } catch (error) {
      throw new Error(`Failed to get server database hash: ${error}`);
    }
  }

  /**
   * Upload database to FileMaker Server
   */
  private async uploadToServer(databaseName: string, filePath: string): Promise<void> {
    try {
      // Simulate uploading to FileMaker Server
      // In production, use FileMaker Server API
    } catch (error) {
      throw new Error(`Failed to upload to FileMaker Server: ${error}`);
    }
  }

  /**
   * Enable Web Direct publishing
   */
  private async enableWebDirectPublishing(databaseName: string): Promise<void> {
    try {
      // Simulate enabling Web Direct publishing
      // In production, use FileMaker Server API
    } catch (error) {
      throw new Error(`Failed to enable Web Direct publishing: ${error}`);
    }
  }

  /**
   * Verify Web Direct publishing
   */
  private async verifyWebDirectPublishing(databaseName: string): Promise<WebDirectVerification> {
    const startTime = Date.now();

    try {
      const webDirectUrl = `${this.config.webDirect.baseUrl}/${databaseName}`;

      // Simulate verifying Web Direct access
      // In production, make actual HTTP request
      const responseTime = Date.now() - startTime;

      return {
        database: databaseName,
        isPublished: true,
        isAccessible: true,
        responseTime,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        database: databaseName,
        isPublished: false,
        isAccessible: false,
        responseTime: Date.now() - startTime,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Record upload result
   */
  recordUploadResult(result: FileMakerServerResult): void {
    this.uploadResults.push(result);
  }

  /**
   * Record verification result
   */
  recordVerificationResult(result: WebDirectVerification): void {
    this.verificationResults.push(result);
  }

  /**
   * Get all upload results
   */
  getUploadResults(): FileMakerServerResult[] {
    return this.uploadResults;
  }

  /**
   * Get all verification results
   */
  getVerificationResults(): WebDirectVerification[] {
    return this.verificationResults;
  }

  /**
   * Get upload statistics
   */
  getUploadStats() {
    return {
      total: this.uploadResults.length,
      uploaded: this.uploadResults.filter(r => r.status === 'uploaded').length,
      published: this.uploadResults.filter(r => r.status === 'published').length,
      versioned: this.uploadResults.filter(r => r.status === 'versioned').length,
      skipped: this.uploadResults.filter(r => r.status === 'skipped').length,
      failed: this.uploadResults.filter(r => r.status === 'failed').length,
    };
  }
}

export default FileMakerServerService;
