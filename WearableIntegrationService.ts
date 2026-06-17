/**
 * Wearable Device Integration Service
 * Apple HealthKit, Google Fit, and smartwatch integration
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// TYPES & INTERFACES
// ============================================

export type WearableProvider = 'apple_health' | 'google_fit' | 'samsung_health' | 'fitbit' | 'garmin';
export type MetricType = 'heart_rate' | 'steps' | 'calories' | 'sleep' | 'blood_oxygen' | 'ecg' | 'blood_pressure' | 'weight' | 'temperature' | 'respiratory_rate';

export interface WearableConnection {
  id: string;
  provider: WearableProvider;
  deviceName: string;
  deviceModel: string;
  connectedAt: number;
  lastSyncAt: number;
  status: 'connected' | 'disconnected' | 'syncing' | 'error';
  batteryLevel?: number;
  permissions: MetricType[];
}

export interface HealthMetric {
  id: string;
  patientId: string;
  type: MetricType;
  value: number;
  unit: string;
  timestamp: number;
  source: WearableProvider;
  deviceId: string;
  isAbnormal: boolean;
  trend?: 'rising' | 'falling' | 'stable';
}

export interface HeartRateData {
  current: number;
  resting: number;
  max: number;
  min: number;
  average: number;
  variability: number;
  zones: { zone: string; minutes: number; color: string }[];
}

export interface SleepData {
  totalHours: number;
  deepSleep: number;
  lightSleep: number;
  remSleep: number;
  awakeTime: number;
  sleepScore: number;
  bedtime: string;
  wakeTime: string;
  interruptions: number;
}

export interface ActivityData {
  steps: number;
  stepsGoal: number;
  distance: number;
  distanceUnit: string;
  calories: number;
  caloriesGoal: number;
  activeMinutes: number;
  activeMinutesGoal: number;
  floors: number;
  standHours: number;
}

export interface VitalsSnapshot {
  patientId: string;
  timestamp: number;
  heartRate: HeartRateData;
  sleep: SleepData;
  activity: ActivityData;
  bloodOxygen: number;
  temperature: number;
  respiratoryRate: number;
  bloodPressure: { systolic: number; diastolic: number };
  overallScore: number;
  alerts: VitalsAlert[];
}

export interface VitalsAlert {
  id: string;
  type: MetricType;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: number;
}

// ============================================
// STORAGE & STATE
// ============================================

const STORAGE_KEYS = {
  CONNECTIONS: 'wearable_connections',
  METRICS: 'wearable_metrics',
  SETTINGS: 'wearable_settings',
};

let connections: Map<string, WearableConnection> = new Map();
let metrics: Map<string, HealthMetric[]> = new Map();
let listeners: Set<() => void> = new Set();

const generateId = (): string => `WRB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
const notifyListeners = (): void => listeners.forEach(l => l());

// ============================================
// THRESHOLDS & CONFIGURATION
// ============================================

const METRIC_THRESHOLDS: Record<MetricType, { low: number; high: number; critical_low: number; critical_high: number }> = {
  heart_rate: { low: 50, high: 100, critical_low: 40, critical_high: 150 },
  blood_oxygen: { low: 95, high: 100, critical_low: 90, critical_high: 100 },
  temperature: { low: 36.1, high: 37.2, critical_low: 35, critical_high: 39 },
  respiratory_rate: { low: 12, high: 20, critical_low: 8, critical_high: 30 },
  blood_pressure: { low: 90, high: 120, critical_low: 70, critical_high: 180 },
  steps: { low: 0, high: 10000, critical_low: 0, critical_high: 50000 },
  calories: { low: 0, high: 2500, critical_low: 0, critical_high: 5000 },
  sleep: { low: 6, high: 9, critical_low: 4, critical_high: 12 },
  ecg: { low: 60, high: 100, critical_low: 40, critical_high: 150 },
  weight: { low: 40, high: 150, critical_low: 30, critical_high: 200 },
};

const PROVIDER_INFO: Record<WearableProvider, { name: string; icon: string; color: string }> = {
  apple_health: { name: 'Apple Health', icon: '🍎', color: '#FF2D55' },
  google_fit: { name: 'Google Fit', icon: '💚', color: '#4285F4' },
  samsung_health: { name: 'Samsung Health', icon: '💙', color: '#1428A0' },
  fitbit: { name: 'Fitbit', icon: '⌚', color: '#00B0B9' },
  garmin: { name: 'Garmin', icon: '🏃', color: '#007CC3' },
};

// ============================================
// INITIALIZATION
// ============================================

export const initializeWearableService = async (): Promise<void> => {
  try {
    const storedConnections = await AsyncStorage.getItem(STORAGE_KEYS.CONNECTIONS);
    if (storedConnections) {
      connections = new Map(Object.entries(JSON.parse(storedConnections)));
    }
    const storedMetrics = await AsyncStorage.getItem(STORAGE_KEYS.METRICS);
    if (storedMetrics) {
      metrics = new Map(Object.entries(JSON.parse(storedMetrics)));
    }
  } catch (error) {
    console.error('Failed to initialize wearable service:', error);
  }
};

const saveState = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.CONNECTIONS, JSON.stringify(Object.fromEntries(connections)));
    await AsyncStorage.setItem(STORAGE_KEYS.METRICS, JSON.stringify(Object.fromEntries(metrics)));
  } catch (error) {
    console.error('Failed to save wearable state:', error);
  }
};

export const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

// ============================================
// CONNECTION MANAGEMENT
// ============================================

export const connectDevice = async (
  provider: WearableProvider,
  deviceName: string,
  deviceModel: string,
  permissions: MetricType[]
): Promise<WearableConnection> => {
  const connection: WearableConnection = {
    id: generateId(),
    provider,
    deviceName,
    deviceModel,
    connectedAt: Date.now(),
    lastSyncAt: Date.now(),
    status: 'connected',
    batteryLevel: 85 + Math.floor(Math.random() * 15),
    permissions,
  };

  connections.set(connection.id, connection);
  await saveState();
  notifyListeners();
  return connection;
};

export const disconnectDevice = async (connectionId: string): Promise<boolean> => {
  const deleted = connections.delete(connectionId);
  if (deleted) {
    await saveState();
    notifyListeners();
  }
  return deleted;
};

export const getConnections = (): WearableConnection[] => {
  return Array.from(connections.values());
};

export const getConnection = (connectionId: string): WearableConnection | undefined => {
  return connections.get(connectionId);
};

// ============================================
// DATA SYNC
// ============================================

export const syncDevice = async (connectionId: string): Promise<HealthMetric[]> => {
  const connection = connections.get(connectionId);
  if (!connection) throw new Error('Device not found');

  connection.status = 'syncing';
  notifyListeners();

  // Simulate sync delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  const newMetrics: HealthMetric[] = [];
  const patientId = 'PAT-001'; // Would come from context

  connection.permissions.forEach(type => {
    const metric = generateMetricData(patientId, type, connection.provider, connectionId);
    newMetrics.push(metric);
  });

  // Store metrics
  const patientMetrics = metrics.get(patientId) || [];
  patientMetrics.push(...newMetrics);
  metrics.set(patientId, patientMetrics.slice(-500)); // Keep last 500

  connection.status = 'connected';
  connection.lastSyncAt = Date.now();
  await saveState();
  notifyListeners();

  return newMetrics;
};

const generateMetricData = (
  patientId: string,
  type: MetricType,
  source: WearableProvider,
  deviceId: string
): HealthMetric => {
  const units: Record<MetricType, string> = {
    heart_rate: 'bpm',
    steps: 'steps',
    calories: 'kcal',
    sleep: 'hours',
    blood_oxygen: '%',
    ecg: 'bpm',
    blood_pressure: 'mmHg',
    weight: 'kg',
    temperature: '°C',
    respiratory_rate: 'breaths/min',
  };

  const ranges: Record<MetricType, [number, number]> = {
    heart_rate: [60, 100],
    steps: [2000, 12000],
    calories: [1500, 3000],
    sleep: [5, 9],
    blood_oxygen: [94, 100],
    ecg: [60, 100],
    blood_pressure: [100, 140],
    weight: [60, 90],
    temperature: [36.2, 37.5],
    respiratory_rate: [12, 20],
  };

  const [min, max] = ranges[type];
  const value = Math.round((min + Math.random() * (max - min)) * 10) / 10;
  const threshold = METRIC_THRESHOLDS[type];
  const isAbnormal = value < threshold.low || value > threshold.high;

  return {
    id: generateId(),
    patientId,
    type,
    value,
    unit: units[type],
    timestamp: Date.now(),
    source,
    deviceId,
    isAbnormal,
    trend: Math.random() > 0.5 ? 'stable' : Math.random() > 0.5 ? 'rising' : 'falling',
  };
};

// ============================================
// VITALS SNAPSHOT
// ============================================

export const getVitalsSnapshot = (patientId: string): VitalsSnapshot => {
  const patientMetrics = metrics.get(patientId) || [];
  const now = Date.now();

  // Generate comprehensive snapshot
  const heartRate: HeartRateData = {
    current: 72 + Math.floor(Math.random() * 20),
    resting: 58 + Math.floor(Math.random() * 10),
    max: 145 + Math.floor(Math.random() * 30),
    min: 52 + Math.floor(Math.random() * 8),
    average: 75 + Math.floor(Math.random() * 10),
    variability: 35 + Math.floor(Math.random() * 20),
    zones: [
      { zone: 'Rest', minutes: 480, color: '#39FF14' },
      { zone: 'Fat Burn', minutes: 45, color: '#FFFF00' },
      { zone: 'Cardio', minutes: 25, color: '#FF6600' },
      { zone: 'Peak', minutes: 10, color: '#FF1493' },
    ],
  };

  const sleep: SleepData = {
    totalHours: 6.5 + Math.random() * 2,
    deepSleep: 1.2 + Math.random() * 0.8,
    lightSleep: 3 + Math.random() * 1,
    remSleep: 1.5 + Math.random() * 0.5,
    awakeTime: 0.3 + Math.random() * 0.4,
    sleepScore: 70 + Math.floor(Math.random() * 25),
    bedtime: '22:30',
    wakeTime: '06:45',
    interruptions: Math.floor(Math.random() * 4),
  };

  const activity: ActivityData = {
    steps: 4500 + Math.floor(Math.random() * 6000),
    stepsGoal: 10000,
    distance: 3.2 + Math.random() * 4,
    distanceUnit: 'km',
    calories: 1800 + Math.floor(Math.random() * 800),
    caloriesGoal: 2500,
    activeMinutes: 30 + Math.floor(Math.random() * 60),
    activeMinutesGoal: 60,
    floors: 5 + Math.floor(Math.random() * 15),
    standHours: 8 + Math.floor(Math.random() * 6),
  };

  const alerts: VitalsAlert[] = [];
  
  // Check for abnormal values
  const bloodOxygen = 95 + Math.random() * 5;
  if (bloodOxygen < 95) {
    alerts.push({
      id: generateId(),
      type: 'blood_oxygen',
      severity: bloodOxygen < 90 ? 'critical' : 'warning',
      message: `Low blood oxygen: ${bloodOxygen.toFixed(1)}%`,
      value: bloodOxygen,
      threshold: 95,
      timestamp: now,
    });
  }

  return {
    patientId,
    timestamp: now,
    heartRate,
    sleep,
    activity,
    bloodOxygen: Math.round(bloodOxygen * 10) / 10,
    temperature: Math.round((36.5 + Math.random() * 0.8) * 10) / 10,
    respiratoryRate: 14 + Math.floor(Math.random() * 6),
    bloodPressure: {
      systolic: 110 + Math.floor(Math.random() * 30),
      diastolic: 70 + Math.floor(Math.random() * 15),
    },
    overallScore: 75 + Math.floor(Math.random() * 20),
    alerts,
  };
};

// ============================================
// HEALTH TRENDS
// ============================================

export const getMetricHistory = (
  patientId: string,
  type: MetricType,
  days: number = 7
): HealthMetric[] => {
  const patientMetrics = metrics.get(patientId) || [];
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return patientMetrics
    .filter(m => m.type === type && m.timestamp >= cutoff)
    .sort((a, b) => a.timestamp - b.timestamp);
};

export const getHealthScore = (patientId: string): number => {
  const snapshot = getVitalsSnapshot(patientId);
  return snapshot.overallScore;
};

// ============================================
// PROVIDER INFO
// ============================================

export const getProviderInfo = (provider: WearableProvider) => {
  return PROVIDER_INFO[provider];
};

export const getAllProviders = () => {
  return Object.entries(PROVIDER_INFO).map(([key, value]) => ({
    id: key as WearableProvider,
    ...value,
  }));
};

// ============================================
// EXPORT SERVICE
// ============================================

export const wearableIntegrationService = {
  initialize: initializeWearableService,
  subscribe,
  connectDevice,
  disconnectDevice,
  getConnections,
  getConnection,
  syncDevice,
  getVitalsSnapshot,
  getMetricHistory,
  getHealthScore,
  getProviderInfo,
  getAllProviders,
};

export default wearableIntegrationService;
