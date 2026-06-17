/**
 * Computerized Physician Order Entry (CPOE) Service
 * MediVac One v3.4 - Clinical Decision Support and Order Management
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Order Types
export type OrderType = 
  | 'medication'
  | 'laboratory'
  | 'imaging'
  | 'procedure'
  | 'consult'
  | 'diet'
  | 'activity'
  | 'nursing'
  | 'respiratory'
  | 'iv_fluid';

export type OrderStatus = 
  | 'draft'
  | 'pending_verification'
  | 'verified'
  | 'active'
  | 'completed'
  | 'discontinued'
  | 'cancelled'
  | 'on_hold';

export type OrderPriority = 'routine' | 'urgent' | 'stat' | 'asap' | 'timed';

export type AlertSeverity = 'info' | 'warning' | 'critical' | 'contraindicated';

export interface ClinicalAlert {
  id: string;
  type: 'drug_drug' | 'drug_allergy' | 'drug_disease' | 'duplicate' | 'dose' | 'renal' | 'age' | 'pregnancy' | 'lab';
  severity: AlertSeverity;
  title: string;
  description: string;
  recommendation: string;
  interactingItems?: string[];
  overridable: boolean;
  overrideReason?: string;
  overriddenBy?: string;
  overriddenAt?: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

export interface MedicationOrder {
  drugId: string;
  drugName: string;
  genericName: string;
  drugClass: string;
  dose: number;
  doseUnit: string;
  route: string;
  frequency: string;
  duration?: number;
  durationUnit?: string;
  prn: boolean;
  prnReason?: string;
  instructions?: string;
  maxDailyDose?: number;
  startDate: string;
  endDate?: string;
  refills?: number;
}

export interface LabOrder {
  testId: string;
  testName: string;
  testCode: string;
  panel?: string;
  specimen: string;
  collectionInstructions?: string;
  fastingRequired: boolean;
  scheduledTime?: string;
}

export interface ImagingOrder {
  studyId: string;
  studyName: string;
  modality: string;
  bodyPart: string;
  contrast: boolean;
  contrastType?: string;
  clinicalIndication: string;
  transportMode?: string;
  scheduledTime?: string;
}

export interface ProcedureOrder {
  procedureId: string;
  procedureName: string;
  procedureCode: string;
  location: string;
  anesthesiaType?: string;
  preOpInstructions?: string;
  scheduledTime?: string;
}

export interface ConsultOrder {
  specialty: string;
  consultType: 'routine' | 'urgent' | 'emergent';
  reason: string;
  clinicalQuestion: string;
  urgency: string;
}

export interface Order {
  id: string;
  patientId: string;
  patientName: string;
  mrn: string;
  encounterId: string;
  orderType: OrderType;
  status: OrderStatus;
  priority: OrderPriority;
  orderDetails: MedicationOrder | LabOrder | ImagingOrder | ProcedureOrder | ConsultOrder | Record<string, any>;
  diagnosis?: string;
  diagnosisCode?: string;
  clinicalIndication: string;
  alerts: ClinicalAlert[];
  hasUnacknowledgedAlerts: boolean;
  orderSetId?: string;
  orderSetName?: string;
  orderedBy: string;
  orderedByRole: string;
  orderedAt: string;
  verifiedBy?: string;
  verifiedAt?: string;
  modifiedBy?: string;
  modifiedAt?: string;
  discontinuedBy?: string;
  discontinuedAt?: string;
  discontinueReason?: string;
  isVerbalOrder: boolean;
  verbalOrderReadBack?: boolean;
  verbalOrderAuthenticatedBy?: string;
  verbalOrderAuthenticatedAt?: string;
  notes?: string;
}

export interface OrderSet {
  id: string;
  name: string;
  description: string;
  category: string;
  diagnosis?: string;
  orders: Omit<Order, 'id' | 'patientId' | 'patientName' | 'mrn' | 'encounterId' | 'orderedBy' | 'orderedByRole' | 'orderedAt' | 'alerts' | 'hasUnacknowledgedAlerts'>[];
  active: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DrugDatabase {
  id: string;
  name: string;
  genericName: string;
  brandNames: string[];
  drugClass: string;
  controlledSubstance: boolean;
  schedule?: string;
  routes: string[];
  forms: { form: string; strengths: string[] }[];
  frequencies: string[];
  defaultDose?: { dose: number; unit: string };
  maxDailyDose?: { dose: number; unit: string };
  renalAdjustment: boolean;
  hepaticAdjustment: boolean;
  pregnancyCategory: string;
  blackBoxWarning?: string;
  interactions: { drugId: string; severity: AlertSeverity; description: string }[];
  contraindications: string[];
  allergyCrossReactivity: string[];
}

export interface PatientContext {
  patientId: string;
  allergies: { allergen: string; reaction: string; severity: string }[];
  diagnoses: { code: string; description: string }[];
  currentMedications: { drugId: string; drugName: string }[];
  recentLabs: { testName: string; value: number; unit: string; date: string; abnormal: boolean }[];
  age: number;
  weight: number;
  weightUnit: string;
  creatinineClearance?: number;
  isPregnant?: boolean;
  isBreastfeeding?: boolean;
}

export interface OrderMetrics {
  totalOrders: number;
  ordersByType: Record<OrderType, number>;
  ordersByStatus: Record<OrderStatus, number>;
  ordersByPriority: Record<OrderPriority, number>;
  alertsGenerated: number;
  alertsByType: Record<string, number>;
  alertsBySeverity: Record<AlertSeverity, number>;
  alertsOverridden: number;
  overrideRate: number;
  verbalOrders: number;
  averageVerificationTime: number;
  orderSetsUsed: number;
  duplicateOrdersPrevented: number;
}

// Storage keys
const STORAGE_KEYS = {
  ORDERS: 'medivac_cpoe_orders',
  ORDER_SETS: 'medivac_order_sets',
  DRUG_DATABASE: 'medivac_drug_database',
};

// Default drug database (subset)
const DEFAULT_DRUG_DATABASE: DrugDatabase[] = [
  {
    id: 'drug_metformin',
    name: 'Metformin',
    genericName: 'Metformin HCl',
    brandNames: ['Glucophage', 'Fortamet', 'Glumetza'],
    drugClass: 'Biguanide',
    controlledSubstance: false,
    routes: ['PO'],
    forms: [{ form: 'Tablet', strengths: ['500mg', '850mg', '1000mg'] }],
    frequencies: ['BID', 'TID', 'Daily'],
    defaultDose: { dose: 500, unit: 'mg' },
    maxDailyDose: { dose: 2550, unit: 'mg' },
    renalAdjustment: true,
    hepaticAdjustment: true,
    pregnancyCategory: 'B',
    blackBoxWarning: 'Lactic acidosis risk with renal impairment',
    interactions: [
      { drugId: 'drug_contrast', severity: 'critical', description: 'Hold metformin before and after IV contrast' },
    ],
    contraindications: ['Severe renal impairment (eGFR <30)', 'Metabolic acidosis'],
    allergyCrossReactivity: [],
  },
  {
    id: 'drug_lisinopril',
    name: 'Lisinopril',
    genericName: 'Lisinopril',
    brandNames: ['Prinivil', 'Zestril'],
    drugClass: 'ACE Inhibitor',
    controlledSubstance: false,
    routes: ['PO'],
    forms: [{ form: 'Tablet', strengths: ['2.5mg', '5mg', '10mg', '20mg', '40mg'] }],
    frequencies: ['Daily', 'BID'],
    defaultDose: { dose: 10, unit: 'mg' },
    maxDailyDose: { dose: 80, unit: 'mg' },
    renalAdjustment: true,
    hepaticAdjustment: false,
    pregnancyCategory: 'D',
    blackBoxWarning: 'Can cause fetal harm when administered to pregnant women',
    interactions: [
      { drugId: 'drug_potassium', severity: 'warning', description: 'Increased risk of hyperkalemia' },
      { drugId: 'drug_nsaid', severity: 'warning', description: 'May reduce antihypertensive effect' },
    ],
    contraindications: ['Pregnancy', 'History of angioedema with ACE inhibitors'],
    allergyCrossReactivity: ['ACE Inhibitors'],
  },
  {
    id: 'drug_warfarin',
    name: 'Warfarin',
    genericName: 'Warfarin Sodium',
    brandNames: ['Coumadin', 'Jantoven'],
    drugClass: 'Anticoagulant',
    controlledSubstance: false,
    routes: ['PO', 'IV'],
    forms: [{ form: 'Tablet', strengths: ['1mg', '2mg', '2.5mg', '3mg', '4mg', '5mg', '6mg', '7.5mg', '10mg'] }],
    frequencies: ['Daily'],
    defaultDose: { dose: 5, unit: 'mg' },
    renalAdjustment: false,
    hepaticAdjustment: true,
    pregnancyCategory: 'X',
    blackBoxWarning: 'Can cause major or fatal bleeding',
    interactions: [
      { drugId: 'drug_aspirin', severity: 'critical', description: 'Increased bleeding risk' },
      { drugId: 'drug_nsaid', severity: 'critical', description: 'Increased bleeding risk' },
      { drugId: 'drug_amiodarone', severity: 'critical', description: 'Increased INR, reduce warfarin dose' },
    ],
    contraindications: ['Pregnancy', 'Active bleeding', 'Recent surgery'],
    allergyCrossReactivity: [],
  },
  {
    id: 'drug_aspirin',
    name: 'Aspirin',
    genericName: 'Acetylsalicylic Acid',
    brandNames: ['Bayer', 'Ecotrin'],
    drugClass: 'NSAID/Antiplatelet',
    controlledSubstance: false,
    routes: ['PO', 'PR'],
    forms: [{ form: 'Tablet', strengths: ['81mg', '325mg', '500mg'] }],
    frequencies: ['Daily', 'BID', 'TID', 'Q4H PRN'],
    defaultDose: { dose: 81, unit: 'mg' },
    maxDailyDose: { dose: 4000, unit: 'mg' },
    renalAdjustment: true,
    hepaticAdjustment: true,
    pregnancyCategory: 'D',
    interactions: [
      { drugId: 'drug_warfarin', severity: 'critical', description: 'Increased bleeding risk' },
      { drugId: 'drug_methotrexate', severity: 'critical', description: 'Increased methotrexate toxicity' },
    ],
    contraindications: ['Active GI bleeding', 'Aspirin allergy', 'Children with viral illness (Reye syndrome)'],
    allergyCrossReactivity: ['NSAIDs', 'Salicylates'],
  },
  {
    id: 'drug_omeprazole',
    name: 'Omeprazole',
    genericName: 'Omeprazole',
    brandNames: ['Prilosec', 'Losec'],
    drugClass: 'Proton Pump Inhibitor',
    controlledSubstance: false,
    routes: ['PO'],
    forms: [{ form: 'Capsule', strengths: ['10mg', '20mg', '40mg'] }],
    frequencies: ['Daily', 'BID'],
    defaultDose: { dose: 20, unit: 'mg' },
    maxDailyDose: { dose: 40, unit: 'mg' },
    renalAdjustment: false,
    hepaticAdjustment: true,
    pregnancyCategory: 'C',
    interactions: [
      { drugId: 'drug_clopidogrel', severity: 'warning', description: 'May reduce clopidogrel efficacy' },
    ],
    contraindications: [],
    allergyCrossReactivity: ['PPIs'],
  },
  {
    id: 'drug_morphine',
    name: 'Morphine',
    genericName: 'Morphine Sulfate',
    brandNames: ['MS Contin', 'Roxanol'],
    drugClass: 'Opioid Analgesic',
    controlledSubstance: true,
    schedule: 'II',
    routes: ['PO', 'IV', 'IM', 'SC', 'PR'],
    forms: [
      { form: 'Tablet IR', strengths: ['15mg', '30mg'] },
      { form: 'Tablet ER', strengths: ['15mg', '30mg', '60mg', '100mg', '200mg'] },
      { form: 'Solution', strengths: ['10mg/5mL', '20mg/5mL'] },
      { form: 'Injection', strengths: ['2mg/mL', '4mg/mL', '10mg/mL'] },
    ],
    frequencies: ['Q4H', 'Q6H', 'Q8H', 'Q12H', 'PRN'],
    defaultDose: { dose: 2, unit: 'mg' },
    renalAdjustment: true,
    hepaticAdjustment: true,
    pregnancyCategory: 'C',
    blackBoxWarning: 'Risk of addiction, abuse, misuse, respiratory depression, neonatal opioid withdrawal syndrome',
    interactions: [
      { drugId: 'drug_benzodiazepine', severity: 'critical', description: 'Increased risk of respiratory depression' },
      { drugId: 'drug_maoi', severity: 'contraindicated', description: 'Serotonin syndrome risk' },
    ],
    contraindications: ['Severe respiratory depression', 'Acute or severe bronchial asthma', 'GI obstruction'],
    allergyCrossReactivity: ['Opioids'],
  },
  {
    id: 'drug_vancomycin',
    name: 'Vancomycin',
    genericName: 'Vancomycin HCl',
    brandNames: ['Vancocin'],
    drugClass: 'Glycopeptide Antibiotic',
    controlledSubstance: false,
    routes: ['IV', 'PO'],
    forms: [
      { form: 'Injection', strengths: ['500mg', '1g', '5g', '10g'] },
      { form: 'Capsule', strengths: ['125mg', '250mg'] },
    ],
    frequencies: ['Q6H', 'Q8H', 'Q12H', 'Q24H'],
    defaultDose: { dose: 1, unit: 'g' },
    renalAdjustment: true,
    hepaticAdjustment: false,
    pregnancyCategory: 'C',
    interactions: [
      { drugId: 'drug_aminoglycoside', severity: 'warning', description: 'Increased nephrotoxicity risk' },
    ],
    contraindications: ['Vancomycin hypersensitivity'],
    allergyCrossReactivity: [],
  },
  {
    id: 'drug_heparin',
    name: 'Heparin',
    genericName: 'Heparin Sodium',
    brandNames: ['Hep-Lock'],
    drugClass: 'Anticoagulant',
    controlledSubstance: false,
    routes: ['IV', 'SC'],
    forms: [
      { form: 'Injection', strengths: ['1000 units/mL', '5000 units/mL', '10000 units/mL'] },
    ],
    frequencies: ['Continuous infusion', 'Q8H', 'Q12H'],
    renalAdjustment: false,
    hepaticAdjustment: false,
    pregnancyCategory: 'C',
    blackBoxWarning: 'Not for intramuscular use. Fatal medication errors with heparin.',
    interactions: [
      { drugId: 'drug_warfarin', severity: 'critical', description: 'Increased bleeding risk' },
      { drugId: 'drug_aspirin', severity: 'critical', description: 'Increased bleeding risk' },
    ],
    contraindications: ['Active bleeding', 'Severe thrombocytopenia', 'HIT history'],
    allergyCrossReactivity: [],
  },
];

// Default order sets
const DEFAULT_ORDER_SETS: OrderSet[] = [
  {
    id: 'os_chest_pain',
    name: 'Chest Pain Workup',
    description: 'Standard order set for acute chest pain evaluation',
    category: 'Cardiology',
    diagnosis: 'Chest Pain',
    orders: [
      {
        orderType: 'laboratory',
        status: 'draft',
        priority: 'stat',
        orderDetails: { testId: 'lab_troponin', testName: 'Troponin I', testCode: '49563-0', specimen: 'Blood', fastingRequired: false },
        clinicalIndication: 'Chest pain evaluation',
        isVerbalOrder: false,
      },
      {
        orderType: 'laboratory',
        status: 'draft',
        priority: 'stat',
        orderDetails: { testId: 'lab_cbc', testName: 'CBC with Differential', testCode: '57021-8', specimen: 'Blood', fastingRequired: false },
        clinicalIndication: 'Chest pain evaluation',
        isVerbalOrder: false,
      },
      {
        orderType: 'laboratory',
        status: 'draft',
        priority: 'stat',
        orderDetails: { testId: 'lab_bmp', testName: 'Basic Metabolic Panel', testCode: '51990-0', specimen: 'Blood', fastingRequired: false },
        clinicalIndication: 'Chest pain evaluation',
        isVerbalOrder: false,
      },
      {
        orderType: 'imaging',
        status: 'draft',
        priority: 'urgent',
        orderDetails: { studyId: 'img_cxr', studyName: 'Chest X-Ray', modality: 'X-Ray', bodyPart: 'Chest', contrast: false, clinicalIndication: 'Chest pain' },
        clinicalIndication: 'Chest pain evaluation',
        isVerbalOrder: false,
      },
      {
        orderType: 'imaging',
        status: 'draft',
        priority: 'urgent',
        orderDetails: { studyId: 'img_ecg', studyName: '12-Lead ECG', modality: 'ECG', bodyPart: 'Heart', contrast: false, clinicalIndication: 'Chest pain' },
        clinicalIndication: 'Chest pain evaluation',
        isVerbalOrder: false,
      },
      {
        orderType: 'medication',
        status: 'draft',
        priority: 'stat',
        orderDetails: { drugId: 'drug_aspirin', drugName: 'Aspirin', genericName: 'Acetylsalicylic Acid', drugClass: 'Antiplatelet', dose: 325, doseUnit: 'mg', route: 'PO', frequency: 'Once', prn: false, startDate: new Date().toISOString() },
        clinicalIndication: 'ACS prophylaxis',
        isVerbalOrder: false,
      },
    ],
    active: true,
    createdBy: 'System',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'os_sepsis',
    name: 'Sepsis Bundle',
    description: 'Hour-1 sepsis bundle orders',
    category: 'Critical Care',
    diagnosis: 'Sepsis',
    orders: [
      {
        orderType: 'laboratory',
        status: 'draft',
        priority: 'stat',
        orderDetails: { testId: 'lab_lactate', testName: 'Lactate', testCode: '2524-7', specimen: 'Blood', fastingRequired: false },
        clinicalIndication: 'Sepsis workup',
        isVerbalOrder: false,
      },
      {
        orderType: 'laboratory',
        status: 'draft',
        priority: 'stat',
        orderDetails: { testId: 'lab_blood_culture', testName: 'Blood Culture x2', testCode: '600-7', specimen: 'Blood', fastingRequired: false },
        clinicalIndication: 'Sepsis workup',
        isVerbalOrder: false,
      },
      {
        orderType: 'iv_fluid',
        status: 'draft',
        priority: 'stat',
        orderDetails: { fluid: 'Normal Saline', volume: 30, volumeUnit: 'mL/kg', rate: 'Bolus', duration: 3, durationUnit: 'hours' },
        clinicalIndication: 'Fluid resuscitation for sepsis',
        isVerbalOrder: false,
      },
      {
        orderType: 'medication',
        status: 'draft',
        priority: 'stat',
        orderDetails: { drugId: 'drug_vancomycin', drugName: 'Vancomycin', genericName: 'Vancomycin HCl', drugClass: 'Antibiotic', dose: 25, doseUnit: 'mg/kg', route: 'IV', frequency: 'Q12H', prn: false, startDate: new Date().toISOString() },
        clinicalIndication: 'Empiric antibiotic for sepsis',
        isVerbalOrder: false,
      },
    ],
    active: true,
    createdBy: 'System',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'os_dvt_prophylaxis',
    name: 'DVT Prophylaxis',
    description: 'Venous thromboembolism prophylaxis for hospitalized patients',
    category: 'General',
    orders: [
      {
        orderType: 'medication',
        status: 'draft',
        priority: 'routine',
        orderDetails: { drugId: 'drug_heparin', drugName: 'Heparin', genericName: 'Heparin Sodium', drugClass: 'Anticoagulant', dose: 5000, doseUnit: 'units', route: 'SC', frequency: 'Q8H', prn: false, startDate: new Date().toISOString() },
        clinicalIndication: 'DVT prophylaxis',
        isVerbalOrder: false,
      },
      {
        orderType: 'nursing',
        status: 'draft',
        priority: 'routine',
        orderDetails: { instruction: 'Apply SCDs to bilateral lower extremities', frequency: 'Continuous while in bed' },
        clinicalIndication: 'DVT prophylaxis',
        isVerbalOrder: false,
      },
    ],
    active: true,
    createdBy: 'System',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

class CPOEService {
  private orders: Order[] = [];
  private orderSets: OrderSet[] = [];
  private drugDatabase: DrugDatabase[] = [];
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const ordersJson = await AsyncStorage.getItem(STORAGE_KEYS.ORDERS);
      this.orders = ordersJson ? JSON.parse(ordersJson) : [];

      const orderSetsJson = await AsyncStorage.getItem(STORAGE_KEYS.ORDER_SETS);
      this.orderSets = orderSetsJson ? JSON.parse(orderSetsJson) : DEFAULT_ORDER_SETS;

      const drugDbJson = await AsyncStorage.getItem(STORAGE_KEYS.DRUG_DATABASE);
      this.drugDatabase = drugDbJson ? JSON.parse(drugDbJson) : DEFAULT_DRUG_DATABASE;

      if (this.orderSets.length === 0) {
        this.orderSets = DEFAULT_ORDER_SETS;
        await this.saveOrderSets();
      }

      if (this.drugDatabase.length === 0) {
        this.drugDatabase = DEFAULT_DRUG_DATABASE;
        await this.saveDrugDatabase();
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize CPOE service:', error);
      this.orderSets = DEFAULT_ORDER_SETS;
      this.drugDatabase = DEFAULT_DRUG_DATABASE;
      this.initialized = true;
    }
  }

  private async saveOrders(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(this.orders));
  }

  private async saveOrderSets(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.ORDER_SETS, JSON.stringify(this.orderSets));
  }

  private async saveDrugDatabase(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.DRUG_DATABASE, JSON.stringify(this.drugDatabase));
  }

  // Drug Database
  getDrugDatabase(): DrugDatabase[] {
    return this.drugDatabase;
  }

  searchDrugs(query: string): DrugDatabase[] {
    const lowerQuery = query.toLowerCase();
    return this.drugDatabase.filter(drug =>
      drug.name.toLowerCase().includes(lowerQuery) ||
      drug.genericName.toLowerCase().includes(lowerQuery) ||
      drug.brandNames.some(b => b.toLowerCase().includes(lowerQuery)) ||
      drug.drugClass.toLowerCase().includes(lowerQuery)
    );
  }

  getDrug(drugId: string): DrugDatabase | undefined {
    return this.drugDatabase.find(d => d.id === drugId);
  }

  // Clinical Decision Support
  checkDrugInteractions(drugId: string, currentMedications: { drugId: string; drugName: string }[]): ClinicalAlert[] {
    const drug = this.getDrug(drugId);
    if (!drug) return [];

    const alerts: ClinicalAlert[] = [];

    // Check drug-drug interactions
    for (const interaction of drug.interactions) {
      const interactingMed = currentMedications.find(m => m.drugId === interaction.drugId);
      if (interactingMed) {
        alerts.push({
          id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'drug_drug',
          severity: interaction.severity,
          title: `Drug Interaction: ${drug.name} + ${interactingMed.drugName}`,
          description: interaction.description,
          recommendation: `Review necessity of concurrent therapy. Consider alternative medications.`,
          interactingItems: [drug.name, interactingMed.drugName],
          overridable: interaction.severity !== 'contraindicated',
          acknowledged: false,
        });
      }
    }

    return alerts;
  }

  checkDrugAllergy(drugId: string, allergies: { allergen: string; reaction: string; severity: string }[]): ClinicalAlert[] {
    const drug = this.getDrug(drugId);
    if (!drug) return [];

    const alerts: ClinicalAlert[] = [];

    for (const allergy of allergies) {
      // Direct match
      if (drug.name.toLowerCase().includes(allergy.allergen.toLowerCase()) ||
          drug.genericName.toLowerCase().includes(allergy.allergen.toLowerCase()) ||
          drug.drugClass.toLowerCase().includes(allergy.allergen.toLowerCase())) {
        alerts.push({
          id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'drug_allergy',
          severity: 'critical',
          title: `Drug Allergy Alert: ${drug.name}`,
          description: `Patient has documented allergy to ${allergy.allergen}. Previous reaction: ${allergy.reaction}`,
          recommendation: 'Do not administer. Select alternative medication.',
          interactingItems: [drug.name, allergy.allergen],
          overridable: false,
          acknowledged: false,
        });
      }

      // Cross-reactivity check
      if (drug.allergyCrossReactivity.some(cr => 
        allergy.allergen.toLowerCase().includes(cr.toLowerCase()) ||
        cr.toLowerCase().includes(allergy.allergen.toLowerCase())
      )) {
        alerts.push({
          id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'drug_allergy',
          severity: 'warning',
          title: `Cross-Reactivity Warning: ${drug.name}`,
          description: `Patient allergic to ${allergy.allergen}. ${drug.name} may have cross-reactivity.`,
          recommendation: 'Use with caution. Monitor for allergic reaction.',
          interactingItems: [drug.name, allergy.allergen],
          overridable: true,
          acknowledged: false,
        });
      }
    }

    return alerts;
  }

  checkDuplicateOrder(orderType: OrderType, orderDetails: any, patientId: string): ClinicalAlert | null {
    const existingOrders = this.orders.filter(o => 
      o.patientId === patientId &&
      o.orderType === orderType &&
      o.status === 'active'
    );

    for (const existing of existingOrders) {
      if (orderType === 'medication') {
        const existingMed = existing.orderDetails as MedicationOrder;
        const newMed = orderDetails as MedicationOrder;
        if (existingMed.drugId === newMed.drugId || existingMed.drugName === newMed.drugName) {
          return {
            id: `alert_${Date.now()}`,
            type: 'duplicate',
            severity: 'warning',
            title: `Duplicate Medication Order`,
            description: `${newMed.drugName} is already active for this patient.`,
            recommendation: 'Review existing order before placing duplicate.',
            interactingItems: [newMed.drugName],
            overridable: true,
            acknowledged: false,
          };
        }
      }
      // Add similar checks for other order types
    }

    return null;
  }

  checkRenalDosing(drugId: string, creatinineClearance?: number): ClinicalAlert | null {
    const drug = this.getDrug(drugId);
    if (!drug || !drug.renalAdjustment || !creatinineClearance) return null;

    if (creatinineClearance < 30) {
      return {
        id: `alert_${Date.now()}`,
        type: 'renal',
        severity: 'warning',
        title: `Renal Dose Adjustment Required`,
        description: `${drug.name} requires dose adjustment for CrCl ${creatinineClearance} mL/min.`,
        recommendation: 'Consult pharmacy or adjust dose per renal dosing guidelines.',
        overridable: true,
        acknowledged: false,
      };
    }

    return null;
  }

  checkPregnancyWarning(drugId: string, isPregnant?: boolean): ClinicalAlert | null {
    const drug = this.getDrug(drugId);
    if (!drug || !isPregnant) return null;

    if (drug.pregnancyCategory === 'X') {
      return {
        id: `alert_${Date.now()}`,
        type: 'pregnancy',
        severity: 'contraindicated',
        title: `Contraindicated in Pregnancy`,
        description: `${drug.name} is Category X and contraindicated in pregnancy.`,
        recommendation: 'Do not use. Select pregnancy-safe alternative.',
        overridable: false,
        acknowledged: false,
      };
    }

    if (drug.pregnancyCategory === 'D') {
      return {
        id: `alert_${Date.now()}`,
        type: 'pregnancy',
        severity: 'critical',
        title: `Pregnancy Warning`,
        description: `${drug.name} is Category D. Evidence of fetal risk exists.`,
        recommendation: 'Use only if potential benefit justifies potential risk.',
        overridable: true,
        acknowledged: false,
      };
    }

    return null;
  }

  runClinicalDecisionSupport(order: Partial<Order>, patientContext: PatientContext): ClinicalAlert[] {
    const alerts: ClinicalAlert[] = [];

    if (order.orderType === 'medication') {
      const medOrder = order.orderDetails as MedicationOrder;
      
      // Drug interactions
      alerts.push(...this.checkDrugInteractions(medOrder.drugId, patientContext.currentMedications));
      
      // Drug allergies
      alerts.push(...this.checkDrugAllergy(medOrder.drugId, patientContext.allergies));
      
      // Duplicate check
      const duplicateAlert = this.checkDuplicateOrder('medication', medOrder, patientContext.patientId);
      if (duplicateAlert) alerts.push(duplicateAlert);
      
      // Renal dosing
      const renalAlert = this.checkRenalDosing(medOrder.drugId, patientContext.creatinineClearance);
      if (renalAlert) alerts.push(renalAlert);
      
      // Pregnancy
      const pregnancyAlert = this.checkPregnancyWarning(medOrder.drugId, patientContext.isPregnant);
      if (pregnancyAlert) alerts.push(pregnancyAlert);
    }

    return alerts;
  }

  // Order Management
  async createOrder(orderData: Omit<Order, 'id' | 'orderedAt' | 'alerts' | 'hasUnacknowledgedAlerts'>, patientContext?: PatientContext): Promise<Order> {
    let alerts: ClinicalAlert[] = [];
    
    if (patientContext) {
      alerts = this.runClinicalDecisionSupport(orderData, patientContext);
    }

    const order: Order = {
      ...orderData,
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orderedAt: new Date().toISOString(),
      alerts,
      hasUnacknowledgedAlerts: alerts.some(a => !a.acknowledged && a.severity !== 'info'),
    };

    this.orders.push(order);
    await this.saveOrders();
    return order;
  }

  async updateOrder(orderId: string, updates: Partial<Order>): Promise<Order | null> {
    const index = this.orders.findIndex(o => o.id === orderId);
    if (index === -1) return null;

    this.orders[index] = {
      ...this.orders[index],
      ...updates,
      modifiedAt: new Date().toISOString(),
    };

    await this.saveOrders();
    return this.orders[index];
  }

  async verifyOrder(orderId: string, verifiedBy: string): Promise<Order | null> {
    return this.updateOrder(orderId, {
      status: 'verified',
      verifiedBy,
      verifiedAt: new Date().toISOString(),
    });
  }

  async activateOrder(orderId: string): Promise<Order | null> {
    return this.updateOrder(orderId, { status: 'active' });
  }

  async discontinueOrder(orderId: string, discontinuedBy: string, reason: string): Promise<Order | null> {
    return this.updateOrder(orderId, {
      status: 'discontinued',
      discontinuedBy,
      discontinuedAt: new Date().toISOString(),
      discontinueReason: reason,
    });
  }

  async acknowledgeAlert(orderId: string, alertId: string, acknowledgedBy: string): Promise<boolean> {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return false;

    const alert = order.alerts.find(a => a.id === alertId);
    if (!alert) return false;

    alert.acknowledged = true;
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = new Date().toISOString();

    order.hasUnacknowledgedAlerts = order.alerts.some(a => !a.acknowledged && a.severity !== 'info');
    await this.saveOrders();

    return true;
  }

  async overrideAlert(orderId: string, alertId: string, overriddenBy: string, reason: string): Promise<boolean> {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return false;

    const alert = order.alerts.find(a => a.id === alertId);
    if (!alert || !alert.overridable) return false;

    alert.overrideReason = reason;
    alert.overriddenBy = overriddenBy;
    alert.overriddenAt = new Date().toISOString();
    alert.acknowledged = true;
    alert.acknowledgedBy = overriddenBy;
    alert.acknowledgedAt = new Date().toISOString();

    order.hasUnacknowledgedAlerts = order.alerts.some(a => !a.acknowledged && a.severity !== 'info');
    await this.saveOrders();

    return true;
  }

  // Order Retrieval
  getOrders(filters?: {
    patientId?: string;
    status?: OrderStatus;
    orderType?: OrderType;
    priority?: OrderPriority;
    orderedBy?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Order[] {
    let filtered = [...this.orders];

    if (filters?.patientId) {
      filtered = filtered.filter(o => o.patientId === filters.patientId);
    }
    if (filters?.status) {
      filtered = filtered.filter(o => o.status === filters.status);
    }
    if (filters?.orderType) {
      filtered = filtered.filter(o => o.orderType === filters.orderType);
    }
    if (filters?.priority) {
      filtered = filtered.filter(o => o.priority === filters.priority);
    }
    if (filters?.orderedBy) {
      filtered = filtered.filter(o => o.orderedBy === filters.orderedBy);
    }
    if (filters?.dateFrom) {
      filtered = filtered.filter(o => o.orderedAt >= filters.dateFrom!);
    }
    if (filters?.dateTo) {
      filtered = filtered.filter(o => o.orderedAt <= filters.dateTo!);
    }

    return filtered.sort((a, b) => 
      new Date(b.orderedAt).getTime() - new Date(a.orderedAt).getTime()
    );
  }

  getOrder(orderId: string): Order | undefined {
    return this.orders.find(o => o.id === orderId);
  }

  getActiveOrders(patientId: string): Order[] {
    return this.orders.filter(o => 
      o.patientId === patientId && 
      (o.status === 'active' || o.status === 'verified')
    );
  }

  getPendingVerification(): Order[] {
    return this.orders.filter(o => o.status === 'pending_verification');
  }

  getOrdersWithAlerts(): Order[] {
    return this.orders.filter(o => o.hasUnacknowledgedAlerts);
  }

  // Order Sets
  getOrderSets(category?: string): OrderSet[] {
    if (category) {
      return this.orderSets.filter(os => os.category === category && os.active);
    }
    return this.orderSets.filter(os => os.active);
  }

  getOrderSet(orderSetId: string): OrderSet | undefined {
    return this.orderSets.find(os => os.id === orderSetId);
  }

  async applyOrderSet(orderSetId: string, patientInfo: {
    patientId: string;
    patientName: string;
    mrn: string;
    encounterId: string;
  }, orderedBy: string, orderedByRole: string, patientContext?: PatientContext): Promise<Order[]> {
    const orderSet = this.getOrderSet(orderSetId);
    if (!orderSet) return [];

    const createdOrders: Order[] = [];

    for (const orderTemplate of orderSet.orders) {
      const order = await this.createOrder({
        ...orderTemplate,
        patientId: patientInfo.patientId,
        patientName: patientInfo.patientName,
        mrn: patientInfo.mrn,
        encounterId: patientInfo.encounterId,
        orderedBy,
        orderedByRole,
        orderSetId: orderSet.id,
        orderSetName: orderSet.name,
        status: 'pending_verification',
      }, patientContext);

      createdOrders.push(order);
    }

    return createdOrders;
  }

  // Verbal Orders
  async createVerbalOrder(orderData: Omit<Order, 'id' | 'orderedAt' | 'alerts' | 'hasUnacknowledgedAlerts' | 'isVerbalOrder'>, receivedBy: string): Promise<Order> {
    const order = await this.createOrder({
      ...orderData,
      isVerbalOrder: true,
      verbalOrderReadBack: true,
      status: 'pending_verification',
    });

    return order;
  }

  async authenticateVerbalOrder(orderId: string, authenticatedBy: string): Promise<Order | null> {
    return this.updateOrder(orderId, {
      verbalOrderAuthenticatedBy: authenticatedBy,
      verbalOrderAuthenticatedAt: new Date().toISOString(),
      status: 'verified',
    });
  }

  // Metrics
  calculateMetrics(): OrderMetrics {
    const ordersByType: Record<OrderType, number> = {} as Record<OrderType, number>;
    const orderTypes: OrderType[] = ['medication', 'laboratory', 'imaging', 'procedure', 'consult', 'diet', 'activity', 'nursing', 'respiratory', 'iv_fluid'];
    orderTypes.forEach(type => {
      ordersByType[type] = this.orders.filter(o => o.orderType === type).length;
    });

    const ordersByStatus: Record<OrderStatus, number> = {} as Record<OrderStatus, number>;
    const statuses: OrderStatus[] = ['draft', 'pending_verification', 'verified', 'active', 'completed', 'discontinued', 'cancelled', 'on_hold'];
    statuses.forEach(status => {
      ordersByStatus[status] = this.orders.filter(o => o.status === status).length;
    });

    const ordersByPriority: Record<OrderPriority, number> = {} as Record<OrderPriority, number>;
    const priorities: OrderPriority[] = ['routine', 'urgent', 'stat', 'asap', 'timed'];
    priorities.forEach(priority => {
      ordersByPriority[priority] = this.orders.filter(o => o.priority === priority).length;
    });

    const allAlerts = this.orders.flatMap(o => o.alerts);
    const alertsByType: Record<string, number> = {};
    const alertsBySeverity: Record<AlertSeverity, number> = { info: 0, warning: 0, critical: 0, contraindicated: 0 };

    allAlerts.forEach(alert => {
      alertsByType[alert.type] = (alertsByType[alert.type] || 0) + 1;
      alertsBySeverity[alert.severity]++;
    });

    const overriddenAlerts = allAlerts.filter(a => a.overrideReason);
    const orderSetsUsed = this.orders.filter(o => o.orderSetId).length;
    const verbalOrders = this.orders.filter(o => o.isVerbalOrder).length;

    return {
      totalOrders: this.orders.length,
      ordersByType,
      ordersByStatus,
      ordersByPriority,
      alertsGenerated: allAlerts.length,
      alertsByType,
      alertsBySeverity,
      alertsOverridden: overriddenAlerts.length,
      overrideRate: allAlerts.length > 0 ? Math.round((overriddenAlerts.length / allAlerts.length) * 100) : 0,
      verbalOrders,
      averageVerificationTime: 15, // minutes (simulated)
      orderSetsUsed,
      duplicateOrdersPrevented: alertsByType['duplicate'] || 0,
    };
  }

  // Generate demo data
  async generateDemoData(): Promise<void> {
    const patients = [
      { id: 'PAT5001', name: 'John Smith', mrn: 'MRN500001', encounterId: 'ENC6001' },
      { id: 'PAT5002', name: 'Mary Johnson', mrn: 'MRN500002', encounterId: 'ENC6002' },
      { id: 'PAT5003', name: 'Robert Williams', mrn: 'MRN500003', encounterId: 'ENC6003' },
      { id: 'PAT5004', name: 'Patricia Brown', mrn: 'MRN500004', encounterId: 'ENC6004' },
      { id: 'PAT5005', name: 'Michael Davis', mrn: 'MRN500005', encounterId: 'ENC6005' },
    ];

    const providers = ['Dr. Anderson', 'Dr. Thompson', 'Dr. Garcia', 'Dr. Martinez', 'Dr. Robinson'];
    const priorities: OrderPriority[] = ['routine', 'urgent', 'stat'];

    for (const patient of patients) {
      // Create medication orders
      const drugs = this.drugDatabase.slice(0, 4);
      for (const drug of drugs) {
        const patientContext: PatientContext = {
          patientId: patient.id,
          allergies: Math.random() > 0.7 ? [{ allergen: 'Penicillin', reaction: 'Rash', severity: 'Moderate' }] : [],
          diagnoses: [{ code: 'I10', description: 'Hypertension' }],
          currentMedications: [],
          recentLabs: [],
          age: 45 + Math.floor(Math.random() * 30),
          weight: 60 + Math.floor(Math.random() * 40),
          weightUnit: 'kg',
          creatinineClearance: 30 + Math.floor(Math.random() * 90),
          isPregnant: false,
        };

        await this.createOrder({
          patientId: patient.id,
          patientName: patient.name,
          mrn: patient.mrn,
          encounterId: patient.encounterId,
          orderType: 'medication',
          status: ['active', 'verified', 'pending_verification'][Math.floor(Math.random() * 3)] as OrderStatus,
          priority: priorities[Math.floor(Math.random() * priorities.length)],
          orderDetails: {
            drugId: drug.id,
            drugName: drug.name,
            genericName: drug.genericName,
            drugClass: drug.drugClass,
            dose: drug.defaultDose?.dose || 10,
            doseUnit: drug.defaultDose?.unit || 'mg',
            route: drug.routes[0],
            frequency: drug.frequencies[0],
            prn: false,
            startDate: new Date().toISOString(),
          } as MedicationOrder,
          clinicalIndication: 'Treatment',
          orderedBy: providers[Math.floor(Math.random() * providers.length)],
          orderedByRole: 'Physician',
          isVerbalOrder: Math.random() > 0.9,
        }, patientContext);
      }

      // Create lab orders
      await this.createOrder({
        patientId: patient.id,
        patientName: patient.name,
        mrn: patient.mrn,
        encounterId: patient.encounterId,
        orderType: 'laboratory',
        status: 'active',
        priority: 'routine',
        orderDetails: {
          testId: 'lab_cmp',
          testName: 'Comprehensive Metabolic Panel',
          testCode: '24323-8',
          specimen: 'Blood',
          fastingRequired: true,
        } as LabOrder,
        clinicalIndication: 'Routine monitoring',
        orderedBy: providers[Math.floor(Math.random() * providers.length)],
        orderedByRole: 'Physician',
        isVerbalOrder: false,
      });
    }
  }
}

export const cpoeService = new CPOEService();
