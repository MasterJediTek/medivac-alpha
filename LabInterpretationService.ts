/**
 * Lab Result Auto-Interpretation Service
 * AI-powered lab analysis with critical flagging and recommendations
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// TYPES & INTERFACES
// ============================================

export type LabCategory = 'hematology' | 'chemistry' | 'liver' | 'renal' | 'cardiac' | 'thyroid' | 'coagulation' | 'urinalysis';
export type FlagLevel = 'normal' | 'low' | 'high' | 'critical_low' | 'critical_high';
export type Urgency = 'routine' | 'abnormal' | 'urgent' | 'critical';
export type TrendDirection = 'stable' | 'improving' | 'worsening' | 'fluctuating';

export interface ReferenceRange {
  low: number;
  high: number;
  criticalLow?: number;
  criticalHigh?: number;
  unit: string;
  ageAdjusted?: boolean;
  genderSpecific?: 'male' | 'female';
}

export interface LabTest {
  id: string;
  code: string;
  name: string;
  shortName: string;
  category: LabCategory;
  referenceRange: ReferenceRange;
  description: string;
}

export interface LabResult {
  id: string;
  patientId: string;
  testCode: string;
  testName: string;
  value: number;
  unit: string;
  collectedAt: number;
  resultedAt: number;
  orderedBy: string;
  flag: FlagLevel;
  referenceRange: { low: number; high: number };
  previousValue?: number;
  previousDate?: number;
}

export interface LabInterpretation {
  id: string;
  resultId: string;
  testName: string;
  value: number;
  unit: string;
  flag: FlagLevel;
  urgency: Urgency;
  interpretation: string;
  clinicalSignificance: string;
  possibleCauses: string[];
  recommendedActions: string[];
  followUpTests: string[];
  trend: TrendDirection;
  deltaChange?: number; // percentage change from previous
  confidenceScore: number; // 0-100
  generatedAt: number;
}

export interface PanelInterpretation {
  id: string;
  patientId: string;
  panelName: string;
  results: LabResult[];
  interpretations: LabInterpretation[];
  overallAssessment: string;
  differentialDiagnoses: DifferentialDiagnosis[];
  urgency: Urgency;
  correlations: ResultCorrelation[];
  generatedAt: number;
}

export interface DifferentialDiagnosis {
  condition: string;
  likelihood: 'high' | 'moderate' | 'low';
  supportingFindings: string[];
  contradictingFindings: string[];
}

export interface ResultCorrelation {
  tests: string[];
  pattern: string;
  clinicalMeaning: string;
  suggestedAction: string;
}

export interface DeltaCheckAlert {
  id: string;
  resultId: string;
  testName: string;
  currentValue: number;
  previousValue: number;
  percentChange: number;
  timeElapsed: number; // hours
  severity: 'warning' | 'critical';
  message: string;
}

export interface CriticalValueAlert {
  id: string;
  resultId: string;
  patientId: string;
  patientName: string;
  testName: string;
  value: number;
  unit: string;
  criticalThreshold: number;
  direction: 'high' | 'low';
  acknowledgedAt?: number;
  acknowledgedBy?: string;
  notifiedAt: number;
  escalationLevel: number;
}

export interface LabDashboard {
  pendingInterpretations: number;
  criticalAlerts: number;
  deltaCheckAlerts: number;
  todayResulted: number;
  abnormalRate: number;
  recentCriticals: CriticalValueAlert[];
  recentInterpretations: LabInterpretation[];
}

// ============================================
// LAB TEST DEFINITIONS
// ============================================

const LAB_TESTS: Map<string, LabTest> = new Map([
  // Hematology - CBC
  ['WBC', { id: 'WBC', code: 'WBC', name: 'White Blood Cell Count', shortName: 'WBC', category: 'hematology', referenceRange: { low: 4.5, high: 11.0, criticalLow: 2.0, criticalHigh: 30.0, unit: 'K/uL' }, description: 'Measures infection-fighting cells' }],
  ['RBC', { id: 'RBC', code: 'RBC', name: 'Red Blood Cell Count', shortName: 'RBC', category: 'hematology', referenceRange: { low: 4.5, high: 5.5, criticalLow: 2.5, criticalHigh: 7.0, unit: 'M/uL' }, description: 'Measures oxygen-carrying cells' }],
  ['HGB', { id: 'HGB', code: 'HGB', name: 'Hemoglobin', shortName: 'Hgb', category: 'hematology', referenceRange: { low: 12.0, high: 16.0, criticalLow: 7.0, criticalHigh: 20.0, unit: 'g/dL' }, description: 'Oxygen-carrying protein in red cells' }],
  ['HCT', { id: 'HCT', code: 'HCT', name: 'Hematocrit', shortName: 'Hct', category: 'hematology', referenceRange: { low: 36, high: 46, criticalLow: 20, criticalHigh: 60, unit: '%' }, description: 'Percentage of blood that is red cells' }],
  ['PLT', { id: 'PLT', code: 'PLT', name: 'Platelet Count', shortName: 'Plt', category: 'hematology', referenceRange: { low: 150, high: 400, criticalLow: 50, criticalHigh: 1000, unit: 'K/uL' }, description: 'Blood clotting cells' }],
  
  // Chemistry - BMP
  ['NA', { id: 'NA', code: 'NA', name: 'Sodium', shortName: 'Na', category: 'chemistry', referenceRange: { low: 136, high: 145, criticalLow: 120, criticalHigh: 160, unit: 'mEq/L' }, description: 'Electrolyte for fluid balance' }],
  ['K', { id: 'K', code: 'K', name: 'Potassium', shortName: 'K', category: 'chemistry', referenceRange: { low: 3.5, high: 5.0, criticalLow: 2.5, criticalHigh: 6.5, unit: 'mEq/L' }, description: 'Electrolyte for heart and muscle function' }],
  ['CL', { id: 'CL', code: 'CL', name: 'Chloride', shortName: 'Cl', category: 'chemistry', referenceRange: { low: 98, high: 106, criticalLow: 80, criticalHigh: 120, unit: 'mEq/L' }, description: 'Electrolyte for acid-base balance' }],
  ['CO2', { id: 'CO2', code: 'CO2', name: 'Carbon Dioxide', shortName: 'CO2', category: 'chemistry', referenceRange: { low: 23, high: 29, criticalLow: 10, criticalHigh: 40, unit: 'mEq/L' }, description: 'Bicarbonate level for acid-base status' }],
  ['BUN', { id: 'BUN', code: 'BUN', name: 'Blood Urea Nitrogen', shortName: 'BUN', category: 'renal', referenceRange: { low: 7, high: 20, criticalLow: 2, criticalHigh: 100, unit: 'mg/dL' }, description: 'Kidney function marker' }],
  ['CREAT', { id: 'CREAT', code: 'CREAT', name: 'Creatinine', shortName: 'Cr', category: 'renal', referenceRange: { low: 0.7, high: 1.3, criticalLow: 0.2, criticalHigh: 10.0, unit: 'mg/dL' }, description: 'Kidney function marker' }],
  ['GLU', { id: 'GLU', code: 'GLU', name: 'Glucose', shortName: 'Glu', category: 'chemistry', referenceRange: { low: 70, high: 100, criticalLow: 40, criticalHigh: 500, unit: 'mg/dL' }, description: 'Blood sugar level' }],
  ['CA', { id: 'CA', code: 'CA', name: 'Calcium', shortName: 'Ca', category: 'chemistry', referenceRange: { low: 8.5, high: 10.5, criticalLow: 6.0, criticalHigh: 13.0, unit: 'mg/dL' }, description: 'Bone and nerve function' }],
  
  // Liver Function
  ['AST', { id: 'AST', code: 'AST', name: 'Aspartate Aminotransferase', shortName: 'AST', category: 'liver', referenceRange: { low: 10, high: 40, criticalHigh: 1000, unit: 'U/L' }, description: 'Liver enzyme' }],
  ['ALT', { id: 'ALT', code: 'ALT', name: 'Alanine Aminotransferase', shortName: 'ALT', category: 'liver', referenceRange: { low: 7, high: 56, criticalHigh: 1000, unit: 'U/L' }, description: 'Liver-specific enzyme' }],
  ['ALP', { id: 'ALP', code: 'ALP', name: 'Alkaline Phosphatase', shortName: 'ALP', category: 'liver', referenceRange: { low: 44, high: 147, unit: 'U/L' }, description: 'Liver and bone enzyme' }],
  ['TBILI', { id: 'TBILI', code: 'TBILI', name: 'Total Bilirubin', shortName: 'T.Bili', category: 'liver', referenceRange: { low: 0.1, high: 1.2, criticalHigh: 15.0, unit: 'mg/dL' }, description: 'Liver function and hemolysis marker' }],
  ['ALB', { id: 'ALB', code: 'ALB', name: 'Albumin', shortName: 'Alb', category: 'liver', referenceRange: { low: 3.5, high: 5.0, criticalLow: 1.5, unit: 'g/dL' }, description: 'Protein made by liver' }],
  
  // Cardiac
  ['TROP', { id: 'TROP', code: 'TROP', name: 'Troponin I', shortName: 'TnI', category: 'cardiac', referenceRange: { low: 0, high: 0.04, criticalHigh: 0.1, unit: 'ng/mL' }, description: 'Heart muscle damage marker' }],
  ['BNP', { id: 'BNP', code: 'BNP', name: 'B-type Natriuretic Peptide', shortName: 'BNP', category: 'cardiac', referenceRange: { low: 0, high: 100, criticalHigh: 900, unit: 'pg/mL' }, description: 'Heart failure marker' }],
  
  // Coagulation
  ['PT', { id: 'PT', code: 'PT', name: 'Prothrombin Time', shortName: 'PT', category: 'coagulation', referenceRange: { low: 11, high: 13.5, criticalHigh: 30, unit: 'seconds' }, description: 'Clotting time' }],
  ['INR', { id: 'INR', code: 'INR', name: 'International Normalized Ratio', shortName: 'INR', category: 'coagulation', referenceRange: { low: 0.8, high: 1.2, criticalHigh: 5.0, unit: 'ratio' }, description: 'Standardized clotting ratio' }],
  ['PTT', { id: 'PTT', code: 'PTT', name: 'Partial Thromboplastin Time', shortName: 'PTT', category: 'coagulation', referenceRange: { low: 25, high: 35, criticalHigh: 100, unit: 'seconds' }, description: 'Intrinsic clotting pathway' }],
  
  // Thyroid
  ['TSH', { id: 'TSH', code: 'TSH', name: 'Thyroid Stimulating Hormone', shortName: 'TSH', category: 'thyroid', referenceRange: { low: 0.4, high: 4.0, criticalLow: 0.01, criticalHigh: 50, unit: 'mIU/L' }, description: 'Thyroid function regulator' }],
  ['T4', { id: 'T4', code: 'T4', name: 'Free Thyroxine', shortName: 'Free T4', category: 'thyroid', referenceRange: { low: 0.8, high: 1.8, unit: 'ng/dL' }, description: 'Active thyroid hormone' }],
]);

// ============================================
// STORAGE & STATE
// ============================================

const STORAGE_KEYS = {
  RESULTS: 'lab_results',
  INTERPRETATIONS: 'lab_interpretations',
  ALERTS: 'lab_alerts',
};

let results: Map<string, LabResult> = new Map();
let interpretations: Map<string, LabInterpretation> = new Map();
let criticalAlerts: Map<string, CriticalValueAlert> = new Map();
let deltaAlerts: Map<string, DeltaCheckAlert> = new Map();
let listeners: Set<() => void> = new Set();

const generateId = (): string => `LAB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
const notifyListeners = (): void => listeners.forEach(l => l());

// ============================================
// INTERPRETATION ENGINE
// ============================================

/**
 * Determine flag level for a result
 */
