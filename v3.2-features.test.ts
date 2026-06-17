/**
 * MediVac One v3.2 Features Unit Tests
 * Testing: Incident Reporting, Consent Management, Care Coordination
 */

import { describe, it, expect, beforeEach } from 'vitest';

// ============================================
// INCIDENT REPORTING SERVICE TESTS
// ============================================

interface IncidentReport {
  id: string;
  incidentNumber: string;
  type: string;
  severity: string;
  status: string;
  patientId?: string;
  patientName?: string;
  description: string;
  location: string;
  reportedBy: string;
  reportedAt: Date;
  witnesses: string[];
  immediateActions: string[];
  rootCause?: {
    category: string;
    description: string;
    contributingFactors: string[];
  };
}

// Mock Incident Reporting Service
const createMockIncidentService = () => {
  const incidents = new Map<string, IncidentReport>();
  let counter = 1000;

  return {
    createIncident(data: Partial<IncidentReport>): IncidentReport {
      counter++;
      const id = `INC-${Date.now()}-${counter}`;
      const incident: IncidentReport = {
        id,
        incidentNumber: `IR-${new Date().getFullYear()}-${counter}`,
        type: data.type || 'near_miss',
        severity: data.severity || 'minor',
        status: 'reported',
        patientId: data.patientId,
        patientName: data.patientName,
        description: data.description || '',
        location: data.location || '',
        reportedBy: data.reportedBy || '',
        reportedAt: new Date(),
        witnesses: data.witnesses || [],
        immediateActions: data.immediateActions || [],
      };
      incidents.set(id, incident);
      return incident;
    },

    getIncident(id: string): IncidentReport | null {
      return incidents.get(id) || null;
    },

    updateStatus(id: string, status: string): IncidentReport | null {
      const incident = incidents.get(id);
      if (!incident) return null;
      incident.status = status;
      return incident;
    },

    addRootCause(id: string, rootCause: IncidentReport['rootCause']): IncidentReport | null {
      const incident = incidents.get(id);
      if (!incident) return null;
      incident.rootCause = rootCause;
      incident.status = 'analyzed';
      return incident;
    },

    getIncidentsBySeverity(severity: string): IncidentReport[] {
      return Array.from(incidents.values()).filter(i => i.severity === severity);
    },

    getIncidentsByType(type: string): IncidentReport[] {
      return Array.from(incidents.values()).filter(i => i.type === type);
    },

    clearAll(): void {
      incidents.clear();
      counter = 1000;
    },
  };
};

