#!/usr/bin/env npx ts-node
/**
 * FileMaker Hourly Sync Cron Job
 * Executes sync orchestration every hour with automated monitoring
 */

import * as fs from 'fs';
import * as path from 'path';
import SyncOrchestrator from '../services/sync-orchestrator';
import { defaultConfig } from '../config/sync-config';

interface CronJobConfig {
  enabled: boolean;
  interval: number; // milliseconds
  sourceDirectory: string;
  logDirectory: string;
  maxRetries: number;
  retryDelayMs: number;
}

const cronConfig: CronJobConfig = {
  enabled: true,
  interval: 3600000, // 1 hour
  sourceDirectory: process.env.FILEMAKER_SOURCE_DIR || '/home/ubuntu/projects/filemaker-databases/files',
  logDirectory: process.env.FILEMAKER_LOG_DIR || '/var/log/filemaker-sync',
  maxRetries: 3,
  retryDelayMs: 5000,
};

class FileMakerSyncCronJob {
  private config: CronJobConfig;
  private orchestrator: SyncOrchestrator;
  private isRunning: boolean = false;
  private lastRunTime: Date | null = null;
  private nextRunTime: Date | null = null;
  private runCount: number = 0;
  private successCount: number = 0;
  private failureCount: number = 0;

  constructor(config: CronJobConfig) {
    this.config = config;
    this.orchestrator = new SyncOrchestrator(defaultConfig, config.sourceDirectory);
    this.ensureLogDirectory();
  }