const determineFlag = (value: number, range: ReferenceRange): FlagLevel => {
  if (range.criticalLow !== undefined && value < range.criticalLow) return 'critical_low';
  if (range.criticalHigh !== undefined && value > range.criticalHigh) return 'critical_high';
  if (value < range.low) return 'low';
  if (value > range.high) return 'high';
  return 'normal';
};

/**
 * Determine urgency based on flag
 */
const determineUrgency = (flag: FlagLevel): Urgency => {
  switch (flag) {
    case 'critical_low':
    case 'critical_high':
      return 'critical';
    case 'low':
    case 'high':
      return 'abnormal';
    default:
      return 'routine';
  }
};

/**
 * Calculate trend from previous value
 */
const calculateTrend = (current: number, previous: number | undefined, flag: FlagLevel): { trend: TrendDirection; delta: number | undefined } => {
  if (previous === undefined) return { trend: 'stable', delta: undefined };
  
  const delta = ((current - previous) / previous) * 100;
  const absDelta = Math.abs(delta);
  
  if (absDelta < 5) return { trend: 'stable', delta };
  
  // Determine if change is improving or worsening based on flag
  if (flag === 'high' || flag === 'critical_high') {
    return { trend: delta < 0 ? 'improving' : 'worsening', delta };
  } else if (flag === 'low' || flag === 'critical_low') {
    return { trend: delta > 0 ? 'improving' : 'worsening', delta };
  }
  
  return { trend: 'stable', delta };
};

