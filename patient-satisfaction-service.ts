/**
 * Patient Satisfaction Survey Service
 * MediVac One v3.4 - Comprehensive patient feedback collection and analysis
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Survey Types
export type SurveyType = 
  | 'post_visit'
  | 'post_discharge'
  | 'post_procedure'
  | 'inpatient_daily'
  | 'emergency_followup'
  | 'outpatient'
  | 'telehealth';

export type QuestionType = 
  | 'rating_5'
  | 'rating_10'
  | 'nps'
  | 'yes_no'
  | 'multiple_choice'
  | 'text'
  | 'likert';

export type SentimentScore = 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';

export interface SurveyQuestion {
  id: string;
  text: string;
  type: QuestionType;
  category: string;
  options?: string[];
  required: boolean;
  order: number;
  conditionalOn?: {
    questionId: string;
    answer: string | number;
  };
}

export interface SurveyTemplate {
  id: string;
  name: string;
  type: SurveyType;
  department?: string;
  questions: SurveyQuestion[];
  estimatedMinutes: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SurveyResponse {
  questionId: string;
  answer: string | number | boolean;
  timestamp: string;
}

export interface PatientSurvey {
  id: string;
  templateId: string;
  patientId: string;
  patientName: string;
  encounterId: string;
  encounterType: string;
  department: string;
  provider: string;
  responses: SurveyResponse[];
  overallScore: number;
  npsScore?: number;
  sentiment: SentimentScore;
  sentimentKeywords: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'expired';
  triggeredAt: string;
  startedAt?: string;
  completedAt?: string;
  expiresAt: string;
  followUpRequired: boolean;
  followUpReason?: string;
  followUpAssignedTo?: string;
  followUpStatus?: 'pending' | 'in_progress' | 'resolved';
}

export interface SurveyTrigger {
  id: string;
  name: string;
  templateId: string;
  triggerType: 'discharge' | 'visit_complete' | 'procedure_complete' | 'scheduled' | 'manual';
  department?: string;
  delayHours: number;
  active: boolean;
  conditions?: {
    minLOS?: number;
    encounterTypes?: string[];
    excludeDiagnoses?: string[];
  };
}

export interface SatisfactionMetrics {
  period: string;
  totalSurveys: number;
  completedSurveys: number;
  responseRate: number;
  averageScore: number;
  npsScore: number;
  promoters: number;
  passives: number;
  detractors: number;
  sentimentBreakdown: Record<SentimentScore, number>;
  categoryScores: Record<string, number>;
  departmentScores: Record<string, number>;
  providerScores: Record<string, { name: string; score: number; count: number }>;
  trendData: { date: string; score: number; responses: number }[];
  topPositiveKeywords: string[];
  topNegativeKeywords: string[];
  followUpStats: {
    total: number;
    pending: number;
    resolved: number;
    avgResolutionHours: number;
  };
}

export interface SurveyBenchmark {
  category: string;
  hospitalScore: number;
  regionalAverage: number;
  nationalAverage: number;
  topQuartile: number;
  percentileRank: number;
}

// Storage keys
const STORAGE_KEYS = {
  TEMPLATES: 'medivac_survey_templates',
  SURVEYS: 'medivac_patient_surveys',
  TRIGGERS: 'medivac_survey_triggers',
  METRICS_CACHE: 'medivac_satisfaction_metrics',
};

// Default survey templates
const DEFAULT_TEMPLATES: SurveyTemplate[] = [
  {
    id: 'tmpl_post_discharge',
    name: 'Post-Discharge Survey',
    type: 'post_discharge',
    questions: [
      {
        id: 'q1',
        text: 'Overall, how would you rate your hospital stay?',
        type: 'rating_10',
        category: 'overall',
        required: true,
        order: 1,
      },
      {
        id: 'q2',
        text: 'How well did nurses communicate with you?',
        type: 'rating_5',
        category: 'nursing',
        required: true,
        order: 2,
      },
      {
        id: 'q3',
        text: 'How well did doctors communicate with you?',
        type: 'rating_5',
        category: 'physician',
        required: true,
        order: 3,
      },
      {
        id: 'q4',
        text: 'How responsive was the staff to your needs?',
        type: 'rating_5',
        category: 'responsiveness',
        required: true,
        order: 4,
      },
      {
        id: 'q5',
        text: 'How clean was your room and bathroom?',
        type: 'rating_5',
        category: 'environment',
        required: true,
        order: 5,
      },
      {
        id: 'q6',
        text: 'How quiet was the hospital at night?',
        type: 'rating_5',
        category: 'environment',
        required: true,
        order: 6,
      },
      {
        id: 'q7',
        text: 'How well was your pain managed?',
        type: 'rating_5',
        category: 'pain_management',
        required: true,
        order: 7,
      },
      {
        id: 'q8',
        text: 'Were your medications explained clearly?',
        type: 'yes_no',
        category: 'medication',
        required: true,
        order: 8,
      },
      {
        id: 'q9',
        text: 'Did you receive clear discharge instructions?',
        type: 'yes_no',
        category: 'discharge',
        required: true,
        order: 9,
      },
      {
        id: 'q10',
        text: 'How likely are you to recommend this hospital to friends and family?',
        type: 'nps',
        category: 'nps',
        required: true,
        order: 10,
      },
      {
        id: 'q11',
        text: 'What could we have done better?',
        type: 'text',
        category: 'feedback',
        required: false,
        order: 11,
      },
      {
        id: 'q12',
        text: 'What did we do well?',
        type: 'text',
        category: 'feedback',
        required: false,
        order: 12,
      },
    ],
    estimatedMinutes: 5,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tmpl_post_visit',
    name: 'Post-Visit Survey',
    type: 'post_visit',
    questions: [
      {
        id: 'pv1',
        text: 'How would you rate your overall visit experience?',
        type: 'rating_5',
        category: 'overall',
        required: true,
        order: 1,
      },
      {
        id: 'pv2',
        text: 'How long did you wait to be seen?',
        type: 'multiple_choice',
        category: 'wait_time',
        options: ['Less than 15 min', '15-30 min', '30-60 min', 'More than 60 min'],
        required: true,
        order: 2,
      },
      {
        id: 'pv3',
        text: 'Did the provider spend enough time with you?',
        type: 'yes_no',
        category: 'provider',
        required: true,
        order: 3,
      },
      {
        id: 'pv4',
        text: 'Were your concerns addressed?',
        type: 'rating_5',
        category: 'provider',
        required: true,
        order: 4,
      },
      {
        id: 'pv5',
        text: 'How likely are you to recommend us?',
        type: 'nps',
        category: 'nps',
        required: true,
        order: 5,
      },
      {
        id: 'pv6',
        text: 'Additional comments',
        type: 'text',
        category: 'feedback',
        required: false,
        order: 6,
      },
    ],
    estimatedMinutes: 3,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tmpl_emergency',
    name: 'Emergency Department Survey',
    type: 'emergency_followup',
    department: 'Emergency',
    questions: [
      {
        id: 'ed1',
        text: 'How would you rate your ED experience?',
        type: 'rating_10',
        category: 'overall',
        required: true,
        order: 1,
      },
      {
        id: 'ed2',
        text: 'How long did you wait in the waiting room?',
        type: 'multiple_choice',
        category: 'wait_time',
        options: ['Less than 30 min', '30-60 min', '1-2 hours', '2-4 hours', 'More than 4 hours'],
        required: true,
        order: 2,
      },
      {
        id: 'ed3',
        text: 'Were you kept informed about wait times and delays?',
        type: 'yes_no',
        category: 'communication',
        required: true,
        order: 3,
      },
      {
        id: 'ed4',
        text: 'How well did the staff manage your pain?',
        type: 'rating_5',
        category: 'pain_management',
        required: true,
        order: 4,
      },
      {
        id: 'ed5',
        text: 'Did you feel safe during your visit?',
        type: 'yes_no',
        category: 'safety',
        required: true,
        order: 5,
      },
      {
        id: 'ed6',
        text: 'How likely are you to recommend our ED?',
        type: 'nps',
        category: 'nps',
        required: true,
        order: 6,
      },
      {
        id: 'ed7',
        text: 'What could we improve?',
        type: 'text',
        category: 'feedback',
        required: false,
        order: 7,
      },
    ],
    estimatedMinutes: 4,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tmpl_telehealth',
    name: 'Telehealth Visit Survey',
    type: 'telehealth',
    questions: [
      {
        id: 'th1',
        text: 'How would you rate your telehealth experience?',
        type: 'rating_5',
        category: 'overall',
        required: true,
        order: 1,
      },
      {
        id: 'th2',
        text: 'Was the video/audio quality acceptable?',
        type: 'yes_no',
        category: 'technology',
        required: true,
        order: 2,
      },
      {
        id: 'th3',
        text: 'Was it easy to connect to your appointment?',
        type: 'rating_5',
        category: 'technology',
        required: true,
        order: 3,
      },
      {
        id: 'th4',
        text: 'Did the provider address your concerns?',
        type: 'rating_5',
        category: 'provider',
        required: true,
        order: 4,
      },
      {
        id: 'th5',
        text: 'Would you use telehealth again?',
        type: 'yes_no',
        category: 'preference',
        required: true,
        order: 5,
      },
      {
        id: 'th6',
        text: 'How likely are you to recommend telehealth?',
        type: 'nps',
        category: 'nps',
        required: true,
        order: 6,
      },
    ],
    estimatedMinutes: 2,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Default triggers
const DEFAULT_TRIGGERS: SurveyTrigger[] = [
  {
    id: 'trigger_discharge',
    name: 'Post-Discharge Survey',
    templateId: 'tmpl_post_discharge',
    triggerType: 'discharge',
    delayHours: 24,
    active: true,
    conditions: {
      minLOS: 1,
    },
  },
  {
    id: 'trigger_outpatient',
    name: 'Post-Visit Survey',
    templateId: 'tmpl_post_visit',
    triggerType: 'visit_complete',
    delayHours: 2,
    active: true,
    conditions: {
      encounterTypes: ['outpatient', 'clinic'],
    },
  },
  {
    id: 'trigger_ed',
    name: 'ED Follow-up Survey',
    templateId: 'tmpl_emergency',
    triggerType: 'visit_complete',
    department: 'Emergency',
    delayHours: 4,
    active: true,
  },
  {
    id: 'trigger_telehealth',
    name: 'Telehealth Survey',
    templateId: 'tmpl_telehealth',
    triggerType: 'visit_complete',
    delayHours: 1,
    active: true,
    conditions: {
      encounterTypes: ['telehealth', 'video_visit'],
    },
  },
];

// Sentiment analysis keywords
const POSITIVE_KEYWORDS = [
  'excellent', 'amazing', 'wonderful', 'great', 'fantastic', 'outstanding',
  'caring', 'compassionate', 'professional', 'helpful', 'friendly', 'kind',
  'attentive', 'thorough', 'efficient', 'clean', 'comfortable', 'safe',
  'recommend', 'best', 'thank', 'appreciate', 'satisfied', 'happy',
];

const NEGATIVE_KEYWORDS = [
  'terrible', 'awful', 'horrible', 'worst', 'bad', 'poor', 'disappointing',
  'rude', 'unprofessional', 'slow', 'long wait', 'ignored', 'dirty',
  'noisy', 'painful', 'confused', 'frustrated', 'angry', 'upset',
  'never again', 'complaint', 'unacceptable', 'neglected', 'cold',
];

class PatientSatisfactionService {
  private templates: SurveyTemplate[] = [];
  private surveys: PatientSurvey[] = [];
  private triggers: SurveyTrigger[] = [];
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load templates
      const templatesJson = await AsyncStorage.getItem(STORAGE_KEYS.TEMPLATES);
      this.templates = templatesJson ? JSON.parse(templatesJson) : DEFAULT_TEMPLATES;

      // Load surveys
      const surveysJson = await AsyncStorage.getItem(STORAGE_KEYS.SURVEYS);
      this.surveys = surveysJson ? JSON.parse(surveysJson) : [];

      // Load triggers
      const triggersJson = await AsyncStorage.getItem(STORAGE_KEYS.TRIGGERS);
      this.triggers = triggersJson ? JSON.parse(triggersJson) : DEFAULT_TRIGGERS;

      // Initialize with defaults if empty
      if (this.templates.length === 0) {
        this.templates = DEFAULT_TEMPLATES;
        await this.saveTemplates();
      }

      if (this.triggers.length === 0) {
        this.triggers = DEFAULT_TRIGGERS;
        await this.saveTriggers();
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize satisfaction service:', error);
      this.templates = DEFAULT_TEMPLATES;
      this.triggers = DEFAULT_TRIGGERS;
      this.surveys = [];
      this.initialized = true;
    }
  }

  private async saveTemplates(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(this.templates));
  }

  private async saveSurveys(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.SURVEYS, JSON.stringify(this.surveys));
  }

  private async saveTriggers(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.TRIGGERS, JSON.stringify(this.triggers));
  }

  // Template Management
  getTemplates(): SurveyTemplate[] {
    return this.templates;
  }

  getTemplate(templateId: string): SurveyTemplate | undefined {
    return this.templates.find(t => t.id === templateId);
  }

  async createTemplate(template: Omit<SurveyTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<SurveyTemplate> {
    const newTemplate: SurveyTemplate = {
      ...template,
      id: `tmpl_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.templates.push(newTemplate);
    await this.saveTemplates();
    return newTemplate;
  }

  async updateTemplate(templateId: string, updates: Partial<SurveyTemplate>): Promise<SurveyTemplate | null> {
    const index = this.templates.findIndex(t => t.id === templateId);
    if (index === -1) return null;

    this.templates[index] = {
      ...this.templates[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await this.saveTemplates();
    return this.templates[index];
  }

  // Trigger Management
  getTriggers(): SurveyTrigger[] {
    return this.triggers;
  }

  async createTrigger(trigger: Omit<SurveyTrigger, 'id'>): Promise<SurveyTrigger> {
    const newTrigger: SurveyTrigger = {
      ...trigger,
      id: `trigger_${Date.now()}`,
    };
    this.triggers.push(newTrigger);
    await this.saveTriggers();
    return newTrigger;
  }

  async updateTrigger(triggerId: string, updates: Partial<SurveyTrigger>): Promise<SurveyTrigger | null> {
    const index = this.triggers.findIndex(t => t.id === triggerId);
    if (index === -1) return null;

    this.triggers[index] = { ...this.triggers[index], ...updates };
    await this.saveTriggers();
    return this.triggers[index];
  }

  // Survey Management
  async triggerSurvey(params: {
    patientId: string;
    patientName: string;
    encounterId: string;
    encounterType: string;
    department: string;
    provider: string;
    triggerType: SurveyTrigger['triggerType'];
  }): Promise<PatientSurvey | null> {
    // Find matching trigger
    const trigger = this.triggers.find(t => 
      t.active && 
      t.triggerType === params.triggerType &&
      (!t.department || t.department === params.department) &&
      (!t.conditions?.encounterTypes || t.conditions.encounterTypes.includes(params.encounterType))
    );

    if (!trigger) return null;

    const template = this.getTemplate(trigger.templateId);
    if (!template) return null;

    const now = new Date();
    const triggerTime = new Date(now.getTime() + trigger.delayHours * 60 * 60 * 1000);
    const expiresAt = new Date(triggerTime.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days to complete

    const survey: PatientSurvey = {
      id: `survey_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      templateId: template.id,
      patientId: params.patientId,
      patientName: params.patientName,
      encounterId: params.encounterId,
      encounterType: params.encounterType,
      department: params.department,
      provider: params.provider,
      responses: [],
      overallScore: 0,
      sentiment: 'neutral',
      sentimentKeywords: [],
      status: 'pending',
      triggeredAt: triggerTime.toISOString(),
      expiresAt: expiresAt.toISOString(),
      followUpRequired: false,
    };

    this.surveys.push(survey);
    await this.saveSurveys();
    return survey;
  }

  async startSurvey(surveyId: string): Promise<PatientSurvey | null> {
    const survey = this.surveys.find(s => s.id === surveyId);
    if (!survey || survey.status !== 'pending') return null;

    survey.status = 'in_progress';
    survey.startedAt = new Date().toISOString();
    await this.saveSurveys();
    return survey;
  }

  async submitResponse(surveyId: string, questionId: string, answer: string | number | boolean): Promise<boolean> {
    const survey = this.surveys.find(s => s.id === surveyId);
    if (!survey || survey.status === 'completed' || survey.status === 'expired') return false;

    const existingIndex = survey.responses.findIndex(r => r.questionId === questionId);
    const response: SurveyResponse = {
      questionId,
      answer,
      timestamp: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      survey.responses[existingIndex] = response;
    } else {
      survey.responses.push(response);
    }

    await this.saveSurveys();
    return true;
  }

  async completeSurvey(surveyId: string): Promise<PatientSurvey | null> {
    const survey = this.surveys.find(s => s.id === surveyId);
    if (!survey) return null;

    const template = this.getTemplate(survey.templateId);
    if (!template) return null;

    // Calculate overall score
    const ratingResponses = survey.responses.filter(r => {
      const question = template.questions.find(q => q.id === r.questionId);
      return question && ['rating_5', 'rating_10', 'likert'].includes(question.type);
    });

    if (ratingResponses.length > 0) {
      const normalizedScores = ratingResponses.map(r => {
        const question = template.questions.find(q => q.id === r.questionId);
        const value = Number(r.answer);
        if (question?.type === 'rating_10') return value * 10;
        if (question?.type === 'rating_5') return value * 20;
        return value * 20; // likert
      });
      survey.overallScore = Math.round(normalizedScores.reduce((a, b) => a + b, 0) / normalizedScores.length);
    }

    // Get NPS score
    const npsResponse = survey.responses.find(r => {
      const question = template.questions.find(q => q.id === r.questionId);
      return question?.type === 'nps';
    });
    if (npsResponse) {
      survey.npsScore = Number(npsResponse.answer);
    }

    // Analyze sentiment from text responses
    const textResponses = survey.responses.filter(r => {
      const question = template.questions.find(q => q.id === r.questionId);
      return question?.type === 'text' && typeof r.answer === 'string';
    });

    const allText = textResponses.map(r => String(r.answer).toLowerCase()).join(' ');
    const foundPositive = POSITIVE_KEYWORDS.filter(k => allText.includes(k));
    const foundNegative = NEGATIVE_KEYWORDS.filter(k => allText.includes(k));

    survey.sentimentKeywords = [...foundPositive, ...foundNegative];

    // Determine sentiment
    const positiveScore = foundPositive.length;
    const negativeScore = foundNegative.length;
    const overallSentiment = survey.overallScore;

    if (overallSentiment >= 80 || positiveScore > negativeScore + 2) {
      survey.sentiment = positiveScore > 3 ? 'very_positive' : 'positive';
    } else if (overallSentiment <= 40 || negativeScore > positiveScore + 2) {
      survey.sentiment = negativeScore > 3 ? 'very_negative' : 'negative';
    } else {
      survey.sentiment = 'neutral';
    }

    // Determine if follow-up is required
    if (survey.overallScore < 50 || survey.sentiment === 'very_negative' || (survey.npsScore !== undefined && survey.npsScore <= 6)) {
      survey.followUpRequired = true;
      survey.followUpReason = survey.overallScore < 50 
        ? 'Low satisfaction score' 
        : survey.npsScore !== undefined && survey.npsScore <= 6 
          ? 'Detractor NPS score' 
          : 'Negative sentiment detected';
      survey.followUpStatus = 'pending';
    }

    survey.status = 'completed';
    survey.completedAt = new Date().toISOString();
    await this.saveSurveys();
    return survey;
  }

  // Survey Retrieval
  getSurveys(filters?: {
    status?: PatientSurvey['status'];
    patientId?: string;
    department?: string;
    provider?: string;
    dateFrom?: string;
    dateTo?: string;
    followUpRequired?: boolean;
  }): PatientSurvey[] {
    let filtered = [...this.surveys];

    if (filters?.status) {
      filtered = filtered.filter(s => s.status === filters.status);
    }
    if (filters?.patientId) {
      filtered = filtered.filter(s => s.patientId === filters.patientId);
    }
    if (filters?.department) {
      filtered = filtered.filter(s => s.department === filters.department);
    }
    if (filters?.provider) {
      filtered = filtered.filter(s => s.provider === filters.provider);
    }
    if (filters?.dateFrom) {
      filtered = filtered.filter(s => s.completedAt && s.completedAt >= filters.dateFrom!);
    }
    if (filters?.dateTo) {
      filtered = filtered.filter(s => s.completedAt && s.completedAt <= filters.dateTo!);
    }
    if (filters?.followUpRequired !== undefined) {
      filtered = filtered.filter(s => s.followUpRequired === filters.followUpRequired);
    }

    return filtered.sort((a, b) => 
      new Date(b.completedAt || b.triggeredAt).getTime() - 
      new Date(a.completedAt || a.triggeredAt).getTime()
    );
  }

  getSurvey(surveyId: string): PatientSurvey | undefined {
    return this.surveys.find(s => s.id === surveyId);
  }

  getPendingSurveys(patientId: string): PatientSurvey[] {
    return this.surveys.filter(s => 
      s.patientId === patientId && 
      (s.status === 'pending' || s.status === 'in_progress') &&
      new Date(s.expiresAt) > new Date()
    );
  }

  // Follow-up Management
  async assignFollowUp(surveyId: string, assignedTo: string): Promise<boolean> {
    const survey = this.surveys.find(s => s.id === surveyId);
    if (!survey || !survey.followUpRequired) return false;

    survey.followUpAssignedTo = assignedTo;
    survey.followUpStatus = 'in_progress';
    await this.saveSurveys();
    return true;
  }

  async resolveFollowUp(surveyId: string, resolution: string): Promise<boolean> {
    const survey = this.surveys.find(s => s.id === surveyId);
    if (!survey || !survey.followUpRequired) return false;

    survey.followUpStatus = 'resolved';
    await this.saveSurveys();
    return true;
  }

  getFollowUpsRequired(): PatientSurvey[] {
    return this.surveys.filter(s => 
      s.followUpRequired && 
      s.followUpStatus !== 'resolved'
    ).sort((a, b) => {
      // Prioritize unassigned, then by date
      if (a.followUpStatus === 'pending' && b.followUpStatus !== 'pending') return -1;
      if (b.followUpStatus === 'pending' && a.followUpStatus !== 'pending') return 1;
      return new Date(a.completedAt || a.triggeredAt).getTime() - 
             new Date(b.completedAt || b.triggeredAt).getTime();
    });
  }

  // Analytics & Metrics
  calculateMetrics(filters?: {
    dateFrom?: string;
    dateTo?: string;
    department?: string;
  }): SatisfactionMetrics {
    let completedSurveys = this.surveys.filter(s => s.status === 'completed');

    if (filters?.dateFrom) {
      completedSurveys = completedSurveys.filter(s => s.completedAt! >= filters.dateFrom!);
    }
    if (filters?.dateTo) {
      completedSurveys = completedSurveys.filter(s => s.completedAt! <= filters.dateTo!);
    }
    if (filters?.department) {
      completedSurveys = completedSurveys.filter(s => s.department === filters.department);
    }

    const totalSurveys = this.surveys.filter(s => {
      if (filters?.dateFrom && s.triggeredAt < filters.dateFrom) return false;
      if (filters?.dateTo && s.triggeredAt > filters.dateTo) return false;
      if (filters?.department && s.department !== filters.department) return false;
      return true;
    }).length;

    // Calculate NPS
    const npsScores = completedSurveys.filter(s => s.npsScore !== undefined).map(s => s.npsScore!);
    const promoters = npsScores.filter(s => s >= 9).length;
    const passives = npsScores.filter(s => s >= 7 && s <= 8).length;
    const detractors = npsScores.filter(s => s <= 6).length;
    const npsScore = npsScores.length > 0 
      ? Math.round(((promoters - detractors) / npsScores.length) * 100)
      : 0;

    // Sentiment breakdown
    const sentimentBreakdown: Record<SentimentScore, number> = {
      very_positive: completedSurveys.filter(s => s.sentiment === 'very_positive').length,
      positive: completedSurveys.filter(s => s.sentiment === 'positive').length,
      neutral: completedSurveys.filter(s => s.sentiment === 'neutral').length,
      negative: completedSurveys.filter(s => s.sentiment === 'negative').length,
      very_negative: completedSurveys.filter(s => s.sentiment === 'very_negative').length,
    };

    // Department scores
    const departmentScores: Record<string, number> = {};
    const departments = [...new Set(completedSurveys.map(s => s.department))];
    departments.forEach(dept => {
      const deptSurveys = completedSurveys.filter(s => s.department === dept);
      departmentScores[dept] = deptSurveys.length > 0
        ? Math.round(deptSurveys.reduce((sum, s) => sum + s.overallScore, 0) / deptSurveys.length)
        : 0;
    });

    // Provider scores
    const providerScores: Record<string, { name: string; score: number; count: number }> = {};
    const providers = [...new Set(completedSurveys.map(s => s.provider))];
    providers.forEach(provider => {
      const providerSurveys = completedSurveys.filter(s => s.provider === provider);
      providerScores[provider] = {
        name: provider,
        score: providerSurveys.length > 0
          ? Math.round(providerSurveys.reduce((sum, s) => sum + s.overallScore, 0) / providerSurveys.length)
          : 0,
        count: providerSurveys.length,
      };
    });

    // Trend data (last 30 days)
    const trendData: { date: string; score: number; responses: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const daySurveys = completedSurveys.filter(s => 
        s.completedAt?.startsWith(dateStr)
      );
      trendData.push({
        date: dateStr,
        score: daySurveys.length > 0
          ? Math.round(daySurveys.reduce((sum, s) => sum + s.overallScore, 0) / daySurveys.length)
          : 0,
        responses: daySurveys.length,
      });
    }

    // Keyword analysis
    const allPositiveKeywords = completedSurveys.flatMap(s => 
      s.sentimentKeywords.filter(k => POSITIVE_KEYWORDS.includes(k))
    );
    const allNegativeKeywords = completedSurveys.flatMap(s => 
      s.sentimentKeywords.filter(k => NEGATIVE_KEYWORDS.includes(k))
    );

    const countKeywords = (keywords: string[]) => {
      const counts: Record<string, number> = {};
      keywords.forEach(k => { counts[k] = (counts[k] || 0) + 1; });
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([k]) => k);
    };

    // Follow-up stats
    const followUpSurveys = completedSurveys.filter(s => s.followUpRequired);
    const resolvedFollowUps = followUpSurveys.filter(s => s.followUpStatus === 'resolved');

    return {
      period: filters?.dateFrom && filters?.dateTo 
        ? `${filters.dateFrom} to ${filters.dateTo}`
        : 'All Time',
      totalSurveys,
      completedSurveys: completedSurveys.length,
      responseRate: totalSurveys > 0 ? Math.round((completedSurveys.length / totalSurveys) * 100) : 0,
      averageScore: completedSurveys.length > 0
        ? Math.round(completedSurveys.reduce((sum, s) => sum + s.overallScore, 0) / completedSurveys.length)
        : 0,
      npsScore,
      promoters,
      passives,
      detractors,
      sentimentBreakdown,
      categoryScores: {}, // Would need template analysis
      departmentScores,
      providerScores,
      trendData,
      topPositiveKeywords: countKeywords(allPositiveKeywords),
      topNegativeKeywords: countKeywords(allNegativeKeywords),
      followUpStats: {
        total: followUpSurveys.length,
        pending: followUpSurveys.filter(s => s.followUpStatus === 'pending').length,
        resolved: resolvedFollowUps.length,
        avgResolutionHours: 48, // Would need actual tracking
      },
    };
  }

  getBenchmarks(): SurveyBenchmark[] {
    const metrics = this.calculateMetrics();
    
    return [
      {
        category: 'Overall Satisfaction',
        hospitalScore: metrics.averageScore,
        regionalAverage: 72,
        nationalAverage: 71,
        topQuartile: 82,
        percentileRank: this.calculatePercentile(metrics.averageScore, 71, 10),
      },
      {
        category: 'Net Promoter Score',
        hospitalScore: metrics.npsScore,
        regionalAverage: 45,
        nationalAverage: 42,
        topQuartile: 65,
        percentileRank: this.calculatePercentile(metrics.npsScore, 42, 20),
      },
      {
        category: 'Response Rate',
        hospitalScore: metrics.responseRate,
        regionalAverage: 28,
        nationalAverage: 26,
        topQuartile: 38,
        percentileRank: this.calculatePercentile(metrics.responseRate, 26, 10),
      },
    ];
  }

  private calculatePercentile(score: number, average: number, stdDev: number): number {
    const zScore = (score - average) / stdDev;
    // Approximate percentile from z-score
    const percentile = Math.round(50 + (zScore * 34));
    return Math.max(0, Math.min(100, percentile));
  }

  // Generate demo data
  async generateDemoData(): Promise<void> {
    const departments = ['Emergency', 'Medical', 'Surgical', 'ICU', 'Pediatrics', 'Cardiology'];
    const providers = ['Dr. Smith', 'Dr. Johnson', 'Dr. Williams', 'Dr. Brown', 'Dr. Davis', 'Dr. Miller'];
    const encounterTypes = ['inpatient', 'outpatient', 'emergency', 'telehealth'];

    for (let i = 0; i < 50; i++) {
      const dept = departments[Math.floor(Math.random() * departments.length)];
      const provider = providers[Math.floor(Math.random() * providers.length)];
      const encounterType = encounterTypes[Math.floor(Math.random() * encounterTypes.length)];
      
      const survey = await this.triggerSurvey({
        patientId: `PAT${1000 + i}`,
        patientName: `Patient ${i + 1}`,
        encounterId: `ENC${2000 + i}`,
        encounterType,
        department: dept,
        provider,
        triggerType: encounterType === 'emergency' ? 'visit_complete' : 'discharge',
      });

      if (survey) {
        await this.startSurvey(survey.id);
        
        // Generate random responses
        const template = this.getTemplate(survey.templateId);
        if (template) {
          for (const question of template.questions) {
            let answer: string | number | boolean;
            
            switch (question.type) {
              case 'rating_5':
                answer = Math.floor(Math.random() * 3) + 3; // 3-5
                break;
              case 'rating_10':
                answer = Math.floor(Math.random() * 4) + 6; // 6-10
                break;
              case 'nps':
                answer = Math.floor(Math.random() * 5) + 5; // 5-10
                break;
              case 'yes_no':
                answer = Math.random() > 0.2;
                break;
              case 'multiple_choice':
                answer = question.options?.[Math.floor(Math.random() * (question.options?.length || 1))] || '';
                break;
              case 'text':
                const texts = [
                  'Great care, very satisfied!',
                  'Staff was professional and caring.',
                  'Wait time was a bit long but overall good.',
                  'Excellent service, highly recommend.',
                  'Could improve communication.',
                  'Very clean and comfortable.',
                ];
                answer = texts[Math.floor(Math.random() * texts.length)];
                break;
              default:
                answer = 4;
            }
            
            await this.submitResponse(survey.id, question.id, answer);
          }
          
          await this.completeSurvey(survey.id);
        }
      }
    }
  }
}

export const patientSatisfactionService = new PatientSatisfactionService();
