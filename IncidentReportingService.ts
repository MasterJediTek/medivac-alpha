/**
 * Incident Reporting Service
 * MediVac One v3.2 - Safety Event Management
 * 
 * Comprehensive incident reporting with root cause analysis,
 * corrective action tracking, and regulatory compliance.
 */

// Incident Types
export type IncidentCategory = 
  | 'fall'
  | 'medication_error'
  | 'near_miss'
  | 'adverse_event'
  | 'equipment_failure'
  | 'security_breach'
  | 'patient_complaint'
  | 'staff_injury'
  | 'infection'
  | 'other';

export type IncidentSeverity = 
  | 'near_miss'      // No harm, caught before reaching patient
  | 'minor'          // Temporary harm, no intervention needed
  | 'moderate'       // Temporary harm, intervention required
  | 'major'          // Permanent harm or prolonged hospitalization
  | 'sentinel'       // Death or serious physical/psychological injury
  | 'catastrophic';  // Multiple patients affected

export type IncidentStatus = 
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'investigation'
  | 'root_cause_analysis'
  | 'corrective_action'
  | 'closed'
  | 'reopened';

// Root Cause Categories (based on TJC framework)
export type RootCauseCategory = 
  | 'human_factors'
  | 'communication'
  | 'training'
  | 'fatigue'
  | 'equipment'
  | 'environment'
  | 'rules_policies'
  | 'barriers'
  | 'leadership';

export interface IncidentReport {
  id: string;
  reportNumber: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  status: IncidentStatus;
  
  // Event Details
  eventDate: Date;
  eventTime: string;
  location: string;
  unit: string;
  
  // Description
  description: string;
  immediateActions: string;
  witnesses: string[];
  
  // Patient Info (optional for anonymous)
  patientId?: string;
  patientName?: string;
  patientMRN?: string;
  
  // Reporter Info
  reporterId: string;
  reporterName: string;
  reporterRole: string;
  isAnonymous: boolean;
  
  // Investigation
  investigatorId?: string;
  investigatorName?: string;
  investigationStartDate?: Date;
  investigationFindings?: string;
  
  // Root Cause Analysis
  rootCauses: RootCauseAnalysis[];
  contributingFactors: string[];
  
  // Corrective Actions
  correctiveActions: CorrectiveAction[];
  
  // Regulatory
  reportableToTJC: boolean;
  reportableToCMS: boolean;
  reportableToState: boolean;
  externalReportDate?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
}

export interface RootCauseAnalysis {
  id: string;
  category: RootCauseCategory;
  description: string;
  whyAnalysis: string[]; // 5 Whys
  fishboneFactor?: string;
  isPrimary: boolean;
}

export interface CorrectiveAction {
  id: string;
  description: string;
  actionType: 'immediate' | 'short_term' | 'long_term' | 'systemic';
  assignedTo: string;
  assignedToName: string;
  dueDate: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
  completedDate?: Date;
  effectivenessReview?: string;
  effectivenessDate?: Date;
}