describe('Incident Reporting Service', () => {
  const service = createMockIncidentService();

  beforeEach(() => {
    service.clearAll();
  });

  it('should create a new incident report', () => {
    const incident = service.createIncident({
      type: 'medication_error',
      severity: 'moderate',
      description: 'Wrong medication administered',
      location: 'ICU Room 301',
      reportedBy: 'Nurse Johnson',
      patientId: 'PAT-001',
      patientName: 'John Smith',
    });

    expect(incident.id).toBeDefined();
    expect(incident.incidentNumber).toMatch(/^IR-\d{4}-\d+$/);
    expect(incident.type).toBe('medication_error');
    expect(incident.severity).toBe('moderate');
    expect(incident.status).toBe('reported');
  });

  it('should track incident status progression', () => {
    const incident = service.createIncident({
      type: 'fall',
      severity: 'major',
      description: 'Patient fell while transferring',
      location: 'Med-Surg Unit',
      reportedBy: 'Nurse Williams',
    });

    expect(incident.status).toBe('reported');

    const updated = service.updateStatus(incident.id, 'under_investigation');
    expect(updated?.status).toBe('under_investigation');

    const analyzed = service.updateStatus(incident.id, 'analyzed');
    expect(analyzed?.status).toBe('analyzed');
  });

  it('should add root cause analysis', () => {
    const incident = service.createIncident({
      type: 'equipment_failure',
      severity: 'moderate',
      description: 'IV pump malfunction',
      location: 'PACU',
      reportedBy: 'Nurse Davis',
    });

    const analyzed = service.addRootCause(incident.id, {
      category: 'equipment',
      description: 'Pump battery failure due to age',
      contributingFactors: [
        'Equipment past recommended replacement date',
        'Preventive maintenance delayed',
        'No backup pump available',
      ],
    });

    expect(analyzed?.rootCause).toBeDefined();
    expect(analyzed?.rootCause?.category).toBe('equipment');
    expect(analyzed?.rootCause?.contributingFactors).toHaveLength(3);
    expect(analyzed?.status).toBe('analyzed');
  });

  it('should filter incidents by severity', () => {
    service.createIncident({ type: 'near_miss', severity: 'minor', description: 'Test 1', location: 'A', reportedBy: 'X' });
    service.createIncident({ type: 'fall', severity: 'major', description: 'Test 2', location: 'B', reportedBy: 'Y' });
    service.createIncident({ type: 'medication_error', severity: 'minor', description: 'Test 3', location: 'C', reportedBy: 'Z' });

    const minorIncidents = service.getIncidentsBySeverity('minor');
    expect(minorIncidents).toHaveLength(2);

    const majorIncidents = service.getIncidentsBySeverity('major');
    expect(majorIncidents).toHaveLength(1);
  });

  it('should track witnesses and immediate actions', () => {
    const incident = service.createIncident({
      type: 'adverse_event',
      severity: 'severe',
      description: 'Patient reaction to medication',
      location: 'ED',
      reportedBy: 'Dr. Smith',
      witnesses: ['Nurse Johnson', 'Tech Williams', 'Dr. Brown'],
      immediateActions: [
        'Medication discontinued',
        'Vital signs monitored',
        'Physician notified',
        'Incident documented',
      ],
    });

    expect(incident.witnesses).toHaveLength(3);
    expect(incident.immediateActions).toHaveLength(4);
    expect(incident.witnesses).toContain('Nurse Johnson');
  });
});

// ============================================
// CONSENT MANAGEMENT SERVICE TESTS
// ============================================

interface ConsentForm {
  id: string;
  consentNumber: string;
  type: string;
  status: string;
  patientId: string;
  patientName: string;
  procedureName: string;
  providerId: string;
  providerName: string;
  risks: string[];
  benefits: string[];
  alternatives: string[];
  patientSignature?: {
    signedAt: Date;
    signatureData: string;
    witnessName: string;
  };
  providerSignature?: {
    signedAt: Date;
    signatureData: string;
  };
  createdAt: Date;
  expiresAt?: Date;
}

// Mock Consent Management Service
const createMockConsentService = () => {
  const consents = new Map<string, ConsentForm>();
  let counter = 1000;

  return {
    createConsent(data: Partial<ConsentForm>): ConsentForm {
      counter++;
      const id = `CON-${Date.now()}-${counter}`;
      const consent: ConsentForm = {
        id,
        consentNumber: `CF-${new Date().getFullYear()}-${counter}`,
        type: data.type || 'procedure',
        status: 'pending',
        patientId: data.patientId || '',
        patientName: data.patientName || '',
        procedureName: data.procedureName || '',
        providerId: data.providerId || '',
        providerName: data.providerName || '',
        risks: data.risks || [],
        benefits: data.benefits || [],
        alternatives: data.alternatives || [],
        createdAt: new Date(),
        expiresAt: data.expiresAt,
      };
      consents.set(id, consent);
      return consent;
    },

    getConsent(id: string): ConsentForm | null {
      return consents.get(id) || null;
    },

    addPatientSignature(id: string, signatureData: string, witnessName: string): ConsentForm | null {
      const consent = consents.get(id);
      if (!consent) return null;
      consent.patientSignature = {
        signedAt: new Date(),
        signatureData,
        witnessName,
      };
      if (consent.providerSignature) {
        consent.status = 'completed';
      } else {
        consent.status = 'patient_signed';
      }
      return consent;
    },

    addProviderSignature(id: string, signatureData: string): ConsentForm | null {
      const consent = consents.get(id);
      if (!consent) return null;
      consent.providerSignature = {
        signedAt: new Date(),
        signatureData,
      };
      if (consent.patientSignature) {
        consent.status = 'completed';
      } else {
        consent.status = 'provider_signed';
      }
      return consent;
    },

    isConsentValid(id: string): boolean {
      const consent = consents.get(id);
      if (!consent) return false;
      if (consent.status !== 'completed') return false;
      if (consent.expiresAt && consent.expiresAt < new Date()) return false;
      return true;
    },

    getConsentsByPatient(patientId: string): ConsentForm[] {
      return Array.from(consents.values()).filter(c => c.patientId === patientId);
    },

    revokeConsent(id: string, reason: string): ConsentForm | null {
      const consent = consents.get(id);
      if (!consent) return null;
      consent.status = 'revoked';
      return consent;
    },

    clearAll(): void {
      consents.clear();
      counter = 1000;
    },
  };
};

