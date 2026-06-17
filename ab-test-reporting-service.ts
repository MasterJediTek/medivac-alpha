/**
 * A/B Test PDF Reporting Service for MediVac WACHS v8.4
 * Generate comprehensive PDF reports for A/B test results
 */

// Types
export type ReportFormat = 'pdf' | 'html' | 'json';
export type ReportStatus = 'draft' | 'generating' | 'ready' | 'failed' | 'archived';

export interface VariantPerformance {
  variantId: string;
  variantName: string;
  impressions: number;
  installs: number;
  conversionRate: number;
  confidence: number;
  isWinner: boolean;
  isControl: boolean;
  uplift: number; // percentage vs control
}

export interface StatisticalAnalysis {
  sampleSize: number;
  confidenceLevel: number;
  pValue: number;
  statisticallySignificant: boolean;
  minimumDetectableEffect: number;
  powerAnalysis: number;
  recommendedSampleSize: number;
}

export interface ReportSection {
  id: string;
  title: string;
  type: 'summary' | 'chart' | 'table' | 'recommendation' | 'analysis';
  content: unknown;
  order: number;
}

export interface ABTestReport {
  id: string;
  testId: string;
  testName: string;
  title: string;
  description: string;
  status: ReportStatus;
  format: ReportFormat;
  sections: ReportSection[];
  generatedAt: Date | null;
  generatedBy: string;
  fileUrl: string | null;
  fileSize: number | null;
  createdAt: Date;
  updatedAt: Date;
  scheduledAt: Date | null;
  recipients: string[];
  metadata: {
    testStartDate: Date;
    testEndDate: Date | null;
    totalImpressions: number;
    totalInstalls: number;
    variantCount: number;
    store: string;
  };
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: Omit<ReportSection, 'content'>[];
  isDefault: boolean;
  createdAt: Date;
}

export interface ReportSchedule {
  id: string;
  testId: string;
  templateId: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'on_completion';
  recipients: string[];
  isEnabled: boolean;
  lastRun: Date | null;
  nextRun: Date | null;
}

export interface ReportAnalytics {
  totalReports: number;
  reportsThisMonth: number;
  averageGenerationTime: number; // seconds
  reportsByStatus: Record<ReportStatus, number>;
  reportsByFormat: Record<ReportFormat, number>;
  mostUsedTemplate: string;
  totalRecipients: number;
}

// Default templates
const defaultTemplates: ReportTemplate[] = [
  {
    id: 'executive-summary',
    name: 'Executive Summary',
    description: 'High-level overview for stakeholders',
    sections: [
      { id: 'summary', title: 'Executive Summary', type: 'summary', order: 1 },
      { id: 'key-metrics', title: 'Key Metrics', type: 'table', order: 2 },
      { id: 'winner-chart', title: 'Performance Comparison', type: 'chart', order: 3 },
      { id: 'recommendation', title: 'Recommendation', type: 'recommendation', order: 4 },
    ],
    isDefault: true,
    createdAt: new Date(),
  },
  {
    id: 'detailed-analysis',
    name: 'Detailed Analysis',
    description: 'Comprehensive statistical analysis',
    sections: [
      { id: 'summary', title: 'Executive Summary', type: 'summary', order: 1 },
      { id: 'variant-performance', title: 'Variant Performance', type: 'table', order: 2 },
      { id: 'conversion-chart', title: 'Conversion Rate Comparison', type: 'chart', order: 3 },
      { id: 'statistical-analysis', title: 'Statistical Analysis', type: 'analysis', order: 4 },
      { id: 'confidence-chart', title: 'Confidence Intervals', type: 'chart', order: 5 },
      { id: 'timeline-chart', title: 'Performance Over Time', type: 'chart', order: 6 },
      { id: 'recommendation', title: 'Recommendations', type: 'recommendation', order: 7 },
    ],
    isDefault: false,
    createdAt: new Date(),
  },
  {
    id: 'quick-report',
    name: 'Quick Report',
    description: 'Brief summary of test results',
    sections: [
      { id: 'summary', title: 'Summary', type: 'summary', order: 1 },
      { id: 'winner', title: 'Winner', type: 'recommendation', order: 2 },
    ],
    isDefault: false,
    createdAt: new Date(),
  },
];

class ABTestReportingService {
  private reports: ABTestReport[] = [];
  private templates: ReportTemplate[] = [...defaultTemplates];
  private schedules: ReportSchedule[] = [];
  private listeners: ((report: ABTestReport) => void)[] = [];

  constructor() {
    // Initialize with sample reports
    this.generateSampleReports();
  }

