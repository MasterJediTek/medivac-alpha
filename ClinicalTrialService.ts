/**
 * Clinical Trial Matching Service
 * MediVac One v3.3
 * 
 * Matches eligible patients with active clinical trials based on
 * diagnosis, demographics, and inclusion/exclusion criteria.
 */

export type TrialPhase = 'phase_1' | 'phase_2' | 'phase_3' | 'phase_4' | 'observational';

export type TrialStatus = 
  | 'recruiting'
  | 'active_not_recruiting'
  | 'completed'
  | 'suspended'
  | 'terminated'
  | 'withdrawn';

export type CriteriaType = 'inclusion' | 'exclusion';

export interface EligibilityCriterion {
  id: string;
  type: CriteriaType;
  category: 'age' | 'gender' | 'diagnosis' | 'lab_value' | 'medication' | 'procedure' | 'other';
  description: string;
  operator?: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'between' | 'in' | 'not_in';
  value?: string | number | string[] | number[];
  unit?: string;
  icdCodes?: string[];
  required: boolean;
}

export interface ClinicalTrial {
  id: string;
  nctNumber: string;
  title: string;
  shortTitle: string;
  description: string;
  phase: TrialPhase;
  status: TrialStatus;
  sponsor: string;
  principalInvestigator: string;
  piContact: string;
  studyType: 'interventional' | 'observational' | 'expanded_access';
  therapeuticArea: string;
  conditions: string[];
  icdCodes: string[];
  interventions: string[];
  eligibilityCriteria: EligibilityCriterion[];
  targetEnrollment: number;
  currentEnrollment: number;
  startDate: Date;
  estimatedEndDate: Date;
  locations: TrialLocation[];
  consentFormId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrialLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  isRecruiting: boolean;
}

export interface PatientProfile {
  id: string;
  name: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  diagnoses: PatientDiagnosis[];
  medications: PatientMedication[];
  labResults: PatientLabResult[];
  procedures: PatientProcedure[];
  allergies: string[];
}

export interface PatientDiagnosis {
  icdCode: string;
  description: string;
  diagnosedDate: Date;
  status: 'active' | 'resolved' | 'chronic';
}

export interface PatientMedication {
  name: string;
  rxNormCode?: string;
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
}

export interface PatientLabResult {
  testCode: string;
  testName: string;
  value: number;
  unit: string;
  resultDate: Date;
  isAbnormal: boolean;
}

export interface PatientProcedure {
  cptCode: string;
  description: string;
  procedureDate: Date;
}

export interface TrialMatch {
  trialId: string;
  trial: ClinicalTrial;
  patientId: string;
  matchScore: number; // 0-100
  matchedCriteria: CriteriaMatch[];
  unmatchedCriteria: CriteriaMatch[];
  excludingCriteria: CriteriaMatch[];
  isEligible: boolean;
  matchDate: Date;
  status: 'pending_review' | 'notified' | 'interested' | 'declined' | 'enrolled' | 'screen_failed';
  notes?: string;
}

export interface CriteriaMatch {
  criterionId: string;
  criterion: EligibilityCriterion;
  matched: boolean;
  patientValue?: string | number;
  reason?: string;
}

export interface TrialEnrollment {
  id: string;
  trialId: string;
  patientId: string;
  patientName: string;
  enrollmentDate: Date;
  status: 'screening' | 'enrolled' | 'active' | 'completed' | 'withdrawn' | 'screen_failed';
  consentDate?: Date;
  consentDocumentId?: string;
  screeningResults?: Map<string, boolean>;
  withdrawalReason?: string;
  coordinatorId: string;
  coordinatorName: string;
  notes: string[];
}

export interface TrialAnalytics {
  trialId: string;
  totalScreened: number;
  totalEnrolled: number;
  totalCompleted: number;
  totalWithdrawn: number;
  screenFailRate: number;
  enrollmentRate: number;
  averageTimeToEnroll: number; // days
  demographicBreakdown: {
    gender: Map<string, number>;
    ageGroups: Map<string, number>;
  };
}

class ClinicalTrialService {
  private trials: Map<string, ClinicalTrial> = new Map();
  private matches: Map<string, TrialMatch[]> = new Map();
  private enrollments: Map<string, TrialEnrollment> = new Map();

  constructor() {
    this.initializeTrials();
  }