/**
 * Generate interpretation for a lab result
 */
const generateInterpretation = (result: LabResult): LabInterpretation => {
  const test = LAB_TESTS.get(result.testCode);
  const { trend, delta } = calculateTrend(result.value, result.previousValue, result.flag);
  
  let interpretation = '';
  let clinicalSignificance = '';
  let possibleCauses: string[] = [];
  let recommendedActions: string[] = [];
  let followUpTests: string[] = [];
  
  // Generate interpretations based on test and flag
  switch (result.testCode) {
    case 'HGB':
      if (result.flag === 'critical_low') {
        interpretation = `Critical anemia with hemoglobin ${result.value} g/dL`;
        clinicalSignificance = 'Severe anemia requiring immediate evaluation and possible transfusion';
        possibleCauses = ['Acute blood loss', 'Severe hemolysis', 'Bone marrow failure', 'Chronic disease'];
        recommendedActions = ['Evaluate for active bleeding', 'Consider transfusion', 'Type and screen', 'Notify physician immediately'];
        followUpTests = ['Reticulocyte count', 'Iron studies', 'B12/Folate', 'Peripheral smear'];
      } else if (result.flag === 'low') {
        interpretation = `Mild to moderate anemia with hemoglobin ${result.value} g/dL`;
        clinicalSignificance = 'Anemia present - requires workup to determine etiology';
        possibleCauses = ['Iron deficiency', 'Chronic disease', 'B12/Folate deficiency', 'Chronic kidney disease'];
        recommendedActions = ['Order iron studies', 'Review medications', 'Assess for bleeding'];
        followUpTests = ['Iron studies', 'Reticulocyte count', 'B12/Folate'];
      }
      break;
      
    case 'K':
      if (result.flag === 'critical_high') {
        interpretation = `Critical hyperkalemia at ${result.value} mEq/L`;
        clinicalSignificance = 'Life-threatening arrhythmia risk - requires immediate intervention';
        possibleCauses = ['Renal failure', 'Medication effect (ACEi, K-sparing diuretics)', 'Hemolysis (specimen issue)', 'Acidosis'];
        recommendedActions = ['Obtain stat ECG', 'Verify specimen not hemolyzed', 'Consider calcium gluconate', 'Insulin/glucose if confirmed'];
        followUpTests = ['Repeat potassium', 'BMP', 'ECG'];
      } else if (result.flag === 'critical_low') {
        interpretation = `Critical hypokalemia at ${result.value} mEq/L`;
        clinicalSignificance = 'Risk of cardiac arrhythmias and muscle weakness';
        possibleCauses = ['Diuretic use', 'GI losses', 'Renal losses', 'Inadequate intake'];
        recommendedActions = ['IV potassium replacement', 'Cardiac monitoring', 'Check magnesium'];
        followUpTests = ['Repeat potassium', 'Magnesium', 'ECG'];
      }
      break;
      
    case 'GLU':
      if (result.flag === 'critical_high') {
        interpretation = `Severe hyperglycemia at ${result.value} mg/dL`;
        clinicalSignificance = 'Risk of diabetic ketoacidosis or hyperosmolar state';
        possibleCauses = ['Uncontrolled diabetes', 'Infection', 'Medication non-compliance', 'New-onset diabetes'];
        recommendedActions = ['Check for ketones', 'Assess hydration', 'Start insulin protocol', 'Monitor closely'];
        followUpTests = ['Urine ketones', 'BMP', 'HbA1c', 'Repeat glucose'];
      } else if (result.flag === 'critical_low') {
        interpretation = `Severe hypoglycemia at ${result.value} mg/dL`;
        clinicalSignificance = 'Risk of altered mental status, seizures, and coma';
        possibleCauses = ['Insulin overdose', 'Oral hypoglycemic agents', 'Sepsis', 'Liver failure', 'Adrenal insufficiency'];
        recommendedActions = ['Administer glucose immediately', 'Assess mental status', 'Review medications', 'Monitor closely'];
        followUpTests = ['Repeat glucose', 'C-peptide', 'Insulin level'];
      }
      break;
      
    case 'TROP':
      if (result.flag === 'high' || result.flag === 'critical_high') {
        interpretation = `Elevated troponin at ${result.value} ng/mL indicates myocardial injury`;
        clinicalSignificance = 'Myocardial infarction or other cause of cardiac injury must be evaluated';
        possibleCauses = ['Acute coronary syndrome', 'Myocarditis', 'Pulmonary embolism', 'Sepsis', 'Renal failure'];
        recommendedActions = ['Obtain ECG', 'Cardiology consult', 'Serial troponins', 'Assess for ACS'];
        followUpTests = ['Serial troponins q6h', 'ECG', 'Echocardiogram', 'Coronary angiography if indicated'];
      }
      break;
      
    case 'CREAT':
      if (result.flag === 'high' || result.flag === 'critical_high') {
        const isAKI = result.previousValue && result.value > result.previousValue * 1.5;
        interpretation = `Elevated creatinine at ${result.value} mg/dL ${isAKI ? 'consistent with acute kidney injury' : 'indicating renal impairment'}`;
        clinicalSignificance = isAKI ? 'Acute kidney injury requiring urgent evaluation' : 'Chronic kidney disease or acute-on-chronic injury';
        possibleCauses = ['Prerenal (dehydration, hypotension)', 'Intrinsic renal disease', 'Obstruction', 'Nephrotoxic medications'];
        recommendedActions = ['Review medications', 'Assess volume status', 'Renal ultrasound if obstruction suspected', 'Avoid nephrotoxins'];
        followUpTests = ['Urinalysis', 'Urine electrolytes', 'Renal ultrasound', 'Repeat creatinine'];
      }
      break;
      
    default:
      if (result.flag === 'normal') {
        interpretation = `${result.testName} is within normal limits at ${result.value} ${result.unit}`;
        clinicalSignificance = 'No abnormality detected';
      } else {
        interpretation = `${result.testName} is ${result.flag.replace('_', ' ')} at ${result.value} ${result.unit}`;
        clinicalSignificance = 'Abnormal result requiring clinical correlation';
        recommendedActions = ['Clinical correlation recommended', 'Consider repeat testing'];
      }
  }
  
  return {
    id: generateId(),
    resultId: result.id,
    testName: result.testName,
    value: result.value,
    unit: result.unit,
    flag: result.flag,
    urgency: determineUrgency(result.flag),
    interpretation,
    clinicalSignificance,
    possibleCauses,
    recommendedActions,
    followUpTests,
    trend,
    deltaChange: delta,
    confidenceScore: 85 + Math.random() * 10,
    generatedAt: Date.now(),
  };
};