  private generateSampleReports(): void {
    const now = new Date();
    const stores = ['Google Play', 'Apple App Store', 'Microsoft Store'];
    const statuses: ReportStatus[] = ['ready', 'ready', 'ready', 'draft', 'archived'];

    for (let i = 0; i < 10; i++) {
      const createdAt = new Date(now);
      createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 30));
      
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const store = stores[Math.floor(Math.random() * stores.length)];
      
      const report: ABTestReport = {
        id: `report-${i}`,
        testId: `test-${i}`,
        testName: `Screenshot Test ${i + 1}`,
        title: `A/B Test Report - ${store} Screenshots`,
        description: `Performance analysis for screenshot variant test on ${store}`,
        status,
        format: 'pdf',
        sections: this.generateReportSections(`test-${i}`),
        generatedAt: status === 'ready' ? new Date(createdAt.getTime() + 60000) : null,
        generatedBy: 'system',
        fileUrl: status === 'ready' ? `https://files.manuscdn.com/reports/report-${i}.pdf` : null,
        fileSize: status === 'ready' ? Math.floor(Math.random() * 500000) + 100000 : null,
        createdAt,
        updatedAt: new Date(),
        scheduledAt: null,
        recipients: ['admin@medivac-wachs.com', 'marketing@medivac-wachs.com'],
        metadata: {
          testStartDate: new Date(createdAt.getTime() - 7 * 24 * 60 * 60 * 1000),
          testEndDate: status === 'ready' ? createdAt : null,
          totalImpressions: Math.floor(Math.random() * 50000) + 10000,
          totalInstalls: Math.floor(Math.random() * 5000) + 1000,
          variantCount: Math.floor(Math.random() * 3) + 2,
          store,
        },
      };
      