  private initializeTrials(): void {
    // Heart Failure Trial
    this.addTrial({
      id: 'trial_001',
      nctNumber: 'NCT05123456',
      title: 'A Phase 3 Study of Novel SGLT2 Inhibitor in Patients with Heart Failure with Reduced Ejection Fraction',
      shortTitle: 'HEART-PROTECT Study',
      description: 'This study evaluates the efficacy and safety of a novel SGLT2 inhibitor in patients with heart failure with reduced ejection fraction (HFrEF).',
      phase: 'phase_3',
      status: 'recruiting',
      sponsor: 'CardioPharm Inc.',
      principalInvestigator: 'Dr. Sarah Chen',
      piContact: 'schen@medivac.org',
      studyType: 'interventional',
      therapeuticArea: 'Cardiology',
      conditions: ['Heart Failure', 'HFrEF'],
      icdCodes: ['I50.1', 'I50.20', 'I50.21', 'I50.22'],
      interventions: ['Drug: CP-2024 (SGLT2 Inhibitor)', 'Drug: Placebo'],
      targetEnrollment: 500,
      currentEnrollment: 234,
      startDate: new Date('2025-01-15'),
      estimatedEndDate: new Date('2027-06-30'),
      locations: [
        {
          id: 'loc_001',
          name: 'MediVac One Cardiology Center',
          address: '123 Medical Center Dr',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94102',
          contactName: 'Maria Rodriguez',
          contactPhone: '415-555-0123',
          contactEmail: 'mrodriguez@medivac.org',
          isRecruiting: true
        }
      ],
      eligibilityCriteria: [
        {
          id: 'inc_001',
          type: 'inclusion',
          category: 'age',
          description: 'Age 18 years or older',
          operator: 'gte',
          value: 18,
          required: true
        },
        {
          id: 'inc_002',
          type: 'inclusion',
          category: 'diagnosis',
          description: 'Documented diagnosis of heart failure with reduced ejection fraction (LVEF ≤ 40%)',
          icdCodes: ['I50.1', 'I50.20', 'I50.21', 'I50.22'],
          required: true
        },
        {
          id: 'inc_003',
          type: 'inclusion',
          category: 'lab_value',
          description: 'eGFR ≥ 30 mL/min/1.73m²',
          operator: 'gte',
          value: 30,
          unit: 'mL/min/1.73m²',
          required: true
        },
        {
          id: 'exc_001',
          type: 'exclusion',
          category: 'diagnosis',
          description: 'Type 1 diabetes mellitus',
          icdCodes: ['E10'],
          required: true
        },
        {
          id: 'exc_002',
          type: 'exclusion',
          category: 'medication',
          description: 'Current use of any SGLT2 inhibitor',
          required: true
        }
      ],
      createdAt: new Date('2024-11-01'),
      updatedAt: new Date('2025-12-15')
    });

    // Diabetes Trial
    this.addTrial({
      id: 'trial_002',
      nctNumber: 'NCT05234567',
      title: 'Efficacy of Continuous Glucose Monitoring with AI-Powered Insulin Dosing in Type 2 Diabetes',
      shortTitle: 'SMART-DOSE Study',
      description: 'Evaluating an AI-powered closed-loop insulin delivery system for improved glycemic control in type 2 diabetes.',
      phase: 'phase_2',
      status: 'recruiting',
      sponsor: 'DiabeTech Solutions',
      principalInvestigator: 'Dr. Michael Johnson',
      piContact: 'mjohnson@medivac.org',
      studyType: 'interventional',
      therapeuticArea: 'Endocrinology',
      conditions: ['Type 2 Diabetes Mellitus', 'Insulin-Dependent Diabetes'],
      icdCodes: ['E11.9', 'E11.65', 'E11.8'],
      interventions: ['Device: SmartDose CGM System', 'Drug: Insulin Lispro'],
      targetEnrollment: 200,
      currentEnrollment: 87,
      startDate: new Date('2025-03-01'),
      estimatedEndDate: new Date('2026-12-31'),
      locations: [
        {
          id: 'loc_002',
          name: 'MediVac One Diabetes Center',
          address: '456 Endocrine Way',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94103',
          contactName: 'James Wilson',
          contactPhone: '415-555-0456',
          contactEmail: 'jwilson@medivac.org',
          isRecruiting: true
        }
      ],
      eligibilityCriteria: [
        {
          id: 'inc_101',
          type: 'inclusion',
          category: 'age',
          description: 'Age 21-75 years',
          operator: 'between',
          value: [21, 75],
          required: true
        },
        {
          id: 'inc_102',
          type: 'inclusion',
          category: 'diagnosis',
          description: 'Type 2 diabetes mellitus diagnosed for at least 1 year',
          icdCodes: ['E11.9', 'E11.65', 'E11.8'],
          required: true
        },
        {
          id: 'inc_103',
          type: 'inclusion',
          category: 'lab_value',
          description: 'HbA1c between 7.5% and 11%',
          operator: 'between',
          value: [7.5, 11],
          unit: '%',
          required: true
        },
        {
          id: 'exc_101',
          type: 'exclusion',
          category: 'diagnosis',
          description: 'Severe hypoglycemia within past 6 months',
          required: true
        }
      ],
      createdAt: new Date('2025-01-15'),
      updatedAt: new Date('2025-11-20')
    });

    // Oncology Trial
    this.addTrial({
      id: 'trial_003',
      nctNumber: 'NCT05345678',
      title: 'Phase 2 Study of Combination Immunotherapy in Advanced Non-Small Cell Lung Cancer',
      shortTitle: 'LUNG-IMMUNE Study',
      description: 'Investigating the efficacy of dual checkpoint inhibitor therapy in patients with advanced NSCLC who have progressed on prior treatment.',
      phase: 'phase_2',
      status: 'recruiting',
      sponsor: 'OncoImmune Therapeutics',
      principalInvestigator: 'Dr. Emily Watson',
      piContact: 'ewatson@medivac.org',
      studyType: 'interventional',
      therapeuticArea: 'Oncology',
      conditions: ['Non-Small Cell Lung Cancer', 'NSCLC', 'Lung Cancer'],
      icdCodes: ['C34.90', 'C34.91', 'C34.92'],
      interventions: ['Drug: OIT-101 (PD-1 Inhibitor)', 'Drug: OIT-202 (CTLA-4 Inhibitor)'],
      targetEnrollment: 150,
      currentEnrollment: 42,
      startDate: new Date('2025-06-01'),
      estimatedEndDate: new Date('2028-05-31'),
      locations: [
        {
          id: 'loc_003',
          name: 'MediVac One Cancer Center',
          address: '789 Oncology Blvd',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94104',
          contactName: 'Lisa Park',
          contactPhone: '415-555-0789',
          contactEmail: 'lpark@medivac.org',
          isRecruiting: true
        }
      ],
      eligibilityCriteria: [
        {
          id: 'inc_201',
          type: 'inclusion',
          category: 'age',
          description: 'Age 18 years or older',
          operator: 'gte',
          value: 18,
          required: true
        },
        {
          id: 'inc_202',
          type: 'inclusion',
          category: 'diagnosis',
          description: 'Histologically confirmed non-small cell lung cancer',
          icdCodes: ['C34.90', 'C34.91', 'C34.92'],
          required: true
        },
        {
          id: 'inc_203',
          type: 'inclusion',
          category: 'other',
          description: 'ECOG performance status 0-1',
          required: true
        },
        {
          id: 'exc_201',
          type: 'exclusion',
          category: 'diagnosis',
          description: 'Active autoimmune disease requiring systemic treatment',
          required: true
        },
        {
          id: 'exc_202',
          type: 'exclusion',
          category: 'diagnosis',
          description: 'Known brain metastases (unless treated and stable)',
          required: true
        }
      ],
      createdAt: new Date('2025-04-01'),
      updatedAt: new Date('2025-10-30')
    });
  }

