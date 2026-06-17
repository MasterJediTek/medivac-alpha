/**
 * JEDI Council Reporting and Alerting System
 * Reports sync status, errors, and recommendations to JEDI Masters and Grand Masters
 */

import * as fs from 'fs';
import * as path from 'path';
import { FileMakerSyncConfig } from '../config/sync-config';
import { SyncResult } from './filemaker-sync-service';
import { JediFolderSyncResult } from './jedi-folder-sync';
import { FileMakerServerResult } from './filemaker-server-service';

export interface JediCouncilReport {
  timestamp: Date;
  reportId: string;
  syncStatus: 'success' | 'partial' | 'failed';
  newFilesReceived: number;
  filesUpdated: number;
  filesFailed: number;
  conflictsDetected: number;
  consecutiveFailures: number;
  recommendations: string[];
  details: {
    filemakerSync: SyncResult[];
    jediFolderSync: JediFolderSyncResult[];
    serverPublishing: FileMakerServerResult[];
  };
}

export class JediCouncilReporter {
  private config: FileMakerSyncConfig;
  private reports: JediCouncilReport[] = [];
  private logPath: string;

  constructor(config: FileMakerSyncConfig) {
    this.config = config;
    this.logPath = path.join(config.monitoring.logPath, 'jedi-council-reports');
    this.ensureLogDirectory();
  }