describe('Consent Management Service', () => {
  const service = createMockConsentService();

  beforeEach(() => {
    service.clearAll();
  });

  it('should create a new consent form', () => {
    const consent = service.createConsent({
      type: 'surgical',
      patientId: 'PAT-001',
      patientName: 'Jane Doe',
      procedureName: 'Appendectomy',
      providerId: 'PROV-001',
      providerName: 'Dr. Smith',
      risks: ['Infection', 'Bleeding', 'Anesthesia complications'],
      benefits: ['Remove inflamed appendix', 'Prevent rupture'],
      alternatives: ['Antibiotic therapy', 'Observation'],
    });

    expect(consent.id).toBeDefined();
    expect(consent.consentNumber).toMatch(/^CF-\d{4}-\d+$/);
    expect(consent.status).toBe('pending');
    expect(consent.risks).toHaveLength(3);
  });

  it('should handle patient signature', () => {
    const consent = service.createConsent({
      type: 'procedure',
      patientId: 'PAT-002',
      patientName: 'Bob Wilson',
      procedureName: 'Colonoscopy',
      providerId: 'PROV-002',
      providerName: 'Dr. Johnson',
    });

    const signed = service.addPatientSignature(
      consent.id,
      'base64_signature_data',
      'Nurse Williams'
    );

    expect(signed?.patientSignature).toBeDefined();
    expect(signed?.patientSignature?.witnessName).toBe('Nurse Williams');
    expect(signed?.status).toBe('patient_signed');
  });

  it('should complete consent when both parties sign', () => {
    const consent = service.createConsent({
      type: 'anesthesia',
      patientId: 'PAT-003',
      patientName: 'Alice Brown',
      procedureName: 'General Anesthesia',
      providerId: 'PROV-003',
      providerName: 'Dr. Anesthesiologist',
    });

    service.addPatientSignature(consent.id, 'patient_sig', 'Witness A');
    const completed = service.addProviderSignature(consent.id, 'provider_sig');

    expect(completed?.status).toBe('completed');
    expect(completed?.patientSignature).toBeDefined();
    expect(completed?.providerSignature).toBeDefined();
  });

  it('should validate consent status and expiration', () => {
    const consent = service.createConsent({
      type: 'blood_transfusion',
      patientId: 'PAT-004',
      patientName: 'Charlie Davis',
      procedureName: 'Blood Transfusion',
      providerId: 'PROV-004',
      providerName: 'Dr. Hematologist',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    });

    // Not valid yet - not signed
    expect(service.isConsentValid(consent.id)).toBe(false);

    // Sign both
    service.addPatientSignature(consent.id, 'sig1', 'Witness');
    service.addProviderSignature(consent.id, 'sig2');

    // Now valid
    expect(service.isConsentValid(consent.id)).toBe(true);
  });

  it('should handle consent revocation', () => {
    const consent = service.createConsent({
      type: 'research',
      patientId: 'PAT-005',
      patientName: 'Diana Evans',
      procedureName: 'Clinical Trial Participation',
      providerId: 'PROV-005',
      providerName: 'Dr. Researcher',
    });

    service.addPatientSignature(consent.id, 'sig', 'Witness');
    service.addProviderSignature(consent.id, 'sig');

    const revoked = service.revokeConsent(consent.id, 'Patient withdrew from study');
    expect(revoked?.status).toBe('revoked');
    expect(service.isConsentValid(consent.id)).toBe(false);
  });

  it('should retrieve all consents for a patient', () => {
    const patientId = 'PAT-006';
    
    service.createConsent({ patientId, patientName: 'Test', procedureName: 'Proc 1', providerId: 'P1', providerName: 'Dr. A' });
    service.createConsent({ patientId, patientName: 'Test', procedureName: 'Proc 2', providerId: 'P2', providerName: 'Dr. B' });
    service.createConsent({ patientId: 'OTHER', patientName: 'Other', procedureName: 'Proc 3', providerId: 'P3', providerName: 'Dr. C' });

    const patientConsents = service.getConsentsByPatient(patientId);
    expect(patientConsents).toHaveLength(2);
  });
});

