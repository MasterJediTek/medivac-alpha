/**
 * Clinical Documentation Template Service
 * Structured note templates with disco styling
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// TYPES & INTERFACES
// ============================================

export type TemplateType = 'hp' | 'progress' | 'discharge' | 'procedure' | 'consultation' | 'nursing' | 'custom';
export type DocumentStatus = 'draft' | 'in_progress' | 'pending_signature' | 'signed' | 'amended';

export interface DocumentTemplate {
  id: string;
  name: string;
  type: TemplateType;
  description: string;
  sections: TemplateSection[];
  discoColor: string;
  icon: string;
  estimatedTime: number; // minutes
  requiredFields: string[];
}

export interface TemplateSection {
  id: string;
  title: string;
  type: 'text' | 'checklist' | 'vitals' | 'medications' | 'assessment' | 'plan' | 'signature';
  placeholder?: string;
  options?: string[];
  required: boolean;
  discoGlow: string;
}

export interface ClinicalDocument {
  id: string;
  templateId: string;
  templateName: string;
  patientId: string;
  patientName: string;
  providerId: string;
  providerName: string;
  encounterId: string;
  status: DocumentStatus;
  createdAt: number;
  updatedAt: number;
  signedAt?: number;
  signedBy?: string;
  content: Record<string, string | string[] | object>;
  autoSaveEnabled: boolean;
  lastAutoSave?: number;
  amendments: Amendment[];
}

export interface Amendment {
  id: string;
  timestamp: number;
  author: string;
  reason: string;
  changes: string;
}

export interface SmartPhrase {
  id: string;
  shortcut: string;
  expansion: string;
  category: string;
  createdBy: string;
  isGlobal: boolean;
}

export interface DictationSession {
  id: string;
  documentId: string;
  sectionId: string;
  startedAt: number;
  endedAt?: number;
  transcript: string;
  status: 'recording' | 'processing' | 'completed' | 'error';
  confidence: number;
}

// ============================================
// STORAGE & STATE
// ============================================

const STORAGE_KEYS = {
  DOCUMENTS: 'clinical_documents',
  SMART_PHRASES: 'smart_phrases',
};

let templates: Map<string, DocumentTemplate> = new Map();
let documents: Map<string, ClinicalDocument> = new Map();
let smartPhrases: Map<string, SmartPhrase> = new Map();
let listeners: Set<() => void> = new Set();

const generateId = (): string => `DOC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
const notifyListeners = (): void => listeners.forEach(l => l());

// ============================================
// DISCO COLORS FOR TEMPLATES
// ============================================

const TEMPLATE_COLORS = {
  hp: '#FF1493',
  progress: '#00FFFF',
  discharge: '#BF00FF',
  procedure: '#39FF14',
  consultation: '#FF6600',
  nursing: '#FFFF00',
  custom: '#4D4DFF',
};

// ============================================
// TEMPLATE DEFINITIONS
// ============================================

const initializeTemplates = (): void => {
  const templateDefs: DocumentTemplate[] = [
    {
      id: 'TPL-HP',
      name: 'History & Physical',
      type: 'hp',
      description: 'Comprehensive admission H&P with disco flair',
      icon: '📋',
      discoColor: TEMPLATE_COLORS.hp,
      estimatedTime: 30,
      requiredFields: ['chief_complaint', 'hpi', 'assessment', 'plan'],
      sections: [
        { id: 'chief_complaint', title: '🎤 Chief Complaint', type: 'text', placeholder: 'Why is the patient here today?', required: true, discoGlow: '#FF1493' },
        { id: 'hpi', title: '📖 History of Present Illness', type: 'text', placeholder: 'Detailed narrative of the current illness...', required: true, discoGlow: '#FF69B4' },
        { id: 'pmh', title: '📚 Past Medical History', type: 'checklist', options: ['Diabetes', 'Hypertension', 'CAD', 'COPD', 'CHF', 'CKD', 'Cancer', 'None'], required: false, discoGlow: '#00FFFF' },
        { id: 'medications', title: '💊 Current Medications', type: 'medications', required: false, discoGlow: '#BF00FF' },
        { id: 'allergies', title: '⚠️ Allergies', type: 'text', placeholder: 'List all known allergies...', required: true, discoGlow: '#FF073A' },
        { id: 'social_history', title: '🎭 Social History', type: 'text', placeholder: 'Tobacco, alcohol, drugs, occupation...', required: false, discoGlow: '#39FF14' },
        { id: 'family_history', title: '👨‍👩‍👧‍👦 Family History', type: 'text', placeholder: 'Relevant family medical history...', required: false, discoGlow: '#FFFF00' },
        { id: 'ros', title: '🔍 Review of Systems', type: 'checklist', options: ['Constitutional', 'HEENT', 'Cardiovascular', 'Respiratory', 'GI', 'GU', 'MSK', 'Neuro', 'Psych', 'Skin'], required: false, discoGlow: '#4D4DFF' },
        { id: 'physical_exam', title: '🩺 Physical Examination', type: 'text', placeholder: 'Detailed physical exam findings...', required: true, discoGlow: '#FF6600' },
        { id: 'vitals', title: '📊 Vital Signs', type: 'vitals', required: true, discoGlow: '#00FFFF' },
        { id: 'assessment', title: '🎯 Assessment', type: 'assessment', placeholder: 'Clinical assessment and diagnoses...', required: true, discoGlow: '#FF1493' },
        { id: 'plan', title: '📝 Plan', type: 'plan', placeholder: 'Treatment plan and next steps...', required: true, discoGlow: '#BF00FF' },
        { id: 'signature', title: '✍️ Signature', type: 'signature', required: true, discoGlow: '#FFD700' },
      ],
    },
    {
      id: 'TPL-PROGRESS',
      name: 'Progress Note',
      type: 'progress',
      description: 'Daily progress note with SOAP format',
      icon: '📝',
      discoColor: TEMPLATE_COLORS.progress,
      estimatedTime: 15,
      requiredFields: ['subjective', 'objective', 'assessment', 'plan'],
      sections: [
        { id: 'subjective', title: '🗣️ Subjective', type: 'text', placeholder: 'Patient reports...', required: true, discoGlow: '#00FFFF' },
        { id: 'objective', title: '🔬 Objective', type: 'text', placeholder: 'Exam findings, vitals, labs...', required: true, discoGlow: '#39FF14' },
        { id: 'vitals', title: '📊 Vital Signs', type: 'vitals', required: true, discoGlow: '#FF6600' },
        { id: 'assessment', title: '🎯 Assessment', type: 'assessment', placeholder: 'Clinical impression...', required: true, discoGlow: '#FF1493' },
        { id: 'plan', title: '📝 Plan', type: 'plan', placeholder: 'Today\'s plan...', required: true, discoGlow: '#BF00FF' },
        { id: 'signature', title: '✍️ Signature', type: 'signature', required: true, discoGlow: '#FFD700' },
      ],
    },
    {
      id: 'TPL-DISCHARGE',
      name: 'Discharge Summary',
      type: 'discharge',
      description: 'Comprehensive discharge documentation',
      icon: '🏠',
      discoColor: TEMPLATE_COLORS.discharge,
      estimatedTime: 25,
      requiredFields: ['admission_diagnosis', 'discharge_diagnosis', 'hospital_course', 'discharge_medications', 'follow_up'],
      sections: [
        { id: 'admission_diagnosis', title: '🏥 Admission Diagnosis', type: 'text', placeholder: 'Primary admission diagnosis...', required: true, discoGlow: '#BF00FF' },
        { id: 'discharge_diagnosis', title: '🎯 Discharge Diagnosis', type: 'text', placeholder: 'Final diagnoses at discharge...', required: true, discoGlow: '#FF1493' },
        { id: 'hospital_course', title: '📖 Hospital Course', type: 'text', placeholder: 'Summary of hospitalization...', required: true, discoGlow: '#00FFFF' },
        { id: 'procedures', title: '🔧 Procedures Performed', type: 'text', placeholder: 'List all procedures...', required: false, discoGlow: '#39FF14' },
        { id: 'discharge_medications', title: '💊 Discharge Medications', type: 'medications', required: true, discoGlow: '#FF6600' },
        { id: 'discharge_instructions', title: '📋 Discharge Instructions', type: 'text', placeholder: 'Activity, diet, wound care...', required: true, discoGlow: '#FFFF00' },
        { id: 'follow_up', title: '📅 Follow-Up Appointments', type: 'text', placeholder: 'Scheduled follow-up visits...', required: true, discoGlow: '#4D4DFF' },
        { id: 'signature', title: '✍️ Signature', type: 'signature', required: true, discoGlow: '#FFD700' },
      ],
    },
    {
      id: 'TPL-PROCEDURE',
      name: 'Procedure Note',
      type: 'procedure',
      description: 'Detailed procedure documentation',
      icon: '🔧',
      discoColor: TEMPLATE_COLORS.procedure,
      estimatedTime: 20,
      requiredFields: ['procedure_name', 'indication', 'technique', 'findings', 'complications'],
      sections: [
        { id: 'procedure_name', title: '🔧 Procedure', type: 'text', placeholder: 'Name of procedure...', required: true, discoGlow: '#39FF14' },
        { id: 'indication', title: '📋 Indication', type: 'text', placeholder: 'Reason for procedure...', required: true, discoGlow: '#00FFFF' },
        { id: 'consent', title: '✅ Consent', type: 'text', placeholder: 'Consent obtained from...', required: true, discoGlow: '#FF1493' },
        { id: 'anesthesia', title: '💉 Anesthesia', type: 'text', placeholder: 'Type of anesthesia used...', required: false, discoGlow: '#BF00FF' },
        { id: 'technique', title: '📝 Technique', type: 'text', placeholder: 'Step-by-step description...', required: true, discoGlow: '#FF6600' },
        { id: 'findings', title: '🔍 Findings', type: 'text', placeholder: 'Intraoperative findings...', required: true, discoGlow: '#FFFF00' },
        { id: 'specimens', title: '🧪 Specimens', type: 'text', placeholder: 'Specimens sent to pathology...', required: false, discoGlow: '#4D4DFF' },
        { id: 'complications', title: '⚠️ Complications', type: 'text', placeholder: 'None / List complications...', required: true, discoGlow: '#FF073A' },
        { id: 'ebl', title: '🩸 Estimated Blood Loss', type: 'text', placeholder: 'EBL in mL...', required: false, discoGlow: '#FF1493' },
        { id: 'disposition', title: '🏥 Disposition', type: 'text', placeholder: 'Patient tolerated procedure well...', required: true, discoGlow: '#00FFFF' },
        { id: 'signature', title: '✍️ Signature', type: 'signature', required: true, discoGlow: '#FFD700' },
      ],
    },
    {
      id: 'TPL-CONSULT',
      name: 'Consultation Note',
      type: 'consultation',
      description: 'Specialty consultation documentation',
      icon: '🤝',
      discoColor: TEMPLATE_COLORS.consultation,
      estimatedTime: 25,
      requiredFields: ['reason_for_consult', 'hpi', 'assessment', 'recommendations'],
      sections: [
        { id: 'reason_for_consult', title: '❓ Reason for Consultation', type: 'text', placeholder: 'Consulting for...', required: true, discoGlow: '#FF6600' },
        { id: 'hpi', title: '📖 History of Present Illness', type: 'text', placeholder: 'Detailed history...', required: true, discoGlow: '#FF1493' },
        { id: 'relevant_history', title: '📚 Relevant History', type: 'text', placeholder: 'Pertinent past history...', required: false, discoGlow: '#00FFFF' },
        { id: 'physical_exam', title: '🩺 Physical Examination', type: 'text', placeholder: 'Focused exam findings...', required: true, discoGlow: '#BF00FF' },
        { id: 'data_review', title: '📊 Data Review', type: 'text', placeholder: 'Labs, imaging, studies reviewed...', required: false, discoGlow: '#39FF14' },
        { id: 'assessment', title: '🎯 Assessment', type: 'assessment', placeholder: 'Clinical impression...', required: true, discoGlow: '#FFFF00' },
        { id: 'recommendations', title: '💡 Recommendations', type: 'plan', placeholder: 'Consultant recommendations...', required: true, discoGlow: '#4D4DFF' },
        { id: 'signature', title: '✍️ Signature', type: 'signature', required: true, discoGlow: '#FFD700' },
      ],
    },
  ];

  templateDefs.forEach(t => templates.set(t.id, t));

  // Initialize smart phrases
  const defaultPhrases: SmartPhrase[] = [
    { id: 'SP-001', shortcut: '.nka', expansion: 'No known allergies', category: 'allergies', createdBy: 'system', isGlobal: true },
    { id: 'SP-002', shortcut: '.nkda', expansion: 'No known drug allergies', category: 'allergies', createdBy: 'system', isGlobal: true },
    { id: 'SP-003', shortcut: '.aox3', expansion: 'Alert and oriented to person, place, and time', category: 'neuro', createdBy: 'system', isGlobal: true },
    { id: 'SP-004', shortcut: '.wnl', expansion: 'Within normal limits', category: 'general', createdBy: 'system', isGlobal: true },
    { id: 'SP-005', shortcut: '.nad', expansion: 'No acute distress', category: 'general', createdBy: 'system', isGlobal: true },
    { id: 'SP-006', shortcut: '.ctab', expansion: 'Clear to auscultation bilaterally', category: 'pulm', createdBy: 'system', isGlobal: true },
    { id: 'SP-007', shortcut: '.rrr', expansion: 'Regular rate and rhythm', category: 'cardiac', createdBy: 'system', isGlobal: true },
    { id: 'SP-008', shortcut: '.ntnd', expansion: 'Non-tender, non-distended', category: 'gi', createdBy: 'system', isGlobal: true },
    { id: 'SP-009', shortcut: '.disco', expansion: '🪩 Patient is grooving and feeling funky fresh! 🕺', category: 'disco', createdBy: 'system', isGlobal: true },
  ];
  defaultPhrases.forEach(p => smartPhrases.set(p.id, p));
};

// ============================================
// PUBLIC API
// ============================================

export const initializeDocumentationService = async (): Promise<void> => {
  try {
    const storedDocs = await AsyncStorage.getItem(STORAGE_KEYS.DOCUMENTS);
    if (storedDocs) {
      documents = new Map(Object.entries(JSON.parse(storedDocs)));
    }
    initializeTemplates();
  } catch (error) {
    console.error('Failed to initialize documentation service:', error);
    initializeTemplates();
  }
};

const saveState = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.DOCUMENTS,
      JSON.stringify(Object.fromEntries(documents))
    );
  } catch (error) {
    console.error('Failed to save documentation state:', error);
  }
};

export const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/**
 * Get all templates
 */
