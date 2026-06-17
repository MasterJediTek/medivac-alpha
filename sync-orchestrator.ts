/**
 * FileMaker Sync Orchestrator
 * Coordinates all sync operations: local files → JEDI folder → FileMaker Server → Web Direct
 */

import * as fs from 'fs';
import * as path from 'path';
import FileMakerSyncService, { FileMakerDatabase, SyncResult } from './filemaker-sync-service';
import JediFolderSyncService, { JediFolderSyncResult } from './jedi-folder-sync';
import FileMakerServerService, { FileMakerServerResult } from './filemaker-server-service';
import JediCouncilReporter, { JediCouncilReport } from './jedi-council-reporter';
import { FileMakerSyncConfig } from '../config/sync-config';

export interface SyncOrchestrationResult {
  orchestrationId: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  status: 'success' | 'partial' | 'failed';
  summary: {
    totalFiles: number;
    synced: number;
    updated: number;
    failed: number;
    conflicts: number;
  };
  jediCouncilReport: JediCouncilReport;
}

export class SyncOrchestrator {
  private config: FileMakerSyncConfig;
  private filemakerService: FileMakerSyncService;
  private jediFolderService: JediFolderSyncService;
  private serverService: FileMakerServerService;
  private reporter: JediCouncilReporter;
  private sourceDirectory: string;
  private consecutiveFailures: number = 0;

  constructor(config: FileMakerSyncConfig, sourceDirectory: string) {
    this.config = config;
    this.sourceDirectory = sourceDirectory;
    this.filemakerService = new FileMakerSyncService(config);
    this.jediFolderService = new JediFolderSyncService(config);
    this.serverService = new FileMakerServerService(config);
    this.reporter = new JediCouncilReporter(config);
  }

