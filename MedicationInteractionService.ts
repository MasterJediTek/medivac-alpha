/**
 * Medication Interaction Checker Service
 * Drug interaction database with real-time prescription checking
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Interaction severity levels
export type InteractionSeverity = 
  | 'minor'
  | 'moderate'
  | 'major'
  | 'contraindicated';

// Interaction type
export type InteractionType = 
  | 'drug_drug'
  | 'drug_food'
  | 'drug_disease'
  | 'drug_allergy'
  | 'duplicate_therapy';

// Drug information
export interface Drug {
  id: string;
  name: string;
  genericName: string;
  brandNames: string[];
  drugClass: string;
  category: string;
  activeIngredients: string[];
  dosageForms: string[];
  commonDosages: string[];
  warnings: string[];
  contraindications: string[];
  sideEffects: string[];
}

// Drug interaction
export interface DrugInteraction {
  id: string;
  drug1Id: string;
  drug1Name: string;
  drug2Id: string;
  drug2Name: string;
  severity: InteractionSeverity;
  type: InteractionType;
  description: string;
  mechanism: string;
  clinicalEffects: string[];
  management: string;
  documentation: 'established' | 'probable' | 'suspected' | 'possible';
  onsetTime: 'rapid' | 'delayed' | 'variable';
  references: string[];
}

// Patient medication profile
export interface PatientMedicationProfile {
  patientId: string;
  patientName: string;
  allergies: string[];
  conditions: string[];
  currentMedications: PatientMedication[];
  interactionAlerts: InteractionAlert[];
  lastUpdated: number;
}

// Patient medication
export interface PatientMedication {
  id: string;
  drugId: string;
  drugName: string;
  dosage: string;
  frequency: string;
  route: string;
  startDate: string;
  endDate?: string;
  prescribedBy: string;
  status: 'active' | 'discontinued' | 'on_hold';
  notes?: string;
}

// Interaction alert
export interface InteractionAlert {
  id: string;
  patientId: string;
  interaction: DrugInteraction;
  newDrugId: string;
  existingDrugId: string;
  severity: InteractionSeverity;
  status: 'active' | 'acknowledged' | 'overridden' | 'resolved';
  createdAt: number;
  acknowledgedAt?: number;
  acknowledgedBy?: string;
  overrideReason?: string;
  clinicalDecision?: string;
}

// Prescription check result
export interface PrescriptionCheckResult {
  drugId: string;
  drugName: string;
  patientId: string;
  isAllowed: boolean;
  interactions: DrugInteraction[];
  allergyAlerts: AllergyAlert[];
  duplicateTherapyAlerts: DuplicateTherapyAlert[];
  diseaseInteractions: DiseaseInteraction[];
  overallRisk: 'low' | 'moderate' | 'high' | 'critical';
  recommendations: string[];
}

// Allergy alert
export interface AllergyAlert {
  allergen: string;
  drugIngredient: string;
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';
  crossReactivity: boolean;
  recommendation: string;
}

// Duplicate therapy alert
export interface DuplicateTherapyAlert {
  existingDrug: string;
  newDrug: string;
  therapeuticClass: string;
  recommendation: string;
}

// Disease interaction
export interface DiseaseInteraction {
  disease: string;
  drug: string;
  severity: InteractionSeverity;
  description: string;
  recommendation: string;
}

// Interaction check history
export interface InteractionCheckHistory {
  id: string;
  patientId: string;
  drugChecked: string;
  result: PrescriptionCheckResult;
  checkedBy: string;
  checkedAt: number;
  actionTaken: 'approved' | 'rejected' | 'modified' | 'pending';
}

class MedicationInteractionService {
  private drugs: Map<string, Drug> = new Map();
  private interactions: Map<string, DrugInteraction> = new Map();
  private patientProfiles: Map<string, PatientMedicationProfile> = new Map();
  private checkHistory: InteractionCheckHistory[] = [];
  private listeners: Set<(alert: InteractionAlert) => void> = new Set();

  constructor() {
    this.initializeDrugDatabase();
    this.initializeInteractionDatabase();
    this.loadState();
  }

  // Initialize sample drug database
  private initializeDrugDatabase(): void {
    const sampleDrugs: Drug[] = [
      {
        id: 'DRUG-001',
        name: 'Warfarin',
        genericName: 'Warfarin Sodium',
        brandNames: ['Coumadin', 'Jantoven'],
        drugClass: 'Anticoagulant',
        category: 'Blood Thinners',
        activeIngredients: ['Warfarin Sodium'],
        dosageForms: ['Tablet'],
        commonDosages: ['1mg', '2mg', '2.5mg', '3mg', '4mg', '5mg', '6mg', '7.5mg', '10mg'],
        warnings: ['Bleeding risk', 'Requires INR monitoring'],
        contraindications: ['Active bleeding', 'Pregnancy'],
        sideEffects: ['Bleeding', 'Bruising', 'Nausea'],
      },
      {
        id: 'DRUG-002',
        name: 'Aspirin',
        genericName: 'Acetylsalicylic Acid',
        brandNames: ['Bayer', 'Ecotrin'],
        drugClass: 'NSAID',
        category: 'Pain Relief / Antiplatelet',
        activeIngredients: ['Acetylsalicylic Acid'],
        dosageForms: ['Tablet', 'Chewable'],
        commonDosages: ['81mg', '325mg', '500mg'],
        warnings: ['GI bleeding risk', 'Reye syndrome in children'],
        contraindications: ['Active peptic ulcer', 'Aspirin allergy'],
        sideEffects: ['GI upset', 'Bleeding', 'Tinnitus'],
      },
      {
        id: 'DRUG-003',
        name: 'Lisinopril',
        genericName: 'Lisinopril',
        brandNames: ['Prinivil', 'Zestril'],
        drugClass: 'ACE Inhibitor',
        category: 'Cardiovascular',
        activeIngredients: ['Lisinopril'],
        dosageForms: ['Tablet'],
        commonDosages: ['2.5mg', '5mg', '10mg', '20mg', '40mg'],
        warnings: ['Angioedema risk', 'Hyperkalemia'],
        contraindications: ['Pregnancy', 'History of angioedema'],
        sideEffects: ['Dry cough', 'Dizziness', 'Hyperkalemia'],
      },
      {
        id: 'DRUG-004',
        name: 'Metformin',
        genericName: 'Metformin Hydrochloride',
        brandNames: ['Glucophage', 'Fortamet'],
        drugClass: 'Biguanide',
        category: 'Antidiabetic',
        activeIngredients: ['Metformin Hydrochloride'],
        dosageForms: ['Tablet', 'Extended Release'],
        commonDosages: ['500mg', '850mg', '1000mg'],
        warnings: ['Lactic acidosis risk', 'Hold before contrast'],
        contraindications: ['Severe renal impairment', 'Metabolic acidosis'],
        sideEffects: ['GI upset', 'Diarrhea', 'Vitamin B12 deficiency'],
      },
      {
        id: 'DRUG-005',
        name: 'Potassium Chloride',
        genericName: 'Potassium Chloride',
        brandNames: ['K-Dur', 'Klor-Con'],
        drugClass: 'Electrolyte',
        category: 'Supplements',
        activeIngredients: ['Potassium Chloride'],
        dosageForms: ['Tablet', 'Liquid'],
        commonDosages: ['10mEq', '20mEq', '40mEq'],
        warnings: ['Hyperkalemia risk', 'GI ulceration'],
        contraindications: ['Hyperkalemia', 'Severe renal impairment'],
        sideEffects: ['GI upset', 'Nausea', 'Hyperkalemia'],
      },
      {
        id: 'DRUG-006',
        name: 'Simvastatin',
        genericName: 'Simvastatin',
        brandNames: ['Zocor'],
        drugClass: 'Statin',
        category: 'Cholesterol',
        activeIngredients: ['Simvastatin'],
        dosageForms: ['Tablet'],
        commonDosages: ['5mg', '10mg', '20mg', '40mg', '80mg'],
        warnings: ['Myopathy risk', 'Liver monitoring'],
        contraindications: ['Active liver disease', 'Pregnancy'],
        sideEffects: ['Muscle pain', 'Elevated liver enzymes', 'Headache'],
      },
      {
        id: 'DRUG-007',
        name: 'Amoxicillin',
        genericName: 'Amoxicillin',
        brandNames: ['Amoxil', 'Trimox'],
        drugClass: 'Penicillin Antibiotic',
        category: 'Antibiotics',
        activeIngredients: ['Amoxicillin'],
        dosageForms: ['Capsule', 'Suspension'],
        commonDosages: ['250mg', '500mg', '875mg'],
        warnings: ['Allergic reactions', 'C. diff risk'],
        contraindications: ['Penicillin allergy'],
        sideEffects: ['Diarrhea', 'Rash', 'Nausea'],
      },
      {
        id: 'DRUG-008',
        name: 'Omeprazole',
        genericName: 'Omeprazole',
        brandNames: ['Prilosec'],
        drugClass: 'Proton Pump Inhibitor',
        category: 'GI',
        activeIngredients: ['Omeprazole'],
        dosageForms: ['Capsule', 'Tablet'],
        commonDosages: ['10mg', '20mg', '40mg'],
        warnings: ['Long-term use risks', 'Magnesium deficiency'],
        contraindications: ['Hypersensitivity'],
        sideEffects: ['Headache', 'Diarrhea', 'Abdominal pain'],
      },
    ];

    sampleDrugs.forEach(drug => this.drugs.set(drug.id, drug));
  }

  // Initialize sample interaction database
  private initializeInteractionDatabase(): void {
    const sampleInteractions: DrugInteraction[] = [
      {
        id: 'INT-001',
        drug1Id: 'DRUG-001',
        drug1Name: 'Warfarin',
        drug2Id: 'DRUG-002',
        drug2Name: 'Aspirin',
        severity: 'major',
        type: 'drug_drug',
        description: 'Concurrent use increases bleeding risk significantly',
        mechanism: 'Both drugs affect hemostasis through different mechanisms. Warfarin inhibits vitamin K-dependent clotting factors while aspirin inhibits platelet aggregation.',
        clinicalEffects: ['Increased bleeding risk', 'Prolonged bleeding time', 'Risk of GI hemorrhage'],
        management: 'Avoid combination if possible. If necessary, use lowest effective aspirin dose and monitor closely for bleeding.',
        documentation: 'established',
        onsetTime: 'rapid',
        references: ['FDA Drug Safety Communication', 'Clinical Pharmacology Database'],
      },
      {
        id: 'INT-002',
        drug1Id: 'DRUG-003',
        drug1Name: 'Lisinopril',
        drug2Id: 'DRUG-005',
        drug2Name: 'Potassium Chloride',
        severity: 'major',
        type: 'drug_drug',
        description: 'ACE inhibitors can increase potassium levels; concurrent potassium supplementation may cause hyperkalemia',
        mechanism: 'ACE inhibitors reduce aldosterone secretion, leading to potassium retention. Additional potassium supplementation can cause dangerous hyperkalemia.',
        clinicalEffects: ['Hyperkalemia', 'Cardiac arrhythmias', 'Muscle weakness'],
        management: 'Monitor serum potassium closely. Avoid routine potassium supplementation unless documented hypokalemia.',
        documentation: 'established',
        onsetTime: 'delayed',
        references: ['UpToDate', 'Lexicomp'],
      },
      {
        id: 'INT-003',
        drug1Id: 'DRUG-006',
        drug1Name: 'Simvastatin',
        drug2Id: 'DRUG-008',
        drug2Name: 'Omeprazole',
        severity: 'moderate',
        type: 'drug_drug',
        description: 'Omeprazole may increase simvastatin levels through CYP3A4 inhibition',
        mechanism: 'Omeprazole weakly inhibits CYP3A4, which metabolizes simvastatin. This can lead to increased statin exposure.',
        clinicalEffects: ['Increased myopathy risk', 'Elevated statin levels'],
        management: 'Monitor for muscle pain and weakness. Consider alternative PPI or statin if symptoms develop.',
        documentation: 'probable',
        onsetTime: 'delayed',
        references: ['Drug Interaction Facts'],
      },
      {
        id: 'INT-004',
        drug1Id: 'DRUG-004',
        drug1Name: 'Metformin',
        drug2Id: 'DRUG-003',
        drug2Name: 'Lisinopril',
        severity: 'minor',
        type: 'drug_drug',
        description: 'Generally safe combination commonly used in diabetic patients',
        mechanism: 'No significant pharmacokinetic interaction. Both drugs are commonly used together in diabetic patients with hypertension.',
        clinicalEffects: ['No significant adverse interaction'],
        management: 'No dosage adjustment needed. Monitor blood glucose and blood pressure as usual.',
        documentation: 'established',
        onsetTime: 'variable',
        references: ['Clinical Guidelines'],
      },
      {
        id: 'INT-005',
        drug1Id: 'DRUG-001',
        drug1Name: 'Warfarin',
        drug2Id: 'DRUG-007',
        drug2Name: 'Amoxicillin',
        severity: 'moderate',
        type: 'drug_drug',
        description: 'Antibiotics may enhance warfarin effect by altering gut flora',
        mechanism: 'Antibiotics can reduce vitamin K-producing gut bacteria, potentially enhancing warfarin anticoagulant effect.',
        clinicalEffects: ['Increased INR', 'Increased bleeding risk'],
        management: 'Monitor INR more frequently during antibiotic course. Adjust warfarin dose as needed.',
        documentation: 'probable',
        onsetTime: 'delayed',
        references: ['Micromedex'],
      },
    ];

    sampleInteractions.forEach(int => this.interactions.set(int.id, int));
  }

  // Get all drugs
  getAllDrugs(): Drug[] {
    return Array.from(this.drugs.values());
  }

  // Get drug by ID
  getDrug(drugId: string): Drug | undefined {
    return this.drugs.get(drugId);
  }

  // Search drugs
  searchDrugs(query: string): Drug[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.drugs.values()).filter(drug =>
      drug.name.toLowerCase().includes(lowerQuery) ||
      drug.genericName.toLowerCase().includes(lowerQuery) ||
      drug.brandNames.some(b => b.toLowerCase().includes(lowerQuery))
    );
  }

  // Check for interactions between two drugs
  checkInteraction(drug1Id: string, drug2Id: string): DrugInteraction | null {
    for (const interaction of this.interactions.values()) {
      if (
        (interaction.drug1Id === drug1Id && interaction.drug2Id === drug2Id) ||
        (interaction.drug1Id === drug2Id && interaction.drug2Id === drug1Id)
      ) {
        return interaction;
      }
    }
    return null;
  }

  // Check prescription against patient profile
  async checkPrescription(
    patientId: string,
    newDrugId: string,
    checkedBy: string
  ): Promise<PrescriptionCheckResult> {
    const profile = this.patientProfiles.get(patientId);
    const newDrug = this.drugs.get(newDrugId);

    if (!newDrug) {
      throw new Error('Drug not found');
    }

    const interactions: DrugInteraction[] = [];
    const allergyAlerts: AllergyAlert[] = [];
    const duplicateTherapyAlerts: DuplicateTherapyAlert[] = [];
    const diseaseInteractions: DiseaseInteraction[] = [];
    const recommendations: string[] = [];

    if (profile) {
      // Check drug-drug interactions
      for (const med of profile.currentMedications.filter(m => m.status === 'active')) {
        const interaction = this.checkInteraction(newDrugId, med.drugId);
        if (interaction) {
          interactions.push(interaction);
        }
      }

      // Check allergies
      for (const allergy of profile.allergies) {
        const allergyLower = allergy.toLowerCase();
        if (
          newDrug.activeIngredients.some(i => i.toLowerCase().includes(allergyLower)) ||
          newDrug.drugClass.toLowerCase().includes(allergyLower)
        ) {
          allergyAlerts.push({
            allergen: allergy,
            drugIngredient: newDrug.activeIngredients.join(', '),
            severity: 'severe',
            crossReactivity: true,
            recommendation: `Patient has documented allergy to ${allergy}. Consider alternative medication.`,
          });
        }
      }

      // Check duplicate therapy
      for (const med of profile.currentMedications.filter(m => m.status === 'active')) {
        const existingDrug = this.drugs.get(med.drugId);
        if (existingDrug && existingDrug.drugClass === newDrug.drugClass && existingDrug.id !== newDrug.id) {
          duplicateTherapyAlerts.push({
            existingDrug: existingDrug.name,
            newDrug: newDrug.name,
            therapeuticClass: newDrug.drugClass,
            recommendation: `Patient already on ${existingDrug.name} from same class. Evaluate necessity of duplicate therapy.`,
          });
        }
      }

      // Check disease interactions
      for (const condition of profile.conditions) {
        const conditionLower = condition.toLowerCase();
        if (conditionLower.includes('kidney') && newDrug.contraindications.some(c => c.toLowerCase().includes('renal'))) {
          diseaseInteractions.push({
            disease: condition,
            drug: newDrug.name,
            severity: 'major',
            description: `${newDrug.name} may be contraindicated in patients with kidney disease`,
            recommendation: 'Evaluate renal function and consider dose adjustment or alternative.',
          });
        }
        if (conditionLower.includes('liver') && newDrug.contraindications.some(c => c.toLowerCase().includes('liver'))) {
          diseaseInteractions.push({
            disease: condition,
            drug: newDrug.name,
            severity: 'major',
            description: `${newDrug.name} may be contraindicated in patients with liver disease`,
            recommendation: 'Evaluate hepatic function and consider alternative medication.',
          });
        }
      }
    }

    // Calculate overall risk
    let overallRisk: 'low' | 'moderate' | 'high' | 'critical' = 'low';
    
    if (allergyAlerts.length > 0) {
      overallRisk = 'critical';
      recommendations.push('ALLERGY ALERT: Do not prescribe without careful evaluation.');
    } else if (interactions.some(i => i.severity === 'contraindicated')) {
      overallRisk = 'critical';
      recommendations.push('CONTRAINDICATED: Drug combination should be avoided.');
    } else if (interactions.some(i => i.severity === 'major')) {
      overallRisk = 'high';
      recommendations.push('MAJOR INTERACTION: Use with extreme caution and close monitoring.');
    } else if (interactions.some(i => i.severity === 'moderate') || duplicateTherapyAlerts.length > 0) {
      overallRisk = 'moderate';
      recommendations.push('MODERATE RISK: Monitor patient closely for adverse effects.');
    }

    // Add specific recommendations
    interactions.forEach(int => {
      recommendations.push(`${int.drug1Name}-${int.drug2Name}: ${int.management}`);
    });

    const result: PrescriptionCheckResult = {
      drugId: newDrugId,
      drugName: newDrug.name,
      patientId,
      isAllowed: overallRisk !== 'critical',
      interactions,
      allergyAlerts,
      duplicateTherapyAlerts,
      diseaseInteractions,
      overallRisk,
      recommendations,
    };

    // Log check history
    const historyEntry: InteractionCheckHistory = {
      id: `check-${Date.now()}`,
      patientId,
      drugChecked: newDrug.name,
      result,
      checkedBy,
      checkedAt: Date.now(),
      actionTaken: 'pending',
    };
    this.checkHistory.unshift(historyEntry);

    // Create alerts for significant interactions
    for (const interaction of interactions.filter(i => i.severity === 'major' || i.severity === 'contraindicated')) {
      const alert: InteractionAlert = {
        id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        patientId,
        interaction,
        newDrugId,
        existingDrugId: interaction.drug1Id === newDrugId ? interaction.drug2Id : interaction.drug1Id,
        severity: interaction.severity,
        status: 'active',
        createdAt: Date.now(),
      };

      if (profile) {
        profile.interactionAlerts.push(alert);
      }

      this.notifyListeners(alert);
    }

    await this.saveState();
    return result;
  }

  // Get patient medication profile
  getPatientProfile(patientId: string): PatientMedicationProfile | undefined {
    return this.patientProfiles.get(patientId);
  }

  // Create or update patient profile
  async updatePatientProfile(profile: PatientMedicationProfile): Promise<void> {
    profile.lastUpdated = Date.now();
    this.patientProfiles.set(profile.patientId, profile);
    await this.saveState();
  }

  // Add medication to patient profile
  async addMedication(patientId: string, medication: PatientMedication): Promise<void> {
    let profile = this.patientProfiles.get(patientId);
    if (!profile) {
      profile = {
        patientId,
        patientName: 'Unknown',
        allergies: [],
        conditions: [],
        currentMedications: [],
        interactionAlerts: [],
        lastUpdated: Date.now(),
      };
    }
    profile.currentMedications.push(medication);
    profile.lastUpdated = Date.now();
    this.patientProfiles.set(patientId, profile);
    await this.saveState();
  }

  // Acknowledge interaction alert
  async acknowledgeAlert(alertId: string, acknowledgedBy: string, clinicalDecision?: string): Promise<void> {
    for (const profile of this.patientProfiles.values()) {
      const alert = profile.interactionAlerts.find(a => a.id === alertId);
      if (alert) {
        alert.status = 'acknowledged';
        alert.acknowledgedAt = Date.now();
        alert.acknowledgedBy = acknowledgedBy;
        alert.clinicalDecision = clinicalDecision;
        break;
      }
    }
    await this.saveState();
  }

  // Override interaction alert
  async overrideAlert(alertId: string, overriddenBy: string, reason: string): Promise<void> {
    for (const profile of this.patientProfiles.values()) {
      const alert = profile.interactionAlerts.find(a => a.id === alertId);
      if (alert) {
        alert.status = 'overridden';
        alert.acknowledgedAt = Date.now();
        alert.acknowledgedBy = overriddenBy;
        alert.overrideReason = reason;
        break;
      }
    }
    await this.saveState();
  }

  // Get check history
  getCheckHistory(patientId?: string): InteractionCheckHistory[] {
    if (patientId) {
      return this.checkHistory.filter(h => h.patientId === patientId);
    }
    return [...this.checkHistory];
  }

  // Get active alerts
  getActiveAlerts(patientId?: string): InteractionAlert[] {
    const alerts: InteractionAlert[] = [];
    for (const profile of this.patientProfiles.values()) {
      if (!patientId || profile.patientId === patientId) {
        alerts.push(...profile.interactionAlerts.filter(a => a.status === 'active'));
      }
    }
    return alerts.sort((a, b) => b.createdAt - a.createdAt);
  }

  // Subscribe to alerts
  subscribe(listener: (alert: InteractionAlert) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Notify listeners
  private notifyListeners(alert: InteractionAlert): void {
    this.listeners.forEach(listener => listener(alert));
  }

  // Get severity color
  getSeverityColor(severity: InteractionSeverity): string {
    const colors: Record<InteractionSeverity, string> = {
      minor: '#22C55E',
      moderate: '#F59E0B',
      major: '#EF4444',
      contraindicated: '#7C3AED',
    };
    return colors[severity];
  }

  // Get severity label
  getSeverityLabel(severity: InteractionSeverity): string {
    const labels: Record<InteractionSeverity, string> = {
      minor: 'Minor',
      moderate: 'Moderate',
      major: 'Major',
      contraindicated: 'Contraindicated',
    };
    return labels[severity];
  }

  // Get risk color
  getRiskColor(risk: 'low' | 'moderate' | 'high' | 'critical'): string {
    const colors = {
      low: '#22C55E',
      moderate: '#F59E0B',
      high: '#EF4444',
      critical: '#7C3AED',
    };
    return colors[risk];
  }

  // Save state
  private async saveState(): Promise<void> {
    try {
      await AsyncStorage.setItem('patient_profiles', JSON.stringify(Array.from(this.patientProfiles.entries())));
      await AsyncStorage.setItem('interaction_check_history', JSON.stringify(this.checkHistory.slice(0, 100)));
    } catch (error) {
      console.error('Failed to save medication interaction state:', error);
    }
  }

  // Load state
  private async loadState(): Promise<void> {
    try {
      const profilesJson = await AsyncStorage.getItem('patient_profiles');
      if (profilesJson) {
        const entries = JSON.parse(profilesJson);
        entries.forEach(([key, value]: [string, PatientMedicationProfile]) => {
          this.patientProfiles.set(key, value);
        });
      }

      const historyJson = await AsyncStorage.getItem('interaction_check_history');
      if (historyJson) {
        this.checkHistory = JSON.parse(historyJson);
      }
    } catch (error) {
      console.error('Failed to load medication interaction state:', error);
    }
  }
}

// Export singleton instance
export const medicationInteractionService = new MedicationInteractionService();
export default medicationInteractionService;