  private addTrial(trial: ClinicalTrial): void {
    this.trials.set(trial.id, trial);
  }

  // Trial Management
  getAllTrials(): ClinicalTrial[] {
    return Array.from(this.trials.values());
  }

  getTrialById(trialId: string): ClinicalTrial | undefined {
    return this.trials.get(trialId);
  }

  getRecruitingTrials(): ClinicalTrial[] {
    return this.getAllTrials().filter(t => t.status === 'recruiting');
  }

  getTrialsByTherapeuticArea(area: string): ClinicalTrial[] {
    return this.getAllTrials().filter(t => 
      t.therapeuticArea.toLowerCase() === area.toLowerCase()
    );
  }

  getTrialsByCondition(icdCode: string): ClinicalTrial[] {
    return this.getAllTrials().filter(t => t.icdCodes.includes(icdCode));
  }

  // Patient Matching
  matchPatientToTrials(patient: PatientProfile): TrialMatch[] {
    const recruitingTrials = this.getRecruitingTrials();
    const matches: TrialMatch[] = [];

    recruitingTrials.forEach(trial => {
      const match = this.evaluatePatientForTrial(patient, trial);
      if (match.matchScore > 0) {
        matches.push(match);
      }
    });

    // Sort by match score descending
    matches.sort((a, b) => b.matchScore - a.matchScore);

    // Store matches
    this.matches.set(patient.id, matches);

    return matches;
  }