  /**
   * Ensure log directory exists
   */
  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logPath)) {
      fs.mkdirSync(this.logPath, { recursive: true });
    }
  }

  /**
   * Generate comprehensive JEDI Council report
   */
  generateReport(
    filemakerResults: SyncResult[],
    jediFolderResults: JediFolderSyncResult[],
    serverResults: FileMakerServerResult[],
    consecutiveFailures: number,
    conflicts: any[]
  ): JediCouncilReport {
    const reportId = `JEDI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Calculate statistics
    const newFilesReceived = jediFolderResults.filter(r => r.status === 'synced' || r.status === 'versioned').length;
    const filesUpdated = jediFolderResults.filter(r => r.status === 'versioned').length;
    const filesFailed = jediFolderResults.filter(r => r.status === 'failed').length;

    // Determine overall status
    let syncStatus: 'success' | 'partial' | 'failed' = 'success';
    if (filesFailed > 0 || consecutiveFailures >= this.config.jediCouncil.alertThreshold) {
      syncStatus = 'failed';
    } else if (filesFailed > 0 || conflicts.length > 0) {
      syncStatus = 'partial';
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      filemakerResults,
      jediFolderResults,
      serverResults,
      consecutiveFailures,
      conflicts
    );

    const report: JediCouncilReport = {
      timestamp: new Date(),
      reportId,
      syncStatus,
      newFilesReceived,
      filesUpdated,
      filesFailed,
      conflictsDetected: conflicts.length,
      consecutiveFailures,
      recommendations,
      details: {
        filemakerSync: filemakerResults,
        jediFolderSync: jediFolderResults,
        serverPublishing: serverResults,
      },
    };

    this.reports.push(report);
    return report;
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(
    filemakerResults: SyncResult[],
    jediFolderResults: JediFolderSyncResult[],
    serverResults: FileMakerServerResult[],
    consecutiveFailures: number,
    conflicts: any[]
  ): string[] {
    const recommendations: string[] = [];

    // Check for failures
    const failedJediSync = jediFolderResults.filter(r => r.status === 'failed');
    if (failedJediSync.length > 0) {
      recommendations.push(
        `🔴 CODE BLUE: ${failedJediSync.length} files failed to sync to JEDI folder. ` +
        `Check JEDI folder permissions and disk space. Failed files: ${failedJediSync.map(r => r.file).join(', ')}`
      );
    }

    // Check for server publishing failures
    const failedServerPublish = serverResults.filter(r => r.status === 'failed');
    if (failedServerPublish.length > 0) {
      recommendations.push(
        `🔴 CODE BLUE: ${failedServerPublish.length} databases failed to publish to Web Direct. ` +
        `Verify FileMaker Server credentials and connectivity to iskooledu.fmcloud.fm`
      );
    }

    // Check for consecutive failures
    if (consecutiveFailures >= this.config.jediCouncil.alertThreshold) {
      recommendations.push(
        `🚨 HOMING BEACON: ${consecutiveFailures} consecutive failures detected. ` +
        `Immediate investigation required. Check FileMaker Server status and network connectivity.`
      );
    }

    // Check for conflicts
    if (conflicts.length > 0) {
      recommendations.push(
        `⚠️ CONFLICTS: ${conflicts.length} file conflicts detected. ` +
        `Review conflict resolution strategy. Current strategy: ${this.config.sync.conflictResolution}`
      );
    }

    // Check for versioned files
    const versionedFiles = jediFolderResults.filter(r => r.status === 'versioned');
    if (versionedFiles.length > 0) {
      recommendations.push(
        `📝 VERSIONED: ${versionedFiles.length} files saved as new versions to preserve originals. ` +
        `Versioned files: ${versionedFiles.map(r => r.file).join(', ')}`
      );
    }

    // Check for incompatible files
    const incompatibleFiles = filemakerResults.filter(r => r.message.includes('not compatible'));
    if (incompatibleFiles.length > 0) {
      recommendations.push(
        `⚠️ COMPATIBILITY: ${incompatibleFiles.length} files are not compatible with FileMaker format. ` +
        `Files: ${incompatibleFiles.map(r => r.database).join(', ')}`
      );
    }

    // Check for security issues
    const securityIssues = filemakerResults.filter(r => r.message.includes('security'));
    if (securityIssues.length > 0) {
      recommendations.push(
        `🔒 SECURITY: ${securityIssues.length} files have security concerns. ` +
        `Review database security settings before publishing.`
      );
    }

    // Success recommendations
    if (recommendations.length === 0) {
      recommendations.push('✅ All systems operational. Sync completed successfully.');
      recommendations.push('🎯 Continue monitoring hourly sync status.');
      recommendations.push('📊 Review performance metrics for optimization opportunities.');
    }

    return recommendations;
  }

  /**
   * Format report for email notification
   */
  formatReportForEmail(report: JediCouncilReport): string {
    const statusEmoji = {
      success: '✅',
      partial: '⚠️',
      failed: '🔴',
    };

    let emailBody = `
JEDI COUNCIL SYNC REPORT
========================
Report ID: ${report.reportId}
Timestamp: ${report.timestamp.toISOString()}
Status: ${statusEmoji[report.syncStatus]} ${report.syncStatus.toUpperCase()}

SUMMARY
-------
New Files Received: ${report.newFilesReceived}
Files Updated: ${report.filesUpdated}
Files Failed: ${report.filesFailed}
Conflicts Detected: ${report.conflictsDetected}
Consecutive Failures: ${report.consecutiveFailures}

RECOMMENDATIONS
---------------
${report.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}

DETAILED RESULTS
----------------
JEDI Folder Sync: ${report.details.jediFolderSync.length} files processed
- Synced: ${report.details.jediFolderSync.filter(r => r.status === 'synced').length}
- Versioned: ${report.details.jediFolderSync.filter(r => r.status === 'versioned').length}
- Skipped: ${report.details.jediFolderSync.filter(r => r.status === 'skipped').length}
- Failed: ${report.details.jediFolderSync.filter(r => r.status === 'failed').length}

FileMaker Server Publishing: ${report.details.serverPublishing.length} databases processed
- Published: ${report.details.serverPublishing.filter(r => r.status === 'published').length}
- Uploaded: ${report.details.serverPublishing.filter(r => r.status === 'uploaded').length}
- Failed: ${report.details.serverPublishing.filter(r => r.status === 'failed').length}

${report.filesFailed > 0 ? '\nFAILED FILES:\n' + report.details.jediFolderSync
  .filter(r => r.status === 'failed')
  .map(r => `- ${r.file}: ${r.error}`)
  .join('\n') : ''}

---
JEDI Sync System
Automated Hourly Monitoring
`;

    return emailBody;
  }

  /**
   * Save report to file
   */
  saveReportToFile(report: JediCouncilReport): string {
    const fileName = `report-${report.reportId}.json`;
    const filePath = path.join(this.logPath, fileName);

    fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
    return filePath;
  }

  /**
   * Get all reports
   */
  getReports(): JediCouncilReport[] {
    return this.reports;
  }

  /**
   * Get latest report
   */
  getLatestReport(): JediCouncilReport | null {
    return this.reports.length > 0 ? this.reports[this.reports.length - 1] : null;
  }

  /**
   * Get reports for date range
   */
  getReportsForDateRange(startDate: Date, endDate: Date): JediCouncilReport[] {
    return this.reports.filter(
      r => r.timestamp >= startDate && r.timestamp <= endDate
    );
  }

  /**
   * Get failure statistics
   */
  getFailureStats() {
    const failedReports = this.reports.filter(r => r.syncStatus === 'failed');
    const totalFailures = failedReports.reduce((sum, r) => sum + r.filesFailed, 0);

    return {
      totalReports: this.reports.length,
      failedReports: failedReports.length,
      totalFailures,
      averageFailuresPerReport: totalFailures / (this.reports.length || 1),
    };
  }
}

export default JediCouncilReporter;
