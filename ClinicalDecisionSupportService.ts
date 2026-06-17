/**
 * Clinical Decision Support Service
 * Advanced rule-based alert system with sepsis detection, deterioration scoring,
 * and multi-factor correlation for maximum clinical impact
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// TYPES AND INTERFACES
// ============================================

export type AlertSeverity = 'info' | 'low' | 'moderate' | 'high' | 'critical';
export type AlertCategory = 
  | 'sepsis'
  | 'deterioration'
  | 'drug_interaction'
  | 'lab_critical'
  | 'fall_risk'
  | 'vte_prophylaxis'
  | 'antibiotic_stewardship'
  | 'renal_dosing'
  | 'cardiac'
  | 'respiratory';

export interface ClinicalAlert {
  id: string;
  patientId: string;
  patientName: string;
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  description: string;
  recommendation: string;
  evidence: AlertEvidence[];
  score?: number;
  threshold?: number;
  createdAt: number;
  acknowledgedAt?: number;
  acknowledgedBy?: string;
  escalatedAt?: number;
  resolvedAt?: number;
  resolvedBy?: string;
  autoResolved: boolean;
  suppressedUntil?: number;
  relatedAlerts: string[];
}

export interface AlertEvidence {
  type: 'vital_sign' | 'lab_result' | 'medication' | 'diagnosis' | 'assessment';
  name: string;
  value: string | number;
  unit?: string;
  normalRange?: string;
  timestamp: number;
  isAbnormal: boolean;
}

export interface SepsisScreening {
  patientId: string;
  qSOFA: QSOFAScore;
  SIRS: SIRSCriteria;
  lactate?: number;
  suspectedInfection: boolean;
  sepsisLikelihood: 'low' | 'moderate' | 'high' | 'septic_shock';
  recommendations: string[];
  timestamp: number;
}

export interface QSOFAScore {
  respiratoryRate: boolean; // ≥22/min
  alteredMentation: boolean; // GCS <15
  systolicBP: boolean; // ≤100 mmHg
  totalScore: number; // 0-3
}

export interface SIRSCriteria {
  temperature: boolean; // >38°C or <36°C
  heartRate: boolean; // >90 bpm
  respiratoryRate: boolean; // >20/min or PaCO2 <32
  wbc: boolean; // >12,000 or <4,000 or >10% bands
  criteriaMet: number; // 0-4
}

export interface DeteriorationScore {
  patientId: string;
  scoreType: 'NEWS2' | 'MEWS' | 'PEWS';
  totalScore: number;
  riskLevel: 'low' | 'low_medium' | 'medium' | 'high';
  components: DeteriorationComponent[];
  clinicalResponse: string;
  escalationRequired: boolean;
  timestamp: number;
}

export interface DeteriorationComponent {
  parameter: string;
  value: number;
  unit: string;
  score: number;
  maxScore: number;
}

export interface FallRiskAssessment {
  patientId: string;
  morseScore: number;
  riskLevel: 'low' | 'moderate' | 'high';
  factors: FallRiskFactor[];
  interventions: string[];
  reassessmentDue: number;
}

export interface FallRiskFactor {
  factor: string;
  present: boolean;
  score: number;
}

export interface VTERiskAssessment {
  patientId: string;
  paduaScore: number;
  bleedingRisk: 'low' | 'high';
  prophylaxisIndicated: boolean;
  currentProphylaxis?: string;
  recommendation: string;
}

export interface DrugLabInteraction {
  drugName: string;
  labTest: string;
  currentLabValue: number;
  unit: string;
  interaction: string;
  recommendation: string;
  severity: AlertSeverity;
}

export interface RenalDosingAlert {
  patientId: string;
  medication: string;
  currentDose: string;
  creatinineClearance: number;
  recommendedDose: string;
  adjustmentReason: string;
}

export interface AlertRule {
  id: string;
  name: string;
  category: AlertCategory;
  enabled: boolean;
  conditions: RuleCondition[];
  severity: AlertSeverity;
  recommendation: string;
  cooldownMinutes: number;
}

export interface RuleCondition {
  parameter: string;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=' | 'between' | 'contains';
  value: number | string | boolean | [number, number];
  weight?: number;
}

export interface AlertStatistics {
  totalAlerts: number;
  byCategory: Record<AlertCategory, number>;
  bySeverity: Record<AlertSeverity, number>;
  acknowledgedRate: number;
  averageResponseTime: number;
  falsePositiveRate: number;
  alertsPerPatient: number;
}

// ============================================
// CLINICAL DECISION SUPPORT SERVICE
// ============================================

class ClinicalDecisionSupportService {
  private alerts: Map<string, ClinicalAlert> = new Map();
  private rules: Map<string, AlertRule> = new Map();
  private suppressedAlerts: Map<string, number> = new Map();
  private listeners: Set<() => void> = new Set();
  private readonly STORAGE_KEY = '@medivac_cds_alerts';
  private readonly RULES_KEY = '@medivac_cds_rules';

  constructor() {
    this.initializeDefaultRules();
    this.loadFromStorage();
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  private initializeDefaultRules(): void {
    const defaultRules: AlertRule[] = [
      // Sepsis Rules
      {
        id: 'RULE-SEPSIS-QSOFA',
        name: 'qSOFA Sepsis Screening',
        category: 'sepsis',
        enabled: true,
        conditions: [
          { parameter: 'qsofa_score', operator: '>=', value: 2 },
        ],
        severity: 'critical',
        recommendation: 'Initiate sepsis bundle: lactate, blood cultures, broad-spectrum antibiotics within 1 hour',
        cooldownMinutes: 60,
      },
      {
        id: 'RULE-SEPSIS-SIRS',
        name: 'SIRS Criteria Met',
        category: 'sepsis',
        enabled: true,
        conditions: [
          { parameter: 'sirs_criteria', operator: '>=', value: 2 },
          { parameter: 'suspected_infection', operator: '==', value: true },
        ],
        severity: 'high',
        recommendation: 'Evaluate for sepsis, consider blood cultures and lactate level',
        cooldownMinutes: 120,
      },
      // Deterioration Rules
      {
        id: 'RULE-NEWS2-HIGH',
        name: 'NEWS2 High Score',
        category: 'deterioration',
        enabled: true,
        conditions: [
          { parameter: 'news2_score', operator: '>=', value: 7 },
        ],
        severity: 'critical',
        recommendation: 'Urgent clinical review required. Consider ICU consultation.',
        cooldownMinutes: 30,
      },
      {
        id: 'RULE-NEWS2-MEDIUM',
        name: 'NEWS2 Medium Score',
        category: 'deterioration',
        enabled: true,
        conditions: [
          { parameter: 'news2_score', operator: 'between', value: [5, 6] },
        ],
        severity: 'high',
        recommendation: 'Increase monitoring frequency. Urgent assessment by clinician.',
        cooldownMinutes: 60,
      },
      // Critical Lab Values
      {
        id: 'RULE-LAB-POTASSIUM-HIGH',
        name: 'Critical Hyperkalemia',
        category: 'lab_critical',
        enabled: true,
        conditions: [
          { parameter: 'potassium', operator: '>=', value: 6.5 },
        ],
        severity: 'critical',
        recommendation: 'STAT ECG, calcium gluconate, insulin/glucose, consider dialysis',
        cooldownMinutes: 15,
      },
      {
        id: 'RULE-LAB-POTASSIUM-LOW',
        name: 'Critical Hypokalemia',
        category: 'lab_critical',
        enabled: true,
        conditions: [
          { parameter: 'potassium', operator: '<=', value: 2.5 },
        ],
        severity: 'critical',
        recommendation: 'STAT ECG, IV potassium replacement, cardiac monitoring',
        cooldownMinutes: 15,
      },
      {
        id: 'RULE-LAB-GLUCOSE-HIGH',
        name: 'Critical Hyperglycemia',
        category: 'lab_critical',
        enabled: true,
        conditions: [
          { parameter: 'glucose', operator: '>=', value: 500 },
        ],
        severity: 'critical',
        recommendation: 'Evaluate for DKA/HHS, check ketones, start IV fluids and insulin protocol',
        cooldownMinutes: 30,
      },
      {
        id: 'RULE-LAB-GLUCOSE-LOW',
        name: 'Critical Hypoglycemia',
        category: 'lab_critical',
        enabled: true,
        conditions: [
          { parameter: 'glucose', operator: '<=', value: 50 },
        ],
        severity: 'critical',
        recommendation: 'Administer D50 IV push, recheck glucose in 15 minutes',
        cooldownMinutes: 15,
      },
      {
        id: 'RULE-LAB-TROPONIN',
        name: 'Elevated Troponin',
        category: 'cardiac',
        enabled: true,
        conditions: [
          { parameter: 'troponin', operator: '>', value: 0.04 },
        ],
        severity: 'high',
        recommendation: 'Evaluate for ACS, obtain serial troponins, 12-lead ECG, cardiology consult',
        cooldownMinutes: 60,
      },
      // Fall Risk
      {
        id: 'RULE-FALL-HIGH',
        name: 'High Fall Risk',
        category: 'fall_risk',
        enabled: true,
        conditions: [
          { parameter: 'morse_score', operator: '>=', value: 45 },
        ],
        severity: 'moderate',
        recommendation: 'Implement fall precautions: bed alarm, non-slip footwear, hourly rounding',
        cooldownMinutes: 480,
      },
      // VTE Prophylaxis
      {
        id: 'RULE-VTE-MISSING',
        name: 'VTE Prophylaxis Not Ordered',
        category: 'vte_prophylaxis',
        enabled: true,
        conditions: [
          { parameter: 'padua_score', operator: '>=', value: 4 },
          { parameter: 'vte_prophylaxis_ordered', operator: '==', value: false },
        ],
        severity: 'moderate',
        recommendation: 'Patient at high VTE risk. Order pharmacological prophylaxis if no contraindications.',
        cooldownMinutes: 240,
      },
      // Antibiotic Stewardship
      {
        id: 'RULE-ABXS-DURATION',
        name: 'Prolonged Antibiotic Course',
        category: 'antibiotic_stewardship',
        enabled: true,
        conditions: [
          { parameter: 'antibiotic_days', operator: '>=', value: 7 },
        ],
        severity: 'low',
        recommendation: 'Review antibiotic necessity. Consider de-escalation or discontinuation.',
        cooldownMinutes: 1440,
      },
      {
        id: 'RULE-ABXS-CULTURE',
        name: 'Antibiotic Without Culture',
        category: 'antibiotic_stewardship',
        enabled: true,
        conditions: [
          { parameter: 'broad_spectrum_antibiotic', operator: '==', value: true },
          { parameter: 'culture_obtained', operator: '==', value: false },
        ],
        severity: 'moderate',
        recommendation: 'Obtain cultures before continuing broad-spectrum antibiotics if possible.',
        cooldownMinutes: 240,
      },
      // Renal Dosing
      {
        id: 'RULE-RENAL-ADJUSTMENT',
        name: 'Renal Dose Adjustment Needed',
        category: 'renal_dosing',
        enabled: true,
        conditions: [
          { parameter: 'creatinine_clearance', operator: '<', value: 30 },
          { parameter: 'renally_cleared_med', operator: '==', value: true },
        ],
        severity: 'high',
        recommendation: 'Adjust medication dose for renal impairment. Consult pharmacy.',
        cooldownMinutes: 240,
      },
    ];

    defaultRules.forEach(rule => {
      this.rules.set(rule.id, rule);
    });
  }

  private async loadFromStorage(): Promise<void> {
    try {
      const [alertsData, rulesData] = await Promise.all([
        AsyncStorage.getItem(this.STORAGE_KEY),
        AsyncStorage.getItem(this.RULES_KEY),
      ]);

      if (alertsData) {
        const alerts: ClinicalAlert[] = JSON.parse(alertsData);
        alerts.forEach(alert => this.alerts.set(alert.id, alert));
      }

      if (rulesData) {
        const rules: AlertRule[] = JSON.parse(rulesData);
        rules.forEach(rule => this.rules.set(rule.id, rule));
      }
    } catch (error) {
      console.error('Failed to load CDS data:', error);
    }
  }

  private async saveToStorage(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(Array.from(this.alerts.values()))),
        AsyncStorage.setItem(this.RULES_KEY, JSON.stringify(Array.from(this.rules.values()))),
      ]);
    } catch (error) {
      console.error('Failed to save CDS data:', error);
    }
  }

  // ============================================
  // SEPSIS SCREENING
  // ============================================

  calculateQSOFA(
    respiratoryRate: number,
    systolicBP: number,
    glasgowComaScale: number
  ): QSOFAScore {
    const rrCriteria = respiratoryRate >= 22;
    const bpCriteria = systolicBP <= 100;
    const gcsCriteria = glasgowComaScale < 15;

    return {
      respiratoryRate: rrCriteria,
      alteredMentation: gcsCriteria,
      systolicBP: bpCriteria,
      totalScore: [rrCriteria, bpCriteria, gcsCriteria].filter(Boolean).length,
    };
  }

  calculateSIRS(
    temperature: number,
    heartRate: number,
    respiratoryRate: number,
    wbc: number,
    paCO2?: number
  ): SIRSCriteria {
    const tempCriteria = temperature > 38 || temperature < 36;
    const hrCriteria = heartRate > 90;
    const rrCriteria = respiratoryRate > 20 || (paCO2 !== undefined && paCO2 < 32);
    const wbcCriteria = wbc > 12000 || wbc < 4000;

    return {
      temperature: tempCriteria,
      heartRate: hrCriteria,
      respiratoryRate: rrCriteria,
      wbc: wbcCriteria,
      criteriaMet: [tempCriteria, hrCriteria, rrCriteria, wbcCriteria].filter(Boolean).length,
    };
  }

  performSepsisScreening(
    patientId: string,
    vitals: {
      temperature: number;
      heartRate: number;
      respiratoryRate: number;
      systolicBP: number;
      glasgowComaScale: number;
    },
    labs: {
      wbc?: number;
      lactate?: number;
      paCO2?: number;
    },
    suspectedInfection: boolean
  ): SepsisScreening {
    const qSOFA = this.calculateQSOFA(
      vitals.respiratoryRate,
      vitals.systolicBP,
      vitals.glasgowComaScale
    );

    const SIRS = this.calculateSIRS(
      vitals.temperature,
      vitals.heartRate,
      vitals.respiratoryRate,
      labs.wbc || 8000,
      labs.paCO2
    );

    let sepsisLikelihood: SepsisScreening['sepsisLikelihood'] = 'low';
    const recommendations: string[] = [];

    // Determine sepsis likelihood
    if (qSOFA.totalScore >= 2 && suspectedInfection) {
      if (labs.lactate && labs.lactate > 2 && vitals.systolicBP < 90) {
        sepsisLikelihood = 'septic_shock';
        recommendations.push('SEPTIC SHOCK PROTOCOL: Aggressive fluid resuscitation, vasopressors, ICU admission');
        recommendations.push('Target MAP ≥65 mmHg');
        recommendations.push('Repeat lactate within 2-4 hours');
      } else {
        sepsisLikelihood = 'high';
        recommendations.push('Initiate Sepsis Bundle within 1 hour');
        recommendations.push('Obtain blood cultures x2 before antibiotics');
        recommendations.push('Administer broad-spectrum antibiotics');
        recommendations.push('Measure lactate level');
        recommendations.push('Begin fluid resuscitation: 30 mL/kg crystalloid');
      }
    } else if (SIRS.criteriaMet >= 2 && suspectedInfection) {
      sepsisLikelihood = 'moderate';
      recommendations.push('Monitor closely for sepsis progression');
      recommendations.push('Consider blood cultures');
      recommendations.push('Reassess within 2 hours');
    } else if (qSOFA.totalScore >= 1 || SIRS.criteriaMet >= 2) {
      sepsisLikelihood = 'low';
      recommendations.push('Continue monitoring');
      recommendations.push('Reassess if clinical condition changes');
    }

    // Generate alert if high risk
    if (sepsisLikelihood === 'high' || sepsisLikelihood === 'septic_shock') {
      this.generateAlert({
        patientId,
        patientName: `Patient ${patientId}`,
        category: 'sepsis',
        severity: sepsisLikelihood === 'septic_shock' ? 'critical' : 'high',
        title: sepsisLikelihood === 'septic_shock' ? 'SEPTIC SHOCK ALERT' : 'SEPSIS ALERT',
        description: `qSOFA: ${qSOFA.totalScore}/3, SIRS: ${SIRS.criteriaMet}/4${labs.lactate ? `, Lactate: ${labs.lactate}` : ''}`,
        recommendation: recommendations[0],
        evidence: [
          { type: 'vital_sign', name: 'Respiratory Rate', value: vitals.respiratoryRate, unit: '/min', timestamp: Date.now(), isAbnormal: qSOFA.respiratoryRate },
          { type: 'vital_sign', name: 'Systolic BP', value: vitals.systolicBP, unit: 'mmHg', timestamp: Date.now(), isAbnormal: qSOFA.systolicBP },
          { type: 'vital_sign', name: 'Temperature', value: vitals.temperature, unit: '°C', timestamp: Date.now(), isAbnormal: SIRS.temperature },
          { type: 'vital_sign', name: 'Heart Rate', value: vitals.heartRate, unit: 'bpm', timestamp: Date.now(), isAbnormal: SIRS.heartRate },
        ],
        score: qSOFA.totalScore,
        threshold: 2,
      });
    }

    return {
      patientId,
      qSOFA,
      SIRS,
      lactate: labs.lactate,
      suspectedInfection,
      sepsisLikelihood,
      recommendations,
      timestamp: Date.now(),
    };
  }

  // ============================================
  // DETERIORATION SCORING (NEWS2)
  // ============================================

  calculateNEWS2(
    respiratoryRate: number,
    oxygenSaturation: number,
    onSupplementalO2: boolean,
    temperature: number,
    systolicBP: number,
    heartRate: number,
    consciousness: 'alert' | 'voice' | 'pain' | 'unresponsive'
  ): DeteriorationScore {
    const components: DeteriorationComponent[] = [];
    let totalScore = 0;

    // Respiratory Rate Score
    let rrScore = 0;
    if (respiratoryRate <= 8) rrScore = 3;
    else if (respiratoryRate <= 11) rrScore = 1;
    else if (respiratoryRate <= 20) rrScore = 0;
    else if (respiratoryRate <= 24) rrScore = 2;
    else rrScore = 3;
    components.push({ parameter: 'Respiratory Rate', value: respiratoryRate, unit: '/min', score: rrScore, maxScore: 3 });
    totalScore += rrScore;

    // SpO2 Score (Scale 1 for most patients)
    let spo2Score = 0;
    if (oxygenSaturation <= 91) spo2Score = 3;
    else if (oxygenSaturation <= 93) spo2Score = 2;
    else if (oxygenSaturation <= 95) spo2Score = 1;
    else spo2Score = 0;
    components.push({ parameter: 'SpO2', value: oxygenSaturation, unit: '%', score: spo2Score, maxScore: 3 });
    totalScore += spo2Score;

    // Supplemental O2 Score
    const o2Score = onSupplementalO2 ? 2 : 0;
    components.push({ parameter: 'Supplemental O2', value: onSupplementalO2 ? 1 : 0, unit: '', score: o2Score, maxScore: 2 });
    totalScore += o2Score;

    // Temperature Score
    let tempScore = 0;
    if (temperature <= 35.0) tempScore = 3;
    else if (temperature <= 36.0) tempScore = 1;
    else if (temperature <= 38.0) tempScore = 0;
    else if (temperature <= 39.0) tempScore = 1;
    else tempScore = 2;
    components.push({ parameter: 'Temperature', value: temperature, unit: '°C', score: tempScore, maxScore: 3 });
    totalScore += tempScore;

    // Systolic BP Score
    let bpScore = 0;
    if (systolicBP <= 90) bpScore = 3;
    else if (systolicBP <= 100) bpScore = 2;
    else if (systolicBP <= 110) bpScore = 1;
    else if (systolicBP <= 219) bpScore = 0;
    else bpScore = 3;
    components.push({ parameter: 'Systolic BP', value: systolicBP, unit: 'mmHg', score: bpScore, maxScore: 3 });
    totalScore += bpScore;

    // Heart Rate Score
    let hrScore = 0;
    if (heartRate <= 40) hrScore = 3;
    else if (heartRate <= 50) hrScore = 1;
    else if (heartRate <= 90) hrScore = 0;
    else if (heartRate <= 110) hrScore = 1;
    else if (heartRate <= 130) hrScore = 2;
    else hrScore = 3;
    components.push({ parameter: 'Heart Rate', value: heartRate, unit: 'bpm', score: hrScore, maxScore: 3 });
    totalScore += hrScore;

    // Consciousness Score
    const consciousnessMap: Record<string, number> = {
      alert: 0,
      voice: 3,
      pain: 3,
      unresponsive: 3,
    };
    const consciousnessScore = consciousnessMap[consciousness];
    components.push({ parameter: 'Consciousness', value: consciousness === 'alert' ? 0 : 1, unit: 'AVPU', score: consciousnessScore, maxScore: 3 });
    totalScore += consciousnessScore;

    // Determine risk level and response
    let riskLevel: DeteriorationScore['riskLevel'];
    let clinicalResponse: string;
    let escalationRequired = false;

    if (totalScore >= 7 || consciousnessScore === 3) {
      riskLevel = 'high';
      clinicalResponse = 'Emergency response: Immediate assessment by clinical team with critical care competencies';
      escalationRequired = true;
    } else if (totalScore >= 5) {
      riskLevel = 'medium';
      clinicalResponse = 'Urgent response: Urgent assessment by clinician with competence in acute illness';
      escalationRequired = true;
    } else if (totalScore >= 1) {
      riskLevel = 'low_medium';
      clinicalResponse = 'Low-medium response: Assessment by ward-based doctor who may escalate care';
      escalationRequired = false;
    } else {
      riskLevel = 'low';
      clinicalResponse = 'Continue routine monitoring';
      escalationRequired = false;
    }

    return {
      patientId: '',
      scoreType: 'NEWS2',
      totalScore,
      riskLevel,
      components,
      clinicalResponse,
      escalationRequired,
      timestamp: Date.now(),
    };
  }

  // ============================================
  // FALL RISK ASSESSMENT (MORSE SCALE)
  // ============================================

  calculateMorseFallRisk(
    historyOfFalling: boolean,
    secondaryDiagnosis: boolean,
    ambulatoryAid: 'none' | 'crutches_cane_walker' | 'furniture',
    ivTherapy: boolean,
    gait: 'normal' | 'weak' | 'impaired',
    mentalStatus: 'oriented' | 'forgets_limitations'
  ): FallRiskAssessment {
    const factors: FallRiskFactor[] = [];
    let totalScore = 0;

    // History of falling
    const fallHistoryScore = historyOfFalling ? 25 : 0;
    factors.push({ factor: 'History of falling', present: historyOfFalling, score: fallHistoryScore });
    totalScore += fallHistoryScore;

    // Secondary diagnosis
    const diagnosisScore = secondaryDiagnosis ? 15 : 0;
    factors.push({ factor: 'Secondary diagnosis', present: secondaryDiagnosis, score: diagnosisScore });
    totalScore += diagnosisScore;

    // Ambulatory aid
    const aidScores: Record<string, number> = {
      none: 0,
      crutches_cane_walker: 15,
      furniture: 30,
    };
    const aidScore = aidScores[ambulatoryAid];
    factors.push({ factor: 'Ambulatory aid', present: ambulatoryAid !== 'none', score: aidScore });
    totalScore += aidScore;

    // IV therapy
    const ivScore = ivTherapy ? 20 : 0;
    factors.push({ factor: 'IV therapy/heparin lock', present: ivTherapy, score: ivScore });
    totalScore += ivScore;

    // Gait
    const gaitScores: Record<string, number> = {
      normal: 0,
      weak: 10,
      impaired: 20,
    };
    const gaitScore = gaitScores[gait];
    factors.push({ factor: 'Gait', present: gait !== 'normal', score: gaitScore });
    totalScore += gaitScore;

    // Mental status
    const mentalScore = mentalStatus === 'forgets_limitations' ? 15 : 0;
    factors.push({ factor: 'Mental status', present: mentalStatus === 'forgets_limitations', score: mentalScore });
    totalScore += mentalScore;

    // Determine risk level
    let riskLevel: FallRiskAssessment['riskLevel'];
    const interventions: string[] = [];

    if (totalScore >= 45) {
      riskLevel = 'high';
      interventions.push('Implement high fall risk interventions');
      interventions.push('Place fall risk sign on door');
      interventions.push('Apply yellow fall risk wristband');
      interventions.push('Activate bed/chair alarm');
      interventions.push('Keep bed in lowest position');
      interventions.push('Ensure call light within reach');
      interventions.push('Non-slip footwear');
      interventions.push('Hourly rounding');
      interventions.push('Consider 1:1 sitter if needed');
    } else if (totalScore >= 25) {
      riskLevel = 'moderate';
      interventions.push('Implement standard fall precautions');
      interventions.push('Keep bed in low position');
      interventions.push('Ensure call light within reach');
      interventions.push('Non-slip footwear');
      interventions.push('Assist with ambulation');
    } else {
      riskLevel = 'low';
      interventions.push('Good basic nursing care');
      interventions.push('Orient to environment');
    }

    return {
      patientId: '',
      morseScore: totalScore,
      riskLevel,
      factors,
      interventions,
      reassessmentDue: Date.now() + (riskLevel === 'high' ? 8 : 24) * 60 * 60 * 1000,
    };
  }

  // ============================================
  // VTE RISK ASSESSMENT (PADUA SCORE)
  // ============================================

  calculateVTERisk(
    activeCancer: boolean,
    previousVTE: boolean,
    reducedMobility: boolean,
    knownThrombophilia: boolean,
    recentTrauma: boolean,
    age75Plus: boolean,
    heartFailure: boolean,
    respiratoryFailure: boolean,
    acuteMI: boolean,
    stroke: boolean,
    acuteInfection: boolean,
    rheumatologicDisorder: boolean,
    obesity: boolean,
    ongoingHormones: boolean
  ): VTERiskAssessment {
    let score = 0;

    if (activeCancer) score += 3;
    if (previousVTE) score += 3;
    if (reducedMobility) score += 3;
    if (knownThrombophilia) score += 3;
    if (recentTrauma) score += 2;
    if (age75Plus) score += 1;
    if (heartFailure || respiratoryFailure) score += 1;
    if (acuteMI || stroke) score += 1;
    if (acuteInfection || rheumatologicDisorder) score += 1;
    if (obesity) score += 1;
    if (ongoingHormones) score += 1;

    const prophylaxisIndicated = score >= 4;
    let recommendation: string;

    if (score >= 4) {
      recommendation = 'High VTE risk (Padua ≥4). Pharmacological prophylaxis recommended unless contraindicated.';
    } else {
      recommendation = 'Low VTE risk (Padua <4). Mechanical prophylaxis may be considered.';
    }

    return {
      patientId: '',
      paduaScore: score,
      bleedingRisk: 'low', // Would need separate bleeding risk assessment
      prophylaxisIndicated,
      recommendation,
    };
  }

  // ============================================
  // ALERT GENERATION AND MANAGEMENT
  // ============================================

  generateAlert(params: {
    patientId: string;
    patientName: string;
    category: AlertCategory;
    severity: AlertSeverity;
    title: string;
    description: string;
    recommendation: string;
    evidence: AlertEvidence[];
    score?: number;
    threshold?: number;
  }): ClinicalAlert {
    const alertKey = `${params.patientId}-${params.category}`;
    
    // Check if alert is suppressed
    const suppressedUntil = this.suppressedAlerts.get(alertKey);
    if (suppressedUntil && Date.now() < suppressedUntil) {
      const existingAlert = Array.from(this.alerts.values()).find(
        a => a.patientId === params.patientId && a.category === params.category && !a.resolvedAt
      );
      if (existingAlert) return existingAlert;
    }

    const alert: ClinicalAlert = {
      id: `ALERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...params,
      createdAt: Date.now(),
      autoResolved: false,
      relatedAlerts: [],
    };

    // Find related alerts
    const relatedAlerts = Array.from(this.alerts.values()).filter(
      a => a.patientId === params.patientId && !a.resolvedAt && a.id !== alert.id
    );
    alert.relatedAlerts = relatedAlerts.map(a => a.id);

    this.alerts.set(alert.id, alert);
    this.saveToStorage();
    this.notifyListeners();

    return alert;
  }

  acknowledgeAlert(alertId: string, acknowledgedBy: string): void {
    const alert = this.alerts.get(alertId);
    if (alert && !alert.acknowledgedAt) {
      alert.acknowledgedAt = Date.now();
      alert.acknowledgedBy = acknowledgedBy;
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  resolveAlert(alertId: string, resolvedBy: string, autoResolved = false): void {
    const alert = this.alerts.get(alertId);
    if (alert && !alert.resolvedAt) {
      alert.resolvedAt = Date.now();
      alert.resolvedBy = resolvedBy;
      alert.autoResolved = autoResolved;
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  suppressAlert(alertId: string, durationMinutes: number): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      const alertKey = `${alert.patientId}-${alert.category}`;
      const suppressedUntil = Date.now() + durationMinutes * 60 * 1000;
      this.suppressedAlerts.set(alertKey, suppressedUntil);
      alert.suppressedUntil = suppressedUntil;
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  escalateAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert && !alert.escalatedAt) {
      alert.escalatedAt = Date.now();
      // Increase severity if not already critical
      if (alert.severity !== 'critical') {
        const severityOrder: AlertSeverity[] = ['info', 'low', 'moderate', 'high', 'critical'];
        const currentIndex = severityOrder.indexOf(alert.severity);
        if (currentIndex < severityOrder.length - 1) {
          alert.severity = severityOrder[currentIndex + 1];
        }
      }
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  // ============================================
  // QUERY METHODS
  // ============================================

  getActiveAlerts(): ClinicalAlert[] {
    return Array.from(this.alerts.values())
      .filter(a => !a.resolvedAt)
      .sort((a, b) => {
        const severityOrder: Record<AlertSeverity, number> = {
          critical: 0,
          high: 1,
          moderate: 2,
          low: 3,
          info: 4,
        };
        const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
        if (severityDiff !== 0) return severityDiff;
        return b.createdAt - a.createdAt;
      });
  }

  getAlertsByPatient(patientId: string): ClinicalAlert[] {
    return Array.from(this.alerts.values())
      .filter(a => a.patientId === patientId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  getAlertsByCategory(category: AlertCategory): ClinicalAlert[] {
    return Array.from(this.alerts.values())
      .filter(a => a.category === category && !a.resolvedAt)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  getCriticalAlerts(): ClinicalAlert[] {
    return this.getActiveAlerts().filter(a => a.severity === 'critical');
  }

  getAlertStatistics(): AlertStatistics {
    const allAlerts = Array.from(this.alerts.values());
    const last24Hours = allAlerts.filter(a => a.createdAt > Date.now() - 24 * 60 * 60 * 1000);
    
    const byCategory: Record<AlertCategory, number> = {
      sepsis: 0,
      deterioration: 0,
      drug_interaction: 0,
      lab_critical: 0,
      fall_risk: 0,
      vte_prophylaxis: 0,
      antibiotic_stewardship: 0,
      renal_dosing: 0,
      cardiac: 0,
      respiratory: 0,
    };

    const bySeverity: Record<AlertSeverity, number> = {
      info: 0,
      low: 0,
      moderate: 0,
      high: 0,
      critical: 0,
    };

    let acknowledgedCount = 0;
    let totalResponseTime = 0;
    let responseTimeCount = 0;

    last24Hours.forEach(alert => {
      byCategory[alert.category]++;
      bySeverity[alert.severity]++;
      if (alert.acknowledgedAt) {
        acknowledgedCount++;
        totalResponseTime += alert.acknowledgedAt - alert.createdAt;
        responseTimeCount++;
      }
    });

    const uniquePatients = new Set(last24Hours.map(a => a.patientId)).size;

    return {
      totalAlerts: last24Hours.length,
      byCategory,
      bySeverity,
      acknowledgedRate: last24Hours.length > 0 ? Math.round((acknowledgedCount / last24Hours.length) * 100) : 0,
      averageResponseTime: responseTimeCount > 0 ? Math.round(totalResponseTime / responseTimeCount / 60000) : 0,
      falsePositiveRate: 0, // Would need feedback mechanism
      alertsPerPatient: uniquePatients > 0 ? Math.round((last24Hours.length / uniquePatients) * 10) / 10 : 0,
    };
  }

  // ============================================
  // RULE MANAGEMENT
  // ============================================

  getRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }

  updateRule(ruleId: string, updates: Partial<AlertRule>): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      Object.assign(rule, updates);
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  toggleRule(ruleId: string): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = !rule.enabled;
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  getSeverityColor(severity: AlertSeverity): string {
    const colors: Record<AlertSeverity, string> = {
      info: '#6B7280',
      low: '#22C55E',
      moderate: '#F59E0B',
      high: '#F97316',
      critical: '#EF4444',
    };
    return colors[severity];
  }

  getCategoryIcon(category: AlertCategory): string {
    const icons: Record<AlertCategory, string> = {
      sepsis: '🦠',
      deterioration: '📉',
      drug_interaction: '💊',
      lab_critical: '🧪',
      fall_risk: '⚠️',
      vte_prophylaxis: '🩸',
      antibiotic_stewardship: '💉',
      renal_dosing: '🫘',
      cardiac: '❤️',
      respiratory: '🫁',
    };
    return icons[category];
  }

  getCategoryDisplayName(category: AlertCategory): string {
    const names: Record<AlertCategory, string> = {
      sepsis: 'Sepsis Alert',
      deterioration: 'Patient Deterioration',
      drug_interaction: 'Drug Interaction',
      lab_critical: 'Critical Lab Value',
      fall_risk: 'Fall Risk',
      vte_prophylaxis: 'VTE Prophylaxis',
      antibiotic_stewardship: 'Antibiotic Stewardship',
      renal_dosing: 'Renal Dosing',
      cardiac: 'Cardiac Alert',
      respiratory: 'Respiratory Alert',
    };
    return names[category];
  }

  // ============================================
  // SUBSCRIPTION
  // ============================================

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
}

export const clinicalDecisionSupportService = new ClinicalDecisionSupportService();
