/**
 * Analytics Export Service
 * Disco-themed reports and data export
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// TYPES & INTERFACES
// ============================================

export type ReportType = 'quality' | 'utilization' | 'compliance' | 'financial' | 'patient_satisfaction' | 'custom';
export type ExportFormat = 'pdf' | 'excel' | 'csv' | 'json';
export type TimeRange = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

export interface ReportTemplate {
  id: string;
  name: string;
  type: ReportType;
  description: string;
  icon: string;
  discoColor: string;
  metrics: MetricDefinition[];
  charts: ChartDefinition[];
  filters: FilterDefinition[];
}

export interface MetricDefinition {
  id: string;
  name: string;
  description: string;
  unit: string;
  format: 'number' | 'percentage' | 'currency' | 'duration';
  target?: number;
  warningThreshold?: number;
  criticalThreshold?: number;
}

export interface ChartDefinition {
  id: string;
  title: string;
  type: 'line' | 'bar' | 'pie' | 'gauge' | 'sparkline';
  dataSource: string;
  discoGradient: string[];
}

export interface FilterDefinition {
  id: string;
  name: string;
  type: 'date_range' | 'select' | 'multiselect' | 'search';
  options?: string[];
}

export interface GeneratedReport {
  id: string;
  templateId: string;
  templateName: string;
  generatedAt: number;
  generatedBy: string;
  timeRange: { start: number; end: number };
  filters: Record<string, string | string[]>;
  data: ReportData;
  status: 'generating' | 'completed' | 'failed';
  exportFormats: ExportFormat[];
}

export interface ReportData {
  metrics: MetricValue[];
  charts: ChartData[];
  tables: TableData[];
  summary: string;
}

export interface MetricValue {
  metricId: string;
  name: string;
  value: number;
  previousValue?: number;
  change?: number;
  changeDirection?: 'up' | 'down' | 'stable';
  status: 'good' | 'warning' | 'critical';
  target?: number;
}

export interface ChartData {
  chartId: string;
  title: string;
  type: string;
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color: string;
  }[];
}

export interface TableData {
  title: string;
  headers: string[];
  rows: (string | number)[][];
  totals?: (string | number)[];
}

export interface ScheduledReport {
  id: string;
  reportTemplateId: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  nextRun: number;
  lastRun?: number;
  enabled: boolean;
}

// ============================================
// STORAGE & STATE
// ============================================

const STORAGE_KEYS = {
  REPORTS: 'analytics_reports',
  SCHEDULED: 'scheduled_reports',
};

let reportTemplates: Map<string, ReportTemplate> = new Map();
let generatedReports: Map<string, GeneratedReport> = new Map();
let scheduledReports: Map<string, ScheduledReport> = new Map();
let listeners: Set<() => void> = new Set();

const generateId = (): string => `RPT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
const notifyListeners = (): void => listeners.forEach(l => l());

// ============================================
// DISCO COLORS FOR REPORTS
// ============================================

const REPORT_COLORS = {
  quality: '#FF1493',
  utilization: '#00FFFF',
  compliance: '#BF00FF',
  financial: '#39FF14',
  patient_satisfaction: '#FF6600',
  custom: '#FFFF00',
};

// ============================================
// TEMPLATE DEFINITIONS
// ============================================

const initializeTemplates = (): void => {
  const templateDefs: ReportTemplate[] = [
    {
      id: 'TPL-QUALITY',
      name: 'Quality Metrics Dashboard',
      type: 'quality',
      description: 'Clinical quality indicators and performance metrics',
      icon: '⭐',
      discoColor: REPORT_COLORS.quality,
      metrics: [
        { id: 'readmission_rate', name: '30-Day Readmission Rate', description: 'Percentage of patients readmitted within 30 days', unit: '%', format: 'percentage', target: 15, warningThreshold: 18, criticalThreshold: 22 },
        { id: 'mortality_rate', name: 'Mortality Rate', description: 'In-hospital mortality rate', unit: '%', format: 'percentage', target: 2, warningThreshold: 3, criticalThreshold: 5 },
        { id: 'infection_rate', name: 'Hospital-Acquired Infection Rate', description: 'HAI per 1000 patient days', unit: 'per 1000', format: 'number', target: 1.5, warningThreshold: 2, criticalThreshold: 3 },
        { id: 'fall_rate', name: 'Patient Fall Rate', description: 'Falls per 1000 patient days', unit: 'per 1000', format: 'number', target: 2, warningThreshold: 3, criticalThreshold: 4 },
        { id: 'medication_errors', name: 'Medication Error Rate', description: 'Errors per 1000 doses', unit: 'per 1000', format: 'number', target: 0.5, warningThreshold: 1, criticalThreshold: 2 },
      ],
      charts: [
        { id: 'quality_trend', title: 'Quality Score Trend', type: 'line', dataSource: 'quality_scores', discoGradient: ['#FF1493', '#FF69B4', '#00FFFF'] },
        { id: 'quality_breakdown', title: 'Quality by Department', type: 'bar', dataSource: 'dept_quality', discoGradient: ['#BF00FF', '#FF1493', '#00FFFF'] },
      ],
      filters: [
        { id: 'date_range', name: 'Date Range', type: 'date_range' },
        { id: 'department', name: 'Department', type: 'multiselect', options: ['ICU', 'Med-Surg', 'ED', 'OR', 'L&D', 'Peds'] },
      ],
    },
    {
      id: 'TPL-UTILIZATION',
      name: 'Utilization Analytics',
      type: 'utilization',
      description: 'Resource utilization and capacity metrics',
      icon: '📊',
      discoColor: REPORT_COLORS.utilization,
      metrics: [
        { id: 'bed_occupancy', name: 'Bed Occupancy Rate', description: 'Percentage of beds occupied', unit: '%', format: 'percentage', target: 85, warningThreshold: 90, criticalThreshold: 95 },
        { id: 'avg_los', name: 'Average Length of Stay', description: 'Average days per admission', unit: 'days', format: 'number', target: 4.5, warningThreshold: 5.5, criticalThreshold: 6.5 },
        { id: 'ed_wait_time', name: 'ED Wait Time', description: 'Average ED wait time', unit: 'min', format: 'duration', target: 30, warningThreshold: 45, criticalThreshold: 60 },
        { id: 'or_utilization', name: 'OR Utilization', description: 'Operating room utilization rate', unit: '%', format: 'percentage', target: 80, warningThreshold: 70, criticalThreshold: 60 },
        { id: 'staff_ratio', name: 'Nurse-to-Patient Ratio', description: 'Average patients per nurse', unit: 'ratio', format: 'number', target: 4, warningThreshold: 5, criticalThreshold: 6 },
      ],
      charts: [
        { id: 'occupancy_trend', title: 'Occupancy Trend', type: 'line', dataSource: 'occupancy', discoGradient: ['#00FFFF', '#39FF14', '#FFFF00'] },
        { id: 'los_distribution', title: 'LOS Distribution', type: 'bar', dataSource: 'los_data', discoGradient: ['#00FFFF', '#BF00FF'] },
      ],
      filters: [
        { id: 'date_range', name: 'Date Range', type: 'date_range' },
        { id: 'unit', name: 'Unit', type: 'multiselect', options: ['ICU', 'Med-Surg', 'Telemetry', 'Step-Down', 'Rehab'] },
      ],
    },
    {
      id: 'TPL-COMPLIANCE',
      name: 'Compliance Audit Report',
      type: 'compliance',
      description: 'Regulatory compliance and audit metrics',
      icon: '✅',
      discoColor: REPORT_COLORS.compliance,
      metrics: [
        { id: 'documentation_compliance', name: 'Documentation Compliance', description: 'Percentage of complete documentation', unit: '%', format: 'percentage', target: 95, warningThreshold: 90, criticalThreshold: 85 },
        { id: 'hand_hygiene', name: 'Hand Hygiene Compliance', description: 'Hand hygiene observation compliance', unit: '%', format: 'percentage', target: 95, warningThreshold: 90, criticalThreshold: 85 },
        { id: 'medication_reconciliation', name: 'Med Reconciliation Rate', description: 'Percentage with completed med rec', unit: '%', format: 'percentage', target: 98, warningThreshold: 95, criticalThreshold: 90 },
        { id: 'consent_compliance', name: 'Consent Documentation', description: 'Procedures with proper consent', unit: '%', format: 'percentage', target: 100, warningThreshold: 98, criticalThreshold: 95 },
        { id: 'training_completion', name: 'Training Completion', description: 'Staff with current training', unit: '%', format: 'percentage', target: 100, warningThreshold: 95, criticalThreshold: 90 },
      ],
      charts: [
        { id: 'compliance_trend', title: 'Compliance Trend', type: 'line', dataSource: 'compliance_scores', discoGradient: ['#BF00FF', '#FF1493', '#39FF14'] },
        { id: 'compliance_by_dept', title: 'Compliance by Department', type: 'bar', dataSource: 'dept_compliance', discoGradient: ['#BF00FF', '#00FFFF'] },
      ],
      filters: [
        { id: 'date_range', name: 'Date Range', type: 'date_range' },
        { id: 'compliance_type', name: 'Compliance Type', type: 'multiselect', options: ['Documentation', 'Safety', 'Privacy', 'Training', 'Clinical'] },
      ],
    },
    {
      id: 'TPL-SATISFACTION',
      name: 'Patient Satisfaction',
      type: 'patient_satisfaction',
      description: 'Patient experience and satisfaction scores',
      icon: '😊',
      discoColor: REPORT_COLORS.patient_satisfaction,
      metrics: [
        { id: 'overall_satisfaction', name: 'Overall Satisfaction', description: 'Overall patient satisfaction score', unit: '%', format: 'percentage', target: 90, warningThreshold: 85, criticalThreshold: 80 },
        { id: 'nps_score', name: 'Net Promoter Score', description: 'NPS from patient surveys', unit: 'score', format: 'number', target: 70, warningThreshold: 50, criticalThreshold: 30 },
        { id: 'communication_score', name: 'Communication Score', description: 'Staff communication rating', unit: '%', format: 'percentage', target: 92, warningThreshold: 88, criticalThreshold: 85 },
        { id: 'responsiveness', name: 'Responsiveness Score', description: 'Response to call button', unit: '%', format: 'percentage', target: 90, warningThreshold: 85, criticalThreshold: 80 },
        { id: 'cleanliness', name: 'Cleanliness Score', description: 'Facility cleanliness rating', unit: '%', format: 'percentage', target: 95, warningThreshold: 90, criticalThreshold: 85 },
      ],
      charts: [
        { id: 'satisfaction_trend', title: 'Satisfaction Trend', type: 'line', dataSource: 'satisfaction_scores', discoGradient: ['#FF6600', '#FFFF00', '#39FF14'] },
        { id: 'nps_gauge', title: 'NPS Score', type: 'gauge', dataSource: 'nps', discoGradient: ['#FF073A', '#FFFF00', '#39FF14'] },
      ],
      filters: [
        { id: 'date_range', name: 'Date Range', type: 'date_range' },
        { id: 'survey_type', name: 'Survey Type', type: 'select', options: ['Inpatient', 'Outpatient', 'ED', 'Surgical'] },
      ],
    },
  ];

  templateDefs.forEach(t => reportTemplates.set(t.id, t));
};

// ============================================
// SAMPLE DATA GENERATION
// ============================================

const generateSampleData = (template: ReportTemplate, timeRange: { start: number; end: number }): ReportData => {
  const metrics: MetricValue[] = template.metrics.map(metric => {
    const value = Math.random() * 100;
    const previousValue = value * (0.9 + Math.random() * 0.2);
    const change = ((value - previousValue) / previousValue) * 100;
    
    let status: 'good' | 'warning' | 'critical' = 'good';
    if (metric.criticalThreshold && value >= metric.criticalThreshold) status = 'critical';
    else if (metric.warningThreshold && value >= metric.warningThreshold) status = 'warning';

    return {
      metricId: metric.id,
      name: metric.name,
      value: Math.round(value * 10) / 10,
      previousValue: Math.round(previousValue * 10) / 10,
      change: Math.round(change * 10) / 10,
      changeDirection: change > 1 ? 'up' : change < -1 ? 'down' : 'stable',
      status,
      target: metric.target,
    };
  });

  const charts: ChartData[] = template.charts.map(chart => ({
    chartId: chart.id,
    title: chart.title,
    type: chart.type,
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Current Period',
      data: Array(6).fill(0).map(() => Math.round(Math.random() * 100)),
      color: chart.discoGradient[0],
    }],
  }));

  const tables: TableData[] = [{
    title: 'Detailed Breakdown',
    headers: ['Category', 'Current', 'Previous', 'Change', 'Target'],
    rows: metrics.map(m => [
      m.name,
      m.value.toString(),
      (m.previousValue || 0).toString(),
      `${m.change || 0}%`,
      (m.target || 'N/A').toString(),
    ]),
    totals: ['Total', '-', '-', '-', '-'],
  }];

  return {
    metrics,
    charts,
    tables,
    summary: `🪩 Disco Analytics Report generated on ${new Date().toLocaleDateString()}. Overall performance is ${metrics.filter(m => m.status === 'good').length}/${metrics.length} metrics meeting targets. Keep grooving! 🕺`,
  };
};

// ============================================
// PUBLIC API
// ============================================

export const initializeAnalyticsService = async (): Promise<void> => {
  try {
    const storedReports = await AsyncStorage.getItem(STORAGE_KEYS.REPORTS);
    if (storedReports) {
      generatedReports = new Map(Object.entries(JSON.parse(storedReports)));
    }
    initializeTemplates();
  } catch (error) {
    console.error('Failed to initialize analytics service:', error);
    initializeTemplates();
  }
};

const saveState = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.REPORTS,
      JSON.stringify(Object.fromEntries(generatedReports))
    );
  } catch (error) {
    console.error('Failed to save analytics state:', error);
  }
};

export const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/**
 * Get all report templates
 */