export const getTemplates = (): DocumentTemplate[] => {
  return Array.from(templates.values());
};

/**
 * Get template by ID
 */
export const getTemplate = (templateId: string): DocumentTemplate | undefined => {
  return templates.get(templateId);
};

/**
 * Create new document from template
 */
export const createDocument = async (
  templateId: string,
  patientId: string,
  patientName: string,
  providerId: string,
  providerName: string,
  encounterId: string
): Promise<ClinicalDocument> => {
  const template = templates.get(templateId);
  if (!template) throw new Error('Template not found');

  const document: ClinicalDocument = {
    id: generateId(),
    templateId,
    templateName: template.name,
    patientId,
    patientName,
    providerId,
    providerName,
    encounterId,
    status: 'draft',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    content: {},
    autoSaveEnabled: true,
    amendments: [],
  };

  documents.set(document.id, document);
  await saveState();
  notifyListeners();
  return document;
};

/**
 * Update document content
 */
export const updateDocumentContent = async (
  documentId: string,
  sectionId: string,
  content: string | string[] | object
): Promise<void> => {
  const document = documents.get(documentId);
  if (!document) return;

  document.content[sectionId] = content;
  document.updatedAt = Date.now();
  document.lastAutoSave = Date.now();

  documents.set(documentId, document);
  await saveState();
  notifyListeners();
};