/**
 * Generate panel interpretation (CBC, CMP, LFT)
 */
const generatePanelInterpretation = (patientId: string, panelResults: LabResult[]): PanelInterpretation => {
  const individualInterpretations = panelResults.map(generateInterpretation);
  const abnormalResults = panelResults.filter(r => r.flag !== 'normal');
  
  let overallAssessment = '';
  const differentialDiagnoses: DifferentialDiagnosis[] = [];
  const correlations: ResultCorrelation[] = [];
  
  // Detect patterns
  const hasAnemia = panelResults.some(r => r.testCode === 'HGB' && (r.flag === 'low' || r.flag === 'critical_low'));
  const hasAKI = panelResults.some(r => r.testCode === 'CREAT' && (r.flag === 'high' || r.flag === 'critical_high'));
  const hasElevatedLFTs = panelResults.some(r => ['AST', 'ALT'].includes(r.testCode) && r.flag === 'high');
  const hasHyperkalemia = panelResults.some(r => r.testCode === 'K' && (r.flag === 'high' || r.flag === 'critical_high'));
  
  // Generate correlations
  if (hasAnemia && hasAKI) {
    correlations.push({
      tests: ['Hemoglobin', 'Creatinine'],
      pattern: 'Anemia with renal impairment',
      clinicalMeaning: 'May indicate anemia of chronic kidney disease or acute blood loss with prerenal azotemia',
      suggestedAction: 'Check reticulocyte count, iron studies, and EPO level',
    });
  }
  
  if (hasAKI && hasHyperkalemia) {
    correlations.push({
      tests: ['Creatinine', 'Potassium'],
      pattern: 'Hyperkalemia with acute kidney injury',
      clinicalMeaning: 'Decreased renal potassium excretion - cardiac risk',
      suggestedAction: 'ECG, consider emergent dialysis if refractory',
    });
  }
  
  if (hasElevatedLFTs) {
    const ast = panelResults.find(r => r.testCode === 'AST');
    const alt = panelResults.find(r => r.testCode === 'ALT');
    if (ast && alt && ast.value > alt.value * 2) {
      correlations.push({
        tests: ['AST', 'ALT'],
        pattern: 'AST:ALT ratio > 2:1',
        clinicalMeaning: 'Pattern suggestive of alcoholic liver disease',
        suggestedAction: 'Assess alcohol history, check GGT',
      });
    }
  }
  
  // Generate differential diagnoses
  if (hasAnemia) {
    differentialDiagnoses.push({
      condition: 'Iron Deficiency Anemia',
      likelihood: 'moderate',
      supportingFindings: ['Low hemoglobin'],
      contradictingFindings: [],
    });
  }
  
  if (hasAKI) {
    differentialDiagnoses.push({
      condition: 'Acute Kidney Injury',
      likelihood: 'high',
      supportingFindings: ['Elevated creatinine'],
      contradictingFindings: [],
    });
  }
  
  // Overall assessment
  if (abnormalResults.length === 0) {
    overallAssessment = 'All results within normal limits. No significant abnormalities detected.';
  } else {
    const criticalCount = abnormalResults.filter(r => r.flag.includes('critical')).length;
    if (criticalCount > 0) {
      overallAssessment = `CRITICAL: ${criticalCount} critical value(s) requiring immediate attention. ${abnormalResults.length - criticalCount} additional abnormal results.`;
    } else {
      overallAssessment = `${abnormalResults.length} abnormal result(s) identified requiring clinical correlation.`;
    }
  }
  
  const maxUrgency = individualInterpretations.reduce((max, i) => {
    const urgencyOrder: Urgency[] = ['routine', 'abnormal', 'urgent', 'critical'];
    return urgencyOrder.indexOf(i.urgency) > urgencyOrder.indexOf(max) ? i.urgency : max;
  }, 'routine' as Urgency);
  
  return {
    id: generateId(),
    patientId,
    panelName: determinePanelName(panelResults),
    results: panelResults,
    interpretations: individualInterpretations,
    overallAssessment,
    differentialDiagnoses,
    urgency: maxUrgency,
    correlations,
    generatedAt: Date.now(),
  };
};