export const getReportTemplates = (): ReportTemplate[] => {
  return Array.from(reportTemplates.values());
};

/**
 * Get template by ID
 */
export const getReportTemplate = (templateId: string): ReportTemplate | undefined => {
  return reportTemplates.get(templateId);
};

/**
 * Generate report
 */
export const generateReport = async (
  templateId: string,
  timeRange: TimeRange,
  customRange?: { start: number; end: number },
  filters?: Record<string, string | string[]>
): Promise<GeneratedReport> => {
  const template = reportTemplates.get(templateId);
  if (!template) throw new Error('Template not found');

  const now = Date.now();
  let range: { start: number; end: number };

  switch (timeRange) {
    case 'today':
      range = { start: now - 24 * 60 * 60 * 1000, end: now };
      break;
    case 'week':
      range = { start: now - 7 * 24 * 60 * 60 * 1000, end: now };
      break;
    case 'month':
      range = { start: now - 30 * 24 * 60 * 60 * 1000, end: now };
      break;
    case 'quarter':
      range = { start: now - 90 * 24 * 60 * 60 * 1000, end: now };
      break;
    case 'year':
      range = { start: now - 365 * 24 * 60 * 60 * 1000, end: now };
      break;
    case 'custom':
      range = customRange || { start: now - 30 * 24 * 60 * 60 * 1000, end: now };
      break;
    default:
      range = { start: now - 30 * 24 * 60 * 60 * 1000, end: now };
  }

  const report: GeneratedReport = {
    id: generateId(),
    templateId,
    templateName: template.name,
    generatedAt: now,
    generatedBy: 'Dr. Disco Williams',
    timeRange: range,
    filters: filters || {},
    data: generateSampleData(template, range),
    status: 'completed',
    exportFormats: ['pdf', 'excel', 'csv', 'json'],
  };

  generatedReports.set(report.id, report);
  await saveState();
  notifyListeners();
  return report;
};

