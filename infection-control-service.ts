/**
 * Infection Control Surveillance Service
 * MediVac One v3.4 - Healthcare-Associated Infection Detection and Outbreak Management
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Infection Types
export type HAIType = 
  | 'CLABSI'  // Central Line-Associated Bloodstream Infection
  | 'CAUTI'   // Catheter-Associated Urinary Tract Infection
  | 'SSI'     // Surgical Site Infection
  | 'VAP'     // Ventilator-Associated Pneumonia
  | 'VAE'     // Ventilator-Associated Event
  | 'CDI'     // Clostridioides difficile Infection
  | 'MRSA'    // Methicillin-resistant Staphylococcus aureus
  | 'VRE'     // Vancomycin-resistant Enterococci
  | 'CRE'     // Carbapenem-resistant Enterobacteriaceae
  | 'OTHER';

export type IsolationPrecaution = 
  | 'standard'
  | 'contact'
  | 'droplet'
  | 'airborne'
  | 'contact_plus'
  | 'protective';

export type InfectionStatus = 'suspected' | 'confirmed' | 'ruled_out' | 'resolved';

export type OutbreakStatus = 'active' | 'contained' | 'resolved' | 'monitoring';

export interface Pathogen {
  id: string;
  name: string;
  type: 'bacteria' | 'virus' | 'fungus' | 'parasite';
  isMultidrugResistant: boolean;
  requiredPrecautions: IsolationPrecaution[];
  transmissionRoutes: string[];
  incubationPeriodDays: { min: number; max: number };
}

export interface InfectionCase {
  id: string;
  patientId: string;
  patientName: string;
  mrn: string;
  location: string;
  unit: string;
  room: string;
  bed: string;
  haiType: HAIType;
  pathogen?: string;
  pathogenId?: string;
  status: InfectionStatus;
  isolationPrecautions: IsolationPrecaution[];
  onsetDate: string;
  identifiedDate: string;
  resolvedDate?: string;
  deviceDays?: number;
  deviceType?: string;
  deviceInsertionDate?: string;
  deviceRemovalDate?: string;
  labResults: LabResult[];
  riskFactors: string[];
  interventions: Intervention[];
  contacts: ContactTrace[];
  notes: string;
  reportedToNHSN: boolean;
  nhsnReportDate?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface LabResult {
  id: string;
  testName: string;
  result: string;
  resultDate: string;
  isPositive: boolean;
  organism?: string;
  sensitivity?: Record<string, 'S' | 'I' | 'R'>;
}

export interface Intervention {
  id: string;
  type: string;
  description: string;
  performedBy: string;
  performedAt: string;
  outcome?: string;
}

export interface ContactTrace {
  id: string;
  contactPatientId?: string;
  contactPatientName?: string;
  contactStaffId?: string;
  contactStaffName?: string;
  contactType: 'patient' | 'staff' | 'visitor';
  exposureDate: string;
  exposureLocation: string;
  exposureDuration: string;
  riskLevel: 'low' | 'medium' | 'high';
  followUpRequired: boolean;
  followUpStatus?: 'pending' | 'completed' | 'negative' | 'positive';
  notes?: string;
}

export interface Outbreak {
  id: string;
  name: string;
  pathogen: string;
  pathogenId?: string;
  haiType: HAIType;
  status: OutbreakStatus;
  startDate: string;
  endDate?: string;
  affectedUnits: string[];
  caseCount: number;
  caseIds: string[];
  attackRate?: number;
  sourceIdentified: boolean;
  sourceDescription?: string;
  controlMeasures: string[];
  timeline: OutbreakEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface OutbreakEvent {
  id: string;
  date: string;
  type: 'case_identified' | 'investigation' | 'control_measure' | 'status_change' | 'note';
  description: string;
  performedBy: string;
}

export interface HandHygieneObservation {
  id: string;
  observerId: string;
  observerName: string;
  unit: string;
  staffId?: string;
  staffRole: string;
  moment: 'before_patient' | 'before_aseptic' | 'after_body_fluid' | 'after_patient' | 'after_environment';
  opportunity: boolean;
  performed: boolean;
  method?: 'soap_water' | 'alcohol_rub';
  gloveUse: boolean;
  observedAt: string;
  notes?: string;
}

export interface EnvironmentalCleaning {
  id: string;
  location: string;
  room: string;
  cleaningType: 'routine' | 'terminal' | 'enhanced' | 'discharge';
  performedBy: string;
  performedAt: string;
  verifiedBy?: string;
  verifiedAt?: string;
  uvDisinfection: boolean;
  hydrogenPeroxide: boolean;
  checklistCompleted: boolean;
  checklistItems: { item: string; completed: boolean }[];
  notes?: string;
}

export interface Antibiogram {
  id: string;
  organism: string;
  year: number;
  quarter: number;
  isolateCount: number;
  sensitivities: Record<string, { sensitive: number; intermediate: number; resistant: number; total: number }>;
  updatedAt: string;
}

export interface InfectionMetrics {
  period: string;
  totalCases: number;
  activeCases: number;
  resolvedCases: number;
  casesByType: Record<HAIType, number>;
  casesByUnit: Record<string, number>;
  deviceDays: Record<string, number>;
  infectionRates: Record<HAIType, { rate: number; benchmark: number; percentile: number }>;
  handHygieneCompliance: number;
  handHygieneByUnit: Record<string, number>;
  activeOutbreaks: number;
  contactsTraced: number;
  isolationCompliance: number;
  nhsnReportingCompliance: number;
  trendData: { date: string; cases: number; rate: number }[];
}

// Storage keys
const STORAGE_KEYS = {
  CASES: 'medivac_infection_cases',
  OUTBREAKS: 'medivac_outbreaks',
  HAND_HYGIENE: 'medivac_hand_hygiene',
  CLEANING: 'medivac_env_cleaning',
  ANTIBIOGRAMS: 'medivac_antibiograms',
  PATHOGENS: 'medivac_pathogens',
};

// Common pathogens database
const DEFAULT_PATHOGENS: Pathogen[] = [
  {
    id: 'path_mrsa',
    name: 'MRSA (Methicillin-resistant Staphylococcus aureus)',
    type: 'bacteria',
    isMultidrugResistant: true,
    requiredPrecautions: ['contact'],
    transmissionRoutes: ['direct contact', 'contaminated surfaces'],
    incubationPeriodDays: { min: 1, max: 10 },
  },
  {
    id: 'path_vre',
    name: 'VRE (Vancomycin-resistant Enterococci)',
    type: 'bacteria',
    isMultidrugResistant: true,
    requiredPrecautions: ['contact'],
    transmissionRoutes: ['direct contact', 'contaminated surfaces', 'fecal-oral'],
    incubationPeriodDays: { min: 1, max: 14 },
  },
  {
    id: 'path_cdiff',
    name: 'Clostridioides difficile',
    type: 'bacteria',
    isMultidrugResistant: false,
    requiredPrecautions: ['contact_plus'],
    transmissionRoutes: ['fecal-oral', 'contaminated surfaces', 'spores'],
    incubationPeriodDays: { min: 2, max: 10 },
  },
  {
    id: 'path_cre',
    name: 'CRE (Carbapenem-resistant Enterobacteriaceae)',
    type: 'bacteria',
    isMultidrugResistant: true,
    requiredPrecautions: ['contact_plus'],
    transmissionRoutes: ['direct contact', 'contaminated equipment'],
    incubationPeriodDays: { min: 1, max: 21 },
  },
  {
    id: 'path_pseudomonas',
    name: 'Pseudomonas aeruginosa',
    type: 'bacteria',
    isMultidrugResistant: false,
    requiredPrecautions: ['contact'],
    transmissionRoutes: ['contaminated water', 'medical equipment'],
    incubationPeriodDays: { min: 1, max: 14 },
  },
  {
    id: 'path_ecoli',
    name: 'Escherichia coli (ESBL)',
    type: 'bacteria',
    isMultidrugResistant: true,
    requiredPrecautions: ['contact'],
    transmissionRoutes: ['fecal-oral', 'contaminated surfaces'],
    incubationPeriodDays: { min: 1, max: 10 },
  },
  {
    id: 'path_klebsiella',
    name: 'Klebsiella pneumoniae',
    type: 'bacteria',
    isMultidrugResistant: false,
    requiredPrecautions: ['contact'],
    transmissionRoutes: ['direct contact', 'respiratory droplets'],
    incubationPeriodDays: { min: 2, max: 14 },
  },
  {
    id: 'path_candida',
    name: 'Candida auris',
    type: 'fungus',
    isMultidrugResistant: true,
    requiredPrecautions: ['contact_plus'],
    transmissionRoutes: ['direct contact', 'contaminated surfaces'],
    incubationPeriodDays: { min: 1, max: 30 },
  },
  {
    id: 'path_influenza',
    name: 'Influenza virus',
    type: 'virus',
    isMultidrugResistant: false,
    requiredPrecautions: ['droplet'],
    transmissionRoutes: ['respiratory droplets', 'contaminated surfaces'],
    incubationPeriodDays: { min: 1, max: 4 },
  },
  {
    id: 'path_covid',
    name: 'SARS-CoV-2',
    type: 'virus',
    isMultidrugResistant: false,
    requiredPrecautions: ['airborne', 'contact'],
    transmissionRoutes: ['respiratory droplets', 'aerosols', 'contaminated surfaces'],
    incubationPeriodDays: { min: 2, max: 14 },
  },
  {
    id: 'path_rsv',
    name: 'Respiratory Syncytial Virus (RSV)',
    type: 'virus',
    isMultidrugResistant: false,
    requiredPrecautions: ['contact', 'droplet'],
    transmissionRoutes: ['respiratory droplets', 'direct contact'],
    incubationPeriodDays: { min: 2, max: 8 },
  },
  {
    id: 'path_norovirus',
    name: 'Norovirus',
    type: 'virus',
    isMultidrugResistant: false,
    requiredPrecautions: ['contact_plus'],
    transmissionRoutes: ['fecal-oral', 'contaminated food/water', 'aerosols from vomiting'],
    incubationPeriodDays: { min: 1, max: 2 },
  },
];

// HAI benchmarks (per 1000 device days or procedures)
const HAI_BENCHMARKS: Record<HAIType, number> = {
  CLABSI: 0.8,
  CAUTI: 1.2,
  SSI: 1.5,
  VAP: 0.9,
  VAE: 5.0,
  CDI: 6.0,
  MRSA: 0.5,
  VRE: 0.3,
  CRE: 0.1,
  OTHER: 1.0,
};

class InfectionControlService {
  private cases: InfectionCase[] = [];
  private outbreaks: Outbreak[] = [];
  private handHygieneObs: HandHygieneObservation[] = [];
  private cleaningRecords: EnvironmentalCleaning[] = [];
  private antibiograms: Antibiogram[] = [];
  private pathogens: Pathogen[] = [];
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const casesJson = await AsyncStorage.getItem(STORAGE_KEYS.CASES);
      this.cases = casesJson ? JSON.parse(casesJson) : [];

      const outbreaksJson = await AsyncStorage.getItem(STORAGE_KEYS.OUTBREAKS);
      this.outbreaks = outbreaksJson ? JSON.parse(outbreaksJson) : [];

      const hhJson = await AsyncStorage.getItem(STORAGE_KEYS.HAND_HYGIENE);
      this.handHygieneObs = hhJson ? JSON.parse(hhJson) : [];

      const cleaningJson = await AsyncStorage.getItem(STORAGE_KEYS.CLEANING);
      this.cleaningRecords = cleaningJson ? JSON.parse(cleaningJson) : [];

      const antibiogramJson = await AsyncStorage.getItem(STORAGE_KEYS.ANTIBIOGRAMS);
      this.antibiograms = antibiogramJson ? JSON.parse(antibiogramJson) : [];

      const pathogensJson = await AsyncStorage.getItem(STORAGE_KEYS.PATHOGENS);
      this.pathogens = pathogensJson ? JSON.parse(pathogensJson) : DEFAULT_PATHOGENS;

      if (this.pathogens.length === 0) {
        this.pathogens = DEFAULT_PATHOGENS;
        await this.savePathogens();
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize infection control service:', error);
      this.pathogens = DEFAULT_PATHOGENS;
      this.initialized = true;
    }
  }

  private async saveCases(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(this.cases));
  }

  private async saveOutbreaks(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.OUTBREAKS, JSON.stringify(this.outbreaks));
  }

  private async saveHandHygiene(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.HAND_HYGIENE, JSON.stringify(this.handHygieneObs));
  }

  private async saveCleaning(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.CLEANING, JSON.stringify(this.cleaningRecords));
  }

  private async saveAntibiograms(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.ANTIBIOGRAMS, JSON.stringify(this.antibiograms));
  }

  private async savePathogens(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.PATHOGENS, JSON.stringify(this.pathogens));
  }

  // Pathogen Management
  getPathogens(): Pathogen[] {
    return this.pathogens;
  }

  getPathogen(pathogenId: string): Pathogen | undefined {
    return this.pathogens.find(p => p.id === pathogenId);
  }

  // Infection Case Management
  async createCase(caseData: Omit<InfectionCase, 'id' | 'createdAt' | 'updatedAt'>): Promise<InfectionCase> {
    const newCase: InfectionCase = {
      ...caseData,
      id: `case_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.cases.push(newCase);
    await this.saveCases();

    // Check for potential outbreak
    await this.checkForOutbreak(newCase);

    return newCase;
  }

  async updateCase(caseId: string, updates: Partial<InfectionCase>): Promise<InfectionCase | null> {
    const index = this.cases.findIndex(c => c.id === caseId);
    if (index === -1) return null;

    this.cases[index] = {
      ...this.cases[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await this.saveCases();
    return this.cases[index];
  }

  async resolveCase(caseId: string): Promise<InfectionCase | null> {
    return this.updateCase(caseId, {
      status: 'resolved',
      resolvedDate: new Date().toISOString(),
    });
  }

  getCases(filters?: {
    status?: InfectionStatus;
    haiType?: HAIType;
    unit?: string;
    pathogen?: string;
    dateFrom?: string;
    dateTo?: string;
  }): InfectionCase[] {
    let filtered = [...this.cases];

    if (filters?.status) {
      filtered = filtered.filter(c => c.status === filters.status);
    }
    if (filters?.haiType) {
      filtered = filtered.filter(c => c.haiType === filters.haiType);
    }
    if (filters?.unit) {
      filtered = filtered.filter(c => c.unit === filters.unit);
    }
    if (filters?.pathogen) {
      filtered = filtered.filter(c => c.pathogen === filters.pathogen);
    }
    if (filters?.dateFrom) {
      filtered = filtered.filter(c => c.identifiedDate >= filters.dateFrom!);
    }
    if (filters?.dateTo) {
      filtered = filtered.filter(c => c.identifiedDate <= filters.dateTo!);
    }

    return filtered.sort((a, b) => 
      new Date(b.identifiedDate).getTime() - new Date(a.identifiedDate).getTime()
    );
  }

  getCase(caseId: string): InfectionCase | undefined {
    return this.cases.find(c => c.id === caseId);
  }

  getActiveCases(): InfectionCase[] {
    return this.cases.filter(c => c.status === 'suspected' || c.status === 'confirmed');
  }

  // Contact Tracing
  async addContact(caseId: string, contact: Omit<ContactTrace, 'id'>): Promise<ContactTrace | null> {
    const infectionCase = this.cases.find(c => c.id === caseId);
    if (!infectionCase) return null;

    const newContact: ContactTrace = {
      ...contact,
      id: `contact_${Date.now()}`,
    };

    infectionCase.contacts.push(newContact);
    infectionCase.updatedAt = new Date().toISOString();
    await this.saveCases();

    return newContact;
  }

  async updateContactStatus(caseId: string, contactId: string, status: ContactTrace['followUpStatus']): Promise<boolean> {
    const infectionCase = this.cases.find(c => c.id === caseId);
    if (!infectionCase) return false;

    const contact = infectionCase.contacts.find(c => c.id === contactId);
    if (!contact) return false;

    contact.followUpStatus = status;
    infectionCase.updatedAt = new Date().toISOString();
    await this.saveCases();

    return true;
  }

  // Outbreak Detection and Management
  private async checkForOutbreak(newCase: InfectionCase): Promise<void> {
    // Look for similar cases in the same unit within 14 days
    const recentCases = this.cases.filter(c => 
      c.id !== newCase.id &&
      c.unit === newCase.unit &&
      c.haiType === newCase.haiType &&
      (c.pathogen === newCase.pathogen || (!c.pathogen && !newCase.pathogen)) &&
      Math.abs(new Date(c.identifiedDate).getTime() - new Date(newCase.identifiedDate).getTime()) <= 14 * 24 * 60 * 60 * 1000
    );

    // Threshold: 2+ cases in same unit with same pathogen/type = potential outbreak
    if (recentCases.length >= 1) {
      // Check if already part of an outbreak
      const existingOutbreak = this.outbreaks.find(o => 
        o.status === 'active' &&
        o.haiType === newCase.haiType &&
        o.affectedUnits.includes(newCase.unit) &&
        (o.pathogen === newCase.pathogen || (!o.pathogen && !newCase.pathogen))
      );

      if (existingOutbreak) {
        // Add to existing outbreak
        if (!existingOutbreak.caseIds.includes(newCase.id)) {
          existingOutbreak.caseIds.push(newCase.id);
          existingOutbreak.caseCount = existingOutbreak.caseIds.length;
          existingOutbreak.timeline.push({
            id: `event_${Date.now()}`,
            date: new Date().toISOString(),
            type: 'case_identified',
            description: `New case added: ${newCase.patientName}`,
            performedBy: 'System',
          });
          existingOutbreak.updatedAt = new Date().toISOString();
          await this.saveOutbreaks();
        }
      } else {
        // Create new outbreak
        const allCaseIds = [newCase.id, ...recentCases.map(c => c.id)];
        const outbreak: Outbreak = {
          id: `outbreak_${Date.now()}`,
          name: `${newCase.haiType} Outbreak - ${newCase.unit}`,
          pathogen: newCase.pathogen || 'Unknown',
          pathogenId: newCase.pathogenId,
          haiType: newCase.haiType,
          status: 'active',
          startDate: recentCases.length > 0 
            ? recentCases.reduce((min, c) => c.identifiedDate < min ? c.identifiedDate : min, newCase.identifiedDate)
            : newCase.identifiedDate,
          affectedUnits: [newCase.unit],
          caseCount: allCaseIds.length,
          caseIds: allCaseIds,
          sourceIdentified: false,
          controlMeasures: [],
          timeline: [{
            id: `event_${Date.now()}`,
            date: new Date().toISOString(),
            type: 'case_identified',
            description: `Outbreak detected: ${allCaseIds.length} cases identified`,
            performedBy: 'System',
          }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        this.outbreaks.push(outbreak);
        await this.saveOutbreaks();
      }
    }
  }

  async createOutbreak(outbreakData: Omit<Outbreak, 'id' | 'createdAt' | 'updatedAt'>): Promise<Outbreak> {
    const outbreak: Outbreak = {
      ...outbreakData,
      id: `outbreak_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.outbreaks.push(outbreak);
    await this.saveOutbreaks();
    return outbreak;
  }

  async updateOutbreak(outbreakId: string, updates: Partial<Outbreak>): Promise<Outbreak | null> {
    const index = this.outbreaks.findIndex(o => o.id === outbreakId);
    if (index === -1) return null;

    this.outbreaks[index] = {
      ...this.outbreaks[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await this.saveOutbreaks();
    return this.outbreaks[index];
  }

  async addOutbreakEvent(outbreakId: string, event: Omit<OutbreakEvent, 'id'>): Promise<boolean> {
    const outbreak = this.outbreaks.find(o => o.id === outbreakId);
    if (!outbreak) return false;

    outbreak.timeline.push({
      ...event,
      id: `event_${Date.now()}`,
    });
    outbreak.updatedAt = new Date().toISOString();
    await this.saveOutbreaks();

    return true;
  }

  async addControlMeasure(outbreakId: string, measure: string): Promise<boolean> {
    const outbreak = this.outbreaks.find(o => o.id === outbreakId);
    if (!outbreak) return false;

    outbreak.controlMeasures.push(measure);
    outbreak.timeline.push({
      id: `event_${Date.now()}`,
      date: new Date().toISOString(),
      type: 'control_measure',
      description: `Control measure implemented: ${measure}`,
      performedBy: 'Current User',
    });
    outbreak.updatedAt = new Date().toISOString();
    await this.saveOutbreaks();

    return true;
  }

  getOutbreaks(status?: OutbreakStatus): Outbreak[] {
    let filtered = [...this.outbreaks];
    if (status) {
      filtered = filtered.filter(o => o.status === status);
    }
    return filtered.sort((a, b) => 
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
  }

  getOutbreak(outbreakId: string): Outbreak | undefined {
    return this.outbreaks.find(o => o.id === outbreakId);
  }

  getActiveOutbreaks(): Outbreak[] {
    return this.outbreaks.filter(o => o.status === 'active' || o.status === 'monitoring');
  }

  // Hand Hygiene Monitoring
  async recordHandHygieneObservation(obs: Omit<HandHygieneObservation, 'id'>): Promise<HandHygieneObservation> {
    const observation: HandHygieneObservation = {
      ...obs,
      id: `hh_${Date.now()}`,
    };

    this.handHygieneObs.push(observation);
    await this.saveHandHygiene();
    return observation;
  }

  getHandHygieneObservations(filters?: {
    unit?: string;
    dateFrom?: string;
    dateTo?: string;
  }): HandHygieneObservation[] {
    let filtered = [...this.handHygieneObs];

    if (filters?.unit) {
      filtered = filtered.filter(o => o.unit === filters.unit);
    }
    if (filters?.dateFrom) {
      filtered = filtered.filter(o => o.observedAt >= filters.dateFrom!);
    }
    if (filters?.dateTo) {
      filtered = filtered.filter(o => o.observedAt <= filters.dateTo!);
    }

    return filtered;
  }

  calculateHandHygieneCompliance(unit?: string): number {
    const observations = unit 
      ? this.handHygieneObs.filter(o => o.unit === unit)
      : this.handHygieneObs;

    if (observations.length === 0) return 0;

    const opportunities = observations.filter(o => o.opportunity);
    const performed = opportunities.filter(o => o.performed);

    return opportunities.length > 0 
      ? Math.round((performed.length / opportunities.length) * 100)
      : 0;
  }

  // Environmental Cleaning
  async recordCleaning(cleaning: Omit<EnvironmentalCleaning, 'id'>): Promise<EnvironmentalCleaning> {
    const record: EnvironmentalCleaning = {
      ...cleaning,
      id: `clean_${Date.now()}`,
    };

    this.cleaningRecords.push(record);
    await this.saveCleaning();
    return record;
  }

  async verifyCleaning(cleaningId: string, verifiedBy: string): Promise<boolean> {
    const record = this.cleaningRecords.find(c => c.id === cleaningId);
    if (!record) return false;

    record.verifiedBy = verifiedBy;
    record.verifiedAt = new Date().toISOString();
    await this.saveCleaning();

    return true;
  }

  getCleaningRecords(filters?: {
    location?: string;
    cleaningType?: EnvironmentalCleaning['cleaningType'];
    dateFrom?: string;
    dateTo?: string;
  }): EnvironmentalCleaning[] {
    let filtered = [...this.cleaningRecords];

    if (filters?.location) {
      filtered = filtered.filter(c => c.location === filters.location);
    }
    if (filters?.cleaningType) {
      filtered = filtered.filter(c => c.cleaningType === filters.cleaningType);
    }
    if (filters?.dateFrom) {
      filtered = filtered.filter(c => c.performedAt >= filters.dateFrom!);
    }
    if (filters?.dateTo) {
      filtered = filtered.filter(c => c.performedAt <= filters.dateTo!);
    }

    return filtered.sort((a, b) => 
      new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime()
    );
  }

  // Antibiogram
  getAntibiograms(): Antibiogram[] {
    return this.antibiograms;
  }

  async updateAntibiogram(antibiogram: Omit<Antibiogram, 'id' | 'updatedAt'>): Promise<Antibiogram> {
    const existing = this.antibiograms.find(a => 
      a.organism === antibiogram.organism && 
      a.year === antibiogram.year && 
      a.quarter === antibiogram.quarter
    );

    if (existing) {
      existing.isolateCount = antibiogram.isolateCount;
      existing.sensitivities = antibiogram.sensitivities;
      existing.updatedAt = new Date().toISOString();
      await this.saveAntibiograms();
      return existing;
    }

    const newAntibiogram: Antibiogram = {
      ...antibiogram,
      id: `abg_${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };

    this.antibiograms.push(newAntibiogram);
    await this.saveAntibiograms();
    return newAntibiogram;
  }

  // NHSN Reporting
  async markReportedToNHSN(caseId: string): Promise<boolean> {
    const infectionCase = this.cases.find(c => c.id === caseId);
    if (!infectionCase) return false;

    infectionCase.reportedToNHSN = true;
    infectionCase.nhsnReportDate = new Date().toISOString();
    infectionCase.updatedAt = new Date().toISOString();
    await this.saveCases();

    return true;
  }

  getCasesForNHSNReporting(): InfectionCase[] {
    return this.cases.filter(c => 
      c.status === 'confirmed' && 
      !c.reportedToNHSN &&
      ['CLABSI', 'CAUTI', 'SSI', 'VAP', 'VAE', 'CDI', 'MRSA'].includes(c.haiType)
    );
  }

  // Metrics and Analytics
  calculateMetrics(filters?: {
    dateFrom?: string;
    dateTo?: string;
    unit?: string;
  }): InfectionMetrics {
    let filteredCases = [...this.cases];

    if (filters?.dateFrom) {
      filteredCases = filteredCases.filter(c => c.identifiedDate >= filters.dateFrom!);
    }
    if (filters?.dateTo) {
      filteredCases = filteredCases.filter(c => c.identifiedDate <= filters.dateTo!);
    }
    if (filters?.unit) {
      filteredCases = filteredCases.filter(c => c.unit === filters.unit);
    }

    const activeCases = filteredCases.filter(c => c.status === 'suspected' || c.status === 'confirmed');
    const resolvedCases = filteredCases.filter(c => c.status === 'resolved');

    // Cases by type
    const casesByType: Record<HAIType, number> = {} as Record<HAIType, number>;
    const haiTypes: HAIType[] = ['CLABSI', 'CAUTI', 'SSI', 'VAP', 'VAE', 'CDI', 'MRSA', 'VRE', 'CRE', 'OTHER'];
    haiTypes.forEach(type => {
      casesByType[type] = filteredCases.filter(c => c.haiType === type).length;
    });

    // Cases by unit
    const casesByUnit: Record<string, number> = {};
    const units = [...new Set(filteredCases.map(c => c.unit))];
    units.forEach(unit => {
      casesByUnit[unit] = filteredCases.filter(c => c.unit === unit).length;
    });

    // Device days (simulated)
    const deviceDays: Record<string, number> = {
      'Central Line': 1500,
      'Urinary Catheter': 2000,
      'Ventilator': 800,
    };

    // Infection rates
    const infectionRates: Record<HAIType, { rate: number; benchmark: number; percentile: number }> = {} as any;
    haiTypes.forEach(type => {
      const cases = casesByType[type];
      const benchmark = HAI_BENCHMARKS[type];
      let deviceDaysForType = 1000;
      
      if (type === 'CLABSI') deviceDaysForType = deviceDays['Central Line'];
      else if (type === 'CAUTI') deviceDaysForType = deviceDays['Urinary Catheter'];
      else if (type === 'VAP' || type === 'VAE') deviceDaysForType = deviceDays['Ventilator'];

      const rate = (cases / deviceDaysForType) * 1000;
      const percentile = Math.max(0, Math.min(100, 50 + ((benchmark - rate) / benchmark) * 50));

      infectionRates[type] = { rate: Math.round(rate * 100) / 100, benchmark, percentile: Math.round(percentile) };
    });

    // Hand hygiene compliance
    const handHygieneCompliance = this.calculateHandHygieneCompliance(filters?.unit);

    // Hand hygiene by unit
    const handHygieneByUnit: Record<string, number> = {};
    const hhUnits = [...new Set(this.handHygieneObs.map(o => o.unit))];
    hhUnits.forEach(unit => {
      handHygieneByUnit[unit] = this.calculateHandHygieneCompliance(unit);
    });

    // Contacts traced
    const contactsTraced = filteredCases.reduce((sum, c) => sum + c.contacts.length, 0);

    // Isolation compliance (simulated)
    const isolationCompliance = 92;

    // NHSN reporting compliance
    const nhsnCases = filteredCases.filter(c => 
      c.status === 'confirmed' && 
      ['CLABSI', 'CAUTI', 'SSI', 'VAP', 'VAE', 'CDI', 'MRSA'].includes(c.haiType)
    );
    const reportedCases = nhsnCases.filter(c => c.reportedToNHSN);
    const nhsnReportingCompliance = nhsnCases.length > 0 
      ? Math.round((reportedCases.length / nhsnCases.length) * 100)
      : 100;

    // Trend data (last 30 days)
    const trendData: { date: string; cases: number; rate: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayCases = filteredCases.filter(c => c.identifiedDate.startsWith(dateStr));
      trendData.push({
        date: dateStr,
        cases: dayCases.length,
        rate: (dayCases.length / 100) * 1000, // Per 1000 patient days (simulated)
      });
    }

    return {
      period: filters?.dateFrom && filters?.dateTo 
        ? `${filters.dateFrom} to ${filters.dateTo}`
        : 'All Time',
      totalCases: filteredCases.length,
      activeCases: activeCases.length,
      resolvedCases: resolvedCases.length,
      casesByType,
      casesByUnit,
      deviceDays,
      infectionRates,
      handHygieneCompliance,
      handHygieneByUnit,
      activeOutbreaks: this.getActiveOutbreaks().length,
      contactsTraced,
      isolationCompliance,
      nhsnReportingCompliance,
      trendData,
    };
  }

  // Generate demo data
  async generateDemoData(): Promise<void> {
    const units = ['ICU', 'Medical', 'Surgical', 'Emergency', 'Pediatrics', 'Oncology'];
    const haiTypes: HAIType[] = ['CLABSI', 'CAUTI', 'SSI', 'VAP', 'CDI', 'MRSA'];
    const pathogens = ['MRSA', 'VRE', 'C. difficile', 'E. coli', 'Pseudomonas', 'Klebsiella'];

    // Generate infection cases
    for (let i = 0; i < 25; i++) {
      const unit = units[Math.floor(Math.random() * units.length)];
      const haiType = haiTypes[Math.floor(Math.random() * haiTypes.length)];
      const pathogen = pathogens[Math.floor(Math.random() * pathogens.length)];
      const daysAgo = Math.floor(Math.random() * 60);
      const onsetDate = new Date();
      onsetDate.setDate(onsetDate.getDate() - daysAgo);

      await this.createCase({
        patientId: `PAT${3000 + i}`,
        patientName: `Patient ${i + 1}`,
        mrn: `MRN${100000 + i}`,
        location: 'Main Hospital',
        unit,
        room: `${Math.floor(Math.random() * 50) + 100}`,
        bed: ['A', 'B'][Math.floor(Math.random() * 2)],
        haiType,
        pathogen,
        status: Math.random() > 0.3 ? 'confirmed' : (Math.random() > 0.5 ? 'suspected' : 'resolved'),
        isolationPrecautions: ['contact'],
        onsetDate: onsetDate.toISOString(),
        identifiedDate: new Date(onsetDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        deviceDays: Math.floor(Math.random() * 10) + 1,
        deviceType: haiType === 'CLABSI' ? 'Central Line' : (haiType === 'CAUTI' ? 'Urinary Catheter' : undefined),
        labResults: [{
          id: `lab_${Date.now()}_${i}`,
          testName: 'Culture',
          result: 'Positive',
          resultDate: onsetDate.toISOString(),
          isPositive: true,
          organism: pathogen,
        }],
        riskFactors: ['Immunocompromised', 'Prolonged hospitalization', 'Recent surgery'].slice(0, Math.floor(Math.random() * 3) + 1),
        interventions: [],
        contacts: [],
        notes: '',
        reportedToNHSN: Math.random() > 0.3,
        createdBy: 'System',
      });
    }

    // Generate hand hygiene observations
    const roles = ['Nurse', 'Physician', 'Tech', 'Aide'];
    const moments: HandHygieneObservation['moment'][] = ['before_patient', 'before_aseptic', 'after_body_fluid', 'after_patient', 'after_environment'];
    
    for (let i = 0; i < 100; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const observedAt = new Date();
      observedAt.setDate(observedAt.getDate() - daysAgo);

      await this.recordHandHygieneObservation({
        observerId: 'OBS001',
        observerName: 'Infection Control Nurse',
        unit: units[Math.floor(Math.random() * units.length)],
        staffRole: roles[Math.floor(Math.random() * roles.length)],
        moment: moments[Math.floor(Math.random() * moments.length)],
        opportunity: true,
        performed: Math.random() > 0.15, // 85% compliance
        method: Math.random() > 0.3 ? 'alcohol_rub' : 'soap_water',
        gloveUse: Math.random() > 0.5,
        observedAt: observedAt.toISOString(),
      });
    }
  }
}

export const infectionControlService = new InfectionControlService();