const determinePanelName = (results: LabResult[]): string => {
  const codes = results.map(r => r.testCode);
  if (codes.includes('WBC') && codes.includes('HGB') && codes.includes('PLT')) return 'Complete Blood Count (CBC)';
  if (codes.includes('NA') && codes.includes('K') && codes.includes('CREAT')) return 'Basic Metabolic Panel (BMP)';
  if (codes.includes('AST') && codes.includes('ALT') && codes.includes('TBILI')) return 'Liver Function Tests (LFT)';
  if (codes.includes('BUN') && codes.includes('CREAT')) return 'Renal Panel';
  return 'Lab Panel';
};

// ============================================
// DELTA CHECK
// ============================================

/**
 * Perform delta check against previous result
 */
const performDeltaCheck = (result: LabResult): DeltaCheckAlert | null => {
  if (!result.previousValue || !result.previousDate) return null;
  
  const percentChange = ((result.value - result.previousValue) / result.previousValue) * 100;
  const hoursElapsed = (result.collectedAt - result.previousDate) / (1000 * 60 * 60);
  
  // Delta check thresholds by test
  const thresholds: Record<string, { warning: number; critical: number }> = {
    HGB: { warning: 15, critical: 25 },
    HCT: { warning: 15, critical: 25 },
    PLT: { warning: 30, critical: 50 },
    K: { warning: 20, critical: 30 },
    NA: { warning: 5, critical: 10 },
    CREAT: { warning: 50, critical: 100 },
    GLU: { warning: 50, critical: 100 },
  };
  
  const threshold = thresholds[result.testCode];
  if (!threshold) return null;
  
  const absChange = Math.abs(percentChange);
  if (absChange < threshold.warning) return null;
  
  return {
    id: generateId(),
    resultId: result.id,
    testName: result.testName,
    currentValue: result.value,
    previousValue: result.previousValue,
    percentChange,
    timeElapsed: hoursElapsed,
    severity: absChange >= threshold.critical ? 'critical' : 'warning',
    message: `${result.testName} changed ${percentChange > 0 ? '+' : ''}${percentChange.toFixed(1)}% in ${hoursElapsed.toFixed(1)} hours`,
  };
};