/**
 * Get all generated reports
 */
export const getGeneratedReports = (): GeneratedReport[] => {
  return Array.from(generatedReports.values())
    .sort((a, b) => b.generatedAt - a.generatedAt);
};

/**
 * Get report by ID
 */
export const getReport = (reportId: string): GeneratedReport | undefined => {
  return generatedReports.get(reportId);
};

/**
 * Export report
 */
export const exportReport = async (
  reportId: string,
  format: ExportFormat
): Promise<{ success: boolean; filename: string; data: string }> => {
  const report = generatedReports.get(reportId);
  if (!report) throw new Error('Report not found');

  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `${report.templateName.replace(/\s+/g, '_')}_${timestamp}.${format}`;

  let data: string;
  switch (format) {
    case 'json':
      data = JSON.stringify(report.data, null, 2);
      break;
    case 'csv':
      const headers = report.data.tables[0]?.headers.join(',') || '';
      const rows = report.data.tables[0]?.rows.map(r => r.join(',')).join('\n') || '';
      data = `${headers}\n${rows}`;
      break;
    case 'pdf':
    case 'excel':
      data = `[${format.toUpperCase()} export would be generated here with disco styling]`;
      break;
    default:
      data = JSON.stringify(report.data);
  }

  return { success: true, filename, data };
};

