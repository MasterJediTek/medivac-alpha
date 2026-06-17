/**
 * Quality Metrics Service
 * MediVac One v3.1 - Comprehensive Healthcare Quality Dashboard
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export type MetricCategory = 'patient_safety' | 'clinical_outcomes' | 'patient_experience' | 'efficiency' | 'infection_control';
export type TrendDirection = 'improving' | 'stable' | 'declining';
export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface QualityMetric {
  id: string;
  name: string;
  category: MetricCategory;
  description: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  isPercentage: boolean;
  lowerIsBetter: boolean;
  trend: TrendDirection;
  trendPercentage: number;
  historicalData: MetricDataPoint[];
  benchmark: BenchmarkData;
  lastUpdated: Date;
}

export interface MetricDataPoint {
  date: Date;
  value: number;
  notes?: string;
}

export interface BenchmarkData {
  national: number;
  regional: number;
  topPerformer: number;
  source: string;
  lastUpdated: Date;
}

export interface HCAHPSScore {
  overallRating: number;
  recommendHospital: number;
  nursesCommunication: number;
  doctorsCommunication: number;
  responsiveness: number;
  painManagement: number;
  medicationCommunication: number;
  dischargeInformation: number;
  careTransition: number;
  cleanliness: number;
  quietness: number;
  surveyCount: number;
  responseRate: number;
}

export interface InfectionRate {
  type: 'CLABSI' | 'CAUTI' | 'SSI' | 'VAP' | 'CDI' | 'MRSA';
  name: string;
  currentRate: number;
  targetRate: number;
  nationalBenchmark: number;
  deviceDays?: number;
  patientDays?: number;
  infections: number;
  trend: TrendDirection;
  lastUpdated: Date;
}

export interface ReadmissionData {
  overall30Day: number;
  byCondition: {
    condition: string;
    rate: number;
    count: number;
    target: number;
  }[];
  byPayer: {
    payer: string;
    rate: number;
    count: number;
  }[];
  trend: TrendDirection;
  penaltyRisk: boolean;
}

export interface MortalityData {
  overallRate: number;
  expectedRate: number;
  observedToExpected: number;
  byCondition: {
    condition: string;
    observed: number;
    expected: number;
    ratio: number;
  }[];
  trend: TrendDirection;
}

export interface PatientSafetyIndicator {
  id: string;
  name: string;
  category: string;
  currentRate: number;
  targetRate: number;
  benchmark: number;
  incidents: number;
  denominator: number;
  trend: TrendDirection;
  lastIncidentDate?: Date;
}

export interface QualityAlert {
  id: string;
  metricId: string;
  metricName: string;
  severity: AlertSeverity;
  message: string;
  currentValue: number;
  threshold: number;
  createdAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolved: boolean;
}

export interface QualityImprovement {
  id: string;
  title: string;
  description: string;
  targetMetric: string;
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold';
  startDate: Date;
  targetDate: Date;
  completedDate?: Date;
  owner: string;
  team: string[];
  baselineValue: number;
  targetValue: number;
  currentValue: number;
  actions: QIAction[];
}

export interface QIAction {
  id: string;
  description: string;
  assignee: string;
  dueDate: Date;
  status: 'pending' | 'in_progress' | 'completed';
  completedDate?: Date;
}

// Storage key
const STORAGE_KEY = 'medivac_quality_metrics';

class QualityMetricsServiceClass {
  private metrics: Map<string, QualityMetric> = new Map();
  private alerts: Map<string, QualityAlert> = new Map();
  private improvements: Map<string, QualityImprovement> = new Map();
  private initialized = false;

  // Mock data for demonstration
  private mockHCAHPS: HCAHPSScore = {
    overallRating: 72,
    recommendHospital: 74,
    nursesCommunication: 81,
    doctorsCommunication: 83,
    responsiveness: 68,
    painManagement: 71,
    medicationCommunication: 65,
    dischargeInformation: 88,
    careTransition: 54,
    cleanliness: 76,
    quietness: 62,
    surveyCount: 1247,
    responseRate: 28.5,
  };

  private mockInfectionRates: InfectionRate[] = [
    { type: 'CLABSI', name: 'Central Line-Associated BSI', currentRate: 0.8, targetRate: 0.5, nationalBenchmark: 0.77, deviceDays: 2500, infections: 2, trend: 'stable', lastUpdated: new Date() },
    { type: 'CAUTI', name: 'Catheter-Associated UTI', currentRate: 1.2, targetRate: 1.0, nationalBenchmark: 1.07, deviceDays: 3200, infections: 4, trend: 'improving', lastUpdated: new Date() },
    { type: 'SSI', name: 'Surgical Site Infection', currentRate: 1.5, targetRate: 1.2, nationalBenchmark: 1.4, patientDays: 4500, infections: 7, trend: 'declining', lastUpdated: new Date() },
    { type: 'VAP', name: 'Ventilator-Associated Pneumonia', currentRate: 0.6, targetRate: 0.5, nationalBenchmark: 0.9, deviceDays: 1800, infections: 1, trend: 'improving', lastUpdated: new Date() },
    { type: 'CDI', name: 'C. difficile Infection', currentRate: 4.2, targetRate: 3.5, nationalBenchmark: 3.8, patientDays: 12000, infections: 50, trend: 'stable', lastUpdated: new Date() },
    { type: 'MRSA', name: 'MRSA Bacteremia', currentRate: 0.3, targetRate: 0.2, nationalBenchmark: 0.25, patientDays: 12000, infections: 4, trend: 'improving', lastUpdated: new Date() },
  ];

  private mockReadmission: ReadmissionData = {
    overall30Day: 14.2,
    byCondition: [
      { condition: 'Heart Failure', rate: 21.5, count: 45, target: 18.0 },
      { condition: 'Pneumonia', rate: 15.8, count: 28, target: 14.0 },
      { condition: 'AMI', rate: 16.2, count: 18, target: 15.0 },
      { condition: 'COPD', rate: 19.8, count: 32, target: 17.0 },
      { condition: 'Hip/Knee Replacement', rate: 4.8, count: 8, target: 5.0 },
    ],
    byPayer: [
      { payer: 'Medicare', rate: 16.5, count: 89 },
      { payer: 'Medicaid', rate: 18.2, count: 34 },
      { payer: 'Commercial', rate: 10.8, count: 42 },
      { payer: 'Self-Pay', rate: 22.1, count: 15 },
    ],
    trend: 'stable',
    penaltyRisk: true,
  };

  private mockMortality: MortalityData = {
    overallRate: 2.1,
    expectedRate: 2.3,
    observedToExpected: 0.91,
    byCondition: [
      { condition: 'AMI', observed: 8.2, expected: 9.1, ratio: 0.90 },
      { condition: 'Heart Failure', observed: 10.5, expected: 11.2, ratio: 0.94 },
      { condition: 'Pneumonia', observed: 11.8, expected: 12.5, ratio: 0.94 },
      { condition: 'Stroke', observed: 12.1, expected: 13.0, ratio: 0.93 },
      { condition: 'CABG', observed: 2.8, expected: 3.2, ratio: 0.88 },
    ],
    trend: 'improving',
  };

  private mockSafetyIndicators: PatientSafetyIndicator[] = [
    { id: 'PSI-01', name: 'Falls with Injury', category: 'Patient Safety', currentRate: 2.1, targetRate: 1.5, benchmark: 1.8, incidents: 12, denominator: 5700, trend: 'stable' },
    { id: 'PSI-02', name: 'Pressure Ulcers Stage 3+', category: 'Patient Safety', currentRate: 0.8, targetRate: 0.5, benchmark: 0.7, incidents: 5, denominator: 6250, trend: 'improving' },
    { id: 'PSI-03', name: 'Medication Errors', category: 'Medication Safety', currentRate: 1.2, targetRate: 0.8, benchmark: 1.0, incidents: 8, denominator: 6670, trend: 'declining' },
    { id: 'PSI-04', name: 'Wrong Site Surgery', category: 'Surgical Safety', currentRate: 0, targetRate: 0, benchmark: 0, incidents: 0, denominator: 850, trend: 'stable' },
    { id: 'PSI-05', name: 'Patient Elopement', category: 'Patient Safety', currentRate: 0.2, targetRate: 0, benchmark: 0.1, incidents: 1, denominator: 5000, trend: 'stable' },
    { id: 'PSI-06', name: 'Blood Transfusion Reactions', category: 'Clinical Safety', currentRate: 0.5, targetRate: 0.3, benchmark: 0.4, incidents: 3, denominator: 6000, trend: 'stable' },
  ];

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.metrics) {
          data.metrics.forEach((m: QualityMetric) => this.metrics.set(m.id, m));
        }
        if (data.alerts) {
          data.alerts.forEach((a: QualityAlert) => this.alerts.set(a.id, a));
        }
        if (data.improvements) {
          data.improvements.forEach((i: QualityImprovement) => this.improvements.set(i.id, i));
        }
      }
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize quality metrics service:', error);
      this.initialized = true;
    }
  }

  private async save(): Promise<void> {
    try {
      const data = {
        metrics: Array.from(this.metrics.values()),
        alerts: Array.from(this.alerts.values()),
        improvements: Array.from(this.improvements.values()),
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save quality metrics:', error);
    }
  }

  // Get HCAHPS scores
  async getHCAHPSScores(): Promise<HCAHPSScore> {
    await this.initialize();
    return this.mockHCAHPS;
  }

  // Get infection rates
  async getInfectionRates(): Promise<InfectionRate[]> {
    await this.initialize();
    return this.mockInfectionRates;
  }

  // Get readmission data
  async getReadmissionData(): Promise<ReadmissionData> {
    await this.initialize();
    return this.mockReadmission;
  }

  // Get mortality data
  async getMortalityData(): Promise<MortalityData> {
    await this.initialize();
    return this.mockMortality;
  }

  // Get patient safety indicators
  async getPatientSafetyIndicators(): Promise<PatientSafetyIndicator[]> {
    await this.initialize();
    return this.mockSafetyIndicators;
  }

  // Get all quality alerts
  async getAlerts(includeResolved = false): Promise<QualityAlert[]> {
    await this.initialize();
    let alerts = Array.from(this.alerts.values());
    if (!includeResolved) {
      alerts = alerts.filter(a => !a.resolved);
    }
    return alerts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Create quality alert
  async createAlert(data: Omit<QualityAlert, 'id' | 'createdAt' | 'resolved'>): Promise<QualityAlert> {
    await this.initialize();
    const alert: QualityAlert = {
      ...data,
      id: `QA-${Date.now()}`,
      createdAt: new Date(),
      resolved: false,
    };
    this.alerts.set(alert.id, alert);
    await this.save();
    return alert;
  }

  // Acknowledge alert
  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<QualityAlert | null> {
    await this.initialize();
    const alert = this.alerts.get(alertId);
    if (!alert) return null;

    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = acknowledgedBy;
    await this.save();
    return alert;
  }

  // Resolve alert
  async resolveAlert(alertId: string): Promise<QualityAlert | null> {
    await this.initialize();
    const alert = this.alerts.get(alertId);
    if (!alert) return null;

    alert.resolved = true;
    await this.save();
    return alert;
  }

  // Get quality improvement initiatives
  async getImprovementInitiatives(status?: QualityImprovement['status']): Promise<QualityImprovement[]> {
    await this.initialize();
    let initiatives = Array.from(this.improvements.values());
    if (status) {
      initiatives = initiatives.filter(i => i.status === status);
    }
    return initiatives.sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
  }

  // Create improvement initiative
  async createImprovement(data: Omit<QualityImprovement, 'id' | 'actions'>): Promise<QualityImprovement> {
    await this.initialize();
    const improvement: QualityImprovement = {
      ...data,
      id: `QI-${Date.now()}`,
      actions: [],
    };
    this.improvements.set(improvement.id, improvement);
    await this.save();
    return improvement;
  }

  // Add action to improvement
  async addImprovementAction(improvementId: string, action: Omit<QIAction, 'id' | 'status'>): Promise<QualityImprovement | null> {
    await this.initialize();
    const improvement = this.improvements.get(improvementId);
    if (!improvement) return null;

    const newAction: QIAction = {
      ...action,
      id: `QIA-${Date.now()}`,
      status: 'pending',
    };
    improvement.actions.push(newAction);
    await this.save();
    return improvement;
  }

  // Get dashboard summary
  async getDashboardSummary(): Promise<{
    hcahps: { overall: number; trend: TrendDirection };
    infections: { total: number; aboveBenchmark: number };
    readmissions: { rate: number; penaltyRisk: boolean };
    mortality: { ratio: number; trend: TrendDirection };
    safety: { incidents: number; trend: TrendDirection };
    alerts: { critical: number; warning: number; total: number };
    improvements: { active: number; completed: number };
  }> {
    await this.initialize();

    const alerts = Array.from(this.alerts.values()).filter(a => !a.resolved);
    const improvements = Array.from(this.improvements.values());

    return {
      hcahps: {
        overall: this.mockHCAHPS.overallRating,
        trend: 'improving',
      },
      infections: {
        total: this.mockInfectionRates.reduce((sum, i) => sum + i.infections, 0),
        aboveBenchmark: this.mockInfectionRates.filter(i => i.currentRate > i.nationalBenchmark).length,
      },
      readmissions: {
        rate: this.mockReadmission.overall30Day,
        penaltyRisk: this.mockReadmission.penaltyRisk,
      },
      mortality: {
        ratio: this.mockMortality.observedToExpected,
        trend: this.mockMortality.trend,
      },
      safety: {
        incidents: this.mockSafetyIndicators.reduce((sum, i) => sum + i.incidents, 0),
        trend: 'stable',
      },
      alerts: {
        critical: alerts.filter(a => a.severity === 'critical').length,
        warning: alerts.filter(a => a.severity === 'warning').length,
        total: alerts.length,
      },
      improvements: {
        active: improvements.filter(i => i.status === 'in_progress').length,
        completed: improvements.filter(i => i.status === 'completed').length,
      },
    };
  }

  // Get length of stay metrics
  async getLengthOfStayMetrics(): Promise<{
    overall: { average: number; median: number; target: number; benchmark: number };
    byUnit: { unit: string; average: number; target: number }[];
    byDiagnosis: { diagnosis: string; average: number; expected: number; variance: number }[];
  }> {
    await this.initialize();
    return {
      overall: {
        average: 4.8,
        median: 3.2,
        target: 4.5,
        benchmark: 4.6,
      },
      byUnit: [
        { unit: 'ICU', average: 3.2, target: 3.0 },
        { unit: 'Medical', average: 4.5, target: 4.2 },
        { unit: 'Surgical', average: 5.1, target: 4.8 },
        { unit: 'Cardiac', average: 4.8, target: 4.5 },
        { unit: 'Orthopedic', average: 3.8, target: 3.5 },
      ],
      byDiagnosis: [
        { diagnosis: 'Pneumonia', average: 5.2, expected: 4.8, variance: 0.4 },
        { diagnosis: 'Heart Failure', average: 5.8, expected: 5.5, variance: 0.3 },
        { diagnosis: 'Hip Replacement', average: 3.2, expected: 3.0, variance: 0.2 },
        { diagnosis: 'CABG', average: 7.5, expected: 7.2, variance: 0.3 },
        { diagnosis: 'Stroke', average: 6.1, expected: 5.8, variance: 0.3 },
      ],
    };
  }

  // Calculate composite quality score
  calculateCompositeScore(): number {
    const hcahpsWeight = 0.25;
    const infectionWeight = 0.20;
    const readmissionWeight = 0.20;
    const mortalityWeight = 0.20;
    const safetyWeight = 0.15;

    // Normalize scores to 0-100
    const hcahpsScore = this.mockHCAHPS.overallRating;
    
    const infectionScore = 100 - (this.mockInfectionRates.filter(i => i.currentRate > i.targetRate).length / this.mockInfectionRates.length * 100);
    
    const readmissionScore = Math.max(0, 100 - (this.mockReadmission.overall30Day - 10) * 5);
    
    const mortalityScore = this.mockMortality.observedToExpected <= 1 ? 100 : Math.max(0, 100 - (this.mockMortality.observedToExpected - 1) * 50);
    
    const safetyScore = 100 - (this.mockSafetyIndicators.filter(i => i.currentRate > i.targetRate).length / this.mockSafetyIndicators.length * 100);

    return Math.round(
      hcahpsScore * hcahpsWeight +
      infectionScore * infectionWeight +
      readmissionScore * readmissionWeight +
      mortalityScore * mortalityWeight +
      safetyScore * safetyWeight
    );
  }

  // Generate quality report
  async generateReport(period: 'monthly' | 'quarterly' | 'annual'): Promise<{
    period: string;
    generatedAt: Date;
    compositeScore: number;
    sections: {
      name: string;
      score: number;
      highlights: string[];
      concerns: string[];
    }[];
  }> {
    await this.initialize();

    const periodLabel = period === 'monthly' ? 'Monthly' : period === 'quarterly' ? 'Quarterly' : 'Annual';

    return {
      period: periodLabel,
      generatedAt: new Date(),
      compositeScore: this.calculateCompositeScore(),
      sections: [
        {
          name: 'Patient Experience (HCAHPS)',
          score: this.mockHCAHPS.overallRating,
          highlights: ['Discharge information score at 88%', 'Doctor communication improved'],
          concerns: ['Care transition score at 54%', 'Quietness score needs improvement'],
        },
        {
          name: 'Infection Control',
          score: Math.round(100 - (this.mockInfectionRates.filter(i => i.currentRate > i.targetRate).length / this.mockInfectionRates.length * 100)),
          highlights: ['VAP rate below national benchmark', 'CAUTI trending down'],
          concerns: ['SSI rate above target', 'CDI requires continued monitoring'],
        },
        {
          name: 'Readmissions',
          score: Math.round(Math.max(0, 100 - (this.mockReadmission.overall30Day - 10) * 5)),
          highlights: ['Hip/Knee replacement below target'],
          concerns: ['Heart Failure readmissions above target', 'Penalty risk identified'],
        },
        {
          name: 'Mortality',
          score: Math.round(this.mockMortality.observedToExpected <= 1 ? 100 : Math.max(0, 100 - (this.mockMortality.observedToExpected - 1) * 50)),
          highlights: ['O/E ratio below 1.0', 'CABG mortality excellent'],
          concerns: [],
        },
        {
          name: 'Patient Safety',
          score: Math.round(100 - (this.mockSafetyIndicators.filter(i => i.currentRate > i.targetRate).length / this.mockSafetyIndicators.length * 100)),
          highlights: ['Zero wrong site surgeries', 'Pressure ulcer rate improving'],
          concerns: ['Falls with injury above target', 'Medication errors need attention'],
        },
      ],
    };
  }
}

export const QualityMetricsService = new QualityMetricsServiceClass();