  private evaluatePatientForTrial(patient: PatientProfile, trial: ClinicalTrial): TrialMatch {
    const matchedCriteria: CriteriaMatch[] = [];
    const unmatchedCriteria: CriteriaMatch[] = [];
    const excludingCriteria: CriteriaMatch[] = [];

    const patientAge = this.calculateAge(patient.dateOfBirth);

    trial.eligibilityCriteria.forEach(criterion => {
      const criteriaMatch = this.evaluateCriterion(criterion, patient, patientAge);
      
      if (criterion.type === 'inclusion') {
        if (criteriaMatch.matched) {
          matchedCriteria.push(criteriaMatch);
        } else {
          unmatchedCriteria.push(criteriaMatch);
        }
      } else {
        // Exclusion criteria - if matched, patient is excluded
        if (criteriaMatch.matched) {
          excludingCriteria.push(criteriaMatch);
        }
      }
    });

    // Calculate match score
    const inclusionCriteria = trial.eligibilityCriteria.filter(c => c.type === 'inclusion');
    const requiredInclusion = inclusionCriteria.filter(c => c.required);
    const matchedRequired = matchedCriteria.filter(m => m.criterion.required);

    let matchScore = 0;
    if (requiredInclusion.length > 0) {
      matchScore = (matchedRequired.length / requiredInclusion.length) * 100;
    }

    // Reduce score if there are excluding criteria
    if (excludingCriteria.length > 0) {
      matchScore = 0;
    }

    const isEligible = matchScore >= 80 && excludingCriteria.length === 0;

    return {
      trialId: trial.id,
      trial,
      patientId: patient.id,
      matchScore: Math.round(matchScore),
      matchedCriteria,
      unmatchedCriteria,
      excludingCriteria,
      isEligible,
      matchDate: new Date(),
      status: 'pending_review'
    };
  }

  private evaluateCriterion(
    criterion: EligibilityCriterion,
    patient: PatientProfile,
    patientAge: number
  ): CriteriaMatch {
    let matched = false;
    let patientValue: string | number | undefined;
    let reason: string | undefined;

    switch (criterion.category) {
      case 'age':
        patientValue = patientAge;
        matched = this.evaluateNumericCriterion(patientAge, criterion);
        reason = matched ? `Patient age ${patientAge} meets criteria` : `Patient age ${patientAge} does not meet criteria`;
        break;

      case 'gender':
        patientValue = patient.gender;
        if (criterion.value) {
          matched = patient.gender === criterion.value;
        }
        break;

      case 'diagnosis':
        if (criterion.icdCodes && criterion.icdCodes.length > 0) {
          const patientIcdCodes = patient.diagnoses.map(d => d.icdCode);
          const hasMatchingDiagnosis = criterion.icdCodes.some(code => 
            patientIcdCodes.some(pCode => pCode.startsWith(code.split('.')[0]))
          );
          matched = criterion.type === 'inclusion' ? hasMatchingDiagnosis : hasMatchingDiagnosis;
          patientValue = patientIcdCodes.join(', ');
          reason = matched 
            ? `Patient has matching diagnosis` 
            : `No matching diagnosis found`;
        }
        break;

      case 'lab_value':
        // Find most recent matching lab result
        const labResult = patient.labResults
          .sort((a, b) => b.resultDate.getTime() - a.resultDate.getTime())[0];
        if (labResult) {
          patientValue = labResult.value;
          matched = this.evaluateNumericCriterion(labResult.value, criterion);
          reason = `Lab value: ${labResult.value} ${labResult.unit}`;
        }
        break;

      case 'medication':
        const activeMeds = patient.medications.filter(m => m.isActive).map(m => m.name.toLowerCase());
        // For exclusion criteria, check if patient is on the medication
        if (criterion.type === 'exclusion') {
          matched = activeMeds.some(med => 
            criterion.description.toLowerCase().includes(med) ||
            med.includes('sglt2') // Example specific check
          );
        }
        patientValue = activeMeds.join(', ');
        break;

      default:
        // For 'other' category, we can't automatically evaluate
        matched = false;
        reason = 'Requires manual review';
    }

    return {
      criterionId: criterion.id,
      criterion,
      matched,
      patientValue,
      reason
    };
  }