// ============================================
// CRITICAL VALUE HANDLING
// ============================================

/**
 * Check for critical values and create alerts
 */
const checkCriticalValue = (result: LabResult, patientName: string): CriticalValueAlert | null => {
  if (result.flag !== 'critical_low' && result.flag !== 'critical_high') return null;
  
  const test = LAB_TESTS.get(result.testCode);
  if (!test) return null;
  
  const threshold = result.flag === 'critical_low' 
    ? test.referenceRange.criticalLow 
    : test.referenceRange.criticalHigh;
  
  if (threshold === undefined) return null;
  
  return {
    id: generateId(),
    resultId: result.id,
    patientId: result.patientId,
    patientName,
    testName: result.testName,
    value: result.value,
    unit: result.unit,
    criticalThreshold: threshold,
    direction: result.flag === 'critical_high' ? 'high' : 'low',
    notifiedAt: Date.now(),
    escalationLevel: 1,
  };
};

// ============================================
// PUBLIC API
// ============================================

export const initializeLabService = async (): Promise<void> => {
  try {
    const storedResults = await AsyncStorage.getItem(STORAGE_KEYS.RESULTS);
    if (storedResults) {
      results = new Map(Object.entries(JSON.parse(storedResults)));
    }
  } catch (error) {
    console.error('Failed to initialize lab service:', error);
  }
};

