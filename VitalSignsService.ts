/**
 * Vital Signs Monitoring Service
 * Real-time vital sign tracking with threshold alerts and trending
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Vital sign types
export type VitalSignType = 
  | 'heart_rate'
  | 'blood_pressure_systolic'
  | 'blood_pressure_diastolic'
  | 'respiratory_rate'
  | 'temperature'
  | 'oxygen_saturation'
  | 'pain_level'
  | 'blood_glucose';

// Alert severity
export type AlertSeverity = 'normal' | 'warning' | 'critical';

// Vital sign reading
export interface VitalSignReading {
  id: string;
  patientId: string;
  type: VitalSignType;
  value: number;
  unit: string;
  timestamp: number;
  recordedBy: string;
  method?: string; // manual, automatic, device
  notes?: string;
  alertSeverity: AlertSeverity;
}

// Vital sign threshold
export interface VitalSignThreshold {
  type: VitalSignType;
  name: string;
  unit: string;
  normalMin: number;
  normalMax: number;
  warningMin: number;
  warningMax: number;
  criticalMin: number;
  criticalMax: number;
}

// Early Warning Score component
export interface EWSComponent {
  type: VitalSignType;
  value: number;
  score: number;
}

// Early Warning Score result
export interface EWSResult {
  totalScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  components: EWSComponent[];
  recommendation: string;
  calculatedAt: number;
}

// Vital sign alert
export interface VitalSignAlert {
  id: string;
  patientId: string;
  patientName: string;
  readingId: string;
  type: VitalSignType;
  value: number;
  unit: string;
  severity: AlertSeverity;
  threshold: { min: number; max: number };
  message: string;
  createdAt: number;
  acknowledgedAt?: number;
  acknowledgedBy?: string;
  escalatedAt?: number;
  resolvedAt?: number;
}

// Trend data point
export interface TrendDataPoint {
  timestamp: number;
  value: number;
  alertSeverity: AlertSeverity;
}

// Trend analysis
export interface TrendAnalysis {
  type: VitalSignType;
  direction: 'increasing' | 'decreasing' | 'stable' | 'fluctuating';
  changePercent: number;
  averageValue: number;
  minValue: number;
  maxValue: number;
  dataPoints: TrendDataPoint[];
}

class VitalSignsService {
  private readings: Map<string, VitalSignReading[]> = new Map();
  private alerts: Map<string, VitalSignAlert> = new Map();
  private thresholds: Map<VitalSignType, VitalSignThreshold> = new Map();
  private listeners: Set<(alert: VitalSignAlert) => void> = new Set();

  constructor() {
    this.initializeThresholds();
    this.loadState();
  }

  // Initialize default thresholds
  private initializeThresholds(): void {
    const defaults: VitalSignThreshold[] = [
      {
        type: 'heart_rate',
        name: 'Heart Rate',
        unit: 'bpm',
        normalMin: 60, normalMax: 100,
        warningMin: 50, warningMax: 110,
        criticalMin: 40, criticalMax: 130,
      },
      {
        type: 'blood_pressure_systolic',
        name: 'Systolic BP',
        unit: 'mmHg',
        normalMin: 90, normalMax: 140,
        warningMin: 80, warningMax: 160,
        criticalMin: 70, criticalMax: 180,
      },
      {
        type: 'blood_pressure_diastolic',
        name: 'Diastolic BP',
        unit: 'mmHg',
        normalMin: 60, normalMax: 90,
        warningMin: 50, warningMax: 100,
        criticalMin: 40, criticalMax: 110,
      },
      {
        type: 'respiratory_rate',
        name: 'Respiratory Rate',
        unit: 'breaths/min',
        normalMin: 12, normalMax: 20,
        warningMin: 10, warningMax: 24,
        criticalMin: 8, criticalMax: 30,
      },
      {
        type: 'temperature',
        name: 'Temperature',
        unit: '°C',
        normalMin: 36.1, normalMax: 37.2,
        warningMin: 35.5, warningMax: 38.0,
        criticalMin: 35.0, criticalMax: 39.0,
      },
      {
        type: 'oxygen_saturation',
        name: 'SpO2',
        unit: '%',
        normalMin: 95, normalMax: 100,
        warningMin: 92, warningMax: 100,
        criticalMin: 88, criticalMax: 100,
      },
      {
        type: 'pain_level',
        name: 'Pain Level',
        unit: '/10',
        normalMin: 0, normalMax: 3,
        warningMin: 0, warningMax: 6,
        criticalMin: 0, criticalMax: 10,
      },
      {
        type: 'blood_glucose',
        name: 'Blood Glucose',
        unit: 'mg/dL',
        normalMin: 70, normalMax: 140,
        warningMin: 60, warningMax: 180,
        criticalMin: 50, criticalMax: 250,
      },
    ];

    defaults.forEach(t => this.thresholds.set(t.type, t));
  }

  // Get threshold for vital sign type
  getThreshold(type: VitalSignType): VitalSignThreshold | undefined {
    return this.thresholds.get(type);
  }

  // Get all thresholds
  getAllThresholds(): VitalSignThreshold[] {
    return Array.from(this.thresholds.values());
  }

  // Evaluate alert severity
  evaluateSeverity(type: VitalSignType, value: number): AlertSeverity {
    const threshold = this.thresholds.get(type);
    if (!threshold) return 'normal';

    if (value < threshold.criticalMin || value > threshold.criticalMax) {
      return 'critical';
    }
    if (value < threshold.warningMin || value > threshold.warningMax) {
      return 'warning';
    }
    if (value >= threshold.normalMin && value <= threshold.normalMax) {
      return 'normal';
    }
    return 'warning';
  }

  // Record vital sign
  async recordVitalSign(
    patientId: string,
    patientName: string,
    type: VitalSignType,
    value: number,
    recordedBy: string,
    method: string = 'manual',
    notes?: string
  ): Promise<VitalSignReading> {
    const threshold = this.thresholds.get(type);
    const alertSeverity = this.evaluateSeverity(type, value);

    const reading: VitalSignReading = {
      id: `VS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      patientId,
      type,
      value,
      unit: threshold?.unit || '',
      timestamp: Date.now(),
      recordedBy,
      method,
      notes,
      alertSeverity,
    };

    // Store reading
    const patientReadings = this.readings.get(patientId) || [];
    patientReadings.unshift(reading);
    this.readings.set(patientId, patientReadings.slice(0, 1000)); // Keep last 1000

    // Create alert if abnormal
    if (alertSeverity !== 'normal') {
      await this.createAlert(reading, patientName, threshold!);
    }

    await this.saveState();
    return reading;
  }

  // Create alert
  private async createAlert(
    reading: VitalSignReading,
    patientName: string,
    threshold: VitalSignThreshold
  ): Promise<void> {
    const alert: VitalSignAlert = {
      id: `ALERT-${Date.now()}`,
      patientId: reading.patientId,
      patientName,
      readingId: reading.id,
      type: reading.type,
      value: reading.value,
      unit: reading.unit,
      severity: reading.alertSeverity,
      threshold: {
        min: reading.alertSeverity === 'critical' ? threshold.criticalMin : threshold.warningMin,
        max: reading.alertSeverity === 'critical' ? threshold.criticalMax : threshold.warningMax,
      },
      message: this.generateAlertMessage(reading, threshold),
      createdAt: Date.now(),
    };

    this.alerts.set(alert.id, alert);
    this.notifyListeners(alert);
  }

  // Generate alert message
  private generateAlertMessage(reading: VitalSignReading, threshold: VitalSignThreshold): string {
    const direction = reading.value < threshold.normalMin ? 'low' : 'high';
    return `${threshold.name} ${direction}: ${reading.value} ${reading.unit} (Normal: ${threshold.normalMin}-${threshold.normalMax})`;
  }

  // Get patient readings
  getPatientReadings(patientId: string, type?: VitalSignType): VitalSignReading[] {
    const readings = this.readings.get(patientId) || [];
    if (type) {
      return readings.filter(r => r.type === type);
    }
    return readings;
  }

  // Get latest reading for each type
  getLatestReadings(patientId: string): Map<VitalSignType, VitalSignReading> {
    const readings = this.readings.get(patientId) || [];
    const latest = new Map<VitalSignType, VitalSignReading>();

    for (const reading of readings) {
      if (!latest.has(reading.type)) {
        latest.set(reading.type, reading);
      }
    }

    return latest;
  }

  // Calculate Early Warning Score (NEWS2-based)
  calculateEWS(patientId: string): EWSResult | null {
    const latest = this.getLatestReadings(patientId);
    if (latest.size === 0) return null;

    const components: EWSComponent[] = [];
    let totalScore = 0;

    // Score each vital sign
    const scoreVital = (type: VitalSignType, value: number): number => {
      switch (type) {
        case 'respiratory_rate':
          if (value <= 8) return 3;
          if (value <= 11) return 1;
          if (value <= 20) return 0;
          if (value <= 24) return 2;
          return 3;
        case 'oxygen_saturation':
          if (value <= 91) return 3;
          if (value <= 93) return 2;
          if (value <= 95) return 1;
          return 0;
        case 'blood_pressure_systolic':
          if (value <= 90) return 3;
          if (value <= 100) return 2;
          if (value <= 110) return 1;
          if (value <= 219) return 0;
          return 3;
        case 'heart_rate':
          if (value <= 40) return 3;
          if (value <= 50) return 1;
          if (value <= 90) return 0;
          if (value <= 110) return 1;
          if (value <= 130) return 2;
          return 3;
        case 'temperature':
          if (value <= 35.0) return 3;
          if (value <= 36.0) return 1;
          if (value <= 38.0) return 0;
          if (value <= 39.0) return 1;
          return 2;
        default:
          return 0;
      }
    };

    const typesToScore: VitalSignType[] = [
      'respiratory_rate', 'oxygen_saturation', 'blood_pressure_systolic',
      'heart_rate', 'temperature'
    ];

    for (const type of typesToScore) {
      const reading = latest.get(type);
      if (reading) {
        const score = scoreVital(type, reading.value);
        components.push({ type, value: reading.value, score });
        totalScore += score;
      }
    }

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    let recommendation: string;

    if (totalScore >= 7 || components.some(c => c.score === 3)) {
      riskLevel = 'critical';
      recommendation = 'Urgent clinical review required. Consider ICU transfer.';
    } else if (totalScore >= 5) {
      riskLevel = 'high';
      recommendation = 'Urgent response required. Increase monitoring frequency.';
    } else if (totalScore >= 3) {
      riskLevel = 'medium';
      recommendation = 'Increased monitoring recommended. Review by clinician.';
    } else {
      riskLevel = 'low';
      recommendation = 'Continue routine monitoring.';
    }

    return {
      totalScore,
      riskLevel,
      components,
      recommendation,
      calculatedAt: Date.now(),
    };
  }

  // Analyze trend
  analyzeTrend(patientId: string, type: VitalSignType, hours: number = 24): TrendAnalysis | null {
    const readings = this.getPatientReadings(patientId, type);
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    const filtered = readings.filter(r => r.timestamp >= cutoff);

    if (filtered.length < 2) return null;

    const dataPoints: TrendDataPoint[] = filtered.map(r => ({
      timestamp: r.timestamp,
      value: r.value,
      alertSeverity: r.alertSeverity,
    }));

    const values = filtered.map(r => r.value);
    const avgValue = values.reduce((a, b) => a + b, 0) / values.length;
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    // Calculate trend direction
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    const changePercent = ((secondAvg - firstAvg) / firstAvg) * 100;

    let direction: 'increasing' | 'decreasing' | 'stable' | 'fluctuating';
    const variance = values.reduce((sum, v) => sum + Math.pow(v - avgValue, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const cv = (stdDev / avgValue) * 100; // Coefficient of variation

    if (cv > 15) {
      direction = 'fluctuating';
    } else if (Math.abs(changePercent) < 5) {
      direction = 'stable';
    } else if (changePercent > 0) {
      direction = 'increasing';
    } else {
      direction = 'decreasing';
    }

    return {
      type,
      direction,
      changePercent: Math.round(changePercent * 10) / 10,
      averageValue: Math.round(avgValue * 10) / 10,
      minValue,
      maxValue,
      dataPoints,
    };
  }

  // Get active alerts
  getActiveAlerts(patientId?: string): VitalSignAlert[] {
    const alerts = Array.from(this.alerts.values())
      .filter(a => !a.resolvedAt)
      .sort((a, b) => b.createdAt - a.createdAt);

    if (patientId) {
      return alerts.filter(a => a.patientId === patientId);
    }
    return alerts;
  }

  // Acknowledge alert
  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.acknowledgedAt = Date.now();
      alert.acknowledgedBy = acknowledgedBy;
      await this.saveState();
    }
  }

  // Resolve alert
  async resolveAlert(alertId: string): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolvedAt = Date.now();
      await this.saveState();
    }
  }

  // Get severity color
  getSeverityColor(severity: AlertSeverity): string {
    const colors: Record<AlertSeverity, string> = {
      normal: '#22C55E',
      warning: '#F59E0B',
      critical: '#EF4444',
    };
    return colors[severity];
  }

  // Get vital sign icon
  getVitalSignIcon(type: VitalSignType): string {
    const icons: Record<VitalSignType, string> = {
      heart_rate: '❤️',
      blood_pressure_systolic: '🩺',
      blood_pressure_diastolic: '🩺',
      respiratory_rate: '🫁',
      temperature: '🌡️',
      oxygen_saturation: '💨',
      pain_level: '😣',
      blood_glucose: '🩸',
    };
    return icons[type];
  }

  // Subscribe to alerts
  subscribe(listener: (alert: VitalSignAlert) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Notify listeners
  private notifyListeners(alert: VitalSignAlert): void {
    this.listeners.forEach(listener => listener(alert));
  }

  // Save state
  private async saveState(): Promise<void> {
    try {
      await AsyncStorage.setItem('vital_readings', JSON.stringify(Array.from(this.readings.entries())));
      await AsyncStorage.setItem('vital_alerts', JSON.stringify(Array.from(this.alerts.entries())));
    } catch (error) {
      console.error('Failed to save vital signs state:', error);
    }
  }

  // Load state
  private async loadState(): Promise<void> {
    try {
      const readingsJson = await AsyncStorage.getItem('vital_readings');
      if (readingsJson) {
        const entries = JSON.parse(readingsJson);
        entries.forEach(([key, value]: [string, VitalSignReading[]]) => {
          this.readings.set(key, value);
        });
      }

      const alertsJson = await AsyncStorage.getItem('vital_alerts');
      if (alertsJson) {
        const entries = JSON.parse(alertsJson);
        entries.forEach(([key, value]: [string, VitalSignAlert]) => {
          this.alerts.set(key, value);
        });
      }
    } catch (error) {
      console.error('Failed to load vital signs state:', error);
    }
  }
}

// Export singleton instance
export const vitalSignsService = new VitalSignsService();
export default vitalSignsService;
