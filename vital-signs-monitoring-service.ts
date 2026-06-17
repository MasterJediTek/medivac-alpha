/**
 * MediVac One - Real-Time Vital Signs Monitoring Service
 * Medical device API connections for live patient data streaming
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ==========================================
// Types and Interfaces
// ==========================================

export type VitalSignType = 
  | 'heart_rate'
  | 'blood_pressure_systolic'
  | 'blood_pressure_diastolic'
  | 'oxygen_saturation'
  | 'respiratory_rate'
  | 'temperature'
  | 'ecg'
  | 'blood_glucose'
  | 'weight'
  | 'pain_level';

export type DeviceType = 
  | 'pulse_oximeter'
  | 'blood_pressure_monitor'
  | 'ecg_monitor'
  | 'thermometer'
  | 'glucometer'
  | 'weight_scale'
  | 'multi_parameter_monitor'
  | 'wearable';

export type ConnectionProtocol = 'bluetooth' | 'wifi' | 'usb' | 'hl7' | 'fhir';

export type AlertSeverity = 'info' | 'warning' | 'critical' | 'emergency';

export interface MedicalDevice {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  type: DeviceType;
  protocol: ConnectionProtocol;
  serialNumber?: string;
  firmwareVersion?: string;
  connectionStatus: 'connected' | 'disconnected' | 'pairing' | 'error';
  batteryLevel?: number;
  lastReading?: string;
  supportedVitals: VitalSignType[];
}

export interface VitalSignReading {
  id: string;
  patientId: string;
  deviceId: string;
  type: VitalSignType;
  value: number;
  unit: string;
  timestamp: string;
  quality: 'good' | 'fair' | 'poor' | 'invalid';
  isAbnormal: boolean;
  alertLevel?: AlertSeverity;
  metadata?: Record<string, unknown>;
}

export interface VitalSignRange {
  type: VitalSignType;
  unit: string;
  normalMin: number;
  normalMax: number;
  warningLow?: number;
  warningHigh?: number;
  criticalLow?: number;
  criticalHigh?: number;
  emergencyLow?: number;
  emergencyHigh?: number;
}

export interface PatientMonitoringSession {
  id: string;
  patientId: string;
  patientName: string;
  mrn: string;
  ward: string;
  room: string;
  bed: string;
  startTime: string;
  endTime?: string;
  status: 'active' | 'paused' | 'completed';
  devices: string[];
  alerts: VitalSignAlert[];
  readings: VitalSignReading[];
  monitoringLevel: 'routine' | 'close' | 'continuous' | 'critical';
}

export interface VitalSignAlert {
  id: string;
  sessionId: string;
  patientId: string;
  type: VitalSignType;
  severity: AlertSeverity;
  value: number;
  threshold: number;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  escalated: boolean;
  escalatedTo?: string;
}

export interface TrendData {
  type: VitalSignType;
  readings: { timestamp: string; value: number }[];
  trend: 'stable' | 'increasing' | 'decreasing' | 'fluctuating';
  average: number;
  min: number;
  max: number;
  standardDeviation: number;
}

export interface StreamingCallback {
  onReading: (reading: VitalSignReading) => void;
  onAlert: (alert: VitalSignAlert) => void;
  onDeviceStatus: (device: MedicalDevice) => void;
  onError: (error: Error) => void;
}

// ==========================================
// Normal Ranges Configuration
// ==========================================

const VITAL_SIGN_RANGES: VitalSignRange[] = [
  {
    type: 'heart_rate',
    unit: 'bpm',
    normalMin: 60,
    normalMax: 100,
    warningLow: 50,
    warningHigh: 110,
    criticalLow: 40,
    criticalHigh: 130,
    emergencyLow: 30,
    emergencyHigh: 150,
  },
  {
    type: 'blood_pressure_systolic',
    unit: 'mmHg',
    normalMin: 90,
    normalMax: 140,
    warningLow: 85,
    warningHigh: 150,
    criticalLow: 70,
    criticalHigh: 180,
    emergencyLow: 60,
    emergencyHigh: 200,
  },
  {
    type: 'blood_pressure_diastolic',
    unit: 'mmHg',
    normalMin: 60,
    normalMax: 90,
    warningLow: 55,
    warningHigh: 95,
    criticalLow: 40,
    criticalHigh: 110,
    emergencyLow: 30,
    emergencyHigh: 120,
  },
  {
    type: 'oxygen_saturation',
    unit: '%',
    normalMin: 95,
    normalMax: 100,
    warningLow: 92,
    criticalLow: 88,
    emergencyLow: 85,
  },
  {
    type: 'respiratory_rate',
    unit: '/min',
    normalMin: 12,
    normalMax: 20,
    warningLow: 10,
    warningHigh: 24,
    criticalLow: 8,
    criticalHigh: 30,
    emergencyLow: 6,
    emergencyHigh: 35,
  },
  {
    type: 'temperature',
    unit: '°C',
    normalMin: 36.1,
    normalMax: 37.2,
    warningLow: 35.5,
    warningHigh: 37.8,
    criticalLow: 35.0,
    criticalHigh: 38.5,
    emergencyLow: 34.0,
    emergencyHigh: 40.0,
  },
  {
    type: 'blood_glucose',
    unit: 'mmol/L',
    normalMin: 4.0,
    normalMax: 7.8,
    warningLow: 3.5,
    warningHigh: 10.0,
    criticalLow: 2.8,
    criticalHigh: 15.0,
    emergencyLow: 2.0,
    emergencyHigh: 25.0,
  },
  {
    type: 'pain_level',
    unit: '/10',
    normalMin: 0,
    normalMax: 3,
    warningHigh: 5,
    criticalHigh: 7,
    emergencyHigh: 9,
  },
];

// ==========================================
// Supported Medical Devices
// ==========================================

interface DeviceProfile {
  manufacturer: string;
  model: string;
  type: DeviceType;
  protocol: ConnectionProtocol;
  supportedVitals: VitalSignType[];
}

const SUPPORTED_DEVICES: DeviceProfile[] = [
  // Pulse Oximeters
  { manufacturer: 'Nonin', model: 'Onyx Vantage 9590', type: 'pulse_oximeter', protocol: 'bluetooth', supportedVitals: ['oxygen_saturation', 'heart_rate'] },
  { manufacturer: 'Masimo', model: 'MightySat Rx', type: 'pulse_oximeter', protocol: 'bluetooth', supportedVitals: ['oxygen_saturation', 'heart_rate', 'respiratory_rate'] },
  { manufacturer: 'Wellue', model: 'O2Ring', type: 'pulse_oximeter', protocol: 'bluetooth', supportedVitals: ['oxygen_saturation', 'heart_rate'] },
  
  // Blood Pressure Monitors
  { manufacturer: 'Omron', model: 'Evolv HEM-7600T', type: 'blood_pressure_monitor', protocol: 'bluetooth', supportedVitals: ['blood_pressure_systolic', 'blood_pressure_diastolic', 'heart_rate'] },
  { manufacturer: 'Withings', model: 'BPM Connect', type: 'blood_pressure_monitor', protocol: 'bluetooth', supportedVitals: ['blood_pressure_systolic', 'blood_pressure_diastolic', 'heart_rate'] },
  { manufacturer: 'iHealth', model: 'Clear', type: 'blood_pressure_monitor', protocol: 'bluetooth', supportedVitals: ['blood_pressure_systolic', 'blood_pressure_diastolic', 'heart_rate'] },
  
  // ECG Monitors
  { manufacturer: 'AliveCor', model: 'KardiaMobile 6L', type: 'ecg_monitor', protocol: 'bluetooth', supportedVitals: ['ecg', 'heart_rate'] },
  { manufacturer: 'Withings', model: 'ScanWatch', type: 'ecg_monitor', protocol: 'bluetooth', supportedVitals: ['ecg', 'heart_rate', 'oxygen_saturation'] },
  
  // Thermometers
  { manufacturer: 'Braun', model: 'ThermoScan 7', type: 'thermometer', protocol: 'bluetooth', supportedVitals: ['temperature'] },
  { manufacturer: 'Withings', model: 'Thermo', type: 'thermometer', protocol: 'wifi', supportedVitals: ['temperature'] },
  
  // Glucometers
  { manufacturer: 'Abbott', model: 'FreeStyle Libre 2', type: 'glucometer', protocol: 'bluetooth', supportedVitals: ['blood_glucose'] },
  { manufacturer: 'Dexcom', model: 'G6', type: 'glucometer', protocol: 'bluetooth', supportedVitals: ['blood_glucose'] },
  { manufacturer: 'Accu-Chek', model: 'Guide', type: 'glucometer', protocol: 'bluetooth', supportedVitals: ['blood_glucose'] },
  
  // Multi-Parameter Monitors
  { manufacturer: 'Philips', model: 'IntelliVue MX40', type: 'multi_parameter_monitor', protocol: 'hl7', supportedVitals: ['heart_rate', 'blood_pressure_systolic', 'blood_pressure_diastolic', 'oxygen_saturation', 'respiratory_rate', 'temperature', 'ecg'] },
  { manufacturer: 'GE Healthcare', model: 'CARESCAPE B650', type: 'multi_parameter_monitor', protocol: 'hl7', supportedVitals: ['heart_rate', 'blood_pressure_systolic', 'blood_pressure_diastolic', 'oxygen_saturation', 'respiratory_rate', 'temperature', 'ecg'] },
  { manufacturer: 'Mindray', model: 'BeneVision N22', type: 'multi_parameter_monitor', protocol: 'hl7', supportedVitals: ['heart_rate', 'blood_pressure_systolic', 'blood_pressure_diastolic', 'oxygen_saturation', 'respiratory_rate', 'temperature', 'ecg'] },
  
  // Wearables
  { manufacturer: 'Apple', model: 'Watch Series 9', type: 'wearable', protocol: 'bluetooth', supportedVitals: ['heart_rate', 'oxygen_saturation', 'ecg', 'respiratory_rate'] },
  { manufacturer: 'Fitbit', model: 'Sense 2', type: 'wearable', protocol: 'bluetooth', supportedVitals: ['heart_rate', 'oxygen_saturation', 'respiratory_rate'] },
  { manufacturer: 'Samsung', model: 'Galaxy Watch 6', type: 'wearable', protocol: 'bluetooth', supportedVitals: ['heart_rate', 'blood_pressure_systolic', 'blood_pressure_diastolic', 'oxygen_saturation', 'ecg'] },
];

// ==========================================
// Vital Signs Monitoring Service
// ==========================================

class VitalSignsMonitoringService {
  private connectedDevices: Map<string, MedicalDevice> = new Map();
  private activeSessions: Map<string, PatientMonitoringSession> = new Map();
  private alerts: VitalSignAlert[] = [];
  private streamingCallbacks: Map<string, StreamingCallback> = new Map();
  private simulationIntervals: Map<string, ReturnType<typeof setInterval>> = new Map();

  constructor() {
    this.loadState();
  }

  private async loadState(): Promise<void> {
    try {
      const devicesData = await AsyncStorage.getItem('vital_signs_devices');
      if (devicesData) {
        const parsed = JSON.parse(devicesData);
        Object.entries(parsed).forEach(([key, value]) => {
          this.connectedDevices.set(key, value as MedicalDevice);
        });
      }

      const alertsData = await AsyncStorage.getItem('vital_signs_alerts');
      if (alertsData) {
        this.alerts = JSON.parse(alertsData);
      }
    } catch (error) {
      console.error('Failed to load vital signs state:', error);
    }
  }

  private async saveState(): Promise<void> {
    try {
      const devicesObj: Record<string, MedicalDevice> = {};
      this.connectedDevices.forEach((value, key) => {
        devicesObj[key] = value;
      });
      await AsyncStorage.setItem('vital_signs_devices', JSON.stringify(devicesObj));
      await AsyncStorage.setItem('vital_signs_alerts', JSON.stringify(this.alerts.slice(-500)));
    } catch (error) {
      console.error('Failed to save vital signs state:', error);
    }
  }

  // ==========================================
  // Device Management
  // ==========================================

  async scanForDevices(protocol?: ConnectionProtocol): Promise<MedicalDevice[]> {
    // Simulate device scanning
    await new Promise(resolve => setTimeout(resolve, 2000));

    const discoveredDevices: MedicalDevice[] = SUPPORTED_DEVICES
      .filter(d => !protocol || d.protocol === protocol)
      .slice(0, 5)
      .map((profile, index) => ({
        id: `device_${Date.now()}_${index}`,
        name: `${profile.manufacturer} ${profile.model}`,
        manufacturer: profile.manufacturer,
        model: profile.model,
        type: profile.type,
        protocol: profile.protocol,
        connectionStatus: 'disconnected' as const,
        supportedVitals: profile.supportedVitals,
      }));

    return discoveredDevices;
  }

  async connectDevice(deviceId: string): Promise<MedicalDevice> {
    const device = this.connectedDevices.get(deviceId);
    if (!device) {
      throw new Error('Device not found');
    }

    device.connectionStatus = 'pairing';
    this.connectedDevices.set(deviceId, device);

    // Simulate connection
    await new Promise(resolve => setTimeout(resolve, 1500));

    device.connectionStatus = 'connected';
    device.batteryLevel = Math.floor(Math.random() * 40) + 60;
    device.lastReading = new Date().toISOString();
    this.connectedDevices.set(deviceId, device);
    await this.saveState();

    return device;
  }

  async disconnectDevice(deviceId: string): Promise<void> {
    const device = this.connectedDevices.get(deviceId);
    if (device) {
      device.connectionStatus = 'disconnected';
      this.connectedDevices.set(deviceId, device);
      await this.saveState();
    }
  }

  async pairDevice(profile: DeviceProfile): Promise<MedicalDevice> {
    const device: MedicalDevice = {
      id: `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `${profile.manufacturer} ${profile.model}`,
      manufacturer: profile.manufacturer,
      model: profile.model,
      type: profile.type,
      protocol: profile.protocol,
      connectionStatus: 'connected',
      batteryLevel: Math.floor(Math.random() * 40) + 60,
      supportedVitals: profile.supportedVitals,
    };

    this.connectedDevices.set(device.id, device);
    await this.saveState();

    return device;
  }

  getConnectedDevices(): MedicalDevice[] {
    return Array.from(this.connectedDevices.values());
  }

  getSupportedDevices(): DeviceProfile[] {
    return SUPPORTED_DEVICES;
  }

  // ==========================================
  // Monitoring Sessions
  // ==========================================

  async startMonitoringSession(
    patientId: string,
    patientName: string,
    mrn: string,
    location: { ward: string; room: string; bed: string },
    deviceIds: string[],
    monitoringLevel: PatientMonitoringSession['monitoringLevel'] = 'routine'
  ): Promise<PatientMonitoringSession> {
    const session: PatientMonitoringSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      patientId,
      patientName,
      mrn,
      ward: location.ward,
      room: location.room,
      bed: location.bed,
      startTime: new Date().toISOString(),
      status: 'active',
      devices: deviceIds,
      alerts: [],
      readings: [],
      monitoringLevel,
    };

    this.activeSessions.set(session.id, session);

    // Start simulated data streaming
    this.startSimulatedStreaming(session.id);

    return session;
  }

  async stopMonitoringSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.status = 'completed';
      session.endTime = new Date().toISOString();
      this.activeSessions.set(sessionId, session);

      // Stop simulation
      const interval = this.simulationIntervals.get(sessionId);
      if (interval) {
        clearInterval(interval);
        this.simulationIntervals.delete(sessionId);
      }
    }
  }

  getActiveSession(sessionId: string): PatientMonitoringSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  getActiveSessions(): PatientMonitoringSession[] {
    return Array.from(this.activeSessions.values()).filter(s => s.status === 'active');
  }

  // ==========================================
  // Real-Time Streaming
  // ==========================================

  subscribeToSession(sessionId: string, callbacks: StreamingCallback): void {
    this.streamingCallbacks.set(sessionId, callbacks);
  }

  unsubscribeFromSession(sessionId: string): void {
    this.streamingCallbacks.delete(sessionId);
  }

  private startSimulatedStreaming(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    // Determine interval based on monitoring level
    const intervalMs = {
      routine: 60000,    // 1 minute
      close: 30000,      // 30 seconds
      continuous: 5000,  // 5 seconds
      critical: 2000,    // 2 seconds
    }[session.monitoringLevel];

    const interval = setInterval(() => {
      this.generateSimulatedReadings(sessionId);
    }, intervalMs);

    this.simulationIntervals.set(sessionId, interval);

    // Generate initial readings
    this.generateSimulatedReadings(sessionId);
  }

  private generateSimulatedReadings(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (!session || session.status !== 'active') return;

    const callbacks = this.streamingCallbacks.get(sessionId);

    // Generate readings for each device
    session.devices.forEach(deviceId => {
      const device = this.connectedDevices.get(deviceId);
      if (!device || device.connectionStatus !== 'connected') return;

      device.supportedVitals.forEach(vitalType => {
        const reading = this.generateReading(session.patientId, deviceId, vitalType);
        session.readings.push(reading);

        // Keep only last 1000 readings per session
        if (session.readings.length > 1000) {
          session.readings = session.readings.slice(-1000);
        }

        // Notify callback
        if (callbacks) {
          callbacks.onReading(reading);
        }

        // Check for alerts
        if (reading.isAbnormal && reading.alertLevel) {
          const alert = this.createAlert(session, reading);
          session.alerts.push(alert);
          this.alerts.push(alert);

          if (callbacks) {
            callbacks.onAlert(alert);
          }
        }
      });

      // Update device last reading
      device.lastReading = new Date().toISOString();
      this.connectedDevices.set(deviceId, device);

      if (callbacks) {
        callbacks.onDeviceStatus(device);
      }
    });

    this.activeSessions.set(sessionId, session);
  }

  private generateReading(patientId: string, deviceId: string, type: VitalSignType): VitalSignReading {
    const range = VITAL_SIGN_RANGES.find(r => r.type === type);
    if (!range) {
      throw new Error(`Unknown vital sign type: ${type}`);
    }

    // Generate realistic value with occasional abnormalities
    const isAbnormal = Math.random() < 0.1; // 10% chance of abnormal
    let value: number;

    if (isAbnormal) {
      // Generate abnormal value
      const direction = Math.random() < 0.5 ? 'low' : 'high';
      if (direction === 'low' && range.warningLow) {
        value = range.warningLow - Math.random() * (range.warningLow - (range.criticalLow || range.warningLow - 10));
      } else if (range.warningHigh) {
        value = range.warningHigh + Math.random() * ((range.criticalHigh || range.warningHigh + 10) - range.warningHigh);
      } else {
        value = range.normalMin + Math.random() * (range.normalMax - range.normalMin);
      }
    } else {
      // Generate normal value
      value = range.normalMin + Math.random() * (range.normalMax - range.normalMin);
    }

    // Round appropriately
    if (type === 'temperature') {
      value = Math.round(value * 10) / 10;
    } else if (type === 'blood_glucose') {
      value = Math.round(value * 10) / 10;
    } else {
      value = Math.round(value);
    }

    const alertLevel = this.determineAlertLevel(value, range);

    return {
      id: `reading_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      patientId,
      deviceId,
      type,
      value,
      unit: range.unit,
      timestamp: new Date().toISOString(),
      quality: 'good',
      isAbnormal: alertLevel !== undefined,
      alertLevel,
    };
  }

  private determineAlertLevel(value: number, range: VitalSignRange): AlertSeverity | undefined {
    if (range.emergencyLow !== undefined && value <= range.emergencyLow) return 'emergency';
    if (range.emergencyHigh !== undefined && value >= range.emergencyHigh) return 'emergency';
    if (range.criticalLow !== undefined && value <= range.criticalLow) return 'critical';
    if (range.criticalHigh !== undefined && value >= range.criticalHigh) return 'critical';
    if (range.warningLow !== undefined && value <= range.warningLow) return 'warning';
    if (range.warningHigh !== undefined && value >= range.warningHigh) return 'warning';
    return undefined;
  }

  private createAlert(session: PatientMonitoringSession, reading: VitalSignReading): VitalSignAlert {
    const range = VITAL_SIGN_RANGES.find(r => r.type === reading.type);
    const threshold = reading.value < (range?.normalMin || 0) 
      ? (range?.normalMin || 0)
      : (range?.normalMax || 100);

    const messages: Record<AlertSeverity, string> = {
      info: `${reading.type.replace(/_/g, ' ')} is slightly outside normal range`,
      warning: `${reading.type.replace(/_/g, ' ')} requires attention`,
      critical: `CRITICAL: ${reading.type.replace(/_/g, ' ')} is at dangerous level`,
      emergency: `EMERGENCY: ${reading.type.replace(/_/g, ' ')} requires immediate intervention`,
    };

    return {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId: session.id,
      patientId: session.patientId,
      type: reading.type,
      severity: reading.alertLevel || 'warning',
      value: reading.value,
      threshold,
      message: messages[reading.alertLevel || 'warning'],
      timestamp: new Date().toISOString(),
      acknowledged: false,
      escalated: reading.alertLevel === 'emergency' || reading.alertLevel === 'critical',
      escalatedTo: reading.alertLevel === 'emergency' ? 'Rapid Response Team' : undefined,
    };
  }

  // ==========================================
  // Alert Management
  // ==========================================

  async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedBy = userId;
      alert.acknowledgedAt = new Date().toISOString();
      await this.saveState();
    }
  }

  getUnacknowledgedAlerts(): VitalSignAlert[] {
    return this.alerts.filter(a => !a.acknowledged);
  }

  getAlertsBySession(sessionId: string): VitalSignAlert[] {
    return this.alerts.filter(a => a.sessionId === sessionId);
  }

  getAlertsByPatient(patientId: string): VitalSignAlert[] {
    return this.alerts.filter(a => a.patientId === patientId);
  }

  // ==========================================
  // Trend Analysis
  // ==========================================

  analyzeTrend(sessionId: string, vitalType: VitalSignType, hours: number = 24): TrendData | null {
    const session = this.activeSessions.get(sessionId);
    if (!session) return null;

    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const readings = session.readings
      .filter(r => r.type === vitalType && r.timestamp >= cutoff)
      .map(r => ({ timestamp: r.timestamp, value: r.value }));

    if (readings.length < 2) return null;

    const values = readings.map(r => r.value);
    const average = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Calculate standard deviation
    const squaredDiffs = values.map(v => Math.pow(v - average, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length;
    const standardDeviation = Math.sqrt(avgSquaredDiff);

    // Determine trend
    let trend: TrendData['trend'] = 'stable';
    if (readings.length >= 3) {
      const firstThird = values.slice(0, Math.floor(values.length / 3));
      const lastThird = values.slice(-Math.floor(values.length / 3));
      const firstAvg = firstThird.reduce((a, b) => a + b, 0) / firstThird.length;
      const lastAvg = lastThird.reduce((a, b) => a + b, 0) / lastThird.length;
      
      const change = ((lastAvg - firstAvg) / firstAvg) * 100;
      if (change > 10) trend = 'increasing';
      else if (change < -10) trend = 'decreasing';
      else if (standardDeviation > average * 0.2) trend = 'fluctuating';
    }

    return {
      type: vitalType,
      readings,
      trend,
      average: Math.round(average * 10) / 10,
      min,
      max,
      standardDeviation: Math.round(standardDeviation * 10) / 10,
    };
  }

  // ==========================================
  // Utility Methods
  // ==========================================

  getVitalSignRanges(): VitalSignRange[] {
    return VITAL_SIGN_RANGES;
  }

  getVitalSignRange(type: VitalSignType): VitalSignRange | undefined {
    return VITAL_SIGN_RANGES.find(r => r.type === type);
  }

  formatVitalSign(type: VitalSignType, value: number): string {
    const range = VITAL_SIGN_RANGES.find(r => r.type === type);
    if (!range) return `${value}`;
    return `${value} ${range.unit}`;
  }

  getStatistics(): {
    connectedDevices: number;
    activeSessions: number;
    totalReadings: number;
    unacknowledgedAlerts: number;
  } {
    let totalReadings = 0;
    this.activeSessions.forEach(session => {
      totalReadings += session.readings.length;
    });

    return {
      connectedDevices: Array.from(this.connectedDevices.values()).filter(d => d.connectionStatus === 'connected').length,
      activeSessions: this.getActiveSessions().length,
      totalReadings,
      unacknowledgedAlerts: this.getUnacknowledgedAlerts().length,
    };
  }
}

export const vitalSignsMonitoring = new VitalSignsMonitoringService();
