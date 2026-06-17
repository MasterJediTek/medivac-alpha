/**
 * Discharge Planning Service
 * MediVac One v3.1 - Comprehensive Patient Discharge Workflow
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export type DischargeStatus = 'not_started' | 'in_progress' | 'pending_approval' | 'approved' | 'completed' | 'cancelled';
export type MedicationReconciliationStatus = 'pending' | 'in_progress' | 'completed' | 'requires_review';
export type EducationStatus = 'not_started' | 'in_progress' | 'completed' | 'acknowledged';
export type TransportationType = 'self' | 'family' | 'ambulance' | 'medical_transport' | 'taxi' | 'public';

export interface DischargePlan {
  id: string;
  patientId: string;
  patientName: string;
  admissionDate: Date;
  expectedDischargeDate: Date;
  actualDischargeDate?: Date;
  status: DischargeStatus;
  primaryDiagnosis: string;
  secondaryDiagnoses: string[];
  dischargeDisposition: string;
  medicationReconciliation: MedicationReconciliation;
  followUpAppointments: FollowUpAppointment[];
  educationMaterials: PatientEducation[];
  checklist: DischargeChecklistItem[];
  transportation: TransportationPlan;
  homeCareReferrals: HomeCareReferral[];
  dischargeSummary?: DischargeSummary;
  acknowledgments: Acknowledgment[];
  readinessScore: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  assignedTo: string;
}

export interface MedicationReconciliation {
  status: MedicationReconciliationStatus;
  admissionMedications: MedicationEntry[];
  dischargeMedications: MedicationEntry[];
  discontinuedMedications: MedicationEntry[];
  newMedications: MedicationEntry[];
  changedMedications: MedicationChange[];
  reconciliationNotes: string;
  reconciledBy?: string;
  reconciledAt?: Date;
  pharmacistReview?: PharmacistReview;
}

export interface MedicationEntry {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  route: string;
  indication: string;
  prescriber: string;
  startDate: Date;
  endDate?: Date;
  instructions: string;
  isHighRisk: boolean;
}

export interface MedicationChange {
  medicationId: string;
  medicationName: string;
  changeType: 'dose_change' | 'frequency_change' | 'route_change' | 'substitution';
  previousValue: string;
  newValue: string;
  reason: string;
}

export interface PharmacistReview {
  reviewedBy: string;
  reviewedAt: Date;
  approved: boolean;
  notes: string;
  interventions: string[];
}

export interface FollowUpAppointment {
  id: string;
  type: 'primary_care' | 'specialist' | 'lab' | 'imaging' | 'therapy' | 'other';
  providerName: string;
  providerSpecialty: string;
  scheduledDate: Date;
  scheduledTime: string;
  location: string;
  phone: string;
  purpose: string;
  isScheduled: boolean;
  confirmationNumber?: string;
  notes: string;
}

export interface PatientEducation {
  id: string;
  category: 'diagnosis' | 'medications' | 'diet' | 'activity' | 'wound_care' | 'warning_signs' | 'follow_up' | 'equipment' | 'other';
  title: string;
  content: string;
  format: 'document' | 'video' | 'interactive' | 'verbal';
  language: string;
  status: EducationStatus;
  providedBy?: string;
  providedAt?: Date;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  comprehensionVerified: boolean;
}

export interface DischargeChecklistItem {
  id: string;
  category: string;
  item: string;
  isRequired: boolean;
  isCompleted: boolean;
  completedBy?: string;
  completedAt?: Date;
  notes: string;
  order: number;
}

export interface TransportationPlan {
  type: TransportationType;
  scheduledTime?: Date;
  pickupLocation: string;
  destination: string;
  contactName: string;
  contactPhone: string;
  specialRequirements: string[];
  equipmentNeeded: string[];
  isConfirmed: boolean;
  confirmationNumber?: string;
}

export interface HomeCareReferral {
  id: string;
  serviceType: 'nursing' | 'physical_therapy' | 'occupational_therapy' | 'speech_therapy' | 'home_health_aide' | 'medical_social_work' | 'hospice' | 'other';
  agencyName: string;
  agencyPhone: string;
  frequency: string;
  duration: string;
  startDate: Date;
  authorizationNumber?: string;
  status: 'pending' | 'authorized' | 'scheduled' | 'active' | 'completed' | 'cancelled';
  notes: string;
}

export interface DischargeSummary {
  hospitalCourse: string;
  proceduresPerformed: string[];
  significantFindings: string[];
  dischargeDiagnoses: string[];
  dischargeCondition: string;
  dischargeMedications: string;
  dietaryInstructions: string;
  activityRestrictions: string;
  woundCareInstructions: string;
  warningSignsToWatch: string[];
  followUpInstructions: string;
  pendingResults: string[];
  generatedAt: Date;
  generatedBy: string;
  signedBy?: string;
  signedAt?: Date;
}

export interface Acknowledgment {
  id: string;
  type: 'patient' | 'family' | 'caregiver';
  name: string;
  relationship?: string;
  acknowledgedItems: string[];
  signature?: string;
  acknowledgedAt: Date;
  witnessedBy: string;
}

export interface DischargeReadinessAssessment {
  clinicalReadiness: number;
  medicationReadiness: number;
  educationReadiness: number;
  socialReadiness: number;
  transportationReadiness: number;
  followUpReadiness: number;
  overallScore: number;
  barriers: string[];
  recommendations: string[];
}

// Event types
type DischargeEventType = 'plan_created' | 'plan_updated' | 'status_changed' | 'medication_reconciled' | 'education_completed' | 'discharged';
type DischargeEventCallback = (event: { type: DischargeEventType; data: unknown }) => void;

// Storage key
const STORAGE_KEY = 'medivac_discharge_plans';

class DischargePlanningServiceClass {
  private plans: Map<string, DischargePlan> = new Map();
  private listeners: Set<DischargeEventCallback> = new Set();
  private initialized = false;

  // Default checklist template
  private defaultChecklist: Omit<DischargeChecklistItem, 'id' | 'completedBy' | 'completedAt'>[] = [
    { category: 'Clinical', item: 'Vital signs stable for 24 hours', isRequired: true, isCompleted: false, notes: '', order: 1 },
    { category: 'Clinical', item: 'Pain controlled with oral medications', isRequired: true, isCompleted: false, notes: '', order: 2 },
    { category: 'Clinical', item: 'Ambulating independently or with assistance', isRequired: false, isCompleted: false, notes: '', order: 3 },
    { category: 'Clinical', item: 'Tolerating oral intake', isRequired: true, isCompleted: false, notes: '', order: 4 },
    { category: 'Clinical', item: 'Voiding without difficulty', isRequired: true, isCompleted: false, notes: '', order: 5 },
    { category: 'Medications', item: 'Medication reconciliation completed', isRequired: true, isCompleted: false, notes: '', order: 6 },
    { category: 'Medications', item: 'Prescriptions sent to pharmacy', isRequired: true, isCompleted: false, notes: '', order: 7 },
    { category: 'Medications', item: 'High-risk medication counseling completed', isRequired: false, isCompleted: false, notes: '', order: 8 },
    { category: 'Education', item: 'Diagnosis education provided', isRequired: true, isCompleted: false, notes: '', order: 9 },
    { category: 'Education', item: 'Medication education provided', isRequired: true, isCompleted: false, notes: '', order: 10 },
    { category: 'Education', item: 'Warning signs reviewed', isRequired: true, isCompleted: false, notes: '', order: 11 },
    { category: 'Education', item: 'Activity restrictions explained', isRequired: true, isCompleted: false, notes: '', order: 12 },
    { category: 'Follow-up', item: 'Follow-up appointments scheduled', isRequired: true, isCompleted: false, notes: '', order: 13 },
    { category: 'Follow-up', item: 'Appointment information provided to patient', isRequired: true, isCompleted: false, notes: '', order: 14 },
    { category: 'Social', item: 'Home care referrals completed (if needed)', isRequired: false, isCompleted: false, notes: '', order: 15 },
    { category: 'Social', item: 'Durable medical equipment arranged', isRequired: false, isCompleted: false, notes: '', order: 16 },
    { category: 'Transportation', item: 'Transportation arranged', isRequired: true, isCompleted: false, notes: '', order: 17 },
    { category: 'Documentation', item: 'Discharge summary completed', isRequired: true, isCompleted: false, notes: '', order: 18 },
    { category: 'Documentation', item: 'Patient/family acknowledgment obtained', isRequired: true, isCompleted: false, notes: '', order: 19 },
    { category: 'Final', item: 'IV access removed', isRequired: true, isCompleted: false, notes: '', order: 20 },
    { category: 'Final', item: 'Personal belongings returned', isRequired: true, isCompleted: false, notes: '', order: 21 },
    { category: 'Final', item: 'Patient escorted to exit', isRequired: true, isCompleted: false, notes: '', order: 22 },
  ];

  // Education materials library
  private educationLibrary: Omit<PatientEducation, 'id' | 'status' | 'providedBy' | 'providedAt' | 'acknowledgedBy' | 'acknowledgedAt' | 'comprehensionVerified'>[] = [
    { category: 'diagnosis', title: 'Understanding Your Diagnosis', content: 'Comprehensive overview of your condition...', format: 'document', language: 'en' },
    { category: 'medications', title: 'Your Discharge Medications', content: 'Important information about your medications...', format: 'document', language: 'en' },
    { category: 'diet', title: 'Dietary Guidelines', content: 'Recommended diet and nutrition information...', format: 'document', language: 'en' },
    { category: 'activity', title: 'Activity and Exercise Guidelines', content: 'Safe activity levels and restrictions...', format: 'document', language: 'en' },
    { category: 'wound_care', title: 'Wound Care Instructions', content: 'How to care for your surgical site or wound...', format: 'document', language: 'en' },
    { category: 'warning_signs', title: 'When to Seek Medical Attention', content: 'Warning signs that require immediate care...', format: 'document', language: 'en' },
    { category: 'follow_up', title: 'Follow-Up Care Instructions', content: 'Your follow-up appointments and care plan...', format: 'document', language: 'en' },
    { category: 'equipment', title: 'Using Your Medical Equipment', content: 'Instructions for home medical equipment...', format: 'video', language: 'en' },
  ];

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        data.forEach((plan: DischargePlan) => {
          this.plans.set(plan.id, {
            ...plan,
            admissionDate: new Date(plan.admissionDate),
            expectedDischargeDate: new Date(plan.expectedDischargeDate),
            actualDischargeDate: plan.actualDischargeDate ? new Date(plan.actualDischargeDate) : undefined,
            createdAt: new Date(plan.createdAt),
            updatedAt: new Date(plan.updatedAt),
          });
        });
      }
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize discharge planning service:', error);
      this.initialized = true;
    }
  }

  private async save(): Promise<void> {
    try {
      const data = Array.from(this.plans.values());
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save discharge plans:', error);
    }
  }

  private emit(type: DischargeEventType, data: unknown): void {
    this.listeners.forEach(listener => listener({ type, data }));
  }

  subscribe(callback: DischargeEventCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Create a new discharge plan
  async createDischargePlan(data: {
    patientId: string;
    patientName: string;
    admissionDate: Date;
    expectedDischargeDate: Date;
    primaryDiagnosis: string;
    secondaryDiagnoses?: string[];
    dischargeDisposition: string;
    createdBy: string;
    assignedTo: string;
  }): Promise<DischargePlan> {
    await this.initialize();

    const plan: DischargePlan = {
      id: `DP-${Date.now()}`,
      patientId: data.patientId,
      patientName: data.patientName,
      admissionDate: data.admissionDate,
      expectedDischargeDate: data.expectedDischargeDate,
      status: 'not_started',
      primaryDiagnosis: data.primaryDiagnosis,
      secondaryDiagnoses: data.secondaryDiagnoses || [],
      dischargeDisposition: data.dischargeDisposition,
      medicationReconciliation: {
        status: 'pending',
        admissionMedications: [],
        dischargeMedications: [],
        discontinuedMedications: [],
        newMedications: [],
        changedMedications: [],
        reconciliationNotes: '',
      },
      followUpAppointments: [],
      educationMaterials: this.educationLibrary.map((edu, index) => ({
        ...edu,
        id: `EDU-${Date.now()}-${index}`,
        status: 'not_started' as EducationStatus,
        comprehensionVerified: false,
      })),
      checklist: this.defaultChecklist.map((item, index) => ({
        ...item,
        id: `CHK-${Date.now()}-${index}`,
      })),
      transportation: {
        type: 'family',
        pickupLocation: 'Main Entrance',
        destination: '',
        contactName: '',
        contactPhone: '',
        specialRequirements: [],
        equipmentNeeded: [],
        isConfirmed: false,
      },
      homeCareReferrals: [],
      acknowledgments: [],
      readinessScore: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: data.createdBy,
      assignedTo: data.assignedTo,
    };

    this.plans.set(plan.id, plan);
    await this.save();
    this.emit('plan_created', plan);

    return plan;
  }

  // Get discharge plan by ID
  async getDischargePlan(planId: string): Promise<DischargePlan | null> {
    await this.initialize();
    return this.plans.get(planId) || null;
  }

  // Get all discharge plans
  async getAllPlans(filters?: {
    status?: DischargeStatus;
    patientId?: string;
    assignedTo?: string;
  }): Promise<DischargePlan[]> {
    await this.initialize();
    let plans = Array.from(this.plans.values());

    if (filters) {
      if (filters.status) {
        plans = plans.filter(p => p.status === filters.status);
      }
      if (filters.patientId) {
        plans = plans.filter(p => p.patientId === filters.patientId);
      }
      if (filters.assignedTo) {
        plans = plans.filter(p => p.assignedTo === filters.assignedTo);
      }
    }

    return plans.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  // Update discharge plan status
  async updateStatus(planId: string, status: DischargeStatus): Promise<DischargePlan | null> {
    await this.initialize();
    const plan = this.plans.get(planId);
    if (!plan) return null;

    plan.status = status;
    plan.updatedAt = new Date();

    if (status === 'completed') {
      plan.actualDischargeDate = new Date();
    }

    await this.save();
    this.emit('status_changed', { planId, status });

    return plan;
  }

  // Medication reconciliation
  async updateMedicationReconciliation(
    planId: string,
    reconciliation: Partial<MedicationReconciliation>
  ): Promise<DischargePlan | null> {
    await this.initialize();
    const plan = this.plans.get(planId);
    if (!plan) return null;

    plan.medicationReconciliation = {
      ...plan.medicationReconciliation,
      ...reconciliation,
    };
    plan.updatedAt = new Date();

    // Update checklist item
    const medRecItem = plan.checklist.find(c => c.item.includes('Medication reconciliation'));
    if (medRecItem && reconciliation.status === 'completed') {
      medRecItem.isCompleted = true;
      medRecItem.completedAt = new Date();
      medRecItem.completedBy = reconciliation.reconciledBy;
    }

    await this.save();
    this.emit('medication_reconciled', { planId, reconciliation });

    return plan;
  }

  // Add follow-up appointment
  async addFollowUpAppointment(planId: string, appointment: Omit<FollowUpAppointment, 'id'>): Promise<DischargePlan | null> {
    await this.initialize();
    const plan = this.plans.get(planId);
    if (!plan) return null;

    const newAppointment: FollowUpAppointment = {
      ...appointment,
      id: `APT-${Date.now()}`,
    };

    plan.followUpAppointments.push(newAppointment);
    plan.updatedAt = new Date();

    // Update checklist if all appointments scheduled
    if (plan.followUpAppointments.every(a => a.isScheduled)) {
      const followUpItem = plan.checklist.find(c => c.item.includes('Follow-up appointments scheduled'));
      if (followUpItem) {
        followUpItem.isCompleted = true;
        followUpItem.completedAt = new Date();
      }
    }

    await this.save();
    this.emit('plan_updated', plan);

    return plan;
  }

  // Update education status
  async updateEducationStatus(
    planId: string,
    educationId: string,
    status: EducationStatus,
    providedBy?: string
  ): Promise<DischargePlan | null> {
    await this.initialize();
    const plan = this.plans.get(planId);
    if (!plan) return null;

    const education = plan.educationMaterials.find(e => e.id === educationId);
    if (!education) return null;

    education.status = status;
    if (status === 'completed' || status === 'acknowledged') {
      education.providedBy = providedBy;
      education.providedAt = new Date();
      if (status === 'acknowledged') {
        education.acknowledgedAt = new Date();
      }
    }

    plan.updatedAt = new Date();
    await this.save();
    this.emit('education_completed', { planId, educationId, status });

    return plan;
  }

  // Update checklist item
  async updateChecklistItem(
    planId: string,
    itemId: string,
    isCompleted: boolean,
    completedBy?: string,
    notes?: string
  ): Promise<DischargePlan | null> {
    await this.initialize();
    const plan = this.plans.get(planId);
    if (!plan) return null;

    const item = plan.checklist.find(c => c.id === itemId);
    if (!item) return null;

    item.isCompleted = isCompleted;
    if (isCompleted) {
      item.completedBy = completedBy;
      item.completedAt = new Date();
    } else {
      item.completedBy = undefined;
      item.completedAt = undefined;
    }
    if (notes !== undefined) {
      item.notes = notes;
    }

    plan.updatedAt = new Date();
    plan.readinessScore = this.calculateReadinessScore(plan);

    await this.save();
    this.emit('plan_updated', plan);

    return plan;
  }

  // Update transportation plan
  async updateTransportation(planId: string, transportation: Partial<TransportationPlan>): Promise<DischargePlan | null> {
    await this.initialize();
    const plan = this.plans.get(planId);
    if (!plan) return null;

    plan.transportation = {
      ...plan.transportation,
      ...transportation,
    };
    plan.updatedAt = new Date();

    // Update checklist
    if (transportation.isConfirmed) {
      const transportItem = plan.checklist.find(c => c.item.includes('Transportation arranged'));
      if (transportItem) {
        transportItem.isCompleted = true;
        transportItem.completedAt = new Date();
      }
    }

    await this.save();
    this.emit('plan_updated', plan);

    return plan;
  }

  // Add home care referral
  async addHomeCareReferral(planId: string, referral: Omit<HomeCareReferral, 'id'>): Promise<DischargePlan | null> {
    await this.initialize();
    const plan = this.plans.get(planId);
    if (!plan) return null;

    const newReferral: HomeCareReferral = {
      ...referral,
      id: `HCR-${Date.now()}`,
    };

    plan.homeCareReferrals.push(newReferral);
    plan.updatedAt = new Date();

    await this.save();
    this.emit('plan_updated', plan);

    return plan;
  }

  // Generate discharge summary
  async generateDischargeSummary(planId: string, generatedBy: string): Promise<DischargeSummary | null> {
    await this.initialize();
    const plan = this.plans.get(planId);
    if (!plan) return null;

    const summary: DischargeSummary = {
      hospitalCourse: `Patient admitted on ${plan.admissionDate.toLocaleDateString()} with ${plan.primaryDiagnosis}.`,
      proceduresPerformed: [],
      significantFindings: [],
      dischargeDiagnoses: [plan.primaryDiagnosis, ...plan.secondaryDiagnoses],
      dischargeCondition: 'Stable',
      dischargeMedications: plan.medicationReconciliation.dischargeMedications
        .map(m => `${m.name} ${m.dosage} ${m.frequency}`)
        .join('\n'),
      dietaryInstructions: 'Resume regular diet unless otherwise specified.',
      activityRestrictions: 'As tolerated. Avoid heavy lifting for 2 weeks.',
      woundCareInstructions: 'Keep incision clean and dry. Report any signs of infection.',
      warningSignsToWatch: [
        'Fever > 101°F',
        'Increasing pain not relieved by medication',
        'Redness, swelling, or drainage from incision',
        'Difficulty breathing',
        'Chest pain',
      ],
      followUpInstructions: plan.followUpAppointments
        .map(a => `${a.providerSpecialty}: ${a.scheduledDate.toLocaleDateString()} at ${a.scheduledTime}`)
        .join('\n'),
      pendingResults: [],
      generatedAt: new Date(),
      generatedBy,
    };

    plan.dischargeSummary = summary;
    plan.updatedAt = new Date();

    // Update checklist
    const summaryItem = plan.checklist.find(c => c.item.includes('Discharge summary completed'));
    if (summaryItem) {
      summaryItem.isCompleted = true;
      summaryItem.completedAt = new Date();
      summaryItem.completedBy = generatedBy;
    }

    await this.save();
    this.emit('plan_updated', plan);

    return summary;
  }

  // Add acknowledgment
  async addAcknowledgment(planId: string, acknowledgment: Omit<Acknowledgment, 'id' | 'acknowledgedAt'>): Promise<DischargePlan | null> {
    await this.initialize();
    const plan = this.plans.get(planId);
    if (!plan) return null;

    const newAcknowledgment: Acknowledgment = {
      ...acknowledgment,
      id: `ACK-${Date.now()}`,
      acknowledgedAt: new Date(),
    };

    plan.acknowledgments.push(newAcknowledgment);
    plan.updatedAt = new Date();

    // Update checklist
    const ackItem = plan.checklist.find(c => c.item.includes('Patient/family acknowledgment'));
    if (ackItem) {
      ackItem.isCompleted = true;
      ackItem.completedAt = new Date();
    }

    await this.save();
    this.emit('plan_updated', plan);

    return plan;
  }

  // Calculate readiness score
  calculateReadinessScore(plan: DischargePlan): number {
    const assessment = this.assessDischargeReadiness(plan);
    return assessment.overallScore;
  }

  // Assess discharge readiness
  assessDischargeReadiness(plan: DischargePlan): DischargeReadinessAssessment {
    const barriers: string[] = [];
    const recommendations: string[] = [];

    // Clinical readiness (checklist completion)
    const clinicalItems = plan.checklist.filter(c => c.category === 'Clinical');
    const clinicalCompleted = clinicalItems.filter(c => c.isCompleted).length;
    const clinicalReadiness = clinicalItems.length > 0 ? (clinicalCompleted / clinicalItems.length) * 100 : 0;
    if (clinicalReadiness < 100) {
      barriers.push('Clinical criteria not fully met');
      recommendations.push('Complete remaining clinical assessments');
    }

    // Medication readiness
    const medStatus = plan.medicationReconciliation.status;
    const medicationReadiness = medStatus === 'completed' ? 100 : medStatus === 'in_progress' ? 50 : 0;
    if (medicationReadiness < 100) {
      barriers.push('Medication reconciliation incomplete');
      recommendations.push('Complete medication reconciliation with pharmacist review');
    }

    // Education readiness
    const requiredEducation = plan.educationMaterials.filter(e => 
      ['diagnosis', 'medications', 'warning_signs'].includes(e.category)
    );
    const completedEducation = requiredEducation.filter(e => 
      e.status === 'completed' || e.status === 'acknowledged'
    ).length;
    const educationReadiness = requiredEducation.length > 0 ? (completedEducation / requiredEducation.length) * 100 : 0;
    if (educationReadiness < 100) {
      barriers.push('Patient education incomplete');
      recommendations.push('Complete required patient education sessions');
    }

    // Social readiness (home care)
    const socialReadiness = plan.homeCareReferrals.length === 0 || 
      plan.homeCareReferrals.every(r => r.status === 'authorized' || r.status === 'scheduled') ? 100 : 50;
    if (socialReadiness < 100) {
      barriers.push('Home care referrals pending');
      recommendations.push('Confirm home care service authorizations');
    }

    // Transportation readiness
    const transportationReadiness = plan.transportation.isConfirmed ? 100 : 0;
    if (transportationReadiness < 100) {
      barriers.push('Transportation not confirmed');
      recommendations.push('Arrange and confirm patient transportation');
    }

    // Follow-up readiness
    const scheduledAppointments = plan.followUpAppointments.filter(a => a.isScheduled).length;
    const followUpReadiness = plan.followUpAppointments.length > 0 
      ? (scheduledAppointments / plan.followUpAppointments.length) * 100 
      : 0;
    if (followUpReadiness < 100) {
      barriers.push('Follow-up appointments not fully scheduled');
      recommendations.push('Schedule all required follow-up appointments');
    }

    // Calculate overall score (weighted average)
    const overallScore = Math.round(
      (clinicalReadiness * 0.25) +
      (medicationReadiness * 0.20) +
      (educationReadiness * 0.20) +
      (socialReadiness * 0.10) +
      (transportationReadiness * 0.10) +
      (followUpReadiness * 0.15)
    );

    return {
      clinicalReadiness: Math.round(clinicalReadiness),
      medicationReadiness: Math.round(medicationReadiness),
      educationReadiness: Math.round(educationReadiness),
      socialReadiness: Math.round(socialReadiness),
      transportationReadiness: Math.round(transportationReadiness),
      followUpReadiness: Math.round(followUpReadiness),
      overallScore,
      barriers,
      recommendations,
    };
  }

  // Complete discharge
  async completeDischarge(planId: string): Promise<DischargePlan | null> {
    await this.initialize();
    const plan = this.plans.get(planId);
    if (!plan) return null;

    const assessment = this.assessDischargeReadiness(plan);
    if (assessment.overallScore < 80) {
      throw new Error(`Discharge readiness score (${assessment.overallScore}%) is below threshold (80%)`);
    }

    plan.status = 'completed';
    plan.actualDischargeDate = new Date();
    plan.updatedAt = new Date();

    await this.save();
    this.emit('discharged', plan);

    return plan;
  }

  // Get discharge statistics
  async getStatistics(): Promise<{
    totalPlans: number;
    byStatus: Record<DischargeStatus, number>;
    averageReadinessScore: number;
    averageLOS: number;
    pendingDischarges: number;
  }> {
    await this.initialize();
    const plans = Array.from(this.plans.values());

    const byStatus: Record<DischargeStatus, number> = {
      not_started: 0,
      in_progress: 0,
      pending_approval: 0,
      approved: 0,
      completed: 0,
      cancelled: 0,
    };

    let totalReadiness = 0;
    let totalLOS = 0;
    let completedCount = 0;

    plans.forEach(plan => {
      byStatus[plan.status]++;
      totalReadiness += plan.readinessScore;

      if (plan.status === 'completed' && plan.actualDischargeDate) {
        const los = Math.ceil(
          (plan.actualDischargeDate.getTime() - plan.admissionDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        totalLOS += los;
        completedCount++;
      }
    });

    return {
      totalPlans: plans.length,
      byStatus,
      averageReadinessScore: plans.length > 0 ? Math.round(totalReadiness / plans.length) : 0,
      averageLOS: completedCount > 0 ? Math.round(totalLOS / completedCount * 10) / 10 : 0,
      pendingDischarges: byStatus.in_progress + byStatus.pending_approval + byStatus.approved,
    };
  }
}

export const DischargePlanningService = new DischargePlanningServiceClass();
