 * MediVac One - General Practice Integration Service
 * HL7 FHIR-compliant import/export for patient records
 * Supports Australian healthcare standards including My Health Record
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ==========================================
// Types and Interfaces
// ==========================================

export interface FHIRResource {
  resourceType: string;
  id: string;
  meta?: {
    versionId?: string;
    lastUpdated?: string;
    profile?: string[];
  };
}

export interface FHIRPatient extends FHIRResource {
  resourceType: 'Patient';
  identifier?: Array<{
    system: string;
    value: string;
    type?: { coding: Array<{ system: string; code: string; display: string }> };
  }>;
  active?: boolean;
  name?: Array<{
    use?: string;
    family?: string;
    given?: string[];
    prefix?: string[];
    suffix?: string[];
  }>;
  telecom?: Array<{
    system: string;
    value: string;
    use?: string;
  }>;
  gender?: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: string;
  deceasedBoolean?: boolean;
  address?: Array<{
    use?: string;
    type?: string;
    line?: string[];
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  }>;
  maritalStatus?: {
    coding: Array<{ system: string; code: string; display: string }>;
  };
  contact?: Array<{
    relationship?: Array<{ coding: Array<{ system: string; code: string; display: string }> }>;
    name?: { family?: string; given?: string[] };
    telecom?: Array<{ system: string; value: string }>;
  }>;
  generalPractitioner?: Array<{ reference: string; display?: string }>;
}

export interface FHIRCondition extends FHIRResource {
  resourceType: 'Condition';
  clinicalStatus?: { coding: Array<{ system: string; code: string }> };
  verificationStatus?: { coding: Array<{ system: string; code: string }> };
  category?: Array<{ coding: Array<{ system: string; code: string; display: string }> }>;
  severity?: { coding: Array<{ system: string; code: string; display: string }> };
  code?: { coding: Array<{ system: string; code: string; display: string }>; text?: string };
  subject: { reference: string };
  onsetDateTime?: string;
  recordedDate?: string;
  recorder?: { reference: string; display?: string };
  note?: Array<{ text: string }>;
}

export interface FHIRMedicationStatement extends FHIRResource {
  resourceType: 'MedicationStatement';
  status: 'active' | 'completed' | 'entered-in-error' | 'intended' | 'stopped' | 'on-hold' | 'unknown' | 'not-taken';
  medicationCodeableConcept?: { coding: Array<{ system: string; code: string; display: string }>; text?: string };
  subject: { reference: string };
  effectiveDateTime?: string;
  effectivePeriod?: { start?: string; end?: string };
  dateAsserted?: string;
  informationSource?: { reference: string; display?: string };
  dosage?: Array<{
    text?: string;
    timing?: { repeat?: { frequency?: number; period?: number; periodUnit?: string } };
    route?: { coding: Array<{ system: string; code: string; display: string }> };
    doseAndRate?: Array<{ doseQuantity?: { value: number; unit: string } }>;
  }>;
  note?: Array<{ text: string }>;
}

export interface FHIRImmunization extends FHIRResource {
  resourceType: 'Immunization';
  status: 'completed' | 'entered-in-error' | 'not-done';
  vaccineCode: { coding: Array<{ system: string; code: string; display: string }>; text?: string };
  patient: { reference: string };
  occurrenceDateTime?: string;
  recorded?: string;
  primarySource?: boolean;
  location?: { reference: string; display?: string };
  manufacturer?: { display?: string };
  lotNumber?: string;
  expirationDate?: string;
  site?: { coding: Array<{ system: string; code: string; display: string }> };
  route?: { coding: Array<{ system: string; code: string; display: string }> };
  doseQuantity?: { value: number; unit: string };
  performer?: Array<{ actor: { reference: string; display?: string } }>;
  note?: Array<{ text: string }>;
}