/**
 * Update document status
 */
export const updateDocumentStatus = async (
  documentId: string,
  status: DocumentStatus
): Promise<void> => {
  const document = documents.get(documentId);
  if (!document) return;

  document.status = status;
  document.updatedAt = Date.now();

  if (status === 'signed') {
    document.signedAt = Date.now();
    document.signedBy = document.providerName;
  }

  documents.set(documentId, document);
  await saveState();
  notifyListeners();
};

/**
 * Sign document
 */
export const signDocument = async (documentId: string): Promise<boolean> => {
  const document = documents.get(documentId);
  if (!document) return false;

  const template = templates.get(document.templateId);
  if (!template) return false;

  // Check required fields
  const missingFields = template.requiredFields.filter(
    field => !document.content[field] || 
    (typeof document.content[field] === 'string' && (document.content[field] as string).trim() === '')
  );

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }

  document.status = 'signed';
  document.signedAt = Date.now();
  document.signedBy = document.providerName;
  document.updatedAt = Date.now();

  documents.set(documentId, document);
  await saveState();
  notifyListeners();
  return true;
};

/**
 * Amend document
 */
export const amendDocument = async (
  documentId: string,
  reason: string,
  changes: string
): Promise<void> => {
  const document = documents.get(documentId);
  if (!document || document.status !== 'signed') return;

  const amendment: Amendment = {
    id: generateId(),
    timestamp: Date.now(),
    author: document.providerName,
    reason,
    changes,
  };

  document.amendments.push(amendment);
  document.status = 'amended';
  document.updatedAt = Date.now();

  documents.set(documentId, document);
  await saveState();
  notifyListeners();
};