  private evaluateNumericCriterion(value: number, criterion: EligibilityCriterion): boolean {
    if (!criterion.operator || criterion.value === undefined) return false;

    switch (criterion.operator) {
      case 'eq':
        return value === criterion.value;
      case 'ne':
        return value !== criterion.value;
      case 'gt':
        return value > (criterion.value as number);
      case 'lt':
        return value < (criterion.value as number);
      case 'gte':
        return value >= (criterion.value as number);
      case 'lte':
        return value <= (criterion.value as number);
      case 'between':
        const [min, max] = criterion.value as number[];
        return value >= min && value <= max;
      default:
        return false;
    }
  }

  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--;
    }
    return age;
  }

  // Get patient matches
  getPatientMatches(patientId: string): TrialMatch[] {
    return this.matches.get(patientId) || [];
  }

  updateMatchStatus(
    patientId: string,
    trialId: string,
    status: TrialMatch['status'],
    notes?: string
  ): void {
    const matches = this.matches.get(patientId);
    if (matches) {
      const match = matches.find(m => m.trialId === trialId);
      if (match) {
        match.status = status;
        if (notes) match.notes = notes;
      }
    }
  }

  // Enrollment Management
  enrollPatient(
    trialId: string,
    patientId: string,
    patientName: string,
    coordinatorId: string,
    coordinatorName: string
  ): TrialEnrollment {
    const enrollment: TrialEnrollment = {
      id: `enroll_${Date.now()}`,
      trialId,
      patientId,
      patientName,
      enrollmentDate: new Date(),
      status: 'screening',
      coordinatorId,
      coordinatorName,
      notes: []
    };

    this.enrollments.set(enrollment.id, enrollment);

    // Update trial enrollment count
    const trial = this.trials.get(trialId);
    if (trial) {
      trial.currentEnrollment++;
    }

    // Update match status
    this.updateMatchStatus(patientId, trialId, 'enrolled');

    return enrollment;
  }

  getEnrollmentsByTrial(trialId: string): TrialEnrollment[] {
    return Array.from(this.enrollments.values())
      .filter(e => e.trialId === trialId);
  }

  getEnrollmentsByPatient(patientId: string): TrialEnrollment[] {
    return Array.from(this.enrollments.values())
      .filter(e => e.patientId === patientId);
  }

  updateEnrollmentStatus(
    enrollmentId: string,
    status: TrialEnrollment['status'],
    note?: string
  ): void {
    const enrollment = this.enrollments.get(enrollmentId);
    if (enrollment) {
      enrollment.status = status;
      if (note) {
        enrollment.notes.push(`${new Date().toISOString()}: ${note}`);
      }
    }
  }

  recordConsent(enrollmentId: string, consentDocumentId: string): void {
    const enrollment = this.enrollments.get(enrollmentId);
    if (enrollment) {
      enrollment.consentDate = new Date();
      enrollment.consentDocumentId = consentDocumentId;
    }
  }

  // Analytics
  getTrialAnalytics(trialId: string): TrialAnalytics {
    const enrollments = this.getEnrollmentsByTrial(trialId);
    
    const totalScreened = enrollments.length;
    const totalEnrolled = enrollments.filter(e => 
      ['enrolled', 'active', 'completed'].includes(e.status)
    ).length;
    const totalCompleted = enrollments.filter(e => e.status === 'completed').length;
    const totalWithdrawn = enrollments.filter(e => e.status === 'withdrawn').length;
    const screenFailed = enrollments.filter(e => e.status === 'screen_failed').length;

    return {
      trialId,
      totalScreened,
      totalEnrolled,
      totalCompleted,
      totalWithdrawn,
      screenFailRate: totalScreened > 0 ? (screenFailed / totalScreened) * 100 : 0,
      enrollmentRate: totalScreened > 0 ? (totalEnrolled / totalScreened) * 100 : 0,
      averageTimeToEnroll: 14, // Placeholder - would calculate from actual data
      demographicBreakdown: {
        gender: new Map([['male', 45], ['female', 42]]),
        ageGroups: new Map([['18-40', 20], ['41-60', 35], ['61+', 32]])
      }
    };
  }

  getOverallStatistics(): {
    totalTrials: number;
    recruitingTrials: number;
    totalEnrollments: number;
    matchesByTherapeuticArea: Map<string, number>;
  } {
    const allTrials = this.getAllTrials();
    const recruiting = this.getRecruitingTrials();
    
    const matchesByArea = new Map<string, number>();
    allTrials.forEach(trial => {
      const current = matchesByArea.get(trial.therapeuticArea) || 0;
      matchesByArea.set(trial.therapeuticArea, current + trial.currentEnrollment);
    });

    return {
      totalTrials: allTrials.length,
      recruitingTrials: recruiting.length,
      totalEnrollments: Array.from(this.enrollments.values()).length,
      matchesByTherapeuticArea: matchesByArea
    };
  }
}

export const clinicalTrialService = new ClinicalTrialService();
export default clinicalTrialService;
