/**
 * Report Service
 * Custom report templates with PDF generation for patient summaries, shift handovers, and compliance audits
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Report types
export type ReportType = 
  | 'patient_summary'
  | 'shift_handover'
  | 'compliance_audit'
  | 'medication_report'
  | 'lab_results'
  | 'incident_report'
  | 'financial_summary'
  | 'staff_roster'
  | 'inventory_report'
  | 'jedi_status';

// Report status
export type ReportStatus = 'draft' | 'generating' | 'ready' | 'exported' | 'scheduled' | 'error';

// Report template
export interface ReportTemplate {
  id: string;
  type: ReportType;
  name: string;
  description: string;
  sections: ReportSection[];
  headerConfig: HeaderConfig;
  footerConfig: FooterConfig;
  styling: ReportStyling;
  createdAt: number;
  updatedAt: number;
}

// Report section
export interface ReportSection {
  id: string;
  title: string;
  type: 'text' | 'table' | 'chart' | 'list' | 'key_value' | 'signature' | 'image';
  content?: any;
  dataSource?: string;
  visible: boolean;
  order: number;
}

// Header configuration
export interface HeaderConfig {
  showLogo: boolean;
  logoUrl?: string;
  title: string;
  subtitle?: string;
  showDate: boolean;
  showPageNumbers: boolean;
  customFields?: { label: string; value: string }[];
}

// Footer configuration
export interface FooterConfig {
  text?: string;
  showConfidentiality: boolean;
  showGeneratedBy: boolean;
  showTimestamp: boolean;
}

// Report styling
export interface ReportStyling {
  primaryColor: string;
  fontFamily: string;
  fontSize: number;
  headerFontSize: number;
  pageSize: 'A4' | 'Letter' | 'Legal';
  orientation: 'portrait' | 'landscape';
  margins: { top: number; right: number; bottom: number; left: number };
}

// Generated report
export interface GeneratedReport {
  id: string;
  templateId: string;
  type: ReportType;
  title: string;
  status: ReportStatus;
  data: any;
  htmlContent?: string;
  pdfUrl?: string;
  generatedAt: number;
  generatedBy: string;
  fileSize?: number;
  pageCount?: number;
  exportHistory: ExportRecord[];
}

// Export record
export interface ExportRecord {
  id: string;
  format: 'pdf' | 'html' | 'csv' | 'json';
  exportedAt: number;
  exportedBy: string;
  destination: 'download' | 'email' | 'print' | 's3';
  recipientEmail?: string;
}

// Schedule configuration
export interface ReportSchedule {
  id: string;
  templateId: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string;
  recipients: string[];
  enabled: boolean;
  lastRun?: number;
  nextRun: number;
}

// Report data for patient summary
export interface PatientSummaryData {
  patient: {
    id: string;
    name: string;
    dob: string;
    mrn: string;
    gender: string;
    bloodType?: string;
    allergies: string[];
  };
  admissionInfo: {
    admitDate: string;
    dischargeDate?: string;
    ward: string;
    room: string;
    attendingPhysician: string;
    diagnosis: string[];
  };
  vitals: {
    date: string;
    bloodPressure: string;
    heartRate: number;
    temperature: number;
    respiratoryRate: number;
    oxygenSaturation: number;
  }[];
  medications: {
    name: string;
    dosage: string;
    frequency: string;
    route: string;
    startDate: string;
  }[];
  labResults: {
    test: string;
    result: string;
    unit: string;
    reference: string;
    date: string;
    status: 'normal' | 'abnormal' | 'critical';
  }[];
  notes: {
    date: string;
    author: string;
    content: string;
  }[];
}

// Report data for shift handover
export interface ShiftHandoverData {
  shift: {
    date: string;
    shiftType: 'day' | 'evening' | 'night';
    ward: string;
    outgoingStaff: string;
    incomingStaff: string;
  };
  patients: {
    room: string;
    name: string;
    diagnosis: string;
    status: 'stable' | 'improving' | 'declining' | 'critical';
    keyUpdates: string;
    pendingTasks: string[];
  }[];
  incidents: {
    time: string;
    description: string;
    actionTaken: string;
  }[];
  equipmentIssues: string[];
  generalNotes: string;
}

// Report data for compliance audit
export interface ComplianceAuditData {
  audit: {
    id: string;
    date: string;
    auditor: string;
    department: string;
    auditType: string;
  };
  categories: {
    name: string;
    items: {
      requirement: string;
      status: 'compliant' | 'non_compliant' | 'partial' | 'na';
      evidence?: string;
      notes?: string;
    }[];
    score: number;
  }[];
  overallScore: number;
  findings: {
    severity: 'critical' | 'major' | 'minor' | 'observation';
    description: string;
    recommendation: string;
    dueDate?: string;
  }[];
  signatures: {
    role: string;
    name: string;
    date: string;
    signed: boolean;
  }[];
}

class ReportService {
  private templates: Map<string, ReportTemplate> = new Map();
  private reports: Map<string, GeneratedReport> = new Map();
  private schedules: Map<string, ReportSchedule> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
    this.loadState();
  }

  // Initialize default report templates
  private initializeDefaultTemplates(): void {
    // Patient Summary Template
    const patientSummaryTemplate: ReportTemplate = {
      id: 'template-patient-summary',
      type: 'patient_summary',
      name: 'Patient Summary Report',
      description: 'Comprehensive patient summary including demographics, vitals, medications, and lab results',
      sections: [
        { id: 's1', title: 'Patient Information', type: 'key_value', visible: true, order: 1 },
        { id: 's2', title: 'Admission Details', type: 'key_value', visible: true, order: 2 },
        { id: 's3', title: 'Vital Signs', type: 'table', visible: true, order: 3 },
        { id: 's4', title: 'Current Medications', type: 'table', visible: true, order: 4 },
        { id: 's5', title: 'Laboratory Results', type: 'table', visible: true, order: 5 },
        { id: 's6', title: 'Clinical Notes', type: 'list', visible: true, order: 6 },
        { id: 's7', title: 'Allergies & Alerts', type: 'list', visible: true, order: 7 },
      ],
      headerConfig: {
        showLogo: true,
        title: 'Patient Summary Report',
        showDate: true,
        showPageNumbers: true,
      },
      footerConfig: {
        showConfidentiality: true,
        showGeneratedBy: true,
        showTimestamp: true,
        text: 'CONFIDENTIAL - Protected Health Information',
      },
      styling: {
        primaryColor: '#0a7ea4',
        fontFamily: 'Helvetica',
        fontSize: 10,
        headerFontSize: 14,
        pageSize: 'A4',
        orientation: 'portrait',
        margins: { top: 40, right: 40, bottom: 40, left: 40 },
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Shift Handover Template
    const shiftHandoverTemplate: ReportTemplate = {
      id: 'template-shift-handover',
      type: 'shift_handover',
      name: 'Shift Handover Report',
      description: 'Detailed shift handover documentation for nursing staff transitions',
      sections: [
        { id: 's1', title: 'Shift Information', type: 'key_value', visible: true, order: 1 },
        { id: 's2', title: 'Patient Status Overview', type: 'table', visible: true, order: 2 },
        { id: 's3', title: 'Pending Tasks', type: 'list', visible: true, order: 3 },
        { id: 's4', title: 'Incidents & Events', type: 'table', visible: true, order: 4 },
        { id: 's5', title: 'Equipment Issues', type: 'list', visible: true, order: 5 },
        { id: 's6', title: 'General Notes', type: 'text', visible: true, order: 6 },
        { id: 's7', title: 'Handover Signatures', type: 'signature', visible: true, order: 7 },
      ],
      headerConfig: {
        showLogo: true,
        title: 'Shift Handover Report',
        showDate: true,
        showPageNumbers: true,
      },
      footerConfig: {
        showConfidentiality: true,
        showGeneratedBy: true,
        showTimestamp: true,
      },
      styling: {
        primaryColor: '#22C55E',
        fontFamily: 'Helvetica',
        fontSize: 10,
        headerFontSize: 14,
        pageSize: 'A4',
        orientation: 'portrait',
        margins: { top: 40, right: 40, bottom: 40, left: 40 },
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Compliance Audit Template
    const complianceAuditTemplate: ReportTemplate = {
      id: 'template-compliance-audit',
      type: 'compliance_audit',
      name: 'Compliance Audit Report',
      description: 'Comprehensive compliance audit documentation with findings and recommendations',
      sections: [
        { id: 's1', title: 'Audit Information', type: 'key_value', visible: true, order: 1 },
        { id: 's2', title: 'Executive Summary', type: 'text', visible: true, order: 2 },
        { id: 's3', title: 'Compliance Categories', type: 'table', visible: true, order: 3 },
        { id: 's4', title: 'Detailed Findings', type: 'table', visible: true, order: 4 },
        { id: 's5', title: 'Recommendations', type: 'list', visible: true, order: 5 },
        { id: 's6', title: 'Action Items', type: 'table', visible: true, order: 6 },
        { id: 's7', title: 'Audit Signatures', type: 'signature', visible: true, order: 7 },
      ],
      headerConfig: {
        showLogo: true,
        title: 'Compliance Audit Report',
        showDate: true,
        showPageNumbers: true,
      },
      footerConfig: {
        showConfidentiality: true,
        showGeneratedBy: true,
        showTimestamp: true,
        text: 'CONFIDENTIAL - Internal Audit Document',
      },
      styling: {
        primaryColor: '#F59E0B',
        fontFamily: 'Helvetica',
        fontSize: 10,
        headerFontSize: 14,
        pageSize: 'A4',
        orientation: 'portrait',
        margins: { top: 40, right: 40, bottom: 40, left: 40 },
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.templates.set(patientSummaryTemplate.id, patientSummaryTemplate);
    this.templates.set(shiftHandoverTemplate.id, shiftHandoverTemplate);
    this.templates.set(complianceAuditTemplate.id, complianceAuditTemplate);
  }

  // Get all templates
  getTemplates(): ReportTemplate[] {
    return Array.from(this.templates.values());
  }

  // Get template by ID
  getTemplate(id: string): ReportTemplate | undefined {
    return this.templates.get(id);
  }

  // Get templates by type
  getTemplatesByType(type: ReportType): ReportTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.type === type);
  }

  // Create custom template
  createTemplate(template: Omit<ReportTemplate, 'id' | 'createdAt' | 'updatedAt'>): ReportTemplate {
    const newTemplate: ReportTemplate = {
      ...template,
      id: `template-${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.templates.set(newTemplate.id, newTemplate);
    this.saveState();
    return newTemplate;
  }

  // Update template
  updateTemplate(id: string, updates: Partial<ReportTemplate>): ReportTemplate | undefined {
    const template = this.templates.get(id);
    if (!template) return undefined;

    const updatedTemplate: ReportTemplate = {
      ...template,
      ...updates,
      id: template.id,
      createdAt: template.createdAt,
      updatedAt: Date.now(),
    };

    this.templates.set(id, updatedTemplate);
    this.saveState();
    return updatedTemplate;
  }

  // Delete template
  deleteTemplate(id: string): boolean {
    const deleted = this.templates.delete(id);
    if (deleted) this.saveState();
    return deleted;
  }

  // Generate report from template
  async generateReport(
    templateId: string,
    data: any,
    generatedBy: string
  ): Promise<GeneratedReport> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const reportId = `report-${Date.now()}`;
    const report: GeneratedReport = {
      id: reportId,
      templateId,
      type: template.type,
      title: `${template.name} - ${new Date().toLocaleDateString()}`,
      status: 'generating',
      data,
      generatedAt: Date.now(),
      generatedBy,
      exportHistory: [],
    };

    this.reports.set(reportId, report);

    try {
      // Generate HTML content
      const htmlContent = this.generateHTML(template, data);
      report.htmlContent = htmlContent;
      report.status = 'ready';
      report.pageCount = this.estimatePageCount(htmlContent);

      this.reports.set(reportId, report);
      this.saveState();
      return report;
    } catch (error) {
      report.status = 'error';
      this.reports.set(reportId, report);
      throw error;
    }
  }

  // Generate HTML content from template and data
  private generateHTML(template: ReportTemplate, data: any): string {
    const { styling, headerConfig, footerConfig, sections } = template;

    let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${headerConfig.title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: ${styling.fontFamily}, sans-serif; 
      font-size: ${styling.fontSize}pt;
      color: #333;
      line-height: 1.5;
    }
    .page { 
      width: ${styling.pageSize === 'A4' ? '210mm' : '8.5in'};
      min-height: ${styling.pageSize === 'A4' ? '297mm' : '11in'};
      padding: ${styling.margins.top}px ${styling.margins.right}px ${styling.margins.bottom}px ${styling.margins.left}px;
      background: white;
    }
    .header { 
      border-bottom: 2px solid ${styling.primaryColor};
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .header-title { 
      font-size: ${styling.headerFontSize}pt;
      font-weight: bold;
      color: ${styling.primaryColor};
    }
    .header-subtitle { 
      font-size: ${styling.fontSize + 2}pt;
      color: #666;
      margin-top: 4px;
    }
    .header-date { 
      font-size: ${styling.fontSize}pt;
      color: #666;
      margin-top: 8px;
    }
    .section { margin-bottom: 24px; }
    .section-title { 
      font-size: ${styling.fontSize + 2}pt;
      font-weight: bold;
      color: ${styling.primaryColor};
      border-bottom: 1px solid ${styling.primaryColor}40;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin-bottom: 16px;
    }
    th, td { 
      border: 1px solid #ddd; 
      padding: 8px; 
      text-align: left;
    }
    th { 
      background: ${styling.primaryColor}15;
      font-weight: bold;
    }
    .key-value { display: flex; margin-bottom: 8px; }
    .key-value .key { 
      font-weight: bold; 
      width: 150px;
      color: #666;
    }
    .key-value .value { flex: 1; }
    .list-item { 
      padding: 4px 0;
      padding-left: 16px;
      position: relative;
    }
    .list-item::before {
      content: "•";
      position: absolute;
      left: 0;
      color: ${styling.primaryColor};
    }
    .status-normal { color: #22C55E; }
    .status-abnormal { color: #F59E0B; }
    .status-critical { color: #EF4444; font-weight: bold; }
    .footer { 
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #ddd;
      font-size: ${styling.fontSize - 1}pt;
      color: #666;
    }
    .confidential { 
      color: #EF4444;
      font-weight: bold;
      text-transform: uppercase;
    }
    .signature-block {
      display: flex;
      gap: 32px;
      margin-top: 24px;
    }
    .signature-item {
      flex: 1;
      border-top: 1px solid #333;
      padding-top: 8px;
    }
    .signature-label { font-weight: bold; }
    .signature-date { font-size: ${styling.fontSize - 1}pt; color: #666; }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="header-title">${headerConfig.title}</div>
      ${headerConfig.subtitle ? `<div class="header-subtitle">${headerConfig.subtitle}</div>` : ''}
      ${headerConfig.showDate ? `<div class="header-date">Generated: ${new Date().toLocaleString()}</div>` : ''}
    </div>
`;

    // Generate sections based on type and data
    for (const section of sections.filter(s => s.visible).sort((a, b) => a.order - b.order)) {
      html += this.generateSection(section, data, template.type);
    }

    // Footer
    html += `
    <div class="footer">
      ${footerConfig.showConfidentiality ? `<div class="confidential">${footerConfig.text || 'CONFIDENTIAL'}</div>` : ''}
      ${footerConfig.showGeneratedBy ? `<div>Generated by: MediVac One Virtual Hospital</div>` : ''}
      ${footerConfig.showTimestamp ? `<div>Timestamp: ${new Date().toISOString()}</div>` : ''}
    </div>
  </div>
</body>
</html>`;

    return html;
  }

  // Generate section HTML
  private generateSection(section: ReportSection, data: any, reportType: ReportType): string {
    let html = `<div class="section"><div class="section-title">${section.title}</div>`;

    switch (reportType) {
      case 'patient_summary':
        html += this.generatePatientSummarySection(section, data as PatientSummaryData);
        break;
      case 'shift_handover':
        html += this.generateShiftHandoverSection(section, data as ShiftHandoverData);
        break;
      case 'compliance_audit':
        html += this.generateComplianceAuditSection(section, data as ComplianceAuditData);
        break;
      default:
        html += this.generateGenericSection(section, data);
    }

    html += '</div>';
    return html;
  }

  // Generate patient summary section
  private generatePatientSummarySection(section: ReportSection, data: PatientSummaryData): string {
    let html = '';

    switch (section.id) {
      case 's1': // Patient Information
        html = `
          <div class="key-value"><span class="key">Name:</span><span class="value">${data.patient.name}</span></div>
          <div class="key-value"><span class="key">MRN:</span><span class="value">${data.patient.mrn}</span></div>
          <div class="key-value"><span class="key">Date of Birth:</span><span class="value">${data.patient.dob}</span></div>
          <div class="key-value"><span class="key">Gender:</span><span class="value">${data.patient.gender}</span></div>
          <div class="key-value"><span class="key">Blood Type:</span><span class="value">${data.patient.bloodType || 'Unknown'}</span></div>
        `;
        break;

      case 's2': // Admission Details
        html = `
          <div class="key-value"><span class="key">Admit Date:</span><span class="value">${data.admissionInfo.admitDate}</span></div>
          <div class="key-value"><span class="key">Ward:</span><span class="value">${data.admissionInfo.ward}</span></div>
          <div class="key-value"><span class="key">Room:</span><span class="value">${data.admissionInfo.room}</span></div>
          <div class="key-value"><span class="key">Attending:</span><span class="value">${data.admissionInfo.attendingPhysician}</span></div>
          <div class="key-value"><span class="key">Diagnosis:</span><span class="value">${data.admissionInfo.diagnosis.join(', ')}</span></div>
        `;
        break;

      case 's3': // Vital Signs
        html = `
          <table>
            <thead>
              <tr><th>Date</th><th>BP</th><th>HR</th><th>Temp</th><th>RR</th><th>SpO2</th></tr>
            </thead>
            <tbody>
              ${data.vitals.map(v => `
                <tr>
                  <td>${v.date}</td>
                  <td>${v.bloodPressure}</td>
                  <td>${v.heartRate}</td>
                  <td>${v.temperature}°C</td>
                  <td>${v.respiratoryRate}</td>
                  <td>${v.oxygenSaturation}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
        break;

      case 's4': // Medications
        html = `
          <table>
            <thead>
              <tr><th>Medication</th><th>Dosage</th><th>Frequency</th><th>Route</th><th>Start Date</th></tr>
            </thead>
            <tbody>
              ${data.medications.map(m => `
                <tr>
                  <td>${m.name}</td>
                  <td>${m.dosage}</td>
                  <td>${m.frequency}</td>
                  <td>${m.route}</td>
                  <td>${m.startDate}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
        break;

      case 's5': // Lab Results
        html = `
          <table>
            <thead>
              <tr><th>Test</th><th>Result</th><th>Unit</th><th>Reference</th><th>Date</th></tr>
            </thead>
            <tbody>
              ${data.labResults.map(l => `
                <tr>
                  <td>${l.test}</td>
                  <td class="status-${l.status}">${l.result}</td>
                  <td>${l.unit}</td>
                  <td>${l.reference}</td>
                  <td>${l.date}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
        break;

      case 's6': // Clinical Notes
        html = data.notes.map(n => `
          <div class="list-item"><strong>${n.date} - ${n.author}:</strong> ${n.content}</div>
        `).join('');
        break;

      case 's7': // Allergies
        html = data.patient.allergies.length > 0
          ? data.patient.allergies.map(a => `<div class="list-item status-critical">${a}</div>`).join('')
          : '<div>No known allergies</div>';
        break;
    }

    return html;
  }

  // Generate shift handover section
  private generateShiftHandoverSection(section: ReportSection, data: ShiftHandoverData): string {
    let html = '';

    switch (section.id) {
      case 's1': // Shift Information
        html = `
          <div class="key-value"><span class="key">Date:</span><span class="value">${data.shift.date}</span></div>
          <div class="key-value"><span class="key">Shift:</span><span class="value">${data.shift.shiftType}</span></div>
          <div class="key-value"><span class="key">Ward:</span><span class="value">${data.shift.ward}</span></div>
          <div class="key-value"><span class="key">Outgoing:</span><span class="value">${data.shift.outgoingStaff}</span></div>
          <div class="key-value"><span class="key">Incoming:</span><span class="value">${data.shift.incomingStaff}</span></div>
        `;
        break;

      case 's2': // Patient Status
        html = `
          <table>
            <thead>
              <tr><th>Room</th><th>Patient</th><th>Diagnosis</th><th>Status</th><th>Key Updates</th></tr>
            </thead>
            <tbody>
              ${data.patients.map(p => `
                <tr>
                  <td>${p.room}</td>
                  <td>${p.name}</td>
                  <td>${p.diagnosis}</td>
                  <td class="status-${p.status === 'critical' ? 'critical' : p.status === 'declining' ? 'abnormal' : 'normal'}">${p.status}</td>
                  <td>${p.keyUpdates}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
        break;

      case 's3': // Pending Tasks
        html = data.patients.flatMap(p => 
          p.pendingTasks.map(t => `<div class="list-item">${p.room} - ${p.name}: ${t}</div>`)
        ).join('');
        break;

      case 's4': // Incidents
        html = data.incidents.length > 0 ? `
          <table>
            <thead>
              <tr><th>Time</th><th>Description</th><th>Action Taken</th></tr>
            </thead>
            <tbody>
              ${data.incidents.map(i => `
                <tr>
                  <td>${i.time}</td>
                  <td>${i.description}</td>
                  <td>${i.actionTaken}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<div>No incidents to report</div>';
        break;

      case 's5': // Equipment Issues
        html = data.equipmentIssues.length > 0
          ? data.equipmentIssues.map(e => `<div class="list-item">${e}</div>`).join('')
          : '<div>No equipment issues</div>';
        break;

      case 's6': // General Notes
        html = `<div>${data.generalNotes || 'No additional notes'}</div>`;
        break;

      case 's7': // Signatures
        html = `
          <div class="signature-block">
            <div class="signature-item">
              <div class="signature-label">Outgoing Staff</div>
              <div>${data.shift.outgoingStaff}</div>
              <div class="signature-date">${data.shift.date}</div>
            </div>
            <div class="signature-item">
              <div class="signature-label">Incoming Staff</div>
              <div>${data.shift.incomingStaff}</div>
              <div class="signature-date">${data.shift.date}</div>
            </div>
          </div>
        `;
        break;
    }

    return html;
  }

  // Generate compliance audit section
  private generateComplianceAuditSection(section: ReportSection, data: ComplianceAuditData): string {
    let html = '';

    switch (section.id) {
      case 's1': // Audit Information
        html = `
          <div class="key-value"><span class="key">Audit ID:</span><span class="value">${data.audit.id}</span></div>
          <div class="key-value"><span class="key">Date:</span><span class="value">${data.audit.date}</span></div>
          <div class="key-value"><span class="key">Auditor:</span><span class="value">${data.audit.auditor}</span></div>
          <div class="key-value"><span class="key">Department:</span><span class="value">${data.audit.department}</span></div>
          <div class="key-value"><span class="key">Audit Type:</span><span class="value">${data.audit.auditType}</span></div>
        `;
        break;

      case 's2': // Executive Summary
        html = `
          <div class="key-value"><span class="key">Overall Score:</span><span class="value" style="font-size: 18pt; font-weight: bold; color: ${data.overallScore >= 80 ? '#22C55E' : data.overallScore >= 60 ? '#F59E0B' : '#EF4444'}">${data.overallScore}%</span></div>
          <div style="margin-top: 8px;">Total findings: ${data.findings.length} (${data.findings.filter(f => f.severity === 'critical').length} critical, ${data.findings.filter(f => f.severity === 'major').length} major)</div>
        `;
        break;

      case 's3': // Categories
        html = `
          <table>
            <thead>
              <tr><th>Category</th><th>Score</th><th>Items Reviewed</th></tr>
            </thead>
            <tbody>
              ${data.categories.map(c => `
                <tr>
                  <td>${c.name}</td>
                  <td class="status-${c.score >= 80 ? 'normal' : c.score >= 60 ? 'abnormal' : 'critical'}">${c.score}%</td>
                  <td>${c.items.length}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
        break;

      case 's4': // Findings
        html = `
          <table>
            <thead>
              <tr><th>Severity</th><th>Finding</th><th>Recommendation</th><th>Due Date</th></tr>
            </thead>
            <tbody>
              ${data.findings.map(f => `
                <tr>
                  <td class="status-${f.severity === 'critical' ? 'critical' : f.severity === 'major' ? 'abnormal' : 'normal'}">${f.severity}</td>
                  <td>${f.description}</td>
                  <td>${f.recommendation}</td>
                  <td>${f.dueDate || 'TBD'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
        break;

      case 's7': // Signatures
        html = `
          <div class="signature-block">
            ${data.signatures.map(s => `
              <div class="signature-item">
                <div class="signature-label">${s.role}</div>
                <div>${s.name}</div>
                <div class="signature-date">${s.date} ${s.signed ? '✓ Signed' : '○ Pending'}</div>
              </div>
            `).join('')}
          </div>
        `;
        break;
    }

    return html;
  }

  // Generate generic section
  private generateGenericSection(section: ReportSection, data: any): string {
    return `<div>${JSON.stringify(data, null, 2)}</div>`;
  }

  // Estimate page count
  private estimatePageCount(html: string): number {
    // Rough estimate based on content length
    const contentLength = html.length;
    return Math.max(1, Math.ceil(contentLength / 5000));
  }

  // Get all reports
  getReports(): GeneratedReport[] {
    return Array.from(this.reports.values()).sort((a, b) => b.generatedAt - a.generatedAt);
  }

  // Get report by ID
  getReport(id: string): GeneratedReport | undefined {
    return this.reports.get(id);
  }

  // Delete report
  deleteReport(id: string): boolean {
    const deleted = this.reports.delete(id);
    if (deleted) this.saveState();
    return deleted;
  }

  // Export report
  async exportReport(reportId: string, format: 'pdf' | 'html' | 'csv', exportedBy: string): Promise<string> {
    const report = this.reports.get(reportId);
    if (!report) throw new Error('Report not found');

    const exportRecord: ExportRecord = {
      id: `export-${Date.now()}`,
      format,
      exportedAt: Date.now(),
      exportedBy,
      destination: 'download',
    };

    report.exportHistory.push(exportRecord);
    report.status = 'exported';
    this.reports.set(reportId, report);
    this.saveState();

    // Return HTML content for now (in production, would generate actual PDF)
    return report.htmlContent || '';
  }

  // Schedule report
  createSchedule(schedule: Omit<ReportSchedule, 'id' | 'nextRun'>): ReportSchedule {
    const newSchedule: ReportSchedule = {
      ...schedule,
      id: `schedule-${Date.now()}`,
      nextRun: this.calculateNextRun(schedule),
    };

    this.schedules.set(newSchedule.id, newSchedule);
    this.saveState();
    return newSchedule;
  }

  // Calculate next run time
  private calculateNextRun(schedule: Omit<ReportSchedule, 'id' | 'nextRun'>): number {
    const now = new Date();
    const [hours, minutes] = schedule.time.split(':').map(Number);
    const next = new Date(now);
    next.setHours(hours, minutes, 0, 0);

    if (next <= now) {
      switch (schedule.frequency) {
        case 'daily':
          next.setDate(next.getDate() + 1);
          break;
        case 'weekly':
          next.setDate(next.getDate() + 7);
          break;
        case 'monthly':
          next.setMonth(next.getMonth() + 1);
          break;
        case 'quarterly':
          next.setMonth(next.getMonth() + 3);
          break;
      }
    }

    return next.getTime();
  }

  // Get schedules
  getSchedules(): ReportSchedule[] {
    return Array.from(this.schedules.values());
  }

  // Delete schedule
  deleteSchedule(id: string): boolean {
    const deleted = this.schedules.delete(id);
    if (deleted) this.saveState();
    return deleted;
  }

  // Save state
  private async saveState(): Promise<void> {
    try {
      await AsyncStorage.setItem('report_templates', JSON.stringify(Array.from(this.templates.entries())));
      await AsyncStorage.setItem('generated_reports', JSON.stringify(Array.from(this.reports.entries())));
      await AsyncStorage.setItem('report_schedules', JSON.stringify(Array.from(this.schedules.entries())));
    } catch (error) {
      console.error('Failed to save report state:', error);
    }
  }

  // Load state
  private async loadState(): Promise<void> {
    try {
      const templatesJson = await AsyncStorage.getItem('report_templates');
      if (templatesJson) {
        const entries = JSON.parse(templatesJson);
        entries.forEach(([key, value]: [string, ReportTemplate]) => {
          this.templates.set(key, value);
        });
      }

      const reportsJson = await AsyncStorage.getItem('generated_reports');
      if (reportsJson) {
        const entries = JSON.parse(reportsJson);
        entries.forEach(([key, value]: [string, GeneratedReport]) => {
          this.reports.set(key, value);
        });
      }

      const schedulesJson = await AsyncStorage.getItem('report_schedules');
      if (schedulesJson) {
        const entries = JSON.parse(schedulesJson);
        entries.forEach(([key, value]: [string, ReportSchedule]) => {
          this.schedules.set(key, value);
        });
      }
    } catch (error) {
      console.error('Failed to load report state:', error);
    }
  }
}

// Export singleton instance
export const reportService = new ReportService();
export default reportService;
