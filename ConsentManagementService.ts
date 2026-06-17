/**
 * Patient Consent Management Service
 * MediVac One v3.2 - Digital Consent with E-Signatures
 * 
 * Comprehensive consent management for procedures, treatments,
 * and research with electronic signature capture and audit trails.
 */

// Consent Types
export type ConsentType = 
  | 'general_treatment'
  | 'surgical_procedure'
  | 'anesthesia'
  | 'blood_transfusion'
  | 'research_study'
  | 'photography'
  | 'data_sharing'
  | 'hipaa_authorization'
  | 'advance_directive'
  | 'against_medical_advice';

export type ConsentStatus = 
  | 'pending'
  | 'signed'
  | 'witnessed'
  | 'completed'
  | 'expired'
  | 'withdrawn'
  | 'refused';

export type SignatureType = 
  | 'patient'
  | 'legal_guardian'
  | 'healthcare_proxy'
  | 'witness'
  | 'provider'
  | 'interpreter';

export interface ConsentForm {
  id: string;
  formNumber: string;
  type: ConsentType;
  status: ConsentStatus;
  
  // Patient Info
  patientId: string;
  patientName: string;
  patientMRN: string;
  patientDOB: Date;
  
  // Procedure/Treatment Details
  procedureName?: string;
  procedureDescription?: string;
  scheduledDate?: Date;
  providerId: string;
  providerName: string;
  
  // Consent Content
  title: string;
  content: string;
  risks: string[];
  benefits: string[];
  alternatives: string[];
  additionalInfo?: string;
  
  // Language
  language: string;
  interpreterUsed: boolean;
  interpreterName?: string;
  
  // Signatures
  signatures: ConsentSignature[];
  
  // Expiration
  expirationDate?: Date;
  isExpired: boolean;
  
  // Withdrawal
  withdrawnAt?: Date;
  withdrawalReason?: string;
  
