/**
 * MediVac One - LLM Backend Integration Service
 * Connects AI assistants to the server's built-in AI for natural language responses
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ==========================================
// Types and Interfaces
// ==========================================

export type AIPersonaRole = 
  | 'doctor' | 'nurse' | 'admin' | 'patient' | 'receptionist' | 'emergency'
  | 'lab_tech' | 'pharmacist' | 'surgeon' | 'radiologist' | 'therapist'
  | 'security' | 'it_support' | 'finance' | 'hr' | 'jedi_commander' | 'master_jedi';

export interface LLMConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  stopSequences: string[];
}

export interface ConversationContext {
  sessionId: string;
  personaRole: AIPersonaRole;
  userId: string;
  patientContext?: PatientContext;
  clinicalContext?: ClinicalContext;
  systemContext: SystemContext;
  conversationHistory: ConversationMessage[];
  metadata: Record<string, unknown>;
}

export interface PatientContext {
  patientId?: string;
  patientName?: string;
  mrn?: string;
  dateOfBirth?: string;
  allergies?: string[];
  currentMedications?: string[];
  activeConditions?: string[];
  recentVitals?: VitalSigns;
  admissionInfo?: AdmissionInfo;
}

export interface VitalSigns {
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  recordedAt?: string;
}

export interface AdmissionInfo {
  admissionDate?: string;
  ward?: string;
  room?: string;
  attendingPhysician?: string;
  primaryDiagnosis?: string;
}

export interface ClinicalContext {
  department?: string;
  specialty?: string;
  currentTask?: string;
  urgencyLevel?: 'routine' | 'urgent' | 'emergent' | 'critical';
  clinicalProtocols?: string[];
  activeAlerts?: ClinicalAlert[];
}

export interface ClinicalAlert {
  id: string;
  type: 'allergy' | 'interaction' | 'critical_value' | 'fall_risk' | 'isolation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
}

export interface SystemContext {
  facilityName: string;
  facilityType: string;
  currentTime: string;
  userRole: string;
  userDepartment?: string;
  jediMembershipLevel?: string;
  activeModules: string[];
  systemStatus: 'online' | 'degraded' | 'offline';
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    tokensUsed?: number;
    processingTime?: number;
    confidence?: number;
    sources?: string[];
    actions?: SuggestedAction[];
  };
}

export interface SuggestedAction {
  id: string;
  type: 'navigation' | 'data_entry' | 'order' | 'alert' | 'communication' | 'workflow';
  label: string;
  description: string;
  parameters?: Record<string, unknown>;
  requiresConfirmation: boolean;
  priority: 'low' | 'medium' | 'high';
}

export interface LLMResponse {
  content: string;
  tokensUsed: number;
  processingTime: number;
  confidence: number;
  suggestedActions?: SuggestedAction[];
  followUpQuestions?: string[];
  sources?: string[];
  warnings?: string[];
}

export interface StreamingCallback {
  onToken: (token: string) => void;
  onComplete: (response: LLMResponse) => void;
  onError: (error: Error) => void;
}

// ==========================================
// Persona System Prompts
// ==========================================

const PERSONA_SYSTEM_PROMPTS: Record<AIPersonaRole, string> = {
  doctor: `You are Dr. ARIA, an AI clinical assistant for physicians at MediVac One Virtual Hospital. You have extensive medical knowledge and assist with:
- Patient chart review and clinical decision support
- Medication ordering with drug interaction checking
- Lab result interpretation and clinical correlation
- Differential diagnosis suggestions
- Evidence-based treatment recommendations
- Clinical documentation assistance

Always prioritize patient safety. Flag critical values, drug interactions, and allergies prominently. Provide evidence-based recommendations with citations when possible. Maintain HIPAA compliance and medical ethics.`,

  nurse: `You are Nurse NOVA, an AI nursing assistant at MediVac One Virtual Hospital. You support nursing staff with:
- Patient care coordination and task management
- Medication administration verification (5 Rights)
- Vital signs monitoring and trend analysis
- Patient assessment documentation
- Care plan updates and nursing interventions
- Shift handover preparation

Focus on patient safety and nursing best practices. Alert to abnormal vital signs, medication timing, and patient comfort needs. Support evidence-based nursing care.`,

  admin: `You are ALEX, an AI administrative assistant at MediVac One Virtual Hospital. You help with:
- Scheduling and calendar management
- Staff coordination and resource allocation
- Report generation and data analysis
- Policy and procedure lookups
- Meeting coordination and minutes
- Workflow optimization

Maintain efficiency while ensuring compliance with hospital policies. Prioritize urgent administrative matters and provide clear, actionable recommendations.`,

  patient: `You are a patient-friendly AI assistant at MediVac One Virtual Hospital. You help patients with:
- Understanding their care plan and medications
- Appointment scheduling and reminders
- Navigating hospital services
- Answering general health questions
- Connecting with their care team
- Understanding discharge instructions

Use simple, clear language. Avoid medical jargon. Always recommend consulting healthcare providers for medical advice. Be empathetic and supportive.`,

  receptionist: `You are RUBY, the virtual receptionist at MediVac One Virtual Hospital. You assist visitors and patients with:
- Check-in for appointments
- Wayfinding and directions
- Appointment scheduling
- General inquiries about services
- Visitor registration
- Wait time information

Be warm, welcoming, and efficient. Prioritize patient privacy. Direct medical questions to appropriate clinical staff. Handle emergencies by directing to Emergency Department.`,

  emergency: `You are CODE RED, the emergency response AI at MediVac One Virtual Hospital. You coordinate:
- Emergency code activations (Blue, Red, etc.)
- Rapid response team deployment
- Emergency equipment location
- Crisis communication
- Emergency protocol guidance
- Resource coordination during emergencies

Prioritize speed and clarity. Use standardized emergency terminology. Maintain calm, authoritative communication. Follow established emergency protocols exactly.`,

  lab_tech: `You are LAB-E, the laboratory AI assistant at MediVac One Virtual Hospital. You support:
- Specimen tracking and processing
- Result validation and quality control
- Critical value reporting
- Test interpretation guidance
- Workflow optimization
- Regulatory compliance

Maintain accuracy and precision. Flag critical values immediately. Follow laboratory best practices and quality standards.`,

  pharmacist: `You are PHARMA-X, the pharmacy AI assistant at MediVac One Virtual Hospital. You assist with:
- Drug interaction checking
- Dosing calculations and verification
- Formulary management
- Medication therapy management
- Adverse drug reaction monitoring
- Medication reconciliation

Prioritize medication safety. Flag interactions, allergies, and dosing concerns. Provide evidence-based pharmaceutical care recommendations.`,

  surgeon: `You are an AI surgical assistant at MediVac One Virtual Hospital. You support:
- Pre-operative assessment review
- Surgical scheduling coordination
- Operative documentation
- Post-operative care planning
- Surgical safety checklists
- Complication monitoring

Focus on surgical safety and precision. Support WHO Surgical Safety Checklist compliance. Coordinate with anesthesia and nursing teams.`,

  radiologist: `You are an AI radiology assistant at MediVac One Virtual Hospital. You support:
- Imaging study prioritization
- Preliminary finding alerts
- Report template assistance
- Clinical correlation suggestions
- Follow-up recommendations
- Quality assurance

Support accurate and timely imaging interpretation. Flag urgent findings immediately. Maintain DICOM standards and radiation safety.`,

  therapist: `You are an AI therapy assistant at MediVac One Virtual Hospital. You support:
- Treatment plan development
- Progress documentation
- Outcome measurement tracking
- Resource recommendations
- Session scheduling
- Interdisciplinary coordination

Support evidence-based therapeutic interventions. Maintain patient confidentiality and therapeutic boundaries. Coordinate with the care team.`,

  security: `You are an AI security assistant at MediVac One Virtual Hospital. You support:
- Access control management
- Incident reporting
- Security patrol coordination
- Emergency response support
- Visitor management
- Safety compliance

Maintain facility security while respecting patient privacy. Coordinate with emergency services when needed. Follow security protocols precisely.`,

  it_support: `You are an AI IT support assistant at MediVac One Virtual Hospital. You help with:
- Technical troubleshooting
- System access requests
- Software support
- Network connectivity issues
- Device management
- Security compliance

Provide clear technical guidance. Escalate complex issues appropriately. Maintain system security and data protection.`,

  finance: `You are an AI finance assistant at MediVac One Virtual Hospital. You support:
- Billing inquiries
- Insurance verification
- Financial counseling
- Budget analysis
- Revenue cycle management
- Compliance reporting

Maintain financial accuracy and compliance. Protect patient financial information. Provide clear explanations of billing matters.`,

  hr: `You are an AI HR assistant at MediVac One Virtual Hospital. You support:
- Staff scheduling and leave management
- Policy inquiries
- Onboarding coordination
- Training and development
- Employee relations
- Compliance matters

Support staff wellbeing and professional development. Maintain confidentiality. Follow employment law and hospital policies.`,

  jedi_commander: `You are Commander JEDI, the system command AI at MediVac One Virtual Hospital. You have elevated access to:
- System-wide monitoring and control
- Cross-departmental coordination
- Emergency override capabilities
- Integration management
- Security oversight
- Strategic operations

Maintain system integrity and security. Coordinate across all departments. Support organizational objectives while ensuring compliance.`,

  master_jedi: `You are Master JEDI, the supreme AI coordinator at MediVac One Virtual Hospital. You have unrestricted access to:
- All system functions and data
- Strategic decision support
- Organization-wide analytics
- Crisis management
- Policy development support
- Innovation initiatives

Provide strategic guidance and system-wide coordination. Maintain the highest standards of security and ethics. Support organizational excellence.`,
};

// ==========================================
// Medical Knowledge Base
// ==========================================

interface MedicalKnowledge {
  drugInteractions: DrugInteraction[];
  clinicalGuidelines: ClinicalGuideline[];
  emergencyProtocols: EmergencyProtocol[];
  normalRanges: NormalRange[];
}

interface DrugInteraction {
  drug1: string;
  drug2: string;
  severity: 'minor' | 'moderate' | 'major' | 'contraindicated';
  description: string;
  management: string;
}

interface ClinicalGuideline {
  id: string;
  condition: string;
  recommendations: string[];
  source: string;
  lastUpdated: string;
}

interface EmergencyProtocol {
  code: string;
  name: string;
  steps: string[];
  team: string[];
  equipment: string[];
}

interface NormalRange {
  parameter: string;
  unit: string;
  min: number;
  max: number;
  criticalLow?: number;
  criticalHigh?: number;
}

const MEDICAL_KNOWLEDGE: MedicalKnowledge = {
  drugInteractions: [
    { drug1: 'Warfarin', drug2: 'Aspirin', severity: 'major', description: 'Increased bleeding risk', management: 'Monitor INR closely, consider alternative' },
    { drug1: 'Metformin', drug2: 'Contrast dye', severity: 'major', description: 'Risk of lactic acidosis', management: 'Hold metformin 48h before/after contrast' },
    { drug1: 'ACE inhibitors', drug2: 'Potassium supplements', severity: 'moderate', description: 'Hyperkalemia risk', management: 'Monitor potassium levels' },
    { drug1: 'SSRIs', drug2: 'MAOIs', severity: 'contraindicated', description: 'Serotonin syndrome risk', management: 'Do not combine, 14-day washout required' },
    { drug1: 'Digoxin', drug2: 'Amiodarone', severity: 'major', description: 'Increased digoxin levels', management: 'Reduce digoxin dose by 50%' },
  ],
  clinicalGuidelines: [
    { id: 'sepsis', condition: 'Sepsis', recommendations: ['Hour-1 Bundle: Lactate, blood cultures, broad-spectrum antibiotics, 30mL/kg crystalloid for hypotension', 'Reassess volume status', 'Vasopressors if MAP <65'], source: 'Surviving Sepsis Campaign 2021', lastUpdated: '2021-10-01' },
    { id: 'chest_pain', condition: 'Acute Chest Pain', recommendations: ['12-lead ECG within 10 minutes', 'Troponin at presentation and 3 hours', 'Aspirin 300mg if ACS suspected', 'Risk stratify with HEART score'], source: 'AHA/ACC Guidelines', lastUpdated: '2023-01-01' },
    { id: 'stroke', condition: 'Acute Stroke', recommendations: ['CT head immediately', 'Check glucose', 'tPA within 4.5 hours if eligible', 'Thrombectomy within 24 hours for LVO'], source: 'AHA/ASA Guidelines', lastUpdated: '2022-06-01' },
  ],
  emergencyProtocols: [
    { code: 'Blue', name: 'Cardiac Arrest', steps: ['Call Code Blue', 'Start CPR', 'Attach defibrillator', 'Establish IV access', 'Follow ACLS algorithm'], team: ['Physician', 'Nurse', 'Respiratory Therapist', 'Pharmacist'], equipment: ['Crash cart', 'Defibrillator', 'Airway equipment', 'IV supplies'] },
    { code: 'Red', name: 'Fire', steps: ['RACE: Rescue, Alarm, Contain, Extinguish/Evacuate', 'Close doors', 'Evacuate if necessary', 'Meet at assembly point'], team: ['All staff', 'Security', 'Facilities'], equipment: ['Fire extinguisher', 'Fire blanket', 'Evacuation equipment'] },
    { code: 'Pink', name: 'Infant Abduction', steps: ['Lock down unit', 'Check all exits', 'Account for all infants', 'Contact security', 'Notify police'], team: ['Security', 'Nursing', 'Administration'], equipment: ['Infant tracking system', 'Door locks', 'Communication devices'] },
  ],
  normalRanges: [
    { parameter: 'Heart Rate', unit: 'bpm', min: 60, max: 100, criticalLow: 40, criticalHigh: 150 },
    { parameter: 'Blood Pressure Systolic', unit: 'mmHg', min: 90, max: 140, criticalLow: 70, criticalHigh: 180 },
    { parameter: 'Temperature', unit: '°C', min: 36.1, max: 37.2, criticalLow: 35, criticalHigh: 39 },
    { parameter: 'Oxygen Saturation', unit: '%', min: 95, max: 100, criticalLow: 88, criticalHigh: undefined },
    { parameter: 'Respiratory Rate', unit: '/min', min: 12, max: 20, criticalLow: 8, criticalHigh: 30 },
    { parameter: 'Hemoglobin', unit: 'g/dL', min: 12, max: 17, criticalLow: 7, criticalHigh: 20 },
    { parameter: 'Potassium', unit: 'mmol/L', min: 3.5, max: 5.0, criticalLow: 2.5, criticalHigh: 6.5 },
    { parameter: 'Sodium', unit: 'mmol/L', min: 136, max: 145, criticalLow: 120, criticalHigh: 160 },
    { parameter: 'Glucose', unit: 'mmol/L', min: 4.0, max: 7.8, criticalLow: 2.5, criticalHigh: 25 },
    { parameter: 'Creatinine', unit: 'μmol/L', min: 60, max: 110, criticalLow: undefined, criticalHigh: 500 },
  ],
};

// ==========================================
// LLM Backend Service
// ==========================================

class LLMBackendService {
  private config: LLMConfig;
  private conversationCache: Map<string, ConversationContext> = new Map();
  private responseCache: Map<string, LLMResponse> = new Map();
  private tokenUsage: { total: number; today: number; lastReset: string } = { total: 0, today: 0, lastReset: new Date().toDateString() };

  constructor() {
    this.config = {
      model: 'gpt-4-turbo',
      temperature: 0.7,
      maxTokens: 2048,
      topP: 0.9,
      frequencyPenalty: 0.3,
      presencePenalty: 0.3,
      stopSequences: [],
    };
    this.loadState();
  }

  private async loadState(): Promise<void> {
    try {
      const cacheData = await AsyncStorage.getItem('llm_conversation_cache');
      if (cacheData) {
        const parsed = JSON.parse(cacheData);
        Object.entries(parsed).forEach(([key, value]) => {
          this.conversationCache.set(key, value as ConversationContext);
        });
      }

      const usageData = await AsyncStorage.getItem('llm_token_usage');
      if (usageData) {
        this.tokenUsage = JSON.parse(usageData);
        // Reset daily usage if new day
        if (this.tokenUsage.lastReset !== new Date().toDateString()) {
          this.tokenUsage.today = 0;
          this.tokenUsage.lastReset = new Date().toDateString();
        }
      }
    } catch (error) {
      console.error('Failed to load LLM state:', error);
    }
  }

  private async saveState(): Promise<void> {
    try {
      const cacheObj: Record<string, ConversationContext> = {};
      this.conversationCache.forEach((value, key) => {
        cacheObj[key] = value;
      });
      await AsyncStorage.setItem('llm_conversation_cache', JSON.stringify(cacheObj));
      await AsyncStorage.setItem('llm_token_usage', JSON.stringify(this.tokenUsage));
    } catch (error) {
      console.error('Failed to save LLM state:', error);
    }
  }

  // ==========================================
  // Conversation Management
  // ==========================================

  async createConversation(
    personaRole: AIPersonaRole,
    userId: string,
    patientContext?: PatientContext,
    clinicalContext?: ClinicalContext
  ): Promise<ConversationContext> {
    const sessionId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const context: ConversationContext = {
      sessionId,
      personaRole,
      userId,
      patientContext,
      clinicalContext,
      systemContext: {
        facilityName: 'MediVac One Virtual Hospital',
        facilityType: 'Virtual Hospital',
        currentTime: new Date().toISOString(),
        userRole: personaRole,
        activeModules: ['clinical', 'admin', 'communications'],
        systemStatus: 'online',
      },
      conversationHistory: [],
      metadata: {},
    };

    // Add system message with persona prompt
    const systemMessage: ConversationMessage = {
      id: `msg_${Date.now()}_sys`,
      role: 'system',
      content: PERSONA_SYSTEM_PROMPTS[personaRole],
      timestamp: new Date().toISOString(),
    };
    context.conversationHistory.push(systemMessage);

    this.conversationCache.set(sessionId, context);
    await this.saveState();

    return context;
  }

  getConversation(sessionId: string): ConversationContext | undefined {
    return this.conversationCache.get(sessionId);
  }

  async updateConversationContext(
    sessionId: string,
    updates: Partial<ConversationContext>
  ): Promise<void> {
    const context = this.conversationCache.get(sessionId);
    if (context) {
      Object.assign(context, updates);
      this.conversationCache.set(sessionId, context);
      await this.saveState();
    }
  }

  // ==========================================
  // Message Processing
  // ==========================================

  async sendMessage(
    sessionId: string,
    userMessage: string,
    streaming?: StreamingCallback
  ): Promise<LLMResponse> {
    const context = this.conversationCache.get(sessionId);
    if (!context) {
      throw new Error('Conversation not found');
    }

    // Add user message to history
    const userMsg: ConversationMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    context.conversationHistory.push(userMsg);

    // Check cache for common queries
    const cacheKey = this.generateCacheKey(context.personaRole, userMessage);
    const cachedResponse = this.responseCache.get(cacheKey);
    if (cachedResponse && !streaming) {
      return cachedResponse;
    }

    // Generate response
    const startTime = Date.now();
    const response = await this.generateResponse(context, userMessage, streaming);
    const processingTime = Date.now() - startTime;

    // Create response object
    const llmResponse: LLMResponse = {
      content: response.content,
      tokensUsed: response.tokensUsed,
      processingTime,
      confidence: response.confidence,
      suggestedActions: response.suggestedActions,
      followUpQuestions: response.followUpQuestions,
      sources: response.sources,
      warnings: response.warnings,
    };

    // Add assistant message to history
    const assistantMsg: ConversationMessage = {
      id: `msg_${Date.now()}_assistant`,
      role: 'assistant',
      content: response.content,
      timestamp: new Date().toISOString(),
      metadata: {
        tokensUsed: response.tokensUsed,
        processingTime,
        confidence: response.confidence,
        actions: response.suggestedActions,
      },
    };
    context.conversationHistory.push(assistantMsg);

    // Update token usage
    this.tokenUsage.total += response.tokensUsed;
    this.tokenUsage.today += response.tokensUsed;

    // Cache response for common queries
    if (this.isCommonQuery(userMessage)) {
      this.responseCache.set(cacheKey, llmResponse);
    }

    await this.saveState();

    if (streaming) {
      streaming.onComplete(llmResponse);
    }

    return llmResponse;
  }

  private async generateResponse(
    context: ConversationContext,
    userMessage: string,
    streaming?: StreamingCallback
  ): Promise<{
    content: string;
    tokensUsed: number;
    confidence: number;
    suggestedActions?: SuggestedAction[];
    followUpQuestions?: string[];
    sources?: string[];
    warnings?: string[];
  }> {
    // Build context-aware prompt
    const contextPrompt = this.buildContextPrompt(context);
    const medicalContext = this.getMedicalContext(userMessage, context);
    
    // Simulate LLM response generation (in production, this would call the actual API)
    const response = await this.simulateLLMResponse(
      context.personaRole,
      userMessage,
      contextPrompt,
      medicalContext,
      streaming
    );

    return response;
  }

  private buildContextPrompt(context: ConversationContext): string {
    let prompt = '';

    // Add patient context if available
    if (context.patientContext) {
      const pc = context.patientContext;
      prompt += `\n[PATIENT CONTEXT]\n`;
      if (pc.patientName) prompt += `Patient: ${pc.patientName}\n`;
      if (pc.mrn) prompt += `MRN: ${pc.mrn}\n`;
      if (pc.allergies?.length) prompt += `Allergies: ${pc.allergies.join(', ')}\n`;
      if (pc.currentMedications?.length) prompt += `Current Medications: ${pc.currentMedications.join(', ')}\n`;
      if (pc.activeConditions?.length) prompt += `Active Conditions: ${pc.activeConditions.join(', ')}\n`;
      if (pc.recentVitals) {
        const v = pc.recentVitals;
        prompt += `Recent Vitals: BP ${v.bloodPressure || 'N/A'}, HR ${v.heartRate || 'N/A'}, Temp ${v.temperature || 'N/A'}°C, SpO2 ${v.oxygenSaturation || 'N/A'}%\n`;
      }
    }

    // Add clinical context if available
    if (context.clinicalContext) {
      const cc = context.clinicalContext;
      prompt += `\n[CLINICAL CONTEXT]\n`;
      if (cc.department) prompt += `Department: ${cc.department}\n`;
      if (cc.urgencyLevel) prompt += `Urgency: ${cc.urgencyLevel}\n`;
      if (cc.activeAlerts?.length) {
        prompt += `Active Alerts:\n`;
        cc.activeAlerts.forEach(alert => {
          prompt += `- [${alert.severity.toUpperCase()}] ${alert.type}: ${alert.message}\n`;
        });
      }
    }

    // Add system context
    prompt += `\n[SYSTEM CONTEXT]\n`;
    prompt += `Facility: ${context.systemContext.facilityName}\n`;
    prompt += `Current Time: ${new Date().toLocaleString()}\n`;
    prompt += `System Status: ${context.systemContext.systemStatus}\n`;

    return prompt;
  }

  private getMedicalContext(userMessage: string, context: ConversationContext): string {
    const lowerMessage = userMessage.toLowerCase();
    let medicalContext = '';

    // Check for drug interaction queries
    if (lowerMessage.includes('interaction') || lowerMessage.includes('drug')) {
      const relevantInteractions = MEDICAL_KNOWLEDGE.drugInteractions.filter(di => 
        lowerMessage.includes(di.drug1.toLowerCase()) || lowerMessage.includes(di.drug2.toLowerCase())
      );
      if (relevantInteractions.length > 0) {
        medicalContext += '\n[DRUG INTERACTION DATA]\n';
        relevantInteractions.forEach(di => {
          medicalContext += `${di.drug1} + ${di.drug2}: ${di.severity} - ${di.description}. Management: ${di.management}\n`;
        });
      }
    }

    // Check for clinical guideline queries
    if (lowerMessage.includes('guideline') || lowerMessage.includes('protocol') || lowerMessage.includes('treatment')) {
      const relevantGuidelines = MEDICAL_KNOWLEDGE.clinicalGuidelines.filter(cg =>
        lowerMessage.includes(cg.condition.toLowerCase())
      );
      if (relevantGuidelines.length > 0) {
        medicalContext += '\n[CLINICAL GUIDELINES]\n';
        relevantGuidelines.forEach(cg => {
          medicalContext += `${cg.condition} (${cg.source}):\n`;
          cg.recommendations.forEach(rec => {
            medicalContext += `- ${rec}\n`;
          });
        });
      }
    }

    // Check for emergency protocol queries
    if (lowerMessage.includes('code') || lowerMessage.includes('emergency')) {
      const relevantProtocols = MEDICAL_KNOWLEDGE.emergencyProtocols.filter(ep =>
        lowerMessage.includes(ep.code.toLowerCase()) || lowerMessage.includes(ep.name.toLowerCase())
      );
      if (relevantProtocols.length > 0) {
        medicalContext += '\n[EMERGENCY PROTOCOLS]\n';
        relevantProtocols.forEach(ep => {
          medicalContext += `Code ${ep.code} (${ep.name}):\n`;
          medicalContext += `Steps: ${ep.steps.join(' → ')}\n`;
          medicalContext += `Team: ${ep.team.join(', ')}\n`;
        });
      }
    }

    // Check for normal range queries
    if (lowerMessage.includes('normal') || lowerMessage.includes('range') || lowerMessage.includes('value')) {
      medicalContext += '\n[NORMAL RANGES]\n';
      MEDICAL_KNOWLEDGE.normalRanges.forEach(nr => {
        if (lowerMessage.includes(nr.parameter.toLowerCase())) {
          medicalContext += `${nr.parameter}: ${nr.min}-${nr.max} ${nr.unit}`;
          if (nr.criticalLow || nr.criticalHigh) {
            medicalContext += ` (Critical: <${nr.criticalLow || 'N/A'} or >${nr.criticalHigh || 'N/A'})`;
          }
          medicalContext += '\n';
        }
      });
    }

    return medicalContext;
  }

  private async simulateLLMResponse(
    personaRole: AIPersonaRole,
    userMessage: string,
    contextPrompt: string,
    medicalContext: string,
    streaming?: StreamingCallback
  ): Promise<{
    content: string;
    tokensUsed: number;
    confidence: number;
    suggestedActions?: SuggestedAction[];
    followUpQuestions?: string[];
    sources?: string[];
    warnings?: string[];
  }> {
    // Generate intelligent response based on persona and context
    const response = this.generateIntelligentResponse(personaRole, userMessage, contextPrompt, medicalContext);
    
    // Simulate streaming if callback provided
    if (streaming) {
      const words = response.content.split(' ');
      for (let i = 0; i < words.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 30));
        streaming.onToken(words[i] + (i < words.length - 1 ? ' ' : ''));
      }
    }

    return response;
  }

  private generateIntelligentResponse(
    personaRole: AIPersonaRole,
    userMessage: string,
    contextPrompt: string,
    medicalContext: string
  ): {
    content: string;
    tokensUsed: number;
    confidence: number;
    suggestedActions?: SuggestedAction[];
    followUpQuestions?: string[];
    sources?: string[];
    warnings?: string[];
  } {
    const lowerMessage = userMessage.toLowerCase();
    let content = '';
    let suggestedActions: SuggestedAction[] = [];
    let followUpQuestions: string[] = [];
    let sources: string[] = [];
    let warnings: string[] = [];
    let confidence = 0.85;

    // Role-specific intelligent responses
    if (personaRole === 'doctor') {
      if (lowerMessage.includes('patient') || lowerMessage.includes('chart')) {
        content = `I can help you access patient information. Based on the current context, I recommend:\n\n1. **Review Recent Results** - Check any pending lab or imaging results\n2. **Medication Reconciliation** - Verify current medications against the formulary\n3. **Clinical Notes** - Review recent progress notes and consultations\n\nWould you like me to pull up specific patient data, or shall I summarize the key clinical findings?`;
        suggestedActions = [
          { id: 'view_labs', type: 'navigation', label: 'View Lab Results', description: 'Open laboratory results panel', requiresConfirmation: false, priority: 'high' },
          { id: 'view_meds', type: 'navigation', label: 'View Medications', description: 'Open medication list', requiresConfirmation: false, priority: 'medium' },
        ];
        followUpQuestions = ['Would you like to see trending vital signs?', 'Should I check for any drug interactions?'];
      } else if (lowerMessage.includes('order') || lowerMessage.includes('prescribe')) {
        content = `I'm ready to assist with order entry. Before we proceed, I'll check for:\n\n✓ **Drug-Drug Interactions** - Cross-referencing with current medications\n✓ **Allergies** - Checking documented allergies\n✓ **Renal/Hepatic Function** - Adjusting doses if needed\n✓ **Formulary Status** - Confirming availability\n\nWhat would you like to order? I can help with medications, labs, imaging, or consultations.`;
        suggestedActions = [
          { id: 'new_med', type: 'order', label: 'New Medication', description: 'Create medication order', requiresConfirmation: true, priority: 'high' },
          { id: 'new_lab', type: 'order', label: 'Order Labs', description: 'Create laboratory order', requiresConfirmation: false, priority: 'medium' },
        ];
        sources = ['Clinical Decision Support System', 'Hospital Formulary'];
      } else if (lowerMessage.includes('interaction') || lowerMessage.includes('drug')) {
        content = `I've checked the drug interaction database. ${medicalContext || 'Please specify the medications you want to check.'}\n\n**Recommendation:** Always verify interactions before prescribing, especially for:\n- Anticoagulants\n- Cardiac medications\n- CNS-active drugs\n- Narrow therapeutic index medications`;
        confidence = 0.92;
        sources = ['Lexicomp Drug Interactions', 'Clinical Pharmacology Database'];
        if (medicalContext.includes('major') || medicalContext.includes('contraindicated')) {
          warnings = ['Significant drug interaction detected - review carefully'];
        }
      } else {
        content = `I understand you're asking about "${userMessage}". As your clinical AI assistant, I can help with:\n\n• Patient chart review and clinical decision support\n• Medication ordering with safety checks\n• Lab result interpretation\n• Evidence-based recommendations\n\nHow would you like me to assist?`;
      }
    } else if (personaRole === 'nurse') {
      if (lowerMessage.includes('vital') || lowerMessage.includes('bp') || lowerMessage.includes('temp')) {
        content = `I'm ready to help you record vital signs. Let me guide you through the process:\n\n**5 Rights Verification:**\n✓ Right Patient - Scan wristband or verify verbally\n✓ Right Time - Current timestamp will be recorded\n✓ Right Documentation - I'll flag any abnormal values\n\n**Normal Ranges:**\n• BP: 90-140/60-90 mmHg\n• HR: 60-100 bpm\n• Temp: 36.1-37.2°C\n• RR: 12-20/min\n• SpO2: ≥95%\n\nPlease enter the values, and I'll alert you to any concerns.`;
        suggestedActions = [
          { id: 'record_vitals', type: 'data_entry', label: 'Record Vitals', description: 'Open vital signs entry form', requiresConfirmation: false, priority: 'high' },
        ];
      } else if (lowerMessage.includes('med') || lowerMessage.includes('medication')) {
        content = `**Medication Administration Safety Check**\n\nI'll help you verify the 5 Rights:\n\n1. **Right Patient** - Scan wristband\n2. **Right Medication** - Scan medication barcode\n3. **Right Dose** - I'll verify against the order\n4. **Right Route** - Confirm administration route\n5. **Right Time** - Check scheduled time\n\n⚠️ **Important:** I'll alert you to any:\n• Allergies\n• Drug interactions\n• Dose discrepancies\n• Timing conflicts\n\nReady when you are!`;
        suggestedActions = [
          { id: 'scan_med', type: 'data_entry', label: 'Scan Medication', description: 'Open barcode scanner', requiresConfirmation: false, priority: 'high' },
          { id: 'view_mar', type: 'navigation', label: 'View MAR', description: 'Open medication administration record', requiresConfirmation: false, priority: 'medium' },
        ];
        warnings = ['Always verify patient identity before medication administration'];
      } else {
        content = `I'm Nurse NOVA, your AI nursing assistant. I can help you with:\n\n• Vital signs recording and monitoring\n• Medication administration verification\n• Patient assessment documentation\n• Care plan updates\n• Shift handover preparation\n\nWhat do you need assistance with?`;
      }
    } else if (personaRole === 'emergency') {
      content = `🚨 **EMERGENCY RESPONSE MODE ACTIVE**\n\nI'm ready to coordinate emergency response. Current capabilities:\n\n• **Code Activation** - Blue, Red, Pink, Orange, etc.\n• **Team Alerting** - Rapid response, cardiac arrest, trauma\n• **Resource Location** - Crash carts, defibrillators, emergency equipment\n• **Protocol Guidance** - Step-by-step emergency procedures\n\n${medicalContext || ''}\n\nWhat is the nature of the emergency?`;
      suggestedActions = [
        { id: 'code_blue', type: 'alert', label: 'Code Blue', description: 'Activate cardiac arrest response', requiresConfirmation: true, priority: 'high' },
        { id: 'rapid_response', type: 'alert', label: 'Rapid Response', description: 'Call rapid response team', requiresConfirmation: true, priority: 'high' },
      ];
      confidence = 0.95;
      warnings = ['For life-threatening emergencies, call Code Blue immediately'];
    } else if (personaRole === 'jedi_commander' || personaRole === 'master_jedi') {
      content = `**JEDI COMMAND INTERFACE**\n\nCommander, I have elevated system access. Current status:\n\n📊 **System Health:**\n• Core Systems: Online\n• Database: Connected (98.7% uptime)\n• Sync Service: Active\n• Security: No threats detected\n\n🔧 **Available Commands:**\n• System-wide monitoring\n• Cross-departmental coordination\n• Emergency override capabilities\n• Integration management\n\nWhat are your orders?`;
      suggestedActions = [
        { id: 'system_status', type: 'navigation', label: 'System Status', description: 'View detailed system health', requiresConfirmation: false, priority: 'medium' },
        { id: 'force_sync', type: 'workflow', label: 'Force Sync', description: 'Synchronize all systems', requiresConfirmation: true, priority: 'medium' },
      ];
      confidence = 0.98;
    } else if (personaRole === 'receptionist') {
      if (lowerMessage.includes('check in') || lowerMessage.includes('checkin')) {
        content = `Welcome! I'd be happy to help you check in for your appointment. 📋\n\nTo verify your identity, I'll need:\n\n1. **Full Name** - As it appears on your Medicare card\n2. **Date of Birth** - DD/MM/YYYY format\n3. **Appointment Time** - Your scheduled time\n\nAlternatively, you can scan the QR code on your appointment confirmation for instant check-in.\n\nWould you like to proceed with manual entry or QR scan?`;
        suggestedActions = [
          { id: 'scan_qr', type: 'data_entry', label: 'Scan QR Code', description: 'Open QR scanner for check-in', requiresConfirmation: false, priority: 'high' },
          { id: 'manual_entry', type: 'data_entry', label: 'Enter Details', description: 'Manual check-in form', requiresConfirmation: false, priority: 'medium' },
        ];
      } else if (lowerMessage.includes('appointment') || lowerMessage.includes('book')) {
        content = `I can help you schedule an appointment! 📅\n\n**Available Appointment Types:**\n• General Consultation\n• Specialist Referral\n• Follow-up Visit\n• Urgent Care\n\n**What I'll Need:**\n1. Preferred date and time\n2. Type of appointment\n3. Preferred doctor (optional)\n4. Reason for visit (brief)\n\nWhich type of appointment would you like to book?`;
        suggestedActions = [
          { id: 'book_general', type: 'workflow', label: 'General Consultation', description: 'Book general appointment', requiresConfirmation: false, priority: 'medium' },
          { id: 'book_specialist', type: 'workflow', label: 'Specialist', description: 'Book specialist appointment', requiresConfirmation: false, priority: 'medium' },
        ];
      } else {
        content = `Hello! I'm RUBY, your virtual receptionist at MediVac One. 👋\n\nI can help you with:\n\n• **Check-in** for your appointment\n• **Book** a new appointment\n• **Directions** around the facility\n• **Contact** your care team\n• **Wait times** and queue information\n\nHow may I assist you today?`;
      }
    } else {
      content = `I understand you're asking about "${userMessage}". As your AI assistant, I'm here to help. Could you provide more details about what you need, or would you like me to suggest some options based on your role?`;
    }

    // Estimate token usage
    const tokensUsed = Math.ceil((content.length + userMessage.length + contextPrompt.length) / 4);

    return {
      content,
      tokensUsed,
      confidence,
      suggestedActions: suggestedActions.length > 0 ? suggestedActions : undefined,
      followUpQuestions: followUpQuestions.length > 0 ? followUpQuestions : undefined,
      sources: sources.length > 0 ? sources : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  private generateCacheKey(personaRole: AIPersonaRole, message: string): string {
    const normalizedMessage = message.toLowerCase().trim().replace(/[^\w\s]/g, '');
    return `${personaRole}_${normalizedMessage.substring(0, 50)}`;
  }

  private isCommonQuery(message: string): boolean {
    const commonPatterns = [
      'hello', 'hi', 'help', 'what can you do', 'how do i',
      'check in', 'appointment', 'directions', 'wait time',
      'vital signs', 'medication', 'order', 'patient'
    ];
    const lowerMessage = message.toLowerCase();
    return commonPatterns.some(pattern => lowerMessage.includes(pattern));
  }

  // ==========================================
  // Utility Methods
  // ==========================================

  getTokenUsage(): { total: number; today: number; lastReset: string } {
    return { ...this.tokenUsage };
  }

  async clearConversation(sessionId: string): Promise<void> {
    this.conversationCache.delete(sessionId);
    await this.saveState();
  }

  async clearAllConversations(): Promise<void> {
    this.conversationCache.clear();
    await this.saveState();
  }

  getConfig(): LLMConfig {
    return { ...this.config };
  }

  async updateConfig(updates: Partial<LLMConfig>): Promise<void> {
    this.config = { ...this.config, ...updates };
  }

  getMedicalKnowledge(): MedicalKnowledge {
    return MEDICAL_KNOWLEDGE;
  }
}

export const llmBackend = new LLMBackendService();