// ============================================
// CARE COORDINATION SERVICE TESTS
// ============================================

interface Referral {
  id: string;
  referralNumber: string;
  type: string;
  status: string;
  priority: string;
  patientId: string;
  patientName: string;
  receivingDepartment: string;
  reason: string;
  createdAt: Date;
  acknowledgedAt?: Date;
  completedAt?: Date;
}

interface CareTeam {
  patientId: string;
  members: { id: string; name: string; role: string; isPrimary: boolean }[];
}

interface CareConference {
  id: string;
  patientId: string;
  conferenceType: string;
  scheduledDate: Date;
  attendees: { name: string; role: string; confirmed: boolean }[];
  status: string;
}

// Mock Care Coordination Service
const createMockCareCoordinationService = () => {
  const referrals = new Map<string, Referral>();
  const careTeams = new Map<string, CareTeam>();
  const conferences = new Map<string, CareConference>();
  let counter = 1000;

  return {
    createReferral(data: Partial<Referral>): Referral {
      counter++;
      const id = `REF-${Date.now()}-${counter}`;
      const referral: Referral = {
        id,
        referralNumber: `R-${new Date().getFullYear()}-${counter}`,
        type: data.type || 'specialty_consult',
        status: 'pending',
        priority: data.priority || 'routine',
        patientId: data.patientId || '',
        patientName: data.patientName || '',
        receivingDepartment: data.receivingDepartment || '',
        reason: data.reason || '',
        createdAt: new Date(),
      };
      referrals.set(id, referral);
      return referral;
    },

    getReferral(id: string): Referral | null {
      return referrals.get(id) || null;
    },

    updateReferralStatus(id: string, status: string): Referral | null {
      const referral = referrals.get(id);
      if (!referral) return null;
      referral.status = status;
      if (status === 'acknowledged') {
        referral.acknowledgedAt = new Date();
      }
      if (status === 'completed') {
        referral.completedAt = new Date();
      }
      return referral;
    },

    getPendingReferrals(): Referral[] {
      return Array.from(referrals.values())
        .filter(r => ['pending', 'sent', 'acknowledged'].includes(r.status))
        .sort((a, b) => {
          const priorityOrder: Record<string, number> = { emergent: 0, stat: 1, urgent: 2, routine: 3 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    },

    getOverdueReferrals(): Referral[] {
      const now = Date.now();
      const thresholds: Record<string, number> = {
        routine: 24 * 60 * 60 * 1000,
        urgent: 4 * 60 * 60 * 1000,
        stat: 1 * 60 * 60 * 1000,
        emergent: 15 * 60 * 1000,
      };
      return Array.from(referrals.values())
        .filter(r => {
          if (!['pending', 'sent'].includes(r.status)) return false;
          const age = now - r.createdAt.getTime();
          return age > thresholds[r.priority];
        });
    },

    updateCareTeam(patientId: string, members: CareTeam['members']): CareTeam {
      const team: CareTeam = { patientId, members };
      careTeams.set(patientId, team);
      return team;
    },

    getCareTeam(patientId: string): CareTeam | null {
      return careTeams.get(patientId) || null;
    },

    scheduleConference(data: Omit<CareConference, 'id' | 'status'>): CareConference {
      counter++;
      const id = `CONF-${Date.now()}-${counter}`;
      const conference: CareConference = {
        id,
        status: 'scheduled',
        ...data,
      };
      conferences.set(id, conference);
      return conference;
    },

    getUpcomingConferences(): CareConference[] {
      const now = new Date();
      return Array.from(conferences.values())
        .filter(c => c.status === 'scheduled' && c.scheduledDate > now)
        .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
    },

    clearAll(): void {
      referrals.clear();
      careTeams.clear();
      conferences.clear();
      counter = 1000;
    },
  };
};

describe('Care Coordination Service', () => {
  const service = createMockCareCoordinationService();

  beforeEach(() => {
    service.clearAll();
  });

  it('should create a new referral', () => {
    const referral = service.createReferral({
      type: 'specialty_consult',
      priority: 'urgent',
      patientId: 'PAT-001',
      patientName: 'John Smith',
      receivingDepartment: 'Cardiology',
      reason: 'Chest pain evaluation',
    });

    expect(referral.id).toBeDefined();
    expect(referral.referralNumber).toMatch(/^R-\d{4}-\d+$/);
    expect(referral.status).toBe('pending');
    expect(referral.priority).toBe('urgent');
  });

  it('should track referral status progression', () => {
    const referral = service.createReferral({
      type: 'imaging',
      patientId: 'PAT-002',
      patientName: 'Jane Doe',
      receivingDepartment: 'Radiology',
      reason: 'CT scan needed',
    });

    const acknowledged = service.updateReferralStatus(referral.id, 'acknowledged');
    expect(acknowledged?.status).toBe('acknowledged');
    expect(acknowledged?.acknowledgedAt).toBeDefined();

    const completed = service.updateReferralStatus(referral.id, 'completed');
    expect(completed?.status).toBe('completed');
    expect(completed?.completedAt).toBeDefined();
  });

  it('should sort pending referrals by priority', () => {
    service.createReferral({ priority: 'routine', patientId: 'P1', patientName: 'A', receivingDepartment: 'D1', reason: 'R1' });
    service.createReferral({ priority: 'emergent', patientId: 'P2', patientName: 'B', receivingDepartment: 'D2', reason: 'R2' });
    service.createReferral({ priority: 'urgent', patientId: 'P3', patientName: 'C', receivingDepartment: 'D3', reason: 'R3' });

    const pending = service.getPendingReferrals();
    expect(pending[0].priority).toBe('emergent');
    expect(pending[1].priority).toBe('urgent');
    expect(pending[2].priority).toBe('routine');
  });

  it('should manage care team members', () => {
    const team = service.updateCareTeam('PAT-001', [
      { id: 'M1', name: 'Dr. Smith', role: 'Attending Physician', isPrimary: true },
      { id: 'M2', name: 'Nurse Johnson', role: 'Primary Nurse', isPrimary: false },
      { id: 'M3', name: 'PT Williams', role: 'Physical Therapist', isPrimary: false },
    ]);

    expect(team.members).toHaveLength(3);
    
    const retrieved = service.getCareTeam('PAT-001');
    expect(retrieved?.members.find(m => m.isPrimary)?.name).toBe('Dr. Smith');
  });

  it('should schedule and retrieve care conferences', () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    const conference = service.scheduleConference({
      patientId: 'PAT-001',
      conferenceType: 'interdisciplinary',
      scheduledDate: tomorrow,
      attendees: [
        { name: 'Dr. Smith', role: 'Physician', confirmed: true },
        { name: 'Nurse Johnson', role: 'Nurse', confirmed: true },
        { name: 'SW Davis', role: 'Social Worker', confirmed: false },
      ],
    });

    expect(conference.id).toBeDefined();
    expect(conference.status).toBe('scheduled');
    expect(conference.attendees).toHaveLength(3);

    const upcoming = service.getUpcomingConferences();
    expect(upcoming).toHaveLength(1);
    expect(upcoming[0].conferenceType).toBe('interdisciplinary');
  });

  it('should identify overdue referrals based on priority', () => {
    // Create a referral with a past date (simulating overdue)
    const referral = service.createReferral({
      priority: 'routine',
      patientId: 'PAT-003',
      patientName: 'Test Patient',
      receivingDepartment: 'Test Dept',
      reason: 'Test reason',
    });

    // Manually set creation date to 25 hours ago
    const ref = service.getReferral(referral.id);
    if (ref) {
      ref.createdAt = new Date(Date.now() - 25 * 60 * 60 * 1000);
    }

    const overdue = service.getOverdueReferrals();
    expect(overdue).toHaveLength(1);
  });
});

// ============================================
// INTEGRATION TESTS
// ============================================

describe('v3.2 Feature Integration', () => {
  const incidentService = createMockIncidentService();
  const consentService = createMockConsentService();
  const coordinationService = createMockCareCoordinationService();

  beforeEach(() => {
    incidentService.clearAll();
    consentService.clearAll();
    coordinationService.clearAll();
  });

  it('should handle complete patient care workflow', () => {
    const patientId = 'PAT-WORKFLOW';
    const patientName = 'Workflow Patient';

    // 1. Create consent for procedure
    const consent = consentService.createConsent({
      type: 'surgical',
      patientId,
      patientName,
      procedureName: 'Hip Replacement',
      providerId: 'PROV-001',
      providerName: 'Dr. Orthopedic',
      risks: ['Infection', 'Blood clots', 'Nerve damage'],
      benefits: ['Pain relief', 'Improved mobility'],
    });

    consentService.addPatientSignature(consent.id, 'patient_sig', 'Witness');
    consentService.addProviderSignature(consent.id, 'provider_sig');
    expect(consentService.isConsentValid(consent.id)).toBe(true);

    // 2. Create referrals for care team
    const ptReferral = coordinationService.createReferral({
      type: 'physical_therapy',
      priority: 'routine',
      patientId,
      patientName,
      receivingDepartment: 'Physical Therapy',
      reason: 'Post-operative rehabilitation',
    });

    expect(ptReferral.status).toBe('pending');

    // 3. Set up care team
    const team = coordinationService.updateCareTeam(patientId, [
      { id: 'M1', name: 'Dr. Orthopedic', role: 'Surgeon', isPrimary: true },
      { id: 'M2', name: 'Nurse Smith', role: 'Primary Nurse', isPrimary: false },
    ]);

    expect(team.members).toHaveLength(2);

    // 4. Report an incident (near miss)
    const incident = incidentService.createIncident({
      type: 'near_miss',
      severity: 'minor',
      description: 'Wrong patient ID on wristband caught before procedure',
      location: 'Pre-op',
      reportedBy: 'Nurse Smith',
      patientId,
      patientName,
    });

    expect(incident.status).toBe('reported');

    // 5. Schedule discharge planning conference
    const conference = coordinationService.scheduleConference({
      patientId,
      conferenceType: 'discharge_planning',
      scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      attendees: [
        { name: 'Dr. Orthopedic', role: 'Surgeon', confirmed: true },
        { name: 'PT Williams', role: 'Physical Therapist', confirmed: false },
        { name: 'SW Davis', role: 'Social Worker', confirmed: true },
      ],
    });

    expect(conference.status).toBe('scheduled');
  });

  it('should track metrics across all services', () => {
    // Create multiple incidents
    incidentService.createIncident({ type: 'fall', severity: 'minor', description: 'D1', location: 'L1', reportedBy: 'R1' });
    incidentService.createIncident({ type: 'medication_error', severity: 'moderate', description: 'D2', location: 'L2', reportedBy: 'R2' });
    incidentService.createIncident({ type: 'fall', severity: 'major', description: 'D3', location: 'L3', reportedBy: 'R3' });

    const fallIncidents = incidentService.getIncidentsByType('fall');
    expect(fallIncidents).toHaveLength(2);

    // Create multiple consents
    consentService.createConsent({ patientId: 'P1', patientName: 'A', procedureName: 'Proc1', providerId: 'PR1', providerName: 'Dr1' });
    consentService.createConsent({ patientId: 'P1', patientName: 'A', procedureName: 'Proc2', providerId: 'PR2', providerName: 'Dr2' });

    const patientConsents = consentService.getConsentsByPatient('P1');
    expect(patientConsents).toHaveLength(2);

    // Create multiple referrals
    coordinationService.createReferral({ priority: 'urgent', patientId: 'P1', patientName: 'A', receivingDepartment: 'D1', reason: 'R1' });
    coordinationService.createReferral({ priority: 'routine', patientId: 'P2', patientName: 'B', receivingDepartment: 'D2', reason: 'R2' });
    coordinationService.createReferral({ priority: 'stat', patientId: 'P3', patientName: 'C', receivingDepartment: 'D3', reason: 'R3' });

    const pending = coordinationService.getPendingReferrals();
    expect(pending).toHaveLength(3);
    expect(pending[0].priority).toBe('stat');
  });
});