export interface FHIRObservation extends FHIRResource {
  resourceType: 'Observation';
  status: 'registered' | 'preliminary' | 'final' | 'amended' | 'corrected' | 'cancelled' | 'entered-in-error' | 'unknown';
  category?: Array<{ coding: Array<{ system: string; code: string; display: string }> }>;
  code: { coding: Array<{ system: string; code: string; display: string }>; text?: string };
  subject: { reference: string };
  effectiveDateTime?: string;
  issued?: string;
  performer?: Array<{ reference: string; display?: string }>;
  valueQuantity?: { value: number; unit: string; system?: string; code?: string };
  valueString?: string;
  valueCodeableConcept?: { coding: Array<{ system: string; code: string; display: string }> };
  interpretation?: Array<{ coding: Array<{ system: string; code: string; display: string }> }>;
  referenceRange?: Array<{ low?: { value: number; unit: string }; high?: { value: number; unit: string }; text?: string }>;
  note?: Array<{ text: string }>;
}

export interface FHIRDiagnosticReport extends FHIRResource {
  resourceType: 'DiagnosticReport';
  status: 'registered' | 'partial' | 'preliminary' | 'final' | 'amended' | 'corrected' | 'appended' | 'cancelled' | 'entered-in-error' | 'unknown';
  category?: Array<{ coding: Array<{ system: string; code: string; display: string }> }>;
  code: { coding: Array<{ system: string; code: string; display: string }>; text?: string };
  subject: { reference: string };
  effectiveDateTime?: string;
  issued?: string;
  performer?: Array<{ reference: string; display?: string }>;
  result?: Array<{ reference: string; display?: string }>;
  conclusion?: string;
  conclusionCode?: Array<{ coding: Array<{ system: string; code: string; display: string }> }>;
  presentedForm?: Array<{ contentType: string; data?: string; url?: string; title?: string }>;
}

export interface FHIRDocumentReference extends FHIRResource {
  resourceType: 'DocumentReference';
  status: 'current' | 'superseded' | 'entered-in-error';
  docStatus?: 'preliminary' | 'final' | 'amended' | 'entered-in-error';
  type?: { coding: Array<{ system: string; code: string; display: string }> };
  category?: Array<{ coding: Array<{ system: string; code: string; display: string }> }>;
  subject?: { reference: string };
  date?: string;
  author?: Array<{ reference: string; display?: string }>;
  custodian?: { reference: string; display?: string };
  description?: string;
  content: Array<{
    attachment: {
      contentType: string;
      language?: string;
      data?: string;
      url?: string;
      size?: number;
      hash?: string;
      title?: string;
      creation?: string;
    };
    format?: { system: string; code: string; display: string };
  }>;
  context?: {
    encounter?: Array<{ reference: string }>;
    event?: Array<{ coding: Array<{ system: string; code: string; display: string }> }>;
    period?: { start?: string; end?: string };
    facilityType?: { coding: Array<{ system: string; code: string; display: string }> };
    practiceSetting?: { coding: Array<{ system: string; code: string; display: string }> };
  };
}

export interface FHIRServiceRequest extends FHIRResource {
  resourceType: 'ServiceRequest';
  status: 'draft' | 'active' | 'on-hold' | 'revoked' | 'completed' | 'entered-in-error' | 'unknown';
  intent: 'proposal' | 'plan' | 'directive' | 'order' | 'original-order' | 'reflex-order' | 'filler-order' | 'instance-order' | 'option';
  priority?: 'routine' | 'urgent' | 'asap' | 'stat';
  code?: { coding: Array<{ system: string; code: string; display: string }>; text?: string };
  subject: { reference: string };
  authoredOn?: string;
  requester?: { reference: string; display?: string };
  performer?: Array<{ reference: string; display?: string }>;
  reasonCode?: Array<{ coding: Array<{ system: string; code: string; display: string }>; text?: string }>;
  reasonReference?: Array<{ reference: string; display?: string }>;
  note?: Array<{ text: string }>;
}

export interface FHIRBundle extends FHIRResource {
  resourceType: 'Bundle';
  type: 'document' | 'message' | 'transaction' | 'transaction-response' | 'batch' | 'batch-response' | 'history' | 'searchset' | 'collection';
  timestamp?: string;