/**
 * Schedule report
 */
export const scheduleReport = async (
  templateId: string,
  name: string,
  frequency: 'daily' | 'weekly' | 'monthly',
  recipients: string[]
): Promise<ScheduledReport> => {
  const now = Date.now();
  let nextRun: number;

  switch (frequency) {
    case 'daily':
      nextRun = now + 24 * 60 * 60 * 1000;
      break;
    case 'weekly':
      nextRun = now + 7 * 24 * 60 * 60 * 1000;
      break;
    case 'monthly':
      nextRun = now + 30 * 24 * 60 * 60 * 1000;
      break;
  }

  const scheduled: ScheduledReport = {
    id: generateId(),
    reportTemplateId: templateId,
    name,
    frequency,
    recipients,
    nextRun,
    enabled: true,
  };

  scheduledReports.set(scheduled.id, scheduled);
  notifyListeners();
  return scheduled;
};

/**
 * Get scheduled reports
 */
export const getScheduledReports = (): ScheduledReport[] => {
  return Array.from(scheduledReports.values());
};

/**
 * Delete report
 */
export const deleteReport = async (reportId: string): Promise<boolean> => {
  const deleted = generatedReports.delete(reportId);
  if (deleted) {
    await saveState();
    notifyListeners();
  }
  return deleted;
};

/**
 * Get report color
 */
export const getReportColor = (type: ReportType): string => {
  return REPORT_COLORS[type] || REPORT_COLORS.custom;
};

export const analyticsExportService = {
  initialize: initializeAnalyticsService,
  subscribe,
  getReportTemplates,
  getReportTemplate,
  generateReport,
  getGeneratedReports,
  getReport,
  exportReport,
  scheduleReport,
  getScheduledReports,
  deleteReport,
  getReportColor,
};

export default analyticsExportService;