/**
 * Get documents for patient
 */
export const getPatientDocuments = (patientId: string): ClinicalDocument[] => {
  return Array.from(documents.values())
    .filter(d => d.patientId === patientId)
    .sort((a, b) => b.createdAt - a.createdAt);
};

/**
 * Get documents by status
 */
export const getDocumentsByStatus = (status: DocumentStatus): ClinicalDocument[] => {
  return Array.from(documents.values())
    .filter(d => d.status === status)
    .sort((a, b) => b.updatedAt - a.updatedAt);
};

/**
 * Get all documents
 */
export const getAllDocuments = (): ClinicalDocument[] => {
  return Array.from(documents.values())
    .sort((a, b) => b.updatedAt - a.updatedAt);
};

/**
 * Get document by ID
 */
export const getDocument = (documentId: string): ClinicalDocument | undefined => {
  return documents.get(documentId);
};

/**
 * Delete document (draft only)
 */
export const deleteDocument = async (documentId: string): Promise<boolean> => {
  const document = documents.get(documentId);
  if (!document || document.status !== 'draft') return false;

  documents.delete(documentId);
  await saveState();
  notifyListeners();
  return true;
};

/**
 * Get smart phrases
 */
export const getSmartPhrases = (): SmartPhrase[] => {
  return Array.from(smartPhrases.values());
};