  /**
   * Execute full sync orchestration
   */
  async executeSyncOrchestration(): Promise<SyncOrchestrationResult> {
    const orchestrationId = `SYNC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = new Date();

    console.log(`\n🔄 Starting FileMaker Sync Orchestration: ${orchestrationId}`);
    console.log(`📁 Source Directory: ${this.sourceDirectory}`);
    console.log(`🎯 JEDI Folder: ${this.config.jediFolder.syncPath}\n`);

    try {
      // Phase 1: Discover and analyze local FileMaker files
      console.log('📋 Phase 1: Discovering FileMaker databases...');
      const localDatabases = await this.discoverLocalDatabases();
      console.log(`✓ Found ${localDatabases.length} FileMaker databases\n`);

      // Phase 2: Sync to JEDI folder
      console.log('🔄 Phase 2: Syncing to central JEDI folder...');
      const jediFolderResults = await this.syncToJediFolder(localDatabases);
      console.log(`✓ JEDI folder sync complete: ${jediFolderResults.length} files processed\n`);

      // Phase 3: Upload to FileMaker Server
      console.log('📤 Phase 3: Uploading to FileMaker Server...');
      const serverResults = await this.uploadToFileMakerServer(localDatabases);
      console.log(`✓ FileMaker Server upload complete: ${serverResults.length} databases processed\n`);

      // Phase 4: Publish to Web Direct
      console.log('🌐 Phase 4: Publishing to Web Direct...');
      const publishResults = await this.publishToWebDirect(localDatabases);
      console.log(`✓ Web Direct publishing complete: ${publishResults.length} databases processed\n`);

      // Phase 5: Generate JEDI Council report
      console.log('📊 Phase 5: Generating JEDI Council report...');
      const filemakerResults = this.filemakerService.getResults();
      const conflicts = this.filemakerService.getConflicts();
      
      const jediReport = this.reporter.generateReport(
        filemakerResults,
        jediFolderResults,
        [...serverResults, ...publishResults],
        this.consecutiveFailures,
        conflicts
      );

      // Save report
      const reportPath = this.reporter.saveReportToFile(jediReport);
      console.log(`✓ Report saved: ${reportPath}\n`);

      // Calculate results
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      const syncedCount = jediFolderResults.filter(r => r.status === 'synced').length;
      const updatedCount = jediFolderResults.filter(r => r.status === 'versioned').length;
      const failedCount = jediFolderResults.filter(r => r.status === 'failed').length;

      // Determine overall status
      let status: 'success' | 'partial' | 'failed' = 'success';
      if (failedCount > 0 || this.consecutiveFailures >= this.config.jediCouncil.alertThreshold) {
        status = 'failed';
        this.consecutiveFailures++;
      } else if (conflicts.length > 0) {
        status = 'partial';
        this.consecutiveFailures = 0;
      } else {
        this.consecutiveFailures = 0;
      }

      const result: SyncOrchestrationResult = {
        orchestrationId,
        startTime,
        endTime,
        duration,
        status,
        summary: {
          totalFiles: localDatabases.length,
          synced: syncedCount,
          updated: updatedCount,
          failed: failedCount,
          conflicts: conflicts.length,
        },
        jediCouncilReport: jediReport,
      };

      // Print summary
      this.printSyncSummary(result);

      return result;
    } catch (error) {
      console.error(`❌ Sync orchestration failed: ${error}`);
      this.consecutiveFailures++;

      throw error;
    }
  }

  /**
   * Discover local FileMaker databases
   */
  private async discoverLocalDatabases(): Promise<FileMakerDatabase[]> {
    const databases: FileMakerDatabase[] = [];

    if (!fs.existsSync(this.sourceDirectory)) {
      console.warn(`⚠️ Source directory not found: ${this.sourceDirectory}`);
      return databases;
    }

    const files = fs.readdirSync(this.sourceDirectory);

    for (const file of files) {
      if (file.endsWith('.fmp12') || file.endsWith('.jedi')) {
        const filePath = path.join(this.sourceDirectory, file);
        try {
          const db = await this.filemakerService.analyzeDatabase(filePath);
          databases.push(db);
          console.log(`  ✓ ${file} (${(db.size / 1024 / 1024).toFixed(2)} MB)`);
        } catch (error) {
          console.error(`  ✗ ${file}: ${error}`);
        }
      }
    }

    return databases;
  }

  /**
   * Sync databases to JEDI folder
   */
  private async syncToJediFolder(databases: FileMakerDatabase[]): Promise<JediFolderSyncResult[]> {
    const results: JediFolderSyncResult[] = [];

    for (const db of databases) {
      const result = await this.jediFolderService.syncToJediFolder(
        db.path,
        db.name,
        db.hash
      );

      results.push(result);
      this.jediFolderService.recordResult(result);

      const statusEmoji = {
        synced: '✓',
        versioned: '↻',
        skipped: '⊘',
        failed: '✗',
      };

      console.log(`  ${statusEmoji[result.status] || '?'} ${db.name}: ${result.message}`);
    }

    return results;
  }

  /**
   * Upload databases to FileMaker Server
   */
  private async uploadToFileMakerServer(databases: FileMakerDatabase[]): Promise<FileMakerServerResult[]> {
    const results: FileMakerServerResult[] = [];

    for (const db of databases) {
      // Check compatibility
      if (!db.compatible) {
        const result: FileMakerServerResult = {
          database: db.name,
          status: 'failed',
          message: 'Database is not compatible with FileMaker format',
          timestamp: new Date(),
          error: 'Incompatible format',
        };
        results.push(result);
        console.log(`  ✗ ${db.name}: Not compatible with FileMaker format`);
        continue;
      }

      // Check security
      if (!db.hasSecurity) {
        console.log(`  ⚠️ ${db.name}: Missing security settings - review before publishing`);
      }

      // Upload to server
      const uploadResult = await this.serverService.uploadDatabase(
        db.name,
        db.path,
        db.hash
      );

      results.push(uploadResult);
      this.serverService.recordUploadResult(uploadResult);

      const statusEmoji: Record<string, string> = {
        uploaded: '✓',
        published: '🌐',
        skipped: '⊘',
        failed: '✗',
        versioned: '↻',
      };

      console.log(`  ${statusEmoji[uploadResult.status] || '?'} ${db.name}: ${uploadResult.message}`);
    }

    return results;
  }

  /**
   * Publish databases to Web Direct
   */
  private async publishToWebDirect(databases: FileMakerDatabase[]): Promise<FileMakerServerResult[]> {
    const results: FileMakerServerResult[] = [];

    for (const db of databases) {
      const publishResult = await this.serverService.publishToWebDirect(db.name);
      results.push(publishResult);
      this.serverService.recordUploadResult(publishResult);

      const statusEmoji: Record<string, string> = {
        uploaded: '✓',
        published: '🌐',
        skipped: '⊘',
        failed: '✗',
        versioned: '↻',
      };

      console.log(`  ${statusEmoji[publishResult.status] || '?'} ${db.name}: ${publishResult.message}`);
    }

    return results;
  }

  /**
   * Print sync summary
   */
  private printSyncSummary(result: SyncOrchestrationResult): void {
    const statusEmoji: Record<string, string> = {
      success: '✅',
      partial: '⚠️',
      failed: '🔴',
    };

    console.log('\n' + '='.repeat(80));
    console.log('📊 SYNC ORCHESTRATION SUMMARY');
    console.log('='.repeat(80));
    console.log(`Status: ${statusEmoji[result.status] || '?'} ${result.status.toUpperCase()}`);
    console.log(`Duration: ${(result.duration / 1000).toFixed(2)}s`);
    console.log(`\nFiles Processed: ${result.summary.totalFiles}`);
    console.log(`  ✓ Synced: ${result.summary.synced}`);
    console.log(`  ↻ Updated: ${result.summary.updated}`);
    console.log(`  ✗ Failed: ${result.summary.failed}`);
    console.log(`  ⚠️ Conflicts: ${result.summary.conflicts}`);

    console.log(`\nJEDI Council Report ID: ${result.jediCouncilReport.reportId}`);
    console.log('\nRecommendations:');
    result.jediCouncilReport.recommendations.forEach((rec, i) => {
      console.log(`  ${i + 1}. ${rec}`);
    });

    console.log('='.repeat(80) + '\n');
  }

  /**
   * Get reporter for external access
   */
  getReporter(): JediCouncilReporter {
    return this.reporter;
  }

  /**
   * Get consecutive failure count
   */
  getConsecutiveFailures(): number {
    return this.consecutiveFailures;
  }
}

export default SyncOrchestrator;