      this.reports.push(report);
    }
  }

  private generateReportSections(testId: string): ReportSection[] {
    const variantA: VariantPerformance = {
      variantId: 'variant-a',
      variantName: 'Control',
      impressions: Math.floor(Math.random() * 25000) + 5000,
      installs: Math.floor(Math.random() * 2500) + 500,
      conversionRate: 0,
      confidence: 0,
      isWinner: false,
      isControl: true,
      uplift: 0,
    };
    variantA.conversionRate = (variantA.installs / variantA.impressions) * 100;

    const variantB: VariantPerformance = {
      variantId: 'variant-b',
      variantName: 'Variant B',
      impressions: Math.floor(Math.random() * 25000) + 5000,
      installs: Math.floor(Math.random() * 3000) + 600,
      conversionRate: 0,
      confidence: Math.random() * 30 + 70,
      isWinner: false,
      isControl: false,
      uplift: 0,
    };
    variantB.conversionRate = (variantB.installs / variantB.impressions) * 100;
    variantB.uplift = ((variantB.conversionRate - variantA.conversionRate) / variantA.conversionRate) * 100;
    variantB.isWinner = variantB.conversionRate > variantA.conversionRate && variantB.confidence > 95;

    const statistical: StatisticalAnalysis = {
      sampleSize: variantA.impressions + variantB.impressions,
      confidenceLevel: 95,
      pValue: Math.random() * 0.1,
      statisticallySignificant: variantB.confidence > 95,
      minimumDetectableEffect: 5,
      powerAnalysis: 80,
      recommendedSampleSize: 50000,
    };

    return [
      {
        id: 'summary',
        title: 'Executive Summary',
        type: 'summary',
        content: {
          testId,
          winner: variantB.isWinner ? 'Variant B' : 'No clear winner',
          totalImpressions: variantA.impressions + variantB.impressions,
          totalInstalls: variantA.installs + variantB.installs,
          overallConversionRate: ((variantA.installs + variantB.installs) / (variantA.impressions + variantB.impressions)) * 100,
          testDuration: '7 days',
          conclusion: variantB.isWinner 
            ? 'Variant B shows statistically significant improvement over control.'
            : 'More data needed to determine a clear winner.',
        },
        order: 1,
      },
      {
        id: 'variant-performance',
        title: 'Variant Performance',
        type: 'table',
        content: {
          variants: [variantA, variantB],
        },
        order: 2,
      },
      {
        id: 'conversion-chart',
        title: 'Conversion Rate Comparison',
        type: 'chart',
        content: {
          chartType: 'bar',
          data: [
            { name: 'Control', value: variantA.conversionRate },
            { name: 'Variant B', value: variantB.conversionRate },
          ],
        },
        order: 3,
      },
      {
        id: 'statistical-analysis',
        title: 'Statistical Analysis',
        type: 'analysis',
        content: statistical,
        order: 4,
      },
      {
        id: 'recommendation',
        title: 'Recommendations',
        type: 'recommendation',
        content: {
          primaryRecommendation: variantB.isWinner 
            ? 'Deploy Variant B to 100% of traffic'
            : 'Continue test to gather more data',
          secondaryRecommendations: [
            'Monitor conversion rates for 48 hours post-deployment',
            'Consider testing additional variants',
            'Review user feedback for qualitative insights',
          ],
          riskAssessment: variantB.isWinner ? 'Low' : 'Medium',
          confidenceScore: variantB.confidence,
        },
        order: 5,
      },
    ];
  }

  // Report Management
  getAllReports(): ABTestReport[] {
    return [...this.reports].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getReport(reportId: string): ABTestReport | null {
    return this.reports.find(r => r.id === reportId) || null;
  }

  getReportsByTest(testId: string): ABTestReport[] {
    return this.reports.filter(r => r.testId === testId);
  }

  async generateReport(testId: string, templateId: string, options: {
    title?: string;
    description?: string;
    recipients?: string[];
    format?: ReportFormat;
  } = {}): Promise<ABTestReport> {
    const template = this.templates.find(t => t.id === templateId) || this.templates[0];
    
    const report: ABTestReport = {
      id: `report-${Date.now()}`,
      testId,
      testName: `Test ${testId}`,
      title: options.title || `A/B Test Report - ${testId}`,
      description: options.description || `Generated report for test ${testId}`,
      status: 'generating',
      format: options.format || 'pdf',
      sections: this.generateReportSections(testId),
      generatedAt: null,
      generatedBy: 'system',
      fileUrl: null,
      fileSize: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      scheduledAt: null,
      recipients: options.recipients || [],
      metadata: {
        testStartDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        testEndDate: new Date(),
        totalImpressions: Math.floor(Math.random() * 50000) + 10000,
        totalInstalls: Math.floor(Math.random() * 5000) + 1000,
        variantCount: 2,
        store: 'Google Play',
      },
    };
    
    this.reports.push(report);
    
    // Simulate PDF generation
    await this.simulateGeneration(report);
    
    return report;
  }

  private async simulateGeneration(report: ABTestReport): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        report.status = 'ready';
        report.generatedAt = new Date();
        report.fileUrl = `https://files.manuscdn.com/reports/${report.id}.pdf`;
        report.fileSize = Math.floor(Math.random() * 500000) + 100000;
        report.updatedAt = new Date();
        
        this.notifyListeners(report);
        resolve();
      }, 2000);
    });
  }

  updateReport(reportId: string, updates: Partial<ABTestReport>): ABTestReport | null {
    const index = this.reports.findIndex(r => r.id === reportId);
    if (index === -1) return null;
    
    this.reports[index] = {
      ...this.reports[index],
      ...updates,
      updatedAt: new Date(),
    };
    return this.reports[index];
  }

  deleteReport(reportId: string): boolean {
    const initialLength = this.reports.length;
    this.reports = this.reports.filter(r => r.id !== reportId);
    return this.reports.length < initialLength;
  }

  archiveReport(reportId: string): ABTestReport | null {
    return this.updateReport(reportId, { status: 'archived' });
  }

  // Template Management
  getAllTemplates(): ReportTemplate[] {
    return [...this.templates];
  }

  getTemplate(templateId: string): ReportTemplate | null {
    return this.templates.find(t => t.id === templateId) || null;
  }

  getDefaultTemplate(): ReportTemplate {
    return this.templates.find(t => t.isDefault) || this.templates[0];
  }

  createTemplate(template: Omit<ReportTemplate, 'id' | 'createdAt'>): ReportTemplate {
    const newTemplate: ReportTemplate = {
      ...template,
      id: `template-${Date.now()}`,
      createdAt: new Date(),
    };
    this.templates.push(newTemplate);
    return newTemplate;
  }

  updateTemplate(templateId: string, updates: Partial<ReportTemplate>): ReportTemplate | null {
    const index = this.templates.findIndex(t => t.id === templateId);
    if (index === -1) return null;
    
    this.templates[index] = { ...this.templates[index], ...updates };
    return this.templates[index];
  }

  deleteTemplate(templateId: string): boolean {
    const template = this.templates.find(t => t.id === templateId);
    if (template?.isDefault) return false; // Cannot delete default template
    
    const initialLength = this.templates.length;
    this.templates = this.templates.filter(t => t.id !== templateId);
    return this.templates.length < initialLength;
  }

  // Schedule Management
  getAllSchedules(): ReportSchedule[] {
    return [...this.schedules];
  }

  createSchedule(schedule: Omit<ReportSchedule, 'id' | 'lastRun' | 'nextRun'>): ReportSchedule {
    const newSchedule: ReportSchedule = {
      ...schedule,
      id: `schedule-${Date.now()}`,
      lastRun: null,
      nextRun: this.calculateNextRun(schedule.frequency),
    };
    this.schedules.push(newSchedule);
    return newSchedule;
  }

  updateSchedule(scheduleId: string, updates: Partial<ReportSchedule>): ReportSchedule | null {
    const index = this.schedules.findIndex(s => s.id === scheduleId);
    if (index === -1) return null;
    
    this.schedules[index] = { ...this.schedules[index], ...updates };
    if (updates.frequency) {
      this.schedules[index].nextRun = this.calculateNextRun(updates.frequency);
    }
    return this.schedules[index];
  }

  deleteSchedule(scheduleId: string): boolean {
    const initialLength = this.schedules.length;
    this.schedules = this.schedules.filter(s => s.id !== scheduleId);
    return this.schedules.length < initialLength;
  }

  private calculateNextRun(frequency: ReportSchedule['frequency']): Date {
    const now = new Date();
    switch (frequency) {
      case 'daily':
        now.setDate(now.getDate() + 1);
        now.setHours(9, 0, 0, 0);
        break;
      case 'weekly':
        now.setDate(now.getDate() + 7);
        now.setHours(9, 0, 0, 0);
        break;
      case 'monthly':
        now.setMonth(now.getMonth() + 1);
        now.setDate(1);
        now.setHours(9, 0, 0, 0);
        break;
      case 'on_completion':
        // No scheduled date
        break;
    }
    return now;
  }

  // Distribution
  async shareReport(reportId: string, recipients: string[]): Promise<boolean> {
    const report = this.getReport(reportId);
    if (!report || report.status !== 'ready') return false;
    
    report.recipients = [...new Set([...report.recipients, ...recipients])];
    report.updatedAt = new Date();
    
    // Simulate sending emails
    console.log(`[ABTestReporting] Report ${reportId} shared with: ${recipients.join(', ')}`);
    return true;
  }

  async downloadReport(reportId: string): Promise<string | null> {
    const report = this.getReport(reportId);
    if (!report || !report.fileUrl) return null;
    
    return report.fileUrl;
  }

  // Event Listeners
  onReportReady(callback: (report: ABTestReport) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notifyListeners(report: ABTestReport): void {
    if (report.status === 'ready') {
      this.listeners.forEach(listener => listener(report));
    }
  }

  // Analytics
  getAnalytics(): ReportAnalytics {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const reportsThisMonth = this.reports.filter(r => r.createdAt >= monthStart).length;
    
    const reportsByStatus: Record<ReportStatus, number> = {
      draft: 0,
      generating: 0,
      ready: 0,
      failed: 0,
      archived: 0,
    };
    
    const reportsByFormat: Record<ReportFormat, number> = {
      pdf: 0,
      html: 0,
      json: 0,
    };
    
    let totalGenerationTime = 0;
    let generatedCount = 0;
    const templateUsage: Record<string, number> = {};
    const allRecipients = new Set<string>();
    
    for (const report of this.reports) {
      reportsByStatus[report.status]++;
      reportsByFormat[report.format]++;
      
      if (report.generatedAt && report.createdAt) {
        totalGenerationTime += (report.generatedAt.getTime() - report.createdAt.getTime()) / 1000;
        generatedCount++;
      }
      
      report.recipients.forEach(r => allRecipients.add(r));
    }
    
    return {
      totalReports: this.reports.length,
      reportsThisMonth,
      averageGenerationTime: generatedCount > 0 ? Math.round(totalGenerationTime / generatedCount) : 0,
      reportsByStatus,
      reportsByFormat,
      mostUsedTemplate: 'executive-summary',
      totalRecipients: allRecipients.size,
    };
  }

  // Recommendations
  getRecommendations(testId: string): {
    action: string;
    confidence: number;
    reasoning: string;
    impact: 'high' | 'medium' | 'low';
  }[] {
    const reports = this.getReportsByTest(testId);
    if (reports.length === 0) return [];
    
    const latestReport = reports[0];
    const recommendationSection = latestReport.sections.find(s => s.type === 'recommendation');
    
    if (!recommendationSection) return [];
    
    const content = recommendationSection.content as {
      primaryRecommendation: string;
      secondaryRecommendations: string[];
      confidenceScore: number;
    };
    
    return [
      {
        action: content.primaryRecommendation,
        confidence: content.confidenceScore,
        reasoning: 'Based on statistical analysis of variant performance',
        impact: 'high',
      },
      ...content.secondaryRecommendations.map((rec, index) => ({
        action: rec,
        confidence: content.confidenceScore - (index * 5),
        reasoning: 'Supporting recommendation for optimal results',
        impact: (index === 0 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
      })),
    ];
  }
}

export const abTestReportingService = new ABTestReportingService();
