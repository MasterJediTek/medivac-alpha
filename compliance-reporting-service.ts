/**
 * Automated Compliance Reporting Service
 * Scheduled compliance reports for MediVac One v5.0
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ==========================================
// Types
// ==========================================

export type ComplianceFramework = 'HIPAA' | 'AUSTRALIAN_PRIVACY' | 'ISO_27001' | 'NSQHS' | 'PCI_DSS' | 'SOC2';
export type ReportFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'on_demand';
export type ReportFormat = 'pdf' | 'html' | 'json' | 'csv' | 'excel';
export type ControlStatus = 'compliant' | 'partial' | 'non_compliant' | 'not_applicable' | 'not_assessed';
export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low' | 'informational';

export interface ComplianceControl {
  id: string;
  framework: ComplianceFramework;
  controlId: string;
  name: string;
  description: string;
  category: string;
  status: ControlStatus;
  lastAssessed: string;
  evidence: Evidence[];
  findings: Finding[];
  remediation?: RemediationPlan;
}

export interface Evidence {
  id: string;
  type: 'document' | 'screenshot' | 'log' | 'configuration' | 'attestation';
  name: string;
  description: string;
  collectedAt: string;
  collectedBy: string;
  expiresAt?: string;
  fileUrl?: string;
}

export interface Finding {
  id: string;
  title: string;
  description: string;
  severity: FindingSeverity;
  discoveredAt: string;
  status: 'open' | 'in_progress' | 'resolved' | 'accepted_risk';
  assignedTo?: string;
  dueDate?: string;
  resolvedAt?: string;
  resolution?: string;
}

export interface RemediationPlan {
  id: string;
  title: string;
  description: string;
  steps: RemediationStep[];
  owner: string;
  dueDate: string;
  status: 'planned' | 'in_progress' | 'completed' | 'overdue';
  progress: number;
}

export interface RemediationStep {
  id: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  completedAt?: string;
  completedBy?: string;
}

export interface ComplianceReport {
  id: string;
  name: string;
  framework: ComplianceFramework;
  generatedAt: string;
  generatedBy: string;
  period: { start: string; end: string };
  overallScore: number;
  previousScore?: number;
  scoreChange?: number;
  summary: ReportSummary;
  controls: ControlAssessment[];
  findings: Finding[];
  recommendations: Recommendation[];
  executiveSummary: string;
  format: ReportFormat;
  fileUrl?: string;
}

export interface ReportSummary {
  totalControls: number;
  compliantControls: number;
  partialControls: number;
  nonCompliantControls: number;
  notAssessedControls: number;
  criticalFindings: number;
  highFindings: number;
  mediumFindings: number;
  lowFindings: number;
  openRemediations: number;
  overdueRemediations: number;
}

export interface ControlAssessment {
  controlId: string;
  controlName: string;
  category: string;
  status: ControlStatus;
  score: number;
  evidenceCount: number;
  findingCount: number;
  lastAssessed: string;
  trend: 'improving' | 'stable' | 'declining';
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  effort: 'minimal' | 'moderate' | 'significant';
  impact: string;
  relatedControls: string[];
}

export interface ReportSchedule {
  id: string;
  name: string;
  framework: ComplianceFramework;
  frequency: ReportFrequency;
  cronExpression?: string;
  nextRun: string;
  lastRun?: string;
  recipients: string[];
  format: ReportFormat;
  enabled: boolean;
  includeExecutiveSummary: boolean;
  includeRecommendations: boolean;
  includeEvidence: boolean;
}

export interface ReportDistribution {
  id: string;
  reportId: string;
  recipients: string[];
  sentAt: string;
  deliveryStatus: 'pending' | 'sent' | 'failed';
  openedBy: string[];
}

// ==========================================
// Compliance Control Database
// ==========================================

interface ControlDefinition {
  id: string;
  framework: ComplianceFramework;
  controlId: string;
  name: string;
  description: string;
  category: string;
}

const CONTROL_DEFINITIONS: ControlDefinition[] = [
  // HIPAA Controls
  { id: 'hipaa_164_308_a1', framework: 'HIPAA', controlId: '164.308(a)(1)', name: 'Security Management Process', description: 'Implement policies and procedures to prevent, detect, contain, and correct security violations', category: 'Administrative Safeguards' },
  { id: 'hipaa_164_308_a3', framework: 'HIPAA', controlId: '164.308(a)(3)', name: 'Workforce Security', description: 'Implement policies and procedures to ensure workforce members have appropriate access', category: 'Administrative Safeguards' },
  { id: 'hipaa_164_308_a4', framework: 'HIPAA', controlId: '164.308(a)(4)', name: 'Information Access Management', description: 'Implement policies and procedures for authorizing access to ePHI', category: 'Administrative Safeguards' },
  { id: 'hipaa_164_308_a5', framework: 'HIPAA', controlId: '164.308(a)(5)', name: 'Security Awareness Training', description: 'Implement security awareness and training program for workforce', category: 'Administrative Safeguards' },
  { id: 'hipaa_164_310_a1', framework: 'HIPAA', controlId: '164.310(a)(1)', name: 'Facility Access Controls', description: 'Implement policies to limit physical access to electronic information systems', category: 'Physical Safeguards' },
  { id: 'hipaa_164_312_a1', framework: 'HIPAA', controlId: '164.312(a)(1)', name: 'Access Control', description: 'Implement technical policies for electronic information systems access', category: 'Technical Safeguards' },
  { id: 'hipaa_164_312_b', framework: 'HIPAA', controlId: '164.312(b)', name: 'Audit Controls', description: 'Implement hardware, software, and procedural mechanisms for audit trails', category: 'Technical Safeguards' },
  { id: 'hipaa_164_312_c1', framework: 'HIPAA', controlId: '164.312(c)(1)', name: 'Integrity', description: 'Implement policies to protect ePHI from improper alteration or destruction', category: 'Technical Safeguards' },
  { id: 'hipaa_164_312_d', framework: 'HIPAA', controlId: '164.312(d)', name: 'Person or Entity Authentication', description: 'Implement procedures to verify identity of persons seeking access', category: 'Technical Safeguards' },
  { id: 'hipaa_164_312_e1', framework: 'HIPAA', controlId: '164.312(e)(1)', name: 'Transmission Security', description: 'Implement technical security measures to guard against unauthorized access during transmission', category: 'Technical Safeguards' },
  
  // Australian Privacy Act Controls
  { id: 'apa_app1', framework: 'AUSTRALIAN_PRIVACY', controlId: 'APP 1', name: 'Open and Transparent Management', description: 'Manage personal information in an open and transparent way', category: 'Privacy Principles' },
  { id: 'apa_app2', framework: 'AUSTRALIAN_PRIVACY', controlId: 'APP 2', name: 'Anonymity and Pseudonymity', description: 'Give individuals option to not identify themselves', category: 'Privacy Principles' },
  { id: 'apa_app3', framework: 'AUSTRALIAN_PRIVACY', controlId: 'APP 3', name: 'Collection of Solicited Information', description: 'Only collect personal information that is reasonably necessary', category: 'Privacy Principles' },
  { id: 'apa_app6', framework: 'AUSTRALIAN_PRIVACY', controlId: 'APP 6', name: 'Use or Disclosure', description: 'Only use or disclose personal information for purpose of collection', category: 'Privacy Principles' },
  { id: 'apa_app7', framework: 'AUSTRALIAN_PRIVACY', controlId: 'APP 7', name: 'Direct Marketing', description: 'Do not use personal information for direct marketing without consent', category: 'Privacy Principles' },
  { id: 'apa_app11', framework: 'AUSTRALIAN_PRIVACY', controlId: 'APP 11', name: 'Security of Personal Information', description: 'Take reasonable steps to protect personal information', category: 'Privacy Principles' },
  { id: 'apa_app12', framework: 'AUSTRALIAN_PRIVACY', controlId: 'APP 12', name: 'Access to Personal Information', description: 'Give individuals access to their personal information', category: 'Privacy Principles' },
  { id: 'apa_app13', framework: 'AUSTRALIAN_PRIVACY', controlId: 'APP 13', name: 'Correction of Personal Information', description: 'Correct personal information upon request', category: 'Privacy Principles' },
  
  // ISO 27001 Controls
  { id: 'iso_a5', framework: 'ISO_27001', controlId: 'A.5', name: 'Information Security Policies', description: 'Management direction for information security', category: 'Organizational Controls' },
  { id: 'iso_a6', framework: 'ISO_27001', controlId: 'A.6', name: 'Organization of Information Security', description: 'Internal organization and mobile devices/teleworking', category: 'Organizational Controls' },
  { id: 'iso_a7', framework: 'ISO_27001', controlId: 'A.7', name: 'Human Resource Security', description: 'Prior to, during, and termination of employment', category: 'People Controls' },
  { id: 'iso_a8', framework: 'ISO_27001', controlId: 'A.8', name: 'Asset Management', description: 'Responsibility for assets and information classification', category: 'Asset Controls' },
  { id: 'iso_a9', framework: 'ISO_27001', controlId: 'A.9', name: 'Access Control', description: 'Business requirements and user access management', category: 'Access Controls' },
  { id: 'iso_a10', framework: 'ISO_27001', controlId: 'A.10', name: 'Cryptography', description: 'Cryptographic controls and key management', category: 'Cryptographic Controls' },
  { id: 'iso_a12', framework: 'ISO_27001', controlId: 'A.12', name: 'Operations Security', description: 'Operational procedures and responsibilities', category: 'Operational Controls' },
  { id: 'iso_a13', framework: 'ISO_27001', controlId: 'A.13', name: 'Communications Security', description: 'Network security and information transfer', category: 'Communications Controls' },
  
  // NSQHS Controls
  { id: 'nsqhs_1', framework: 'NSQHS', controlId: 'Standard 1', name: 'Clinical Governance', description: 'Governance, leadership and culture', category: 'Governance' },
  { id: 'nsqhs_2', framework: 'NSQHS', controlId: 'Standard 2', name: 'Partnering with Consumers', description: 'Consumer partnership in service planning', category: 'Consumer Partnership' },
  { id: 'nsqhs_3', framework: 'NSQHS', controlId: 'Standard 3', name: 'Preventing and Controlling Infections', description: 'Infection prevention and control systems', category: 'Infection Control' },
  { id: 'nsqhs_4', framework: 'NSQHS', controlId: 'Standard 4', name: 'Medication Safety', description: 'Medication management processes', category: 'Medication Safety' },
  { id: 'nsqhs_5', framework: 'NSQHS', controlId: 'Standard 5', name: 'Comprehensive Care', description: 'Comprehensive care delivery', category: 'Care Delivery' },
  { id: 'nsqhs_6', framework: 'NSQHS', controlId: 'Standard 6', name: 'Communicating for Safety', description: 'Communication at clinical handover', category: 'Communication' },
  { id: 'nsqhs_7', framework: 'NSQHS', controlId: 'Standard 7', name: 'Blood Management', description: 'Blood and blood products management', category: 'Blood Management' },
  { id: 'nsqhs_8', framework: 'NSQHS', controlId: 'Standard 8', name: 'Recognising and Responding to Acute Deterioration', description: 'Recognition and response systems', category: 'Acute Care' },
];

// ==========================================
// Service Class
// ==========================================

class ComplianceReportingService {
  private static instance: ComplianceReportingService;
  private controls: ComplianceControl[] = [];
  private reports: ComplianceReport[] = [];
  private schedules: ReportSchedule[] = [];
  private distributions: ReportDistribution[] = [];
  private listeners: Set<(event: string, data: unknown) => void> = new Set();

  private constructor() {
    this.loadData();
  }

  static getInstance(): ComplianceReportingService {
    if (!ComplianceReportingService.instance) {
      ComplianceReportingService.instance = new ComplianceReportingService();
    }
    return ComplianceReportingService.instance;
  }

  // ==========================================
  // Event System
  // ==========================================

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
      const [controls, reports, schedules, distributions] = await Promise.all([
        AsyncStorage.getItem('compliance_controls'),
        AsyncStorage.getItem('compliance_reports'),
        AsyncStorage.getItem('compliance_schedules'),
        AsyncStorage.getItem('compliance_distributions'),
      ]);
      
      if (controls) this.controls = JSON.parse(controls);
      if (reports) this.reports = JSON.parse(reports);
      if (schedules) this.schedules = JSON.parse(schedules);
      if (distributions) this.distributions = JSON.parse(distributions);

      // Initialize controls if empty
      if (this.controls.length === 0) {
        await this.initializeControls();
      }
    } catch (error) {
      console.error('Failed to load compliance data:', error);
    }
  }

  private async saveData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem('compliance_controls', JSON.stringify(this.controls)),
        AsyncStorage.setItem('compliance_reports', JSON.stringify(this.reports.slice(0, 100))),
        AsyncStorage.setItem('compliance_schedules', JSON.stringify(this.schedules)),
        AsyncStorage.setItem('compliance_distributions', JSON.stringify(this.distributions.slice(0, 500))),
      ]);
    } catch (error) {
      console.error('Failed to save compliance data:', error);
    }
  }

  private async initializeControls(): Promise<void> {
    this.controls = CONTROL_DEFINITIONS.map(def => ({
      id: def.id,
      framework: def.framework,
      controlId: def.controlId,
      name: def.name,
      description: def.description,
      category: def.category,
      status: 'not_assessed' as ControlStatus,
      lastAssessed: '',
      evidence: [],
      findings: [],
    }));
    await this.saveData();
  }

  // ==========================================
  // Control Management
  // ==========================================

  getControls(framework?: ComplianceFramework): ComplianceControl[] {
    if (framework) {
      return this.controls.filter(c => c.framework === framework);
    }
    return [...this.controls];
  }

  getControl(controlId: string): ComplianceControl | undefined {
    return this.controls.find(c => c.id === controlId);
  }

  async updateControlStatus(
    controlId: string,
    status: ControlStatus,
    assessedBy: string
  ): Promise<void> {
    const control = this.controls.find(c => c.id === controlId);
    if (control) {
      control.status = status;
      control.lastAssessed = new Date().toISOString();
      await this.saveData();
      this.emit('control_updated', control);
    }
  }

  async addEvidence(controlId: string, evidence: Omit<Evidence, 'id'>): Promise<Evidence> {
    const control = this.controls.find(c => c.id === controlId);
    if (!control) {
      throw new Error(`Control ${controlId} not found`);
    }

    const newEvidence: Evidence = {
      ...evidence,
      id: `evidence_${Date.now()}`,
    };

    control.evidence.push(newEvidence);
    await this.saveData();
    this.emit('evidence_added', { controlId, evidence: newEvidence });
    return newEvidence;
  }

  async addFinding(controlId: string, finding: Omit<Finding, 'id'>): Promise<Finding> {
    const control = this.controls.find(c => c.id === controlId);
    if (!control) {
      throw new Error(`Control ${controlId} not found`);
    }

    const newFinding: Finding = {
      ...finding,
      id: `finding_${Date.now()}`,
    };

    control.findings.push(newFinding);
    await this.saveData();
    this.emit('finding_added', { controlId, finding: newFinding });
    return newFinding;
  }

  async updateFinding(controlId: string, findingId: string, updates: Partial<Finding>): Promise<void> {
    const control = this.controls.find(c => c.id === controlId);
    if (control) {
      const finding = control.findings.find(f => f.id === findingId);
      if (finding) {
        Object.assign(finding, updates);
        await this.saveData();
        this.emit('finding_updated', { controlId, findingId, updates });
      }
    }
  }

  // ==========================================
  // Report Generation
  // ==========================================

  async generateReport(
    framework: ComplianceFramework,
    generatedBy: string,
    options: {
      name?: string;
      format?: ReportFormat;
      includeExecutiveSummary?: boolean;
      includeRecommendations?: boolean;
      periodStart?: string;
      periodEnd?: string;
    } = {}
  ): Promise<ComplianceReport> {
    const frameworkControls = this.controls.filter(c => c.framework === framework);
    const now = new Date().toISOString();
    
    // Calculate summary
    const summary: ReportSummary = {
      totalControls: frameworkControls.length,
      compliantControls: frameworkControls.filter(c => c.status === 'compliant').length,
      partialControls: frameworkControls.filter(c => c.status === 'partial').length,
      nonCompliantControls: frameworkControls.filter(c => c.status === 'non_compliant').length,
      notAssessedControls: frameworkControls.filter(c => c.status === 'not_assessed' || c.status === 'not_applicable').length,
      criticalFindings: 0,
      highFindings: 0,
      mediumFindings: 0,
      lowFindings: 0,
      openRemediations: 0,
      overdueRemediations: 0,
    };

    // Collect all findings
    const allFindings: Finding[] = [];
    frameworkControls.forEach(control => {
      control.findings.forEach(finding => {
        allFindings.push(finding);
        if (finding.status === 'open' || finding.status === 'in_progress') {
          switch (finding.severity) {
            case 'critical': summary.criticalFindings++; break;
            case 'high': summary.highFindings++; break;
            case 'medium': summary.mediumFindings++; break;
            case 'low': summary.lowFindings++; break;
          }
        }
      });
      if (control.remediation) {
        if (control.remediation.status !== 'completed') {
          summary.openRemediations++;
          if (new Date(control.remediation.dueDate) < new Date()) {
            summary.overdueRemediations++;
          }
        }
      }
    });

    // Calculate overall score
    const assessedControls = frameworkControls.filter(c => c.status !== 'not_assessed' && c.status !== 'not_applicable');
    const overallScore = assessedControls.length > 0
      ? Math.round((summary.compliantControls + summary.partialControls * 0.5) / assessedControls.length * 100)
      : 0;

    // Get previous report for comparison
    const previousReport = this.reports.find(r => r.framework === framework);
    const scoreChange = previousReport ? overallScore - previousReport.overallScore : undefined;

    // Generate control assessments
    const controlAssessments: ControlAssessment[] = frameworkControls.map(control => {
      const prevControl = previousReport?.controls.find(c => c.controlId === control.controlId);
      let trend: 'improving' | 'stable' | 'declining' = 'stable';
      if (prevControl) {
        const statusScore = { compliant: 100, partial: 50, non_compliant: 0, not_applicable: 0, not_assessed: 0 };
        const currentScore = statusScore[control.status];
        const prevScore = statusScore[prevControl.status];
        if (currentScore > prevScore) trend = 'improving';
        else if (currentScore < prevScore) trend = 'declining';
      }

      return {
        controlId: control.controlId,
        controlName: control.name,
        category: control.category,
        status: control.status,
        score: control.status === 'compliant' ? 100 : control.status === 'partial' ? 50 : 0,
        evidenceCount: control.evidence.length,
        findingCount: control.findings.filter(f => f.status !== 'resolved').length,
        lastAssessed: control.lastAssessed,
        trend,
      };
    });

    // Generate recommendations
    const recommendations: Recommendation[] = [];
    
    // Critical findings recommendation
    if (summary.criticalFindings > 0) {
      recommendations.push({
        id: 'rec_critical',
        title: 'Address Critical Findings Immediately',
        description: `${summary.criticalFindings} critical finding(s) require immediate attention`,
        priority: 'critical',
        effort: 'significant',
        impact: 'Reduces critical risk exposure',
        relatedControls: frameworkControls.filter(c => c.findings.some(f => f.severity === 'critical' && f.status === 'open')).map(c => c.controlId),
      });
    }

    // Non-compliant controls recommendation
    if (summary.nonCompliantControls > 0) {
      recommendations.push({
        id: 'rec_non_compliant',
        title: 'Remediate Non-Compliant Controls',
        description: `${summary.nonCompliantControls} control(s) are non-compliant and require remediation`,
        priority: 'high',
        effort: 'moderate',
        impact: 'Improves overall compliance score',
        relatedControls: frameworkControls.filter(c => c.status === 'non_compliant').map(c => c.controlId),
      });
    }

    // Overdue remediations recommendation
    if (summary.overdueRemediations > 0) {
      recommendations.push({
        id: 'rec_overdue',
        title: 'Complete Overdue Remediations',
        description: `${summary.overdueRemediations} remediation plan(s) are past due date`,
        priority: 'high',
        effort: 'moderate',
        impact: 'Closes open compliance gaps',
        relatedControls: frameworkControls.filter(c => c.remediation && c.remediation.status !== 'completed' && new Date(c.remediation.dueDate) < new Date()).map(c => c.controlId),
      });
    }

    // Not assessed controls recommendation
    if (summary.notAssessedControls > 0) {
      recommendations.push({
        id: 'rec_assess',
        title: 'Complete Control Assessments',
        description: `${summary.notAssessedControls} control(s) have not been assessed`,
        priority: 'medium',
        effort: 'moderate',
        impact: 'Provides complete compliance visibility',
        relatedControls: frameworkControls.filter(c => c.status === 'not_assessed').map(c => c.controlId),
      });
    }

    // Generate executive summary
    const executiveSummary = this.generateExecutiveSummary(framework, overallScore, summary, scoreChange);

    const report: ComplianceReport = {
      id: `report_${Date.now()}`,
      name: options.name || `${framework} Compliance Report`,
      framework,
      generatedAt: now,
      generatedBy,
      period: {
        start: options.periodStart || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: options.periodEnd || now,
      },
      overallScore,
      previousScore: previousReport?.overallScore,
      scoreChange,
      summary,
      controls: controlAssessments,
      findings: allFindings.filter(f => f.status !== 'resolved'),
      recommendations,
      executiveSummary,
      format: options.format || 'pdf',
    };

    this.reports.unshift(report);
    if (this.reports.length > 100) {
      this.reports = this.reports.slice(0, 100);
    }
    await this.saveData();

    this.emit('report_generated', report);
    return report;
  }

  private generateExecutiveSummary(
    framework: ComplianceFramework,
    score: number,
    summary: ReportSummary,
    scoreChange?: number
  ): string {
    const frameworkNames: Record<ComplianceFramework, string> = {
      HIPAA: 'HIPAA',
      AUSTRALIAN_PRIVACY: 'Australian Privacy Act',
      ISO_27001: 'ISO 27001',
      NSQHS: 'National Safety and Quality Health Service Standards',
      PCI_DSS: 'PCI DSS',
      SOC2: 'SOC 2',
    };

    let summary_text = `This report presents the ${frameworkNames[framework]} compliance assessment for MediVac One Virtual Hospital. `;
    
    summary_text += `The overall compliance score is ${score}%, `;
    if (scoreChange !== undefined) {
      if (scoreChange > 0) {
        summary_text += `representing an improvement of ${scoreChange} percentage points from the previous assessment. `;
      } else if (scoreChange < 0) {
        summary_text += `representing a decline of ${Math.abs(scoreChange)} percentage points from the previous assessment. `;
      } else {
        summary_text += `which is unchanged from the previous assessment. `;
      }
    }

    summary_text += `\n\nOf the ${summary.totalControls} controls assessed, ${summary.compliantControls} are fully compliant, ${summary.partialControls} are partially compliant, and ${summary.nonCompliantControls} are non-compliant. `;
    
    if (summary.criticalFindings > 0 || summary.highFindings > 0) {
      summary_text += `\n\nImmediate attention is required for ${summary.criticalFindings} critical and ${summary.highFindings} high-severity findings. `;
    }

    if (summary.overdueRemediations > 0) {
      summary_text += `There are ${summary.overdueRemediations} overdue remediation plans that require escalation. `;
    }

    summary_text += `\n\nKey recommendations include addressing critical findings, completing pending assessments, and maintaining evidence documentation for all controls.`;

    return summary_text;
  }

  // ==========================================
  // Schedule Management
  // ==========================================

  async createSchedule(schedule: Omit<ReportSchedule, 'id' | 'lastRun'>): Promise<ReportSchedule> {
    const newSchedule: ReportSchedule = {
      ...schedule,
      id: `schedule_${Date.now()}`,
    };

    this.schedules.push(newSchedule);
    await this.saveData();
    this.emit('schedule_created', newSchedule);
    return newSchedule;
  }

  async updateSchedule(scheduleId: string, updates: Partial<ReportSchedule>): Promise<void> {
    const index = this.schedules.findIndex(s => s.id === scheduleId);
    if (index >= 0) {
      this.schedules[index] = { ...this.schedules[index], ...updates };
      await this.saveData();
      this.emit('schedule_updated', this.schedules[index]);
    }
  }

  async deleteSchedule(scheduleId: string): Promise<void> {
    this.schedules = this.schedules.filter(s => s.id !== scheduleId);
    await this.saveData();
    this.emit('schedule_deleted', scheduleId);
  }

  getSchedules(): ReportSchedule[] {
    return [...this.schedules];
  }

  async runScheduledReport(scheduleId: string): Promise<ComplianceReport> {
    const schedule = this.schedules.find(s => s.id === scheduleId);
    if (!schedule) {
      throw new Error(`Schedule ${scheduleId} not found`);
    }

    const report = await this.generateReport(schedule.framework, 'system', {
      name: schedule.name,
      format: schedule.format,
      includeExecutiveSummary: schedule.includeExecutiveSummary,
      includeRecommendations: schedule.includeRecommendations,
    });

    // Update schedule
    schedule.lastRun = new Date().toISOString();
    schedule.nextRun = this.calculateNextRun(schedule.frequency, schedule.cronExpression);
    await this.saveData();

    // Distribute report
    if (schedule.recipients.length > 0) {
      await this.distributeReport(report.id, schedule.recipients);
    }

    return report;
  }

  private calculateNextRun(frequency: ReportFrequency, cronExpression?: string): string {
    const now = new Date();
    switch (frequency) {
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      case 'monthly':
        return new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
      case 'quarterly':
        return new Date(now.getFullYear(), now.getMonth() + 3, 1).toISOString();
      case 'annual':
        return new Date(now.getFullYear() + 1, 0, 1).toISOString();
      default:
        return now.toISOString();
    }
  }

  // ==========================================
  // Report Distribution
  // ==========================================

  async distributeReport(reportId: string, recipients: string[]): Promise<ReportDistribution> {
    const distribution: ReportDistribution = {
      id: `dist_${Date.now()}`,
      reportId,
      recipients,
      sentAt: new Date().toISOString(),
      deliveryStatus: 'sent',
      openedBy: [],
    };

    this.distributions.push(distribution);
    await this.saveData();
    this.emit('report_distributed', distribution);
    return distribution;
  }

  getDistributions(reportId?: string): ReportDistribution[] {
    if (reportId) {
      return this.distributions.filter(d => d.reportId === reportId);
    }
    return [...this.distributions];
  }

  // ==========================================
  // Reports & Analytics
  // ==========================================

  getReports(framework?: ComplianceFramework): ComplianceReport[] {
    if (framework) {
      return this.reports.filter(r => r.framework === framework);
    }
    return [...this.reports];
  }

  getReport(reportId: string): ComplianceReport | undefined {
    return this.reports.find(r => r.id === reportId);
  }

  getComplianceTrend(framework: ComplianceFramework, months: number = 12): { date: string; score: number }[] {
    const cutoff = Date.now() - months * 30 * 24 * 60 * 60 * 1000;
    return this.reports
      .filter(r => r.framework === framework && new Date(r.generatedAt).getTime() > cutoff)
      .map(r => ({
        date: r.generatedAt.split('T')[0],
        score: r.overallScore,
      }))
      .reverse();
  }

  getFrameworkSummary(): Record<ComplianceFramework, { score: number; lastAssessed: string; controlCount: number }> {
    const frameworks: ComplianceFramework[] = ['HIPAA', 'AUSTRALIAN_PRIVACY', 'ISO_27001', 'NSQHS', 'PCI_DSS', 'SOC2'];
    const summary: Record<string, { score: number; lastAssessed: string; controlCount: number }> = {};

    frameworks.forEach(framework => {
      const frameworkControls = this.controls.filter(c => c.framework === framework);
      const assessed = frameworkControls.filter(c => c.status !== 'not_assessed' && c.status !== 'not_applicable');
      const compliant = frameworkControls.filter(c => c.status === 'compliant').length;
      const partial = frameworkControls.filter(c => c.status === 'partial').length;
      
      const score = assessed.length > 0
        ? Math.round((compliant + partial * 0.5) / assessed.length * 100)
        : 0;

      const lastReport = this.reports.find(r => r.framework === framework);

      summary[framework] = {
        score,
        lastAssessed: lastReport?.generatedAt || '',
        controlCount: frameworkControls.length,
      };
    });

    return summary as Record<ComplianceFramework, { score: number; lastAssessed: string; controlCount: number }>;
  }
}

export const complianceReportingService = ComplianceReportingService.getInstance();
