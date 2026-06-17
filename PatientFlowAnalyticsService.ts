/**
 * Patient Flow Analytics Service
 * Comprehensive analytics for capacity planning, throughput optimization,
 * and predictive discharge modeling
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// TYPES AND INTERFACES
// ============================================

export type UnitType = 'ED' | 'ICU' | 'MedSurg' | 'Surgical' | 'Pediatric' | 'Maternity' | 'Psych' | 'Rehab';
export type PatientStatus = 'admitted' | 'in_treatment' | 'pending_discharge' | 'discharged' | 'transferred';
export type DischargeDisposition = 'home' | 'snf' | 'rehab' | 'ltac' | 'hospice' | 'ama' | 'expired' | 'transfer';

export interface PatientFlowRecord {
  id: string;
  patientId: string;
  patientName: string;
  mrn: string;
  admissionDate: number;
  dischargeDate?: number;
  currentUnit: UnitType;
  bedId: string;
  status: PatientStatus;
  diagnosis: string;
  drg?: string;
  expectedLOS: number; // Expected length of stay in days
  actualLOS?: number;
  dischargeDisposition?: DischargeDisposition;
  readmissionRisk: 'low' | 'moderate' | 'high';
  barriers: DischargeBarrier[];
  milestones: PatientMilestone[];
}

export interface DischargeBarrier {
  id: string;
  type: 'clinical' | 'social' | 'insurance' | 'placement' | 'equipment' | 'transportation';
  description: string;
  status: 'active' | 'resolved';
  createdAt: number;
  resolvedAt?: number;
}

export interface PatientMilestone {
  id: string;
  name: string;
  targetDate: number;
  completedDate?: number;
  status: 'pending' | 'completed' | 'overdue';
}

export interface UnitCensus {
  unitType: UnitType;
  unitName: string;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  pendingAdmissions: number;
  pendingDischarges: number;
  pendingTransfers: number;
  occupancyRate: number;
  averageLOS: number;
  turnoverRate: number;
}

export interface FlowMetrics {
  period: 'hourly' | 'daily' | 'weekly' | 'monthly';
  timestamp: number;
  admissions: number;
  discharges: number;
  transfers: number;
  netFlow: number;
  averageLOS: number;
  medianLOS: number;
  bedTurnoverRate: number;
  occupancyRate: number;
  edBoardingTime: number; // Average ED boarding time in minutes
  edToAdmitTime: number; // Average time from ED to inpatient bed
  dischargeBeforeNoon: number; // Percentage of discharges before noon
  readmissionRate: number;
}

export interface BottleneckAnalysis {
  location: string;
  type: 'admission' | 'discharge' | 'transfer' | 'procedure' | 'consult';
  severity: 'low' | 'moderate' | 'high' | 'critical';
  waitingPatients: number;
  averageWaitTime: number; // minutes
  impact: string;
  recommendations: string[];
}

export interface CapacityForecast {
  date: number;
  predictedAdmissions: number;
  predictedDischarges: number;
  predictedOccupancy: number;
  confidence: number;
  factors: ForecastFactor[];
}

export interface ForecastFactor {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
  description: string;
}

export interface ThroughputMetric {
  metric: string;
  value: number;
  unit: string;
  target: number;
  status: 'below' | 'at' | 'above';
  trend: 'improving' | 'stable' | 'declining';
  percentChange: number;
}

export interface DischargePrediction {
  patientId: string;
  patientName: string;
  currentUnit: UnitType;
  bedId: string;
  admissionDate: number;
  predictedDischargeDate: number;
  confidence: number;
  readinessScore: number;
  barriers: DischargeBarrier[];
  nextMilestone?: PatientMilestone;
}

export interface BenchmarkComparison {
  metric: string;
  facilityValue: number;
  regionalAverage: number;
  nationalAverage: number;
  topQuartile: number;
  percentile: number;
}

// ============================================
// PATIENT FLOW ANALYTICS SERVICE
// ============================================

class PatientFlowAnalyticsService {
  private patients: Map<string, PatientFlowRecord> = new Map();
  private metrics: FlowMetrics[] = [];
  private listeners: Set<() => void> = new Set();
  private readonly STORAGE_KEY = '@medivac_patient_flow';

  constructor() {
    this.initializeSampleData();
    this.loadFromStorage();
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  private initializeSampleData(): void {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    const samplePatients: PatientFlowRecord[] = [
      {
        id: 'PF-001',
        patientId: 'PAT-001',
        patientName: 'John Smith',
        mrn: 'MRN-12345',
        admissionDate: now - 3 * day,
        currentUnit: 'MedSurg',
        bedId: 'MS-201A',
        status: 'in_treatment',
        diagnosis: 'Pneumonia',
        drg: '193',
        expectedLOS: 4,
        readmissionRisk: 'moderate',
        barriers: [],
        milestones: [
          { id: 'M1', name: 'Antibiotic completion', targetDate: now + day, status: 'pending' },
          { id: 'M2', name: 'PT evaluation', targetDate: now, completedDate: now - day, status: 'completed' },
        ],
      },
      {
        id: 'PF-002',
        patientId: 'PAT-002',
        patientName: 'Mary Johnson',
        mrn: 'MRN-12346',
        admissionDate: now - 5 * day,
        currentUnit: 'ICU',
        bedId: 'ICU-05',
        status: 'in_treatment',
        diagnosis: 'Sepsis',
        drg: '871',
        expectedLOS: 7,
        readmissionRisk: 'high',
        barriers: [
          { id: 'B1', type: 'clinical', description: 'Requires vasopressor weaning', status: 'active', createdAt: now - 2 * day },
        ],
        milestones: [
          { id: 'M1', name: 'Vasopressor wean', targetDate: now + 2 * day, status: 'pending' },
        ],
      },
      {
        id: 'PF-003',
        patientId: 'PAT-003',
        patientName: 'Robert Williams',
        mrn: 'MRN-12347',
        admissionDate: now - 2 * day,
        currentUnit: 'Surgical',
        bedId: 'SURG-301B',
        status: 'pending_discharge',
        diagnosis: 'Post cholecystectomy',
        drg: '418',
        expectedLOS: 2,
        readmissionRisk: 'low',
        barriers: [
          { id: 'B1', type: 'transportation', description: 'Awaiting family pickup', status: 'active', createdAt: now - 4 * 60 * 60 * 1000 },
        ],
        milestones: [
          { id: 'M1', name: 'Discharge orders', targetDate: now - 2 * 60 * 60 * 1000, completedDate: now - 2 * 60 * 60 * 1000, status: 'completed' },
        ],
      },
      {
        id: 'PF-004',
        patientId: 'PAT-004',
        patientName: 'Linda Davis',
        mrn: 'MRN-12348',
        admissionDate: now - 7 * day,
        currentUnit: 'MedSurg',
        bedId: 'MS-205A',
        status: 'pending_discharge',
        diagnosis: 'CHF Exacerbation',
        drg: '291',
        expectedLOS: 5,
        actualLOS: 7,
        readmissionRisk: 'high',
        barriers: [
          { id: 'B1', type: 'placement', description: 'SNF bed not available', status: 'active', createdAt: now - 2 * day },
          { id: 'B2', type: 'insurance', description: 'Prior auth pending', status: 'active', createdAt: now - day },
        ],
        milestones: [
          { id: 'M1', name: 'Case management review', targetDate: now - day, status: 'overdue' },
        ],
      },
      {
        id: 'PF-005',
        patientId: 'PAT-005',
        patientName: 'James Brown',
        mrn: 'MRN-12349',
        admissionDate: now - day,
        currentUnit: 'ED',
        bedId: 'ED-12',
        status: 'admitted',
        diagnosis: 'Chest pain - rule out MI',
        expectedLOS: 2,
        readmissionRisk: 'moderate',
        barriers: [
          { id: 'B1', type: 'clinical', description: 'Awaiting troponin results', status: 'active', createdAt: now - 6 * 60 * 60 * 1000 },
        ],
        milestones: [],
      },
    ];

    samplePatients.forEach(p => this.patients.set(p.id, p));

    // Generate historical metrics
    for (let i = 30; i >= 0; i--) {
      const timestamp = now - i * day;
      this.metrics.push({
        period: 'daily',
        timestamp,
        admissions: Math.floor(Math.random() * 15) + 20,
        discharges: Math.floor(Math.random() * 15) + 18,
        transfers: Math.floor(Math.random() * 8) + 5,
        netFlow: Math.floor(Math.random() * 6) - 3,
        averageLOS: 4.2 + Math.random() * 1.5,
        medianLOS: 3.5 + Math.random(),
        bedTurnoverRate: 0.25 + Math.random() * 0.1,
        occupancyRate: 78 + Math.random() * 15,
        edBoardingTime: 120 + Math.floor(Math.random() * 180),
        edToAdmitTime: 180 + Math.floor(Math.random() * 240),
        dischargeBeforeNoon: 25 + Math.floor(Math.random() * 30),
        readmissionRate: 8 + Math.random() * 6,
      });
    }
  }

  private async loadFromStorage(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.patients) {
          parsed.patients.forEach((p: PatientFlowRecord) => this.patients.set(p.id, p));
        }
      }
    } catch (error) {
      console.error('Failed to load patient flow data:', error);
    }
  }

  private async saveToStorage(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        patients: Array.from(this.patients.values()),
      }));
    } catch (error) {
      console.error('Failed to save patient flow data:', error);
    }
  }

  // ============================================
  // CENSUS AND OCCUPANCY
  // ============================================

  getUnitCensus(): UnitCensus[] {
    const unitConfigs: Record<UnitType, { name: string; beds: number }> = {
      ED: { name: 'Emergency Department', beds: 30 },
      ICU: { name: 'Intensive Care Unit', beds: 20 },
      MedSurg: { name: 'Medical-Surgical', beds: 60 },
      Surgical: { name: 'Surgical Unit', beds: 40 },
      Pediatric: { name: 'Pediatrics', beds: 25 },
      Maternity: { name: 'Maternity/L&D', beds: 20 },
      Psych: { name: 'Psychiatric Unit', beds: 15 },
      Rehab: { name: 'Rehabilitation', beds: 20 },
    };

    const census: UnitCensus[] = [];
    const patients = Array.from(this.patients.values()).filter(p => !p.dischargeDate);

    for (const [unitType, config] of Object.entries(unitConfigs) as [UnitType, { name: string; beds: number }][]) {
      const unitPatients = patients.filter(p => p.currentUnit === unitType);
      const occupied = unitPatients.length;
      const pendingDischarges = unitPatients.filter(p => p.status === 'pending_discharge').length;
      
      // Simulate pending admissions and transfers
      const pendingAdmissions = Math.floor(Math.random() * 5);
      const pendingTransfers = Math.floor(Math.random() * 3);

      // Calculate average LOS for unit
      const losValues = unitPatients
        .filter(p => p.admissionDate)
        .map(p => (Date.now() - p.admissionDate) / (24 * 60 * 60 * 1000));
      const avgLOS = losValues.length > 0 
        ? losValues.reduce((a, b) => a + b, 0) / losValues.length 
        : 0;

      census.push({
        unitType,
        unitName: config.name,
        totalBeds: config.beds,
        occupiedBeds: occupied,
        availableBeds: config.beds - occupied,
        pendingAdmissions,
        pendingDischarges,
        pendingTransfers,
        occupancyRate: Math.round((occupied / config.beds) * 100),
        averageLOS: Math.round(avgLOS * 10) / 10,
        turnoverRate: Math.round((pendingDischarges / config.beds) * 100) / 100,
      });
    }

    return census;
  }

  getTotalCensus(): { total: number; occupied: number; available: number; occupancyRate: number } {
    const census = this.getUnitCensus();
    const total = census.reduce((sum, u) => sum + u.totalBeds, 0);
    const occupied = census.reduce((sum, u) => sum + u.occupiedBeds, 0);
    return {
      total,
      occupied,
      available: total - occupied,
      occupancyRate: Math.round((occupied / total) * 100),
    };
  }

  // ============================================
  // FLOW METRICS
  // ============================================

  getFlowMetrics(period: 'daily' | 'weekly' | 'monthly' = 'daily'): FlowMetrics[] {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    
    let cutoff: number;
    switch (period) {
      case 'daily':
        cutoff = now - 7 * day;
        break;
      case 'weekly':
        cutoff = now - 30 * day;
        break;
      case 'monthly':
        cutoff = now - 365 * day;
        break;
    }

    return this.metrics.filter(m => m.timestamp >= cutoff);
  }

  getCurrentDayMetrics(): FlowMetrics {
    const today = this.metrics[this.metrics.length - 1];
    return today || {
      period: 'daily',
      timestamp: Date.now(),
      admissions: 0,
      discharges: 0,
      transfers: 0,
      netFlow: 0,
      averageLOS: 0,
      medianLOS: 0,
      bedTurnoverRate: 0,
      occupancyRate: 0,
      edBoardingTime: 0,
      edToAdmitTime: 0,
      dischargeBeforeNoon: 0,
      readmissionRate: 0,
    };
  }

  getThroughputMetrics(): ThroughputMetric[] {
    const current = this.getCurrentDayMetrics();
    const previous = this.metrics[this.metrics.length - 2];

    const calculateTrend = (curr: number, prev: number): { trend: 'improving' | 'stable' | 'declining'; percentChange: number } => {
      const change = prev ? Math.round(((curr - prev) / prev) * 100) : 0;
      return {
        trend: Math.abs(change) < 5 ? 'stable' : change > 0 ? 'improving' : 'declining',
        percentChange: change,
      };
    };

    return [
      {
        metric: 'Average Length of Stay',
        value: Math.round(current.averageLOS * 10) / 10,
        unit: 'days',
        target: 4.0,
        status: current.averageLOS <= 4.0 ? 'at' : current.averageLOS <= 4.5 ? 'above' : 'below',
        ...calculateTrend(current.averageLOS, previous?.averageLOS || 0),
      },
      {
        metric: 'ED Boarding Time',
        value: current.edBoardingTime,
        unit: 'minutes',
        target: 120,
        status: current.edBoardingTime <= 120 ? 'at' : 'above',
        ...calculateTrend(120 - current.edBoardingTime, 120 - (previous?.edBoardingTime || 0)),
      },
      {
        metric: 'Discharge Before Noon',
        value: current.dischargeBeforeNoon,
        unit: '%',
        target: 40,
        status: current.dischargeBeforeNoon >= 40 ? 'at' : 'below',
        ...calculateTrend(current.dischargeBeforeNoon, previous?.dischargeBeforeNoon || 0),
      },
      {
        metric: 'Bed Turnover Rate',
        value: Math.round(current.bedTurnoverRate * 100) / 100,
        unit: 'turns/day',
        target: 0.30,
        status: current.bedTurnoverRate >= 0.30 ? 'at' : 'below',
        ...calculateTrend(current.bedTurnoverRate, previous?.bedTurnoverRate || 0),
      },
      {
        metric: 'Readmission Rate',
        value: Math.round(current.readmissionRate * 10) / 10,
        unit: '%',
        target: 10,
        status: current.readmissionRate <= 10 ? 'at' : 'above',
        ...calculateTrend(10 - current.readmissionRate, 10 - (previous?.readmissionRate || 0)),
      },
      {
        metric: 'Occupancy Rate',
        value: Math.round(current.occupancyRate),
        unit: '%',
        target: 85,
        status: current.occupancyRate >= 80 && current.occupancyRate <= 90 ? 'at' : current.occupancyRate < 80 ? 'below' : 'above',
        ...calculateTrend(current.occupancyRate, previous?.occupancyRate || 0),
      },
    ];
  }

  // ============================================
  // BOTTLENECK ANALYSIS
  // ============================================

  identifyBottlenecks(): BottleneckAnalysis[] {
    const bottlenecks: BottleneckAnalysis[] = [];
    const patients = Array.from(this.patients.values()).filter(p => !p.dischargeDate);

    // ED Boarding
    const edPatients = patients.filter(p => p.currentUnit === 'ED' && p.status === 'admitted');
    if (edPatients.length > 5) {
      bottlenecks.push({
        location: 'Emergency Department',
        type: 'admission',
        severity: edPatients.length > 10 ? 'critical' : edPatients.length > 7 ? 'high' : 'moderate',
        waitingPatients: edPatients.length,
        averageWaitTime: 180 + Math.floor(Math.random() * 120),
        impact: `${edPatients.length} patients boarding in ED awaiting inpatient beds`,
        recommendations: [
          'Expedite pending discharges on target units',
          'Consider opening surge capacity',
          'Activate bed management huddle',
        ],
      });
    }

    // Discharge Delays
    const pendingDischarge = patients.filter(p => p.status === 'pending_discharge');
    const withBarriers = pendingDischarge.filter(p => p.barriers.some(b => b.status === 'active'));
    if (withBarriers.length > 3) {
      const placementBarriers = withBarriers.filter(p => p.barriers.some(b => b.type === 'placement'));
      bottlenecks.push({
        location: 'Discharge Planning',
        type: 'discharge',
        severity: withBarriers.length > 8 ? 'critical' : withBarriers.length > 5 ? 'high' : 'moderate',
        waitingPatients: withBarriers.length,
        averageWaitTime: 24 * 60, // 24 hours in minutes
        impact: `${withBarriers.length} patients with discharge barriers (${placementBarriers.length} placement issues)`,
        recommendations: [
          'Escalate SNF placement cases to case management leadership',
          'Review insurance authorization status',
          'Coordinate family meetings for discharge planning',
        ],
      });
    }

    // ICU Transfers
    const icuPatients = patients.filter(p => p.currentUnit === 'ICU');
    const icuReadyForTransfer = icuPatients.filter(p => p.readmissionRisk === 'low');
    if (icuReadyForTransfer.length > 2) {
      bottlenecks.push({
        location: 'ICU Step-Down',
        type: 'transfer',
        severity: icuReadyForTransfer.length > 5 ? 'high' : 'moderate',
        waitingPatients: icuReadyForTransfer.length,
        averageWaitTime: 240,
        impact: `${icuReadyForTransfer.length} ICU patients ready for step-down but no beds available`,
        recommendations: [
          'Prioritize MedSurg discharges',
          'Consider direct ICU to home discharges where appropriate',
          'Open step-down overflow beds',
        ],
      });
    }

    return bottlenecks.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, moderate: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  // ============================================
  // CAPACITY FORECASTING
  // ============================================

  generateCapacityForecast(daysAhead: number = 7): CapacityForecast[] {
    const forecasts: CapacityForecast[] = [];
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const currentOccupancy = this.getTotalCensus().occupancyRate;

    // Get historical averages
    const recentMetrics = this.metrics.slice(-14);
    const avgAdmissions = recentMetrics.reduce((sum, m) => sum + m.admissions, 0) / recentMetrics.length;
    const avgDischarges = recentMetrics.reduce((sum, m) => sum + m.discharges, 0) / recentMetrics.length;

    for (let i = 1; i <= daysAhead; i++) {
      const date = now + i * day;
      const dayOfWeek = new Date(date).getDay();
      
      // Adjust for day of week patterns
      const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.8 : 1.0;
      const mondayFactor = dayOfWeek === 1 ? 1.2 : 1.0;
      const fridayFactor = dayOfWeek === 5 ? 1.15 : 1.0;

      const factors: ForecastFactor[] = [];

      // Day of week factor
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        factors.push({
          name: 'Weekend Effect',
          impact: 'negative',
          weight: 0.2,
          description: 'Reduced discharges on weekends',
        });
      }
      if (dayOfWeek === 1) {
        factors.push({
          name: 'Monday Surge',
          impact: 'negative',
          weight: 0.15,
          description: 'Higher admissions on Mondays',
        });
      }

      // Seasonal factor (simplified)
      const month = new Date(date).getMonth();
      if (month >= 10 || month <= 2) {
        factors.push({
          name: 'Winter Season',
          impact: 'negative',
          weight: 0.1,
          description: 'Increased respiratory admissions',
        });
      }

      const predictedAdmissions = Math.round(avgAdmissions * mondayFactor * (0.9 + Math.random() * 0.2));
      const predictedDischarges = Math.round(avgDischarges * weekendFactor * fridayFactor * (0.9 + Math.random() * 0.2));
      const netChange = predictedAdmissions - predictedDischarges;
      const predictedOccupancy = Math.min(100, Math.max(50, currentOccupancy + (netChange * 0.5)));

      forecasts.push({
        date,
        predictedAdmissions,
        predictedDischarges,
        predictedOccupancy: Math.round(predictedOccupancy),
        confidence: Math.max(60, 95 - i * 5), // Confidence decreases with time
        factors,
      });
    }

    return forecasts;
  }

  // ============================================
  // DISCHARGE PREDICTIONS
  // ============================================

  getDischargePredictions(): DischargePrediction[] {
    const patients = Array.from(this.patients.values())
      .filter(p => !p.dischargeDate && p.status !== 'discharged');

    return patients.map(p => {
      const daysSinceAdmission = (Date.now() - p.admissionDate) / (24 * 60 * 60 * 1000);
      const remainingLOS = Math.max(0, p.expectedLOS - daysSinceAdmission);
      const predictedDischargeDate = Date.now() + remainingLOS * 24 * 60 * 60 * 1000;

      // Calculate readiness score
      const activeBarriers = p.barriers.filter(b => b.status === 'active').length;
      const completedMilestones = p.milestones.filter(m => m.status === 'completed').length;
      const totalMilestones = p.milestones.length;
      
      let readinessScore = 100;
      readinessScore -= activeBarriers * 20;
      if (totalMilestones > 0) {
        readinessScore = readinessScore * (completedMilestones / totalMilestones);
      }
      readinessScore = Math.max(0, Math.min(100, readinessScore));

      // Confidence based on barriers and LOS
      let confidence = 85;
      confidence -= activeBarriers * 15;
      if (daysSinceAdmission > p.expectedLOS) {
        confidence -= 20;
      }
      confidence = Math.max(30, Math.min(95, confidence));

      const pendingMilestone = p.milestones.find(m => m.status === 'pending');

      return {
        patientId: p.patientId,
        patientName: p.patientName,
        currentUnit: p.currentUnit,
        bedId: p.bedId,
        admissionDate: p.admissionDate,
        predictedDischargeDate,
        confidence: Math.round(confidence),
        readinessScore: Math.round(readinessScore),
        barriers: p.barriers.filter(b => b.status === 'active'),
        nextMilestone: pendingMilestone,
      };
    }).sort((a, b) => a.predictedDischargeDate - b.predictedDischargeDate);
  }

  // ============================================
  // BENCHMARKING
  // ============================================

  getBenchmarkComparisons(): BenchmarkComparison[] {
    const current = this.getCurrentDayMetrics();

    return [
      {
        metric: 'Average Length of Stay',
        facilityValue: Math.round(current.averageLOS * 10) / 10,
        regionalAverage: 4.5,
        nationalAverage: 4.8,
        topQuartile: 3.8,
        percentile: current.averageLOS <= 3.8 ? 90 : current.averageLOS <= 4.5 ? 60 : 40,
      },
      {
        metric: 'ED Boarding Time (min)',
        facilityValue: current.edBoardingTime,
        regionalAverage: 180,
        nationalAverage: 210,
        topQuartile: 90,
        percentile: current.edBoardingTime <= 90 ? 90 : current.edBoardingTime <= 180 ? 50 : 25,
      },
      {
        metric: 'Readmission Rate (%)',
        facilityValue: Math.round(current.readmissionRate * 10) / 10,
        regionalAverage: 12,
        nationalAverage: 14,
        topQuartile: 8,
        percentile: current.readmissionRate <= 8 ? 90 : current.readmissionRate <= 12 ? 60 : 35,
      },
      {
        metric: 'Discharge Before Noon (%)',
        facilityValue: current.dischargeBeforeNoon,
        regionalAverage: 35,
        nationalAverage: 30,
        topQuartile: 50,
        percentile: current.dischargeBeforeNoon >= 50 ? 90 : current.dischargeBeforeNoon >= 35 ? 55 : 30,
      },
      {
        metric: 'Bed Turnover Rate',
        facilityValue: Math.round(current.bedTurnoverRate * 100) / 100,
        regionalAverage: 0.28,
        nationalAverage: 0.25,
        topQuartile: 0.35,
        percentile: current.bedTurnoverRate >= 0.35 ? 90 : current.bedTurnoverRate >= 0.28 ? 55 : 35,
      },
    ];
  }

  // ============================================
  // PATIENT MANAGEMENT
  // ============================================

  getPatients(): PatientFlowRecord[] {
    return Array.from(this.patients.values());
  }

  getPatientsByUnit(unit: UnitType): PatientFlowRecord[] {
    return Array.from(this.patients.values())
      .filter(p => p.currentUnit === unit && !p.dischargeDate);
  }

  getPendingDischarges(): PatientFlowRecord[] {
    return Array.from(this.patients.values())
      .filter(p => p.status === 'pending_discharge');
  }

  getLongStayPatients(thresholdDays: number = 7): PatientFlowRecord[] {
    const threshold = thresholdDays * 24 * 60 * 60 * 1000;
    return Array.from(this.patients.values())
      .filter(p => !p.dischargeDate && (Date.now() - p.admissionDate) > threshold)
      .sort((a, b) => a.admissionDate - b.admissionDate);
  }

  resolveBarrier(patientId: string, barrierId: string): void {
    const patient = Array.from(this.patients.values()).find(p => p.patientId === patientId);
    if (patient) {
      const barrier = patient.barriers.find(b => b.id === barrierId);
      if (barrier) {
        barrier.status = 'resolved';
        barrier.resolvedAt = Date.now();
        this.saveToStorage();
        this.notifyListeners();
      }
    }
  }

  completeMilestone(patientId: string, milestoneId: string): void {
    const patient = Array.from(this.patients.values()).find(p => p.patientId === patientId);
    if (patient) {
      const milestone = patient.milestones.find(m => m.id === milestoneId);
      if (milestone) {
        milestone.status = 'completed';
        milestone.completedDate = Date.now();
        this.saveToStorage();
        this.notifyListeners();
      }
    }
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

export const patientFlowAnalyticsService = new PatientFlowAnalyticsService();
