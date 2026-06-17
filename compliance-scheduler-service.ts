/**
 * Compliance Scheduler Service
 * Automated weekly compliance report generation and distribution - MediVac One v5.1
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ==========================================
// Types
// ==========================================

export type ReportFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annual';
export type ReportFormat = 'pdf' | 'html' | 'json' | 'csv' | 'excel';
export type DeliveryMethod = 'email' | 'dashboard' | 'api' | 'sftp' | 'archive';
export type ComplianceFramework = 'HIPAA' | 'AUSTRALIAN_PRIVACY' | 'ISO_27001' | 'NSQHS' | 'PCI_DSS' | 'SOC2';

export interface ScheduledReport {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  framework: ComplianceFramework;
  frequency: ReportFrequency;
  dayOfWeek?: number; // 0-6, Sunday = 0
  dayOfMonth?: number; // 1-31
  timeOfDay: string; // HH:MM format
  timezone: string;
  format: ReportFormat;
  deliveryMethods: DeliveryConfig[];
  recipients: string[];
  lastRun?: string;
  nextRun: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryConfig {
  method: DeliveryMethod;
  enabled: boolean;
  config: Record<string, string>;
}

export interface ReportExecution {
  id: string;
  reportId: string;
  reportName: string;
  framework: ComplianceFramework;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  duration?: number;
  result?: ReportResult;
  error?: string;
  deliveryStatus: DeliveryStatus[];
}

export interface ReportResult {
  overallScore: number;
  previousScore: number;
  scoreChange: number;
  trend: 'improving' | 'stable' | 'declining';
  controlsAssessed: number;
  controlsCompliant: number;
  controlsPartial: number;
  controlsNonCompliant: number;
  criticalFindings: number;
  highFindings: number;
  mediumFindings: number;
  lowFindings: number;
  newFindings: number;
  resolvedFindings: number;
  recommendations: string[];
  executiveSummary: string;
}

export interface DeliveryStatus {
  method: DeliveryMethod;
  status: 'pending' | 'sent' | 'failed';
  sentAt?: string;
  error?: string;
  recipients?: string[];
}

export interface ComplianceMetrics {
  framework: ComplianceFramework;
  currentScore: number;
  targetScore: number;
  trend: 'improving' | 'stable' | 'declining';
  lastAssessment: string;
  nextAssessment: string;
  openFindings: number;
  overdueRemediations: number;
}

// ==========================================
// Default Scheduled Reports
// ==========================================

const DEFAULT_REPORTS: Omit<ScheduledReport, 'id' | 'createdAt' | 'updatedAt' | 'nextRun'>[] = [
  {
    name: 'Weekly HIPAA Compliance Report',
    description: 'Comprehensive HIPAA compliance status report delivered every Monday morning',
    enabled: true,
    framework: 'HIPAA',
    frequency: 'weekly',
    dayOfWeek: 1, // Monday
    timeOfDay: '07:00',
    timezone: 'Australia/Sydney',
    format: 'pdf',
    deliveryMethods: [
      { method: 'email', enabled: true, config: {} },
      { method: 'dashboard', enabled: true, config: {} },
      { method: 'archive', enabled: true, config: {} },
    ],
    recipients: ['compliance@medivac.one', 'ciso@medivac.one', 'ceo@medivac.one'],
  },
  {
    name: 'Weekly Australian Privacy Act Report',
    description: 'Australian Privacy Act compliance status delivered every Monday morning',
    enabled: true,
    framework: 'AUSTRALIAN_PRIVACY',
    frequency: 'weekly',
    dayOfWeek: 1, // Monday
    timeOfDay: '07:30',
    timezone: 'Australia/Sydney',
    format: 'pdf',
    deliveryMethods: [
      { method: 'email', enabled: true, config: {} },
      { method: 'dashboard', enabled: true, config: {} },
      { method: 'archive', enabled: true, config: {} },
    ],
    recipients: ['compliance@medivac.one', 'privacy.officer@medivac.one'],
  },
  {
    name: 'Monthly ISO 27001 Report',
    description: 'ISO 27001 information security compliance report',
    enabled: true,
    framework: 'ISO_27001',
    frequency: 'monthly',
    dayOfMonth: 1,
    timeOfDay: '08:00',
    timezone: 'Australia/Sydney',
    format: 'pdf',
    deliveryMethods: [
      { method: 'email', enabled: true, config: {} },
      { method: 'dashboard', enabled: true, config: {} },
      { method: 'archive', enabled: true, config: {} },
    ],
    recipients: ['compliance@medivac.one', 'ciso@medivac.one', 'it.director@medivac.one'],
  },
  {
    name: 'Quarterly NSQHS Report',
    description: 'National Safety and Quality Health Service Standards compliance report',
    enabled: true,
    framework: 'NSQHS',
    frequency: 'quarterly',
    dayOfMonth: 1,
    timeOfDay: '08:00',
    timezone: 'Australia/Sydney',
    format: 'pdf',
    deliveryMethods: [
      { method: 'email', enabled: true, config: {} },
      { method: 'dashboard', enabled: true, config: {} },
      { method: 'archive', enabled: true, config: {} },
    ],
    recipients: ['compliance@medivac.one', 'quality.director@medivac.one', 'ceo@medivac.one'],
  },
  {
    name: 'Daily Security Summary',
    description: 'Daily security events and compliance summary',
    enabled: true,
    framework: 'ISO_27001',
    frequency: 'daily',
    timeOfDay: '06:00',
    timezone: 'Australia/Sydney',
    format: 'html',
    deliveryMethods: [
      { method: 'email', enabled: true, config: {} },
      { method: 'dashboard', enabled: true, config: {} },
    ],
    recipients: ['security.team@medivac.one', 'ciso@medivac.one'],
  },
];

// ==========================================
// Service Class
// ==========================================

class ComplianceSchedulerService {
  private static instance: ComplianceSchedulerService;
  private scheduledReports: Map<string, ScheduledReport> = new Map();
  private executions: ReportExecution[] = [];
  private metrics: Map<ComplianceFramework, ComplianceMetrics> = new Map();
  private schedulerInterval: ReturnType<typeof setInterval> | null = null;
  private initialized: boolean = false;
  private listeners: Set<(event: string, data: unknown) => void> = new Set();

  private constructor() {
    this.loadData();
  }

  static getInstance(): ComplianceSchedulerService {
    if (!ComplianceSchedulerService.instance) {
      ComplianceSchedulerService.instance = new ComplianceSchedulerService();
    }
    return ComplianceSchedulerService.instance;
  }

  subscribe(callback: (event: string, data: unknown) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private emit(event: string, data: unknown): void {
    this.listeners.forEach(cb => cb(event, data));
  }

  // ==========================================
  // Data Persistence
  // ==========================================

  private async loadData(): Promise<void> {
    try {
      const [reports, executions, metrics] = await Promise.all([
        AsyncStorage.getItem('scheduled_reports'),
        AsyncStorage.getItem('report_executions'),
        AsyncStorage.getItem('compliance_metrics'),
      ]);

      if (reports) {
        const parsed = JSON.parse(reports) as ScheduledReport[];
        parsed.forEach(r => this.scheduledReports.set(r.id, r));
      } else {
        await this.initializeDefaultReports();
      }

      if (executions) {
        this.executions = JSON.parse(executions);
      }

      if (metrics) {
        const parsed = JSON.parse(metrics) as ComplianceMetrics[];
        parsed.forEach(m => this.metrics.set(m.framework, m));
      } else {
        this.initializeDefaultMetrics();
      }

      this.initialized = true;
      this.emit('data_loaded', { reports: this.scheduledReports.size });
    } catch (error) {
      console.error('Failed to load compliance scheduler data:', error);
      await this.initializeDefaultReports();
    }
  }

  private async initializeDefaultReports(): Promise<void> {
    const now = new Date().toISOString();

    for (const template of DEFAULT_REPORTS) {
      const report: ScheduledReport = {
        ...template,
        id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: now,
        updatedAt: now,
        nextRun: this.calculateNextRun(template.frequency, template.dayOfWeek, template.dayOfMonth, template.timeOfDay),
      };
      this.scheduledReports.set(report.id, report);
    }

    await this.saveData();
    this.emit('reports_initialized', { count: this.scheduledReports.size });
  }

  private initializeDefaultMetrics(): void {
    const frameworks: ComplianceFramework[] = ['HIPAA', 'AUSTRALIAN_PRIVACY', 'ISO_27001', 'NSQHS', 'PCI_DSS', 'SOC2'];
    const now = new Date().toISOString();

    frameworks.forEach(framework => {
      this.metrics.set(framework, {
        framework,
        currentScore: 85 + Math.floor(Math.random() * 10),
        targetScore: 95,
        trend: 'stable',
        lastAssessment: now,
        nextAssessment: this.calculateNextRun('weekly', 1, undefined, '07:00'),
        openFindings: Math.floor(Math.random() * 10),
        overdueRemediations: Math.floor(Math.random() * 3),
      });
    });
  }

  private async saveData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem('scheduled_reports', JSON.stringify(Array.from(this.scheduledReports.values()))),
        AsyncStorage.setItem('report_executions', JSON.stringify(this.executions.slice(0, 500))),
        AsyncStorage.setItem('compliance_metrics', JSON.stringify(Array.from(this.metrics.values()))),
      ]);
    } catch (error) {
      console.error('Failed to save compliance scheduler data:', error);
    }
  }

  // ==========================================
  // Schedule Calculation
  // ==========================================

  private calculateNextRun(
    frequency: ReportFrequency,
    dayOfWeek?: number,
    dayOfMonth?: number,
    timeOfDay: string = '07:00'
  ): string {
    const now = new Date();
    const [hours, minutes] = timeOfDay.split(':').map(Number);
    let next = new Date(now);

    next.setHours(hours, minutes, 0, 0);

    switch (frequency) {
      case 'daily':
        if (next <= now) {
          next.setDate(next.getDate() + 1);
        }
        break;

      case 'weekly':
        if (dayOfWeek !== undefined) {
          const currentDay = next.getDay();
          let daysUntil = dayOfWeek - currentDay;
          if (daysUntil < 0 || (daysUntil === 0 && next <= now)) {
            daysUntil += 7;
          }
          next.setDate(next.getDate() + daysUntil);
        }
        break;

      case 'biweekly':
        if (dayOfWeek !== undefined) {
          const currentDay = next.getDay();
          let daysUntil = dayOfWeek - currentDay;
          if (daysUntil < 0 || (daysUntil === 0 && next <= now)) {
            daysUntil += 14;
          }
          next.setDate(next.getDate() + daysUntil);
        }
        break;

      case 'monthly':
        if (dayOfMonth !== undefined) {
          next.setDate(dayOfMonth);
          if (next <= now) {
            next.setMonth(next.getMonth() + 1);
          }
        }
        break;

      case 'quarterly':
        if (dayOfMonth !== undefined) {
          const currentMonth = next.getMonth();
          const quarterStart = Math.floor(currentMonth / 3) * 3;
          next.setMonth(quarterStart, dayOfMonth);
          if (next <= now) {
            next.setMonth(next.getMonth() + 3);
          }
        }
        break;

      case 'annual':
        if (dayOfMonth !== undefined) {
          next.setMonth(0, dayOfMonth);
          if (next <= now) {
            next.setFullYear(next.getFullYear() + 1);
          }
        }
        break;
    }

    return next.toISOString();
  }

  // ==========================================
  // Scheduler Control
  // ==========================================

  startScheduler(): void {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
    }

    // Check every minute for reports to run
    this.schedulerInterval = setInterval(() => {
      this.checkAndRunReports();
    }, 60 * 1000);

    // Run immediately on start
    this.checkAndRunReports();

    this.emit('scheduler_started', { timestamp: new Date().toISOString() });
  }

  stopScheduler(): void {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }
    this.emit('scheduler_stopped', { timestamp: new Date().toISOString() });
  }

  private async checkAndRunReports(): Promise<void> {
    const now = new Date();

    for (const report of this.scheduledReports.values()) {
      if (!report.enabled) continue;

      const nextRun = new Date(report.nextRun);
      if (nextRun <= now) {
        await this.executeReport(report.id);
      }
    }
  }

  // ==========================================
  // Report Execution
  // ==========================================

  async executeReport(reportId: string): Promise<ReportExecution | null> {
    const report = this.scheduledReports.get(reportId);
    if (!report) return null;

    const execution: ReportExecution = {
      id: `exec_${Date.now()}`,
      reportId: report.id,
      reportName: report.name,
      framework: report.framework,
      status: 'running',
      startedAt: new Date().toISOString(),
      deliveryStatus: report.deliveryMethods
        .filter(d => d.enabled)
        .map(d => ({ method: d.method, status: 'pending' as const })),
    };

    this.executions.unshift(execution);
    this.emit('report_started', execution);

    try {
      // Generate report result
      const result = await this.generateReportResult(report.framework);
      execution.result = result;

      // Deliver report
      for (const delivery of execution.deliveryStatus) {
        try {
          await this.deliverReport(delivery.method, report, result);
          delivery.status = 'sent';
          delivery.sentAt = new Date().toISOString();
          delivery.recipients = report.recipients;
        } catch (error) {
          delivery.status = 'failed';
          delivery.error = error instanceof Error ? error.message : 'Delivery failed';
        }
      }

      execution.status = 'completed';
      execution.completedAt = new Date().toISOString();
      execution.duration = Date.now() - new Date(execution.startedAt).getTime();

      // Update report with last run and next run
      report.lastRun = execution.startedAt;
      report.nextRun = this.calculateNextRun(
        report.frequency,
        report.dayOfWeek,
        report.dayOfMonth,
        report.timeOfDay
      );
      report.updatedAt = new Date().toISOString();

      // Update metrics
      this.updateMetrics(report.framework, result);

      await this.saveData();
      this.emit('report_completed', execution);

    } catch (error) {
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : 'Report generation failed';
      execution.completedAt = new Date().toISOString();
      await this.saveData();
      this.emit('report_failed', execution);
    }

    return execution;
  }

  private async generateReportResult(framework: ComplianceFramework): Promise<ReportResult> {
    // Simulate report generation with realistic data
    const previousMetrics = this.metrics.get(framework);
    const previousScore = previousMetrics?.currentScore || 85;

    const scoreChange = Math.floor(Math.random() * 6) - 2; // -2 to +3
    const currentScore = Math.min(100, Math.max(0, previousScore + scoreChange));

    const controlsAssessed = this.getControlCount(framework);
    const controlsCompliant = Math.floor(controlsAssessed * (currentScore / 100) * 0.9);
    const controlsPartial = Math.floor((controlsAssessed - controlsCompliant) * 0.6);
    const controlsNonCompliant = controlsAssessed - controlsCompliant - controlsPartial;

    const trend: 'improving' | 'stable' | 'declining' = 
      scoreChange > 1 ? 'improving' : scoreChange < -1 ? 'declining' : 'stable';

    return {
      overallScore: currentScore,
      previousScore,
      scoreChange,
      trend,
      controlsAssessed,
      controlsCompliant,
      controlsPartial,
      controlsNonCompliant,
      criticalFindings: Math.floor(Math.random() * 2),
      highFindings: Math.floor(Math.random() * 5),
      mediumFindings: Math.floor(Math.random() * 10),
      lowFindings: Math.floor(Math.random() * 15),
      newFindings: Math.floor(Math.random() * 3),
      resolvedFindings: Math.floor(Math.random() * 5),
      recommendations: this.generateRecommendations(framework, currentScore),
      executiveSummary: this.generateExecutiveSummary(framework, currentScore, trend),
    };
  }

  private getControlCount(framework: ComplianceFramework): number {
    const counts: Record<ComplianceFramework, number> = {
      HIPAA: 45,
      AUSTRALIAN_PRIVACY: 13,
      ISO_27001: 114,
      NSQHS: 8,
      PCI_DSS: 12,
      SOC2: 64,
    };
    return counts[framework];
  }

  private generateRecommendations(framework: ComplianceFramework, score: number): string[] {
    const recommendations: string[] = [];

    if (score < 90) {
      recommendations.push('Prioritize remediation of high-severity findings');
      recommendations.push('Schedule additional staff training on compliance requirements');
    }

    if (score < 80) {
      recommendations.push('Conduct immediate review of access controls');
      recommendations.push('Implement additional monitoring for sensitive data access');
    }

    switch (framework) {
      case 'HIPAA':
        recommendations.push('Review and update Business Associate Agreements');
        recommendations.push('Verify encryption standards for PHI at rest and in transit');
        break;
      case 'AUSTRALIAN_PRIVACY':
        recommendations.push('Update privacy policy to reflect current data practices');
        recommendations.push('Review cross-border data transfer mechanisms');
        break;
      case 'ISO_27001':
        recommendations.push('Complete internal audit of information security controls');
        recommendations.push('Update risk assessment documentation');
        break;
      case 'NSQHS':
        recommendations.push('Review clinical governance framework');
        recommendations.push('Update medication safety protocols');
        break;
    }

    return recommendations.slice(0, 5);
  }

  private generateExecutiveSummary(
    framework: ComplianceFramework,
    score: number,
    trend: 'improving' | 'stable' | 'declining'
  ): string {
    const frameworkNames: Record<ComplianceFramework, string> = {
      HIPAA: 'HIPAA',
      AUSTRALIAN_PRIVACY: 'Australian Privacy Act',
      ISO_27001: 'ISO 27001',
      NSQHS: 'NSQHS',
      PCI_DSS: 'PCI DSS',
      SOC2: 'SOC 2',
    };

    const trendText = trend === 'improving' ? 'showing improvement' : 
                      trend === 'declining' ? 'requiring attention' : 'remaining stable';

    return `MediVac One ${frameworkNames[framework]} compliance score is ${score}% and ${trendText}. ` +
           `The organization continues to maintain strong security and privacy controls across clinical operations. ` +
           `Key areas of focus include access management, data protection, and incident response capabilities.`;
  }

  private async deliverReport(
    method: DeliveryMethod,
    report: ScheduledReport,
    result: ReportResult
  ): Promise<void> {
    // Simulate delivery - in production this would integrate with actual delivery systems
    switch (method) {
      case 'email':
        console.log(`[Compliance] Sending ${report.name} to ${report.recipients.join(', ')}`);
        break;
      case 'dashboard':
        console.log(`[Compliance] Publishing ${report.name} to dashboard`);
        break;
      case 'archive':
        console.log(`[Compliance] Archiving ${report.name}`);
        break;
      case 'api':
        console.log(`[Compliance] Posting ${report.name} to API endpoint`);
        break;
      case 'sftp':
        console.log(`[Compliance] Uploading ${report.name} to SFTP`);
        break;
    }

    // Simulate delivery delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private updateMetrics(framework: ComplianceFramework, result: ReportResult): void {
    this.metrics.set(framework, {
      framework,
      currentScore: result.overallScore,
      targetScore: 95,
      trend: result.trend,
      lastAssessment: new Date().toISOString(),
      nextAssessment: this.calculateNextRun('weekly', 1, undefined, '07:00'),
      openFindings: result.criticalFindings + result.highFindings + result.mediumFindings + result.lowFindings,
      overdueRemediations: Math.floor(Math.random() * 3),
    });
  }

  // ==========================================
  // Report Management
  // ==========================================

  getScheduledReports(): ScheduledReport[] {
    return Array.from(this.scheduledReports.values());
  }

  getReport(reportId: string): ScheduledReport | undefined {
    return this.scheduledReports.get(reportId);
  }

  async createReport(report: Omit<ScheduledReport, 'id' | 'createdAt' | 'updatedAt' | 'nextRun'>): Promise<ScheduledReport> {
    const now = new Date().toISOString();
    const newReport: ScheduledReport = {
      ...report,
      id: `report_${Date.now()}`,
      createdAt: now,
      updatedAt: now,
      nextRun: this.calculateNextRun(report.frequency, report.dayOfWeek, report.dayOfMonth, report.timeOfDay),
    };

    this.scheduledReports.set(newReport.id, newReport);
    await this.saveData();
    this.emit('report_created', newReport);

    return newReport;
  }

  async updateReport(reportId: string, updates: Partial<ScheduledReport>): Promise<ScheduledReport | null> {
    const report = this.scheduledReports.get(reportId);
    if (!report) return null;

    const updated: ScheduledReport = {
      ...report,
      ...updates,
      id: report.id, // Prevent ID change
      updatedAt: new Date().toISOString(),
    };

    // Recalculate next run if schedule changed
    if (updates.frequency || updates.dayOfWeek !== undefined || updates.dayOfMonth !== undefined || updates.timeOfDay) {
      updated.nextRun = this.calculateNextRun(
        updated.frequency,
        updated.dayOfWeek,
        updated.dayOfMonth,
        updated.timeOfDay
      );
    }

    this.scheduledReports.set(reportId, updated);
    await this.saveData();
    this.emit('report_updated', updated);

    return updated;
  }

  async deleteReport(reportId: string): Promise<boolean> {
    const deleted = this.scheduledReports.delete(reportId);
    if (deleted) {
      await this.saveData();
      this.emit('report_deleted', { reportId });
    }
    return deleted;
  }

  async enableReport(reportId: string): Promise<void> {
    await this.updateReport(reportId, { enabled: true });
  }

  async disableReport(reportId: string): Promise<void> {
    await this.updateReport(reportId, { enabled: false });
  }

  // ==========================================
  // Execution History
  // ==========================================

  getExecutions(limit: number = 50): ReportExecution[] {
    return this.executions.slice(0, limit);
  }

  getExecutionsForReport(reportId: string, limit: number = 20): ReportExecution[] {
    return this.executions.filter(e => e.reportId === reportId).slice(0, limit);
  }

  getLatestExecution(reportId: string): ReportExecution | undefined {
    return this.executions.find(e => e.reportId === reportId);
  }

  // ==========================================
  // Metrics
  // ==========================================

  getMetrics(framework: ComplianceFramework): ComplianceMetrics | undefined {
    return this.metrics.get(framework);
  }

  getAllMetrics(): ComplianceMetrics[] {
    return Array.from(this.metrics.values());
  }

  getComplianceSummary(): {
    averageScore: number;
    frameworks: number;
    totalOpenFindings: number;
    totalOverdueRemediations: number;
    nextScheduledReport: { name: string; nextRun: string } | null;
  } {
    const metrics = Array.from(this.metrics.values());
    const reports = Array.from(this.scheduledReports.values()).filter(r => r.enabled);

    const averageScore = metrics.length > 0
      ? Math.round(metrics.reduce((sum, m) => sum + m.currentScore, 0) / metrics.length)
      : 0;

    const nextReport = reports
      .sort((a, b) => new Date(a.nextRun).getTime() - new Date(b.nextRun).getTime())[0];

    return {
      averageScore,
      frameworks: metrics.length,
      totalOpenFindings: metrics.reduce((sum, m) => sum + m.openFindings, 0),
      totalOverdueRemediations: metrics.reduce((sum, m) => sum + m.overdueRemediations, 0),
      nextScheduledReport: nextReport ? { name: nextReport.name, nextRun: nextReport.nextRun } : null,
    };
  }

  // ==========================================
  // Statistics
  // ==========================================

  getSchedulerStatistics(): {
    totalReports: number;
    enabledReports: number;
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageExecutionTime: number;
  } {
    const completedExecutions = this.executions.filter(e => e.status === 'completed');
    const failedExecutions = this.executions.filter(e => e.status === 'failed');

    const avgTime = completedExecutions.length > 0
      ? completedExecutions.reduce((sum, e) => sum + (e.duration || 0), 0) / completedExecutions.length
      : 0;

    return {
      totalReports: this.scheduledReports.size,
      enabledReports: Array.from(this.scheduledReports.values()).filter(r => r.enabled).length,
      totalExecutions: this.executions.length,
      successfulExecutions: completedExecutions.length,
      failedExecutions: failedExecutions.length,
      averageExecutionTime: Math.round(avgTime),
    };
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

export const complianceSchedulerService = ComplianceSchedulerService.getInstance();