  /**
   * Ensure log directory exists
   */
  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.config.logDirectory)) {
      fs.mkdirSync(this.config.logDirectory, { recursive: true });
    }
  }

  /**
   * Start cron job
   */
  start(): void {
    if (!this.config.enabled) {
      console.log('⚠️ FileMaker Sync Cron Job is disabled');
      return;
    }

    console.log('\n' + '='.repeat(80));
    console.log('🕐 FILEMAKER SYNC CRON JOB STARTED');
    console.log('='.repeat(80));
    console.log(`Interval: Every ${this.config.interval / 60000} minutes`);
    console.log(`Source Directory: ${this.config.sourceDirectory}`);
    console.log(`Log Directory: ${this.config.logDirectory}`);
    console.log(`Status: ${this.config.enabled ? 'ENABLED' : 'DISABLED'}`);
    console.log('='.repeat(80) + '\n');

    // Execute immediately on start
    this.executeSync();

    // Schedule recurring execution
    setInterval(() => {
      this.executeSync();
    }, this.config.interval);
  }

  /**
   * Execute sync with retry logic
   */
  private async executeSync(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Sync already in progress, skipping this cycle');
      return;
    }

    this.isRunning = true;
    this.runCount++;
    this.lastRunTime = new Date();
    this.nextRunTime = new Date(Date.now() + this.config.interval);

    console.log(`\n📍 Cron Job Execution #${this.runCount}`);
    console.log(`⏰ Time: ${this.lastRunTime.toISOString()}`);
    console.log(`⏭️  Next Run: ${this.nextRunTime.toISOString()}`);

    let retries = 0;
    let success = false;

    while (retries < this.config.maxRetries && !success) {
      try {
        console.log(`\n🔄 Attempt ${retries + 1}/${this.config.maxRetries}...`);

        const result = await this.orchestrator.executeSyncOrchestration();

        // Log result
        this.logSyncResult(result);

        // Check if threshold exceeded
        if (this.orchestrator.getConsecutiveFailures() >= defaultConfig.jediCouncil.alertThreshold) {
          this.sendCodeBlueAlert(result);
        }

        // Send JEDI Council report
        this.sendJediCouncilReport(result);

        this.successCount++;
        success = true;

        console.log('✅ Sync execution completed successfully');
      } catch (error) {
        retries++;
        this.failureCount++;

        console.error(`❌ Sync execution failed: ${error}`);

        if (retries < this.config.maxRetries) {
          console.log(`⏳ Retrying in ${this.config.retryDelayMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelayMs));
        } else {
          console.error(`❌ All ${this.config.maxRetries} retry attempts failed`);
          this.sendErrorAlert(error as Error);
        }
      }
    }

    this.isRunning = false;
    this.printCronStats();
  }

  /**
   * Log sync result to file
   */
  private logSyncResult(result: any): void {
    const logFile = path.join(
      this.config.logDirectory,
      `sync-${new Date().toISOString().split('T')[0]}.log`
    );

    const logEntry = `
[${new Date().toISOString()}] Sync Execution #${this.runCount}
Status: ${result.status}
Duration: ${(result.duration / 1000).toFixed(2)}s
Files Processed: ${result.summary.totalFiles}
  - Synced: ${result.summary.synced}
  - Updated: ${result.summary.updated}
  - Failed: ${result.summary.failed}
  - Conflicts: ${result.summary.conflicts}
Report ID: ${result.jediCouncilReport.reportId}
---
`;

    fs.appendFileSync(logFile, logEntry);
  }

  /**
   * Send CODE BLUE alert for critical failures
   */
  private sendCodeBlueAlert(result: any): void {
    console.log('\n🚨 CODE BLUE ALERT - CRITICAL FAILURE THRESHOLD EXCEEDED');
    console.log(`Consecutive Failures: ${this.orchestrator.getConsecutiveFailures()}`);
    console.log(`Threshold: ${defaultConfig.jediCouncil.alertThreshold}`);

    // In production, send email/SMS to JEDI Masters
    const alertMessage = `
🚨 CODE BLUE ALERT
==================
FileMaker Sync System has exceeded failure threshold

Consecutive Failures: ${this.orchestrator.getConsecutiveFailures()}
Threshold: ${defaultConfig.jediCouncil.alertThreshold}

Report ID: ${result.jediCouncilReport.reportId}
Timestamp: ${new Date().toISOString()}

IMMEDIATE ACTION REQUIRED
Please investigate FileMaker Server and network connectivity
`;

    console.log(alertMessage);
  }

  /**
   * Send JEDI Council report
   */
  private sendJediCouncilReport(result: any): void {
    const reporter = this.orchestrator.getReporter();
    const emailBody = reporter.formatReportForEmail(result.jediCouncilReport);

    console.log('\n📧 JEDI Council Report Generated');
    console.log(`Recipients: ${defaultConfig.jediCouncil.masterEmails.join(', ')}`);

    // In production, send email to JEDI Masters and Grand Masters
    if (defaultConfig.jediCouncil.masterEmails.length > 0) {
      console.log('📬 Report would be sent to JEDI Masters');
    }

    if (defaultConfig.jediCouncil.grandMasterEmails.length > 0) {
      console.log('📬 Report would be sent to Grand Masters');
    }
  }

  /**
   * Send error alert
   */
  private sendErrorAlert(error: Error): void {
    console.log('\n❌ ERROR ALERT');
    console.log(`Error: ${error.message}`);
    console.log(`Stack: ${error.stack}`);

    // In production, send alert to JEDI Masters
  }

  /**
   * Print cron job statistics
   */
  private printCronStats(): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 CRON JOB STATISTICS');
    console.log('='.repeat(80));
    console.log(`Total Executions: ${this.runCount}`);
    console.log(`Successful: ${this.successCount}`);
    console.log(`Failed: ${this.failureCount}`);
    console.log(`Success Rate: ${((this.successCount / this.runCount) * 100).toFixed(1)}%`);
    console.log(`Last Run: ${this.lastRunTime?.toISOString()}`);
    console.log(`Next Run: ${this.nextRunTime?.toISOString()}`);
    console.log('='.repeat(80) + '\n');
  }

  /**
   * Get cron job status
   */
  getStatus() {
    return {
      enabled: this.config.enabled,
      isRunning: this.isRunning,
      runCount: this.runCount,
      successCount: this.successCount,
      failureCount: this.failureCount,
      lastRunTime: this.lastRunTime,
      nextRunTime: this.nextRunTime,
      successRate: (this.successCount / this.runCount) * 100,
    };
  }
}

// Initialize and start cron job
const cronJob = new FileMakerSyncCronJob(cronConfig);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down FileMaker Sync Cron Job...');
  console.log(cronJob.getStatus());
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Shutting down FileMaker Sync Cron Job...');
  console.log(cronJob.getStatus());
  process.exit(0);
});

// Start the cron job
cronJob.start();

// Keep process alive
setInterval(() => {
  // Keep-alive
}, 60000);
