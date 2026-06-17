/**
 * Clinical Pathway Tracking Service
 * Care pathway templates with milestone tracking and variance detection
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// TYPES AND INTERFACES
// ============================================

export type PathwayCategory = 'CHF' | 'Pneumonia' | 'Hip_Replacement' | 'Stroke' | 'COPD' | 'AMI' | 'Sepsis' | 'DKA';
export type MilestoneStatus = 'pending' | 'in_progress' | 'completed' | 'delayed' | 'skipped' | 'variance';
export type VarianceSeverity = 'minor' | 'moderate' | 'major';

export interface PathwayTemplate {
  id: string;
  name: string;
  category: PathwayCategory;
  description: string;
  expectedLOS: number; // days
  milestones: MilestoneTemplate[];
  orderSets: OrderSet[];
  outcomeMetrics: OutcomeMetric[];
  evidenceLevel: 'A' | 'B' | 'C';
  lastUpdated: number;
}

export interface MilestoneTemplate {
  id: string;
  name: string;
  description: string;
  dayOffset: number; // Day from admission (0 = admission day)
  category: 'assessment' | 'intervention' | 'education' | 'discharge_planning' | 'outcome';
  required: boolean;
  orderSetIds: string[];
  criteria: MilestoneCriteria[];
}

export interface MilestoneCriteria {
  id: string;
  description: string;
  type: 'vital_sign' | 'lab_value' | 'assessment' | 'intervention' | 'documentation' | 'nursing';
  target?: string;
}

export interface OrderSet {
  id: string;
  name: string;
  orders: Order[];
}

export interface Order {
  id: string;
  type: 'medication' | 'lab' | 'imaging' | 'consult' | 'nursing' | 'therapy' | 'diet';
  description: string;
  frequency?: string;
  duration?: string;
}

export interface OutcomeMetric {
  id: string;
  name: string;
  target: string;
  benchmark: string;
}

export interface PatientPathway {
  id: string;
  patientId: string;
  patientName: string;
  mrn: string;
  templateId: string;
  templateName: string;
  category: PathwayCategory;
  startDate: number;
  expectedEndDate: number;
  actualEndDate?: number;
  status: 'active' | 'completed' | 'discontinued';
  milestones: PatientMilestone[];
  variances: PathwayVariance[];
  complianceScore: number;
  attendingPhysician: string;
  careTeam: CareTeamMember[];
  notes: PathwayNote[];
}

export interface PatientMilestone {
  id: string;
  templateMilestoneId: string;
  name: string;
  description: string;
  expectedDate: number;
  actualDate?: number;
  status: MilestoneStatus;
  completedBy?: string;
  criteria: PatientCriteria[];
  notes?: string;
}

export interface PatientCriteria {
  id: string;
  description: string;
  met: boolean;
  value?: string;
  documentedAt?: number;
  documentedBy?: string;
}

export interface PathwayVariance {
  id: string;
  milestoneId: string;
  milestoneName: string;
  type: 'delay' | 'deviation' | 'complication' | 'patient_factor' | 'system_factor';
  severity: VarianceSeverity;
  description: string;
  reason: string;
  impact: string;
  actionTaken?: string;
  reportedAt: number;
  reportedBy: string;
  resolvedAt?: number;
}

export interface CareTeamMember {
  id: string;
  name: string;
  role: string;
  primary: boolean;
}

export interface PathwayNote {
  id: string;
  text: string;
  author: string;
  timestamp: number;
  type: 'progress' | 'variance' | 'plan_change' | 'general';
}

export interface PathwayDashboardSummary {
  activePathways: number;
  completedToday: number;
  variancesReported: number;
  avgComplianceScore: number;
  avgLOSVariance: number;
  pathwaysByCategory: { category: PathwayCategory; count: number }[];
  recentVariances: PathwayVariance[];
  upcomingMilestones: { patientName: string; milestone: string; dueDate: number }[];
}

// ============================================
// CLINICAL PATHWAY SERVICE
// ============================================

class ClinicalPathwayService {
  private templates: Map<string, PathwayTemplate> = new Map();
  private pathways: Map<string, PatientPathway> = new Map();
  private listeners: Set<() => void> = new Set();
  private readonly STORAGE_KEY = '@medivac_clinical_pathways';

  constructor() {
    this.initializeTemplates();
    this.initializeSamplePathways();
    this.loadFromStorage();
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  private initializeTemplates(): void {
    const templates: PathwayTemplate[] = [
      {
        id: 'TPL-CHF',
        name: 'Heart Failure Clinical Pathway',
        category: 'CHF',
        description: 'Evidence-based pathway for acute decompensated heart failure management',
        expectedLOS: 4,
        milestones: [
          {
            id: 'M-CHF-1',
            name: 'Initial Assessment',
            description: 'Complete admission assessment and initiate treatment',
            dayOffset: 0,
            category: 'assessment',
            required: true,
            orderSetIds: ['OS-CHF-ADMIT'],
            criteria: [
              { id: 'C1', description: 'BNP/NT-proBNP obtained', type: 'lab_value' },
              { id: 'C2', description: 'Echocardiogram ordered', type: 'assessment' },
              { id: 'C3', description: 'Daily weights initiated', type: 'nursing' },
              { id: 'C4', description: 'Fluid restriction ordered', type: 'intervention' },
            ],
          },
          {
            id: 'M-CHF-2',
            name: 'Diuresis Response',
            description: 'Evaluate response to diuretic therapy',
            dayOffset: 1,
            category: 'intervention',
            required: true,
            orderSetIds: [],
            criteria: [
              { id: 'C5', description: 'Net negative fluid balance', type: 'vital_sign', target: '>1L' },
              { id: 'C6', description: 'Weight trending down', type: 'vital_sign' },
              { id: 'C7', description: 'Creatinine stable', type: 'lab_value' },
            ],
          },
          {
            id: 'M-CHF-3',
            name: 'GDMT Optimization',
            description: 'Optimize guideline-directed medical therapy',
            dayOffset: 2,
            category: 'intervention',
            required: true,
            orderSetIds: ['OS-CHF-GDMT'],
            criteria: [
              { id: 'C8', description: 'ACE-I/ARB/ARNI initiated or optimized', type: 'intervention' },
              { id: 'C9', description: 'Beta-blocker assessment', type: 'intervention' },
              { id: 'C10', description: 'MRA considered', type: 'intervention' },
            ],
          },
          {
            id: 'M-CHF-4',
            name: 'Patient Education',
            description: 'Complete heart failure education',
            dayOffset: 2,
            category: 'education',
            required: true,
            orderSetIds: [],
            criteria: [
              { id: 'C11', description: 'Daily weight monitoring education', type: 'documentation' },
              { id: 'C12', description: 'Sodium restriction education', type: 'documentation' },
              { id: 'C13', description: 'Medication education completed', type: 'documentation' },
              { id: 'C14', description: 'Signs/symptoms to report', type: 'documentation' },
            ],
          },
          {
            id: 'M-CHF-5',
            name: 'Discharge Planning',
            description: 'Complete discharge preparation',
            dayOffset: 3,
            category: 'discharge_planning',
            required: true,
            orderSetIds: ['OS-CHF-DC'],
            criteria: [
              { id: 'C15', description: 'Follow-up appointment scheduled', type: 'documentation' },
              { id: 'C16', description: 'Medication reconciliation complete', type: 'intervention' },
              { id: 'C17', description: 'Home health referral if needed', type: 'intervention' },
              { id: 'C18', description: 'Discharge instructions reviewed', type: 'documentation' },
            ],
          },
          {
            id: 'M-CHF-6',
            name: 'Discharge Criteria Met',
            description: 'Patient meets discharge criteria',
            dayOffset: 4,
            category: 'outcome',
            required: true,
            orderSetIds: [],
            criteria: [
              { id: 'C19', description: 'Euvolemic or near-euvolemic', type: 'assessment' },
              { id: 'C20', description: 'Stable on oral diuretics x24h', type: 'intervention' },
              { id: 'C21', description: 'Ambulating without significant dyspnea', type: 'assessment' },
            ],
          },
        ],
        orderSets: [
          {
            id: 'OS-CHF-ADMIT',
            name: 'CHF Admission Orders',
            orders: [
              { id: 'O1', type: 'lab', description: 'BNP or NT-proBNP', frequency: 'Once' },
              { id: 'O2', type: 'lab', description: 'BMP', frequency: 'Daily' },
              { id: 'O3', type: 'imaging', description: 'Echocardiogram', frequency: 'Once' },
              { id: 'O4', type: 'medication', description: 'IV Furosemide', frequency: 'Per protocol' },
              { id: 'O5', type: 'nursing', description: 'Daily weights', frequency: 'Daily' },
              { id: 'O6', type: 'diet', description: '2g Sodium restriction' },
            ],
          },
          {
            id: 'OS-CHF-GDMT',
            name: 'GDMT Optimization',
            orders: [
              { id: 'O7', type: 'medication', description: 'ACE-I/ARB/ARNI' },
              { id: 'O8', type: 'medication', description: 'Beta-blocker' },
              { id: 'O9', type: 'medication', description: 'MRA' },
              { id: 'O10', type: 'medication', description: 'SGLT2 inhibitor' },
            ],
          },
          {
            id: 'OS-CHF-DC',
            name: 'CHF Discharge Orders',
            orders: [
              { id: 'O11', type: 'medication', description: 'Oral diuretic regimen' },
              { id: 'O12', type: 'consult', description: 'Cardiology follow-up 7 days' },
              { id: 'O13', type: 'nursing', description: 'Home health referral' },
            ],
          },
        ],
        outcomeMetrics: [
          { id: 'OM1', name: '30-day Readmission', target: '<15%', benchmark: '20%' },
          { id: 'OM2', name: 'Average LOS', target: '4 days', benchmark: '5.2 days' },
          { id: 'OM3', name: 'GDMT at Discharge', target: '>90%', benchmark: '75%' },
        ],
        evidenceLevel: 'A',
        lastUpdated: Date.now() - 30 * 24 * 60 * 60 * 1000,
      },
      {
        id: 'TPL-PNA',
        name: 'Community Acquired Pneumonia Pathway',
        category: 'Pneumonia',
        description: 'Evidence-based pathway for CAP management',
        expectedLOS: 3,
        milestones: [
          {
            id: 'M-PNA-1',
            name: 'Initial Assessment & Antibiotics',
            description: 'Severity assessment and antibiotic initiation',
            dayOffset: 0,
            category: 'assessment',
            required: true,
            orderSetIds: ['OS-PNA-ADMIT'],
            criteria: [
              { id: 'C1', description: 'CURB-65 or PSI calculated', type: 'assessment' },
              { id: 'C2', description: 'Blood cultures obtained', type: 'lab_value' },
              { id: 'C3', description: 'Antibiotics within 4 hours', type: 'intervention' },
              { id: 'C4', description: 'Chest X-ray completed', type: 'assessment' },
            ],
          },
          {
            id: 'M-PNA-2',
            name: 'Clinical Response',
            description: 'Evaluate response to treatment',
            dayOffset: 2,
            category: 'intervention',
            required: true,
            orderSetIds: [],
            criteria: [
              { id: 'C5', description: 'Afebrile x24 hours', type: 'vital_sign' },
              { id: 'C6', description: 'Oxygen requirement decreasing', type: 'vital_sign' },
              { id: 'C7', description: 'Able to take PO', type: 'assessment' },
            ],
          },
          {
            id: 'M-PNA-3',
            name: 'IV to PO Conversion',
            description: 'Transition to oral antibiotics',
            dayOffset: 2,
            category: 'intervention',
            required: true,
            orderSetIds: [],
            criteria: [
              { id: 'C8', description: 'Converted to oral antibiotics', type: 'intervention' },
              { id: 'C9', description: 'Tolerating oral intake', type: 'assessment' },
            ],
          },
          {
            id: 'M-PNA-4',
            name: 'Discharge Ready',
            description: 'Patient meets discharge criteria',
            dayOffset: 3,
            category: 'outcome',
            required: true,
            orderSetIds: ['OS-PNA-DC'],
            criteria: [
              { id: 'C10', description: 'Clinically stable x24h', type: 'assessment' },
              { id: 'C11', description: 'Follow-up scheduled', type: 'documentation' },
              { id: 'C12', description: 'Antibiotic course planned', type: 'intervention' },
            ],
          },
        ],
        orderSets: [
          {
            id: 'OS-PNA-ADMIT',
            name: 'CAP Admission Orders',
            orders: [
              { id: 'O1', type: 'lab', description: 'Blood cultures x2', frequency: 'Once' },
              { id: 'O2', type: 'lab', description: 'Procalcitonin', frequency: 'Once' },
              { id: 'O3', type: 'imaging', description: 'Chest X-ray', frequency: 'Once' },
              { id: 'O4', type: 'medication', description: 'Ceftriaxone + Azithromycin' },
            ],
          },
          {
            id: 'OS-PNA-DC',
            name: 'CAP Discharge Orders',
            orders: [
              { id: 'O5', type: 'medication', description: 'Oral antibiotic to complete course' },
              { id: 'O6', type: 'consult', description: 'PCP follow-up 7 days' },
            ],
          },
        ],
        outcomeMetrics: [
          { id: 'OM1', name: '30-day Mortality', target: '<5%', benchmark: '8%' },
          { id: 'OM2', name: 'Average LOS', target: '3 days', benchmark: '4.5 days' },
        ],
        evidenceLevel: 'A',
        lastUpdated: Date.now() - 60 * 24 * 60 * 60 * 1000,
      },
      {
        id: 'TPL-HIP',
        name: 'Total Hip Replacement Pathway',
        category: 'Hip_Replacement',
        description: 'Enhanced recovery pathway for elective THR',
        expectedLOS: 2,
        milestones: [
          {
            id: 'M-HIP-1',
            name: 'Pre-op Optimization',
            description: 'Pre-operative preparation',
            dayOffset: -1,
            category: 'assessment',
            required: true,
            orderSetIds: [],
            criteria: [
              { id: 'C1', description: 'Pre-op labs reviewed', type: 'lab_value' },
              { id: 'C2', description: 'Anesthesia clearance', type: 'assessment' },
              { id: 'C3', description: 'Patient education completed', type: 'documentation' },
            ],
          },
          {
            id: 'M-HIP-2',
            name: 'Post-op Day 0',
            description: 'Immediate post-operative care',
            dayOffset: 0,
            category: 'intervention',
            required: true,
            orderSetIds: ['OS-HIP-POD0'],
            criteria: [
              { id: 'C4', description: 'Pain controlled', type: 'assessment' },
              { id: 'C5', description: 'DVT prophylaxis initiated', type: 'intervention' },
              { id: 'C6', description: 'PT evaluation', type: 'intervention' },
            ],
          },
          {
            id: 'M-HIP-3',
            name: 'Mobilization',
            description: 'Early mobilization goals',
            dayOffset: 1,
            category: 'intervention',
            required: true,
            orderSetIds: [],
            criteria: [
              { id: 'C7', description: 'Out of bed to chair', type: 'intervention' },
              { id: 'C8', description: 'Ambulated with PT', type: 'intervention' },
              { id: 'C9', description: 'Voiding independently', type: 'assessment' },
            ],
          },
          {
            id: 'M-HIP-4',
            name: 'Discharge Ready',
            description: 'Meet discharge criteria',
            dayOffset: 2,
            category: 'outcome',
            required: true,
            orderSetIds: ['OS-HIP-DC'],
            criteria: [
              { id: 'C10', description: 'Independent with transfers', type: 'assessment' },
              { id: 'C11', description: 'Pain controlled on oral meds', type: 'intervention' },
              { id: 'C12', description: 'Discharge disposition arranged', type: 'documentation' },
            ],
          },
        ],
        orderSets: [
          {
            id: 'OS-HIP-POD0',
            name: 'THR POD 0 Orders',
            orders: [
              { id: 'O1', type: 'medication', description: 'Multimodal pain protocol' },
              { id: 'O2', type: 'medication', description: 'Enoxaparin 40mg daily' },
              { id: 'O3', type: 'therapy', description: 'PT consult' },
            ],
          },
          {
            id: 'OS-HIP-DC',
            name: 'THR Discharge Orders',
            orders: [
              { id: 'O4', type: 'medication', description: 'Oral pain medications' },
              { id: 'O5', type: 'medication', description: 'Aspirin 81mg x6 weeks' },
              { id: 'O6', type: 'consult', description: 'Ortho follow-up 2 weeks' },
            ],
          },
        ],
        outcomeMetrics: [
          { id: 'OM1', name: 'Average LOS', target: '2 days', benchmark: '3.2 days' },
          { id: 'OM2', name: 'Same-day Mobilization', target: '>95%', benchmark: '80%' },
          { id: 'OM3', name: 'VTE Rate', target: '<1%', benchmark: '2%' },
        ],
        evidenceLevel: 'A',
        lastUpdated: Date.now() - 45 * 24 * 60 * 60 * 1000,
      },
    ];

    templates.forEach(t => this.templates.set(t.id, t));
  }

  private initializeSamplePathways(): void {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    const chfTemplate = this.templates.get('TPL-CHF')!;
    
    const samplePathways: PatientPathway[] = [
      {
        id: 'PW-001',
        patientId: 'PAT-001',
        patientName: 'John Smith',
        mrn: 'MRN-12345',
        templateId: 'TPL-CHF',
        templateName: 'Heart Failure Clinical Pathway',
        category: 'CHF',
        startDate: now - 2 * day,
        expectedEndDate: now + 2 * day,
        status: 'active',
        milestones: chfTemplate.milestones.map((m, idx) => ({
          id: `PM-001-${idx}`,
          templateMilestoneId: m.id,
          name: m.name,
          description: m.description,
          expectedDate: now - 2 * day + m.dayOffset * day,
          actualDate: idx < 3 ? now - 2 * day + m.dayOffset * day + Math.random() * 4 * 60 * 60 * 1000 : undefined,
          status: idx < 3 ? 'completed' : idx === 3 ? 'in_progress' : 'pending',
          completedBy: idx < 3 ? 'Dr. Johnson' : undefined,
          criteria: m.criteria.map(c => ({
            id: c.id,
            description: c.description,
            met: idx < 3 ? true : Math.random() > 0.5,
            documentedAt: idx < 3 ? now - (2 - idx) * day : undefined,
            documentedBy: idx < 3 ? 'Nurse Williams' : undefined,
          })),
        })),
        variances: [
          {
            id: 'VAR-001',
            milestoneId: 'PM-001-1',
            milestoneName: 'Diuresis Response',
            type: 'delay',
            severity: 'minor',
            description: 'Diuresis response slower than expected',
            reason: 'Patient with baseline CKD requiring careful diuresis',
            impact: 'May extend LOS by 1 day',
            actionTaken: 'Increased monitoring, nephrology consult',
            reportedAt: now - day,
            reportedBy: 'Dr. Johnson',
          },
        ],
        complianceScore: 85,
        attendingPhysician: 'Dr. Johnson',
        careTeam: [
          { id: 'CT-1', name: 'Dr. Johnson', role: 'Attending', primary: true },
          { id: 'CT-2', name: 'Nurse Williams', role: 'Primary RN', primary: true },
          { id: 'CT-3', name: 'Dr. Smith', role: 'Cardiology', primary: false },
        ],
        notes: [
          {
            id: 'N-1',
            text: 'Patient responding well to diuresis, BNP trending down',
            author: 'Dr. Johnson',
            timestamp: now - day,
            type: 'progress',
          },
        ],
      },
      {
        id: 'PW-002',
        patientId: 'PAT-002',
        patientName: 'Mary Johnson',
        mrn: 'MRN-12346',
        templateId: 'TPL-PNA',
        templateName: 'Community Acquired Pneumonia Pathway',
        category: 'Pneumonia',
        startDate: now - day,
        expectedEndDate: now + 2 * day,
        status: 'active',
        milestones: [
          {
            id: 'PM-002-0',
            templateMilestoneId: 'M-PNA-1',
            name: 'Initial Assessment & Antibiotics',
            description: 'Severity assessment and antibiotic initiation',
            expectedDate: now - day,
            actualDate: now - day + 2 * 60 * 60 * 1000,
            status: 'completed',
            completedBy: 'Dr. Smith',
            criteria: [
              { id: 'C1', description: 'CURB-65 or PSI calculated', met: true, documentedAt: now - day },
              { id: 'C2', description: 'Blood cultures obtained', met: true, documentedAt: now - day },
              { id: 'C3', description: 'Antibiotics within 4 hours', met: true, documentedAt: now - day },
              { id: 'C4', description: 'Chest X-ray completed', met: true, documentedAt: now - day },
            ],
          },
          {
            id: 'PM-002-1',
            templateMilestoneId: 'M-PNA-2',
            name: 'Clinical Response',
            description: 'Evaluate response to treatment',
            expectedDate: now + day,
            status: 'pending',
            criteria: [
              { id: 'C5', description: 'Afebrile x24 hours', met: false },
              { id: 'C6', description: 'Oxygen requirement decreasing', met: false },
              { id: 'C7', description: 'Able to take PO', met: true },
            ],
          },
        ],
        variances: [],
        complianceScore: 100,
        attendingPhysician: 'Dr. Smith',
        careTeam: [
          { id: 'CT-4', name: 'Dr. Smith', role: 'Attending', primary: true },
          { id: 'CT-5', name: 'Nurse Davis', role: 'Primary RN', primary: true },
        ],
        notes: [],
      },
    ];

    samplePathways.forEach(p => this.pathways.set(p.id, p));
  }

  private async loadFromStorage(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.pathways) {
          parsed.pathways.forEach((p: PatientPathway) => this.pathways.set(p.id, p));
        }
      }
    } catch (error) {
      console.error('Failed to load pathway data:', error);
    }
  }

  private async saveToStorage(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        pathways: Array.from(this.pathways.values()),
      }));
    } catch (error) {
      console.error('Failed to save pathway data:', error);
    }
  }

  // ============================================
  // TEMPLATE METHODS
  // ============================================

  getTemplates(): PathwayTemplate[] {
    return Array.from(this.templates.values());
  }

  getTemplate(id: string): PathwayTemplate | undefined {
    return this.templates.get(id);
  }

  getTemplatesByCategory(category: PathwayCategory): PathwayTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.category === category);
  }

  // ============================================
  // PATHWAY METHODS
  // ============================================

  startPathway(
    patientId: string,
    patientName: string,
    mrn: string,
    templateId: string,
    attendingPhysician: string
  ): PatientPathway | null {
    const template = this.templates.get(templateId);
    if (!template) return null;

    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    const pathway: PatientPathway = {
      id: `PW-${Date.now()}`,
      patientId,
      patientName,
      mrn,
      templateId,
      templateName: template.name,
      category: template.category,
      startDate: now,
      expectedEndDate: now + template.expectedLOS * day,
      status: 'active',
      milestones: template.milestones.map((m, idx) => ({
        id: `PM-${Date.now()}-${idx}`,
        templateMilestoneId: m.id,
        name: m.name,
        description: m.description,
        expectedDate: now + m.dayOffset * day,
        status: 'pending',
        criteria: m.criteria.map(c => ({
          id: c.id,
          description: c.description,
          met: false,
        })),
      })),
      variances: [],
      complianceScore: 0,
      attendingPhysician,
      careTeam: [{ id: `CT-${Date.now()}`, name: attendingPhysician, role: 'Attending', primary: true }],
      notes: [],
    };

    this.pathways.set(pathway.id, pathway);
    this.saveToStorage();
    this.notifyListeners();

    return pathway;
  }

  updateMilestoneStatus(
    pathwayId: string,
    milestoneId: string,
    status: MilestoneStatus,
    completedBy?: string
  ): void {
    const pathway = this.pathways.get(pathwayId);
    if (!pathway) return;

    const milestone = pathway.milestones.find(m => m.id === milestoneId);
    if (!milestone) return;

    milestone.status = status;
    if (status === 'completed') {
      milestone.actualDate = Date.now();
      milestone.completedBy = completedBy;
    }

    // Recalculate compliance score
    pathway.complianceScore = this.calculateComplianceScore(pathway);

    this.saveToStorage();
    this.notifyListeners();
  }

  updateCriteria(
    pathwayId: string,
    milestoneId: string,
    criteriaId: string,
    met: boolean,
    value?: string,
    documentedBy?: string
  ): void {
    const pathway = this.pathways.get(pathwayId);
    if (!pathway) return;

    const milestone = pathway.milestones.find(m => m.id === milestoneId);
    if (!milestone) return;

    const criteria = milestone.criteria.find(c => c.id === criteriaId);
    if (!criteria) return;

    criteria.met = met;
    criteria.value = value;
    criteria.documentedAt = Date.now();
    criteria.documentedBy = documentedBy;

    // Check if all criteria met - auto-complete milestone
    if (milestone.criteria.every(c => c.met)) {
      milestone.status = 'completed';
      milestone.actualDate = Date.now();
      milestone.completedBy = documentedBy;
    }

    pathway.complianceScore = this.calculateComplianceScore(pathway);

    this.saveToStorage();
    this.notifyListeners();
  }

  reportVariance(
    pathwayId: string,
    milestoneId: string,
    type: PathwayVariance['type'],
    severity: VarianceSeverity,
    description: string,
    reason: string,
    impact: string,
    reportedBy: string
  ): void {
    const pathway = this.pathways.get(pathwayId);
    if (!pathway) return;

    const milestone = pathway.milestones.find(m => m.id === milestoneId);
    if (!milestone) return;

    const variance: PathwayVariance = {
      id: `VAR-${Date.now()}`,
      milestoneId,
      milestoneName: milestone.name,
      type,
      severity,
      description,
      reason,
      impact,
      reportedAt: Date.now(),
      reportedBy,
    };

    pathway.variances.push(variance);
    milestone.status = 'variance';

    this.saveToStorage();
    this.notifyListeners();
  }

  addNote(pathwayId: string, text: string, author: string, type: PathwayNote['type']): void {
    const pathway = this.pathways.get(pathwayId);
    if (!pathway) return;

    pathway.notes.push({
      id: `N-${Date.now()}`,
      text,
      author,
      timestamp: Date.now(),
      type,
    });

    this.saveToStorage();
    this.notifyListeners();
  }

  completePathway(pathwayId: string): void {
    const pathway = this.pathways.get(pathwayId);
    if (!pathway) return;

    pathway.status = 'completed';
    pathway.actualEndDate = Date.now();

    this.saveToStorage();
    this.notifyListeners();
  }

  discontinuePathway(pathwayId: string, reason: string): void {
    const pathway = this.pathways.get(pathwayId);
    if (!pathway) return;

    pathway.status = 'discontinued';
    pathway.actualEndDate = Date.now();
    pathway.notes.push({
      id: `N-${Date.now()}`,
      text: `Pathway discontinued: ${reason}`,
      author: 'System',
      timestamp: Date.now(),
      type: 'plan_change',
    });

    this.saveToStorage();
    this.notifyListeners();
  }

  // ============================================
  // QUERY METHODS
  // ============================================

  getPathways(): PatientPathway[] {
    return Array.from(this.pathways.values());
  }

  getActivePathways(): PatientPathway[] {
    return Array.from(this.pathways.values()).filter(p => p.status === 'active');
  }

  getPathway(id: string): PatientPathway | undefined {
    return this.pathways.get(id);
  }

  getPathwayByPatient(patientId: string): PatientPathway | undefined {
    return Array.from(this.pathways.values()).find(p => p.patientId === patientId && p.status === 'active');
  }

  // ============================================
  // ANALYTICS
  // ============================================

  calculateComplianceScore(pathway: PatientPathway): number {
    const now = Date.now();
    const dueMilestones = pathway.milestones.filter(m => m.expectedDate <= now);
    
    if (dueMilestones.length === 0) return 100;

    const completedOnTime = dueMilestones.filter(m => 
      m.status === 'completed' && m.actualDate && m.actualDate <= m.expectedDate + 24 * 60 * 60 * 1000
    ).length;

    return Math.round((completedOnTime / dueMilestones.length) * 100);
  }

  getDashboardSummary(): PathwayDashboardSummary {
    const pathways = Array.from(this.pathways.values());
    const active = pathways.filter(p => p.status === 'active');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();
    const todayEnd = todayStart + 24 * 60 * 60 * 1000;

    const completedToday = pathways.filter(p => 
      p.status === 'completed' && p.actualEndDate && 
      p.actualEndDate >= todayStart && p.actualEndDate < todayEnd
    ).length;

    const allVariances = active.flatMap(p => p.variances);
    const avgCompliance = active.length > 0
      ? Math.round(active.reduce((sum, p) => sum + p.complianceScore, 0) / active.length)
      : 0;

    // Calculate average LOS variance
    const completed = pathways.filter(p => p.status === 'completed' && p.actualEndDate);
    const avgLOSVariance = completed.length > 0
      ? completed.reduce((sum, p) => {
          const expected = p.expectedEndDate - p.startDate;
          const actual = (p.actualEndDate || p.expectedEndDate) - p.startDate;
          return sum + ((actual - expected) / (24 * 60 * 60 * 1000));
        }, 0) / completed.length
      : 0;

    // Group by category
    const categoryMap: Record<string, number> = {};
    active.forEach(p => {
      categoryMap[p.category] = (categoryMap[p.category] || 0) + 1;
    });

    // Upcoming milestones
    const upcomingMilestones = active.flatMap(p =>
      p.milestones
        .filter(m => m.status === 'pending' && m.expectedDate <= Date.now() + 2 * 24 * 60 * 60 * 1000)
        .map(m => ({
          patientName: p.patientName,
          milestone: m.name,
          dueDate: m.expectedDate,
        }))
    ).sort((a, b) => a.dueDate - b.dueDate).slice(0, 5);

    return {
      activePathways: active.length,
      completedToday,
      variancesReported: allVariances.length,
      avgComplianceScore: avgCompliance,
      avgLOSVariance: Math.round(avgLOSVariance * 10) / 10,
      pathwaysByCategory: Object.entries(categoryMap).map(([category, count]) => ({
        category: category as PathwayCategory,
        count,
      })),
      recentVariances: allVariances.slice(-5).reverse(),
      upcomingMilestones,
    };
  }

  // ============================================
  // HELPERS
  // ============================================

  getCategoryColor(category: PathwayCategory): string {
    const colors: Record<PathwayCategory, string> = {
      CHF: '#EF4444',
      Pneumonia: '#3B82F6',
      Hip_Replacement: '#8B5CF6',
      Stroke: '#F97316',
      COPD: '#14B8A6',
      AMI: '#EC4899',
      Sepsis: '#F59E0B',
      DKA: '#6366F1',
    };
    return colors[category];
  }

  getStatusColor(status: MilestoneStatus): string {
    const colors: Record<MilestoneStatus, string> = {
      pending: '#6B7280',
      in_progress: '#3B82F6',
      completed: '#22C55E',
      delayed: '#F59E0B',
      skipped: '#9CA3AF',
      variance: '#EF4444',
    };
    return colors[status];
  }

  // ============================================
  // SUBSCRIPTION
  // ============================================

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
}

export const clinicalPathwayService = new ClinicalPathwayService();