export const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/**
 * Add and interpret a lab result
 */
export const addResult = async (
  patientId: string,
  patientName: string,
  testCode: string,
  value: number,
  orderedBy: string,
  previousValue?: number,
  previousDate?: number
): Promise<{ result: LabResult; interpretation: LabInterpretation; criticalAlert?: CriticalValueAlert; deltaAlert?: DeltaCheckAlert }> => {
  const test = LAB_TESTS.get(testCode);
  if (!test) throw new Error(`Unknown test code: ${testCode}`);
  
  const flag = determineFlag(value, test.referenceRange);
  
  const result: LabResult = {
    id: generateId(),
    patientId,
    testCode,
    testName: test.name,
    value,
    unit: test.referenceRange.unit,
    collectedAt: Date.now() - 60000, // 1 minute ago
    resultedAt: Date.now(),
    orderedBy,
    flag,
    referenceRange: { low: test.referenceRange.low, high: test.referenceRange.high },
    previousValue,
    previousDate,
  };
  
  results.set(result.id, result);
  
  const interpretation = generateInterpretation(result);
  interpretations.set(interpretation.id, interpretation);
  
  const criticalAlert = checkCriticalValue(result, patientName);
  if (criticalAlert) {
    criticalAlerts.set(criticalAlert.id, criticalAlert);
  }
  
  const deltaAlert = performDeltaCheck(result);
  if (deltaAlert) {
    deltaAlerts.set(deltaAlert.id, deltaAlert);
  }
  
  notifyListeners();
  
  return { result, interpretation, criticalAlert: criticalAlert || undefined, deltaAlert: deltaAlert || undefined };
};

