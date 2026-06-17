#!/usr/bin/env npx ts-node
/**
 * Manual FileMaker Sync Script
 * Execute sync immediately without cron scheduling
 */

import * as path from 'path';
import * as fs from 'fs';
import SyncOrchestrator from '../services/sync-orchestrator';
import { defaultConfig } from '../config/sync-config';

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('🔄 MANUAL FILEMAKER SYNC EXECUTION');
  console.log('='.repeat(80) + '\n');

  try {
    // Get source directory from environment or use default
    const sourceDir = process.env.FILEMAKER_SOURCE_DIR || 
                     '/home/ubuntu/projects/filemaker-databases/files';

    console.log(`📁 Source Directory: ${sourceDir}`);
    console.log(`🎯 JEDI Folder: ${defaultConfig.jediFolder.syncPath}`);
    console.log(`📊 Log Directory: ${defaultConfig.monitoring.logPath}\n`);

    // Check if source directory exists
    if (!fs.existsSync(sourceDir)) {
      console.warn(`⚠️ Source directory not found: ${sourceDir}`);
      console.log('Creating sample test directory...\n');
      
      // Create test directory for demonstration
      fs.mkdirSync(sourceDir, { recursive: true });
      console.log(`✓ Created: ${sourceDir}\n`);
    }

    // Create orchestrator
    const orchestrator = new SyncOrchestrator(defaultConfig, sourceDir);

    // Execute sync
    const result = await orchestrator.executeSyncOrchestration();

    // Print detailed results
    console.log('\n' + '='.repeat(80));
    console.log('📋 SYNC EXECUTION DETAILS');
    console.log('='.repeat(80));
    console.log(`Orchestration ID: ${result.orchestrationId}`);
    console.log(`Start Time: ${result.startTime.toISOString()}`);
    console.log(`End Time: ${result.endTime.toISOString()}`);
    console.log(`Duration: ${(result.duration / 1000).toFixed(2)}s\n`);

    console.log('Summary:');
    console.log(`  Total Files: ${result.summary.totalFiles}`);
    console.log(`  Synced: ${result.summary.synced}`);
    console.log(`  Updated: ${result.summary.updated}`);
    console.log(`  Failed: ${result.summary.failed}`);
    console.log(`  Conflicts: ${result.summary.conflicts}\n`);

    console.log('JEDI Council Report:');
    console.log(`  Report ID: ${result.jediCouncilReport.reportId}`);
    console.log(`  Status: ${result.jediCouncilReport.syncStatus.toUpperCase()}`);
    console.log(`  New Files: ${result.jediCouncilReport.newFilesReceived}`);
    console.log(`  Files Updated: ${result.jediCouncilReport.filesUpdated}`);
    console.log(`  Files Failed: ${result.jediCouncilReport.filesFailed}`);
    console.log(`  Conflicts: ${result.jediCouncilReport.conflictsDetected}\n`);

    console.log('Recommendations:');
    result.jediCouncilReport.recommendations.forEach((rec, i) => {
      console.log(`  ${i + 1}. ${rec}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('✅ MANUAL SYNC COMPLETED');
    console.log('='.repeat(80) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ SYNC FAILED');
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    console.error(`Stack: ${error instanceof Error ? error.stack : ''}\n`);
    process.exit(1);
  }
}

main();
