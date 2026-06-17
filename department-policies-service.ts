/**
 * Department Clinical Access Policies Service
 * Pre-configured access policies for each hospital department - MediVac One v5.1
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ==========================================
// Types
// ==========================================

export type DepartmentCode = 
  | 'ED' | 'ICU' | 'SURGERY' | 'PHARMACY' | 'RADIOLOGY' 
  | 'PATHOLOGY' | 'NURSING' | 'ADMIN' | 'MENTAL_HEALTH' | 'PEDIATRICS'
  | 'ONCOLOGY' | 'CARDIOLOGY' | 'MATERNITY' | 'OUTPATIENT' | 'ALLIED_HEALTH';

export type AccessLevel = 'none' | 'view' | 'limited' | 'standard' | 'elevated' | 'full';
export type TimeRestriction = 'none' | 'business_hours' | 'extended_hours' | '24_7' | 'on_call';
export type ApprovalRequirement = 'none' | 'supervisor' | 'department_head' | 'compliance' | 'dual_approval';

export interface DepartmentPolicy {
  id: string;
  departmentCode: DepartmentCode;
  departmentName: string;
  description: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  accessRules: AccessRule[];
  dataAccess: DataAccessPolicy;
  workflowRules: WorkflowRule[];
  emergencyOverride: EmergencyOverridePolicy;
  auditRequirements: AuditRequirements;
}

export interface AccessRule {
  id: string;
  name: string;
  description: string;
  roles: string[];
  resources: string[];
  accessLevel: AccessLevel;
  timeRestriction: TimeRestriction;
  locationRestriction: string[];
  deviceRequirements: DeviceRequirement[];
  mfaRequired: boolean;
  approvalRequired: ApprovalRequirement;
  conditions: AccessCondition[];
}

export interface AccessCondition {
  type: 'patient_assigned' | 'department_member' | 'on_duty' | 'emergency' | 'training' | 'research';
  operator: 'equals' | 'not_equals' | 'in' | 'not_in';
  value: boolean | string | string[];
}

export interface DeviceRequirement {
  type: 'trusted_device' | 'hospital_network' | 'encrypted' | 'managed' | 'biometric';
  required: boolean;
}

export interface DataAccessPolicy {
  patientRecords: DataAccessLevel;
  medications: DataAccessLevel;
  labResults: DataAccessLevel;
  imaging: DataAccessLevel;
  clinicalNotes: DataAccessLevel;
  billing: DataAccessLevel;
  scheduling: DataAccessLevel;
  communications: DataAccessLevel;
}

export interface DataAccessLevel {
  read: AccessLevel;
  write: AccessLevel;
  delete: AccessLevel;
  export: AccessLevel;
  share: AccessLevel;
}

export interface WorkflowRule {
  id: string;
  name: string;
  trigger: string;
  actions: WorkflowAction[];
  notifications: string[];
  escalation?: EscalationRule;
}

export interface WorkflowAction {
  type: 'approve' | 'deny' | 'escalate' | 'notify' | 'log' | 'alert';
  target?: string;
  message?: string;
}

export interface EscalationRule {
  timeoutMinutes: number;
  escalateTo: string;
  maxEscalations: number;
}

export interface EmergencyOverridePolicy {
  enabled: boolean;
  allowedRoles: string[];
  maxDurationMinutes: number;
  requiresJustification: boolean;
  notifyOnActivation: string[];
  auditLevel: 'basic' | 'detailed' | 'forensic';
  autoExpire: boolean;
}

export interface AuditRequirements {
  logAllAccess: boolean;
  logDataExports: boolean;
  logEmergencyAccess: boolean;
  retentionDays: number;
  realTimeAlerts: boolean;
  complianceReporting: boolean;
}

// ==========================================
// Pre-configured Department Policies
// ==========================================

const DEFAULT_DATA_ACCESS: DataAccessPolicy = {
  patientRecords: { read: 'none', write: 'none', delete: 'none', export: 'none', share: 'none' },
  medications: { read: 'none', write: 'none', delete: 'none', export: 'none', share: 'none' },
  labResults: { read: 'none', write: 'none', delete: 'none', export: 'none', share: 'none' },
  imaging: { read: 'none', write: 'none', delete: 'none', export: 'none', share: 'none' },
  clinicalNotes: { read: 'none', write: 'none', delete: 'none', export: 'none', share: 'none' },
  billing: { read: 'none', write: 'none', delete: 'none', export: 'none', share: 'none' },
  scheduling: { read: 'none', write: 'none', delete: 'none', export: 'none', share: 'none' },
  communications: { read: 'none', write: 'none', delete: 'none', export: 'none', share: 'none' },
};

const DEPARTMENT_TEMPLATES: Record<DepartmentCode, Omit<DepartmentPolicy, 'id' | 'createdAt' | 'updatedAt'>> = {
  ED: {
    departmentCode: 'ED',
    departmentName: 'Emergency Department',
    description: 'High-acuity 24/7 emergency care with rapid access requirements',
    enabled: true,
    accessRules: [
      {
        id: 'ed_triage',
        name: 'Triage Access',
        description: 'Immediate access for triage nurses',
        roles: ['triage_nurse', 'ed_nurse', 'ed_doctor'],
        resources: ['patient_demographics', 'vital_signs', 'allergies', 'current_medications'],
        accessLevel: 'full',
        timeRestriction: '24_7',
        locationRestriction: ['emergency_department'],
        deviceRequirements: [{ type: 'hospital_network', required: true }],
        mfaRequired: false,
        approvalRequired: 'none',
        conditions: [{ type: 'on_duty', operator: 'equals', value: true }],
      },
      {
        id: 'ed_treatment',
        name: 'Treatment Access',
        description: 'Full clinical access for treating physicians',
        roles: ['ed_doctor', 'ed_specialist', 'trauma_surgeon'],
        resources: ['all_clinical_data', 'order_entry', 'prescriptions'],
        accessLevel: 'full',
        timeRestriction: '24_7',
        locationRestriction: [],
        deviceRequirements: [{ type: 'trusted_device', required: true }],
        mfaRequired: true,
        approvalRequired: 'none',
        conditions: [{ type: 'patient_assigned', operator: 'equals', value: true }],
      },
    ],
    dataAccess: {
      ...DEFAULT_DATA_ACCESS,
      patientRecords: { read: 'full', write: 'full', delete: 'none', export: 'limited', share: 'standard' },
      medications: { read: 'full', write: 'full', delete: 'none', export: 'none', share: 'standard' },
      labResults: { read: 'full', write: 'limited', delete: 'none', export: 'limited', share: 'standard' },
      imaging: { read: 'full', write: 'none', delete: 'none', export: 'limited', share: 'standard' },
      clinicalNotes: { read: 'full', write: 'full', delete: 'none', export: 'limited', share: 'standard' },
    },
    workflowRules: [
      {
        id: 'ed_critical_alert',
        name: 'Critical Patient Alert',
        trigger: 'critical_vital_signs',
        actions: [{ type: 'alert', target: 'ed_team', message: 'Critical patient requires immediate attention' }],
        notifications: ['ed_charge_nurse', 'ed_attending'],
        escalation: { timeoutMinutes: 5, escalateTo: 'trauma_team', maxEscalations: 2 },
      },
    ],
    emergencyOverride: {
      enabled: true,
      allowedRoles: ['ed_doctor', 'trauma_surgeon', 'ed_charge_nurse'],
      maxDurationMinutes: 60,
      requiresJustification: true,
      notifyOnActivation: ['compliance_officer', 'ed_director'],
      auditLevel: 'forensic',
      autoExpire: true,
    },
    auditRequirements: {
      logAllAccess: true,
      logDataExports: true,
      logEmergencyAccess: true,
      retentionDays: 2555, // 7 years
      realTimeAlerts: true,
      complianceReporting: true,
    },
  },
  ICU: {
    departmentCode: 'ICU',
    departmentName: 'Intensive Care Unit',
    description: 'Critical care with continuous monitoring and elevated access',
    enabled: true,
    accessRules: [
      {
        id: 'icu_nursing',
        name: 'ICU Nursing Access',
        description: 'Comprehensive access for ICU nurses',
        roles: ['icu_nurse', 'icu_charge_nurse'],
        resources: ['patient_monitoring', 'medications', 'vital_signs', 'ventilator_settings'],
        accessLevel: 'elevated',
        timeRestriction: '24_7',
        locationRestriction: ['icu'],
        deviceRequirements: [{ type: 'hospital_network', required: true }, { type: 'trusted_device', required: true }],
        mfaRequired: true,
        approvalRequired: 'none',
        conditions: [{ type: 'patient_assigned', operator: 'equals', value: true }],
      },
      {
        id: 'icu_intensivist',
        name: 'Intensivist Access',
        description: 'Full access for ICU physicians',
        roles: ['intensivist', 'icu_fellow', 'icu_attending'],
        resources: ['all_clinical_data', 'order_entry', 'ventilator_management', 'dialysis_orders'],
        accessLevel: 'full',
        timeRestriction: '24_7',
        locationRestriction: [],
        deviceRequirements: [{ type: 'trusted_device', required: true }, { type: 'encrypted', required: true }],
        mfaRequired: true,
        approvalRequired: 'none',
        conditions: [],
      },
    ],
    dataAccess: {
      ...DEFAULT_DATA_ACCESS,
      patientRecords: { read: 'full', write: 'full', delete: 'none', export: 'standard', share: 'elevated' },
      medications: { read: 'full', write: 'full', delete: 'none', export: 'limited', share: 'elevated' },
      labResults: { read: 'full', write: 'standard', delete: 'none', export: 'standard', share: 'elevated' },
      imaging: { read: 'full', write: 'none', delete: 'none', export: 'standard', share: 'elevated' },
      clinicalNotes: { read: 'full', write: 'full', delete: 'none', export: 'standard', share: 'elevated' },
    },
    workflowRules: [
      {
        id: 'icu_deterioration',
        name: 'Patient Deterioration Alert',
        trigger: 'early_warning_score_critical',
        actions: [{ type: 'alert', target: 'rapid_response_team' }, { type: 'notify', target: 'icu_attending' }],
        notifications: ['icu_charge_nurse', 'icu_attending', 'rapid_response_team'],
        escalation: { timeoutMinutes: 3, escalateTo: 'code_blue_team', maxEscalations: 1 },
      },
    ],
    emergencyOverride: {
      enabled: true,
      allowedRoles: ['intensivist', 'icu_charge_nurse'],
      maxDurationMinutes: 120,
      requiresJustification: true,
      notifyOnActivation: ['icu_director', 'compliance_officer'],
      auditLevel: 'forensic',
      autoExpire: true,
    },
    auditRequirements: {
      logAllAccess: true,
      logDataExports: true,
      logEmergencyAccess: true,
      retentionDays: 2555,
      realTimeAlerts: true,
      complianceReporting: true,
    },
  },
  SURGERY: {
    departmentCode: 'SURGERY',
    departmentName: 'Surgery Department',
    description: 'Surgical services with perioperative access controls',
    enabled: true,
    accessRules: [
      {
        id: 'surgery_preop',
        name: 'Pre-operative Access',
        description: 'Access for surgical planning and preparation',
        roles: ['surgeon', 'surgical_resident', 'anesthesiologist', 'preop_nurse'],
        resources: ['patient_history', 'imaging', 'lab_results', 'consent_forms'],
        accessLevel: 'elevated',
        timeRestriction: 'extended_hours',
        locationRestriction: ['surgical_suite', 'preop_area'],
        deviceRequirements: [{ type: 'hospital_network', required: true }],
        mfaRequired: true,
        approvalRequired: 'none',
        conditions: [{ type: 'patient_assigned', operator: 'equals', value: true }],
      },
      {
        id: 'surgery_intraop',
        name: 'Intra-operative Access',
        description: 'Full access during surgical procedures',
        roles: ['surgeon', 'anesthesiologist', 'surgical_nurse', 'scrub_tech'],
        resources: ['all_clinical_data', 'anesthesia_records', 'surgical_notes'],
        accessLevel: 'full',
        timeRestriction: '24_7',
        locationRestriction: ['operating_room'],
        deviceRequirements: [{ type: 'hospital_network', required: true }],
        mfaRequired: false,
        approvalRequired: 'none',
        conditions: [],
      },
    ],
    dataAccess: {
      ...DEFAULT_DATA_ACCESS,
      patientRecords: { read: 'full', write: 'elevated', delete: 'none', export: 'limited', share: 'standard' },
      medications: { read: 'full', write: 'elevated', delete: 'none', export: 'none', share: 'standard' },
      labResults: { read: 'full', write: 'none', delete: 'none', export: 'limited', share: 'standard' },
      imaging: { read: 'full', write: 'none', delete: 'none', export: 'standard', share: 'standard' },
      clinicalNotes: { read: 'full', write: 'full', delete: 'none', export: 'limited', share: 'standard' },
    },
    workflowRules: [
      {
        id: 'surgery_timeout',
        name: 'Surgical Timeout Verification',
        trigger: 'surgery_start',
        actions: [{ type: 'log', message: 'Surgical timeout completed' }],
        notifications: ['surgical_team'],
      },
    ],
    emergencyOverride: {
      enabled: true,
      allowedRoles: ['surgeon', 'anesthesiologist'],
      maxDurationMinutes: 240,
      requiresJustification: true,
      notifyOnActivation: ['surgical_director', 'compliance_officer'],
      auditLevel: 'detailed',
      autoExpire: true,
    },
    auditRequirements: {
      logAllAccess: true,
      logDataExports: true,
      logEmergencyAccess: true,
      retentionDays: 2555,
      realTimeAlerts: false,
      complianceReporting: true,
    },
  },
  PHARMACY: {
    departmentCode: 'PHARMACY',
    departmentName: 'Pharmacy',
    description: 'Medication management with controlled substance tracking',
    enabled: true,
    accessRules: [
      {
        id: 'pharmacy_dispensing',
        name: 'Medication Dispensing',
        description: 'Access for medication verification and dispensing',
        roles: ['pharmacist', 'pharmacy_tech'],
        resources: ['medication_orders', 'drug_interactions', 'patient_allergies'],
        accessLevel: 'elevated',
        timeRestriction: '24_7',
        locationRestriction: ['pharmacy'],
        deviceRequirements: [{ type: 'hospital_network', required: true }, { type: 'trusted_device', required: true }],
        mfaRequired: true,
        approvalRequired: 'none',
        conditions: [],
      },
      {
        id: 'pharmacy_controlled',
        name: 'Controlled Substance Access',
        description: 'Elevated access for controlled medications',
        roles: ['pharmacist'],
        resources: ['controlled_substances', 'narcotic_counts', 'dea_reporting'],
        accessLevel: 'full',
        timeRestriction: '24_7',
        locationRestriction: ['pharmacy', 'controlled_storage'],
        deviceRequirements: [{ type: 'biometric', required: true }, { type: 'trusted_device', required: true }],
        mfaRequired: true,
        approvalRequired: 'dual_approval',
        conditions: [],
      },
    ],
    dataAccess: {
      ...DEFAULT_DATA_ACCESS,
      patientRecords: { read: 'standard', write: 'none', delete: 'none', export: 'none', share: 'limited' },
      medications: { read: 'full', write: 'full', delete: 'limited', export: 'standard', share: 'elevated' },
      labResults: { read: 'standard', write: 'none', delete: 'none', export: 'none', share: 'limited' },
    },
    workflowRules: [
      {
        id: 'pharmacy_interaction_alert',
        name: 'Drug Interaction Alert',
        trigger: 'drug_interaction_detected',
        actions: [{ type: 'alert', target: 'prescribing_physician' }, { type: 'log' }],
        notifications: ['pharmacist', 'prescribing_physician'],
      },
    ],
    emergencyOverride: {
      enabled: true,
      allowedRoles: ['pharmacist'],
      maxDurationMinutes: 30,
      requiresJustification: true,
      notifyOnActivation: ['pharmacy_director', 'compliance_officer'],
      auditLevel: 'forensic',
      autoExpire: true,
    },
    auditRequirements: {
      logAllAccess: true,
      logDataExports: true,
      logEmergencyAccess: true,
      retentionDays: 3650, // 10 years for controlled substances
      realTimeAlerts: true,
      complianceReporting: true,
    },
  },
  RADIOLOGY: {
    departmentCode: 'RADIOLOGY',
    departmentName: 'Radiology & Imaging',
    description: 'Diagnostic imaging services with PACS integration',
    enabled: true,
    accessRules: [
      {
        id: 'radiology_tech',
        name: 'Radiologic Technologist Access',
        description: 'Access for imaging acquisition',
        roles: ['rad_tech', 'ct_tech', 'mri_tech', 'ultrasound_tech'],
        resources: ['imaging_orders', 'patient_positioning', 'contrast_protocols'],
        accessLevel: 'standard',
        timeRestriction: '24_7',
        locationRestriction: ['radiology'],
        deviceRequirements: [{ type: 'hospital_network', required: true }],
        mfaRequired: false,
        approvalRequired: 'none',
        conditions: [],
      },
      {
        id: 'radiology_interpretation',
        name: 'Radiologist Interpretation',
        description: 'Full access for image interpretation',
        roles: ['radiologist', 'radiology_resident'],
        resources: ['all_imaging', 'prior_studies', 'clinical_history', 'report_dictation'],
        accessLevel: 'full',
        timeRestriction: '24_7',
        locationRestriction: [],
        deviceRequirements: [{ type: 'trusted_device', required: true }],
        mfaRequired: true,
        approvalRequired: 'none',
        conditions: [],
      },
    ],
    dataAccess: {
      ...DEFAULT_DATA_ACCESS,
      patientRecords: { read: 'standard', write: 'none', delete: 'none', export: 'none', share: 'limited' },
      imaging: { read: 'full', write: 'full', delete: 'none', export: 'elevated', share: 'elevated' },
      clinicalNotes: { read: 'standard', write: 'limited', delete: 'none', export: 'limited', share: 'standard' },
    },
    workflowRules: [
      {
        id: 'radiology_critical',
        name: 'Critical Finding Alert',
        trigger: 'critical_finding_identified',
        actions: [{ type: 'alert', target: 'ordering_physician' }, { type: 'log' }],
        notifications: ['ordering_physician', 'radiology_attending'],
        escalation: { timeoutMinutes: 15, escalateTo: 'department_head', maxEscalations: 2 },
      },
    ],
    emergencyOverride: {
      enabled: true,
      allowedRoles: ['radiologist'],
      maxDurationMinutes: 60,
      requiresJustification: true,
      notifyOnActivation: ['radiology_director'],
      auditLevel: 'detailed',
      autoExpire: true,
    },
    auditRequirements: {
      logAllAccess: true,
      logDataExports: true,
      logEmergencyAccess: true,
      retentionDays: 2555,
      realTimeAlerts: true,
      complianceReporting: true,
    },
  },
  PATHOLOGY: {
    departmentCode: 'PATHOLOGY',
    departmentName: 'Pathology & Laboratory',
    description: 'Laboratory services with specimen tracking',
    enabled: true,
    accessRules: [
      {
        id: 'lab_tech',
        name: 'Laboratory Technician Access',
        description: 'Access for specimen processing and testing',
        roles: ['lab_tech', 'phlebotomist', 'lab_assistant'],
        resources: ['specimen_tracking', 'test_orders', 'result_entry'],
        accessLevel: 'standard',
        timeRestriction: '24_7',
        locationRestriction: ['laboratory'],
        deviceRequirements: [{ type: 'hospital_network', required: true }],
        mfaRequired: false,
        approvalRequired: 'none',
        conditions: [],
      },
      {
        id: 'pathologist',
        name: 'Pathologist Access',
        description: 'Full access for result interpretation',
        roles: ['pathologist', 'pathology_resident'],
        resources: ['all_lab_data', 'histology', 'cytology', 'report_generation'],
        accessLevel: 'full',
        timeRestriction: '24_7',
        locationRestriction: [],
        deviceRequirements: [{ type: 'trusted_device', required: true }],
        mfaRequired: true,
        approvalRequired: 'none',
        conditions: [],
      },
    ],
    dataAccess: {
      ...DEFAULT_DATA_ACCESS,
      patientRecords: { read: 'limited', write: 'none', delete: 'none', export: 'none', share: 'limited' },
      labResults: { read: 'full', write: 'full', delete: 'limited', export: 'standard', share: 'elevated' },
    },
    workflowRules: [
      {
        id: 'lab_critical',
        name: 'Critical Lab Value Alert',
        trigger: 'critical_lab_value',
        actions: [{ type: 'alert', target: 'ordering_physician' }],
        notifications: ['ordering_physician', 'nursing_unit'],
        escalation: { timeoutMinutes: 10, escalateTo: 'attending_physician', maxEscalations: 2 },
      },
    ],
    emergencyOverride: {
      enabled: true,
      allowedRoles: ['pathologist'],
      maxDurationMinutes: 60,
      requiresJustification: true,
      notifyOnActivation: ['lab_director'],
      auditLevel: 'detailed',
      autoExpire: true,
    },
    auditRequirements: {
      logAllAccess: true,
      logDataExports: true,
      logEmergencyAccess: true,
      retentionDays: 2555,
      realTimeAlerts: true,
      complianceReporting: true,
    },
  },
  NURSING: {
    departmentCode: 'NURSING',
    departmentName: 'Nursing Services',
    description: 'General nursing access across all units',
    enabled: true,
    accessRules: [
      {
        id: 'nursing_bedside',
        name: 'Bedside Nursing Access',
        description: 'Standard nursing access for patient care',
        roles: ['registered_nurse', 'licensed_practical_nurse', 'nursing_assistant'],
        resources: ['assigned_patients', 'vital_signs', 'medication_administration', 'care_plans'],
        accessLevel: 'standard',
        timeRestriction: '24_7',
        locationRestriction: [],
        deviceRequirements: [{ type: 'hospital_network', required: true }],
        mfaRequired: false,
        approvalRequired: 'none',
        conditions: [{ type: 'patient_assigned', operator: 'equals', value: true }],
      },
      {
        id: 'nursing_charge',
        name: 'Charge Nurse Access',
        description: 'Elevated access for charge nurses',
        roles: ['charge_nurse', 'nurse_manager'],
        resources: ['unit_patients', 'staffing', 'bed_management', 'incident_reports'],
        accessLevel: 'elevated',
        timeRestriction: '24_7',
        locationRestriction: [],
        deviceRequirements: [{ type: 'trusted_device', required: true }],
        mfaRequired: true,
        approvalRequired: 'none',
        conditions: [{ type: 'department_member', operator: 'equals', value: true }],
      },
    ],
    dataAccess: {
      ...DEFAULT_DATA_ACCESS,
      patientRecords: { read: 'standard', write: 'standard', delete: 'none', export: 'limited', share: 'standard' },
      medications: { read: 'standard', write: 'limited', delete: 'none', export: 'none', share: 'limited' },
      labResults: { read: 'standard', write: 'none', delete: 'none', export: 'none', share: 'limited' },
      clinicalNotes: { read: 'standard', write: 'standard', delete: 'none', export: 'limited', share: 'standard' },
      scheduling: { read: 'standard', write: 'limited', delete: 'none', export: 'none', share: 'limited' },
    },
    workflowRules: [
      {
        id: 'nursing_handoff',
        name: 'Shift Handoff Documentation',
        trigger: 'shift_change',
        actions: [{ type: 'log', message: 'Shift handoff completed' }],
        notifications: ['incoming_nurse', 'outgoing_nurse'],
      },
    ],
    emergencyOverride: {
      enabled: true,
      allowedRoles: ['charge_nurse', 'nurse_manager'],
      maxDurationMinutes: 30,
      requiresJustification: true,
      notifyOnActivation: ['nursing_supervisor'],
      auditLevel: 'detailed',
      autoExpire: true,
    },
    auditRequirements: {
      logAllAccess: true,
      logDataExports: true,
      logEmergencyAccess: true,
      retentionDays: 2555,
      realTimeAlerts: false,
      complianceReporting: true,
    },
  },
  ADMIN: {
    departmentCode: 'ADMIN',
    departmentName: 'Administration',
    description: 'Administrative and business office functions',
    enabled: true,
    accessRules: [
      {
        id: 'admin_registration',
        name: 'Patient Registration',
        description: 'Access for patient registration staff',
        roles: ['registrar', 'admissions_clerk', 'front_desk'],
        resources: ['patient_demographics', 'insurance', 'scheduling'],
        accessLevel: 'standard',
        timeRestriction: 'extended_hours',
        locationRestriction: ['registration', 'admissions'],
        deviceRequirements: [{ type: 'hospital_network', required: true }],
        mfaRequired: false,
        approvalRequired: 'none',
        conditions: [],
      },
      {
        id: 'admin_billing',
        name: 'Billing Access',
        description: 'Access for billing and coding staff',
        roles: ['billing_specialist', 'medical_coder', 'revenue_cycle'],
        resources: ['billing_records', 'coding', 'claims', 'payments'],
        accessLevel: 'elevated',
        timeRestriction: 'business_hours',
        locationRestriction: ['business_office'],
        deviceRequirements: [{ type: 'trusted_device', required: true }],
        mfaRequired: true,
        approvalRequired: 'none',
        conditions: [],
      },
    ],
    dataAccess: {
      ...DEFAULT_DATA_ACCESS,
      patientRecords: { read: 'limited', write: 'limited', delete: 'none', export: 'none', share: 'none' },
      billing: { read: 'full', write: 'elevated', delete: 'limited', export: 'standard', share: 'standard' },
      scheduling: { read: 'full', write: 'full', delete: 'standard', export: 'standard', share: 'standard' },
    },
    workflowRules: [],
    emergencyOverride: {
      enabled: false,
      allowedRoles: [],
      maxDurationMinutes: 0,
      requiresJustification: false,
      notifyOnActivation: [],
      auditLevel: 'basic',
      autoExpire: true,
    },
    auditRequirements: {
      logAllAccess: true,
      logDataExports: true,
      logEmergencyAccess: false,
      retentionDays: 2555,
      realTimeAlerts: false,
      complianceReporting: true,
    },
  },
  MENTAL_HEALTH: {
    departmentCode: 'MENTAL_HEALTH',
    departmentName: 'Mental Health Services',
    description: 'Psychiatric and behavioral health with enhanced privacy',
    enabled: true,
    accessRules: [
      {
        id: 'mh_clinical',
        name: 'Mental Health Clinical Access',
        description: 'Access for mental health clinicians',
        roles: ['psychiatrist', 'psychologist', 'psychiatric_nurse', 'social_worker', 'counselor'],
        resources: ['psychiatric_records', 'therapy_notes', 'risk_assessments'],
        accessLevel: 'elevated',
        timeRestriction: '24_7',
        locationRestriction: ['mental_health_unit', 'outpatient_psych'],
        deviceRequirements: [{ type: 'trusted_device', required: true }, { type: 'encrypted', required: true }],
        mfaRequired: true,
        approvalRequired: 'none',
        conditions: [{ type: 'patient_assigned', operator: 'equals', value: true }],
      },
    ],
    dataAccess: {
      ...DEFAULT_DATA_ACCESS,
      patientRecords: { read: 'elevated', write: 'elevated', delete: 'none', export: 'none', share: 'limited' },
      medications: { read: 'elevated', write: 'standard', delete: 'none', export: 'none', share: 'limited' },
      clinicalNotes: { read: 'elevated', write: 'elevated', delete: 'none', export: 'none', share: 'limited' },
    },
    workflowRules: [
      {
        id: 'mh_suicide_risk',
        name: 'Suicide Risk Alert',
        trigger: 'high_suicide_risk_identified',
        actions: [{ type: 'alert', target: 'crisis_team' }, { type: 'escalate', target: 'psychiatrist' }],
        notifications: ['psychiatrist', 'charge_nurse', 'crisis_team'],
        escalation: { timeoutMinutes: 5, escalateTo: 'psychiatric_director', maxEscalations: 1 },
      },
    ],
    emergencyOverride: {
      enabled: true,
      allowedRoles: ['psychiatrist'],
      maxDurationMinutes: 60,
      requiresJustification: true,
      notifyOnActivation: ['psychiatric_director', 'compliance_officer'],
      auditLevel: 'forensic',
      autoExpire: true,
    },
    auditRequirements: {
      logAllAccess: true,
      logDataExports: true,
      logEmergencyAccess: true,
      retentionDays: 3650, // Extended for mental health records
      realTimeAlerts: true,
      complianceReporting: true,
    },
  },
  PEDIATRICS: {
    departmentCode: 'PEDIATRICS',
    departmentName: 'Pediatrics',
    description: 'Pediatric care with guardian consent requirements',
    enabled: true,
    accessRules: [
      {
        id: 'peds_clinical',
        name: 'Pediatric Clinical Access',
        description: 'Access for pediatric care team',
        roles: ['pediatrician', 'pediatric_nurse', 'child_life_specialist'],
        resources: ['pediatric_records', 'growth_charts', 'immunizations', 'guardian_contacts'],
        accessLevel: 'elevated',
        timeRestriction: '24_7',
        locationRestriction: ['pediatrics', 'picu', 'nicu'],
        deviceRequirements: [{ type: 'hospital_network', required: true }],
        mfaRequired: true,
        approvalRequired: 'none',
        conditions: [{ type: 'patient_assigned', operator: 'equals', value: true }],
      },
    ],
    dataAccess: {
      ...DEFAULT_DATA_ACCESS,
      patientRecords: { read: 'elevated', write: 'elevated', delete: 'none', export: 'limited', share: 'standard' },
      medications: { read: 'elevated', write: 'standard', delete: 'none', export: 'none', share: 'standard' },
      labResults: { read: 'elevated', write: 'none', delete: 'none', export: 'limited', share: 'standard' },
    },
    workflowRules: [],
    emergencyOverride: {
      enabled: true,
      allowedRoles: ['pediatrician', 'picu_attending'],
      maxDurationMinutes: 60,
      requiresJustification: true,
      notifyOnActivation: ['pediatrics_director'],
      auditLevel: 'detailed',
      autoExpire: true,
    },
    auditRequirements: {
      logAllAccess: true,
      logDataExports: true,
      logEmergencyAccess: true,
      retentionDays: 9125, // 25 years for pediatric records
      realTimeAlerts: false,
      complianceReporting: true,
    },
  },
  ONCOLOGY: {
    departmentCode: 'ONCOLOGY',
    departmentName: 'Oncology',
    description: 'Cancer care with research protocol access',
    enabled: true,
    accessRules: [
      {
        id: 'oncology_clinical',
        name: 'Oncology Clinical Access',
        description: 'Access for oncology care team',
        roles: ['oncologist', 'oncology_nurse', 'radiation_therapist'],
        resources: ['cancer_records', 'treatment_protocols', 'chemotherapy_orders', 'tumor_registry'],
        accessLevel: 'elevated',
        timeRestriction: '24_7',
        locationRestriction: ['oncology', 'infusion_center', 'radiation_oncology'],
        deviceRequirements: [{ type: 'trusted_device', required: true }],
        mfaRequired: true,
        approvalRequired: 'none',
        conditions: [{ type: 'patient_assigned', operator: 'equals', value: true }],
      },
    ],
    dataAccess: {
      ...DEFAULT_DATA_ACCESS,
      patientRecords: { read: 'full', write: 'elevated', delete: 'none', export: 'standard', share: 'elevated' },
      medications: { read: 'full', write: 'elevated', delete: 'none', export: 'limited', share: 'standard' },
      labResults: { read: 'full', write: 'none', delete: 'none', export: 'standard', share: 'elevated' },
      imaging: { read: 'full', write: 'none', delete: 'none', export: 'standard', share: 'elevated' },
    },
    workflowRules: [],
    emergencyOverride: {
      enabled: true,
      allowedRoles: ['oncologist'],
      maxDurationMinutes: 60,
      requiresJustification: true,
      notifyOnActivation: ['oncology_director'],
      auditLevel: 'detailed',
      autoExpire: true,
    },
    auditRequirements: {
      logAllAccess: true,
      logDataExports: true,
      logEmergencyAccess: true,
      retentionDays: 3650,
      realTimeAlerts: false,
      complianceReporting: true,
    },
  },
  CARDIOLOGY: {
    departmentCode: 'CARDIOLOGY',
    departmentName: 'Cardiology',
    description: 'Cardiovascular services with device monitoring',
    enabled: true,
    accessRules: [
      {
        id: 'cardiology_clinical',
        name: 'Cardiology Clinical Access',
        description: 'Access for cardiology care team',
        roles: ['cardiologist', 'cardiology_nurse', 'cardiac_tech', 'ep_specialist'],
        resources: ['cardiac_records', 'ecg_data', 'cath_lab', 'device_monitoring'],
        accessLevel: 'elevated',
        timeRestriction: '24_7',
        locationRestriction: ['cardiology', 'cath_lab', 'cardiac_icu'],
        deviceRequirements: [{ type: 'trusted_device', required: true }],
        mfaRequired: true,
        approvalRequired: 'none',
        conditions: [{ type: 'patient_assigned', operator: 'equals', value: true }],
      },
    ],
    dataAccess: {
      ...DEFAULT_DATA_ACCESS,
      patientRecords: { read: 'full', write: 'elevated', delete: 'none', export: 'standard', share: 'elevated' },
      medications: { read: 'full', write: 'elevated', delete: 'none', export: 'limited', share: 'standard' },
      labResults: { read: 'full', write: 'none', delete: 'none', export: 'standard', share: 'elevated' },
      imaging: { read: 'full', write: 'limited', delete: 'none', export: 'standard', share: 'elevated' },
    },
    workflowRules: [
      {
        id: 'cardiology_stemi',
        name: 'STEMI Alert',
        trigger: 'stemi_identified',
        actions: [{ type: 'alert', target: 'cath_lab_team' }],
        notifications: ['interventional_cardiologist', 'cath_lab_team', 'ed_attending'],
        escalation: { timeoutMinutes: 5, escalateTo: 'cardiology_director', maxEscalations: 1 },
      },
    ],
    emergencyOverride: {
      enabled: true,
      allowedRoles: ['cardiologist', 'interventional_cardiologist'],
      maxDurationMinutes: 60,
      requiresJustification: true,
      notifyOnActivation: ['cardiology_director'],
      auditLevel: 'detailed',
      autoExpire: true,
    },
    auditRequirements: {
      logAllAccess: true,
      logDataExports: true,
      logEmergencyAccess: true,
      retentionDays: 2555,
      realTimeAlerts: true,
      complianceReporting: true,
    },
  },
  MATERNITY: {
    departmentCode: 'MATERNITY',
    departmentName: 'Maternity & Obstetrics',
    description: 'Maternal and newborn care with infant security',
    enabled: true,
    accessRules: [
      {
        id: 'maternity_clinical',
        name: 'Maternity Clinical Access',
        description: 'Access for maternity care team',
        roles: ['obstetrician', 'midwife', 'labor_nurse', 'neonatal_nurse'],
        resources: ['maternal_records', 'fetal_monitoring', 'labor_progress', 'newborn_records'],
        accessLevel: 'elevated',
        timeRestriction: '24_7',
        locationRestriction: ['labor_delivery', 'postpartum', 'nursery'],
        deviceRequirements: [{ type: 'hospital_network', required: true }],
        mfaRequired: true,
        approvalRequired: 'none',
        conditions: [{ type: 'patient_assigned', operator: 'equals', value: true }],
      },
    ],
    dataAccess: {
      ...DEFAULT_DATA_ACCESS,
      patientRecords: { read: 'full', write: 'elevated', delete: 'none', export: 'limited', share: 'standard' },
      medications: { read: 'elevated', write: 'standard', delete: 'none', export: 'none', share: 'standard' },
      labResults: { read: 'elevated', write: 'none', delete: 'none', export: 'limited', share: 'standard' },
    },
    workflowRules: [
      {
        id: 'maternity_emergency',
        name: 'Obstetric Emergency',
        trigger: 'obstetric_emergency',
        actions: [{ type: 'alert', target: 'ob_emergency_team' }],
        notifications: ['obstetrician', 'anesthesiologist', 'nicu_team'],
        escalation: { timeoutMinutes: 3, escalateTo: 'ob_director', maxEscalations: 1 },
      },
    ],
    emergencyOverride: {
      enabled: true,
      allowedRoles: ['obstetrician', 'midwife'],
      maxDurationMinutes: 60,
      requiresJustification: true,
      notifyOnActivation: ['ob_director'],
      auditLevel: 'detailed',
      autoExpire: true,
    },
    auditRequirements: {
      logAllAccess: true,
      logDataExports: true,
      logEmergencyAccess: true,
      retentionDays: 9125, // 25 years for birth records
      realTimeAlerts: true,
      complianceReporting: true,
    },
  },
  OUTPATIENT: {
    departmentCode: 'OUTPATIENT',
    departmentName: 'Outpatient Services',
    description: 'Ambulatory care and clinic services',
    enabled: true,
    accessRules: [
      {
        id: 'outpatient_clinical',
        name: 'Outpatient Clinical Access',
        description: 'Access for outpatient care team',
        roles: ['clinic_physician', 'clinic_nurse', 'medical_assistant'],
        resources: ['clinic_records', 'appointments', 'referrals', 'prescriptions'],
        accessLevel: 'standard',
        timeRestriction: 'extended_hours',
        locationRestriction: ['outpatient_clinics'],
        deviceRequirements: [{ type: 'hospital_network', required: true }],
        mfaRequired: false,
        approvalRequired: 'none',
        conditions: [{ type: 'patient_assigned', operator: 'equals', value: true }],
      },
    ],
    dataAccess: {
      ...DEFAULT_DATA_ACCESS,
      patientRecords: { read: 'standard', write: 'standard', delete: 'none', export: 'limited', share: 'standard' },
      medications: { read: 'standard', write: 'standard', delete: 'none', export: 'none', share: 'limited' },
      labResults: { read: 'standard', write: 'none', delete: 'none', export: 'limited', share: 'standard' },
      scheduling: { read: 'standard', write: 'standard', delete: 'limited', export: 'none', share: 'standard' },
    },
    workflowRules: [],
    emergencyOverride: {
      enabled: false,
      allowedRoles: [],
      maxDurationMinutes: 0,
      requiresJustification: false,
      notifyOnActivation: [],
      auditLevel: 'basic',
      autoExpire: true,
    },
    auditRequirements: {
      logAllAccess: true,
      logDataExports: true,
      logEmergencyAccess: false,
      retentionDays: 2555,
      realTimeAlerts: false,
      complianceReporting: true,
    },
  },
  ALLIED_HEALTH: {
    departmentCode: 'ALLIED_HEALTH',
    departmentName: 'Allied Health Services',
    description: 'PT, OT, Speech, Respiratory, and other therapies',
    enabled: true,
    accessRules: [
      {
        id: 'allied_health_clinical',
        name: 'Allied Health Clinical Access',
        description: 'Access for allied health professionals',
        roles: ['physical_therapist', 'occupational_therapist', 'speech_therapist', 'respiratory_therapist', 'dietitian'],
        resources: ['therapy_records', 'treatment_plans', 'progress_notes', 'equipment_orders'],
        accessLevel: 'standard',
        timeRestriction: 'extended_hours',
        locationRestriction: [],
        deviceRequirements: [{ type: 'hospital_network', required: true }],
        mfaRequired: false,
        approvalRequired: 'none',
        conditions: [{ type: 'patient_assigned', operator: 'equals', value: true }],
      },
    ],
    dataAccess: {
      ...DEFAULT_DATA_ACCESS,
      patientRecords: { read: 'standard', write: 'limited', delete: 'none', export: 'limited', share: 'standard' },
      medications: { read: 'limited', write: 'none', delete: 'none', export: 'none', share: 'none' },
      labResults: { read: 'limited', write: 'none', delete: 'none', export: 'none', share: 'limited' },
      clinicalNotes: { read: 'standard', write: 'standard', delete: 'none', export: 'limited', share: 'standard' },
    },
    workflowRules: [],
    emergencyOverride: {
      enabled: false,
      allowedRoles: [],
      maxDurationMinutes: 0,
      requiresJustification: false,
      notifyOnActivation: [],
      auditLevel: 'basic',
      autoExpire: true,
    },
    auditRequirements: {
      logAllAccess: true,
      logDataExports: true,
      logEmergencyAccess: false,
      retentionDays: 2555,
      realTimeAlerts: false,
      complianceReporting: true,
    },
  },
};

// ==========================================
// Service Class
// ==========================================

class DepartmentPoliciesService {
  private static instance: DepartmentPoliciesService;
  private policies: Map<DepartmentCode, DepartmentPolicy> = new Map();
  private initialized: boolean = false;
  private listeners: Set<(event: string, data: unknown) => void> = new Set();

  private constructor() {
    this.loadPolicies();
  }

  static getInstance(): DepartmentPoliciesService {
    if (!DepartmentPoliciesService.instance) {
      DepartmentPoliciesService.instance = new DepartmentPoliciesService();
    }
    return DepartmentPoliciesService.instance;
  }

  subscribe(callback: (event: string, data: unknown) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private emit(event: string, data: unknown): void {
    this.listeners.forEach(cb => cb(event, data));
  }

  private async loadPolicies(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('department_policies');
      if (stored) {
        const parsed = JSON.parse(stored) as DepartmentPolicy[];
        parsed.forEach(p => this.policies.set(p.departmentCode, p));
      } else {
        await this.initializeDefaultPolicies();
      }
      this.initialized = true;
      this.emit('policies_loaded', { count: this.policies.size });
    } catch (error) {
      console.error('Failed to load department policies:', error);
      await this.initializeDefaultPolicies();
    }
  }

  private async initializeDefaultPolicies(): Promise<void> {
    const now = new Date().toISOString();
    
    for (const [code, template] of Object.entries(DEPARTMENT_TEMPLATES)) {
      const policy: DepartmentPolicy = {
        ...template,
        id: `policy_${code.toLowerCase()}_${Date.now()}`,
        createdAt: now,
        updatedAt: now,
      };
      this.policies.set(code as DepartmentCode, policy);
    }

    await this.savePolicies();
    this.emit('policies_initialized', { count: this.policies.size });
  }

  private async savePolicies(): Promise<void> {
    try {
      const policies = Array.from(this.policies.values());
      await AsyncStorage.setItem('department_policies', JSON.stringify(policies));
    } catch (error) {
      console.error('Failed to save department policies:', error);
    }
  }

  // ==========================================
  // Policy Management
  // ==========================================

  getPolicy(departmentCode: DepartmentCode): DepartmentPolicy | undefined {
    return this.policies.get(departmentCode);
  }

  getAllPolicies(): DepartmentPolicy[] {
    return Array.from(this.policies.values());
  }

  getEnabledPolicies(): DepartmentPolicy[] {
    return Array.from(this.policies.values()).filter(p => p.enabled);
  }

  async updatePolicy(departmentCode: DepartmentCode, updates: Partial<DepartmentPolicy>): Promise<DepartmentPolicy | null> {
    const policy = this.policies.get(departmentCode);
    if (!policy) return null;

    const updated: DepartmentPolicy = {
      ...policy,
      ...updates,
      departmentCode, // Prevent changing department code
      updatedAt: new Date().toISOString(),
    };

    this.policies.set(departmentCode, updated);
    await this.savePolicies();
    this.emit('policy_updated', updated);

    return updated;
  }

  async enablePolicy(departmentCode: DepartmentCode): Promise<void> {
    await this.updatePolicy(departmentCode, { enabled: true });
  }

  async disablePolicy(departmentCode: DepartmentCode): Promise<void> {
    await this.updatePolicy(departmentCode, { enabled: false });
  }

  // ==========================================
  // Access Evaluation
  // ==========================================

  evaluateAccess(
    departmentCode: DepartmentCode,
    userRole: string,
    resource: string,
    context: {
      patientAssigned?: boolean;
      departmentMember?: boolean;
      onDuty?: boolean;
      emergency?: boolean;
      deviceTrusted?: boolean;
      onHospitalNetwork?: boolean;
      location?: string;
      time?: Date;
    }
  ): { allowed: boolean; accessLevel: AccessLevel; reason: string; requiresMfa: boolean } {
    const policy = this.policies.get(departmentCode);
    
    if (!policy || !policy.enabled) {
      return { allowed: false, accessLevel: 'none', reason: 'Department policy not found or disabled', requiresMfa: false };
    }

    // Find matching access rule
    for (const rule of policy.accessRules) {
      if (!rule.roles.includes(userRole)) continue;
      if (!rule.resources.includes(resource) && !rule.resources.includes('all_clinical_data')) continue;

      // Check conditions
      let conditionsMet = true;
      for (const condition of rule.conditions) {
        const contextValue = context[condition.type as keyof typeof context];
        if (condition.operator === 'equals' && contextValue !== condition.value) {
          conditionsMet = false;
          break;
        }
      }

      if (!conditionsMet) continue;

      // Check device requirements
      for (const req of rule.deviceRequirements) {
        if (req.required) {
          if (req.type === 'trusted_device' && !context.deviceTrusted) {
            return { allowed: false, accessLevel: 'none', reason: 'Trusted device required', requiresMfa: false };
          }
          if (req.type === 'hospital_network' && !context.onHospitalNetwork) {
            return { allowed: false, accessLevel: 'none', reason: 'Hospital network required', requiresMfa: false };
          }
        }
      }

      // Check location restriction
      if (rule.locationRestriction.length > 0 && context.location) {
        if (!rule.locationRestriction.includes(context.location)) {
          return { allowed: false, accessLevel: 'none', reason: 'Location not authorized', requiresMfa: false };
        }
      }

      // Check time restriction
      if (rule.timeRestriction !== 'none' && rule.timeRestriction !== '24_7' && context.time) {
        const hour = context.time.getHours();
        if (rule.timeRestriction === 'business_hours' && (hour < 8 || hour >= 17)) {
          return { allowed: false, accessLevel: 'none', reason: 'Outside business hours', requiresMfa: false };
        }
        if (rule.timeRestriction === 'extended_hours' && (hour < 6 || hour >= 22)) {
          return { allowed: false, accessLevel: 'none', reason: 'Outside extended hours', requiresMfa: false };
        }
      }

      return {
        allowed: true,
        accessLevel: rule.accessLevel,
        reason: `Access granted via rule: ${rule.name}`,
        requiresMfa: rule.mfaRequired,
      };
    }

    return { allowed: false, accessLevel: 'none', reason: 'No matching access rule found', requiresMfa: false };
  }

  // ==========================================
  // Emergency Override
  // ==========================================

  canActivateEmergencyOverride(departmentCode: DepartmentCode, userRole: string): boolean {
    const policy = this.policies.get(departmentCode);
    if (!policy) return false;
    return policy.emergencyOverride.enabled && policy.emergencyOverride.allowedRoles.includes(userRole);
  }

  getEmergencyOverridePolicy(departmentCode: DepartmentCode): EmergencyOverridePolicy | null {
    const policy = this.policies.get(departmentCode);
    return policy?.emergencyOverride || null;
  }

  // ==========================================
  // Statistics
  // ==========================================

  getPolicyStatistics(): {
    totalPolicies: number;
    enabledPolicies: number;
    totalAccessRules: number;
    totalWorkflowRules: number;
    emergencyOverrideEnabled: number;
  } {
    const policies = Array.from(this.policies.values());
    return {
      totalPolicies: policies.length,
      enabledPolicies: policies.filter(p => p.enabled).length,
      totalAccessRules: policies.reduce((sum, p) => sum + p.accessRules.length, 0),
      totalWorkflowRules: policies.reduce((sum, p) => sum + p.workflowRules.length, 0),
      emergencyOverrideEnabled: policies.filter(p => p.emergencyOverride.enabled).length,
    };
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

export const departmentPoliciesService = DepartmentPoliciesService.getInstance();
