/**
 * Nurse Assignment Optimization Service
 * AI-powered nurse-to-patient assignment with acuity scoring,
 * workload balancing, and skill matching
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// TYPES AND INTERFACES
// ============================================

export type NurseRole = 'RN' | 'LPN' | 'CNA' | 'Charge' | 'Resource' | 'Float';
export type ShiftType = 'day' | 'evening' | 'night';
export type SkillLevel = 'novice' | 'competent' | 'proficient' | 'expert';
export type UnitType = 'ED' | 'ICU' | 'MedSurg' | 'Surgical' | 'Pediatric' | 'Maternity' | 'Psych' | 'Rehab';

export interface Nurse {
  id: string;
  name: string;
  role: NurseRole;
  primaryUnit: UnitType;
  skills: NurseSkill[];
  certifications: string[];
  yearsExperience: number;
  skillLevel: SkillLevel;
  maxPatients: number;
  currentPatients: string[];
  currentWorkload: number;
  shiftStart: number;
  shiftEnd: number;
  shiftType: ShiftType;
  isFloating: boolean;
  floatCapableUnits: UnitType[];
  preferences: NursePreferences;
  performanceMetrics: PerformanceMetrics;
  consecutiveShifts: number;
  lastAssignmentChange: number;
}

export interface NurseSkill {
  name: string;
  level: SkillLevel;
  certifiedDate?: number;
  expirationDate?: number;
}

export interface NursePreferences {
  preferredPatientTypes: string[];
  avoidPatientTypes: string[];
  maxAcuityPreference: number;
  continuityImportance: 'low' | 'medium' | 'high';
}

export interface PerformanceMetrics {
  patientSatisfaction: number; // 0-100
  medicationErrorRate: number; // per 1000 administrations
  fallRate: number; // per 1000 patient days
  documentationCompliance: number; // 0-100
  overtimeHours: number; // last 30 days
}

export interface Patient {
  id: string;
  name: string;
  mrn: string;
  unit: UnitType;
  bedId: string;
  acuityScore: number; // 1-5
  acuityFactors: AcuityFactor[];
  diagnosis: string;
  isolationPrecautions?: string[];
  specialNeeds: string[];
  preferredNurse?: string;
  assignedNurse?: string;
  admissionDate: number;
  expectedDischarge?: number;
  fallRisk: 'low' | 'moderate' | 'high';
  codeStatus: 'full' | 'dnr' | 'dni' | 'comfort';
}

export interface AcuityFactor {
  category: string;
  factor: string;
  points: number;
  description: string;
}

export interface Assignment {
  id: string;
  nurseId: string;
  nurseName: string;
  patientIds: string[];
  unit: UnitType;
  shiftType: ShiftType;
  shiftDate: number;
  totalAcuity: number;
  workloadScore: number;
  continuityScore: number;
  skillMatchScore: number;
  overallScore: number;
  status: 'proposed' | 'confirmed' | 'active' | 'completed';
  createdAt: number;
  confirmedAt?: number;
  confirmedBy?: string;
  notes?: string;
}

export interface AssignmentRecommendation {
  nurseId: string;
  nurseName: string;
  patientId: string;
  patientName: string;
  score: number;
  reasons: string[];
  concerns: string[];
  alternativeNurses: { nurseId: string; nurseName: string; score: number }[];
}

export interface WorkloadAnalysis {
  nurseId: string;
  nurseName: string;
  currentPatients: number;
  maxPatients: number;
  totalAcuity: number;
  workloadPercentage: number;
  status: 'under' | 'optimal' | 'over';
  recommendation: string;
}

export interface UnitStaffingStatus {
  unit: UnitType;
  totalNurses: number;
  totalPatients: number;
  averageRatio: number;
  targetRatio: number;
  staffingLevel: 'critical' | 'short' | 'adequate' | 'over';
  averageAcuity: number;
  floatNeeded: number;
  overtimeRisk: number;
}

export interface ShiftHandoverSummary {
  fromShift: ShiftType;
  toShift: ShiftType;
  unit: UnitType;
  continuityMaintained: number; // percentage
  newAssignments: number;
  criticalPatients: string[];
  pendingTasks: string[];
}

export interface FairnessMetrics {
  nurseId: string;
  nurseName: string;
  weeklyPatientCount: number;
  weeklyAcuityTotal: number;
  weeklyHighAcuityCount: number;
  weeklyAdmissions: number;
  weeklyDischarges: number;
  fairnessScore: number; // 0-100, 50 is perfectly fair
}

// ============================================
// NURSE ASSIGNMENT SERVICE
// ============================================

class NurseAssignmentService {
  private nurses: Map<string, Nurse> = new Map();
  private patients: Map<string, Patient> = new Map();
  private assignments: Map<string, Assignment> = new Map();
  private listeners: Set<() => void> = new Set();
  private readonly STORAGE_KEY = '@medivac_nurse_assignments';

  // Target nurse-to-patient ratios by unit
  private readonly TARGET_RATIOS: Record<UnitType, number> = {
    ICU: 2,
    ED: 4,
    MedSurg: 5,
    Surgical: 4,
    Pediatric: 4,
    Maternity: 3,
    Psych: 5,
    Rehab: 6,
  };

  constructor() {
    this.initializeSampleData();
    this.loadFromStorage();
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  private initializeSampleData(): void {
    const now = Date.now();
    const hour = 60 * 60 * 1000;

    // Sample nurses
    const sampleNurses: Nurse[] = [
      {
        id: 'NRS-001',
        name: 'Sarah Johnson',
        role: 'RN',
        primaryUnit: 'ICU',
        skills: [
          { name: 'Critical Care', level: 'expert' },
          { name: 'Ventilator Management', level: 'expert' },
          { name: 'CRRT', level: 'proficient' },
        ],
        certifications: ['CCRN', 'BLS', 'ACLS'],
        yearsExperience: 8,
        skillLevel: 'expert',
        maxPatients: 2,
        currentPatients: ['PAT-001', 'PAT-002'],
        currentWorkload: 85,
        shiftStart: now - 4 * hour,
        shiftEnd: now + 8 * hour,
        shiftType: 'day',
        isFloating: false,
        floatCapableUnits: ['MedSurg'],
        preferences: {
          preferredPatientTypes: ['cardiac', 'respiratory'],
          avoidPatientTypes: [],
          maxAcuityPreference: 5,
          continuityImportance: 'high',
        },
        performanceMetrics: {
          patientSatisfaction: 92,
          medicationErrorRate: 0.2,
          fallRate: 0.1,
          documentationCompliance: 98,
          overtimeHours: 4,
        },
        consecutiveShifts: 2,
        lastAssignmentChange: now - 2 * hour,
      },
      {
        id: 'NRS-002',
        name: 'Michael Chen',
        role: 'RN',
        primaryUnit: 'MedSurg',
        skills: [
          { name: 'Medical-Surgical', level: 'proficient' },
          { name: 'Wound Care', level: 'expert' },
          { name: 'Diabetes Management', level: 'proficient' },
        ],
        certifications: ['BLS', 'ACLS', 'CWOCN'],
        yearsExperience: 5,
        skillLevel: 'proficient',
        maxPatients: 5,
        currentPatients: ['PAT-003', 'PAT-004', 'PAT-005'],
        currentWorkload: 65,
        shiftStart: now - 4 * hour,
        shiftEnd: now + 8 * hour,
        shiftType: 'day',
        isFloating: false,
        floatCapableUnits: ['Surgical'],
        preferences: {
          preferredPatientTypes: ['wound care', 'diabetic'],
          avoidPatientTypes: ['pediatric'],
          maxAcuityPreference: 4,
          continuityImportance: 'medium',
        },
        performanceMetrics: {
          patientSatisfaction: 88,
          medicationErrorRate: 0.5,
          fallRate: 0.3,
          documentationCompliance: 95,
          overtimeHours: 8,
        },
        consecutiveShifts: 3,
        lastAssignmentChange: now - 6 * hour,
      },
      {
        id: 'NRS-003',
        name: 'Emily Rodriguez',
        role: 'RN',
        primaryUnit: 'ED',
        skills: [
          { name: 'Emergency Care', level: 'expert' },
          { name: 'Trauma', level: 'proficient' },
          { name: 'Triage', level: 'expert' },
        ],
        certifications: ['CEN', 'BLS', 'ACLS', 'PALS', 'TNCC'],
        yearsExperience: 6,
        skillLevel: 'expert',
        maxPatients: 4,
        currentPatients: ['PAT-006', 'PAT-007'],
        currentWorkload: 55,
        shiftStart: now - 4 * hour,
        shiftEnd: now + 8 * hour,
        shiftType: 'day',
        isFloating: false,
        floatCapableUnits: ['ICU', 'MedSurg'],
        preferences: {
          preferredPatientTypes: ['trauma', 'cardiac'],
          avoidPatientTypes: [],
          maxAcuityPreference: 5,
          continuityImportance: 'low',
        },
        performanceMetrics: {
          patientSatisfaction: 90,
          medicationErrorRate: 0.3,
          fallRate: 0.2,
          documentationCompliance: 92,
          overtimeHours: 12,
        },
        consecutiveShifts: 1,
        lastAssignmentChange: now - hour,
      },
      {
        id: 'NRS-004',
        name: 'David Kim',
        role: 'Float',
        primaryUnit: 'MedSurg',
        skills: [
          { name: 'Medical-Surgical', level: 'competent' },
          { name: 'Telemetry', level: 'competent' },
        ],
        certifications: ['BLS', 'ACLS'],
        yearsExperience: 2,
        skillLevel: 'competent',
        maxPatients: 5,
        currentPatients: [],
        currentWorkload: 0,
        shiftStart: now - 4 * hour,
        shiftEnd: now + 8 * hour,
        shiftType: 'day',
        isFloating: true,
        floatCapableUnits: ['MedSurg', 'Surgical', 'Rehab'],
        preferences: {
          preferredPatientTypes: [],
          avoidPatientTypes: ['isolation'],
          maxAcuityPreference: 3,
          continuityImportance: 'low',
        },
        performanceMetrics: {
          patientSatisfaction: 82,
          medicationErrorRate: 0.8,
          fallRate: 0.5,
          documentationCompliance: 88,
          overtimeHours: 2,
        },
        consecutiveShifts: 1,
        lastAssignmentChange: now,
      },
      {
        id: 'NRS-005',
        name: 'Lisa Thompson',
        role: 'Charge',
        primaryUnit: 'MedSurg',
        skills: [
          { name: 'Medical-Surgical', level: 'expert' },
          { name: 'Leadership', level: 'expert' },
          { name: 'Resource Management', level: 'expert' },
        ],
        certifications: ['BLS', 'ACLS', 'CNML'],
        yearsExperience: 12,
        skillLevel: 'expert',
        maxPatients: 3,
        currentPatients: ['PAT-008'],
        currentWorkload: 40,
        shiftStart: now - 4 * hour,
        shiftEnd: now + 8 * hour,
        shiftType: 'day',
        isFloating: false,
        floatCapableUnits: [],
        preferences: {
          preferredPatientTypes: [],
          avoidPatientTypes: [],
          maxAcuityPreference: 4,
          continuityImportance: 'medium',
        },
        performanceMetrics: {
          patientSatisfaction: 94,
          medicationErrorRate: 0.1,
          fallRate: 0.1,
          documentationCompliance: 99,
          overtimeHours: 6,
        },
        consecutiveShifts: 2,
        lastAssignmentChange: now - 3 * hour,
      },
    ];

    // Sample patients
    const samplePatients: Patient[] = [
      {
        id: 'PAT-001',
        name: 'John Smith',
        mrn: 'MRN-12345',
        unit: 'ICU',
        bedId: 'ICU-01',
        acuityScore: 5,
        acuityFactors: [
          { category: 'Respiratory', factor: 'Mechanical Ventilation', points: 2, description: 'Requires continuous ventilator management' },
          { category: 'Hemodynamic', factor: 'Vasopressor Support', points: 2, description: 'On multiple vasopressors' },
          { category: 'Monitoring', factor: 'Continuous Monitoring', points: 1, description: 'Requires 1:1 monitoring' },
        ],
        diagnosis: 'Septic Shock',
        isolationPrecautions: ['Contact'],
        specialNeeds: ['Prone positioning', 'CRRT'],
        assignedNurse: 'NRS-001',
        admissionDate: now - 3 * 24 * hour,
        fallRisk: 'high',
        codeStatus: 'full',
      },
      {
        id: 'PAT-002',
        name: 'Mary Johnson',
        mrn: 'MRN-12346',
        unit: 'ICU',
        bedId: 'ICU-02',
        acuityScore: 4,
        acuityFactors: [
          { category: 'Cardiac', factor: 'Post-CABG', points: 2, description: 'Day 1 post cardiac surgery' },
          { category: 'Monitoring', factor: 'Arterial Line', points: 1, description: 'Continuous arterial monitoring' },
          { category: 'Pain', factor: 'PCA Management', points: 1, description: 'Patient-controlled analgesia' },
        ],
        diagnosis: 'Post CABG x3',
        specialNeeds: ['Chest tube management', 'Early mobilization'],
        assignedNurse: 'NRS-001',
        admissionDate: now - 24 * hour,
        fallRisk: 'high',
        codeStatus: 'full',
      },
      {
        id: 'PAT-003',
        name: 'Robert Williams',
        mrn: 'MRN-12347',
        unit: 'MedSurg',
        bedId: 'MS-201',
        acuityScore: 3,
        acuityFactors: [
          { category: 'Wound', factor: 'Complex Wound Care', points: 2, description: 'Stage 3 pressure ulcer requiring BID dressing changes' },
          { category: 'Diabetes', factor: 'Insulin Drip', points: 1, description: 'Continuous insulin infusion' },
        ],
        diagnosis: 'DKA, Pressure Ulcer',
        specialNeeds: ['Wound care specialist consult', 'Nutrition consult'],
        assignedNurse: 'NRS-002',
        admissionDate: now - 5 * 24 * hour,
        fallRisk: 'moderate',
        codeStatus: 'full',
      },
      {
        id: 'PAT-004',
        name: 'Linda Davis',
        mrn: 'MRN-12348',
        unit: 'MedSurg',
        bedId: 'MS-202',
        acuityScore: 2,
        acuityFactors: [
          { category: 'Medical', factor: 'IV Antibiotics', points: 1, description: 'Q6h IV antibiotics' },
          { category: 'Mobility', factor: 'Fall Precautions', points: 1, description: 'Requires assistance with ambulation' },
        ],
        diagnosis: 'Pneumonia',
        specialNeeds: ['Respiratory therapy'],
        assignedNurse: 'NRS-002',
        admissionDate: now - 2 * 24 * hour,
        expectedDischarge: now + 24 * hour,
        fallRisk: 'moderate',
        codeStatus: 'full',
      },
      {
        id: 'PAT-005',
        name: 'James Brown',
        mrn: 'MRN-12349',
        unit: 'MedSurg',
        bedId: 'MS-203',
        acuityScore: 2,
        acuityFactors: [
          { category: 'Post-Op', factor: 'Post Appendectomy', points: 1, description: 'Day 1 post laparoscopic appendectomy' },
          { category: 'Pain', factor: 'Pain Management', points: 1, description: 'Oral pain medication management' },
        ],
        diagnosis: 'Post Appendectomy',
        specialNeeds: [],
        assignedNurse: 'NRS-002',
        admissionDate: now - 24 * hour,
        expectedDischarge: now + 12 * hour,
        fallRisk: 'low',
        codeStatus: 'full',
      },
      {
        id: 'PAT-006',
        name: 'Patricia Miller',
        mrn: 'MRN-12350',
        unit: 'ED',
        bedId: 'ED-05',
        acuityScore: 4,
        acuityFactors: [
          { category: 'Cardiac', factor: 'Chest Pain', points: 2, description: 'Rule out MI, serial troponins' },
          { category: 'Monitoring', factor: 'Telemetry', points: 1, description: 'Continuous cardiac monitoring' },
          { category: 'Testing', factor: 'Pending Results', points: 1, description: 'Multiple pending diagnostics' },
        ],
        diagnosis: 'Chest Pain - R/O MI',
        specialNeeds: ['Cardiology consult'],
        assignedNurse: 'NRS-003',
        admissionDate: now - 4 * hour,
        fallRisk: 'low',
        codeStatus: 'full',
      },
      {
        id: 'PAT-007',
        name: 'Thomas Wilson',
        mrn: 'MRN-12351',
        unit: 'ED',
        bedId: 'ED-08',
        acuityScore: 3,
        acuityFactors: [
          { category: 'Trauma', factor: 'Fall Injury', points: 2, description: 'Fall from height, multiple contusions' },
          { category: 'Testing', factor: 'CT Pending', points: 1, description: 'Awaiting CT results' },
        ],
        diagnosis: 'Fall - Trauma Workup',
        specialNeeds: ['Trauma surgery consult'],
        assignedNurse: 'NRS-003',
        admissionDate: now - 2 * hour,
        fallRisk: 'high',
        codeStatus: 'full',
      },
      {
        id: 'PAT-008',
        name: 'Barbara Anderson',
        mrn: 'MRN-12352',
        unit: 'MedSurg',
        bedId: 'MS-210',
        acuityScore: 2,
        acuityFactors: [
          { category: 'Medical', factor: 'CHF Management', points: 1, description: 'Diuretic therapy, daily weights' },
          { category: 'Education', factor: 'Discharge Teaching', points: 1, description: 'Extensive discharge education needed' },
        ],
        diagnosis: 'CHF Exacerbation',
        specialNeeds: ['Cardiac rehab referral', 'Home health setup'],
        assignedNurse: 'NRS-005',
        admissionDate: now - 4 * 24 * hour,
        expectedDischarge: now + 24 * hour,
        fallRisk: 'moderate',
        codeStatus: 'dnr',
      },
    ];

    sampleNurses.forEach(n => this.nurses.set(n.id, n));
    samplePatients.forEach(p => this.patients.set(p.id, p));
  }

  private async loadFromStorage(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.assignments) {
          parsed.assignments.forEach((a: Assignment) => this.assignments.set(a.id, a));
        }
      }
    } catch (error) {
      console.error('Failed to load assignment data:', error);
    }
  }

  private async saveToStorage(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        assignments: Array.from(this.assignments.values()),
      }));
    } catch (error) {
      console.error('Failed to save assignment data:', error);
    }
  }

  // ============================================
  // ACUITY CALCULATION
  // ============================================

  calculatePatientAcuity(patient: Patient): number {
    return patient.acuityFactors.reduce((sum, f) => sum + f.points, 0);
  }

  getAcuityColor(acuity: number): string {
    if (acuity >= 5) return '#EF4444'; // Critical
    if (acuity >= 4) return '#F97316'; // High
    if (acuity >= 3) return '#F59E0B'; // Moderate
    if (acuity >= 2) return '#22C55E'; // Low
    return '#6B7280'; // Minimal
  }

  getAcuityLabel(acuity: number): string {
    if (acuity >= 5) return 'Critical';
    if (acuity >= 4) return 'High';
    if (acuity >= 3) return 'Moderate';
    if (acuity >= 2) return 'Low';
    return 'Minimal';
  }

  // ============================================
  // WORKLOAD ANALYSIS
  // ============================================

  calculateNurseWorkload(nurse: Nurse): number {
    const patients = nurse.currentPatients.map(id => this.patients.get(id)).filter(Boolean) as Patient[];
    const totalAcuity = patients.reduce((sum, p) => sum + p.acuityScore, 0);
    const maxAcuity = nurse.maxPatients * 5; // Max possible acuity
    return Math.round((totalAcuity / maxAcuity) * 100);
  }

  analyzeWorkloads(): WorkloadAnalysis[] {
    return Array.from(this.nurses.values()).map(nurse => {
      const patients = nurse.currentPatients.map(id => this.patients.get(id)).filter(Boolean) as Patient[];
      const totalAcuity = patients.reduce((sum, p) => sum + p.acuityScore, 0);
      const workloadPercentage = this.calculateNurseWorkload(nurse);
      
      let status: WorkloadAnalysis['status'];
      let recommendation: string;
      
      if (workloadPercentage < 50) {
        status = 'under';
        recommendation = 'Can accept additional patients';
      } else if (workloadPercentage <= 85) {
        status = 'optimal';
        recommendation = 'Workload is balanced';
      } else {
        status = 'over';
        recommendation = 'Consider redistributing patients';
      }

      return {
        nurseId: nurse.id,
        nurseName: nurse.name,
        currentPatients: nurse.currentPatients.length,
        maxPatients: nurse.maxPatients,
        totalAcuity,
        workloadPercentage,
        status,
        recommendation,
      };
    });
  }

  // ============================================
  // ASSIGNMENT OPTIMIZATION
  // ============================================

  generateOptimalAssignments(unit: UnitType, shiftType: ShiftType): AssignmentRecommendation[] {
    const availableNurses = Array.from(this.nurses.values()).filter(
      n => (n.primaryUnit === unit || n.floatCapableUnits.includes(unit)) && n.shiftType === shiftType
    );
    
    const unassignedPatients = Array.from(this.patients.values()).filter(
      p => p.unit === unit && !p.assignedNurse
    );

    const recommendations: AssignmentRecommendation[] = [];

    for (const patient of unassignedPatients) {
      const scoredNurses = availableNurses.map(nurse => {
        let score = 100;
        const reasons: string[] = [];
        const concerns: string[] = [];

        // Skill match (30 points max)
        const hasRequiredSkills = nurse.skills.some(s => 
          patient.specialNeeds.some(need => s.name.toLowerCase().includes(need.toLowerCase()))
        );
        if (hasRequiredSkills) {
          score += 30;
          reasons.push('Has required skills');
        }

        // Workload balance (25 points max)
        const currentWorkload = this.calculateNurseWorkload(nurse);
        if (currentWorkload < 50) {
          score += 25;
          reasons.push('Has capacity for more patients');
        } else if (currentWorkload < 75) {
          score += 15;
        } else if (currentWorkload > 85) {
          score -= 20;
          concerns.push('Already at high workload');
        }

        // Continuity of care (20 points max)
        if (patient.preferredNurse === nurse.id) {
          score += 20;
          reasons.push('Patient continuity maintained');
        }

        // Acuity match (15 points max)
        if (patient.acuityScore <= nurse.preferences.maxAcuityPreference) {
          score += 15;
        } else {
          score -= 10;
          concerns.push('Patient acuity exceeds preference');
        }

        // Experience level (10 points max)
        if (patient.acuityScore >= 4 && nurse.skillLevel === 'expert') {
          score += 10;
          reasons.push('Expert nurse for high-acuity patient');
        } else if (patient.acuityScore >= 4 && nurse.skillLevel === 'novice') {
          score -= 15;
          concerns.push('Novice nurse for high-acuity patient');
        }

        // Geographic proximity (already on unit)
        if (nurse.primaryUnit === unit && !nurse.isFloating) {
          score += 5;
          reasons.push('Primary unit assignment');
        }

        // Isolation considerations
        if (patient.isolationPrecautions && patient.isolationPrecautions.length > 0) {
          if (nurse.preferences.avoidPatientTypes.includes('isolation')) {
            score -= 10;
            concerns.push('Nurse prefers to avoid isolation patients');
          }
        }

        return { nurse, score, reasons, concerns };
      }).sort((a, b) => b.score - a.score);

      const bestMatch = scoredNurses[0];
      if (bestMatch) {
        recommendations.push({
          nurseId: bestMatch.nurse.id,
          nurseName: bestMatch.nurse.name,
          patientId: patient.id,
          patientName: patient.name,
          score: bestMatch.score,
          reasons: bestMatch.reasons,
          concerns: bestMatch.concerns,
          alternativeNurses: scoredNurses.slice(1, 4).map(s => ({
            nurseId: s.nurse.id,
            nurseName: s.nurse.name,
            score: s.score,
          })),
        });
      }
    }

    return recommendations.sort((a, b) => b.score - a.score);
  }

  // ============================================
  // UNIT STAFFING STATUS
  // ============================================

  getUnitStaffingStatus(): UnitStaffingStatus[] {
    const units: UnitType[] = ['ICU', 'ED', 'MedSurg', 'Surgical', 'Pediatric', 'Maternity', 'Psych', 'Rehab'];
    
    return units.map(unit => {
      const unitNurses = Array.from(this.nurses.values()).filter(n => n.primaryUnit === unit);
      const unitPatients = Array.from(this.patients.values()).filter(p => p.unit === unit);
      
      const totalNurses = unitNurses.length;
      const totalPatients = unitPatients.length;
      const targetRatio = this.TARGET_RATIOS[unit];
      const actualRatio = totalNurses > 0 ? totalPatients / totalNurses : 0;
      
      let staffingLevel: UnitStaffingStatus['staffingLevel'];
      if (actualRatio > targetRatio * 1.3) {
        staffingLevel = 'critical';
      } else if (actualRatio > targetRatio * 1.1) {
        staffingLevel = 'short';
      } else if (actualRatio < targetRatio * 0.7) {
        staffingLevel = 'over';
      } else {
        staffingLevel = 'adequate';
      }

      const averageAcuity = totalPatients > 0
        ? unitPatients.reduce((sum, p) => sum + p.acuityScore, 0) / totalPatients
        : 0;

      const floatNeeded = staffingLevel === 'critical' ? 2 : staffingLevel === 'short' ? 1 : 0;
      
      const overtimeRisk = unitNurses.reduce((sum, n) => sum + n.performanceMetrics.overtimeHours, 0) / Math.max(1, totalNurses);

      return {
        unit,
        totalNurses,
        totalPatients,
        averageRatio: Math.round(actualRatio * 10) / 10,
        targetRatio,
        staffingLevel,
        averageAcuity: Math.round(averageAcuity * 10) / 10,
        floatNeeded,
        overtimeRisk: Math.round(overtimeRisk),
      };
    });
  }

  // ============================================
  // FAIRNESS METRICS
  // ============================================

  calculateFairnessMetrics(): FairnessMetrics[] {
    const nurses = Array.from(this.nurses.values());
    
    // Calculate averages for comparison
    const avgPatients = nurses.reduce((sum, n) => sum + n.currentPatients.length, 0) / nurses.length;
    const avgAcuity = nurses.reduce((sum, n) => {
      const patients = n.currentPatients.map(id => this.patients.get(id)).filter(Boolean) as Patient[];
      return sum + patients.reduce((s, p) => s + p.acuityScore, 0);
    }, 0) / nurses.length;

    return nurses.map(nurse => {
      const patients = nurse.currentPatients.map(id => this.patients.get(id)).filter(Boolean) as Patient[];
      const totalAcuity = patients.reduce((sum, p) => sum + p.acuityScore, 0);
      const highAcuityCount = patients.filter(p => p.acuityScore >= 4).length;
      
      // Simulate weekly data
      const weeklyPatientCount = nurse.currentPatients.length * 5;
      const weeklyAcuityTotal = totalAcuity * 5;
      const weeklyHighAcuityCount = highAcuityCount * 5;
      const weeklyAdmissions = Math.floor(Math.random() * 5) + 2;
      const weeklyDischarges = Math.floor(Math.random() * 5) + 2;

      // Calculate fairness score (50 = perfectly fair)
      const patientDeviation = Math.abs(nurse.currentPatients.length - avgPatients) / avgPatients;
      const acuityDeviation = avgAcuity > 0 ? Math.abs(totalAcuity - avgAcuity) / avgAcuity : 0;
      const fairnessScore = Math.round(50 - (patientDeviation + acuityDeviation) * 25);

      return {
        nurseId: nurse.id,
        nurseName: nurse.name,
        weeklyPatientCount,
        weeklyAcuityTotal,
        weeklyHighAcuityCount,
        weeklyAdmissions,
        weeklyDischarges,
        fairnessScore: Math.max(0, Math.min(100, fairnessScore)),
      };
    });
  }

  // ============================================
  // SHIFT HANDOVER
  // ============================================

  generateHandoverSummary(unit: UnitType, fromShift: ShiftType, toShift: ShiftType): ShiftHandoverSummary {
    const unitPatients = Array.from(this.patients.values()).filter(p => p.unit === unit);
    const criticalPatients = unitPatients.filter(p => p.acuityScore >= 4).map(p => p.name);
    
    // Simulate continuity calculation
    const continuityMaintained = 60 + Math.floor(Math.random() * 30);
    const newAssignments = Math.floor(unitPatients.length * (1 - continuityMaintained / 100));

    const pendingTasks = [
      'Complete medication reconciliation for new admissions',
      'Follow up on pending lab results',
      'Update care plans for high-acuity patients',
    ];

    return {
      fromShift,
      toShift,
      unit,
      continuityMaintained,
      newAssignments,
      criticalPatients,
      pendingTasks,
    };
  }

  // ============================================
  // ASSIGNMENT MANAGEMENT
  // ============================================

  assignPatientToNurse(patientId: string, nurseId: string): boolean {
    const patient = this.patients.get(patientId);
    const nurse = this.nurses.get(nurseId);

    if (!patient || !nurse) return false;

    // Remove from previous nurse if assigned
    if (patient.assignedNurse) {
      const prevNurse = this.nurses.get(patient.assignedNurse);
      if (prevNurse) {
        prevNurse.currentPatients = prevNurse.currentPatients.filter(id => id !== patientId);
        prevNurse.currentWorkload = this.calculateNurseWorkload(prevNurse);
      }
    }

    // Assign to new nurse
    patient.assignedNurse = nurseId;
    if (!nurse.currentPatients.includes(patientId)) {
      nurse.currentPatients.push(patientId);
    }
    nurse.currentWorkload = this.calculateNurseWorkload(nurse);
    nurse.lastAssignmentChange = Date.now();

    this.saveToStorage();
    this.notifyListeners();
    return true;
  }

  unassignPatient(patientId: string): boolean {
    const patient = this.patients.get(patientId);
    if (!patient || !patient.assignedNurse) return false;

    const nurse = this.nurses.get(patient.assignedNurse);
    if (nurse) {
      nurse.currentPatients = nurse.currentPatients.filter(id => id !== patientId);
      nurse.currentWorkload = this.calculateNurseWorkload(nurse);
    }

    patient.assignedNurse = undefined;
    this.saveToStorage();
    this.notifyListeners();
    return true;
  }

  // ============================================
  // QUERY METHODS
  // ============================================

  getNurses(): Nurse[] {
    return Array.from(this.nurses.values());
  }

  getNursesByUnit(unit: UnitType): Nurse[] {
    return Array.from(this.nurses.values()).filter(n => n.primaryUnit === unit);
  }

  getPatients(): Patient[] {
    return Array.from(this.patients.values());
  }

  getPatientsByUnit(unit: UnitType): Patient[] {
    return Array.from(this.patients.values()).filter(p => p.unit === unit);
  }

  getPatientsByNurse(nurseId: string): Patient[] {
    const nurse = this.nurses.get(nurseId);
    if (!nurse) return [];
    return nurse.currentPatients.map(id => this.patients.get(id)).filter(Boolean) as Patient[];
  }

  getFloatPoolNurses(): Nurse[] {
    return Array.from(this.nurses.values()).filter(n => n.isFloating || n.role === 'Float');
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

export const nurseAssignmentService = new NurseAssignmentService();