  // Audit
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface ConsentSignature {
  id: string;
  type: SignatureType;
  signerId: string;
  signerName: string;
  signerRelationship?: string;
  signatureData: string; // Base64 encoded signature image
  signedAt: Date;
  ipAddress?: string;
  deviceInfo?: string;
  verified: boolean;
}

export interface ConsentTemplate {
  id: string;
  type: ConsentType;
  name: string;
  title: string;
  content: string;
  defaultRisks: string[];
  defaultBenefits: string[];
  defaultAlternatives: string[];
  requiresWitness: boolean;
  requiresInterpreter: boolean;
  expirationDays?: number;
  languages: string[];
  isActive: boolean;
}

export interface ConsentAuditEntry {
  id: string;
  consentId: string;
  action: string;
  performedBy: string;
  performedAt: Date;
  details: string;
  ipAddress?: string;
}

// Mock data storage
const consents: Map<string, ConsentForm> = new Map();
const templates: Map<string, ConsentTemplate> = new Map();
const auditLog: ConsentAuditEntry[] = [];
let formCounter = 5000;

// Initialize default templates
const initializeTemplates = () => {
  const defaultTemplates: Omit<ConsentTemplate, 'id'>[] = [
    {
      type: 'general_treatment',
      name: 'General Treatment Consent',
      title: 'Consent for Medical Treatment',
      content: `I hereby consent to receive medical treatment and care at this facility. I understand that:

1. The practice of medicine is not an exact science and no guarantees have been made to me regarding the outcome of any examination, treatment, or procedure.

2. I have the right to ask questions about any proposed treatment and to have those questions answered before the treatment is performed.

3. I have the right to refuse any proposed treatment.

4. I authorize the release of medical information necessary for treatment and billing purposes.`,
      defaultRisks: ['Allergic reactions', 'Infection', 'Bleeding', 'Pain or discomfort'],
      defaultBenefits: ['Diagnosis of condition', 'Treatment of illness', 'Prevention of complications'],
      defaultAlternatives: ['No treatment', 'Alternative treatments as discussed'],
      requiresWitness: false,
      requiresInterpreter: false,
      languages: ['English', 'Spanish', 'Chinese', 'Vietnamese', 'Korean'],
      isActive: true,
    },
    {
      type: 'surgical_procedure',
      name: 'Surgical Procedure Consent',
      title: 'Informed Consent for Surgical Procedure',
      content: `I hereby authorize the physician(s) named above and such assistants as may be selected to perform the following procedure(s):

[PROCEDURE_NAME]

The nature and purpose of the procedure, possible alternative methods of treatment, the risks involved, and the possibility of complications have been explained to me. I acknowledge that no guarantee or assurance has been made as to the results that may be obtained.

I consent to the administration of anesthesia as deemed necessary by the anesthesiologist. I understand that all anesthetics involve risks of complications.

I consent to the disposal of any tissue, parts, or organs that may be removed during the procedure.`,
      defaultRisks: ['Bleeding', 'Infection', 'Nerve damage', 'Anesthesia complications', 'Blood clots', 'Scarring', 'Need for additional surgery'],
      defaultBenefits: ['Treatment of condition', 'Relief of symptoms', 'Improved quality of life'],
      defaultAlternatives: ['Non-surgical treatment', 'Medication management', 'Watchful waiting'],
      requiresWitness: true,
      requiresInterpreter: false,
      expirationDays: 30,
      languages: ['English', 'Spanish', 'Chinese', 'Vietnamese', 'Korean'],
      isActive: true,
    },
    {
      type: 'blood_transfusion',
      name: 'Blood Transfusion Consent',
      title: 'Consent for Blood Transfusion',
      content: `I consent to receive blood and/or blood products as deemed necessary by my physician(s). I understand that:

1. Blood transfusions carry certain risks including but not limited to allergic reactions, fever, and transmission of infectious diseases.

2. The blood supply is tested for HIV, Hepatitis B, Hepatitis C, and other infectious agents, but no test is 100% accurate.

3. Alternatives to blood transfusion have been explained to me.

4. I have the right to refuse blood transfusion.`,
      defaultRisks: ['Allergic reaction', 'Fever', 'Hemolytic reaction', 'Transmission of infection', 'Iron overload'],
      defaultBenefits: ['Replacement of blood loss', 'Treatment of anemia', 'Improved oxygen delivery'],
      defaultAlternatives: ['Iron supplements', 'Erythropoietin', 'Cell salvage', 'Hemodilution'],
      requiresWitness: true,
      requiresInterpreter: false,
      languages: ['English', 'Spanish', 'Chinese', 'Vietnamese', 'Korean'],
      isActive: true,
    },
    {
      type: 'research_study',
      name: 'Research Study Consent',
      title: 'Informed Consent for Research Participation',
      content: `You are being asked to participate in a research study. Before you decide to participate, it is important that you understand:

1. Your participation is voluntary. You may refuse to participate or withdraw at any time without penalty.

2. The purpose, procedures, risks, and benefits of the study have been explained to you.

3. Your medical information will be kept confidential to the extent permitted by law.

4. You may not directly benefit from participating in this study.

5. You have the right to ask questions at any time.`,
      defaultRisks: ['Unknown risks', 'Side effects from experimental treatment', 'Loss of privacy', 'Time commitment'],
      defaultBenefits: ['Contribution to medical knowledge', 'Access to new treatments', 'Close medical monitoring'],
      defaultAlternatives: ['Standard treatment', 'Other research studies', 'No participation'],
      requiresWitness: true,
      requiresInterpreter: true,
      expirationDays: 365,
      languages: ['English', 'Spanish', 'Chinese', 'Vietnamese', 'Korean'],
      isActive: true,
    },
    {
      type: 'hipaa_authorization',
      name: 'HIPAA Authorization',
      title: 'Authorization for Use and Disclosure of Protected Health Information',
      content: `I authorize the use and disclosure of my protected health information as described below:

1. Information to be disclosed: [SPECIFY]

2. Purpose of disclosure: [SPECIFY]

3. Recipient of information: [SPECIFY]

I understand that:
- I may revoke this authorization at any time in writing.
- Treatment, payment, or eligibility for benefits cannot be conditioned on signing this authorization.
- Information disclosed may be re-disclosed by the recipient and no longer protected.`,
      defaultRisks: ['Loss of privacy', 'Potential for re-disclosure'],
      defaultBenefits: ['Coordination of care', 'Insurance processing', 'Legal requirements'],
      defaultAlternatives: ['Decline authorization', 'Limited authorization'],
      requiresWitness: false,
      requiresInterpreter: false,
      expirationDays: 365,
      languages: ['English', 'Spanish', 'Chinese', 'Vietnamese', 'Korean'],
      isActive: true,
    },
  ];

  defaultTemplates.forEach((template, index) => {
    const id = `TPL-${index + 1}`;
    templates.set(id, { id, ...template });
  });
};

// Initialize templates on load
initializeTemplates();

/**
 * Consent Management Service
 */
export const ConsentManagementService = {
  /**
   * Create a new consent form
   */
  createConsent(data: Partial<ConsentForm>): ConsentForm {
    formCounter++;
    const id = `CON-${Date.now()}`;
    const formNumber = `CF-${new Date().getFullYear()}-${formCounter}`;
    
    const consent: ConsentForm = {
      id,
      formNumber,
      type: data.type || 'general_treatment',
      status: 'pending',
      patientId: data.patientId || '',
      patientName: data.patientName || '',
      patientMRN: data.patientMRN || '',
      patientDOB: data.patientDOB || new Date(),
      procedureName: data.procedureName,
      procedureDescription: data.procedureDescription,
      scheduledDate: data.scheduledDate,
      providerId: data.providerId || '',
      providerName: data.providerName || '',
      title: data.title || '',
      content: data.content || '',
      risks: data.risks || [],
      benefits: data.benefits || [],
      alternatives: data.alternatives || [],
      additionalInfo: data.additionalInfo,
      language: data.language || 'English',
      interpreterUsed: data.interpreterUsed || false,
      interpreterName: data.interpreterName,
      signatures: [],
      expirationDate: data.expirationDate,
      isExpired: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: data.createdBy || 'system',
    };
    
    consents.set(id, consent);
    this.addAuditEntry(id, 'CREATED', consent.createdBy, 'Consent form created');
    
    return consent;
  },

  /**
   * Create consent from template
   */
  createFromTemplate(templateId: string, patientData: {
    patientId: string;
    patientName: string;
    patientMRN: string;
    patientDOB: Date;
    providerId: string;
    providerName: string;
    procedureName?: string;
    language?: string;
  }): ConsentForm | null {
    const template = templates.get(templateId);
    if (!template) return null;
    
    const expirationDate = template.expirationDays 
      ? new Date(Date.now() + template.expirationDays * 24 * 60 * 60 * 1000)
      : undefined;
    
    return this.createConsent({
      type: template.type,
      title: template.title,
      content: template.content.replace('[PROCEDURE_NAME]', patientData.procedureName || ''),
      risks: [...template.defaultRisks],
      benefits: [...template.defaultBenefits],
      alternatives: [...template.defaultAlternatives],
      expirationDate,
      ...patientData,
    });
  },

  /**
   * Add signature to consent
   */
  addSignature(consentId: string, signature: Omit<ConsentSignature, 'id' | 'signedAt' | 'verified'>): ConsentForm | null {
    const consent = consents.get(consentId);
    if (!consent) return null;
    
    const sig: ConsentSignature = {
      id: `SIG-${Date.now()}`,
      signedAt: new Date(),
      verified: true,
      ...signature,
    };
    
    consent.signatures.push(sig);
    consent.updatedAt = new Date();
    
    // Update status based on signatures
    if (sig.type === 'patient' || sig.type === 'legal_guardian' || sig.type === 'healthcare_proxy') {
      consent.status = 'signed';
    }
    
    // Check if witness is required and present
    const template = Array.from(templates.values()).find(t => t.type === consent.type);
    if (template?.requiresWitness) {
      const hasWitness = consent.signatures.some(s => s.type === 'witness');
      if (hasWitness && consent.status === 'signed') {
        consent.status = 'witnessed';
      }
    }
    
    // Check if all required signatures are present
    const hasPatientSig = consent.signatures.some(s => 
      s.type === 'patient' || s.type === 'legal_guardian' || s.type === 'healthcare_proxy'
    );
    const hasProviderSig = consent.signatures.some(s => s.type === 'provider');
    
    if (hasPatientSig && hasProviderSig) {
      if (!template?.requiresWitness || consent.signatures.some(s => s.type === 'witness')) {
        consent.status = 'completed';
      }
    }
    
    this.addAuditEntry(consentId, 'SIGNATURE_ADDED', sig.signerName, `${sig.type} signature added`);
    
    return consent;
  },

  /**
   * Withdraw consent
   */
  withdrawConsent(consentId: string, reason: string, withdrawnBy: string): ConsentForm | null {
    const consent = consents.get(consentId);
    if (!consent) return null;
    
    consent.status = 'withdrawn';
    consent.withdrawnAt = new Date();
    consent.withdrawalReason = reason;
    consent.updatedAt = new Date();
    
    this.addAuditEntry(consentId, 'WITHDRAWN', withdrawnBy, `Consent withdrawn: ${reason}`);
    
    return consent;
  },

  /**
   * Check and update expired consents
   */
  checkExpiration(consentId: string): boolean {
    const consent = consents.get(consentId);
    if (!consent || !consent.expirationDate) return false;
    
    if (new Date() > consent.expirationDate && !consent.isExpired) {
      consent.isExpired = true;
      consent.status = 'expired';
      consent.updatedAt = new Date();
      this.addAuditEntry(consentId, 'EXPIRED', 'system', 'Consent expired');
      return true;
    }
    
    return consent.isExpired;
  },

  /**
   * Verify consent is valid for procedure
   */
  verifyConsent(consentId: string): { valid: boolean; reason?: string } {
    const consent = consents.get(consentId);
    if (!consent) {
      return { valid: false, reason: 'Consent not found' };
    }
    
    // Check expiration
    this.checkExpiration(consentId);
    
    if (consent.status === 'expired') {
      return { valid: false, reason: 'Consent has expired' };
    }
    
    if (consent.status === 'withdrawn') {
      return { valid: false, reason: 'Consent has been withdrawn' };
    }
    
    if (consent.status === 'refused') {
      return { valid: false, reason: 'Consent was refused' };
    }
    
    if (consent.status !== 'completed' && consent.status !== 'witnessed') {
      return { valid: false, reason: 'Consent is incomplete - missing required signatures' };
    }
    
    return { valid: true };
  },

  /**
   * Get consent by ID
   */
  getConsent(consentId: string): ConsentForm | null {
    const consent = consents.get(consentId);
    if (consent) {
      this.checkExpiration(consentId);
    }
    return consent || null;
  },

  /**
   * Get consents by patient
   */
  getConsentsByPatient(patientId: string): ConsentForm[] {
    return Array.from(consents.values())
      .filter(c => c.patientId === patientId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  /**
   * Get pending consents
   */
  getPendingConsents(): ConsentForm[] {
    return Array.from(consents.values())
      .filter(c => c.status === 'pending' || c.status === 'signed')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  /**
   * Get expiring consents (within 7 days)
   */
  getExpiringConsents(): ConsentForm[] {
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return Array.from(consents.values())
      .filter(c => 
        c.expirationDate && 
        c.expirationDate <= sevenDaysFromNow && 
        !c.isExpired &&
        c.status !== 'withdrawn'
      )
      .sort((a, b) => (a.expirationDate?.getTime() || 0) - (b.expirationDate?.getTime() || 0));
  },

  /**
   * Get all templates
   */
  getTemplates(): ConsentTemplate[] {
    return Array.from(templates.values()).filter(t => t.isActive);
  },

  /**
   * Get template by type
   */
  getTemplateByType(type: ConsentType): ConsentTemplate | null {
    return Array.from(templates.values()).find(t => t.type === type && t.isActive) || null;
  },

  /**
   * Add audit entry
   */
  addAuditEntry(consentId: string, action: string, performedBy: string, details: string): void {
    auditLog.push({
      id: `AUD-${Date.now()}`,
      consentId,
      action,
      performedBy,
      performedAt: new Date(),
      details,
    });
  },

  /**
   * Get audit trail for consent
   */
  getAuditTrail(consentId: string): ConsentAuditEntry[] {
    return auditLog
      .filter(a => a.consentId === consentId)
      .sort((a, b) => b.performedAt.getTime() - a.performedAt.getTime());
  },

  /**
   * Generate consent document for printing/PDF
   */
  generateDocument(consentId: string): string {
    const consent = consents.get(consentId);
    if (!consent) return '';
    
    const document = `
═══════════════════════════════════════════════════════════════
                    ${consent.title.toUpperCase()}
═══════════════════════════════════════════════════════════════

Form Number: ${consent.formNumber}
Date: ${consent.createdAt.toLocaleDateString()}
Language: ${consent.language}

PATIENT INFORMATION
───────────────────────────────────────────────────────────────
Name: ${consent.patientName}
MRN: ${consent.patientMRN}
Date of Birth: ${consent.patientDOB.toLocaleDateString()}

PROVIDER INFORMATION
───────────────────────────────────────────────────────────────
Provider: ${consent.providerName}
${consent.procedureName ? `Procedure: ${consent.procedureName}` : ''}
${consent.scheduledDate ? `Scheduled Date: ${consent.scheduledDate.toLocaleDateString()}` : ''}

CONSENT
───────────────────────────────────────────────────────────────
${consent.content}

RISKS
───────────────────────────────────────────────────────────────
${consent.risks.map((r, i) => `${i + 1}. ${r}`).join('\n')}

BENEFITS
───────────────────────────────────────────────────────────────
${consent.benefits.map((b, i) => `${i + 1}. ${b}`).join('\n')}

ALTERNATIVES
───────────────────────────────────────────────────────────────
${consent.alternatives.map((a, i) => `${i + 1}. ${a}`).join('\n')}

SIGNATURES
───────────────────────────────────────────────────────────────
${consent.signatures.map(sig => `
${sig.type.replace('_', ' ').toUpperCase()}
Name: ${sig.signerName}
${sig.signerRelationship ? `Relationship: ${sig.signerRelationship}` : ''}
Date/Time: ${sig.signedAt.toLocaleString()}
`).join('\n')}

═══════════════════════════════════════════════════════════════
Status: ${consent.status.toUpperCase()}
${consent.expirationDate ? `Expires: ${consent.expirationDate.toLocaleDateString()}` : ''}
═══════════════════════════════════════════════════════════════
    `.trim();
    
    return document;
  },

  /**
   * Get consent statistics
   */
  getStatistics(): {
    total: number;
    byStatus: Record<ConsentStatus, number>;
    byType: Record<ConsentType, number>;
    pendingCount: number;
    expiringCount: number;
  } {
    const all = Array.from(consents.values());
    const byStatus: Record<string, number> = {};
    const byType: Record<string, number> = {};
    
    for (const consent of all) {
      byStatus[consent.status] = (byStatus[consent.status] || 0) + 1;
      byType[consent.type] = (byType[consent.type] || 0) + 1;
    }
    
    return {
      total: all.length,
      byStatus: byStatus as Record<ConsentStatus, number>,
      byType: byType as Record<ConsentType, number>,
      pendingCount: this.getPendingConsents().length,
      expiringCount: this.getExpiringConsents().length,
    };
  },

  /**
   * Clear all consents (for testing)
   */
  clearAll(): void {
    consents.clear();
    auditLog.length = 0;
    formCounter = 5000;
  },
};

export default ConsentManagementService;