export interface IncidentTrend {
  category: IncidentCategory;
  count: number;
  percentChange: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface IncidentAnalytics {
  totalIncidents: number;
  byCategory: Record<IncidentCategory, number>;
  bySeverity: Record<IncidentSeverity, number>;
  byUnit: Record<string, number>;
  byMonth: { month: string; count: number }[];
  averageResolutionDays: number;
  openIncidents: number;
  overdueActions: number;
}

// Mock data storage
const incidents: Map<string, IncidentReport> = new Map();
let reportCounter = 1000;

/**
 * Incident Reporting Service
 */
export const IncidentReportingService = {
  /**
   * Create a new incident report
   */
  createReport(data: Partial<IncidentReport>): IncidentReport {
    reportCounter++;
    const id = `INC-${Date.now()}`;
    const reportNumber = `IR-${new Date().getFullYear()}-${reportCounter}`;
    
    const report: IncidentReport = {
      id,
      reportNumber,
      category: data.category || 'other',
      severity: data.severity || 'minor',
      status: 'draft',
      eventDate: data.eventDate || new Date(),
      eventTime: data.eventTime || new Date().toTimeString().slice(0, 5),
      location: data.location || '',
      unit: data.unit || '',
      description: data.description || '',
      immediateActions: data.immediateActions || '',
      witnesses: data.witnesses || [],
      patientId: data.patientId,
      patientName: data.patientName,
      patientMRN: data.patientMRN,
      reporterId: data.reporterId || 'anonymous',
      reporterName: data.isAnonymous ? 'Anonymous' : (data.reporterName || ''),
      reporterRole: data.reporterRole || '',
      isAnonymous: data.isAnonymous || false,
      rootCauses: [],
      contributingFactors: [],
      correctiveActions: [],
      reportableToTJC: data.severity === 'sentinel' || data.severity === 'catastrophic',
      reportableToCMS: data.severity === 'sentinel' || data.severity === 'catastrophic',
      reportableToState: data.severity === 'major' || data.severity === 'sentinel' || data.severity === 'catastrophic',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    incidents.set(id, report);
    return report;
  },

  /**
   * Submit a draft report
   */
  submitReport(reportId: string): IncidentReport | null {
    const report = incidents.get(reportId);
    if (!report) return null;
    
    report.status = 'submitted';
    report.updatedAt = new Date();
    
    // Auto-escalate sentinel events
    if (report.severity === 'sentinel' || report.severity === 'catastrophic') {
      this.escalateToLeadership(reportId);
    }
    
    return report;
  },

  /**
   * Assign investigator to incident
   */
  assignInvestigator(reportId: string, investigatorId: string, investigatorName: string): IncidentReport | null {
    const report = incidents.get(reportId);
    if (!report) return null;
    
    report.investigatorId = investigatorId;
    report.investigatorName = investigatorName;
    report.investigationStartDate = new Date();
    report.status = 'investigation';
    report.updatedAt = new Date();
    
    return report;
  },

  /**
   * Add root cause analysis
   */
  addRootCause(reportId: string, rootCause: Omit<RootCauseAnalysis, 'id'>): IncidentReport | null {
    const report = incidents.get(reportId);
    if (!report) return null;
    
    const rca: RootCauseAnalysis = {
      id: `RCA-${Date.now()}`,
      ...rootCause,
    };
    
    report.rootCauses.push(rca);
    report.status = 'root_cause_analysis';
    report.updatedAt = new Date();
    
    return report;
  },

  /**
   * Perform 5 Whys analysis
   */
  performFiveWhys(reportId: string, rcaId: string, whys: string[]): RootCauseAnalysis | null {
    const report = incidents.get(reportId);
    if (!report) return null;
    
    const rca = report.rootCauses.find(r => r.id === rcaId);
    if (!rca) return null;
    
    rca.whyAnalysis = whys.slice(0, 5);
    report.updatedAt = new Date();
    
    return rca;
  },

  /**
   * Add corrective action
   */
  addCorrectiveAction(reportId: string, action: Omit<CorrectiveAction, 'id' | 'status'>): IncidentReport | null {
    const report = incidents.get(reportId);
    if (!report) return null;
    
    const correctiveAction: CorrectiveAction = {
      id: `CA-${Date.now()}`,
      status: 'pending',
      ...action,
    };
    
    report.correctiveActions.push(correctiveAction);
    report.status = 'corrective_action';
    report.updatedAt = new Date();
    
    return report;
  },

  /**
   * Update corrective action status
   */
  updateCorrectiveAction(reportId: string, actionId: string, status: CorrectiveAction['status']): CorrectiveAction | null {
    const report = incidents.get(reportId);
    if (!report) return null;
    
    const action = report.correctiveActions.find(a => a.id === actionId);
    if (!action) return null;
    
    action.status = status;
    if (status === 'completed') {
      action.completedDate = new Date();
    }
    report.updatedAt = new Date();
    
    // Check if all actions completed
    const allCompleted = report.correctiveActions.every(a => a.status === 'completed' || a.status === 'cancelled');
    if (allCompleted && report.correctiveActions.length > 0) {
      report.status = 'closed';
      report.closedAt = new Date();
    }
    
    return action;
  },

  /**
   * Close incident report
   */
  closeReport(reportId: string): IncidentReport | null {
    const report = incidents.get(reportId);
    if (!report) return null;
    
    report.status = 'closed';
    report.closedAt = new Date();
    report.updatedAt = new Date();
    
    return report;
  },

  /**
   * Reopen incident report
   */
  reopenReport(reportId: string, reason: string): IncidentReport | null {
    const report = incidents.get(reportId);
    if (!report) return null;
    
    report.status = 'reopened';
    report.closedAt = undefined;
    report.contributingFactors.push(`Reopened: ${reason}`);
    report.updatedAt = new Date();
    
    return report;
  },

  /**
   * Get incident by ID
   */
  getReport(reportId: string): IncidentReport | null {
    return incidents.get(reportId) || null;
  },

  /**
   * Get all incidents
   */
  getAllReports(): IncidentReport[] {
    return Array.from(incidents.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  },

  /**
   * Get incidents by status
   */
  getReportsByStatus(status: IncidentStatus): IncidentReport[] {
    return this.getAllReports().filter(r => r.status === status);
  },

  /**
   * Get incidents by category
   */
  getReportsByCategory(category: IncidentCategory): IncidentReport[] {
    return this.getAllReports().filter(r => r.category === category);
  },

  /**
   * Get incidents by unit
   */
  getReportsByUnit(unit: string): IncidentReport[] {
    return this.getAllReports().filter(r => r.unit === unit);
  },

  /**
   * Get open incidents count
   */
  getOpenIncidentsCount(): number {
    return this.getAllReports().filter(r => 
      r.status !== 'closed'
    ).length;
  },

  /**
   * Get overdue corrective actions
   */
  getOverdueActions(): { report: IncidentReport; action: CorrectiveAction }[] {
    const overdue: { report: IncidentReport; action: CorrectiveAction }[] = [];
    const now = new Date();
    
    for (const report of this.getAllReports()) {
      for (const action of report.correctiveActions) {
        if (action.status === 'pending' || action.status === 'in_progress') {
          if (new Date(action.dueDate) < now) {
            action.status = 'overdue';
            overdue.push({ report, action });
          }
        }
      }
    }
    
    return overdue;
  },

  /**
   * Escalate to leadership
   */
  escalateToLeadership(reportId: string): void {
    const report = incidents.get(reportId);
    if (!report) return;
    
    // In production, this would send notifications to leadership
    console.log(`[ESCALATION] Incident ${report.reportNumber} escalated to leadership`);
    console.log(`Severity: ${report.severity}, Category: ${report.category}`);
  },

  /**
   * Generate incident analytics
   */
  getAnalytics(startDate?: Date, endDate?: Date): IncidentAnalytics {
    let reports = this.getAllReports();
    
    if (startDate) {
      reports = reports.filter(r => r.createdAt >= startDate);
    }
    if (endDate) {
      reports = reports.filter(r => r.createdAt <= endDate);
    }
    
    const byCategory: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    const byUnit: Record<string, number> = {};
    const byMonth: Record<string, number> = {};
    
    let totalResolutionDays = 0;
    let closedCount = 0;
    
    for (const report of reports) {
      // By category
      byCategory[report.category] = (byCategory[report.category] || 0) + 1;
      
      // By severity
      bySeverity[report.severity] = (bySeverity[report.severity] || 0) + 1;
      
      // By unit
      if (report.unit) {
        byUnit[report.unit] = (byUnit[report.unit] || 0) + 1;
      }
      
      // By month
      const monthKey = `${report.createdAt.getFullYear()}-${String(report.createdAt.getMonth() + 1).padStart(2, '0')}`;
      byMonth[monthKey] = (byMonth[monthKey] || 0) + 1;
      
      // Resolution time
      if (report.closedAt) {
        const days = (report.closedAt.getTime() - report.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        totalResolutionDays += days;
        closedCount++;
      }
    }
    
    const overdueActions = this.getOverdueActions().length;
    
    return {
      totalIncidents: reports.length,
      byCategory: byCategory as Record<IncidentCategory, number>,
      bySeverity: bySeverity as Record<IncidentSeverity, number>,
      byUnit,
      byMonth: Object.entries(byMonth).map(([month, count]) => ({ month, count })).sort((a, b) => a.month.localeCompare(b.month)),
      averageResolutionDays: closedCount > 0 ? Math.round(totalResolutionDays / closedCount) : 0,
      openIncidents: this.getOpenIncidentsCount(),
      overdueActions,
    };
  },

  /**
   * Get incident trends
   */
  getTrends(): IncidentTrend[] {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    
    const recentReports = this.getAllReports().filter(r => r.createdAt >= thirtyDaysAgo);
    const previousReports = this.getAllReports().filter(r => r.createdAt >= sixtyDaysAgo && r.createdAt < thirtyDaysAgo);
    
    const categories: IncidentCategory[] = ['fall', 'medication_error', 'near_miss', 'adverse_event', 'equipment_failure', 'infection'];
    
    return categories.map(category => {
      const recentCount = recentReports.filter(r => r.category === category).length;
      const previousCount = previousReports.filter(r => r.category === category).length;
      
      let percentChange = 0;
      if (previousCount > 0) {
        percentChange = Math.round(((recentCount - previousCount) / previousCount) * 100);
      } else if (recentCount > 0) {
        percentChange = 100;
      }
      
      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (percentChange > 10) trend = 'increasing';
      else if (percentChange < -10) trend = 'decreasing';
      
      return {
        category,
        count: recentCount,
        percentChange,
        trend,
      };
    });
  },

  /**
   * Generate regulatory report
   */
  generateRegulatoryReport(reportId: string, agency: 'TJC' | 'CMS' | 'STATE'): string {
    const report = incidents.get(reportId);
    if (!report) return '';
    
    const reportContent = `
INCIDENT REPORT - ${agency}
Report Number: ${report.reportNumber}
Date of Event: ${report.eventDate.toISOString().split('T')[0]}
Time of Event: ${report.eventTime}

CLASSIFICATION
Category: ${report.category.replace('_', ' ').toUpperCase()}
Severity: ${report.severity.replace('_', ' ').toUpperCase()}

LOCATION
Facility Unit: ${report.unit}
Specific Location: ${report.location}

EVENT DESCRIPTION
${report.description}

IMMEDIATE ACTIONS TAKEN
${report.immediateActions}

ROOT CAUSE ANALYSIS
${report.rootCauses.map(rca => `
- Category: ${rca.category.replace('_', ' ')}
- Description: ${rca.description}
- 5 Whys Analysis:
${rca.whyAnalysis.map((why, i) => `  ${i + 1}. ${why}`).join('\n')}
`).join('\n')}

CORRECTIVE ACTIONS
${report.correctiveActions.map(ca => `
- Action: ${ca.description}
- Type: ${ca.actionType.replace('_', ' ')}
- Assigned To: ${ca.assignedToName}
- Due Date: ${ca.dueDate.toISOString().split('T')[0]}
- Status: ${ca.status}
`).join('\n')}

Report Generated: ${new Date().toISOString()}
    `.trim();
    
    return reportContent;
  },

  /**
   * Clear all incidents (for testing)
   */
  clearAll(): void {
    incidents.clear();
    reportCounter = 1000;
  },
};

export default IncidentReportingService;