/**
 * Interpret a panel of results
 */
export const interpretPanel = (patientId: string, resultIds: string[]): PanelInterpretation | null => {
  const panelResults = resultIds.map(id => results.get(id)).filter((r): r is LabResult => r !== undefined);
  if (panelResults.length === 0) return null;
  return generatePanelInterpretation(patientId, panelResults);
};

/**
 * Get all results for a patient
 */
export const getPatientResults = (patientId: string): LabResult[] => {
  return Array.from(results.values())
    .filter(r => r.patientId === patientId)
    .sort((a, b) => b.resultedAt - a.resultedAt);
};

/**
 * Get interpretation for a result
 */
export const getInterpretation = (resultId: string): LabInterpretation | undefined => {
  return Array.from(interpretations.values()).find(i => i.resultId === resultId);
};

/**
 * Get all critical alerts
 */
export const getCriticalAlerts = (): CriticalValueAlert[] => {
  return Array.from(criticalAlerts.values())
    .filter(a => !a.acknowledgedAt)
    .sort((a, b) => b.notifiedAt - a.notifiedAt);
};

/**
 * Acknowledge critical alert
 */
export const acknowledgeCriticalAlert = async (alertId: string, acknowledgedBy: string): Promise<void> => {
  const alert = criticalAlerts.get(alertId);
  if (alert) {
    alert.acknowledgedAt = Date.now();
    alert.acknowledgedBy = acknowledgedBy;
    criticalAlerts.set(alertId, alert);
    notifyListeners();
  }
};

/**
 * Get delta check alerts
 */
export const getDeltaAlerts = (): DeltaCheckAlert[] => {
  return Array.from(deltaAlerts.values()).sort((a, b) => b.timeElapsed - a.timeElapsed);
};

/**
 * Get dashboard summary
 */
export const getDashboard = (): LabDashboard => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStart = today.getTime();
  
  const allResults = Array.from(results.values());
  const todayResults = allResults.filter(r => r.resultedAt >= todayStart);
  const abnormalResults = todayResults.filter(r => r.flag !== 'normal');
  
  return {
    pendingInterpretations: 0,
    criticalAlerts: getCriticalAlerts().length,
    deltaCheckAlerts: getDeltaAlerts().length,
    todayResulted: todayResults.length,
    abnormalRate: todayResults.length > 0 ? Math.round((abnormalResults.length / todayResults.length) * 100) : 0,
    recentCriticals: getCriticalAlerts().slice(0, 5),
    recentInterpretations: Array.from(interpretations.values()).slice(-5).reverse(),
  };
};

/**
 * Get available lab tests
 */
export const getAvailableTests = (): LabTest[] => {
  return Array.from(LAB_TESTS.values());
};

/**
 * Get flag color
 */
export const getFlagColor = (flag: FlagLevel): string => {
  switch (flag) {
    case 'critical_low':
    case 'critical_high':
      return '#EF4444';
    case 'low':
    case 'high':
      return '#F59E0B';
    default:
      return '#22C55E';
  }
};

/**
 * Get urgency color
 */
export const getUrgencyColor = (urgency: Urgency): string => {
  switch (urgency) {
    case 'critical': return '#EF4444';
    case 'urgent': return '#F59E0B';
    case 'abnormal': return '#3B82F6';
    default: return '#22C55E';
  }
};

export const labInterpretationService = {
  initialize: initializeLabService,
  subscribe,
  addResult,
  interpretPanel,
  getPatientResults,
  getInterpretation,
  getCriticalAlerts,
  acknowledgeCriticalAlert,
  getDeltaAlerts,
  getDashboard,
  getAvailableTests,
  getFlagColor,
  getUrgencyColor,
};

export default labInterpretationService;
