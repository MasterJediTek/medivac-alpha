/**
 * Readmission Risk Prediction Service
 * ML-powered 30-day readmission risk scoring with LACE, HOSPITAL,
 * and diagnosis-specific models
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// TYPES AND INTERFACES
// ============================================

export type RiskLevel = 'low' | 'moderate' | 'high' | 'very_high';
export type DiagnosisCategory = 'CHF' | 'COPD' | 'Pneumonia' | 'AMI' | 'Stroke' | 'Hip_Fracture' | 'Diabetes' | 'General';

export interface PatientRiskProfile {
  id: string;
  patientId: string;
  patientName: string;
  mrn: string;
  admissionDate: number;
  expectedDischarge?: number;
  primaryDiagnosis: string;
  diagnosisCategory: DiagnosisCategory;
  laceScore: LACEScore;
  hospitalScore: HOSPITALScore;
  charlsonIndex: CharlsonIndex;
  socialFactors: SocialDeterminants;
  overallRiskScore: number;
  riskLevel: RiskLevel;
  riskTrend: RiskTrend[];
  interventions: RecommendedIntervention[];
  followUpPlan: FollowUpPlan;
  lastCalculated: number;
}

export interface LACEScore {
  lengthOfStay: number; // L: 0-7 points
  acuityOfAdmission: number; // A: 0-3 points (emergency = 3)
  comorbidities: number; // C: 0-5 points (Charlson-based)
  edVisits: number; // E: 0-4 points (last 6 months)
  totalScore: number; // 0-19
  riskPercentage: number;
}

export interface HOSPITALScore {
  hemoglobinLow: number; // 0-1
  dischargeFromOncology: number; // 0-2
  sodiumLow: number; // 0-1
  procedureDuringStay: number; // 0-1
  indexAdmissionType: number; // 0-1 (urgent/emergent)
  admissionsLastYear: number; // 0-5
  lengthOfStay5Plus: number; // 0-2
  totalScore: number; // 0-13
  riskPercentage: number;
}

export interface CharlsonIndex {
  conditions: ComorbidCondition[];
  totalScore: number;
  tenYearSurvival: number;
  ageAdjustedScore: number;
}

export interface ComorbidCondition {
  name: string;
  points: number;
  present: boolean;
}

export interface SocialDeterminants {
  livesAlone: boolean;
  hasCaregiver: boolean;
  transportationAccess: boolean;
  medicationAffordability: boolean;
  foodSecurity: boolean;
  housingStability: boolean;
  healthLiteracy: 'low' | 'moderate' | 'high';
  primaryLanguageEnglish: boolean;
  insuranceType: 'medicare' | 'medicaid' | 'private' | 'uninsured';
  socialRiskScore: number;
}

export interface RiskTrend {
  timestamp: number;
  riskScore: number;
  factors: string[];
}

export interface RecommendedIntervention {
  id: string;
  category: 'medication' | 'education' | 'followup' | 'social' | 'care_coordination';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'declined';
  assignedTo?: string;
  dueDate?: number;
  completedDate?: number;
  evidence: string;
}

export interface FollowUpPlan {
  primaryCareVisit: { scheduled: boolean; date?: number; provider?: string };
  specialistVisits: { specialty: string; scheduled: boolean; date?: number }[];
  homeHealth: { ordered: boolean; services: string[] };
  telehealth: { enrolled: boolean; frequency?: string };
  medicationReconciliation: { completed: boolean; date?: number };
  patientEducation: { topics: string[]; completed: boolean };
}

export interface RiskDashboardSummary {
  totalPatients: number;
  highRiskCount: number;
  veryHighRiskCount: number;
  averageRiskScore: number;
  pendingInterventions: number;
  scheduledFollowUps: number;
  riskDistribution: { level: RiskLevel; count: number; percentage: number }[];
  topRiskFactors: { factor: string; count: number }[];
}

export interface DiagnosisSpecificModel {
  diagnosis: DiagnosisCategory;
  baselineRisk: number;
  riskFactors: { factor: string; weight: number; present: boolean }[];
  adjustedRisk: number;
  evidenceLevel: 'A' | 'B' | 'C';
}

// ============================================
// READMISSION RISK SERVICE
// ============================================

class ReadmissionRiskService {
  private profiles: Map<string, PatientRiskProfile> = new Map();
  private listeners: Set<() => void> = new Set();
  private readonly STORAGE_KEY = '@medivac_readmission_risk';

  // Charlson Comorbidity Index conditions
  private readonly CHARLSON_CONDITIONS: { name: string; points: number }[] = [
    { name: 'Myocardial Infarction', points: 1 },
    { name: 'Congestive Heart Failure', points: 1 },
    { name: 'Peripheral Vascular Disease', points: 1 },
    { name: 'Cerebrovascular Disease', points: 1 },
    { name: 'Dementia', points: 1 },
    { name: 'Chronic Pulmonary Disease', points: 1 },
    { name: 'Connective Tissue Disease', points: 1 },
    { name: 'Peptic Ulcer Disease', points: 1 },
    { name: 'Mild Liver Disease', points: 1 },
    { name: 'Diabetes without complications', points: 1 },
    { name: 'Diabetes with complications', points: 2 },
    { name: 'Hemiplegia', points: 2 },
    { name: 'Moderate/Severe Renal Disease', points: 2 },
    { name: 'Malignancy', points: 2 },
    { name: 'Moderate/Severe Liver Disease', points: 3 },
    { name: 'Metastatic Solid Tumor', points: 6 },
    { name: 'AIDS', points: 6 },
  ];

  constructor() {
    this.initializeSampleData();
    this.loadFromStorage();
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  private initializeSampleData(): void {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    const sampleProfiles: PatientRiskProfile[] = [
      {
        id: 'RISK-001',
        patientId: 'PAT-001',
        patientName: 'John Smith',
        mrn: 'MRN-12345',
        admissionDate: now - 5 * day,
        expectedDischarge: now + 2 * day,
        primaryDiagnosis: 'CHF Exacerbation',
        diagnosisCategory: 'CHF',
        laceScore: {
          lengthOfStay: 4, // 5 days = 4 points
          acuityOfAdmission: 3, // Emergency
          comorbidities: 4, // Multiple
          edVisits: 3, // 3 visits in 6 months
          totalScore: 14,
          riskPercentage: 29.2,
        },
        hospitalScore: {
          hemoglobinLow: 1,
          dischargeFromOncology: 0,
          sodiumLow: 1,
          procedureDuringStay: 0,
          indexAdmissionType: 1,
          admissionsLastYear: 3,
          lengthOfStay5Plus: 1,
          totalScore: 7,
          riskPercentage: 24.5,
        },
        charlsonIndex: {
          conditions: [
            { name: 'Congestive Heart Failure', points: 1, present: true },
            { name: 'Diabetes with complications', points: 2, present: true },
            { name: 'Chronic Pulmonary Disease', points: 1, present: true },
            { name: 'Moderate/Severe Renal Disease', points: 2, present: true },
          ],
          totalScore: 6,
          tenYearSurvival: 2,
          ageAdjustedScore: 8,
        },
        socialFactors: {
          livesAlone: true,
          hasCaregiver: false,
          transportationAccess: false,
          medicationAffordability: false,
          foodSecurity: true,
          housingStability: true,
          healthLiteracy: 'low',
          primaryLanguageEnglish: true,
          insuranceType: 'medicare',
          socialRiskScore: 65,
        },
        overallRiskScore: 78,
        riskLevel: 'very_high',
        riskTrend: [
          { timestamp: now - 4 * day, riskScore: 72, factors: ['CHF', 'Prior admissions'] },
          { timestamp: now - 2 * day, riskScore: 75, factors: ['CHF', 'Social factors'] },
          { timestamp: now, riskScore: 78, factors: ['CHF', 'Social factors', 'Medication adherence'] },
        ],
        interventions: [
          {
            id: 'INT-001',
            category: 'care_coordination',
            priority: 'high',
            title: 'Transitional Care Management',
            description: 'Enroll in TCM program with phone call within 2 days of discharge',
            status: 'pending',
            evidence: 'Reduces 30-day readmission by 20% in CHF patients',
          },
          {
            id: 'INT-002',
            category: 'medication',
            priority: 'high',
            title: 'Medication Therapy Management',
            description: 'Pharmacist review and simplification of medication regimen',
            status: 'in_progress',
            assignedTo: 'PharmD Smith',
            evidence: 'Improves adherence by 35%',
          },
          {
            id: 'INT-003',
            category: 'social',
            priority: 'high',
            title: 'Transportation Assistance',
            description: 'Arrange medical transportation for follow-up appointments',
            status: 'pending',
            evidence: 'Missed appointments increase readmission risk by 40%',
          },
        ],
        followUpPlan: {
          primaryCareVisit: { scheduled: true, date: now + 5 * day, provider: 'Dr. Johnson' },
          specialistVisits: [
            { specialty: 'Cardiology', scheduled: true, date: now + 7 * day },
            { specialty: 'Nephrology', scheduled: false },
          ],
          homeHealth: { ordered: true, services: ['Nursing', 'PT', 'OT'] },
          telehealth: { enrolled: true, frequency: 'Weekly' },
          medicationReconciliation: { completed: true, date: now - day },
          patientEducation: { topics: ['CHF self-management', 'Daily weights', 'Sodium restriction'], completed: false },
        },
        lastCalculated: now,
      },
      {
        id: 'RISK-002',
        patientId: 'PAT-002',
        patientName: 'Mary Johnson',
        mrn: 'MRN-12346',
        admissionDate: now - 3 * day,
        expectedDischarge: now + day,
        primaryDiagnosis: 'Community Acquired Pneumonia',
        diagnosisCategory: 'Pneumonia',
        laceScore: {
          lengthOfStay: 2,
          acuityOfAdmission: 3,
          comorbidities: 2,
          edVisits: 1,
          totalScore: 8,
          riskPercentage: 12.8,
        },
        hospitalScore: {
          hemoglobinLow: 0,
          dischargeFromOncology: 0,
          sodiumLow: 0,
          procedureDuringStay: 0,
          indexAdmissionType: 1,
          admissionsLastYear: 1,
          lengthOfStay5Plus: 0,
          totalScore: 2,
          riskPercentage: 6.5,
        },
        charlsonIndex: {
          conditions: [
            { name: 'Chronic Pulmonary Disease', points: 1, present: true },
          ],
          totalScore: 1,
          tenYearSurvival: 96,
          ageAdjustedScore: 2,
        },
        socialFactors: {
          livesAlone: false,
          hasCaregiver: true,
          transportationAccess: true,
          medicationAffordability: true,
          foodSecurity: true,
          housingStability: true,
          healthLiteracy: 'high',
          primaryLanguageEnglish: true,
          insuranceType: 'private',
          socialRiskScore: 15,
        },
        overallRiskScore: 28,
        riskLevel: 'low',
        riskTrend: [
          { timestamp: now - 2 * day, riskScore: 32, factors: ['Pneumonia severity'] },
          { timestamp: now, riskScore: 28, factors: ['Improving clinically'] },
        ],
        interventions: [
          {
            id: 'INT-004',
            category: 'followup',
            priority: 'medium',
            title: 'PCP Follow-up',
            description: 'Schedule follow-up within 7 days',
            status: 'completed',
            completedDate: now - day,
            evidence: 'Standard of care for pneumonia discharge',
          },
        ],
        followUpPlan: {
          primaryCareVisit: { scheduled: true, date: now + 5 * day, provider: 'Dr. Williams' },
          specialistVisits: [],
          homeHealth: { ordered: false, services: [] },
          telehealth: { enrolled: false },
          medicationReconciliation: { completed: true, date: now - day },
          patientEducation: { topics: ['Pneumonia recovery', 'When to seek care'], completed: true },
        },
        lastCalculated: now,
      },
      {
        id: 'RISK-003',
        patientId: 'PAT-003',
        patientName: 'Robert Williams',
        mrn: 'MRN-12347',
        admissionDate: now - 7 * day,
        expectedDischarge: now,
        primaryDiagnosis: 'COPD Exacerbation',
        diagnosisCategory: 'COPD',
        laceScore: {
          lengthOfStay: 5,
          acuityOfAdmission: 3,
          comorbidities: 3,
          edVisits: 4,
          totalScore: 15,
          riskPercentage: 33.5,
        },
        hospitalScore: {
          hemoglobinLow: 0,
          dischargeFromOncology: 0,
          sodiumLow: 0,
          procedureDuringStay: 1,
          indexAdmissionType: 1,
          admissionsLastYear: 4,
          lengthOfStay5Plus: 2,
          totalScore: 8,
          riskPercentage: 28.0,
        },
        charlsonIndex: {
          conditions: [
            { name: 'Chronic Pulmonary Disease', points: 1, present: true },
            { name: 'Congestive Heart Failure', points: 1, present: true },
            { name: 'Diabetes without complications', points: 1, present: true },
          ],
          totalScore: 3,
          tenYearSurvival: 77,
          ageAdjustedScore: 5,
        },
        socialFactors: {
          livesAlone: false,
          hasCaregiver: true,
          transportationAccess: true,
          medicationAffordability: false,
          foodSecurity: true,
          housingStability: true,
          healthLiteracy: 'moderate',
          primaryLanguageEnglish: true,
          insuranceType: 'medicare',
          socialRiskScore: 35,
        },
        overallRiskScore: 62,
        riskLevel: 'high',
        riskTrend: [
          { timestamp: now - 5 * day, riskScore: 58, factors: ['COPD', 'Prior admissions'] },
          { timestamp: now - 2 * day, riskScore: 60, factors: ['COPD', 'Medication cost'] },
          { timestamp: now, riskScore: 62, factors: ['COPD', 'Frequent exacerbations'] },
        ],
        interventions: [
          {
            id: 'INT-005',
            category: 'medication',
            priority: 'high',
            title: 'Inhaler Technique Review',
            description: 'Respiratory therapist to review and optimize inhaler technique',
            status: 'completed',
            completedDate: now - 2 * day,
            evidence: 'Proper technique reduces exacerbations by 30%',
          },
          {
            id: 'INT-006',
            category: 'social',
            priority: 'high',
            title: 'Medication Assistance Program',
            description: 'Enroll in pharmaceutical assistance for inhalers',
            status: 'in_progress',
            evidence: 'Cost is primary barrier to adherence',
          },
          {
            id: 'INT-007',
            category: 'education',
            priority: 'medium',
            title: 'COPD Action Plan',
            description: 'Create personalized action plan for symptom management',
            status: 'pending',
            evidence: 'Reduces ED visits by 25%',
          },
        ],
        followUpPlan: {
          primaryCareVisit: { scheduled: true, date: now + 3 * day, provider: 'Dr. Brown' },
          specialistVisits: [
            { specialty: 'Pulmonology', scheduled: true, date: now + 10 * day },
          ],
          homeHealth: { ordered: true, services: ['Nursing', 'Respiratory Therapy'] },
          telehealth: { enrolled: true, frequency: 'Bi-weekly' },
          medicationReconciliation: { completed: true, date: now - day },
          patientEducation: { topics: ['COPD management', 'Smoking cessation', 'Breathing exercises'], completed: false },
        },
        lastCalculated: now,
      },
    ];

    sampleProfiles.forEach(p => this.profiles.set(p.id, p));
  }

  private async loadFromStorage(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.profiles) {
          parsed.profiles.forEach((p: PatientRiskProfile) => this.profiles.set(p.id, p));
        }
      }
    } catch (error) {
      console.error('Failed to load readmission risk data:', error);
    }
  }

  private async saveToStorage(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        profiles: Array.from(this.profiles.values()),
      }));
    } catch (error) {
      console.error('Failed to save readmission risk data:', error);
    }
  }

  // ============================================
  // LACE SCORE CALCULATION
  // ============================================

  calculateLACEScore(
    lengthOfStayDays: number,
    emergencyAdmission: boolean,
    charlsonScore: number,
    edVisitsLast6Months: number
  ): LACEScore {
    // L: Length of stay
    let losPoints = 0;
    if (lengthOfStayDays === 1) losPoints = 1;
    else if (lengthOfStayDays === 2) losPoints = 2;
    else if (lengthOfStayDays === 3) losPoints = 3;
    else if (lengthOfStayDays >= 4 && lengthOfStayDays <= 6) losPoints = 4;
    else if (lengthOfStayDays >= 7 && lengthOfStayDays <= 13) losPoints = 5;
    else if (lengthOfStayDays >= 14) losPoints = 7;

    // A: Acuity of admission
    const acuityPoints = emergencyAdmission ? 3 : 0;

    // C: Comorbidities (Charlson-based)
    let comorbidityPoints = 0;
    if (charlsonScore === 0) comorbidityPoints = 0;
    else if (charlsonScore === 1) comorbidityPoints = 1;
    else if (charlsonScore === 2) comorbidityPoints = 2;
    else if (charlsonScore === 3) comorbidityPoints = 3;
    else if (charlsonScore >= 4) comorbidityPoints = 5;

    // E: ED visits in past 6 months
    let edPoints = 0;
    if (edVisitsLast6Months === 0) edPoints = 0;
    else if (edVisitsLast6Months === 1) edPoints = 1;
    else if (edVisitsLast6Months === 2) edPoints = 2;
    else if (edVisitsLast6Months === 3) edPoints = 3;
    else if (edVisitsLast6Months >= 4) edPoints = 4;

    const totalScore = losPoints + acuityPoints + comorbidityPoints + edPoints;

    // Risk percentage based on LACE score
    const riskPercentage = this.laceToRiskPercentage(totalScore);

    return {
      lengthOfStay: losPoints,
      acuityOfAdmission: acuityPoints,
      comorbidities: comorbidityPoints,
      edVisits: edPoints,
      totalScore,
      riskPercentage,
    };
  }

  private laceToRiskPercentage(score: number): number {
    // Based on published LACE validation studies
    const riskMap: Record<number, number> = {
      0: 2.0, 1: 2.5, 2: 3.0, 3: 4.0, 4: 5.0,
      5: 6.5, 6: 8.0, 7: 10.0, 8: 12.8, 9: 15.5,
      10: 18.5, 11: 22.0, 12: 25.5, 13: 29.2, 14: 33.0,
      15: 37.0, 16: 41.0, 17: 45.0, 18: 49.0, 19: 53.0,
    };
    return riskMap[Math.min(score, 19)] || 53.0;
  }

  // ============================================
  // HOSPITAL SCORE CALCULATION
  // ============================================

  calculateHOSPITALScore(
    hemoglobinLow: boolean,
    oncologyDischarge: boolean,
    sodiumLow: boolean,
    procedureDuringStay: boolean,
    urgentAdmission: boolean,
    admissionsLastYear: number,
    losOver5Days: boolean
  ): HOSPITALScore {
    const h = hemoglobinLow ? 1 : 0;
    const o = oncologyDischarge ? 2 : 0;
    const s = sodiumLow ? 1 : 0;
    const p = procedureDuringStay ? 1 : 0;
    const i = urgentAdmission ? 1 : 0;
    
    let t = 0;
    if (admissionsLastYear === 0) t = 0;
    else if (admissionsLastYear >= 1 && admissionsLastYear <= 5) t = Math.min(admissionsLastYear, 5);
    
    const a = losOver5Days ? 2 : 0;

    const totalScore = h + o + s + p + i + t + a;
    const riskPercentage = this.hospitalToRiskPercentage(totalScore);

    return {
      hemoglobinLow: h,
      dischargeFromOncology: o,
      sodiumLow: s,
      procedureDuringStay: p,
      indexAdmissionType: i,
      admissionsLastYear: t,
      lengthOfStay5Plus: a,
      totalScore,
      riskPercentage,
    };
  }

  private hospitalToRiskPercentage(score: number): number {
    // Based on HOSPITAL score validation
    if (score <= 4) return 5.8;
    if (score <= 6) return 11.7;
    return 21.4 + (score - 7) * 3;
  }

  // ============================================
  // CHARLSON INDEX
  // ============================================

  calculateCharlsonIndex(presentConditions: string[], patientAge: number): CharlsonIndex {
    const conditions: ComorbidCondition[] = this.CHARLSON_CONDITIONS.map(c => ({
      name: c.name,
      points: c.points,
      present: presentConditions.includes(c.name),
    }));

    const totalScore = conditions
      .filter(c => c.present)
      .reduce((sum, c) => sum + c.points, 0);

    // Age adjustment
    let agePoints = 0;
    if (patientAge >= 50 && patientAge < 60) agePoints = 1;
    else if (patientAge >= 60 && patientAge < 70) agePoints = 2;
    else if (patientAge >= 70 && patientAge < 80) agePoints = 3;
    else if (patientAge >= 80) agePoints = 4;

    const ageAdjustedScore = totalScore + agePoints;

    // 10-year survival estimate
    const tenYearSurvival = Math.round(Math.pow(0.983, Math.exp(ageAdjustedScore * 0.9)) * 100);

    return {
      conditions,
      totalScore,
      tenYearSurvival,
      ageAdjustedScore,
    };
  }

  // ============================================
  // SOCIAL DETERMINANTS
  // ============================================

  calculateSocialRiskScore(factors: Partial<SocialDeterminants>): number {
    let score = 0;
    
    if (factors.livesAlone) score += 15;
    if (!factors.hasCaregiver) score += 15;
    if (!factors.transportationAccess) score += 20;
    if (!factors.medicationAffordability) score += 20;
    if (!factors.foodSecurity) score += 10;
    if (!factors.housingStability) score += 15;
    if (factors.healthLiteracy === 'low') score += 15;
    else if (factors.healthLiteracy === 'moderate') score += 5;
    if (!factors.primaryLanguageEnglish) score += 10;
    if (factors.insuranceType === 'uninsured') score += 25;
    else if (factors.insuranceType === 'medicaid') score += 10;

    return Math.min(100, score);
  }

  // ============================================
  // DIAGNOSIS-SPECIFIC MODELS
  // ============================================

  getDiagnosisSpecificRisk(
    diagnosis: DiagnosisCategory,
    patientFactors: Record<string, boolean>
  ): DiagnosisSpecificModel {
    const models: Record<DiagnosisCategory, { baseline: number; factors: { factor: string; weight: number }[] }> = {
      CHF: {
        baseline: 25,
        factors: [
          { factor: 'Prior CHF admission', weight: 15 },
          { factor: 'EF < 40%', weight: 12 },
          { factor: 'BNP > 500', weight: 10 },
          { factor: 'Renal dysfunction', weight: 8 },
          { factor: 'Medication non-adherence', weight: 15 },
          { factor: 'Dietary non-compliance', weight: 8 },
        ],
      },
      COPD: {
        baseline: 20,
        factors: [
          { factor: 'FEV1 < 50%', weight: 12 },
          { factor: 'Home oxygen', weight: 10 },
          { factor: 'Prior exacerbations', weight: 15 },
          { factor: 'Active smoking', weight: 12 },
          { factor: 'Cor pulmonale', weight: 10 },
        ],
      },
      Pneumonia: {
        baseline: 12,
        factors: [
          { factor: 'Age > 65', weight: 8 },
          { factor: 'Nursing home resident', weight: 12 },
          { factor: 'Immunocompromised', weight: 15 },
          { factor: 'Multilobar involvement', weight: 10 },
        ],
      },
      AMI: {
        baseline: 18,
        factors: [
          { factor: 'Prior MI', weight: 12 },
          { factor: 'EF < 35%', weight: 15 },
          { factor: 'Incomplete revascularization', weight: 10 },
          { factor: 'Diabetes', weight: 8 },
        ],
      },
      Stroke: {
        baseline: 15,
        factors: [
          { factor: 'Prior stroke', weight: 15 },
          { factor: 'Atrial fibrillation', weight: 10 },
          { factor: 'Severe disability', weight: 12 },
          { factor: 'Dysphagia', weight: 8 },
        ],
      },
      Hip_Fracture: {
        baseline: 14,
        factors: [
          { factor: 'Age > 80', weight: 10 },
          { factor: 'Dementia', weight: 15 },
          { factor: 'Delirium during stay', weight: 12 },
          { factor: 'Anemia', weight: 8 },
        ],
      },
      Diabetes: {
        baseline: 16,
        factors: [
          { factor: 'HbA1c > 9%', weight: 12 },
          { factor: 'Insulin dependent', weight: 8 },
          { factor: 'Nephropathy', weight: 10 },
          { factor: 'Hypoglycemia history', weight: 15 },
        ],
      },
      General: {
        baseline: 10,
        factors: [
          { factor: 'Multiple comorbidities', weight: 10 },
          { factor: 'Polypharmacy', weight: 8 },
          { factor: 'Functional decline', weight: 12 },
        ],
      },
    };

    const model = models[diagnosis];
    const riskFactors = model.factors.map(f => ({
      factor: f.factor,
      weight: f.weight,
      present: patientFactors[f.factor] || false,
    }));

    const additionalRisk = riskFactors
      .filter(f => f.present)
      .reduce((sum, f) => sum + f.weight, 0);

    return {
      diagnosis,
      baselineRisk: model.baseline,
      riskFactors,
      adjustedRisk: Math.min(95, model.baseline + additionalRisk),
      evidenceLevel: 'B',
    };
  }

  // ============================================
  // OVERALL RISK CALCULATION
  // ============================================

  calculateOverallRisk(
    laceScore: LACEScore,
    hospitalScore: HOSPITALScore,
    socialRiskScore: number,
    diagnosisRisk: number
  ): { score: number; level: RiskLevel } {
    // Weighted average of different risk models
    const weightedScore = (
      laceScore.riskPercentage * 0.30 +
      hospitalScore.riskPercentage * 0.25 +
      socialRiskScore * 0.20 +
      diagnosisRisk * 0.25
    );

    const score = Math.round(weightedScore);

    let level: RiskLevel;
    if (score < 20) level = 'low';
    else if (score < 40) level = 'moderate';
    else if (score < 60) level = 'high';
    else level = 'very_high';

    return { score, level };
  }

  // ============================================
  // INTERVENTIONS
  // ============================================

  getRecommendedInterventions(profile: PatientRiskProfile): RecommendedIntervention[] {
    const interventions: RecommendedIntervention[] = [];

    // High-risk interventions
    if (profile.riskLevel === 'high' || profile.riskLevel === 'very_high') {
      interventions.push({
        id: `INT-${Date.now()}-1`,
        category: 'care_coordination',
        priority: 'high',
        title: 'Transitional Care Management',
        description: 'Enroll in TCM program with structured follow-up',
        status: 'pending',
        evidence: 'Reduces readmissions by 20-30% in high-risk patients',
      });
    }

    // Social factor interventions
    if (profile.socialFactors.socialRiskScore > 40) {
      if (!profile.socialFactors.transportationAccess) {
        interventions.push({
          id: `INT-${Date.now()}-2`,
          category: 'social',
          priority: 'high',
          title: 'Transportation Assistance',
          description: 'Arrange medical transportation for appointments',
          status: 'pending',
          evidence: 'Transportation barriers increase readmission by 40%',
        });
      }
      if (!profile.socialFactors.medicationAffordability) {
        interventions.push({
          id: `INT-${Date.now()}-3`,
          category: 'medication',
          priority: 'high',
          title: 'Medication Assistance Program',
          description: 'Enroll in pharmaceutical assistance programs',
          status: 'pending',
          evidence: 'Cost is primary barrier to medication adherence',
        });
      }
    }

    // Diagnosis-specific interventions
    if (profile.diagnosisCategory === 'CHF') {
      interventions.push({
        id: `INT-${Date.now()}-4`,
        category: 'education',
        priority: 'medium',
        title: 'CHF Self-Management Education',
        description: 'Daily weights, sodium restriction, symptom recognition',
        status: 'pending',
        evidence: 'Self-management reduces CHF readmissions by 25%',
      });
    }

    return interventions;
  }

  // ============================================
  // DASHBOARD SUMMARY
  // ============================================

  getDashboardSummary(): RiskDashboardSummary {
    const profiles = Array.from(this.profiles.values());
    
    const riskCounts = {
      low: profiles.filter(p => p.riskLevel === 'low').length,
      moderate: profiles.filter(p => p.riskLevel === 'moderate').length,
      high: profiles.filter(p => p.riskLevel === 'high').length,
      very_high: profiles.filter(p => p.riskLevel === 'very_high').length,
    };

    const total = profiles.length;
    const avgRisk = profiles.reduce((sum, p) => sum + p.overallRiskScore, 0) / total;

    const pendingInterventions = profiles.reduce((sum, p) => 
      sum + p.interventions.filter(i => i.status === 'pending').length, 0
    );

    const scheduledFollowUps = profiles.filter(p => 
      p.followUpPlan.primaryCareVisit.scheduled
    ).length;

    // Top risk factors
    const factorCounts: Record<string, number> = {};
    profiles.forEach(p => {
      p.riskTrend.forEach(t => {
        t.factors.forEach(f => {
          factorCounts[f] = (factorCounts[f] || 0) + 1;
        });
      });
    });

    const topRiskFactors = Object.entries(factorCounts)
      .map(([factor, count]) => ({ factor, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalPatients: total,
      highRiskCount: riskCounts.high,
      veryHighRiskCount: riskCounts.very_high,
      averageRiskScore: Math.round(avgRisk),
      pendingInterventions,
      scheduledFollowUps,
      riskDistribution: [
        { level: 'low', count: riskCounts.low, percentage: Math.round((riskCounts.low / total) * 100) },
        { level: 'moderate', count: riskCounts.moderate, percentage: Math.round((riskCounts.moderate / total) * 100) },
        { level: 'high', count: riskCounts.high, percentage: Math.round((riskCounts.high / total) * 100) },
        { level: 'very_high', count: riskCounts.very_high, percentage: Math.round((riskCounts.very_high / total) * 100) },
      ],
      topRiskFactors,
    };
  }

  // ============================================
  // QUERY METHODS
  // ============================================

  getProfiles(): PatientRiskProfile[] {
    return Array.from(this.profiles.values());
  }

  getProfileById(id: string): PatientRiskProfile | undefined {
    return this.profiles.get(id);
  }

  getProfileByPatientId(patientId: string): PatientRiskProfile | undefined {
    return Array.from(this.profiles.values()).find(p => p.patientId === patientId);
  }

  getHighRiskPatients(): PatientRiskProfile[] {
    return Array.from(this.profiles.values())
      .filter(p => p.riskLevel === 'high' || p.riskLevel === 'very_high')
      .sort((a, b) => b.overallRiskScore - a.overallRiskScore);
  }

  getPatientsByRiskLevel(level: RiskLevel): PatientRiskProfile[] {
    return Array.from(this.profiles.values()).filter(p => p.riskLevel === level);
  }

  // ============================================
  // RISK LEVEL HELPERS
  // ============================================

  getRiskColor(level: RiskLevel): string {
    const colors: Record<RiskLevel, string> = {
      low: '#22C55E',
      moderate: '#F59E0B',
      high: '#F97316',
      very_high: '#EF4444',
    };
    return colors[level];
  }

  getRiskLabel(level: RiskLevel): string {
    const labels: Record<RiskLevel, string> = {
      low: 'Low Risk',
      moderate: 'Moderate Risk',
      high: 'High Risk',
      very_high: 'Very High Risk',
    };
    return labels[level];
  }

  // ============================================
  // INTERVENTION MANAGEMENT
  // ============================================

  updateInterventionStatus(
    profileId: string,
    interventionId: string,
    status: RecommendedIntervention['status'],
    assignedTo?: string
  ): void {
    const profile = this.profiles.get(profileId);
    if (profile) {
      const intervention = profile.interventions.find(i => i.id === interventionId);
      if (intervention) {
        intervention.status = status;
        if (assignedTo) intervention.assignedTo = assignedTo;
        if (status === 'completed') intervention.completedDate = Date.now();
        this.saveToStorage();
        this.notifyListeners();
      }
    }
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

export const readmissionRiskService = new ReadmissionRiskService();