/**
 * Expand smart phrase
 */
export const expandSmartPhrase = (text: string): string => {
  let expanded = text;
  smartPhrases.forEach(phrase => {
    expanded = expanded.replace(new RegExp(phrase.shortcut.replace('.', '\\.'), 'g'), phrase.expansion);
  });
  return expanded;
};

/**
 * Add custom smart phrase
 */
export const addSmartPhrase = async (
  shortcut: string,
  expansion: string,
  category: string,
  createdBy: string
): Promise<SmartPhrase> => {
  const phrase: SmartPhrase = {
    id: generateId(),
    shortcut: shortcut.startsWith('.') ? shortcut : `.${shortcut}`,
    expansion,
    category,
    createdBy,
    isGlobal: false,
  };

  smartPhrases.set(phrase.id, phrase);
  notifyListeners();
  return phrase;
};

/**
 * Get template color
 */
export const getTemplateColor = (type: TemplateType): string => {
  return TEMPLATE_COLORS[type] || TEMPLATE_COLORS.custom;
};

/**
 * Get document completion percentage
 */
export const getDocumentCompletion = (documentId: string): number => {
  const document = documents.get(documentId);
  if (!document) return 0;

  const template = templates.get(document.templateId);
  if (!template) return 0;

  const totalSections = template.sections.length;
  const completedSections = template.sections.filter(section => {
    const content = document.content[section.id];
    if (!content) return false;
    if (typeof content === 'string') return content.trim().length > 0;
    if (Array.isArray(content)) return content.length > 0;
    return Object.keys(content).length > 0;
  }).length;

  return Math.round((completedSections / totalSections) * 100);
};

export const clinicalDocumentationService = {
  initialize: initializeDocumentationService,
  subscribe,
  getTemplates,
  getTemplate,
  createDocument,
  updateDocumentContent,
  updateDocumentStatus,
  signDocument,
  amendDocument,
  getPatientDocuments,
  getDocumentsByStatus,
  getAllDocuments,
  getDocument,
  deleteDocument,
  getSmartPhrases,
  expandSmartPhrase,
  addSmartPhrase,
  getTemplateColor,
  getDocumentCompletion,
};

export default clinicalDocumentationService;
