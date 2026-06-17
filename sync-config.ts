/**
 * FileMaker Database Synchronization System Configuration
 * Syncs FileMaker databases to S3 JEDI folder and FileMaker Server
 * with Web Direct publishing and JEDI Council reporting
 */

export interface FileMakerSyncConfig {
  // FileMaker Server Configuration
  filemakerServer: {
    host: string;
    username: string;
    password: string;
    port: number;
    protocol: 'http' | 'https';
    timeout: number;
  };

  // Central Root JEDI Folder Configuration
  jediFolder: {
    rootPath: string;
    syncPath: string;
    backupPath: string;
    metadataPath: string;
  };

  // Web Direct Publishing Configuration
  webDirect: {
    baseUrl: string;
    verifyInterval: number;
    maxRetries: number;
  };

  // JEDI Council Reporting
  jediCouncil: {
    masterEmails: string[];
    grandMasterEmails: string[];
    reportingInterval: number;
    alertThreshold: number;
  };

  // Sync Behavior
  sync: {
    overwriteExisting: boolean;
    createShadowBackup: boolean;
    conflictResolution: 'newest' | 'oldest' | 'manual' | 'skip';
    maxConcurrentUploads: number;
    retryAttempts: number;
    retryDelayMs: number;
    nonDestructive: boolean; // Never delete or overwrite files
    skipExistingFiles: boolean; // Skip if file exists on server
  };

  // Monitoring and Logging
  monitoring: {
    enableDetailedLogging: boolean;
    logPath: string;
    metricsPath: string;
    archiveLogsAfterDays: number;
  };
}

export const defaultConfig: FileMakerSyncConfig = {
  filemakerServer: {
    host: process.env.FILEMAKER_SERVER_HOST || 'iskooledu.fmcloud.fm',
    username: process.env.FILEMAKER_SERVER_USERNAME || '',
    password: process.env.FILEMAKER_SERVER_PASSWORD || '',
    port: 443,
    protocol: 'https',
    timeout: 30000,
  },

  jediFolder: {
    rootPath: process.env.JEDI_ROOT_PATH || '/jedi/central',
    syncPath: process.env.JEDI_SYNC_PATH || '/jedi/central/filemaker-databases',
    backupPath: process.env.JEDI_BACKUP_PATH || '/jedi/central/backups',
    metadataPath: process.env.JEDI_METADATA_PATH || '/jedi/central/metadata',
  },

  webDirect: {
    baseUrl: process.env.FILEMAKER_WEB_DIRECT_URL || 'https://iskooledu.fmcloud.fm/fmi/webd',
    verifyInterval: 5000,
    maxRetries: 3,
  },

  jediCouncil: {
    masterEmails: (process.env.JEDI_MASTER_EMAILS || '').split(',').filter(Boolean),
    grandMasterEmails: (process.env.JEDI_GRAND_MASTER_EMAILS || '').split(',').filter(Boolean),
    reportingInterval: 3600000, // 1 hour
    alertThreshold: 5, // Alert after 5 consecutive failures
  },

  sync: {
    overwriteExisting: false,
    createShadowBackup: true,
    conflictResolution: 'skip', // Skip conflicts instead of overwriting
    maxConcurrentUploads: 3,
    retryAttempts: 5,
    retryDelayMs: 2000,
    nonDestructive: true, // ENFORCE: Never delete or overwrite
    skipExistingFiles: true, // Skip if file already exists
  },

  monitoring: {
    enableDetailedLogging: true,
    logPath: '/var/log/filemaker-sync',
    metricsPath: '/var/log/filemaker-sync/metrics',
    archiveLogsAfterDays: 30,
  },
};

// Enforce non-destructive behavior
if (defaultConfig.sync.nonDestructive) {
  defaultConfig.sync.overwriteExisting = false;
  defaultConfig.sync.skipExistingFiles = true;
  defaultConfig.sync.conflictResolution = 'skip';
}

export default defaultConfig;
